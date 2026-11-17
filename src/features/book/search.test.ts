import { book, getNeighbors, getSection, readingOrder, refLabel } from '@/core/book/content';

import { normalize, searchBook } from './search';

describe('reading order', () => {
  it('lists every section once, part by part', () => {
    const total = book.parts.reduce((n, p) => n + p.sections.length, 0);
    expect(readingOrder).toHaveLength(total);
    expect(new Set(readingOrder.map((e) => e.section.id)).size).toBe(total);
    expect(readingOrder[0].part.id).toBe('introduction');
    expect(readingOrder.at(-1)!.part.id).toBe('conclusion');
  });

  it('links neighbours across parts', () => {
    const lastOfIntro = book.parts[0].sections.at(-1)!;
    const { prev, next } = getNeighbors(lastOfIntro.id);
    expect(next?.part.id).toBe(book.parts[1].id);
    expect(prev?.part.id).toBe('introduction');
    expect(getNeighbors(readingOrder[0].section.id).prev).toBeUndefined();
    expect(getNeighbors(readingOrder.at(-1)!.section.id).next).toBeUndefined();
    expect(getSection(lastOfIntro.id)?.index).toBe(book.parts[0].sections.length - 1);
  });
});

describe('search', () => {
  it('normalizes accents, case and apostrophes without changing length', () => {
    expect(normalize('Éveil’Ça')).toBe("eveil'ca");
    expect(normalize('Éveil’Ça')).toHaveLength('Éveil’Ça'.length);
  });

  it('finds words without accents and highlights the original text', () => {
    const hits = searchBook('presence');
    expect(hits.length).toBeGreaterThan(10);
    const withSnippet = hits.find((h) => h.snippet)!;
    expect(normalize(withSnippet.snippet!.match)).toBe('presence');
  });

  it('requires every word and ranks title matches first', () => {
    const hits = searchBook('pratique type');
    expect(hits[0].inTitle).toBe(true);
    expect(hits[0].entry.section.title).toMatch(/Pratique type/);
    expect(searchBook('souffle zzzzqqq')).toEqual([]);
  });

  it('matches section refs', () => {
    expect(searchBook('P5').some((h) => h.entry.section.ref === 'P5')).toBe(true);
  });

  it('ignores one-letter queries', () => {
    expect(searchBook(' a ')).toEqual([]);
  });
});

it('labels refs in French', () => {
  expect(refLabel('P5')).toBe('Pratique 5');
  expect(refLabel('E12')).toBe('Exposé 12');
});
