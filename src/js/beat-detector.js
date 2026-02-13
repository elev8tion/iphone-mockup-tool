// ============================================================
// BEAT DETECTOR — Real-time audio onset detection
// ============================================================
const beatDetector = {
  // Public properties (updated every frame)
  isBeat: false,
  beatIntensity: 0,
  energy: 0,
  kickBeat: false,
  snareBeat: false,
  hihatBeat: false,
  timeSinceLastBeat: 999,
  estimatedBPM: 120,

  // Internal state
  _lastBeatTime: 0,
  _kickAvg: 0,
  _snareAvg: 0,
  _hihatAvg: 0,
  _overallAvg: 0,
  _beatIntervals: [],
  _minBeatInterval: 0.2,
  _smoothing: 0.92,
  _kickThreshold: 1.4,
  _snareThreshold: 1.3,
  _hihatThreshold: 1.3,

  update: function(currentTime) {
    // Reset per-frame flags
    this.isBeat = false;
    this.kickBeat = false;
    this.snareBeat = false;
    this.hihatBeat = false;

    if (!audioAnalyser || !analyserData) return;

    audioAnalyser.getByteFrequencyData(analyserData);

    var binCount = analyserData.length;
    var sampleRate = sharedAudioCtx ? sharedAudioCtx.sampleRate : 48000;
    var binHz = (sampleRate / 2) / binCount;

    // Band boundaries
    var lowEnd = Math.min(binCount, Math.ceil(300 / binHz));
    var midEnd = Math.min(binCount, Math.ceil(2000 / binHz));

    var lowEnergy = 0, midEnergy = 0, highEnergy = 0, totalEnergy = 0;
    var lowCount = 0, midCount = 0, highCount = 0;

    for (var i = 0; i < binCount; i++) {
      var val = analyserData[i] / 255;
      totalEnergy += val;
      if (i < lowEnd) { lowEnergy += val; lowCount++; }
      else if (i < midEnd) { midEnergy += val; midCount++; }
      else { highEnergy += val; highCount++; }
    }

    // Average per band
    lowEnergy = lowCount > 0 ? lowEnergy / lowCount : 0;
    midEnergy = midCount > 0 ? midEnergy / midCount : 0;
    highEnergy = highCount > 0 ? highEnergy / highCount : 0;
    totalEnergy = binCount > 0 ? totalEnergy / binCount : 0;

    // Update exponential moving averages
    var s = this._smoothing;
    this._kickAvg = this._kickAvg * s + lowEnergy * (1 - s);
    this._snareAvg = this._snareAvg * s + midEnergy * (1 - s);
    this._hihatAvg = this._hihatAvg * s + highEnergy * (1 - s);
    this._overallAvg = this._overallAvg * s + totalEnergy * (1 - s);

    // Smoothed energy (0-1)
    this.energy = Math.min(1, this._overallAvg * 2);

    var now = currentTime || performance.now() * 0.001;
    var elapsed = now - this._lastBeatTime;

    // Per-band beat detection
    if (this._kickAvg > 0.01 && lowEnergy > this._kickAvg * this._kickThreshold) {
      this.kickBeat = true;
    }
    if (this._snareAvg > 0.01 && midEnergy > this._snareAvg * this._snareThreshold) {
      this.snareBeat = true;
    }
    if (this._hihatAvg > 0.01 && highEnergy > this._hihatAvg * this._hihatThreshold) {
      this.hihatBeat = true;
    }

    // Overall beat: kick or snare triggered + minimum interval respected
    if ((this.kickBeat || this.snareBeat) && elapsed >= this._minBeatInterval) {
      this.isBeat = true;
      var intensityRatio = this._overallAvg > 0.01 ? totalEnergy / this._overallAvg : 1;
      this.beatIntensity = Math.min(1, Math.max(0, (intensityRatio - 1) / 0.5));

      // Track beat intervals for BPM estimation
      if (elapsed < 2) {
        this._beatIntervals.push(elapsed);
        if (this._beatIntervals.length > 8) this._beatIntervals.shift();
      }
      this._lastBeatTime = now;

      // Estimate BPM from rolling average of intervals
      if (this._beatIntervals.length >= 2) {
        var sum = 0;
        for (var j = 0; j < this._beatIntervals.length; j++) sum += this._beatIntervals[j];
        var avgInterval = sum / this._beatIntervals.length;
        this.estimatedBPM = Math.max(60, Math.min(200, Math.round(60 / avgInterval)));
      }
    }

    this.timeSinceLastBeat = now - this._lastBeatTime;
  },

  // Reset detector state
  reset: function() {
    this.isBeat = false;
    this.beatIntensity = 0;
    this.energy = 0;
    this.kickBeat = false;
    this.snareBeat = false;
    this.hihatBeat = false;
    this.timeSinceLastBeat = 999;
    this.estimatedBPM = 120;
    this._lastBeatTime = 0;
    this._kickAvg = 0;
    this._snareAvg = 0;
    this._hihatAvg = 0;
    this._overallAvg = 0;
    this._beatIntervals = [];
  },

  // Adjust sensitivity
  setSensitivity: function(level) {
    // level: 'low' | 'medium' | 'high'
    switch (level) {
      case 'low':
        this._kickThreshold = 1.6;
        this._snareThreshold = 1.5;
        this._hihatThreshold = 1.5;
        break;
      case 'high':
        this._kickThreshold = 1.2;
        this._snareThreshold = 1.1;
        this._hihatThreshold = 1.1;
        break;
      default: // medium
        this._kickThreshold = 1.4;
        this._snareThreshold = 1.3;
        this._hihatThreshold = 1.3;
    }
  },

  // Get performance metrics
  getMetrics: function() {
    return {
      energy: this.energy.toFixed(2),
      bpm: this.estimatedBPM,
      timeSinceLastBeat: this.timeSinceLastBeat.toFixed(2),
      beatIntensity: this.beatIntensity.toFixed(2),
      intervalsTracked: this._beatIntervals.length,
      avgKick: this._kickAvg.toFixed(3),
      avgSnare: this._snareAvg.toFixed(3),
      avgHihat: this._hihatAvg.toFixed(3)
    };
  }
};

// Export beat detector methods
if (typeof window !== 'undefined') {
  window.resetBeatDetector = () => beatDetector.reset();
  window.setBeatSensitivity = (level) => beatDetector.setSensitivity(level);
  window.getBeatMetrics = () => beatDetector.getMetrics();
}

// ============================================================
