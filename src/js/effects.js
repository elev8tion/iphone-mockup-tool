// HAND OVERLAY SVG PATHS
// ============================================================
function drawHandOverlay(c, dev, S, style, devX, devY) {
  if (dev.id !== 'iphone16' && dev.id !== 'applewatch') return;
  c.save();
  c.translate(devX, devY);

  const w = dev.baseW * S;
  const h = dev.baseH * S;

  c.fillStyle = '#e8c4a0';
  c.strokeStyle = '#c8a080';
  c.lineWidth = 1.5 * S;

  if (style === 'right') {
    // Right hand - fingers wrapping around left side, thumb on right
    // Palm behind phone
    c.beginPath();
    c.ellipse(w * 0.5, h * 1.02, w * 0.42, h * 0.12, 0, 0, Math.PI * 2);
    c.fill(); c.stroke();

    // Fingers on left
    for (let i = 0; i < 4; i++) {
      const fy = h * (0.35 + i * 0.1);
      c.beginPath();
      c.ellipse(-w * 0.04, fy, w * 0.06, h * 0.035, -0.2, 0, Math.PI * 2);
      c.fill(); c.stroke();
    }

    // Thumb on right
    c.beginPath();
    c.ellipse(w * 1.03, h * 0.55, w * 0.05, h * 0.08, 0.3, 0, Math.PI * 2);
    c.fill(); c.stroke();
  } else {
    // Left hand - mirror
    c.beginPath();
    c.ellipse(w * 0.5, h * 1.02, w * 0.42, h * 0.12, 0, 0, Math.PI * 2);
    c.fill(); c.stroke();

    for (let i = 0; i < 4; i++) {
      const fy = h * (0.35 + i * 0.1);
      c.beginPath();
      c.ellipse(w * 1.04, fy, w * 0.06, h * 0.035, 0.2, 0, Math.PI * 2);
      c.fill(); c.stroke();
    }

    c.beginPath();
    c.ellipse(-w * 0.03, h * 0.55, w * 0.05, h * 0.08, -0.3, 0, Math.PI * 2);
    c.fill(); c.stroke();
  }

  c.restore();
}

// ============================================================
// GRADIENT BACKGROUND
// ============================================================
let gradientAngleOffset = 0;

function drawGradientBG(c, CW, CH) {
  const g = state.gradient;
  if (g.animated) gradientAngleOffset += g.speed * 0.3;
  const angle = (g.angle + gradientAngleOffset) % 360;
  const rad = angle * Math.PI / 180;
  const cx = CW/2, cy = CH/2;
  const len = Math.max(CW, CH);
  const x1 = cx - Math.cos(rad) * len/2;
  const y1 = cy - Math.sin(rad) * len/2;
  const x2 = cx + Math.cos(rad) * len/2;
  const y2 = cy + Math.sin(rad) * len/2;
  const grad = c.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, g.color1);
  grad.addColorStop(0.5, g.color2);
  grad.addColorStop(1, g.color3);
  c.fillStyle = grad;
  c.fillRect(0, 0, CW, CH);
}

// ============================================================
// PARTICLE SYSTEM
// ============================================================
function initParticles(CW, CH) {
  state._particles = [];
  for (let i = 0; i < state.particles.count; i++) {
    state._particles.push({
      x: Math.random() * CW, y: Math.random() * CH,
      size: Math.random() * 15 + 3,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8 - 0.3,
      opacity: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() * 360,
    });
  }
}

function drawParticles(c, CW, CH) {
  if (state._particles.length !== state.particles.count) initParticles(CW, CH);
  const t = performance.now() * 0.001;
  const spd = state.particles.speed;
  for (const p of state._particles) {
    p.x += p.speedX * spd; p.y += p.speedY * spd;
    if (p.y < -20) { p.y = CH + 20; p.x = Math.random() * CW; }
    if (p.x < -20) p.x = CW + 20;
    if (p.x > CW + 20) p.x = -20;
    if (p.y > CH + 20) { p.y = -20; p.x = Math.random() * CW; }
    const flicker = Math.sin(t * 1.5 + p.phase) * 0.3 + 0.7;
    c.save(); c.globalAlpha = p.opacity * flicker;
    if (state.particles.type === 'bokeh') {
      const grad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, state.particles.color); grad.addColorStop(0.4, state.particles.color); grad.addColorStop(1, 'transparent');
      c.fillStyle = grad; c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI*2); c.fill();
    } else if (state.particles.type === 'sparkle') {
      c.fillStyle = state.particles.color; c.translate(p.x, p.y); c.rotate(t + p.phase);
      for (let j = 0; j < 4; j++) { c.fillRect(-0.5, -p.size*0.5, 1, p.size); c.rotate(Math.PI/4); }
    } else if (state.particles.type === 'confetti') {
      c.fillStyle = `hsl(${p.hue}, 80%, 65%)`; c.translate(p.x, p.y); c.rotate(t*2 + p.phase);
      c.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
    } else if (state.particles.type === 'snow') {
      c.fillStyle = '#fff'; p.x += Math.sin(t + p.phase)*0.3; p.speedY = Math.abs(p.speedY) || 0.5;
      c.beginPath(); c.arc(p.x, p.y, p.size*0.4, 0, Math.PI*2); c.fill();
    }
    c.restore();
  }
}

// ============================================================
// ORBIT (auto-spin)
// ============================================================
function getOrbitAngle() {
  if (!state.orbit.enabled) return 0;
  return Math.sin(performance.now() * 0.001 * state.orbit.speed) * state.orbit.range;
}

// ============================================================
// SHARED AUDIO CONTEXT (singleton — used by analyser, export, beat detector)
// ============================================================
let sharedAudioCtx = null;
let sharedSourceNode = null;

function getSharedAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioCtx;
}

function getSharedSourceNode() {
  if (!sharedSourceNode) {
    var ctx = getSharedAudioContext();
    sharedSourceNode = ctx.createMediaElementSource(document.getElementById('srcVideo'));
  }
  return sharedSourceNode;
}

function reconnectAudioGraph() {
  if (!sharedSourceNode) return;
  try {
    sharedSourceNode.disconnect();
    if (audioAnalyser) {
      sharedSourceNode.connect(audioAnalyser);
    } else if (sharedAudioCtx) {
      sharedSourceNode.connect(sharedAudioCtx.destination);
    }
  } catch(e) {}
}

// ============================================================
// WAVEFORM VISUALIZER
// ============================================================
let audioAnalyser = null, analyserData = null;
function setupAudioAnalyser() {
  if (audioAnalyser) return;
  try {
    var ctx = getSharedAudioContext();
    var source = getSharedSourceNode();
    audioAnalyser = ctx.createAnalyser();
    audioAnalyser.fftSize = 512;
    source.connect(audioAnalyser);
    audioAnalyser.connect(ctx.destination);
    analyserData = new Uint8Array(audioAnalyser.frequencyBinCount);
  } catch(e) {}
}
function drawWaveform(c, CW, CH) {
  if (!audioAnalyser || !analyserData) return;
  audioAnalyser.getByteFrequencyData(analyserData);
  const barCount = analyserData.length, barW = CW / barCount;
  const maxH = CH * state.waveform.height;
  c.save();
  for (let i = 0; i < barCount; i++) {
    const val = analyserData[i] / 255; const h = val * maxH;
    c.fillStyle = state.waveform.color; c.globalAlpha = 0.6 + val*0.4;
    if (state.waveform.position === 'top') c.fillRect(i*barW, 0, barW-1, h);
    else c.fillRect(i*barW, CH-h, barW-1, h);
  }
  c.restore();
}

