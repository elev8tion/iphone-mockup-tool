// VIDEO EFFECTS PROCESSOR
// ============================================================
// Professional video processing using CSS filters + WebGL shaders

class VideoEffectProcessor {
  constructor(trackName) {
    this.trackName = trackName;
    this.glCanvas = null;
    this.gl = null;
    this.shaders = {};
    this.initialized = false;
    this._activeBuffers = new Set();
    this._activeTextures = new Set();
    this._lastUsed = Date.now();
    this._frameCount = 0;
  }

  // Apply CSS filters (fast, GPU-accelerated)
  applyCSSFilters(videoElement, effects) {
    if (!videoElement) return;

    const filters = [];

    // Brightness (-100 to 100 → 0% to 200%)
    if (effects.brightness !== 0) {
      const val = 100 + effects.brightness;
      filters.push(`brightness(${val}%)`);
    }

    // Contrast (-100 to 100 → 0% to 200%)
    if (effects.contrast !== 0) {
      const val = 100 + effects.contrast;
      filters.push(`contrast(${val}%)`);
    }

    // Saturation (-100 to 100 → 0% to 200%)
    if (effects.saturation !== 0) {
      const val = 100 + effects.saturation;
      filters.push(`saturate(${val}%)`);
    }

    // Hue rotation (-180 to 180 degrees)
    if (effects.hue !== 0) {
      filters.push(`hue-rotate(${effects.hue}deg)`);
    }

    // Temperature (warm/cool tint using sepia + hue)
    if (effects.temperature !== 0) {
      const warmth = effects.temperature / 100;
      if (warmth > 0) {
        filters.push(`sepia(${warmth * 30}%)`);
        filters.push(`hue-rotate(${warmth * -10}deg)`);
      } else {
        filters.push(`hue-rotate(${warmth * 10}deg)`);
      }
    }

    // Apply filter stack from effects.filters array
    if (effects.filters && effects.filters.length > 0) {
      for (const filter of effects.filters) {
        switch (filter.type) {
          case 'blur':
            filters.push(`blur(${filter.amount || 5}px)`);
            break;
          case 'sharpen':
            // CSS doesn't support sharpen directly, handled by WebGL
            break;
          case 'grayscale':
            filters.push(`grayscale(100%)`);
            break;
          case 'sepia':
            filters.push(`sepia(${filter.amount || 100}%)`);
            break;
        }
      }
    }

    videoElement.style.filter = filters.length > 0 ? filters.join(' ') : '';
  }

  // Check if WebGL effects are needed (advanced filters)
  needsWebGL(effects) {
    if (!effects.filters) return false;

    const webglTypes = ['pixelate', 'edgedetect', 'posterize', 'solarize', 'sharpen'];
    return effects.filters.some(f => webglTypes.includes(f.type));
  }

