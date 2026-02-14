// LAYERS: TEXT
// ============================================================
document.getElementById('addTextBtn').addEventListener('click', () => {
  pushUndoState();
  const sz = getCanvasSize();
  const layer = {
    id: state.nextLayerId++,
    type: 'text',
    content: 'Title',
    x: sz.w / 2 - 50,
    y: 60,
    fontSize: 36,
    fontFamily: 'SF Pro Display, -apple-system, sans-serif',
    color: '#ffffff',
    weight: '700',
    align: 'left',
    shadow: 0,
    outline: 0,
  };
  state.layers.push(layer);
  state.selectedLayer = state.layers.length - 1;
  rebuildLayerList();
  showTextProps();
});

function showTextProps() {
  document.getElementById('textProps').style.display = 'block';
  document.getElementById('logoProps').style.display = 'none';
  const layer = state.layers[state.selectedLayer];
  if (!layer || layer.type !== 'text') return;
  document.getElementById('textContent').value = layer.content;
  document.getElementById('textSize').value = layer.fontSize;
  document.getElementById('textColor').value = layer.color;
  document.getElementById('textWeight').value = layer.weight;
  document.getElementById('textShadow').value = layer.shadow;
  document.getElementById('textOutline').value = layer.outline;
}

// Text property bindings
['textContent','textFont','textSize','textColor','textWeight','textShadow','textOutline'].forEach(id => {
  document.getElementById(id).addEventListener('input', e => {
    const layer = state.layers[state.selectedLayer];
    if (!layer || layer.type !== 'text') return;
    switch (id) {
      case 'textContent': layer.content = e.target.value; break;
      case 'textFont': layer.fontFamily = e.target.value; break;
      case 'textSize': layer.fontSize = parseInt(e.target.value); break;
      case 'textColor': layer.color = e.target.value; break;
      case 'textWeight': layer.weight = e.target.value; break;
      case 'textShadow': layer.shadow = parseInt(e.target.value); break;
      case 'textOutline': layer.outline = parseInt(e.target.value); break;
    }
  });
});

// ============================================================
// LAYERS: LOGO
// ============================================================
document.getElementById('addLogoBtn').addEventListener('click', () => logoInput.click());
logoInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  pushUndoState();
  const img = new Image();
  img.onload = () => {
    const sz = getCanvasSize();
    const layer = {
      id: state.nextLayerId++,
      type: 'logo',
      img: img,
      fileName: file.name.replace(/\.[^.]+$/, ''),
      x: sz.w - 120,
      y: sz.h - 80,
      width: 100,
      opacity: 1,
    };
    state.layers.push(layer);
    state.selectedLayer = state.layers.length - 1;
    rebuildLayerList();
    showLogoProps();
  };
  img.src = URL.createObjectURL(file);
});

function showLogoProps() {
  document.getElementById('textProps').style.display = 'none';
  document.getElementById('logoProps').style.display = 'block';
  const layer = state.layers[state.selectedLayer];
  if (!layer || layer.type !== 'logo') return;
  document.getElementById('logoOpacity').value = layer.opacity * 100;
  document.getElementById('logoWidth').value = layer.width;
}

document.getElementById('logoOpacity').addEventListener('input', e => {
  const layer = state.layers[state.selectedLayer];
  if (layer && layer.type === 'logo') layer.opacity = parseInt(e.target.value) / 100;
});
document.getElementById('logoWidth').addEventListener('input', e => {
  const layer = state.layers[state.selectedLayer];
  if (layer && layer.type === 'logo') layer.width = parseInt(e.target.value);
});

// ============================================================
// UNIFIED LAYER PANEL
// ============================================================
const unifiedLayersEl = document.getElementById('unifiedLayers');
const layerDetailEl = document.getElementById('layerDetail');
const advStackEl = document.getElementById('advStack');

function isGroupActive(id) {
  switch (id) {
    case 'bgVideo': return state.bgVideo.enabled;
    case 'particles': return state.particles.enabled;
    case 'device': return true;
    case 'device2': return state.comparison.enabled && !!state.comparison.device2;
    case 'content': return state.layers.length > 0;
    case 'facecam': return state.facecam.enabled;
    case 'videoOverlays': return state.videoOverlays.length > 0;
    case 'uiOverlays': return state.waveform.enabled || state.progressBar.enabled || state.glassmorphism.enabled;
    default: return false;
  }
}

