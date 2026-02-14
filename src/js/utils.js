// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
const toastContainer = document.getElementById('toastContainer');
function showToast(message, type) {
  type = type || 'info';
  const el = document.createElement('div');
  el.className = 'toast-item toast-' + type;
  el.textContent = message;
  // Enforce max 3 toasts
  while (toastContainer.children.length >= 3) {
    toastContainer.firstChild.remove();
  }
  toastContainer.appendChild(el);
  // Trigger slide-in
  requestAnimationFrame(() => { requestAnimationFrame(() => { el.classList.add('visible'); }); });
  // Auto-dismiss after 3s
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// Safe wrapper for drawImage with video elements (video may not be loaded/ready)
function safeDrawImage(ctx, source) {
  try {
    if (!source) return;
    if (source.tagName === 'VIDEO' && (source.readyState < 2 || source.videoWidth === 0)) return;
    ctx.drawImage.apply(ctx, Array.prototype.slice.call(arguments, 1));
  } catch (e) { /* skip frame — video not ready or tainted */ }
}

// Safe wrapper for getImageData (can fail with tainted canvas / CORS)
function safeGetImageData(ctx, x, y, w, h) {
  try {
    return ctx.getImageData(x, y, w, h);
  } catch (e) { return null; }
}

// ============================================================
// HELPER: Rounded rect path
// ============================================================
function rrPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function pillPath(c, x, y, w, h) {
  const r = h / 2;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arc(x + w - r, y + r, r, -Math.PI/2, Math.PI/2);
  c.lineTo(x + r, y + h);
  c.arc(x + r, y + r, r, Math.PI/2, -Math.PI/2);
  c.closePath();
}

// ============================================================
// WAVEFORM GENERATOR
// ============================================================
function generateWaveform(audioBuffer, canvas, color = '#a78bfa') {
  if (!audioBuffer || !canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const data = audioBuffer.getChannelData(0); // Use first channel
  const step = Math.ceil(data.length / width);
  const amp = height / 2;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.beginPath();
  
  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    
    // Find min/max in this step window
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    
    // Draw bar
    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
}

// ============================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ============================================================

// Debounce function for expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize events
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization for expensive calculations
function memoize(fn) {
  const cache = new Map();
  return function memoizedFunction(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// ============================================================
