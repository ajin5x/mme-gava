import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EARTH_ANALOGUE_PINS,
  LITERATURE_CARDS,
  MARS_EARTH_ANALOGUE_SITES,
  MARS_PLACES,
  MOON_EARTH_ANALOGUE_SITES,
  MOON_PLACES,
  PLANET_DATASETS,
  PLANET_PLACES_BY_ID,
} from '../data/planetaryAtlasData';
import {
  computeLivePlanetTelemetry,
  DEFAULT_ROTATION_SPEED,
  filterEarthBenchmarkPins,
  filterLiteratureCards,
  findPlaceByDetailPath,
  getDualPageDataset,
  getRotationRates,
  getUniqueCitations,
  isDualComparisonMode,
  latLonToSpherePosition,
  pageModeToPath,
  pageModeToPlanet,
  pathToPageMode,
  placeToDetailPath,
  planetToPageMode,
} from './atlasLogic';

test('all 17 curated scientific literature cards, planet places, and destination Earth sites are present', () => {
  assert.equal(LITERATURE_CARDS.length, 17);
  assert.equal(EARTH_ANALOGUE_PINS.length, 8);
  assert.equal(MARS_PLACES.length, 6);
  assert.equal(MOON_PLACES.length, 6);
  assert.equal(MOON_EARTH_ANALOGUE_SITES.length, 5);
  assert.equal(MARS_EARTH_ANALOGUE_SITES.length, 4);
  assert.equal(Object.keys(PLANET_DATASETS).length, 3);
  assert.equal(Object.keys(PLANET_PLACES_BY_ID).length, 3);
});

test('getUniqueCitations normalizes wikipedia/Wikipedia and lists expected sources', () => {
  const citations = getUniqueCitations(LITERATURE_CARDS);
  assert.ok(citations.includes('frontiersin'));
  assert.ok(citations.includes('nasa'));
  assert.ok(citations.includes('arxiv'));
  assert.ok(citations.includes('wikipedia'));
  assert.equal(
    citations.filter((c) => c.toLowerCase() === 'wikipedia').length,
    1
  );
});

test('filterLiteratureCards filters by keyword across Mars, Moon, and Earth', () => {
  const perchlorateMatches = filterLiteratureCards(LITERATURE_CARDS, {
    query: 'perchlorate',
    citationFilter: null,
    planetFilter: 'all',
  });
  assert.equal(perchlorateMatches.length, 2);
  assert.ok(perchlorateMatches.every((c) => c.planet === 'mars'));

  const lavaTubeMatches = filterLiteratureCards(LITERATURE_CARDS, {
    query: 'lava tubes',
    citationFilter: null,
    planetFilter: 'all',
  });
  assert.equal(lavaTubeMatches.length, 1);
  assert.equal(lavaTubeMatches[0].id, 'moon-lava-tubes');
});

test('computeLivePlanetTelemetry keeps temperatures within planet/place bounds and handles constant thermal zones', () => {
  const marsPlace = MARS_PLACES[0];
  const marsTelemetry = computeLivePlanetTelemetry('mars', marsPlace, 1_700_000_000_000);
  assert.ok(marsTelemetry.temperatureC >= marsPlace.tempMinC);
  assert.ok(marsTelemetry.temperatureC <= marsPlace.tempMaxC);
  assert.equal(marsTelemetry.gravityDisplay, '3.72 m/s² (0.38 g)');

  const constantThermalZone = { ...MOON_PLACES[0], constantTempC: -20 };
  const tubeTelemetryA = computeLivePlanetTelemetry('moon', constantThermalZone, 1000);
  const tubeTelemetryB = computeLivePlanetTelemetry('moon', constantThermalZone, 30_000);
  assert.equal(tubeTelemetryA.temperatureC, -20);
  assert.equal(tubeTelemetryB.temperatureC, -20);
  assert.equal(tubeTelemetryA.diurnalPhaseLabel, 'Subsurface Constant Thermal Zone');
});

test('latLonToSpherePosition places points accurately on sphere radius', () => {
  const radius = 1.65;
  for (const pin of [...EARTH_ANALOGUE_PINS, ...MARS_PLACES, ...MOON_PLACES]) {
    const pos = latLonToSpherePosition(pin.lat, pin.lon, radius);
    const dist = Math.hypot(pos.x, pos.y, pos.z);
    assert.ok(Math.abs(dist - radius) < 1e-6);
  }
});

