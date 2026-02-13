// DEVICE DRAW FUNCTIONS
// ============================================================
function drawIPhone16(c, S, dev, pal) {
  // Outer body
  rrPath(c, 0, 0, dev.baseW*S, dev.baseH*S, dev.cornerR*S);
  const bodyH = c.createLinearGradient(0, 0, dev.baseW*S, 0);
  bodyH.addColorStop(0, pal.edge);
  bodyH.addColorStop(0.015, pal.mid);
  bodyH.addColorStop(0.04, pal.body);
  bodyH.addColorStop(0.15, pal.body);
  bodyH.addColorStop(0.5, pal.mid);
  bodyH.addColorStop(0.85, pal.body);
  bodyH.addColorStop(0.96, pal.body);
  bodyH.addColorStop(0.985, pal.mid);
  bodyH.addColorStop(1, pal.edge);
  c.fillStyle = bodyH;
  c.fill();

  // Vertical ambient
  rrPath(c, 0, 0, dev.baseW*S, dev.baseH*S, dev.cornerR*S);
  const bodyV = c.createLinearGradient(0, 0, 0, dev.baseH*S);
  bodyV.addColorStop(0, 'rgba(255,255,255,0.07)');
  bodyV.addColorStop(0.03, 'rgba(255,255,255,0.03)');
  bodyV.addColorStop(0.15, 'rgba(255,255,255,0)');
  bodyV.addColorStop(0.85, 'rgba(255,255,255,0)');
  bodyV.addColorStop(0.97, 'rgba(255,255,255,0.02)');
  bodyV.addColorStop(1, 'rgba(255,255,255,0.05)');
  c.fillStyle = bodyV;
  c.fill();

  // Chamfered edge
  rrPath(c, 0.4*S, 0.4*S, (dev.baseW-0.8)*S, (dev.baseH-0.8)*S, (dev.cornerR-0.4)*S);
  c.strokeStyle = 'rgba(255,255,255,0.15)';
  c.lineWidth = 0.8*S;
  c.stroke();

  // Inner lip shadow
  rrPath(c, 3.5*S, 3.5*S, (dev.baseW-7)*S, (dev.baseH-7)*S, (dev.cornerR-3.5)*S);
  c.strokeStyle = 'rgba(0,0,0,0.6)';
  c.lineWidth = 1.5*S;
  c.stroke();

  // Screen bezel
  rrPath(c, 5*S, 5*S, (dev.baseW-10)*S, (dev.baseH-10)*S, (dev.cornerR-5)*S);
  c.fillStyle = pal.bezel;
  c.fill();

  // Screen cutout
  c.save();
  rrPath(c, dev.screenX*S, dev.screenY*S, dev.screenW*S, dev.screenH*S, dev.screenR*S);
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  c.fill();
  c.restore();

  // Dynamic Island
  pillPath(c, dev.islandX*S, dev.islandY*S, dev.islandW*S, dev.islandH*S);
  c.fillStyle = '#000000';
  c.fill();
  pillPath(c, dev.islandX*S, dev.islandY*S, dev.islandW*S, dev.islandH*S);
  c.strokeStyle = 'rgba(255,255,255,0.035)';
  c.lineWidth = 0.6*S;
  c.stroke();

  // Front camera
  const cx = dev.camX*S, cy = dev.camY*S;
  c.beginPath(); c.arc(cx, cy, 5.5*S, 0, Math.PI*2); c.fillStyle = '#0a0a14'; c.fill();
  c.beginPath(); c.arc(cx, cy, 4.5*S, 0, Math.PI*2);
  c.strokeStyle = 'rgba(80,80,140,0.3)'; c.lineWidth = 0.6*S; c.stroke();
  c.beginPath(); c.arc(cx, cy, 3*S, 0, Math.PI*2);
  const lg = c.createRadialGradient(cx, cy, 0, cx, cy, 3*S);
  lg.addColorStop(0, '#14142a'); lg.addColorStop(0.7, '#0d0d1a'); lg.addColorStop(1, '#06060e');
  c.fillStyle = lg; c.fill();
  c.beginPath(); c.arc(cx-1.2*S, cy-1.2*S, 1*S, 0, Math.PI*2);
  c.fillStyle = 'rgba(150,160,220,0.2)'; c.fill();

  // Side buttons
  const btnFill = pal.body === '#fafafa' ? '#d0d0d0' : '#252527';
  rrPath(c, (dev.baseW-0.2)*S, 218*S, 2.8*S, 72*S, 1.4*S);
  c.fillStyle = btnFill; c.fill();
  rrPath(c, -2.6*S, 192*S, 2.8*S, 42*S, 1.4*S);
  c.fillStyle = btnFill; c.fill();
  rrPath(c, -2.6*S, 245*S, 2.8*S, 42*S, 1.4*S);
  c.fillStyle = btnFill; c.fill();
  rrPath(c, -2.6*S, 146*S, 2.8*S, 26*S, 1.4*S);
  c.fillStyle = btnFill; c.fill();

  // Bottom details
  const bY = (dev.baseH - 4.5)*S;
  c.fillStyle = pal.bezel === '#e0e0e0' ? '#b0b0b0' : '#1c1c1e';
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.arc((dev.baseW/2 - 34 + i*9.5)*S, bY, 1.6*S, 0, Math.PI*2); c.fill();
  }
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.arc((dev.baseW/2 + 12 + i*9.5)*S, bY, 1.6*S, 0, Math.PI*2); c.fill();
  }
  rrPath(c, (dev.baseW/2 - 11)*S, (dev.baseH-5.5)*S, 22*S, 4.8*S, 2.4*S);
  c.fillStyle = pal.bezel === '#e0e0e0' ? '#c0c0c0' : '#18181b'; c.fill();
  rrPath(c, (dev.baseW/2 - 11)*S, (dev.baseH-5.5)*S, 22*S, 4.8*S, 2.4*S);
  c.strokeStyle = 'rgba(255,255,255,0.03)'; c.lineWidth = 0.3*S; c.stroke();
}

