#!/usr/bin/env bash
# Keeps the branded web client on the T3 server's version (see ALGOAI.md, "Updating to a new
# server version"). The service runs from the `algoai-for-sysops-code-current` symlink next to
# the clone, which points at the worktree of the version being served.
#   scripts/algoai-update.sh --check    report whether client and server versions match
#   scripts/algoai-update.sh --notify   as --check, and open a vault issue when they do not
#   scripts/algoai-update.sh            make algoai/v<server>, build it, switch the service
# The update stops before switching on any conflict git cannot resolve from an earlier
# resolution (rerere), or on a failed build; the old client keeps running. Run it again after
# resolving the conflict: it resumes on the existing branch.
set -euo pipefail

T3_HOME="${T3_HOME:-$HOME/.t3}"
SERVICE="${ALGOAI_SERVICE:-algoai-web.service}"
WEB_URL="${ALGOAI_WEB_URL:-https://100.100.0.12:3780}"
VAULT_REPO="${ALGOAI_VAULT_REPO:-algorime/algoai-for-sysops}"
export PATH="$HOME/.local/share/skills-node/bin:$PATH"
unset T3CODE_HOST T3CODE_PORT T3CODE_HOME

repo="$(cd "$(git -C "$(dirname "$0")" rev-parse --git-common-dir)/.." && pwd)"
parent="$(dirname "$repo")"
name="$(basename "$repo")"
current_link="$parent/$name-current"

log() { printf 'algoai-update: %s\n' "$*" >&2; }
die() { log "$*"; exit 2; }

server_version() {
  node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).activeVersion)' \
    "$T3_HOME/runtime/service-state.json"
}
client_version() {
  local target
  target="$(readlink "$current_link" 2>/dev/null)" || return 0
  printf '%s\n' "${target##*-v}"
}

server="$(server_version)"
client="$(client_version)"
[ -n "$server" ] || die "cannot read the server's version from $T3_HOME/runtime/service-state.json"

case "${1:-}" in
  --check | --notify)
    if [ "$server" = "$client" ]; then
      log "client and server are both $server"
      exit 0
    fi
    log "client is ${client:-unknown}, server is $server"
    if [ "$1" = "--notify" ]; then
      title="Align the branded web client to T3 server $server"
      if [ -z "$(gh issue list -R "$VAULT_REPO" --state open --search "\"$title\" in:title" --json number --jq '.[].number')" ]; then
        gh issue create -R "$VAULT_REPO" --title "$title" --body "The T3 server on $(hostname) runs $server; the branded web client is built from ${client:-an unknown version}. Run \`scripts/algoai-update.sh\` in the served worktree (steps in ALGOAI.md), then close this issue." >&2
      fi
    fi
    exit 1
    ;;
  "") ;;
  *) die "unknown option $1" ;;
esac

[ "$server" != "$client" ] || { log "client is already $server"; exit 0; }
[ -n "$client" ] || die "$current_link is missing; point it at the served worktree first"

old_branch="algoai/v$client"
new_branch="algoai/v$server"
worktree="$parent/$name-v$server"

git -C "$repo" fetch --quiet upstream --tags
git -C "$repo" rev-parse --quiet --verify "refs/tags/v$server" >/dev/null ||
  die "upstream has no tag v$server yet"
if git -C "$repo" rev-parse --quiet --verify "refs/heads/$new_branch" >/dev/null; then
  [ -d "$worktree" ] || die "$new_branch exists but $worktree does not"
  log "resuming $new_branch in $worktree"
  cd "$worktree"
else
  log "making $new_branch from v$server with the commits of $old_branch"
  git -C "$repo" worktree add --quiet -b "$new_branch" "$worktree" "v$server"
  cd "$worktree"
  git cherry-pick "v$client..$old_branch" >/dev/null 2>&1 || true
fi
while [ -f "$(git rev-parse --git-dir)/CHERRY_PICK_HEAD" ]; do
  unresolved="$(git diff --name-only --diff-filter=U)"
  [ -z "$unresolved" ] ||
    die "conflict in $(git log -1 --format=%s CHERRY_PICK_HEAD): $unresolved. Resolve it in $worktree, then run this script again"
  log "reused an earlier resolution in: $(git log -1 --format=%s CHERRY_PICK_HEAD)"
  git add -A
  GIT_EDITOR=true git cherry-pick --continue >/dev/null 2>&1 || true
done

log "installing and building"
. "$HOME/.config/vite-plus/env"
vp i >/dev/null || die "vp i failed in $worktree"
(cd apps/web && npx vp build >/dev/null) || die "the build failed in $worktree"

log "switching $SERVICE to $worktree"
ln -sfn "$worktree" "$current_link"
systemctl --user restart "$SERVICE"
sleep 3
if ! curl -fsk "$WEB_URL/" | cmp -s - apps/web/dist/index.html; then
  ln -sfn "$parent/$name-v$client" "$current_link"
  systemctl --user restart "$SERVICE"
  die "$WEB_URL did not serve the new build; switched back to $client"
fi

git rev-parse --quiet --verify "refs/tags/algoai-v$server-1" >/dev/null || git tag "algoai-v$server-1"
log "serving $new_branch as algoai-v$server-1. Next: run the checks, review the reused resolutions,"
log "add the deploy row to ALGOAI.md, push the branch and tag, and update the vault."
