import { ArrowLeft, Sparkles, Thermometer, MapPin, CheckCircle2, XCircle, Globe, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PlanetPlace } from '../data/planetaryAtlasData';

interface MarsHoverComparisonOverlayProps {
  place: PlanetPlace;
  onReset: () => void;
  onSelectCitation: (citation: string) => void;
}

type AnimationStep = 'lines' | 'previews' | 'transforming' | 'comparison';

export function MarsHoverComparisonOverlay({
  place,
  onReset,
  onSelectCitation,
}: MarsHoverComparisonOverlayProps) {
  const [step, setStep] = useState<AnimationStep>('lines');

  useEffect(() => {
    // Step sequence:
    // 0ms: Lines animating up from planets
    // 1200ms: Previews appear at ends of lines
    // 3200ms (2s later): Transform layout (planets shrink, images expand)
    // 4200ms: Show scientific comparison info below
    const t1 = window.setTimeout(() => setStep('previews'), 1200);
    const t2 = window.setTimeout(() => setStep('transforming'), 3200);
    const t3 = window.setTimeout(() => setStep('comparison'), 4200);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [place.id]);

  const isTransformed = step === 'transforming' || step === 'comparison';
  const showInfo = step === 'comparison';

  return (
    <div
      data-testid="mars-hover-comparison-overlay"
      className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 sm:p-10 pointer-events-none bg-black/40 backdrop-blur-xs transition-colors duration-700"
    >
      {/* Top Header Control */}
      <div className="w-full max-w-7xl flex items-center justify-between gap-4 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-[#0D111A]/90 text-orange-200 text-xs font-mono-tech">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>MARS FEATURE HOVER DETECTED: {place.name.toUpperCase()}</span>
        </div>

        <button
          type="button"
          data-testid="back-to-planets-btn"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.15] bg-[#0D111A]/95 hover:bg-white/[0.15] text-slate-100 transition-all cursor-pointer text-xs font-mono-tech font-semibold shadow-2xl pointer-events-auto"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK TO PLANETS</span>
        </button>
      </div>

      {/* Central Visual Stage: Connecting Lines & Images / Transformed Layout */}
      <div className="relative w-full max-w-6xl flex-1 flex flex-col items-center justify-center my-auto">
        {/* SVG Connector Lines (Visible during 'lines' and 'previews' steps) */}
        {!isTransformed && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
            <defs>
              <linearGradient id="marsLineGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FF5722" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FF9100" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="earthLineGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2979FF" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Mars Upward Line */}
            <path
              d="M 320 420 Q 320 280 320 180"
              fill="none"
              stroke="url(#marsLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="300"
              className={step === 'lines' ? 'animate-dashDraw' : ''}
              style={{ strokeDashoffset: step === 'lines' ? 0 : 0 }}
            />

            {/* Earth Upward Line */}
            <path
              d="M 960 420 Q 960 280 960 180"
              fill="none"
              stroke="url(#earthLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="300"
              className={step === 'lines' ? 'animate-dashDraw' : ''}
            />
          </svg>
        )}

        {/* Side-by-Side Previews / Expanded Transformation Grid */}
        <div
          className={`w-full grid transition-all duration-1000 ease-out ${
            isTransformed
              ? 'grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl scale-100 opacity-100'
              : 'grid-cols-1 lg:grid-cols-2 gap-16 max-w-4xl scale-95 opacity-90'
          }`}
        >
          {/* LEFT: MARS FEATURE */}
          <div className="pointer-events-auto rounded-2xl bg-[#080B14]/95 border border-orange-500/40 p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono-tech text-xs uppercase tracking-widest text-orange-400 font-bold">
                MARS // {place.name}
              </span>
              <span className="font-mono-tech text-[10.5px] px-2 py-0.5 rounded border border-orange-500/30 bg-orange-500/15 text-orange-200">
                {place.terrainType}
              </span>
            </div>

            <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-white/[0.1] bg-black">
              {place.planetImage ? (
                <img
                  src={place.planetImage}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 font-mono-tech text-xs">
                  Official Mars Mission Archive
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5">
                <span className="font-mono-tech text-[11px] text-orange-200">
                  NASA / JPL-Caltech / Mission Archive
                </span>
              </div>
            </div>

            {showInfo && (
              <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed animate-fadeIn">
                <p className="text-slate-200 font-medium">{place.focus}</p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.08]">
                  <div>
                    <span className="font-mono-tech text-[10px] text-slate-400 uppercase block">Coordinates</span>
                    <span className="font-mono-tech text-slate-200 font-semibold">{place.coordLabel}</span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[10px] text-slate-400 uppercase block">Thermal Regime</span>
                    <span className="font-mono-tech text-orange-300 font-semibold">{place.tempMinC}°C to {place.tempMaxC}°C</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: EARTH ANALOGUE */}
          <div className="pointer-events-auto rounded-2xl bg-[#080B14]/95 border border-cyan-500/40 p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono-tech text-xs uppercase tracking-widest text-cyan-400 font-bold">
                EARTH ANALOGUE // {place.earthAnalogueName ?? 'Terrestrial Analog'}
              </span>
              <span className="font-mono-tech text-[10.5px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/15 text-cyan-200">
                Earth Field Site
              </span>
            </div>

            <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-cyan-500/20 bg-black">
              {place.earthAnalogueImage ? (
                <img
                  src={place.earthAnalogueImage}
                  alt={place.earthAnalogueName ?? 'Earth Analogue'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-cyan-300 font-mono-tech text-xs">
                  Terrestrial Field Analogue
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5">
                <span className="font-mono-tech text-[11px] text-cyan-200">
                  {place.earthAnalogueName} · Field Survey Archive
                </span>
              </div>
            </div>

            {showInfo && (
              <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed animate-fadeIn">
                <p className="text-slate-200 font-medium">
                  {place.earthAnalogueDescription ?? 'Terrestrial geological environment used by planetary scientists to study equivalent weathering and mineral formation.'}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.08]">
                  <div>
                    <span className="font-mono-tech text-[10px] text-slate-400 uppercase block">Field Site</span>
                    <span className="font-mono-tech text-slate-200 font-semibold">{place.earthAnalogueName}</span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[10px] text-slate-400 uppercase block">Research Utility</span>
                    <span className="font-mono-tech text-cyan-300 font-semibold">Instrument & Rover Calibration</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MARS VS EARTH — GEOLOGICAL SIMILARITIES SECTION (Shown at Step 8 / Comparison) */}
        {showInfo && (
          <div className="w-full max-w-5xl mt-8 pointer-events-auto rounded-2xl bg-[#080B14]/96 border border-white/[0.15] p-6 shadow-2xl animate-fadeIn space-y-4">
            <h3 className="font-display text-sm font-semibold tracking-wider text-slate-100 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>MARS VS EARTH — GEOLOGICAL SIMILARITIES & SCIENTIFIC INSIGHTS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <h4 className="font-mono-tech text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Geological Similarities</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Both {place.name} and {place.earthAnalogueName} share basaltic weathering patterns, mineralogical signatures (such as sulfates and iron oxides), and morphologic landforms carved by ancient liquid water or volcanic extrusion.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-mono-tech text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Environmental Differences</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mars features a thin ~1% CO₂ atmosphere, 0.38 g surface gravity, and extreme diurnal thermal swings, whereas Earth provides a dense nitrogen-oxygen hydrosphere with active plate tectonics and biological weathering.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tech text-[11px] text-slate-400">
                Scientific Reference: Planetary Analogue Mission Archives & Terrestrial Field Data
              </span>
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-1.5 rounded-lg text-xs font-mono-tech font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 transition-colors cursor-pointer"
              >
                RETURN TO 3D PLANETARY ROTATION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
