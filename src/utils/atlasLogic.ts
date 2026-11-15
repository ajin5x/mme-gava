import {
  DUAL_COMPARISON_SPECS,
  EARTH_ANALOGUE_PINS,
  LITERATURE_CARDS,
  MARS_EARTH_ANALOGUE_SITES,
  MARS_PLACES,
  MOON_EARTH_ANALOGUE_SITES,
  MOON_PLACES,
  PAGE_ROUTES,
  PLANET_DATASETS,
  type AnalogueEarthSite,
  type DualComparisonSpec,
  type LiteratureCard,
  type PageMode,
  type PlanetId,
  type PlanetPlace,
  type RotationSpeedPreset,
} from '../data/planetaryAtlasData';

export interface AtlasFilterOptions {
  query: string;
  citationFilter: string | null;
  planetFilter: PlanetId | 'all';
}

export type EarthPinScope = 'all' | 'shared' | 'mars-only';

export interface LivePlanetTelemetry {
  temperatureC: number;
  temperatureK: number;
  localSolarTimeLabel: string;
  diurnalPhaseLabel: string;
  gravityDisplay: string;
  pressureDisplay: string;
  atmosphereDisplay: string;
  dayLengthDisplay: string;
  axialTiltDisplay: string;
}

/**
 * Extracts all unique normalized citation badges sorted alphabetically.
 */