// ============================================================
// PROGRESS BAR OVERLAY
// ============================================================
function drawProgressBar(c, CW, CH) {
  const totalDur = vtGetTotalDuration();
  if (!totalDur) return;
  const pct = vtTime / totalDur;
  const h = state.progressBar.height;
  const y = state.progressBar.position === 'top' ? 0 : CH - h;
  c.save();
  c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(0, y, CW, h);
  c.fillStyle = state.progressBar.color; c.fillRect(0, y, CW*pct, h);
  c.restore();
}

// ============================================================
// GLASSMORPHISM OVERLAY
// ============================================================
function drawGlassmorphism(c, CW, CH) {
  const g = state.glassmorphism;
  const gx = g.x >= 0 ? g.x : (CW - g.width)/2;
  const gy = g.y >= 0 ? g.y : CH*0.82;
  if (g.x < 0) { g.x = gx; g.y = gy; }
  c.save();
  rrPath(c, gx, gy, g.width, g.height, 16);
  c.fillStyle = `rgba(255,255,255,${g.opacity/100})`; c.fill();
  rrPath(c, gx, gy, g.width, g.height, 16);
  c.strokeStyle = `rgba(255,255,255,${g.borderOpacity})`; c.lineWidth = 1.5; c.stroke();
  rrPath(c, gx, gy, g.width, g.height*0.5, 16);
  c.fillStyle = `rgba(255,255,255,${g.opacity/300})`; c.fill();
  c.fillStyle = '#fff'; c.font = `600 ${Math.round(g.height*0.32)}px -apple-system, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(g.text, gx + g.width/2, gy + g.height/2);
  c.restore();
}

// ============================================================
// ANIMATION PRESETS (CapCut-style) — with real beat detection support
// ============================================================
let _lastGlitchTriggerTime = -1;

function getAnimPresetTransform(time) {
  const preset = state.animPreset;
  if (preset.type === 'none') return { zoom: 1, panX: 0, panY: 0, rotation: 0 };

  const intensity = preset.intensity;
  const t = time || 0;

  // Determine BPM: auto-detected or manual (fall back to manual if no beats for 2s)
  const useAuto = preset.autoBPM && beatDetector.timeSinceLastBeat < 2;
  const bpm = useAuto ? beatDetector.estimatedBPM : preset.bpm;
  const beatInterval = 60 / bpm;

  // Beat phase: auto uses real beat detection, manual uses fixed metronome
  let beatPhase, halfBeat;
  if (useAuto) {
    beatPhase = Math.min(1, beatDetector.timeSinceLastBeat / beatInterval);
    halfBeat = beatPhase * 2 % 1;
  } else {
    beatPhase = (t % beatInterval) / beatInterval;
    halfBeat = (t % (beatInterval/2)) / (beatInterval/2);
  }

  switch (preset.type) {
    case 'zoomBeat': {
      const zoomPulse = Math.sin(beatPhase * Math.PI) * 0.12 * intensity;
      const amp = useAuto ? Math.max(0.3, beatDetector.beatIntensity) : 1;
      return { zoom: 1 + zoomPulse * amp, panX: 0, panY: 0, rotation: 0 };
    }
    case 'velocityEdit': {
      if (useAuto) {
        const zv = Math.exp(-beatPhase * 4) * 0.08 * intensity * (beatDetector.kickBeat ? 1.5 : 1);
        const rv = Math.sin(t * 1.5) * 1.5 * intensity;
        return { zoom: 1 + zv, panX: 0, panY: 0, rotation: rv };
      }
      const cycle = (t % (beatInterval * 4)) / (beatInterval * 4);
      const slowPhase = cycle < 0.3;
      const zv = slowPhase
        ? Math.sin(cycle / 0.3 * Math.PI) * 0.08 * intensity
        : Math.sin((cycle - 0.3) / 0.7 * Math.PI * 3) * 0.04 * intensity;
      const rv = Math.sin(t * 1.5) * 1.5 * intensity;
      return { zoom: 1 + zv, panX: 0, panY: 0, rotation: rv };
    }
    case 'smoothSlide': {
      const cycle = (t % (beatInterval * 8)) / (beatInterval * 8);
      const px = Math.sin(cycle * Math.PI * 2) * 60 * intensity;
      const py = Math.cos(cycle * Math.PI * 2) * 20 * intensity;
      return { zoom: 1.02, panX: px, panY: py, rotation: 0 };
    }
    case 'bounceIn': {
      const decay = Math.exp(-beatPhase * 6);
      const bounce = Math.sin(beatPhase * Math.PI * 4) * decay;
      return { zoom: 1 + bounce * 0.15 * intensity, panX: 0, panY: bounce * -30 * intensity, rotation: 0 };
    }
    case 'glitch': {
      let isGlitchFrame;
      if (useAuto) {
        if (beatDetector.snareBeat || beatDetector.hihatBeat) _lastGlitchTriggerTime = t;
        isGlitchFrame = (t - _lastGlitchTriggerTime) < 0.06;
      } else {
        isGlitchFrame = halfBeat < 0.15;
      }
      if (isGlitchFrame) {
        const seed = Math.floor(t * 30);
        const rx = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
        const ry = ((seed * 7841 + 23497) % 133280) / 133280 - 0.5;
        return { zoom: 1 + rx * 0.04 * intensity, panX: rx * 25 * intensity, panY: ry * 15 * intensity, rotation: rx * 2 * intensity };
      }
      return { zoom: 1, panX: 0, panY: 0, rotation: 0 };
    }
    case 'cinematicPan': {
      const longCycle = (t % 10) / 10;
      const zoom = 1 + longCycle * 0.15 * intensity;
      const px = Math.sin(longCycle * Math.PI) * 40 * intensity;
      const py = Math.cos(longCycle * Math.PI * 0.5) * 15 * intensity;
      return { zoom, panX: px, panY: py, rotation: Math.sin(longCycle * Math.PI) * 0.8 * intensity };
    }
    case 'shake': {
      const freq = 20;
      const energyScale = useAuto ? (0.3 + beatDetector.energy * 0.7) : 1;
      const px = (Math.sin(t * freq * 2.3) * 8 * intensity + Math.sin(t * freq * 3.7) * 4 * intensity) * energyScale;
      const py = (Math.cos(t * freq * 1.9) * 6 * intensity + Math.cos(t * freq * 4.1) * 3 * intensity) * energyScale;
      const rr = Math.sin(t * freq * 1.5) * 0.8 * intensity * energyScale;
      return { zoom: 1, panX: px, panY: py, rotation: rr };
    }
    case 'capcut_imported': {
      return interpolateImportedKeyframes(t);
    }
    default:
      return { zoom: 1, panX: 0, panY: 0, rotation: 0 };
  }
}

// Glitch post-processing (RGB split) — beat-reactive when autoBPM is ON
function drawGlitchEffect(c, CW, CH, time) {
  if (state.animPreset.type !== 'glitch') return;

  const useAuto = state.animPreset.autoBPM && beatDetector.timeSinceLastBeat < 2;
  let shouldGlitch;
  if (useAuto) {
    if (beatDetector.snareBeat || beatDetector.hihatBeat) _lastGlitchTriggerTime = time;
    shouldGlitch = (time - _lastGlitchTriggerTime) < 0.06;
  } else {
    const beatInterval = 60 / state.animPreset.bpm;
    const halfBeat = (time % (beatInterval/2)) / (beatInterval/2);
    shouldGlitch = halfBeat < 0.15;
  }
  if (!shouldGlitch) return;

  const intensity = state.animPreset.intensity;
  const shift = Math.round(3 + intensity * 5);
  c.save();
  c.globalCompositeOperation = 'screen';
  c.globalAlpha = 0.6;
  c.drawImage(canvas, shift, 0, CW - shift, CH, 0, 0, CW - shift, CH);
  c.globalAlpha = 0.4;
  c.drawImage(canvas, 0, 0, CW - shift, CH, shift, 0, CW - shift, CH);
  c.restore();

  c.save();
  c.globalAlpha = 0.08;
  c.fillStyle = '#000';
  for (let y = 0; y < CH; y += 4) {
    c.fillRect(0, y, CW, 2);
  }
  c.restore();
}

// ============================================================
// LUT PARSER & APPLICATOR
// ============================================================
function parseCubeLUT(text) {
  const lines = text.split('\n');
  let size = 0;
  const data = [];
  let title = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('TITLE')) { title = trimmed.replace(/^TITLE\s*"?/, '').replace(/"?\s*$/, ''); continue; }
    if (trimmed.startsWith('LUT_3D_SIZE')) { size = parseInt(trimmed.split(/\s+/)[1]); continue; }
    if (trimmed.startsWith('DOMAIN_MIN') || trimmed.startsWith('DOMAIN_MAX')) continue;
    const parts = trimmed.split(/\s+/).map(Number);
    if (parts.length >= 3 && !isNaN(parts[0])) {
      data.push(parts[0], parts[1], parts[2]);
    }
  }
  if (size === 0 || data.length < size * size * size * 3) return null;
  return { size, data: new Float32Array(data), title };
}

let lutCanvas = null, lutCtx = null;
function applyLUT(sourceCanvas, lut, intensity) {
  if (!lut || !lut.data) return;
  const fullW = sourceCanvas.width, fullH = sourceCanvas.height;
  // Downscale for performance — process at max 480p then upscale back
  const maxDim = 480;
  const scale = Math.min(1, maxDim / Math.max(fullW, fullH));
  const w = Math.round(fullW * scale), h = Math.round(fullH * scale);
  if (!lutCanvas || lutCanvas.width !== w || lutCanvas.height !== h) {
    lutCanvas = document.createElement('canvas');
    lutCanvas.width = w; lutCanvas.height = h;
    lutCtx = lutCanvas.getContext('2d', { willReadFrequently: true });
  }
  lutCtx.drawImage(sourceCanvas, 0, 0, w, h);
  const imgData = safeGetImageData(lutCtx, 0, 0, w, h);
  if (!imgData) return;
  const px = imgData.data;
  const sz = lut.size;
  const d = lut.data;
  const maxIdx = sz - 1;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i] / 255, g = px[i+1] / 255, b = px[i+2] / 255;
    const ri = r * maxIdx, gi = g * maxIdx, bi = b * maxIdx;
    const r0 = Math.floor(ri), r1 = Math.min(r0 + 1, maxIdx);
    const g0 = Math.floor(gi), g1 = Math.min(g0 + 1, maxIdx);
    const b0 = Math.floor(bi), b1 = Math.min(b0 + 1, maxIdx);
    const rf = ri - r0, gf = gi - g0, bf = bi - b0;
    const idx = (bv, gv, rv) => (bv * sz * sz + gv * sz + rv) * 3;
    const c000 = idx(b0, g0, r0), c100 = idx(b0, g0, r1);
    const c010 = idx(b0, g1, r0), c110 = idx(b0, g1, r1);
    const c001 = idx(b1, g0, r0), c101 = idx(b1, g0, r1);
    const c011 = idx(b1, g1, r0), c111 = idx(b1, g1, r1);
    for (let ch = 0; ch < 3; ch++) {
      const v000 = d[c000+ch], v100 = d[c100+ch], v010 = d[c010+ch], v110 = d[c110+ch];
      const v001 = d[c001+ch], v101 = d[c101+ch], v011 = d[c011+ch], v111 = d[c111+ch];
      const c00 = v000 + (v100 - v000) * rf;
      const c10 = v010 + (v110 - v010) * rf;
      const c01 = v001 + (v101 - v001) * rf;
      const c11 = v011 + (v111 - v011) * rf;
      const c0 = c00 + (c10 - c00) * gf;
      const c1 = c01 + (c11 - c01) * gf;
      const lutVal = (c0 + (c1 - c0) * bf) * 255;
      const orig = px[i + ch];
      px[i + ch] = Math.round(orig + (lutVal - orig) * intensity);
    }
  }
  lutCtx.putImageData(imgData, 0, 0);
  const srcCtx = sourceCanvas.getContext('2d');
  srcCtx.drawImage(lutCanvas, 0, 0, fullW, fullH);
}

// ============================================================
// VIDEO OVERLAY COMPOSITING
// ============================================================
function drawVideoOverlays(ctx, CW, CH) {
  for (const ov of state.videoOverlays) {
    if (ov.hidden) continue;
    // Built-in overlays (canvas-generated)
    if (ov.builtin) {
      drawBuiltinOverlay(ctx, CW, CH, ov);
      continue;
    }
    if (!ov.video || ov.video.readyState < 2) continue;
    ctx.save();
    ctx.globalAlpha = ov.opacity;
    ctx.globalCompositeOperation = ov.blendMode;
    const vw = ov.video.videoWidth, vh = ov.video.videoHeight;
    const vRatio = vw / vh, cRatio = CW / CH;
    let dw, dh, dx, dy;
    if (vRatio > cRatio) { dh = CH; dw = CH * vRatio; dx = (CW - dw) / 2; dy = 0; }
    else { dw = CW; dh = CW / vRatio; dx = 0; dy = (CH - dh) / 2; }
    safeDrawImage(ctx, ov.video, dx, dy, dw, dh);
    ctx.restore();
  }
}

function drawBuiltinOverlay(ctx, CW, CH, ov) {
  const t = performance.now() * 0.001;
  ctx.save();
  ctx.globalAlpha = ov.opacity;

  if (ov.builtin === 'filmGrain') {
    ctx.globalCompositeOperation = 'overlay';
    const imgData = safeGetImageData(ctx, 0, 0, Math.min(CW, 640), Math.min(CH, 640));
    if (!imgData) { ctx.restore(); return; }
    // Only process a sampled region for performance
    const grainCanvas = ov._cache || document.createElement('canvas');
    if (!ov._cache) { ov._cache = grainCanvas; grainCanvas.width = 320; grainCanvas.height = 320; }
    const gc = grainCanvas.getContext('2d');
    const gd = gc.createImageData(320, 320);
    const px = gd.data;
    for (let i = 0; i < px.length; i += 4) {
      const v = Math.random() * 255;
      px[i] = px[i+1] = px[i+2] = v; px[i+3] = 40;
    }
    gc.putImageData(gd, 0, 0);
    ctx.drawImage(grainCanvas, 0, 0, CW, CH);

  } else if (ov.builtin === 'lightLeak') {
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(
      CW * (0.3 + 0.4 * Math.sin(t * 0.5)), CH * (0.3 + 0.2 * Math.cos(t * 0.3)),
      0,
      CW * 0.5, CH * 0.5, CW * 0.7
    );
    const hue = (t * 20) % 360;
    g.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.4)`);
    g.addColorStop(0.4, `hsla(${(hue + 40) % 360}, 70%, 50%, 0.15)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
    // Second leak
    const g2 = ctx.createRadialGradient(
      CW * (0.7 + 0.2 * Math.cos(t * 0.4)), CH * (0.6 + 0.3 * Math.sin(t * 0.6)),
      0,
      CW * 0.6, CH * 0.4, CW * 0.5
    );
    g2.addColorStop(0, `hsla(${(hue + 180) % 360}, 70%, 55%, 0.25)`);
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, CW, CH);

  } else if (ov.builtin === 'bokehLights') {
    ctx.globalCompositeOperation = 'screen';
    if (!ov._bokeh || ov._bokeh.length === 0) {
      ov._bokeh = [];
      for (let i = 0; i < 20; i++) {
        ov._bokeh.push({
          x: Math.random(), y: Math.random(),
          r: 0.02 + Math.random() * 0.06,
          speed: 0.1 + Math.random() * 0.3,
          hue: Math.random() * 360,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
    for (const b of ov._bokeh) {
      const bx = CW * ((b.x + Math.sin(t * b.speed + b.phase) * 0.05) % 1);
      const by = CH * ((b.y + t * b.speed * 0.02) % 1);
      const br = Math.min(CW, CH) * b.r;
      const alpha = 0.15 + 0.1 * Math.sin(t * b.speed * 2 + b.phase);
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `hsla(${b.hue}, 60%, 70%, ${alpha})`);
      g.addColorStop(0.7, `hsla(${b.hue}, 60%, 70%, ${alpha * 0.3})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(bx - br, by - br, br * 2, br * 2);
    }

  } else if (ov.builtin === 'dust') {
    ctx.globalCompositeOperation = 'screen';
    if (!ov._dust || ov._dust.length === 0) {
      ov._dust = [];
      for (let i = 0; i < 60; i++) {
        ov._dust.push({
          x: Math.random(), y: Math.random(),
          size: 1 + Math.random() * 3,
          speed: 0.01 + Math.random() * 0.03,
          drift: (Math.random() - 0.5) * 0.02,
          alpha: 0.3 + Math.random() * 0.5
        });
      }
    }
    ctx.fillStyle = '#fff';
    for (const d of ov._dust) {
      const dx = CW * ((d.x + d.drift * t) % 1);
      const dy = CH * ((d.y - d.speed * t * 0.5) % 1 + 1) % CH;
      ctx.globalAlpha = ov.opacity * d.alpha * (0.5 + 0.5 * Math.sin(t * 2 + d.x * 10));
      ctx.beginPath();
      ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (ov.builtin === 'vignette') {
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createRadialGradient(CW/2, CH/2, CW * 0.25, CW/2, CH/2, CW * 0.75);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);

  } else if (ov.builtin === 'chromatic') {
    ctx.globalCompositeOperation = 'screen';
    const shift = 3 + 2 * Math.sin(t);
    ctx.globalAlpha = 0.15 * ov.opacity;
    ctx.drawImage(ctx.canvas, shift, 0, CW - shift, CH, 0, 0, CW - shift, CH);
    ctx.globalAlpha = 0.1 * ov.opacity;
    ctx.drawImage(ctx.canvas, 0, 0, CW - shift, CH, shift, 0, CW - shift, CH);

  } else if (ov.builtin === 'scanlines') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    for (let y = 0; y < CH; y += 4) {
      ctx.globalAlpha = 0.08 * ov.opacity;
      ctx.fillRect(0, y, CW, 2);
    }

  } else if (ov.builtin === 'filmBurn') {
    ctx.globalCompositeOperation = 'screen';
    const phase = t * 0.3;
    const g = ctx.createLinearGradient(
      CW * (0.5 + 0.5 * Math.sin(phase)), 0,
      CW * (0.5 + 0.5 * Math.cos(phase + 1)), CH
    );
    g.addColorStop(0, `hsla(30, 90%, 50%, ${0.15 + 0.1 * Math.sin(t)})`);
    g.addColorStop(0.3, `hsla(15, 80%, 40%, ${0.08 + 0.05 * Math.cos(t * 1.3)})`);
    g.addColorStop(0.6, 'transparent');
    g.addColorStop(1, `hsla(350, 70%, 30%, ${0.05 + 0.03 * Math.sin(t * 0.7)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
  }

  ctx.restore();
}

// CapCut draft importer
let importedKeyframes = [];

function parseCapcutDraft(json) {
  try {
    const draft = typeof json === 'string' ? JSON.parse(json) : json;
    const keyframes = [];

    // CapCut stores tracks > segments > common_keyframes
    const tracks = draft.tracks || draft.materials?.tracks || [];
    for (const track of tracks) {
      const segments = track.segments || track.segment_list || [];
      for (const seg of segments) {
        const kfGroups = seg.common_keyframes || seg.keyframes || [];
        for (const kfGroup of kfGroups) {
          const propType = kfGroup.property_type || kfGroup.type || '';
          const kfList = kfGroup.keyframe_list || kfGroup.keyframes || [];
          for (const kf of kfList) {
            const time = (kf.time_offset || kf.time || 0) / 1000000; // microseconds to seconds
            const values = kf.values || [0];
            keyframes.push({ time, property: propType, value: values[0], curve: kf.curveType || 'Linear' });
          }
        }

        // Also extract transform data
        const clip = seg.clip || {};
        const transform = clip.transform || {};
        if (transform.scale_x !== undefined) {
          const startTime = (seg.target_timerange?.start || 0) / 1000000;
          keyframes.push({ time: startTime, property: 'scale', value: transform.scale_x, curve: 'Linear' });
        }
        if (transform.rotation !== undefined) {
          const startTime = (seg.target_timerange?.start || 0) / 1000000;
          keyframes.push({ time: startTime, property: 'rotation', value: transform.rotation, curve: 'Linear' });
        }
        if (transform.position_x !== undefined) {
          const startTime = (seg.target_timerange?.start || 0) / 1000000;
          keyframes.push({ time: startTime, property: 'positionX', value: transform.position_x, curve: 'Linear' });
        }

        // Speed data for velocity edits
        if (clip.speed !== undefined && clip.speed !== 1) {
          const startTime = (seg.target_timerange?.start || 0) / 1000000;
          keyframes.push({ time: startTime, property: 'speed', value: clip.speed, curve: 'Linear' });
        }
      }
    }

    keyframes.sort((a, b) => a.time - b.time);
    return keyframes;
  } catch (e) {
    console.error('CapCut parse error:', e);
    return [];
  }
}

function interpolateImportedKeyframes(time) {
  if (importedKeyframes.length === 0) return { zoom: 1, panX: 0, panY: 0, rotation: 0 };

  let zoom = 1, panX = 0, panY = 0, rotation = 0;

  // Group by property
  const byProp = {};
  for (const kf of importedKeyframes) {
    if (!byProp[kf.property]) byProp[kf.property] = [];
    byProp[kf.property].push(kf);
  }

  function lerp(kfs, t) {
    if (kfs.length === 0) return 0;
    if (kfs.length === 1) return kfs[0].value;
    if (t <= kfs[0].time) return kfs[0].value;
    if (t >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;
    for (let i = 0; i < kfs.length - 1; i++) {
      if (t >= kfs[i].time && t <= kfs[i + 1].time) {
        const p = (t - kfs[i].time) / (kfs[i + 1].time - kfs[i].time);
        return kfs[i].value + (kfs[i + 1].value - kfs[i].value) * p;
      }
    }
    return kfs[kfs.length - 1].value;
  }

  if (byProp['scale'] || byProp['KFTypePositionScale']) {
    zoom = lerp(byProp['scale'] || byProp['KFTypePositionScale'], time);
    if (zoom > 0) zoom = zoom; else zoom = 1;
  }
  if (byProp['positionX'] || byProp['KFTypePositionX']) {
    panX = lerp(byProp['positionX'] || byProp['KFTypePositionX'], time) * state.animPreset.intensity;
  }
  if (byProp['positionY'] || byProp['KFTypePositionY']) {
    panY = lerp(byProp['positionY'] || byProp['KFTypePositionY'], time) * state.animPreset.intensity;
  }
  if (byProp['rotation'] || byProp['KFTypeRotation']) {
    rotation = lerp(byProp['rotation'] || byProp['KFTypeRotation'], time);
  }

  return { zoom, panX, panY, rotation };
}

// ============================================================
// CHROMA KEY (BACKGROUND REMOVER)
// ============================================================
let chromaCanvas = null, chromaCtx = null;

function getChromaKeyFrame(srcVideo) {
  if (!state.chromaKey.enabled || !srcVideo || srcVideo.readyState < 2) return null;

  const maxW = 640; // limit processing size for performance
  const vw = srcVideo.videoWidth, vh = srcVideo.videoHeight;
  const w = Math.min(vw, maxW);
  const h = Math.round(w * vh / vw);

  if (!chromaCanvas || chromaCanvas.width !== w || chromaCanvas.height !== h) {
    chromaCanvas = document.createElement('canvas');
    chromaCanvas.width = w;
    chromaCanvas.height = h;
    chromaCtx = chromaCanvas.getContext('2d', { willReadFrequently: true });
  }

  safeDrawImage(chromaCtx, srcVideo, 0, 0, w, h);
  const imageData = safeGetImageData(chromaCtx, 0, 0, w, h);
  if (!imageData) return null;
  const data = imageData.data;

  const ck = state.chromaKey;
  const r0 = parseInt(ck.color.substr(1,2), 16);
  const g0 = parseInt(ck.color.substr(3,2), 16);
  const b0 = parseInt(ck.color.substr(5,2), 16);
  const tol = ck.tolerance;
  const soft = ck.softness;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - r0;
    const dg = data[i+1] - g0;
    const db = data[i+2] - b0;
    const dist = Math.sqrt(dr*dr + dg*dg + db*db);

    if (dist < tol) {
      data[i+3] = 0; // fully transparent
    } else if (dist < tol + soft) {
      data[i+3] = Math.round(255 * (dist - tol) / soft);
    }
  }

  chromaCtx.putImageData(imageData, 0, 0);
  return chromaCanvas;
}

// ============================================================
// SCENE TEMPLATES
// ============================================================
// ============================================================
// FULL PRESET TEMPLATES
// ============================================================
const FULL_PRESETS = {
  appShowcase: {
    device: { type: 'iphone16', color: 'black' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'gradient', color: '#0a0a0a', gradient: { enabled:true, color1:'#000000', color2:'#1a1a2e', color3:'#000000', angle:90, animated:false, speed:0 } },
    shadow: 0.8, lut: 'cinematic', overlays: ['vignette'],
    entrance: { type: 'scaleIn', duration: 1000 }, animPreset: 'none',
    particles: { enabled:true, type:'bokeh', count:10, color:'#fbbf24', speed:0.15 },
    orbit: { enabled:true, speed:0.1, range:4 },
    text: [{ content: 'Your App Name', fontSize: 44, color: '#ffffff', weight: '700', yPct: 0.07 }],
  },
  tiktokViral: {
    device: { type: 'iphone16', color: 'pink' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'gradient', color: '#0a0a0a', gradient: { enabled:true, color1:'#f97316', color2:'#db2777', color3:'#7c3aed', angle:160, animated:true, speed:0.3 } },
    shadow: 0.5, lut: 'warmVintage', overlays: ['filmGrain'],
    entrance: { type: 'slideUp', duration: 800 }, animPreset: 'zoomBeat',
    particles: { enabled:true, type:'bokeh', count:15, color:'#fbbf24', speed:0.2 },
    orbit: { enabled:false },
    text: [{ content: 'Watch This', fontSize: 52, color: '#ffffff', weight: '900', yPct: 0.06 }],
  },
  cleanProduct: {
    device: { type: 'iphone16', color: 'white' },
    preset: 'reels', scale: 0.42,
    bg: { type: 'solid', color: '#f5f5f5', gradient: { enabled:false } },
    shadow: 0.3, lut: null, overlays: [],
    entrance: { type: 'fadeIn', duration: 800 }, animPreset: 'none',
    particles: { enabled:false }, orbit: { enabled:false },
    text: [],
  },
  darkCinematic: {
    device: { type: 'iphone16', color: 'black' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'gradient', color: '#0a0a0a', gradient: { enabled:true, color1:'#000000', color2:'#0f0f1a', color3:'#000000', angle:180, animated:false, speed:0 } },
    shadow: 1.0, lut: 'moody', overlays: ['filmBurn', 'vignette'],
    entrance: { type: 'fadeIn', duration: 1500 }, animPreset: 'cinematicPan',
    particles: { enabled:false }, orbit: { enabled:true, speed:0.08, range:3 },
    text: [],
  },
  neonPop: {
    device: { type: 'iphone16', color: 'blue' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'gradient', color: '#0a0a0a', gradient: { enabled:true, color1:'#0a0015', color2:'#1a0030', color3:'#0a0015', angle:180, animated:true, speed:0.8 } },
    shadow: 1.0, lut: 'coolTeal', overlays: ['chromatic'],
    entrance: { type: 'scaleIn', duration: 600 }, animPreset: 'none',
    particles: { enabled:true, type:'sparkle', count:20, color:'#c084fc', speed:0.4 },
    orbit: { enabled:false },
    text: [],
  },
  cleanSocial: {
    device: { type: 'none', color: 'default' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'solid', color: '#0a0a0a', gradient: { enabled:false } },
    shadow: 0, lut: 'orangeTeal', overlays: ['vignette'],
    entrance: { type: 'none', duration: 1000 }, animPreset: 'none',
    particles: { enabled:false }, orbit: { enabled:false },
    text: [],
  },
  retroFilm: {
    device: { type: 'iphone16', color: 'titanium' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'gradient', color: '#0a0a0a', gradient: { enabled:true, color1:'#1a1008', color2:'#2a1a10', color3:'#1a1008', angle:135, animated:false, speed:0 } },
    shadow: 0.6, lut: 'warmVintage', overlays: ['filmGrain', 'scanlines', 'vignette'],
    entrance: { type: 'fadeIn', duration: 1200 }, animPreset: 'none',
    particles: { enabled:true, type:'bokeh', count:8, color:'#fbbf2440', speed:0.1 },
    orbit: { enabled:false },
    text: [],
  },
  laptopReview: {
    device: { type: 'macbookpro', color: 'spaceblack' },
    preset: 'youtube', scale: 0.55,
    bg: { type: 'gradient', color: '#0a0a0a', gradient: { enabled:true, color1:'#0c4a6e', color2:'#155e75', color3:'#164e63', angle:180, animated:true, speed:0.4 } },
    shadow: 0.6, lut: 'cinematic', overlays: ['vignette'],
    entrance: { type: 'scaleIn', duration: 1000 }, animPreset: 'none',
    particles: { enabled:true, type:'bokeh', count:12, color:'#22d3ee', speed:0.2 },
    orbit: { enabled:true, speed:0.1, range:5 },
    text: [],
  },
  rawVideo: {
    device: { type: 'none', color: 'default' },
    preset: 'reels', scale: 0.45,
    bg: { type: 'solid', color: '#000000', gradient: { enabled:false } },
    shadow: 0, lut: null, overlays: [],
    entrance: { type: 'none', duration: 1000 }, animPreset: 'none',
    particles: { enabled:false }, orbit: { enabled:false },
    text: [],
  },
  ipadPresent: {
    device: { type: 'ipadpro', color: 'spaceblack' },
    preset: 'reels', scale: 0.50,
    bg: { type: 'solid', color: '#f5f5f5', gradient: { enabled:false } },
    shadow: 0.4, lut: null, overlays: [],
    entrance: { type: 'fadeIn', duration: 800 }, animPreset: 'none',
    particles: { enabled:false }, orbit: { enabled:false },
    text: [],
  },
};

// ============================================================
// DEVICE POSITION PRESETS
// ============================================================
const DEVICE_PRESETS = {
  phoneLeft: {
    name: 'Phone Left',
    device: { x: -180, y: 0, scale: 0.45, landscape: false },
    perspective: { x: 3, y: -2 },
  },
  phoneRight: {
    name: 'Phone Right',
    device: { x: 180, y: 0, scale: 0.45, landscape: false },
    perspective: { x: -3, y: -2 },
  },
  phoneCenterZoom: {
    name: 'Center Zoom',
    device: { x: 0, y: 0, scale: 0.6, landscape: false },
    perspective: { x: 0, y: 0 },
  },
  dualComparison: {
    name: 'Dual Comparison',
    device: { x: -100, y: 0, scale: 0.38, landscape: false },
    perspective: { x: 2, y: 0 },
    comparison: { enabled: true, x: 100, y: 0 },
  },
  tilt3D: {
    name: '3D Tilt Showcase',
    device: { x: 0, y: -20, scale: 0.48, landscape: false },
    perspective: { x: 8, y: -5 },
    shadow: 0.9,
  },
  landscapeView: {
    name: 'Landscape Mode',
    device: { x: 0, y: 0, scale: 0.55, landscape: true },
    perspective: { x: 0, y: -2 },
  },
  floatingAbove: {
    name: 'Floating Above',
    device: { x: 0, y: -60, scale: 0.42, landscape: false },
    perspective: { x: 0, y: -6 },
    shadow: 1.0,
  },
  bottomCorner: {
    name: 'Bottom Corner',
    device: { x: 120, y: 80, scale: 0.35, landscape: false },
    perspective: { x: -4, y: 2 },
  },
  laptopDesk: {
    name: 'Laptop Desk View',
    device: { x: 0, y: 20, scale: 0.58, landscape: false },
    perspective: { x: 0, y: -8 },
    shadow: 0.7,
  },
  tabletPresenter: {
    name: 'Tablet Presenter',
    device: { x: 0, y: -10, scale: 0.52, landscape: false },
    perspective: { x: 0, y: -4 },
    shadow: 0.6,
  },
};

function applyFullPreset(key) {
  const fp = FULL_PRESETS[key];
  if (!fp) return;

  // --- Reset everything first ---
  // Reset render stack to default order
  state.renderStack = [
    { id: 'bgVideo', name: 'BG Video', icon: '🎬' },
    { id: 'particles', name: 'Particles', icon: '✨' },
    { id: 'device', name: 'Device', icon: '📱' },
    { id: 'device2', name: 'Device 2', icon: '📲' },
    { id: 'content', name: 'Content', icon: 'T' },
    { id: 'facecam', name: 'Facecam', icon: '📷' },
    { id: 'videoOverlays', name: 'Overlays', icon: '🎞' },
    { id: 'uiOverlays', name: 'UI Effects', icon: '📊' },
  ];
  // Clear layers (text only - keep user's logos/annotations)
  state.layers = state.layers.filter(l => l.type !== 'text');
  // Clear video overlays (built-in only)
  state.videoOverlays = state.videoOverlays.filter(ov => !ov.builtin);
  document.querySelectorAll('#builtinOverlayGrid .dev-btn').forEach(b => b.classList.remove('active'));
  // Reset LUT
  state.lut = { enabled: false, data: null, size: 0, intensity: 1.0, name: '' };

  // --- Apply device ---
  state.device.type = fp.device.type;
  state.device.color = fp.device.color;
  state.device.scale = fp.scale;
  frameCache = {};
  // Update device grid UI
  document.querySelectorAll('#deviceGrid .dev-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.device === fp.device.type);
  });
  updateColorSwatches();

  // --- Apply export preset ---
  state.preset = fp.preset;
  document.getElementById('presetSelect').value = fp.preset;
  document.getElementById('customSizeWrap').style.display = fp.preset === 'custom' ? '' : 'none';

  // --- Apply background ---
  state.bgType = fp.bg.type;
  state.background.color = fp.bg.color;
  document.getElementById('bgType').value = fp.bg.type;
  document.getElementById('bgColor').value = fp.bg.color;
  document.getElementById('bgSolidControls').style.display = fp.bg.type === 'solid' ? 'block' : 'none';
  document.getElementById('bgGradientControls').style.display = fp.bg.type === 'gradient' ? 'block' : 'none';
  canvasWrap.classList.remove('checker-bg');

  if (fp.bg.gradient) {
    Object.assign(state.gradient, fp.bg.gradient);
    if (fp.bg.gradient.color1) document.getElementById('gradColor1').value = fp.bg.gradient.color1;
    if (fp.bg.gradient.color2) document.getElementById('gradColor2').value = fp.bg.gradient.color2;
    if (fp.bg.gradient.color3) document.getElementById('gradColor3').value = fp.bg.gradient.color3;
  }

  // --- Apply shadow ---
  state.shadow = fp.shadow;
  document.getElementById('shadowSlider').value = Math.round(fp.shadow * 100);

  // --- Apply scale + transform ---
  state.device.scale = fp.scale;
  document.getElementById('scaleSlider').value = Math.round(fp.scale * 100);
  document.getElementById('scaleVal').textContent = Math.round(fp.scale * 100) + '%';
  state.perspective = { x: 0, y: 0 };
  document.getElementById('tiltX').value = 0;
  document.getElementById('tiltY').value = 0;

  // --- Apply LUT ---
  if (fp.lut) {
    const lutData = generateLUTPreset(fp.lut);
    state.lut = { enabled: true, data: lutData, size: lutData.size, intensity: 1.0, name: fp.lut };
    document.getElementById('lutInfo').innerHTML = '<span style="color:#4ade80">Active:</span> ' + fp.lut;
    document.getElementById('lutControls').style.display = 'block';
    document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lutPreset === fp.lut);
    });
  } else {
    document.getElementById('lutInfo').textContent = '';
    document.getElementById('lutControls').style.display = 'none';
    document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
  }

  // --- Apply built-in overlays ---
  for (const ovType of (fp.overlays || [])) {
    const existing = state.videoOverlays.find(ov => ov.builtin === ovType);
    if (!existing) {
      state.videoOverlays.push({ id: Date.now() + Math.random(), builtin: ovType, name: ovType, opacity: 0.5, blendMode: 'screen' });
    }
    const btn = document.querySelector(`#builtinOverlayGrid .dev-btn[data-builtin="${ovType}"]`);
    if (btn) btn.classList.add('active');
  }
  rebuildOverlayList();

  // --- Apply entrance ---
  state.entrance = { type: fp.entrance.type, duration: fp.entrance.duration };
  document.getElementById('entranceSelect').value = fp.entrance.type;
  document.getElementById('entranceDur').value = fp.entrance.duration;
  document.getElementById('entranceDurVal').textContent = (fp.entrance.duration / 1000).toFixed(1) + 's';

  // --- Apply animation preset ---
  state.animPreset.type = fp.animPreset;
  document.querySelectorAll('#animPresetGrid .dev-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === fp.animPreset);
  });

  // --- Apply particles ---
  if (fp.particles) {
    Object.assign(state.particles, fp.particles);
    document.getElementById('particleType').value = fp.particles.enabled ? fp.particles.type : 'off';
    state._particles = [];
  }

  // --- Apply orbit ---
  if (fp.orbit) {
    Object.assign(state.orbit, fp.orbit);
    document.getElementById('orbitToggle').value = String(fp.orbit.enabled);
  }

  // --- Add text placeholders ---
  const sz = getCanvasSize();
  for (const t of (fp.text || [])) {
    state.layers.push({
      id: state.nextLayerId++, type: 'text',
      content: t.content, x: sz.w / 2, y: sz.h * (t.yPct || 0.08),
      fontSize: t.fontSize, fontFamily: t.fontFamily || 'SF Pro Display, -apple-system, sans-serif',
      color: t.color, weight: t.weight, align: 'center',
      shadow: 0, outline: 0,
    });
  }

  // --- Update UI state ---
  resizeCanvas();
  updatePerspective();
  updateDisplaySize();

  // Update full preset grid
  document.querySelectorAll('#fullPresetGrid .preset-card').forEach(b => {
    b.classList.toggle('active', b.dataset.fp === key);
  });

  // Reset scene grid (full presets supersede scene templates)
  document.querySelectorAll('#sceneGrid .dev-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#sceneGrid .dev-btn[data-scene="custom"]').classList.add('active');
}

