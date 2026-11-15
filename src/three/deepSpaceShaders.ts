import * as THREE from 'three';

export interface DeepSpaceEnvironment {
  root: THREE.Group;
  update: (dt: number, elapsed: number, camNdcX: number, camNdcY: number, sunDir: THREE.Vector3) => void;
  dispose: () => void;
}

export const WHITE_GOLD_STAR_HEX = {
  white: 0xffffff,
  warmGold: 0xffd700,
  champagneGold: 0xf5d77a,
} as const;

/**
 * Inverted sky-dome shader rendering a deep obsidian-black outer space canvas
 * with subtle realistic Milky Way dust lanes, restrained warm-gold/slate nebulae,
 * and distant inclined spiral galaxies.
 */
function createDeepSpaceDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(-6, 2.5, 4).normalize() },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      varying vec3 vDir;

      float hash31(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);

        float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);
        return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z);
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise3(p);
          p = p * 2.03 + vec3(13.1, 7.7, 5.3);
          a *= 0.5;
        }
        return v;
      }

      vec3 renderDistantGalaxy(vec3 dir, vec3 center, vec3 axisA, vec3 axisB, float scale, vec3 coreCol, vec3 armCol) {
        float dDot = dot(dir, center);
        if (dDot < 0.72) return vec3(0.0);
        vec3 delta = dir - center * dDot;
        float x = dot(delta, axisA) * scale;
        float y = dot(delta, axisB) * scale * 2.2;
        float r = length(vec2(x, y));
        float angle = atan(y, x);

        float core = exp(-r * r * 20.0);
        float disk = exp(-r * 4.0);
        float spiral = 0.55 + 0.45 * sin(angle * 2.0 - r * 9.5 + uTime * 0.025);
        float arms = disk * spiral * smoothstep(0.05, 0.45, r);
        float dust = smoothstep(0.35, 0.75, fbm(dir * 38.0));

        return coreCol * core * 0.72 + armCol * arms * (1.0 - dust * 0.45) * 0.42;
      }

      void main() {
        vec3 d = normalize(vDir);
        float t = uTime * 0.01;

        // Tilted galactic equator coordinate
        float galPlane = dot(d, normalize(vec3(0.32, 0.76, -0.56)));
        float band = exp(-galPlane * galPlane * 6.8);

        vec3 pWarp = d * 2.4 + vec3(t, -t * 0.5, t * 0.35);
        float nebA = fbm(pWarp);
        float nebB = fbm(pWarp * 2.15 + vec3(nebA * 1.4));
        float dustLane = smoothstep(0.42, 0.72, fbm(d * 6.5 - vec3(t * 0.4)));

        // Deep black observatory outer-space base
        vec3 col = vec3(0.008, 0.010, 0.015);

        // Subtle, realistic galactic mist & warm champagne-gold starlight scattering
        vec3 deepMist = vec3(0.028, 0.036, 0.054) * pow(nebA, 2.0) * (0.38 + 0.95 * band);
        vec3 goldDust = vec3(0.115, 0.088, 0.042) * pow(nebB, 2.1) * (0.22 + 0.88 * band);
        vec3 warmHighlight = vec3(0.16, 0.125, 0.070) * smoothstep(0.56, 0.88, nebB) * band * 0.72;

        col += (deepMist + goldDust + warmHighlight) * (1.0 - dustLane * 0.62);

        // Dark cosmic rift dust filaments
        col *= 1.0 - band * dustLane * 0.45;

        // Distant resolved spiral & lenticular galaxies
        col += renderDistantGalaxy(
          d,
          normalize(vec3(-0.48, 0.38, -0.78)),
          normalize(vec3(0.75, 0.1, -0.65)),
          normalize(vec3(-0.2, 0.95, 0.2)),
          13.5,
          vec3(1.0, 0.96, 0.86),
          vec3(0.86, 0.76, 0.54)
        );
        col += renderDistantGalaxy(
          d,
          normalize(vec3(0.46, -0.26, -0.84)),
          normalize(vec3(0.78, -0.1, 0.62)),
          normalize(vec3(0.1, 0.96, 0.15)),
          16.5,
          vec3(1.0, 0.92, 0.74),
          vec3(0.78, 0.74, 0.66)
        );

        // Subtle warm solar corona glow along active Sun direction
        float sunScatter = pow(max(0.0, dot(d, normalize(uSunDir))), 14.0);
        col += vec3(0.16, 0.13, 0.08) * sunScatter * 0.34;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

function createStarLayerMaterial(baseSize: number, twinkleSpeed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBaseSize: { value: baseSize },
      uTwinkleSpeed: { value: twinkleSpeed },
    },
    vertexShader: `
      attribute float aScale;
      attribute float aPhase;
      attribute float aTwinkleAmp;
      attribute float aHalo;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uBaseSize;
      uniform float uTwinkleSpeed;
      varying vec3 vColor;
      varying float vTwinkle;
      varying float vHalo;
      void main() {
        vColor = aColor;
        vHalo = aHalo;
        float wave = sin(uTime * uTwinkleSpeed + aPhase);
        vTwinkle = 1.0 - aTwinkleAmp * 0.38 * (0.5 - 0.5 * wave);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float haloExpand = mix(1.0, 1.9, step(0.05, aHalo));
        gl_PointSize = clamp(uBaseSize * aScale * haloExpand * (190.0 / max(1.0, -mvPosition.z)), 1.0, 16.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;
      varying float vHalo;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c) * 2.0;
        if (d > 1.0) discard;

        // Crisp astronomical pinpoint core; selected bright stars add a soft golden halo
        float coreWidth = mix(12.0, 28.0, step(0.05, vHalo));
        float core = exp(-d * d * coreWidth);
        float softPin = pow(max(0.0, 1.0 - d), 3.6) * 0.18;
        float goldenHalo = exp(-d * d * 4.2) * 0.36 * vHalo;

        vec3 haloTint = vec3(1.0, 0.84, 0.42);
        vec3 rgb = vColor * (core + softPin) + haloTint * goldenHalo;
        float alpha = clamp((core + softPin + goldenHalo) * vTwinkle, 0.0, 1.0);
        gl_FragColor = vec4(rgb, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function buildStarPoints(
  count: number,
  minRadius: number,
  maxRadius: number,
  baseSize: number,
  twinkleSpeed: number,
  haloFraction = 0.14
): {
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const twinkleAmps = new Float32Array(count);
  const halos = new Float32Array(count);

  const pureWhite = new THREE.Color(WHITE_GOLD_STAR_HEX.white);
  const warmGold = new THREE.Color(WHITE_GOLD_STAR_HEX.warmGold);
  const champagneGold = new THREE.Color(WHITE_GOLD_STAR_HEX.champagneGold);

  for (let i = 0; i < count; i++) {
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // 90% white stars (#FFFFFF), 10% golden stars (#FFD700)
    const roll = Math.random();
    const isGold = roll >= 0.90;
    const baseCol =
      roll < 0.90 ? pureWhite : (Math.random() < 0.5 ? warmGold : champagneGold);

    // Natural stellar magnitude spread so stars are NOT equally bright
    const mag = 0.24 + Math.pow(Math.random(), 2.3) * 0.76;
    colors[i * 3] = baseCol.r * mag;
    colors[i * 3 + 1] = baseCol.g * mag;
    colors[i * 3 + 2] = baseCol.b * mag;

    scales[i] = 0.55 + Math.pow(Math.random(), 2.6) * 1.65;
    phases[i] = Math.random() * Math.PI * 2;
    twinkleAmps[i] = Math.random() < 0.45 ? 0.45 + Math.random() * 0.55 : 0.0;

    // Subtle golden halo reserved for selected brighter white/gold stars
    const isBrightCandidate = mag > 0.58 && (isGold || Math.random() < 0.35);
    halos[i] = isBrightCandidate && Math.random() < haloFraction * 2.2 ? 0.55 + Math.random() * 0.45 : 0.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aTwinkleAmp', new THREE.BufferAttribute(twinkleAmps, 1));
  geo.setAttribute('aHalo', new THREE.BufferAttribute(halos, 1));

  const mat = createStarLayerMaterial(baseSize, twinkleSpeed);
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, geo, mat };
}

export function createInstancedStarfield(count = 4000): {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  update: (elapsed: number) => void;
} {
  const geometry = new THREE.SphereGeometry(0.1, 4, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();

  const baseScales = new Float32Array(count);
  const twinkleSpeeds = new Float32Array(count);
  const twinklePhases = new Float32Array(count);
  const positions = new Float32Array(count * 3);

  const pureWhite = new THREE.Color(WHITE_GOLD_STAR_HEX.white);
  const silverCol = new THREE.Color(0xd8e2ec);
  const goldCol = new THREE.Color(WHITE_GOLD_STAR_HEX.warmGold);

  for (let i = 0; i < count; i++) {
    const r = 40 + Math.random() * 95;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const scale = 0.32 + Math.pow(Math.random(), 2.2) * 1.5;
    baseScales[i] = scale;
    twinkleSpeeds[i] = 1.2 + Math.random() * 3.2;
    twinklePhases[i] = Math.random() * Math.PI * 2;

    dummy.position.set(x, y, z);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    const roll = Math.random();
    const c = roll < 0.88 ? pureWhite : roll < 0.96 ? silverCol : goldCol;
    mesh.setColorAt(i, c);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;

  const update = (elapsed: number) => {
    for (let i = 0; i < count; i++) {
      const twinkle = Math.sin(elapsed * twinkleSpeeds[i] + twinklePhases[i]);
      const currentScale = baseScales[i] * (0.82 + 0.28 * twinkle);
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.scale.set(currentScale, currentScale, currentScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return { mesh, geometry, material, update };
}

interface ShootingStar {
  line: THREE.Line;
  geo: THREE.BufferGeometry;
  mat: THREE.LineBasicMaterial;
  origin: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  length: number;
  age: number;
  duration: number;
  cooldown: number;
}

function resetShootingStar(star: ShootingStar, initialDelay = 0) {
  const r = 44 + Math.random() * 24;
  const az = (Math.random() - 0.5) * 2.2;
  const el = (Math.random() - 0.3) * 0.9;
  star.origin.set(
    Math.sin(az) * r,
    Math.sin(el) * r * 0.65 + 6,
    -Math.cos(az) * r - 18
  );
  star.dir
    .set(
      (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.5),
      -0.35 - Math.random() * 0.45,
      (Math.random() - 0.5) * 0.25
    )
    .normalize();
  star.speed = 24 + Math.random() * 14;
  star.length = 2.6 + Math.random() * 2.4;
  star.duration = 0.85 + Math.random() * 0.55;
  star.age = -initialDelay;
  star.cooldown = 3.2 + Math.random() * 7.0;
  star.mat.opacity = 0;
}

export interface DeepSpaceEnvironmentOptions {
  includeStarLayers?: boolean;
}

export function createDeepSpaceEnvironment(
  isSoftwareGl: boolean,
  options: DeepSpaceEnvironmentOptions = {}
): DeepSpaceEnvironment {
  const includeStarLayers = options.includeStarLayers ?? true;
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Deep Obsidian Sky Dome (Subtle Galactic Dust + Distant Galaxies)
  const domeGeo = new THREE.SphereGeometry(148, 48, 32);
  const domeMat = createDeepSpaceDomeMaterial();
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.renderOrder = -10;
  root.add(domeMesh);
  geometries.push(domeGeo);
  materials.push(domeMat);

  // 2. High-Performance InstancedMesh Starfield (renders thousands of white and silver stars with varying sizes and subtle twinkling)
  const instancedStarfield = createInstancedStarfield(isSoftwareGl ? 2000 : 4500);
  root.add(instancedStarfield.mesh);
  geometries.push(instancedStarfield.geometry);
  materials.push(instancedStarfield.material);

  // 3. Subtle Warm Solar Scattering Corona along Sun Direction
  const sunScatterGeo = new THREE.PlaneGeometry(32, 32);
  const sunScatterMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - vec2(0.5);
        float d = length(p) * 2.0;
        if (d > 1.0) discard;
        float angle = atan(p.y, p.x);
        float rays = 0.88 + 0.12 * sin(angle * 7.0 + uTime * 0.22) * cos(angle * 4.0 - uTime * 0.16);
        float falloff = exp(-d * d * 5.6) * rays;
        vec3 col = mix(vec3(1.0, 0.95, 0.84), vec3(0.96, 0.84, 0.50), smoothstep(0.1, 0.85, d));
        gl_FragColor = vec4(col, falloff * 0.18);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sunScatterMesh = new THREE.Mesh(sunScatterGeo, sunScatterMat);
  sunScatterMesh.renderOrder = -5;
  root.add(sunScatterMesh);
  geometries.push(sunScatterGeo);
  materials.push(sunScatterMat);

  // 4. Occasional Pure White & Golden Shooting Stars
  const shootingColors = [
    WHITE_GOLD_STAR_HEX.white,
    WHITE_GOLD_STAR_HEX.warmGold,
    WHITE_GOLD_STAR_HEX.champagneGold,
  ];
  const shootingStars: ShootingStar[] = Array.from({ length: 3 }, (_, idx) => {
    const posArr = new Float32Array(6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.LineBasicMaterial({
      color: shootingColors[idx % shootingColors.length],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    root.add(line);
    geometries.push(geo);
    materials.push(mat);

    const star: ShootingStar = {
      line,
      geo,
      mat,
      origin: new THREE.Vector3(),
      dir: new THREE.Vector3(1, -0.5, 0).normalize(),
      speed: 28,
      length: 3.2,
      age: 0,
      duration: 1.0,
      cooldown: 4,
    };
    resetShootingStar(star, 1.2 + idx * 3.4);
    return star;
  });

  const head = new THREE.Vector3();
  const tail = new THREE.Vector3();

  return {
    root,
    update: (dt, elapsed, camNdcX, camNdcY, sunDir) => {
      domeMat.uniforms.uTime.value = elapsed;
      domeMat.uniforms.uSunDir.value.copy(sunDir);
      sunScatterMat.uniforms.uTime.value = elapsed;



      // Update high-performance InstancedMesh starfield twinkling
      instancedStarfield.update(elapsed);

      // Anchor subtle solar light aura along active Sun direction
      sunScatterMesh.position.copy(sunDir).multiplyScalar(58);
      sunScatterMesh.lookAt(0, 0, 0);

      // Update occasional white & gold shooting stars
      for (const s of shootingStars) {
        s.age += dt;
        if (s.age < 0) {
          s.mat.opacity = 0;
          continue;
        }
        if (s.age > s.duration) {
          resetShootingStar(s, s.cooldown);
          continue;
        }
        const progress = s.age / s.duration;
        const envelope = Math.sin(progress * Math.PI);
        s.mat.opacity = envelope * 0.62;

        const travel = s.age * s.speed;
        head.copy(s.origin).addScaledVector(s.dir, travel);
        tail.copy(head).addScaledVector(s.dir, -s.length * (0.4 + 0.6 * envelope));

        const attr = s.geo.getAttribute('position') as THREE.BufferAttribute;
        attr.setXYZ(0, tail.x, tail.y, tail.z);
        attr.setXYZ(1, head.x, head.y, head.z);
        attr.needsUpdate = true;
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
