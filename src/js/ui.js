// INIT
// ============================================================
resizeCanvas();
requestAnimationFrame(render);

window.addEventListener('resize', () => { updateDisplaySize(); });
scaleSlider.addEventListener('input', () => { state.device.scale = parseInt(scaleSlider.value) / 100; updateDisplaySize(); frameCache = {}; });
document.getElementById('videoFitMode').addEventListener('change', e => { state.videoFit = e.target.value; scheduleSave(); });
bgColorInput.addEventListener('input', e => { state.background.color = e.target.value; });
shadowSlider.addEventListener('input', e => { state.shadow = parseInt(e.target.value) / 100; });
tiltXSlider.addEventListener('input', updatePerspective);
tiltYSlider.addEventListener('input', updatePerspective);

// ============================================================
// DEVICE SELECTION
// ============================================================
function updateColorSwatches() {
  const dev = DEVICES[state.device.type];
  const container = document.getElementById('colorSwatches');
  container.innerHTML = '';
  if (state.device.type === 'none') return; // No swatches for no-device mode
  for (const [key, pal] of Object.entries(dev.colors)) {
    const s = document.createElement('div');
    s.className = 'color-swatch' + (key === state.device.color ? ' active' : '');
    s.style.background = pal.body;
    s.title = pal.label;
    s.dataset.color = key;
    s.addEventListener('click', () => {
      pushUndoState();
      state.device.color = key;
      frameCache = {};
      document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
    });
    container.appendChild(s);
  }
}

deviceGrid.addEventListener('click', e => {
  const btn = e.target.closest('.dev-btn');
  if (!btn) return;
  pushUndoState();
  const devId = btn.dataset.device;
  state.device.type = devId;
  state.device.color = DEVICES[devId].defaultColor;
  frameCache = {};
  deviceGrid.querySelectorAll('.dev-btn').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  updateColorSwatches();
  // Hide/show device-specific toggles
  const toggles = document.getElementById('deviceToggles');
  if (toggles) toggles.style.display = devId === 'none' ? 'none' : 'flex';
  // Clear full preset active state (user is customizing)
  document.querySelectorAll('#fullPresetGrid .preset-card').forEach(b => b.classList.remove('active'));
  resizeCanvas();
});

updateColorSwatches();

// ============================================================
// FULL PRESET TEMPLATE CONTROLS
// ============================================================
document.getElementById('fullPresetGrid').addEventListener('click', e => {
  const card = e.target.closest('.preset-card');
  if (!card) return;
  pushUndoState();
  const key = card.dataset.fp;
  applyFullPreset(key);
  const name = card.querySelector('.pc-name');
  showToast('Preset: ' + (name ? name.textContent : key) + ' applied', 'info');
});

document.getElementById('resetFullPresetBtn').addEventListener('click', () => {
  document.querySelectorAll('#fullPresetGrid .preset-card').forEach(b => b.classList.remove('active'));
});

// Device section collapse toggle
document.getElementById('deviceCollapseBtn').addEventListener('click', () => {
  const section = document.getElementById('deviceSection');
  const btn = document.getElementById('deviceCollapseBtn');
  const content = document.getElementById('deviceContent');
  const isCollapsed = content.style.display === 'none';
  content.style.display = isCollapsed ? '' : 'none';
  btn.textContent = isCollapsed ? '▼' : '▶';
});

// Landscape toggle
document.getElementById('landscapeBtn').addEventListener('click', function() {
  state.device.landscape = !state.device.landscape;
  this.classList.toggle('active', state.device.landscape);
  resizeCanvas();
});

// ============================================================
// PRESET SELECTION
// ============================================================
presetSelect.addEventListener('change', e => {
  // No device + device-only doesn't make sense — force to reels
  if (e.target.value === 'device' && state.device.type === 'none') {
    e.target.value = 'reels';
  }
  state.preset = e.target.value;
  customSizeWrap.style.display = e.target.value === 'custom' ? 'inline' : 'none';
  if (e.target.value === 'custom') {
    PRESETS.custom = { w: parseInt(customW.value), h: parseInt(customH.value) };
  }
  resizeCanvas();
});
customW.addEventListener('change', () => { PRESETS.custom.w = parseInt(customW.value); resizeCanvas(); });
customH.addEventListener('change', () => { PRESETS.custom.h = parseInt(customH.value); resizeCanvas(); });

// ============================================================
// VIDEO LOADING
// ============================================================
function loadVideo(file) {
  const url = URL.createObjectURL(file);
  video.src = url;
  video.muted = false;
  video.load();
  hasVideo = true;
  promptEl.classList.remove('visible');
  playbackBar.classList.add('visible');
  timelineBar.classList.add('visible');
  playbackStartTime = performance.now();
  const fnEl = document.getElementById('videoFileName');
  fnEl.textContent = file.name.length > 30 ? file.name.slice(0, 27) + '...' : file.name;
  fnEl.title = file.name;
  state.timeline.trimIn = 0;
  state.timeline.trimOut = 1;
  // Reset virtual timeline
  vtTime = 0;
  vtActiveClipIdx = 0;
// Drag & drop
let dragN = 0;
document.addEventListener('dragenter', e => { e.preventDefault(); dragN++; dropOverlay.classList.add('active'); });
document.addEventListener('dragleave', e => { e.preventDefault(); dragN--; if (dragN <= 0) { dragN = 0; dropOverlay.classList.remove('active'); } });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault(); dragN = 0; dropOverlay.classList.remove('active');
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('video/')) loadVideo(f);
});

