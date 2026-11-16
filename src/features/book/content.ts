import bookJson from '@/content/generated/book.json';

import type { Book, Part, Section } from './types';

/** The whole book, bundled with the app (see scripts/content-import). */
export const book = bookJson as Book;

const sectionsById = new Map<string, { part: Part; section: Section }>(
  book.parts.flatMap((part) => part.sections.map((section) => [section.id, { part, section }] as const)),
);

export const getSection = (id: string) => sectionsById.get(id);

/** "P10" → section, for links from the carnet and the meditation catalogue. */
export const getSectionByRef = (ref: string) =>
  book.parts.flatMap((p) => p.sections).find((s) => s.ref === ref);
