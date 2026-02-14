// SCREENSHOT
// ============================================================
ssBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.download = 'mockup-' + Date.now() + '.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('Screenshot saved', 'success');
});

// ============================================================
// THUMBNAIL
// ============================================================
thumbBtn.addEventListener('click', () => {
  if (!hasVideo) return;
  vtPause();
  // Render at preset size
  const sz = getCanvasSize();
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = sz.w;
  thumbCanvas.height = sz.h;
  const tCtx = thumbCanvas.getContext('2d');
  tCtx.drawImage(canvas, 0, 0, sz.w, sz.h);
  const a = document.createElement('a');
  a.download = 'thumbnail-' + Date.now() + '.png';
  a.href = thumbCanvas.toDataURL('image/png');
  a.click();
  showToast('Thumbnail saved', 'success');
});

// ============================================================
// VIDEO EXPORT
// ============================================================
let recorder = null;
let destNode = null;

// UI state helper for export button feedback
let exportInProgress = false;
function updateExportButtonState(isExporting) {
  const exportBtnEl = document.getElementById('exportBtn');
  if (!exportBtnEl) return;
  exportInProgress = isExporting;
  if (isExporting) {
    exportBtnEl.classList.add('exporting');
    exportBtnEl.disabled = true;
  } else {
    exportBtnEl.classList.remove('exporting');
    exportBtnEl.disabled = false;
  }
}

const exportDialog = document.getElementById('exportDialog');
const edResolution = document.getElementById('edResolution');
const edQuality = document.getElementById('edQuality');
const edFramerate = document.getElementById('edFramerate');
const edAudio = document.getElementById('edAudio');
const edEstimate = document.getElementById('edEstimate');
const edFormat = document.getElementById('edFormat');
const edFormatNote = document.getElementById('edFormatNote');

