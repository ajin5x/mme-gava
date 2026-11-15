import { ArrowLeft, ExternalLink, Globe, MapPin, Sparkles, ZoomIn, X } from 'lucide-react';
import { useState } from 'react';
import type { PlanetId } from '../data/planetaryAtlasData';

export interface AnalogueDiscoverySite {
  id: string;
  title: string;
  country: string;
  coordinates: string;
  earthImage: string;
  earthImageCredit: string;
  planetImage: string;
  planetImageCredit: string;
  planetName: 'Mars' | 'Moon';
  geologicalFormations: string;
  climateConditions: string;
  similarities: string[];
  differences: string[];
  correspondingFeature: string;
  researchRelevance: string;
}

const MARS_ANALOGUE_DISCOVERY_SITES: AnalogueDiscoverySite[] = [
  {
    id: 'atacama-mars',
    title: 'Atacama Desert',
    country: 'Chile',
    coordinates: '23.86° S, 69.13° W',
    earthImage: '/assets/photographs/mars-01-earth-atacama.jpg',
    earthImageCredit: 'NASA Earth Observatory / USGS Terrestrial Archive',
    planetImage: '/assets/photographs/mars-01-planet-perseverance.png',
    planetImageCredit: 'NASA / JPL-Caltech / Perseverance Mastcam-Z',
    planetName: 'Mars',
    geologicalFormations: 'Hyper-arid alluvial fans, ancient salt lakes (salaars), and evaporite mineral crusts.',
    climateConditions: 'Extremely dry, high solar ultraviolet radiation, minimal precipitation (mm per decade in core zones).',
    similarities: [
      'Extremely low soil moisture and hyper-arid evaporite crusts.',
      'Perchlorate salt concentrations matching Phoenix and Curiosity rover soil samples.',
      'High UV flux requiring specialized extremophile adaptations.'
    ],
    differences: [
      'Atacama atmosphere is rich nitrogen-oxygen at 1,013 mbar; Mars is ~1% CO₂.',
      'Atacama supports sparse microbial life and specialized desert flora; Mars surface is lifeless to date.',
      'Earth diurnal temperature swings are moderated by oceans; Martian swings are extreme.'
    ],
    correspondingFeature: 'Vastitas Borealis and Meridiani Planum perchlorate-rich regolith plains.',
    researchRelevance: 'Serves as the benchmark testing ground for astrobiological soil sensors, Raman spectrometers, and perchlorate detection assays.',
  },
  {
    id: 'mcmurdo-mars',
    title: 'McMurdo Dry Valleys',
    country: 'Antarctica',
    coordinates: '77.47° S, 162.52° E',
    earthImage: '/assets/photographs/mars-02-earth-mcmurdo.jpg',
    earthImageCredit: 'US Antarctic Program / NASA Earth Observatory',
    planetImage: '/assets/photographs/mars-02-planet-curiosity-valley.jpg',
    planetImageCredit: 'NASA / JPL-Caltech / Gale Crater Mastcam',
    planetName: 'Mars',
    geologicalFormations: 'Polar desert permafrost valleys, glacial meltwater streams, and ice-covered perennially frozen lakes.',
    climateConditions: 'Sub-zero annual mean temperatures, katabatic drying winds, and sub-glacial brines.',
    similarities: [
      'Cold polar desert conditions with negligible liquid precipitation.',
      'Permafrost-dominated soil mechanics and cold-dry weathering processes.',
      'Analogous sub-surface brines and salt precipitation patterns.'
    ],
    differences: [
      'Antarctic atmospheric pressure is significantly higher than Mars surface pressure.',
      'Presence of polar ice sheets and active glacial hydrology.',
      'Terrestrial ozone depletion dynamics differ from Martian overhead CO₂ columns.'
    ],
    correspondingFeature: 'Northern polar permafrost plains and Gale Crater ancient lake sedimentary strata.',
    researchRelevance: 'Crucial for studying cold-desert weathering limits, subsurface ice stability, and permafrost astrobiology.',
  },
  {
    id: 'devon-mars',
    title: 'Devon Island (Haughton Crater)',
    country: 'Canada (Nunavut)',
    coordinates: '75.38° N, 89.68° W',
    earthImage: '/assets/photographs/mars-03-earth-devon-haughton.jpg',
    earthImageCredit: 'NASA / Haughton-Mars Project Expedition',
    planetImage: '/assets/photographs/mars-03-planet-victoria-crater.jpg',
    planetImageCredit: 'NASA / JPL-Caltech / MRO HiRISE',
    planetName: 'Mars',
    geologicalFormations: 'Complex impact crater breccia, cold impactite rocks, and periglacial patterned ground.',
    climateConditions: 'Polar desert climate with permafrost permanently locked to depths of over 500 meters.',
    similarities: [
      'Impact-shattered target rocks providing direct analogues to Martian crater rims.',
      'Periglacial freeze-thaw polygons and patterned ground matching Martian stone circles.',
      'Barren, reddish iron-oxide weathered impact ejecta.'
    ],
    differences: [
      'Devon Island has an active hydrological cycle during brief summer thaws.',
      'Terrestrial tundra flora appears in sheltered valleys during summer.',
      'Earth atmospheric density cushions micrometeorite flux compared to Mars.'
    ],
    correspondingFeature: 'Valles Marineris canyon walls and ancient impact craters such as Jezero and Gale.',
    researchRelevance: 'Primary site for human EVA simulation suits, robotic rover traverse planning, and impact breccia analysis.',
  },
  {
    id: 'iceland-mars',
    title: 'Icelandic Volcanic Highlands',
    country: 'Iceland',
    coordinates: '64.43° N, 20.36° W',
    earthImage: '/assets/photographs/mars-04-earth-iceland-leirhnjukur.jpg',
    earthImageCredit: 'Icelandic Meteorological Office / USGS Archives',
    planetImage: '/assets/photographs/mars-04-planet-olympus-viking1.jpg',
    planetImageCredit: 'NASA / Viking 1 Orbiter Archive',
    planetName: 'Mars',
    geologicalFormations: 'Recent basaltic lava fields, hyaloclastite ridges, volcanic calderas, and subglacial tuya volcanoes.',
    climateConditions: 'Subarctic windy, high-altitude volcanic plateau with rapid freeze-thaw weathering.',
    similarities: [
      'Pristine tholeiitic basalt composition matching Martian volcanic plains.',
      'Lack of vegetation across high-land black sand desert flats (Sandsvegir).',
      'Lava tube formation mechanics identical to Tharsis volcanic tubes.'
    ],
    differences: [
      'High annual precipitation and extensive glacial river runoff.',
      'Active geothermal hydrothermal systems with boiling mud springs.',
      'Dense atmospheric oxygen and moisture.'
    ],
    correspondingFeature: 'Tharsis volcanic province and Olympus Mons basaltic shield flows.',
    researchRelevance: 'Essential for testing rover mobility over blocky aa and pahoehoe basalt terrains and studying basaltic glass weathering.',
  },
  {
    id: 'dallol-mars',
    title: 'Dallol Hydrothermal Depression',
    country: 'Ethiopia (Danakil Depression)',
    coordinates: '14.24° N, 40.30° E',
    earthImage: '/assets/photographs/mars-05-earth-dallol.jpg',
    earthImageCredit: 'Euronews Science / Geological Survey of Ethiopia',
    planetImage: '/assets/photographs/mars-05-planet-mineral-vein.jpg',
    planetImageCredit: 'NASA / JPL-Caltech / Curiosity ChemCam',
    planetName: 'Mars',
    geologicalFormations: 'Hydrothermal salt domes, acidic sulfur pools, and iron-oxide mineral veins.',
    climateConditions: 'One of the hottest permanently inhabited places on Earth, extreme hyper-saline evaporation.',
    similarities: [
      'Abundant sulfate minerals, iron oxides, and hydrothermal evaporite veins.',
      'Extreme chemical stress environments testing habitability boundaries.',
      'Analogous subsurface brine chemistry.'
    ],
    differences: [
      'Dallol is intensely hot and volcanically active; Mars surface is predominantly freezing cold.',
      'Presence of active aqueous acidic hydrothermal springs.',
      'Thick terrestrial nitrogen atmosphere.'
    ],
    correspondingFeature: 'Gale Crater sulfate mineral veins and ancient hydrothermal fracture fills.',
    researchRelevance: 'Invaluable for studying astrobiological biosignature preservation in extreme hydrothermal mineral precipitates.',
  },
];

