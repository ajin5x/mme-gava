import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  EARTH_ANALOGUE_PINS,
  MARS_PLACES,
  MOON_PLACES,
  type PageMode,
  type PlanetId,
  type PlanetPlace,
  type RotationSpeedPreset,
} from '../data/planetaryAtlasData';
import {
  DEFAULT_ROTATION_SPEED,
  filterEarthBenchmarkPins,
  getRotationRates,
  isDualComparisonMode,
  latLonToSpherePosition,
  type EarthPinScope,
} from '../utils/atlasLogic';
import { createDeepSpaceEnvironment, WHITE_GOLD_STAR_HEX } from './deepSpaceShaders';
import {
  applyEarthSurfaceShaders,
  createAnimatedCloudMaterial,
  createAtmosphereMaterial,
  createOuterCoronaMaterial,
  createParallaxShellMaterial,
  createSolidFallbackTexture,
  loadEarthNasaTextures,
  loadMarsNasaTextures,
  loadMoonNasaTextures,
  SUN_DIRECTION,
  type EarthSurfaceShaderUniforms,
  type PlanetNasaTextures,
} from './proceduralTextures';

interface PlanetaryViewportProps {
  pageMode: PageMode;
  selectedPlanet: PlanetId | null;
  isRotating: boolean;
  rotationSpeed?: RotationSpeedPreset;
  selectedPlaceId: string | null;
  earthPinScope?: EarthPinScope;
  onSelectPlanet: (planet: PlanetId) => void;
  onSelectPlace: (place: PlanetPlace) => void;
  onWebglError?: (message: string) => void;
}

interface PinEntry {
  place: PlanetPlace;
  group: THREE.Group;
  beaconMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshBasicMaterial;
}

// Identical sphere size for Earth, Mars & The Moon across the entire atlas (enlarged for majestic scale)
const PLANET_RADIUS = 2.15;

const HUB_EARTH_POS = new THREE.Vector3(-4.2, 0.0, 0.0);
const HUB_MARS_POS = new THREE.Vector3(0.0, 0.04, 0.2);
const HUB_MOON_POS = new THREE.Vector3(4.2, 0.0, 0.0);
const DUAL_LEFT_POS = new THREE.Vector3(-2.65, 0.48, 0.0);
const DUAL_RIGHT_POS = new THREE.Vector3(2.65, 0.48, 0.0);
const SOLO_POS = new THREE.Vector3(0.0, 0.0, 0.0);

const HUB_CAM_POS = new THREE.Vector3(0.0, 0.9, 14.5);
const HUB_TARGET = new THREE.Vector3(0.0, 0.0, 0.0);
const DUAL_CAM_POS = new THREE.Vector3(0.0, 0.52, 11.2);
const DUAL_TARGET = new THREE.Vector3(0.0, -0.45, 0.0);

function buildPlacePins(
  places: PlanetPlace[],
  radius: number,
  defaultHex: number,
  highlightHex: number,
  stemGeo: THREE.BufferGeometry,
  headGeo: THREE.BufferGeometry,
  haloGeo: THREE.BufferGeometry,
  disposableMaterials: THREE.Material[]
): { container: THREE.Group; entries: PinEntry[] } {
  const container = new THREE.Group();
  const entries: PinEntry[] = places.map((place, index) => {
    const pGroup = new THREE.Group();
    const surfPos = latLonToSpherePosition(place.lat, place.lon, radius);
    const normal = new THREE.Vector3(surfPos.x, surfPos.y, surfPos.z).normalize();

    pGroup.position.copy(normal).multiplyScalar(radius);
    pGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const colorHex =
      place.planet === 'earth'
        ? place.targetBody === 'Mars'
          ? 0xff9100
          : 0x00e5ff
        : index % 2 === 0
        ? defaultHex
        : highlightHex;

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.72,
      roughness: 0.25,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.068;
    stem.userData.placeId = place.id;
    stem.userData.planetId = place.planet;

    const beaconMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 1.05,
      roughness: 0.2,
      metalness: 0.2,
    });
    const beacon = new THREE.Mesh(headGeo, beaconMat);
    beacon.position.y = 0.14;
    beacon.userData.placeId = place.id;
    beacon.userData.planetId = place.planet;

    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const surfaceRing = new THREE.Mesh(haloGeo, ringMat);
    surfaceRing.rotation.x = -Math.PI / 2;
    surfaceRing.position.y = 0.01;
    surfaceRing.userData.placeId = place.id;
    surfaceRing.userData.planetId = place.planet;

    disposableMaterials.push(stemMat, beaconMat, ringMat);
    pGroup.add(stem, beacon, surfaceRing);
    container.add(pGroup);

    return { place, group: pGroup, beaconMat, ringMat };
  });

  return { container, entries };
}

/**
 * Single consolidated GPU starfield with depth-based vertex parallax and
 * soft glowing halos for bright golden stars (#FFFFFF, #FFD700, #F5D77A).
 */