function drawIPadPro(c, S, dev, pal) {
  // Body
  rrPath(c, 0, 0, dev.baseW*S, dev.baseH*S, dev.cornerR*S);
  const bg = c.createLinearGradient(0, 0, dev.baseW*S, 0);
  bg.addColorStop(0, pal.edge); bg.addColorStop(0.02, pal.body);
  bg.addColorStop(0.98, pal.body); bg.addColorStop(1, pal.edge);
  c.fillStyle = bg; c.fill();

  // Edge highlight
  rrPath(c, 0.5*S, 0.5*S, (dev.baseW-1)*S, (dev.baseH-1)*S, (dev.cornerR-0.5)*S);
  c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 0.6*S; c.stroke();

  // Bezel area
  rrPath(c, 8*S, 8*S, (dev.baseW-16)*S, (dev.baseH-16)*S, (dev.cornerR-8)*S);
  c.fillStyle = pal.bezel; c.fill();

  // Screen cutout
  c.save();
  rrPath(c, dev.screenX*S, dev.screenY*S, dev.screenW*S, dev.screenH*S, dev.screenR*S);
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000'; c.fill();
  c.restore();

  // Front camera (landscape edge - top center)
  const camCx = (dev.baseW/2)*S, camCy = 8*S;
  c.beginPath(); c.arc(camCx, camCy, 3*S, 0, Math.PI*2);
  c.fillStyle = '#0a0a14'; c.fill();
  c.beginPath(); c.arc(camCx, camCy, 2*S, 0, Math.PI*2);
  c.fillStyle = '#06060e'; c.fill();

  // USB-C bottom
  rrPath(c, (dev.baseW/2 - 10)*S, (dev.baseH-4)*S, 20*S, 3.5*S, 1.7*S);
  c.fillStyle = pal.bezel === '#c8c8c8' ? '#a0a0a0' : '#18181b'; c.fill();
}

function drawMacBookPro(c, S, dev, pal) {
  const screenH = dev.screenY + dev.screenH + 16;
  const baseY = screenH;
  const baseH = dev.baseH - screenH;

  // Screen lid
  rrPath(c, 0, 0, dev.baseW*S, screenH*S, dev.cornerR*S);
  const bg = c.createLinearGradient(0, 0, dev.baseW*S, 0);
  bg.addColorStop(0, pal.edge); bg.addColorStop(0.02, pal.body);
  bg.addColorStop(0.98, pal.body); bg.addColorStop(1, pal.edge);
  c.fillStyle = bg; c.fill();

  // Bezel
  rrPath(c, 20*S, 10*S, (dev.baseW-40)*S, (screenH-12)*S, 8*S);
  c.fillStyle = pal.bezel; c.fill();

  // Screen cutout
  c.save();
  rrPath(c, dev.screenX*S, dev.screenY*S, dev.screenW*S, dev.screenH*S, dev.screenR*S);
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000'; c.fill();
  c.restore();

  // Notch
  const notchW = 120, notchH = 18;
  const notchX = (dev.baseW - notchW) / 2;
  rrPath(c, notchX*S, dev.screenY*S, notchW*S, notchH*S, 6*S);
  c.fillStyle = pal.bezel; c.fill();
  // Camera in notch
  c.beginPath(); c.arc((dev.baseW/2)*S, (dev.screenY + notchH/2)*S, 2.5*S, 0, Math.PI*2);
  c.fillStyle = '#0a0a14'; c.fill();

  // Base / keyboard area
  c.fillStyle = pal.body;
  c.beginPath();
  c.moveTo(4*S, baseY*S);
  c.lineTo((dev.baseW-4)*S, baseY*S);
  c.lineTo((dev.baseW-2)*S, (baseY+3)*S);
  c.lineTo((dev.baseW-2)*S, (dev.baseH-6)*S);
  c.quadraticCurveTo((dev.baseW-2)*S, dev.baseH*S, (dev.baseW-8)*S, dev.baseH*S);
  c.lineTo(8*S, dev.baseH*S);
  c.quadraticCurveTo(2*S, dev.baseH*S, 2*S, (dev.baseH-6)*S);
  c.lineTo(2*S, (baseY+3)*S);
  c.closePath();
  c.fill();

  // Hinge line
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.fillRect(4*S, baseY*S, (dev.baseW-8)*S, 2*S);

  // Trackpad
  const tpW = 240, tpH = 80;
  const tpX = (dev.baseW - tpW)/2, tpY = baseY + baseH/2 - 10;
  rrPath(c, tpX*S, tpY*S, tpW*S, tpH*S, 6*S);
  c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 0.5*S; c.stroke();
}

