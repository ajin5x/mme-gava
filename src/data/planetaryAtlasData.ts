export type PlanetId = 'earth' | 'mars' | 'moon';
export type PageMode =
  | 'earth-mars'
  | 'earth-moon'
  | 'earth-benchmark'
  | 'mars-analogues'
  | 'moon-analogues';

export type RotationSpeedPreset = 'slow' | 'normal' | 'fast' | 'cinematic';

export interface PageRouteConfig {
  mode: PageMode;
  path: string;
  code: string;
  label: string;
  planet: PlanetId | null;
}

export const PAGE_ROUTES: PageRouteConfig[] = [
  { mode: 'earth-mars', path: '/earth-mars', code: '01', label: 'Earth & Mars', planet: null },
  { mode: 'earth-moon', path: '/earth-moon', code: '02', label: 'Earth & Moon', planet: null },
  { mode: 'earth-benchmark', path: '/earth-benchmark', code: '03', label: 'Earth Page', planet: 'earth' },
  { mode: 'mars-analogues', path: '/mars-analogues', code: '04', label: 'Mars Page', planet: 'mars' },
  { mode: 'moon-analogues', path: '/moon-analogues', code: '05', label: 'Moon Page', planet: 'moon' },
];

export interface DualComparisonRow {
  label: string;
  leftValue: string;
  rightValue: string;
}

export interface DualComparisonSpec {
  mode: 'earth-mars' | 'earth-moon';
  title: string;
  subtitle: string;
  leftPlanet: PlanetId;
  rightPlanet: PlanetId;
  rows: DualComparisonRow[];
}

export const DUAL_COMPARISON_SPECS: Record<'earth-mars' | 'earth-moon', DualComparisonSpec> = {
  'earth-mars': {
    mode: 'earth-mars',
    title: 'Mars vs. Earth — Dual 3D Planetary Comparison',
    subtitle: 'Thin ~1% CO₂ dusty basalt plains compared against active hydrosphere & nitrogen-oxygen air',
    leftPlanet: 'mars',
    rightPlanet: 'earth',
    rows: [
      { label: 'Diameter', leftValue: '6,779 km (53% Earth)', rightValue: '12,742 km' },
      { label: 'Surface Gravity', leftValue: '3.72 m/s² (0.38 g)', rightValue: '9.81 m/s² (1.00 g)' },
      { label: 'Atmosphere', leftValue: '~6.1 mbar (~1%) · 95.3% CO₂', rightValue: '1,013 mbar · 78% N₂, 21% O₂' },
      { label: 'Thermal Regime', leftValue: '-125° to +20°C wide diurnal swings', rightValue: 'Buffered climate; no CO₂ dry ice' },
    ],
  },
  'earth-moon': {
    mode: 'earth-moon',
    title: 'Moon vs. Earth — Dual 3D Planetary Comparison',
    subtitle: 'Airless vacuum regolith and cratered highlands compared against dynamic biosphere and weather clouds',
    leftPlanet: 'moon',
    rightPlanet: 'earth',
    rows: [
      { label: 'Diameter', leftValue: '3,474 km (27% Earth)', rightValue: '12,742 km' },
      { label: 'Surface Gravity', leftValue: '1.62 m/s² (0.165 g)', rightValue: '9.81 m/s² (1.00 g)' },
      { label: 'Atmosphere', leftValue: 'Vacuum (~10⁻¹⁴ bar exosphere)', rightValue: '1,013 mbar · Dense weather shell' },
      { label: 'Thermal Regime', leftValue: '-173° to +127°C (-20°C in lava tubes)', rightValue: 'Ocean/atmosphere moderated' },
    ],
  },
};

export interface AnalogueEarthSite {
  id: string;
  targetPlanet: 'mars' | 'moon';
  title: string;
  location: string;
  coordinates: string;
  badge: string;
  isSharedMoonAndMars: boolean;
  summary: string;
  highlights: string[];
  citations: string[];
  linkedPlaceId?: string;
  linkedCardId?: string;
}

export interface LiteratureCard {
  id: string;
  planet: PlanetId;
  tabId: string;
  tabLabel: string;
  title: string;
  body: string;
  citations: string[];
  kind: 'site' | 'review' | 'debate' | 'gap';
  coordinates?: string;
}

export interface PlanetTab {
  id: string;
  label: string;
  isAccordion?: boolean;
}

export interface PlanetDataset {
  id: PlanetId;
  name: string;
  drawerTitle: string;
  destinationHeading: string;
  destinationSubheading: string;
  classification: string;
  meanRadius: string;
  accentPrimary: string;
  accentSecondary: string;
  telemetry: {
    axialTilt: string;
    gravity: string;
    gravityG: string;
    pressure: string;
    atmosphere: string;
    dayLength: string;
    thermalSwing: string;
    tempMinC: number;
    tempMaxC: number;
    radiationNote: string;
  };
  tabs: PlanetTab[];
}

export interface PlanetPlace {
  id: string;
  planet: PlanetId;
  name: string;
  region: string;
  lat: number;
  lon: number;
  coordLabel: string;
  targetBody: 'Mars' | 'Moon' | 'Mars & Moon' | 'Earth Analogue';
  terrainType: string;
  features: string[];
  focus: string;
  citations: string[];
  linkedCardId?: string;
  tempMinC: number;
  tempMaxC: number;
  constantTempC?: number;
  planetImage?: string;
  earthAnalogueName?: string;
  earthAnalogueImage?: string;
  earthAnalogueDescription?: string;
  scientificFacts?: string[];
  missionInfo?: string;
}

export type EarthAnaloguePin = PlanetPlace;

export interface ComparisonRow {
  metric: string;
  earth: string;
  mars: string;
  moon: string;
}

