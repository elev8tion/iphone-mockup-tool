// EFFECT PRESETS
// ============================================================
// Predefined audio and video effect configurations

const AUDIO_PRESETS = {
  podcast: {
    name: 'Podcast Voice',
    effects: {
      volume: 1.0,
      pan: 0,
      eq: { low: -2, mid: 3, high: 5 },
      compressor: {
        enabled: true,
        threshold: -18,
        ratio: 4,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  },

  music: {
    name: 'Music Enhancement',
    effects: {
      volume: 1.0,
      pan: 0,
      eq: { low: 3, mid: 0, high: 2 },
      compressor: {
        enabled: true,
        threshold: -12,
        ratio: 2,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  },

  bass: {
    name: 'Bass Boost',
    effects: {
      volume: 1.0,
      pan: 0,
      eq: { low: 8, mid: -2, high: 0 },
      compressor: {
        enabled: false,
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  },

  vocal: {
    name: 'Vocal Clarity',
    effects: {
      volume: 1.0,
      pan: 0,
      eq: { low: -3, mid: 5, high: 3 },
      compressor: {
        enabled: true,
        threshold: -15,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  },

  radio: {
    name: 'Radio Effect',
    effects: {
      volume: 1.0,
      pan: 0,
      eq: { low: -8, mid: 6, high: -4 },
      compressor: {
        enabled: true,
        threshold: -12,
        ratio: 8,
        attack: 0.001,
        release: 0.1
      },
      reverb: { enabled: false, mix: 0.3, decay: 2 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  },

  spacious: {
    name: 'Spacious Reverb',
    effects: {
      volume: 1.0,
      pan: 0,
      eq: { low: 0, mid: 0, high: 2 },
      compressor: {
        enabled: false,
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      },
      reverb: { enabled: true, mix: 0.5, decay: 3 },
      echo: { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 }
    }
  }
};

const VIDEO_PRESETS = {
  cinematic: {
    name: 'Cinematic',
    effects: {
      brightness: -5,
      contrast: 15,
      saturation: -10,
      hue: 0,
      temperature: 5,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.1,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  vibrant: {
    name: 'Vibrant Pop',
    effects: {
      brightness: 5,
      contrast: 20,
      saturation: 40,
      hue: 0,
      temperature: 0,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.0,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  vintage: {
    name: 'Vintage Film',
    effects: {
      brightness: -10,
      contrast: 5,
      saturation: -20,
      hue: 0,
      temperature: 25,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.05,
        outputMin: 0,
        outputMax: 255
      },
      filters: [
        { type: 'sepia', amount: 30 }
      ],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  bwContrast: {
    name: 'B&W High Contrast',
    effects: {
      brightness: 0,
      contrast: 40,
      saturation: -100,
      hue: 0,
      temperature: 0,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.2,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  cool: {
    name: 'Cool Tone',
    effects: {
      brightness: 0,
      contrast: 10,
      saturation: 10,
      hue: 0,
      temperature: -30,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.0,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  warm: {
    name: 'Warm Tone',
    effects: {
      brightness: 5,
      contrast: 5,
      saturation: 10,
      hue: 0,
      temperature: 30,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.0,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  fade: {
    name: 'Faded Look',
    effects: {
      brightness: 10,
      contrast: -15,
      saturation: -20,
      hue: 0,
      temperature: 0,
      tint: 0,
      levels: {
        inputMin: 20,
        inputMax: 235,
        gamma: 1.0,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  },

  dramatic: {
    name: 'Dramatic',
    effects: {
      brightness: -10,
      contrast: 50,
      saturation: 20,
      hue: 0,
      temperature: 0,
      tint: 0,
      levels: {
        inputMin: 0,
        inputMax: 255,
        gamma: 1.3,
        outputMin: 0,
        outputMax: 255
      },
      filters: [],
      blendMode: 'normal',
      crop: { enabled: false, x: 0, y: 0, w: 1, h: 1 }
    }
  }
};

// Load audio preset
function loadAudioPreset(trackName, presetName) {
  const preset = AUDIO_PRESETS[presetName];
  if (!preset || !state.audioEffects) return;

  // Update state
  Object.assign(state.audioEffects[trackName], preset.effects);

  // Update audio chain
  updateAudioEffects(trackName);

  // Update UI
  updateAudioEffectUI(trackName);
}

// Load video preset
function loadVideoPreset(trackName, presetName) {
  const preset = VIDEO_PRESETS[presetName];
  if (!preset || !state.videoEffects) return;

  // Update state
  Object.assign(state.videoEffects[trackName], preset.effects);

  // Update UI
  updateVideoEffectUI(trackName);
}

// Save custom preset to localStorage
function saveCustomPreset(type, trackName, presetName, config) {
  const key = `customPresets_${type}`;
  let presets = {};

  try {
    const stored = localStorage.getItem(key);
    if (stored) presets = JSON.parse(stored);
  } catch (e) {
    console.error('Error loading custom presets:', e);
  }

  presets[presetName] = {
    name: presetName,
    effects: config
  };

  try {
    localStorage.setItem(key, JSON.stringify(presets));
    showToast(`Saved custom preset: ${presetName}`, 'success');
  } catch (e) {
    console.error('Error saving custom preset:', e);
    showToast('Failed to save preset', 'error');
  }
}

// Get custom presets
function getCustomPresets(type) {
  const key = `customPresets_${type}`;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error loading custom presets:', e);
    return {};
  }
}