function createBackgroundStarfield(
  isSoftwareGl: boolean,
  motionScale: number,
  pixelRatio: number
): {
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
} {
  const count = isSoftwareGl ? 12000 : 32000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const depths = new Float32Array(count);
  const phases = new Float32Array(count);
  const twinkles = new Float32Array(count);
  const goldenHalos = new Float32Array(count);

  const pureWhite = new THREE.Color(WHITE_GOLD_STAR_HEX.white);
  const warmGold = new THREE.Color(WHITE_GOLD_STAR_HEX.warmGold);
  const champagneGold = new THREE.Color(WHITE_GOLD_STAR_HEX.champagneGold);

  const farCutoff = Math.floor(count * 0.56);
  const midCutoff = Math.floor(count * 0.88);

  for (let i = 0; i < count; i++) {
    let minR: number;
    let maxR: number;
    let minDepth: number;
    let maxDepth: number;

    if (i < farCutoff) {
      minR = 96;
      maxR = 142;
      minDepth = 0.12;
      maxDepth = 0.30;
    } else if (i < midCutoff) {
      minR = 52;
      maxR = 94;
      minDepth = 0.38;
      maxDepth = 0.65;
    } else {
      minR = 18;
      maxR = 46;
      minDepth = 0.72;
      maxDepth = 1.0;
    }

    const shellT = Math.random();
    const r = minR + shellT * (maxR - minR);
    const depth = minDepth + (1.0 - shellT) * (maxDepth - minDepth);
    depths[i] = depth;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // 90% white stars (#FFFFFF), 10% golden stars (#FFD700)
    const paletteRoll = Math.random();
    const isGold = paletteRoll >= 0.90;
    const baseCol =
      paletteRoll < 0.90
        ? pureWhite
        : (Math.random() < 0.5 ? warmGold : champagneGold);

    const magnitude = 0.24 + Math.pow(Math.random(), 2.3) * 0.76;
    colors[i * 3] = baseCol.r * magnitude;
    colors[i * 3 + 1] = baseCol.g * magnitude;
    colors[i * 3 + 2] = baseCol.b * magnitude;

    sizes[i] = 0.55 + Math.pow(Math.random(), 2.5) * 1.65;
    phases[i] = Math.random() * Math.PI * 2;
    twinkles[i] = Math.random() < 0.45 ? 0.42 + Math.random() * 0.53 : 0.0;

    // Soft glowing halos selectively on bright golden stars
    goldenHalos[i] =
      isGold && magnitude > 0.42 && Math.random() < 0.55
        ? 0.55 + Math.random() * 0.45
        : 0.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1));
  geo.setAttribute('aGoldenHalo', new THREE.BufferAttribute(goldenHalos, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uParallax: { value: new THREE.Vector2(0, 0) },
      uCameraRight: { value: new THREE.Vector3(1, 0, 0) },
      uCameraUp: { value: new THREE.Vector3(0, 1, 0) },
      uPixelRatio: { value: pixelRatio },
      uMotionScale: { value: motionScale },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aDepth;
      attribute float aPhase;
      attribute float aTwinkle;
      attribute float aGoldenHalo;

      uniform float uTime;
      uniform vec2 uParallax;
      uniform vec3 uCameraRight;
      uniform vec3 uCameraUp;
      uniform float uPixelRatio;
      uniform float uMotionScale;

      varying vec3 vColor;
      varying float vTwinkle;
      varying float vGoldenHalo;
      varying float vDepth;

      void main() {
        vColor = aColor;
        vGoldenHalo = aGoldenHalo;
        vDepth = aDepth;

        float twinkleWave = sin(uTime * (0.85 + aDepth * 0.6) + aPhase);
        vTwinkle = 1.0 - aTwinkle * 0.36 * uMotionScale * (0.5 - 0.5 * twinkleWave);

        // Gentle depth-stratified sidereal drift around the celestial Y axis
        float driftAngle = uTime * 0.0045 * uMotionScale * (0.35 + aDepth * 0.65);
        float c = cos(driftAngle);
        float s = sin(driftAngle);
        vec3 driftedPos = vec3(
          position.x * c - position.z * s,
          position.y,
          position.x * s + position.z * c
        );

        // View-aligned depth-based parallax displacement (closer stars shift farther)
        vec3 parallaxShift =
          (uCameraRight * uParallax.x + uCameraUp * uParallax.y) * (aDepth * 3.8 * uMotionScale);
        vec4 mvPosition = modelViewMatrix * vec4(driftedPos + parallaxShift, 1.0);

        float haloExpand = mix(1.0, 2.25, step(0.05, aGoldenHalo));
        float depthSize = mix(1.28, 2.15, aDepth);
        gl_PointSize = clamp(
          aSize * depthSize * haloExpand * uPixelRatio * (185.0 / max(1.0, -mvPosition.z)),
          1.0,
          18.0 * max(1.0, uPixelRatio)
        );
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;
      varying float vGoldenHalo;
      varying float vDepth;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv) * 2.0;
        if (dist > 1.0) discard;

        // Crisp astronomical pinpoint core for white stars; tightened core inside golden halo stars
        float coreSharpness = mix(13.0, 30.0, step(0.05, vGoldenHalo));
        float core = exp(-dist * dist * coreSharpness);
        float pinFalloff = pow(max(0.0, 1.0 - dist), 3.8) * 0.16 * (1.0 - step(0.05, vGoldenHalo));

        // Soft warm golden halo around golden stars (#FFD700 / #F5D77A)
        float edgeFade = smoothstep(1.0, 0.16, dist);
        float innerHalo = exp(-dist * dist * 6.5) * 0.36 * vGoldenHalo * edgeFade;
        float outerHalo = exp(-dist * dist * 2.8) * 0.20 * vGoldenHalo * edgeFade;
        vec3 goldHaloColor = vec3(1.0, 0.84, 0.38);

        float depthBright = 0.72 + 0.28 * vDepth;
        vec3 rgb =
          vColor * (core + pinFalloff) * depthBright +
          goldHaloColor * (innerHalo + outerHalo);
        float alpha = clamp(
          ((core + pinFalloff) * depthBright + innerHalo + outerHalo) * vTwinkle,
          0.0,
          1.0
        );

        gl_FragColor = vec4(rgb, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = -8;
  return { points, geo, mat };
}

export function PlanetaryViewport({
  pageMode,
  selectedPlanet,
  isRotating,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  selectedPlaceId,
  earthPinScope = 'all',
  onSelectPlanet,
  onSelectPlace,
  onWebglError,
}: PlanetaryViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const pageModeRef = useRef<PageMode>(pageMode);
  const selectedPlanetRef = useRef<PlanetId | null>(selectedPlanet);
  const isRotatingRef = useRef<boolean>(isRotating);
  const rotationSpeedRef = useRef<RotationSpeedPreset>(rotationSpeed);
  const selectedPlaceIdRef = useRef<string | null>(selectedPlaceId);
  const earthPinScopeRef = useRef<EarthPinScope>(earthPinScope);
  const onSelectPlanetRef = useRef(onSelectPlanet);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onWebglErrorRef = useRef(onWebglError);

  const cameraTransitionActiveRef = useRef<boolean>(true);

  useEffect(() => {
    const prevPage = pageModeRef.current;
    const prevPlanet = selectedPlanetRef.current;
    pageModeRef.current = pageMode;
    selectedPlanetRef.current = selectedPlanet;
    isRotatingRef.current = isRotating;
    rotationSpeedRef.current = rotationSpeed;
    if (prevPage !== pageMode || prevPlanet !== selectedPlanet) {
      cameraTransitionActiveRef.current = true;
    }
  }, [pageMode, selectedPlanet, isRotating, rotationSpeed]);

  useEffect(() => {
    selectedPlaceIdRef.current = selectedPlaceId;
  }, [selectedPlaceId]);

  useEffect(() => {
    earthPinScopeRef.current = earthPinScope;
  }, [earthPinScope]);

  useEffect(() => {
    onSelectPlanetRef.current = onSelectPlanet;
    onSelectPlaceRef.current = onSelectPlace;
    onWebglErrorRef.current = onWebglError;
  }, [onSelectPlanet, onSelectPlace, onWebglError]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    container.dataset.nasaTexturesReady = 'false';

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
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
      onWebglErrorRef.current?.('WebGL context could not be initialized in this browser.');
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x030408, 1);

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'planetary-webgl-canvas');
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onWebglErrorRef.current?.('WebGL rendering context was interrupted.');
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030408);

    // Subtle physical IBL reflections on Earth oceans & telemetry pins
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.045;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 320);
    camera.position.copy(HUB_CAM_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HUB_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.9;
    controls.maxDistance = 24;
    controls.enablePan = true;

    controls.addEventListener('start', () => {
      cameraTransitionActiveRef.current = false;
    });

    // Dramatic Telluric Atlas solar terminator lighting matching SUN_DIRECTION (-6, 2.5, 4)
    const sunLight = new THREE.DirectionalLight(0xfff6e5, 3.8);
    sunLight.position.copy(SUN_DIRECTION).multiplyScalar(18);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x04070f, 0.14);
    scene.add(ambientLight);

    const hemiFill = new THREE.HemisphereLight(0x3a64a8, 0x05070e, 0.12);
    scene.add(hemiFill);

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const bumpWidth = isSoftwareGl ? 1024 : 2048;
    const bumpHeight = isSoftwareGl ? 512 : 1024;
    const sphereSegW = isSoftwareGl ? 72 : 128;
    const sphereSegH = isSoftwareGl ? 72 : 128;

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];
    const disposableTextures: THREE.Texture[] = [];
    const loadedSets: PlanetNasaTextures[] = [];

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const pulseAmpScale = prefersReducedMotion ? 0 : 1;

    // Ultra-realistic deep space dome: nebulae, Milky Way dust lanes, distant galaxies,
    // solar corona scatter, and occasional shooting stars (star points consolidated below)
    const deepSpace = createDeepSpaceEnvironment(isSoftwareGl, { includeStarLayers: false });
    scene.add(deepSpace.root);

    // Consolidated GPU depth-parallax starfield with soft glowing halos for golden stars
    const backgroundStarfield = createBackgroundStarfield(
      isSoftwareGl,
      pulseAmpScale,
      renderer.getPixelRatio()
    );
    scene.add(backgroundStarfield.points);
    disposableGeometries.push(backgroundStarfield.geo);
    disposableMaterials.push(backgroundStarfield.mat);

    const pinStemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.135, 8);
    const pinHeadGeo = new THREE.SphereGeometry(0.038, 12, 12);
    const pinHaloGeo = new THREE.RingGeometry(0.048, 0.082, 20);
    disposableGeometries.push(pinStemGeo, pinHeadGeo, pinHaloGeo);

    const earthFallback = createSolidFallbackTexture(0x132b4f);
    const marsFallback = createSolidFallbackTexture(0x7c3b21);
    const moonFallback = createSolidFallbackTexture(0x4b4e54);
    disposableTextures.push(earthFallback, marsFallback, moonFallback);

    // ====================
    // 0. GIANT SECONDARY HORIZON BACKDROP SPHERE (Dedicated Destination Pages)
    // ====================
    const backdropGeo = new THREE.SphereGeometry(6.5, 88, 64);
    const backdropMat = new THREE.MeshStandardMaterial({
      color: 0x5d6a80,
      map: earthFallback,
      roughness: 0.94,
      metalness: 0.0,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    });
    const backdropSphere = new THREE.Mesh(backdropGeo, backdropMat);
    backdropSphere.position.set(4.1, -0.3, -6.4);
    backdropSphere.rotation.y = -0.25;
    backdropSphere.visible = false;
    backdropSphere.renderOrder = -1;
    scene.add(backdropSphere);
    disposableGeometries.push(backdropGeo);
    disposableMaterials.push(backdropMat);

    // ====================
    // 1. EARTH COMPOSITE GROUP (Radius = 1.65)
    // ====================
    const earthRoot = new THREE.Group();
    earthRoot.position.copy(HUB_EARTH_POS);
    scene.add(earthRoot);

    const earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.z = THREE.MathUtils.degToRad(23.44);
    earthRoot.add(earthTiltGroup);

    const earthSpinGroup = new THREE.Group();
    earthSpinGroup.rotation.y = -0.62;
    earthTiltGroup.add(earthSpinGroup);

    const earthSurfaceUniforms: EarthSurfaceShaderUniforms = {
      uNightMap: { value: earthFallback },
      uCloudMap: { value: earthFallback },
      uCloudShadowShift: { value: 0 },
      uCloudDriftB: { value: 0 },
      uSunDir: { value: SUN_DIRECTION.clone() },
    };
    const earthGeo = new THREE.SphereGeometry(PLANET_RADIUS, sphereSegW, sphereSegH);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: earthFallback,
      bumpScale: 0.04,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.88,
      metalness: 0.04,
    });
    earthMat.customProgramCacheKey = () => 'earth-surface-v2';
    applyEarthSurfaceShaders(earthMat, earthSurfaceUniforms);

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.userData.planetId = 'earth';
    earthSpinGroup.add(earthMesh);

    const earthCloudGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.013, sphereSegW, sphereSegH);
    const earthCloudMat = createAnimatedCloudMaterial(earthFallback);
    const earthClouds = new THREE.Mesh(earthCloudGeo, earthCloudMat);
    earthClouds.userData.planetId = 'earth';
    earthClouds.visible = false;
    earthClouds.renderOrder = 1;
    earthTiltGroup.add(earthClouds);

    const earthAtmoGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.008, 64, 48);
    const earthAtmoMat = createAtmosphereMaterial({
      baseColorHex: 0x33a6ff,
      glowColorHex: 0x00e5ff,
      intensity: 0.52,
      power: 3.8,
      pulseSpeed: 1.35,
      pulseAmplitude: 0.14 * pulseAmpScale,
      phaseOffset: 0.0,
    });
    const earthAtmo = new THREE.Mesh(earthAtmoGeo, earthAtmoMat);
    earthTiltGroup.add(earthAtmo);

    const earthCoronaGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.15, 48, 36);
    const earthCoronaMat = createOuterCoronaMaterial({
      baseColorHex: 0x33a6ff,
      glowColorHex: 0x00e5ff,
      intensity: 0.42,
      power: 3.8,
      pulseSpeed: 1.35,
      pulseAmplitude: 0.16 * pulseAmpScale,
      phaseOffset: 0.0,
      edgeScale: 2.02,
    });
    const earthCorona = new THREE.Mesh(earthCoronaGeo, earthCoronaMat);
    earthTiltGroup.add(earthCorona);

    const earthParallaxGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.036, 48, 36);
    const earthParallaxMat = createParallaxShellMaterial({
      baseColorHex: 0x33a6ff,
      glowColorHex: 0x00e5ff,
      intensity: 0.34,
      phaseOffset: 0.5,
    });
    const earthParallax = new THREE.Mesh(earthParallaxGeo, earthParallaxMat);
    earthParallax.renderOrder = 2;
    earthTiltGroup.add(earthParallax);

    disposableGeometries.push(earthGeo, earthCloudGeo, earthAtmoGeo, earthCoronaGeo, earthParallaxGeo);
    disposableMaterials.push(earthMat, earthCloudMat, earthAtmoMat, earthCoronaMat, earthParallaxMat);

    const earthPins = buildPlacePins(
      EARTH_ANALOGUE_PINS,
      PLANET_RADIUS,
      0x00e5ff,
      0xff9100,
      pinStemGeo,
      pinHeadGeo,
      pinHaloGeo,
      disposableMaterials
    );
    earthSpinGroup.add(earthPins.container);

    // ====================
    // 2. MARS COMPOSITE GROUP (Radius = 1.65)
    // ====================
    const marsRoot = new THREE.Group();
    marsRoot.position.copy(HUB_MARS_POS);
    scene.add(marsRoot);

    const marsTiltGroup = new THREE.Group();
    marsTiltGroup.rotation.z = THREE.MathUtils.degToRad(25.19);
    marsRoot.add(marsTiltGroup);

    const marsSpinGroup = new THREE.Group();
    marsSpinGroup.rotation.y = 2.45;
    marsTiltGroup.add(marsSpinGroup);

    const marsGeo = new THREE.SphereGeometry(PLANET_RADIUS, sphereSegW, sphereSegH);
    const marsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: marsFallback,
      bumpScale: 0.07,
      roughness: 0.92,
      metalness: 0.02,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.userData.planetId = 'mars';
    marsSpinGroup.add(marsMesh);

    const marsAtmoGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.008, 64, 48);
    const marsAtmoMat = createAtmosphereMaterial({
      baseColorHex: 0xe06b38,
      glowColorHex: 0xff9100,
      intensity: 0.36,
      power: 4.2,
      pulseSpeed: 1.15,
      pulseAmplitude: 0.14 * pulseAmpScale,
      phaseOffset: 2.1,
    });
    const marsAtmo = new THREE.Mesh(marsAtmoGeo, marsAtmoMat);
    marsTiltGroup.add(marsAtmo);

    const marsCoronaGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.14, 48, 36);
    const marsCoronaMat = createOuterCoronaMaterial({
      baseColorHex: 0xe06b38,
      glowColorHex: 0xff9100,
      intensity: 0.3,
      power: 4.2,
      pulseSpeed: 1.15,
      pulseAmplitude: 0.16 * pulseAmpScale,
      phaseOffset: 2.1,
      edgeScale: 2.08,
    });
    const marsCorona = new THREE.Mesh(marsCoronaGeo, marsCoronaMat);
    marsTiltGroup.add(marsCorona);

    const marsParallaxGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.036, 48, 36);
    const marsParallaxMat = createParallaxShellMaterial({
      baseColorHex: 0xe06b38,
      glowColorHex: 0xff9100,
      intensity: 0.28,
      phaseOffset: 2.4,
    });
    const marsParallax = new THREE.Mesh(marsParallaxGeo, marsParallaxMat);
    marsParallax.renderOrder = 2;
    marsTiltGroup.add(marsParallax);

    disposableGeometries.push(marsGeo, marsAtmoGeo, marsCoronaGeo, marsParallaxGeo);
    disposableMaterials.push(marsMat, marsAtmoMat, marsCoronaMat, marsParallaxMat);

    const marsPins = buildPlacePins(
      MARS_PLACES,
      PLANET_RADIUS,
      0xff9100,
      0xff5722,
      pinStemGeo,
      pinHeadGeo,
      pinHaloGeo,
      disposableMaterials
    );
    marsSpinGroup.add(marsPins.container);

    // ====================
    // 3. THE MOON COMPOSITE GROUP (Radius = 1.65)
    // ====================
    const moonRoot = new THREE.Group();
    moonRoot.position.copy(HUB_MOON_POS);
    scene.add(moonRoot);

    const moonTiltGroup = new THREE.Group();
    moonTiltGroup.rotation.z = THREE.MathUtils.degToRad(6.68);
    moonRoot.add(moonTiltGroup);

    const moonSpinGroup = new THREE.Group();
    moonSpinGroup.rotation.y = -1.42;
    moonTiltGroup.add(moonSpinGroup);

    const moonGeo = new THREE.SphereGeometry(PLANET_RADIUS, sphereSegW, sphereSegH);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: moonFallback,
      bumpScale: 0.09,
      roughness: 0.96,
      metalness: 0.0,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.userData.planetId = 'moon';
    moonSpinGroup.add(moonMesh);

    const moonHaloGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.006, 48, 36);
    const moonHaloMat = createAtmosphereMaterial({
      baseColorHex: 0xd6dee8,
      glowColorHex: 0xb388ff,
      intensity: 0.14,
      power: 4.0,
      pulseSpeed: 1.05,
      pulseAmplitude: 0.14 * pulseAmpScale,
      phaseOffset: 4.2,
    });
    const moonHalo = new THREE.Mesh(moonHaloGeo, moonHaloMat);
    moonTiltGroup.add(moonHalo);

    const moonCoronaGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.11, 40, 28);
    const moonCoronaMat = createOuterCoronaMaterial({
      baseColorHex: 0xb8c4d4,
      glowColorHex: 0x9fa8da,
      intensity: 0.11,
      power: 4.0,
      pulseSpeed: 1.05,
      pulseAmplitude: 0.16 * pulseAmpScale,
      phaseOffset: 4.2,
      edgeScale: 2.32,
    });
    const moonCorona = new THREE.Mesh(moonCoronaGeo, moonCoronaMat);
    moonTiltGroup.add(moonCorona);

    const moonParallaxGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.036, 48, 36);
    const moonParallaxMat = createParallaxShellMaterial({
      baseColorHex: 0xd6dee8,
      glowColorHex: 0x9fa8da,
      intensity: 0.17,
      phaseOffset: 4.5,
    });
    const moonParallax = new THREE.Mesh(moonParallaxGeo, moonParallaxMat);
    moonParallax.renderOrder = 2;
    moonTiltGroup.add(moonParallax);

    disposableGeometries.push(moonGeo, moonHaloGeo, moonCoronaGeo, moonParallaxGeo);
    disposableMaterials.push(moonMat, moonHaloMat, moonCoronaMat, moonParallaxMat);

    const moonPins = buildPlacePins(
      MOON_PLACES,
      PLANET_RADIUS,
      0xb388ff,
      0xe0e6ed,
      pinStemGeo,
      pinHeadGeo,
      pinHaloGeo,
      disposableMaterials
    );
    moonSpinGroup.add(moonPins.container);

    let disposed = false;

    let earthNasaRef: PlanetNasaTextures | null = null;
    let marsNasaRef: PlanetNasaTextures | null = null;
    let moonNasaRef: PlanetNasaTextures | null = null;

    // Load real 2K NASA maps asynchronously with CORS enabled
    Promise.allSettled([
      loadEarthNasaTextures(maxAnisotropy, bumpWidth, bumpHeight).then((tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        earthNasaRef = tex;
        loadedSets.push(tex);
        earthMat.map = tex.map;
        earthMat.bumpMap = tex.bumpMap;
        if (tex.normalMap) earthMat.normalMap = tex.normalMap;
        if (tex.roughnessMap) {
          earthMat.roughnessMap = tex.roughnessMap;
          earthMat.roughness = 1.0;
        }
        if (tex.nightMap) earthSurfaceUniforms.uNightMap.value = tex.nightMap;
        if (tex.cloudsMap) {
          earthSurfaceUniforms.uCloudMap.value = tex.cloudsMap;
          earthCloudMat.uniforms.uCloudMap.value = tex.cloudsMap;
          earthClouds.visible = true;
        }
        earthMat.needsUpdate = true;
      }),
      loadMarsNasaTextures(maxAnisotropy, bumpWidth, bumpHeight).then((tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        marsNasaRef = tex;
        loadedSets.push(tex);
        marsMat.map = tex.map;
        marsMat.bumpMap = tex.bumpMap;
        marsMat.needsUpdate = true;
      }),
      loadMoonNasaTextures(maxAnisotropy, bumpWidth, bumpHeight).then((tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        moonNasaRef = tex;
        loadedSets.push(tex);
        moonMat.map = tex.map;
        moonMat.bumpMap = tex.bumpMap;
        moonMat.needsUpdate = true;
      }),
    ]).then(() => {
      if (!disposed) {
        container.dataset.nasaTexturesReady = 'true';
      }
    });

    const allPinEntries = [...earthPins.entries, ...marsPins.entries, ...moonPins.entries];
    const allPlaces = [...EARTH_ANALOGUE_PINS, ...MARS_PLACES, ...MOON_PLACES];

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting setup
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const raycastTargets: THREE.Object3D[] = [
      earthMesh,
      earthClouds,
      marsMesh,
      moonMesh,
      ...allPinEntries.flatMap((entry) => entry.group.children),
    ];

    let pointerDownPos = { x: 0, y: 0 };

    const updateNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const isObjectVisibleInHierarchy = (obj: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (moveDist > 7) return;

      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster
        .intersectObjects(raycastTargets, false)
        .filter((h) => isObjectVisibleInHierarchy(h.object));
      if (hits.length === 0) return;

      const hit = hits[0].object;
      const placeId = hit.userData.placeId as string | undefined;
      const planetId = hit.userData.planetId as PlanetId | undefined;

      if (placeId) {
        const matched = allPlaces.find((p) => p.id === placeId);
        if (matched) {
          isRotatingRef.current = false;
          onSelectPlaceRef.current(matched);
          return;
        }
      }

      if (planetId) {
        isRotatingRef.current = false;
        onSelectPlanetRef.current(planetId);
      }
    };

    let hoveredPlanet: PlanetId | null = null;
    container.dataset.hoveredPlanet = 'none';

    let lastHoverCheck = 0;
    const handlePointerMove = (e: PointerEvent) => {
      updateNdc(e.clientX, e.clientY);
      const now = performance.now();
      if (now - lastHoverCheck < 40) return;
      lastHoverCheck = now;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster
        .intersectObjects(raycastTargets, false)
        .filter((h) => isObjectVisibleInHierarchy(h.object));

      const nextHovered =
        hits.length > 0 ? ((hits[0].object.userData.planetId as PlanetId | undefined) ?? null) : null;
      if (nextHovered !== hoveredPlanet) {
        hoveredPlanet = nextHovered;
        container.dataset.hoveredPlanet = nextHovered ?? 'none';
      }
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const handlePointerLeave = () => {
      if (hoveredPlanet !== null) {
        hoveredPlanet = null;
        container.dataset.hoveredPlanet = 'none';
      }
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      backgroundStarfield.mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };
    window.addEventListener('resize', handleResize);

    // Pre-allocated scratch vectors (zero GC in render loop)
    const _desiredCamPos = new THREE.Vector3();
    const _desiredTarget = new THREE.Vector3();
    const _planetWorldPos = new THREE.Vector3();
    const _viewDir = new THREE.Vector3();
    const _rightVec = new THREE.Vector3();
    const _camRight = new THREE.Vector3();
    const _camUp = new THREE.Vector3();
    const _camForward = new THREE.Vector3();
    const _projCenter = new THREE.Vector3();
    const _targetParallax = new THREE.Vector2();
    const _starParallax = new THREE.Vector2();
    const _targetStarParallax = new THREE.Vector2();

    const parallaxEntries: ReadonlyArray<{
      id: PlanetId;
      root: THREE.Group;
      mat: THREE.ShaderMaterial;
      offset: THREE.Vector2;
    }> = [
      { id: 'earth', root: earthRoot, mat: earthParallaxMat, offset: new THREE.Vector2() },
      { id: 'mars', root: marsRoot, mat: marsParallaxMat, offset: new THREE.Vector2() },
      { id: 'moon', root: moonRoot, mat: moonParallaxMat, offset: new THREE.Vector2() },
    ];

    let lastTime = performance.now();
    let elapsedAtmoTime = 0;
    let cloudDriftA = 0;
    let cloudDriftB = 0;
    let frameId = 0;
    let activeBackdropPlanet: PlanetId | null = null;

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

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const mode = pageModeRef.current;
      const activePlanet = selectedPlanetRef.current;

      // Page-driven planet visibility and Telluric Atlas destination framing
      if (mode === 'earth-mars') {
        earthRoot.visible = true;
        marsRoot.visible = true;
        moonRoot.visible = false;
        marsRoot.position.copy(DUAL_LEFT_POS);
        earthRoot.position.copy(DUAL_RIGHT_POS);
        backdropSphere.visible = false;
      } else if (mode === 'earth-moon') {
        earthRoot.visible = true;
        marsRoot.visible = false;
        moonRoot.visible = true;
        moonRoot.position.copy(DUAL_LEFT_POS);
        earthRoot.position.copy(DUAL_RIGHT_POS);
        backdropSphere.visible = false;
      } else if (mode === 'earth-benchmark') {
        earthRoot.visible = true;
        marsRoot.visible = false;
        moonRoot.visible = false;
        earthRoot.position.copy(SOLO_POS);
        backdropSphere.visible = true;
        if (activeBackdropPlanet !== 'earth' || backdropMat.map !== (earthNasaRef?.map ?? earthFallback)) {
          activeBackdropPlanet = 'earth';
          backdropMat.map = earthNasaRef?.map ?? earthFallback;
          backdropMat.bumpMap = earthNasaRef?.bumpMap ?? null;
          backdropMat.bumpScale = 0.035;
          backdropMat.color.setHex(0x5d7294);
          backdropMat.needsUpdate = true;
        }
      } else if (mode === 'mars-analogues') {
        earthRoot.visible = false;
        marsRoot.visible = true;
        moonRoot.visible = false;
        marsRoot.position.copy(SOLO_POS);
        backdropSphere.visible = true;
        if (activeBackdropPlanet !== 'mars' || backdropMat.map !== (marsNasaRef?.map ?? marsFallback)) {
          activeBackdropPlanet = 'mars';
          backdropMat.map = marsNasaRef?.map ?? marsFallback;
          backdropMat.bumpMap = marsNasaRef?.bumpMap ?? null;
          backdropMat.bumpScale = 0.06;
          backdropMat.color.setHex(0x7c5446);
          backdropMat.needsUpdate = true;
        }
      } else {
        earthRoot.visible = false;
        marsRoot.visible = false;
        moonRoot.visible = true;
        moonRoot.position.copy(SOLO_POS);
        backdropSphere.visible = true;
        if (activeBackdropPlanet !== 'moon' || backdropMat.map !== (moonNasaRef?.map ?? moonFallback)) {
          activeBackdropPlanet = 'moon';
          backdropMat.map = moonNasaRef?.map ?? moonFallback;
          backdropMat.bumpMap = moonNasaRef?.bumpMap ?? null;
          backdropMat.bumpScale = 0.075;
          backdropMat.color.setHex(0x636975);
          backdropMat.needsUpdate = true;
        }
      }

      const rates = getRotationRates(rotationSpeedRef.current);
      if (isRotatingRef.current) {
        earthSpinGroup.rotation.y += dt * rates.earthSpin;
        earthClouds.rotation.y += dt * rates.earthCloudsSpin;
        marsSpinGroup.rotation.y += dt * rates.marsSpin;
        moonSpinGroup.rotation.y += dt * rates.moonSpin;

        cloudDriftA = (cloudDriftA + dt * rates.cloudAdvectA) % 1;
        cloudDriftB = (cloudDriftB + dt * rates.cloudAdvectB) % 1;
      }

      // Synchronize multi-stream drifting clouds + real-time surface cloud shadows
      earthCloudMat.uniforms.uCloudDriftA.value = cloudDriftA;
      earthCloudMat.uniforms.uCloudDriftB.value = cloudDriftB;
      earthSurfaceUniforms.uCloudShadowShift.value =
        (earthSpinGroup.rotation.y - earthClouds.rotation.y) / (Math.PI * 2) + cloudDriftA;
      earthSurfaceUniforms.uCloudDriftB.value = cloudDriftB;

      // Drive subtle pulsating atmospheric glow shaders + deep cosmos background + GPU parallax starfield
      elapsedAtmoTime += dt;
      deepSpace.update(dt, elapsedAtmoTime, pointerNdc.x, pointerNdc.y, SUN_DIRECTION);

      camera.matrixWorld.extractBasis(_camRight, _camUp, _camForward);
      const starDamp = 1 - Math.exp(-5.5 * dt);
      _targetStarParallax.set(
        THREE.MathUtils.clamp(pointerNdc.x, -1, 1),
        THREE.MathUtils.clamp(pointerNdc.y, -1, 1)
      );
      _starParallax.lerp(_targetStarParallax, starDamp);
      backgroundStarfield.mat.uniforms.uTime.value = elapsedAtmoTime;
      backgroundStarfield.mat.uniforms.uParallax.value.copy(_starParallax);
      backgroundStarfield.mat.uniforms.uCameraRight.value.copy(_camRight);
      backgroundStarfield.mat.uniforms.uCameraUp.value.copy(_camUp);

      earthAtmoMat.uniforms.uTime.value = elapsedAtmoTime;
      earthCoronaMat.uniforms.uTime.value = elapsedAtmoTime;
      marsAtmoMat.uniforms.uTime.value = elapsedAtmoTime;
      marsCoronaMat.uniforms.uTime.value = elapsedAtmoTime;
      moonHaloMat.uniforms.uTime.value = elapsedAtmoTime;
      moonCoronaMat.uniforms.uTime.value = elapsedAtmoTime;

      const boostDamp = 1 - Math.exp(-6 * dt);
      earthAtmoMat.uniforms.uActiveBoost.value +=
        ((activePlanet === 'earth' ? 1 : 0) - earthAtmoMat.uniforms.uActiveBoost.value) * boostDamp;
      earthCoronaMat.uniforms.uActiveBoost.value = earthAtmoMat.uniforms.uActiveBoost.value;
      marsAtmoMat.uniforms.uActiveBoost.value +=
        ((activePlanet === 'mars' ? 1 : 0) - marsAtmoMat.uniforms.uActiveBoost.value) * boostDamp;
      marsCoronaMat.uniforms.uActiveBoost.value = marsAtmoMat.uniforms.uActiveBoost.value;
      moonHaloMat.uniforms.uActiveBoost.value +=
        ((activePlanet === 'moon' ? 1 : 0) - moonHaloMat.uniforms.uActiveBoost.value) * boostDamp;
      moonCoronaMat.uniforms.uActiveBoost.value = moonHaloMat.uniforms.uActiveBoost.value;

      // Drive secondary transparent atmospheric parallax shell on planet hover
      const hoverDamp = 1 - Math.exp(-8 * dt);
      for (const entry of parallaxEntries) {
        entry.mat.uniforms.uTime.value = elapsedAtmoTime;
        entry.mat.uniforms.uParallaxRight.value.copy(_camRight);
        entry.mat.uniforms.uParallaxUp.value.copy(_camUp);

        const isHovered = entry.root.visible && hoveredPlanet === entry.id;
        const targetHover = isHovered ? 1 : 0;
        entry.mat.uniforms.uHoverAmount.value +=
          (targetHover - entry.mat.uniforms.uHoverAmount.value) * hoverDamp;

        if (isHovered && !prefersReducedMotion) {
          _projCenter.copy(entry.root.position).project(camera);
          _targetParallax.set(
            THREE.MathUtils.clamp((pointerNdc.x - _projCenter.x) * 3.0, -1, 1),
            THREE.MathUtils.clamp((pointerNdc.y - _projCenter.y) * 3.0, -1, 1)
          );
        } else {
          _targetParallax.set(0, 0);
        }
        entry.offset.lerp(_targetParallax, hoverDamp);
        entry.mat.uniforms.uParallaxOffset.value.copy(entry.offset);
      }

      // Surface pins visibility + Earth Benchmark filter sync
      earthPins.container.visible = earthRoot.visible;
      marsPins.container.visible = marsRoot.visible;
      moonPins.container.visible = moonRoot.visible;

      const visibleEarthIds = new Set(
        filterEarthBenchmarkPins(EARTH_ANALOGUE_PINS, earthPinScopeRef.current).map((p) => p.id)
      );

      const activePlaceId = selectedPlaceIdRef.current;
      for (const entry of allPinEntries) {
        if (entry.place.planet === 'earth') {
          if (mode === 'earth-moon') {
            entry.group.visible =
              entry.place.targetBody === 'Moon' || entry.place.targetBody === 'Mars & Moon';
          } else {
            entry.group.visible =
              mode === 'earth-mars' || visibleEarthIds.has(entry.place.id);
          }
        }
        const isActive = entry.place.id === activePlaceId;
        entry.beaconMat.emissiveIntensity = isActive ? 2.3 : 1.05;
        entry.group.scale.setScalar(isActive ? 1.44 : 1.0);
        entry.ringMat.opacity = isActive ? 1.0 : 0.78;
      }

      // Smooth damped camera focus
      if (cameraTransitionActiveRef.current) {
        const isDesktop = (container.clientWidth || window.innerWidth) >= 1024;

        if (isDualComparisonMode(mode)) {
          _desiredCamPos.copy(DUAL_CAM_POS);
          _desiredTarget.copy(DUAL_TARGET);
        } else {
          // Dedicated destination split layout: planet sits heroically in the left 52% showcase with full margin on all sides
          _planetWorldPos.copy(SOLO_POS);
          _desiredCamPos.set(0.32, 0.45, 6.45);
          _viewDir.copy(_planetWorldPos).sub(_desiredCamPos).normalize();
          _rightVec.crossVectors(_viewDir, camera.up).normalize();
          _desiredTarget
            .copy(_planetWorldPos)
            .addScaledVector(_rightVec, isDesktop ? 1.62 : 0.0);
        }

        const dampAlpha = 1 - Math.exp(-6.2 * dt);
        camera.position.lerp(_desiredCamPos, dampAlpha);
        controls.target.lerp(_desiredTarget, dampAlpha);

        if (
          camera.position.distanceTo(_desiredCamPos) < 0.025 &&
          controls.target.distanceTo(_desiredTarget) < 0.025
        ) {
          camera.position.copy(_desiredCamPos);
          controls.target.copy(_desiredTarget);
          cameraTransitionActiveRef.current = false;
        }
      } else if (
        rates.cinematicDrift > 0 &&
        !prefersReducedMotion &&
        isDualComparisonMode(mode)
      ) {
        camera.position.x += Math.cos(elapsedAtmoTime * 0.28) * 0.18 * dt * rates.cinematicDrift;
        camera.position.y += Math.sin(elapsedAtmoTime * 0.21) * 0.09 * dt * rates.cinematicDrift;
      }

      controls.update();
      renderer.render(scene, camera);

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
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      deepSpace.dispose();
      envTarget.dispose();
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      loadedSets.forEach((set) => set.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full select-none"
      aria-label="Interactive 3D planetary viewport"
    />
  );
}
