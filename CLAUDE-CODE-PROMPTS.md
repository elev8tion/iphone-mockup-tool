# Claude Code CLI Prompts — Mockup Studio

Copy-paste these into Claude Code one at a time. Work through each phase in order. Each prompt is self-contained with enough context for Claude Code to act immediately.

---

## PHASE 1: Quick Wins

### 1.1 — Delete Dead Build Script & Add Dependency Files

```
Delete build_app.py — it generates a completely different, inferior app (basic 550-line player) compared to the actual mockup-player.html (5,452-line studio with 40+ features). It's dead code that will confuse anyone who runs it.

Also delete the orphaned test-watermark.png since no code references it.

Then create a requirements.txt with:
pillow
numpy

And create a .python-version file with: 3.11

Finally, update .gitignore to remove the test-watermark.png line since we deleted that file.

Do NOT modify mockup-player.html or any other files.
```

### 1.2 — Create README

```
Create a comprehensive README.md for this project. The project is called "Mockup Studio" — an iPhone/iPad/MacBook/Apple Watch mockup tool that creates professional device mockup videos and screenshots.

Study mockup-player.html to understand all features. Here's what to document:

## What it does
A browser-based studio for compositing screen recordings into realistic device frames with effects, color grading, animations, and video export.

## How to run
- Option 1: ./mockup-studio (macOS, starts local server + opens Chrome)
- Option 2: python3 -m http.server 8070 then open localhost:8070/mockup-player.html
- Option 3: Open mockup-player.html directly in Chrome
- Requires: Python 3, FFmpeg (for CLI export only)

## Features to list (all working):
- 5 device frames (iPhone 16, iPad Pro, MacBook Pro, Apple Watch, None) with color variants
- Video playback with trim, speed control, loop
- 10 studio presets (App Showcase, TikTok Viral, Clean Product, etc.)
- 8 scene templates (Floating, Neon, Sunset, Minimal, Ocean, Forest, Cinematic)
- Background: solid, gradient (animated), transparent, video backgrounds
- LUT color grading: 7 presets + custom .CUBE file import
- Chroma key background removal
- Particle effects (bokeh, sparkle, confetti, snow)
- 8 built-in video overlays (film grain, light leak, bokeh, dust, vignette, chromatic, scanlines, film burn)
- Text layers with full typography controls
- Logo/image layers
- Facecam (webcam or video file) with shape/border/position controls
- Hand overlay (right/left hand holding device)
- Entrance animations (fade, slide, scale, rotate)
- 7 animation presets (zoom beat, velocity, bounce, glitch, cinematic pan, shake, smooth slide)
- Zoom keyframes with interpolation
- 3D orbit animation
- Glass CTA overlay
- Device comparison mode (side-by-side)
- CapCut draft import
- Annotation tools (arrow, circle, rect, freehand, callout)
- Asset browser (File System Access API for local folders)
- Screenshot & thumbnail export
- Video export (WebM)
- Unified layers panel with reordering

## Keyboard shortcuts:
- Space: Play/Pause
- Arrow Left/Right: Seek ±5s
- Ctrl/Cmd+S: Screenshot

## CLI Tools:
- export.sh: FFmpeg-based video compositing and WebM→MP4 conversion
- cleanup.py: Extract device frame from mockup images (generates frame.png, screen_mask.png, coords.json)

## Assets folder structure (not included in repo):
- Film Burns/, Glow & Flares/, LUTs/ (12 categories), Light Leaks/, Overlays/, Particles/, Smoke/

Keep the README clean and professional. Use the project name "Mockup Studio" throughout.
```

### 1.3 — Add Toast Notification System

```
In mockup-player.html, add a lightweight toast notification system. This is a quick UX win — currently actions like screenshot, export complete, and preset changes happen silently with zero feedback.

Add this:

1. CSS for a toast container (fixed, bottom-right, z-index 500) with toast items that slide in, stay 3 seconds, then fade out. Dark semi-transparent background matching the app's design language (rgba(18,18,18,0.92), backdrop-filter blur, border-radius 10px, font-size 12px).

2. A global function: showToast(message, type) where type is 'success', 'info', or 'error' with subtle color coding (green accent for success, blue for info, red for error — just a left border or small icon, keep it minimal).

3. Wire it up to these existing actions:
   - Screenshot button click → "Screenshot saved"
   - Thumbnail button click → "Thumbnail saved"
   - Export complete → "Export complete — WebM downloaded"
   - Export start → "Recording started..."
   - Preset applied → "Preset: [name] applied"
   - Scene template applied → "Scene: [name] applied"
   - LUT applied → "Color grade: [name] applied"
   - Video loaded → "Video loaded: [filename]"
   - Asset browser file applied → "Asset loaded: [filename]"
   - Loop toggled → "Loop: ON/OFF"

Keep each toast max 1 line. Auto-dismiss after 3 seconds. Stack up to 3 toasts. Animate with CSS transitions only (no JS animation libraries).

Search for the existing click handlers (screenshotBtn, thumbBtn, exportBtn, preset handlers, scene handlers, lut handlers, loadVideo function, loopBtn) and add showToast() calls after each action.
```

