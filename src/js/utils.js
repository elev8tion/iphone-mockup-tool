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
