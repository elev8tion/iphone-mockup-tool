// DEVICE REGISTRY
// ============================================================
const DEVICES = {
  iphone16: {
    id: 'iphone16', name: 'iPhone 16',
    baseW: 420, baseH: 864,
    screenX: 10, screenY: 10, screenW: 400, screenH: 844, screenR: 48, cornerR: 56,
    islandX: 149, islandY: 21, islandW: 122, islandH: 36, islandR: 18,
    camX: 244, camY: 39, camR: 5,
    colors: {
      black:    { edge:'#404042', mid:'#0f0f11', body:'#141416', bezel:'#07070a', label:'Black' },
      white:    { edge:'#e8e8e8', mid:'#f5f5f5', body:'#fafafa', bezel:'#e0e0e0', label:'White' },
      titanium: { edge:'#8a8580', mid:'#6b6560', body:'#7a756f', bezel:'#3a3530', label:'Titanium' },
      blue:     { edge:'#394860', mid:'#2a3548', body:'#313f55', bezel:'#0a0f18', label:'Blue' },
      pink:     { edge:'#e8c4c8', mid:'#dba8ae', body:'#e0b5ba', bezel:'#6a4548', label:'Pink' },
    },
    defaultColor: 'black',
    draw: function(c, S, pal) { drawIPhone16(c, S, this, pal); }
  },
  ipadpro: {
    id: 'ipadpro', name: 'iPad Pro',
    baseW: 620, baseH: 860,
    screenX: 16, screenY: 16, screenW: 588, screenH: 828, screenR: 20, cornerR: 28,
    colors: {
      spaceblack: { edge:'#2a2a2c', mid:'#1a1a1c', body:'#222224', bezel:'#111113', label:'Space Black' },
      silver:     { edge:'#d8d8d8', mid:'#e8e8e8', body:'#f0f0f0', bezel:'#c8c8c8', label:'Silver' },
    },
    defaultColor: 'spaceblack',
    draw: function(c, S, pal) { drawIPadPro(c, S, this, pal); }
  },
  macbookpro: {
    id: 'macbookpro', name: 'MacBook Pro',
    baseW: 800, baseH: 520,
    screenX: 48, screenY: 20, screenW: 704, screenH: 440, screenR: 8, cornerR: 16,
    colors: {
      spaceblack: { edge:'#2a2a2c', mid:'#1a1a1c', body:'#222224', bezel:'#111113', label:'Space Black' },
      silver:     { edge:'#d4d4d4', mid:'#e0e0e0', body:'#e8e8e8', bezel:'#c0c0c0', label:'Silver' },
    },
    defaultColor: 'spaceblack',
    draw: function(c, S, pal) { drawMacBookPro(c, S, this, pal); }
  },
  applewatch: {
    id: 'applewatch', name: 'Apple Watch',
    baseW: 260, baseH: 320,
    screenX: 24, screenY: 36, screenW: 212, screenH: 248, screenR: 40, cornerR: 56,
    colors: {
      midnight:  { edge:'#1a1a2e', mid:'#0f0f1a', body:'#151520', bezel:'#0a0a12', label:'Midnight' },
      starlight: { edge:'#e8e0d0', mid:'#f0e8d8', body:'#f5ede0', bezel:'#d8d0c0', label:'Starlight' },
      silver:    { edge:'#c8c8c8', mid:'#d8d8d8', body:'#e0e0e0', bezel:'#b0b0b0', label:'Silver' },
    },
    defaultColor: 'midnight',
    draw: function(c, S, pal) { drawAppleWatch(c, S, this, pal); }
  },
  none: {
    id: 'none', name: 'No Device',
    baseW: 1080, baseH: 1920,
    screenX: 0, screenY: 0, screenW: 1080, screenH: 1920, screenR: 0, cornerR: 0,
    colors: { default: { edge:'#000', mid:'#000', body:'#000', bezel:'#000', label:'None' } },
    defaultColor: 'default',
    draw: function() {}
  }
};

// ============================================================
// SOCIAL MEDIA PRESETS
// ============================================================
const PRESETS = {
  device: null, // tight crop
  reels:   { w: 1080, h: 1920 },
  twitter: { w: 1080, h: 1350 },
  youtube: { w: 1920, h: 1080 },
  square:  { w: 1080, h: 1080 },
  custom:  { w: 1080, h: 1920 },
};

// ============================================================
