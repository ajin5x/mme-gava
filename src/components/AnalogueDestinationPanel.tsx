import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Gauge,
  MapPin,
  Pause,
  Play,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  EARTH_ANALOGUE_PINS,
  LITERATURE_CARDS,
  MARS_EARTH_ANALOGUE_SITES,
  MOON_EARTH_ANALOGUE_SITES,
  PLANET_DATASETS,
  PLANET_PLACES_BY_ID,
  type AnalogueEarthSite,
  type PlanetId,
  type PlanetPlace,
} from '../data/planetaryAtlasData';
import {
  computeLivePlanetTelemetry,
  filterEarthBenchmarkPins,
  type EarthPinScope,
} from '../utils/atlasLogic';

interface AnalogueDestinationPanelProps {
  planet: PlanetId;
  selectedPlaceId: string | null;
  highlightedCardId: string | null;
  isRotating: boolean;
  liveTimestamp: number;
  earthPinScope: EarthPinScope;
  onChangeEarthPinScope: (scope: EarthPinScope) => void;
  onSelectPlace: (place: PlanetPlace) => void;
  onSelectCitation: (citation: string) => void;
  onToggleLocalRotation: () => void;
  onBackToHub: () => void;
  onOpenExploration?: (place: PlanetPlace) => void;
}

type DestinationTabKey = 'primary' | 'secondary' | 'tertiary';

