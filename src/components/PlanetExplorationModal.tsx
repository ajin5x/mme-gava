import { X, MapPin, Thermometer, Shield, Compass, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import type { PlanetPlace } from '../data/planetaryAtlasData';

interface PlanetExplorationModalProps {
  place: PlanetPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCitation: (citation: string) => void;
}

export function PlanetExplorationModal({
  place,
  isOpen,
  onClose,
  onSelectCitation,
}: PlanetExplorationModalProps) {
  if (!isOpen || !place) return null;

  const isMars = place.planet === 'mars';
  const accentColor = isMars ? '#FF9100' : '#B388FF';
  const badgeText = isMars ? 'MARS SCIENTIFIC EXPLORATION' : 'LUNAR SCIENTIFIC EXPLORATION';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${place.name} Exploration`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#030408]/88 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#080B14] border border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#0D111D] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="font-mono-tech text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/[0.15] bg-white/[0.05]"
              style={{ color: accentColor }}
            >
              {badgeText}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100 truncate">
                {place.name}
              </h2>
              <p className="font-mono-tech text-xs text-slate-400 truncate">
                {place.region} · {place.coordLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close exploration view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto atlas-scroll p-6 space-y-6">
          {/* Top Overview & Main Imagery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Planetary Location Card */}
            <div className="rounded-xl bg-[#05070D] border border-white/[0.08] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono-tech text-xs text-slate-400 uppercase tracking-wider">
                    {place.planet.toUpperCase()} SURFACE TARGET
                  </span>
                  <span
                    className="font-mono-tech text-xs px-2 py-0.5 rounded border border-white/[0.1]"
                    style={{ color: accentColor }}
                  >
                    {place.terrainType}
                  </span>
                </div>

                {place.planetImage ? (
                  <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden border border-white/[0.1] bg-black">
                    <img
                      src={place.planetImage}
                      alt={place.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="font-mono-tech text-[11px] text-slate-200">
                        Official Planetary Observation Archive
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 sm:h-56 rounded-lg bg-gradient-to-br from-slate-900 to-[#121824] border border-white/[0.1] flex items-center justify-center p-4 text-center">
                    <span className="font-mono-tech text-xs text-slate-400">
                      High-Resolution Orbital Surface Map · {place.coordLabel}
                    </span>
                  </div>
                )}

                <p className="text-sm text-slate-300 leading-relaxed mt-4">{place.focus}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 gap-4">
                <div>
                  <span className="font-mono-tech text-[10px] uppercase text-slate-400 block">
                    Thermal Regime
                  </span>
                  <span className="font-mono-tech text-xs text-slate-200 font-semibold mt-0.5 block">
                    {place.tempMinC}°C to {place.tempMaxC}°C
                  </span>
                </div>
                <div>
                  <span className="font-mono-tech text-[10px] uppercase text-slate-400 block">
                    Coordinates
                  </span>
                  <span className="font-mono-tech text-xs text-slate-200 font-semibold mt-0.5 block">
                    {place.coordLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Earth Analogue Comparison Card */}
            <div className="rounded-xl bg-[#05070D] border border-white/[0.08] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono-tech text-xs text-cyan-400 uppercase tracking-wider">
                    TERRESTRIAL GEOLOGICAL ANALOGUE
                  </span>
                  <span className="font-mono-tech text-xs px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                    {place.earthAnalogueName ?? 'Earth Reference Site'}
                  </span>
                </div>

                {place.earthAnalogueImage ? (
                  <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden border border-cyan-500/20 bg-black">
                    <img
                      src={place.earthAnalogueImage}
                      alt={place.earthAnalogueName ?? 'Earth Analogue'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="font-mono-tech text-[11px] text-cyan-200">
                        {place.earthAnalogueName} · Field Analogue Site
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 sm:h-56 rounded-lg bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-500/20 flex items-center justify-center p-4 text-center">
                    <span className="font-mono-tech text-xs text-cyan-300">
                      Terrestrial Analog Field Site
                    </span>
                  </div>
                )}

                <p className="text-sm text-slate-300 leading-relaxed mt-4">
                  {place.earthAnalogueDescription ??
                    'Studied by planetary scientists on Earth to understand geological formation mechanisms, weathering processes, and astrobiological sampling protocols.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.08]">
                <span className="font-mono-tech text-[10px] uppercase text-slate-400 block">
                  Analogue Scientific Significance
                </span>
                <span className="text-xs text-slate-300 mt-1 block leading-relaxed">
                  Provides empirical baseline for orbital remote sensing and in-situ rover tool calibration without identical atmospheric pressure.
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix Table */}
          <section className="rounded-xl bg-[#05070D] border border-white/[0.08] p-5">
            <h3 className="font-display text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Comparative Geology & Environmental Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] font-mono-tech text-[11px] text-slate-400">
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3" style={{ color: accentColor }}>
                      {place.name} ({place.planet.toUpperCase()})
                    </th>
                    <th className="py-2.5 px-3 text-cyan-400">
                      {place.earthAnalogueName ?? 'Earth Analogue Site'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs text-slate-300">
                  <tr>
                    <td className="py-3 px-3 font-mono-tech text-slate-400">Morphology</td>
                    <td className="py-3 px-3">{place.terrainType}</td>
                    <td className="py-3 px-3">Terrestrial counterpart in comparable climate</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono-tech text-slate-400">Thermal Profile</td>
                    <td className="py-3 px-3">
                      {place.tempMinC}°C to {place.tempMaxC}°C
                    </td>
                    <td className="py-3 px-3">Moderate / Buffered atmospheric extremes</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono-tech text-slate-400">Primary Features</td>
                    <td className="py-3 px-3">
                      <ul className="space-y-1">
                        {place.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span style={{ color: accentColor }}>·</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-3">
                      Validated via field expedition sampling & spectral analysis
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Scientific Facts & Mission Information */}
          {place.scientificFacts && place.scientificFacts.length > 0 && (
            <section className="rounded-xl bg-[#05070D] border border-white/[0.08] p-5">
              <h3 className="font-display text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: accentColor }} />
                <span>Key Scientific Facts & Observations</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {place.scientificFacts.map((fact: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="font-mono-tech font-bold shrink-0" style={{ color: accentColor }}>
                      0{idx + 1}
                    </span>
                    <span>{fact}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sources and Citations */}
          {place.citations.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono-tech text-xs uppercase tracking-wider text-slate-400">
                Scientific Citations & Databases:
              </span>
              {place.citations.map((cite, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectCitation(cite)}
                  className="font-mono-tech text-xs px-2.5 py-1 rounded border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.15] text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>{cite}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0D111D] border-t border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <span className="font-mono-tech text-xs text-slate-400">
            TERRA // ANALOGUE Planetary Exploration Module
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono-tech font-medium text-slate-950 transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            RETURN TO 3D VIEWPORT
          </button>
        </div>
      </div>
    </div>
  );
}
