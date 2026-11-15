import { ArrowLeft, ArrowRight, Globe2, MapPin, Pause, Play, Sparkles, Thermometer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PLANET_DATASETS, type PlanetId, type PlanetPlace } from '../data/planetaryAtlasData';
import { computeLivePlanetTelemetry, getDualPageDataset } from '../utils/atlasLogic';

interface DualComparisonPanelProps {
  mode: 'earth-mars' | 'earth-moon';
  selectedPlaceId: string | null;
  selectedPlanet: PlanetId | null;
  isRotating: boolean;
  liveTimestamp: number;
  onSelectPlace: (place: PlanetPlace) => void;
  onSelectCitation: (citation: string) => void;
  onOpenSoloPlanet: (planet: PlanetId) => void;
  onToggleRotation: () => void;
  onBackToHub: () => void;
}

type DualTabKey = 'overview' | 'places' | 'analogues';

export function DualComparisonPanel({
  mode,
  selectedPlaceId,
  selectedPlanet,
  isRotating,
  liveTimestamp,
  onSelectPlace,
  onSelectCitation,
  onOpenSoloPlanet,
  onToggleRotation,
  onBackToHub,
}: DualComparisonPanelProps) {
  const { spec, earthPlaces, rightPlaces, analogueSites } = getDualPageDataset(mode);
  const rightMeta = PLANET_DATASETS[spec.rightPlanet];
  const allDualPlaces = [...earthPlaces, ...rightPlaces];

  const [tab, setTab] = useState<DualTabKey>('overview');

  // Automatically focus Places Explorer when a specific globe place or pin is clicked
  useEffect(() => {
    if (selectedPlaceId && allDualPlaces.some((p) => p.id === selectedPlaceId)) {
      setTab('places');
    }
  }, [selectedPlaceId]);

  const activePlace =
    allDualPlaces.find((p) => p.id === selectedPlaceId) ??
    (selectedPlanet === spec.rightPlanet ? rightPlaces[0] : earthPlaces[0]);

  const earthLive = computeLivePlanetTelemetry('earth', earthPlaces[0], liveTimestamp);
  const rightLive = computeLivePlanetTelemetry(spec.rightPlanet, rightPlaces[0], liveTimestamp);
  const activePlaceLive = computeLivePlanetTelemetry(
    activePlace.planet,
    activePlace,
    liveTimestamp
  );
  const activePlaceAccent = PLANET_DATASETS[activePlace.planet].accentPrimary;

  return (
    <section
      data-testid="dual-comparison-panel"
      aria-label={spec.title}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96vw] max-w-6xl max-h-[45vh] flex flex-col rounded-xl bg-[#0A0E17]/95 border border-white/[0.1] shadow-2xl overflow-hidden"
    >
      {/* Dual Header Bar */}
      <div className="px-4 py-2.5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.15em] text-cyan-300">
              {mode === 'earth-mars'
                ? '01 · Earth & Mars Dual Page'
                : '02 · Earth & Moon Dual Page'}
            </span>
            <span className="font-mono-tech text-[10px] text-slate-400">
              · Click any globe or 3D pin above to freeze &amp; inspect its live features
            </span>
          </div>
          <h2 className="font-display text-sm sm:text-base font-semibold text-slate-100 mt-0.5">
            {spec.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleRotation}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono-tech bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] text-slate-200 cursor-pointer"
          >
            {isRotating ? (
              <>
                <Pause className="w-3 h-3 text-amber-300" />
                <span>Freeze</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-cyan-300 fill-current" />
                <span>Spin</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBackToHub}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono-tech bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Orbital Hub</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSoloPlanet('earth')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono-tech bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-100 cursor-pointer"
          >
            <span>Earth Solo</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => onOpenSoloPlanet(spec.rightPlanet)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono-tech border cursor-pointer"
            style={{
              backgroundColor: `${rightMeta.accentPrimary}20`,
              borderColor: `${rightMeta.accentPrimary}88`,
              color: '#f8fafc',
            }}
          >
            <span>{rightMeta.name} Solo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mode Section Switcher */}
      <div
        role="tablist"
        aria-label={`${spec.title} views`}
        className="px-4 py-1.5 bg-[#060911] border-b border-white/[0.07] flex items-center gap-1.5 shrink-0 overflow-x-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          data-testid="dual-tab-overview"
          onClick={() => setTab('overview')}
          className={`px-3 py-1 rounded font-mono-tech text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
            tab === 'overview'
              ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-50'
              : 'border border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
          }`}
        >
          1. Overview &amp; Live Telemetry
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'places'}
          data-testid="dual-tab-places"
          onClick={() => setTab('places')}
          className={`px-3 py-1 rounded font-mono-tech text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
            tab === 'places'
              ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-50'
              : 'border border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
          }`}
        >
          2. Places &amp; Pin Features ({earthPlaces.length} Earth + {rightPlaces.length} {rightMeta.name})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'analogues'}
          data-testid="dual-tab-analogues"
          onClick={() => setTab('analogues')}
          className={`px-3 py-1 rounded font-mono-tech text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
            tab === 'analogues'
              ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-50'
              : 'border border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
          }`}
        >
          3. Matched Analogue Field Sites ({analogueSites.length})
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto atlas-scroll p-3.5">
        {tab === 'overview' && (
          <div className="space-y-2.5">
            {/* Live Dual World Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-[#05070D]/85 border border-cyan-400/25 px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider text-cyan-300">
                    <Globe2 className="w-3 h-3 shrink-0" />
                    <span>Earth · Active Hydrosphere</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 truncate">
                    {PLANET_DATASETS.earth.telemetry.gravity} ({PLANET_DATASETS.earth.telemetry.gravityG}) · {PLANET_DATASETS.earth.telemetry.pressure}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-tech text-sm font-semibold text-cyan-200">
                    {earthLive.temperatureC > 0 ? `+${earthLive.temperatureC}` : earthLive.temperatureC}°C
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400">
                    {earthLive.localSolarTimeLabel}
                  </div>
                </div>
              </div>

              <div
                className="rounded-lg bg-[#05070D]/85 border px-3.5 py-2.5 flex items-center justify-between gap-3"
                style={{ borderColor: `${rightMeta.accentPrimary}44` }}
              >
                <div className="min-w-0">
                  <div
                    className="flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider"
                    style={{ color: rightMeta.accentPrimary }}
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>{rightMeta.name} · {rightMeta.classification}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 truncate">
                    {rightMeta.telemetry.gravity} ({rightMeta.telemetry.gravityG}) · {rightMeta.telemetry.pressure}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="font-mono-tech text-sm font-semibold"
                    style={{ color: rightMeta.accentPrimary }}
                  >
                    {rightLive.temperatureC > 0 ? `+${rightLive.temperatureC}` : rightLive.temperatureC}°C
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400">
                    {rightLive.localSolarTimeLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Key Scientific Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {spec.rows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg bg-[#05070D]/80 border border-white/[0.07] px-3 py-2"
                >
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-400">
                    {row.label}
                  </div>
                  <div className="mt-1 space-y-0.5 text-[11.5px]">
                    <div className="text-cyan-200 truncate">
                      <span className="font-mono-tech text-cyan-400/90">EARTH:</span> {row.leftValue}
                    </div>
                    <div className="truncate text-slate-200">
                      <span
                        className="font-mono-tech uppercase"
                        style={{ color: rightMeta.accentPrimary }}
                      >
                        {rightMeta.name}:
                      </span>{' '}
                      {row.rightValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'places' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" data-testid="dual-places-explorer">
            {/* Place Selectors for BOTH worlds on one screen */}
            <div className="lg:col-span-5 space-y-2.5">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-wider text-cyan-300 mb-1">
                  Earth Analogue Places ({earthPlaces.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {earthPlaces.map((place) => {
                    const active = place.id === activePlace.id;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        data-testid={`dual-place-${place.id}`}
                        onClick={() => onSelectPlace(place)}
                        className={`text-left px-2.5 py-1.5 rounded border text-[11.5px] transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-500/18 border-cyan-400/70 text-slate-50'
                            : 'bg-[#05070D]/80 border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                        }`}
                      >
                        <div className="font-medium truncate">{place.name}</div>
                        <div className="font-mono-tech text-[9.5px] text-slate-400 truncate">
                          {place.region} · {place.tempMinC}°..{place.tempMaxC}°C
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div
                  className="font-mono-tech text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: rightMeta.accentPrimary }}
                >
                  {rightMeta.name} Surface Places ({rightPlaces.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {rightPlaces.map((place) => {
                    const active = place.id === activePlace.id;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        data-testid={`dual-place-${place.id}`}
                        onClick={() => onSelectPlace(place)}
                        style={
                          active
                            ? {
                                backgroundColor: `${rightMeta.accentPrimary}24`,
                                borderColor: `${rightMeta.accentPrimary}AA`,
                              }
                            : undefined
                        }
                        className={`text-left px-2.5 py-1.5 rounded border text-[11.5px] transition-colors cursor-pointer ${
                          active
                            ? 'text-slate-50'
                            : 'bg-[#05070D]/80 border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                        }`}
                      >
                        <div className="font-medium truncate">{place.name}</div>
                        <div className="font-mono-tech text-[9.5px] text-slate-400 truncate">
                          {place.coordLabel} · {place.tempMinC}°..{place.tempMaxC}°C
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Place Detail Inspector */}
            <article
              data-testid="dual-selected-place-card"
              className="lg:col-span-7 rounded-lg bg-[#05070D]/90 border border-white/[0.1] p-3.5 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider" style={{ color: activePlaceAccent }}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {PLANET_DATASETS[activePlace.planet].name} · {activePlace.coordLabel} · {activePlace.terrainType}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-50 mt-0.5">
                      {activePlace.name} ({activePlace.region})
                    </h3>
                  </div>

                  <div className="text-left sm:text-right font-mono-tech shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-100 whitespace-nowrap">
                      <Thermometer className="w-3 h-3" style={{ color: activePlaceAccent }} />
                      <span>
                        {activePlaceLive.temperatureC > 0
                          ? `+${activePlaceLive.temperatureC}`
                          : activePlaceLive.temperatureC}
                        °C ({activePlaceLive.temperatureK} K)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                      {activePlaceLive.localSolarTimeLabel} · {activePlaceLive.gravityDisplay}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2">{activePlace.focus}</p>

                <ul className="mt-2 space-y-1">
                  {activePlace.features.map((feat, i) => (
                    <li
                      key={`${activePlace.id}-dual-f-${i}`}
                      className="text-xs text-slate-200 flex items-start gap-2"
                    >
                      <span style={{ color: activePlaceAccent }}>·</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activePlace.citations.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                    Sources:
                  </span>
                  {activePlace.citations.map((cite, i) => (
                    <button
                      key={`${activePlace.id}-dual-c-${i}`}
                      type="button"
                      onClick={() => onSelectCitation(cite)}
                      className="font-mono-tech text-[10px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 cursor-pointer"
                    >
                      {cite}
                    </button>
                  ))}
                </div>
              )}
            </article>
          </div>
        )}

        {tab === 'analogues' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5" data-testid="dual-analogues-grid">
            {analogueSites.map((site, idx) => {
              const linked = allDualPlaces.find((p) => p.id === site.linkedPlaceId);
              return (
                <article
                  key={site.id}
                  className="rounded-lg bg-[#05070D]/85 border border-white/[0.08] p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono-tech text-[10px] text-slate-400">
                          0{idx + 1} · {site.location} · {site.coordinates}
                        </div>
                        <h3 className="font-display text-sm font-semibold text-slate-100 mt-0.5">
                          {site.title}
                        </h3>
                      </div>
                      <span
                        className="font-mono-tech text-[9.5px] uppercase px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] shrink-0"
                        style={{ color: rightMeta.accentPrimary }}
                      >
                        {site.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{site.summary}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {site.citations.map((c, i) => (
                        <span
                          key={`${site.id}-ac-${i}`}
                          className="font-mono-tech text-[10px] text-slate-400"
                        >
                          {i > 0 ? '· ' : ''}
                          {c}
                        </span>
                      ))}
                    </div>
                    {linked && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlace(linked);
                          setTab('places');
                        }}
                        className="font-mono-tech text-[10.5px] hover:underline cursor-pointer"
                        style={{ color: rightMeta.accentPrimary }}
                      >
                        Inspect {linked.name} →
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