// ============================================================
// PLAYBACK
// ============================================================
playBtn.addEventListener('click', () => { vtToggle(); });

function fmt(s) { return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2, '0'); }

// Progress bar scrubbing
const progressTooltip = document.getElementById('progressTooltip');
let isScrubbing = false;
let wasPlayingBeforeScrub = false;

function scrubToX(clientX) {
  const r = progressTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  const totalDur = vtGetTotalDuration() || 1;
  const t = pct * totalDur;
  vtSeek(t);
  progressTooltip.textContent = fmt(t);
  progressFill.style.width = (pct * 100) + '%';
}

progressTrack.addEventListener('mousedown', e => {
  if (!hasVideo) return;
  isScrubbing = true;
  wasPlayingBeforeScrub = vtPlaying;
  vtPause();
  progressTrack.classList.add('scrubbing');
  scrubToX(e.clientX);
});

document.addEventListener('mousemove', e => {
  if (!isScrubbing) return;
  scrubToX(e.clientX);
});

document.addEventListener('mouseup', () => {
  if (!isScrubbing) return;
  isScrubbing = false;
  progressTrack.classList.remove('scrubbing');
  if (wasPlayingBeforeScrub) vtPlay();
});

loopBtn.addEventListener('click', function() {
  isLooping = !isLooping;
  this.classList.toggle('active', isLooping);
  this.textContent = isLooping ? 'Loop' : 'No Loop';
  showToast('Loop: ' + (isLooping ? 'ON' : 'OFF'), 'info');
});
loopBtn.classList.add('active');

// Speed control
speedSelect.addEventListener('change', e => {
  state.timeline.speed = parseFloat(e.target.value);
  state.timeline.clips.forEach(c => { c.video.playbackRate = state.timeline.speed; });
});

// Keyboard shortcuts
const kbOverlay = document.getElementById('kbOverlay');
function toggleKbHelp() { kbOverlay.classList.toggle('open'); }

document.getElementById('kbHelpBtn').addEventListener('click', toggleKbHelp);
document.getElementById('kbClose').addEventListener('click', () => kbOverlay.classList.remove('open'));
kbOverlay.addEventListener('click', e => { if (e.target === kbOverlay) kbOverlay.classList.remove('open'); });

document.addEventListener('keydown', e => {
  // Undo/redo works everywhere (including inputs)
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Z') { e.preventDefault(); redo(); return; }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape' && kbOverlay.classList.contains('open')) { kbOverlay.classList.remove('open'); return; }
  if (e.key === 'Escape' && document.getElementById('exportDialog').classList.contains('open')) { document.getElementById('exportDialog').classList.remove('open'); return; }
  if (e.key === '?') { toggleKbHelp(); return; }
  if (e.code === 'Space') { e.preventDefault(); vtToggle(); }
  if (e.key === '[') { togglePanel('left'); return; }
  if (e.key === ']') { togglePanel('right'); return; }
  if (e.code === 'ArrowLeft') vtSeek(vtTime - 5);
  if (e.code === 'ArrowRight') vtSeek(vtTime + 5);
});
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

// Capture undo state when slider drag or color picker begins (before value changes)
document.addEventListener('mousedown', e => {
  if (e.target.type === 'range' || e.target.type === 'color') pushUndoState();
}, true);

// ============================================================
// COLLAPSIBLE SIDEBAR PANELS
// ============================================================
const leftPanel = document.getElementById('leftPanel');
const rightPanel = document.getElementById('rightPanel');
const leftPanelToggle = document.getElementById('leftPanelToggle');
const rightPanelToggle = document.getElementById('rightPanelToggle');

function togglePanel(side) {
  const panel = side === 'left' ? leftPanel : rightPanel;
  const btn = side === 'left' ? leftPanelToggle : rightPanelToggle;
  const collapsed = panel.classList.toggle('collapsed');
  if (side === 'left') {
    btn.textContent = collapsed ? '»' : '«';
  } else {
    btn.textContent = collapsed ? '«' : '»';
  }
  savePanelState();
}

function savePanelState() {
  localStorage.setItem('mockupStudioPanels', JSON.stringify({
    left: leftPanel.classList.contains('collapsed'),
    right: rightPanel.classList.contains('collapsed'),
  }));
}

function loadPanelState() {
  // Auto-collapse on narrow screens
  if (window.innerWidth < 1280) {
    leftPanel.classList.add('collapsed');
    rightPanel.classList.add('collapsed');
    leftPanelToggle.textContent = '»';
    rightPanelToggle.textContent = '«';
  }
  // Override with saved state if it exists
  try {
    const raw = localStorage.getItem('mockupStudioPanels');
    if (raw) {
      const s = JSON.parse(raw);
      leftPanel.classList.toggle('collapsed', s.left);
      rightPanel.classList.toggle('collapsed', s.right);
      leftPanelToggle.textContent = s.left ? '»' : '«';
      rightPanelToggle.textContent = s.right ? '«' : '»';
    }
  } catch (e) { /* ignore */ }
}

