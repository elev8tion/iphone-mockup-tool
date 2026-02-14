// EFFECT UI EVENT HANDLERS
// ============================================================
// UI event handlers for audio and video effects

// ============================================================
// INITIALIZE EFFECTS ON VIDEO/AUDIO LOAD
// ============================================================

// Initialize audio effects when audio element is loaded
function initializeAudioEffectsForTrack(trackName) {
  const chain = initAudioChain(trackName);
  if (chain) {
    updateAudioEffects(trackName);
    showToast(`Audio effects ready for ${trackName}`, 'success');
  }
}

// ============================================================
// SLIDER VALIDATION HELPERS
// ============================================================

function clampRangeValue(inputEl) {
  if (!inputEl) return 0;
  let val = parseFloat(inputEl.value);
  const hasMin = inputEl.min !== undefined && inputEl.min !== '' && !isNaN(parseFloat(inputEl.min));
  const hasMax = inputEl.max !== undefined && inputEl.max !== '' && !isNaN(parseFloat(inputEl.max));
  const min = hasMin ? parseFloat(inputEl.min) : -Infinity;
  const max = hasMax ? parseFloat(inputEl.max) : Infinity;
  if (isNaN(val)) val = hasMin ? min : 0;
  if (val < min) val = min;
  if (val > max) val = max;
  inputEl.value = String(val);
  return val;
}

function applyExtremeValueFeedback(inputEl, isExtreme) {
  const valueLabel = inputEl?.nextElementSibling;
  if (valueLabel && valueLabel.classList && valueLabel.classList.contains('value')) {
    valueLabel.style.color = isExtreme ? '#ff6b6b' : '';
  }
}

function addResetButtonForSlider(inputEl) {
  if (!inputEl || inputEl.dataset.resetAttached === '1') return;
  const defaultVal = inputEl.getAttribute('value') ?? inputEl.value;
  inputEl.dataset.defaultVal = defaultVal;

  const btn = document.createElement('button');
  btn.textContent = '↺';
  btn.title = 'Reset to default';
  btn.className = 'slider-reset-btn';
  btn.style.marginLeft = '6px';
  btn.style.fontSize = '11px';
  btn.style.lineHeight = '1';
  btn.style.padding = '0 4px';
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    inputEl.value = inputEl.dataset.defaultVal ?? defaultVal;
    // Trigger existing handlers to update state and labels
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const valueLabel = inputEl.nextElementSibling;
  if (valueLabel && valueLabel.classList && valueLabel.classList.contains('value')) {
    valueLabel.after(btn);
  } else {
    inputEl.after(btn);
  }

  inputEl.dataset.resetAttached = '1';
}

function augmentEffectSliders() {
  const panels = document.querySelectorAll('.effects-panel input[type="range"]');
  panels.forEach(addResetButtonForSlider);
}

// ============================================================
// TOGGLE EFFECTS PANELS
// ============================================================

// Background Audio Effects Toggle
document.getElementById('bgAudioEffectsToggle')?.addEventListener('click', () => {
  const section = document.getElementById('bgAudioEffectsSection');
  section.classList.toggle('collapsed');
});

// Background Video Effects Toggle
document.getElementById('bgVideoEffectsToggle')?.addEventListener('click', () => {
  const section = document.getElementById('bgVideoEffectsSection');
  section.classList.toggle('collapsed');
});

// Main Video Effects Toggle
document.getElementById('mainVideoEffectsToggle')?.addEventListener('click', () => {
  const section = document.getElementById('mainVideoEffectsSection');
  section.classList.toggle('collapsed');
});

// ============================================================
// AUDIO EFFECT CONTROLS - Background Audio
// ============================================================

// Volume
document.getElementById('bgAudioVolumeFX')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseFloat(v) / 100;
  state.audioEffects.bgAudio.volume = value;
  updateAudioEffects('bgAudio');
  e.target.nextElementSibling.textContent = Math.round(value * 100) + '%';
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Pan
document.getElementById('bgAudioPan')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseFloat(v) / 100;
  state.audioEffects.bgAudio.pan = value;
  updateAudioEffects('bgAudio');
  const label = value < -0.1 ? `L ${Math.abs(Math.round(value * 100))}` :
                value > 0.1 ? `R ${Math.round(value * 100)}` : 'Center';
  e.target.nextElementSibling.textContent = label;
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// EQ Low
document.getElementById('bgAudioEQLow')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseFloat(v);
  state.audioEffects.bgAudio.eq.low = value;
  updateAudioEffects('bgAudio');
  e.target.nextElementSibling.textContent = value.toFixed(1) + ' dB';
  drawEQGraph('bgAudio');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// EQ Mid
