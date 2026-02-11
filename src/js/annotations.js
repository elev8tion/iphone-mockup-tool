// ANNOTATIONS
// ============================================================
let annoDrawing = false;
let annoPoints = [];

document.getElementById('annoToolbar').addEventListener('click', e => {
  const btn = e.target.closest('.anno-btn');
  if (!btn) return;
  const tool = btn.dataset.tool;
  if (state.annotation.tool === tool) {
    state.annotation.tool = null;
    btn.classList.remove('active');
    canvas.style.cursor = 'pointer';
  } else {
    state.annotation.tool = tool;
    document.querySelectorAll('.anno-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    canvas.style.cursor = 'crosshair';
  }
});

document.getElementById('annoColor').addEventListener('input', e => { state.annotation.color = e.target.value; });
document.getElementById('annoWidth').addEventListener('input', e => { state.annotation.width = parseInt(e.target.value); });

canvas.addEventListener('mousedown', e => {
  if (!state.annotation.tool) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;
  annoDrawing = true;
  annoPoints = [{ x: mx, y: my }];
  e.preventDefault();
  e.stopPropagation();
}, true);

canvas.addEventListener('mousemove', e => {
  if (!annoDrawing || !state.annotation.tool) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;

  if (state.annotation.tool === 'freehand') {
    annoPoints.push({ x: mx, y: my });
  } else {
    if (annoPoints.length > 1) annoPoints.pop();
    annoPoints.push({ x: mx, y: my });
  }

  // Live preview: draw temp annotation
  // (will be rendered next frame since we store temp in a special way)
}, true);

canvas.addEventListener('mouseup', e => {
  if (!annoDrawing || !state.annotation.tool) return;
  annoDrawing = false;
  pushUndoState();

  const currentTime = hasVideo ? vtTime : 0;
  const totalDur = vtGetTotalDuration() || Infinity;
  const remaining = totalDur - currentTime;
  const defaultEnd = remaining < 5 ? totalDur : currentTime + 5;
  const layer = {
    id: state.nextLayerId++,
    type: 'annotation',
    annoType: state.annotation.tool,
    points: [...annoPoints],
    color: state.annotation.color,
    lineWidth: state.annotation.width,
    content: state.annotation.tool === 'callout' ? 'Note' : '',
    startTime: currentTime,
    endTime: defaultEnd,
  };
  state.layers.push(layer);
  rebuildLayerList();
  annoPoints = [];
}, true);

// ---- Annotation timing controls ----
const annoTimingEl = document.getElementById('annoTimingControls');
const annoStartInput = document.getElementById('annoStartTime');
const annoEndInput = document.getElementById('annoEndTime');
const annoDurationEl = document.getElementById('annoDuration');
const annoFullVideoCb = document.getElementById('annoFullVideo');
let annoTimingLayer = null;

function updateAnnoTimingControls(layer) {
  if (!layer || layer.type !== 'annotation') {
    annoTimingEl.style.display = 'none';
    annoTimingLayer = null;
    return;
  }
  annoTimingLayer = layer;
  annoTimingEl.style.display = 'block';
  const isFullVideo = layer.startTime === 0 && layer.endTime === Infinity;
  annoFullVideoCb.checked = isFullVideo;
  annoStartInput.value = isFullVideo ? 0 : layer.startTime.toFixed(1);
  annoEndInput.value = isFullVideo ? '' : (layer.endTime === Infinity ? '' : layer.endTime.toFixed(1));
  annoStartInput.disabled = isFullVideo;
  annoEndInput.disabled = isFullVideo;
  const dur = layer.endTime === Infinity ? 'Full' : (layer.endTime - layer.startTime).toFixed(1) + 's';
  annoDurationEl.textContent = dur;
}

annoStartInput.addEventListener('change', () => {
  if (!annoTimingLayer) return;
  pushUndoState();
  annoTimingLayer.startTime = Math.max(0, parseFloat(annoStartInput.value) || 0);
  const dur = annoTimingLayer.endTime === Infinity ? 'Full' : (annoTimingLayer.endTime - annoTimingLayer.startTime).toFixed(1) + 's';
  annoDurationEl.textContent = dur;
  rebuildTimeline();
});

annoEndInput.addEventListener('change', () => {
  if (!annoTimingLayer) return;
  pushUndoState();
  annoTimingLayer.endTime = Math.max(annoTimingLayer.startTime + 0.1, parseFloat(annoEndInput.value) || 0);
  const dur = (annoTimingLayer.endTime - annoTimingLayer.startTime).toFixed(1) + 's';
  annoDurationEl.textContent = dur;
  rebuildTimeline();
});

annoFullVideoCb.addEventListener('change', () => {
  if (!annoTimingLayer) return;
  pushUndoState();
  if (annoFullVideoCb.checked) {
    annoTimingLayer.startTime = 0;
    annoTimingLayer.endTime = Infinity;
  } else {
    const currentTime = hasVideo ? vtTime : 0;
    annoTimingLayer.startTime = currentTime;
    annoTimingLayer.endTime = currentTime + 5;
  }
  updateAnnoTimingControls(annoTimingLayer);
  rebuildTimeline();
});

// ============================================================