function getSystemLayerName(group) {
  if (group.id === 'device') {
    if (state.device.type === 'none') return 'Video (No Device)';
    const dev = DEVICES[state.device.type];
    return dev ? dev.name : 'Device';
  }
  if (group.id === 'device2' && state.comparison.device2) {
    const dev2 = DEVICES[state.comparison.device2.type];
    return dev2 ? dev2.name + ' (2)' : 'Device 2';
  }
  if (group.id === 'bgVideo') return 'Background Video';
  if (group.id === 'uiOverlays') {
    const parts = [];
    if (state.waveform.enabled) parts.push('Waveform');
    if (state.progressBar.enabled) parts.push('Progress');
    if (state.glassmorphism.enabled) parts.push('CTA');
    return parts.join(' + ') || 'UI Effects';
  }
  return group.name;
}

function getContentLayerName(layer) {
  if (layer.type === 'text') {
    const t = (layer.content || '').substring(0, 24);
    return t || 'Empty Text';
  }
  if (layer.type === 'logo') return layer.fileName || 'Logo';
  if (layer.type === 'annotation') {
    const typeNames = { arrow: 'Arrow', circle: 'Circle', rect: 'Rectangle', freehand: 'Freehand', callout: 'Callout' };
    return typeNames[layer.annoType] || 'Annotation';
  }
  return 'Layer';
}

function getContentLayerIcon(layer) {
  if (layer.type === 'text') return 'T';
  if (layer.type === 'logo') return '🖼';
  if (layer.type === 'annotation') {
    const icons = { arrow: '➤', circle: '◯', rect: '▭', freehand: '✎', callout: '💬' };
    return icons[layer.annoType] || '✎';
  }
  return '•';
}

// Build flat display list from render stack
function buildDisplayList() {
  const query = document.getElementById('layerSearch')?.value?.toLowerCase() || '';
  const list = [];
  for (let i = state.renderStack.length - 1; i >= 0; i--) {
    const group = state.renderStack[i];
    if (!isGroupActive(group.id)) continue;

    if (group.id === 'content') {
      // Expand individual content layers
      for (let j = state.layers.length - 1; j >= 0; j--) {
        const name = getContentLayerName(state.layers[j]);
        if (query && !name.toLowerCase().includes(query)) continue;
        list.push({
          kind: 'content', groupIdx: i, layerIdx: j,
          name: name,
          icon: getContentLayerIcon(state.layers[j]),
          hidden: group.hidden || state.layers[j].visible === false,
        });
      }
    } else if (group.id === 'videoOverlays') {
      // Expand individual overlays
      for (let j = state.videoOverlays.length - 1; j >= 0; j--) {
        const ov = state.videoOverlays[j];
        const name = ov.name || ov.builtin || 'Overlay';
        if (query && !name.toLowerCase().includes(query)) continue;
        list.push({
          kind: 'overlay', groupIdx: i, overlayIdx: j,
          name: name,
          icon: '🎞',
          hidden: group.hidden || ov.hidden === true,
        });
      }
    } else {
      const name = getSystemLayerName(group);
      if (query && !name.toLowerCase().includes(query)) continue;
      list.push({
        kind: 'system', groupIdx: i, groupId: group.id,
        name: name,
        icon: group.icon,
        isMain: group.id === 'device',
        hidden: group.hidden,
      });
    }
  }
  return list;
}

// Bind search input
document.getElementById('layerSearch')?.addEventListener('input', () => {
  rebuildUnifiedLayers();
});