document.getElementById('bgAudioEQMid')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseFloat(v);
  state.audioEffects.bgAudio.eq.mid = value;
  updateAudioEffects('bgAudio');
  e.target.nextElementSibling.textContent = value.toFixed(1) + ' dB';
  drawEQGraph('bgAudio');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// EQ High
document.getElementById('bgAudioEQHigh')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseFloat(v);
  state.audioEffects.bgAudio.eq.high = value;
  updateAudioEffects('bgAudio');
  e.target.nextElementSibling.textContent = value.toFixed(1) + ' dB';
  drawEQGraph('bgAudio');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Compressor Enable
document.getElementById('bgAudioCompressorEnable')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.compressor.enabled = e.target.checked;
  updateAudioEffects('bgAudio');
  document.getElementById('bgAudioCompressorControls').style.display = e.target.checked ? 'block' : 'none';
  scheduleSave();
});

// Compressor Threshold
document.getElementById('bgAudioCompThreshold')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseFloat(v);
  state.audioEffects.bgAudio.compressor.threshold = value;
  updateAudioEffects('bgAudio');
  e.target.nextElementSibling.textContent = value + ' dB';
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Compressor Ratio
document.getElementById('bgAudioCompRatio')?.addEventListener('change', (e) => {
  const value = parseFloat(e.target.value);
  state.audioEffects.bgAudio.compressor.ratio = value;
  updateAudioEffects('bgAudio');
  scheduleSave();
});

// Reverb Enable
document.getElementById('bgAudioReverbEnable')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.reverb.enabled = e.target.checked;
  updateAudioEffects('bgAudio');
  scheduleSave();
});

// Echo Enable
document.getElementById('bgAudioEchoEnable')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.echo.enabled = e.target.checked;
  updateAudioEffects('bgAudio');
  scheduleSave();
});

// Presets
document.getElementById('bgAudioPreset')?.addEventListener('change', (e) => {
  if (e.target.value) {
    pushUndoState();
    loadAudioPreset('bgAudio', e.target.value);
    showToast(`Loaded preset: ${e.target.value}`, 'success');
    e.target.value = '';
  }
});

// Save Custom Preset
document.getElementById('bgAudioSavePreset')?.addEventListener('click', () => {
  const name = prompt('Enter preset name:');
  if (name) {
    saveCustomPreset('audio', 'bgAudio', name, state.audioEffects.bgAudio);
  }
});

// Solo/Mute Buttons
document.querySelectorAll('.solo-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const track = e.target.dataset.track;
    const isSolo = btn.classList.toggle('active');
    state.audioEffects[track].solo = isSolo;

    if (isSolo) {
      // Mute all other tracks
      Object.keys(state.audioEffects).forEach(t => {
        if (t !== track) {
          const chain = audioChains[t];
          if (chain) chain.setVolume(0);
        }
      });
    } else {
      // Restore volumes
      Object.keys(state.audioEffects).forEach(t => {
        const chain = audioChains[t];
        if (chain) chain.setVolume(state.audioEffects[t].volume);
      });
    }
  });
});

document.querySelectorAll('.mute-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const track = e.target.dataset.track;
    const isMuted = btn.classList.toggle('active');
    state.audioEffects[track].mute = isMuted;

    const chain = audioChains[track];
    if (chain) {
      chain.setVolume(isMuted ? 0 : state.audioEffects[track].volume);
    }
  });
});

// ============================================================
// VIDEO EFFECT CONTROLS - Background Video
// ============================================================

// Brightness
document.getElementById('bgVideoBrightness')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.bgVideo.brightness = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('bgVideo');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Contrast
document.getElementById('bgVideoContrast')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.bgVideo.contrast = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('bgVideo');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Saturation
document.getElementById('bgVideoSaturation')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.bgVideo.saturation = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('bgVideo');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Hue
document.getElementById('bgVideoHue')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.bgVideo.hue = value;
  e.target.nextElementSibling.textContent = value + '°';
  applyVideoEffectsToElement('bgVideo');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Temperature
document.getElementById('bgVideoTemp')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.bgVideo.temperature = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('bgVideo');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Add Effect
document.getElementById('bgVideoAddEffect')?.addEventListener('change', (e) => {
  if (e.target.value) {
    pushUndoState();
    addVideoEffect('bgVideo', e.target.value);
    e.target.value = '';
    scheduleSave();
  }
});

// Blend Mode
document.getElementById('bgVideoBlendMode')?.addEventListener('change', (e) => {
  state.videoEffects.bgVideo.blendMode = e.target.value;
  scheduleSave();
});