function drawAppleWatch(c, S, dev, pal) {
  // Body
  rrPath(c, 0, 0, dev.baseW*S, dev.baseH*S, dev.cornerR*S);
  const bg = c.createLinearGradient(0, 0, dev.baseW*S, 0);
  bg.addColorStop(0, pal.edge); bg.addColorStop(0.03, pal.body);
  bg.addColorStop(0.97, pal.body); bg.addColorStop(1, pal.edge);
  c.fillStyle = bg; c.fill();

  // Edge highlight
  rrPath(c, 0.5*S, 0.5*S, (dev.baseW-1)*S, (dev.baseH-1)*S, (dev.cornerR-0.5)*S);
  c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 0.6*S; c.stroke();

  // Bezel
  rrPath(c, 10*S, 18*S, (dev.baseW-20)*S, (dev.baseH-36)*S, (dev.screenR+4)*S);
  c.fillStyle = pal.bezel; c.fill();

  // Screen cutout
  c.save();
  rrPath(c, dev.screenX*S, dev.screenY*S, dev.screenW*S, dev.screenH*S, dev.screenR*S);
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000'; c.fill();
  c.restore();

  // Digital Crown (right side)
  rrPath(c, (dev.baseW-1)*S, 100*S, 6*S, 40*S, 3*S);
  c.fillStyle = pal.edge; c.fill();
  // Side button
  rrPath(c, (dev.baseW-0.5)*S, 160*S, 5*S, 24*S, 2*S);
  c.fillStyle = pal.edge; c.fill();
}

// ============================================================
// FRAME CACHE with LRU Management
// ============================================================
let frameCache = {};
let frameCacheMetadata = {}; // Track usage for LRU
const MAX_FRAME_CACHE_SIZE = 20; // Limit cache size

function getDeviceFrame(deviceId, colorKey) {
  const key = deviceId + '_' + colorKey;

  // Cache hit - update last used time
  if (frameCache[key]) {
    if (frameCacheMetadata[key]) {
      frameCacheMetadata[key].lastUsed = Date.now();
      frameCacheMetadata[key].useCount++;
    }
    return frameCache[key];
  }

  // Enforce cache size limit using LRU eviction
  if (Object.keys(frameCache).length >= MAX_FRAME_CACHE_SIZE) {
    evictLeastRecentlyUsedFrame();
  }

  // Cache miss - create new frame
  const dev = DEVICES[deviceId];
  if (!dev) {
    console.warn(`Device not found: ${deviceId}`);
    return null;
  }

  const pal = dev.colors[colorKey];
  if (!pal) {
    console.warn(`Color not found for device ${deviceId}: ${colorKey}`);
    return null;
  }

  const fc = document.createElement('canvas');
  fc.width = dev.baseW * RENDER_SCALE;
  fc.height = dev.baseH * RENDER_SCALE;
  const fCtx = fc.getContext('2d');

  try {
    dev.draw(fCtx, RENDER_SCALE, pal);
    frameCache[key] = fc;
    frameCacheMetadata[key] = {
      created: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
      size: fc.width * fc.height * 4 // Approximate memory in bytes
    };
    return fc;
  } catch (error) {
    console.error(`Error drawing device frame ${deviceId}:`, error);
    return null;
  }
}

// Evict least recently used frame
function evictLeastRecentlyUsedFrame() {
  const entries = Object.entries(frameCacheMetadata);
  if (entries.length === 0) return;

  // Sort by last used time (oldest first)
  entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

  // Remove oldest frame
  const [keyToRemove] = entries[0];
  delete frameCache[keyToRemove];
  delete frameCacheMetadata[keyToRemove];
}

// Clear entire frame cache (call when device changes)
function clearFrameCache() {
  frameCache = {};
  frameCacheMetadata = {};
}

// Get cache statistics
function getFrameCacheStats() {
  const entries = Object.values(frameCacheMetadata);
  const totalSize = entries.reduce((sum, meta) => sum + meta.size, 0);
  const totalUses = entries.reduce((sum, meta) => sum + meta.useCount, 0);

  return {
    entries: entries.length,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    totalUses,
    avgUsesPerFrame: entries.length > 0 ? (totalUses / entries.length).toFixed(1) : 0
  };
}

// Export cleanup for external use
if (typeof window !== 'undefined') {
  window.clearFrameCache = clearFrameCache;
  window.getFrameCacheStats = getFrameCacheStats;
}

// ============================================================
