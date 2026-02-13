#!/bin/bash
# Manual update script for Mac app and Etsy versions
# Usage: ./update-distributions.sh

set -e

echo "🔨 Building project..."
./build.sh

echo ""
echo "📦 Updating distributions..."

# Mac app
MAC_APP="Mockup Studio.app/Contents/Resources/mockup-player.html"
cp mockup-player.html "$MAC_APP"
echo "✅ Mac app updated: $MAC_APP"

# Etsy
ETSY="MockUpStudioDnloadable/mockup-player.html"
cp mockup-player.html "$ETSY"
echo "✅ Etsy version updated: $ETSY"

# Show file sizes
echo ""
echo "📊 Distribution sizes:"
ls -lh mockup-player.html | awk '{print "   Main: " $5}'
ls -lh "$MAC_APP" | awk '{print "   Mac:  " $5}'
ls -lh "$ETSY" | awk '{print "   Etsy: " $5}'

echo ""
echo "✨ All distributions updated successfully!"
echo ""
echo "To commit these changes:"
echo "  git add ."
echo "  git commit -m 'Update distributions'"
echo "  git push"