function rebuildUnifiedLayers() {
  const list = buildDisplayList();
  unifiedLayersEl.innerHTML = '';

  if (list.length <= 1 && !hasVideo && state.layers.length === 0) {
    unifiedLayersEl.innerHTML = '<div class="ul-empty">Drop a video to get started</div>';
    layerDetailEl.style.display = 'none';
    return;
  }

  list.forEach((item, di) => {
    const div = document.createElement('div');
    let cls = 'ul-item';
    if (item.isMain) cls += ' main-layer';
    if (item.hidden) cls += ' hidden-layer';
    if (item.kind === 'content' && item.layerIdx === state.selectedLayer) cls += ' selected';
    div.className = cls;

    // Eye toggle
    const eye = document.createElement('button');
    eye.className = 'ul-eye' + (item.hidden ? ' off' : '');
    eye.textContent = item.hidden ? '○' : '●';
    eye.title = item.hidden ? 'Show' : 'Hide';
    eye.addEventListener('click', e => {
      e.stopPropagation();
      if (item.kind === 'content') {
        const layer = state.layers[item.layerIdx];
        layer.visible = layer.visible === false ? true : false;
      } else if (item.kind === 'overlay') {
        const ov = state.videoOverlays[item.overlayIdx];
        if (ov) ov.hidden = !ov.hidden;
      } else {
        const g = state.renderStack[item.groupIdx];
        g.hidden = !g.hidden;
      }
      rebuildUnifiedLayers();
    });
    div.appendChild(eye);

    // Icon
    const icon = document.createElement('span');
    icon.className = 'ul-icon';
    icon.textContent = item.icon;
    div.appendChild(icon);

    // Name
    const name = document.createElement('span');
    name.className = 'ul-name';
    name.textContent = item.name;
    div.appendChild(name);

    // Main tag
    if (item.isMain) {
      const tag = document.createElement('span');
      tag.className = 'ul-tag';
      tag.textContent = 'main';
      div.appendChild(tag);
    }

    // Hover controls
    const controls = document.createElement('span');
    controls.className = 'ul-controls';

    // Find position in display list for system layer reordering
    function moveGroupInStack(groupIdx, direction) {
      // direction: +1 = up in visual (later in array), -1 = down in visual (earlier in array)
      const newIdx = groupIdx + direction;
      if (newIdx < 0 || newIdx >= state.renderStack.length) return;
      const [moved] = state.renderStack.splice(groupIdx, 1);
      state.renderStack.splice(newIdx, 0, moved);
      rebuildUnifiedLayers();
    }

    const upBtn = document.createElement('button');
    upBtn.className = 'ul-btn';
    upBtn.textContent = '▲';
    upBtn.title = 'Move forward';
    upBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (item.kind === 'content') {
        if (item.layerIdx < state.layers.length - 1) {
          const arr = state.layers;
          [arr[item.layerIdx], arr[item.layerIdx + 1]] = [arr[item.layerIdx + 1], arr[item.layerIdx]];
          if (state.selectedLayer === item.layerIdx) state.selectedLayer = item.layerIdx + 1;
          else if (state.selectedLayer === item.layerIdx + 1) state.selectedLayer = item.layerIdx;
          rebuildUnifiedLayers();
        }
      } else if (item.kind === 'overlay') {
        if (item.overlayIdx < state.videoOverlays.length - 1) {
          const arr = state.videoOverlays;
          [arr[item.overlayIdx], arr[item.overlayIdx + 1]] = [arr[item.overlayIdx + 1], arr[item.overlayIdx]];
          rebuildUnifiedLayers();
        }
      } else if (item.kind === 'system') {
        // Moving "up" in visual = moving later in renderStack (higher index)
        moveGroupInStack(item.groupIdx, 1);
      }
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'ul-btn';
    downBtn.textContent = '▼';
    downBtn.title = 'Move backward';
    downBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (item.kind === 'content') {
        if (item.layerIdx > 0) {
          const arr = state.layers;
          [arr[item.layerIdx], arr[item.layerIdx - 1]] = [arr[item.layerIdx - 1], arr[item.layerIdx]];
          if (state.selectedLayer === item.layerIdx) state.selectedLayer = item.layerIdx - 1;
          else if (state.selectedLayer === item.layerIdx - 1) state.selectedLayer = item.layerIdx;
          rebuildUnifiedLayers();
        }
      } else if (item.kind === 'overlay') {
        if (item.overlayIdx > 0) {
          const arr = state.videoOverlays;
          [arr[item.overlayIdx], arr[item.overlayIdx - 1]] = [arr[item.overlayIdx - 1], arr[item.overlayIdx]];
          rebuildUnifiedLayers();
        }
      } else if (item.kind === 'system') {
        // Moving "down" in visual = moving earlier in renderStack (lower index)
        moveGroupInStack(item.groupIdx, -1);
      }
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);

    // Delete button only for content and overlay items (not system layers)
    if (item.kind === 'content' || item.kind === 'overlay') {
      const delBtn = document.createElement('button');
      delBtn.className = 'ul-btn del';
      delBtn.textContent = '✕';
      delBtn.title = 'Remove';
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        pushUndoState();
        if (item.kind === 'content') {
          state.layers.splice(item.layerIdx, 1);
          state.selectedLayer = Math.min(state.selectedLayer, state.layers.length - 1);
        } else if (item.kind === 'overlay') {
          state.videoOverlays.splice(item.overlayIdx, 1);
        }
        rebuildUnifiedLayers();
      });
      controls.appendChild(delBtn);
    }

    div.appendChild(controls);

    // Click to select (content layers)
    div.addEventListener('click', () => {
      if (item.kind === 'content') {
        state.selectedLayer = item.layerIdx;
        rebuildUnifiedLayers();
        const layer = state.layers[item.layerIdx];
        if (layer.type === 'text') showTextProps();
        else if (layer.type === 'logo') showLogoProps();
        else {
          document.getElementById('textProps').style.display = 'none';
          document.getElementById('logoProps').style.display = 'none';
        }
        showLayerDetail(item.layerIdx);
      } else {
        state.selectedLayer = -1;
        layerDetailEl.style.display = 'none';
        document.getElementById('textProps').style.display = 'none';
        document.getElementById('logoProps').style.display = 'none';
        document.getElementById('annoTimingControls').style.display = 'none';
        rebuildUnifiedLayers();
      }
    });

    unifiedLayersEl.appendChild(div);
  });
}

