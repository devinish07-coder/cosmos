/**
 * COSMOS ODYSSEY - Interactive Engine
 * Replicating and elevating the Framer interstellar experience
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. STARFIELD BACKGROUND ENGINE
  // ==========================================================================
  const starfieldCanvas = document.getElementById('starfield-canvas');
  const ctx = starfieldCanvas ? starfieldCanvas.getContext('2d') : null;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let mouseX = width / 2;
  let mouseY = height / 2;
  let targetMouseX = mouseX;
  let targetMouseY = mouseY;

  const STARS_COUNT = 160;
  const stars = [];

  function initStarfield() {
    if (!starfieldCanvas || !ctx) return;
    resizeStarfield();

    stars.length = 0;
    for (let i = 0; i < STARS_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.8 ? '#66e8ff' : (Math.random() > 0.7 ? '#9866ff' : '#edf4ff')
      });
    }
  }

  function resizeStarfield() {
    if (!starfieldCanvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    starfieldCanvas.width = width * window.devicePixelRatio;
    starfieldCanvas.height = height * window.devicePixelRatio;
    starfieldCanvas.style.width = width + 'px';
    starfieldCanvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener('resize', resizeStarfield);

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  function renderStarfield(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    const offsetX = (mouseX - width / 2);
    const offsetY = (mouseY - height / 2);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const alpha = s.baseAlpha + Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.25;
      const x = (s.x + offsetX * s.parallaxSpeed + width) % width;
      const y = (s.y + offsetY * s.parallaxSpeed + height) % height;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.05, Math.min(1, alpha));
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.radius > 1.2 ? 6 : 0;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderStarfield);
  }

  // ==========================================================================
  // 2. WEBGL GRAVITATIONAL MESH SHADER (Exact Framer GLSL Implementation)
  // ==========================================================================
  const meshCanvas = document.getElementById('mesh-canvas');
  let gl = null;
  let meshProgram = null;
  let meshUniforms = {};
  let startTime = performance.now();

  const meshVS = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // Extracted directly from Framer source with PCG hash
  const meshFS = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_speed;
    uniform float u_amplitude;
    uniform float u_tilt;
    uniform float u_zoom;
    uniform float u_cameraHeight;
    uniform float u_lightIntensity;
    uniform float u_lineWidth;
    uniform float u_lineBlur;
    uniform vec4 u_lineColor;
    uniform vec4 u_backgroundColor;
    uniform float u_seed;

    uvec3 hash3(uvec3 v) {
        v = v * 1664525u + 1013904223u;
        v.x += v.y * v.z;
        v.y += v.z * v.x;
        v.z += v.x * v.y;
        v ^= v >> 16u;
        v.x += v.y * v.z;
        v.y += v.z * v.x;
        v.z += v.x * v.y;
        return v;
    }

    vec3 seedRandom(float seedVal) {
        uvec3 s = uvec3(
            floatBitsToUint(seedVal),
            floatBitsToUint(seedVal * 1.5 + 7.31),
            floatBitsToUint(seedVal * 2.7 + 13.37)
        );
        s = hash3(s);
        return vec3(s) / float(0xFFFFFFFFu);
    }

    void main() {
        vec2 r = u_resolution;
        vec2 I = gl_FragCoord.xy;
        float t = u_time * u_speed;
        vec3 w, p;
        vec4 o = vec4(0.0);

        vec3 seedA = seedRandom(u_seed);
        vec3 seedB = seedRandom(u_seed + 100.0);

        float seedAngle = seedA.x * 6.2831;
        mat2 seedRot = mat2(cos(seedAngle), -sin(seedAngle), sin(seedAngle), cos(seedAngle));
        vec3 seedPhase = seedB * 6.2831;

        float a = radians(u_tilt);
        mat3 rot = mat3(
            1.0, 0.0, 0.0,
            0.0, cos(a), sin(a),
            0.0, -sin(a), cos(a)
        );

        float z = 0.0;
        float d = 0.1;
        vec4 offset = vec4(0.0);

        for (float i = 0.0; i < 24.0; i++) {
            vec3 rd = (vec3(I, 0.0) * 2.0 - r.xyy) / r.y * u_zoom;
            p = z * (rot * rd) + vec3(1.0, u_cameraHeight, 1.0);
            w = p;

            vec3 nw = w;
            nw.xz = seedRot * nw.xz;

            float f;
            for (f = 2.0; f <= 3.0; f++)
                nw += sin(nw.zxy * f + t + seedPhase) / f;

            w = mix(p, nw, 1.0);

            d = 0.1 * (p.y + 3.0);
            z += d;

            vec4 surface = mix(p, w, u_amplitude).y + offset;
            vec4 fw = max(fwidth(surface), 0.0001);
            vec4 pixelDist = abs(surface) / fw;
            float lw = u_lineWidth * 1.0;
            vec4 acc = smoothstep(lw + u_lineBlur, lw, pixelDist) * u_lightIntensity * d;
            o += acc;
        }

        vec4 raw = tanh(o);
        gl_FragColor = vec4(raw.rgb * u_lineColor.rgb, raw.a * u_lineColor.a);
    }
  `;

  function initMeshShader() {
    if (!meshCanvas) return;
    try {
      gl = meshCanvas.getContext('webgl', { alpha: true, antialias: true });
      if (!gl) return;

      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, meshVS);
      gl.compileShader(vs);

      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, meshFS);
      gl.compileShader(fs);

      meshProgram = gl.createProgram();
      gl.attachShader(meshProgram, vs);
      gl.attachShader(meshProgram, fs);
      gl.linkProgram(meshProgram);

      if (!gl.getProgramParameter(meshProgram, gl.LINK_STATUS)) {
        console.warn('Mesh shader link failed, falling back gracefully');
        gl = null;
        return;
      }

      // Full screen quad
      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1
      ]), gl.STATIC_DRAW);

      const posAttr = gl.getAttribLocation(meshProgram, 'position');
      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

      // Uniforms
      meshUniforms = {
        u_resolution: gl.getUniformLocation(meshProgram, 'u_resolution'),
        u_time: gl.getUniformLocation(meshProgram, 'u_time'),
        u_speed: gl.getUniformLocation(meshProgram, 'u_speed'),
        u_amplitude: gl.getUniformLocation(meshProgram, 'u_amplitude'),
        u_tilt: gl.getUniformLocation(meshProgram, 'u_tilt'),
        u_zoom: gl.getUniformLocation(meshProgram, 'u_zoom'),
        u_cameraHeight: gl.getUniformLocation(meshProgram, 'u_cameraHeight'),
        u_lightIntensity: gl.getUniformLocation(meshProgram, 'u_lightIntensity'),
        u_lineWidth: gl.getUniformLocation(meshProgram, 'u_lineWidth'),
        u_lineBlur: gl.getUniformLocation(meshProgram, 'u_lineBlur'),
        u_lineColor: gl.getUniformLocation(meshProgram, 'u_lineColor'),
        u_seed: gl.getUniformLocation(meshProgram, 'u_seed')
      };

      resizeMeshCanvas();
      renderMeshShader();
    } catch (e) {
      console.warn('WebGL init error:', e);
      gl = null;
    }
  }

  function resizeMeshCanvas() {
    if (!meshCanvas || !gl) return;
    const rect = meshCanvas.getBoundingClientRect();
    meshCanvas.width = rect.width;
    meshCanvas.height = rect.height;
    gl.viewport(0, 0, meshCanvas.width, meshCanvas.height);
  }

  window.addEventListener('resize', resizeMeshCanvas);

  function renderMeshShader() {
    if (!gl || !meshProgram) return;

    const time = (performance.now() - startTime) * 0.001;
    gl.useProgram(meshProgram);

    gl.uniform2f(meshUniforms.u_resolution, meshCanvas.width, meshCanvas.height);
    gl.uniform1f(meshUniforms.u_time, time);
    gl.uniform1f(meshUniforms.u_speed, 0.45);
    gl.uniform1f(meshUniforms.u_amplitude, 0.2);
    gl.uniform1f(meshUniforms.u_tilt, -32.0);
    gl.uniform1f(meshUniforms.u_zoom, 0.35);
    gl.uniform1f(meshUniforms.u_cameraHeight, 2.0);
    gl.uniform1f(meshUniforms.u_lightIntensity, 2.8);
    gl.uniform1f(meshUniforms.u_lineWidth, 0.1);
    gl.uniform1f(meshUniforms.u_lineBlur, 2.0);
    // Cyan to Purple cosmic gradient
    gl.uniform4f(meshUniforms.u_lineColor, 0.4, 0.91, 1.0, 0.85);
    gl.uniform1f(meshUniforms.u_seed, 200.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(renderMeshShader);
  }

  // ==========================================================================
  // 3. INTERACTIVE ASTEROID STAGE & RIPPLE SIMULATION
  // ==========================================================================
  const asteroidStage = document.getElementById('asteroid-stage');
  const asteroidImg = document.getElementById('asteroid-img');
  let asteroidTiltX = 0;
  let asteroidTiltY = 0;

  if (asteroidStage && asteroidImg) {
    asteroidStage.addEventListener('mousemove', (e) => {
      const rect = asteroidStage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      asteroidTiltX = -dy * 15;
      asteroidTiltY = dx * 15;

      asteroidImg.style.transform = `perspective(800px) rotateX(${asteroidTiltX}deg) rotateY(${asteroidTiltY}deg) scale(1.05)`;
    });

    asteroidStage.addEventListener('mouseleave', () => {
      asteroidImg.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)`;
    });

    // Ripple click shockwave effect
    asteroidStage.addEventListener('click', (e) => {
      const rect = asteroidStage.getBoundingClientRect();
      const ripple = document.createElement('div');
      ripple.className = 'asteroid-click-ripple';
      const size = 150;
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.border = '2px solid rgba(102, 232, 255, 0.8)';
      ripple.style.boxShadow = '0 0 20px rgba(102, 232, 255, 0.6)';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'rippleExpand 0.8s ease-out forwards';
      asteroidStage.appendChild(ripple);
      setTimeout(() => ripple.remove(), 800);
    });
  }

  // ==========================================================================
  // 4. MULTI-LAYER 3D ASTRONAUT PARALLAX ENGINE
  // ==========================================================================
  const astronautRig = document.getElementById('astronaut-parallax-rig');
  const astronautContainer = document.getElementById('astronaut-container');
  const astronautImg = document.getElementById('astronaut-img');
  const astronautAura = document.getElementById('astronaut-aura');
  const heroText = document.getElementById('hero-text');
  const dustDeepList = document.querySelectorAll('.dust-deep');
  const dustMidList = document.querySelectorAll('.dust-mid');
  const dustNearList = document.querySelectorAll('.dust-near');

  let mouseNormX = 0;
  let mouseNormY = 0;
  let targetMouseNormX = 0;
  let targetMouseNormY = 0;
  let warpBoost = 0;

  window.addEventListener('mousemove', (e) => {
    // Normalized offset from screen center (-1 to +1)
    targetMouseNormX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    targetMouseNormY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  });

  window.addEventListener('mouseleave', () => {
    targetMouseNormX = 0;
    targetMouseNormY = 0;
  });

  function animateAstronautParallax(timestamp) {
    // Smooth spring lerp for cursor physics
    mouseNormX += (targetMouseNormX - mouseNormX) * 0.06;
    mouseNormY += (targetMouseNormY - mouseNormY) * 0.06;

    // Warp boost impulse decay
    warpBoost *= 0.92;

    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    const heroProgress = Math.min(1.2, Math.max(0, scrollY / windowH));

    // Zero-G harmonic micro-oscillations (idle float)
    const floatY = Math.sin(timestamp * 0.0012) * 14;
    const floatRotate = Math.cos(timestamp * 0.0009) * 2.5;
    const floatX = Math.sin(timestamp * 0.0007) * 6;

    // Scroll parallax depth transformations
    const scrollOffsetY = scrollY * 0.45;
    const scrollScale = Math.max(0.45, 1 - heroProgress * 0.35 - warpBoost * 0.15);
    const scrollRotate = heroProgress * 16;
    const heroOpacity = Math.max(0, 1 - heroProgress * 1.25);

    // 1. Astronaut Parallax Rig (3D perspective rotation & position)
    if (astronautRig) {
      const rigX = mouseNormX * 38 + floatX;
      const rigY = mouseNormY * 26 + scrollOffsetY + floatY;
      const tiltY = mouseNormX * 14;
      const tiltX = -mouseNormY * 12;

      astronautRig.style.transform = `translate3d(${rigX}px, ${rigY}px, ${-warpBoost * 80}px) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`;
      astronautRig.style.opacity = heroOpacity;
    }

    // 2. Astronaut Container (Deep space scale & orientation)
    if (astronautContainer) {
      astronautContainer.style.transform = `scale(${scrollScale})`;
    }

    // 3. Astronaut Image Layer (Base -12deg rotation + zero-G tilt + scroll drift)
    if (astronautImg) {
      const currentRotate = -12 + floatRotate + scrollRotate + (mouseNormX * 4);
      astronautImg.style.transform = `rotate(${currentRotate}deg)`;
    }

    // 4. Cosmic Backlight Aura (Follows cursor with amplified depth)
    if (astronautAura) {
      const auraX = mouseNormX * 60;
      const auraY = mouseNormY * 45;
      const auraPulse = 1 + Math.sin(timestamp * 0.0015) * 0.08;
      astronautAura.style.transform = `translate(-50%, -50%) translate3d(${auraX}px, ${auraY}px, 0) scale(${auraPulse})`;
    }

    // 5. Differential Cosmic Dust Parallax Planes
    const dustScroll = scrollY * 0.3;
    dustDeepList.forEach(d => {
      d.style.transform = `translate3d(${mouseNormX * 14}px, ${mouseNormY * 10 - dustScroll * 0.5}px, 0)`;
    });
    dustMidList.forEach(d => {
      d.style.transform = `translate3d(${mouseNormX * 32}px, ${mouseNormY * 24 - dustScroll * 0.8}px, 0)`;
    });
    dustNearList.forEach(d => {
      d.style.transform = `translate3d(${mouseNormX * 68}px, ${mouseNormY * 50 - dustScroll * 1.3}px, 0)`;
    });

    // 6. Hero Text Counter-Parallax Plane
    if (heroText && heroProgress < 1) {
      const textX = -mouseNormX * 12;
      const textY = -mouseNormY * 8 + scrollY * 0.2;
      heroText.style.transform = `translate3d(${textX}px, ${textY}px, 0)`;
    }

    requestAnimationFrame(animateAstronautParallax);
  }

  requestAnimationFrame(animateAstronautParallax);

  // ==========================================================================
  // 5. CHAPTER SCROLL TRANSFORM ENGINE
  // ==========================================================================
  const fragNear = document.querySelector('.fragment-near');
  const fragDrifting = document.querySelector('.fragment-drifting');
  const fragFast = document.querySelector('.fragment-fast-foreground');
  const blackHole = document.getElementById('black-hole');
  const accretionLens = document.querySelector('.accretion-light-lens');

  function handleScroll() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;

    // Asteroid Belt Fragments Scroll Transforms
    const asteroidSection = document.getElementById('belt');
    if (asteroidSection) {
      const rect = asteroidSection.getBoundingClientRect();
      const progress = (windowH - rect.top) / (rect.height + windowH);

      if (progress >= 0 && progress <= 1) {
        if (fragNear) {
          fragNear.style.transform = `rotate(25deg) translateY(${(progress - 0.5) * -80}px)`;
        }
        if (fragDrifting) {
          const rot = -25 + (progress * -70);
          const x = (progress - 0.5) * -120;
          fragDrifting.style.transform = `rotate(${rot}deg) translateX(${x}px)`;
        }
        if (fragFast) {
          fragFast.style.transform = `rotate(40deg) translateY(${(progress - 0.5) * -150}px)`;
        }
      }
    }

    // Black Hole Event Horizon Expansion on Scroll
    const horizonSection = document.getElementById('horizon');
    if (horizonSection && blackHole) {
      const rect = horizonSection.getBoundingClientRect();
      const progress = (windowH - rect.top) / (rect.height + windowH);

      if (progress >= 0.2 && progress <= 1.2) {
        const norm = Math.max(0, Math.min(1, (progress - 0.2) / 0.8));
        // Scale expands from 0.75x to 2.8x as you approach the singularity
        const scale = 0.75 + norm * 2.05;
        const shadowGlow = 35 + norm * 80;
        const outerCyan = 25 + norm * 60;
        blackHole.style.transform = `scale(${scale})`;
        blackHole.style.boxShadow = `0px 0px ${shadowGlow}px 10px rgba(152, 102, 255, 0.8), 0px 0px ${outerCyan}px 25px rgba(102, 232, 255, 0.35)`;

        if (accretionLens) {
          accretionLens.style.transform = `translate(-50%, -50%) scale(${1 + norm * 1.5}, ${1 + norm * 0.5})`;
          accretionLens.style.filter = `blur(${8 + norm * 14}px)`;
        }
      }
    }

    // Update Telemetry & Chapter Tracking
    updateTelemetry();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ==========================================================================
  // 5. TELEMETRY & CHAPTER NAVIGATION CONTROLLER
  // ==========================================================================
  const chapterDots = document.querySelectorAll('.chapter-dot');
  const telemetryAlt = document.getElementById('tel-altitude');
  const telemetryVel = document.getElementById('tel-velocity');
  const telemetryWarp = document.getElementById('tel-warp');

  const sections = [
    { id: 'departure', name: '01 / DEPARTURE', alt: '400 KM', vel: '28,400 KM/H', warp: '1.000 G' },
    { id: 'belt', name: '02 / ASTEROID BELT', alt: '2.77 AU', vel: '64,800 KM/H', warp: '1.042 G' },
    { id: 'giants', name: '03 / GASEOUS GIANTS', alt: '5.20 AU', vel: '142,000 KM/H', warp: '2.528 G' },
    { id: 'horizon', name: '04 / EVENT HORIZON', alt: 'SINGULARITY (r = 2GM/c²)', vel: '299,792 KM/S (c)', warp: '∞ WARP' }
  ];

  function updateTelemetry() {
    const scrollMid = window.scrollY + window.innerHeight * 0.45;
    let currentIdx = 0;

    sections.forEach((sec, idx) => {
      const el = document.getElementById(sec.id);
      if (el && el.offsetTop <= scrollMid) {
        currentIdx = idx;
      }
    });

    chapterDots.forEach((dot, idx) => {
      if (idx === currentIdx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    const activeSec = sections[currentIdx];
    if (telemetryAlt) telemetryAlt.textContent = activeSec.alt;
    if (telemetryVel) telemetryVel.textContent = activeSec.vel;
    if (telemetryWarp) telemetryWarp.textContent = activeSec.warp;
  }

  chapterDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetId = dot.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ==========================================================================
  // 6. PROCEDURAL COSMIC AMBIENT SYNTHESIZER (Web Audio API)
  // ==========================================================================
  const audioBtn = document.getElementById('audio-toggle');
  let audioCtx = null;
  let isAudioPlaying = false;
  let masterGain = null;
  let droneOsc1 = null;
  let droneOsc2 = null;
  let filterNode = null;
  let lfo = null;
  let lfoGain = null;

  function initCosmicAudio() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      // Low cosmic drone (55Hz sub-bass A1 harmonic)
      droneOsc1 = audioCtx.createOscillator();
      droneOsc1.type = 'sine';
      droneOsc1.frequency.setValueAtTime(55, audioCtx.currentTime);

      // Secondary harmonizing drone (110Hz with slight detune)
      droneOsc2 = audioCtx.createOscillator();
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.setValueAtTime(110.3, audioCtx.currentTime);

      // Resonant Low-pass Filter
      filterNode = audioCtx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(320, audioCtx.currentTime);
      filterNode.Q.setValueAtTime(4.0, audioCtx.currentTime);

      // Slow LFO for breathing planetary atmospheric sweep (0.12 Hz)
      lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);

      lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(140, audioCtx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);

      droneOsc1.connect(filterNode);
      droneOsc2.connect(filterNode);
      filterNode.connect(masterGain);

      droneOsc1.start();
      droneOsc2.start();
      lfo.start();
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  function toggleAudio() {
    if (!audioCtx) {
      initCosmicAudio();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isAudioPlaying) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 1.5);
      isAudioPlaying = true;
      if (audioBtn) {
        audioBtn.classList.add('audio-playing');
        audioBtn.querySelector('.audio-label').textContent = 'AUDIO ON';
      }
    } else {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      isAudioPlaying = false;
      if (audioBtn) {
        audioBtn.classList.remove('audio-playing');
        audioBtn.querySelector('.audio-label').textContent = 'AUDIO OFF';
      }
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudio);
  }

  // ==========================================================================
  // 7. INITIALIZATION ON DOM READY
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    renderStarfield(0);
    initMeshShader();
    handleScroll();
    updateTelemetry();

    // Smooth scroll for hero CTA with warp acceleration impulse
    const beginBtn = document.getElementById('begin-journey-btn');
    if (beginBtn) {
      beginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        warpBoost = 1.0; // Trigger astronaut warp boost
        const belt = document.getElementById('belt');
        if (belt) {
          belt.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Smooth scroll for footer top button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });

})();
