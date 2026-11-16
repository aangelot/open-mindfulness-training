/**
 * Imports the book from openmindfulness.net (WordPress REST API) into
 * src/content/generated/book.json.
 *
 *   npm run content:import
 *
 * The output is committed: the app reads the book offline and never calls the site
 * for text. Re-run this script when the site content changes, then review the diff.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { Book, Part, Section } from '../../src/features/book/types.ts';
import { classifySlug, dropTitleHeading, parsePostHtml, parseTocTitles, resolveTitle } from './parse.ts';

const SITE = 'https://www.openmindfulness.net';
const OUT = fileURLToPath(new URL('../../src/content/generated/book.json', import.meta.url));

/** Book structure: WordPress category slug → part of the book, in reading order. */
const PARTS: { category: string; id: string; chapter: number; step: number | null; title: string }[] = [
  { category: 'introduction', id: 'introduction', chapter: 0, step: null, title: 'Introduction' },
  { category: 'chapitre-1', id: 'chapitre-1', chapter: 1, step: null, title: 'Chapitre 1 — La pleine présence du point de vue des sciences contemplatives' },
  { category: 'chapitre-2', id: 'chapitre-2', chapter: 2, step: null, title: 'Chapitre 2 — Découvrir et cultiver l’état de pleine présence' },
  { category: 'etape-1-chap3', id: 'etape-1', chapter: 3, step: 1, title: 'Première étape : la présence attentive au corps' },
  { category: 'etape-2-chap3', id: 'etape-2', chapter: 3, step: 2, title: 'Deuxième étape : la présence attentive au souffle' },
  { category: 'etape-3-chap3', id: 'etape-3', chapter: 3, step: 3, title: 'Troisième étape : la présence ouverte à ce qui nous entoure' },
  { category: 'etape-4-chap3', id: 'etape-4', chapter: 3, step: 4, title: 'Quatrième étape : la présence ouverte et relâchée' },
  { category: 'etape-5-chap3', id: 'etape-5', chapter: 3, step: 5, title: 'Cinquième étape : l’intégration des pensées et des émotions dans la pleine présence' },
  { category: 'etape-6-chap3', id: 'etape-6', chapter: 3, step: 6, title: 'Sixième étape : la présence altruiste dans la relation et dans la communication' },
  { category: 'etape-7-chap3', id: 'etape-7', chapter: 3, step: 7, title: 'Septième étape : la pleine présence dans la vie quotidienne' },
  { category: 'etape-8-chap3', id: 'etape-8', chapter: 3, step: 8, title: 'Huitième étape : la pleine présence dans toute la vie' },
  { category: 'chapitre-4', id: 'chapitre-4', chapter: 4, step: null, title: 'Chapitre 4 — La méthode d’entraînement à la pleine présence' },
  { category: 'conclusion', id: 'conclusion', chapter: 5, step: null, title: 'Conclusion' },
];

interface WpCategory { id: number; slug: string }
interface WpPost { id: number; slug: string; categories: number[]; title: { rendered: string }; content: { rendered: string } }

async function getAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${SITE}/wp-json/wp/v2/${path}${sep}per_page=100&page=${page}`, {
      headers: { 'User-Agent': 'open-mindfulness-training-app content importer' },
    });
    if (!res.ok) throw new Error(`${path} page ${page}: HTTP ${res.status}`);
    items.push(...((await res.json()) as T[]));
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1)) return items;
  }
}

async function main() {
  const [categories, posts, [toc]] = await Promise.all([
    getAll<WpCategory>('categories?_fields=id,slug'),
    getAll<WpPost>('posts?_fields=id,slug,categories,title,content'),
    getAll<WpPost>('pages?slug=table-des-matieres&_fields=id,slug,categories,title,content'),
  ]);
  if (!toc) throw new Error('Missing "table-des-matieres" page');
  const tocTitles = parseTocTitles(toc.content.rendered);
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const warnings: string[] = [];

  const parts: Part[] = PARTS.map((def) => {
    const catId = categoryIdBySlug.get(def.category);
    if (catId === undefined) throw new Error(`Missing WordPress category "${def.category}"`);

    const sections: Section[] = posts
      .filter((p) => p.categories.includes(catId))
      .map((p) => {
        const { order, ref, kind } = classifySlug(p.slug);
        const parsed = parsePostHtml(p.content.rendered);
        const title = resolveTitle({
          kind, order, step: def.step, slug: p.slug, heading: parsed.title, toc: tocTitles.get(p.slug), wpTitle: p.title.rendered,
        });
        const blocks = dropTitleHeading(parsed.blocks, title);
        if (parsed.blocks.length === 0) warnings.push(`${p.slug}: empty content`);
        return { id: p.slug, wpId: p.id, order, ref, kind, title, audioUrl: parsed.audioUrl, pdfUrl: parsed.pdfUrl, blocks };
      })
      .sort((a, b) => a.order - b.order);

    return { id: def.id, chapter: def.chapter, step: def.step, title: def.title, sections };
  });

  const book: Book = { source: SITE, generatedAt: new Date().toISOString(), parts };
  await writeFile(OUT, JSON.stringify(book, null, 1) + '\n');

  const all = parts.flatMap((p) => p.sections);
  console.log(`✓ ${all.length} sections in ${parts.length} parts, ${all.filter((s) => s.audioUrl).length} with audio → ${OUT}`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

await main();
