import { buildTimeline, locate, partAt, type ItemResolver } from './timeline';
import type { SessionPlan } from './types';

const resolve: ItemResolver = (item) => {
  if (item.kind === 'bell') return [{ source: 'bell', seconds: 5 }];
  if (item.kind === 'silence') return [{ source: 'silence', seconds: item.seconds }];
  if (item.kind === 'guide') return item.url === 'missing' ? [] : [{ source: item.url, seconds: 100 }];
  return [];
};

const plan: SessionPlan = {
  title: 't',
  parts: [
    { label: 'intro', items: [{ kind: 'bell' }, { kind: 'silence', seconds: 120 }] },
    { label: 'P1', items: [{ kind: 'bell' }, { kind: 'guide', url: 'p1' }, { kind: 'silence', seconds: 60 }] },
    { label: 'P2', items: [{ kind: 'bell' }, { kind: 'guide', url: 'missing' }, { kind: 'bell' }] },
  ],
};

describe('session timeline', () => {
  const timeline = buildTimeline(plan, resolve);

  it('lays out every file end to end, skipping what cannot be played', () => {
    expect(timeline.offsets).toEqual([0, 5, 125, 130, 230, 290, 295]);
    expect(timeline.partStarts).toEqual([0, 125, 290]);
    expect(timeline.total).toBe(300);
  });

  it('finds the file and the offset of a position', () => {
    expect(locate(timeline, 0)).toEqual({ index: 0, offset: 0 });
    expect(locate(timeline, 150)).toEqual({ index: 3, offset: 20 });
    expect(locate(timeline, 299)).toEqual({ index: 6, offset: 4 });
    expect(partAt(timeline, 124)).toBe(0);
    expect(partAt(timeline, 125)).toBe(1);
  });
});
