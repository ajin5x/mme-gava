import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Globe, MapPin, Zap, Thermometer, Shield } from 'lucide-react';
import { useRef } from 'react';
import type { PlanetPlace } from '../data/planetaryAtlasData';
import { DetailLuminous3D } from '../three/DetailLuminous3D';

interface PlanetPlaceDetailPageProps {
  place: PlanetPlace;
  onBack: () => void;
  onSelectCitation: (citation: string) => void;
}

export function PlanetPlaceDetailPage({
  place,
  onBack,
  onSelectCitation: _onSelectCitation,
}: PlanetPlaceDetailPageProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dividerWindowRef = useRef<HTMLDivElement | null>(null);

  const isMoon = place.planet === 'moon';
  const planetLabel = isMoon ? 'MOON' : 'MARS';
  const accentColor = isMoon ? '#B388FF' : '#FF9100';

  return (
    <div
      ref={scrollContainerRef}
      data-testid="planet-place-detail-page"
      className="relative w-screen h-screen overflow-y-auto atlas-scroll bg-transparent text-slate-100 pb-24 animate-fadeIn"
    >
      {/* Full-viewport 3D White Luminous Wave, Orbital Rings & Volumetric Starlight */}
      <DetailLuminous3D
        dividerAnchorRef={dividerWindowRef}
        scrollContainerRef={scrollContainerRef}
      />

      {/* Top Header Control */}
      <header className="sticky top-0 inset-x-0 z-40 bg-[#06080E]/92 border-b border-white/[0.08] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            data-testid="back-to-planets-from-detail"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.12] bg-[#0D111A] hover:bg-white/[0.1] text-slate-200 transition-colors cursor-pointer text-xs font-mono-tech font-medium"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>BACK TO PLANETARY EXPLORATION</span>
          </button>

          <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

          <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-slate-300">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>OBSERVATORY ARCHIVE: {place.name.toUpperCase()}</span>
          </div>
        </div>

        <span
          className="font-mono-tech text-[10.5px] uppercase tracking-wider px-2.5 py-1 rounded border"
          style={{ borderColor: `${accentColor}55`, color: accentColor, backgroundColor: `${accentColor}15` }}
        >
          {planetLabel} // ANALOGUE FIELD SITE
        </span>
      </header>

      {/* Open 3D Luminous Divider Showcase Window */}
      <div
        ref={dividerWindowRef}
        data-testid="luminous-divider-3d-window"
        className="relative z-10 w-full h-36 sm:h-44 bg-transparent border-b border-white/[0.08] pointer-events-none"
      />

      {/* Hero Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-6 border-b border-white/[0.08]">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-widest text-slate-400">
            <Globe className="w-4 h-4" style={{ color: accentColor }} />
            <span>Region: {place.region}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 leading-tight">
            {place.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {place.focus}
          </p>
        </div>
      </section>

      {/* Main Content Grid: Side by Side Real Photographs & Scientific Data */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT: PLANETARY FEATURE */}
          <div className="rounded-2xl bg-[#080B14]/92 border border-white/20 p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="font-mono-tech text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: accentColor }} />
                  <span>{planetLabel} // {place.name}</span>
                </span>
                <span className="font-mono-tech text-[10.5px] px-2.5 py-0.5 rounded border border-white/30 bg-white/10 text-white whitespace-nowrap shrink-0">
                  {place.terrainType}
                </span>
              </div>

              <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-white/20 bg-black shadow-lg">
                {place.planetImage ? (
                  <img
                    src={place.planetImage}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-300 font-mono-tech text-xs">
                    Official {planetLabel} Mission Archive Record
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4">
                  <span className="font-mono-tech text-xs text-slate-200">
                    NASA / High-Resolution Orbital Archive
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 pt-4 border-t border-white/[0.1]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-mono-tech text-[10px] text-slate-400 uppercase block">Coordinates</span>
                  <span className="font-mono-tech text-slate-200 font-semibold">{place.coordLabel}</span>
                </div>
                <div>
                  <span className="font-mono-tech text-[10px] text-slate-400 uppercase block">Thermal Swing</span>
                  <span className="font-mono-tech text-white font-semibold flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    {place.tempMinC}°C to {place.tempMaxC}°C
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: EARTH ANALOGUE */}
          <div className="rounded-2xl bg-[#080B14]/92 border border-cyan-400/40 p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="font-mono-tech text-xs uppercase tracking-widest text-cyan-300 font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>EARTH ANALOGUE // {place.earthAnalogueName ?? 'Terrestrial Analog'}</span>
                </span>
                <span className="font-mono-tech text-[10.5px] px-2.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/15 text-cyan-200 whitespace-nowrap shrink-0">
                  Field Survey Site
                </span>
              </div>

              <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-cyan-500/30 bg-black shadow-lg">
                {place.earthAnalogueImage ? (
                  <img
                    src={place.earthAnalogueImage}
                    alt={place.earthAnalogueName ?? 'Earth Analogue'}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-cyan-300 font-mono-tech text-xs">
                    Terrestrial Field Site Archive
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4">
                  <span className="font-mono-tech text-xs text-cyan-200">
                    {place.earthAnalogueName} · Terrestrial Field Survey
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 pt-4 border-t border-white/[0.1]">
              <p className="text-xs text-slate-300 leading-relaxed">
                {place.earthAnalogueDescription ?? 'Terrestrial geological environment used by planetary scientists to study equivalent weathering, mineral formation, and astrobiological limits.'}
              </p>
            </div>
          </div>
        </div>

        {/* SCIENTIFIC COMPARISON & SCIENTIFIC FACTS */}
        <div className="rounded-2xl bg-[#080B14]/92 border border-white/20 p-8 shadow-2xl space-y-6">
          <h3 className="font-display text-base font-semibold tracking-wider text-slate-100 uppercase flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>{planetLabel} VS EARTH — GEOLOGICAL SIMILARITIES & SCIENTIFIC INSIGHTS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="space-y-3">
              <h4 className="font-mono-tech text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Geological Similarities</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Both {place.name} and {place.earthAnalogueName} share analogous physical weathering processes, basaltic composition, or impact mechanics that record fundamental planetary evolution.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono-tech text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Environmental Differences</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {planetLabel} features reduced gravity, extreme thermal regimes, and attenuated atmospheric pressure compared to Earth's dynamic hydrosphere and nitrogen-oxygen atmosphere.
              </p>
            </div>
          </div>

          {place.scientificFacts && place.scientificFacts.length > 0 && (
            <div className="pt-6 border-t border-white/[0.1] space-y-3">
              <h4 className="font-mono-tech text-xs uppercase tracking-wider text-cyan-300 font-semibold">
                Key Scientific Facts & Mission Findings
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {place.scientificFacts.map((fact, idx) => (
                  <li key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 leading-relaxed">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
