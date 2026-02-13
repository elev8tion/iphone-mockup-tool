# Mockup Studio

A browser-based studio for compositing screen recordings into realistic Apple device frames with effects, color grading, animations, and video export.

Drop in a screen recording, pick a device, style the scene, and export a polished mockup video — all without leaving the browser.

## Quick Start

**Option 1 — macOS App Bundle (Recommended)**

Create a native macOS app you can double-click:

```bash
./create-app-bundle.sh
```

Then launch `Mockup Studio.app` from Finder. You can:
- Drag it to your Dock for quick access
- Create an alias in `/Applications`
- Double-click to launch (no terminal needed)

**Auto-rebuild:** The app automatically detects when source files change and rebuilds on next launch.

**Option 2 — Terminal launcher (macOS/Linux/Windows)**

```bash
./mockup-studio
```

Starts a local server on port 8070 and opens Chrome automatically.

**Option 3 — Manual server**

```bash
python3 -m http.server 8070
```

Then open [http://localhost:8070/mockup-player.html](http://localhost:8070/mockup-player.html) in Chrome.

**Option 4 — Direct file**

Open `mockup-player.html` directly in Chrome. Some features (asset browser, video backgrounds) require a local server.

### Requirements

- **Browser:** Google Chrome (required for WebM export, File System Access API)
- **Python 3:** For the local server and CLI tools
- **FFmpeg:** For CLI export/conversion only (`export.sh`)

## Features

### Device Frames

5 device options with color variants:

| Device | Colors |
|--------|--------|
| iPhone 16 | Black, White, Pink, Teal, Ultramarine |
| iPad Pro | Space Black, Silver |
| MacBook Pro | Space Black, Silver |
| Apple Watch | Jet Black, Gold |
| None | Frameless video |

Device scale, position, shadow, and reflection controls included.

### Studio Presets

10 one-click presets that configure the entire scene:

- **App Showcase** — Cinematic device promo
- **TikTok Viral** — Sunset vibes, trending
- **Clean Product** — Minimal white showcase
- **Dark Cinema** — Moody film look
- **Neon Pop** — Neon glow effects
- **Clean Social** — No device, video only
- **Retro Film** — Vintage film grain
- **Laptop Review** — MacBook ocean vibe
- **Raw Video** — No device, no effects
- **iPad Present** — iPad Pro minimal

### Scene Templates

8 background/lighting scenes: Custom, Floating, Neon Glow, Sunset, Minimal, Ocean, Forest, Cinematic.

### Backgrounds

- Solid color
- Gradient (linear/radial, animated)
- Transparent
- Video backgrounds

### Color Grading (LUT)

7 built-in LUT presets: Cinematic, Warm Vintage, Cool Teal, Bleach Bypass, Moody, Orange & Teal, B&W Film.

Import custom `.CUBE` LUT files with adjustable intensity.

### Video Overlays

8 built-in overlay effects (no external files needed):

Film Grain · Light Leak · Bokeh · Dust · Vignette · Chromatic Aberration · Scanlines · Film Burn

Also supports loading external overlay videos from the asset browser.

### Particle Effects

4 types: Bokeh, Sparkle, Confetti, Snow — with count, color, and speed controls.

### Chroma Key

Background removal with adjustable color, similarity, smoothness, and spill suppression.

### Entrance Animations

4 types: Fade In, Slide Up, Scale In, Rotate In — with configurable duration.

### Animation Presets

7 continuous animation styles: Zoom Beat, Velocity, Smooth Slide, Bounce, Glitch, Cinematic Pan, Shake — with intensity and BPM controls.

### Zoom Keyframes

Timeline-based zoom keyframes with interpolation. Add keyframes at any point to create smooth zoom/pan sequences.

### 3D Orbit

Animated 3D perspective rotation around the device.

### Layers

Unified layers panel with visibility toggles and drag-to-reorder:

- **Text layers** — Full typography controls (font, size, weight, color, shadow, outline)
- **Logo/image layers** — Import images with position, scale, opacity
- **Facecam** — Webcam or video file with shape (circle/rounded), border, and position controls
- **Hand overlay** — Right/left hand holding the device
- **Glass CTA** — Frosted glass call-to-action overlay

### Device Comparison

Side-by-side comparison mode with a second device (independent device type and color selection).

### Annotations

Drawing tools: Arrow, Circle, Rectangle, Freehand, Callout — with color and width controls.

### CapCut Import

Import `draft_content.json` from CapCut Desktop projects to apply animation keyframes.

### Asset Browser

Browse local folders using the File System Access API. Supports LUTs, overlays, and video assets organized in subfolders.

### Export

- **Screenshot** — PNG capture of the current frame
- **Video** — WebM recording with configurable resolution
- **Thumbnail** — Quick frame capture

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` / `→` | Seek ±5 seconds |
| `Ctrl/Cmd + S` | Screenshot |

## CLI Tools

### `export.sh`

FFmpeg-based video toolkit with two modes:

```bash
# Composite a raw screen recording into a phone frame
./export.sh screen-recording.mp4
./export.sh recording.mov output.mp4 "#1a1a2e"
./export.sh recording.mp4 output.mp4 transparent

# Convert browser-exported WebM to MP4
./export.sh convert mockup-export.webm final.mp4
```

Requires `frame.png` (generated by `cleanup.py`) and FFmpeg.

### `cleanup.py`

Extracts a device frame from a mockup image. Produces three files used by `export.sh`:

```bash
python3 cleanup.py path/to/device-mockup.png
```

**Output:**
- `frame.png` — Transparent device frame overlay
- `screen_mask.png` — Screen area mask
- `coords.json` — Screen coordinates for compositing

**Dependencies:** `pip install pillow numpy` (see `requirements.txt`)

## Assets Folder Structure

The `assets/` directory is not included in the repo (gitignored). Organize your assets as:

```
assets/
├── Film Burns/
├── Glow & Flares/
├── LUTs/
│   ├── 01 Category/
│   ├── 02 Category/
│   └── ...
├── Light Leaks/
├── Overlays/
├── Particles/
└── Smoke/
```

Use the in-app Asset Browser to point to your local assets folder.

## Tech Stack

- Single-file HTML/CSS/JS (`mockup-player.html`)
- Canvas 2D rendering
- MediaRecorder API for video export
- File System Access API for asset browsing
- No build step, no dependencies, no frameworks

## License

All rights reserved.
