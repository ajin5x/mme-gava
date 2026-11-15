import { ArrowRight, BookOpen, Gauge, MapPin, Play, Thermometer, Wind, X } from 'lucide-react';
import {
  PLANET_DATASETS,
  PLANET_PLACES_BY_ID,
  type PageMode,
  type PlanetId,
  type PlanetPlace,
} from '../data/planetaryAtlasData';
import { computeLivePlanetTelemetry, planetToPageMode } from '../utils/atlasLogic';

interface PlanetPopupCardProps {
  planet: PlanetId;
  selectedPlaceId: string | null;
  liveTimestamp: number;
  pageMode: PageMode;
  onSelectPlace: (place: PlanetPlace) => void;
  onOpenDedicatedPage: (planet: PlanetId) => void;
  onOpenFullAtlas: (planet: PlanetId, cardId?: string) => void;
  onClosePopup: () => void;
}

export function PlanetPopupCard({
  planet,
  selectedPlaceId,
  liveTimestamp,
  pageMode,
  onSelectPlace,
  onOpenDedicatedPage,
  onOpenFullAtlas,
  onClosePopup,
}: PlanetPopupCardProps) {
  const dataset = PLANET_DATASETS[planet];
  const places = PLANET_PLACES_BY_ID[planet];
  const activePlace = places.find((p) => p.id === selectedPlaceId) ?? places[0];
  const live = computeLivePlanetTelemetry(planet, activePlace, liveTimestamp);

  return (
    <section
      role="dialog"
      aria-label={`${dataset.name} Live Planet and Place Popup Card`}
      data-testid={`planet-popup-${planet}`}
      className="fixed right-3 sm:right-5 top-16 bottom-20 z-25 w-[calc(100vw-24px)] sm:w-[460px] lg:w-[510px] flex flex-col rounded-xl bg-[#0D111A]/96 border border-white/[0.1] shadow-2xl overflow-hidden"
    >
      {/* Planet Accent Bar */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${dataset.accentPrimary}, ${dataset.accentSecondary})`,
        }}
      />

      {/* Popup Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: dataset.accentPrimary }}
            />
            <span
              className="font-mono-tech text-[11px] uppercase tracking-[0.14em] truncate"
              style={{ color: dataset.accentPrimary }}
            >
              {dataset.name} · Live Telemetry &amp; Place Explorer
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClosePopup}
              data-testid="popup-resume-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-tech font-medium bg-white/[0.08] hover:bg-white/[0.16] text-slate-100 border border-white/[0.12] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>RESUME</span>
            </button>
            <button
              type="button"
              onClick={onClosePopup}
              aria-label={`Close ${dataset.name} popup card`}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2 className="font-display text-lg font-semibold text-slate-50 mt-1.5">
          {dataset.name} Place Features &amp; Live Conditions
        </h2>

        {/* Live Telemetry Grid: Live Temperature, Gravity, Pressure, Atmosphere */}
        <div
          data-testid="live-telemetry-grid"
          className="grid grid-cols-2 gap-2 mt-3"
        >
          <div className="rounded-lg bg-[#06080E]/85 border border-white/[0.07] px-3 py-2">
            <div className="flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider text-slate-400">
              <Thermometer className="w-3 h-3" style={{ color: dataset.accentPrimary }} />
              <span>Live Temperature</span>
            </div>
            <div
              data-testid="live-temp-value"
              className="font-mono-tech text-base font-semibold text-slate-50 mt-0.5"
            >
              {live.temperatureC > 0 ? `+${live.temperatureC}` : live.temperatureC}°C
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({live.temperatureK} K)
              </span>
            </div>
            <div className="font-mono-tech text-[10px] text-slate-400 mt-0.5 truncate">
              {live.localSolarTimeLabel} · {live.diurnalPhaseLabel}
            </div>
          </div>

          <div className="rounded-lg bg-[#06080E]/85 border border-white/[0.07] px-3 py-2">
            <div className="flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider text-slate-400">
              <Gauge className="w-3 h-3" style={{ color: dataset.accentPrimary }} />
              <span>Surface Gravity</span>
            </div>
            <div
              data-testid="planet-gravity-value"
              className="font-mono-tech text-base font-semibold text-slate-50 mt-0.5"
            >
              {dataset.telemetry.gravity}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({dataset.telemetry.gravityG})
              </span>
            </div>
            <div className="font-mono-tech text-[10px] text-slate-400 mt-0.5 truncate">
              Tilt {live.axialTiltDisplay} · Day {live.dayLengthDisplay}
            </div>
          </div>

          <div className="col-span-2 rounded-lg bg-[#06080E]/85 border border-white/[0.07] px-3 py-2 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-wider text-slate-400">
                <Wind className="w-3 h-3" style={{ color: dataset.accentPrimary }} />
                <span>Atmosphere &amp; Pressure</span>
              </span>
              <span className="font-mono-tech text-[11px] text-slate-200">
                {live.pressureDisplay}
              </span>
            </div>
            <p className="text-xs text-slate-300">{live.atmosphereDisplay}</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              {dataset.telemetry.radiationNote}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Places & Features Content */}
      <div className="flex-1 overflow-y-auto atlas-scroll px-5 py-3.5 space-y-3.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200">
              <MapPin className="w-3.5 h-3.5" style={{ color: dataset.accentPrimary }} />
              <span>Select {dataset.name} Place ({places.length} Sites)</span>
            </span>
            <span className="font-mono-tech text-[10px] text-slate-400">
              Click globe pin or site
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
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
                          borderColor: `${dataset.accentPrimary}99`,
                          backgroundColor: `${dataset.accentPrimary}1F`,
                        }
                      : undefined
                  }
                  className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-slate-50'
                      : 'bg-[#06080E]/70 border-white/[0.07] text-slate-300 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="font-medium leading-snug line-clamp-1">{place.name}</div>
                  <div className="font-mono-tech text-[10px] text-slate-400 mt-0.5 truncate">
                    {place.coordLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Place Detailed Features */}
        <article
          data-testid="selected-place-features"
          className="rounded-lg bg-[#06080E]/85 border border-white/[0.08] p-3.5 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-50 leading-snug">
                {activePlace.name}
              </h3>
              <p className="font-mono-tech text-[11px] text-slate-400 mt-0.5">
                {activePlace.region} · {activePlace.terrainType}
              </p>
            </div>
            <span
              className="font-mono-tech text-[10px] px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] shrink-0"
              style={{ color: dataset.accentPrimary }}
            >
              {activePlace.tempMinC}° to {activePlace.tempMaxC}°C
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{activePlace.focus}</p>

          <div className="pt-1">
            <div className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
              Place Features &amp; Research Evidence
            </div>
            <ul className="space-y-1.5">
              {activePlace.features.map((feat, idx) => (
                <li
                  key={`${activePlace.id}-feat-${idx}`}
                  className="text-xs text-slate-200 leading-relaxed flex items-start gap-2"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 w-1.5 h-1.5 rounded-sm shrink-0"
                    style={{ backgroundColor: dataset.accentPrimary }}
                  />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {activePlace.citations.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                Sources:
              </span>
              {activePlace.citations.map((cite, i) => (
                <span
                  key={`${activePlace.id}-c-${i}`}
                  className="font-mono-tech text-[10px] px-1.5 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] text-slate-300"
                >
                  {cite}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 border-t border-white/[0.08] bg-[#06080E]/70 flex items-center justify-between gap-2 shrink-0">
        {pageMode !== planetToPageMode(planet) ? (
          <button
            type="button"
            onClick={() => onOpenDedicatedPage(planet)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.09] hover:bg-white/[0.16] text-slate-100 border border-white/[0.12] transition-colors cursor-pointer"
          >
            <span>Open {dataset.name} Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="font-mono-tech text-[11px] text-slate-400">
            Dedicated {dataset.name} View Active
          </span>
        )}

        <button
          type="button"
          onClick={() => onOpenFullAtlas(planet, activePlace.linkedCardId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-950 transition-colors cursor-pointer"
          style={{ backgroundColor: dataset.accentPrimary }}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Full Literature</span>
        </button>
      </div>
    </section>
  );
}
