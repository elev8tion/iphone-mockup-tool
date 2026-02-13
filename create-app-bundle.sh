#!/usr/bin/env bash
#
# create-app-bundle.sh
# Creates a macOS .app bundle for Mockup Studio with auto-rebuild functionality
#
# Usage: ./create-app-bundle.sh
# Output: Mockup Studio.app/

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Mockup Studio"
APP_BUNDLE="$PROJECT_DIR/$APP_NAME.app"
BUNDLE_ID="com.mockupstudio.app"
VERSION="1.0.0"

echo "Creating macOS app bundle for Mockup Studio..."

# ---- Create bundle directory structure ----
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# ---- Create Info.plist ----
cat > "$APP_BUNDLE/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>Mockup Studio</string>
    <key>CFBundleIdentifier</key>
    <string>com.mockupstudio.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Mockup Studio</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# ---- Create PkgInfo ----
echo -n "APPL????" > "$APP_BUNDLE/Contents/PkgInfo"

# ---- Create main executable ----
cat > "$APP_BUNDLE/Contents/MacOS/$APP_NAME" << 'EXEC_EOF'
#!/usr/bin/env bash
#
# Mockup Studio — macOS App Bundle Launcher
# Auto-rebuilds if source files changed, then launches the app
#

set -euo pipefail

# ---- Resolve project directory from bundle location ----
BUNDLE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT_DIR="$(dirname "$BUNDLE_DIR")"

# Validate project structure
if [ ! -f "$PROJECT_DIR/mockup-studio" ] || [ ! -f "$PROJECT_DIR/build.sh" ]; then
    osascript -e 'display dialog "Error: Could not find Mockup Studio project files.\n\nExpected location:\n'"$PROJECT_DIR"'" buttons {"OK"} default button 1 with icon stop with title "Mockup Studio"'
    exit 1
fi

cd "$PROJECT_DIR"

# ---- Check if rebuild needed ----
needs_rebuild=0

# Check if output exists
if [ ! -f "mockup-player.html" ]; then
    needs_rebuild=1
else
    # Get output file timestamp
    output_time=$(stat -f %m "mockup-player.html" 2>/dev/null || echo 0)

    # Check all source files
    while IFS= read -r -d '' file; do
        file_time=$(stat -f %m "$file" 2>/dev/null || echo 0)
        if [ "$file_time" -gt "$output_time" ]; then
            needs_rebuild=1
            break
        fi
    done < <(find src/ -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -print0 2>/dev/null)

    # Also check build.sh itself
    if [ -f "build.sh" ]; then
        build_time=$(stat -f %m "build.sh" 2>/dev/null || echo 0)
        if [ "$build_time" -gt "$output_time" ]; then
            needs_rebuild=1
        fi
    fi
fi

# ---- Rebuild if needed ----
if [ "$needs_rebuild" -eq 1 ]; then
    osascript -e 'display notification "Rebuilding from source files..." with title "Mockup Studio"'

    if ./build.sh 2>&1 | tee /tmp/mockup-studio-build.log; then
        osascript -e 'display notification "Build complete! Launching..." with title "Mockup Studio"'
    else
        build_error=$(tail -10 /tmp/mockup-studio-build.log)
        osascript -e 'display dialog "Build failed. Check the log for details.\n\nError:\n'"$build_error"'" buttons {"OK"} default button 1 with icon stop with title "Mockup Studio"'
        exit 1
    fi

    # Brief pause to let user see the notification
    sleep 0.5
fi

# ---- Launch the app ----
exec ./mockup-studio
EXEC_EOF

# ---- Set executable permissions ----
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

echo "✓ App bundle created successfully!"
echo ""
echo "Location: $APP_BUNDLE"
echo ""
echo "Next steps:"
echo "  1. Double-click 'Mockup Studio.app' to launch"
echo "  2. Drag to your Dock for easy access"
echo "  3. Edit source files in src/ — app will auto-rebuild on next launch"
echo ""
echo "Optional:"
echo "  - Add a custom icon: Copy AppIcon.icns to Contents/Resources/"
echo "  - Create an alias in /Applications for system-wide access"
