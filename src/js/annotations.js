// ANNOTATIONS
// ============================================================
let annoDrawing = false;
let annoPoints = [];

// ------------------------------------------------------------
// Undo/Redo for annotations (local history)
// ------------------------------------------------------------
const annotationHistory = {
  undoStack: [],
  redoStack: [],
  saveState(annotations) {
    try {
      this.undoStack.push(JSON.stringify(annotations));
      this.redoStack = [];
      if (this.undoStack.length > 50) this.undoStack.shift();
    } catch (e) { /* ignore serialization errors */ }
  },
  undo() {
    if (this.undoStack.length > 1) {
      const current = this.undoStack.pop();
      this.redoStack.push(current);
      return JSON.parse(this.undoStack[this.undoStack.length - 1]);
    }
    return null;
  },
  redo() {
    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop();
      this.undoStack.push(state);
      return JSON.parse(state);
    }
    return null;
  }
};

function getCurrentAnnotations() {
  return state.layers.filter(l => l.type === 'annotation').map(a => ({ ...a, points: a.points ? [...a.points] : [] }));
}

function loadAnnotations(annotations) {
  const others = state.layers.filter(l => l.type !== 'annotation');
  state.layers = others.concat(annotations.map(a => ({ ...a, points: a.points ? [...a.points] : [] })));
  // Keep nextLayerId ahead of any restored ids
  const maxId = state.layers.reduce((m, l) => Math.max(m, l.id || 0), 0);
  if (maxId >= state.nextLayerId) state.nextLayerId = maxId + 1;
  rebuildLayerList?.();
  rebuildTimeline?.();
}

function addUndoRedoControls() {
  const existing = document.getElementById('annotationUndoRedoControls');
  if (existing) return;
  const host = document.getElementById('annoToolbar')?.parentElement;
  if (!host) return;
  const controls = document.createElement('div');
  controls.id = 'annotationUndoRedoControls';
  controls.className = 'annotation-controls';
  controls.style.display = 'flex';
  controls.style.gap = '6px';
  controls.style.margin = '6px 0';

  const undoBtn = document.createElement('button');
  undoBtn.innerHTML = '↶';
  undoBtn.title = 'Undo (Ctrl/Cmd+Z)';
  undoBtn.className = 'btn';
  undoBtn.style.fontSize = '11px';
  undoBtn.addEventListener('click', () => {
    const state = annotationHistory.undo();
    if (state) loadAnnotations(state);
  });

  const redoBtn = document.createElement('button');
  redoBtn.innerHTML = '↷';
  redoBtn.title = 'Redo (Ctrl/Cmd+Shift+Z)';
  redoBtn.className = 'btn';
  redoBtn.style.fontSize = '11px';
  redoBtn.addEventListener('click', () => {
    const state = annotationHistory.redo();
    if (state) loadAnnotations(state);
  });

  controls.append(undoBtn, redoBtn);
  host.insertBefore(controls, host.querySelector('#annoTimingControls'));

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Avoid while typing in inputs
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    const zKey = e.key && e.key.toLowerCase() === 'z';
    const mod = e.ctrlKey || e.metaKey;
    if (mod && zKey && !e.shiftKey) {
      const s = annotationHistory.undo();
      if (s) { e.preventDefault(); loadAnnotations(s); }
    } else if (mod && zKey && e.shiftKey) {
      const s = annotationHistory.redo();
      if (s) { e.preventDefault(); loadAnnotations(s); }
    }
  });
}

// Seed initial history after DOM ready
if (typeof document !== 'undefined') {
  const seed = () => {
    annotationHistory.saveState(getCurrentAnnotations());
    addUndoRedoControls();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', seed); else seed();
}

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
  // Save annotation history state
  annotationHistory.saveState(getCurrentAnnotations());
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
  // Save annotation history state
  annotationHistory.saveState(getCurrentAnnotations());
});

annoEndInput.addEventListener('change', () => {
  if (!annoTimingLayer) return;
  pushUndoState();
  annoTimingLayer.endTime = Math.max(annoTimingLayer.startTime + 0.1, parseFloat(annoEndInput.value) || 0);
  const dur = (annoTimingLayer.endTime - annoTimingLayer.startTime).toFixed(1) + 's';
  annoDurationEl.textContent = dur;
  rebuildTimeline();
  // Save annotation history state
  annotationHistory.saveState(getCurrentAnnotations());
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
  // Save annotation history state
  annotationHistory.saveState(getCurrentAnnotations());
});

// Record clear action into annotation history
document.getElementById('clearAnnotationsBtn')?.addEventListener('click', () => {
  // Defer snapshot until after UI handler clears layers
  setTimeout(() => annotationHistory.saveState(getCurrentAnnotations()), 0);
});

// ============================================================