export function getUniqueCitations(cards: LiteratureCard[] = LITERATURE_CARDS): string[] {
  const seen = new Map<string, string>();
  for (const card of cards) {
    for (const cite of card.citations) {
      const key = cite.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.set(key, key);
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

/**
 * Filters literature cards by free-text keyword, citation badge, and optional planet scope.
 */
export function filterLiteratureCards(
  cards: LiteratureCard[],
  options: AtlasFilterOptions
): LiteratureCard[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  const normalizedCitation = options.citationFilter
    ? options.citationFilter.trim().toLowerCase()
    : null;

  return cards.filter((card) => {
    if (options.planetFilter !== 'all' && card.planet !== options.planetFilter) {
      return false;
    }

    if (normalizedCitation) {
      const hasCitation = card.citations.some(
        (c) => c.trim().toLowerCase() === normalizedCitation
      );
      if (!hasCitation) return false;
    }

    if (normalizedQuery) {
      const haystack = [
        card.title,
        card.body,
        card.tabLabel,
        card.planet,
        card.coordinates ?? '',
        ...card.citations,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes deterministic live temperature & local solar telemetry for any planet or specific place
 * using real diurnal bounds and longitude solar-hour offset.
 */
export function computeLivePlanetTelemetry(
  planet: PlanetId,
  place: PlanetPlace | null,
  timestampMs: number
): LivePlanetTelemetry {
  const ds = PLANET_DATASETS[planet];
  const lon = place?.lon ?? 0;

  // Cycle rate gives visible smooth diurnal progression while staying physically bounded
  const cycleSeconds = planet === 'moon' ? 96 : 60;
  const baseHours = ((timestampMs / 1000) / cycleSeconds) * 24;
  const lonOffsetHours = (lon / 360) * 24;
  const localHour = ((baseHours + lonOffsetHours) % 24 + 24) % 24;

  const hh = Math.floor(localHour);
  const mm = Math.floor((localHour - hh) * 60);
  const localSolarTimeLabel = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} LST`;

  // Thermal peak around 14:00 LST, trough around 04:00 LST
  const phaseRad = ((localHour - 14) / 24) * Math.PI * 2;
  const insolation = (Math.cos(phaseRad) + 1) * 0.5; // 0..1

  const minC = place?.tempMinC ?? ds.telemetry.tempMinC;
  const maxC = place?.tempMaxC ?? ds.telemetry.tempMaxC;

  const temperatureC =
    place?.constantTempC !== undefined
      ? place.constantTempC
      : Math.round((minC + (maxC - minC) * insolation) * 10) / 10;

  const temperatureK = Math.round((temperatureC + 273.15) * 10) / 10;

  const diurnalPhaseLabel =
    place?.constantTempC !== undefined
      ? 'Subsurface Constant Thermal Zone'
      : localHour >= 6 && localHour < 18
      ? 'Solar Illumination (Day)'
      : 'Thermal Radiation Cooling (Night)';

  return {
    temperatureC,
    temperatureK,
    localSolarTimeLabel,
    diurnalPhaseLabel,
    gravityDisplay: `${ds.telemetry.gravity} (${ds.telemetry.gravityG})`,
    pressureDisplay: ds.telemetry.pressure,
    atmosphereDisplay: ds.telemetry.atmosphere,
    dayLengthDisplay: ds.telemetry.dayLength,
    axialTiltDisplay: ds.telemetry.axialTilt,
  };
}

/**
 * Converts geographic latitude / longitude (degrees) to 3D Cartesian coordinates
 * matching Three.js SphereGeometry UV mapping (theta/phi equirectangular projection).
 */
export function latLonToSpherePosition(
  latDeg: number,
  lonDeg: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lonDeg + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}

export function pathToPageMode(pathname: string): PageMode {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/earth-mars') return 'earth-mars';
  if (clean === '/earth-moon') return 'earth-moon';
  if (clean === '/earth-benchmark' || clean === '/earth') return 'earth-benchmark';
  if (clean === '/mars-analogues' || clean === '/mars') return 'mars-analogues';
  if (clean === '/moon-analogues' || clean === '/moon') return 'moon-analogues';
  const match = PAGE_ROUTES.find((r) => r.path === clean);
  return match ? match.mode : 'earth-mars';
}

export function pageModeToPath(mode: PageMode): string {
  const match = PAGE_ROUTES.find((r) => r.mode === mode);
  return match ? match.path : '/earth-mars';
}

export function pageModeToPlanet(mode: PageMode): PlanetId | null {
  const match = PAGE_ROUTES.find((r) => r.mode === mode);
  return match ? match.planet : null;
}

export function planetToPageMode(planet: PlanetId): PageMode {
  if (planet === 'earth') return 'earth-benchmark';
  if (planet === 'mars') return 'mars-analogues';
  return 'moon-analogues';
}

export function isDualComparisonMode(mode: PageMode): mode is 'earth-mars' | 'earth-moon' {
  return mode === 'earth-mars' || mode === 'earth-moon';
}

export function filterEarthBenchmarkPins(
  pins: PlanetPlace[],
  scope: EarthPinScope
): PlanetPlace[] {
  if (scope === 'shared') {
    return pins.filter((p) => p.targetBody === 'Mars & Moon');
  }
  if (scope === 'mars-only') {
    return pins.filter((p) => p.targetBody === 'Mars');
  }
  return pins;
}

export const DEFAULT_ROTATION_SPEED: RotationSpeedPreset = 'fast';

export interface PlanetRotationRates {
  earthSpin: number;
  marsSpin: number;
  moonSpin: number;
  earthCloudsSpin: number;
  cloudAdvectA: number;
  cloudAdvectB: number;
  cinematicDrift: number;
}

const SPEED_MULTIPLIERS: Record<RotationSpeedPreset, number> = {
  slow: 0.4,
  normal: 0.75,
  fast: 1.0,
  cinematic: 0.6,
};

/**
 * Computes frame-rate independent angular speeds (rad/s).
 * Multipliers relative to fast setting: Earth 2x, Mars 2x, Moon 1.8x, Earth clouds 2.5x.
 */
export function getRotationRates(preset: RotationSpeedPreset): PlanetRotationRates {
  const m = SPEED_MULTIPLIERS[preset];
  return {
    earthSpin: 0.8 * m,
    marsSpin: 0.58 * m,
    moonSpin: 0.378 * m,
    earthCloudsSpin: 1.5625 * m,
    cloudAdvectA: 0.035 * m,
    cloudAdvectB: 0.022 * m,
    cinematicDrift: preset === 'cinematic' ? 1.0 : 0.0,
  };
}

export interface DualPageDataset {
  spec: DualComparisonSpec;
  earthPlaces: PlanetPlace[];
  rightPlaces: PlanetPlace[];
  analogueSites: AnalogueEarthSite[];
}

export function getDualPageDataset(mode: 'earth-mars' | 'earth-moon'): DualPageDataset {
  const spec = DUAL_COMPARISON_SPECS[mode];
  if (mode === 'earth-mars') {
    const marsEarthPins = EARTH_ANALOGUE_PINS.filter(
      (p) => p.targetBody === 'Mars' || p.targetBody === 'Mars & Moon'
    );
    return {
      spec,
      earthPlaces: marsEarthPins,
      rightPlaces: MARS_PLACES,
      analogueSites: MARS_EARTH_ANALOGUE_SITES,
    };
  }
  const moonEarthPins = EARTH_ANALOGUE_PINS.filter(
    (p) => p.targetBody === 'Moon' || p.targetBody === 'Mars & Moon'
  );
  return {
    spec,
    earthPlaces: moonEarthPins,
    rightPlaces: MOON_PLACES,
    analogueSites: MOON_EARTH_ANALOGUE_SITES,
  };
}

const CUSTOM_PLACE_SLUGS: Record<string, string> = {
  'mars-place-olympus': 'olympus-mons',
  'mars-place-valles': 'valles-marineris',
  'mars-place-gale': 'gale-crater',
  'mars-place-jezero': 'jezero-crater',
  'mars-place-polar': 'polar-ice-caps',
  'mars-place-eberswalde': 'eberswalde-crater',
  'moon-place-imbrium': 'mare-imbrium',
  'moon-place-tycho': 'tycho-crater',
  'moon-place-copernicus': 'copernicus-crater',
  'moon-place-tranquility': 'sea-of-tranquility',
  'moon-place-southpole': 'lunar-south-pole',
  'moon-place-aitken': 'south-pole-aitken-basin',
};

export function placeToSlug(place: PlanetPlace): string {
  if (CUSTOM_PLACE_SLUGS[place.id]) {
    return CUSTOM_PLACE_SLUGS[place.id];
  }
  return place.name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function placeToDetailPath(place: PlanetPlace): string {
  const base = place.planet === 'moon' ? '/moon-analogues' : '/mars-analogues';
  return `${base}/${placeToSlug(place)}`;
}

export function findPlaceByDetailPath(
  pathname: string,
  places: PlanetPlace[] = [...MARS_PLACES, ...MOON_PLACES]
): PlanetPlace | null {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const prefix = parts[0];
  if (prefix !== 'mars-analogues' && prefix !== 'moon-analogues') return null;
  const slug = parts[1].toLowerCase();
  const expectedPlanet: PlanetId = prefix === 'moon-analogues' ? 'moon' : 'mars';

  return (
    places.find((p) => {
      if (p.planet !== expectedPlanet) return false;
      const canonical = placeToSlug(p);
      const shortId = p.id.replace(/^(mars|moon)-place-/, '');
      return canonical === slug || shortId === slug || p.id.toLowerCase() === slug;
    }) ?? null
  );
}