leftPanelToggle.addEventListener('click', () => togglePanel('left'));
rightPanelToggle.addEventListener('click', () => togglePanel('right'));
loadPanelState();

// ============================================================
// HAND OVERLAY
// ============================================================
document.getElementById('handBtn').addEventListener('click', function() {
  pushUndoState();
  state.hand.enabled = !state.hand.enabled;
  this.classList.toggle('active', state.hand.enabled);
  this.textContent = state.hand.enabled ? 'Disable Hand' : 'Enable Hand';
  document.getElementById('resetHandBtn').style.display = state.hand.enabled ? 'inline-block' : 'none';
});
document.getElementById('handStyle').addEventListener('change', e => { state.hand.style = e.target.value; });

// ============================================================
// DEVICE COMPARISON
// ============================================================
function enableComparison() {
  state.comparison.enabled = true;
  document.getElementById('comparisonBtn').classList.add('active');
  document.getElementById('comparisonControls').classList.add('visible');
  // Default second device: different from current
  const types = Object.keys(DEVICES);
  const other = types.find(t => t !== state.device.type) || types[0];
  state.comparison.device2 = { type: other, color: DEVICES[other].defaultColor };
  updateDevice2Swatches();
}

function disableComparison() {
  state.comparison.enabled = false;
  document.getElementById('comparisonBtn').classList.remove('active');
  document.getElementById('comparisonControls').classList.remove('visible');
  const vid2 = document.getElementById('srcVideo2');
  if (vid2) { vid2.pause(); vid2.src = ''; }
  document.getElementById('video2Status').textContent = 'No video loaded for Device 2';
}

document.getElementById('comparisonBtn').addEventListener('click', function() {
  if (state.comparison.enabled) { disableComparison(); return; }
  enableComparison();
});

document.getElementById('disableCompareBtn').addEventListener('click', () => disableComparison());

// Device 2 type selection
document.getElementById('device2Grid').addEventListener('click', e => {
  const btn = e.target.closest('.dev-btn');
  if (!btn || !state.comparison.device2) return;
  const devId = btn.dataset.device;
  state.comparison.device2.type = devId;
  state.comparison.device2.color = DEVICES[devId].defaultColor;
  frameCache = {};
  document.querySelectorAll('#device2Grid .dev-btn').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  updateDevice2Swatches();
});

function updateDevice2Swatches() {
  if (!state.comparison.device2) return;
  const dev = DEVICES[state.comparison.device2.type];
  const container = document.getElementById('colorSwatches2');
  container.innerHTML = '';
  for (const [key, pal] of Object.entries(dev.colors)) {
    const s = document.createElement('div');
    s.className = 'color-swatch' + (key === state.comparison.device2.color ? ' active' : '');
    s.style.background = pal.body;
    s.title = pal.label;
    s.addEventListener('click', () => {
      state.comparison.device2.color = key;
      frameCache = {};
      container.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
    });
    container.appendChild(s);
  }
}

// Load video for device 2
document.getElementById('loadVideo2Btn').addEventListener('click', () => {
  document.getElementById('video2Input').click();
});

document.getElementById('video2Input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const vid2 = document.getElementById('srcVideo2');
  vid2.src = URL.createObjectURL(file);
  vid2.loop = true;
  vid2.muted = true;
  vid2.load();
  vid2.play().catch(() => {});
  document.getElementById('video2Status').textContent = 'Playing: ' + file.name;
});

// ============================================================
// BACKGROUND TYPE + GRADIENT CONTROLS
// ============================================================
document.getElementById('bgType').addEventListener('change', e => {
  pushUndoState();
  const val = e.target.value;
  state.bgType = val;
  if (val === 'gradient') {
    state.gradient.enabled = true;
    document.getElementById('bgSolidControls').style.display = 'none';
    document.getElementById('bgGradientControls').style.display = 'block';
    canvasWrap.classList.remove('checker-bg');
  } else if (val === 'transparent') {
    state.gradient.enabled = false;
    document.getElementById('bgSolidControls').style.display = 'none';
    document.getElementById('bgGradientControls').style.display = 'none';
    canvasWrap.classList.add('checker-bg');
  } else {
    state.gradient.enabled = false;
    document.getElementById('bgSolidControls').style.display = 'block';
    document.getElementById('bgGradientControls').style.display = 'none';
    canvasWrap.classList.remove('checker-bg');
  }
});
document.getElementById('gradColor1').addEventListener('input', e => { state.gradient.color1 = e.target.value; });
document.getElementById('gradColor2').addEventListener('input', e => { state.gradient.color2 = e.target.value; });
document.getElementById('gradColor3').addEventListener('input', e => { state.gradient.color3 = e.target.value; });
document.getElementById('gradAngle').addEventListener('input', e => { state.gradient.angle = parseInt(e.target.value); });
document.getElementById('gradAnimated').addEventListener('change', e => { state.gradient.animated = e.target.value === 'true'; });

// ============================================================
// PARTICLE CONTROLS
// ============================================================
document.getElementById('particleType').addEventListener('change', e => {
  pushUndoState();
  if (e.target.value === 'off') { state.particles.enabled = false; }
  else { state.particles.enabled = true; state.particles.type = e.target.value; state._particles = []; }
});
document.getElementById('particleCount').addEventListener('input', e => { state.particles.count = parseInt(e.target.value); state._particles = []; });
document.getElementById('particleColor').addEventListener('input', e => { state.particles.color = e.target.value; });

