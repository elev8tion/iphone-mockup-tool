// AUDIO EFFECTS PROCESSOR
// ============================================================
// Professional audio processing using Web Audio API

class AudioEffectChain {
  constructor(audioElement, trackName) {
    this.audioElement = audioElement;
    this.trackName = trackName;
    this.ctx = getSharedAudioContext();

    // Audio nodes
    this.sourceNode = null;
    this.gainNode = null;
    this.panNode = null;
    this.eqLowNode = null;
    this.eqMidNode = null;
    this.eqHighNode = null;
    this.compressorNode = null;
    this.reverbNode = null;
    this.delayNode = null;
    this.delayGainNode = null;
    this.reverbGainNode = null;
    this.analyserNode = null;

    // State
    this.initialized = false;
    this.reverb = { enabled: false, buffer: null, mix: 0.3 };
    this.echo = { enabled: false, delay: 0.5, feedback: 0.3, mix: 0.5 };
  }

  initialize() {
    if (this.initialized) return;

    try {
      // Create source node (only once per audio element)
      if (!this.sourceNode) {
        this.sourceNode = this.ctx.createMediaElementSource(this.audioElement);
      }

      // Create effect nodes
      this.gainNode = this.ctx.createGain();
      this.panNode = this.ctx.createStereoPanner();

      // EQ - 3-band with shelf filters
      this.eqLowNode = this.ctx.createBiquadFilter();
      this.eqLowNode.type = 'lowshelf';
      this.eqLowNode.frequency.value = 200;

      this.eqMidNode = this.ctx.createBiquadFilter();
      this.eqMidNode.type = 'peaking';
      this.eqMidNode.frequency.value = 1000;
      this.eqMidNode.Q.value = 0.5;

      this.eqHighNode = this.ctx.createBiquadFilter();
      this.eqHighNode.type = 'highshelf';
      this.eqHighNode.frequency.value = 3000;

      // Compressor
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -24;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 3;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      // Reverb setup (ConvolverNode)
      this.reverbNode = this.ctx.createConvolver();
      this.reverbGainNode = this.ctx.createGain();
      this.reverbGainNode.gain.value = 0;

      // Echo/Delay setup
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayNode.delayTime.value = 0.5;
      this.delayGainNode = this.ctx.createGain();
      this.delayGainNode.gain.value = 0;

      // Analyser for visualization
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 512;

      // Build audio graph
      this.rebuild();

      this.initialized = true;
    } catch (e) {
      console.error(`AudioEffectChain init error (${this.trackName}):`, e);
    }
  }

  rebuild() {
    if (!this.initialized) return;

    try {
      // Disconnect all nodes
      this.sourceNode.disconnect();
      this.gainNode.disconnect();
      this.panNode.disconnect();
      this.eqLowNode.disconnect();
      this.eqMidNode.disconnect();
      this.eqHighNode.disconnect();
      this.compressorNode.disconnect();
      this.delayNode.disconnect();
      this.delayGainNode.disconnect();
      this.reverbNode.disconnect();
      this.reverbGainNode.disconnect();
      this.analyserNode.disconnect();

      // Main chain: source → gain → pan → EQ (low/mid/high) → compressor
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.panNode);
      this.panNode.connect(this.eqLowNode);
      this.eqLowNode.connect(this.eqMidNode);
      this.eqMidNode.connect(this.eqHighNode);
      this.eqHighNode.connect(this.compressorNode);

      // Reverb send/return
      this.compressorNode.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbGainNode);

      // Delay send/return with feedback
      this.compressorNode.connect(this.delayNode);
      this.delayNode.connect(this.delayGainNode);
      this.delayGainNode.connect(this.delayNode); // Feedback loop

      // Mix everything to analyser
      this.compressorNode.connect(this.analyserNode);
      this.reverbGainNode.connect(this.analyserNode);
      this.delayGainNode.connect(this.analyserNode);

