import { Columns3, Gauge, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AnalogueDestinationPanel } from './components/AnalogueDestinationPanel';
import { ComparisonModal } from './components/ComparisonModal';
import { DualComparisonPanel } from './components/DualComparisonPanel';
import { PlanetExplorationModal } from './components/PlanetExplorationModal';
import { PlanetAnalogueDiscoveryPage } from './components/PlanetAnalogueDiscoveryPage';
import { SearchFilterBar } from './components/SearchFilterBar';
import {
  PAGE_ROUTES,
  PLANET_DATASETS,
  PLANET_PLACES_BY_ID,
  type PageMode,
  type PlanetId,
  type PlanetPlace,
  type RotationSpeedPreset,
} from './data/planetaryAtlasData';
import { PlanetaryViewport } from './three/PlanetaryViewport';
import {
  computeLivePlanetTelemetry,
  DEFAULT_ROTATION_SPEED,
  getDualPageDataset,
  isDualComparisonMode,
  pageModeToPath,
  pageModeToPlanet,
  pathToPageMode,
  planetToPageMode,
  type EarthPinScope,
} from './utils/atlasLogic';

const SPEED_OPTIONS: ReadonlyArray<{ id: RotationSpeedPreset; label: string }> = [
  { id: 'slow', label: 'Slow' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
  { id: 'cinematic', label: 'Cinematic' },
];

function pushRoutePath(mode: PageMode) {
  if (typeof window === 'undefined') return;
  const targetPath = pageModeToPath(mode);
  if (window.location.pathname !== targetPath) {
    window.history.pushState({ pageMode: mode }, '', targetPath);
  }
}

export default function App() {
  const [pageMode, setPageMode] = useState<PageMode>(() =>
    typeof window !== 'undefined' ? pathToPageMode(window.location.pathname) : 'earth-mars'
  );
  const isDual = isDualComparisonMode(pageMode);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(() =>
    typeof window !== 'undefined' ? pageModeToPlanet(pathToPageMode(window.location.pathname)) : null
  );
  const [isRotating, setIsRotating] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const mode = pathToPageMode(window.location.pathname);
    return isDualComparisonMode(mode);
  });
  const [rotationSpeed, setRotationSpeed] = useState<RotationSpeedPreset>(DEFAULT_ROTATION_SPEED);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = pageModeToPlanet(pathToPageMode(window.location.pathname));
    return p ? PLANET_PLACES_BY_ID[p][0].id : null;
  });
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [earthPinScope, setEarthPinScope] = useState<EarthPinScope>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [citationFilter, setCitationFilter] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [explorationPlace, setExplorationPlace] = useState<PlanetPlace | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState<number>(() => Date.now());

  // 1Hz live telemetry clock for real-time diurnal temperatures across Earth, Mars & Moon
  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveTimestamp(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Keep state synchronized with browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const nextMode = pathToPageMode(window.location.pathname);
      const nextPlanet = pageModeToPlanet(nextMode);
      setPageMode(nextMode);
      setSelectedPlanet(nextPlanet);
      setHighlightedCardId(null);
      if (isDualComparisonMode(nextMode)) {
        setSelectedPlaceId(null);
        setIsRotating(true);
      } else if (nextPlanet) {
        setSelectedPlaceId(PLANET_PLACES_BY_ID[nextPlanet][0].id);
        setIsRotating(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToEarthMars = useCallback(() => {
    setPageMode('earth-mars');
    setSelectedPlanet(null);
    setSelectedPlaceId(null);
    setHighlightedCardId(null);
    setIsRotating(true);
    pushRoutePath('earth-mars');
  }, []);

  const navigateToDualComparison = useCallback((mode: 'earth-mars' | 'earth-moon') => {
    setPageMode(mode);
    setSelectedPlanet(null);
    setSelectedPlaceId(null);
    setHighlightedCardId(null);
    setIsRotating(true);
    pushRoutePath(mode);
  }, []);

  const navigateToPlanetDestination = useCallback(
    (planet: PlanetId, placeId?: string, cardId?: string) => {
      const nextMode = planetToPageMode(planet);
      setIsRotating(false);
      setPageMode(nextMode);
      setSelectedPlanet(planet);
      setSelectedPlaceId(placeId ?? PLANET_PLACES_BY_ID[planet][0].id);
      setHighlightedCardId(cardId ?? null);
      pushRoutePath(nextMode);
    },
    []
  );

  const handleSwitchRoute = useCallback(
    (mode: PageMode) => {
      if (isDualComparisonMode(mode)) {
        navigateToDualComparison(mode);
        return;
      }
      const planet = pageModeToPlanet(mode);
      if (planet) {
        navigateToPlanetDestination(planet);
      }
    },
    [navigateToDualComparison, navigateToPlanetDestination]
  );

  const handleClickPlanet = useCallback(
    (planet: PlanetId) => {
      if (planet === 'mars') {
        setPageMode('mars-analogues');
        pushRoutePath('mars-analogues');
        return;
      }
      if (planet === 'moon') {
        setPageMode('moon-analogues');
        pushRoutePath('moon-analogues');
        return;
      }
      if (isDualComparisonMode(pageMode)) {
        // Stay right inside Earth & Mars / Earth & Moon and freeze to inspect that world's first curated place
        const dualData = getDualPageDataset(pageMode);
        const firstPlace =
          planet === 'earth' ? dualData.earthPlaces[0] : dualData.rightPlaces[0];
        setIsRotating(false);
        setSelectedPlanet(planet);
        setSelectedPlaceId(firstPlace?.id ?? null);
        return;
      }
      // On Orbital Hub or solo pages: freeze rotation + open its dedicated solo analogue atlas
      navigateToPlanetDestination(planet);
    },
    [pageMode, navigateToPlanetDestination]
  );

  const handleSelectPlace = useCallback(
    (place: PlanetPlace) => {
      if (isDualComparisonMode(pageMode)) {
        setIsRotating(false);
        setSelectedPlanet(place.planet);
        setSelectedPlaceId(place.id);
        setHighlightedCardId(place.linkedCardId ?? null);
        return;
      }
      const nextMode = planetToPageMode(place.planet);
      setIsRotating(false);
      setPageMode(nextMode);
      setSelectedPlanet(place.planet);
      setSelectedPlaceId(place.id);
      setHighlightedCardId(place.linkedCardId ?? null);
      pushRoutePath(nextMode);
    },
    [pageMode]
  );

  const handleSelectCitation = useCallback((citation: string) => {
    setCitationFilter(citation.toLowerCase());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCompareOpen && !isDual) {
        navigateToEarthMars();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareOpen, isDual, navigateToEarthMars]);

  const activePlanetLabel = selectedPlanet
    ? PLANET_DATASETS[selectedPlanet].name.toUpperCase()
    : null;



  return (
    <div
      data-page-mode={pageMode}
      data-rotation-active={String(isRotating)}
      data-rotation-speed={rotationSpeed}
      data-selected-planet={selectedPlanet ?? 'none'}
      className="relative w-screen h-screen overflow-hidden bg-[#06080E] text-slate-100"
    >
      {pageMode === 'mars-analogues' ? (
        <PlanetAnalogueDiscoveryPage
          planet="mars"
          onBack={navigateToEarthMars}
          onSelectCitation={handleSelectCitation}
        />
      ) : pageMode === 'moon-analogues' ? (
        <PlanetAnalogueDiscoveryPage
          planet="moon"
          onBack={() => navigateToDualComparison('earth-moon')}
          onSelectCitation={handleSelectCitation}
        />
      ) : (
        <>
          {/* 3D WebGL Viewport */}
          {webglError ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div className="max-w-md rounded-xl bg-[#0D111A] border border-white/[0.1] p-6">
                <h1 className="font-display text-lg font-semibold text-slate-100">
                  3D Viewport Unavailable
                </h1>
                <p className="text-sm text-slate-400 mt-2">{webglError}</p>
              </div>
            </div>
          ) : (
            <PlanetaryViewport
              pageMode={pageMode}
              selectedPlanet={selectedPlanet}
              isRotating={isRotating}
              rotationSpeed={rotationSpeed}
              selectedPlaceId={selectedPlaceId}
              earthPinScope={earthPinScope}
              onSelectPlanet={handleClickPlanet}
              onSelectPlace={handleSelectPlace}
              onWebglError={setWebglError}
            />
          )}

      {/* Top Navigation Bar + Speed Control Bar (stacked naturally with zero mobile overlap) */}
      <div className="fixed top-0 inset-x-0 z-30 pointer-events-none flex flex-col">
        <header className="pointer-events-auto h-auto lg:h-[58px] px-3 sm:px-5 py-2 lg:py-0 bg-[#06080E]/92 border-b border-white/[0.08] flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={navigateToEarthMars}
              className="text-left cursor-pointer group shrink-0"
            >
              <h1 className="font-display text-xs sm:text-sm font-semibold tracking-[0.12em] uppercase text-slate-100 group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                TERRA // ANALOGUE
              </h1>
            </button>

            <nav
              aria-label="Primary Planetary Analogue Routes"
              className="flex flex-wrap lg:flex-nowrap items-center gap-1"
            >
              {PAGE_ROUTES.map((route) => {
                const isActive = pageMode === route.mode;
                const isOrangeActive =
                  route.mode === 'mars-analogues' || route.mode === 'earth-mars';
                const isVioletActive = route.mode === 'moon-analogues';

                const activeClasses = isOrangeActive
                  ? 'bg-orange-500/15 border-orange-400/60 text-orange-50'
                  : isVioletActive
                  ? 'bg-violet-500/15 border-violet-400/60 text-violet-50'
                  : 'bg-cyan-500/15 border-cyan-400/60 text-cyan-50';

                const accent = isOrangeActive
                  ? '#FF9100'
                  : isVioletActive
                  ? '#B388FF'
                  : '#00E5FF';

                return (
                  <button
                    key={route.mode}
                    type="button"
                    data-testid={`route-tab-${route.mode}`}
                    onClick={() => handleSwitchRoute(route.mode)}
                    className={`px-2 py-1 rounded text-[11px] font-mono-tech transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      isActive
                        ? activeClasses
                        : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span style={{ color: isActive ? accent : undefined }}>{route.code}</span>{' '}
                    <span>{route.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <SearchFilterBar
              query={searchQuery}
              citationFilter={citationFilter}
              onChangeQuery={setSearchQuery}
              onChangeCitation={setCitationFilter}
              onSelectResult={(planet, _tabId, cardId) => {
                navigateToPlanetDestination(planet, undefined, cardId);
              }}
            />

            <button
              type="button"
              data-testid="open-comparison-btn"
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/[0.1] bg-[#0D111A] hover:bg-white/[0.1] text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Columns3 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Compare</span>
            </button>
          </div>
        </header>

        {/* Orbital Speed & Live Rotation Control Bar */}
        <div
          data-testid="rotation-speed-dock"
          className="pointer-events-auto self-start mt-2.5 ml-3 sm:ml-5 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-[#0A0E17]/92 border border-white/[0.1] px-2.5 py-1.5 shadow-xl"
        >
          <button
            type="button"
            data-testid="rotation-status-pill"
            onClick={() => setIsRotating((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono-tech text-[10.5px] tracking-wider border transition-colors cursor-pointer whitespace-nowrap ${
              isRotating
                ? 'bg-cyan-500/12 border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/20'
                : 'bg-amber-500/12 border-amber-400/40 text-amber-100 hover:bg-amber-500/20'
            }`}
            title="Toggle planetary spin & cloud drift"
          >
            {isRotating ? (
              <>
                <Play className="w-2.5 h-2.5 text-cyan-300 fill-current shrink-0" />
                <span>SPIN: ACTIVE</span>
              </>
            ) : (
              <>
                <Pause className="w-2.5 h-2.5 text-amber-400 fill-current shrink-0" />
                <span>{activePlanetLabel ? `HALTED · ${activePlanetLabel}` : 'SPIN: PAUSED'}</span>
              </>
            )}
          </button>

          <div className="h-3.5 w-px bg-white/[0.1] mx-0.5 hidden sm:block" />

          <div className="inline-flex items-center gap-1" role="group" aria-label="Orbital animation speed">
            <Gauge className="w-3 h-3 text-slate-400 mr-0.5 hidden sm:block" />
            {SPEED_OPTIONS.map((opt) => {
              const active = rotationSpeed === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`speed-preset-${opt.id}`}
                  onClick={() => setRotationSpeed(opt.id)}
                  className={`px-2 py-0.5 rounded font-mono-tech text-[10.5px] transition-colors cursor-pointer whitespace-nowrap border ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-100'
                      : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>





      {/* Dedicated Destination Panel (Telluric Atlas Split Screen on Right 48%) */}
      {!isDual && selectedPlanet && (
        <AnalogueDestinationPanel
          planet={selectedPlanet}
          selectedPlaceId={selectedPlaceId}
          highlightedCardId={highlightedCardId}
          isRotating={isRotating}
          liveTimestamp={liveTimestamp}
          earthPinScope={earthPinScope}
          onChangeEarthPinScope={setEarthPinScope}
          onSelectPlace={handleSelectPlace}
          onSelectCitation={handleSelectCitation}
          onToggleLocalRotation={() => setIsRotating((prev) => !prev)}
          onBackToHub={navigateToEarthMars}
          onOpenExploration={(place) => setExplorationPlace(place)}
        />
      )}
      </>
      )}

      {/* Side-by-Side Comparison Matrix Modal */}
      <ComparisonModal open={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
      <PlanetExplorationModal
        place={explorationPlace}
        isOpen={Boolean(explorationPlace)}
        onClose={() => setExplorationPlace(null)}
        onSelectCitation={handleSelectCitation}
      />
    </div>
  );
}