// ============================================================
// ORBIT + MOTION BLUR CONTROLS
// ============================================================
document.getElementById('orbitToggle').addEventListener('change', e => {
  pushUndoState();
  state.orbit.enabled = e.target.value === 'true';
  if (!state.orbit.enabled) updatePerspective();
});
document.getElementById('orbitSpeed').addEventListener('input', e => { state.orbit.speed = parseInt(e.target.value) / 100; });
document.getElementById('motionBlurToggle').addEventListener('change', e => { pushUndoState(); state.motionBlur.enabled = e.target.value === 'true'; });

// ============================================================
// OVERLAY CONTROLS (Progress, Waveform, Glass)
// ============================================================
document.getElementById('progressToggle').addEventListener('change', e => { pushUndoState(); state.progressBar.enabled = e.target.value === 'true'; });
document.getElementById('progressColor').addEventListener('input', e => { state.progressBar.color = e.target.value; });
document.getElementById('waveformToggle').addEventListener('change', e => {
  pushUndoState();
  state.waveform.enabled = e.target.value === 'true';
  if (state.waveform.enabled) setupAudioAnalyser();
});
document.getElementById('waveformColor').addEventListener('input', e => { state.waveform.color = e.target.value; });
document.getElementById('glassToggle').addEventListener('change', e => {
  pushUndoState();
  state.glassmorphism.enabled = e.target.value === 'true';
  document.getElementById('glassControls').style.display = state.glassmorphism.enabled ? 'block' : 'none';
  state.glassmorphism.x = -1; state.glassmorphism.y = -1;
});
document.getElementById('glassText').addEventListener('input', e => { state.glassmorphism.text = e.target.value; });
document.getElementById('glassBlur').addEventListener('input', e => { state.glassmorphism.blur = parseInt(e.target.value); });
document.getElementById('glassOpacity').addEventListener('input', e => { state.glassmorphism.opacity = parseInt(e.target.value); });

// Drag glassmorphism overlay
let draggingGlass = false, glassDragOffset = { x:0, y:0 };
canvas.addEventListener('mousedown', e => {
  if (!state.glassmorphism.enabled) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left)*sx, my = (e.clientY - rect.top)*sy;
  const g = state.glassmorphism;
  if (mx >= g.x && mx <= g.x+g.width && my >= g.y && my <= g.y+g.height) {
    draggingGlass = true; glassDragOffset.x = mx - g.x; glassDragOffset.y = my - g.y;
    e.preventDefault(); e.stopPropagation();
  }
}, true);
canvas.addEventListener('mousemove', e => {
  if (!draggingGlass) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  state.glassmorphism.x = (e.clientX - rect.left)*sx - glassDragOffset.x;
  state.glassmorphism.y = (e.clientY - rect.top)*sy - glassDragOffset.y;
}, true);
document.addEventListener('mouseup', () => { draggingGlass = false; }, true);

