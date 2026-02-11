// FACECAM
// ============================================================
function ensureFacecamVideo() {
  let fcv = document.getElementById('facecamVideo');
  if (!fcv) {
    fcv = document.createElement('video');
    fcv.id = 'facecamVideo';
    fcv.style.display = 'none';
    fcv.autoplay = true;
    fcv.muted = true;
    fcv.loop = true;
    fcv.playsInline = true;
    document.body.appendChild(fcv);
  }
  return fcv;
}

function enableFacecam() {
  state.facecam.enabled = true;
  state.facecam.x = -1; state.facecam.y = -1; // reset to corner default
  document.getElementById('facecamProps').style.display = 'block';
}

function disableFacecam() {
  state.facecam.enabled = false;
  if (state.facecam.stream && state.facecam.source === 'camera') {
    state.facecam.stream.getTracks().forEach(t => t.stop());
  }
  state.facecam.stream = null;
  document.getElementById('facecamProps').style.display = 'none';
  const fcv = document.getElementById('facecamVideo');
  if (fcv) { fcv.pause(); fcv.srcObject = null; fcv.src = ''; fcv.remove(); }
}

// Webcam button
document.getElementById('facecamBtn').addEventListener('click', async function() {
  if (state.facecam.enabled) { disableFacecam(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    state.facecam.source = 'camera';
    state.facecam.stream = stream;
    const fcv = ensureFacecamVideo();
    fcv.srcObject = stream;
    fcv.loop = false;
    enableFacecam();
  } catch (err) {
    alert('Could not access camera: ' + err.message);
  }
});

// Video file button
document.getElementById('facecamFileBtn').addEventListener('click', () => {
  document.getElementById('facecamFileInput').click();
});
document.getElementById('facecamFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (state.facecam.enabled) disableFacecam();
  state.facecam.source = 'file';
  state.facecam.stream = { getTracks: () => [] }; // placeholder so render check passes
  const fcv = ensureFacecamVideo();
  fcv.srcObject = null;
  fcv.src = URL.createObjectURL(file);
  fcv.loop = true;
  fcv.load();
  fcv.play().catch(() => { fcv.muted = true; fcv.play(); });
  enableFacecam();
});

// Disable button
document.getElementById('facecamDisableBtn').addEventListener('click', () => { disableFacecam(); });

// Controls
document.getElementById('facecamSize').addEventListener('input', e => {
  state.facecam.size = parseInt(e.target.value) / 100;
  state.facecam.x = -1; state.facecam.y = -1; // recalculate position
  document.getElementById('facecamSizeVal').textContent = e.target.value + '%';
});
document.getElementById('facecamCorner').addEventListener('change', e => {
  state.facecam.corner = e.target.value;
  state.facecam.x = -1; state.facecam.y = -1; // recalculate position
});
document.getElementById('facecamShape').addEventListener('change', e => { state.facecam.shape = e.target.value; });
document.getElementById('facecamBorderColor').addEventListener('input', e => { state.facecam.borderColor = e.target.value; });
document.getElementById('facecamBorderWidth').addEventListener('input', e => { state.facecam.borderWidth = parseInt(e.target.value); });
document.getElementById('facecamShadow').addEventListener('change', e => { state.facecam.shadow = e.target.value === 'true'; });

// Dragging facecam on canvas
let draggingFacecam = false;
let fcDragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', e => {
  if (!state.facecam.enabled || !state.facecam.stream) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;
  const sz2 = Math.round(Math.min(canvas.width, canvas.height) * state.facecam.size);
  const fx = state.facecam.x, fy = state.facecam.y;
  if (fx < 0 || fy < 0) return;
  // Hit test
  const cx = fx + sz2/2, cy = fy + sz2/2;
  const dist = Math.sqrt((mx-cx)**2 + (my-cy)**2);
  if (dist <= sz2/2 + 10) {
    draggingFacecam = true;
    fcDragOffset.x = mx - fx;
    fcDragOffset.y = my - fy;
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

canvas.addEventListener('mousemove', e => {
  if (!draggingFacecam) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  state.facecam.x = (e.clientX - rect.left) * sx - fcDragOffset.x;
  state.facecam.y = (e.clientY - rect.top) * sy - fcDragOffset.y;
  // Switch to custom corner mode
  document.getElementById('facecamCorner').value = 'custom';
  state.facecam.corner = 'custom';
}, true);

document.addEventListener('mouseup', () => { draggingFacecam = false; }, true);

// ============================================================
