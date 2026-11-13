#!/usr/bin/env bash
# Builds the AlgoAI for SysOps Android app (apps/mobile, production variant) as a signed APK, for
# installing by hand (see ALGOAI.md, change 10). Run it from the worktree of the branch to build.
#   scripts/algoai-mobile-build.sh            build, sign and copy the APK to $ALGOAI_APK_DIR
# Needs a JDK 17 and the Android SDK (ALGOAI_JAVA_HOME, ALGOAI_ANDROID_HOME) and the release
# keystore with its password file (ALGOAI_ANDROID_KEYSTORE, ALGOAI_ANDROID_KEYSTORE_PASSWORD_FILE).
set -euo pipefail

export JAVA_HOME="${ALGOAI_JAVA_HOME:-$HOME/android/jdk}"
export ANDROID_HOME="${ALGOAI_ANDROID_HOME:-$HOME/android/sdk}"
T3_HOME="${T3_HOME:-$HOME/.t3}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$HOME/.local/share/skills-node/bin:$PATH"
unset T3CODE_HOST T3CODE_PORT T3CODE_HOME

root="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
repo="$(cd "$(git -C "$root" rev-parse --git-common-dir)/.." && pwd)"
vault="${ALGOAI_VAULT_DIR:-$(dirname "$repo")/algoai-for-sysops}"
keystore="${ALGOAI_ANDROID_KEYSTORE:-$vault/secrets/algoai-android/algoai-release.jks}"
password_file="${ALGOAI_ANDROID_KEYSTORE_PASSWORD_FILE:-$vault/secrets/algoai-android/keystore-password}"
apk_dir="${ALGOAI_APK_DIR:-$(dirname "$repo")/$(basename "$repo")-apk}"
abis="${ALGOAI_ANDROID_ABIS:-arm64-v8a}"

log() { printf 'algoai-mobile-build: %s\n' "$*" >&2; }
die() { log "$*"; exit 2; }

[ -x "$JAVA_HOME/bin/java" ] || die "no JDK at $JAVA_HOME"
[ -d "$ANDROID_HOME/cmdline-tools" ] || die "no Android SDK at $ANDROID_HOME"
[ -f "$keystore" ] && [ -f "$password_file" ] || die "no keystore at $keystore or no password file"

# The app takes the version of the T3 server it was built for (the branch's upstream tag); the
# version code only grows, so each APK installs over the last one.
version="$(git -C "$root" describe --tags --abbrev=0 --match 'v[0-9]*' HEAD)"
version="${version#v}"
version_code="$(($(date +%s) / 60))"
log "building $version (version code $version_code) for $abis"

cd "$root/apps/mobile"
APP_VARIANT=production EXPO_NO_GIT_STATUS=1 T3CODE_MOBILE_VERSION="$version" \
  ALGOAI_ANDROID_VERSION_CODE="$version_code" \
  ./node_modules/.bin/expo prebuild --clean --platform android --no-install
(
  cd android
  APP_VARIANT=production T3CODE_MOBILE_VERSION="$version" \
    ALGOAI_ANDROID_VERSION_CODE="$version_code" NODE_ENV=production \
    ./gradlew assembleRelease -PreactNativeArchitectures="$abis" --no-daemon
)

unsigned="android/app/build/outputs/apk/release/app-release.apk"
[ -f "$unsigned" ] || die "the build left no APK at apps/mobile/$unsigned"
build_tools="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"
mkdir -p "$apk_dir"
out="$apk_dir/algoai-for-sysops-$version-$version_code.apk"
"$build_tools/zipalign" -f -p 4 "$unsigned" "$out.tmp"
"$build_tools/apksigner" sign --ks "$keystore" --ks-key-alias algoai \
  --ks-pass "file:$password_file" --out "$out" "$out.tmp"
rm -f "$out.tmp" "$out.idsig"
"$build_tools/apksigner" verify "$out"
ln -sfn "$(basename "$out")" "$apk_dir/algoai-for-sysops-latest.apk"
# Served next to the APK (see ALGOAI.md, change 2), so phones can trust the web front's HTTPS.
ca="$vault/secrets/algoai-web-tls/algorime-algoai-ca.crt"
[ -f "$ca" ] && cp "$ca" "$apk_dir/"
log "signed APK: $out"
