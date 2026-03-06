// ============================================================
// ENHANCED TIMELINE SYSTEM
// Background video controls and multi-track timeline management
// ============================================================

// Helper function to format time in MM:SS
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Background video playback state
let bgVideoPlaying = false;
let bgVideoLoop = true;
let bgVideoSynced = true;
let bgVideoSpeed = 1;

// Background audio playback state
let bgAudioPlaying = false;
let bgAudioLoop = false;
let bgAudioSynced = true;
let bgAudioSpeed = 1;
let bgAudioVolume = 1;

// ============================================================
// TRACK HEADER CONTROLS (Mute, Solo, Lock)
// ============================================================

function setRenderGroupHidden(groupId, hidden) {
  const group = state.renderStack.find(g => g.id === groupId);
  if (group) group.hidden = hidden;
}

const TRACK_CONTROL_IDS = {
  bgAudio: { mute: 'audioMuteBtn', solo: 'audioSoloBtn', lock: 'audioLockBtn', row: 'bgAudioTrack' },
  bgVideo: { mute: 'bgVideoMuteBtn', solo: 'bgVideoSoloBtn', lock: 'bgVideoLockBtn', row: 'bgVideoTrack' },
  main: { mute: 'mainVideoMuteBtn', solo: 'mainVideoSoloBtn', lock: 'mainVideoLockBtn', row: 'mainVideoTrack' }
};

const BG_VIDEO_CONTROL_IDS = [
  'bgTrackPlayBtn', 'bgLoopBtn', 'bgSpeedSelect', 'bgSyncBtn',
  'bgVideoActionsBtn', 'bgVideoMuteBtn', 'bgVideoSoloBtn', 'bgVideoLockBtn', 'videoLoopMarkerBtn'
];
const BG_AUDIO_CONTROL_IDS = [
  'audioTrackPlayBtn', 'audioLoopBtn', 'audioSpeedSelect', 'audioVolumeSlider',
  'audioSyncBtn', 'bgAudioActionsBtn', 'audioMuteBtn', 'audioSoloBtn', 'audioLockBtn', 'audioLoopMarkerBtn'
];
const MAIN_CONTROL_IDS = [
  'mainVideoMuteBtn', 'mainVideoSoloBtn', 'mainVideoLockBtn'
];

function setElementDisabledState(el, disabled, title) {
  if (!el) return;
  const isFormControl = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
  if (isFormControl) {
    el.disabled = !!disabled;
  } else {
    el.classList.toggle('is-disabled', !!disabled);
    el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }
  if (disabled) {
    if (!el.dataset.defaultTitle) el.dataset.defaultTitle = el.getAttribute('title') || '';
    if (title) el.setAttribute('title', title);
  } else if (el.dataset.defaultTitle !== undefined) {
    el.setAttribute('title', el.dataset.defaultTitle);
  }
}

function hydrateBgTrackRuntimeFromState() {
  const bgVideo = document.getElementById('bgVideo');
  const bgAudio = document.getElementById('bgAudio');

  bgVideoLoop = state.bgVideo.loop !== false;
  bgVideoSpeed = Number(state.bgVideo.speed || 1);
  bgVideoSynced = state.bgVideo.synced !== false;
  if (bgVideo) {
    bgVideo.loop = bgVideoLoop;
    bgVideo.playbackRate = bgVideoSpeed;
  }
  document.getElementById('bgLoopBtn')?.classList.toggle('active', bgVideoLoop);
  const bgSpeedEl = document.getElementById('bgSpeedSelect');
  if (bgSpeedEl) bgSpeedEl.value = String(bgVideoSpeed);
  document.getElementById('bgSyncBtn')?.classList.toggle('synced', bgVideoSynced);

  bgAudioLoop = !!state.bgAudio.loop;
  bgAudioSpeed = Number(state.bgAudio.speed || 1);
  bgAudioSynced = state.bgAudio.synced !== false;
  bgAudioVolume = Number(state.bgAudio.volume ?? 1);
  if (bgAudio) {
    bgAudio.loop = bgAudioLoop;
    bgAudio.playbackRate = bgAudioSpeed;
    bgAudio.volume = Math.max(0, Math.min(1, bgAudioVolume));
  }
  document.getElementById('audioLoopBtn')?.classList.toggle('active', bgAudioLoop);
  const audioSpeedEl = document.getElementById('audioSpeedSelect');
  if (audioSpeedEl) audioSpeedEl.value = String(bgAudioSpeed);
  const audioVolumeEl = document.getElementById('audioVolumeSlider');
  if (audioVolumeEl) audioVolumeEl.value = String(Math.round(Math.max(0, Math.min(1, bgAudioVolume)) * 100));
  document.getElementById('audioSyncBtn')?.classList.toggle('synced', bgAudioSynced);
}

function syncTrackMediaActionStates() {
  const bgVideo = document.getElementById('bgVideo');
  const bgAudio = document.getElementById('bgAudio');
  const hasBgVideoMedia = !!(state.bgVideo.enabled && bgVideo?.src);
  const hasBgAudioMedia = !!(state.bgAudio.enabled && bgAudio?.src);
  const hasMainVideoMedia = !!hasVideo;

  BG_VIDEO_CONTROL_IDS.forEach(id => {
    setElementDisabledState(
      document.getElementById(id),
      !hasBgVideoMedia,
      'Load a background video first'
    );
  });
  BG_AUDIO_CONTROL_IDS.forEach(id => {
    setElementDisabledState(
      document.getElementById(id),
      !hasBgAudioMedia,
      'Load background audio first'
    );
  });
  MAIN_CONTROL_IDS.forEach(id => {
    setElementDisabledState(
      document.getElementById(id),
      !hasMainVideoMedia,
      'Load a main video first'
    );
  });
}

function syncTrackButtonMirrors(track) {
  const cfg = TRACK_CONTROL_IDS[track];
  if (!cfg) return;
  const muteActive = document.getElementById(cfg.mute)?.classList.contains('active') || false;
  const soloActive = document.getElementById(cfg.solo)?.classList.contains('active') || false;
  document.querySelectorAll(`.effects-panel .mute-btn[data-track="${track}"]`).forEach(btn => {
    btn.classList.toggle('active', muteActive);
  });
  document.querySelectorAll(`.effects-panel .solo-btn[data-track="${track}"]`).forEach(btn => {
    btn.classList.toggle('active', soloActive);
  });
}

function setTrackLocked(track, locked) {
  const cfg = TRACK_CONTROL_IDS[track];
  if (!cfg) return;
  const row = document.getElementById(cfg.row);
  if (row) row.classList.toggle('track-locked', locked);
}

function syncAllTrackButtonMirrors() {
  syncTrackButtonMirrors('bgAudio');
  syncTrackButtonMirrors('bgVideo');
  syncTrackButtonMirrors('main');
}

