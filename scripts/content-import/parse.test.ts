import { classifySlug, dropTitleHeading, parsePostHtml, parseTocTitles, resolveTitle } from './parse';

const post = `<div class="wpb-content-wrapper">[vc_row][vc_column]<h2 class="vcex-module vcex-heading"><span>PRATIQUE 5</span></h2>[/vc_column][/vc_row]
[vc_row center_row= »yes »][vc_column width= »2/3&Prime;»][vc_column_text]
<h3><strong>1. Apprendre à « sentir son corps » </strong></h3>
<p><strong>Descriptif</strong></p>
<p>Bien sentir son corps, l&rsquo;essentiel.</p>
<ul><li>Dans <strong>un lieu calme</strong>.<br />……</li></ul>
<ul><li>Commencez par <a href="https://example.org">entrer</a>.</li></ul>
[/vc_column_text][/vc_column][vc_column width= »1/3&Prime;»]
<audio class="wp-audio-shortcode"><source type="audio/mpeg" src="https://site/P5.mp3?_=1" /></audio>
<div class="theme-button-wrap"><a href="https://site/P5.pdf">Télécharger la page en PDF</a></div>[/vc_column][/vc_row]</div>`;

describe('parsePostHtml', () => {
  const parsed = parsePostHtml(post);

  it('extracts the title, audio and PDF', () => {
    expect(parsed.title).toBe('Apprendre à « sentir son corps »');
    expect(parsed.audioUrl).toBe('https://site/P5.mp3');
    expect(parsed.pdfUrl).toBe('https://site/P5.pdf');
  });

  it('removes shortcodes and decorative headings', () => {
    const text = JSON.stringify(parsed.blocks);
    expect(text).not.toContain('vc_');
    expect(text).not.toContain('PRATIQUE 5');
  });

  it('keeps inline styles and merges one-item lists', () => {
    expect(parsed.blocks[1]).toEqual({ type: 'paragraph', inlines: [{ text: 'Descriptif', bold: true }] });
    expect(parsed.blocks[2]).toEqual({ type: 'paragraph', inlines: [{ text: 'Bien sentir son corps, l’essentiel.' }] });
    const list = parsed.blocks[3];
    expect(list.type).toBe('list');
    if (list.type === 'list') {
      expect(list.items).toHaveLength(2);
      expect(list.items[1]).toContainEqual({ text: 'entrer', href: 'https://example.org' });
    }
  });

  it('drops the opening heading once it is used as title', () => {
    expect(dropTitleHeading(parsed.blocks, 'Apprendre à « sentir son corps »')[0].type).toBe('paragraph');
  });

  it('decodes every entity and drops leading arrow markers', () => {
    const { blocks } = parsePostHtml(
      '<p><strong>&gt; à Voir la conclusion.</strong></p><p>-&gt; Voir le chapitre 1</p><p>2&prime; &lsquo;x&rsquo;</p>',
    );
    expect(blocks.map((b) => (b.type === 'paragraph' ? b.inlines[0].text : ''))).toEqual([
      'Voir la conclusion.',
      'Voir le chapitre 1',
      '2′ ‘x’',
    ]);
  });
});

describe('classifySlug', () => {
  it.each([
    ['5-etape-3-p19', 5, 'P19', 'pratique'],
    ['2-etape-3-e12', 2, 'E12', 'expose'],
    ['expose-68', 0, 'E68', 'expose'],
    ['1-etape-3-intro', 1, null, 'intro'],
    ['9-etape-5-intro-p29-p30-p31', 9, null, 'intro'],
    ['11-etape-1-pratique-type', 11, null, 'pratique-type'],
    ['2-etape-5-plan-pensees', 2, null, 'plan'],
  ])('%s', (slug, order, ref, kind) => {
    expect(classifySlug(slug)).toEqual({ order, ref, kind });
  });
});

describe('titles', () => {
  const toc = parseTocTitles(`
    <a href="https://www.openmindfulness.net/2-etape-3-e12/">La présence ouverte</a>
    <a href="https://www.openmindfulness.net/11-etape-5-p30/">Titre A</a>
    <a href="https://www.openmindfulness.net/11-etape-5-p30/">Titre B</a>`);

  it('flags slugs linked under several titles', () => {
    expect(toc.get('2-etape-3-e12')).toEqual({ title: 'La présence ouverte', ambiguous: false });
    expect(toc.get('11-etape-5-p30')?.ambiguous).toBe(true);
  });

  it('prefers generated, then unambiguous TOC, then heading', () => {
    const base = { order: 2, step: 3, slug: 's', heading: 'Heading', wpTitle: 'WP' } as const;
    expect(resolveTitle({ ...base, kind: 'pratique-type', toc: undefined })).toBe('Pratique type pour la troisième étape');
    expect(resolveTitle({ ...base, kind: 'expose', toc: toc.get('2-etape-3-e12') })).toBe('La présence ouverte');
    expect(resolveTitle({ ...base, kind: 'pratique', toc: toc.get('11-etape-5-p30') })).toBe('Heading');
  });
});
