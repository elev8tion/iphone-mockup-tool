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
      const bgVideo = document.getElementById('bgVideo');
      if (bgVideo) {
        bgVideo.style.filter = 'blur(10px)';
      }
      showToast('Background blurred', 'info');
    }
  },
  blackAndWhite: {
    name: 'Black & White',
    apply: () => {
      pushUndoState();
      const bgVideo = document.getElementById('bgVideo');
      if (bgVideo) {
        bgVideo.style.filter = 'grayscale(100%)';
      }
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
      const bgVideo = document.getElementById('bgVideo');
      if (bgVideo) {
        bgVideo.style.filter = '';
      }
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
  this.classList.toggle('active', bgVideoLoop);

  showToast(bgVideoLoop ? 'Background loop enabled' : 'Background loop disabled', 'info');
});

// Background video speed control
document.getElementById('bgSpeedSelect')?.addEventListener('change', (e) => {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo) return;

  bgVideoSpeed = parseFloat(e.target.value);
  bgVideo.playbackRate = bgVideoSpeed;
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
  this.classList.toggle('synced', bgVideoSynced);

  if (bgVideoSynced) {
    showToast('Background synced with main video', 'success');
    syncBgVideoWithMain();
  } else {
    showToast('Background independent playback', 'info');
  }
});

function syncBgVideoWithMain() {
  if (!bgVideoSynced) return;

  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo || !hasVideo) return;

  // Sync currentTime
  const mainTime = vtTime;
  if (bgVideo.duration > 0) {
    bgVideo.currentTime = mainTime % bgVideo.duration;
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
  // Main video loop
  if (state.loops?.main?.enabled && hasVideo) {
    const loop = state.loops.main;
    const duration = vtGetTotalDuration();
    const loopStart = loop.start * duration;
    const loopEnd = loop.end * duration;

    if (vtTime >= loopEnd) {
      seekTo(loopStart);
    }
  }

  // Background video loop
  if (state.loops?.bgVideo?.enabled && state.bgVideo.enabled) {
    const bgVideo = document.getElementById('bgVideo');
    if (!bgVideo) return;

    const loop = state.loops.bgVideo;
    const duration = bgVideo.duration;
    if (!duration || isNaN(duration)) return;

    const loopStart = loop.start * duration;
    const loopEnd = loop.end * duration;

    if (bgVideo.currentTime >= loopEnd) {
      bgVideo.currentTime = loopStart;
    }
  }

  // Background audio loop
  if (state.loops?.bgAudio?.enabled && state.bgAudio.enabled) {
    const bgAudio = document.getElementById('bgAudio');
    if (!bgAudio) return;

    const loop = state.loops.bgAudio;
    const duration = bgAudio.duration;
    if (!duration || isNaN(duration)) return;

    const loopStart = loop.start * duration;
    const loopEnd = loop.end * duration;

    if (bgAudio.currentTime >= loopEnd) {
      bgAudio.currentTime = loopStart;
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

    const status = document.getElementById('bgAudioStatus');
    if (status) {
      const duration = formatTime(bgAudio.duration);
      status.textContent = `${file.name} (${duration})`;
    }

    // Show audio track in timeline
    updateTimelineVisibility();

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

  showToast(bgAudioLoop ? 'Audio loop enabled' : 'Audio loop disabled', 'info');
});

// Audio volume control
document.getElementById('audioVolumeSlider')?.addEventListener('input', (e) => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  bgAudioVolume = parseInt(e.target.value) / 100;
  bgAudio.volume = bgAudioVolume;
  state.bgAudio.volume = bgAudioVolume;
});

// Audio speed control
document.getElementById('audioSpeedSelect')?.addEventListener('change', (e) => {
  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) return;

  bgAudioSpeed = parseFloat(e.target.value);
  bgAudio.playbackRate = bgAudioSpeed;
  state.bgAudio.speed = bgAudioSpeed;
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
  this.classList.toggle('synced', bgAudioSynced);

  if (bgAudioSynced) {
    showToast('Audio synced with main video', 'success');
    syncAudioWithMain();
  } else {
    showToast('Audio independent playback', 'info');
  }
});

