// RENDER SCALE + CANVAS
// ============================================================
const RENDER_SCALE = 3;
const canvas = document.getElementById('renderCanvas');
const ctx = canvas.getContext('2d');

function getCanvasSize() {
  const dev = DEVICES[state.device.type];
  const preset = PRESETS[state.preset];
  if (!preset) {
    // Device-only mode — no device means default to reels
    if (state.device.type === 'none') return { w: 1080, h: 1920 };
    let w = dev.baseW, h = dev.baseH;
    if (state.device.landscape) { let t = w; w = h; h = t; }
    return { w: w * RENDER_SCALE, h: h * RENDER_SCALE };
  }
  return { w: preset.w, h: preset.h };
}

function resizeCanvas() {
  const sz = getCanvasSize();
  canvas.width = sz.w;
  canvas.height = sz.h;
  updateDisplaySize();
}

// ============================================================
// DOM REFS
// ============================================================
const video = document.getElementById('srcVideo');
const fileInput = document.getElementById('fileInput');
const logoInput = document.getElementById('logoInput');
const clipInput = document.getElementById('clipInput');
const promptEl = document.getElementById('prompt');
const dropOverlay = document.getElementById('dropOverlay');
const playbackBar = document.getElementById('playbackBar');
const playBtn = document.getElementById('playBtn');
const iconPlay = document.getElementById('iconPlay');
const iconPause = document.getElementById('iconPause');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const timeLabel = document.getElementById('timeLabel');
const bgColorInput = document.getElementById('bgColor');
const scaleSlider = document.getElementById('scaleSlider');
const scaleVal = document.getElementById('scaleVal');
const shadowSlider = document.getElementById('shadowSlider');
const loadBtn = document.getElementById('loadBtn');
const loopBtn = document.getElementById('loopBtn');
const ssBtn = document.getElementById('ssBtn');
const thumbBtn = document.getElementById('thumbBtn');
const exportBtn = document.getElementById('exportBtn');
const exportStatus = document.getElementById('exportStatus');
const exportText = document.getElementById('exportText');
const exportBarFill = document.getElementById('exportBarFill');
const canvasWrap = document.getElementById('canvasWrap');
const presetSelect = document.getElementById('presetSelect');
const customSizeWrap = document.getElementById('customSizeWrap');
const customW = document.getElementById('customW');
const customH = document.getElementById('customH');
const deviceGrid = document.getElementById('deviceGrid');
const layerList = document.getElementById('layerList');
const tiltXSlider = document.getElementById('tiltX');
const tiltYSlider = document.getElementById('tiltY');
const speedSelect = document.getElementById('speedSelect');
const entranceSelect = document.getElementById('entranceSelect');
const entranceDur = document.getElementById('entranceDur');
const entranceDurVal = document.getElementById('entranceDurVal');
const timelineBar = document.getElementById('timelineBar');
const timelineTrack = document.getElementById('timelineTrack');
const timelineScrubber = document.getElementById('timelineScrubber');

let hasVideo = false;
let isLooping = true;
let isExporting = false;
let playbackStartTime = 0;

// ============================================================
// RENDER LAYER FUNCTIONS (stack-based)
// ============================================================

function renderBackground(ctx, CW, CH) {
  if (state.bgType === 'transparent') return;
  if (state.gradient.enabled) {
    drawGradientBG(ctx, CW, CH);
  } else {
    ctx.fillStyle = state.background.color;
    ctx.fillRect(0, 0, CW, CH);
  }
}

function calcDevicePosition(CW, CH) {
  const dev = DEVICES[state.device.type];
  let devW = dev.baseW, devH = dev.baseH;
  if (state.device.landscape) { let t = devW; devW = devH; devH = t; }
  const preset = PRESETS[state.preset];
  let devScale, devX, devY;
  const isComparing = state.comparison.enabled && state.comparison.device2;
  if (!preset) {
    devScale = RENDER_SCALE;
    devX = 0; devY = 0;
  } else {
    const padFrac = 0.12;
    const areaW = isComparing ? CW * 0.45 : CW;
    const availW = areaW * (1 - padFrac*2);
    const availH = CH * (1 - padFrac*2);
    const fitScale = Math.min(availW / devW, availH / devH);
    devScale = fitScale * state.device.scale;
    if (isComparing) {
      devX = CW * 0.25 - (devW * devScale) / 2;
    } else {
      devX = (CW - devW * devScale) / 2;
    }
    devY = (CH - devH * devScale) / 2;
  }
  return { dev, devW, devH, devScale, devX, devY, isComparing };
}

