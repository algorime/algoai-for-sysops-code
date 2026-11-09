#!/usr/bin/env node
// Serves this fork's web build in front of an existing T3 Code server: static files come
// from apps/web/dist, backend routes are proxied to the server, so the branded client
// works on the server's own projects, threads, providers and environments.
//
//   node scripts/algoai-web.mjs --listen 100.100.0.12:3780 --backend 100.100.0.12:3773
import * as fs from "node:fs";
import * as http from "node:http";
import * as net from "node:net";
import * as path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    listen: { type: "string", default: "100.100.0.12:3780" },
    backend: { type: "string", default: "100.100.0.12:3773" },
    dist: { type: "string", default: path.join(import.meta.dirname, "../apps/web/dist") },
  },
});

const splitHostPort = (value) => {
  const index = value.lastIndexOf(":");
  return { host: value.slice(0, index), port: Number(value.slice(index + 1)) };
};
const listen = splitHostPort(values.listen);
const backend = splitHostPort(values.backend);
const distRoot = path.resolve(values.dist);

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
};

function serveStatic(req, res, pathname) {
  let filePath = path.join(distRoot, decodeURIComponent(pathname));
  if (
    !filePath.startsWith(distRoot + path.sep) ||
    !fs.existsSync(filePath) ||
    fs.statSync(filePath).isDirectory()
  ) {
    // Client-side routes all render the SPA shell.
    filePath = path.join(distRoot, "index.html");
  }
  const isHashedAsset = pathname.startsWith("/assets/");
  res.writeHead(200, {
    "content-type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
    "cache-control": isHashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const prefix = proxiedPrefix(pathname);
  if (!prefix) return serveStatic(req, res, pathname);

  const upstream = http.request(
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
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const prefix = proxiedPrefix(pathname);
  if (!prefix) return socket.destroy();

  const upstream = net.connect(backend.port, backend.host, () => {
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
});

server.listen(listen.port, listen.host, () => {
  console.log(
    `AlgoAI web on http://${listen.host}:${listen.port} -> T3 server ${backend.host}:${backend.port}`,
  );
});
