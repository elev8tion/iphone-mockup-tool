// ============================================================
// ENHANCED TIMELINE SYSTEM
// Background video controls and multi-track timeline management
// ============================================================

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

// Initialize enhanced timeline
function initEnhancedTimeline() {
  const timelineSystem = document.getElementById('timelineSystem');
  const bgVideoTrack = document.getElementById('bgVideoTrack');
  const bgVideo = document.getElementById('bgVideo');

  if (!timelineSystem) return;

  // Show timeline system when video is loaded
  if (hasVideo) {
    timelineSystem.classList.add('visible');
  }

  // Show background video track when background video is loaded
  if (state.bgVideo.enabled && bgVideo && bgVideo.src) {
    bgVideoTrack.classList.add('active');
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

  // Show/hide entire timeline system
  if (hasVideo) {
    timelineSystem.classList.add('visible');
  } else {
    timelineSystem.classList.remove('visible');
  }

  // Show/hide background video track
  if (state.bgVideo.enabled && bgVideo && bgVideo.src) {
    setTimeout(() => bgVideoTrack?.classList.add('active'), 50);
  } else {
    bgVideoTrack?.classList.remove('active');
  }

  // Show/hide background audio track
  if (state.bgAudio.enabled && bgAudio && bgAudio.src) {
    setTimeout(() => {
      bgAudioTrack?.classList.add('active');
      updateStageSpacing();
    }, 50);
  } else {
    bgAudioTrack?.classList.remove('active');
  }

  // Update stage spacing
  setTimeout(() => updateStageSpacing(), 100);
}

// ============================================================
// RENDER LOOP INTEGRATION
// ============================================================

// Call this in the main render loop to keep displays updated
function updateEnhancedTimelineDisplays() {
  if (!hasVideo) return;

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
}

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
  const hasBgVideo = bgVideoTrack?.classList.contains('active') && !bgVideoTrack?.classList.contains('collapsed');
  const hasBgAudio = bgAudioTrack?.classList.contains('active') && !bgAudioTrack?.classList.contains('collapsed');
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

// Initialize background video timeline when loaded
document.getElementById('bgVideoInput')?.addEventListener('change', () => {
  setTimeout(() => {
    updateTimelineVisibility();
    const bgLoopBtn = document.getElementById('bgLoopBtn');
    if (bgLoopBtn) {
      bgLoopBtn.classList.add('active'); // Default to loop enabled
    }
  }, 100);
});

// Update displays every frame
if (typeof requestAnimationFrame !== 'undefined') {
  function enhancedTimelineRenderLoop() {
    updateEnhancedTimelineDisplays();
    requestAnimationFrame(enhancedTimelineRenderLoop);
  }
  enhancedTimelineRenderLoop();
}
