// VIRTUAL TIMELINE ENGINE
// ============================================================
const TRANSITION_DURATION = 0.5; // seconds
let vtTime = 0;         // current position in virtual timeline (seconds)
let vtPlaying = false;
let vtLastTick = 0;
let vtActiveClipIdx = 0;

function vtGetTotalDuration() {
  const clips = state.timeline.clips;
  if (clips.length === 0) return video.duration || 0;
  return clips.reduce((s, c) => s + c.duration * ((c.trimOut || 1) - (c.trimIn || 0)), 0);
}

function vtGetClipAt(t) {
  const clips = state.timeline.clips;
  if (clips.length === 0) return null;
  let offset = 0;
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    const clipDur = c.duration * ((c.trimOut || 1) - (c.trimIn || 0));
    if (t < offset + clipDur + 0.001) {
      const localTime = c.duration * (c.trimIn || 0) + (t - offset);
      return { index: i, clip: c, localTime, offset, clipDur };
    }
    offset += clipDur;
  }
  const last = clips[clips.length - 1];
  const lastDur = last.duration * ((last.trimOut || 1) - (last.trimIn || 0));
  return { index: clips.length - 1, clip: last, localTime: last.duration * (last.trimOut || 1), offset: offset - lastDur, clipDur: lastDur };
}

function vtGetTransition() {
  const clips = state.timeline.clips;
  const transType = document.getElementById('transitionSelect').value;
  if (transType === 'cut' || clips.length <= 1) return null;
  let offset = 0;
  for (let i = 0; i < clips.length - 1; i++) {
    const c = clips[i];
    const clipDur = c.duration * ((c.trimOut || 1) - (c.trimIn || 0));
    const transStart = offset + clipDur - TRANSITION_DURATION;
    if (vtTime >= transStart && vtTime < offset + clipDur) {
      const progress = (vtTime - transStart) / TRANSITION_DURATION;
      const next = clips[i + 1];
      return {
        type: transType,
        progress: Math.max(0, Math.min(1, progress)),
        outClip: c,
        inClip: next,
        outLocalTime: c.duration * (c.trimIn || 0) + (vtTime - offset),
        inLocalTime: next.duration * (next.trimIn || 0) + (vtTime - offset - clipDur) // will be near 0
      };
    }
    offset += clipDur;
  }
  return null;
}

function vtGetActiveVideo() {
  const clips = state.timeline.clips;
  if (clips.length === 0) return video;
  const info = vtGetClipAt(vtTime);
  return info ? info.clip.video : video;
}

function vtSeek(t) {
  const totalDur = vtGetTotalDuration();
  vtTime = Math.max(0, Math.min(t, totalDur));
  const clips = state.timeline.clips;
  if (clips.length === 0) {
    video.currentTime = vtTime;
    syncOverlays();
    // Sync background video
    if (state.bgVideo.enabled) {
      const bgVid = document.getElementById('bgVideo');
      if (bgVid && bgVid.readyState >= 2) {
        bgVid.currentTime = Math.min(vtTime, bgVid.duration - 0.01);
      }
    }
    return;
  }
  // Pause all clips
  clips.forEach(c => { if (c.video !== video) c.video.pause(); });
  const info = vtGetClipAt(vtTime);
  if (info) {
    vtActiveClipIdx = info.index;
    info.clip.video.currentTime = info.localTime;
    syncOverlays();
    // Sync background video
    if (state.bgVideo.enabled) {
      const bgVid = document.getElementById('bgVideo');
      if (bgVid && bgVid.readyState >= 2) {
        bgVid.currentTime = Math.min(vtTime, bgVid.duration - 0.01);
      }
    }
    if (vtPlaying) info.clip.video.play();
  }
}

