/**
 * Aurora Background Effect
 * Localized version for multiple canvases
 */

;(function () {
  'use strict'

  const canvasElements = document.querySelectorAll('.aurora-canvas')
  if (canvasElements.length === 0) return

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const saveData = navigator.connection?.saveData === true
  const lowCpu =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 2
  const lowMemory =
    typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2
  const shouldUseStaticAurora =
    prefersReducedMotion || saveData || lowCpu || lowMemory

  const getCanvasColors = (canvas) => {
    const dataColors = canvas.getAttribute('data-colors')
    const colors = dataColors
      ? dataColors
          .split(',')
          .map((color) => color.trim())
          .filter(Boolean)
      : ['#3c50e0', '#10b981', '#8b5cf6']

    return colors.length >= 2 ? colors : ['#3c50e0', '#10b981', '#8b5cf6']
  }

  const applyCanvasFallback = (canvas, { animated = true } = {}) => {
    const gradient = `linear-gradient(135deg, ${getCanvasColors(canvas).join(', ')})`
    canvas.style.backgroundImage = gradient
    canvas.classList.add('aurora-fallback', 'is-ready')
    canvas.classList.toggle('aurora-static', !animated)
  }

  const getStaticAuroraHeight = () =>
    window.innerWidth <= 768 ? '320px' : '420px'

  const applyStaticAuroraHeightLimit = (canvas, height) => {
    const wrapper = canvas.closest('.aurora-wrapper')
    if (!wrapper) return
    wrapper.style.height = height
  }

  if (shouldUseStaticAurora) {
    const applyStaticMode = () => {
      const staticHeight = getStaticAuroraHeight()
      canvasElements.forEach((canvas) => {
        applyCanvasFallback(canvas, { animated: false })
        applyStaticAuroraHeightLimit(canvas, staticHeight)
      })
    }

    applyStaticMode()
    window.addEventListener('resize', applyStaticMode, { passive: true })
    return
  }

  // Configuration
  const getScale = () => (window.innerWidth <= 768 ? 0.8 : 1.0)
  const getAmplitude = () => (window.innerWidth <= 768 ? 2 : 1.2)
  const getSpeed = () => (window.innerWidth <= 768 ? 2 : 0.8)

  const config = {
    colorStops: [
      [0.235, 0.314, 0.878], // #3c50e0 - Deep Blue
      [0.063, 0.725, 0.506], // #10b981 - Emerald
      [0.545, 0.361, 0.965], // #8b5cf6 - Purple
    ],
    amplitude: getAmplitude(),
    blend: 0.6,
    speed: getSpeed(),
    scale: getScale(),
  }

  // Vertex Shaders
  const vertexShaderSourceWebGL2 = `#version 300 es
        in vec2 position;
        out vec2 vUv;
        void main() {
            // Map position [-1, 1] to [0, 1]
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `

  const vertexShaderSourceWebGL1 = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `

  // Fragment Shaders - Aurora Effect
  const fragmentShaderSourceWebGL2 = `#version 300 es
        precision highp float;

        in vec2 vUv;
        uniform float uTime;
        uniform float uAmplitude;
        uniform vec3 uColorStops[3];
        uniform float uBlend;
        uniform float uScale;

        out vec4 fragColor;

        // Simplex noise functions
        vec3 permute(vec3 x) {
            return mod(((x * 34.0) + 1.0) * x, 289.0);
        }

        float snoise(vec2 v) {
            const vec4 C = vec4(
                0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439
            );
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);

            vec3 p = permute(
                permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0)
            );

            vec3 m = max(
                0.5 - vec3(
                    dot(x0, x0),
                    dot(x12.xy, x12.xy),
                    dot(x12.zw, x12.zw)
                ),
                0.0
            );
            m = m * m;
            m = m * m;

            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        // Color ramp interpolation
        vec3 colorRamp(float t) {
            if (t < 0.5) {
                return mix(uColorStops[0], uColorStops[1], t * 2.0);
            } else {
                return mix(uColorStops[1], uColorStops[2], (t - 0.5) * 2.0);
            }
        }

        void main() {
            vec2 uv = vUv;
            vec2 noiseUv = vUv * uScale;
            
            // Create flowing aurora effect
            float time = uTime * 0.25;
            
            float noise1 = snoise(vec2(noiseUv.x * 2.5 + time * 0.8, noiseUv.y * 2.0 - time * 0.5));
            float noise2 = snoise(vec2(noiseUv.x * 4.0 - time * 0.6, noiseUv.y * 3.0 + time * 0.4)) * 0.5;
            float noise3 = snoise(vec2(noiseUv.x * 1.8 + time * 0.3, noiseUv.y * 4.0 - time * 0.6)) * 0.25;
            
            float combinedNoise = noise1 + noise2 + noise3;
            
            // Create aurora "curtains" effect
            float curtain = sin(noiseUv.x * 6.0 + combinedNoise * 2.0 + time * 1.2) * 0.5 + 0.5;
            
            // Vertical fade for a band-like effect
            float mask = smoothstep(0.0, 0.45, uv.y) * smoothstep(1.0, 0.55, uv.y);
            
            // Intensity
            float height = combinedNoise * 0.8 * uAmplitude;
            height = exp(height);
            height = (uv.y * 2.8 - height + 0.6);
            float intensity = 0.7 * height * mask;
            
            // Color
            vec3 rampColor = colorRamp(uv.x * 0.5 + combinedNoise * 0.1);
            rampColor = mix(rampColor, rampColor * 1.3, curtain * 0.3);
            
            float auroraAlpha = smoothstep(
                0.1 - uBlend * 0.5,
                0.2 + uBlend * 0.5,
                intensity
            );
            
            vec3 auroraColor = intensity * rampColor * 2.0;
            
            fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha * 0.85);
        }
    `

  const fragmentShaderSourceWebGL1 = `
        precision highp float;

        varying vec2 vUv;
        uniform float uTime;
        uniform float uAmplitude;
        uniform vec3 uColorStops[3];
        uniform float uBlend;
        uniform float uScale;

        // Simplex noise functions
        vec3 permute(vec3 x) {
            return mod(((x * 34.0) + 1.0) * x, 289.0);
        }

        float snoise(vec2 v) {
            const vec4 C = vec4(
                0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439
            );
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);

            vec3 p = permute(
                permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0)
            );

            vec3 m = max(
                0.5 - vec3(
                    dot(x0, x0),
                    dot(x12.xy, x12.xy),
                    dot(x12.zw, x12.zw)
                ),
                0.0
            );
            m = m * m;
            m = m * m;

            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        // Color ramp interpolation
        vec3 colorRamp(float t) {
            if (t < 0.5) {
                return mix(uColorStops[0], uColorStops[1], t * 2.0);
            } else {
                return mix(uColorStops[1], uColorStops[2], (t - 0.5) * 2.0);
            }
        }

        void main() {
            vec2 uv = vUv;
            vec2 noiseUv = vUv * uScale;
            
            // Create flowing aurora effect
            float time = uTime * 0.25;
            
            float noise1 = snoise(vec2(noiseUv.x * 2.5 + time * 0.8, noiseUv.y * 2.0 - time * 0.5));
            float noise2 = snoise(vec2(noiseUv.x * 4.0 - time * 0.6, noiseUv.y * 3.0 + time * 0.4)) * 0.5;
            float noise3 = snoise(vec2(noiseUv.x * 1.8 + time * 0.3, noiseUv.y * 4.0 - time * 0.6)) * 0.25;
            
            float combinedNoise = noise1 + noise2 + noise3;
            
            // Create aurora "curtains" effect
            float curtain = sin(noiseUv.x * 6.0 + combinedNoise * 2.0 + time * 1.2) * 0.5 + 0.5;
            
            // Vertical fade for a band-like effect
            float mask = smoothstep(0.0, 0.45, uv.y) * smoothstep(1.0, 0.55, uv.y);
            
            // Intensity
            float height = combinedNoise * 0.8 * uAmplitude;
            height = exp(height);
            height = (uv.y * 2.8 - height + 0.6);
            float intensity = 0.7 * height * mask;
            
            // Color
            vec3 rampColor = colorRamp(uv.x * 0.5 + combinedNoise * 0.1);
            rampColor = mix(rampColor, rampColor * 1.3, curtain * 0.3);
            
            float auroraAlpha = smoothstep(
                0.1 - uBlend * 0.5,
                0.2 + uBlend * 0.5,
                intensity
            );
            
            vec3 auroraColor = intensity * rampColor * 2.0;
            
            gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha * 0.85);
        }
    `

  class AuroraInstance {
    constructor(canvas) {
      this.canvas = canvas
      this.gl = null
      this.program = null
      this.positionBuffer = null
      this.contextType = null
      this.isContextLost = false
      this.initContext()
      if (!this.gl) {
        this.applyFallback()
        return
      }

      // Add random offset so animations across blocks are not synchronized
      this.timeOffset = Math.random() * 1000
      this.updateSpeedFromAttr()
      this.init()
      this.isActive = false
      this.contextEventOptions = { passive: false }
      this.handleContextLost = this.handleContextLost.bind(this)
      this.handleContextRestored = this.handleContextRestored.bind(this)

      this.canvas.addEventListener(
        'webglcontextlost',
        this.handleContextLost,
        this.contextEventOptions,
      )
      this.canvas.addEventListener(
        'webglcontextrestored',
        this.handleContextRestored,
      )
    }

    initContext() {
      this.gl = this.canvas.getContext('webgl2', { alpha: true })
      this.isWebgl2 = Boolean(this.gl)
      if (!this.gl) {
        this.gl = this.canvas.getContext('webgl', { alpha: true })
      }
      this.contextType = this.gl ? (this.isWebgl2 ? 'webgl2' : 'webgl') : null
    }

    applyFallback() {
      applyCanvasFallback(this.canvas)
    }

    init() {
      const gl = this.gl
      if (!gl) return
      this.updateSpeedFromAttr()
      this.canvas.classList.remove('aurora-fallback')
      this.canvas.style.backgroundImage = ''
      this.program = this.createProgram(
        this.isWebgl2 ? vertexShaderSourceWebGL2 : vertexShaderSourceWebGL1,
        this.isWebgl2 ? fragmentShaderSourceWebGL2 : fragmentShaderSourceWebGL1,
      )
      if (!this.program) {
        this.gl = null
        this.applyFallback()
        return
      }

      gl.useProgram(this.program)

      const positions = new Float32Array([-1, -1, 3, -1, -1, 3])
      const buffer = gl.createBuffer()
      if (!buffer) {
        if (this.program) {
          gl.deleteProgram(this.program)
          this.program = null
        }
        this.gl = null
        this.applyFallback()
        return
      }
      this.positionBuffer = buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

      const posLoc = gl.getAttribLocation(this.program, 'position')
      if (posLoc < 0) {
        gl.deleteBuffer(buffer)
        this.positionBuffer = null
        if (this.program) {
          gl.deleteProgram(this.program)
          this.program = null
        }
        this.gl = null
        this.applyFallback()
        return
      }
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      this.uniforms = {
        time: gl.getUniformLocation(this.program, 'uTime'),
        amplitude: gl.getUniformLocation(this.program, 'uAmplitude'),
        colorStops: gl.getUniformLocation(this.program, 'uColorStops'),
        blend: gl.getUniformLocation(this.program, 'uBlend'),
        scale: gl.getUniformLocation(this.program, 'uScale'),
      }

      gl.uniform1f(this.uniforms.amplitude, config.amplitude)
      gl.uniform1f(this.uniforms.blend, config.blend)
      gl.uniform1f(this.uniforms.scale, config.scale)
      this.updateColorsFromAttr()

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      this.resize()
    }

    hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      return [r, g, b]
    }

    createProgram(vs, fs) {
      const gl = this.gl
      const vertexShader = this.compileShader(vs, gl.VERTEX_SHADER)
      const fragmentShader = this.compileShader(fs, gl.FRAGMENT_SHADER)
      if (!vertexShader || !fragmentShader) return null

      const program = gl.createProgram()
      if (!program) return null
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program)
        return null
      }
      return program
    }

    compileShader(source, type) {
      const shader = this.gl.createShader(type)
      if (!shader) return null
      this.gl.shaderSource(shader, source)
      this.gl.compileShader(shader)
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        this.gl.deleteShader(shader)
        return null
      }
      return shader
    }

    handleContextLost(event) {
      event.preventDefault()
      this.isContextLost = true
      this.isActive = false
    }

    handleContextRestored() {
      this.isContextLost = false
      this.hasRendered = false
      this.initContext()
      if (!this.gl) return
      this.init()
    }

    resize() {
      if (!this.gl) return
      const isSmallViewport = window.innerWidth <= 1280
      const dprCap = isSmallViewport ? 0.85 : 1
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      const rect = this.canvas.parentElement.getBoundingClientRect()
      const maxWidth = isSmallViewport ? 640 : 800
      const maxHeight = isSmallViewport ? 320 : 380
      const nextWidth = Math.max(
        1,
        Math.min(maxWidth, Math.floor(rect.width * dpr)),
      )
      const nextHeight = Math.max(
        1,
        Math.min(maxHeight, Math.floor(rect.height * dpr)),
      )
      if (
        this.canvas.width === nextWidth &&
        this.canvas.height === nextHeight
      ) {
        return
      }
      this.canvas.width = nextWidth
      this.canvas.height = nextHeight
      this.gl.viewport(0, 0, nextWidth, nextHeight)
    }

    setScale(scale) {
      if (!this.gl) return
      if (this.scale === scale) return
      this.scale = scale
      this.gl.uniform1f(this.uniforms.scale, scale)
    }

    updateColorsFromAttr() {
      if (!this.gl) return
      const dataColors = this.canvas.getAttribute('data-colors')
      let instanceColors = config.colorStops
      if (dataColors) {
        const hexColors = dataColors.split(',')
        instanceColors = hexColors.map((hex) => this.hexToRgb(hex.trim()))
      }
      this.colors = instanceColors
      this.gl.uniform3fv(this.uniforms.colorStops, instanceColors.flat())
    }

    updateSpeedFromAttr() {
      const dataSpeed = this.canvas.getAttribute('data-speed')
      const parsedSpeed = Number.parseFloat(dataSpeed)
      this.speedMultiplier =
        Number.isFinite(parsedSpeed) && parsedSpeed > 0 ? parsedSpeed : 1
    }

    render(time) {
      if (!this.isActive || !this.gl || this.isContextLost) return
      const gl = this.gl
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(this.program)
      // Add random offset to desynchronize blocks
      gl.uniform1f(
        this.uniforms.time,
        time * this.speedMultiplier + this.timeOffset,
      )
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (!this.hasRendered) {
        this.canvas.classList.add('is-ready')
        this.hasRendered = true
      }
    }

    clear() {
      if (!this.gl) return
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    }

    destroy() {
      this.isActive = false
      if (this.canvas && this.handleContextLost && this.handleContextRestored) {
        this.canvas.removeEventListener(
          'webglcontextlost',
          this.handleContextLost,
          this.contextEventOptions,
        )
        this.canvas.removeEventListener(
          'webglcontextrestored',
          this.handleContextRestored,
        )
      }
      if (this.gl) {
        this.gl.useProgram(null)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
        if (this.positionBuffer) {
          this.gl.deleteBuffer(this.positionBuffer)
        }
        if (this.program) {
          this.gl.deleteProgram(this.program)
        }
      }
      this.gl = null
      this.program = null
      this.positionBuffer = null
      this.uniforms = null
      this.hasRendered = false
    }
  }

  const auroraEntries = []
  const sectionToIndexes = new Map()

  canvasElements.forEach((canvas) => {
    const section = canvas.closest('section') || canvas.parentElement
    const mountParent = canvas.parentNode
    if (!section || !mountParent) return
    const canvasTemplate = canvas.cloneNode(false)
    canvasTemplate.classList.remove('is-ready', 'aurora-fallback')
    const index = auroraEntries.length
    auroraEntries.push({
      index,
      section,
      canvas,
      canvasTemplate,
      mountParent,
      mountNextSibling: canvas.nextSibling,
    })
    const sectionIndexes = sectionToIndexes.get(section)
    if (sectionIndexes) {
      sectionIndexes.push(index)
    } else {
      sectionToIndexes.set(section, [index])
    }
  })

  if (auroraEntries.length === 0) return

  function mountCanvas(entry) {
    if (entry.canvas && entry.canvas.isConnected) return entry.canvas
    const canvas = entry.canvasTemplate.cloneNode(false)
    const anchor =
      entry.mountNextSibling &&
      entry.mountNextSibling.parentNode === entry.mountParent
        ? entry.mountNextSibling
        : null
    entry.mountParent.insertBefore(canvas, anchor)
    entry.canvas = canvas
    return canvas
  }

  function unmountCanvas(entry) {
    if (!entry.canvas) return
    if (entry.canvas.parentNode) {
      entry.canvas.parentNode.removeChild(entry.canvas)
    }
    entry.canvas = null
  }

  // Start with no mounted canvases; active range will mount and initialize them on demand.
  auroraEntries.forEach((entry) => unmountCanvas(entry))

  const indexToEntry = new Map(
    auroraEntries.map((entry) => [entry.index, entry]),
  )

  const activeInstances = new Map()
  const currentlyVisible = new Set()
  const ROOT_MARGIN = 200

  let rafId = 0
  let resizeRaf = 0
  let lastFrameTime = 0
  let lastViewportWidth = window.innerWidth
  let isVisible = !document.hidden
  const targetFrameMs = window.innerWidth <= 1600 ? 33 : 22

  const intersectionObserver = new IntersectionObserver(handleIntersection, {
    threshold: 0.01,
    rootMargin: `${ROOT_MARGIN}px 0px`,
  })
  const observedSections = new Set()
  auroraEntries.forEach((entry) => {
    if (observedSections.has(entry.section)) return
    intersectionObserver.observe(entry.section)
    observedSections.add(entry.section)
  })

  handleIntersection(intersectionObserver.takeRecords())
  if (!currentlyVisible.size) {
    const initialVisible = gatherVisibleIndices()
    initialVisible.forEach((idx) => currentlyVisible.add(idx))
    syncActiveInstances(new Set(currentlyVisible))
  }

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden
    if (!isVisible) {
      stopAnimation()
      return
    }
    if (activeInstances.size) {
      startAnimation()
    }
  })

  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth
    if (currentWidth === lastViewportWidth) return
    lastViewportWidth = currentWidth
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() =>
      activeInstances.forEach(({ instance }) => {
        instance.resize()
        instance.setScale(getScale())
      }),
    )
  })

  function handleIntersection(entries) {
    if (!entries.length) return
    let hasChange = false
    entries.forEach((entry) => {
      const indexes = sectionToIndexes.get(entry.target)
      if (!indexes) return
      indexes.forEach((idx) => {
        if (entry.isIntersecting) {
          if (!currentlyVisible.has(idx)) {
            currentlyVisible.add(idx)
            hasChange = true
          }
        } else if (currentlyVisible.delete(idx)) {
          hasChange = true
        }
      })
    })
    if (hasChange) {
      syncActiveInstances(new Set(currentlyVisible))
    }
  }

  function gatherVisibleIndices() {
    const visible = new Set()
    const upper = window.innerHeight + ROOT_MARGIN
    const lower = -ROOT_MARGIN
    auroraEntries.forEach((entry) => {
      const rect = entry.section.getBoundingClientRect()
      if (rect.bottom >= lower && rect.top <= upper) {
        visible.add(entry.index)
      }
    })
    return visible
  }

  function buildDesiredSet(indices) {
    return new Set(indices)
  }

  function syncActiveInstances(baseIndices) {
    const desired = buildDesiredSet(baseIndices)
    const clamped = new Set(
      [...desired].filter((idx) => idx >= 0 && idx < auroraEntries.length),
    )
    Array.from(activeInstances.keys()).forEach((activeIndex) => {
      if (!clamped.has(activeIndex)) {
        destroyActiveInstance(activeIndex)
      }
    })
    clamped.forEach((index) => {
      if (!activeInstances.has(index)) {
        createActiveInstanceForIndex(index)
      }
    })
    if (clamped.size && isVisible) {
      startAnimation()
    } else {
      stopAnimation()
    }
  }

  function createActiveInstanceForIndex(index) {
    const entry = indexToEntry.get(index)
    if (!entry) return
    const canvas = mountCanvas(entry)
    const instance = new AuroraInstance(canvas)
    if (!instance.gl) {
      activeInstances.set(index, { entry, instance, attributeObserver: null })
      return
    }
    instance.isActive = true
    instance.resize()
    instance.setScale(getScale())
    const observer = new MutationObserver((mutations) => {
      const record = activeInstances.get(index)
      if (!record) return
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-speed') {
          record.instance.updateSpeedFromAttr()
        } else {
          record.instance.updateColorsFromAttr()
        }
      })
    })
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['data-colors', 'data-speed'],
    })
    activeInstances.set(index, { entry, instance, attributeObserver: observer })
  }

  function destroyActiveInstance(index) {
    const record = activeInstances.get(index)
    if (!record) return
    record.attributeObserver?.disconnect()
    record.instance.destroy()
    unmountCanvas(record.entry)
    activeInstances.delete(index)
  }

  function startAnimation() {
    if (rafId) return
    lastFrameTime = 0
    rafId = requestAnimationFrame(animate)
  }

  function stopAnimation() {
    if (!rafId) return
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  function animate(currentTime) {
    if (!isVisible) {
      stopAnimation()
      return
    }
    if (!activeInstances.size) {
      stopAnimation()
      return
    }
    if (lastFrameTime && currentTime - lastFrameTime < targetFrameMs) {
      rafId = requestAnimationFrame(animate)
      return
    }
    lastFrameTime = currentTime
    const time = currentTime * 0.001 * config.speed
    activeInstances.forEach(({ instance }) => instance.render(time))
    rafId = requestAnimationFrame(animate)
  }
})()