export const PLANET_DATASETS: Record<PlanetId, PlanetDataset> = {
  mars: {
    id: 'mars',
    name: 'Mars',
    drawerTitle: 'Mars Analogues: Climate, Habitability & Ancient Lakes',
    destinationHeading: 'MARS ANALOGUE SITES ON EARTH',
    destinationSubheading: 'Climate, Perchlorates, Hyper-Arid Plains & Ancient Paleolakes',
    classification: '02 · Terrestrial Planet',
    meanRadius: '3,389.5 km',
    accentPrimary: '#FF5722',
    accentSecondary: '#FF9100',
    telemetry: {
      axialTilt: '25.19°',
      gravity: '3.72 m/s²',
      gravityG: '0.38 g',
      pressure: '~1% Earth CO₂ (6.1 mbar)',
      atmosphere: '95.3% CO₂, 2.6% N₂, 1.9% Ar',
      dayLength: '24h 39m (1 Sol)',
      thermalSwing: '-125° to +20°C',
      tempMinC: -125,
      tempMaxC: 20,
      radiationNote: 'High surface UV & cosmic ionizing flux; thin CO₂ air cannot buffer daily swings',
    },
    tabs: [
      { id: 'mars-climate', label: 'Climate & Habitability Analogues' },
      { id: 'mars-lakes', label: 'Ancient Lakes & "Is There Life?"' },
    ],
  },
  moon: {
    id: 'moon',
    name: 'The Moon',
    drawerTitle: 'Moon Analogues: Terrain, Regolith & Operations',
    destinationHeading: 'MOON ANALOGUE SITES ON EARTH',
    destinationSubheading: 'Volcanic Basalt, Lava Tubes, Simulants & Astronaut Rehearsal',
    classification: '03 · Differentiated Natural Satellite',
    meanRadius: '1,737.4 km',
    accentPrimary: '#E0E6ED',
    accentSecondary: '#B388FF',
    telemetry: {
      axialTilt: '6.68°',
      gravity: '1.62 m/s²',
      gravityG: '0.165 g',
      pressure: 'Vacuum (~10⁻¹⁴ bar)',
      atmosphere: 'Surface-bounded exosphere (Vacuum)',
      dayLength: '708.7 hours (29.5 Earth days)',
      thermalSwing: '-173° to +127°C',
      tempMinC: -173,
      tempMaxC: 127,
      radiationNote: 'Unshielded solar & galactic cosmic radiation on surface; shielded inside lava tubes',
    },
    tabs: [
      { id: 'moon-operations', label: 'Terrain, Regolith & Operations' },
    ],
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    drawerTitle: 'Active Scientific Debates & Where Earth Falls Short',
    destinationHeading: 'EARTH BENCHMARK: SHARED MARS/MOON SITES & SIMULATION GAPS',
    destinationSubheading: 'Interactive Terrestrial Analogues, Active Debates & Physical Limits',
    classification: '01 · Terrestrial Hydrosphere Planet',
    meanRadius: '6,371.0 km',
    accentPrimary: '#00E5FF',
    accentSecondary: '#2979FF',
    telemetry: {
      axialTilt: '23.44°',
      gravity: '9.81 m/s²',
      gravityG: '1.00 g',
      pressure: '100% (1,013 mbar)',
      atmosphere: '78% N₂, 21% O₂, 0.04% CO₂',
      dayLength: '23h 56m',
      thermalSwing: 'Buffered climate',
      tempMinC: -60,
      tempMaxC: 42,
      radiationNote: 'Ozone & magnetosphere shield UV; too little CO₂ for dry ice even in Antarctica',
    },
    tabs: [
      { id: 'earth-debates', label: 'Active Debates in Analogue Science', isAccordion: true },
      { id: 'earth-gaps', label: 'Where Earth Falls Short & Simulation Gaps' },
    ],
  },
};

export const LITERATURE_CARDS: LiteratureCard[] = [
  // MARS — Tab 1: Climate & Habitability Analogues
  {
    id: 'mars-atacama',
    planet: 'mars',
    tabId: 'mars-climate',
    tabLabel: 'Climate & Habitability Analogues',
    title: 'Atacama Desert, Chile',
    body: 'One of the most studied Mars analogues, known for its age, extreme aridity, high UV, and saline soils. Its soils also have perchlorate levels close to those the Phoenix lander measured on Mars.',
    citations: ['frontiersin', 'marsdaily'],
    kind: 'site',
    coordinates: '23.86° S, 69.13° W',
  },
  {
    id: 'mars-mcmurdo',
    planet: 'mars',
    tabId: 'mars-climate',
    tabLabel: 'Climate & Habitability Analogues',
    title: 'McMurdo Dry Valleys, Antarctica',
    body: 'Along with the hyper-arid Atacama core, these valleys come closest to the dryness of Mars today. A NASA team used them as an analogue for the Phoenix mission and found unexpectedly high perchlorate there too.',
    citations: ['wikipedia', 'nasa'],
    kind: 'site',
    coordinates: '77.47° S, 162.52° E',
  },
  {
    id: 'mars-super-arid',
    planet: 'mars',
    tabId: 'mars-climate',
    tabLabel: 'Climate & Habitability Analogues',
    title: 'Super-Arid Plains (Other Sites)',
    body: 'The Qaidam Basin in Tibet and the Mojave Basin in the US are also used as analogues for super-arid Martian plains.',
    citations: ['frontiersin'],
    kind: 'site',
    coordinates: '37.50° N, 93.50° E · 35.01° N, 115.47° W',
  },

  // MARS — Tab 2: Ancient Lakes & "Is There Life?"
  {
    id: 'mars-noachian-lakes',
    planet: 'mars',
    tabId: 'mars-lakes',
    tabLabel: 'Ancient Lakes & "Is There Life?"',
    title: 'Late Noachian to Early Hesperian Lake Sites',
    body: 'One review surveys five Earth sites matched to the climate of Late Noachian to Early Hesperian Mars, when craters such as Jezero are thought to have hosted lakes.',
    citations: ['frontiersin'],
    kind: 'review',
  },
  {
    id: 'mars-geologic-ages',
    planet: 'mars',
    tabId: 'mars-lakes',
    tabLabel: 'Ancient Lakes & "Is There Life?"',
    title: 'Four Geologic Age Categories',
    body: 'Another review divides Mars analogues into four categories by geologic age, using impact frequency, volcanic activity, and surface water.',
    citations: ['eppcgs'],
    kind: 'review',
  },
  {
    id: 'mars-organic-host',
    planet: 'mars',
    tabId: 'mars-lakes',
    tabLabel: 'Ancient Lakes & "Is There Life?"',
    title: 'Organic Host Analogues',
    body: 'Sephton\'s review of "organic host analogues" covers soils that mimic Mars\'s low organic content.',
    citations: [],
    kind: 'review',
  },

  // THE MOON — Moon Analogues: Terrain, Regolith & Operations
  {
    id: 'moon-volcanic',
    planet: 'moon',
    tabId: 'moon-operations',
    tabLabel: 'Terrain, Regolith & Operations',
    title: 'Volcanic Terrain',
    body: 'Hawaii\'s pristine, recent volcanic deposits are treated as high-fidelity sites. Iceland\'s Lambahraun lava field has been used to test a Mars rover prototype.',
    citations: ['copernicus', 'wonderdome'],
    kind: 'site',
    coordinates: '19.53° N, 155.57° W · 64.43° N, 20.36° W',
  },
  {
    id: 'moon-lava-tubes',
    planet: 'moon',
    tabId: 'moon-operations',
    tabLabel: 'Terrain, Regolith & Operations',
    title: 'Lava Tubes',
    body: 'Lava tubes may exist on Mars and the Moon, and they could shelter habitats because they hold a constant temperature and block radiation. The CHILL-ICE mission tested a lunar-style shelter in Icelandic lava tubes.',
    citations: ['wonderdome', 'iafastro'],
    kind: 'site',
    coordinates: '64.43° N, 20.36° W',
  },
  {
    id: 'moon-regolith-simulants',
    planet: 'moon',
    tabId: 'moon-operations',
    tabLabel: 'Terrain, Regolith & Operations',
    title: 'Regolith Simulants',
    body: 'Real lunar soil is scarce, so labs use manufactured stand-ins. Taylor, Pieters and Britt (2016) review these simulants and their shortcomings.',
    citations: ['cosmochemistry-papers'],
    kind: 'review',
  },
  {
    id: 'moon-training-rehearsal',
    planet: 'moon',
    tabId: 'moon-operations',
    tabLabel: 'Terrain, Regolith & Operations',
    title: 'Training & Mission Rehearsal',
    body: 'Programmes include HI-SEAS in Hawaii, ESA\'s PANGAEA geology training in Lanzarote, the Arctic Mars Analog Svalbard Expedition (AMASE), and CHILL-ICE.',
    citations: ['iasgyan'],
    kind: 'site',
    coordinates: '19.53° N, 155.57° W · 29.04° N, 13.63° W · 78.92° N, 11.93° E',
  },

  // EARTH — Tab 1: Active Debates in Analogue Science
  {
    id: 'earth-debate-1',
    planet: 'earth',
    tabId: 'earth-debates',
    tabLabel: 'Active Debates in Analogue Science',
    title: '1. How good can an analogue be?',
    body: 'The three-tier model cited in the 33-site review ranks analogues by how directly they rest on empirical evidence about the target body. Early researchers already knew the limits. A quote in NASA\'s history of the field says the Antarctic desert is far more hospitable to life than Mars.',
    citations: ['cambridge', 'nasa'],
    kind: 'debate',
  },
  {
    id: 'earth-debate-2',
    planet: 'earth',
    tabId: 'earth-debates',
    tabLabel: 'Active Debates in Analogue Science',
    title: '2. Is the Atacama Mars-like enough?',
    body: 'NASA scientists called its core soils among the most lifeless and Mars-like on Earth, but also noted it is not as dry as Mars.',
    citations: ['nasa'],
    kind: 'debate',
  },
  {
    id: 'earth-debate-3',
    planet: 'earth',
    tabId: 'earth-debates',
    tabLabel: 'Active Debates in Analogue Science',
    title: '3. Do analogue results transfer to Mars instruments?',
    body: 'One Dartmouth review found that most microbial features at analogue sites are too small to resolve from orbit and need rover-scale observation.',
    citations: ['frontiersin'],
    kind: 'debate',
  },
  {
    id: 'earth-debate-4',
    planet: 'earth',
    tabId: 'earth-debates',
    tabLabel: 'Active Debates in Analogue Science',
    title: '4. Are simulants valid?',
    body: 'A simulant built for one purpose may fail for another. Some prioritise bulk physical properties over accurate mineralogy. Simulants are made of Earth materials, so their trace elements should never be matched to real regolith.',
    citations: ['arxiv', 'frontiersin'],
    kind: 'debate',
  },

  // EARTH — Tab 2: Where Earth Falls Short & Simulation Gaps
  {
    id: 'earth-gap-atmosphere',
    planet: 'earth',
    tabId: 'earth-gaps',
    tabLabel: 'Where Earth Falls Short & Simulation Gaps',
    title: 'Atmosphere',
    body: 'Mars\'s air is about 1% of Earth\'s pressure and mostly CO₂, and the Moon is essentially a vacuum. No natural Earth site matches either, so this is done in simulation chambers.',
    citations: [],
    kind: 'gap',
  },
  {
    id: 'earth-gap-temperature',
    planet: 'earth',
    tabId: 'earth-gaps',
    tabLabel: 'Where Earth Falls Short & Simulation Gaps',
    title: 'Temperature',
    body: 'Nowhere on Earth reproduces Mars\'s large daily temperature swings. Earth\'s air also holds too little CO₂ for dry ice to form even in cold Antarctica.',
    citations: ['wikipedia'],
    kind: 'gap',
  },
  {
    id: 'earth-gap-gravity',
    planet: 'earth',
    tabId: 'earth-gaps',
    tabLabel: 'Where Earth Falls Short & Simulation Gaps',
    title: 'Gravity',
    body: 'Underwater training (neutral buoyancy) and parabolic flights are used to imitate reduced gravity.',
    citations: ['Wikipedia'],
    kind: 'gap',
  },
];