const SCENES = {
  custom: null,
  floating: {
    gradient: { enabled:true, color1:'#0f0c29', color2:'#302b63', color3:'#24243e', angle:135, animated:true, speed:0.5 },
    particles: { enabled:true, type:'bokeh', count:25, color:'#8b5cf6', speed:0.3 },
    shadow:0.8, orbit:{ enabled:true, speed:0.2, range:8 },
  },
  neon: {
    gradient: { enabled:true, color1:'#0a0015', color2:'#1a0030', color3:'#0a0015', angle:180, animated:true, speed:0.8 },
    particles: { enabled:true, type:'sparkle', count:20, color:'#c084fc', speed:0.4 },
    shadow:1.0, orbit:{ enabled:false },
  },
  sunset: {
    gradient: { enabled:true, color1:'#f97316', color2:'#db2777', color3:'#7c3aed', angle:160, animated:true, speed:0.3 },
    particles: { enabled:true, type:'bokeh', count:15, color:'#fbbf24', speed:0.2 },
    shadow:0.5, orbit:{ enabled:false },
  },
  minimal: { gradient:{ enabled:false }, bg:'#f5f5f5', particles:{ enabled:false }, shadow:0.3, orbit:{ enabled:false } },
  ocean: {
    gradient: { enabled:true, color1:'#0c4a6e', color2:'#155e75', color3:'#164e63', angle:180, animated:true, speed:0.4 },
    particles: { enabled:true, type:'bokeh', count:20, color:'#22d3ee', speed:0.3 },
    shadow:0.6, orbit:{ enabled:true, speed:0.15, range:5 },
  },
  forest: {
    gradient: { enabled:true, color1:'#052e16', color2:'#14532d', color3:'#1a2e05', angle:170, animated:true, speed:0.3 },
    particles: { enabled:true, type:'snow', count:15, color:'#86efac', speed:0.2 },
    shadow:0.5, orbit:{ enabled:false },
  },
  cinematic: {
    gradient: { enabled:true, color1:'#000000', color2:'#1a1a2e', color3:'#000000', angle:90, animated:false, speed:0 },
    particles: { enabled:true, type:'bokeh', count:10, color:'#fbbf24', speed:0.15 },
    shadow:1.0, orbit:{ enabled:true, speed:0.1, range:4 }, motionBlur:true,
  },
};
function applyScene(name) {
  state.scene = name;
  const scene = SCENES[name];
  if (!scene) return;
  // Always remove transparent mode when applying a scene
  canvasWrap.classList.remove('checker-bg');
  if (scene.gradient) {
    Object.assign(state.gradient, scene.gradient);
    state.bgType = scene.gradient.enabled ? 'gradient' : 'solid';
    document.getElementById('bgType').value = state.bgType;
    document.getElementById('bgSolidControls').style.display = scene.gradient.enabled ? 'none' : 'block';
    document.getElementById('bgGradientControls').style.display = scene.gradient.enabled ? 'block' : 'none';
    if (scene.gradient.enabled) {
      document.getElementById('gradColor1').value = scene.gradient.color1;
      document.getElementById('gradColor2').value = scene.gradient.color2;
      document.getElementById('gradColor3').value = scene.gradient.color3;
    }
  }
  if (scene.bg) { state.background.color = scene.bg; document.getElementById('bgColor').value = scene.bg; }
  if (scene.particles) {
    Object.assign(state.particles, scene.particles);
    document.getElementById('particleType').value = scene.particles.enabled ? scene.particles.type : 'off';
    state._particles = [];
  }
  if (scene.shadow !== undefined) { state.shadow = scene.shadow; document.getElementById('shadowSlider').value = scene.shadow*100; }
  if (scene.orbit) { Object.assign(state.orbit, scene.orbit); document.getElementById('orbitToggle').value = String(scene.orbit.enabled); }
  if (scene.motionBlur !== undefined) { state.motionBlur.enabled = scene.motionBlur; document.getElementById('motionBlurToggle').value = String(scene.motionBlur); }
}

