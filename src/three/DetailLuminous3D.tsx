import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import {
  DEFAULT_LUMINOUS_WAVE_PARAMS,
  evaluateLuminousWavePoint,
  evaluatePhotonPulseU,
} from '../utils/luminousWaveMath';

interface DetailLuminous3DProps {
  dividerAnchorRef?: RefObject<HTMLDivElement | null>;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

function createLuminousTubeMaterial(options: {
  spanWidth: number;
  baseOpacity: number;
  edgePower: number;
  coreBoost: number;
  phaseOffset: number;
  waveScale: number;
  trailSharpness: number;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpanWidth: { value: options.spanWidth },
      uBaseOpacity: { value: options.baseOpacity },
      uEdgePower: { value: options.edgePower },
      uCoreBoost: { value: options.coreBoost },
      uPhaseOffset: { value: options.phaseOffset },
      uWaveScale: { value: options.waveScale },
      uPulseA: { value: 0 },
      uPulseB: { value: 0.5 },
      uTrailSharpness: { value: options.trailSharpness },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSpanWidth;
      uniform float uPhaseOffset;
      uniform float uWaveScale;

      varying vec2 vUv;
      varying vec3 vViewNormal;
      varying vec3 vViewPos;

      void main() {
        vUv = uv;
        float u = clamp(uv.x, 0.0, 1.0);
        float cx = (u - 0.5) * uSpanWidth;
        float env = sin(u * 3.14159265);
        float t = uTime;

        float dy = (
          sin(cx * 0.52 + t * 1.25 + uPhaseOffset) * 0.22 +
          cos(cx * 0.27 - t * 0.85 + uPhaseOffset * 0.7) * 0.11
        ) * (0.35 + 0.65 * env) * uWaveScale;

        float dz = cos(cx * 0.42 + t * 0.95 + uPhaseOffset * 1.3) * 0.52 * (0.25 + 0.75 * env) * uWaveScale;

        vec3 displaced = position + vec3(0.0, dy, dz);
        vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
        vViewPos = -mvPosition.xyz;
        vViewNormal = normalize(normalMatrix * normal);

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uBaseOpacity;
      uniform float uEdgePower;
      uniform float uCoreBoost;
      uniform float uPulseA;
      uniform float uPulseB;
      uniform float uTrailSharpness;

      varying vec2 vUv;
      varying vec3 vViewNormal;
      varying vec3 vViewPos;

      float pulseTrail(float u, float pulseU, float sharpness) {
        float diff = mod(pulseU - u + 1.0, 1.0);
        float trail = exp(-diff * sharpness) * step(diff, 0.42);
        float head = exp(-pow(min(abs(u - pulseU), 1.0 - abs(u - pulseU)) * 28.0, 2.0));
        return trail * 0.85 + head * 1.35;
      }

      void main() {
        vec3 n = normalize(vViewNormal);
        vec3 v = normalize(vViewPos);
        float facing = abs(dot(n, v));
        float profile = pow(clamp(facing, 0.0, 1.0), uEdgePower);

        // Smooth fade at extreme left/right ends
        float endFade = smoothstep(0.0, 0.09, vUv.x) * smoothstep(1.0, 0.91, vUv.x);

        // Travelling photon bursts with fading comet streak behind each light node
        float pA = pulseTrail(vUv.x, uPulseA, uTrailSharpness);
        float pB = pulseTrail(vUv.x, uPulseB, uTrailSharpness * 1.15);
        float energy = 1.0 + (pA + pB * 0.78) * uCoreBoost;

        float shimmer = 0.92 + 0.08 * sin(uTime * 2.2 + vUv.x * 12.0);
        vec3 whiteGlow = vec3(0.95, 0.98, 1.0) * energy * shimmer;
        float alpha = clamp(profile * endFade * uBaseOpacity * (0.72 + 0.55 * (pA + pB * 0.6)), 0.0, 1.0);

        gl_FragColor = vec4(whiteGlow, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function createOrbHaloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPulse: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uPulse;
      varying vec2 vUv;
      void main() {
        vec2 c = (vUv - 0.5) * 2.0;
        float r = length(c);
        if (r > 1.0) discard;
        float core = exp(-r * r * 18.0);
        float innerHalo = exp(-r * r * 5.2) * 0.68;
        float outerHalo = pow(max(0.0, 1.0 - r), 2.8) * 0.36;
        float intensity = (core + innerHalo + outerHalo) * uPulse;
        gl_FragColor = vec4(vec3(1.0), clamp(intensity, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function DetailLuminous3D({
  dividerAnchorRef,
  scrollContainerRef,
}: DetailLuminous3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    container.dataset.luminous3dReady = 'false';

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x06080e, 1);

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'detail-luminous-3d-canvas');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080e);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);
    camera.lookAt(0, 0, 0);

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const motionScale = prefersReducedMotion ? 0.15 : 1.0;

    // 1. Primary 3D Luminous Divider Group (tracks the divider anchor vertically)
    const waveGroup = new THREE.Group();
    scene.add(waveGroup);

    const spanWidth = DEFAULT_LUMINOUS_WAVE_PARAMS.spanWidth;
    const straightLineCurve = new THREE.LineCurve3(
      new THREE.Vector3(-spanWidth / 2, 0, 0),
      new THREE.Vector3(spanWidth / 2, 0, 0)
    );

    const coreGeo = new THREE.TubeGeometry(straightLineCurve, 140, 0.014, 10, false);
    const midGeo = new THREE.TubeGeometry(straightLineCurve, 140, 0.06, 12, false);
    const outerGeo = new THREE.TubeGeometry(straightLineCurve, 140, 0.19, 14, false);
    const braidGeoA = new THREE.TubeGeometry(straightLineCurve, 120, 0.011, 8, false);
    const braidHaloA = new THREE.TubeGeometry(straightLineCurve, 120, 0.048, 10, false);
    disposableGeometries.push(coreGeo, midGeo, outerGeo, braidGeoA, braidHaloA);

    const coreMat = createLuminousTubeMaterial({
      spanWidth,
      baseOpacity: 1.0,
      edgePower: 1.1,
      coreBoost: 1.4,
      phaseOffset: 0.0,
      waveScale: 1.0,
      trailSharpness: 7.5,
    });
    const midMat = createLuminousTubeMaterial({
      spanWidth,
      baseOpacity: 0.56,
      edgePower: 2.2,
      coreBoost: 1.1,
      phaseOffset: 0.0,
      waveScale: 1.0,
      trailSharpness: 6.5,
    });
    const outerMat = createLuminousTubeMaterial({
      spanWidth,
      baseOpacity: 0.22,
      edgePower: 3.2,
      coreBoost: 0.9,
      phaseOffset: 0.0,
      waveScale: 1.0,
      trailSharpness: 5.0,
    });

    // Braided secondary 3D white energy filament
    const braidCoreMat = createLuminousTubeMaterial({
      spanWidth,
      baseOpacity: 0.72,
      edgePower: 1.3,
      coreBoost: 1.0,
      phaseOffset: 1.75,
      waveScale: 1.35,
      trailSharpness: 8.5,
    });
    const braidHaloMat = createLuminousTubeMaterial({
      spanWidth,
      baseOpacity: 0.24,
      edgePower: 2.8,
      coreBoost: 0.85,
      phaseOffset: 1.75,
      waveScale: 1.35,
      trailSharpness: 6.5,
    });
    disposableMaterials.push(coreMat, midMat, outerMat, braidCoreMat, braidHaloMat);

    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    const midMesh = new THREE.Mesh(midGeo, midMat);
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    const braidMesh = new THREE.Mesh(braidGeoA, braidCoreMat);
    const braidHaloMesh = new THREE.Mesh(braidHaloA, braidHaloMat);

    coreMesh.renderOrder = 3;
    midMesh.renderOrder = 2;
    outerMesh.renderOrder = 1;
    braidMesh.renderOrder = 2;
    braidHaloMesh.renderOrder = 1;

    waveGroup.add(outerMesh, midMesh, coreMesh, braidHaloMesh, braidMesh);

    // 2. Travelling 3D Luminous Photon Light Orbs locked to the wave
    const orbCoreGeo = new THREE.SphereGeometry(0.048, 16, 16);
    const orbCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const orbHaloGeo = new THREE.PlaneGeometry(0.95, 0.95);
    const orbHaloMatA = createOrbHaloMaterial();
    const orbHaloMatB = createOrbHaloMaterial();
    disposableGeometries.push(orbCoreGeo, orbHaloGeo);
    disposableMaterials.push(orbCoreMat, orbHaloMatA, orbHaloMatB);

    const orbGroupA = new THREE.Group();
    const orbSphereA = new THREE.Mesh(orbCoreGeo, orbCoreMat);
    const orbHaloA = new THREE.Mesh(orbHaloGeo, orbHaloMatA);
    orbHaloA.renderOrder = 4;
    orbGroupA.add(orbSphereA, orbHaloA);

    const orbGroupB = new THREE.Group();
    const orbSphereB = new THREE.Mesh(orbCoreGeo, orbCoreMat);
    orbSphereB.scale.setScalar(0.75);
    const orbHaloB = new THREE.Mesh(orbHaloGeo, orbHaloMatB);
    orbHaloB.scale.setScalar(0.75);
    orbHaloB.renderOrder = 4;
    orbGroupB.add(orbSphereB, orbHaloB);

    waveGroup.add(orbGroupA, orbGroupB);

    // 3. Subtle 3D Tilted Luminous Orbital Gyroscope Rings in Deep Background
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, -0.15, -2.8);
    scene.add(ringsGroup);

    const ringGeoA = new THREE.TorusGeometry(3.2, 0.012, 12, 128);
    const ringGeoB = new THREE.TorusGeometry(4.15, 0.008, 12, 128);
    disposableGeometries.push(ringGeoA, ringGeoB);

    const createRingMaterial = (opacity: number) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: opacity },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            float wave = 0.5 + 0.5 * sin(vUv.x * 6.2831853 * 2.0 - uTime * 0.85);
            float alpha = uOpacity * (0.35 + 0.65 * pow(wave, 2.0));
            gl_FragColor = vec4(vec3(0.92, 0.96, 1.0), alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

    const ringMatA = createRingMaterial(0.26);
    const ringMatB = createRingMaterial(0.16);
    disposableMaterials.push(ringMatA, ringMatB);

    const ringMeshA = new THREE.Mesh(ringGeoA, ringMatA);
    ringMeshA.rotation.set(Math.PI * 0.36, Math.PI * 0.14, 0.15);
    const ringMeshB = new THREE.Mesh(ringGeoB, ringMatB);
    ringMeshB.rotation.set(-Math.PI * 0.28, -Math.PI * 0.18, -0.2);
    ringsGroup.add(ringMeshA, ringMeshB);

    // 4. 3D Volumetric White Starlight & Floating Luminous Particles
    const particleCount = isSoftwareGl ? 180 : 380;
    const pPositions = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);
    const pPhases = new Float32Array(particleCount);
    const pDepths = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 18;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      pPositions[i * 3 + 2] = -10 + Math.random() * 11.5;
      pSizes[i] = 0.6 + Math.pow(Math.random(), 2.1) * 2.2;
      pPhases[i] = Math.random() * Math.PI * 2;
      pDepths[i] = (pPositions[i * 3 + 2] + 10) / 11.5;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particlesGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
    particlesGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhases, 1));
    particlesGeo.setAttribute('aDepth', new THREE.BufferAttribute(pDepths, 1));

    const particlesMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uMotionScale: { value: motionScale },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute float aDepth;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uMotionScale;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * (0.28 + aDepth * 0.25) + aPhase) * 0.28 * uMotionScale;
          pos.x += cos(uTime * (0.22 + aDepth * 0.2) + aPhase * 1.3) * 0.22 * uMotionScale;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float twinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase);
          vAlpha = (0.25 + 0.65 * aDepth) * twinkle;

          gl_PointSize = clamp(
            aSize * uPixelRatio * (48.0 / max(1.0, -mvPosition.z)),
            1.5,
            24.0 * max(1.0, uPixelRatio)
          );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 c = (gl_PointCoord - vec2(0.5)) * 2.0;
          float d = length(c);
          if (d > 1.0) discard;
          float core = exp(-d * d * 14.0);
          float halo = exp(-d * d * 3.8) * 0.42;
          float a = clamp((core + halo) * vAlpha, 0.0, 1.0);
          gl_FragColor = vec4(vec3(0.96, 0.98, 1.0), a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    disposableGeometries.push(particlesGeo);
    disposableMaterials.push(particlesMat);

    const particles = new THREE.Points(particlesGeo, particlesMat);
    particles.frustumCulled = false;
    scene.add(particles);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Track divider vertical position smoothly on scroll/resize without layout thrashing
    let targetWaveWorldY = 2.05;
    const updateAnchorTargetY = () => {
      const anchor = dividerAnchorRef?.current;
      const viewH = container.clientHeight || window.innerHeight;
      if (!anchor || viewH <= 0) {
        targetWaveWorldY = 2.05;
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const centerY = rect.top + rect.height * 0.5;
      const ndcY = 1.0 - (centerY / viewH) * 2.0;
      const halfHeightAtZero =
        camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      targetWaveWorldY = ndcY * halfHeightAtZero;
    };
    updateAnchorTargetY();

    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerCurrent = new THREE.Vector2(0, 0);

    const handlePointerMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointerTarget.x = (e.clientX / w) * 2 - 1;
      pointerTarget.y = -((e.clientY / h) * 2 - 1);
    };

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      particlesMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      updateAnchorTargetY();
    };

    const scrollTarget = scrollContainerRef?.current;
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize);
    scrollTarget?.addEventListener('scroll', updateAnchorTargetY, { passive: true });

    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    let frameId = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const _waveLook = new THREE.Vector3(0, 0, 0);

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += dt * motionScale;

      const damp = 1 - Math.exp(-4.5 * dt);
      pointerCurrent.lerp(pointerTarget, damp);

      camera.position.x = pointerCurrent.x * 0.42;
      camera.position.y = pointerCurrent.y * 0.24;
      camera.lookAt(_waveLook);

      // Smoothly position waveGroup at the divider showcase anchor
      waveGroup.position.y += (targetWaveWorldY - waveGroup.position.y) * Math.min(1, damp * 2.5);
      waveGroup.rotation.x = pointerCurrent.y * 0.08;
      waveGroup.rotation.y = pointerCurrent.x * 0.05;

      const pulseA = evaluatePhotonPulseU(elapsed, 4.2, 0.0);
      const pulseB = evaluatePhotonPulseU(elapsed, 5.8, 0.45);

      const posA = evaluateLuminousWavePoint(pulseA, elapsed, DEFAULT_LUMINOUS_WAVE_PARAMS);
      const posB = evaluateLuminousWavePoint(pulseB, elapsed, DEFAULT_LUMINOUS_WAVE_PARAMS);
      orbGroupA.position.set(posA.x, posA.y, posA.z);
      orbGroupB.position.set(posB.x, posB.y, posB.z);
      orbHaloA.quaternion.copy(camera.quaternion);
      orbHaloB.quaternion.copy(camera.quaternion);

      orbHaloMatA.uniforms.uPulse.value = 0.88 + 0.12 * Math.sin(elapsed * 4.5);
      orbHaloMatB.uniforms.uPulse.value = 0.85 + 0.15 * Math.cos(elapsed * 3.8);

      for (const m of [coreMat, midMat, outerMat, braidCoreMat, braidHaloMat]) {
        m.uniforms.uTime.value = elapsed;
        m.uniforms.uPulseA.value = pulseA;
        m.uniforms.uPulseB.value = pulseB;
      }

      ringMeshA.rotation.z += dt * 0.08 * motionScale;
      ringMeshB.rotation.z -= dt * 0.055 * motionScale;
      ringsGroup.rotation.y = pointerCurrent.x * 0.14;
      ringsGroup.rotation.x = -pointerCurrent.y * 0.1;
      ringMatA.uniforms.uTime.value = elapsed;
      ringMatB.uniforms.uTime.value = elapsed;

      particlesMat.uniforms.uTime.value = elapsed;

      renderer.render(scene, camera);
      container.dataset.luminous3dReady = 'true';

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      scrollTarget?.removeEventListener('scroll', updateAnchorTargetY);
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dividerAnchorRef, scrollContainerRef]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 select-none"
    />
  );
}
