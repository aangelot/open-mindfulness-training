/**
 * Turns the rendered HTML of a WordPress post (WPBakery layout) into
 * structured blocks. Pure functions: covered by parse.test.ts.
 */
import { parse, NodeType, type HTMLElement, type Node } from 'node-html-parser';

import type { Block, Inline, SectionKind } from '../../src/core/book/types.ts';

/** Removes WPBakery shortcodes such as [vc_row css= »…»] and [/vc_column]. */
export function stripShortcodes(html: string): string {
  return html.replace(/\[\/?vc_[^\]]*\]/g, '');
}

/** Decodes every HTML entity (&gt;, &prime;, &#8217;…) and turns non-breaking spaces into spaces. */
const decode = (s: string) => parse(s).textContent.replace(/\u00a0/g, ' ');

function collectInlines(node: Node, style: Omit<Inline, 'text'>, out: Inline[]) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = decode(node.rawText).replace(/\s+/g, ' ');
    if (text) out.push({ text, ...style });
    return;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'br') {
    out.push({ text: '\n', ...style });
    return;
  }
  const next = { ...style };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italic = true;
  if (tag === 'a') {
    const href = el.getAttribute('href');
    if (href) next.href = href;
  }
  for (const child of el.childNodes) collectInlines(child, next, out);
}