// Preset
document.getElementById('bgVideoPreset')?.addEventListener('change', (e) => {
  if (e.target.value) {
    pushUndoState();
    loadVideoPreset('bgVideo', e.target.value);
    showToast(`Loaded preset: ${e.target.value}`, 'success');
    e.target.value = '';
  }
});

// Save Custom Preset
document.getElementById('bgVideoSavePreset')?.addEventListener('click', () => {
  const name = prompt('Enter preset name:');
  if (name) {
    saveCustomPreset('video', 'bgVideo', name, state.videoEffects.bgVideo);
  }
});

// ============================================================
// VIDEO EFFECT CONTROLS - Main Video
// ============================================================

// Brightness
document.getElementById('mainVideoBrightness')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.main.brightness = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('main');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Contrast
document.getElementById('mainVideoContrast')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.main.contrast = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('main');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Saturation
document.getElementById('mainVideoSaturation')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.main.saturation = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('main');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Hue
document.getElementById('mainVideoHue')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.main.hue = value;
  e.target.nextElementSibling.textContent = value + '°';
  applyVideoEffectsToElement('main');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Temperature
document.getElementById('mainVideoTemp')?.addEventListener('input', (e) => {
  const v = clampRangeValue(e.target);
  const value = parseInt(v);
  state.videoEffects.main.temperature = value;
  e.target.nextElementSibling.textContent = value;
  applyVideoEffectsToElement('main');
  applyExtremeValueFeedback(e.target, v === parseFloat(e.target.min) || v === parseFloat(e.target.max));
  scheduleSave();
});

// Add Effect
document.getElementById('mainVideoAddEffect')?.addEventListener('change', (e) => {
  if (e.target.value) {
    pushUndoState();
    addVideoEffect('main', e.target.value);
    e.target.value = '';
    scheduleSave();
  }
});

// Preset
document.getElementById('mainVideoPreset')?.addEventListener('change', (e) => {
  if (e.target.value) {
    pushUndoState();
    loadVideoPreset('main', e.target.value);
    showToast(`Loaded preset: ${e.target.value}`, 'success');
    e.target.value = '';
  }
});

