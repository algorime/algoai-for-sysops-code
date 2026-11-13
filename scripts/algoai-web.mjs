#!/usr/bin/env node
// Serves this fork's web build in front of an existing T3 Code server, proxying its routes.
// HTTPS with --tls-cert/--tls-key; --redirect-http redirects plain HTTP on the same port.
// --downloads serves a folder at /downloads/, over HTTP too (phones fetch the CA cert there).
//   node scripts/algoai-web.mjs --listen 100.100.0.12:3780 --backend 100.100.0.12:3773
import * as NodeFS from "node:fs";
import * as NodeHttp from "node:http";
import * as NodeHttps from "node:https";
import * as NodeNet from "node:net";
import * as NodePath from "node:path";
import * as NodeUtil from "node:util";

const { values } = NodeUtil.parseArgs({
  options: {
    listen: { type: "string", default: "100.100.0.12:3780" },
    backend: { type: "string", default: "100.100.0.12:3773" },
    dist: { type: "string", default: NodePath.join(import.meta.dirname, "../apps/web/dist") },
    "tls-cert": { type: "string" },
    "tls-key": { type: "string" },
    "redirect-http": { type: "boolean", default: false },
    downloads: { type: "string" },
  },
});

const splitHostPort = (value) => {
  const index = value.lastIndexOf(":");
  return { host: value.slice(0, index), port: Number(value.slice(index + 1)) };
};
const listen = splitHostPort(values.listen);
const backend = splitHostPort(values.backend);
const distRoot = NodePath.resolve(values.dist);
const downloadsRoot = values.downloads === undefined ? null : NodePath.resolve(values.downloads);

// Same lists as packages/shared/src/devProxy.ts, which Vite uses for single-origin dev.
const PROXIED_PREFIXES = ["/api", "/oauth", "/.well-known", "/ws", "/mcp"];
const ORIGIN_PRESERVING_PREFIXES = new Set(["/oauth", "/.well-known", "/mcp", "/ws"]);