function applyDevicePreset(key) {
  const preset = DEVICE_PRESETS[key];
  if (!preset) return;

  pushUndoState();

  // Apply device position and scale
  if (preset.device) {
    if (preset.device.x !== undefined) state.device.x = preset.device.x;
    if (preset.device.y !== undefined) state.device.y = preset.device.y;
    if (preset.device.scale !== undefined) state.device.scale = preset.device.scale;
    if (preset.device.landscape !== undefined) state.device.landscape = preset.device.landscape;
  }

  // Apply perspective
  if (preset.perspective) {
    state.perspective.x = preset.perspective.x;
    state.perspective.y = preset.perspective.y;
    updatePerspective();
  }

  // Apply shadow
  if (preset.shadow !== undefined) {
    state.shadow = preset.shadow;
    document.getElementById('shadowSlider').value = preset.shadow * 100;
  }

  // Apply comparison mode
  if (preset.comparison) {
    state.comparison.enabled = true;
    if (preset.comparison.x !== undefined) state.comparison.x = preset.comparison.x;
    if (preset.comparison.y !== undefined) state.comparison.y = preset.comparison.y;
  }

  // Update UI and render
  frameCache = {};
  resizeCanvas();
  updateDisplaySize();
  scheduleSave();

  showToast(`Device preset: ${preset.name}`, 'info');
}