### 1.4 — Add Keyboard Shortcut Help Overlay

```
In mockup-player.html, add a keyboard shortcut help overlay that appears when the user presses "?" (question mark key).

1. Create a modal overlay (similar style to the asset browser modal — dark backdrop, centered panel, blur background).

2. List ALL keyboard shortcuts in a clean two-column layout:
   - Space → Play / Pause
   - ← → → Seek ±5 seconds
   - Ctrl/Cmd + S → Save Screenshot
   - ? → Show this help

3. Also add a small "⌨" button in the top-bar (after the existing buttons, before Export) that opens the same overlay.

4. Close the overlay on Escape, clicking outside, or clicking a close button.

5. At the bottom of the overlay, add a muted line: "Tip: Press ? anytime to see shortcuts"

Match the existing app design language — dark backgrounds, rgba borders, subtle blur, small fonts.
```

### 1.5 — Show Loaded Video Filename

```
In mockup-player.html, when a video is loaded, show the filename in the playback bar.

Currently the loadVideo function (search for "function loadVideo" or the equivalent) loads a video but there's no visible indication of which file was loaded.

1. Add a small text element in the playback-bar (the bottom bar with play button and progress) showing the filename, truncated to ~30 chars with ellipsis. Style: font-size 10px, color #666, max-width 200px, overflow hidden, text-overflow ellipsis.

2. Update the loadVideo function to extract the filename from the File object (file.name) and display it.

3. If no video is loaded, show nothing (empty/hidden).

Keep it subtle — this is metadata, not a primary control.
```

---

## PHASE 2: Core Polish

### 2.1 — Session Persistence with localStorage

```
In mockup-player.html, implement localStorage-based session persistence so users don't lose everything on page refresh.

The app has a `state` object that holds all settings. Here's what to do:

1. Create a function saveState() that serializes the relevant parts of state to localStorage under key "mockupStudioState". Save: device selection, device color, background type/colors/gradient settings, shadow level, scale, tilt values, particle settings, overlay toggles, LUT preset selection, LUT intensity, entrance animation settings, animation preset, BPM, orbit settings, chroma key settings, loop toggle, playback speed. Do NOT save: video blob URLs (they don't persist), layer content, or transient UI state.

2. Create a function loadState() that reads from localStorage and applies saved values to both the state object AND the corresponding UI controls (inputs, selects, sliders). Call this on page load after DOM is ready.

3. Add a debounced auto-save — whenever state changes, save after 500ms of no further changes. Hook into the existing input/change event handlers.

4. Add two buttons at the very end of the right panel in a new section called "Project":
   - "Save Project" — downloads a .json file with current state
   - "Load Project" — file picker that loads a .json file and restores state

5. Add a "Reset All" button that clears localStorage and reloads the page.

Be careful to update UI controls when restoring state — just setting state values isn't enough, the DOM inputs need to reflect the restored values too.
```

### 2.2 — Export Dialog with Options

```
In mockup-player.html, replace the instant-export behavior with a modal dialog that lets users configure export settings before recording starts.

Currently clicking "Export" immediately starts MediaRecorder. Instead:

1. Create an export dialog modal (matching app design — dark, blurred backdrop, centered panel, ~400px wide).

2. Include these options:
   - Format: WebM (default, only option for now — but show it so users know)
   - Resolution: Original / 1080p / 720p (scale the canvas accordingly)
   - Quality: Low (5Mbps) / Medium (10Mbps, default) / High (20Mbps) / Max (40Mbps)
   - Framerate: 24 / 30 (default) / 60
   - Include Audio: checkbox (default on)

3. Show calculated estimate: "~X seconds of video at Y resolution"

4. Two buttons: "Cancel" and "Start Export" (primary blue gradient button)

5. Clicking "Start Export" closes the dialog and begins recording with the selected settings. Apply the resolution by temporarily scaling the canvas, then restore after export.

6. Keep the existing export progress indicator (exportStatus element) as-is.

Find the exportBtn click handler and modify it to show the dialog instead of immediately starting. The actual recording logic should stay the same but use the dialog's settings.
```

