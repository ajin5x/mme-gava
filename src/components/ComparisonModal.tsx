import { X } from 'lucide-react';
import { useEffect } from 'react';
import { COMPARISON_MATRIX, PLANET_DATASETS } from '../data/planetaryAtlasData';

interface ComparisonModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComparisonModal({ open, onClose }: ComparisonModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-matrix-title"
      data-testid="comparison-modal"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl bg-[#0D111A] border border-white/[0.1] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div>
            <p className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-cyan-300">
              Telemetry &amp; Simulation Fidelity Matrix
            </p>
            <h2
              id="comparison-matrix-title"
              className="font-display text-lg sm:text-xl font-semibold text-slate-50 mt-0.5"
            >
              Earth vs. Mars vs. The Moon
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison matrix"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto atlas-scroll p-6">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.1]">
                <th className="py-3 pr-4 font-mono-tech text-xs uppercase tracking-wider text-slate-400 w-44">
                  Parameter
                </th>
                <th
                  className="py-3 px-4 font-display text-sm font-semibold"
                  style={{ color: PLANET_DATASETS.earth.accentPrimary }}
                >
                  Earth (Baseline)
                </th>
                <th
                  className="py-3 px-4 font-display text-sm font-semibold"
                  style={{ color: PLANET_DATASETS.mars.accentSecondary }}
                >
                  Mars
                </th>
                <th
                  className="py-3 pl-4 font-display text-sm font-semibold"
                  style={{ color: PLANET_DATASETS.moon.accentSecondary }}
                >
                  The Moon
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {COMPARISON_MATRIX.map((row) => (
                <tr key={row.metric} className="align-top">
                  <th className="py-4 pr-4 font-medium text-xs sm:text-sm text-slate-200">
                    {row.metric}
                  </th>
                  <td className="py-4 px-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {row.earth}
                  </td>
                  <td className="py-4 px-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {row.mars}
                  </td>
                  <td className="py-4 pl-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {row.moon}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