const MOON_ANALOGUE_DISCOVERY_SITES: AnalogueDiscoverySite[] = [
  {
    id: 'hawaii-moon',
    title: 'Mauna Kea & Kilauea Volcanic Fields',
    country: 'United States (Hawaii)',
    coordinates: '19.53° N, 155.57° W',
    earthImage: '/assets/photographs/moon-01-earth-hawaii.jpg',
    earthImageCredit: 'USGS Hawaiian Volcano Observatory / NASA',
    planetImage: '/assets/photographs/moon-01-planet-apollo15-hadley.jpg',
    planetImageCredit: 'NASA / Apollo 15 Archive / LRO',
    planetName: 'Moon',
    geologicalFormations: 'Pristine basaltic lava flows, cinder cones, and glass-rich volcanic tephra beds.',
    climateConditions: 'High-altitude tropical alpine summit / tropical volcanic coastal zones.',
    similarities: [
      'Fresh, unweathered basaltic glass and iron-rich volcanic rocks matching lunar mare regolith.',
      'Steep cinder cone morphology mirroring lunar impact ejecta mounds.',
      'Host of HI-SEAS long-duration astronaut isolation habitats.'
    ],
    differences: [
      'Tropical humidity and rainfall on Earth vs. lunar vacuum.',
      'Vegetation cover at lower elevations.',
      'Thick terrestrial atmosphere and magnetic field.'
    ],
    correspondingFeature: 'Mare Tranquillitatis and Oceanus Procellarum basalt plains.',
    researchRelevance: 'Primary location for astronaut geological EVA training, volcanic stratigraphy sampling, and habitat isolation studies.',
  },
  {
    id: 'lanzarote-moon',
    title: 'Lanzarote Volcanic Calderas (Geopark)',
    country: 'Spain (Canary Islands)',
    coordinates: '29.04° N, 13.63° W',
    earthImage: '/assets/photographs/moon-02-earth-lanzarote.jpg',
    earthImageCredit: 'ESA / PANGAEA Training Campaign Archive',
    planetImage: '/assets/photographs/moon-02-planet-apollo17-taurus.jpg',
    planetImageCredit: 'NASA / Apollo 17 / LRO Wide Angle Camera',
    planetName: 'Moon',
    geologicalFormations: 'Timanfaya basaltic lava fields, volcanic tubes, and pristine pyroclastic cones.',
    climateConditions: 'Semi-arid volcanic island climate with minimal rainfall and strong trade winds.',
    similarities: [
      'Extensive dark basaltic sand fields resembling lunar mare regolith.',
      'Lava tubes and subterranean collapse pits mimicking lunar pit craters.',
      'Host site for ESA PANGAEA astronaut field geology training.'
    ],
    differences: [
      'Oceanic island humidity and maritime weather moderation.',
      'Presence of resilient pioneer plant species in sheltered crevices.',
      'Terrestrial atmospheric pressure and weathering.'
    ],
    correspondingFeature: 'Copernicus Crater ejecta blankets and Marius Hills lunar lava tubes.',
    researchRelevance: 'Selected by the European Space Agency (ESA) to train astronauts in lunar rock identification, sampling tools, and field communication protocols.',
  },
  {
    id: 'iceland-moon',
    title: 'Lambahraun Lava Field & Lava Tubes',
    country: 'Iceland',
    coordinates: '64.43° N, 20.36° W',
    earthImage: '/assets/photographs/moon-03-earth-iceland-laki.jpg',
    earthImageCredit: 'Icelandic Institute of Natural History / CHILL-ICE',
    planetImage: '/assets/photographs/moon-03-planet-apollo12-lro.jpg',
    planetImageCredit: 'NASA / LRO Narrow Angle Camera',
    planetName: 'Moon',
    geologicalFormations: 'Blocky basaltic lava flows, subterranean volcanic tubes, and glacial outwash plains.',
    climateConditions: 'Subarctic windy and cold plateau with persistent snowfields.',
    similarities: [
      'Subterranean lava tube networks providing stable thermal conditions and radiation shielding.',
      'Blocky aa lava fields testing rover wheel traction and mechanical durability.',
      'Tested CHILL-ICE lunar habitat shelter deployment.'
    ],
    differences: [
      'Glacial meltwater streams and subglacial volcanic interactions.',
      'Subarctic vegetation and moss cover during summer months.',
      'Terrestrial atmospheric pressure.'
    ],
    correspondingFeature: 'Lunar lava tube skylights and highland basalt fracture zones.',
    researchRelevance: 'Used for testing autonomous lunar rover prototypes and evaluating subsurface habitat construction inside dark basaltic tubes.',
  },
  {
    id: 'atacama-moon',
    title: 'Atacama Desert Salar & Highlands',
    country: 'Chile',
    coordinates: '23.86° S, 69.13° W',
    earthImage: '/assets/photographs/moon-04-earth-atacama-valle.jpg',
    earthImageCredit: 'ESO / ALMA Observatory / Atacama Archive',
    planetImage: '/assets/photographs/moon-04-planet-apollo16-highlands.jpg',
    planetImageCredit: 'NASA / Apollo 16 Metric Camera Archive',
    planetName: 'Moon',
    geologicalFormations: 'Anhydrous salt flats, ignimbrite plateaus, and dust-covered alluvial fans.',
    climateConditions: 'Hyper-arid, extreme sunshine, virtually zero humidity.',
    similarities: [
      'Extreme aridity and dust-mantled terrain resembling highland regolith accumulation.',
      'High altitude solar radiation levels comparable to unshielded lunar daytime exposure.',
      'Absence of surface water channels in core desert zones.'
    ],
    differences: [
      'Atacama soil contains significant clay and evaporite minerals; lunar regolith is pulverized anorthosite impact glass.',
      'Earth oxygen atmosphere vs. lunar vacuum.',
      'Nighttime temperatures on Moon plummet to -173°C.'
    ],
    correspondingFeature: 'Anorthositic lunar highlands and Descartes crater landing formations.',
    researchRelevance: 'Testing ground for dry-drilling robotic sampling tools and evaluating spacesuit dust mitigation strategies.',
  },
  {
    id: 'arctic-moon',
    title: 'Axel Heiberg Island & Haughton Impact Structure',
    country: 'Canada (High Arctic)',
    coordinates: '79.40° N, 90.60° W',
    earthImage: '/assets/photographs/moon-05-earth-arctic-axel.jpg',
    earthImageCredit: 'Polar Continental Shelf Project / Natural Resources Canada',
    planetImage: '/assets/photographs/moon-05-planet-shackleton-lro.jpg',
    planetImageCredit: 'NASA / LRO Lunar South Pole Laser Altimeter',
    planetName: 'Moon',
    geologicalFormations: 'Cold-desert polar impact structures, diapiric salt domes, and permafrost weathering.',
    climateConditions: 'Polar high-arctic desert with permanent sub-zero ground temperatures.',
    similarities: [
      'Polar cold trap conditions and permafrost stability analogous to permanently shadowed lunar polar craters.',
      'Impact-shattered megaregolith mimicking lunar crustal fracturing.',
      'Harsh polar logistics testing human endurance and life-support systems.'
    ],
    differences: [
      'Seasonal polar sunlight variations differ from the 29.5-day lunar day-night cycle.',
      'Presence of specialized cold-adapted microbial mats in thermal springs.',
      'Terrestrial atmospheric shielding.'
    ],
    correspondingFeature: 'Lunar South Pole Shackleton Crater rim and permanently shadowed polar ice traps.',
    researchRelevance: 'Simulates Artemis mission polar EVA operations, cryogenic sampling protocols, and survival in extreme cold-trap environments.',
  },
];