### 2.3 — Collapsible Sidebar Panels

```
In mockup-player.html, make the left and right sidebar panels collapsible so the canvas stage gets more room on smaller screens.

1. Add collapse/expand toggle buttons at the top of each panel (a small "«" / "»" chevron button, 20px wide, at the panel's inner edge).

2. When collapsed, the panel should shrink to ~36px wide showing only the toggle button. The stage should expand to fill the freed space.

3. Add keyboard shortcuts: "[" to toggle left panel, "]" to toggle right panel.

4. Animate the collapse/expand with a CSS transition (width 0.2s ease).

5. On screens narrower than 1280px, auto-collapse both panels on load (user can expand manually).

6. Save panel collapse state in localStorage so it persists across sessions.

7. When a panel is collapsed, show small vertical icons or labels so users know what's behind each panel (e.g., rotated text "Templates" and "Effects").

Don't change the panel content — just add the collapse/expand mechanism.
```

### 2.4 — Better Progress Bar Scrubbing

```
In mockup-player.html, improve the playback progress bar UX. Currently it's a 4px bar (6px on hover) with no scrubber handle — nearly impossible to use for precise seeking.

1. Increase the click target area to 20px tall (transparent padding around the visual bar).

2. Add a circular scrubber handle (12px diameter, white fill, subtle shadow) that appears on hover and follows the playhead position.

3. While dragging, show a time tooltip above the scrubber handle displaying the time at the cursor position (format: "1:23").

4. Make the progress fill slightly thicker on hover (4px → 6px) with a smooth transition.

5. The scrubber handle should be visible whenever the mouse is over the progress area, and always visible while dragging.

Find the progress-track and progress-fill elements and their click/drag handlers. Update both the CSS and the JavaScript event handling.
```

### 2.5 — Video Content Fit Mode

```
In mockup-player.html, add a video fit mode control. Currently all videos are rendered with the equivalent of object-fit: cover (cropping to fill the device screen). Users with different aspect ratio videos lose content.

1. Add a "Fit" dropdown in the right panel's Device Transform section with three options:
   - Cover (default) — crop to fill, no black bars
   - Contain — fit entire video, black bars if needed (letterbox)
   - Stretch — distort to fill exactly

2. Store the fit mode in the state object.

3. In the render function where the video is drawn onto the canvas (search for drawImage calls that draw srcVideo), calculate the source and destination rectangles differently based on fit mode:
   - Cover: scale up to fill, center and crop overflow
   - Contain: scale down to fit, center with margins
   - Stretch: simple stretch to fill

4. Apply the same logic to device 2 video if comparison mode is active.
```

---

## PHASE 3: Feature Completion

### 3.1 — Undo/Redo System

```
In mockup-player.html, implement a simple undo/redo system using state snapshots.

1. Create an undoStack (array, max 30 entries) and redoStack (array).

2. Create pushUndoState() — deep-clone the current state object (excluding video elements, canvas refs, and non-serializable data) and push to undoStack. Clear redoStack.

3. Create undo() — pop from undoStack, push current state to redoStack, restore the popped state. Update all UI controls to reflect restored state.

4. Create redo() — pop from redoStack, push current state to undoStack, restore the popped state.

5. Keyboard shortcuts: Ctrl/Cmd+Z for undo, Ctrl/Cmd+Shift+Z for redo.

6. Call pushUndoState() before these actions:
   - Device change
   - Background change
   - Preset/scene template applied
   - Layer added/removed
   - LUT changed
   - Any slider value committed (on mouseup, not during drag)
   - Annotation completed
   - Effect toggle

7. Add visual indicators in the toolbar: subtle "↩" and "↪" buttons that are grayed out when stack is empty.

Be careful with what you clone — skip: video elements, canvas contexts, MediaStream objects, file handles. Only clone the configuration/settings data.
```

### 3.2 — Complete Multi-Clip Timeline