export const EARTH_ANALOGUE_PINS: PlanetPlace[] = [
  {
    id: 'pin-atacama',
    planet: 'earth',
    name: 'Atacama Desert',
    region: 'Chile',
    lat: -23.86,
    lon: -69.13,
    coordLabel: '23.86° S, 69.13° W',
    targetBody: 'Mars',
    terrainType: 'Hyper-Arid Saline Core',
    features: [
      'Ancient hyper-arid desert core with extreme UV exposure',
      'Saline soils containing perchlorate levels close to Phoenix lander Mars measurements',
      'Among the most lifeless Earth soils, though still not as dry as Mars',
    ],
    focus: 'One of the most studied Mars analogues, known for its age, extreme aridity, high UV, saline soils, and Phoenix-comparable perchlorate levels.',
    citations: ['frontiersin', 'marsdaily', 'nasa'],
    linkedCardId: 'mars-atacama',
    tempMinC: 4,
    tempMaxC: 34,
  },
  {
    id: 'pin-mcmurdo',
    planet: 'earth',
    name: 'McMurdo Dry Valleys',
    region: 'Antarctica',
    lat: -77.47,
    lon: 162.52,
    coordLabel: '77.47° S, 162.52° E',
    targetBody: 'Mars',
    terrainType: 'Polar Hyper-Arid Permafrost Valley',
    features: [
      'Along with Atacama core, comes closest to modern Martian dryness',
      'NASA Phoenix mission analogue with unexpectedly high perchlorate',
      'Far more hospitable to life than Mars; insufficient CO₂ for dry ice formation',
    ],
    focus: 'Used by a NASA team as a Phoenix mission analogue with unexpectedly high perchlorate; closest polar dryness on Earth yet lacks Martian CO₂ dry ice.',
    citations: ['wikipedia', 'nasa', 'cambridge'],
    linkedCardId: 'mars-mcmurdo',
    tempMinC: -42,
    tempMaxC: -12,
  },
  {
    id: 'pin-qaidam',
    planet: 'earth',
    name: 'Qaidam Basin',
    region: 'Tibet',
    lat: 37.5,
    lon: 93.5,
    coordLabel: '37.50° N, 93.50° E',
    targetBody: 'Mars',
    terrainType: 'High-Altitude Evaporite & Playas',
    features: [
      'Used as an analogue for super-arid Martian plains',
      'High-elevation arid basin with evaporitic salt flats and wind-carved ridges',
      'Supports comparative geomorphology with Martian plain deposits',
    ],
    focus: 'Used alongside the Mojave Basin as a primary terrestrial analogue for super-arid Martian plains.',
    citations: ['frontiersin'],
    linkedCardId: 'mars-super-arid',
    tempMinC: -18,
    tempMaxC: 16,
  },
  {
    id: 'pin-mojave',
    planet: 'earth',
    name: 'Mojave Basin',
    region: 'United States',
    lat: 35.01,
    lon: -115.47,
    coordLabel: '35.01° N, 115.47° W',
    targetBody: 'Mars',
    terrainType: 'Arid Desert Basin & Alluvial Fans',
    features: [
      'Analogue for super-arid Martian plains and desert soil weathering',
      'Arid mineral surfaces suited for rover instrument and spectral calibration',
      'Microbial features typically require rover-scale rather than orbital observation',
    ],
    focus: 'Used as an analogue for super-arid Martian plains and desert soil mineralogy calibration.',
    citations: ['frontiersin'],
    linkedCardId: 'mars-super-arid',
    tempMinC: 8,
    tempMaxC: 39,
  },
  {
    id: 'pin-hawaii',
    planet: 'earth',
    name: 'Hawaii (HI-SEAS)',
    region: 'Mauna Loa, USA',
    lat: 19.53,
    lon: -155.57,
    coordLabel: '19.53° N, 155.57° W',
    targetBody: 'Mars & Moon',
    terrainType: 'Pristine Basaltic Volcanic Terrain',
    features: [
      'Pristine, recent volcanic deposits treated as high-fidelity lunar/Martian terrain',
      'Host of HI-SEAS long-duration crew isolation & mission rehearsal programme',
      'Basaltic regolith analog terrain for surface EVA and sampling workflows',
    ],
    focus: 'Pristine volcanic deposits treated as high-fidelity terrain and home to the HI-SEAS mission rehearsal programme.',
    citations: ['copernicus', 'wonderdome', 'iasgyan'],
    linkedCardId: 'moon-volcanic',
    tempMinC: 2,
    tempMaxC: 18,
  },
  {
    id: 'pin-iceland',
    planet: 'earth',
    name: 'Iceland (Lambahraun / CHILL-ICE)',
    region: 'Iceland',
    lat: 64.43,
    lon: -20.36,
    coordLabel: '64.43° N, 20.36° W',
    targetBody: 'Mars & Moon',
    terrainType: 'Subarctic Basalt Lava Field & Lava Tubes',
    features: [
      'Lambahraun lava field used to test Mars rover prototypes',
      'CHILL-ICE mission tested a lunar-style shelter inside Icelandic lava tubes',
      'Demonstrates constant-temperature, radiation-shielding habitat concepts',
    ],
    focus: 'Site of Mars rover prototype field tests at Lambahraun and the CHILL-ICE lunar-style shelter campaign inside lava tubes.',
    citations: ['copernicus', 'wonderdome', 'iafastro', 'iasgyan'],
    linkedCardId: 'moon-lava-tubes',
    tempMinC: -6,
    tempMaxC: 11,
  },
  {
    id: 'pin-lanzarote',
    planet: 'earth',
    name: 'Lanzarote (PANGAEA)',
    region: 'Canary Islands, Spain',
    lat: 29.04,
    lon: -13.63,
    coordLabel: '29.04° N, 13.63° W',
    targetBody: 'Mars & Moon',
    terrainType: 'Volcanic Caldera & Basalt Cones',
    features: [
      'Host of ESA\'s PANGAEA astronaut geology training programme',
      'Trains crews to identify volcanic and impact-analogue rock samples in situ',
      'Bridges lunar and Martian field geology sampling protocols',
    ],
    focus: 'Host site for ESA\'s PANGAEA geology field training programme for lunar and Martian crew operations.',
    citations: ['iasgyan'],
    linkedCardId: 'moon-training-rehearsal',
    tempMinC: 15,
    tempMaxC: 26,
  },
  {
    id: 'pin-svalbard',
    planet: 'earth',
    name: 'Svalbard (AMASE)',
    region: 'Arctic Norway',
    lat: 78.92,
    lon: 11.93,
    coordLabel: '78.92° N, 11.93° E',
    targetBody: 'Mars & Moon',
    terrainType: 'Arctic Permafrost & Carbonate-Basalt',
    features: [
      'Site of the Arctic Mars Analog Svalbard Expedition (AMASE)',
      'Cold permafrost and astrobiology instrument rehearsal under polar conditions',
      'Tests rover-scale biosignature detection where orbital resolution falls short',
    ],
    focus: 'Host of the Arctic Mars Analog Svalbard Expedition (AMASE) for astrobiology and instrument field rehearsals.',
    citations: ['iasgyan', 'frontiersin'],
    linkedCardId: 'moon-training-rehearsal',
    tempMinC: -22,
    tempMaxC: 3,
  },
];

