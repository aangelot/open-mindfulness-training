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

/** What to read before the eight weeks: the introduction and chapters 1 and 2. */
export const foundationSections = readingOrder.filter((e) => e.part.chapter <= 2);

/** Step n of chapter 3 (the step read during week n of a cycle). */
export const stepSections = (step: number) => readingOrder.filter((e) => e.part.step === step);

/** After the eight weeks: chapter 4 and the conclusion. */
export const furtherSections = readingOrder.filter((e) => e.part.chapter >= 4);

export interface ReadingStatus {
  read: number;
  total: number;
  done: boolean;
  /** First unread section, or the first section once everything is read. */
  next: SectionEntry;
}

export function readingStatus(entries: readonly SectionEntry[], readIds: ReadonlySet<string>): ReadingStatus {
  const read = entries.filter((e) => readIds.has(e.section.id)).length;
  return {
    read,
    total: entries.length,
    done: read === entries.length,
    next: entries.find((e) => !readIds.has(e.section.id)) ?? entries[0],
  };
}
