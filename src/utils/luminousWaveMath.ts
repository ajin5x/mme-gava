export interface LuminousWaveSample {
  x: number;
  y: number;
  z: number;
}

export interface LuminousWaveParams {
  spanWidth: number;
  baseY: number;
  amplitudeY1: number;
  amplitudeY2: number;
  amplitudeZ: number;
  speed: number;
}

export const DEFAULT_LUMINOUS_WAVE_PARAMS: LuminousWaveParams = {
  spanWidth: 16.0,
  baseY: 0,
  amplitudeY1: 0.22,
  amplitudeY2: 0.11,
  amplitudeZ: 0.52,
  speed: 1.0,
};

/**
 * Evaluates a point along the primary 3D luminous white wave at normalized parameter u in [0, 1]
 * and elapsed time (seconds). Matches the GLSL vertex displacement shader in DetailLuminous3D.
 */
export function evaluateLuminousWavePoint(
  u: number,
  timeSec: number,
  params: LuminousWaveParams = DEFAULT_LUMINOUS_WAVE_PARAMS
): LuminousWaveSample {
  const clampedU = Math.max(0, Math.min(1, u));
  const x = (clampedU - 0.5) * params.spanWidth;
  const t = timeSec * params.speed;
  const envelope = Math.sin(clampedU * Math.PI);

  const y =
    params.baseY +
    (Math.sin(x * 0.52 + t * 1.25) * params.amplitudeY1 +
      Math.cos(x * 0.27 - t * 0.85) * params.amplitudeY2) *
      (0.35 + 0.65 * envelope);

  const z =
    Math.cos(x * 0.42 + t * 0.95) * params.amplitudeZ * (0.25 + 0.75 * envelope);

  return { x, y, z };
}

/**
 * Computes normalized pulse progression along the wave in [0, 1] with smooth wrap-around.
 */
export function evaluatePhotonPulseU(timeSec: number, cycleSeconds = 4.2, phaseOffset = 0): number {
  const raw = ((timeSec / cycleSeconds) + phaseOffset) % 1;
  return raw < 0 ? raw + 1 : raw;
}
