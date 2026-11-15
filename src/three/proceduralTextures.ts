import * as THREE from 'three';

export const NASA_TEXTURE_URLS = {
  earthDay:
    'https://upload.wikimedia.org/wikipedia/commons/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg',
  earthClouds:
    'https://upload.wikimedia.org/wikipedia/commons/e/ed/Solarsystemscope_texture_2k_earth_clouds.jpg',
  earthNight:
    'https://upload.wikimedia.org/wikipedia/commons/2/2f/Solarsystemscope_texture_2k_earth_nightmap.jpg',
  earthNormal:
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  earthSpecular:
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  marsColor:
    'https://upload.wikimedia.org/wikipedia/commons/4/46/Solarsystemscope_texture_2k_mars.jpg',
  moonColor:
    'https://upload.wikimedia.org/wikipedia/commons/2/26/Solarsystemscope_texture_2k_moon.jpg',
} as const;

export const SUN_DIRECTION = new THREE.Vector3(-6, 2.5, 4).normalize();

export interface PlanetNasaTextures {
  map: THREE.Texture;
  bumpMap: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  cloudsMap?: THREE.Texture;
  nightMap?: THREE.Texture;
  dispose: () => void;
}

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

function loadImageTexture(
  url: string,
  options: { colorSpace: THREE.ColorSpace; maxAnisotropy: number }
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (tex) => {
        tex.colorSpace = options.colorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = options.maxAnisotropy;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

/**
 * Generates an O(W*H) high-pass luminance bump map (with separable 5x5 box mean)
 * from a loaded equirectangular NASA map so craters, mountain ranges, and rift valleys
 * cast crisp 3D relief shadows across the solar terminator.
 */
export function generateHighPassBumpMap(
  sourceImage: CanvasImageSource,
  targetWidth: number,
  targetHeight: number,
  maxAnisotropy: number,
  detailGain = 3.1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = imgData.data;
  const count = targetWidth * targetHeight;
  const lum = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const p = i * 4;
    lum[i] = pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114;
  }

  // Separable 5-tap horizontal wrap + vertical clamp mean
  const horiz = new Float32Array(count);
  for (let y = 0; y < targetHeight; y++) {
    const row = y * targetWidth;
    for (let x = 0; x < targetWidth; x++) {
      const xm2 = (x - 2 + targetWidth) % targetWidth;
      const xm1 = (x - 1 + targetWidth) % targetWidth;
      const xp1 = (x + 1) % targetWidth;
      const xp2 = (x + 2) % targetWidth;
      horiz[row + x] =
        (lum[row + xm2] + lum[row + xm1] + lum[row + x] + lum[row + xp1] + lum[row + xp2]) * 0.2;
    }
  }

  for (let y = 0; y < targetHeight; y++) {
    const ym2 = Math.max(0, y - 2) * targetWidth;
    const ym1 = Math.max(0, y - 1) * targetWidth;
    const y0 = y * targetWidth;
    const yp1 = Math.min(targetHeight - 1, y + 1) * targetWidth;
    const yp2 = Math.min(targetHeight - 1, y + 2) * targetWidth;

    for (let x = 0; x < targetWidth; x++) {
      const idx = y0 + x;
      const localMean =
        (horiz[ym2 + x] + horiz[ym1 + x] + horiz[y0 + x] + horiz[yp1 + x] + horiz[yp2 + x]) * 0.2;
      const highPass = (lum[idx] - localMean) * detailGain + (lum[idx] - 128) * 0.24;
      const val = clampByte(128 + highPass);
      const p = idx * 4;
      pixels[p] = val;
      pixels[p + 1] = val;
      pixels[p + 2] = val;
      pixels[p + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Inverts a NASA ocean specular mask into a PBR roughness map:
 * bright ocean specular -> smooth water roughness (~0.30), dark matte land -> ~0.92.
 */
function buildRoughnessMapFromSpecular(
  specularImage: CanvasImageSource,
  width: number,
  height: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(specularImage, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const spec = pixels[i];
    const rough = clampByte(242 - spec * 0.42);
    pixels[i] = rough;
    pixels[i + 1] = rough;
    pixels[i + 2] = rough;
    pixels[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a clean solid neutral 16x8 DataTexture so materials render cleanly
 * during initial milliseconds before the async 2K NASA maps resolve.
 */
export function createSolidFallbackTexture(hexColor: number): THREE.DataTexture {
  const c = new THREE.Color(hexColor);
  const r = clampByte(Math.round(c.r * 255));
  const g = clampByte(Math.round(c.g * 255));
  const b = clampByte(Math.round(c.b * 255));
  const data = new Uint8Array([r, g, b, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export async function loadEarthNasaTextures(
  maxAnisotropy: number,
  bumpWidth = 2048,
  bumpHeight = 1024
): Promise<PlanetNasaTextures> {
  const [map, cloudsMap, nightMap, normalMap, specTex] = await Promise.all([
    loadImageTexture(NASA_TEXTURE_URLS.earthDay, {
      colorSpace: THREE.SRGBColorSpace,
      maxAnisotropy,
    }),
    loadImageTexture(NASA_TEXTURE_URLS.earthClouds, {
      colorSpace: THREE.NoColorSpace,
      maxAnisotropy,
    }),
    loadImageTexture(NASA_TEXTURE_URLS.earthNight, {
      colorSpace: THREE.SRGBColorSpace,
      maxAnisotropy,
    }),
    loadImageTexture(NASA_TEXTURE_URLS.earthNormal, {
      colorSpace: THREE.NoColorSpace,
      maxAnisotropy,
    }),
    loadImageTexture(NASA_TEXTURE_URLS.earthSpecular, {
      colorSpace: THREE.NoColorSpace,
      maxAnisotropy,
    }),
  ]);

  const bumpMap = generateHighPassBumpMap(
    map.image as CanvasImageSource,
    bumpWidth,
    bumpHeight,
    maxAnisotropy,
    2.8
  );
  const roughnessMap = buildRoughnessMapFromSpecular(
    specTex.image as CanvasImageSource,
    Math.min(1024, bumpWidth),
    Math.min(512, bumpHeight),
    maxAnisotropy
  );
  specTex.dispose();

  return {
    map,
    bumpMap,
    normalMap,
    roughnessMap,
    cloudsMap,
    nightMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
      cloudsMap.dispose();
      nightMap.dispose();
    },
  };
}

export async function loadMarsNasaTextures(
  maxAnisotropy: number,
  bumpWidth = 2048,
  bumpHeight = 1024
): Promise<PlanetNasaTextures> {
  const map = await loadImageTexture(NASA_TEXTURE_URLS.marsColor, {
    colorSpace: THREE.SRGBColorSpace,
    maxAnisotropy,
  });

  const bumpMap = generateHighPassBumpMap(
    map.image as CanvasImageSource,
    bumpWidth,
    bumpHeight,
    maxAnisotropy,
    3.4
  );

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

export async function loadMoonNasaTextures(
  maxAnisotropy: number,
  bumpWidth = 2048,
  bumpHeight = 1024
): Promise<PlanetNasaTextures> {
  const map = await loadImageTexture(NASA_TEXTURE_URLS.moonColor, {
    colorSpace: THREE.SRGBColorSpace,
    maxAnisotropy,
  });

  const bumpMap = generateHighPassBumpMap(
    map.image as CanvasImageSource,
    bumpWidth,
    bumpHeight,
    maxAnisotropy,
    3.8
  );

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

export interface AtmosphereShaderOptions {
  baseColorHex: number;
  glowColorHex: number;
  intensity?: number;
  power?: number;
  pulseSpeed?: number;
  pulseAmplitude?: number;
  phaseOffset?: number;
  edgeScale?: number;
}

export function createAtmosphereMaterial(
  options: AtmosphereShaderOptions
): THREE.ShaderMaterial {
  const {
    baseColorHex,
    glowColorHex,
    intensity = 0.55,
    power = 3.8,
    pulseSpeed = 1.35,
    pulseAmplitude = 0.14,
    phaseOffset = 0,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(baseColorHex) },
      uGlowColor: { value: new THREE.Color(glowColorHex) },
      uIntensity: { value: intensity },
      uPower: { value: power },
      uTime: { value: 0 },
      uPulseSpeed: { value: pulseSpeed },
      uPulseAmplitude: { value: pulseAmplitude },
      uPhaseOffset: { value: phaseOffset },
      uActiveBoost: { value: 0 },
      uSunDir: { value: SUN_DIRECTION.clone() },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPulseSpeed;
      uniform float uPulseAmplitude;
      uniform float uPhaseOffset;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      void main() {
        float wave = 0.5 + 0.5 * sin(uTime * uPulseSpeed + uPhaseOffset);
        vec3 displaced = position * (1.0 + wave * uPulseAmplitude * 0.008);
        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPos.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uGlowColor;
      uniform float uIntensity;
      uniform float uPower;
      uniform float uTime;
      uniform float uPulseSpeed;
      uniform float uPulseAmplitude;
      uniform float uPhaseOffset;
      uniform float uActiveBoost;
      uniform vec3 uSunDir;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = max(0.0, dot(vNormalWorld, viewDir));
        float rim = 1.0 - ndotv;
        float fresnel = pow(rim, uPower);

        float wave = 0.5 + 0.5 * sin(uTime * uPulseSpeed + uPhaseOffset);
        float pulse = 1.0 + (wave - 0.5) * 2.0 * uPulseAmplitude;

        vec3 reactiveColor = mix(uBaseColor, uGlowColor, clamp(rim * 0.65 + wave * 0.25, 0.0, 1.0));
        float sunLight = smoothstep(-0.32, 0.82, dot(vNormalWorld, uSunDir));
        float alpha = fresnel * uIntensity * pulse * (1.0 + uActiveBoost * 0.22) * (0.28 + 0.72 * sunLight);
        gl_FragColor = vec4(reactiveColor, clamp(alpha, 0.0, 0.8));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

export function createOuterCoronaMaterial(
  options: AtmosphereShaderOptions
): THREE.ShaderMaterial {
  const {
    baseColorHex,
    glowColorHex,
    intensity = 0.44,
    power = 3.8,
    pulseSpeed = 1.35,
    pulseAmplitude = 0.16,
    phaseOffset = 0,
    edgeScale = 2.02,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(baseColorHex) },
      uGlowColor: { value: new THREE.Color(glowColorHex) },
      uIntensity: { value: intensity },
      uPower: { value: power },
      uTime: { value: 0 },
      uPulseSpeed: { value: pulseSpeed },
      uPulseAmplitude: { value: pulseAmplitude },
      uPhaseOffset: { value: phaseOffset },
      uActiveBoost: { value: 0 },
      uEdgeScale: { value: edgeScale },
      uSunDir: { value: SUN_DIRECTION.clone() },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPulseSpeed;
      uniform float uPulseAmplitude;
      uniform float uPhaseOffset;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      void main() {
        float wave = 0.5 + 0.5 * sin(uTime * uPulseSpeed + uPhaseOffset);
        vec3 displaced = position * (1.0 + wave * uPulseAmplitude * 0.042);
        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPos.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uGlowColor;
      uniform float uIntensity;
      uniform float uPower;
      uniform float uTime;
      uniform float uPulseSpeed;
      uniform float uPulseAmplitude;
      uniform float uPhaseOffset;
      uniform float uActiveBoost;
      uniform float uEdgeScale;
      uniform vec3 uSunDir;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float edgeFade = clamp(-dot(vNormalWorld, viewDir) * uEdgeScale, 0.0, 1.0);
        float halo = pow(edgeFade, uPower);
        float wave = 0.5 + 0.5 * sin(uTime * uPulseSpeed + uPhaseOffset);
        float pulse = 1.0 + (wave - 0.5) * 2.0 * uPulseAmplitude;

        vec3 coronaColor = mix(uBaseColor, uGlowColor, 0.35 + 0.45 * wave);
        float sunLight = smoothstep(-0.42, 0.85, dot(vNormalWorld, uSunDir));
        float alpha = halo * uIntensity * pulse * (1.0 + uActiveBoost * 0.25) * (0.24 + 0.76 * sunLight);
        gl_FragColor = vec4(coronaColor, clamp(alpha, 0.0, 0.65));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
}

export interface ParallaxShellOptions {
  baseColorHex: number;
  glowColorHex: number;
  intensity?: number;
  phaseOffset?: number;
}

/**
 * Secondary transparent outer scattering shell creating subtle view-aligned
 * atmospheric parallax on planet hover. Smoothly fades to zero at grazing horizon
 * (ndotv -> 0) so no hard circular outline appears outside the planet disk.
 */
export function createParallaxShellMaterial(
  options: ParallaxShellOptions
): THREE.ShaderMaterial {
  const {
    baseColorHex,
    glowColorHex,
    intensity = 0.32,
    phaseOffset = 0,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(baseColorHex) },
      uGlowColor: { value: new THREE.Color(glowColorHex) },
      uTime: { value: 0 },
      uPhaseOffset: { value: phaseOffset },
      uHoverAmount: { value: 0 },
      uParallaxOffset: { value: new THREE.Vector2(0, 0) },
      uParallaxRight: { value: new THREE.Vector3(1, 0, 0) },
      uParallaxUp: { value: new THREE.Vector3(0, 1, 0) },
      uSunDir: { value: SUN_DIRECTION.clone() },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPhaseOffset;
      uniform float uHoverAmount;
      uniform vec2 uParallaxOffset;
      uniform vec3 uParallaxRight;
      uniform vec3 uParallaxUp;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = normalize(position);
        float hoverScale = 0.014 + 0.068 * uHoverAmount;
        vec3 shiftWorld =
          (uParallaxRight * uParallaxOffset.x + uParallaxUp * uParallaxOffset.y) * hoverScale;
        float breathe = 1.0 + sin(uTime * 0.9 + uPhaseOffset) * 0.003 * (1.0 + uHoverAmount);
        vec4 worldPos = modelMatrix * vec4(position * breathe, 1.0);
        worldPos.xyz += shiftWorld;
        vWorldPos = worldPos.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uGlowColor;
      uniform float uTime;
      uniform float uPhaseOffset;
      uniform float uHoverAmount;
      uniform vec2 uParallaxOffset;
      uniform vec3 uSunDir;
      uniform float uIntensity;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = max(0.0, dot(vNormalWorld, viewDir));

        float outerFade = smoothstep(0.03, 0.34, ndotv);
        float limbBand = pow(1.0 - ndotv, 1.85) * outerFade;

        vec3 p = vLocalPos + vec3(uParallaxOffset.x * 0.35, uParallaxOffset.y * 0.35, 0.0);
        float wispA = sin(p.y * 9.5 + sin(p.x * 5.2 + uTime * 0.22 + uPhaseOffset) * 1.5);
        float wispB = cos(p.z * 7.8 - p.x * 4.5 + uTime * 0.16);
        float wisps = 0.56 + 0.44 * (0.5 + 0.5 * (wispA * 0.6 + wispB * 0.4));

        float sunWeight = smoothstep(-0.32, 0.85, dot(vNormalWorld, uSunDir));
        float hoverBoost = 0.22 + 2.35 * uHoverAmount;

        vec3 tint = mix(uBaseColor, uGlowColor, clamp((1.0 - ndotv) * 0.72 + uHoverAmount * 0.28, 0.0, 1.0));
        float alpha = limbBand * wisps * uIntensity * hoverBoost * (0.28 + 0.72 * sunWeight);
        gl_FragColor = vec4(tint, clamp(alpha, 0.0, 0.52));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/**
 * Transparent 3D Earth cloud shell with dual-stream independent UV advection
 * and physically motivated solar terminator shading so weather systems evolve naturally.
 */
export function createAnimatedCloudMaterial(
  fallbackTexture: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCloudMap: { value: fallbackTexture },
      uCloudDriftA: { value: 0 },
      uCloudDriftB: { value: 0 },
      uSunDir: { value: SUN_DIRECTION.clone() },
      uOpacity: { value: 0.88 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      void main() {
        vUv = uv;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uCloudMap;
      uniform float uCloudDriftA;
      uniform float uCloudDriftB;
      uniform vec3 uSunDir;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalWorld;

      void main() {
        // Primary trade-wind stream + secondary latitude-sheared cirrus stream
        vec2 uvA = vec2(fract(vUv.x + uCloudDriftA), vUv.y);
        float latWave = sin(vUv.x * 6.28318 + uCloudDriftB * 9.0) * 0.014;
        vec2 uvB = vec2(fract(vUv.x * 1.12 - uCloudDriftB), clamp(vUv.y + latWave, 0.01, 0.99));

        float cA = texture2D(uCloudMap, uvA).r;
        float cB = texture2D(uCloudMap, uvB).r;
        float combined = clamp(cA * 0.78 + cB * 0.34, 0.0, 1.0);
        float density = smoothstep(0.14, 0.78, combined);

        float ndotl = dot(normalize(vNormalWorld), normalize(uSunDir));
        float dayFactor = smoothstep(-0.14, 0.48, ndotl);
        float twilight = exp(-ndotl * ndotl * 22.0) * 0.32;

        vec3 dayColor = vec3(1.0, 1.0, 1.0) * (0.06 + 0.94 * dayFactor);
        vec3 twilightTint = vec3(0.98, 0.64, 0.42) * twilight;
        vec3 finalColor = min(dayColor + twilightTint, vec3(1.05));

        float alpha = density * uOpacity * (0.12 + 0.88 * dayFactor);
        gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.95));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

export interface EarthSurfaceShaderUniforms {
  uNightMap: { value: THREE.Texture };
  uCloudMap: { value: THREE.Texture };
  uCloudShadowShift: { value: number };
  uCloudDriftB: { value: number };
  uSunDir: { value: THREE.Vector3 };
}

/**
 * Injects synchronized drifting cloud shadows on the sunlit hemisphere
 * and glowing city night lights strictly on the unlit hemisphere.
 */
export function applyEarthSurfaceShaders(
  material: THREE.MeshStandardMaterial,
  uniforms: EarthSurfaceShaderUniforms
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNightMap = uniforms.uNightMap;
    shader.uniforms.uCloudMap = uniforms.uCloudMap;
    shader.uniforms.uCloudShadowShift = uniforms.uCloudShadowShift;
    shader.uniforms.uCloudDriftB = uniforms.uCloudDriftB;
    shader.uniforms.uSunDir = uniforms.uSunDir;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWorldNormalEarth;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vWorldNormalEarth = normalize(mat3(modelMatrix) * normal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform sampler2D uNightMap;
         uniform sampler2D uCloudMap;
         uniform float uCloudShadowShift;
         uniform float uCloudDriftB;
         uniform vec3 uSunDir;
         varying vec3 vWorldNormalEarth;`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float sunDot = dot(normalize(vWorldNormalEarth), normalize(uSunDir));
         float sunLit = smoothstep(-0.08, 0.35, sunDot);
         vec2 shadowUvA = vec2(fract(vMapUv.x + uCloudShadowShift + 0.0045), clamp(vMapUv.y - 0.0025, 0.01, 0.99));
         vec2 shadowUvB = vec2(fract((vMapUv.x + uCloudShadowShift - uCloudDriftB) * 1.12), clamp(vMapUv.y - 0.0025, 0.01, 0.99));
         float cloudCover = smoothstep(0.22, 0.84, texture2D(uCloudMap, shadowUvA).r * 0.78 + texture2D(uCloudMap, shadowUvB).r * 0.30);
         diffuseColor.rgb *= mix(1.0, 0.48, cloudCover * sunLit);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float nightMask = smoothstep(0.14, -0.24, dot(normalize(vWorldNormalEarth), normalize(uSunDir)));
         vec3 cityTex = texture2D(uNightMap, vMapUv).rgb;
         totalEmissiveRadiance += cityTex * nightMask * 0.95;`
      );
  };
}