function vtPlay() {
  if (vtPlaying) return;
  vtPlaying = true;
  vtLastTick = performance.now();
  const clips = state.timeline.clips;
  if (clips.length === 0) {
    video.play().catch(err => { console.warn('Main video play prevented:', err); });
  } else {
    const info = vtGetClipAt(vtTime);
    if (info) {
      vtActiveClipIdx = info.index;
      info.clip.video.currentTime = info.localTime;
      info.clip.video.playbackRate = state.timeline.speed;
      info.clip.video.play().catch(err => { console.warn('Clip video play prevented:', err); });
    }
  }
  iconPlay.style.display = 'none'; iconPause.style.display = 'block';
  state.videoOverlays.forEach(ov => { if (ov.video) ov.video.play().catch(err => { console.warn('Overlay video play prevented:', err); }); });
  if (state.bgVideo.enabled) document.getElementById('bgVideo').play().catch(err => { console.warn('Background video play prevented:', err); });
  syncOverlays();
}

function vtPause() {
  vtPlaying = false;
  const clips = state.timeline.clips;
  if (clips.length === 0) {
    video.pause();
  } else {
    clips.forEach(c => c.video.pause());
  }
  iconPlay.style.display = 'block'; iconPause.style.display = 'none';
  state.videoOverlays.forEach(ov => { if (ov.video) ov.video.pause(); });
  if (state.bgVideo.enabled) document.getElementById('bgVideo').pause();
  syncOverlays();
}

function vtToggle() {
  if (vtPlaying) vtPause(); else vtPlay();
}

function vtTick() {
  if (!vtPlaying) return;
  const now = performance.now();
  const delta = (now - vtLastTick) / 1000;
  vtLastTick = now;
  vtTime += delta * state.timeline.speed;

  const totalDur = vtGetTotalDuration();
  if (vtTime >= totalDur) {
    if (isLooping) {
      vtTime = 0;
      vtSeek(0);
      vtPlay();
    } else {
      vtTime = totalDur;
      vtPause();
    }
    return;
  }

  const clips = state.timeline.clips;
  if (clips.length > 0) {
    const info = vtGetClipAt(vtTime);
    if (info && info.index !== vtActiveClipIdx) {
      // Switch clips
      clips[vtActiveClipIdx].video.pause();
      vtActiveClipIdx = info.index;
      info.clip.video.currentTime = info.localTime;
      info.clip.video.playbackRate = state.timeline.speed;
      info.clip.video.play().catch(err => { console.warn('Clip video play prevented:', err); });
    }
    // Handle transition — keep both clips playing during overlap
    const trans = vtGetTransition();
    if (trans && trans.inClip.video.paused) {
      trans.inClip.video.currentTime = trans.inClip.duration * (trans.inClip.trimIn || 0);
      trans.inClip.video.playbackRate = state.timeline.speed;
      trans.inClip.video.play().catch(err => { console.warn('Transition inClip video play prevented:', err); });
    }
  }

  // Update progress UI
  progressFill.style.width = (vtTime / totalDur * 100) + '%';
  timeLabel.textContent = fmt(vtTime) + ' / ' + fmt(totalDur);
  updateTimelineScrubber();
}