```
In mockup-player.html, the multi-clip timeline has UI (clip blocks, trim handles, "Add Clip" button, transition selector) but only the first clip actually plays. Complete it.

Study the current implementation:
- There's a clips array in state
- rebuildTimeline() renders clip blocks
- Only srcVideo (first clip) is used for playback

Implement:

1. A virtual timeline that maps total playback time to individual clips. Each clip has: videoElement, startTime (in timeline), duration, trimIn, trimOut.

2. When playing, determine which clip should be active based on currentTime in the virtual timeline. Load/play the correct video element.

3. Implement transitions between clips:
   - Cut: instant switch
   - Crossfade: alpha blend between outgoing and incoming clip for 0.5s
   - Slide: slide incoming clip over outgoing

4. Update the progress bar to show total timeline duration (sum of all clip durations).

5. Clicking on a clip block in the timeline should seek to that clip's start time.

6. Allow reordering clips by dragging their blocks in the timeline.

7. Store each clip's video in a separate <video> element (preloaded).

This is a significant feature. Take care to handle edge cases: seeking across clip boundaries, looping the full timeline, export recording across clips.
```

### 3.3 — MP4 Export via mp4-muxer

```
In mockup-player.html, add MP4 export support using the mp4-muxer library (https://github.com/Vanilagy/mp4-muxer). Currently only WebM export works via MediaRecorder.

1. Add mp4-muxer via CDN: <script src="https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js"></script>

2. In the export dialog (or create one if it doesn't exist yet), add MP4 as a format option alongside WebM.

3. For MP4 export, use this approach:
   - Create a VideoEncoder (WebCodecs API) encoding to H.264
   - Feed canvas frames to the encoder
   - Mux encoded frames with mp4-muxer
   - For audio, use AudioEncoder with AAC codec
   - Combine into final MP4 blob and trigger download

4. Fallback: If WebCodecs API is not available (older browsers), show a message suggesting WebM export instead.

5. Keep WebM as the default since it works everywhere. MP4 should be the recommended option when available.

6. Update the export progress to show: elapsed time, frames encoded, estimated file size.

Check browser support: WebCodecs + mp4-muxer works in Chrome 94+, Edge 94+, and Safari 16.4+. Show a compatibility note in the export dialog.
```

### 3.4 — Asset Folder Auto-Detection

```
In mockup-player.html, improve the asset browser to auto-detect and remember the assets folder.

Currently the asset browser requires manual folder selection via File System Access API every session. The project ships with a 2.7GB assets/ folder right next to mockup-player.html.

1. When running via local server (mockup-studio on localhost:8070), try to auto-load an asset manifest. Create a small Python script called "generate-asset-manifest.py" that:
   - Scans the assets/ directory recursively
   - Generates assets-manifest.json with: folder structure, file names, types, sizes
   - Run once after adding/changing assets

2. In the asset browser, on open:
   - First try to fetch /assets-manifest.json from the local server
   - If found, populate the sidebar and content from the manifest (files load via relative URLs)
   - If not found (e.g., opened as file://), fall back to showDirectoryPicker() as before

3. Use IndexedDB to remember the last-used directory handle (File System Access API supports this). On next session, try to re-request permission for the stored handle before asking the user to pick again.

4. Show a status indicator in the asset browser header: "Connected: Local Server" or "Connected: [folder name]" or "Not connected".

Create the generate-asset-manifest.py script as a separate file in the project root.
```

### 3.5 — Annotation Timing Controls

```
In mockup-player.html, annotations are hardcoded to display for 5 seconds from creation time. Add per-annotation timing controls.

1. When creating an annotation, store startTime (video.currentTime) and endTime (startTime + 5 as default) on the annotation object.

2. In the Annotations section of the right panel, when an annotation is selected, show:
   - Start time input (number, in seconds)
   - End time input (number, in seconds)
   - Duration display (calculated)
   - "Full video" checkbox — if checked, annotation shows for entire video (startTime=0, endTime=Infinity)

3. On the timeline (if visible), show small colored markers for annotation time ranges.

4. In the render loop where annotations are filtered by time, use the per-annotation startTime/endTime instead of the hardcoded 5-second window.

5. When adding a new annotation, default endTime to currentTime + 5 seconds, or to the video duration if less than 5 seconds remain.

Search for where annotations are created and where they're filtered by time in the render function.
```

---

## PHASE 4: Architecture

### 4.1 — Split Into Modular Files

