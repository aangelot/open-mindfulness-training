/** Full-text search in the book. */
import { readingOrder, refLabel, type SectionEntry } from '@/core/book/content';
import type { Block } from '@/core/book/types';

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