export function AnalogueDestinationPanel({
  planet,
  selectedPlaceId,
  highlightedCardId,
  isRotating,
  liveTimestamp,
  earthPinScope,
  onChangeEarthPinScope,
  onSelectPlace,
  onSelectCitation,
  onToggleLocalRotation,
  onBackToHub,
  onOpenExploration,
}: AnalogueDestinationPanelProps) {
  const dataset = PLANET_DATASETS[planet];
  const places = PLANET_PLACES_BY_ID[planet];
  const activePlace = places.find((p) => p.id === selectedPlaceId) ?? places[0];
  const live = computeLivePlanetTelemetry(planet, activePlace, liveTimestamp);

  const [tab, setTab] = useState<DestinationTabKey>('primary');
  const [expandedDebates, setExpandedDebates] = useState<Record<string, boolean>>({
    'earth-debate-1': true,
    'earth-debate-2': true,
    'earth-debate-3': true,
    'earth-debate-4': true,
  });

  // Reset to primary destination tab whenever switching worlds unless a specific study card is highlighted
  useEffect(() => {
    if (!highlightedCardId) {
      setTab('primary');
      return;
    }
    if (planet === 'earth') {
      if (highlightedCardId.startsWith('earth-debate-')) setTab('secondary');
      else if (highlightedCardId.startsWith('earth-gap-')) setTab('tertiary');
      else setTab('primary');
    } else {
      const card = LITERATURE_CARDS.find((c) => c.id === highlightedCardId);
      if (card) setTab('secondary');
    }
  }, [planet, highlightedCardId]);

  const earthSitesForPlanet: AnalogueEarthSite[] =
    planet === 'moon'
      ? MOON_EARTH_ANALOGUE_SITES
      : planet === 'mars'
      ? MARS_EARTH_ANALOGUE_SITES
      : [];

  const cardsForPlanet = LITERATURE_CARDS.filter((c) => c.planet === planet);
  const earthDebates = cardsForPlanet.filter((c) => c.kind === 'debate');
  const earthGaps = cardsForPlanet.filter((c) => c.kind === 'gap');
  const visibleEarthPins = filterEarthBenchmarkPins(EARTH_ANALOGUE_PINS, earthPinScope);

  const accent = dataset.accentPrimary;
  const accentSecondary = dataset.accentSecondary;

  return (
    <aside
      aria-label={`${dataset.name} Analogue Destination Panel`}
      data-testid={`destination-panel-${planet}`}
      className="fixed right-0 top-[58px] bottom-0 z-20 w-full lg:w-[48%] xl:w-[46%] flex flex-col bg-[#080B12]/93 border-l border-white/[0.08] shadow-2xl"
    >
      {/* Top planet accent rule */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accentSecondary})` }}
      />

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto atlas-scroll px-5 sm:px-7 py-4 space-y-4">
        {/* CASE 1: MOON or MARS — Earth Analogue Sites View */}
        {planet !== 'earth' && tab === 'primary' && (
          <div className="space-y-3.5" data-testid={`${planet}-earth-analogue-list`}>
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/[0.06]">
              <span className="font-mono-tech text-[11px] uppercase tracking-wider text-slate-400">
                Curated Terrestrial Field Sites Matched to {dataset.name}
              </span>
              <span className="font-mono-tech text-[11px]" style={{ color: accent }}>
                {live.localSolarTimeLabel}
              </span>
            </div>

            {earthSitesForPlanet.map((site, idx) => {
              const linkedPlace = places.find((p) => p.id === site.linkedPlaceId);
              const isLinkedActive = linkedPlace && linkedPlace.id === activePlace.id;

              return (
                <article
                  key={site.id}
                  data-testid={`analogue-site-${site.id}`}
                  className={`rounded-lg border p-4 transition-colors ${
                    isLinkedActive
                      ? 'bg-[#0D1320]/90 border-white/[0.22]'
                      : 'bg-[#05070D]/80 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-400">
                        0{idx + 1} · {site.location} · {site.coordinates}
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-50 mt-0.5">
                        {site.title}
                      </h3>
                    </div>

                    <span
                      className="font-mono-tech text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] shrink-0"
                      style={{ color: site.isSharedMoonAndMars ? '#00E5FF' : accent }}
                    >
                      {site.badge}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-300 leading-relaxed mt-2">
                    {site.summary}
                  </p>

                  <ul className="mt-2.5 space-y-1">
                    {site.highlights.map((hl, i) => (
                      <li
                        key={`${site.id}-hl-${i}`}
                        className="text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                      >
                        <span aria-hidden="true" style={{ color: accent }}>
                          ·
                        </span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                        Sources:
                      </span>
                      {site.citations.map((cite, i) => (
                        <button
                          key={`${site.id}-cite-${i}`}
                          type="button"
                          onClick={() => onSelectCitation(cite)}
                          className="font-mono-tech text-[10.5px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer"
                        >
                          {cite}
                        </button>
                      ))}
                    </div>

                    {linkedPlace && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlace(linkedPlace);
                          setTab('secondary');
                        }}
                        className="font-mono-tech text-[10.5px] hover:underline underline-offset-4 cursor-pointer"
                        style={{ color: accent }}
                      >
                        Inspect {linkedPlace.name} on {dataset.name} →
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* CASE 2: MOON or MARS — Surface Places & Literature Studies */}
        {planet !== 'earth' && tab === 'secondary' && (
          <div className="space-y-4">
            <section className="rounded-lg bg-[#05070D]/80 border border-white/[0.09] p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: accent }}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{dataset.name} Surface Feature Pins ({places.length})</span>
                </span>
                <span className="font-mono-tech text-[10px] text-slate-400">
                  {live.diurnalPhaseLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {places.map((place) => {
                  const isSelected = place.id === activePlace.id;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      data-testid={`place-btn-${place.id}`}
                      onClick={() => onSelectPlace(place)}
                      style={
                        isSelected
                          ? {
                              borderColor: `${accent}88`,
                              backgroundColor: `${accent}18`,
                            }
                          : undefined
                      }
                      className={`text-left px-3 py-2 rounded border text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-slate-50'
                          : 'bg-white/[0.02] border-white/[0.07] text-slate-300 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="font-medium truncate">{place.name}</div>
                      <div className="font-mono-tech text-[10px] text-slate-400 truncate mt-0.5">
                        {place.coordLabel} · {place.tempMinC}° to {place.tempMaxC}°C
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                data-testid="selected-place-features"
                className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {activePlace.name} ({activePlace.region})
                  </h3>
                  <span className="font-mono-tech text-[10.5px]" style={{ color: accent }}>
                    {activePlace.terrainType}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{activePlace.focus}</p>
                <ul className="space-y-1 pt-1">
                  {activePlace.features.map((f, i) => (
                    <li key={`${activePlace.id}-f-${i}`} className="text-xs text-slate-300 flex items-start gap-2">
                      <span style={{ color: accent }}>·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {(planet === 'mars' || planet === 'moon') && (
                  <button
                    type="button"
                    onClick={() => onOpenExploration?.(activePlace)}
                    className="w-full mt-3 py-2 px-3 rounded-lg font-mono-tech text-xs font-semibold text-slate-950 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer shadow-md"
                    style={{ backgroundColor: accent }}
                  >
                    <span>OPEN {dataset.name.toUpperCase()} EXPLORATION VIEW & ANALOGUES</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </section>

            {/* Full Literature Cards for Mars / Moon */}
            <div className="space-y-2.5">
              {cardsForPlanet.map((card) => {
                const isHighlighted = card.id === highlightedCardId;
                return (
                  <article
                    key={card.id}
                    data-testid={`card-${card.id}`}
                    style={isHighlighted ? { borderColor: `${accent}66` } : undefined}
                    className={`rounded-lg border p-3.5 ${
                      isHighlighted
                        ? 'bg-white/[0.06]'
                        : 'bg-[#05070D]/80 border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                          {card.tabLabel}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100 mt-0.5">{card.title}</h4>
                      </div>
                      {card.coordinates && (
                        <span className="font-mono-tech text-[10px] text-slate-400 shrink-0">
                          {card.coordinates}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-300 leading-relaxed mt-1.5">{card.body}</p>
                    {card.citations.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                          Sources:
                        </span>
                        {card.citations.map((cite, i) => (
                          <button
                            key={`${card.id}-cite-${i}`}
                            type="button"
                            onClick={() => onSelectCitation(cite)}
                            className="font-mono-tech text-[10.5px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer"
                          >
                            {cite}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* CASE 3: EARTH BENCHMARK — Tab 1: Shared Moon/Mars & Mars-Only Color-Coded Globe Pins */}
        {planet === 'earth' && tab === 'primary' && (
          <div className="space-y-3.5" data-testid="earth-benchmark-pins">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeEarthPinScope('all')}
                  data-testid="pin-scope-all"
                  className={`font-mono-tech text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    earthPinScope === 'all'
                      ? 'border-cyan-400/70 bg-cyan-500/15 text-slate-50'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Sites (8)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeEarthPinScope('shared')}
                  data-testid="pin-scope-shared"
                  className={`font-mono-tech text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    earthPinScope === 'shared'
                      ? 'border-cyan-400/80 bg-cyan-500/20 text-cyan-100'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Shared Moon + Mars (4)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeEarthPinScope('mars-only')}
                  data-testid="pin-scope-mars"
                  className={`font-mono-tech text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    earthPinScope === 'mars-only'
                      ? 'border-amber-400/80 bg-amber-500/20 text-amber-100'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mars Only (4)
                </button>
              </div>

              <span className="font-mono-tech text-[10.5px] text-slate-400">
                Cyan = Shared Moon+Mars · Amber = Mars
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleEarthPins.map((pin) => {
                const isSelected = pin.id === activePlace.id;
                const pinColor = pin.targetBody === 'Mars' ? '#FF9100' : '#00E5FF';
                return (
                  <button
                    key={pin.id}
                    type="button"
                    data-testid={`place-btn-${pin.id}`}
                    onClick={() => onSelectPlace(pin)}
                    style={
                      isSelected
                        ? {
                            borderColor: `${pinColor}88`,
                            backgroundColor: `${pinColor}1A`,
                          }
                        : undefined
                    }
                    className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-slate-50'
                        : 'bg-[#05070D]/80 border-white/[0.08] text-slate-300 hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{pin.name}</span>
                      <span
                        className="font-mono-tech text-[9.5px] uppercase tracking-wider shrink-0"
                        style={{ color: pinColor }}
                      >
                        {pin.targetBody}
                      </span>
                    </div>
                    <div className="font-mono-tech text-[10px] text-slate-400 mt-0.5 truncate">
                      {pin.region} · {pin.coordLabel}
                    </div>
                  </button>
                );
              })}
            </div>

            <article
              data-testid="selected-place-features"
              className="rounded-lg bg-[#05070D]/85 border border-white/[0.1] p-4 space-y-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-50">
                    {activePlace.name} ({activePlace.region})
                  </h3>
                  <p className="font-mono-tech text-[11px] text-slate-400 mt-0.5">
                    {activePlace.coordLabel} · {activePlace.terrainType} · {activePlace.targetBody}
                  </p>
                </div>
                <span className="font-mono-tech text-[11px] text-cyan-300">
                  {activePlace.tempMinC}° to {activePlace.tempMaxC}°C
                </span>
              </div>

              <p className="text-[13px] text-slate-300 leading-relaxed">{activePlace.focus}</p>

              <ul className="space-y-1 pt-1">
                {activePlace.features.map((feat, i) => (
                  <li key={`${activePlace.id}-ef-${i}`} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-cyan-300">·</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {activePlace.citations.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                    Sources:
                  </span>
                  {activePlace.citations.map((cite, i) => (
                    <button
                      key={`${activePlace.id}-ec-${i}`}
                      type="button"
                      onClick={() => onSelectCitation(cite)}
                      className="font-mono-tech text-[10.5px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 cursor-pointer"
                    >
                      {cite}
                    </button>
                  ))}
                </div>
              )}
            </article>
          </div>
        )}

        {/* CASE 4: EARTH BENCHMARK — Tab 2: 4 Active Debates */}
        {planet === 'earth' && tab === 'secondary' && (
          <div className="space-y-2.5" data-testid="earth-debates-list">
            {earthDebates.map((card) => {
              const isExpanded = !!expandedDebates[card.id];
              const isHighlighted = card.id === highlightedCardId;
              return (
                <article
                  key={card.id}
                  data-testid={`card-${card.id}`}
                  style={isHighlighted ? { borderColor: `${accent}66` } : undefined}
                  className={`rounded-lg border transition-colors ${
                    isHighlighted
                      ? 'bg-white/[0.06]'
                      : 'bg-[#05070D]/80 border-white/[0.08]'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedDebates((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                  >
                    <h3 className="text-sm font-semibold text-slate-100">{card.title}</h3>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3.5 pt-0.5 space-y-2.5">
                      <p className="text-[13px] text-slate-300 leading-relaxed">{card.body}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                          Sources:
                        </span>
                        {card.citations.map((cite, i) => (
                          <button
                            key={`${card.id}-c-${i}`}
                            type="button"
                            onClick={() => onSelectCitation(cite)}
                            className="font-mono-tech text-[10.5px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 cursor-pointer"
                          >
                            {cite}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* CASE 5: EARTH BENCHMARK — Tab 3: Simulation Gaps */}
        {planet === 'earth' && tab === 'tertiary' && (
          <div className="space-y-3" data-testid="earth-gaps-list">
            {earthGaps.map((card) => {
              const isHighlighted = card.id === highlightedCardId;
              return (
                <article
                  key={card.id}
                  data-testid={`card-${card.id}`}
                  style={isHighlighted ? { borderColor: `${accent}66` } : undefined}
                  className={`rounded-lg border p-4 space-y-2 ${
                    isHighlighted
                      ? 'bg-white/[0.06]'
                      : 'bg-[#05070D]/80 border-white/[0.08]'
                  }`}
                >
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-cyan-300">
                    Simulation Gap · Where Earth Falls Short
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-50">{card.title}</h3>
                  <p className="text-[13px] text-slate-300 leading-relaxed">{card.body}</p>
                  {card.citations.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                        Sources:
                      </span>
                      {card.citations.map((cite, i) => (
                        <button
                          key={`${card.id}-g-${i}`}
                          type="button"
                          onClick={() => onSelectCitation(cite)}
                          className="font-mono-tech text-[10.5px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 cursor-pointer"
                        >
                          {cite}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note & Return Action */}
      <div className="px-5 sm:px-7 py-3 border-t border-white/[0.08] bg-[#05070D]/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <span className="font-mono-tech text-[11px] text-slate-400 truncate max-w-[340px]">
          {dataset.telemetry.radiationNote}
        </span>

        <button
          type="button"
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-tech font-medium text-slate-950 transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
          style={{ backgroundColor: accent }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ORBITAL HUB · RESUME ORBIT</span>
        </button>
      </div>
    </aside>
  );
}
