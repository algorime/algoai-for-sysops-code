# AlgoAI for SysOps: changes to T3 Code

This repo is Algorime's fork of [pingdotgg/t3code](https://github.com/pingdotgg/t3code), used as **AlgoAI for SysOps**. This file lists every change the fork makes to upstream, with the reason for each, so the changes can be reviewed and re-applied when upstream moves. Decisions and open work live in the project's vault, [algorime/algoai-for-sysops](https://github.com/algorime/algoai-for-sysops).

T3 Code is © T3 Tools Inc. and MIT-licensed (see [LICENSE](LICENSE)); this fork keeps that notice. Nothing from this fork is ever pushed to upstream: `upstream` is fetch-only.

## How the fork is organised

The rules are in the vault's ADR [Customisations are a patch series on upstream tags](https://github.com/algorime/algoai-for-sysops/blob/main/docs/adr/0001-customisations-are-a-patch-series-on-upstream-tags.md). In short:

- `algoai/v<version>` is upstream tag `v<version>` plus our commits, one branch per T3 server version. The branch matching the server is the one built and served.
- `main` is upstream `main` plus the same commits, kept as an early warning of conflicts.
- Each customisation is one small commit titled `algoai: <what>`, which also updates this file.
- Each deployed build is tagged `algoai-v<version>-<n>`.

List our commits and the full difference from upstream:

```bash
git log --oneline v0.1.7..algoai/v0.1.7
git diff v0.1.7 algoai/v0.1.7
```

## Deployment

The branded web client is served on `algodev01` at `http://100.100.0.12:3780` by the systemd user service `algoai-web.service`, in front of the existing T3 Code server on `100.100.0.12:3773`. It works on that server's projects, threads, providers and environments. The server itself is the official T3 Code build and is not built from this repo.

| Deploy tag        | Branch          | Upstream base | Notes                |
| ----------------- | --------------- | ------------- | -------------------- |
| `algoai-v0.1.7-1` | `algoai/v0.1.7` | `v0.1.7`      | first branded client |

## Changes

### 1. Algorime branding in the web app

- **What:** the app is named "AlgoAI for SysOps". The Algorime fan mark replaces the T3 wordmark in the sidebar header and on standalone pages, with the text "AlgoAI for SysOps". The favicons, the splash logo and the web manifest use the Algorime icon.
- **Why:** the fork is presented as Algorime's product. Upstream's names and logos are T3 Tools' trademarks, which the MIT license does not cover, so the fork does not present itself as T3 Code.
- **Files:**
  - new: `apps/web/src/components/AlgorimeMark.tsx`, `assets/algorime/algorime-mark-64.png` (64 px, generated from the 512 px Algorime icon kept in the vault's `sources/`)
  - changed: `apps/web/src/components/sidebar/SidebarChrome.tsx` (`SidebarBrand`, `SidebarBrandMark`), `apps/web/src/components/ui/standalone-page.tsx` (`StandalonePageHeader`), `apps/web/src/branding.ts` (`APP_BASE_NAME`), `apps/web/index.html` (title, splash labels), `apps/web/public/manifest.webmanifest` (name, short name)
  - replaced images: `apps/web/public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`; on `main` also `icon-192x192.png` and `icon-512x512.png`, which `v0.1.7` does not have
- **Commits:** `1d7983d531` on `algoai/v0.1.7`, `15b43201c7` on `main`.
- **Not covered yet:** about 40 UI messages still say "T3 Code" and the T3 wordmark remains as a glyph in some chat rows ([algorime/algoai-for-sysops#4](https://github.com/algorime/algoai-for-sysops/issues/4)). Production and desktop builds would still swap the T3 icons back in through `scripts/apply-web-brand-assets.ts`; only the web build is branded.

### 2. Web front for an existing T3 server

- **What:** `scripts/algoai-web.mjs`, a small Node server that serves `apps/web/dist` and proxies `/api`, `/ws`, `/oauth`, `/.well-known` and `/mcp` (the same prefixes as `packages/shared/src/devProxy.ts`) to an existing T3 server. Run: `node scripts/algoai-web.mjs --listen 100.100.0.12:3780 --backend 100.100.0.12:3773`.
- **Why:** the branded client must work on the same server, data and providers as the official clients, without running a second server or changing the official one.
- **Files:** new: `scripts/algoai-web.mjs`; changed: `knip.jsonc` (one entry under `scripts`, so knip knows the script is run by the service).
- **Commits:** `7a1123ab82` on `algoai/v0.1.7`, `63aa151874` on `main`.

### 3. This file

- **What:** `ALGOAI.md`, the list of changes.
- **Files:** new: `ALGOAI.md`.
