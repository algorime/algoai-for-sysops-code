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

| Deploy tag        | Branch          | Upstream base | Notes                                                                     |
| ----------------- | --------------- | ------------- | ------------------------------------------------------------------------- |
| `algoai-v0.1.7-1` | `algoai/v0.1.7` | `v0.1.7`      | first branded client                                                      |
| `algoai-v0.1.7-2` | `algoai/v0.1.7` | `v0.1.7`      | T3 Code's MIT notice and origin row in Settings → Legal                   |
| `algoai-v0.1.7-3` | `algoai/v0.1.7` | `v0.1.7`      | Based on T3 Code description within 200 characters (upstream lint rule)   |
| `algoai-v0.1.7-4` | `algoai/v0.1.7` | `v0.1.7`      | welcome screen on every page load                                         |
| `algoai-v0.1.7-5` | `algoai/v0.1.7` | `v0.1.7`      | new Built By Algorime logo and welcome subtitle                           |
| `algoai-v0.1.7-6` | `algoai/v0.1.7` | `v0.1.7`      | logo on dark blue, border around the welcome screen                       |
| `algoai-v0.1.7-7` | `algoai/v0.1.7` | `v0.1.7`      | app's own messages say AlgoAI for SysOps; no upstream star or issue links |

## Changes

### 1. Algorime branding in the web app