export const MARS_PLACES: PlanetPlace[] = [
  {
    id: 'mars-place-olympus',
    planet: 'mars',
    name: 'Olympus Mons',
    region: 'Tharsis Volcanic Province',
    lat: 18.65,
    lon: 226.2,
    coordLabel: '18.65° N, 133.80° W',
    targetBody: 'Earth Analogue',
    terrainType: 'Colossal Shield Volcano',
    planetImage: '/assets/photographs/mars-04-planet-olympus-viking1.jpg',
    earthAnalogueName: 'Mauna Loa & Hawaiian Shield Volcanoes',
    earthAnalogueImage: '/assets/photographs/mars-04-earth-iceland-leirhnjukur.jpg',
    earthAnalogueDescription: 'Shield volcanoes on Earth such as Mauna Loa share low-viscosity basaltic flow mechanisms, though gravity differences allow Olympus Mons to reach nearly 22 km in height.',
    scientificFacts: [
      'Standing ~21.9 km high, it is nearly 2.5 times the height of Mount Everest.',
      'Caldera complex at summit measures roughly 80 km across with multiple collapse craters.',
      'Basaltic lava flows extend hundreds of kilometers across the surrounding Tharsis plains.'
    ],
    missionInfo: 'Imaged extensively by NASA Viking 1, Mariner 9, and Mars Reconnaissance Orbiter.',
    features: [
      'Gigantic shield volcano with gentle 5-degree slopes',
      'Enormous sheer cliff escarpment at base reaching up to 8 km high',
      'Formed over billions of years by successive eruptions without moving tectonic plates'
    ],
    focus: 'The tallest volcano in the solar system, providing vital insights into prolonged basaltic volcanism under 0.38 g gravity.',
    citations: ['copernicus', 'wonderdome', 'frontiersin'],
    linkedCardId: 'mars-geologic-ages',
    tempMinC: -128,
    tempMaxC: 2,
  },
  {
    id: 'mars-place-valles',
    planet: 'mars',
    name: 'Valles Marineris',
    region: 'Equatorial Canyon System',
    lat: -14.0,
    lon: -59.0,
    coordLabel: '14.00° S, 59.00° W',
    targetBody: 'Earth Analogue',
    terrainType: 'Vast Tectonic Canyon Network',
    planetImage: '/assets/photographs/mars-03-planet-victoria-crater.jpg',
    earthAnalogueName: 'Grand Canyon & Devon Island Rift Systems',
    earthAnalogueDescription: 'While Earth\'s Grand Canyon was carved primarily by flowing rivers, Valles Marineris formed largely through crustal rifting and tectonic fracturing, widened by later mass wasting and water flow.',
    scientificFacts: [
      'Stretches over 4,000 km long, spanning nearly a quarter of Mars\'s circumference.',
      'Reaches depths up to 7 km, dwarfing terrestrial canyons.',
      'Exposes ancient stratigraphic layers spanning billions of years of Martian history.'
    ],
    missionInfo: 'Studied by Viking orbiters and MRO High Resolution Imaging Science Experiment (HiRISE).',
    features: [
      'Colossal trench system stretching across the Martian equator',
      'Massive interior layered deposits suggesting ancient standing bodies of water',
      'Extensive landslide scars and fault-bounded grabens'
    ],
    focus: 'A colossal canyon system stretching over 4,000 km, offering a deep stratigraphic window into Martian crustal evolution.',
    citations: ['nasa', 'frontiersin', 'eppcgs'],
    linkedCardId: 'mars-super-arid',
    tempMinC: -105,
    tempMaxC: 15,
  },
  {
    id: 'mars-place-gale',
    planet: 'mars',
    name: 'Gale Crater',
    region: 'Aeolis Quadrangle',
    lat: -5.4,
    lon: 137.8,
    coordLabel: '5.40° S, 137.80° E',
    targetBody: 'Earth Analogue',
    terrainType: 'Aqueous Sedimentary Basin & Mount Sharp',
    planetImage: '/assets/photographs/mars-02-planet-curiosity-valley.jpg',
    earthAnalogueName: 'McMurdo Dry Valleys & Ancient Lake Basins',
    earthAnalogueDescription: 'Sedimentary clay and sulfate strata inside Gale Crater mirror ancient lakebed environments on Earth, recording shifts in planetary climate and habitability.',
    scientificFacts: [
      'Contains Aeolis Mons (Mount Sharp), a 5 km high central mound of sedimentary strata.',
      'Explored directly by NASA\'s Curiosity rover since 2012.',
      'Confirmed ancient freshwater lake environments with organic molecules preserved in mudstones.'
    ],
    missionInfo: 'NASA Mars Science Laboratory (Curiosity Rover) primary landing site and continuous operational base.',
    features: [
      'Ancient lakebed with clay-bearing sedimentary rocks',
      'Central mountain formed by differential erosion of thick lacustrine sediments',
      'Abundant sulfate minerals indicating evaporating ancient water bodies'
    ],
    focus: 'Landing site of the Curiosity rover, revealing ancient lakebeds, organic carbon compounds, and habitable environmental conditions.',
    citations: ['nasa', 'marsdaily', 'frontiersin'],
    linkedCardId: 'mars-noachian-lakes',
    tempMinC: -95,
    tempMaxC: 18,
  },
  {
    id: 'mars-place-jezero',
    planet: 'mars',
    name: 'Jezero Crater',
    region: 'Isidis Planitia Rim',
    lat: 18.38,
    lon: 77.58,
    coordLabel: '18.38° N, 77.58° E',
    targetBody: 'Earth Analogue',
    terrainType: 'Ancient River Delta & Paleolake',
    planetImage: '/assets/photographs/mars-01-planet-perseverance.png',
    earthAnalogueName: 'Atacama Desert Saline Core & Ancient Deltas',
    earthAnalogueDescription: 'Jezero Crater features a remarkably well-preserved river delta that flowed into an ancient lake, matched on Earth by lacustrine delta environments and Atacama evaporite basins.',
    scientificFacts: [
      'Selected as the landing site for NASA\'s Perseverance rover and Mars Sample Return cache.',
      'Contains clay minerals formed in the presence of liquid water.',
      'Exhibits clear channel inlets and outlet breaches characteristic of lacustrine flooding.'
    ],
    missionInfo: 'NASA Mars 2020 Perseverance Rover mission and Ingenuity helicopter operations.',
    features: [
      'Classic delta fan structure deposited by ancient river networks',
      'Magnesium and iron-rich clay minerals ideal for preserving biosignatures',
      'Diverse rock types including volcanic floor units and impact breccia'
    ],
    focus: 'Site of the Perseverance rover searching for microfossils and collecting rock samples in an ancient river delta environment.',
    citations: ['frontiersin', 'marsdaily', 'nasa'],
    linkedCardId: 'mars-atacama',
    tempMinC: -92,
    tempMaxC: 12,
  },
  {
    id: 'mars-place-polar',
    planet: 'mars',
    name: 'Polar Ice Caps (Vastitas Borealis)',
    region: 'Northern & Southern High Latitudes',
    lat: 88.0,
    lon: 0.0,
    coordLabel: '88.00° N, 0.00° E',
    targetBody: 'Earth Analogue',
    terrainType: 'Water Ice & CO₂ Seasonal Frost',
    planetImage: '/assets/photographs/mars-05-planet-mineral-vein.jpg',
    earthAnalogueName: 'Arctic Permafrost & Dallol Hydrothermal Basins',
    earthAnalogueDescription: 'While Earth polar caps are composed entirely of water ice, Martian polar caps combine permanent water ice foundations with seasonal carbon dioxide frost layers.',
    scientificFacts: [
      'Layered terrain records cycles of Martian climate change over millions of years.',
      'Phoenix lander excavated subsurface water ice just centimeters beneath the regolith.',
      'Atmospheric carbon dioxide freezes out during winter, forming seasonal dry ice caps.'
    ],
    missionInfo: 'Studied by NASA Phoenix lander, Mars Global Surveyor, and MRO orbital radar.',
    features: [
      'Permanent polar layered deposits of dust and water ice',
      'Spiral trough formations carved by katabatic winds',
      'Subsurface perchlorate-bearing regolith and ice tables'
    ],
    focus: 'High-latitude permafrost and ice sheets preserving historical climate records and volatile budgets.',
    citations: ['wikipedia', 'nasa', 'cambridge'],
    linkedCardId: 'mars-mcmurdo',
    tempMinC: -135,
    tempMaxC: -45,
  },
  {
    id: 'mars-place-eberswalde',
    planet: 'mars',
    name: 'Eberswalde Crater',
    region: 'Margaritifer Terra',
    lat: -23.8,
    lon: -33.1,
    coordLabel: '23.80° S, 33.10° W',
    targetBody: 'Earth Analogue',
    terrainType: 'Ancient Meandering Delta',
    planetImage: '/assets/photographs/mars-01-planet-perseverance.png',
    earthAnalogueName: 'Atacama Alluvial Fans & Terrestrial River Deltas',
    earthAnalogueDescription: 'Eberswalde Crater preserves one of the finest examples of an ancient meandering river delta on Mars, recording sustained liquid water flow and sedimentary deposition.',
    scientificFacts: [
      'Exhibits clear channel loops, distributary lobes, and delta topsets.',
      'Identified as a runner-up landing site for the Mars 2020 Perseverance rover.',
      'Indicates persistent aqueous conditions during the Noachian-Hesperian transition.'
    ],
    missionInfo: 'Imaged and analyzed by Mars Reconnaissance Orbiter HiRISE and Context Camera.',
    features: [
      'Remarkably preserved delta distributary channels',
      'Fine-grained clay and sulfate sedimentary deposits',
      'Ancient paleolake basin topography'
    ],
    focus: 'An exceptionally preserved ancient river delta recording sustained liquid water transport and sedimentary deposition.',
    citations: ['nasa', 'frontiersin', 'marsdaily'],
    linkedCardId: 'mars-atacama',
    tempMinC: -95,
    tempMaxC: 14,
  },
];

