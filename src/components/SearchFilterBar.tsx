import { Search, X } from 'lucide-react';
import { useState } from 'react';
import {
  LITERATURE_CARDS,
  PLANET_DATASETS,
  type PlanetId,
} from '../data/planetaryAtlasData';
import { filterLiteratureCards, getUniqueCitations } from '../utils/atlasLogic';

interface SearchFilterBarProps {
  query: string;
  citationFilter: string | null;
  onChangeQuery: (value: string) => void;
  onChangeCitation: (citation: string | null) => void;
  onSelectResult: (planet: PlanetId, tabId: string, cardId: string) => void;
}

const ALL_CITATIONS = getUniqueCitations(LITERATURE_CARDS);

export function SearchFilterBar({
  query,
  citationFilter,
  onChangeQuery,
  onChangeCitation,
  onSelectResult,
}: SearchFilterBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasActiveFilter = query.trim().length > 0 || citationFilter !== null;
  const matches = hasActiveFilter
    ? filterLiteratureCards(LITERATURE_CARDS, {
        query,
        citationFilter,
        planetFilter: 'all',
      })
    : [];

  return (
    <div className="relative z-30 w-full sm:w-[195px] lg:w-[200px] xl:w-[225px]">
      <div className="flex items-center gap-2 rounded-lg bg-[#0D111A]/95 border border-white/[0.1] px-2.5 py-1.5 focus-within:border-cyan-400/60 transition-colors">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <label htmlFor="atlas-search-input" className="sr-only">
          Search literature keywords or citations
        </label>
        <input
          id="atlas-search-input"
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => onChangeQuery(e.target.value)}
          placeholder="Search perchlorate, lava tubes, Jezero..."
          className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              onChangeQuery('');
              onChangeCitation(null);
            }}
            aria-label="Clear search and citation filter"
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results & Citation Chips Dropdown */}
      {(hasActiveFilter || isFocused) && (
        <div
          data-testid="search-results-popover"
          className="absolute right-0 mt-2 w-full sm:w-[440px] max-h-[68vh] flex flex-col rounded-xl bg-[#0D111A]/98 border border-white/[0.1] shadow-2xl overflow-hidden"
        >
          <div className="px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between gap-2">
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-slate-400">
              Filter by Source Badge
            </span>
            <button
              type="button"
              onClick={() => setIsFocused(false)}
              className="text-[11px] font-mono-tech text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex flex-wrap gap-1.5">
            {ALL_CITATIONS.map((cite) => {
              const active = citationFilter?.toLowerCase() === cite.toLowerCase();
              return (
                <button
                  key={cite}
                  type="button"
                  onClick={() => onChangeCitation(active ? null : cite)}
                  className={`font-mono-tech text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-100'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {cite}
                </button>
              );
            })}
          </div>

          {hasActiveFilter ? (
            <div className="overflow-y-auto atlas-scroll p-3 space-y-2">
              <div className="font-mono-tech text-[11px] text-slate-400 px-1">
                {matches.length} {matches.length === 1 ? 'entry' : 'entries'} matched across Mars, Moon &amp; Earth
              </div>

              {matches.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#06080E]/70 border border-white/[0.06] text-xs text-slate-400 text-center">
                  No matching literature entries for this query or citation filter.
                </div>
              ) : (
                matches.map((card) => {
                  const planetMeta = PLANET_DATASETS[card.planet];
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        onSelectResult(card.planet, card.tabId, card.id);
                        setIsFocused(false);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-[#06080E]/75 hover:bg-white/[0.08] border border-white/[0.07] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className="font-mono-tech text-[10px] uppercase tracking-wider font-medium"
                          style={{ color: planetMeta.accentPrimary }}
                        >
                          {planetMeta.name} · {card.tabLabel}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-100">{card.title}</div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {card.body}
                      </p>
                      {card.citations.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {card.citations.map((c, i) => (
                            <span
                              key={`${card.id}-res-${i}`}
                              className="font-mono-tech text-[10px] text-slate-300"
                            >
                              {i > 0 ? '· ' : ''}
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="px-3.5 py-3 text-xs text-slate-400">
              Type a keyword (e.g. <span className="font-mono-tech text-slate-200">perchlorate</span>,{' '}
              <span className="font-mono-tech text-slate-200">lava tubes</span>,{' '}
              <span className="font-mono-tech text-slate-200">Jezero</span>,{' '}
              <span className="font-mono-tech text-slate-200">simulants</span>) or select a citation badge above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