// ============================================================
// SCENE TEMPLATE GRID
// ============================================================
document.getElementById('sceneGrid').addEventListener('click', e => {
  const btn = e.target.closest('.dev-btn');
  if (!btn) return;
  pushUndoState();
  const scene = btn.dataset.scene;
  document.querySelectorAll('#sceneGrid .dev-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyScene(scene);
  showToast('Scene: ' + btn.textContent.trim() + ' applied', 'info');
});

// ============================================================
// CHROMA KEY CONTROLS
// ============================================================
document.getElementById('chromaToggle').addEventListener('change', e => {
  pushUndoState();
  state.chromaKey.enabled = e.target.value === 'true';
  document.getElementById('chromaControls').style.display = state.chromaKey.enabled ? 'block' : 'none';
});
document.getElementById('chromaColor').addEventListener('input', e => { state.chromaKey.color = e.target.value; });
document.getElementById('chromaTolerance').addEventListener('input', e => { state.chromaKey.tolerance = parseInt(e.target.value); });
document.getElementById('chromaSoftness').addEventListener('input', e => { state.chromaKey.softness = parseInt(e.target.value); });

// ============================================================
// CLEAR / RESET BUTTONS
// ============================================================
document.getElementById('clearLayersBtn').addEventListener('click', () => {
  state.layers = [];
  state.selectedLayer = -1;
  rebuildLayerList();
  document.getElementById('textProps').style.display = 'none';
  document.getElementById('logoProps').style.display = 'none';
});

document.getElementById('clearKeyframesBtn').addEventListener('click', () => {
  state.timeline.keyframes = [];
  rebuildTimeline();
});

document.getElementById('resetEffectsBtn').addEventListener('click', () => {
  // Reset particles
  state.particles.enabled = false;
  state._particles = [];
  document.getElementById('particleType').value = 'off';
  // Reset orbit
  state.orbit.enabled = false;
  document.getElementById('orbitToggle').value = 'false';
  updatePerspective();
  // Reset motion blur
  state.motionBlur.enabled = false;
  document.getElementById('motionBlurToggle').value = 'false';
});

// Reset Scene Templates
document.getElementById('resetSceneBtn').addEventListener('click', () => {
  state.scene = 'custom';
  state.gradient.enabled = false;
  state.particles.enabled = false;
  state._particles = [];
  state.orbit.enabled = false;
  document.getElementById('particleType').value = 'off';
  document.getElementById('orbitToggle').value = 'false';
  document.getElementById('bgType').value = 'solid';
  state.bgType = 'solid';
  document.getElementById('bgSolidControls').style.display = 'block';
  document.getElementById('bgGradientControls').style.display = 'none';
  document.querySelectorAll('#sceneGrid .dev-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#sceneGrid .dev-btn[data-scene="custom"]').classList.add('active');
  updatePerspective();
});

// Reset Hand Overlay
document.getElementById('resetHandBtn').addEventListener('click', () => {
  state.hand.enabled = false;
  document.getElementById('handBtn').classList.remove('active');
  document.getElementById('handBtn').textContent = 'Enable Hand';
  document.getElementById('resetHandBtn').style.display = 'none';
});

// Reset Background
document.getElementById('resetBgBtn').addEventListener('click', () => {
  state.bgType = 'solid';
  state.background = { color: '#0a0a0a' };
  state.gradient.enabled = false;
  state.shadow = 0.6;
  document.getElementById('bgType').value = 'solid';
  document.getElementById('bgColor').value = '#0a0a0a';
  document.getElementById('bgSolidControls').style.display = 'block';
  document.getElementById('bgGradientControls').style.display = 'none';
  document.getElementById('shadowSlider').value = 60;
  document.getElementById('gradColor1').value = '#0f0c29';
  document.getElementById('gradColor2').value = '#302b63';
  document.getElementById('gradColor3').value = '#24243e';
  document.getElementById('gradAngle').value = 135;
  document.getElementById('gradAnimated').value = 'false';
  const cw = document.getElementById('canvasWrap');
  cw.classList.remove('checker-bg');
  // Also remove bg video
  state.bgVideo.enabled = false;
  const bgVidEl = document.getElementById('bgVideo');
  if (bgVidEl.src) { bgVidEl.pause(); URL.revokeObjectURL(bgVidEl.src); bgVidEl.removeAttribute('src'); }
  document.getElementById('removeBgVideoBtn').style.display = 'none';
  document.getElementById('bgVideoControls').style.display = 'none';
  document.getElementById('bgVideoStatus').textContent = '';
  document.getElementById('loadBgVideoBtn').style.display = 'block';
});

// ============================================================
// BACKGROUND VIDEO
// ============================================================
document.getElementById('loadBgVideoBtn').addEventListener('click', () => document.getElementById('bgVideoInput').click());

document.getElementById('bgVideoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const bgVid = document.getElementById('bgVideo');
  if (bgVid.src) URL.revokeObjectURL(bgVid.src);
  bgVid.src = URL.createObjectURL(file);
  bgVid.load();
  bgVid.addEventListener('loadedmetadata', function onMeta() {
    bgVid.removeEventListener('loadedmetadata', onMeta);
    state.bgVideo.enabled = true;
    document.getElementById('bgVideoStatus').textContent = file.name + ' (' + bgVid.videoWidth + 'x' + bgVid.videoHeight + ')';
    document.getElementById('bgVideoControls').style.display = 'block';
    document.getElementById('removeBgVideoBtn').style.display = '';
    document.getElementById('loadBgVideoBtn').style.display = 'none';
    // Auto-play synced with main video
    if (hasVideo && vtPlaying) bgVid.play();
    else bgVid.play(); // play anyway for preview
  });
  e.target.value = '';
});

document.getElementById('removeBgVideoBtn').addEventListener('click', () => {
  state.bgVideo.enabled = false;
  const bgVid = document.getElementById('bgVideo');
  bgVid.pause();
  if (bgVid.src) URL.revokeObjectURL(bgVid.src);
  bgVid.removeAttribute('src');
  document.getElementById('bgVideoStatus').textContent = '';
  document.getElementById('bgVideoControls').style.display = 'none';
  document.getElementById('removeBgVideoBtn').style.display = 'none';
  document.getElementById('loadBgVideoBtn').style.display = 'block';
});

document.getElementById('bgVideoOpacity').addEventListener('input', e => {
  state.bgVideo.opacity = parseInt(e.target.value) / 100;
  document.getElementById('bgVideoOpacityVal').textContent = e.target.value + '%';
});

document.getElementById('bgVideoFit').addEventListener('change', e => {
  state.bgVideo.fit = e.target.value;
});

// Reset Chroma Key
document.getElementById('resetChromaBtn').addEventListener('click', () => {
  state.chromaKey.enabled = false;
  state.chromaKey.color = '#00ff00';
  state.chromaKey.tolerance = 80;
  state.chromaKey.softness = 10;
  document.getElementById('chromaToggle').value = 'false';
  document.getElementById('chromaControls').style.display = 'none';
  document.getElementById('chromaColor').value = '#00ff00';
  document.getElementById('chromaTolerance').value = 80;
  document.getElementById('chromaSoftness').value = 10;
});

// Clear Annotations
document.getElementById('clearAnnotationsBtn').addEventListener('click', () => {
  state.layers = state.layers.filter(l => l.type !== 'annotation');
});

