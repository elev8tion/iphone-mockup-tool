#!/usr/bin/env python3
"""Builds the self-contained iPhone mockup player HTML app."""

import base64
import json
import os

DIR = os.path.dirname(os.path.abspath(__file__))

# Load frame image as base64
with open(os.path.join(DIR, 'frame.png'), 'rb') as f:
    frame_b64 = base64.b64encode(f.read()).decode()

# Load coordinates
with open(os.path.join(DIR, 'coords.json')) as f:
    coords = json.load(f)

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>iPhone Mockup Player</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
    background: #0a0a0a;
    color: #e0e0e0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
    overflow-x: hidden;
  }}

  .toolbar {{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(20, 20, 20, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }}

  .toolbar h1 {{
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.3px;
    margin-right: auto;
    white-space: nowrap;
  }}

  .toolbar label {{
    font-size: 12px;
    color: #888;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }}

  .toolbar input[type="color"] {{
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: none;
    padding: 0;
  }}

  .toolbar select, .toolbar input[type="range"] {{
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #e0e0e0;
    padding: 4px 8px;
    font-size: 12px;
  }}

  .btn {{
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    color: #e0e0e0;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }}

  .btn:hover {{
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.2);
  }}

  .btn-primary {{
    background: #2563eb;
    border-color: #3b82f6;
  }}

  .btn-primary:hover {{
    background: #1d4ed8;
  }}

  .stage {{
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 20px 20px;
    width: 100%;
  }}

  .phone-container {{
    position: relative;
    transition: transform 0.3s ease;
  }}

  .phone-frame {{
    position: relative;
    z-index: 2;
    pointer-events: none;
    display: block;
  }}

  .screen-video {{
    position: absolute;
    z-index: 1;
    object-fit: cover;
    border-radius: {coords['corner_radius']}px;
  }}

  /* Drop zone overlay */
  .drop-zone {{
    position: absolute;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: {coords['corner_radius']}px;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.2s ease;
  }}

  .drop-zone:hover {{
    background: rgba(37,99,235,0.3);
  }}

  .drop-zone.has-video {{
    opacity: 0;
    pointer-events: none;
  }}

  .drop-zone.dragging {{
    background: rgba(37,99,235,0.4);
    border: 2px dashed #3b82f6;
  }}

  .drop-zone svg {{
    width: 48px;
    height: 48px;
    fill: rgba(255,255,255,0.5);
    margin-bottom: 12px;
  }}

  .drop-zone p {{
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    text-align: center;
    line-height: 1.5;
  }}

  .drop-zone .hint {{
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    margin-top: 6px;
  }}

  /* Video controls overlay */
  .controls-overlay {{
    position: absolute;
    z-index: 4;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 16px 16px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }}

  .phone-container:hover .controls-overlay.visible {{
    opacity: 1;
    pointer-events: auto;
  }}

  .progress-bar {{
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
  }}

  .progress-fill {{
    height: 100%;
    background: #fff;
    border-radius: 2px;
    width: 0%;
    transition: width 0.1s linear;
  }}

  .controls-row {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .ctrl-btn {{
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }}

  .ctrl-btn svg {{
    width: 20px;
    height: 20px;
    fill: white;
  }}

  .time-display {{
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    font-variant-numeric: tabular-nums;
  }}

  /* Full body drop highlight */
  body.global-drag::after {{
    content: '';
    position: fixed;
    inset: 0;
    border: 3px dashed #3b82f6;
    border-radius: 0;
    pointer-events: none;
    z-index: 999;
  }}

  /* Responsive scaling */
  @media (max-height: 900px) {{
    .phone-container {{ transform: scale(0.65); }}
  }}
  @media (min-height: 901px) and (max-height: 1200px) {{
    .phone-container {{ transform: scale(0.55); }}
  }}
  @media (min-height: 1201px) {{
    .phone-container {{ transform: scale(0.7); }}
  }}
</style>
</head>
<body>

<div class="toolbar">
  <h1>iPhone Mockup Player</h1>

  <label>
    Background
    <input type="color" id="bgColor" value="#0a0a0a">
  </label>

  <label>
    Scale
    <input type="range" id="scaleSlider" min="20" max="100" value="55" style="width:100px">
    <span id="scaleLabel">55%</span>
  </label>

  <button class="btn" id="loadBtn" title="Load a video file">Load Video</button>
  <button class="btn" id="loopBtn" title="Toggle loop playback">Loop: ON</button>
  <button class="btn" id="screenshotBtn" title="Screenshot the phone mockup">Screenshot</button>
</div>

<div class="stage" id="stage">
  <div class="phone-container" id="phoneContainer">
    <!-- Video layer (behind frame) -->
    <video class="screen-video" id="screenVideo"
           style="left:{coords['screen_left']}px; top:{coords['screen_top']}px;
                  width:{coords['screen_width']}px; height:{coords['screen_height']}px;"
           playsinline muted loop></video>

    <!-- Phone frame (on top) -->
    <img class="phone-frame" id="phoneFrame"
         src="data:image/png;base64,{frame_b64}"
         width="{coords['frame_width']}" height="{coords['frame_height']}"
         alt="iPhone 16 Frame" draggable="false">

    <!-- Drop zone (inside screen area) -->
    <div class="drop-zone" id="dropZone"
         style="left:{coords['screen_left']}px; top:{coords['screen_top']}px;
                width:{coords['screen_width']}px; height:{coords['screen_height']}px;">
      <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      <p>Drop screen recording here<br>or click to browse</p>
      <p class="hint">MP4, MOV, WebM supported</p>
    </div>

    <!-- Playback controls overlay (inside screen area) -->
    <div class="controls-overlay" id="controlsOverlay"
         style="left:{coords['screen_left']}px;
                width:{coords['screen_width']}px;
                bottom: calc(100% - {coords['screen_bottom']}px);
                border-radius: 0 0 {coords['corner_radius']}px {coords['corner_radius']}px;">
      <div class="progress-bar" id="progressBar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="controls-row">
        <button class="ctrl-btn" id="playPauseBtn" title="Play/Pause">
          <svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <span class="time-display" id="timeDisplay">0:00 / 0:00</span>
      </div>
    </div>
  </div>
</div>

<input type="file" id="fileInput" accept="video/*" style="display:none">

<script>
const video = document.getElementById('screenVideo');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const controlsOverlay = document.getElementById('controlsOverlay');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const timeDisplay = document.getElementById('timeDisplay');
const bgColorInput = document.getElementById('bgColor');
const scaleSlider = document.getElementById('scaleSlider');
const scaleLabel = document.getElementById('scaleLabel');
const loadBtn = document.getElementById('loadBtn');
const loopBtn = document.getElementById('loopBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const phoneContainer = document.getElementById('phoneContainer');

let isLooping = true;

// --- Load video ---
function loadVideo(file) {{
  const url = URL.createObjectURL(file);
  video.src = url;
  video.muted = false;
  video.load();
  video.play();
  dropZone.classList.add('has-video');
  controlsOverlay.classList.add('visible');
}}

// Drop zone click
dropZone.addEventListener('click', () => fileInput.click());
loadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {{
  if (e.target.files[0]) loadVideo(e.target.files[0]);
}});

// Drag and drop on drop zone
dropZone.addEventListener('dragover', (e) => {{
  e.preventDefault();
  dropZone.classList.add('dragging');
}});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', (e) => {{
  e.preventDefault();
  dropZone.classList.remove('dragging');
  if (e.dataTransfer.files[0]) loadVideo(e.dataTransfer.files[0]);
}});

// Global drag and drop (anywhere on page)
document.body.addEventListener('dragover', (e) => {{
  e.preventDefault();
  document.body.classList.add('global-drag');
}});
document.body.addEventListener('dragleave', (e) => {{
  if (e.target === document.body || !document.body.contains(e.relatedTarget)) {{
    document.body.classList.remove('global-drag');
  }}
}});
document.body.addEventListener('drop', (e) => {{
  e.preventDefault();
  document.body.classList.remove('global-drag');
  if (e.dataTransfer.files[0] && e.dataTransfer.files[0].type.startsWith('video/')) {{
    loadVideo(e.dataTransfer.files[0]);
  }}
}});

// --- Playback controls ---
playPauseBtn.addEventListener('click', () => {{
  if (video.paused) {{
    video.play();
  }} else {{
    video.pause();
  }}
}});

video.addEventListener('play', () => {{
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
}});

video.addEventListener('pause', () => {{
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
}});

// Click video to toggle play/pause
video.addEventListener('click', () => {{
  if (video.paused) video.play();
  else video.pause();
}});
video.style.cursor = 'pointer';

// Progress bar
video.addEventListener('timeupdate', () => {{
  if (video.duration) {{
    progressFill.style.width = (video.currentTime / video.duration * 100) + '%';
    timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
  }}
}});

progressBar.addEventListener('click', (e) => {{
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  video.currentTime = pct * video.duration;
}});

function formatTime(s) {{
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}}

// --- Settings ---
bgColorInput.addEventListener('input', (e) => {{
  document.body.style.background = e.target.value;
}});

scaleSlider.addEventListener('input', (e) => {{
  const val = e.target.value;
  scaleLabel.textContent = val + '%';
  phoneContainer.style.transform = 'scale(' + (val / 100) + ')';
}});

// Loop toggle
loopBtn.addEventListener('click', () => {{
  isLooping = !isLooping;
  video.loop = isLooping;
  loopBtn.textContent = 'Loop: ' + (isLooping ? 'ON' : 'OFF');
}});

// --- Screenshot ---
screenshotBtn.addEventListener('click', async () => {{
  const canvas = document.createElement('canvas');
  const frameW = {coords['frame_width']};
  const frameH = {coords['frame_height']};
  canvas.width = frameW;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = bgColorInput.value;
  ctx.fillRect(0, 0, frameW, frameH);

  // Draw video frame into screen area
  if (video.src) {{
    ctx.save();
    // Create rounded rect clip for screen area
    const sx = {coords['screen_left']};
    const sy = {coords['screen_top']};
    const sw = {coords['screen_width']};
    const sh = {coords['screen_height']};
    const cr = {coords['corner_radius']};
    ctx.beginPath();
    ctx.moveTo(sx + cr, sy);
    ctx.lineTo(sx + sw - cr, sy);
    ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + cr);
    ctx.lineTo(sx + sw, sy + sh - cr);
    ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - cr, sy + sh);
    ctx.lineTo(sx + cr, sy + sh);
    ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - cr);
    ctx.lineTo(sx, sy + cr);
    ctx.quadraticCurveTo(sx, sy, sx + cr, sy);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(video, sx, sy, sw, sh);
    ctx.restore();
  }}

  // Draw phone frame on top
  const frameImg = document.getElementById('phoneFrame');
  ctx.drawImage(frameImg, 0, 0, frameW, frameH);

  // Download
  const link = document.createElement('a');
  link.download = 'iphone-mockup-screenshot.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {{
  if (e.code === 'Space') {{
    e.preventDefault();
    if (video.paused) video.play();
    else video.pause();
  }}
  if (e.code === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5);
  if (e.code === 'ArrowRight') video.currentTime = Math.min(video.duration, video.currentTime + 5);
  if (e.code === 'KeyS' && (e.metaKey || e.ctrlKey)) {{
    e.preventDefault();
    screenshotBtn.click();
  }}
}});

// Initial scale from slider
phoneContainer.style.transform = 'scale(' + (scaleSlider.value / 100) + ')';
</script>

</body>
</html>'''

output_path = os.path.join(DIR, 'mockup-player.html')
with open(output_path, 'w') as f:
    f.write(html)

print(f"Built: {output_path}")
print(f"Size: {len(html):,} bytes ({len(html)//1024} KB)")