function calcSceneTransform() {
  const t = hasVideo ? vtTime : 0;
  const elapsed = t * 1000;
  const ent = getEntranceTransform(elapsed);
  const kf = getKeyframeValues(t);
  const animT = getAnimPresetTransform(hasVideo ? t : performance.now() * 0.001);
  return { ent, kf, animT };
}

function applySceneTransform(ctx, CW, CH, t) {
  const combinedZoom = t.kf.zoom * t.animT.zoom;
  const combinedPanX = t.kf.panX + t.animT.panX;
  const combinedPanY = t.kf.panY + t.animT.panY;
  ctx.translate(CW/2, CH/2);
  ctx.scale(combinedZoom, combinedZoom);
  ctx.rotate(t.animT.rotation * Math.PI / 180);
  ctx.translate(-CW/2 + combinedPanX, -CH/2 + combinedPanY);
  ctx.globalAlpha = t.ent.opacity;
  ctx.translate(CW/2, CH/2);
  ctx.translate(t.ent.x, t.ent.y);
  ctx.scale(t.ent.scale, t.ent.scale);
  ctx.rotate(t.ent.rotate * Math.PI/180);
  ctx.translate(-CW/2, -CH/2);
}

function renderBgVideoLayer(ctx, CW, CH) {
  if (!state.bgVideo.enabled) return;
  const bgVid = document.getElementById('bgVideo');
  if (!bgVid || bgVid.readyState < 2) return;
  ctx.save();
  ctx.globalAlpha = state.bgVideo.opacity;
  const vw = bgVid.videoWidth, vh = bgVid.videoHeight;
  let dx = 0, dy = 0, dw = CW, dh = CH;
  if (state.bgVideo.fit === 'cover') {
    const cRatio = CW / CH, vRatio = vw / vh;
    if (vRatio > cRatio) { dh = CH; dw = CH * vRatio; dx = (CW - dw) / 2; }
    else { dw = CW; dh = CW / vRatio; dy = (CH - dh) / 2; }
  } else if (state.bgVideo.fit === 'contain') {
    const cRatio = CW / CH, vRatio = vw / vh;
    if (vRatio > cRatio) { dw = CW; dh = CW / vRatio; dy = (CH - dh) / 2; }
    else { dh = CH; dw = CH * vRatio; dx = (CW - dw) / 2; }
  }
  safeDrawImage(ctx, bgVid, dx, dy, dw, dh);
  ctx.restore();
}

function renderParticlesLayer(ctx, CW, CH) {
  if (state.particles.enabled) drawParticles(ctx, CW, CH);
}