/** Merges adjacent runs with identical style and trims the edges. */
export function normalizeInlines(runs: Inline[]): Inline[] {
  const merged: Inline[] = [];
  for (const run of runs) {
    const prev = merged.at(-1);
    if (prev && prev.bold === run.bold && prev.italic === run.italic && prev.href === run.href) {
      prev.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  for (const run of merged) run.text = run.text.replace(/ *\n */g, '\n').replace(/ {2,}/g, ' ');
  // Arrows the authors typed as cross-reference markers ("> à Voir…", "-> Voir…").
  if (merged[0]) merged[0].text = merged[0].text.trimStart().replace(/^-?>\s*(?:à\s+)?/, '');
  const last = merged.at(-1);
  if (last) last.text = last.text.trimEnd();
  return merged.filter((r) => r.text.length > 0).map(dropFalsy);
}

function dropFalsy(run: Inline): Inline {
  const clean: Inline = { text: run.text };
  if (run.bold) clean.bold = true;
  if (run.italic) clean.italic = true;
  if (run.href) clean.href = run.href;
  return clean;
}

const inlinesOf = (el: HTMLElement) => {
  const out: Inline[] = [];
  collectInlines(el, {}, out);
  return normalizeInlines(out);
};

/** Text-only placeholders the site uses for pauses in guided instructions. */
const isEmpty = (inlines: Inline[]) =>
  inlines.length === 0 || inlines.every((i) => /^[\s….]*$/.test(i.text));

export interface ParsedPost {
  /** Text of the h3 opening the content, if any (often the human title). Kept in `blocks`. */
  title: string | null;
  audioUrl: string | null;
  pdfUrl: string | null;
  blocks: Block[];
}

/**
 * The section's audio: the page's first one, except that many pages offer each practice
 * read by a woman then by a man, each under a heading ("Audio femme", "Audio homme - Pratique 6").
 * We keep the man's voice so that a sitting session never mixes voices (some practices
 * only exist with his).
 */
function pickAudio(root: HTMLElement): string | null {
  const audios: { url: string; label: string }[] = [];
  let label = '';
  for (const el of root.querySelectorAll('h2.vcex-heading, audio source')) {
    if (el.tagName === 'H2') label = el.text.trim().toLowerCase();
    else audios.push({ url: (el.getAttribute('src') ?? '').replace(/\?_=\d+$/, ''), label });
  }
  const [first, second] = audios;
  if (!first) return null;
  // Labels read "Audio femme" or "Audio femme - Pratique 6"; a few pages only say it in
  // the file name ("…-P35-FEMME.mp3" under "Audio 1").
  const voice = (a?: { url: string; label: string }) =>
    a && (/^audio (femme|homme)\b/.exec(a.label)?.[1] ?? /-(femme|homme)-?\.mp3$/i.exec(a.url)?.[1].toLowerCase());
  return voice(first) === 'femme' && voice(second) === 'homme' ? second!.url : first.url;
}

export function parsePostHtml(rendered: string): ParsedPost {
  const root = parse(stripShortcodes(rendered));

  const audioUrl = pickAudio(root);
  const pdfUrl =
    root
      .querySelectorAll('a')
      .map((a) => a.getAttribute('href') ?? '')
      .find((h) => h.toLowerCase().endsWith('.pdf')) ?? null;

  // Drop layout chrome: the decorative h2 ("EXPOSÉ 12"), buttons, the audio sidebar.
  for (const el of root.querySelectorAll('h2.vcex-heading, .theme-button-wrap, .vcex-button, audio, .vcex-spacing')) {
    el.remove();
  }

  const blocks: Block[] = [];
  let title: string | null = null;

  for (const el of root.querySelectorAll('h3, h4, p, ul, ol')) {
    // Skip elements nested in a list item: they are handled with the list.
    if (el.closest('li') && el.tagName !== 'UL' && el.tagName !== 'OL') continue;
    if ((el.tagName === 'UL' || el.tagName === 'OL') && el.parentNode?.closest?.('li')) continue;

    const tag = el.tagName.toLowerCase();
    if (tag === 'h3' || tag === 'h4') {
      const inlines = inlinesOf(el).map(({ text }) => ({ text })); // headings are styled by the app
      if (isEmpty(inlines)) continue;
      if (title === null && tag === 'h3' && blocks.length === 0) {
        title = inlines.map((i) => i.text).join('').replace(/^\d+\.\s*/, '').trim();
      }
      blocks.push({ type: 'heading', level: tag === 'h3' ? 3 : 4, inlines });
    } else if (tag === 'p') {
      const inlines = inlinesOf(el);
      if (!isEmpty(inlines)) blocks.push({ type: 'paragraph', inlines });
    } else {
      const items = el.childNodes
        .filter((n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).tagName === 'LI')
        .map(inlinesOf)
        .filter((i) => !isEmpty(i));
      if (items.length === 0) continue;
      const ordered = tag === 'ol';
      // The site writes one <ul> per bullet: merge consecutive lists.
      const prev = blocks.at(-1);
      if (prev?.type === 'list' && prev.ordered === ordered) prev.items.push(...items);
      else blocks.push({ type: 'list', ordered, items });
    }
  }

  return { title, audioUrl, pdfUrl, blocks };
}

/** "11-etape-1-pratique-type" → { order: 11, ref: null, kind: 'pratique-type' } */
export function classifySlug(slug: string): { order: number; ref: string | null; kind: SectionKind } {
  const order = Number(/^(\d+)-/.exec(slug)?.[1] ?? 0);
  const refMatch = /(?:^|-)([ep])(\d+)$/.exec(slug) ?? /^expose-(\d+)$/.exec(slug);
  let ref: string | null = null;
  let kind: SectionKind = 'autre';
  if (/-intro($|-)/.test(slug)) kind = 'intro'; // before refs: "9-etape-5-intro-p29-p30-p31"
  else if (refMatch && refMatch.length === 3) {
    ref = `${refMatch[1].toUpperCase()}${refMatch[2]}`;
    kind = refMatch[1] === 'p' ? 'pratique' : 'expose';
  } else if (refMatch) {
    ref = `E${refMatch[1]}`;
    kind = 'expose';
  } else if (slug.includes('pratique-type')) kind = 'pratique-type';
  else if (slug.includes('-plan-')) kind = 'plan';
  else if (slug.includes('resume')) kind = 'resume';
  return { order, ref, kind };
}

export interface TocEntry {
  title: string;
  /** The TOC links this slug under several different titles: one of them is wrong. */
  ambiguous: boolean;
}

/** Titles from the site's "Table des matières" page, keyed by post slug. */
export function parseTocTitles(rendered: string): Map<string, TocEntry> {
  const root = parse(stripShortcodes(rendered));
  const entries = new Map<string, TocEntry>();
  for (const a of root.querySelectorAll('a')) {
    const slug = /openmindfulness\.net\/([^/#?]+)\/?$/.exec(a.getAttribute('href') ?? '')?.[1];
    const title = decode(a.textContent).replace(/\s+/g, ' ').trim();
    if (!slug || !title) continue;
    const existing = entries.get(slug);
    if (!existing) entries.set(slug, { title, ambiguous: false });
    else if (existing.title !== title) existing.ambiguous = true;
  }
  return entries;
}

const ORDINALS = ['', 'première', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'septième', 'huitième'];

export interface TitleInput {
  kind: SectionKind;
  order: number;
  step: number | null;
  slug: string;
  heading: string | null;
  toc: TocEntry | undefined;
  wpTitle: string;
}

/**
 * Picks a section title. Priority: generated title for step "pratique type" and
 * step intro, then an unambiguous TOC entry, then the opening h3, then the rest.
 * (The TOC links a few slugs to the wrong post, hence the ambiguity check.)
 */
export function resolveTitle({ kind, order, step, slug, heading, toc, wpTitle }: TitleInput): string {
  if (kind === 'pratique-type' && step) return `Pratique type pour la ${ORDINALS[step]} étape`;
  if (kind === 'intro' && step && order === 1) return `Introduction de la ${ORDINALS[step]} étape`;
  if (toc && !toc.ambiguous) return toc.title;
  if (heading) return heading;
  if (toc) return toc.title;
  const topic = kind === 'plan' ? /-plan-(.+)$/.exec(slug)?.[1] : undefined;
  return topic ? `Plan : ${topic}` : decode(wpTitle);
}

/** The opening h3 duplicates the title: drop it from the body. */
export function dropTitleHeading(blocks: Block[], title: string): Block[] {
  const first = blocks[0];
  if (first?.type !== 'heading') return blocks;
  const text = first.inlines.map((i) => i.text).join('').replace(/^\d+\.\s*/, '').trim();
  return text === title ? blocks.slice(1) : blocks;
}
