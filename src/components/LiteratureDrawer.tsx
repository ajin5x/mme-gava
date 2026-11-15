import { ChevronDown, ChevronRight, Globe2, MapPin, Play, Thermometer, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  LITERATURE_CARDS,
  PLANET_DATASETS,
  PLANET_PLACES_BY_ID,
  type PlanetId,
  type PlanetPlace,
} from '../data/planetaryAtlasData';
import { computeLivePlanetTelemetry } from '../utils/atlasLogic';

interface LiteratureDrawerProps {
  planet: PlanetId;
  activeTabId: string;
  highlightedCardId: string | null;
  selectedPlaceId: string | null;
  liveTimestamp: number;
  onChangeTab: (tabId: string) => void;
  onSelectCitation: (citation: string) => void;
  onSelectPlace: (place: PlanetPlace) => void;
  onOpenPopupCard: () => void;
  onJumpToCard: (planet: PlanetId, tabId: string, cardId: string) => void;
  onResumeRotation: () => void;
}

export function LiteratureDrawer({
  planet,
  activeTabId,
  highlightedCardId,
  selectedPlaceId,
  liveTimestamp,
  onChangeTab,
  onSelectCitation,
  onSelectPlace,
  onOpenPopupCard,
  onJumpToCard,
  onResumeRotation,
}: LiteratureDrawerProps) {
  const dataset = PLANET_DATASETS[planet];
  const places = PLANET_PLACES_BY_ID[planet];
  const activePlace = places.find((p) => p.id === selectedPlaceId) ?? places[0];
  const live = computeLivePlanetTelemetry(planet, activePlace, liveTimestamp);

  const cardsForTab = LITERATURE_CARDS.filter(
    (card) => card.planet === planet && card.tabId === activeTabId
  );

  const [expandedDebates, setExpandedDebates] = useState<Record<string, boolean>>({
    'earth-debate-1': true,
    'earth-debate-2': true,
    'earth-debate-3': true,
    'earth-debate-4': true,
  });

  useEffect(() => {
    if (highlightedCardId && highlightedCardId.startsWith('earth-debate-')) {
      setExpandedDebates((prev) => ({ ...prev, [highlightedCardId]: true }));
    }
  }, [highlightedCardId]);

  const toggleDebate = (id: string) => {
    setExpandedDebates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const accentTextStyle = { color: dataset.accentPrimary };
  const accentBorderStyle = { borderColor: `${dataset.accentPrimary}44` };

  return (
    <aside
      aria-label={`${dataset.name} Literature and Mission Intelligence Drawer`}
      data-testid="literature-drawer"
      className="fixed right-3 sm:right-5 top-16 bottom-20 z-20 w-[calc(100vw-24px)] sm:w-[480px] lg:w-[540px] flex flex-col rounded-xl bg-[#0D111A]/96 border border-white/[0.08] shadow-2xl overflow-hidden"
    >
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${dataset.accentPrimary}, ${dataset.accentSecondary})`,
        }}
      />

      {/* Scrollable Research Content */}
      <div className="flex-1 overflow-y-auto atlas-scroll px-5 py-4 space-y-3.5">
        {/* Surface Coordinate Place Features Inspector (Earth, Mars & Moon) */}
        <section
          aria-label={`${dataset.name} Surface Place Coordinates`}
          className="rounded-lg bg-[#06080E]/80 border border-white/[0.1] p-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium" style={accentTextStyle}>
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{dataset.name} Places &amp; Features ({places.length} Sites)</span>
            </div>
            <span className="font-mono-tech text-[10px] text-slate-400">
              {live.localSolarTimeLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {places.map((place) => {
              const isSelected = place.id === activePlace.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => onSelectPlace(place)}
                  style={
                    isSelected
                      ? {
                          borderColor: `${dataset.accentPrimary}88`,
                          backgroundColor: `${dataset.accentPrimary}1F`,
                        }
                      : undefined
                  }
                  className={`text-left px-2.5 py-1.5 rounded-md border text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isSelected
                      ? 'text-slate-50'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="font-medium truncate">{place.name}</div>
                  <div className="font-mono-tech text-[10px] text-slate-400 truncate">
                    {place.coordLabel}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            data-testid="active-place-detail"
            className="mt-2.5 pt-2.5 border-t border-white/[0.08] space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-100">
                {activePlace.name} ({activePlace.region})
              </span>
              <span className="font-mono-tech text-[10px]" style={accentTextStyle}>
                {activePlace.terrainType}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{activePlace.focus}</p>
            <ul className="space-y-1 pt-0.5">
              {activePlace.features.map((f, idx) => (
                <li key={`${activePlace.id}-df-${idx}`} className="text-[11.5px] text-slate-300 flex items-start gap-1.5">
                  <span style={accentTextStyle}>·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {activePlace.linkedCardId && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const targetCard = LITERATURE_CARDS.find(
                      (c) => c.id === activePlace.linkedCardId
                    );
                    if (targetCard) {
                      onJumpToCard(targetCard.planet, targetCard.tabId, targetCard.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono-tech hover:underline underline-offset-4 cursor-pointer"
                  style={accentTextStyle}
                >
                  <span>Highlight linked study</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Verbatim Scientific Cards & Accordions */}
        {cardsForTab.map((card) => {
          const isHighlighted = card.id === highlightedCardId;
          const isDebateAccordion = card.kind === 'debate';
          const isExpanded = !isDebateAccordion || !!expandedDebates[card.id];

          return (
            <article
              key={card.id}
              data-testid={`card-${card.id}`}
              style={isHighlighted ? accentBorderStyle : undefined}
              className={`rounded-lg border transition-colors ${
                isHighlighted
                  ? 'bg-white/[0.07]'
                  : 'bg-[#06080E]/65 border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {isDebateAccordion ? (
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleDebate(card.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
                >
                  <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                    {card.title}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <div className="px-4 pt-3.5 pb-1 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                    {card.title}
                  </h3>
                  {card.coordinates && (
                    <span className="font-mono-tech text-[10px] text-slate-400 shrink-0 pt-0.5">
                      {card.coordinates}
                    </span>
                  )}
                </div>
              )}

              {isExpanded && (
                <div className={isDebateAccordion ? 'px-4 pb-3.5 pt-0.5' : 'px-4 pb-3.5 pt-1'}>
                  <p className="text-[13.5px] text-slate-300 leading-relaxed">{card.body}</p>
                  {card.citations.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500 mr-1">
                        Sources:
                      </span>
                      {card.citations.map((cite, i) => (
                        <button
                          key={`${card.id}-cite-${i}`}
                          type="button"
                          onClick={() => onSelectCitation(cite)}
                          title={`Filter atlas by source: ${cite}`}
                          className="font-mono-tech text-[11px] px-2 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {cite}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
