import bookJson from '@/content/generated/book.json';

import type { Block, Book, Part, Section } from './types';

/** The whole book, bundled with the app (see scripts/content-import). */
export const book = bookJson as Book;

export interface SectionEntry {
  part: Part;
  section: Section;
  /** Position in reading order. */
  index: number;
}

/** Every section in reading order, from the introduction to the conclusion. */
export const readingOrder: SectionEntry[] = book.parts
  .flatMap((part) => part.sections.map((section) => ({ part, section })))
  .map((entry, index) => ({ ...entry, index }));

const entriesById = new Map(readingOrder.map((entry) => [entry.section.id, entry]));

export const getSection = (id: string) => entriesById.get(id);

/** "P10" → section, for links from the carnet and the meditation catalogue. */
export const getSectionByRef = (ref: string) => readingOrder.find((e) => e.section.ref === ref)?.section;

export const getNeighbors = (id: string) => {
  const entry = entriesById.get(id);
  if (!entry) return { prev: undefined, next: undefined };
  return { prev: readingOrder[entry.index - 1], next: readingOrder[entry.index + 1] };
};

/** "P5" → "Pratique 5", "E12" → "Exposé 12". */
export function refLabel(ref: string): string {
  const n = ref.slice(1);
  return ref.startsWith('P') ? `Pratique ${n}` : `Exposé ${n}`;
}

// --- Search -----------------------------------------------------------------

/** Lowercase, no accents, straight apostrophes: "Éveil’" → "eveil'". Keeps string length. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘]/g, "'");

const blockText = (b: Block) =>
  b.type === 'list' ? b.items.map((item) => item.map((i) => i.text).join('')).join('\n') : b.inlines.map((i) => i.text).join('');

interface IndexedSection {
  entry: SectionEntry;
  text: string;
  /** normalize(text): same length, so offsets map back to `text`. */
  haystack: string;
  title: string;
}

let index: IndexedSection[] | null = null;

/** Built on first search only: no cost at startup. */
function searchIndex(): IndexedSection[] {
  index ??= readingOrder.map((entry) => {
    const text = entry.section.blocks.map(blockText).join('\n').replace(/\s+/g, ' ');
    const title = normalize(`${entry.section.ref ?? ''} ${entry.section.ref ? refLabel(entry.section.ref) : ''} ${entry.section.title}`);
    return { entry, text, haystack: normalize(text), title };
  });
  return index;
}

export interface SearchHit {
  entry: SectionEntry;
  inTitle: boolean;
  /** Text around the first match, split so the match can be highlighted. */
  snippet: { before: string; match: string; after: string } | null;
}

const SNIPPET_CONTEXT = 60;

/**
 * Sections containing every word of the query (accent and case insensitive).
 * Title matches come first, then reading order.
 */
export function searchBook(query: string, limit = 50): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const item of searchIndex()) {
    if (!terms.every((t) => item.title.includes(t) || item.haystack.includes(t))) continue;
    const inTitle = terms.every((t) => item.title.includes(t));
    const term = terms.find((t) => item.haystack.includes(t));
    let snippet: SearchHit['snippet'] = null;
    if (term) {
      const at = item.haystack.indexOf(term);
      const start = Math.max(0, at - SNIPPET_CONTEXT);
      const end = Math.min(item.text.length, at + term.length + SNIPPET_CONTEXT);
      snippet = {
        before: (start > 0 ? '…' : '') + item.text.slice(start, at).trimStart(),
        match: item.text.slice(at, at + term.length),
        after: item.text.slice(at + term.length, end).trimEnd() + (end < item.text.length ? '…' : ''),
      };
    }
    hits.push({ entry: item.entry, inTitle, snippet });
  }
  hits.sort((a, b) => Number(b.inTitle) - Number(a.inTitle) || a.entry.index - b.entry.index);
  return hits.slice(0, limit);
}