interface PlanetAnalogueDiscoveryPageProps {
  planet: PlanetId;
  onBack: () => void;
  onSelectCitation: (citation: string) => void;
}

export function PlanetAnalogueDiscoveryPage({
  planet,
  onBack,
  onSelectCitation,
}: PlanetAnalogueDiscoveryPageProps) {
  const isMars = planet === 'mars';
  const sites = isMars ? MARS_ANALOGUE_DISCOVERY_SITES : MOON_ANALOGUE_DISCOVERY_SITES;
  const pageTitle = isMars
    ? 'MARS ON EARTH — DISCOVER PLACES THAT RESEMBLE MARS'
    : 'MOON ON EARTH — DISCOVER PLACES THAT RESEMBLE THE MOON';
  const subtitle = isMars
    ? 'Exploring terrestrial analogue field sites in Chile, Antarctica, Canada, Iceland, and Ethiopia that mirror Martian climate, perchlorates, ancient lakebeds, and basaltic volcanism.'
    : 'Discovering Earth locations in Hawaii, Spain, Iceland, Chile, and the Canadian Arctic that replicate lunar basalt flows, lava tubes, impact craters, and polar cold traps.';

  const accentColor = isMars ? '#FF9100' : '#B388FF';

  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; caption: string; credit: string } | null>(null);

  return (
    <div className="relative w-screen h-screen overflow-y-auto atlas-scroll bg-[#06080E] text-slate-100 pb-24">
      {/* Fixed Header & Back Navigation */}
      <header className="sticky top-0 inset-x-0 z-40 bg-[#06080E]/95 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            data-testid="back-to-planet-comparison"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.12] bg-[#0D111A] hover:bg-white/[0.1] text-slate-200 transition-colors cursor-pointer text-xs font-mono-tech font-medium"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>BACK TO PLANET COMPARISON</span>
          </button>

          <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

          <h1 className="font-display text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-slate-300 hidden md:block">
            TERRA // ANALOGUE DISCOVERY PORTAL
          </h1>
        </div>

        <span
          className="font-mono-tech text-[10.5px] uppercase tracking-wider px-2.5 py-1 rounded border"
          style={{ borderColor: `${accentColor}55`, color: accentColor, backgroundColor: `${accentColor}12` }}
        >
          {isMars ? 'MARS ANALOGUE EXPEDITION' : 'LUNAR ANALOGUE EXPEDITION'}
        </span>
      </header>

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/[0.08]">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-widest text-slate-400">
            <Globe className="w-4 h-4" style={{ color: accentColor }} />
            <span>Terrestrial Field Science & Space Mission Rehearsal</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-50 leading-tight">
            {pageTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/[0.1] shrink-0 text-center sm:text-right">
          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-400 block">
            Curated Field Sites
          </span>
          <span className="font-mono-tech text-2xl font-bold mt-0.5 block" style={{ color: accentColor }}>
            05 Sites
          </span>
          <span className="font-mono-tech text-[10px] text-slate-400 block mt-1">
            Verified NASA & ESA Archives
          </span>
        </div>
      </section>

      {/* Main Content: List of Analogue Sites */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-16">
        {sites.map((site, index) => (
          <article
            key={site.id}
            data-testid={`analogue-site-card-${site.id}`}
            className="rounded-2xl bg-[#080B14] border border-white/[0.1] overflow-hidden shadow-2xl transition-all hover:border-white/[0.2]"
          >
            {/* Site Header */}
            <div className="px-6 sm:px-8 py-5 bg-[#0D121F] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded border border-white/[0.15]"
                  style={{ color: accentColor, backgroundColor: `${accentColor}18` }}
                >
                  SITE 0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-slate-50">
                    {site.title} — {site.country}
                  </h3>
                  <p className="font-mono-tech text-xs text-slate-400 mt-0.5">
                    Coordinates: {site.coordinates}
                  </p>
                </div>
              </div>

              <div className="font-mono-tech text-xs text-slate-400 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Target Body: {site.planetName} Analogue</span>
              </div>
            </div>

            {/* Two-Image Side-by-Side Comparison Layout */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* LEFT SIDE: ACTUAL EARTH LOCATION */}
              <div className="rounded-xl bg-[#05070D] border border-white/[0.08] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono-tech text-xs text-cyan-400 uppercase tracking-widest font-semibold">
                      ACTUAL EARTH LOCATION
                    </span>
                    <span className="font-mono-tech text-[10.5px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      {site.title}, {site.country}
                    </span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setFullscreenImage({
                        src: site.earthImage,
                        caption: `${site.title}, ${site.country} (Terrestrial Analogue)`,
                        credit: site.earthImageCredit,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setFullscreenImage({
                          src: site.earthImage,
                          caption: `${site.title}, ${site.country} (Terrestrial Analogue)`,
                          credit: site.earthImageCredit,
                        });
                      }
                    }}
                    className="relative w-full h-64 sm:h-72 rounded-lg overflow-hidden border border-cyan-500/20 bg-black cursor-pointer group"
                  >
                    <img
                      src={site.earthImage}
                      alt={site.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                      <span className="font-mono-tech text-[11px] text-cyan-200">
                        {site.earthImageCredit}
                      </span>
                      <span className="p-1.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <strong className="text-slate-100 font-mono-tech">Geology:</strong> {site.geologicalFormations}
                    </p>
                    <p>
                      <strong className="text-slate-100 font-mono-tech">Climate:</strong> {site.climateConditions}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: ACTUAL MARS / MOON MISSION PHOTOGRAPH */}
              <div className="rounded-xl bg-[#05070D] border border-white/[0.08] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="font-mono-tech text-xs uppercase tracking-widest font-semibold"
                      style={{ color: accentColor }}
                    >
                      ACTUAL {site.planetName.toUpperCase()} MISSION ARCHIVE
                    </span>
                    <span
                      className="font-mono-tech text-[10.5px] px-2 py-0.5 rounded border"
                      style={{ borderColor: `${accentColor}55`, color: accentColor, backgroundColor: `${accentColor}12` }}
                    >
                      {site.correspondingFeature}
                    </span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setFullscreenImage({
                        src: site.planetImage,
                        caption: `${site.planetName} Comparison Target (${site.correspondingFeature})`,
                        credit: site.planetImageCredit,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setFullscreenImage({
                          src: site.planetImage,
                          caption: `${site.planetName} Comparison Target (${site.correspondingFeature})`,
                          credit: site.planetImageCredit,
                        });
                      }
                    }}
                    className="relative w-full h-64 sm:h-72 rounded-lg overflow-hidden border border-white/[0.15] bg-black cursor-pointer group"
                  >
                    <img
                      src={site.planetImage}
                      alt={site.correspondingFeature}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                      <span className="font-mono-tech text-[11px] text-slate-200">
                        {site.planetImageCredit}
                      </span>
                      <span className="p-1.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <strong className="text-slate-100 font-mono-tech">Target Feature:</strong> {site.correspondingFeature}
                    </p>
                    <p>
                      <strong className="text-slate-100 font-mono-tech">Mission Source:</strong> Verified NASA, ESA & USGS public archives
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Below Images: Similarities, Differences & Research Relevance */}
            <div className="px-6 sm:px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/[0.08]">
              {/* Similarities */}
              <div className="space-y-2 pt-4">
                <h4 className="font-mono-tech text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span>✓ What is Similar?</span>
                </h4>
                <ul className="space-y-1.5">
                  {site.similarities.map((sim, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0">·</span>
                      <span>{sim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Differences */}
              <div className="space-y-2 pt-4">
                <h4 className="font-mono-tech text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <span>✗ What is Different?</span>
                </h4>
                <ul className="space-y-1.5">
                  {site.differences.map((diff, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-amber-400 shrink-0">·</span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Research Relevance */}
              <div className="space-y-2 pt-4">
                <h4
                  className="font-mono-tech text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5"
                  style={{ color: accentColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Planetary Research Value</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {site.researchRelevance}
                </p>
              </div>
            </div>
          </article>
        ))}
      </main>

      {/* Full-Screen Image Viewer Modal */}
      {fullscreenImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen Image Viewer"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-lg animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={fullscreenImage.src}
              alt={fullscreenImage.caption}
              className="max-w-full max-h-[75vh] object-contain rounded-lg border border-white/20 shadow-2xl"
            />

            <div className="mt-4 text-center space-y-1">
              <p className="font-display text-sm font-semibold text-slate-100">
                {fullscreenImage.caption}
              </p>
              <p className="font-mono-tech text-xs text-cyan-300">
                Credit / Source: {fullscreenImage.credit}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