export const MOON_PLACES: PlanetPlace[] = [
  {
    id: 'moon-place-imbrium',
    planet: 'moon',
    name: 'Mare Imbrium',
    region: 'Lunar Nearside Northern Hemisphere',
    lat: 32.8,
    lon: -15.6,
    coordLabel: '32.80° N, 15.60° W',
    targetBody: 'Earth Analogue',
    terrainType: 'Basaltic Impact Basin',
    planetImage: '/assets/photographs/moon-01-planet-apollo15-hadley.jpg',
    earthAnalogueName: 'Hawaii Basalt Flood Plains & Volcanic Basins',
    earthAnalogueDescription: 'Mare Imbrium is one of the largest impact craters in the solar system, subsequently flooded by dark, iron-rich basaltic lava flows.',
    scientificFacts: [
      'Basin spans over 1,145 km in diameter, formed by a colossal asteroid impact.',
      'Target site of the Apollo 15 crewed mission at Hadley Rille.',
      'Surrounded by majestic mountain ranges including the Apennines and Alps.'
    ],
    missionInfo: 'Studied by Lunar Orbiter, Apollo 15 landing mission, and LRO.',
    features: [
      'Vast smooth dark basaltic plains',
      'Encircling mountainous ring structures',
      'Sinuous volcanic rilles like Hadley Rille'
    ],
    focus: 'A colossal impact basin flooded with basaltic lavas, serving as a primary lunar mare and sample return target.',
    citations: ['copernicus', 'wonderdome', 'iasgyan'],
    linkedCardId: 'moon-volcanic',
    tempMinC: -173,
    tempMaxC: 125,
  },
  {
    id: 'moon-place-tycho',
    planet: 'moon',
    name: 'Tycho Crater',
    region: 'Southern Lunar Highlands',
    lat: -43.3,
    lon: -11.2,
    coordLabel: '43.30° S, 11.20° W',
    targetBody: 'Earth Analogue',
    terrainType: 'Rayed Impact Structure',
    planetImage: '/assets/photographs/moon-03-planet-apollo12-lro.jpg',
    earthAnalogueName: 'Meteor Impact Structures on Earth',
    earthAnalogueDescription: 'Tycho is one of the most prominent young impact craters on the Moon, featuring extensive bright ejecta rays spanning over 1,500 km across the lunar surface.',
    scientificFacts: [
      'Formed approximately 108 million years ago by an asteroid impact.',
      'Central peak rises nearly 2 km above the crater floor.',
      'Ejecta material from Tycho was sampled at the Apollo 17 landing site.'
    ],
    missionInfo: 'Imaged in ultra-high resolution by NASA Lunar Reconnaissance Orbiter (LRO).',
    features: [
      'Prominent bright ray system visible even with binoculars from Earth',
      'Terraced crater walls and complex central peak structures',
      'Impact melt sheets covering portions of the interior floor'
    ],
    focus: 'A prominent young rayed impact crater providing key chronological benchmark data for lunar impact history.',
    citations: ['copernicus', 'wonderdome', 'cosmochemistry-papers'],
    linkedCardId: 'moon-volcanic',
    tempMinC: -173,
    tempMaxC: 120,
  },
  {
    id: 'moon-place-copernicus',
    planet: 'moon',
    name: 'Copernicus Crater',
    region: 'Mare Insularum',
    lat: 9.7,
    lon: -20.0,
    coordLabel: '9.70° N, 20.00° W',
    targetBody: 'Earth Analogue',
    terrainType: 'Terraced Impact Basin',
    planetImage: '/assets/photographs/moon-02-planet-apollo17-taurus.jpg',
    earthAnalogueName: 'Lanzarote Volcanic Calderas & Impact Basins',
    earthAnalogueDescription: 'Copernicus is a magnificent 93 km wide impact crater exhibiting terraced walls, multiple central peaks, and hummocky ejecta blankets.',
    scientificFacts: [
      'Often called the Queen of Lunar Craters due to its striking symmetry and preservation.',
      'Formed roughly 800 million years ago during the Eratosthenian period.',
      'Served as a primary target for early lunar mapping and Apollo orbital photography.'
    ],
    missionInfo: 'First photographed obliquely by Lunar Orbiter 2 in 1966 ("one of the pictures of the century").',
    features: [
      'Spacious crater floor with three distinct central peaks',
      'Slumping terraced walls created by post-impact gravitational collapse',
      'Extensive surrounding hummocky ejecta blanket'
    ],
    focus: 'A magnificent 93 km wide impact crater showcasing textbook terraced walls and central peak formation.',
    citations: ['iasgyan', 'copernicus', 'wonderdome'],
    linkedCardId: 'moon-training-rehearsal',
    tempMinC: -173,
    tempMaxC: 125,
  },
  {
    id: 'moon-place-tranquility',
    planet: 'moon',
    name: 'Sea of Tranquility (Mare Tranquillitatis)',
    region: 'Nearside Volcanic Plain',
    lat: 0.8,
    lon: 23.4,
    coordLabel: '0.80° N, 23.40° E',
    targetBody: 'Earth Analogue',
    terrainType: 'Titanium-Rich Basaltic Plain',
    planetImage: '/assets/photographs/moon-01-planet-apollo15-hadley.jpg',
    earthAnalogueName: 'Hawaii Volcanic Basalt Plains & Calderas',
    earthAnalogueDescription: 'Mare Tranquillitatis is an ancient volcanic basin flooded with dark, iron- and titanium-rich basaltic lava flows, matched on Earth by Hawaiian flood basalt fields.',
    scientificFacts: [
      'Site of humanity\'s first crewed lunar landing (Apollo 11, July 20, 1969).',
      'Basalts here are enriched in titanium compared to other lunar maria.',
      'Smooth landing terrain selected for safety during early exploration.'
    ],
    missionInfo: 'NASA Apollo 11 historical landing site (Statio Tranquillitatis).',
    features: [
      'Extensive smooth dark volcanic basalt plains',
      'Low crater density indicating younger volcanic resurfacing than highlands',
      'Fine-grained lunar regolith mixed with impact glass spherules'
    ],
    focus: 'Historical Apollo 11 landing site on titanium-rich basaltic lava plains, studied alongside Hawaiian volcanic analogues.',
    citations: ['copernicus', 'wonderdome', 'iasgyan'],
    linkedCardId: 'moon-volcanic',
    tempMinC: -173,
    tempMaxC: 127,
  },
  {
    id: 'moon-place-southpole',
    planet: 'moon',
    name: 'Lunar South Pole (Shackleton Crater)',
    region: 'Polar Rim & Shadowed Basins',
    lat: -89.9,
    lon: 0.0,
    coordLabel: '89.90° S, 0.00° E',
    targetBody: 'Earth Analogue',
    terrainType: 'Permanently Shadowed Polar Ice Trap',
    planetImage: '/assets/photographs/moon-05-planet-shackleton-lro.jpg',
    earthAnalogueName: 'Arctic Permafrost & Polar Shadowed Valleys',
    earthAnalogueDescription: 'The Lunar South Pole features craters like Shackleton where interior floors never receive direct sunlight, trapping ancient water ice reserves for future Artemis missions.',
    scientificFacts: [
      'Permanently shadowed regions maintain cryogenic temperatures near -248°C.',
      'High-rim peaks receive near-continuous solar illumination, ideal for solar power stations.',
      'Primary target zone for NASA Artemis human landing missions.'
    ],
    missionInfo: 'NASA Lunar Reconnaissance Orbiter, LCROSS impactor, and Artemis mission planning.',
    features: [
      'Permanently shadowed crater interiors acting as cold traps for volatiles',
      'Elevated crater rims with high solar illumination ratios',
      'Ancient highland anorthosite regolith deposits'
    ],
    focus: 'Permanently shadowed polar craters holding trapped water ice reserves and serving as the primary destination for Artemis lunar exploration.',
    citations: ['iasgyan', 'cosmochemistry-papers', 'arxiv'],
    linkedCardId: 'moon-training-rehearsal',
    tempMinC: -248,
    tempMaxC: -20,
  },
  {
    id: 'moon-place-aitken',
    planet: 'moon',
    name: 'South Pole-Aitken Basin',
    region: 'Farside Mega-Impact Basin',
    lat: -56.0,
    lon: 170.0,
    coordLabel: '56.00° S, 170.00° E',
    targetBody: 'Earth Analogue',
    terrainType: 'Colossal Multi-Ring Impact Structure',
    planetImage: '/assets/photographs/moon-04-planet-apollo16-highlands.jpg',
    earthAnalogueName: 'Terrestrial Ancient Impact Craters',
    earthAnalogueDescription: 'One of the largest known impact craters in the solar system, measuring roughly 2,500 km in diameter and exposing deep lunar mantle materials.',
    scientificFacts: [
      'Spans nearly a quarter of the Moon\'s southern hemisphere.',
      'Impact excavated deep into the lunar crust and potentially exposed mantle rocks.',
      'Landing site of China\'s Chang\'e 4 farside robotic mission.'
    ],
    missionInfo: 'Mapped by LRO, Lunar Prospector, and explored by Chang\'e 4 / Yutu-2.',
    features: [
      'Massive topographic depression with subdued rim structures',
      'Anomalous heavy crustal and mantle composition detected by gravity mapping',
      'Farside basaltic volcanic fill patches'
    ],
    focus: 'A colossal 2,500 km impact basin exposing deep lunar interior composition and farside crustal structure.',
    citations: ['cosmochemistry-papers', 'arxiv', 'frontiersin'],
    linkedCardId: 'moon-regolith-simulants',
    tempMinC: -180,
    tempMaxC: 115,
  },
];