// ============================================================
// ENTRANCE ANIMATION
// ============================================================
function getEntranceTransform(elapsed) {
  const e = state.entrance;
  if (e.type === 'none') return { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };
  const t = Math.min(1, elapsed / e.duration);
  const ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2; // ease in-out quad

  switch (e.type) {
    case 'fadeIn':
      return { opacity: ease, x: 0, y: 0, scale: 1, rotate: 0 };
    case 'slideUp':
      return { opacity: ease, x: 0, y: (1 - ease) * 300, scale: 1, rotate: 0 };
    case 'scaleIn':
      return { opacity: ease, x: 0, y: 0, scale: 0.3 + ease * 0.7, rotate: 0 };
    case 'rotateIn':
      return { opacity: ease, x: 0, y: 0, scale: 0.5 + ease * 0.5, rotate: (1 - ease) * -15 };
    default:
      return { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };
  }
}

// ============================================================
// KEYFRAME INTERPOLATION
// ============================================================
function getKeyframeValues(time) {
  const kfs = state.timeline.keyframes;
  if (kfs.length === 0) return { zoom: 1, panX: 0, panY: 0 };
  if (kfs.length === 1) return { zoom: kfs[0].zoom, panX: kfs[0].panX, panY: kfs[0].panY };

  // Find surrounding keyframes
  let before = kfs[0], after = kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (time >= kfs[i].time && time <= kfs[i+1].time) {
      before = kfs[i];
      after = kfs[i+1];
      break;
    }
  }
  if (time <= before.time) return { zoom: before.zoom, panX: before.panX, panY: before.panY };
  if (time >= after.time) return { zoom: after.zoom, panX: after.panX, panY: after.panY };

  const t = (time - before.time) / (after.time - before.time);
  const ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
  return {
    zoom: before.zoom + (after.zoom - before.zoom) * ease,
    panX: before.panX + (after.panX - before.panX) * ease,
    panY: before.panY + (after.panY - before.panY) * ease,
  };
}

