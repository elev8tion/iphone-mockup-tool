// STATE
// ============================================================
const state = {
  device: { type: 'iphone16', color: 'black', landscape: false, scale: 0.45, x: 0, y: 0 },
  videoFit: 'cover',
  perspective: { x: 0, y: 0 },
  background: { color: '#0a0a0a' },
  shadow: 0.6,
  preset: 'reels',
  layers: [],
  timeline: { trimIn: 0, trimOut: 1, speed: 1, clips: [], currentClip: 0, keyframes: [] },
  deviceKeyframes: [],
  loops: {
    main: { enabled: false, start: 0, end: 1 },
    bgVideo: { enabled: false, start: 0, end: 1 },
    bgAudio: { enabled: false, start: 0, end: 1 }
  },
  standstill: {
    mode: 'none',
    freezeTime: 0,
    contentLoop: { enabled: false, start: 0, end: 1 }
  },
  entrance: { type: 'none', duration: 1000 },
  facecam: { enabled: false, size: 0.15, x: -1, y: -1, corner: 'bottomRight', shape: 'circle', borderColor: '#ffffff', borderWidth: 3, shadow: true, source: 'camera', stream: null },
  hand: { enabled: false, style: 'right' },
  comparison: { enabled: false, device2: null, video2: null, x: 0, y: 0 },
  annotation: { tool: null, color: '#ff4444', width: 3 },
  gradient: { enabled: false, type: 'linear', color1: '#0f0c29', color2: '#302b63', color3: '#24243e', angle: 135, animated: false, speed: 1 },
  particles: { enabled: false, type: 'bokeh', count: 30, color: '#ffffff', speed: 0.5 },
  orbit: { enabled: false, speed: 0.3, axis: 'y', range: 15 },
  motionBlur: { enabled: false, amount: 0.15 },
  waveform: { enabled: false, color: '#60a5fa', height: 0.06, position: 'bottom', style: 'bars' },
  progressBar: { enabled: false, color: '#60a5fa', height: 4, position: 'top' },
  glassmorphism: { enabled: false, text: 'Your CTA Here', x: -1, y: -1, width: 280, height: 60, blur: 12, opacity: 15, borderOpacity: 0.2 },
  chromaKey: { enabled: false, color: '#00ff00', tolerance: 80, softness: 10 },
  videoOverlays: [],
  lut: { enabled: false, data: null, size: 0, intensity: 1.0, name: '', _presetKey: '' },
  bgVideo: { enabled: false, opacity: 1.0, fit: 'cover', trimIn: 0, trimOut: 1 },
  bgAudio: { enabled: false, volume: 1.0, loop: false, speed: 1.0, trimIn: 0, trimOut: 1 },
  bgType: 'solid',
  audioEffects: {
    main: {
      volume: 1.0,
      pan: 0,
      mute: false,
      solo: false,
      eq: { low: 0, mid: 0, high: 0 },
      compressor: {
        enabled: false,
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    },
    bgAudio: {
      volume: 1.0,
      pan: 0,
      mute: false,
      solo: false,
      eq: { low: 0, mid: 0, high: 0 },
      compressor: {
        enabled: false,
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  },
  videoEffects: {
    main: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.0,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    },
    bgVideo: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.0,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },
  animPreset: { type: 'none', intensity: 1.0, bpm: 120, autoBPM: false },
  scene: 'custom',
  selectedLayer: -1,
  nextLayerId: 1,
  renderStack: [
    { id: 'bgVideo', name: 'BG Video', icon: '🎬' },
    { id: 'particles', name: 'Particles', icon: '✨' },
    { id: 'device', name: 'Device', icon: '📱' },
    { id: 'device2', name: 'Device 2', icon: '📲' },
    { id: 'content', name: 'Content', icon: 'T' },
    { id: 'facecam', name: 'Facecam', icon: '📷' },
    { id: 'videoOverlays', name: 'Overlays', icon: '🎞' },
    { id: 'uiOverlays', name: 'UI Effects', icon: '📊' },
  ],
  _particles: [], // runtime particle positions
};

// ============================================================
// UNDO / REDO
// ============================================================
const UNDO_MAX = 30;
const undoStack = [];
const redoStack = [];

function getUndoSnapshot() {
  return {
    device: { type: state.device.type, color: state.device.color, landscape: state.device.landscape, scale: state.device.scale, x: state.device.x, y: state.device.y },
    videoFit: state.videoFit,
    perspective: { x: state.perspective.x, y: state.perspective.y },
    background: { color: state.background.color },
    shadow: state.shadow,
    preset: state.preset,
    bgType: state.bgType,
    gradient: { ...state.gradient },
    particles: { enabled: state.particles.enabled, type: state.particles.type, count: state.particles.count, color: state.particles.color, speed: state.particles.speed },
    orbit: { enabled: state.orbit.enabled, speed: state.orbit.speed, axis: state.orbit.axis, range: state.orbit.range },
    motionBlur: { enabled: state.motionBlur.enabled, amount: state.motionBlur.amount },
    entrance: { type: state.entrance.type, duration: state.entrance.duration },
    animPreset: { type: state.animPreset.type, intensity: state.animPreset.intensity, bpm: state.animPreset.bpm, autoBPM: state.animPreset.autoBPM },
    scene: state.scene,
    chromaKey: { enabled: state.chromaKey.enabled, color: state.chromaKey.color, tolerance: state.chromaKey.tolerance, softness: state.chromaKey.softness },
    lut: { enabled: state.lut.enabled, intensity: state.lut.intensity, name: state.lut.name, _presetKey: state.lut._presetKey || '' },
    waveform: { enabled: state.waveform.enabled, color: state.waveform.color, height: state.waveform.height, position: state.waveform.position, style: state.waveform.style },
    progressBar: { enabled: state.progressBar.enabled, color: state.progressBar.color, height: state.progressBar.height, position: state.progressBar.position },
    glassmorphism: { enabled: state.glassmorphism.enabled, text: state.glassmorphism.text, blur: state.glassmorphism.blur, opacity: state.glassmorphism.opacity },
        hand: { enabled: state.hand.enabled, style: state.hand.style },
        facecam: {
          enabled: state.facecam.enabled,
          size: state.facecam.size,
          corner: state.facecam.corner,
          shape: state.facecam.shape,
          borderColor: state.facecam.borderColor,
          borderWidth: state.facecam.borderWidth,
          shadow: state.facecam.shadow,
          x: state.facecam.x,
          y: state.facecam.y,
        },
        layers: state.layers.map(l => {            const copy = { ...l };
            if (l.type === 'image' && l.img) {
              copy.imgSrc = l.img.src;
            }
            delete copy.img; // non-serializable
            if (l.type === 'annotation') copy.points = [...l.points];
            return copy;
          }),    annotation: { tool: state.annotation.tool, color: state.annotation.color, width: state.annotation.width },
    videoOverlays: state.videoOverlays.filter(ov => ov.builtin).map(ov => ov.builtin),
    selectedLayer: state.selectedLayer,
    audioEffects: JSON.parse(JSON.stringify(state.audioEffects)),
    videoEffects: JSON.parse(JSON.stringify(state.videoEffects)),
  };
}

function applyUndoSnapshot(snap) {
  // Device
  state.device.type = snap.device.type;
  state.device.color = snap.device.color;
  state.device.landscape = snap.device.landscape;
  state.device.scale = snap.device.scale;
  frameCache = {};

  state.videoFit = snap.videoFit;
  state.perspective.x = snap.perspective.x;
  state.perspective.y = snap.perspective.y;
  state.background.color = snap.background.color;
  state.shadow = snap.shadow;
  state.preset = snap.preset;
  state.bgType = snap.bgType;
  Object.assign(state.gradient, snap.gradient);
  Object.assign(state.particles, snap.particles);
  Object.assign(state.orbit, snap.orbit);
  state.motionBlur.enabled = snap.motionBlur.enabled;
  state.motionBlur.amount = snap.motionBlur.amount;
  state.entrance.type = snap.entrance.type;
  state.entrance.duration = snap.entrance.duration;
  Object.assign(state.animPreset, snap.animPreset);
  state.scene = snap.scene;
  Object.assign(state.chromaKey, snap.chromaKey);
  state.lut.enabled = snap.lut.enabled;
  state.lut.intensity = snap.lut.intensity;
  state.lut.name = snap.lut.name;
  state.lut._presetKey = snap.lut._presetKey;
  if (snap.lut.enabled && snap.lut._presetKey) {
    const lut = generateLUTPreset(snap.lut._presetKey);
    state.lut.data = lut; state.lut.size = lut.size;
  } else if (!snap.lut.enabled) {
    state.lut.data = null; state.lut.size = 0;
  }
  Object.assign(state.waveform, snap.waveform);
  Object.assign(state.progressBar, snap.progressBar);
  Object.assign(state.glassmorphism, snap.glassmorphism);
  state.hand.enabled = snap.hand.enabled;
  state.hand.style = snap.hand.style;
  state.annotation.color = snap.annotation.color;
  state.annotation.width = snap.annotation.width;

  // Restore layers (rebuild non-serializable refs)
  state.layers = snap.layers.map(l => {
    const copy = { ...l };
    if (l.type === 'annotation') copy.points = [...l.points];
    if (l.type === 'image' && l.imgSrc) {
      const img = new Image();
      img.src = l.imgSrc;
      copy.img = img;
    }
    return copy;
  });
  state.selectedLayer = snap.selectedLayer;

  // Restore builtin overlays
  state.videoOverlays = state.videoOverlays.filter(ov => !ov.builtin);
  for (const type of snap.videoOverlays) {
    state.videoOverlays.push({ id: Date.now() + Math.random(), builtin: type, name: type, opacity: 0.5, blendMode: 'screen' });
  }

  // Restore audio and video effects
  if (snap.audioEffects) {
    state.audioEffects = JSON.parse(JSON.stringify(snap.audioEffects));
    // Update audio chains
    if (typeof updateAudioEffects === 'function') {
      updateAudioEffects('main');
      updateAudioEffects('bgAudio');
    }
  }
  if (snap.videoEffects) {
    state.videoEffects = JSON.parse(JSON.stringify(snap.videoEffects));
  }
}

function pushUndoState() {
  undoStack.push(getUndoSnapshot());
  if (undoStack.length > UNDO_MAX) undoStack.shift();
  redoStack.length = 0;
  updateUndoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(getUndoSnapshot());
  const snap = undoStack.pop();
  applyUndoSnapshot(snap);
  updateUndoUI();
  updateUndoButtons();
  scheduleSave();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(getUndoSnapshot());
  const snap = redoStack.pop();
  applyUndoSnapshot(snap);
  updateUndoUI();
  updateUndoButtons();
  scheduleSave();
}

function updateUndoButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

function updateUndoUI() {
  // Device grid
  document.querySelectorAll('#deviceGrid .dev-btn').forEach(b => b.classList.toggle('active', b.dataset.device === state.device.type));
  if (typeof updateColorSwatches === 'function') updateColorSwatches();
  document.getElementById('landscapeBtn').classList.toggle('active', state.device.landscape);
  const toggles = document.getElementById('deviceToggles');
  if (toggles) toggles.style.display = state.device.type === 'none' ? 'none' : 'flex';

  // Transform controls
  document.getElementById('scaleSlider').value = Math.round(state.device.scale * 100);
  document.getElementById('videoFitMode').value = state.videoFit;
  document.getElementById('tiltX').value = state.perspective.x;
  document.getElementById('tiltY').value = state.perspective.y;
  document.getElementById('shadowSlider').value = Math.round(state.shadow * 100);

  // Background
  document.getElementById('bgColor').value = state.background.color;
  document.getElementById('bgType').value = state.bgType;
  document.getElementById('bgSolidControls').style.display = state.bgType === 'solid' ? 'block' : 'none';
  document.getElementById('bgGradientControls').style.display = state.bgType === 'gradient' ? 'block' : 'none';
  document.getElementById('gradColor1').value = state.gradient.color1;
  document.getElementById('gradColor2').value = state.gradient.color2;
  document.getElementById('gradColor3').value = state.gradient.color3;
  document.getElementById('gradAngle').value = state.gradient.angle;
  document.getElementById('gradAnimated').value = String(state.gradient.animated);

  // Preset
  document.getElementById('presetSelect').value = state.preset;
  resizeCanvas();

  // Particles
  document.getElementById('particleType').value = state.particles.enabled ? state.particles.type : 'off';
  document.getElementById('particleCount').value = state.particles.count;
  document.getElementById('particleColor').value = state.particles.color;

  // Orbit + motion blur
  document.getElementById('orbitToggle').value = String(state.orbit.enabled);
  document.getElementById('orbitSpeed').value = Math.round(state.orbit.speed * 100);
  document.getElementById('motionBlurToggle').value = String(state.motionBlur.enabled);

  // Entrance
  document.getElementById('entranceSelect').value = state.entrance.type;
  document.getElementById('entranceDur').value = state.entrance.duration;
  document.getElementById('entranceDurVal').textContent = (state.entrance.duration / 1000).toFixed(1) + 's';

  // Animation preset
  document.querySelectorAll('#animPresetGrid .dev-btn').forEach(b => b.classList.toggle('active', b.dataset.anim === state.animPreset.type));
  document.getElementById('animIntensity').value = Math.round(state.animPreset.intensity * 100);
  document.getElementById('animBPM').value = state.animPreset.bpm;
  document.getElementById('animBPMVal').textContent = state.animPreset.bpm;
  document.getElementById('animBPM').disabled = state.animPreset.autoBPM;
  document.getElementById('autoBPMBtn').classList.toggle('active', state.animPreset.autoBPM);
  document.getElementById('autoBPMBtn').textContent = state.animPreset.autoBPM ? 'On' : 'Off';
  document.getElementById('autoBPMStatus').textContent = state.animPreset.autoBPM ? 'Listening...' : '';

  // Scene
  document.querySelectorAll('#sceneGrid .dev-btn').forEach(b => b.classList.toggle('active', b.dataset.scene === state.scene));

  // Chroma key
  document.getElementById('chromaToggle').value = String(state.chromaKey.enabled);
  document.getElementById('chromaControls').style.display = state.chromaKey.enabled ? 'block' : 'none';

  // LUT
  document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
  if (state.lut._presetKey) {
    const lb = document.querySelector('#lutPresetGrid .dev-btn[data-lut-preset="' + state.lut._presetKey + '"]');
    if (lb) lb.classList.add('active');
  }
  document.getElementById('lutControls').style.display = state.lut.enabled ? 'block' : 'none';

  // Overlays UI
  document.getElementById('progressToggle').value = String(state.progressBar.enabled);
  document.getElementById('waveformToggle').value = String(state.waveform.enabled);
  document.getElementById('glassToggle').value = String(state.glassmorphism.enabled);
  document.getElementById('glassControls').style.display = state.glassmorphism.enabled ? 'block' : 'none';

  // Hand
  const handBtn = document.getElementById('handBtn');
  handBtn.classList.toggle('active', state.hand.enabled);
  handBtn.textContent = state.hand.enabled ? 'Disable Hand' : 'Enable Hand';
  document.getElementById('resetHandBtn').style.display = state.hand.enabled ? 'inline-block' : 'none';
  document.getElementById('handStyle').value = state.hand.style;

  // Builtin overlays
  document.querySelectorAll('#builtinOverlayGrid .dev-btn').forEach(b => b.classList.remove('active'));
  state.videoOverlays.filter(ov => ov.builtin).forEach(ov => {
    const ob = document.querySelector('#builtinOverlayGrid .dev-btn[data-builtin="' + ov.builtin + '"]');
    if (ob) ob.classList.add('active');
  });

  // Full preset grid
  document.querySelectorAll('#fullPresetGrid .preset-card').forEach(b => b.classList.remove('active'));

  // Layers
  if (typeof rebuildLayerList === 'function') rebuildLayerList();
  if (typeof rebuildUnifiedLayers === 'function') rebuildUnifiedLayers();
  if (typeof rebuildOverlayList === 'function') rebuildOverlayList();

  updatePerspective();
  updateDisplaySize();
}

// ============================================================
// SESSION PERSISTENCE (localStorage)
// ============================================================
const STORAGE_KEY = 'mockupStudioState';

function getSerializableState() {
  return {
    device: { type: state.device.type, color: state.device.color, landscape: state.device.landscape, scale: state.device.scale },
    videoFit: state.videoFit,
    perspective: { x: state.perspective.x, y: state.perspective.y },
    background: { color: state.background.color },
    shadow: state.shadow,
    preset: state.preset,
    bgType: state.bgType,
    gradient: { ...state.gradient },
    particles: { enabled: state.particles.enabled, type: state.particles.type, count: state.particles.count, color: state.particles.color, speed: state.particles.speed },
    orbit: { enabled: state.orbit.enabled, speed: state.orbit.speed, axis: state.orbit.axis, range: state.orbit.range },
    motionBlur: { enabled: state.motionBlur.enabled, amount: state.motionBlur.amount },
    entrance: { type: state.entrance.type, duration: state.entrance.duration },
    animPreset: { type: state.animPreset.type, intensity: state.animPreset.intensity, bpm: state.animPreset.bpm, autoBPM: state.animPreset.autoBPM },
    scene: state.scene,
    chromaKey: { enabled: state.chromaKey.enabled, color: state.chromaKey.color, tolerance: state.chromaKey.tolerance, softness: state.chromaKey.softness },
    lut: { enabled: state.lut.enabled, intensity: state.lut.intensity, name: state.lut.name, presetKey: state.lut._presetKey || '' },
    waveform: { enabled: state.waveform.enabled, color: state.waveform.color, height: state.waveform.height, position: state.waveform.position, style: state.waveform.style },
    progressBar: { enabled: state.progressBar.enabled, color: state.progressBar.color, height: state.progressBar.height, position: state.progressBar.position },
    glassmorphism: { enabled: state.glassmorphism.enabled, text: state.glassmorphism.text, blur: state.glassmorphism.blur, opacity: state.glassmorphism.opacity },
    hand: { enabled: state.hand.enabled, style: state.hand.style },
    facecam: {
      enabled: state.facecam.enabled,
      size: state.facecam.size,
      corner: state.facecam.corner,
      shape: state.facecam.shape,
      borderColor: state.facecam.borderColor,
      borderWidth: state.facecam.borderWidth,
      shadow: state.facecam.shadow,
      x: state.facecam.x,
      y: state.facecam.y,
    },
    layers: state.layers.map(l => {
      const copy = { ...l };
      if (l.type === 'image' && l.img) {
        copy.imgSrc = l.img.src;
      }
      delete copy.img; // non-serializable
      if (l.type === 'annotation') copy.points = [...l.points];
      return copy;
    }),
    builtinOverlays: state.videoOverlays.filter(ov => ov.builtin).map(ov => ov.builtin),
    bgVideo: {
      enabled: state.bgVideo.enabled,
      opacity: state.bgVideo.opacity,
      fit: state.bgVideo.fit,
    },
    comparison: {
      enabled: state.comparison.enabled,
      device2: state.comparison.device2 ? {
        type: state.comparison.device2.type,
        color: state.comparison.device2.color,
      } : null,
      video2: state.comparison.video2 ? {
        src: state.comparison.video2.src,
      } : null,
    },
    isLooping: isLooping,
    speed: state.timeline.speed,
    audioEffects: state.audioEffects,
    videoEffects: state.videoEffects,
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSerializableState()));
  } catch (e) { /* quota exceeded or private mode — ignore */ }
}

