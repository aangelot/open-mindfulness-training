import { analyze, guideBounds } from './guide';

const RATE = 8000;

/** A synthetic practice: bell, silence, "voice" (noise bursts), room tone, bell. */
function practice(parts: { kind: 'bell' | 'voice' | 'quiet' | 'zero'; seconds: number }[]): Float32Array {
  const total = parts.reduce((sum, p) => sum + p.seconds, 0);
  const out = new Float32Array(total * RATE);
  let at = 0;
  let seed = 1;
  const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (const p of parts) {
    for (let i = 0; i < p.seconds * RATE; i++) {
      const t = i / RATE;
      out[at + i] =
        p.kind === 'bell'
          ? 0.9 * Math.exp(-t) * Math.sin(2 * Math.PI * 360 * t)
          : p.kind === 'voice'
            ? 0.5 * noise() * (Math.sin(2 * Math.PI * 3 * t) > -0.5 ? 1 : 0.01)
            : p.kind === 'quiet'
              ? 0.003 * noise()
              : 0;
    }
    at += p.seconds * RATE;
  }
  return out;
}

describe('guide bounds', () => {
  it('keeps the guidance and its short pauses, drops the bells and the silent tail', () => {
    const pcm = practice([
      { kind: 'bell', seconds: 5 },
      { kind: 'zero', seconds: 2 },
      { kind: 'voice', seconds: 60 },
      { kind: 'quiet', seconds: 15 }, // a pause inside the guidance
      { kind: 'voice', seconds: 30 },
      { kind: 'quiet', seconds: 300 },
      { kind: 'bell', seconds: 6 },
    ]);
    const b = guideBounds(analyze(pcm, RATE))!;
    expect(b.start).toBe(5);
    // Voice ends at 112 s, plus a 2 s margin.
    expect(b.end).toBeGreaterThan(113);
    expect(b.end).toBeLessThan(115);
    expect(b.bell).toBeGreaterThan(410);
    expect(b.bell).toBeLessThanOrEqual(412);
  });

  it('splits off a spoken conclusion after a long pause', () => {
    const pcm = practice([
      { kind: 'bell', seconds: 5 },
      { kind: 'zero', seconds: 2 },
      { kind: 'voice', seconds: 60 },
      { kind: 'quiet', seconds: 200 },
      { kind: 'voice', seconds: 20 },
      { kind: 'quiet', seconds: 10 },
      { kind: 'bell', seconds: 6 },
    ]);
    const b = guideBounds(analyze(pcm, RATE), true)!;
    expect(b.end).toBeLessThan(70);
    expect(b.outro!.start).toBeGreaterThan(264);
    expect(b.outro!.start).toBeLessThan(268);
    expect(b.outro!.end).toBeGreaterThan(287);
    expect(b.outro!.end).toBeLessThan(291);
  });
});
