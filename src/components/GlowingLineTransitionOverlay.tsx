import { ArrowLeft, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PlanetPlace } from '../data/planetaryAtlasData';

interface GlowingLineTransitionOverlayProps {
  place: PlanetPlace;
  onReset: () => void;
  onNavigateDetail: (place: PlanetPlace) => void;
  onSelectCitation: (citation: string) => void;
}

export function GlowingLineTransitionOverlay({
  place,
  onReset,
  onNavigateDetail,
  onSelectCitation: _onSelectCitation,
}: GlowingLineTransitionOverlayProps) {
  const [phase, setPhase] = useState<'laser_expanding' | 'glow_expanding' | 'ready'>('laser_expanding');

  useEffect(() => {
    // Cinematic Luminous Divider Transition Timing:
    // 0ms -> laser expanding from clicked pin
    // 900ms -> glow expanding across screen
    // 1600ms -> open dedicated detail page smoothly
    const t1 = window.setTimeout(() => setPhase('glow_expanding'), 900);
    const t2 = window.setTimeout(() => {
      onNavigateDetail(place);
    }, 1600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [place, onNavigateDetail]);

  return (
    <div
      data-testid="glowing-line-transition-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/75 overflow-hidden transition-all duration-700"
    >
      {/* Luminous Divider Beam / Laser Expanding */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full max-w-5xl h-96 flex items-center justify-center">
          {/* Luminous laser line */}
          <div
            className={`absolute h-2 bg-white rounded-full transition-all duration-700 ease-out shadow-[0_0_40px_#FFFFFF,0_0_80px_#FFFFFF,0_0_140px_rgba(255,255,255,0.9)] ${
              phase === 'laser_expanding' ? 'w-0 opacity-0' : 'w-full opacity-100'
            }`}
          />
          {/* Travelling light particle / core */}
          <div
            className={`absolute h-5 w-5 bg-white rounded-full shadow-[0_0_60px_#FFFFFF,0_0_120px_#FFFFFF] transition-all duration-700 ease-out ${
              phase === 'laser_expanding' ? 'left-0 scale-50 opacity-0' : 'left-1/2 scale-150 opacity-100'
            }`}
          />
        </div>
      </div>

      {/* Expanding White Light Overlay during transition to detail page */}
      <div
        className={`absolute inset-0 bg-white transition-all duration-600 pointer-events-none ${
          phase === 'glow_expanding' ? 'opacity-95 scale-105' : 'opacity-0 scale-100'
        }`}
      />

      {/* Header Info */}
      <div className="absolute top-6 inset-x-6 flex items-center justify-between z-30">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 bg-[#0D111A]/95 text-white text-xs font-mono-tech shadow-2xl">
          <Zap className="w-4 h-4 text-white" />
          <span>LUMINOUS DIVIDER: {place.name.toUpperCase()}</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-[#0D111A]/95 hover:bg-white/20 text-slate-100 transition-all cursor-pointer text-xs font-mono-tech font-semibold shadow-2xl"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>CANCEL</span>
        </button>
      </div>
    </div>
  );
}