export const PLANET_PLACES_BY_ID: Record<PlanetId, PlanetPlace[]> = {
  earth: EARTH_ANALOGUE_PINS,
  mars: MARS_PLACES,
  moon: MOON_PLACES,
};

export const COMPARISON_MATRIX: ComparisonRow[] = [
  {
    metric: 'Surface Pressure & Atmosphere',
    earth: '100% (1,013 mbar N₂ / O₂ baseline)',
    mars: '~1% of Earth pressure, mostly CO₂',
    moon: 'Essentially a vacuum (exosphere)',
  },
  {
    metric: 'Thermal Swings',
    earth: 'Moderated by oceans & atmosphere; CO₂ dry ice cannot form even in Antarctica',
    mars: 'Large daily temperature swings across thin CO₂ air',
    moon: 'Extreme solar-to-shadow swings (~-173°C to +127°C); constant inside lava tubes',
  },
  {
    metric: 'Gravity & Simulation Methods',
    earth: '1.00 g baseline; imitates low-g via underwater neutral buoyancy & parabolic flights',
    mars: '0.38 g; simulated via neutral buoyancy & parabolic flights',
    moon: '0.165 g; simulated via neutral buoyancy & parabolic flights',
  },
  {
    metric: 'Key Analogue Limits',
    earth: 'No natural site replicates ~1% CO₂, vacuum, or Martian daily thermal extremes',
    mars: 'Antarctic desert is far more hospitable to life; Atacama is not as dry as Mars; orbital resolution misses microbial scale',
    moon: 'Real lunar soil is scarce; manufactured Earth-material simulants fail trace-element & dual-purpose mineralogy validity',
  },
];

