// ASSET BROWSER
// ============================================================
const assetBrowser = document.getElementById('assetBrowser');
const abSidebar = document.getElementById('abSidebar');
const abContent = document.getElementById('abContent');
const abEmpty = document.getElementById('abEmpty');
const abSearch = document.getElementById('abSearch');

let abDirHandle = null;
let abIndex = []; // { path, name, type, ext, handle, parentPath, url }
let abFolders = []; // { path, name, count, icon }
let abCurrentFolder = '';
let abSearchTerm = '';
let abSource = ''; // 'server', 'folder', or ''
const abStatus = document.getElementById('abStatus');

document.getElementById('assetBrowserBtn').addEventListener('click', async () => {
  assetBrowser.classList.add('open');
  if (abIndex.length > 0) { renderAssetBrowser(); return; }
  // Try auto-detect: manifest first, then stored handle
  await abAutoDetect();
});
document.getElementById('abClose').addEventListener('click', () => assetBrowser.classList.remove('open'));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && assetBrowser.classList.contains('open')) assetBrowser.classList.remove('open'); });

document.getElementById('abPickFolder').addEventListener('click', pickAssetFolder);

async function pickAssetFolder() {
  try {
    abDirHandle = await window.showDirectoryPicker({ mode: 'read' });
    abIndex = [];
    abFolders = [];
    abSource = 'folder';
    abContent.innerHTML = '<div class="ab-loading">Scanning folder...</div>';
    abSidebar.innerHTML = '';
    await scanDirectory(abDirHandle, '');
    buildFolderTree();
    abUpdateStatus();
    abStoreHandle(abDirHandle);
    renderAssetBrowser();
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Folder pick error:', e);
  }
}

async function scanDirectory(dirHandle, path) {
  const entries = [];
  for await (const entry of dirHandle.values()) entries.push(entry);
  // Sort: folders first, then files
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path ? path + '/' + entry.name : entry.name;
    if (entry.kind === 'directory') {
      await scanDirectory(entry, fullPath);
    } else {
      const ext = entry.name.split('.').pop().toLowerCase();
      let type = 'other';
      if (ext === 'cube') type = 'lut';
      else if (['mp4','mov','webm','m4v'].includes(ext)) type = 'video';
      else if (['png','jpg','jpeg','webp','gif'].includes(ext)) type = 'image';
      else if (['mp3','wav','aac','ogg','m4a'].includes(ext)) type = 'audio';
      else if (['prproj','aep','mogrt','prfpset','ffx'].includes(ext)) type = 'preset';
      else if (['ttf','otf','woff','woff2'].includes(ext)) type = 'font';
      if (type !== 'other') {
        abIndex.push({ path: fullPath, name: entry.name, type, ext, handle: entry, parentPath: path });
      }
    }
  }
}

function buildFolderTree() {
  const folderMap = {};
  // Root
  folderMap[''] = { path: '', name: 'All Assets', count: abIndex.length, icon: '📂' };
  // Type filters
  const types = { lut: '🎨', video: '🎬', image: '🖼', audio: '🔊', preset: '⚙️', font: '🔤' };
  const typeNames = { lut: 'LUTs (.cube)', video: 'Videos', image: 'Images', audio: 'Audio/SFX', preset: 'Presets', font: 'Fonts' };
  for (const [t, icon] of Object.entries(types)) {
    const count = abIndex.filter(f => f.type === t).length;
    if (count > 0) folderMap['__type__' + t] = { path: '__type__' + t, name: typeNames[t], count, icon };
  }
  // Actual folders (first level only for cleanliness)
  const topFolders = new Set();
  for (const f of abIndex) {
    const parts = f.parentPath.split('/');
    if (parts[0]) topFolders.add(parts[0]);
  }
  for (const folder of [...topFolders].sort()) {
    const count = abIndex.filter(f => f.parentPath === folder || f.parentPath.startsWith(folder + '/')).length;
    if (count > 0) {
      let icon = '📁';
      const fl = folder.toLowerCase();
      if (fl.includes('lut')) icon = '🎨';
      else if (fl.includes('light') || fl.includes('leak') || fl.includes('glow') || fl.includes('flare')) icon = '✨';
      else if (fl.includes('film') || fl.includes('burn') || fl.includes('vhs')) icon = '🎞';
      else if (fl.includes('smoke') || fl.includes('fog') || fl.includes('cloud')) icon = '🌫';
      else if (fl.includes('sfx') || fl.includes('sound')) icon = '🔊';
      else if (fl.includes('font')) icon = '🔤';
      else if (fl.includes('transition')) icon = '🔀';
      else if (fl.includes('particle') || fl.includes('spark')) icon = '⭐';
      else if (fl.includes('overlay')) icon = '🔲';
      else if (fl.includes('background') || fl.includes('motion')) icon = '🎭';
      else if (fl.includes('text') || fl.includes('title')) icon = '📝';
      else if (fl.includes('emoji') || fl.includes('sticker')) icon = '😀';
      else if (fl.includes('glitch')) icon = '⚡';
      else if (fl.includes('icon')) icon = '💎';
      folderMap['__folder__' + folder] = { path: '__folder__' + folder, name: folder, count, icon };
    }
  }
  abFolders = Object.values(folderMap);
}

