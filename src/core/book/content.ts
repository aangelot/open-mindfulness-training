/**
 * The book's content, bundled with the app (see scripts/content-import).
 * Shared by the Livre, Carnet and Méditations features.
 */
import bookJson from '@/content/generated/book.json';

import type { Book, Part, Section } from './types';

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
