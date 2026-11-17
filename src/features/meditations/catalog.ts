/** Every audio of the book, grouped by part, for the catalogue. */
import { trackSeconds } from '@/core/audio/manifest';
import { book } from '@/core/book/content';
import type { Part, Section } from '@/core/book/types';

export type CatalogFilter = 'all' | 'pratiques' | 'exposes';

export interface CatalogEntry {
  section: Section & { audioUrl: string };
  seconds: number;
}

export interface CatalogGroup {
  part: Part;
  entries: CatalogEntry[];
}

const withAudio = (s: Section): s is Section & { audioUrl: string } => s.audioUrl !== null;

export const catalog: CatalogGroup[] = book.parts
  .map((part) => ({
    part,
    entries: part.sections.filter(withAudio).map((section) => ({ section, seconds: trackSeconds(section.audioUrl) ?? 0 })),
  }))
  .filter((g) => g.entries.length > 0);

export const catalogCount = catalog.reduce((sum, g) => sum + g.entries.length, 0);

const matches = (filter: CatalogFilter, section: Section) =>
  filter === 'all' || (filter === 'pratiques' ? section.kind === 'pratique' : section.kind === 'expose');

export function filterCatalog(filter: CatalogFilter): CatalogGroup[] {
  return catalog
    .map((g) => ({ ...g, entries: g.entries.filter((e) => matches(filter, e.section)) }))
    .filter((g) => g.entries.length > 0);
}

/** Recording a meditation only makes sense for practices, not talks or summaries. */
export const isPractice = (section: Section) => section.kind === 'pratique';