function renderAssetBrowser() {
  // Sidebar
  abSidebar.innerHTML = abFolders.map(f =>
    `<div class="ab-folder${abCurrentFolder === f.path ? ' active' : ''}" data-ab-folder="${f.path}">
      <span class="ab-icon">${f.icon}</span>
      <span>${f.name}</span>
      <span class="ab-count">${f.count}</span>
    </div>`
  ).join('');

  abSidebar.querySelectorAll('.ab-folder').forEach(el => {
    el.addEventListener('click', () => {
      abCurrentFolder = el.dataset.abFolder;
      renderAssetBrowser();
    });
  });

  // Filter items
  let items = abIndex;
  if (abCurrentFolder.startsWith('__type__')) {
    const t = abCurrentFolder.replace('__type__', '');
    items = items.filter(f => f.type === t);
  } else if (abCurrentFolder.startsWith('__folder__')) {
    const folder = abCurrentFolder.replace('__folder__', '');
    items = items.filter(f => f.parentPath === folder || f.parentPath.startsWith(folder + '/'));
  }
  if (abSearchTerm) {
    const q = abSearchTerm.toLowerCase();
    items = items.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }

  // Breadcrumb + content
  const badgeClass = { lut: 'ab-badge-lut', video: 'ab-badge-video', image: 'ab-badge-image', audio: 'ab-badge-audio' };
  const badgeLabel = { lut: 'LUT', video: 'VID', image: 'IMG', audio: 'SFX', preset: 'PRE', font: 'FONT' };
  const typeIcon = { lut: '🎨', video: '🎬', image: '🖼', audio: '🔊', preset: '⚙️', font: '🔤' };

  if (items.length === 0 && !abDirHandle) return;

  abContent.innerHTML = `
    <div class="ab-breadcrumb">
      <span data-ab-nav="">All Assets</span>
      ${abCurrentFolder ? `<span class="ab-sep">/</span><span>${abFolders.find(f => f.path === abCurrentFolder)?.name || abCurrentFolder}</span>` : ''}
      <span style="margin-left:auto;color:#555;font-size:9px">${items.length} items</span>
    </div>
    <div class="ab-grid">
      ${items.map((f, i) => `
        <div class="ab-item" data-ab-idx="${abIndex.indexOf(f)}">
          <div class="ab-item-preview">
            ${typeIcon[f.type] || '📄'}
            <span class="ab-badge ${badgeClass[f.type] || ''}">${badgeLabel[f.type] || f.ext}</span>
          </div>
          <div class="ab-item-info">
            <div class="ab-item-name" title="${f.name}">${f.name}</div>
            <div class="ab-item-type">${f.parentPath || 'Root'}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Breadcrumb nav
  abContent.querySelectorAll('[data-ab-nav]').forEach(el => {
    el.addEventListener('click', () => { abCurrentFolder = el.dataset.abNav || ''; renderAssetBrowser(); });
  });

  // Item clicks — use URL loader for server mode, handle loader for folder mode
  abContent.querySelectorAll('.ab-item').forEach(el => {
    el.addEventListener('click', async () => {
      const idx = parseInt(el.dataset.abIdx);
      const item = abIndex[idx];
      if (!item) return;
      if (item.url && !item.handle) {
        await loadAssetItemFromURL(item);
      } else {
        await loadAssetItem(item);
      }
    });
  });

  // Load thumbnail previews for images (lazy, first 50 only)
  const imageItems = items.filter(f => f.type === 'image');
  imageItems.slice(0, 50).forEach(async (f) => {
    try {
      let url;
      if (f.url && !f.handle) {
        url = f.url;
      } else {
        const file = await f.handle.getFile();
        url = URL.createObjectURL(file);
      }
      const idx = abIndex.indexOf(f);
      const previewEl = abContent.querySelector(`[data-ab-idx="${idx}"] .ab-item-preview`);
      if (previewEl) previewEl.innerHTML = `<img src="${url}"><span class="ab-badge ${badgeClass[f.type] || ''}">${badgeLabel[f.type]}</span>`;
    } catch(e) {}
  });
}