// ============================================================
// DEVICE KEYFRAME INTERPOLATION
// ============================================================
function getDeviceKeyframeValues(time) {
  const keyframes = state.deviceKeyframes || [];
  if (keyframes.length === 0) {
    return {
      x: state.device.x,
      y: state.device.y,
      scale: state.device.scale,
      rotation: 0,
      perspectiveX: state.perspective.x,
      perspectiveY: state.perspective.y
    };
  }

  // Find surrounding keyframes
  let prev = null, next = null;
  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].time <= time) prev = keyframes[i];
    if (keyframes[i].time > time) { next = keyframes[i]; break; }
  }

  // Before first keyframe - use first keyframe values
  if (!prev) return { ...keyframes[0] };

  // After last keyframe - use last keyframe values
  if (!next) return { ...prev };

  // Interpolate between prev and next
  const duration = next.time - prev.time;
  const elapsed = time - prev.time;
  let t = duration > 0 ? elapsed / duration : 0;

  // Ease in-out quad
  t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  return {
    x: prev.x + (next.x - prev.x) * t,
    y: prev.y + (next.y - prev.y) * t,
    scale: prev.scale + (next.scale - prev.scale) * t,
    rotation: prev.rotation + (next.rotation - prev.rotation) * t,
    perspectiveX: prev.perspectiveX + (next.perspectiveX - prev.perspectiveX) * t,
    perspectiveY: prev.perspectiveY + (next.perspectiveY - prev.perspectiveY) * t
  };
}

// ============================================================
// ENTRANCE ANIMATION
// ============================================================
entranceSelect.addEventListener('change', e => { state.entrance.type = e.target.value; });
entranceDur.addEventListener('input', e => {
  state.entrance.duration = parseInt(e.target.value);
  entranceDurVal.textContent = (parseInt(e.target.value) / 1000).toFixed(1) + 's';
});

// ============================================================
