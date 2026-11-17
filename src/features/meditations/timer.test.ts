import { bellTimes, timerPlan } from './timer';

const labels = { title: 't', subtitle: 's', part: 'p' };
const length = (plan: ReturnType<typeof timerPlan>) =>
  plan.parts[0].items.reduce((sum, i) => sum + (i.kind === 'silence' ? i.seconds : i.kind === 'bell' ? 5 : 0), 0);

describe('free timer', () => {
  it('rings at the start and the end', () => {
    expect(bellTimes({ minutes: 20, interval: 0 })).toEqual([0, 1200]);
  });

  it('rings at every interval, not twice at the end', () => {
    expect(bellTimes({ minutes: 20, interval: 5 })).toEqual([0, 300, 600, 900, 1200]);
    expect(bellTimes({ minutes: 12, interval: 5 })).toEqual([0, 300, 600, 720]);
  });

  it('places each bell exactly on time, the last one ringing at the end', () => {
    const plan = timerPlan({ minutes: 20, interval: 10 }, labels);
    expect(plan.parts[0].items).toEqual([
      { kind: 'bell' },
      { kind: 'silence', seconds: 595 },
      { kind: 'bell' },
      { kind: 'silence', seconds: 595 },
      { kind: 'bell' },
    ]);
    expect(length(plan)).toBe(20 * 60 + 5);
  });
});