function renderDeviceLayer(ctx, CW, CH, dc) {
  const _activeVid = vtGetActiveVideo();
  // No-device mode: render video full-bleed
  if (state.device.type === 'none') {
    if (hasVideo && _activeVid.readyState >= 2) {
      const chromaFrame = getChromaKeyFrame(_activeVid);
      const vidSrc = chromaFrame || _activeVid;
      const vw = chromaFrame ? chromaFrame.width : _activeVid.videoWidth;
      const vh = chromaFrame ? chromaFrame.height : _activeVid.videoHeight;
      const cRatio = CW / CH, vRatio = vw / vh;
      let dw, dh, dx, dy;
      if (state.videoFit === 'stretch') {
        dx = 0; dy = 0; dw = CW; dh = CH;
      } else if (state.videoFit === 'contain') {
        if (vRatio > cRatio) { dw = CW; dh = CW / vRatio; dx = 0; dy = (CH - dh) / 2; }
        else { dh = CH; dw = CH * vRatio; dx = (CW - dw) / 2; dy = 0; }
      } else {
        if (vRatio > cRatio) { dh = CH; dw = CH * vRatio; dx = (CW - dw) / 2; dy = 0; }
        else { dw = CW; dh = CW / vRatio; dx = 0; dy = (CH - dh) / 2; }
      }
      safeDrawImage(ctx, vidSrc, dx, dy, dw, dh);
      // Transition overlay for no-device mode
      const _transNd = vtGetTransition();
      if (_transNd && _transNd.inClip.video.readyState >= 2) {
        const tVid = _transNd.inClip.video;
        const tSrc2 = getChromaKeyFrame(tVid) || tVid;
        if (_transNd.type === 'crossfade') {
          ctx.globalAlpha = _transNd.progress;
          safeDrawImage(ctx, tSrc2, dx, dy, dw, dh);
          ctx.globalAlpha = 1;
        } else if (_transNd.type === 'slide') {
          safeDrawImage(ctx, tSrc2, dx + CW * (1 - _transNd.progress), dy, dw, dh);
        }
      }
    }
    return;
  }

  const { dev, devW, devH, devScale, devX, devY } = dc;

  // Hand overlay (behind device)
  if (state.hand.enabled) {
    drawHandOverlay(ctx, dev, devScale, state.hand.style, devX, devY);
  }

  // Drop shadow
  if (state.shadow > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,' + (0.55 * state.shadow) + ')';
    ctx.shadowBlur = 70 * (devScale/RENDER_SCALE) * state.shadow;
    ctx.shadowOffsetY = 18 * (devScale/RENDER_SCALE) * state.shadow;
    ctx.translate(devX, devY);
    if (state.device.landscape) {
      ctx.translate(devW*devScale/2, devH*devScale/2);
      ctx.rotate(-Math.PI/2);
      ctx.translate(-dev.baseW*devScale/2, -dev.baseH*devScale/2);
    }
    rrPath(ctx, 3*(devScale/RENDER_SCALE), 3*(devScale/RENDER_SCALE),
      (dev.baseW-6)*devScale, (dev.baseH-6)*devScale, (dev.cornerR-3)*devScale);
    ctx.fillStyle = '#000'; ctx.fill();
    ctx.restore();
  }

  // Draw video into screen
  ctx.save();
  ctx.translate(devX, devY);
  if (state.device.landscape) {
    ctx.translate(devW*devScale/2, devH*devScale/2);
    ctx.rotate(-Math.PI/2);
    ctx.translate(-dev.baseW*devScale/2, -dev.baseH*devScale/2);
  }

  if (hasVideo && _activeVid.readyState >= 2) {
    ctx.save();
    rrPath(ctx, dev.screenX*devScale, dev.screenY*devScale, dev.screenW*devScale, dev.screenH*devScale, dev.screenR*devScale);
    ctx.clip();
    const sw = dev.screenW * devScale, sh = dev.screenH * devScale;
    const chromaFrame = getChromaKeyFrame(_activeVid);
    const vidSrc = chromaFrame || _activeVid;
    const vw = chromaFrame ? chromaFrame.width : _activeVid.videoWidth;
    const vh = chromaFrame ? chromaFrame.height : _activeVid.videoHeight;
    const sRatio = sw/sh, vRatio = vw/vh;
    let dw, dh, dx, dy;
    if (state.videoFit === 'stretch') {
      dx = dev.screenX*devScale; dy = dev.screenY*devScale; dw = sw; dh = sh;
    } else if (state.videoFit === 'contain') {
      if (vRatio > sRatio) { dw = sw; dh = sw/vRatio; dx = dev.screenX*devScale; dy = dev.screenY*devScale+(sh-dh)/2; }
      else { dh = sh; dw = sh*vRatio; dx = dev.screenX*devScale+(sw-dw)/2; dy = dev.screenY*devScale; }
    } else {
      if (vRatio > sRatio) { dh = sh; dw = sh*vRatio; dx = dev.screenX*devScale+(sw-dw)/2; dy = dev.screenY*devScale; }
      else { dw = sw; dh = sw/vRatio; dx = dev.screenX*devScale; dy = dev.screenY*devScale+(sh-dh)/2; }
    }
    safeDrawImage(ctx, vidSrc, dx, dy, dw, dh);

    // Transition overlay (incoming clip)
    const _trans = vtGetTransition();
    if (_trans && _trans.inClip.video.readyState >= 2) {
      const tVid = _trans.inClip.video;
      const tChroma = getChromaKeyFrame(tVid);
      const tSrc = tChroma || tVid;
      const tvw = tChroma ? tChroma.width : tVid.videoWidth;
      const tvh = tChroma ? tChroma.height : tVid.videoHeight;
      const tRatio = tvw/tvh;
      let tdw, tdh, tdx, tdy;
      if (state.videoFit === 'stretch') { tdx = dev.screenX*devScale; tdy = dev.screenY*devScale; tdw = sw; tdh = sh; }
      else if (state.videoFit === 'contain') {
        if (tRatio > sRatio) { tdw=sw; tdh=sw/tRatio; tdx=dev.screenX*devScale; tdy=dev.screenY*devScale+(sh-tdh)/2; }
        else { tdh=sh; tdw=sh*tRatio; tdx=dev.screenX*devScale+(sw-tdw)/2; tdy=dev.screenY*devScale; }
      } else {
        if (tRatio > sRatio) { tdh=sh; tdw=sh*tRatio; tdx=dev.screenX*devScale+(sw-tdw)/2; tdy=dev.screenY*devScale; }
        else { tdw=sw; tdh=sw/tRatio; tdx=dev.screenX*devScale; tdy=dev.screenY*devScale+(sh-tdh)/2; }
      }
      if (_trans.type === 'crossfade') {
        ctx.globalAlpha = _trans.progress;
        safeDrawImage(ctx, tSrc, tdx, tdy, tdw, tdh);
        ctx.globalAlpha = 1;
      } else if (_trans.type === 'slide') {
        const slideOffset = sw * (1 - _trans.progress);
        safeDrawImage(ctx, tSrc, tdx + slideOffset, tdy, tdw, tdh);
      }
    }
    ctx.restore();
  } else {
    ctx.save();
    rrPath(ctx, dev.screenX*devScale, dev.screenY*devScale, dev.screenW*devScale, dev.screenH*devScale, dev.screenR*devScale);
    ctx.fillStyle = '#000'; ctx.fill();
    ctx.restore();
  }

  // Device frame
  const frame = getDeviceFrame(state.device.type, state.device.color);
  ctx.drawImage(frame, 0, 0, frame.width, frame.height, 0, 0, dev.baseW*devScale, dev.baseH*devScale);

  // Glass reflection
  if (hasVideo) {
    ctx.save();
    rrPath(ctx, dev.screenX*devScale, dev.screenY*devScale, dev.screenW*devScale, dev.screenH*devScale, dev.screenR*devScale);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, dev.screenW*devScale*0.7, dev.screenH*devScale*0.4);
    g.addColorStop(0, 'rgba(255,255,255,0.025)');
    g.addColorStop(0.35, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, dev.baseW*devScale, dev.baseH*devScale);
    ctx.restore();
  }

  ctx.restore(); // device translate
}