function showLayerDetail(idx) {
  const layer = state.layers[idx];
  if (!layer) { layerDetailEl.style.display = 'none'; return; }
  layerDetailEl.style.display = 'block';

  const opVal = Math.round((layer.opacity !== undefined ? layer.opacity : 1) * 100);
  let html = `<div class="detail-row"><label>Opacity</label><input type="range" id="detailOpacity" min="0" max="100" value="${opVal}"><span id="detailOpacityVal">${opVal}%</span></div>`;
  if (layer.type === 'text') {
    html += `<div class="detail-row"><label>Size</label><input type="range" id="detailFontSize" min="10" max="200" value="${layer.fontSize}"><span id="detailFontSizeVal">${layer.fontSize}px</span></div>`;
  }
  layerDetailEl.innerHTML = html;

  // Opacity control
  const opSlider = document.getElementById('detailOpacity');
  if (opSlider) {
    opSlider.addEventListener('input', e => {
      const v = parseInt(e.target.value);
      document.getElementById('detailOpacityVal').textContent = v + '%';
      if (layer.type === 'logo') layer.opacity = v / 100;
      else if (layer.type === 'text') layer.opacity = v / 100;
    });
  }
  // Font size control
  const fsSlider = document.getElementById('detailFontSize');
  if (fsSlider) {
    fsSlider.addEventListener('input', e => {
      const v = parseInt(e.target.value);
      document.getElementById('detailFontSizeVal').textContent = v + 'px';
      layer.fontSize = v;
    });
  }

  // Show/hide annotation timing controls
  updateAnnoTimingControls(layer);
}

// ---- Advanced Render Order panel ----
function rebuildAdvStack() {
  advStackEl.innerHTML = '';
  const stackReversed = [...state.renderStack].reverse();
  stackReversed.forEach((group, ri) => {
    const actualIdx = state.renderStack.length - 1 - ri;
    const active = isGroupActive(group.id);
    const div = document.createElement('div');
    div.className = 'adv-item' + (active ? ' active' : '');
    div.dataset.idx = actualIdx;
    div.draggable = true;
    div.innerHTML = `<span class="adv-drag">⠿</span><span class="adv-icon">${group.icon}</span><span class="adv-name">${group.name}</span>`;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', actualIdx);
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
      advStackEl.querySelectorAll('.adv-item').forEach(el => el.classList.remove('drag-over'));
    });
    div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault();
      div.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      if (fromIdx === actualIdx) return;
      const [moved] = state.renderStack.splice(fromIdx, 1);
      state.renderStack.splice(actualIdx, 0, moved);
      rebuildAdvStack();
      rebuildUnifiedLayers();
    });
    advStackEl.appendChild(div);
  });
}

