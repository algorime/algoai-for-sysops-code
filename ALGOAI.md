# AlgoAI for SysOps: changes to T3 Code

This repo is Algorime's fork of [pingdotgg/t3code](https://github.com/pingdotgg/t3code), used as **AlgoAI for SysOps**. This file lists every change the fork makes to upstream, with the reason for each, so the changes can be reviewed and re-applied when upstream moves. Decisions and open work live in the project's vault, [algorime/algoai-for-sysops](https://github.com/algorime/algoai-for-sysops).

T3 Code is © T3 Tools Inc. and MIT-licensed (see [LICENSE](LICENSE)); this fork keeps that notice. Nothing from this fork is ever pushed to upstream: `upstream` is fetch-only.

## How the fork is organised

The rules are in the vault's ADR [Customisations are a patch series on upstream tags](https://github.com/algorime/algoai-for-sysops/blob/main/docs/adr/0001-customisations-are-a-patch-series-on-upstream-tags.md). In short:

- `algoai/v<version>` is upstream tag `v<version>` plus our commits, one branch per T3 server version. The branch matching the server is the one built and served.
- `main` is upstream `main` plus the same commits, kept as an early warning of conflicts.
- Each customisation is one small commit titled `algoai: <what>`, which also updates this file.
- Each deployed build is tagged `algoai-v<version>-<n>`.

List our commits and the full difference from upstream (commit hashes differ on each branch, so this is where to find a change's commit):

```bash
git log --oneline v0.1.9..algoai/v0.1.9
git diff v0.1.9 algoai/v0.1.9
```

## Updating to a new server version

The T3 server updates itself; the client must follow, because its build must match the server's version. `scripts/algoai-update.sh` (change 8) does it:

1. It reads the server's version from `~/.t3/runtime/service-state.json` and the client's from the `algoai-for-sysops-code-current` symlink next to the clone, which points at the served worktree `algoai-for-sysops-code-v<version>`.
2. It fetches upstream's tags, makes `algoai/v<new>` from tag `v<new>` in a new worktree and cherry-picks our commits from `algoai/v<old>`. Where upstream changed the same lines, git reuses a resolution recorded earlier (`rerere`, often recorded on `main`); otherwise the script stops, and the old client keeps running.
3. After a stop, resolve the conflict in the new worktree (keep upstream's change, re-apply ours) and run the script again: it resumes on the existing branch.
4. It installs, builds, points the symlink at the new worktree, restarts `algoai-web.service`, checks that the new build is served (or switches back) and tags it `algoai-v<new>-1`.

Then, by hand:

- Run `npm run -s check:changed -- v<new>` in the new worktree, and review the commits where a resolution was reused: the script names them.
- Look for new upstream text in which the app calls itself "T3 Code", and classify it as change 5 does.
- Add the deploy row to this file, push the branch and tag to `origin`, cherry-pick any new commits onto `main`, and update the vault.

Every hour a systemd user timer (in `scripts/systemd/`, see change 8) runs `scripts/algoai-update.sh --notify`: when the versions differ, it opens an issue in the vault repo (once), so a server update is not missed. Users of the web client see the mismatch too, in the banner of change 9.

## Deployment

The branded web client is served on `algodev01` at `https://100.100.0.12:3780` (certificate from Algorime's private CA; `http://` on the same port redirects there), by the systemd user service `algoai-web.service` (which runs from the `algoai-for-sysops-code-current` symlink), in front of the existing T3 Code server on `100.100.0.12:3773`. It works on that server's projects, threads, providers and environments. The server itself is the official T3 Code build and is not built from this repo.

| Deploy tag         | Branch          | Upstream base | Notes                                                                       |
| ------------------ | --------------- | ------------- | --------------------------------------------------------------------------- |
| `algoai-v0.1.7-1`  | `algoai/v0.1.7` | `v0.1.7`      | first branded client                                                        |
| `algoai-v0.1.7-2`  | `algoai/v0.1.7` | `v0.1.7`      | T3 Code's MIT notice and origin row in Settings → Legal                     |
| `algoai-v0.1.7-3`  | `algoai/v0.1.7` | `v0.1.7`      | Based on T3 Code description within 200 characters (upstream lint rule)     |
| `algoai-v0.1.7-4`  | `algoai/v0.1.7` | `v0.1.7`      | welcome screen on every page load                                           |
| `algoai-v0.1.7-5`  | `algoai/v0.1.7` | `v0.1.7`      | new Built By Algorime logo and welcome subtitle                             |
| `algoai-v0.1.7-6`  | `algoai/v0.1.7` | `v0.1.7`      | logo on dark blue, border around the welcome screen                         |
| `algoai-v0.1.7-7`  | `algoai/v0.1.7` | `v0.1.7`      | app's own messages say AlgoAI for SysOps; no upstream star or issue links   |
| `algoai-v0.1.7-8`  | `algoai/v0.1.7` | `v0.1.7`      | web front serves HTTPS                                                      |
| `algoai-v0.1.7-9`  | `algoai/v0.1.7` | `v0.1.7`      | HTTP and HTTPS on the same port                                             |
| `algoai-v0.1.7-10` | `algoai/v0.1.7` | `v0.1.7`      | HTTP redirects to HTTPS                                                     |
| `algoai-v0.1.7-11` | `algoai/v0.1.7` | `v0.1.7`      | welcome text mentions AlgoAI Privé                                          |
| `algoai-v0.1.7-12` | `algoai/v0.1.7` | `v0.1.7`      | About heading says AlgoAI for SysOps; T3 Code notice leads the license list |
| `algoai-v0.1.7-13` | `algoai/v0.1.7` | `v0.1.7`      | Mobile app row hidden; T3 Code notice named @t3code, sorted alphabetically  |
| `algoai-v0.1.9-1`  | `algoai/v0.1.9` | `v0.1.9`      | aligned to server 0.1.9; screen-reader author renamed; update script        |
| `algoai-v0.1.9-2`  | `algoai/v0.1.9` | `v0.1.9`      | Algorime icons for the manifest's 192 and 512 px sizes                      |
| `algoai-v0.1.9-3`  | `algoai/v0.1.9` | `v0.1.9`      | reports version 0.1.9; banner when client and server versions differ        |

## Changes

### 1. Algorime branding in the web app

- **What:** the app is named "AlgoAI for SysOps". The Algorime fan mark replaces the T3 wordmark in the sidebar header and on standalone pages, with the text "AlgoAI for SysOps". The favicons, the splash logo and the web manifest use the Algorime icon.
- **Why:** the fork is presented as Algorime's product. Upstream's names and logos are T3 Tools' trademarks, which the MIT license does not cover, so the fork does not present itself as T3 Code.
- **Files:**
  - new: `apps/web/src/components/AlgorimeMark.tsx`, `assets/algorime/algorime-mark-64.png` (64 px, generated from the 512 px Algorime icon kept in the vault's `sources/`)
  - changed: `apps/web/src/components/sidebar/SidebarChrome.tsx` (`SidebarBrand`, `SidebarBrandMark`), `apps/web/src/components/ui/standalone-page.tsx` (`StandalonePageHeader`), `apps/web/src/branding.ts` (`APP_BASE_NAME`), `apps/web/index.html` (title, splash labels), `apps/web/public/manifest.webmanifest` (name, short name)
  - replaced images: `apps/web/public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`; from `v0.1.9` (and on `main`) also `icon-192x192.png` and `icon-512x512.png`, which `v0.1.7` does not have
- **Not covered:** production and desktop builds would still swap the T3 icons back in through `scripts/apply-web-brand-assets.ts`; only the web build is branded. The remaining names are handled by change 5.

### 2. Web front for an existing T3 server

- **What:** `scripts/algoai-web.mjs`, a small Node server that serves `apps/web/dist` and proxies `/api`, `/ws`, `/oauth`, `/.well-known` and `/mcp` (the same prefixes as `packages/shared/src/devProxy.ts`) to an existing T3 server. Run: `node scripts/algoai-web.mjs --listen 100.100.0.12:3780 --backend 100.100.0.12:3773`. With `--tls-cert` and `--tls-key` (PEM files) it serves HTTPS; with `--redirect-http` as well, plain HTTP on the same port (told apart by the first byte of each connection) is redirected to HTTPS, so browsers keep one origin and one set of client settings. The hop to the backend stays HTTP on the same host.
- **Downloads:** with `--downloads <folder>`, the files of that folder are listed at `/downloads/` and sent as attachments (never the SPA shell; 404 when missing). The service passes `algoai-for-sysops-code-apk/` next to the clone, which holds the Android APK of change 10 and the private CA certificate. `/downloads/` is answered over plain HTTP too, not redirected, so a phone can fetch the CA certificate before it trusts HTTPS; the traffic stays inside Nebula, which encrypts it.
- **Why:** the branded client must work on the same server, data and providers as the official clients, without running a second server or changing the official one. The Android app (change 10) needs a place to be downloaded from.
- **Files:** new: `scripts/algoai-web.mjs`; changed: `knip.jsonc` (one entry under `scripts`, so knip knows the script is run by the service).

### 3. T3 Code's MIT notice and origin in Settings → Legal

- **What:** T3 Code's own license notice (from `LICENSE`) is added to the in-app list under Settings → Legal → Open source licenses, named `@t3code` like the scoped packages around it and sorted with them. A new row "Based on T3 Code" in the same Legal section says the app is Algorime's modified version of T3 Code by T3 Tools Inc., used under the MIT License and not an official T3 Code release, and that its notice is listed as `@t3code`, with a link to the upstream repo. The row is findable in settings search.
- **Why:** MIT requires T3 Tools' copyright and permission notice in every copy, and upstream's build lists only third-party notices. The row states the origin plainly, so nobody takes the app for an official T3 product. Answers [algorime/algoai-for-sysops#3](https://github.com/algorime/algoai-for-sysops/issues/3).
- **Files:**
  - new: `apps/web/src/components/settings/BasedOnT3CodeSettingsRow.tsx`
  - changed: `third-party-licenses.config.json` (one `customNotices` entry), `apps/web/src/components/settings/settingsSearch.ts` (one search entry), `apps/web/src/components/settings/SettingsPanels.tsx` (import and one row in the Legal section)

### 4. Welcome screen on every page load

- **What:** when the app finishes loading, a welcome screen opens over it: the "Built By Algorime" logo on a dark blue (`#13294B`) background, linked to https://www.algorime.it, the title "AlgoAI for SysOps and DevOps" and two lines: "The Algorime® AI environment for SysOps and DevOps activities that will change your project and development strategy. Enjoy it!" and "This is part of AlgoAI Privé, an AI platform for inference with distributed LLMs, built to keep your data truly private.". The screen has a 2 px dark blue border. It stays until the user presses Close; Escape and clicks outside do nothing. It shows again on each page load or reload, not when moving around inside the app.
- **Why:** presents the product and Algorime every time the client is opened.
- **Files:**
  - new: `apps/web/src/components/AlgoAiWelcomeSplash.tsx`, `assets/algorime/built-by-algorime-dark-blue.png` (996x397, the transparent "Built By Algorime" logo provided by Algorime on a rounded `#13294B` background; both versions are kept in the vault's `sources/`)
  - changed: `apps/web/src/routes/__root.tsx` (import and one line next to `ConfirmDialogHost`)

### 5. The app's own messages use the new name

- **What:** UI text in which the app speaks of itself says "AlgoAI for SysOps" instead of "T3 Code": the author name on system messages in the chat ("Sent by …") and in what screen readers announce for them, the onboarding header, error messages ("… could not open a new thread", "… failed to start"), and settings text (opening pull requests in the app, Codex management, provider status, keybindings, notifications, licenses). The browser client's label in the server's Connections list is "AlgoAI for SysOps Web". The T3 wordmark in chat rows and onboarding is replaced by the Algorime mark, and `T3Wordmark.tsx` is deleted. The prompt asking to star pingdotgg/t3code on GitHub is never shown, and the start-failure page files issues in [algorime/algoai-for-sysops](https://github.com/algorime/algoai-for-sysops/issues) (the fork's own repo has issues turned off).
- **Kept as "T3 Code":** text about T3's own products and services, which this fork uses as they are: the T3 Code server and its versions and updates (including restarting it, rebuilding its database and using it from another app over MCP), the desktop app and its desktop-only features, T3 Connect and the relay, the mobile app, the `t3` CLI, the T3 Code GitHub app, the privacy note on T3 Code's usage data, T3's triage agent (it investigates the official server and files issues upstream). Code comments and console messages are also kept.
- **Why:** the fork must not present itself as T3 Code, whose name is T3 Tools' trademark and not covered by MIT, while factual references to T3's products stay accurate. Answers [algorime/algoai-for-sysops#4](https://github.com/algorime/algoai-for-sysops/issues/4).
- **Files:** one-line text changes in about 25 files under `apps/web/src` (chat rows, onboarding, settings, prompt links, `lib/bootError.ts`, `connection/clientMetadata.ts`, `desktopAppActivation.ts`, `hooks/useStartTriage.ts`), the mark swap in `components/chat/TimelineToolActivityIcon.tsx`, `components/chat/V2LifecycleRow.tsx` and, up to `v0.1.7`, `components/onboarding/WelcomeWizard.tsx` (from `v0.1.9` upstream replaced it with `WelcomePage.tsx`, whose header is renamed instead), the removed star prompt call in `components/chat/useComposerSend.ts`, deleted `components/T3Wordmark.tsx`, the screen-reader author in `components/chat/turnDetailAnnouncement.ts` (from `v0.1.9`), and the expected text in their tests.

### 6. Settings → About: app name, no Mobile app row

- **What:** Settings → About titles its first section "AlgoAI for SysOps" instead of "App". The "Mobile app" row (T3 Code's phone app) is not shown: its use in `SettingsPanels.tsx` is commented out, not deleted, and its settings search entry is marked `desktopOnly`, which keeps it out of the web client's search.
- **Why:** the app must not introduce itself as a generic "App", and T3's mobile app is not part of this product.
- **Files:** `apps/web/src/components/settings/SettingsPanels.tsx`, `apps/web/src/components/settings/settingsSearch.ts`, `knip.jsonc` (`MobileAppSettingsRow.tsx` listed as an entry, so knip keeps the unused file).

### 7. This file

- **What:** `ALGOAI.md`, the list of changes.
- **Files:** new: `ALGOAI.md`.

### 8. Update script

- **What:** `scripts/algoai-update.sh`, which moves the client to the server's version (see "Updating to a new server version"), checks whether the two match (`--check`) and opens a vault issue when they do not (`--notify`).
- **Why:** the server updates itself and the client does not; the client stayed on 0.1.7 while the server moved to 0.1.8 and then 0.1.9. Answers [algorime/algoai-for-sysops#2](https://github.com/algorime/algoai-for-sysops/issues/2).
- **Version of the build:** upstream's `apps/web/package.json` lags its tags (at `v0.1.9` it says `0.1.8`) and upstream's release sets `APP_VERSION` instead, so the script builds with `APP_VERSION=<server version>`; otherwise the client reports the wrong version and change 9 warns of a mismatch.
- **systemd units:** `scripts/systemd/` holds the user units installed on `algodev01`: `algoai-web.service` (the web front) and `algoai-update-check.timer` with `algoai-update-check.service` (hourly `--notify`). They use `%h` for the home folder. To install or re-install them:

  ```bash
  cp scripts/systemd/* ~/.config/systemd/user/
  systemctl --user daemon-reload
  systemctl --user enable --now algoai-web.service algoai-update-check.timer
  loginctl enable-linger "$USER"
  ```

- **Files:** new: `scripts/algoai-update.sh`, `scripts/systemd/algoai-web.service`, `scripts/systemd/algoai-update-check.service`, `scripts/systemd/algoai-update-check.timer`.

### 9. Banner when the client and the server versions differ

- **What:** when the web client's build version (`APP_VERSION`) and the primary T3 server's version differ, in either direction, a warning banner shows at the top of every page: "AlgoAI for SysOps is <client>, the T3 server is <server>", that some features may not work until the client is updated and that the administrator has been notified, with a link to the open update issues in the vault. Close hides it until the next page load; it comes back on each load while the versions differ.
- **Why:** the server updates itself and the client does not (change 8), and upstream's own mismatch banner only covers a server older than the client. Without this, users would not know their client is behind; the vault issue opened by the hourly check reaches only the repo's watchers.
- **Files:** new: `apps/web/src/components/AlgoAiVersionBanner.tsx`; changed: `apps/web/src/routes/__root.tsx` (import and one line next to `AlgoAiWelcomeSplash`).
