import { foundationSections, furtherSections, readingStatus, stepSections } from './content';

describe('reading groups', () => {
  it('split the book around the eight steps', () => {
    expect(new Set(foundationSections.map((e) => e.part.id))).toEqual(new Set(['introduction', 'chapitre-1', 'chapitre-2']));
    expect(foundationSections.at(-1)?.section.ref).toBe('E8');
    for (let step = 1; step <= 8; step++) {
      const sections = stepSections(step);
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.every((e) => e.part.id === `etape-${step}`)).toBe(true);
    }
    expect(new Set(furtherSections.map((e) => e.part.id))).toEqual(new Set(['chapitre-4', 'conclusion']));
  });

  it('point to the first unread section', () => {
    const [a, b, c] = foundationSections;
    const status = readingStatus(foundationSections, new Set([a.section.id, c.section.id]));
    expect(status).toMatchObject({ read: 2, total: foundationSections.length, done: false });
    expect(status.next).toBe(b);
  });

  it('go back to the start once everything is read', () => {
    const all = new Set(stepSections(1).map((e) => e.section.id));
    expect(readingStatus(stepSections(1), all)).toMatchObject({ done: true, next: stepSections(1)[0] });
  });
});