const proxiedPrefix = (pathname) =>
  PROXIED_PREFIXES.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const backendHeaders = (req, prefix) =>
  ORIGIN_PRESERVING_PREFIXES.has(prefix)
    ? req.headers
    : { ...req.headers, host: `${backend.host}:${backend.port}` };

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".apk": "application/vnd.android.package-archive",
  ".crt": "application/x-x509-ca-cert",
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// /downloads/ lists the folder; a file is sent as an attachment, never the SPA shell.
function serveDownload(req, res, pathname) {
  const name = decodeURIComponent(pathname.slice("/downloads/".length));
  if (name === "") {
    const files = NodeFS.existsSync(downloadsRoot)
      ? NodeFS.readdirSync(downloadsRoot)
          .filter((file) => !file.startsWith("."))
          .sort()
      : [];
    const items = files
      .map((file) => `<li><a href="${encodeURIComponent(file)}">${escapeHtml(file)}</a></li>`)
      .join("");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    return res.end(
      `<!doctype html><meta name="viewport" content="width=device-width"><title>AlgoAI for SysOps downloads</title><h1>AlgoAI for SysOps downloads</h1><ul>${items}</ul>`,
    );
  }
  const filePath = NodePath.join(downloadsRoot, name);
  if (
    name.includes("/") ||
    !filePath.startsWith(downloadsRoot + NodePath.sep) ||
    !NodeFS.existsSync(filePath) ||
    !NodeFS.statSync(filePath).isFile()
  ) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Not found\n");
  }
  res.writeHead(200, {
    "content-type": CONTENT_TYPES[NodePath.extname(filePath)] ?? "application/octet-stream",
    "content-length": NodeFS.statSync(filePath).size,
    "content-disposition": `attachment; filename="${NodePath.basename(NodeFS.realpathSync(filePath))}"`,
    "cache-control": "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  NodeFS.createReadStream(filePath).pipe(res);
}

const isDownload = (pathname) =>
  downloadsRoot !== null && (pathname === "/downloads" || pathname.startsWith("/downloads/"));

function serveStatic(req, res, pathname) {
  let filePath = NodePath.join(distRoot, decodeURIComponent(pathname));
  if (
    !filePath.startsWith(distRoot + NodePath.sep) ||
    !NodeFS.existsSync(filePath) ||
    NodeFS.statSync(filePath).isDirectory()
  ) {
    // Client-side routes all render the SPA shell.
    filePath = NodePath.join(distRoot, "index.html");
  }
  const isHashedAsset = pathname.startsWith("/assets/");
  res.writeHead(200, {
    "content-type": CONTENT_TYPES[NodePath.extname(filePath)] ?? "application/octet-stream",
    "cache-control": isHashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  NodeFS.createReadStream(filePath).pipe(res);
}

if ((values["tls-cert"] === undefined) !== (values["tls-key"] === undefined)) {
  throw new Error("--tls-cert and --tls-key must be given together.");
}
const tls =
  values["tls-cert"] === undefined
    ? null
    : {
        cert: NodeFS.readFileSync(values["tls-cert"]),
        key: NodeFS.readFileSync(values["tls-key"]),
      };

function handleRequest(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");
  if (isDownload(pathname)) {
    if (pathname === "/downloads") {
      res.writeHead(308, { location: "/downloads/" });
      return res.end();
    }
    return serveDownload(req, res, pathname);
  }
  const prefix = proxiedPrefix(pathname);
  if (!prefix) return serveStatic(req, res, pathname);

  const upstream = NodeHttp.request(
    {
      host: backend.host,
      port: backend.port,
      method: req.method,
      path: req.url,
      headers: backendHeaders(req, prefix),
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });
  req.pipe(upstream);
}

function handleUpgrade(req, socket, head) {
  const { pathname } = new URL(req.url, "http://localhost");
  const prefix = proxiedPrefix(pathname);
  if (!prefix) return socket.destroy();

  const upstream = NodeNet.connect(backend.port, backend.host, () => {
    const headers = backendHeaders(req, prefix);
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (const [name, value] of Object.entries(headers)) {
      for (const item of Array.isArray(value) ? value : [value]) lines.push(`${name}: ${item}`);
    }
    upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head.length > 0) upstream.write(head);
    upstream.pipe(socket).pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
}

const httpsServer =
  tls === null ? null : NodeHttps.createServer(tls, handleRequest).on("upgrade", handleUpgrade);
// Browsers keep settings per origin, so plain HTTP only points at the HTTPS one.
const httpServer =
  httpsServer === null
    ? NodeHttp.createServer(handleRequest).on("upgrade", handleUpgrade)
    : NodeHttp.createServer((req, res) => {
        if (isDownload(new URL(req.url, "http://localhost").pathname))
          return handleRequest(req, res);
        const host = req.headers.host ?? `${listen.host}:${listen.port}`;
        res.writeHead(308, { location: `https://${host}${req.url}` });
        res.end();
      }).on("upgrade", (_req, socket) => socket.destroy());

// Every TLS connection opens with a handshake record (0x16), so one port can take both.
function acceptHttpAndHttps(socket) {
  socket.once("data", (chunk) => {
    socket.pause();
    socket.unshift(chunk);
    (chunk[0] === 0x16 ? httpsServer : httpServer).emit("connection", socket);
    process.nextTick(() => socket.resume());
  });
  socket.on("error", () => socket.destroy());
}

const server =
  httpsServer === null
    ? httpServer
    : values["redirect-http"]
      ? NodeNet.createServer(acceptHttpAndHttps)
      : httpsServer;

server.listen(listen.port, listen.host, () => {
  console.log(
    `AlgoAI web on ${httpsServer === null ? "http" : "https"}://${listen.host}:${listen.port}${server === httpsServer || httpsServer === null ? "" : " (http redirected)"} -> T3 server ${backend.host}:${backend.port}`,
  );
});