function renderDevice2Layer(ctx, CW, CH, dc) {
  if (!dc.isComparing) return;
  const dev2Id = state.comparison.device2.type;
  const dev2Color = state.comparison.device2.color;
  const dev2 = DEVICES[dev2Id];
  if (!dev2) return;

  let d2W = dev2.baseW, d2H = dev2.baseH;
  if (state.device.landscape) { let t = d2W; d2W = d2H; d2H = t; }
  const padFrac = 0.12;
  const areaW = CW * 0.45;
  const availW2 = areaW * (1 - padFrac*2);
  const availH2 = CH * (1 - padFrac*2);
  const fitScale2 = Math.min(availW2 / d2W, availH2 / d2H);
  const d2Scale = fitScale2 * state.device.scale;
  const d2X = CW * 0.75 - (d2W * d2Scale) / 2;
  const d2Y = (CH - d2H * d2Scale) / 2;

  // Shadow for device 2
  if (state.shadow > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,' + (0.55 * state.shadow) + ')';
    ctx.shadowBlur = 70 * (d2Scale/RENDER_SCALE) * state.shadow;
    ctx.shadowOffsetY = 18 * (d2Scale/RENDER_SCALE) * state.shadow;
    ctx.translate(d2X, d2Y);
    rrPath(ctx, 3*(d2Scale/RENDER_SCALE), 3*(d2Scale/RENDER_SCALE),
      (dev2.baseW-6)*d2Scale, (dev2.baseH-6)*d2Scale, (dev2.cornerR-3)*d2Scale);
    ctx.fillStyle = '#000'; ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(d2X, d2Y);
  if (state.device.landscape) {
    ctx.translate(d2W*d2Scale/2, d2H*d2Scale/2);
    ctx.rotate(-Math.PI/2);
    ctx.translate(-dev2.baseW*d2Scale/2, -dev2.baseH*d2Scale/2);
  }

  // Black screen for device 2
  ctx.save();
  rrPath(ctx, dev2.screenX*d2Scale, dev2.screenY*d2Scale, dev2.screenW*d2Scale, dev2.screenH*d2Scale, dev2.screenR*d2Scale);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();

  // Draw device 2 video if available
  const vid2 = document.getElementById('srcVideo2');
  if (vid2 && vid2.readyState >= 2 && vid2.src) {
    ctx.save();
    rrPath(ctx, dev2.screenX*d2Scale, dev2.screenY*d2Scale, dev2.screenW*d2Scale, dev2.screenH*d2Scale, dev2.screenR*d2Scale);
    ctx.clip();
    const sw2 = dev2.screenW*d2Scale, sh2 = dev2.screenH*d2Scale;
    const chromaFrame2 = getChromaKeyFrame(vid2);
    const vid2Src = chromaFrame2 || vid2;
    const vw2 = chromaFrame2 ? chromaFrame2.width : vid2.videoWidth;
    const vh2 = chromaFrame2 ? chromaFrame2.height : vid2.videoHeight;
    const sR2 = sw2/sh2, vR2 = vw2/vh2;
    let dw2, dh2, dx2, dy2;
    if (state.videoFit === 'stretch') {
      dx2 = dev2.screenX*d2Scale; dy2 = dev2.screenY*d2Scale; dw2 = sw2; dh2 = sh2;
    } else if (state.videoFit === 'contain') {
      if (vR2 > sR2) { dw2=sw2; dh2=sw2/vR2; dx2=dev2.screenX*d2Scale; dy2=dev2.screenY*d2Scale+(sh2-dh2)/2; }
      else { dh2=sh2; dw2=sh2*vR2; dx2=dev2.screenX*d2Scale+(sw2-dw2)/2; dy2=dev2.screenY*d2Scale; }
    } else {
      if (vR2 > sR2) { dh2=sh2; dw2=sh2*vR2; dx2=dev2.screenX*d2Scale+(sw2-dw2)/2; dy2=dev2.screenY*d2Scale; }
      else { dw2=sw2; dh2=sw2/vR2; dx2=dev2.screenX*d2Scale; dy2=dev2.screenY*d2Scale+(sh2-dh2)/2; }
    }
    safeDrawImage(ctx, vid2Src, dx2, dy2, dw2, dh2);
    ctx.restore();
  }

  const frame2 = getDeviceFrame(dev2Id, dev2Color);
  ctx.drawImage(frame2, 0, 0, frame2.width, frame2.height, 0, 0, dev2.baseW*d2Scale, dev2.baseH*d2Scale);
  ctx.restore();
}

