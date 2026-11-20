#!/usr/bin/env bash
# Builds, archives and uploads one PowrFit iOS build to App Store Connect
# (Phase 8), with readable Sentry crash reports:
#   1. static export with source maps  2. upload maps to Sentry, delete them
#   3. cap sync  4. Xcode archive  5. upload dSYMs  6. upload to App Store Connect
#
# Usage, from web/:  scripts/ios-release.sh <build number>
# Commit first: Sentry files the release under the current commit.
# Needs: Xcode signed in to the paid team, the `sentry` CLI logged in.
set -euo pipefail

BUILD="${1:?usage: scripts/ios-release.sh <build number>}"
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Commit or stash your changes first: the Sentry release is the commit." >&2
  exit 1
fi

SENTRY="${SENTRY_BIN:-$HOME/.local/bin/sentry}"
export SENTRY_ORG=powr-cg SENTRY_PROJECT=powrfit
RELEASE="powrfit@$(git rev-parse HEAD | cut -c1-12)"
PROJECT=ios/App/App.xcodeproj
WORK="${TMPDIR:-/tmp}/powrfit-release-$BUILD"
ARCHIVE="$WORK/PowrFit.xcarchive"
rm -rf "$WORK" && mkdir -p "$WORK"

echo "== Build $BUILD, Sentry release $RELEASE"
sed -i '' -E "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = $BUILD;/" "$PROJECT/project.pbxproj"

echo "== 1. Static export with source maps"
SENTRY_SOURCEMAPS=1 npm run build:ios

echo "== 2. Source maps to Sentry"
"$SENTRY" sourcemap inject out
"$SENTRY" sourcemap upload out --release "$RELEASE" --dist "$BUILD"
find out -name '*.map' -delete

echo "== 3. Copy the bundle into the iOS project"
npx cap sync ios

echo "== 4. Archive"
xcodebuild -project "$PROJECT" -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates archive | tail -5

echo "== 5. dSYMs to Sentry"
"$SENTRY" debug-files upload --include-sources "$ARCHIVE/dSYMs"

echo "== 6. Upload to App Store Connect"
cat > "$WORK/ExportOptions.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>signingStyle</key><string>automatic</string>
</dict>
</plist>
PLIST
xcodebuild -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$WORK/ExportOptions.plist" -exportPath "$WORK/export" \
  -allowProvisioningUpdates | tail -5

echo "== Done: build $BUILD uploaded. Commit the build number bump."
