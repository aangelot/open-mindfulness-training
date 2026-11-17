import { silenceFiles } from './sounds';

describe('silence files', () => {
  it('splits any silence into bundled lengths, longest first', () => {
    expect(silenceFiles(754).map((f) => f.seconds)).toEqual([600, 120, 30, 1, 1, 1, 1]);
    expect(silenceFiles(0)).toEqual([]);
    expect(silenceFiles(1499.6).reduce((sum, f) => sum + f.seconds, 0)).toBe(1500);
  });
});