function renderContentLayer(ctx, CW, CH) {
  if (state.layers.length === 0) return;
  const currentTime = hasVideo ? vtTime : 0;
  for (const layer of state.layers) {
    if (layer.visible === false) continue; // hidden via unified layers panel
    if (layer.type === 'text') {
      ctx.save();
      if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;
      ctx.font = layer.weight + ' ' + layer.fontSize + 'px ' + layer.fontFamily;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align || 'left';
      ctx.textBaseline = 'top';
      if (layer.shadow > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = layer.shadow;
        ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
      }
      if (layer.outline > 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = layer.outline;
        ctx.strokeText(layer.content, layer.x, layer.y);
      }
      ctx.fillText(layer.content, layer.x, layer.y);
      ctx.restore();
    } else if (layer.type === 'logo' && layer.img) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      const aspect = layer.img.naturalWidth / layer.img.naturalHeight;
      const lh = layer.width / aspect;
      ctx.drawImage(layer.img, layer.x, layer.y, layer.width, lh);
      ctx.restore();
    } else if (layer.type === 'annotation') {
      if (layer.startTime !== undefined && (currentTime < layer.startTime || currentTime > layer.endTime)) continue;
      ctx.save();
      ctx.strokeStyle = layer.color;
      ctx.fillStyle = layer.color;
      ctx.lineWidth = layer.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (layer.annoType === 'arrow' && layer.points && layer.points.length >= 2) {
        const p = layer.points;
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        ctx.lineTo(p[1].x, p[1].y);
        ctx.stroke();
        const angle = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(p[1].x, p[1].y);
        ctx.lineTo(p[1].x - headLen*Math.cos(angle - 0.4), p[1].y - headLen*Math.sin(angle - 0.4));
        ctx.lineTo(p[1].x - headLen*Math.cos(angle + 0.4), p[1].y - headLen*Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      } else if (layer.annoType === 'circle' && layer.points && layer.points.length >= 2) {
        const cx = (layer.points[0].x + layer.points[1].x) / 2;
        const cy = (layer.points[0].y + layer.points[1].y) / 2;
        const rx = Math.abs(layer.points[1].x - layer.points[0].x) / 2;
        const ry = Math.abs(layer.points[1].y - layer.points[0].y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
        ctx.stroke();
      } else if (layer.annoType === 'rect' && layer.points && layer.points.length >= 2) {
        const rx = Math.min(layer.points[0].x, layer.points[1].x);
        const ry = Math.min(layer.points[0].y, layer.points[1].y);
        const rw = Math.abs(layer.points[1].x - layer.points[0].x);
        const rh = Math.abs(layer.points[1].y - layer.points[0].y);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (layer.annoType === 'freehand' && layer.points && layer.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(layer.points[0].x, layer.points[0].y);
        for (let i = 1; i < layer.points.length; i++) {
          ctx.lineTo(layer.points[i].x, layer.points[i].y);
        }
        ctx.stroke();
      } else if (layer.annoType === 'callout' && layer.points && layer.points.length >= 1) {
        const p = layer.points[0];
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        rrPath(ctx, p.x, p.y, 140, 40, 6);
        ctx.fill();
        ctx.fillStyle = layer.color;
        ctx.font = '14px -apple-system, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.content || 'Note', p.x + 10, p.y + 20);
      }
      ctx.restore();
    }
  }
}

function renderFacecamLayer(ctx, CW, CH) {
  if (!state.facecam.enabled || !state.facecam.stream) return;
  const fcVideo = document.getElementById('facecamVideo');
  if (!fcVideo || fcVideo.readyState < 2) return;

  const sz2 = Math.round(Math.min(CW, CH) * state.facecam.size);
  const margin = Math.round(Math.min(CW, CH) * 0.03);
  let fx, fy;
  if (state.facecam.x >= 0 && state.facecam.y >= 0) {
    fx = state.facecam.x; fy = state.facecam.y;
  } else {
    switch (state.facecam.corner) {
      case 'TL': fx = margin; fy = margin; break;
      case 'TR': fx = CW - sz2 - margin; fy = margin; break;
      case 'BL': fx = margin; fy = CH - sz2 - margin; break;
      case 'custom': fx = state.facecam.x >= 0 ? state.facecam.x : CW/2 - sz2/2; fy = state.facecam.y >= 0 ? state.facecam.y : CH/2 - sz2/2; break;
      default:   fx = CW - sz2 - margin; fy = CH - sz2 - margin;
    }
    state.facecam.x = fx; state.facecam.y = fy;
  }
  // Drop shadow
  if (state.facecam.shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = sz2 * 0.15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = sz2 * 0.04;
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    if (state.facecam.shape === 'circle') {
      ctx.beginPath(); ctx.arc(fx+sz2/2, fy+sz2/2, sz2/2, 0, Math.PI*2); ctx.fill();
    } else if (state.facecam.shape === 'roundrect') {
      rrPath(ctx, fx, fy, sz2, sz2, sz2*0.2); ctx.fill();
    } else {
      ctx.fillRect(fx, fy, sz2, sz2);
    }
    ctx.restore();
  }
  // Clip to shape and draw video
  ctx.save();
  if (state.facecam.shape === 'circle') {
    ctx.beginPath(); ctx.arc(fx+sz2/2, fy+sz2/2, sz2/2, 0, Math.PI*2); ctx.clip();
  } else if (state.facecam.shape === 'roundrect') {
    rrPath(ctx, fx, fy, sz2, sz2, sz2*0.2); ctx.clip();
  } else {
    ctx.beginPath(); ctx.rect(fx, fy, sz2, sz2); ctx.clip();
  }
  const vw = fcVideo.videoWidth, vh = fcVideo.videoHeight;
  const vAspect = vw/vh;
  let dw, dh, dx, dy;
  if (vAspect > 1) { dh = sz2; dw = sz2*vAspect; dx = fx-(dw-sz2)/2; dy = fy; }
  else { dw = sz2; dh = sz2/vAspect; dx = fx; dy = fy-(dh-sz2)/2; }
  safeDrawImage(ctx, fcVideo, dx, dy, dw, dh);
  ctx.restore();
  // Border
  if (state.facecam.borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = state.facecam.borderColor;
    ctx.lineWidth = state.facecam.borderWidth;
    if (state.facecam.shape === 'circle') {
      ctx.beginPath(); ctx.arc(fx+sz2/2, fy+sz2/2, sz2/2 - state.facecam.borderWidth/2, 0, Math.PI*2); ctx.stroke();
    } else if (state.facecam.shape === 'roundrect') {
      const bw = state.facecam.borderWidth/2;
      rrPath(ctx, fx+bw, fy+bw, sz2-state.facecam.borderWidth, sz2-state.facecam.borderWidth, sz2*0.2); ctx.stroke();
    } else {
      ctx.strokeRect(fx+state.facecam.borderWidth/2, fy+state.facecam.borderWidth/2, sz2-state.facecam.borderWidth, sz2-state.facecam.borderWidth);
    }
    ctx.restore();
  }
}

function renderVideoOverlaysLayer(ctx, CW, CH) {
  if (state.videoOverlays.length > 0) drawVideoOverlays(ctx, CW, CH);
}

function renderUiOverlaysLayer(ctx, CW, CH) {
  if (state.waveform.enabled && hasVideo) drawWaveform(ctx, CW, CH);
  if (state.progressBar.enabled && hasVideo) drawProgressBar(ctx, CW, CH);
  if (state.glassmorphism.enabled) drawGlassmorphism(ctx, CW, CH);
}

function renderPostProcessing(ctx, CW, CH) {
  if (state.motionBlur.enabled) {
    ctx.save();
    ctx.globalAlpha = state.motionBlur.amount;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.filter = 'blur(3px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }
  drawGlitchEffect(ctx, CW, CH, hasVideo ? vtTime : performance.now() * 0.001);
  if (state.lut.enabled && state.lut.data) applyLUT(canvas, state.lut, state.lut.intensity);
}

// Groups that receive scene transforms (entrance, keyframe, animation)
const SCENE_GROUPS = new Set(['device', 'device2', 'content']);

// Render dispatch map
const RENDER_MAP = {
  bgVideo: renderBgVideoLayer,
  particles: renderParticlesLayer,
  device: renderDeviceLayer,
  device2: renderDevice2Layer,
  content: renderContentLayer,
  facecam: renderFacecamLayer,
  videoOverlays: renderVideoOverlaysLayer,
  uiOverlays: renderUiOverlaysLayer,
};

// ============================================================
// MAIN RENDER (stack-based)
// ============================================================
let _renderErrorCount = 0;
let _renderLastError = null;
let _renderStopped = false;

function render() {
  try {
    vtTick();
    const sz = getCanvasSize();
    const CW = sz.w, CH = sz.h;
    ctx.clearRect(0, 0, CW, CH);

    // Background (always first, not in stack)
    renderBackground(ctx, CW, CH);

    // Calculate device positioning
    const dc = calcDevicePosition(CW, CH);

    // Calculate scene transforms
    const sceneT = calcSceneTransform();

    // Iterate render stack in order (skip hidden groups)
    for (const group of state.renderStack) {
      if (group.hidden) continue;
      const fn = RENDER_MAP[group.id];
      if (!fn) continue;

      if (SCENE_GROUPS.has(group.id)) {
        // Scene groups get entrance/keyframe/animation transforms
        ctx.save();
        applySceneTransform(ctx, CW, CH, sceneT);
        fn(ctx, CW, CH, dc);
        ctx.restore();
      } else {
        fn(ctx, CW, CH, dc);
      }
    }

    // Post-processing (always last, not in stack)
    renderPostProcessing(ctx, CW, CH);

    // Successful frame — reset error counter
    _renderErrorCount = 0;

    requestAnimationFrame(render);
  } catch (err) {
    console.error('Render error:', err);
    _renderLastError = err;
    _renderErrorCount++;

    if (_renderErrorCount < 3) {
      // Continue rendering despite error
      requestAnimationFrame(render);
    } else {
      // Stop rendering and show error banner
      _renderStopped = true;
      showRenderErrorBanner(err);
    }
  }
}

function showRenderErrorBanner(err) {
  let banner = document.getElementById('renderErrorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'renderErrorBanner';
    banner.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:500;background:rgba(30,10,10,0.95);border:1px solid rgba(255,80,80,0.3);border-radius:10px;padding:12px 20px;font-size:12px;color:#f88;display:flex;align-items:center;gap:12px;backdrop-filter:blur(12px)';
    banner.innerHTML = '<span>Rendering paused due to errors.</span><button id="renderRestart" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:5px;color:#ccc;padding:4px 12px;font-size:11px;cursor:pointer">Restart</button><button id="renderDetails" style="background:none;border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#888;padding:4px 12px;font-size:11px;cursor:pointer">Details</button>';
    document.body.appendChild(banner);
    document.getElementById('renderRestart').addEventListener('click', restartRender);
    document.getElementById('renderDetails').addEventListener('click', () => {
      alert(_renderLastError ? _renderLastError.stack || _renderLastError.message : 'No error details available.');
    });
  }
  banner.style.display = 'flex';
}

function restartRender() {
  const banner = document.getElementById('renderErrorBanner');
  if (banner) banner.style.display = 'none';
  _renderErrorCount = 0;
  _renderLastError = null;
  _renderStopped = false;
  requestAnimationFrame(render);
}

// ============================================================
// CANVAS DISPLAY SIZE
// ============================================================
function updateDisplaySize() {
  const sz = getCanvasSize();
  const pct = parseInt(scaleSlider.value) / 100;
  const stage = document.getElementById('stage');
  const maxH = stage.clientHeight - 20;
  const maxW = stage.clientWidth - 20;
  let h = maxH * pct;
  let w = h * (sz.w / sz.h);
  if (w > maxW * pct) { w = maxW * pct; h = w * (sz.h / sz.w); }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  scaleVal.textContent = scaleSlider.value + '%';
}

// ============================================================
// 3D PERSPECTIVE
// ============================================================
function updatePerspective() {
  const rx = parseInt(tiltXSlider.value);
  const ry = parseInt(tiltYSlider.value);
  const orbitY = getOrbitAngle();
  const totalRx = rx;
  const totalRy = ry + orbitY;
  if (totalRx === 0 && totalRy === 0 && !state.orbit.enabled) {
    canvasWrap.style.transform = '';
  } else {
    canvasWrap.style.transform = `perspective(1200px) rotateX(${totalRx}deg) rotateY(${totalRy}deg)`;
  }
  state.perspective.x = rx;
  state.perspective.y = ry;
}
// Orbit animation loop
function orbitLoop() {
  if (state.orbit.enabled) updatePerspective();
  requestAnimationFrame(orbitLoop);
}
orbitLoop();

// ============================================================