// Reset Device Transform
document.getElementById('resetTransformBtn').addEventListener('click', () => {
  state.device.scale = 0.45;
  state.device.tiltX = 0;
  state.device.tiltY = 0;
  document.getElementById('scaleSlider').value = 45;
  document.getElementById('scaleVal').textContent = '45%';
  document.getElementById('tiltX').value = 0;
  document.getElementById('tiltY').value = 0;
  updatePerspective();
  updateDisplaySize();
});

// ============================================================
// VIDEO OVERLAY CONTROLS
// ============================================================
document.getElementById('builtinOverlayGrid').addEventListener('click', e => {
  const btn = e.target.closest('.dev-btn');
  if (!btn) return;
  pushUndoState();
  const type = btn.dataset.builtin;
  // Toggle — if already active, remove it
  const existing = state.videoOverlays.findIndex(ov => ov.builtin === type);
  if (existing >= 0) {
    state.videoOverlays.splice(existing, 1);
    btn.classList.remove('active');
    rebuildOverlayList();
    return;
  }
  const ov = { id: Date.now(), builtin: type, name: btn.textContent, opacity: 0.5, blendMode: 'screen' };
  state.videoOverlays.push(ov);
  btn.classList.add('active');
  rebuildOverlayList();
});

document.getElementById('addVideoOverlayBtn').addEventListener('click', () => document.getElementById('videoOverlayInput').click());
document.getElementById('videoOverlayInput').addEventListener('change', e => {
  for (const file of e.target.files) {
    if (!file.type.startsWith('video/')) continue;
    const vid = document.createElement('video');
    vid.src = URL.createObjectURL(file);
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.play();
    const ov = { id: Date.now() + Math.random(), video: vid, name: file.name, opacity: 0.5, blendMode: 'screen' };
    state.videoOverlays.push(ov);
    rebuildOverlayList();
  }
  e.target.value = '';
});
document.getElementById('clearVideoOverlaysBtn').addEventListener('click', () => {
  for (const ov of state.videoOverlays) {
    if (ov.video) { ov.video.pause(); URL.revokeObjectURL(ov.video.src); }
  }
  state.videoOverlays = [];
  document.querySelectorAll('#builtinOverlayGrid .dev-btn').forEach(b => b.classList.remove('active'));
  rebuildOverlayList();
});