document.querySelectorAll('.track-controls-mini .mini-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (btn.disabled) return;
    e.stopPropagation();
    const track = btn.dataset.track;
    const type = btn.classList.contains('mute-btn') ? 'mute' :
                 btn.classList.contains('solo-btn') ? 'solo' : 'lock';
    
    if (type === 'lock') {
      const isLocked = btn.classList.toggle('active');
      setTrackLocked(track, isLocked);
      scheduleSave();
      showToast(`Track ${isLocked ? 'locked' : 'unlocked'}`, 'info');
      return;
    }

    const isActive = btn.classList.toggle('active');
    
    if (type === 'mute') {
      if (track === 'bgAudio') {
        const audio = document.getElementById('bgAudio');
        if (audio) audio.muted = isActive;
      } else if (track === 'bgVideo') {
        setRenderGroupHidden('bgVideo', isActive);
        state.bgVideo.hidden = isActive;
      } else if (track === 'main') {
        setRenderGroupHidden('device', isActive);
      }
    } else if (type === 'solo') {
      // Logic for soloing a track
      const allSoloBtns = document.querySelectorAll('.track-controls-mini .solo-btn');
      const anySoloActive = Array.from(allSoloBtns).some(b => b.classList.contains('active'));
      
      if (anySoloActive) {
        // If solo is active, only show/play the soloed tracks
        updateSoloState();
      } else {
        // If no solo is active, restore all tracks based on their mute state
        restoreAllTracks();
      }
    }

    syncTrackButtonMirrors(track);
    scheduleSave();
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isActive ? 'ON' : 'OFF'}`, 'info');
  });
});

// Effect-panel mute/solo buttons mirror the header mini controls.
document.querySelectorAll('.effects-panel .mute-btn, .effects-panel .solo-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const track = btn.dataset.track;
    const mode = btn.classList.contains('solo-btn') ? 'solo' : 'mute';
    const cfg = TRACK_CONTROL_IDS[track];
    if (!cfg) return;
    const sourceBtn = document.getElementById(cfg[mode]);
    sourceBtn?.click();
  });
});

function updateSoloState() {
  const soloedTracks = Array.from(document.querySelectorAll('.track-controls-mini .solo-btn.active')).map(b => b.dataset.track);
  
  // Update BG Audio
  const bgAudio = document.getElementById('bgAudio');
  if (bgAudio) bgAudio.muted = !soloedTracks.includes('bgAudio');
  
  // Update BG Video
  setRenderGroupHidden('bgVideo', !soloedTracks.includes('bgVideo'));
  state.bgVideo.hidden = !soloedTracks.includes('bgVideo');
  
  // Update Main Video
  setRenderGroupHidden('device', !soloedTracks.includes('main'));
  syncAllTrackButtonMirrors();
}

function restoreAllTracks() {
  // Restore based on mute buttons
  const isAudioMuted = document.getElementById('audioMuteBtn')?.classList.contains('active') || false;
  const isBgVideoMuted = document.getElementById('bgVideoMuteBtn')?.classList.contains('active') || false;
  const isMainMuted = document.getElementById('mainVideoMuteBtn')?.classList.contains('active') || false;
  
  const bgAudio = document.getElementById('bgAudio');
  if (bgAudio) bgAudio.muted = isAudioMuted;
  setRenderGroupHidden('bgVideo', isBgVideoMuted);
  state.bgVideo.hidden = isBgVideoMuted;
  setRenderGroupHidden('device', isMainMuted);
  syncAllTrackButtonMirrors();
}

syncAllTrackButtonMirrors();

// ============================================================
// BG TRACK TRIMMING LOGIC
// ============================================================

function makeBgTrimDraggable(handleId, trackId, type) {
  const handle = document.getElementById(handleId);
  const track = handle?.parentElement;
  if (!handle || !track) return;

  let isDragging = false;

  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;

    if (type === 'in') {
      state[trackId].trimIn = Math.min(percent, state[trackId].trimOut - 0.05);
      handle.style.left = (state[trackId].trimIn * 100) + '%';
    } else {
      state[trackId].trimOut = Math.max(percent, state[trackId].trimIn + 0.05);
      handle.style.left = (state[trackId].trimOut * 100) + '%';
    }

    updateBgTrimVisuals(trackId);
    scheduleSave();
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = 'default';
      pushUndoState();
    }
  });
}

function updateBgTrimVisuals(trackId) {
  const inHandle = document.getElementById(trackId === 'bgVideo' ? 'bgVideoTrimIn' : 'audioTrimIn');
  const outHandle = document.getElementById(trackId === 'bgVideo' ? 'bgVideoTrimOut' : 'audioTrimOut');
  const dimLeft = document.getElementById(trackId === 'bgVideo' ? 'bgVideoTrimDimLeft' : 'audioTrimDimLeft');
  const dimRight = document.getElementById(trackId === 'bgVideo' ? 'bgVideoTrimDimRight' : 'audioTrimDimRight');

  if (inHandle) inHandle.style.left = (state[trackId].trimIn * 100) + '%';
  if (outHandle) outHandle.style.left = (state[trackId].trimOut * 100) + '%';
  
  if (dimLeft) dimLeft.style.width = (state[trackId].trimIn * 100) + '%';
  if (dimRight) dimRight.style.left = (state[trackId].trimOut * 100) + '%';
  if (dimRight) dimRight.style.width = (100 - (state[trackId].trimOut * 100)) + '%';
}

// Wire up trim handles
makeBgTrimDraggable('bgVideoTrimIn', 'bgVideo', 'in');
makeBgTrimDraggable('bgVideoTrimOut', 'bgVideo', 'out');
makeBgTrimDraggable('audioTrimIn', 'bgAudio', 'in');
makeBgTrimDraggable('audioTrimOut', 'bgAudio', 'out');

// ============================================================
// BACKGROUND VIDEO ACTIONS
// ============================================================
const BG_VIDEO_ACTIONS = {
  fadeIn: {
    name: 'Fade In (0→100%)',
    apply: (duration = 2000) => {
      const startTime = performance.now();
      const initialOpacity = state.bgVideo.opacity;

      function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        state.bgVideo.opacity = initialOpacity + (1 - initialOpacity) * progress;
        document.getElementById('bgVideoOpacity').value = state.bgVideo.opacity * 100;
        document.getElementById('bgVideoOpacityVal').textContent = Math.round(state.bgVideo.opacity * 100) + '%';

        if (progress < 1) requestAnimationFrame(animate);
        else scheduleSave();
      }
      animate();
      showToast('Fade in started', 'info');
    }
  },
  fadeOut: {
    name: 'Fade Out (100→0%)',
    apply: (duration = 2000) => {
      const startTime = performance.now();
      const initialOpacity = state.bgVideo.opacity;

      function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        state.bgVideo.opacity = initialOpacity * (1 - progress);
        document.getElementById('bgVideoOpacity').value = state.bgVideo.opacity * 100;
        document.getElementById('bgVideoOpacityVal').textContent = Math.round(state.bgVideo.opacity * 100) + '%';

        if (progress < 1) requestAnimationFrame(animate);
        else scheduleSave();
      }
      animate();
      showToast('Fade out started', 'info');
    }
  },
  overlayMode: {
    name: 'Overlay Mode',
    apply: () => {
      pushUndoState();
      state.bgVideo.opacity = 0.5;
      state.bgVideo.fit = 'cover';
      document.getElementById('bgVideoOpacity').value = 50;
      document.getElementById('bgVideoOpacityVal').textContent = '50%';
      document.getElementById('bgVideoFit').value = 'cover';
      scheduleSave();
      showToast('Overlay mode applied', 'info');
    }
  },
  syncPerfect: {
    name: 'Sync Perfect',
    apply: () => {
      const bgVideo = document.getElementById('bgVideo');
      if (!bgVideo) return;
      bgVideoSynced = true;
      document.getElementById('bgSyncBtn')?.classList.add('synced');
      bgVideo.currentTime = vtTime;
      showToast('Background synced to main', 'success');
    }
  },
  speedSlow: {
    name: 'Slow Motion (0.5x)',
    apply: () => {
      pushUndoState();
      bgVideoSpeed = 0.5;
      const bgVideo = document.getElementById('bgVideo');
      if (bgVideo) bgVideo.playbackRate = 0.5;
      document.getElementById('bgSpeedSelect').value = '0.5';
      scheduleSave();
      showToast('Background speed: 0.5×', 'info');
    }
  },
  speedFast: {
    name: 'Fast Forward (2x)',
    apply: () => {
      pushUndoState();
      bgVideoSpeed = 2;
      const bgVideo = document.getElementById('bgVideo');
      if (bgVideo) bgVideo.playbackRate = 2;
      document.getElementById('bgSpeedSelect').value = '2';
      scheduleSave();
      showToast('Background speed: 2×', 'info');
    }
  },
  enableLoop: {
    name: 'Enable Loop',
    apply: () => {
      const bgVideo = document.getElementById('bgVideo');
      if (!bgVideo) return;
      bgVideoLoop = true;
      bgVideo.loop = true;
      document.getElementById('bgLoopBtn')?.classList.add('active');
      showToast('Background loop enabled', 'success');
    }
  },
  resetToStart: {
    name: 'Reset to Start',
    apply: () => {
      const bgVideo = document.getElementById('bgVideo');
      if (!bgVideo) return;
      bgVideo.currentTime = 0;
      updateBgVideoDisplay();
      showToast('Background reset to start', 'info');
    }
  },
  blurBackground: {
    name: 'Blur Background',
    apply: () => {
      pushUndoState();
      const effects = state.videoEffects.bgVideo;
      effects.filters = (effects.filters || []).filter(f => f.type !== 'blur');
      effects.filters.push({ id: Date.now(), type: 'blur', amount: 10 });
      if (typeof updateVideoEffectUI === 'function') updateVideoEffectUI('bgVideo');
      scheduleSave();
      showToast('Background blurred', 'info');
    }
  },
  blackAndWhite: {
    name: 'Black & White',
    apply: () => {
      pushUndoState();
      const effects = state.videoEffects.bgVideo;
      effects.saturation = -100;
      effects.filters = (effects.filters || []).filter(f => f.type !== 'grayscale');
      effects.filters.push({ id: Date.now(), type: 'grayscale', amount: 100 });
      if (typeof updateVideoEffectUI === 'function') updateVideoEffectUI('bgVideo');
      scheduleSave();
      showToast('Grayscale applied', 'info');
    }
  },
  splitScreen: {
    name: 'Split Screen (50/50)',
    apply: () => {
      pushUndoState();
      state.bgVideo.fit = 'contain';
      scheduleSave();
      showToast('Split screen layout', 'info');
    }
  },
  resetFilters: {
    name: 'Reset Filters',
    apply: () => {
      pushUndoState();
      state.videoEffects.bgVideo.filters = [];
      state.videoEffects.bgVideo.brightness = 0;
      state.videoEffects.bgVideo.contrast = 0;
      state.videoEffects.bgVideo.saturation = 0;
      state.videoEffects.bgVideo.hue = 0;
      state.videoEffects.bgVideo.temperature = 0;
      if (typeof updateVideoEffectUI === 'function') updateVideoEffectUI('bgVideo');
      scheduleSave();
      showToast('Filters reset', 'info');
    }
  },
};

function applyBgVideoAction(key, ...params) {
  const action = BG_VIDEO_ACTIONS[key];
  if (!action || !state.bgVideo.enabled) return;
  action.apply(...params);
}

// ============================================================
// BACKGROUND AUDIO ACTIONS
// ============================================================
const BG_AUDIO_ACTIONS = {
  fadeInAudio: {
    name: 'Fade In Audio',
    apply: (duration = 2000) => {
      const startTime = performance.now();
      const initialVolume = bgAudioVolume;

      function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        bgAudioVolume = initialVolume + (1 - initialVolume) * progress;
        const bgAudio = document.getElementById('bgAudio');
        if (bgAudio) bgAudio.volume = bgAudioVolume;
        document.getElementById('audioVolumeSlider').value = bgAudioVolume * 100;

        if (progress < 1) requestAnimationFrame(animate);
        else { state.bgAudio.volume = bgAudioVolume; scheduleSave(); }
      }
      animate();
      showToast('Audio fade in started', 'info');
    }
  },
  fadeOutAudio: {
    name: 'Fade Out Audio',
    apply: (duration = 2000) => {
      const startTime = performance.now();
      const initialVolume = bgAudioVolume;

      function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        bgAudioVolume = initialVolume * (1 - progress);
        const bgAudio = document.getElementById('bgAudio');
        if (bgAudio) bgAudio.volume = bgAudioVolume;
        document.getElementById('audioVolumeSlider').value = bgAudioVolume * 100;

        if (progress < 1) requestAnimationFrame(animate);
        else { state.bgAudio.volume = bgAudioVolume; scheduleSave(); }
      }
      animate();
      showToast('Audio fade out started', 'info');
    }
  },
  ducking: {
    name: 'Ducking (30%)',
    apply: () => {
      pushUndoState();
      bgAudioVolume = 0.3;
      const bgAudio = document.getElementById('bgAudio');
      if (bgAudio) bgAudio.volume = 0.3;
      document.getElementById('audioVolumeSlider').value = 30;
      state.bgAudio.volume = 0.3;
      scheduleSave();
      showToast('Audio ducking: 30% volume', 'info');
    }
  },
  loopBeat: {
    name: 'Loop Beat',
    apply: () => {
      const bgAudio = document.getElementById('bgAudio');
      if (!bgAudio) return;
      bgAudioLoop = true;
      bgAudio.loop = true;
      state.bgAudio.loop = true;
      document.getElementById('audioLoopBtn')?.classList.add('active');
      scheduleSave();
      showToast('Audio loop enabled', 'success');
    }
  },
  speedMatch: {
    name: 'Speed Match',
    apply: () => {
      pushUndoState();
      bgAudioSpeed = state.timeline.speed;
      const bgAudio = document.getElementById('bgAudio');
      if (bgAudio) bgAudio.playbackRate = bgAudioSpeed;
      document.getElementById('audioSpeedSelect').value = bgAudioSpeed.toString();
      state.bgAudio.speed = bgAudioSpeed;
      scheduleSave();
      showToast(`Audio speed matched: ${bgAudioSpeed}×`, 'info');
    }
  },
  volumeBoost: {
    name: 'Volume Boost (100%)',
    apply: () => {
      pushUndoState();
      bgAudioVolume = 1.0;
      const bgAudio = document.getElementById('bgAudio');
      if (bgAudio) bgAudio.volume = 1.0;
      document.getElementById('audioVolumeSlider').value = 100;
      state.bgAudio.volume = 1.0;
      scheduleSave();
      showToast('Audio volume: 100%', 'info');
    }
  },
  syncAudio: {
    name: 'Sync to Main',
    apply: () => {
      const bgAudio = document.getElementById('bgAudio');
      if (!bgAudio) return;
      bgAudioSynced = true;
      document.getElementById('audioSyncBtn')?.classList.add('synced');
      bgAudio.currentTime = vtTime % bgAudio.duration;
      showToast('Audio synced to main', 'success');
    }
  },
  resetAudio: {
    name: 'Reset Audio',
    apply: () => {
      const bgAudio = document.getElementById('bgAudio');
      if (!bgAudio) return;
      bgAudio.currentTime = 0;
      updateAudioDisplay();
      showToast('Audio reset to start', 'info');
    }
  },
  fadeInSlow: {
    name: 'Fade In (5s)',
    apply: () => {
      applyBgAudioAction('fadeInAudio', 5000);
    }
  },
  fadeOutSlow: {
    name: 'Fade Out (5s)',
    apply: () => {
      applyBgAudioAction('fadeOutAudio', 5000);
    }
  },
  bassBoost: {
    name: 'Bass Boost',
    apply: () => {
      pushUndoState();
      const effects = state.audioEffects.bgAudio;
      effects.eq.low = 8;
      effects.eq.mid = -2;
      updateAudioEffects('bgAudio');
      updateAudioEffectUI('bgAudio');
      showToast('Bass boost applied', 'success');
    }
  },
  reverb: {
    name: 'Add Reverb',
    apply: () => {
      pushUndoState();
      const effects = state.audioEffects.bgAudio;
      effects.reverb.enabled = true;
      effects.reverb.mix = 0.4;
      updateAudioEffects('bgAudio');
      updateAudioEffectUI('bgAudio');
      showToast('Reverb applied', 'success');
    }
  },
};

function applyBgAudioAction(key, ...params) {
  const action = BG_AUDIO_ACTIONS[key];
  if (!action || !state.bgAudio.enabled) return;
  action.apply(...params);
}

// Initialize enhanced timeline
function initEnhancedTimeline() {
  const timelineSystem = document.getElementById('timelineSystem');
  const bgVideoTrack = document.getElementById('bgVideoTrack');
  const bgVideo = document.getElementById('bgVideo');
  const bgAudio = document.getElementById('bgAudio');

  if (!timelineSystem) return;

  // Show timeline system when ANY media is loaded
  const hasBgVideo = state.bgVideo.enabled && bgVideo && bgVideo.src;
  const hasBgAudio = state.bgAudio.enabled && bgAudio && bgAudio.src;
  const shouldShowTimeline = hasVideo || hasBgVideo || hasBgAudio;

  if (shouldShowTimeline) {
    timelineSystem.classList.add('visible');
  }

  // Mark background video track as loaded when media is loaded
  if (state.bgVideo.enabled && bgVideo && bgVideo.src) {
    bgVideoTrack.classList.add('loaded');
  }

  syncTrackMediaActionStates();
}

// ============================================================
// BACKGROUND VIDEO CONTROLS
// ============================================================

// Play/Pause background video
document.getElementById('bgTrackPlayBtn')?.addEventListener('click', () => {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo || !bgVideo.src) return;

  const playBtn = document.getElementById('bgTrackPlayBtn');
  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');

  if (bgVideoPlaying) {
    bgVideo.pause();
    bgVideoPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playBtn.classList.remove('playing');
  } else {
    bgVideo.play().catch(err => console.warn('BG video play prevented:', err));
    bgVideoPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playBtn.classList.add('playing');
  }
});

// Toggle loop for background video
document.getElementById('bgLoopBtn')?.addEventListener('click', function() {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo) return;

  bgVideoLoop = !bgVideoLoop;
  bgVideo.loop = bgVideoLoop;
  state.bgVideo.loop = bgVideoLoop;
  this.classList.toggle('active', bgVideoLoop);

  scheduleSave();
  showToast(bgVideoLoop ? 'Background loop enabled' : 'Background loop disabled', 'info');
});

// Background video speed control
document.getElementById('bgSpeedSelect')?.addEventListener('change', (e) => {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo) return;

  bgVideoSpeed = parseFloat(e.target.value);
  bgVideo.playbackRate = bgVideoSpeed;
  state.bgVideo.speed = bgVideoSpeed;
  scheduleSave();
  showToast(`Background speed: ${bgVideoSpeed}×`, 'info');
});

// Background video scrubbing
const bgProgressTrack = document.getElementById('bgProgressTrack');
const bgProgressFill = document.getElementById('bgProgressFill');
let bgScrubbing = false;

bgProgressTrack?.addEventListener('mousedown', (e) => {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo || !bgVideo.duration) return;

  bgScrubbing = true;
  bgProgressTrack.classList.add('scrubbing');
  updateBgVideoTime(e);
});

document.addEventListener('mousemove', (e) => {
  if (!bgScrubbing) return;
  updateBgVideoTime(e);
});

document.addEventListener('mouseup', () => {
  if (bgScrubbing) {
    bgScrubbing = false;
    bgProgressTrack?.classList.remove('scrubbing');
  }
});

function updateBgVideoTime(e) {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo || !bgProgressTrack) return;

  const rect = bgProgressTrack.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percent = x / rect.width;
  const newTime = percent * bgVideo.duration;

  bgVideo.currentTime = newTime;
  updateBgVideoDisplay();
}

// Sync background video with main video
document.getElementById('bgSyncBtn')?.addEventListener('click', function() {
  bgVideoSynced = !bgVideoSynced;
  state.bgVideo.synced = bgVideoSynced;
  this.classList.toggle('synced', bgVideoSynced);

  if (bgVideoSynced) {
    showToast('Background synced with main video', 'success');
    syncBgVideoWithMain();
  } else {
    showToast('Background independent playback', 'info');
  }
  scheduleSave();
});

function syncBgVideoWithMain() {
  if (!bgVideoSynced) return;

  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo || !hasVideo) return;

  const duration = bgVideo.duration;
  if (!duration || isNaN(duration)) return;

  // Map main timeline time to background video trimmed region
  const mainTime = vtTime;
  const trimInTime = state.bgVideo.trimIn * duration;
  const trimOutTime = state.bgVideo.trimOut * duration;
  const trimmedDuration = trimOutTime - trimInTime;

  if (trimmedDuration > 0) {
    bgVideo.currentTime = trimInTime + (mainTime % trimmedDuration);
  }

  // Sync play/pause state
  if (vtPlaying && !bgVideoPlaying) {
    bgVideo.play().catch(err => console.warn('BG video sync play prevented:', err));
    bgVideoPlaying = true;
    updateBgPlayButtonState();
  } else if (!vtPlaying && bgVideoPlaying) {
    bgVideo.pause();
    bgVideoPlaying = false;
    updateBgPlayButtonState();
  }
}

function updateBgPlayButtonState() {
  const playBtn = document.getElementById('bgTrackPlayBtn');
  if (!playBtn) return;

  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');

  if (bgVideoPlaying) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playBtn.classList.add('playing');
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playBtn.classList.remove('playing');
  }
}

// Update background video display
function updateBgVideoDisplay() {
  const bgVideo = document.getElementById('bgVideo');
  const bgTimeDisplay = document.getElementById('bgTimeDisplay');

  if (!bgVideo || !bgTimeDisplay) return;

  const current = bgVideo.currentTime || 0;
  const duration = bgVideo.duration || 0;

  bgTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

  if (bgProgressFill && duration > 0) {
    const percent = (current / duration) * 100;
    bgProgressFill.style.width = `${percent}%`;
  }
}

// ============================================================
// MASTER PLAYBACK CONTROLS
// ============================================================

const masterPlayBtn = document.getElementById('masterPlayBtn');
masterPlayBtn?.addEventListener('click', () => {
  vtToggle();
  updateMasterPlayButtonState();
});

function updateMasterPlayButtonState() {
  const masterIconPlay = document.getElementById('masterIconPlay');
  const masterIconPause = document.getElementById('masterIconPause');

  if (vtPlaying) {
    masterIconPlay.style.display = 'none';
    masterIconPause.style.display = 'block';
    masterPlayBtn?.classList.add('playing');
  } else {
    masterIconPlay.style.display = 'block';
    masterIconPause.style.display = 'none';
    masterPlayBtn?.classList.remove('playing');
  }
}

// Update master time display
function updateMasterTimeDisplay() {
  const masterTimeDisplay = document.getElementById('masterTimeDisplay');
  if (!masterTimeDisplay || !hasVideo) return;

  const totalDur = vtGetTotalDuration();
  masterTimeDisplay.textContent = `${formatTime(vtTime)} / ${formatTime(totalDur)}`;
}

// ============================================================
// TIMELINE VISIBILITY
// ============================================================

function updateTimelineVisibility() {
  const timelineSystem = document.getElementById('timelineSystem');
  const bgVideoTrack = document.getElementById('bgVideoTrack');
  const bgAudioTrack = document.getElementById('bgAudioTrack');
  const bgVideo = document.getElementById('bgVideo');
  const bgAudio = document.getElementById('bgAudio');

  if (!timelineSystem) return;

  // Timeline always visible once ANY media is loaded
  const hasBgVideo = state.bgVideo.enabled && bgVideo?.src;
  const hasBgAudio = state.bgAudio.enabled && bgAudio?.src;
  const shouldShowTimeline = hasVideo || hasBgVideo || hasBgAudio;

  if (shouldShowTimeline) {
    timelineSystem.classList.add('visible');
  }

  // Mark tracks as loaded (for opacity change, not visibility)
  if (hasBgVideo) {
    bgVideoTrack?.classList.add('loaded');
  } else {
    bgVideoTrack?.classList.remove('loaded');
  }

  if (hasBgAudio) {
    bgAudioTrack?.classList.add('loaded');
  } else {
    bgAudioTrack?.classList.remove('loaded');
  }

  hydrateBgTrackRuntimeFromState();
  syncTrackMediaActionStates();
  updateStageSpacing();
}

// ============================================================
// RENDER LOOP INTEGRATION
// ============================================================

// Call this in the main render loop to keep displays updated
function updateEnhancedTimelineDisplays() {
  if (!hasVideo) return;

  // Keep master play/pause button in sync with playback state
  // Ensures UI reflects changes triggered outside this module (e.g., keyboard, clip transitions)
  updateMasterPlayButtonState();

  updateMasterTimeDisplay();
  updateBgVideoDisplay();
  updateAudioDisplay();

  // Sync background video if enabled
  if (bgVideoSynced) {
    syncBgVideoWithMain();
  }

  // Sync background audio if enabled
  if (bgAudioSynced) {
    syncAudioWithMain();
  }

  // Check loops
  checkLoops();
}

// ============================================================
// LOOP SYSTEM
// ============================================================

function checkLoops() {
  // Main video loop (uses existing logic)
  if (state.loops?.main?.enabled && hasVideo) {
    const loop = state.loops.main;
    const duration = vtGetTotalDuration();
    const loopStart = loop.start * duration;
    const loopEnd = loop.end * duration;

    if (vtTime >= loopEnd) {
      vtSeek(loopStart);
    }
  }

  // Background video loop (respects trim points)
  if (state.bgVideo.enabled) {
    const bgVideo = document.getElementById('bgVideo');
    if (!bgVideo) return;

    const duration = bgVideo.duration;
    if (!duration || isNaN(duration)) return;

    const trimInTime = state.bgVideo.trimIn * duration;
    const trimOutTime = state.bgVideo.trimOut * duration;

    if (bgVideo.currentTime >= trimOutTime) {
      bgVideo.currentTime = trimInTime;
    } else if (bgVideo.currentTime < trimInTime) {
      bgVideo.currentTime = trimInTime;
    }
  }

  // Background audio loop (respects trim points)
  if (state.bgAudio.enabled) {
    const bgAudio = document.getElementById('bgAudio');
    if (!bgAudio) return;

    const duration = bgAudio.duration;
    if (!duration || isNaN(duration)) return;

    const trimInTime = state.bgAudio.trimIn * duration;
    const trimOutTime = state.bgAudio.trimOut * duration;

    if (bgAudio.currentTime >= trimOutTime) {
      bgAudio.currentTime = trimInTime;
    } else if (bgAudio.currentTime < trimInTime) {
      bgAudio.currentTime = trimInTime;
    }
  }
}

// Toggle audio loop
function toggleAudioLoop() {
  const start = parseFloat(document.getElementById('audioLoopStart').value);
  const end = parseFloat(document.getElementById('audioLoopEnd').value);

  if (!state.loops) state.loops = { main: { enabled: false, start: 0, end: 1 }, bgVideo: { enabled: false, start: 0, end: 1 }, bgAudio: { enabled: false, start: 0, end: 1 } };
  if (!state.loops.bgAudio) state.loops.bgAudio = { enabled: false, start: 0, end: 1 };

  state.loops.bgAudio.enabled = !state.loops.bgAudio.enabled;
  state.loops.bgAudio.start = start;
  state.loops.bgAudio.end = end;

  document.getElementById('audioLoopMarkerBtn')?.classList.toggle('active', state.loops.bgAudio.enabled);
  showToast(state.loops.bgAudio.enabled ? 'Audio loop enabled' : 'Audio loop disabled', 'info');
  scheduleSave();
}

// Toggle video loop
function toggleVideoLoop() {
  const start = parseFloat(document.getElementById('videoLoopStart').value);
  const end = parseFloat(document.getElementById('videoLoopEnd').value);

  if (!state.loops) state.loops = { main: { enabled: false, start: 0, end: 1 }, bgVideo: { enabled: false, start: 0, end: 1 }, bgAudio: { enabled: false, start: 0, end: 1 } };
  if (!state.loops.bgVideo) state.loops.bgVideo = { enabled: false, start: 0, end: 1 };

  state.loops.bgVideo.enabled = !state.loops.bgVideo.enabled;
  state.loops.bgVideo.start = start;
  state.loops.bgVideo.end = end;

  document.getElementById('videoLoopMarkerBtn')?.classList.toggle('active', state.loops.bgVideo.enabled);
  showToast(state.loops.bgVideo.enabled ? 'Video loop enabled' : 'Video loop disabled', 'info');
  scheduleSave();
}

// Toggle loop controls with CSS classes
document.getElementById('audioLoopMarkerBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.currentTarget;
  const dropdown = document.getElementById('audioLoopControls');
  const isOpen = dropdown.classList.contains('is-open');

  // Close all dropdowns
  closeAllDropdowns();

  if (!isOpen) {
    dropdown.classList.add('is-open');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');

    // Focus first input
    setTimeout(() => {
      dropdown.querySelector('input')?.focus();
    }, 50);
  }
});

document.getElementById('videoLoopMarkerBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.currentTarget;
  const dropdown = document.getElementById('videoLoopControls');
  const isOpen = dropdown.classList.contains('is-open');

  // Close all dropdowns
  closeAllDropdowns();

  if (!isOpen) {
    dropdown.classList.add('is-open');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');

    // Focus first input
    setTimeout(() => {
      dropdown.querySelector('input')?.focus();
    }, 50);
  }
});

// ============================================================
// BACKGROUND AUDIO CONTROLS
// ============================================================

// Load background audio
document.getElementById('loadBgAudioBtn')?.addEventListener('click', () => {
  document.getElementById('bgAudioInput')?.click();
});

document.getElementById('bgAudioInput')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  const url = URL.createObjectURL(file);
  bgAudio.src = url;
  bgAudio.load();

  bgAudio.addEventListener('loadedmetadata', function onMeta() {
    bgAudio.removeEventListener('loadedmetadata', onMeta);
    state.bgAudio.enabled = true;
    bgAudioLoop = !!state.bgAudio.loop;
    bgAudioSpeed = Number(state.bgAudio.speed || 1);
    bgAudioVolume = Number(state.bgAudio.volume ?? 1);
    bgAudioSynced = state.bgAudio.synced !== false;
    bgAudio.loop = bgAudioLoop;
    bgAudio.playbackRate = bgAudioSpeed;
    bgAudio.volume = Math.max(0, Math.min(1, bgAudioVolume));
    document.getElementById('audioLoopBtn')?.classList.toggle('active', bgAudioLoop);
    const speedEl = document.getElementById('audioSpeedSelect');
    if (speedEl) speedEl.value = String(bgAudioSpeed);
    const volumeEl = document.getElementById('audioVolumeSlider');
    if (volumeEl) volumeEl.value = String(Math.round(bgAudio.volume * 100));
    document.getElementById('audioSyncBtn')?.classList.toggle('synced', bgAudioSynced);
    if (typeof initializeAudioEffectsForTrack === 'function') {
      initializeAudioEffectsForTrack('bgAudio');
    }

    const status = document.getElementById('bgAudioStatus');
    if (status) {
      const duration = formatTime(bgAudio.duration);
      status.textContent = `${file.name} (${duration})`;
    }

    // Generate waveform
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const ctx = getSharedAudioContext();
          const buffer = await ctx.decodeAudioData(ev.target.result);
          const canvas = document.getElementById('audioWaveformCanvas');
          if (canvas) {
            // Match canvas size to display size for sharpness
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            generateWaveform(buffer, canvas, '#f59e0b');
          }
        } catch (e) {
          console.error('Waveform generation failed:', e);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Show audio track in timeline
    updateTimelineVisibility();
    updateBgTrimVisuals('bgAudio');
    scheduleSave();

    showToast('Background audio loaded', 'success');
  });

  e.target.value = '';
});

// Play/Pause background audio
document.getElementById('audioTrackPlayBtn')?.addEventListener('click', () => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio || !bgAudio.src) return;

  const playBtn = document.getElementById('audioTrackPlayBtn');
  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');

  if (bgAudioPlaying) {
    bgAudio.pause();
    bgAudioPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playBtn.classList.remove('playing');
  } else {
    bgAudio.play().catch(err => console.warn('BG audio play prevented:', err));
    bgAudioPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playBtn.classList.add('playing');
  }
});

// Toggle loop for background audio
document.getElementById('audioLoopBtn')?.addEventListener('click', function() {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  bgAudioLoop = !bgAudioLoop;
  bgAudio.loop = bgAudioLoop;
  state.bgAudio.loop = bgAudioLoop;
  this.classList.toggle('active', bgAudioLoop);

  scheduleSave();
  showToast(bgAudioLoop ? 'Audio loop enabled' : 'Audio loop disabled', 'info');
});

// Audio volume control
document.getElementById('audioVolumeSlider')?.addEventListener('input', (e) => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  bgAudioVolume = parseInt(e.target.value) / 100;
  bgAudio.volume = bgAudioVolume;
  state.bgAudio.volume = bgAudioVolume;
  scheduleSave();
});

// Audio speed control
document.getElementById('audioSpeedSelect')?.addEventListener('change', (e) => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  bgAudioSpeed = parseFloat(e.target.value);
  bgAudio.playbackRate = bgAudioSpeed;
  state.bgAudio.speed = bgAudioSpeed;
  scheduleSave();
  showToast(`Audio speed: ${bgAudioSpeed}×`, 'info');
});

// Audio scrubbing
const audioProgressTrack = document.getElementById('audioProgressTrack');
const audioProgressFill = document.getElementById('audioProgressFill');
let audioScrubbing = false;

audioProgressTrack?.addEventListener('mousedown', (e) => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio || !bgAudio.duration) return;

  audioScrubbing = true;
  audioProgressTrack.classList.add('scrubbing');
  updateAudioTime(e);
});

document.addEventListener('mousemove', (e) => {
  if (!audioScrubbing) return;
  updateAudioTime(e);
});

document.addEventListener('mouseup', () => {
  if (audioScrubbing) {
    audioScrubbing = false;
    audioProgressTrack?.classList.remove('scrubbing');
  }
});

function updateAudioTime(e) {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio || !audioProgressTrack) return;

  const rect = audioProgressTrack.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percent = x / rect.width;
  const newTime = percent * bgAudio.duration;

  bgAudio.currentTime = newTime;
  updateAudioDisplay();
}

// Sync audio with main video
document.getElementById('audioSyncBtn')?.addEventListener('click', function() {
  bgAudioSynced = !bgAudioSynced;
  state.bgAudio.synced = bgAudioSynced;
  this.classList.toggle('synced', bgAudioSynced);

  if (bgAudioSynced) {
    showToast('Audio synced with main video', 'success');
    syncAudioWithMain();
  } else {
    showToast('Audio independent playback', 'info');
  }
  scheduleSave();
});

function syncAudioWithMain() {
  if (!bgAudioSynced) return;

  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio || !hasVideo) return;

  const duration = bgAudio.duration;
  if (!duration || isNaN(duration)) return;

  // Map main timeline time to background audio trimmed region
  const mainTime = vtTime;
  const trimInTime = state.bgAudio.trimIn * duration;
  const trimOutTime = state.bgAudio.trimOut * duration;
  const trimmedDuration = trimOutTime - trimInTime;

  if (trimmedDuration > 0) {
    bgAudio.currentTime = trimInTime + (mainTime % trimmedDuration);
  }

  // Sync play/pause state
  if (vtPlaying && !bgAudioPlaying) {
    bgAudio.play().catch(err => console.warn('Audio sync play prevented:', err));
    bgAudioPlaying = true;
    updateAudioPlayButtonState();
  } else if (!vtPlaying && bgAudioPlaying) {
    bgAudio.pause();
    bgAudioPlaying = false;
    updateAudioPlayButtonState();
  }
}

function updateAudioPlayButtonState() {
  const playBtn = document.getElementById('audioTrackPlayBtn');
  if (!playBtn) return;

  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');

  if (bgAudioPlaying) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playBtn.classList.add('playing');
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playBtn.classList.remove('playing');
  }
}

// Update audio display
function updateAudioDisplay() {
  const bgAudio = document.getElementById('bgAudio');
  const audioTimeDisplay = document.getElementById('audioTimeDisplay');

  if (!bgAudio || !audioTimeDisplay) return;

  const current = bgAudio.currentTime || 0;
  const duration = bgAudio.duration || 0;

  audioTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

  if (audioProgressFill && duration > 0) {
    const percent = (current / duration) * 100;
    audioProgressFill.style.width = `${percent}%`;
  }
}

// Remove background audio
document.getElementById('removeAudioBtn')?.addEventListener('click', () => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  bgAudio.pause();
  if (bgAudio.src) URL.revokeObjectURL(bgAudio.src);
  bgAudio.removeAttribute('src');

  state.bgAudio.enabled = false;
  state.bgAudio.synced = false;
  bgAudioPlaying = false;

  const status = document.getElementById('bgAudioStatus');
  if (status) status.textContent = '';

  updateTimelineVisibility();
  scheduleSave();
  showToast('Background audio removed', 'info');
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented) return;
  // Space - Play/Pause
  if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
    e.preventDefault();
    vtToggle();
    updateMasterPlayButtonState();
  }

  // B - Toggle background video play/pause
  if (e.code === 'KeyB' && state.bgVideo.enabled) {
    e.preventDefault();
    document.getElementById('bgTrackPlayBtn')?.click();
  }

  // S - Sync background video
  if (e.code === 'KeyS' && state.bgVideo.enabled) {
    e.preventDefault();
    document.getElementById('bgSyncBtn')?.click();
  }

  // M - Toggle audio play/pause
  if (e.code === 'KeyM' && state.bgAudio.enabled) {
    e.preventDefault();
    document.getElementById('audioTrackPlayBtn')?.click();
  }

  // L - Toggle audio loop
  if (e.code === 'KeyL' && state.bgAudio.enabled) {
    e.preventDefault();
    document.getElementById('audioLoopBtn')?.click();
  }
});

// ============================================================
// TRACK COLLAPSE/EXPAND CONTROLS
// ============================================================

// Background Video Track Collapse
document.getElementById('bgVideoCollapseBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const track = document.getElementById('bgVideoTrack');
  const btn = e.target.closest('.track-collapse-btn');

  if (track.classList.contains('collapsed')) {
    track.classList.remove('collapsed');
    btn.classList.remove('collapsed');
    btn.textContent = '▼';
  } else {
    track.classList.add('collapsed');
    btn.classList.add('collapsed');
    btn.textContent = '▶';
  }
  updateStageSpacing();
});

// Background Audio Track Collapse
document.getElementById('audioCollapseBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const track = document.getElementById('bgAudioTrack');
  const btn = e.target.closest('.track-collapse-btn');

  if (track.classList.contains('collapsed')) {
    track.classList.remove('collapsed');
    btn.classList.remove('collapsed');
    btn.textContent = '▼';
  } else {
    track.classList.add('collapsed');
    btn.classList.add('collapsed');
    btn.textContent = '▶';
  }
  updateStageSpacing();
});

// Main Video Track Collapse
document.getElementById('mainVideoCollapseBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const track = document.getElementById('mainVideoTrack');
  const btn = e.target.closest('.track-collapse-btn');

  if (track.classList.contains('collapsed')) {
    track.classList.remove('collapsed');
    btn.classList.remove('collapsed');
    btn.textContent = '▼';
  } else {
    track.classList.add('collapsed');
    btn.classList.add('collapsed');
    btn.textContent = '▶';
  }
  updateStageSpacing();
});

// Also toggle on track header click
document.getElementById('bgVideoTrackHeader')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('track-sync-btn') || e.target.closest('.track-sync-btn')) {
    return; // Don't toggle if clicking sync button
  }
  document.getElementById('bgVideoCollapseBtn')?.click();
});

document.getElementById('audioTrackHeader')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('track-sync-btn') || e.target.closest('.track-sync-btn')) {
    return; // Don't toggle if clicking sync button
  }
  document.getElementById('audioCollapseBtn')?.click();
});

document.getElementById('mainVideoTrackHeader')?.addEventListener('click', (e) => {
  // Don't toggle if clicking on interactive elements
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
    return;
  }
  if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) {
    return;
  }
  document.getElementById('mainVideoCollapseBtn')?.click();
});

// Update stage spacing based on timeline height
function updateStageSpacing() {
  const stage = document.getElementById('stage');
  const bgVideoTrack = document.getElementById('bgVideoTrack');
  const bgAudioTrack = document.getElementById('bgAudioTrack');
  const mainVideoTrack = document.getElementById('mainVideoTrack');

  if (!stage) return;

  // Check if any tracks are expanded
  const hasBgVideo = bgVideoTrack?.classList.contains('loaded') && !bgVideoTrack?.classList.contains('collapsed');
  const hasBgAudio = bgAudioTrack?.classList.contains('loaded') && !bgAudioTrack?.classList.contains('collapsed');
  const hasMainVideo = mainVideoTrack && !mainVideoTrack?.classList.contains('collapsed');

  // Count total expanded tracks to adjust spacing
  let expandedCount = 0;
  if (hasBgVideo) expandedCount++;
  if (hasBgAudio) expandedCount++;
  if (hasMainVideo) expandedCount++;

  if (expandedCount >= 2) {
    stage.classList.add('timeline-expanded');
  } else {
    stage.classList.remove('timeline-expanded');
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

// Initialize when video is loaded
if (typeof video !== 'undefined') {
  video.addEventListener('loadedmetadata', () => {
    updateTimelineVisibility();
    initEnhancedTimeline();
  });
}

// Background video initialization handled in ui.js

// ============================================================
// ACTION DROPDOWN TOGGLES
// ============================================================

// Helper function to close all dropdowns
function closeAllDropdowns() {
  // Close action dropdowns
  const dropdowns = document.querySelectorAll('.track-actions-dropdown, .track-loop-controls');
  const buttons = document.querySelectorAll('.track-action-btn, .track-loop-btn');
  const tracks = document.querySelectorAll('.bg-video-track, .bg-audio-track, .main-video-track');

  dropdowns.forEach(dd => dd.classList.remove('is-open'));
  buttons.forEach(btn => {
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  });
  tracks.forEach(t => t.classList.remove('is-focused'));
}

// Toggle background video actions dropdown with CSS classes
document.getElementById('bgVideoActionsBtn')?.addEventListener('click', (e) => {
  if (e.currentTarget.disabled) return;
  e.stopPropagation();
  const btn = e.currentTarget;
  const dropdown = document.getElementById('bgVideoActionsDropdown');
  const track = document.getElementById('bgVideoTrack');
  const isOpen = dropdown.classList.contains('is-open');

  // Close all other dropdowns first
  closeAllDropdowns();

  if (!isOpen) {
    // Open this dropdown
    dropdown.classList.add('is-open');
    btn.classList.add('is-open');
    track?.classList.add('is-focused');
    btn.setAttribute('aria-expanded', 'true');

    // Focus first button in dropdown
    setTimeout(() => {
      const firstButton = dropdown.querySelector('button:not([disabled])');
      firstButton?.focus();
    }, 50);
  }
});

// Toggle background audio actions dropdown with CSS classes
document.getElementById('bgAudioActionsBtn')?.addEventListener('click', (e) => {
  if (e.currentTarget.disabled) return;
  e.stopPropagation();
  const btn = e.currentTarget;
  const dropdown = document.getElementById('bgAudioActionsDropdown');
  const track = document.getElementById('bgAudioTrack');
  const isOpen = dropdown.classList.contains('is-open');

  // Close all other dropdowns first
  closeAllDropdowns();

  if (!isOpen) {
    // Open this dropdown
    dropdown.classList.add('is-open');
    btn.classList.add('is-open');
    track?.classList.add('is-focused');
    btn.setAttribute('aria-expanded', 'true');

    // Focus first button in dropdown
    setTimeout(() => {
      const firstButton = dropdown.querySelector('button:not([disabled])');
      firstButton?.focus();
    }, 50);
  }
});

// Close all dropdowns when clicking outside (generic class-based detection)
document.addEventListener('click', (e) => {
  // Check if click is inside any dropdown or its trigger button
  const clickedDropdown = e.target.closest('.track-actions-dropdown, .track-loop-controls');
  const clickedButton = e.target.closest('.track-action-btn, .track-loop-btn');

  // If clicked outside both dropdown and button, close all
  if (!clickedDropdown && !clickedButton) {
    closeAllDropdowns();
  }
});

// ============================================================
// KEYBOARD NAVIGATION FOR TRACK ACTIONS
// ============================================================

// Close dropdowns on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openDropdowns = document.querySelectorAll('.track-actions-dropdown.is-open, .track-loop-controls.is-open');
    if (openDropdowns.length > 0) {
      e.preventDefault();

      // Return focus to the button that opened the dropdown
      const activeButton = document.querySelector('.track-action-btn.is-open, .track-loop-btn.is-open');

      closeAllDropdowns();

      if (activeButton) {
        activeButton.focus();
      }
    }
  }
});

// Navigate dropdown items with Arrow keys
document.addEventListener('keydown', (e) => {
  const openDropdown = document.querySelector('.track-actions-dropdown.is-open');
  if (!openDropdown) return;

  const items = Array.from(openDropdown.querySelectorAll('button:not([disabled])'));
  const currentIndex = items.findIndex(item => item === document.activeElement);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const nextIndex = (currentIndex + 1) % items.length;
    items[nextIndex]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    items[prevIndex]?.focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    // Space or Enter activates focused button
    if (document.activeElement && items.includes(document.activeElement)) {
      e.preventDefault();
      document.activeElement.click();
    }
  }
});

// ============================================================
// LOOP CONTROLS INPUT LISTENERS
// ============================================================

// Audio loop controls
document.getElementById('audioLoopStart')?.addEventListener('input', (e) => {
  if (!state.loops) state.loops = { main: { enabled: false, start: 0, end: 1 }, bgVideo: { enabled: false, start: 0, end: 1 }, bgAudio: { enabled: false, start: 0, end: 1 } };
  if (!state.loops.bgAudio) state.loops.bgAudio = { enabled: false, start: 0, end: 1 };
  state.loops.bgAudio.start = parseFloat(e.target.value);
  scheduleSave();
});

document.getElementById('audioLoopEnd')?.addEventListener('input', (e) => {
  if (!state.loops) state.loops = { main: { enabled: false, start: 0, end: 1 }, bgVideo: { enabled: false, start: 0, end: 1 }, bgAudio: { enabled: false, start: 0, end: 1 } };
  if (!state.loops.bgAudio) state.loops.bgAudio = { enabled: false, start: 0, end: 1 };
  state.loops.bgAudio.end = parseFloat(e.target.value);
  scheduleSave();
});

// Video loop controls
document.getElementById('videoLoopStart')?.addEventListener('input', (e) => {
  if (!state.loops) state.loops = { main: { enabled: false, start: 0, end: 1 }, bgVideo: { enabled: false, start: 0, end: 1 }, bgAudio: { enabled: false, start: 0, end: 1 } };
  if (!state.loops.bgVideo) state.loops.bgVideo = { enabled: false, start: 0, end: 1 };
  state.loops.bgVideo.start = parseFloat(e.target.value);
  scheduleSave();
});

document.getElementById('videoLoopEnd')?.addEventListener('input', (e) => {
  if (!state.loops) state.loops = { main: { enabled: false, start: 0, end: 1 }, bgVideo: { enabled: false, start: 0, end: 1 }, bgAudio: { enabled: false, start: 0, end: 1 } };
  if (!state.loops.bgVideo) state.loops.bgVideo = { enabled: false, start: 0, end: 1 };
  state.loops.bgVideo.end = parseFloat(e.target.value);
  scheduleSave();
});

// Update displays every frame
if (typeof requestAnimationFrame !== 'undefined') {
  function enhancedTimelineRenderLoop() {
    updateEnhancedTimelineDisplays();
    requestAnimationFrame(enhancedTimelineRenderLoop);
  }
  enhancedTimelineRenderLoop();
}

// ============================================================
// EVENT DELEGATION & CLEANUP
// ============================================================

// Store delegated handlers for cleanup
const _timelineHandlers = {
  clickHandler: null,
  inputHandler: null,
  changeHandler: null
};

// Event delegation for timeline controls
function initTimelineDelegation() {
  const timelineSystem = document.getElementById('timelineSystem');
  if (!timelineSystem) return;

  // Remove existing handlers if any
  cleanupTimelineHandlers();

  // Single click handler for all buttons in timeline
  _timelineHandlers.clickHandler = (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    // Handle by button ID or class
    const id = button.id;
    if (id === 'bgTrackPlayBtn' || id === 'audioTrackPlayBtn' || id === 'masterPlayBtn') {
      // Play button clicks already have handlers, let them work
      return;
    }
  };

  // Single input handler for all range sliders - throttled for performance
  _timelineHandlers.inputHandler = throttle((e) => {
    const input = e.target;
    if (input.type !== 'range' && input.type !== 'number') return;

    // Update corresponding value display
    const valueDisplay = input.nextElementSibling;
    if (valueDisplay && valueDisplay.classList.contains('value')) {
      const suffix = input.id.includes('Hue') ? '°' : '';
      valueDisplay.textContent = input.value + suffix;
    }
  }, 16); // ~60fps

  // Single change handler for all selects - debounced
  _timelineHandlers.changeHandler = debounce((e) => {
    const select = e.target;
    if (select.tagName !== 'SELECT') return;

    // All selects already have specific handlers, this is for future additions
  }, 100);

  // Attach delegated listeners
  timelineSystem.addEventListener('click', _timelineHandlers.clickHandler);
  timelineSystem.addEventListener('input', _timelineHandlers.inputHandler);
  timelineSystem.addEventListener('change', _timelineHandlers.changeHandler);
}

// Cleanup function to remove all event listeners
function cleanupTimelineHandlers() {
  const timelineSystem = document.getElementById('timelineSystem');
  if (!timelineSystem) return;

  if (_timelineHandlers.clickHandler) {
    timelineSystem.removeEventListener('click', _timelineHandlers.clickHandler);
  }
  if (_timelineHandlers.inputHandler) {
    timelineSystem.removeEventListener('input', _timelineHandlers.inputHandler);
  }
  if (_timelineHandlers.changeHandler) {
    timelineSystem.removeEventListener('change', _timelineHandlers.changeHandler);
  }

  _timelineHandlers.clickHandler = null;
  _timelineHandlers.inputHandler = null;
  _timelineHandlers.changeHandler = null;
}

// Initialize delegation (this augments existing handlers, doesn't replace them)
if (typeof debounce !== 'undefined' && typeof throttle !== 'undefined') {
  initTimelineDelegation();
}

// Ensure non-loaded track controls start disabled.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncTrackMediaActionStates);
  } else {
    syncTrackMediaActionStates();
  }
}

// Export cleanup for potential use
window.cleanupTimelineEnhanced = cleanupTimelineHandlers;