```
The mockup-player.html file is 5,452 lines — all CSS, HTML, and JS in one file. Split it into a modular structure that a build script can reassemble.

Create this structure:
src/
  styles/
    base.css         — reset, body, fonts
    toolbar.css      — top bar styles
    panels.css       — left/right panel styles
    stage.css        — canvas stage styles
    timeline.css     — timeline and playback bar
    modals.css       — asset browser, export dialog
    components.css   — buttons, inputs, toggles, swatches
  js/
    devices.js       — DEVICES registry object
    state.js         — state object, save/load, undo/redo
    render.js        — main render loop, drawing functions
    devices-draw.js  — drawIPhone16, drawIPadPro, etc.
    effects.js       — particles, overlays, LUT, chroma key
    timeline.js      — clip management, keyframes, trim
    export.js        — MediaRecorder, mp4 export
    layers.js        — unified layers panel, content layers
    annotations.js   — annotation tools and rendering
    facecam.js       — webcam/video facecam
    assets.js        — asset browser logic
    ui.js            — toolbar controls, panel controls, event wiring
    utils.js         — formatTime, showToast, helpers
  index.html         — clean HTML structure, imports CSS/JS

Create a build.sh script that:
1. Concatenates all CSS into one block
2. Concatenates all JS into one block (respecting dependency order)
3. Injects into index.html template
4. Outputs mockup-player.html as a single self-contained file

Extract the code methodically — don't rewrite anything, just move existing code into the right files. Every function, every CSS rule, every HTML element should end up in exactly one file.
```

### 4.2 — Add Error Recovery to Render Loop

```
In mockup-player.html, the main render loop (requestAnimationFrame callback) has no error handling. If any drawing function throws, rendering silently stops.

1. Wrap the entire render function body in a try/catch.

2. On error:
   - Log to console with full stack trace
   - Increment an error counter
   - If < 3 consecutive errors, continue the render loop (requestAnimationFrame again)
   - If >= 3 consecutive errors, stop rendering and show a non-intrusive error banner: "Rendering paused due to errors. [Restart] [Details]"
   - Reset error counter on any successful frame

3. The "Restart" button should reset state to defaults and restart the render loop.
4. The "Details" button should show the last error message.

5. Also add protection around specific fragile operations:
   - drawImage with video elements (video might not be loaded)
   - getImageData for LUT/chroma (can fail with tainted canvas)
   - Web Audio API operations (context might be suspended)

Each of these should have individual try/catch blocks that skip the operation gracefully rather than crashing the whole frame.
```

### 4.3 — Cross-Platform Launcher

```
The mockup-studio launcher script only works on macOS (uses "open -a Google Chrome"). Make it cross-platform.

Rewrite the mockup-studio script to:

1. Detect the OS (uname on Unix, check for Windows paths)

2. Use the right open command:
   - macOS: open -a "Google Chrome" "$URL" || open "$URL"
   - Linux: xdg-open "$URL" || google-chrome "$URL" || firefox "$URL"
   - Windows (Git Bash/WSL): start "$URL" || cmd.exe /c start "$URL"

3. Fall back gracefully — if no browser command works, just print the URL and tell the user to open it manually.

4. Add a --port flag to allow custom port (default 8070).

5. Add a --no-browser flag to start the server without opening a browser.

6. Print cleaner output:
   "Mockup Studio running at http://localhost:8070"
   "Press Ctrl+C to stop"

Keep it as a bash script, no dependencies beyond what ships with the OS.
```

---

## BONUS: Specific Bug Fixes

### B.1 — Fix Dimension Mismatch in export.sh

```
export.sh hardcodes frame dimensions (1260x2592, screen 1200x2532 at offset 30,30) but coords.json says (960x1970, screen 860x1880 at offset 45,45). These don't match.

Fix export.sh to read dimensions from coords.json instead of using hardcoded values. Use jq or Python to parse the JSON at the top of the script:

FRAME_W=$(python3 -c "import json; print(json.load(open('$SCRIPT_DIR/coords.json'))['frame_width'])")
FRAME_H=$(python3 -c "import json; print(json.load(open('$SCRIPT_DIR/coords.json'))['frame_height'])")
# etc for screen dimensions

This way export.sh always matches whatever frame.png was generated by cleanup.py.

Add a check at the top: if coords.json doesn't exist, print an error telling the user to run cleanup.py first.
```

### B.2 — Fix cleanup.py Hardcoded Path

```
In cleanup.py line 189, there's a hardcoded fallback path: '/Users/kcdacre8tor/Downloads/iphone-16.webp'

Change this to require a command-line argument with a helpful error message if none is provided:

if len(sys.argv) < 2:
    print("Usage: python3 cleanup.py <mockup-image>")
    print("Example: python3 cleanup.py iphone-16.webp")
    sys.exit(1)
input_file = sys.argv[1]

Remove the hardcoded user-specific path entirely.
```