      // Final output
      this.analyserNode.connect(this.ctx.destination);

    } catch (e) {
      console.error(`AudioEffectChain rebuild error (${this.trackName}):`, e);
    }
  }

  // Volume control (0-2 for 0-200%)
  setVolume(value) {
    if (!this.gainNode) return;
    this.gainNode.gain.setValueAtTime(value, this.ctx.currentTime);
  }

  // Pan control (-1 left, 0 center, 1 right)
  setPan(value) {
    if (!this.panNode) return;
    this.panNode.pan.setValueAtTime(value, this.ctx.currentTime);
  }

  // EQ controls (gain in dB: -12 to +12)
  setEQ(band, gainDB) {
    if (!this.initialized) return;
    const gain = gainDB; // Direct dB value

    switch (band) {
      case 'low':
        this.eqLowNode.gain.setValueAtTime(gain, this.ctx.currentTime);
        break;
      case 'mid':
        this.eqMidNode.gain.setValueAtTime(gain, this.ctx.currentTime);
        break;
      case 'high':
        this.eqHighNode.gain.setValueAtTime(gain, this.ctx.currentTime);
        break;
    }
  }

  // Compressor settings
  setCompressor(params) {
    if (!this.compressorNode) return;

    if (params.threshold !== undefined) {
      this.compressorNode.threshold.setValueAtTime(params.threshold, this.ctx.currentTime);
    }
    if (params.ratio !== undefined) {
      this.compressorNode.ratio.setValueAtTime(params.ratio, this.ctx.currentTime);
    }
    if (params.attack !== undefined) {
      this.compressorNode.attack.setValueAtTime(params.attack, this.ctx.currentTime);
    }
    if (params.release !== undefined) {
      this.compressorNode.release.setValueAtTime(params.release, this.ctx.currentTime);
    }
  }

  // Enable/disable reverb
  enableReverb(enabled, mix = 0.3) {
    if (!this.initialized) return;
    this.reverb.enabled = enabled;
    this.reverb.mix = mix;

    if (enabled) {
      // Create impulse response if not exists
      if (!this.reverb.buffer) {
        this.reverb.buffer = this.createReverbImpulse(2.0, 2);
        this.reverbNode.buffer = this.reverb.buffer;
      }
      this.reverbGainNode.gain.setValueAtTime(mix, this.ctx.currentTime);
    } else {
      this.reverbGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  // Create reverb impulse response
  createReverbImpulse(duration, decay) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }

    return impulse;
  }

  // Enable/disable echo/delay
  enableEcho(enabled, params = {}) {
    if (!this.initialized) return;
    this.echo.enabled = enabled;

    if (enabled) {
      const delay = params.delay !== undefined ? params.delay : 0.5;
      const feedback = params.feedback !== undefined ? params.feedback : 0.3;
      const mix = params.mix !== undefined ? params.mix : 0.5;

      this.echo.delay = delay;
      this.echo.feedback = feedback;
      this.echo.mix = mix;

      this.delayNode.delayTime.setValueAtTime(delay, this.ctx.currentTime);
      this.delayGainNode.gain.setValueAtTime(mix * feedback, this.ctx.currentTime);
    } else {
      this.delayGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  // Get analyser data for visualization
  getAnalyserData() {
    if (!this.analyserNode) return null;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  // Cleanup
  destroy() {
    if (!this.initialized) return;

    try {
      this.sourceNode.disconnect();
      this.gainNode.disconnect();
      this.panNode.disconnect();
      this.eqLowNode.disconnect();
      this.eqMidNode.disconnect();
      this.eqHighNode.disconnect();
      this.compressorNode.disconnect();
      this.delayNode.disconnect();
      this.delayGainNode.disconnect();
      this.reverbNode.disconnect();
      this.reverbGainNode.disconnect();
      this.analyserNode.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

    this.initialized = false;
  }
}

// Global audio effect chains (initialized on demand)
const audioChains = {
  main: null,
  bgAudio: null
};

// Initialize audio chain for a track
function initAudioChain(trackName) {
  let audioEl = null;

  if (trackName === 'main') {
    audioEl = document.getElementById('srcVideo');
  } else if (trackName === 'bgAudio') {
    audioEl = document.getElementById('bgAudio');
  }

  if (!audioEl) {
    console.warn(`Audio element not found for track: ${trackName}`);
    return null;
  }

  if (!audioChains[trackName]) {
    audioChains[trackName] = new AudioEffectChain(audioEl, trackName);
  }

  audioChains[trackName].initialize();
  return audioChains[trackName];
}

// Update audio effects from state
function updateAudioEffects(trackName) {
  const effects = state.audioEffects?.[trackName];
  if (!effects) return;

  const chain = audioChains[trackName];
  if (!chain || !chain.initialized) return;

  // Update volume and pan
  chain.setVolume(effects.volume);
  chain.setPan(effects.pan);

  // Update EQ
  chain.setEQ('low', effects.eq.low);
  chain.setEQ('mid', effects.eq.mid);
  chain.setEQ('high', effects.eq.high);

  // Update compressor
  if (effects.compressor.enabled) {
    chain.setCompressor({
      threshold: effects.compressor.threshold,
      ratio: effects.compressor.ratio,
      attack: effects.compressor.attack,
      release: effects.compressor.release
    });
  }

  // Update reverb
  chain.enableReverb(effects.reverb.enabled, effects.reverb.mix);

  // Update echo
  chain.enableEcho(effects.echo.enabled, {
    delay: effects.echo.delay,
    feedback: effects.echo.feedback,
    mix: effects.echo.mix
  });
}