async function loadAssetItem(item) {
  try {
    const file = await item.handle.getFile();

    if (item.type === 'lut') {
      // Load as LUT
      const text = await file.text();
      const lut = parseCubeLUT(text);
      if (!lut) { alert('Invalid .CUBE LUT file'); return; }
      state.lut.data = lut;
      state.lut.size = lut.size;
      state.lut.enabled = true;
      state.lut.name = lut.title || item.name;
      document.getElementById('lutInfo').innerHTML = '<span style="color:#4ade80">Loaded:</span> ' + state.lut.name + ' (' + lut.size + '³)';
      document.getElementById('lutControls').style.display = 'block';
      document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
      showAssetToast('LUT loaded: ' + item.name);

    } else if (item.type === 'video') {
      // Load as video overlay
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.src = url;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play();
      // Sync with main video if playing
      if (hasVideo && !vtPlaying) vid.pause();
      const ov = { id: Date.now() + Math.random(), video: vid, name: item.name, opacity: 0.5, blendMode: 'screen' };
      state.videoOverlays.push(ov);
      rebuildOverlayList();
      showAssetToast('Overlay loaded: ' + item.name);

    } else if (item.type === 'image') {
      // Load as image overlay (static)
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // Add as a logo layer
        const layer = {
          id: state.nextLayerId++,
          type: 'logo', img: img, name: item.name,
          x: 100, y: 100, width: 200, opacity: 0.8
        };
        state.layers.push(layer);
        state.selectedLayer = state.layers.length - 1;
        showAssetToast('Image overlay loaded: ' + item.name);
      };

    } else if (item.type === 'audio') {
      // Load as background audio
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play();
      showAssetToast('Audio playing: ' + item.name);
    }

    // Close browser after loading
    assetBrowser.classList.remove('open');
  } catch (e) {
    console.error('Error loading asset:', e);
    alert('Could not load: ' + item.name);
  }
}

function showAssetToast(msg) { showToast(msg, 'success'); }

// Search
abSearch.addEventListener('input', e => {
  abSearchTerm = e.target.value.trim();
  if (abIndex.length > 0) renderAssetBrowser();
});

// ---- Status indicator ----
function abUpdateStatus() {
  if (abSource === 'server') {
    abStatus.textContent = 'Connected: Local Server';
    abStatus.style.color = '#4ade80';
  } else if (abSource === 'folder' && abDirHandle) {
    abStatus.textContent = 'Connected: ' + abDirHandle.name;
    abStatus.style.color = '#60a5fa';
  } else {
    abStatus.textContent = 'Not connected';
    abStatus.style.color = '#555';
  }
}

// ---- IndexedDB for directory handle persistence ----
function abOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('MockupStudioAssets', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function abStoreHandle(handle) {
  try {
    const db = await abOpenDB();
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'assetDir');
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    db.close();
  } catch (e) { console.log('IndexedDB store failed:', e.message); }
}

async function abLoadStoredHandle() {
  try {
    const db = await abOpenDB();
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get('assetDir');
    const handle = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
    db.close();
    return handle || null;
  } catch (e) { return null; }
}