function updateExportEstimate() {
  const sz = getCanvasSize();
  let w = sz.w, h = sz.h;
  const res = edResolution.value;
  if (res === '1080') { const s = 1080 / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
  else if (res === '720') { const s = 720 / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
  // Ensure even dimensions
  w = w % 2 === 0 ? w : w + 1;
  h = h % 2 === 0 ? h : h + 1;
  const totalDur = vtGetTotalDuration();
  const dur = totalDur ? (totalDur / state.timeline.speed).toFixed(1) : '?';
  edEstimate.textContent = '~' + dur + 's of video at ' + w + '\u00d7' + h + ' · ' + edFramerate.value + ' fps';
}

function openExportDialog() {
  updateExportEstimate();
  const mp4Option = edFormat.querySelector('option[value="mp4"]');
  if (typeof VideoEncoder === 'undefined') {
    mp4Option.disabled = true;
    mp4Option.textContent = 'MP4 (not supported)';
  } else {
    mp4Option.disabled = false;
    mp4Option.textContent = 'MP4 (H.264) \u2605 Recommended';
  }
  if (edFormat.value === 'mp4' && typeof VideoEncoder !== 'undefined') {
    edFormatNote.textContent = 'H.264 via WebCodecs \u2014 best compatibility for sharing.';
    edFormatNote.style.color = '#888';
    edFormatNote.style.display = 'block';
  } else {
    edFormatNote.style.display = 'none';
  }
  exportDialog.classList.add('open');
}

function closeExportDialog() {
  exportDialog.classList.remove('open');
}

edResolution.addEventListener('change', updateExportEstimate);
edFramerate.addEventListener('change', updateExportEstimate);
edQuality.addEventListener('change', updateExportEstimate);
edFormat.addEventListener('change', () => {
  if (edFormat.value === 'mp4') {
    if (typeof VideoEncoder === 'undefined') {
      edFormatNote.textContent = '\u26a0 MP4 export requires WebCodecs API (Chrome 94+). Use WebM instead.';
      edFormatNote.style.color = '#e55';
      edFormatNote.style.display = 'block';
      edFormat.value = 'webm';
    } else {
      edFormatNote.textContent = 'H.264 via WebCodecs \u2014 best compatibility for sharing.';
      edFormatNote.style.color = '#888';
      edFormatNote.style.display = 'block';
    }
  } else {
    edFormatNote.style.display = 'none';
  }
  updateExportEstimate();
});
document.getElementById('edCancel').addEventListener('click', closeExportDialog);
exportDialog.addEventListener('click', e => { if (e.target === exportDialog) closeExportDialog(); });

exportBtn.addEventListener('click', () => {
  if (!hasVideo) return;
  if (isExporting) { stopExport(); return; }
  openExportDialog();
});

document.getElementById('edStart').addEventListener('click', () => {
  closeExportDialog();
  startExport();
});

function startExport() {
  if (edFormat.value === 'mp4') { startMp4Export(); return; }
  isExporting = true;
  exportBtn.textContent = 'Stop';
  exportBtn.classList.add('recording');
  exportStatus.classList.add('visible');
  exportText.textContent = 'Preparing...';
  exportBarFill.style.width = '0%';
  updateExportButtonState(true);

  // Inject a cancel button into the export status UI (if not present)
  (function ensureCancelButton() {
    let btn = document.getElementById('exportCancelBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'exportCancelBtn';
      btn.className = 'btn btn-danger';
      btn.style.marginLeft = '8px';
      btn.style.fontSize = '10px';
      btn.textContent = 'Cancel';
      btn.title = 'Cancel export';
      btn.addEventListener('click', (e) => { e.stopPropagation(); stopExport(); });
      exportStatus.appendChild(btn);
    }
  })();

  // Read settings from dialog
  const bitrate = parseInt(edQuality.value);
  const fps = parseInt(edFramerate.value);
  const includeAudio = edAudio.checked;

  const origSz = getCanvasSize();
  let expW = origSz.w, expH = origSz.h;
  const res = edResolution.value;
  if (res === '1080') { const s = 1080 / Math.max(expW, expH); expW = Math.round(expW * s); expH = Math.round(expH * s); }
  else if (res === '720') { const s = 720 / Math.max(expW, expH); expW = Math.round(expW * s); expH = Math.round(expH * s); }
  // Ensure even dimensions for codec compatibility
  expW = expW % 2 === 0 ? expW : expW + 1;
  expH = expH % 2 === 0 ? expH : expH + 1;

  // Create export canvas at target resolution
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = expW;
  exportCanvas.height = expH;
  const eCtx = exportCanvas.getContext('2d');

  let exportRAF;
  function exportLoop() {
    eCtx.clearRect(0, 0, expW, expH);
    eCtx.drawImage(canvas, 0, 0, expW, expH);
    if (isExporting) exportRAF = requestAnimationFrame(exportLoop);
  }
  exportLoop();

  // Capture stream at target framerate
  const expStream = exportCanvas.captureStream(fps);

  // Audio (uses shared AudioContext singleton)
  if (includeAudio) {
    try {
      var _actx = getSharedAudioContext();
      destNode = _actx.createMediaStreamDestination();
      
      // Connect all active audio chains to the destination node
      Object.keys(audioChains).forEach(track => {
        const chain = audioChains[track];
        if (chain && chain.initialized) {
          chain.setDestination(destNode);
        }
      });

      // If main video doesn't have a chain yet, connect its source directly
      if (!audioChains.main || !audioChains.main.initialized) {
        var _srcNode = getSharedSourceNode();
        _srcNode.disconnect();
        _srcNode.connect(destNode);
        _srcNode.connect(_actx.destination);
      }

      for (const t of destNode.stream.getAudioTracks()) expStream.addTrack(t);
    } catch (err) { console.log('Audio capture skipped:', err.message); }
  }

  let mime = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';

  const chunks = [];
  recorder = new MediaRecorder(expStream, { mimeType: mime, videoBitsPerSecond: bitrate });
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const a = document.createElement('a');
    a.download = 'mockup-' + Date.now() + '.webm';
    a.href = URL.createObjectURL(blob);
    a.click();
    isExporting = false;
    exportBtn.textContent = 'Export';
    exportBtn.classList.remove('recording');
    exportStatus.classList.remove('visible');
    updateExportButtonState(false);
    // Reset audio chain destinations
    Object.keys(audioChains).forEach(track => {
      const chain = audioChains[track];
      if (chain && chain.initialized) {
        chain.setDestination(null);
      }
    });

    reconnectAudioGraph();
    showToast('Export complete — WebM downloaded', 'success');

    // Show success animation
    const exportSuccess = document.getElementById('exportSuccess');
    if (exportSuccess) {
      exportSuccess.style.display = 'flex';
      setTimeout(() => {
        exportSuccess.style.display = 'none';
      }, 2500);
    }
  };

  // Play from start of virtual timeline
  vtSeek(0);
  vtPlay();
  recorder.start(100);
  exportText.textContent = 'Recording...';
  showToast('Recording started...', 'info');

  const exportTotalDur = vtGetTotalDuration();
  const poll = setInterval(() => {
    if (!isExporting) { clearInterval(poll); return; }
    const p = Math.min(100, vtTime / exportTotalDur * 100);
    exportBarFill.style.width = p + '%';
    exportText.textContent = 'Exporting... ' + Math.round(p) + '%';
    // Check if timeline finished
    if (vtTime >= exportTotalDur - 0.05 && !vtPlaying) {
      clearInterval(poll);
      setTimeout(() => stopExport(), 400);
    }
  }, 250);
}

function stopExport() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
  vtPause();
  isExporting = false;
}