function syncAudioWithMain() {
  if (!bgAudioSynced) return;

  const bgAudio = document.getElementById('bgAudio');
  if (!bgAudio || !hasVideo) return;

  // Sync currentTime
  const mainTime = vtTime;
  if (bgAudio.duration > 0) {
    bgAudio.currentTime = mainTime % bgAudio.duration;
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
  bgAudioPlaying = false;

  const status = document.getElementById('bgAudioStatus');
  if (status) status.textContent = '';

  updateTimelineVisibility();
  showToast('Background audio removed', 'info');
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
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

  dropdowns.forEach(dd => dd.classList.remove('is-open'));
  buttons.forEach(btn => {
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

// Toggle background video actions dropdown with CSS classes
document.getElementById('bgVideoActionsBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.currentTarget;
  const dropdown = document.getElementById('bgVideoActionsDropdown');
  const isOpen = dropdown.classList.contains('is-open');

  // Close all other dropdowns first
  closeAllDropdowns();

  if (!isOpen) {
    // Open this dropdown
    dropdown.classList.add('is-open');
    btn.classList.add('is-open');
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
  e.stopPropagation();
  const btn = e.currentTarget;
  const dropdown = document.getElementById('bgAudioActionsDropdown');
  const isOpen = dropdown.classList.contains('is-open');

  // Close all other dropdowns first
  closeAllDropdowns();

  if (!isOpen) {
    // Open this dropdown
    dropdown.classList.add('is-open');
    btn.classList.add('is-open');
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
// EFFECTS PANEL TOGGLES
// ============================================================

// Background audio effects panel toggle
document.getElementById('bgAudioEffectsToggle')?.addEventListener('click', function() {
  const section = document.getElementById('bgAudioEffectsSection');
  if (!section) return;

  section.classList.toggle('collapsed');
  this.textContent = section.classList.contains('collapsed') ? '🎚️ Audio Effects' : '🎚️ Hide Effects';
});

// Background video effects panel toggle
document.getElementById('bgVideoEffectsToggle')?.addEventListener('click', function() {
  const section = document.getElementById('bgVideoEffectsSection');
  if (!section) return;

  section.classList.toggle('collapsed');
  this.textContent = section.classList.contains('collapsed') ? '✨ Video Effects' : '✨ Hide Effects';
});

// Main video effects panel toggle
document.getElementById('mainVideoEffectsToggle')?.addEventListener('click', function() {
  const section = document.getElementById('mainVideoEffectsSection');
  if (!section) return;

  section.classList.toggle('collapsed');
  this.textContent = section.classList.contains('collapsed') ? '✨ Video Effects' : '✨ Hide Effects';
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

// ============================================================
// AUDIO EFFECTS CONTROLS
// ============================================================

// Background Audio EQ Controls
document.getElementById('bgAudioEQLow')?.addEventListener('input', (e) => {
  state.audioEffects.bgAudio.eq.low = parseFloat(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value + ' dB';
  scheduleSave();
});

document.getElementById('bgAudioEQMid')?.addEventListener('input', (e) => {
  state.audioEffects.bgAudio.eq.mid = parseFloat(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value + ' dB';
  scheduleSave();
});

document.getElementById('bgAudioEQHigh')?.addEventListener('input', (e) => {
  state.audioEffects.bgAudio.eq.high = parseFloat(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value + ' dB';
  scheduleSave();
});

// Background Audio Volume FX
document.getElementById('bgAudioVolumeFX')?.addEventListener('input', (e) => {
  state.audioEffects.bgAudio.volume = parseFloat(e.target.value) / 100;
  e.target.nextElementSibling.textContent = e.target.value + '%';
  scheduleSave();
});

// Background Audio Pan
document.getElementById('bgAudioPan')?.addEventListener('input', (e) => {
  state.audioEffects.bgAudio.pan = parseFloat(e.target.value);
  const val = e.target.value;
  const label = val == 0 ? 'Center' : (val < 0 ? val + ' L' : '+' + val + ' R');
  e.target.nextElementSibling.textContent = label;
  scheduleSave();
});

// Compressor Enable
document.getElementById('bgAudioCompressorEnable')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.compressor.enabled = e.target.checked;
  const controls = document.getElementById('bgAudioCompressorControls');
  if (controls) controls.style.display = e.target.checked ? 'block' : 'none';
  scheduleSave();
});

// Compressor Controls
document.getElementById('bgAudioCompThreshold')?.addEventListener('input', (e) => {
  state.audioEffects.bgAudio.compressor.threshold = parseFloat(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value + ' dB';
  scheduleSave();
});

document.getElementById('bgAudioCompRatio')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.compressor.ratio = parseFloat(e.target.value);
  scheduleSave();
});

// Reverb Enable
document.getElementById('bgAudioReverbEnable')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.reverb.enabled = e.target.checked;
  scheduleSave();
});

// Echo Enable
document.getElementById('bgAudioEchoEnable')?.addEventListener('change', (e) => {
  state.audioEffects.bgAudio.echo.enabled = e.target.checked;
  scheduleSave();
});

// Audio Preset Selector
document.getElementById('bgAudioPreset')?.addEventListener('change', (e) => {
  const preset = e.target.value;
  if (!preset) return;

  // Apply preset values
  const presets = {
    podcast: { eq: { low: -2, mid: 3, high: 2 }, compressor: { enabled: true, threshold: -18, ratio: 3 } },
    music: { eq: { low: 2, mid: 0, high: 3 }, compressor: { enabled: false } },
    bass: { eq: { low: 8, mid: -2, high: 0 }, compressor: { enabled: true, threshold: -12, ratio: 1.5 } },
    vocal: { eq: { low: -3, mid: 5, high: 4 }, compressor: { enabled: true, threshold: -15, ratio: 3 } },
    radio: { eq: { low: -5, mid: 4, high: -2 }, compressor: { enabled: true, threshold: -10, ratio: 8 } },
    spacious: { eq: { low: 0, mid: 0, high: 2 }, reverb: { enabled: true } }
  };

  if (presets[preset]) {
    Object.assign(state.audioEffects.bgAudio, presets[preset]);
    // Update UI
    document.getElementById('bgAudioEQLow').value = state.audioEffects.bgAudio.eq.low;
    document.getElementById('bgAudioEQMid').value = state.audioEffects.bgAudio.eq.mid;
    document.getElementById('bgAudioEQHigh').value = state.audioEffects.bgAudio.eq.high;
    if (presets[preset].compressor) {
      document.getElementById('bgAudioCompressorEnable').checked = presets[preset].compressor.enabled;
    }
    if (presets[preset].reverb) {
      document.getElementById('bgAudioReverbEnable').checked = presets[preset].reverb.enabled;
    }
    showToast('Preset applied: ' + preset, 'success');
  }

  e.target.value = ''; // Reset dropdown
  scheduleSave();
});

// ============================================================
// VIDEO EFFECTS CONTROLS
// ============================================================

// Background Video Color Correction
document.getElementById('bgVideoBrightness')?.addEventListener('input', (e) => {
  state.videoEffects.bgVideo.brightness = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('bgVideoContrast')?.addEventListener('input', (e) => {
  state.videoEffects.bgVideo.contrast = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('bgVideoSaturation')?.addEventListener('input', (e) => {
  state.videoEffects.bgVideo.saturation = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('bgVideoHue')?.addEventListener('input', (e) => {
  state.videoEffects.bgVideo.hue = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value + '°';
  scheduleSave();
});

document.getElementById('bgVideoTemp')?.addEventListener('input', (e) => {
  state.videoEffects.bgVideo.temperature = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

// Background Video Blend Mode
document.getElementById('bgVideoBlendMode')?.addEventListener('change', (e) => {
  state.videoEffects.bgVideo.blendMode = e.target.value;
  scheduleSave();
});

// Background Video Preset
document.getElementById('bgVideoPreset')?.addEventListener('change', (e) => {
  const preset = e.target.value;
  if (!preset) return;

  const presets = {
    cinematic: { brightness: 0, contrast: 15, saturation: -10, hue: 0, temperature: 5 },
    vibrant: { brightness: 10, contrast: 20, saturation: 30, hue: 0, temperature: 0 },
    vintage: { brightness: -5, contrast: 10, saturation: -20, hue: 15, temperature: 20 },
    bwContrast: { brightness: 0, contrast: 40, saturation: -100, hue: 0, temperature: 0 },
    cool: { brightness: 0, contrast: 5, saturation: 0, hue: 0, temperature: -30 },
    warm: { brightness: 5, contrast: 5, saturation: 5, hue: 0, temperature: 30 },
    fade: { brightness: 15, contrast: -15, saturation: -25, hue: 0, temperature: 10 },
    dramatic: { brightness: -10, contrast: 35, saturation: -5, hue: 0, temperature: -5 }
  };

  if (presets[preset]) {
    Object.assign(state.videoEffects.bgVideo, presets[preset]);
    // Update UI
    document.getElementById('bgVideoBrightness').value = presets[preset].brightness;
    document.getElementById('bgVideoContrast').value = presets[preset].contrast;
    document.getElementById('bgVideoSaturation').value = presets[preset].saturation;
    document.getElementById('bgVideoHue').value = presets[preset].hue;
    document.getElementById('bgVideoTemp').value = presets[preset].temperature;
    showToast('Preset applied: ' + preset, 'success');
  }

  e.target.value = ''; // Reset dropdown
  scheduleSave();
});

// Main Video Color Correction (same as background)
document.getElementById('mainVideoBrightness')?.addEventListener('input', (e) => {
  state.videoEffects.main.brightness = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('mainVideoContrast')?.addEventListener('input', (e) => {
  state.videoEffects.main.contrast = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('mainVideoSaturation')?.addEventListener('input', (e) => {
  state.videoEffects.main.saturation = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('mainVideoHue')?.addEventListener('input', (e) => {
  state.videoEffects.main.hue = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value + '°';
  scheduleSave();
});

document.getElementById('mainVideoTemp')?.addEventListener('input', (e) => {
  state.videoEffects.main.temperature = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = e.target.value;
  scheduleSave();
});

document.getElementById('mainVideoPreset')?.addEventListener('change', (e) => {
  const preset = e.target.value;
  if (!preset) return;

  const presets = {
    cinematic: { brightness: 0, contrast: 15, saturation: -10, hue: 0, temperature: 5 },
    vibrant: { brightness: 10, contrast: 20, saturation: 30, hue: 0, temperature: 0 },
    vintage: { brightness: -5, contrast: 10, saturation: -20, hue: 15, temperature: 20 },
    bwContrast: { brightness: 0, contrast: 40, saturation: -100, hue: 0, temperature: 0 },
    cool: { brightness: 0, contrast: 5, saturation: 0, hue: 0, temperature: -30 },
    warm: { brightness: 5, contrast: 5, saturation: 5, hue: 0, temperature: 30 },
    fade: { brightness: 15, contrast: -15, saturation: -25, hue: 0, temperature: 10 },
    dramatic: { brightness: -10, contrast: 35, saturation: -5, hue: 0, temperature: -5 }
  };

  if (presets[preset]) {
    Object.assign(state.videoEffects.main, presets[preset]);
    // Update UI
    document.getElementById('mainVideoBrightness').value = presets[preset].brightness;
    document.getElementById('mainVideoContrast').value = presets[preset].contrast;
    document.getElementById('mainVideoSaturation').value = presets[preset].saturation;
    document.getElementById('mainVideoHue').value = presets[preset].hue;
    document.getElementById('mainVideoTemp').value = presets[preset].temperature;
    showToast('Preset applied: ' + preset, 'success');
  }

  e.target.value = ''; // Reset dropdown
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

// Export cleanup for potential use
window.cleanupTimelineEnhanced = cleanupTimelineHandlers;