let _saveTimer = null;
function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveState, 500);
}

function applyStateToUI(s) {
  // Device
  state.device.type = s.device.type;
  state.device.color = s.device.color;
  state.device.landscape = s.device.landscape || false;
  state.device.scale = s.device.scale;
  deviceGrid.querySelectorAll('.dev-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.device === s.device.type);
  });
  if (s.device.landscape) document.getElementById('landscapeBtn').classList.add('active');
  updateColorSwatches();
  frameCache = {};

  // Video fit
  state.videoFit = s.videoFit || 'cover';
  document.getElementById('videoFitMode').value = state.videoFit;

  // Perspective
  state.perspective.x = s.perspective.x;
  state.perspective.y = s.perspective.y;
  document.getElementById('tiltX').value = s.perspective.x;
  document.getElementById('tiltY').value = s.perspective.y;

  // Background
  state.background.color = s.background.color;
  state.bgType = s.bgType;
  document.getElementById('bgColor').value = s.background.color;
  document.getElementById('bgType').value = s.bgType;
  document.getElementById('bgSolidControls').style.display = s.bgType === 'solid' ? 'block' : 'none';
  document.getElementById('bgGradientControls').style.display = s.bgType === 'gradient' ? 'block' : 'none';

  // Gradient
  Object.assign(state.gradient, s.gradient);
  document.getElementById('gradColor1').value = s.gradient.color1;
  document.getElementById('gradColor2').value = s.gradient.color2;
  document.getElementById('gradColor3').value = s.gradient.color3;
  document.getElementById('gradAngle').value = s.gradient.angle;
  document.getElementById('gradAnimated').value = String(s.gradient.animated);

  // Shadow & Scale
  state.shadow = s.shadow;
  state.device.scale = s.device.scale;
  document.getElementById('shadowSlider').value = Math.round(s.shadow * 100);
  document.getElementById('scaleSlider').value = Math.round(s.device.scale * 100);

  // Preset (canvas size)
  state.preset = s.preset;
  document.getElementById('presetSelect').value = s.preset;

  // Particles
  Object.assign(state.particles, s.particles);
  document.getElementById('particleType').value = s.particles.enabled ? s.particles.type : 'off';
  document.getElementById('particleCount').value = s.particles.count;
  document.getElementById('particleColor').value = s.particles.color;

  // Orbit
  Object.assign(state.orbit, s.orbit);
  document.getElementById('orbitToggle').value = String(s.orbit.enabled);
  document.getElementById('orbitSpeed').value = Math.round(s.orbit.speed * 100);

  // Motion blur
  state.motionBlur.enabled = s.motionBlur.enabled;
  state.motionBlur.amount = s.motionBlur.amount;
  document.getElementById('motionBlurToggle').value = String(s.motionBlur.enabled);

  // Entrance
  state.entrance.type = s.entrance.type;
  state.entrance.duration = s.entrance.duration;
  document.getElementById('entranceSelect').value = s.entrance.type;
  document.getElementById('entranceDur').value = s.entrance.duration;
  document.getElementById('entranceDurVal').textContent = (s.entrance.duration / 1000).toFixed(1) + 's';

  // Animation preset
  Object.assign(state.animPreset, s.animPreset);
  document.querySelectorAll('#animPresetGrid .dev-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === s.animPreset.type);
  });
  document.getElementById('animIntensity').value = Math.round(s.animPreset.intensity * 100);
  document.getElementById('animBPM').value = s.animPreset.bpm;
  document.getElementById('animBPMVal').textContent = s.animPreset.bpm;
  if (s.animPreset.autoBPM) {
    document.getElementById('animBPM').disabled = true;
    document.getElementById('autoBPMBtn').classList.add('active');
    document.getElementById('autoBPMBtn').textContent = 'On';
    document.getElementById('autoBPMStatus').textContent = 'Listening...';
  } else {
    document.getElementById('animBPM').disabled = false;
    document.getElementById('autoBPMBtn').classList.remove('active');
    document.getElementById('autoBPMBtn').textContent = 'Off';
    document.getElementById('autoBPMStatus').textContent = '';
  }

  // Scene
  state.scene = s.scene;
  document.querySelectorAll('#sceneGrid .dev-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.scene === s.scene);
  });

  // Chroma key
  Object.assign(state.chromaKey, s.chromaKey);
  document.getElementById('chromaToggle').value = String(s.chromaKey.enabled);
  document.getElementById('chromaColor').value = s.chromaKey.color;
  document.getElementById('chromaTolerance').value = s.chromaKey.tolerance;
  document.getElementById('chromaSoftness').value = s.chromaKey.softness;
  document.getElementById('chromaControls').style.display = s.chromaKey.enabled ? 'block' : 'none';

  // LUT — restore preset if it was a built-in
  state.lut.intensity = s.lut.intensity;
  document.getElementById('lutIntensity').value = Math.round(s.lut.intensity * 100);
  document.getElementById('lutIntensityVal').textContent = Math.round(s.lut.intensity * 100) + '%';
  if (s.lut.presetKey && s.lut.presetKey !== 'none' && s.lut.presetKey !== '') {
    const lutBtn = document.querySelector('#lutPresetGrid .dev-btn[data-lut-preset="' + s.lut.presetKey + '"]');
    if (lutBtn) {
      lutBtn.click(); // triggers the existing handler which sets state.lut properly
    }
  }

  // Overlays (progress bar, waveform, glass CTA)
  if (s.progressBar) {
    Object.assign(state.progressBar, s.progressBar);
    document.getElementById('progressToggle').value = String(s.progressBar.enabled);
    document.getElementById('progressColor').value = s.progressBar.color;
  }
  if (s.waveform) {
    Object.assign(state.waveform, s.waveform);
    document.getElementById('waveformToggle').value = String(s.waveform.enabled);
    document.getElementById('waveformColor').value = s.waveform.color;
  }
  if (s.glassmorphism) {
    Object.assign(state.glassmorphism, s.glassmorphism);
    document.getElementById('glassToggle').value = String(s.glassmorphism.enabled);
    document.getElementById('glassControls').style.display = s.glassmorphism.enabled ? 'block' : 'none';
    document.getElementById('glassText').value = s.glassmorphism.text;
    document.getElementById('glassBlur').value = s.glassmorphism.blur;
    document.getElementById('glassOpacity').value = s.glassmorphism.opacity;
  }

  // Hand
  if (s.hand) {
    state.hand.enabled = s.hand.enabled;
    state.hand.style = s.hand.style;

  // Facecam
  state.facecam.enabled = s.facecam.enabled;
  state.facecam.size = s.facecam.size;
  state.facecam.corner = s.facecam.corner;
  state.facecam.shape = s.facecam.shape;
  state.facecam.borderColor = s.facecam.borderColor;
  state.facecam.borderWidth = s.facecam.borderWidth;
  state.facecam.shadow = s.facecam.shadow;
  state.facecam.x = s.facecam.x;
  state.facecam.y = s.facecam.y;

  // Update UI elements for facecam
  document.getElementById('facecamSize').value = Math.round(s.facecam.size * 100);
  document.getElementById('facecamCorner').value = s.facecam.corner;
  document.getElementById('facecamShape').value = s.facecam.shape;
  document.getElementById('facecamBorderColor').value = s.facecam.borderColor;
  document.getElementById('facecamBorderWidth').value = s.facecam.borderWidth;
  document.getElementById('facecamShadow').value = String(s.facecam.shadow);

  // Layers
  state.layers = s.layers.map(l => {
    const copy = { ...l };
    if (l.type === 'annotation') copy.points = [...l.points];
    if (l.type === 'image' && l.imgSrc) {
      const img = new Image();
      img.src = l.imgSrc;
      copy.img = img;
    }
    return copy;
  });

    document.getElementById('handStyle').value = s.hand.style;
  }

  // Builtin overlays
  if (s.builtinOverlays && s.builtinOverlays.length) {
    state.videoOverlays = [];
    document.querySelectorAll('#builtinOverlayGrid .dev-btn').forEach(b => b.classList.remove('active'));
    for (const type of s.builtinOverlays) {
      const btn = document.querySelector('#builtinOverlayGrid .dev-btn[data-builtin="' + type + '"]');
      if (btn) {
        state.videoOverlays.push({ id: Date.now() + Math.random(), builtin: type, name: btn.textContent, opacity: 0.5, blendMode: 'screen' });
        btn.classList.add('active');
      }
    }
  }

  // Loop & speed
  if (typeof s.isLooping !== 'undefined') {
    isLooping = s.isLooping;
  
    loopBtn.classList.toggle('active', isLooping);
    loopBtn.textContent = isLooping ? 'Loop' : 'No Loop';
  }
  if (s.speed) {
    state.timeline.speed = s.speed;
    video.playbackRate = s.speed;
    document.getElementById('speedSelect').value = s.speed;
  }

  // Background Video
  if (s.bgVideo) {
    state.bgVideo.enabled = s.bgVideo.enabled;
    state.bgVideo.opacity = s.bgVideo.opacity;
    state.bgVideo.fit = s.bgVideo.fit;
    // Potentially update UI elements for bgVideo here
  }

  // Comparison
  if (s.comparison) {
    state.comparison.enabled = s.comparison.enabled;
    if (s.comparison.device2) {
      state.comparison.device2 = { ...s.comparison.device2 };
    } else {
      state.comparison.device2 = null;
    }
    if (s.comparison.video2) {
      // Re-create video element if necessary, or just store src
      // For simplicity, just storing src for now, actual video loading would be external
      state.comparison.video2 = { ...s.comparison.video2 };
    } else {
      state.comparison.video2 = null;
    }
    // Potentially update UI elements for comparison here
  }

  // Audio and Video Effects
  if (s.audioEffects) {
    state.audioEffects = s.audioEffects;
    // Update audio chains if initialized
    if (typeof updateAudioEffects === 'function') {
      updateAudioEffects('main');
      updateAudioEffects('bgAudio');
    }
  }
  if (s.videoEffects) {
    state.videoEffects = s.videoEffects;
  }

  resizeCanvas();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || !s.device) return;
    applyStateToUI(s);
  } catch (e) { /* corrupt data — ignore */ }
}

// Auto-save: listen for input/change on all panels
document.querySelectorAll('.panel, .top-bar, .playback-bar').forEach(panel => {
  panel.addEventListener('input', scheduleSave);
  panel.addEventListener('change', scheduleSave);
  panel.addEventListener('click', scheduleSave);
});

// ============================================================