export const MOON_EARTH_ANALOGUE_SITES: AnalogueEarthSite[] = [
  {
    id: 'moon-earth-hawaii',
    targetPlanet: 'moon',
    title: 'Hawaii (Volcanic Terrain & HI-SEAS)',
    location: 'Mauna Loa, Hawaii, USA',
    coordinates: '19.53° N, 155.57° W',
    badge: 'Shared Moon & Mars Analogue',
    isSharedMoonAndMars: true,
    summary:
      "Hawaii's pristine, recent volcanic deposits are treated as high-fidelity lunar and Martian terrain analogues, alongside the long-duration HI-SEAS crew isolation and surface mission rehearsal programme.",
    highlights: [
      'Pristine, unweathered basaltic lava flows matching lunar mare & volcanic ash regolith',
      'HI-SEAS long-duration crew isolation & EVA workflow rehearsal habitat',
    ],
    citations: ['copernicus', 'wonderdome', 'iasgyan'],
    linkedPlaceId: 'moon-place-maria',
    linkedCardId: 'moon-volcanic',
  },
  {
    id: 'moon-earth-iceland',
    targetPlanet: 'moon',
    title: 'Iceland — CHILL-ICE Lava Tubes & Lambahraun Lava Field',
    location: 'Hallmundarhraun & Lambahraun, Iceland',
    coordinates: '64.43° N, 20.36° W',
    badge: 'Shared Moon & Mars Analogue',
    isSharedMoonAndMars: true,
    summary:
      "The CHILL-ICE mission tested a lunar-style habitat inside Icelandic lava tubes, demonstrating how subsurface tubes hold a constant temperature and block radiation. Iceland's Lambahraun lava field also hosted Mars rover prototype field testing.",
    highlights: [
      'Subsurface lava tubes hold a constant thermal profile and shield cosmic/solar radiation',
      'CHILL-ICE deployed an emergency & habitation shelter inside dark volcanic tubes',
      'Lambahraun lava field validated rover prototype mobility over blocky basalt',
    ],
    citations: ['copernicus', 'wonderdome', 'iafastro'],
    linkedPlaceId: 'moon-place-lavatubes',
    linkedCardId: 'moon-lava-tubes',
  },
  {
    id: 'moon-earth-lanzarote',
    targetPlanet: 'moon',
    title: 'Lanzarote, Canary Islands (ESA PANGAEA)',
    location: 'Lanzarote, Spain',
    coordinates: '29.04° N, 13.63° W',
    badge: 'Shared Moon & Mars Analogue',
    isSharedMoonAndMars: true,
    summary:
      "Host site for ESA's PANGAEA geology training programme, preparing astronauts to identify basaltic, impact-analogue, and volcanic rock samples during future lunar and Martian surface EVAs.",
    highlights: [
      'ESA PANGAEA astronaut field geology & sample triage curriculum',
      'Fresh volcanic cones, craters, and pyroclastic basalt deposits',
    ],
    citations: ['iasgyan'],
    linkedPlaceId: 'moon-place-southpole',
    linkedCardId: 'moon-training-rehearsal',
  },
  {
    id: 'moon-earth-svalbard',
    targetPlanet: 'moon',
    title: 'Svalbard, Norway (AMASE)',
    location: 'Spitsbergen, Arctic Norway',
    coordinates: '78.92° N, 11.93° E',
    badge: 'Shared Moon & Mars Analogue',
    isSharedMoonAndMars: true,
    summary:
      'Arctic Mars Analog Svalbard Expedition (AMASE) field testbed combining cold polar terrain, basalt-carbonate formations, and rover-scale instrument rehearsal for lunar/Martian operations.',
    highlights: [
      'Polar cold-weather EVA and rover instrument field rehearsal',
      'Tests trace detection & sampling hardware at rover scale',
    ],
    citations: ['iasgyan'],
    linkedPlaceId: 'moon-place-southpole',
    linkedCardId: 'moon-training-rehearsal',
  },
  {
    id: 'moon-earth-simulants',
    targetPlanet: 'moon',
    title: 'Manufactured Regolith Simulants Labs',
    location: 'Global Laboratory Testbeds',
    coordinates: 'Earth-Sourced Mineralogy',
    badge: 'Laboratory Simulant Review',
    isSharedMoonAndMars: false,
    summary:
      'Real lunar soil is scarce, so laboratories manufacture stand-in simulants from terrestrial rocks. Taylor, Pieters and Britt (2016) review these simulants and warn about bulk-physical vs. mineralogical and trace-element mismatches.',
    highlights: [
      'Reviewed by Taylor, Pieters and Britt (2016) for geomechanical vs. geochemical validity',
      'A simulant built for geotechnical excavation can fail mineralogy or dust toxicity tests',
      'Earth-sourced trace elements should never be matched directly to real lunar regolith',
    ],
    citations: ['cosmochemistry-papers', 'arxiv', 'frontiersin'],
    linkedPlaceId: 'moon-place-highlands',
    linkedCardId: 'moon-regolith-simulants',
  },
];