// Save Custom Preset
document.getElementById('mainVideoSavePreset')?.addEventListener('click', () => {
  const name = prompt('Enter preset name:');
  if (name) {
    saveCustomPreset('video', 'main', name, state.videoEffects.main);
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Apply video effects to element (CSS filters)
function applyVideoEffectsToElement(trackName) {
  let videoEl = null;

  if (trackName === 'main') {
    videoEl = document.getElementById('srcVideo');
  } else if (trackName === 'bgVideo') {
    videoEl = document.getElementById('bgVideo');
  }

  if (!videoEl) return;

  const effects = state.videoEffects[trackName];
  const processor = videoProcessors[trackName];

  processor.applyCSSFilters(videoEl, effects);
}

// Add video effect to stack
function addVideoEffect(trackName, effectType) {
  const effects = state.videoEffects[trackName];

  const newEffect = { type: effectType, id: Date.now() };

  switch (effectType) {
    case 'blur':
      newEffect.amount = 5;
      break;
    case 'pixelate':
      newEffect.blockSize = 10;
      break;
    case 'posterize':
      newEffect.levels = 8;
      break;
    case 'sepia':
      newEffect.amount = 100;
      break;
  }

  effects.filters.push(newEffect);
  updateVideoEffectStack(trackName);
  applyVideoEffectsToElement(trackName);
  showToast(`Added ${effectType} effect`, 'success');
}

// Remove video effect from stack
function removeVideoEffect(trackName, effectId) {
  const effects = state.videoEffects[trackName];
  effects.filters = effects.filters.filter(f => f.id !== effectId);
  updateVideoEffectStack(trackName);
  applyVideoEffectsToElement(trackName);
}

// Update video effect stack UI
function updateVideoEffectStack(trackName) {
  const stackEl = document.getElementById(`${trackName}VideoEffectStack`);
  if (!stackEl) return;

  const effects = state.videoEffects[trackName].filters;

  if (effects.length === 0) {
    stackEl.innerHTML = '<span style="font-size: 10px; color: #666;">No effects added</span>';
    return;
  }

  stackEl.innerHTML = effects.map(effect => `
    <div class="effect-stack-item">
      <span class="effect-name">${effect.type}</span>
      <div class="effect-controls">
        <button onclick="removeVideoEffect('${trackName}', ${effect.id})">✕</button>
      </div>
    </div>
  `).join('');
}

// Draw EQ graph
function drawEQGraph(trackName) {
  const canvas = document.getElementById(`${trackName}EQGraph`);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const eq = state.audioEffects[trackName].eq;
  const bands = [
    { freq: 'Low', gain: eq.low, x: w * 0.25 },
    { freq: 'Mid', gain: eq.mid, x: w * 0.5 },
    { freq: 'High', gain: eq.high, x: w * 0.75 }
  ];

  // Draw zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  // Draw EQ curve
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const y = h / 2 - (band.gain / 12) * (h / 2);

    if (i === 0) {
      ctx.moveTo(band.x, y);
    } else {
      ctx.lineTo(band.x, y);
    }
  }

  ctx.stroke();

  // Draw points
  bands.forEach(band => {
    const y = h / 2 - (band.gain / 12) * (h / 2);
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(band.x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Update audio effect UI from state
function updateAudioEffectUI(trackName) {
  const effects = state.audioEffects[trackName];
  const prefix = trackName === 'bgAudio' ? 'bgAudio' : 'mainAudio';

  // Volume
  const volumeFx = document.getElementById(`${prefix}VolumeFX`);
  if (volumeFx) {
    volumeFx.value = effects.volume * 100;
    volumeFx.nextElementSibling.textContent = Math.round(effects.volume * 100) + '%';
  }

  // Pan
  const pan = document.getElementById(`${prefix}Pan`);
  if (pan) {
    pan.value = effects.pan * 100;
    const label = effects.pan < -0.1 ? `L ${Math.abs(Math.round(effects.pan * 100))}` :
                  effects.pan > 0.1 ? `R ${Math.round(effects.pan * 100)}` : 'Center';
    pan.nextElementSibling.textContent = label;
  }

  // EQ
  const eqLow = document.getElementById(`${prefix}EQLow`);
  if (eqLow) {
    eqLow.value = effects.eq.low;
    eqLow.nextElementSibling.textContent = effects.eq.low.toFixed(1) + ' dB';
  }

  const eqMid = document.getElementById(`${prefix}EQMid`);
  if (eqMid) {
    eqMid.value = effects.eq.mid;
    eqMid.nextElementSibling.textContent = effects.eq.mid.toFixed(1) + ' dB';
  }

  const eqHigh = document.getElementById(`${prefix}EQHigh`);
  if (eqHigh) {
    eqHigh.value = effects.eq.high;
    eqHigh.nextElementSibling.textContent = effects.eq.high.toFixed(1) + ' dB';
  }

  drawEQGraph(trackName);

  // Compressor
  const compEnable = document.getElementById(`${prefix}CompressorEnable`);
  if (compEnable) {
    compEnable.checked = effects.compressor.enabled;
    const compControls = document.getElementById(`${prefix}CompressorControls`);
    if (compControls) {
      compControls.style.display = effects.compressor.enabled ? 'block' : 'none';
    }
  }

  // Reverb
  const reverbEnable = document.getElementById(`${prefix}ReverbEnable`);
  if (reverbEnable) {
    reverbEnable.checked = effects.reverb.enabled;
  }

  // Echo
  const echoEnable = document.getElementById(`${prefix}EchoEnable`);
  if (echoEnable) {
    echoEnable.checked = effects.echo.enabled;
  }
}

// Update video effect UI from state
function updateVideoEffectUI(trackName) {
  const effects = state.videoEffects[trackName];
  const prefix = trackName === 'bgVideo' ? 'bgVideo' : 'mainVideo';

  // Brightness
  const brightness = document.getElementById(`${prefix}Brightness`);
  if (brightness) {
    brightness.value = effects.brightness;
    brightness.nextElementSibling.textContent = effects.brightness;
  }

  // Contrast
  const contrast = document.getElementById(`${prefix}Contrast`);
  if (contrast) {
    contrast.value = effects.contrast;
    contrast.nextElementSibling.textContent = effects.contrast;
  }

  // Saturation
  const saturation = document.getElementById(`${prefix}Saturation`);
  if (saturation) {
    saturation.value = effects.saturation;
    saturation.nextElementSibling.textContent = effects.saturation;
  }

  // Hue
  const hue = document.getElementById(`${prefix}Hue`);
  if (hue) {
    hue.value = effects.hue;
    hue.nextElementSibling.textContent = effects.hue + '°';
  }

  // Temperature
  const temp = document.getElementById(`${prefix}Temp`);
  if (temp) {
    temp.value = effects.temperature;
    temp.nextElementSibling.textContent = effects.temperature;
  }

  // Update effect stack
  updateVideoEffectStack(trackName);

  // Apply effects
  applyVideoEffectsToElement(trackName);
}

// Initialize slider augmentation after DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', augmentEffectSliders);
  } else {
    augmentEffectSliders();
  }
}