function rebuildOverlayList() {
  const list = document.getElementById('videoOverlayList');
  list.innerHTML = '';
  state.videoOverlays.forEach((ov, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:8px;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.06)';
    row.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:9px;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px">${ov.name}</span>
        <button class="btn btn-danger" data-ov-remove="${i}" style="padding:2px 6px;font-size:8px">X</button>
      </div>
      <div class="prop-row" style="margin-bottom:2px"><label style="font-size:9px">Blend</label>
        <select data-ov-blend="${i}" style="font-size:9px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ccc;padding:2px 4px">
          <option value="screen"${ov.blendMode==='screen'?' selected':''}>Screen</option>
          <option value="lighter"${ov.blendMode==='lighter'?' selected':''}>Add</option>
          <option value="overlay"${ov.blendMode==='overlay'?' selected':''}>Overlay</option>
          <option value="multiply"${ov.blendMode==='multiply'?' selected':''}>Multiply</option>
          <option value="soft-light"${ov.blendMode==='soft-light'?' selected':''}>Soft Light</option>
          <option value="color-dodge"${ov.blendMode==='color-dodge'?' selected':''}>Dodge</option>
          <option value="source-over"${ov.blendMode==='source-over'?' selected':''}>Normal</option>
        </select>
      </div>
      <div class="prop-row"><label style="font-size:9px">Opacity</label>
        <input type="range" data-ov-opacity="${i}" min="0" max="100" value="${Math.round(ov.opacity*100)}" style="flex:1">
        <span style="font-size:8px;color:#666;min-width:24px">${Math.round(ov.opacity*100)}%</span>
      </div>
    `;
    list.appendChild(row);
  });
  // Bind events
  list.querySelectorAll('[data-ov-remove]').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.ovRemove);
      const ov = state.videoOverlays[idx];
      ov.video.pause(); URL.revokeObjectURL(ov.video.src);
      state.videoOverlays.splice(idx, 1);
      rebuildOverlayList();
    });
  });
  list.querySelectorAll('[data-ov-blend]').forEach(sel => {
    sel.addEventListener('change', e => {
      state.videoOverlays[parseInt(e.target.dataset.ovBlend)].blendMode = e.target.value;
    });
  });
  list.querySelectorAll('[data-ov-opacity]').forEach(slider => {
    slider.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.ovOpacity);
      state.videoOverlays[idx].opacity = parseInt(e.target.value) / 100;
      e.target.nextElementSibling.textContent = e.target.value + '%';
    });
  });
}

// Sync overlay playback with main video
function syncOverlays() {
  if (!hasVideo) return;
  for (const ov of state.videoOverlays) {
    if (!vtPlaying && !ov.video.paused) ov.video.pause();
    else if (vtPlaying && ov.video.paused) ov.video.play();
  }
}

// ============================================================
// LUT PRESET GENERATOR
// ============================================================
function generateLUTPreset(type) {
  const size = 8;
  const data = new Float32Array(size * size * size * 3);
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const idx = (b * size * size + g * size + r) * 3;
        let rf = r / (size - 1), gf = g / (size - 1), bf = b / (size - 1);
        if (type === 'cinematic') {
          // Lift shadows (blue), crush blacks slightly, warm highlights
          rf = Math.pow(rf, 0.95) * 1.05;
          gf = Math.pow(gf, 1.0) * 0.95;
          bf = Math.pow(bf, 0.85) * 0.9 + 0.05;
          // Desaturate shadows
          const lum = 0.299*rf + 0.587*gf + 0.114*bf;
          const shadowMix = Math.max(0, 1 - lum * 2.5);
          rf = rf + (lum - rf) * shadowMix * 0.3;
          gf = gf + (lum - gf) * shadowMix * 0.3;
        } else if (type === 'warmVintage') {
          rf = Math.pow(rf, 0.85) * 1.1;
          gf = Math.pow(gf, 0.95) * 0.95;
          bf = Math.pow(bf, 1.15) * 0.8;
          // Fade blacks
          rf = rf * 0.9 + 0.06; gf = gf * 0.88 + 0.04; bf = bf * 0.85 + 0.03;
        } else if (type === 'coolTeal') {
          rf = Math.pow(rf, 1.1) * 0.85;
          gf = Math.pow(gf, 0.95) * 1.0;
          bf = Math.pow(bf, 0.9) * 1.1;
          // Add teal to midtones
          const mid = Math.sin(gf * Math.PI);
          gf += mid * 0.06; bf += mid * 0.08;
        } else if (type === 'bleachBypass') {
          const lum = 0.299*rf + 0.587*gf + 0.114*bf;
          rf = rf + (lum - rf) * 0.5;
          gf = gf + (lum - gf) * 0.5;
          bf = bf + (lum - bf) * 0.5;
          // High contrast
          rf = Math.pow(rf, 1.3); gf = Math.pow(gf, 1.3); bf = Math.pow(bf, 1.3);
        } else if (type === 'moody') {
          rf = Math.pow(rf, 1.2) * 0.9;
          gf = Math.pow(gf, 1.15) * 0.85;
          bf = Math.pow(bf, 0.95) * 0.95;
          // Crush blacks, tint shadows blue
          const dark = Math.max(0, 1 - (rf + gf + bf));
          bf += dark * 0.08;
          rf = rf * 0.92 + 0.02; gf = gf * 0.9 + 0.015; bf = bf * 0.93 + 0.03;
        } else if (type === 'orangeTeal') {
          // Push shadows teal, highlights orange
          const lum = 0.299*rf + 0.587*gf + 0.114*bf;
          if (lum < 0.5) {
            rf -= (0.5 - lum) * 0.15;
            gf += (0.5 - lum) * 0.05;
            bf += (0.5 - lum) * 0.15;
          } else {
            rf += (lum - 0.5) * 0.2;
            gf += (lum - 0.5) * 0.05;
            bf -= (lum - 0.5) * 0.15;
          }
          rf = Math.pow(Math.max(0, rf), 0.95);
          gf = Math.pow(Math.max(0, gf), 1.0);
          bf = Math.pow(Math.max(0, bf), 1.05);
        } else if (type === 'bw') {
          const lum = 0.299*rf + 0.587*gf + 0.114*bf;
          // Film-like B&W with slight warm tone
          rf = Math.pow(lum, 0.9) * 1.02;
          gf = Math.pow(lum, 0.95) * 0.98;
          bf = Math.pow(lum, 1.05) * 0.95;
        }
        data[idx] = Math.min(1, Math.max(0, rf));
        data[idx+1] = Math.min(1, Math.max(0, gf));
        data[idx+2] = Math.min(1, Math.max(0, bf));
      }
    }
  }
  return { size, data, title: type };
}

// ============================================================
// LUT CONTROLS
// ============================================================
document.getElementById('lutPresetGrid').addEventListener('click', e => {
  const btn = e.target.closest('.dev-btn');
  if (!btn) return;
  pushUndoState();
  const preset = btn.dataset.lutPreset;
  document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
  if (preset === 'none') {
    state.lut = { enabled: false, data: null, size: 0, intensity: 1.0, name: '', _presetKey: '' };
    document.getElementById('lutInfo').textContent = '';
    document.getElementById('lutControls').style.display = 'none';
    return;
  }
  btn.classList.add('active');
  const lut = generateLUTPreset(preset);
  state.lut.data = lut;
  state.lut.size = lut.size;
  state.lut.enabled = true;
  state.lut.name = btn.textContent;
  state.lut._presetKey = preset;
  document.getElementById('lutInfo').innerHTML = '<span style="color:#4ade80">Active:</span> ' + btn.textContent;
  document.getElementById('lutControls').style.display = 'block';
  showToast('Color grade: ' + btn.textContent + ' applied', 'info');
});

document.getElementById('loadLutBtn').addEventListener('click', () => document.getElementById('lutFileInput').click());
document.getElementById('lutFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  pushUndoState();
  const reader = new FileReader();
  reader.onload = () => {
    const lut = parseCubeLUT(reader.result);
    if (!lut) { document.getElementById('lutInfo').textContent = 'Invalid .CUBE file'; return; }
    state.lut.data = lut;
    state.lut.size = lut.size;
    state.lut.enabled = true;
    state.lut.name = lut.title || file.name;
    state.lut._presetKey = '';
    document.getElementById('lutInfo').innerHTML = '<span style="color:#4ade80">Loaded:</span> ' + state.lut.name + ' (' + lut.size + 'x' + lut.size + 'x' + lut.size + ')';
    document.getElementById('lutControls').style.display = 'block';
    showToast('Color grade: ' + state.lut.name + ' applied', 'info');
  };
  reader.readAsText(file);
  e.target.value = '';
});
document.getElementById('clearLutBtn').addEventListener('click', () => {
  pushUndoState();
  state.lut = { enabled: false, data: null, size: 0, intensity: 1.0, name: '' };
  document.getElementById('lutInfo').textContent = '';
  document.getElementById('lutControls').style.display = 'none';
  document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
});
document.getElementById('lutIntensity').addEventListener('input', e => {
  state.lut.intensity = parseInt(e.target.value) / 100;
  document.getElementById('lutIntensityVal').textContent = e.target.value + '%';
});

// ============================================================
// ANIMATION PRESET CONTROLS
// ============================================================
document.getElementById('animPresetGrid').addEventListener('click', e => {
  const btn = e.target.closest('.dev-btn');
  if (!btn) return;
  pushUndoState();
  const anim = btn.dataset.anim;
  state.animPreset.type = anim;
  document.querySelectorAll('#animPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Auto-setup audio analyser when selecting a preset that needs it
  if (anim !== 'none' && hasVideo && !audioAnalyser) setupAudioAnalyser();
});

document.getElementById('clearAnimPresetBtn').addEventListener('click', () => {
  state.animPreset.type = 'none';
  document.querySelectorAll('#animPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#animPresetGrid .dev-btn[data-anim="none"]').classList.add('active');
});

document.getElementById('animIntensity').addEventListener('input', e => {
  state.animPreset.intensity = parseInt(e.target.value) / 100;
});

document.getElementById('animBPM').addEventListener('input', e => {
  state.animPreset.bpm = parseInt(e.target.value);
  document.getElementById('animBPMVal').textContent = e.target.value;
});

document.getElementById('autoBPMBtn').addEventListener('click', function() {
  pushUndoState();
  state.animPreset.autoBPM = !state.animPreset.autoBPM;
  this.classList.toggle('active', state.animPreset.autoBPM);
  this.textContent = state.animPreset.autoBPM ? 'On' : 'Off';
  document.getElementById('animBPM').disabled = state.animPreset.autoBPM;
  document.getElementById('autoBPMStatus').textContent = state.animPreset.autoBPM ? 'Listening...' : '';
  if (state.animPreset.autoBPM && hasVideo) setupAudioAnalyser();
});

// CapCut Draft Import
document.getElementById('importCapcutBtn').addEventListener('click', () => {
  document.getElementById('capcutFileInput').click();
});

document.getElementById('capcutFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const json = JSON.parse(ev.target.result);
      importedKeyframes = parseCapcutDraft(json);
      if (importedKeyframes.length > 0) {
        state.animPreset.type = 'capcut_imported';
        document.querySelectorAll('#animPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
        // Show feedback
        const statusEl = document.getElementById('importCapcutBtn');
        statusEl.textContent = `Imported ${importedKeyframes.length} keyframes`;
        statusEl.style.borderColor = 'rgba(96,165,250,0.4)';
        setTimeout(() => {
          statusEl.textContent = 'Import CapCut Draft';
          statusEl.style.borderColor = '';
        }, 3000);
      } else {
        alert('No animation keyframes found in this file. Make sure it is a draft_content.json from a CapCut Desktop project.');
      }
    } catch (err) {
      alert('Could not parse file: ' + err.message);
    }
  };
  reader.readAsText(file);
});

document.getElementById('resetOverlaysBtn').addEventListener('click', () => {
  // Reset progress bar
  state.progressBar.enabled = false;
  document.getElementById('progressToggle').value = 'false';
  // Reset waveform
  state.waveform.enabled = false;
  document.getElementById('waveformToggle').value = 'false';
  // Reset glassmorphism
  state.glassmorphism.enabled = false;
  state.glassmorphism.x = -1;
  state.glassmorphism.y = -1;
  document.getElementById('glassToggle').value = 'false';
  document.getElementById('glassControls').style.display = 'none';
});

// ============================================================
// PROJECT SAVE / LOAD / RESET
// ============================================================
document.getElementById('saveProjectBtn').addEventListener('click', () => {
  const data = JSON.stringify(getSerializableState(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = 'mockup-project-' + Date.now() + '.json';
  a.href = URL.createObjectURL(blob);
  a.click();
  showToast('Project saved', 'success');
});

document.getElementById('loadProjectBtn').addEventListener('click', () => {
  document.getElementById('projectFileInput').click();
});

document.getElementById('projectFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const s = JSON.parse(reader.result);
      if (!s || !s.device) { showToast('Invalid project file', 'error'); return; }
      applyStateToUI(s);
      saveState();
      showToast('Project loaded: ' + file.name, 'success');
    } catch (err) {
      showToast('Failed to parse project file', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('resetAllBtn').addEventListener('click', () => {
  if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

