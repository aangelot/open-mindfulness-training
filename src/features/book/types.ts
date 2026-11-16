/**
 * Shape of src/content/generated/book.json, produced by scripts/content-import.
 * Kept free of runtime imports so the Node import script can share it.
 */

export interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
}

export type Block =
  | { type: 'heading'; level: 3 | 4; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] };

export type SectionKind =
  | 'expose' // E n
  | 'pratique' // P n
  | 'intro'
  | 'plan'
  | 'resume'
  | 'pratique-type'
  | 'autre';

export interface Section {
  /** WordPress slug, stable id used in routes: /livre/<id> */
  id: string;
  wpId: number;
  order: number;
  /** "E12", "P19"… when the section is a numbered talk or practice. */
  ref: string | null;
  kind: SectionKind;
  title: string;
  /** MP3 url on openmindfulness.net, if the page has one. */
  audioUrl: string | null;
  pdfUrl: string | null;
  blocks: Block[];
}

export interface Part {
  id: string;
  /** 1–4 for chapters, 0 for introduction, 5 for conclusion. */
  chapter: number;
  /** 1–8 for the steps of chapter 3. */
  step: number | null;
  title: string;
  sections: Section[];
}

export interface Book {
  source: string;
  generatedAt: string;
  parts: Part[];
}