- **What:** the app is named "AlgoAI for SysOps". The Algorime fan mark replaces the T3 wordmark in the sidebar header and on standalone pages, with the text "AlgoAI for SysOps". The favicons, the splash logo and the web manifest use the Algorime icon.
- **Why:** the fork is presented as Algorime's product. Upstream's names and logos are T3 Tools' trademarks, which the MIT license does not cover, so the fork does not present itself as T3 Code.
- **Files:**
  - new: `apps/web/src/components/AlgorimeMark.tsx`, `assets/algorime/algorime-mark-64.png` (64 px, generated from the 512 px Algorime icon kept in the vault's `sources/`)
  - changed: `apps/web/src/components/sidebar/SidebarChrome.tsx` (`SidebarBrand`, `SidebarBrandMark`), `apps/web/src/components/ui/standalone-page.tsx` (`StandalonePageHeader`), `apps/web/src/branding.ts` (`APP_BASE_NAME`), `apps/web/index.html` (title, splash labels), `apps/web/public/manifest.webmanifest` (name, short name)
  - replaced images: `apps/web/public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`; on `main` also `icon-192x192.png` and `icon-512x512.png`, which `v0.1.7` does not have
- **Commits:** `1d7983d531` on `algoai/v0.1.7`, `15b43201c7` on `main`.
- **Not covered:** production and desktop builds would still swap the T3 icons back in through `scripts/apply-web-brand-assets.ts`; only the web build is branded. The remaining names are handled by change 5.

### 2. Web front for an existing T3 server

- **What:** `scripts/algoai-web.mjs`, a small Node server that serves `apps/web/dist` and proxies `/api`, `/ws`, `/oauth`, `/.well-known` and `/mcp` (the same prefixes as `packages/shared/src/devProxy.ts`) to an existing T3 server. Run: `node scripts/algoai-web.mjs --listen 100.100.0.12:3780 --backend 100.100.0.12:3773`.
- **Why:** the branded client must work on the same server, data and providers as the official clients, without running a second server or changing the official one.
- **Files:** new: `scripts/algoai-web.mjs`; changed: `knip.jsonc` (one entry under `scripts`, so knip knows the script is run by the service).
- **Commits:** `7a1123ab82` on `algoai/v0.1.7`, `63aa151874` on `main`.

### 3. T3 Code's MIT notice and origin in Settings → Legal

- **What:** T3 Code's own license notice (from `LICENSE`) is added to the in-app list under Settings → Legal → Open source licenses. A new row "Based on T3 Code" in the same Legal section says the app is Algorime's modified version of T3 Code by T3 Tools Inc., used under the MIT License and not an official T3 Code release, with a link to the upstream repo. The row is findable in settings search.
- **Why:** MIT requires T3 Tools' copyright and permission notice in every copy, and upstream's build lists only third-party notices. The row states the origin plainly, so nobody takes the app for an official T3 product. Answers [algorime/algoai-for-sysops#3](https://github.com/algorime/algoai-for-sysops/issues/3).
- **Files:**
  - new: `apps/web/src/components/settings/BasedOnT3CodeSettingsRow.tsx`
  - changed: `third-party-licenses.config.json` (one `customNotices` entry), `apps/web/src/components/settings/settingsSearch.ts` (one search entry), `apps/web/src/components/settings/SettingsPanels.tsx` (import and one row in the Legal section)

### 4. Welcome screen on every page load

- **What:** when the app finishes loading, a welcome screen opens over it: the "Built By Algorime" logo on a dark blue (`#13294B`) background, linked to https://www.algorime.it, the title "AlgoAI for SysOps and DevOps" and the line "The Algorime AI environment for SysOps and DevOps activities that will change your project and development strategy. Enjoy it!". The screen has a 2 px dark blue border. It stays until the user presses Close; Escape and clicks outside do nothing. It shows again on each page load or reload, not when moving around inside the app.
- **Why:** presents the product and Algorime every time the client is opened.
- **Files:**
  - new: `apps/web/src/components/AlgoAiWelcomeSplash.tsx`, `assets/algorime/built-by-algorime-dark-blue.png` (996x397, the transparent "Built By Algorime" logo provided by Algorime on a rounded `#13294B` background; both versions are kept in the vault's `sources/`)
  - changed: `apps/web/src/routes/__root.tsx` (import and one line next to `ConfirmDialogHost`)

### 5. The app's own messages use the new name

- **What:** UI text in which the app speaks of itself says "AlgoAI for SysOps" instead of "T3 Code": the author name on system messages in the chat ("Sent by …"), the onboarding header (on `main`, where upstream replaced the wizard with `WelcomePage.tsx`, its "Welcome to …" title), error messages ("… could not open a new thread", "… failed to start"), and settings text (opening pull requests in the app, Codex management, provider status, keybindings, notifications, licenses). The browser client's label in the server's Connections list is "AlgoAI for SysOps Web". The T3 wordmark in chat rows and onboarding is replaced by the Algorime mark, and `T3Wordmark.tsx` is deleted. The prompt asking to star pingdotgg/t3code on GitHub is never shown, and the start-failure page files issues in [algorime/algoai-for-sysops](https://github.com/algorime/algoai-for-sysops/issues) (the fork's own repo has issues turned off).
- **Kept as "T3 Code":** text about T3's own products and services, which this fork uses as they are: the T3 Code server and its versions and updates, the desktop app and its desktop-only features, T3 Connect and the relay, the mobile app, the `t3` CLI, the T3 Code GitHub app, the privacy note on T3 Code's usage data, T3's triage agent (it investigates the official server and files issues upstream). Code comments and console messages are also kept.
- **Why:** the fork must not present itself as T3 Code, whose name is T3 Tools' trademark and not covered by MIT, while factual references to T3's products stay accurate. Answers [algorime/algoai-for-sysops#4](https://github.com/algorime/algoai-for-sysops/issues/4).
- **Files:** one-line text changes in about 25 files under `apps/web/src` (chat rows, onboarding, settings, prompt links, `lib/bootError.ts`, `connection/clientMetadata.ts`, `desktopAppActivation.ts`, `hooks/useStartTriage.ts`), the mark swap in `components/chat/TimelineToolActivityIcon.tsx`, `components/chat/V2LifecycleRow.tsx` and `components/onboarding/WelcomeWizard.tsx`, the removed star prompt call in `components/chat/useComposerSend.ts`, deleted `components/T3Wordmark.tsx`, and the expected text in `components/chat/QueuedRunsControl.browser.test.tsx`.

### 6. This file

- **What:** `ALGOAI.md`, the list of changes.
- **Files:** new: `ALGOAI.md`.