// ---- Manifest-based asset loading (local server) ----
async function abLoadManifest() {
  try {
    const resp = await fetch('/assets-manifest.json');
    if (!resp.ok) return false;
    const manifest = await resp.json();
    if (!manifest.generated || !manifest.files) return false;

    abIndex = [];
    abFolders = [];
    const assetRoot = manifest.assetRoot || 'assets/';

    for (const f of manifest.files) {
      abIndex.push({
        path: f.path,
        name: f.name,
        type: f.type,
        ext: f.ext,
        handle: null,
        parentPath: f.parentPath,
        url: assetRoot + f.path,
        size: f.size
      });
    }

    abSource = 'server';
    buildFolderTree();
    abUpdateStatus();
    renderAssetBrowser();
    return true;
  } catch (e) { return false; }
}

// ---- Load asset from URL (server mode) or handle (folder mode) ----
async function loadAssetItemFromURL(item) {
  try {
    if (item.type === 'lut') {
      const resp = await fetch(item.url);
      const text = await resp.text();
      const lut = parseCubeLUT(text);
      if (!lut) { alert('Invalid .CUBE LUT file'); return; }
      state.lut.data = lut;
      state.lut.size = lut.size;
      state.lut.enabled = true;
      state.lut.name = lut.title || item.name;
      document.getElementById('lutInfo').innerHTML = '<span style="color:#4ade80">Loaded:</span> ' + state.lut.name + ' (' + lut.size + '\u00b3)';
      document.getElementById('lutControls').style.display = 'block';
      document.querySelectorAll('#lutPresetGrid .dev-btn').forEach(b => b.classList.remove('active'));
      showAssetToast('LUT loaded: ' + item.name);

    } else if (item.type === 'video') {
      const vid = document.createElement('video');
      vid.src = item.url;
      vid.crossOrigin = 'anonymous';
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play();
      if (hasVideo && !vtPlaying) vid.pause();
      const ov = { id: Date.now() + Math.random(), video: vid, name: item.name, opacity: 0.5, blendMode: 'screen' };
      state.videoOverlays.push(ov);
      rebuildOverlayList();
      showAssetToast('Overlay loaded: ' + item.name);

    } else if (item.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.url;
      img.onload = () => {
        const layer = {
          id: state.nextLayerId++,
          type: 'logo', img: img, name: item.name,
          x: 100, y: 100, width: 200, opacity: 0.8
        };
        state.layers.push(layer);
        state.selectedLayer = state.layers.length - 1;
        showAssetToast('Image overlay loaded: ' + item.name);
      };

    } else if (item.type === 'audio') {
      const audio = new Audio(item.url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play();
      showAssetToast('Audio playing: ' + item.name);
    }

    assetBrowser.classList.remove('open');
  } catch (e) {
    console.error('Error loading asset from URL:', e);
    alert('Could not load: ' + item.name);
  }
}

// ---- Auto-detect: manifest → stored handle → show picker prompt ----
async function abAutoDetect() {
  abContent.innerHTML = '<div class="ab-loading">Detecting assets...</div>';
  abSidebar.innerHTML = '';
  abUpdateStatus();

  // 1. Try server manifest
  if (window.location.protocol !== 'file:') {
    const loaded = await abLoadManifest();
    if (loaded) return;
  }

  // 2. Try stored directory handle from IndexedDB
  const storedHandle = await abLoadStoredHandle();
  if (storedHandle) {
    try {
      const perm = await storedHandle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        abDirHandle = storedHandle;
        abIndex = [];
        abFolders = [];
        abSource = 'folder';
        abContent.innerHTML = '<div class="ab-loading">Scanning folder...</div>';
        await scanDirectory(abDirHandle, '');
        buildFolderTree();
        abUpdateStatus();
        renderAssetBrowser();
        return;
      }
    } catch (e) { console.log('Stored handle permission denied:', e.message); }
  }

  // 3. Fall back to manual picker prompt
  abContent.innerHTML = '';
  abContent.appendChild(abEmpty);
  abUpdateStatus();
}

// ============================================================
