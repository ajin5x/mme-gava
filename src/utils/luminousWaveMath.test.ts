import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LUMINOUS_WAVE_PARAMS,
  evaluateLuminousWavePoint,
  evaluatePhotonPulseU,
} from './luminousWaveMath';

test('evaluateLuminousWavePoint spans full width symmetrically and remains continuous over time', () => {
  const start = evaluateLuminousWavePoint(0, 1.25);
  const mid = evaluateLuminousWavePoint(0.5, 1.25);
  const end = evaluateLuminousWavePoint(1, 1.25);

  assert.equal(start.x, -DEFAULT_LUMINOUS_WAVE_PARAMS.spanWidth / 2);
  assert.equal(mid.x, 0);
  assert.equal(end.x, DEFAULT_LUMINOUS_WAVE_PARAMS.spanWidth / 2);

  // Smooth continuity check across small dt
  const a = evaluateLuminousWavePoint(0.42, 2.0);
  const b = evaluateLuminousWavePoint(0.42, 2.016);
  assert.ok(Math.abs(a.y - b.y) < 0.02);
  assert.ok(Math.abs(a.z - b.z) < 0.02);
});

test('evaluatePhotonPulseU wraps smoothly in [0, 1)', () => {
  assert.equal(evaluatePhotonPulseU(0, 4.0, 0), 0);
  assert.equal(evaluatePhotonPulseU(2.0, 4.0, 0), 0.5);
  const wrapped = evaluatePhotonPulseU(4.0, 4.0, 0);
  assert.ok(wrapped >= 0 && wrapped < 1);
  const offset = evaluatePhotonPulseU(0, 4.0, 0.5);
  assert.equal(offset, 0.5);
});