// TIMELINE
// ============================================================
function rebuildTimeline() {
  const track = document.getElementById('timelineTrack');
  if (!track) return;
  track.querySelectorAll('.clip-block, .trim-handle, .keyframe-diamond, .clip-trans-indicator, .anno-marker').forEach(el => el.remove());

  const totalDuration = vtGetTotalDuration() || 1;
  const transType = document.getElementById('transitionSelect').value;

  let offset = 0;
  state.timeline.clips.forEach((clip, i) => {
    const clipDur = clip.duration * ((clip.trimOut || 1) - (clip.trimIn || 0));
    const block = document.createElement('div');
    block.className = 'clip-block';
    if (i === vtActiveClipIdx) block.classList.add('active');
    block.style.left = (offset / totalDuration * 100) + '%';
    block.style.width = (clipDur / totalDuration * 100) + '%';
    block.dataset.clipIdx = i;

    // Clip label
    const label = document.createElement('span');
    label.textContent = clip.name || 'Clip ' + (i+1);
    label.style.pointerEvents = 'none';
    block.appendChild(label);

    block.style.background = `rgba(${96 + i*50},${165 - i*30},${250 - i*40},0.2)`;
    block.style.borderColor = `rgba(${96 + i*50},${165 - i*30},${250 - i*40},0.4)`;

    // Per-clip trim handles
    const leftH = document.createElement('div');
    leftH.className = 'clip-trim-handle left';
    block.appendChild(leftH);
    makeClipTrimDraggable(leftH, i, 'left');

    const rightH = document.createElement('div');
    rightH.className = 'clip-trim-handle right';
    block.appendChild(rightH);
    makeClipTrimDraggable(rightH, i, 'right');

    // Click to seek to clip start
    block.addEventListener('click', e => {
      if (e.target.classList.contains('clip-trim-handle')) return;
      let seekT = 0;
      for (let j = 0; j < i; j++) {
        const cj = state.timeline.clips[j];
        seekT += cj.duration * ((cj.trimOut || 1) - (cj.trimIn || 0));
      }
      vtSeek(seekT);
    });

    // Drag reordering
    block.draggable = true;
    block.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(i));
      block.classList.add('dragging');
    });
    block.addEventListener('dragend', () => { block.classList.remove('dragging'); });
    block.addEventListener('dragover', e => { e.preventDefault(); });
    block.addEventListener('drop', e => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const toIdx = i;
      if (fromIdx === toIdx) return;
      pushUndoState();
      const [moved] = state.timeline.clips.splice(fromIdx, 1);
      state.timeline.clips.splice(toIdx, 0, moved);
      rebuildTimeline();
    });

    track.appendChild(block);

    // Transition indicator between clips
    if (transType !== 'cut' && i < state.timeline.clips.length - 1) {
      const indicator = document.createElement('div');
      indicator.className = 'clip-trans-indicator';
      indicator.style.left = ((offset + clipDur) / totalDuration * 100) + '%';
      indicator.style.transform = 'translateX(-2px)';
      indicator.title = transType;
      track.appendChild(indicator);
    }

    offset += clipDur;
  });

  // Keyframe diamonds
  state.timeline.keyframes.forEach((kf, i) => {
    const diamond = document.createElement('div');
    diamond.className = 'keyframe-diamond';
    diamond.style.left = (kf.time / totalDuration * 100) + '%';
    diamond.style.bottom = '2px';
    diamond.title = `KF ${i+1}: ${kf.time.toFixed(1)}s`;
    diamond.addEventListener('dblclick', () => {
      state.timeline.keyframes.splice(i, 1);
      rebuildTimeline();
    });
    track.appendChild(diamond);
  });

  // Annotation time range markers
  state.layers.forEach(layer => {
    if (layer.type !== 'annotation') return;
    if (layer.startTime === undefined) return;
    const endT = layer.endTime === Infinity ? totalDuration : layer.endTime;
    const leftPct = Math.max(0, layer.startTime / totalDuration * 100);
    const widthPct = Math.min(100 - leftPct, (endT - layer.startTime) / totalDuration * 100);
    const marker = document.createElement('div');
    marker.className = 'anno-marker';
    marker.style.cssText = 'position:absolute;bottom:0;height:3px;border-radius:1px;opacity:0.7;pointer-events:none;background:' + (layer.color || '#ff4444');
    marker.style.left = leftPct + '%';
    marker.style.width = widthPct + '%';
    marker.title = (layer.annoType || 'Annotation') + ': ' + layer.startTime.toFixed(1) + 's\u2013' + (layer.endTime === Infinity ? 'end' : layer.endTime.toFixed(1) + 's');
    track.appendChild(marker);
  });
}