async function startMp4Export() {
  if (typeof VideoEncoder === 'undefined') {
    showToast('MP4 export requires WebCodecs API (Chrome 94+)', 'error');
    return;
  }

  isExporting = true;
  exportBtn.textContent = 'Stop';
  exportBtn.classList.add('recording');
  exportStatus.classList.add('visible');
  exportText.textContent = 'Preparing MP4...';
  exportBarFill.style.width = '0%';
  updateExportButtonState(true);

  // Inject a cancel button into the export status UI (if not present)
  (function ensureCancelButton() {
    let btn = document.getElementById('exportCancelBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'exportCancelBtn';
      btn.className = 'btn btn-danger';
      btn.style.marginLeft = '8px';
      btn.style.fontSize = '10px';
      btn.textContent = 'Cancel';
      btn.title = 'Cancel export';
      btn.addEventListener('click', (e) => { e.stopPropagation(); stopExport(); });
      exportStatus.appendChild(btn);
    }
  })();

  const bitrate = parseInt(edQuality.value);
  const fps = parseInt(edFramerate.value);
  const includeAudio = edAudio.checked;

  const origSz = getCanvasSize();
  let expW = origSz.w, expH = origSz.h;
  const res = edResolution.value;
  if (res === '1080') { const s = 1080 / Math.max(expW, expH); expW = Math.round(expW * s); expH = Math.round(expH * s); }
  else if (res === '720') { const s = 720 / Math.max(expW, expH); expW = Math.round(expW * s); expH = Math.round(expH * s); }
  expW = expW % 2 === 0 ? expW : expW + 1;
  expH = expH % 2 === 0 ? expH : expH + 1;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = expW;
  exportCanvas.height = expH;
  const eCtx = exportCanvas.getContext('2d');

  if (typeof Mp4Muxer === 'undefined') {
    console.error('Mp4Muxer is not defined. MP4 export is unavailable. Please check your internet connection.');
    return;
  }

  // Configure mp4-muxer (uses shared AudioContext singleton)
  var mp4AudioCtx = null;
  const muxerOpts = {
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: 'avc', width: expW, height: expH },
    fastStart: 'in-memory'
  };

  // Audio setup
  let audioEncoder = null;
  let scriptProcessor = null;
  let audioTimestamp = 0;

  if (includeAudio) {
    try {
      mp4AudioCtx = getSharedAudioContext();
      muxerOpts.audio = { codec: 'aac', numberOfChannels: 2, sampleRate: mp4AudioCtx.sampleRate };
    } catch (err) {
      console.log('MP4 audio context skipped:', err.message);
    }
  }

  const muxer = new Mp4Muxer.Muxer(muxerOpts);

  // Video encoder
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error:', e)
  });
  videoEncoder.configure({
    codec: 'avc1.42001f',
    width: expW,
    height: expH,
    bitrate: bitrate,
    framerate: fps
  });

  // Audio encoder
  if (muxerOpts.audio) {
    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error('AudioEncoder error:', e)
      });
      audioEncoder.configure({
        codec: 'mp4a.40.2',
        numberOfChannels: 2,
        sampleRate: mp4AudioCtx.sampleRate,
        bitrate: 128000
      });

      scriptProcessor = mp4AudioCtx.createScriptProcessor(4096, 2, 2);

      // Connect all active audio chains to the script processor
      let chainsConnected = false;
      Object.keys(audioChains).forEach(track => {
        const chain = audioChains[track];
        if (chain && chain.initialized) {
          chain.setDestination(scriptProcessor);
          chainsConnected = true;
        }
      });

      // If no chains were connected, fall back to direct source
      if (!chainsConnected) {
        var mp4SrcNode = getSharedSourceNode();
        mp4SrcNode.disconnect();
        mp4SrcNode.connect(scriptProcessor);
        mp4SrcNode.connect(mp4AudioCtx.destination);
      }

      scriptProcessor.connect(mp4AudioCtx.destination);

      audioTimestamp = 0;
      scriptProcessor.onaudioprocess = (e) => {
        if (!isExporting || !audioEncoder) return;
        const nf = e.inputBuffer.length;
        const ch0 = e.inputBuffer.getChannelData(0);
        const ch1 = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : ch0;
        const data = new Float32Array(nf * 2);
        data.set(ch0, 0);
        data.set(ch1, nf);
        try {
          const audioData = new AudioData({
            format: 'f32-planar',
            sampleRate: mp4AudioCtx.sampleRate,
            numberOfFrames: nf,
            numberOfChannels: 2,
            timestamp: audioTimestamp,
            data: data
          });
          audioEncoder.encode(audioData);
          audioData.close();
          audioTimestamp += (nf / mp4AudioCtx.sampleRate) * 1_000_000;
        } catch (err) { /* skip frame */ }
      };
    } catch (err) {
      console.log('MP4 audio encoder skipped:', err.message);
      audioEncoder = null;
    }
  }

  // Play timeline from start
  vtSeek(0);
  vtPlay();

  const totalDur = vtGetTotalDuration();
  const exportStart = performance.now();
  let frameCount = 0;
  let lastCaptureTime = -1;
  const frameInterval = 1 / fps;
  let finalized = false;

  exportText.textContent = 'Encoding MP4...';
  showToast('MP4 export started...', 'info');

  function captureLoop() {
    if (!isExporting || finalized) {
      if (!finalized) finalize();
      return;
    }

    // Capture at target fps intervals
    if (vtTime - lastCaptureTime >= frameInterval || lastCaptureTime < 0) {
      eCtx.clearRect(0, 0, expW, expH);
      eCtx.drawImage(canvas, 0, 0, expW, expH);

      const timestamp = frameCount * (1_000_000 / fps);
      const frame = new VideoFrame(exportCanvas, { timestamp });
      videoEncoder.encode(frame, { keyFrame: frameCount % (fps * 2) === 0 });
      frame.close();
      frameCount++;
      lastCaptureTime = vtTime;

      // Progress with elapsed time, frames, estimated size
      const p = Math.min(100, vtTime / totalDur * 100);
      const elapsed = ((performance.now() - exportStart) / 1000).toFixed(1);
      const estSize = (frameCount * bitrate / fps / 8 / 1024 / 1024).toFixed(1);
      exportBarFill.style.width = p + '%';
      exportText.textContent = 'MP4: ' + Math.round(p) + '% \u00b7 ' + frameCount + ' frames \u00b7 ' + elapsed + 's \u00b7 ~' + estSize + 'MB';
    }

    // Check if timeline finished
    if (vtTime >= totalDur - 0.05 && !vtPlaying) {
      finalize();
      return;
    }

    requestAnimationFrame(captureLoop);
  }

  requestAnimationFrame(captureLoop);

  async function finalize() {
    if (finalized) return;
    finalized = true;
    exportText.textContent = 'Finalizing MP4...';

    try {
      await videoEncoder.flush();
      videoEncoder.close();
      if (audioEncoder) {
        await audioEncoder.flush();
        audioEncoder.close();
      }
      if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor.onaudioprocess = null;
      }

      // Reset audio chain destinations
      Object.keys(audioChains).forEach(track => {
        const chain = audioChains[track];
        if (chain && chain.initialized) {
          chain.setDestination(null);
        }
      });

      reconnectAudioGraph();
      muxer.finalize();

      const buffer = muxer.target.buffer;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const a = document.createElement('a');
      a.download = 'mockup-' + Date.now() + '.mp4';
      a.href = URL.createObjectURL(blob);
      a.click();
      showToast('Export complete \u2014 MP4 downloaded', 'success');

      // Show success animation
      const exportSuccess = document.getElementById('exportSuccess');
      if (exportSuccess) {
        exportSuccess.style.display = 'flex';
        setTimeout(() => {
          exportSuccess.style.display = 'none';
        }, 2500);
      }
    } catch (err) {
      console.error('MP4 finalize error:', err);
      showToast('MP4 export failed: ' + err.message, 'error');
    }

    isExporting = false;
    exportBtn.textContent = 'Export';
    exportBtn.classList.remove('recording');
    exportStatus.classList.remove('visible');
    updateExportButtonState(false);
    // Remove cancel button if present
    document.getElementById('exportCancelBtn')?.remove();
    vtPause();
  }
}

// ============================================================