// Advanced panel toggle
document.getElementById('advLayerToggle').addEventListener('click', () => {
  const panel = document.getElementById('advLayerPanel');
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : 'block';
  document.getElementById('advLayerToggle').textContent = visible ? 'Advanced Render Order' : 'Hide Advanced';
  if (!visible) rebuildAdvStack();
});

// Quick-add buttons
document.getElementById('quickAddText').addEventListener('click', () => {
  document.getElementById('addTextBtn').click();
});
document.getElementById('quickAddLogo').addEventListener('click', () => {
  document.getElementById('addLogoBtn').click();
});

// Periodic refresh
rebuildUnifiedLayers();
let _lastLayerHash = '';
setInterval(() => {
  const hash = state.renderStack.map(g => g.id + (g.hidden?'h':'')).join(',') + '|' +
    state.layers.map(l => (l.visible===false?'h':'') + l.type + (l.content||'').substring(0,10)).join(',') + '|' +
    state.videoOverlays.map(o => (o.hidden?'h':'') + (o.name||o.builtin||'')).join(',') + '|' + state.selectedLayer + '|' +
    (state.device.type) + '|' + state.comparison.enabled + '|' +
    state.bgVideo.enabled + '|' + state.particles.enabled + '|' +
    state.facecam.enabled + '|' + state.waveform.enabled + '|' +
    state.progressBar.enabled + '|' + state.glassmorphism.enabled;
  if (hash !== _lastLayerHash) {
    _lastLayerHash = hash;
    rebuildUnifiedLayers();
  }
}, 500);

// ============================================================
// LAYER LIST (backwards compat — hidden, still used internally)
// ============================================================
function rebuildLayerList() {
  // The visible unified panel handles display now
  rebuildUnifiedLayers();
}

// ============================================================
// DRAGGING LAYERS ON CANVAS
// ============================================================
let dragLayer = null;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', e => {
  if (state.annotation.tool) return; // annotation mode
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  // Hit test layers (reverse order)
  for (let i = state.layers.length - 1; i >= 0; i--) {
    const layer = state.layers[i];
    let hit = false;
    if (layer.type === 'text') {
      const w = ctx.measureText(layer.content).width || (layer.fontSize * layer.content.length * 0.6);
      hit = mx >= layer.x - 5 && mx <= layer.x + w + 5 && my >= layer.y - 5 && my <= layer.y + layer.fontSize + 5;
    } else if (layer.type === 'logo' && layer.img) {
      const aspect = layer.img.naturalWidth / layer.img.naturalHeight;
      const lh = layer.width / aspect;
      hit = mx >= layer.x && mx <= layer.x + layer.width && my >= layer.y && my <= layer.y + lh;
    }
    if (hit) {
      dragLayer = layer;
      dragOffset.x = mx - layer.x;
      dragOffset.y = my - layer.y;
      state.selectedLayer = i;
      rebuildLayerList();
      if (layer.type === 'text') showTextProps();
      else if (layer.type === 'logo') showLogoProps();
      e.preventDefault();
      return;
    }
  }
  // If no layer hit and has video, toggle playback
  if (hasVideo && !state.annotation.tool) {
    vtToggle();
  }
});

canvas.addEventListener('mousemove', e => {
  if (!dragLayer) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  dragLayer.x = (e.clientX - rect.left) * scaleX - dragOffset.x;
  dragLayer.y = (e.clientY - rect.top) * scaleY - dragOffset.y;
});

document.addEventListener('mouseup', () => { dragLayer = null; });

// Double-click to edit text inline
canvas.addEventListener('dblclick', e => {
  const layer = state.layers[state.selectedLayer];
  if (!layer || layer.type !== 'text') return;
  const newText = prompt('Edit text:', layer.content);
  if (newText !== null) {
    layer.content = newText;
    document.getElementById('textContent').value = newText;
    rebuildLayerList();
  }
});

// ============================================================