export const MARS_EARTH_ANALOGUE_SITES: AnalogueEarthSite[] = [
  {
    id: 'mars-earth-atacama',
    targetPlanet: 'mars',
    title: 'Atacama Desert, Chile',
    location: 'Northern Chile',
    coordinates: '23.86° S, 69.13° W',
    badge: 'Hyper-Arid & Perchlorate Analogue',
    isSharedMoonAndMars: false,
    summary:
      'One of the most studied Mars analogues on Earth, known for its ancient surface age, extreme aridity, high UV radiation, and saline soils with perchlorate concentrations close to those measured by NASA\'s Phoenix lander on Mars.',
    highlights: [
      'Perchlorate salt chemistry closely comparable to Phoenix lander measurements',
      'Core soils rank among Earth\'s most lifeless, though still not as dry as Mars today',
    ],
    citations: ['frontiersin', 'marsdaily', 'nasa'],
    linkedPlaceId: 'mars-place-phoenix',
    linkedCardId: 'mars-atacama',
  },
  {
    id: 'mars-earth-mcmurdo',
    targetPlanet: 'mars',
    title: 'McMurdo Dry Valleys, Antarctica',
    location: 'Victoria Land, Antarctica',
    coordinates: '77.47° S, 162.52° E',
    badge: 'Phoenix Mission Polar Analogue',
    isSharedMoonAndMars: false,
    summary:
      'Alongside the hyper-arid Atacama core, the McMurdo Dry Valleys come closest to the dryness of Mars today. A NASA team used them as an analogue for the Phoenix mission and found unexpectedly high perchlorate there too.',
    highlights: [
      'Cold hyper-arid permafrost soils used directly for NASA Phoenix analogue calibration',
      'Still far more hospitable to life than Mars and lacks atmospheric CO₂ for dry ice',
    ],
    citations: ['wikipedia', 'nasa', 'cambridge'],
    linkedPlaceId: 'mars-place-phoenix',
    linkedCardId: 'mars-mcmurdo',
  },
  {
    id: 'mars-earth-qaidam-mojave',
    targetPlanet: 'mars',
    title: 'Qaidam Basin (Tibet) & Mojave Basin (US)',
    location: 'Qinghai-Tibet Plateau · California/Nevada',
    coordinates: '37.50° N, 93.50° E · 35.01° N, 115.47° W',
    badge: 'Super-Arid Plains Analogues',
    isSharedMoonAndMars: false,
    summary:
      'Both the high-altitude Qaidam Basin in Tibet and the arid Mojave Basin in the United States serve as primary terrestrial analogues for super-arid Martian plains, evaporite deposits, and rover instrument calibration.',
    highlights: [
      'Qaidam Basin captures wind-sculpted yardangs, salt playas, and cold high-elevation dryness',
      'Mojave Basin supports desert soil weathering and rover-scale spectral biosignature checks',
    ],
    citations: ['frontiersin'],
    linkedPlaceId: 'mars-place-plains',
    linkedCardId: 'mars-super-arid',
  },
  {
    id: 'mars-earth-lakes-ages',
    targetPlanet: 'mars',
    title: 'Ancient Lakes (Jezero Equivalents), 4 Geologic Ages & Organic Host Soils',
    location: 'Climate-Matched Global Lacustrine & Organic Host Reviews',
    coordinates: 'Late Noachian – Early Hesperian Epochs',
    badge: 'Paleolakes & Astrobiology Reviews',
    isSharedMoonAndMars: false,
    summary:
      "Surveys five Earth lake sites matched to Late Noachian–Early Hesperian Mars when craters such as Jezero hosted liquid lakes, pairs with a four-age geologic classification (impact frequency, volcanism, surface water), and Sephton's review of low-organic host soils.",
    highlights: [
      'Five terrestrial lake analogues matched to Jezero Crater paleoclimate conditions',
      'Four geologic age categories structured by impacts, volcanism, and surface water history',
      'Sephton\'s organic host analogues calibrate low-organic Martian biosignature limits',
    ],
    citations: ['frontiersin', 'eppcgs'],
    linkedPlaceId: 'mars-place-jezero',
    linkedCardId: 'mars-noachian-lakes',
  },
];