test('route helpers map seamlessly across Dual Comparisons, Planet Analogue routes, and Place Detail routes', () => {
  assert.equal(pathToPageMode('/'), 'earth-mars');
  assert.equal(pathToPageMode('/earth-mars'), 'earth-mars');
  assert.equal(pathToPageMode('/earth-moon'), 'earth-moon');
  assert.equal(pathToPageMode('/moon-analogues/'), 'moon-analogues');
  assert.equal(pathToPageMode('/mars-analogues'), 'mars-analogues');
  assert.equal(pathToPageMode('/earth-benchmark'), 'earth-benchmark');
  assert.equal(pathToPageMode('/earth'), 'earth-benchmark');
  assert.equal(pathToPageMode('/mars'), 'mars-analogues');
  assert.equal(pathToPageMode('/moon'), 'moon-analogues');
  assert.equal(pathToPageMode('/unknown-route'), 'earth-mars');

  assert.equal(pageModeToPath('earth-mars'), '/earth-mars');
  assert.equal(pageModeToPath('earth-moon'), '/earth-moon');
  assert.equal(pageModeToPath('moon-analogues'), '/moon-analogues');
  assert.equal(pageModeToPlanet('mars-analogues'), 'mars');
  assert.equal(pageModeToPlanet('earth-mars'), null);
  assert.equal(isDualComparisonMode('earth-mars'), true);
  assert.equal(isDualComparisonMode('earth-moon'), true);
  assert.equal(planetToPageMode('moon'), 'moon-analogues');
  assert.equal(planetToPageMode('mars'), 'mars-analogues');
  assert.equal(planetToPageMode('earth'), 'earth-benchmark');

  const olympus = MARS_PLACES.find((p) => p.id === 'mars-place-olympus')!;
  assert.equal(placeToDetailPath(olympus), '/mars-analogues/olympus-mons');
  assert.equal(findPlaceByDetailPath('/mars-analogues/olympus-mons')?.id, 'mars-place-olympus');
  assert.equal(findPlaceByDetailPath('/mars-analogues/valles-marineris')?.id, 'mars-place-valles');
  assert.equal(findPlaceByDetailPath('/mars-analogues/jezero-crater')?.id, 'mars-place-jezero');
  assert.equal(findPlaceByDetailPath('/mars-analogues/gale-crater')?.id, 'mars-place-gale');
  assert.equal(findPlaceByDetailPath('/mars-analogues/eberswalde-crater')?.id, 'mars-place-eberswalde');

  assert.equal(findPlaceByDetailPath('/moon-analogues/mare-imbrium')?.id, 'moon-place-imbrium');
  assert.equal(findPlaceByDetailPath('/moon-analogues/tycho-crater')?.id, 'moon-place-tycho');
  assert.equal(findPlaceByDetailPath('/moon-analogues/copernicus-crater')?.id, 'moon-place-copernicus');
  assert.equal(findPlaceByDetailPath('/moon-analogues/lunar-south-pole')?.id, 'moon-place-southpole');
});

test('filterEarthBenchmarkPins separates shared Moon+Mars training sites from Mars-only sites', () => {
  const shared = filterEarthBenchmarkPins(EARTH_ANALOGUE_PINS, 'shared');
  const marsOnly = filterEarthBenchmarkPins(EARTH_ANALOGUE_PINS, 'mars-only');
  assert.equal(shared.length, 4);
  assert.equal(marsOnly.length, 4);
  assert.ok(shared.some((p) => p.name.includes('Hawaii')));
  assert.ok(shared.some((p) => p.name.includes('Iceland')));
  assert.ok(shared.some((p) => p.name.includes('Lanzarote')));
  assert.ok(shared.some((p) => p.name.includes('Svalbard')));
  assert.ok(marsOnly.some((p) => p.name.includes('Atacama')));
  assert.ok(marsOnly.some((p) => p.name.includes('McMurdo')));
});

test('getRotationRates defaults to fast preset and scales Earth clouds faster than surface rotation', () => {
  assert.equal(DEFAULT_ROTATION_SPEED, 'fast');
  const fast = getRotationRates('fast');
  const normal = getRotationRates('normal');
  const slow = getRotationRates('slow');
  const cinematic = getRotationRates('cinematic');

  assert.ok(fast.earthSpin > normal.earthSpin);
  assert.ok(normal.earthSpin > slow.earthSpin);
  assert.ok(fast.earthCloudsSpin > fast.earthSpin * 1.5);
  assert.equal(cinematic.cinematicDrift, 1.0);
  assert.equal(fast.cinematicDrift, 0.0);
});

test('getDualPageDataset pairs Earth benchmark sites with Mars or Moon places on one page', () => {
  const earthMars = getDualPageDataset('earth-mars');
  assert.equal(earthMars.spec.leftPlanet, 'mars');
  assert.equal(earthMars.spec.rightPlanet, 'earth');
  assert.equal(earthMars.earthPlaces.length, 8);
  assert.equal(earthMars.rightPlaces.length, 6);
  assert.equal(earthMars.analogueSites.length, 4);

  const earthMoon = getDualPageDataset('earth-moon');
  assert.equal(earthMoon.spec.leftPlanet, 'moon');
  assert.equal(earthMoon.spec.rightPlanet, 'earth');
  assert.equal(earthMoon.earthPlaces.length, 4);
  assert.equal(earthMoon.rightPlaces.length, 6);
  assert.equal(earthMoon.analogueSites.length, 5);
});