  // Initialize WebGL context
  initWebGL() {
    if (this.initialized) return true;

    this.glCanvas = document.createElement('canvas');
    this.gl = this.glCanvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });

    if (!this.gl) {
      console.warn('WebGL not supported for video effects');
      return false;
    }

    // Compile shaders
    this.compileShaders();
    this.initialized = true;
    return true;
  }

  // Compile GLSL shaders
  compileShaders() {
    const gl = this.gl;

    // Vertex shader (same for all effects)
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Pixelate shader
    const pixelateFragmentSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_blockSize;
      varying vec2 v_texCoord;

      void main() {
        vec2 blocks = u_resolution / u_blockSize;
        vec2 coord = floor(v_texCoord * blocks) / blocks;
        gl_FragColor = texture2D(u_texture, coord);
      }
    `;

    // Edge detection shader (Sobel)
    const edgeDetectFragmentSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() {
        vec2 texel = 1.0 / u_resolution;

        // Sobel kernel
        float tl = texture2D(u_texture, v_texCoord + vec2(-texel.x, texel.y)).r;
        float t  = texture2D(u_texture, v_texCoord + vec2(0.0, texel.y)).r;
        float tr = texture2D(u_texture, v_texCoord + vec2(texel.x, texel.y)).r;
        float l  = texture2D(u_texture, v_texCoord + vec2(-texel.x, 0.0)).r;
        float r  = texture2D(u_texture, v_texCoord + vec2(texel.x, 0.0)).r;
        float bl = texture2D(u_texture, v_texCoord + vec2(-texel.x, -texel.y)).r;
        float b  = texture2D(u_texture, v_texCoord + vec2(0.0, -texel.y)).r;
        float br = texture2D(u_texture, v_texCoord + vec2(texel.x, -texel.y)).r;

        float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
        float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

        float edge = sqrt(gx*gx + gy*gy);
        gl_FragColor = vec4(vec3(edge), 1.0);
      }
    `;

    // Posterize shader
    const posterizeFragmentSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_levels;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        vec3 posterized = floor(color.rgb * u_levels) / u_levels;
        gl_FragColor = vec4(posterized, color.a);
      }
    `;

    // Compile and store shaders
    this.shaders.pixelate = this.createProgram(vertexShaderSource, pixelateFragmentSource);
    this.shaders.edgedetect = this.createProgram(vertexShaderSource, edgeDetectFragmentSource);
    this.shaders.posterize = this.createProgram(vertexShaderSource, posterizeFragmentSource);
  }

  // Create shader program
  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program link error:', gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  // Apply WebGL effects (advanced)
  applyWebGLEffects(sourceCanvas, effects) {
    if (!this.initWebGL()) return;

    this._lastUsed = Date.now();
    this._frameCount++;

    const gl = this.gl;
    const filters = effects.filters || [];

    // Setup canvas size
    if (this.glCanvas.width !== sourceCanvas.width || this.glCanvas.height !== sourceCanvas.height) {
      this.glCanvas.width = sourceCanvas.width;
      this.glCanvas.height = sourceCanvas.height;
      gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
    }

    // Create texture from source
    const texture = gl.createTexture();
    this._activeTextures.add(texture);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Setup geometry (full-screen quad)
    const positionBuffer = gl.createBuffer();
    this._activeBuffers.add(positionBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,  1, 1
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    this._activeBuffers.add(texCoordBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0
    ]), gl.STATIC_DRAW);

    // Apply each filter in sequence
    for (const filter of filters) {
      let program = null;

      switch (filter.type) {
        case 'pixelate':
          program = this.shaders.pixelate;
          if (program) {
            gl.useProgram(program);
            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.glCanvas.width, this.glCanvas.height);
            gl.uniform1f(gl.getUniformLocation(program, 'u_blockSize'), filter.blockSize || 10);
          }
          break;

        case 'edgedetect':
          program = this.shaders.edgedetect;
          if (program) {
            gl.useProgram(program);
            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.glCanvas.width, this.glCanvas.height);
          }
          break;

        case 'posterize':
          program = this.shaders.posterize;
          if (program) {
            gl.useProgram(program);
            gl.uniform1f(gl.getUniformLocation(program, 'u_levels'), filter.levels || 8);
          }
          break;
      }

      if (program) {
        // Bind attributes
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // Copy result back to source canvas
    const srcCtx = sourceCanvas.getContext('2d');
    srcCtx.drawImage(this.glCanvas, 0, 0);

    // Cleanup resources immediately
    if (texture) {
      gl.deleteTexture(texture);
      this._activeTextures.delete(texture);
    }
    if (positionBuffer) {
      gl.deleteBuffer(positionBuffer);
      this._activeBuffers.delete(positionBuffer);
    }
    if (texCoordBuffer) {
      gl.deleteBuffer(texCoordBuffer);
      this._activeBuffers.delete(texCoordBuffer);
    }

    // Periodic memory cleanup every 300 frames
    if (this._frameCount % 300 === 0) {
      this.cleanupUnusedResources();
    }
  }

  // Apply blend mode
  applyBlendMode(ctx, blendMode) {
    ctx.globalCompositeOperation = blendMode || 'normal';
  }

  // Clean up unused resources
  cleanupUnusedResources() {
    if (!this.gl) return;

    const gl = this.gl;

    // Clean up orphaned textures
    for (const texture of this._activeTextures) {
      if (texture && gl.isTexture(texture)) {
        gl.deleteTexture(texture);
      }
    }
    this._activeTextures.clear();

    // Clean up orphaned buffers
    for (const buffer of this._activeBuffers) {
      if (buffer && gl.isBuffer(buffer)) {
        gl.deleteBuffer(buffer);
      }
    }
    this._activeBuffers.clear();
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if (window.performance?.memory) {
      const memory = window.performance.memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);

      // Warn if using more than 100MB
      if (usedMB > 100) {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
        this.cleanupUnusedResources();
      }

      // Force cleanup if using more than 70% of available memory
      if (usedMB > limitMB * 0.7) {
        console.warn('Critical memory usage - forcing cleanup');
        this.destroy();
        this.initialized = false;
      }
    }
  }

  // Check if processor is stale (not used in 30 seconds)
  isStale() {
    return Date.now() - this._lastUsed > 30000;
  }

  // Cleanup
  destroy() {
    if (this.gl) {
      const gl = this.gl;

      // Clean up shaders
      for (const key in this.shaders) {
        if (this.shaders[key] && gl.isProgram(this.shaders[key])) {
          gl.deleteProgram(this.shaders[key]);
        }
      }
      this.shaders = {};

      // Clean up remaining resources
      this.cleanupUnusedResources();

      // Force WebGL context loss to free GPU memory
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
    }

    this.glCanvas = null;
    this.gl = null;
    this.initialized = false;
    this._frameCount = 0;
  }
}

// Global video effect processors
const videoProcessors = {
  main: new VideoEffectProcessor('main'),
  bgVideo: new VideoEffectProcessor('bgVideo')
};

// ============================================================
// MEMORY MANAGEMENT
// ============================================================

// Monitor memory usage every 5 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    for (const key in videoProcessors) {
      const processor = videoProcessors[key];
      if (processor.initialized) {
        processor.monitorMemoryUsage();

        // Clean up stale processors
        if (processor.isStale()) {
          console.log(`Cleaning up stale video processor: ${key}`);
          processor.destroy();
        }
      }
    }
  }, 5000);
}

// Cleanup all processors on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    for (const key in videoProcessors) {
      videoProcessors[key].destroy();
    }
  });

  // Also cleanup on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const key in videoProcessors) {
        const processor = videoProcessors[key];
        if (processor.initialized && processor.isStale()) {
          processor.cleanupUnusedResources();
        }
      }
    }
  });
}

// Export cleanup function for manual use
window.cleanupVideoProcessors = () => {
  for (const key in videoProcessors) {
    videoProcessors[key].destroy();
  }
  console.log('All video processors cleaned up');
};