function makeClipTrimDraggable(handle, clipIdx, side) {
  handle.addEventListener('mousedown', e => {
    e.stopPropagation();
    e.preventDefault();
    pushUndoState();

    let dragging = true;

    const onMove = evt => {
      if (!dragging) return;
      const clip = state.timeline.clips[clipIdx];
      if (!clip) return;

      const track = document.getElementById('timelineTrack');
      if (!track) return;
      const block = track.querySelector(`.clip-block[data-clip-idx="${clipIdx}"]`);
      if (!block) return;
      const rect = block.getBoundingClientRect();
      let pct = (evt.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));

      let newTrimIn = clip.trimIn || 0;
      let newTrimOut = clip.trimOut || 1;

      if (side === 'left') {
        newTrimIn = Math.min(pct, (clip.trimOut || 1) - 0.02);
      } else {
        newTrimOut = Math.max(pct, (clip.trimIn || 0) + 0.02);
      }

      // Snap right trim to playhead if close.
      let clipStartGlobal = 0;
      for (let i = 0; i < clipIdx; i++) {
        const c = state.timeline.clips[i];
        clipStartGlobal += c.duration * ((c.trimOut || 1) - (c.trimIn || 0));
      }
      const totalDur = vtGetTotalDuration();
      if (totalDur > 0 && side === 'right') {
        const snapThresh = 0.1;
        const proposedEndTime = clipStartGlobal + clip.duration * (newTrimOut - (clip.trimIn || 0));
        if (Math.abs(proposedEndTime - vtTime) < snapThresh) {
          newTrimOut = (vtTime - clipStartGlobal) / clip.duration + (clip.trimIn || 0);
        }
      }

      if (side === 'left') {
        clip.trimIn = Math.min(Math.max(0, newTrimIn), (clip.trimOut || 1) - 0.02);
      } else {
        clip.trimOut = Math.max(Math.min(1, newTrimOut), (clip.trimIn || 0) + 0.02);
      }

      rebuildTimeline();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function updateTimelineScrubber() {
  const scrubber = document.getElementById('timelineScrubber');
  const track = document.getElementById('timelineTrack');
  // Add null check for scrubber element
  if (!scrubber) {
    console.warn('Timeline scrubber element not found');
    return;
  }

  const totalDuration = vtGetTotalDuration();
  if (!totalDuration || typeof totalDuration !== 'number' || isNaN(totalDuration)) return;

  // Use requestAnimationFrame for smooth animations
  requestAnimationFrame(() => {
    try {
      const pct = (vtTime / totalDuration) * 100;

      // Validate percentage before applying
      if (typeof pct === 'number' && !isNaN(pct)) {
        const clampedPct = Math.max(0, Math.min(100, pct));
        scrubber.style.transform = `translateX(${clampedPct}%)`;
        scrubber.style.left = '0';
      }

      // Update active clip highlight with null check
      if (!track) return;

      const info = vtGetClipAt(vtTime);
      if (info) {
        const clipBlocks = track.querySelectorAll('.clip-block');
        clipBlocks.forEach((b, i) => {
          b.classList.toggle('active', i === info.index);
        });
      }
    } catch (error) {
      console.error('Error updating timeline scrubber:', error);
    }
  });
}

// Timeline zoom controls
let timelineZoom = 1;
const TIMELINE_ZOOM_MIN = 1;
const TIMELINE_ZOOM_MAX = 3;
const TIMELINE_ZOOM_STEP = 0.25;

function applyTimelineZoom() {
  const track = document.getElementById('timelineTrack');
  if (!track) return;
  track.style.transformOrigin = 'left center';
  track.style.transform = `scaleX(${timelineZoom})`;
}

function setTimelineZoom(nextZoom) {
  const clamped = Math.max(TIMELINE_ZOOM_MIN, Math.min(TIMELINE_ZOOM_MAX, nextZoom));
  timelineZoom = Math.round(clamped * 100) / 100;
  applyTimelineZoom();

  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  if (zoomOutBtn) zoomOutBtn.disabled = timelineZoom <= TIMELINE_ZOOM_MIN;
  if (zoomInBtn) zoomInBtn.disabled = timelineZoom >= TIMELINE_ZOOM_MAX;
}

document.getElementById('zoomInBtn')?.addEventListener('click', () => {
  setTimelineZoom(timelineZoom + TIMELINE_ZOOM_STEP);
});

document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
  setTimelineZoom(timelineZoom - TIMELINE_ZOOM_STEP);
});

setTimelineZoom(1);

// ============================================================
