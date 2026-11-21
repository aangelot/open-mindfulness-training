/**
 * Builds the offline audio pack of the book.
 *
 *   npm run audio:build             # download, encode, write the manifest
 *   npm run audio:build -- --upload # same, then publish the files to the GitHub release (needs `gh`)
 *
 * The site serves 320 kbps stereo MP3 (1.4 GB in total). Guided voice does not
 * need that: we re-encode to mono AAC, about 6× smaller, and host the result as
 * assets of a GitHub release. The app downloads them after the user agrees.
 *
 * Output:
 *   .cache/audio/src/   originals (gitignored, reused between runs)
 *   .cache/audio/out/   encoded files, uploaded to the release
 *   src/content/generated/audio.json   manifest bundled with the app (committed)
 *
 * Bump RELEASE whenever the encoded files change: installed apps compare the
 * manifest's release with what they downloaded. Adding files (e.g. new guides)
 * does not require it: apps download whatever is missing.
 *
 * Also produces, for the sitting sessions of the Méditations tab:
 *   - a "guide" clip of every practice used by the program (see guide.ts):
 *     the guided part, without the bells and the silent tail;
 *   - a "title" clip of the same practices: the announcement of the practice
 *     that opens its guidance (the light version of the sessions plays only that);
 *   - assets/sounds/: the book's bell and silences of fixed lengths (bundled
 *     with the app, used to pace sessions and the free timer).
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import type { Book } from '../../src/core/book/types.ts';
import type { AudioManifest } from '../../src/core/audio/manifest-types.ts';
import { PROGRAM } from '../../src/core/program.ts';
import { SILENCE_SECONDS } from '../../src/core/audio/sound-lengths.ts';
import { analyze, guideBounds, titleBounds } from './guide.ts';
import { assetName } from './names.ts';

const run = promisify(execFile);

const REPO = 'aangelot/open-mindfulness-training';
const RELEASE = 'audio-v1';
const BITRATE = '48k';
const CONCURRENCY = 4;

const root = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url));
const SRC_DIR = root('.cache/audio/src');
const OUT_DIR = root('.cache/audio/out');
const BOOK = root('src/content/generated/book.json');
const MANIFEST = root('src/content/generated/audio.json');
const SOUNDS_DIR = root('assets/sounds');
/** Practice whose opening bell becomes the app's bell. */
const BELL_SOURCE_REF = 'P19';
const ANALYSIS_RATE = 8000;
/** Practices ending with their own spoken conclusion (the dedication): it gets its own clip. */
const OUTRO_REFS = new Set(['P42', 'P43']);

async function download(url: string, dest: string) {
  if (existsSync(dest)) return;
  const res = await fetch(url, { headers: { 'User-Agent': 'open-mindfulness-training-app audio pack' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  await writeFile(`${dest}.part`, Buffer.from(await res.arrayBuffer()));
  await rename(`${dest}.part`, dest);
}

async function encode(src: string, dest: string) {
  if (existsSync(dest)) return;
  // -vn drops the cover art some MP3s carry; faststart lets players stream the file.
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-c:a', 'aac', '-b:a', BITRATE, '-movflags', '+faststart', `${dest}.part.m4a`]);
  await rename(`${dest}.part.m4a`, dest);
}

async function duration(file: string, decimals = 0): Promise<number> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  const f = 10 ** decimals;
  return Math.round(Number(stdout.trim()) * f) / f;
}

async function pcm(src: string): Promise<Float32Array> {
  const { stdout } = await run('ffmpeg', ['-v', 'error', '-i', src, '-ac', '1', '-ar', String(ANALYSIS_RATE), '-f', 'f32le', '-'], {
    encoding: 'buffer',
    maxBuffer: 1 << 28,
  });
  return new Float32Array(stdout.buffer, stdout.byteOffset, stdout.length / 4);
}

/** Part of a practice, short fades so the cuts are inaudible. */
async function encodeClip(src: string, dest: string, start: number, end: number, fadeOut = 1.5) {
  const length = end - start;
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(start), '-t', length.toFixed(2), '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1',
    '-af', `afade=t=in:d=0.1,afade=t=out:st=${(length - fadeOut).toFixed(2)}:d=${fadeOut}`,
    '-c:a', 'aac', '-b:a', BITRATE, '-movflags', '+faststart', `${dest}.part.m4a`]);
  await rename(`${dest}.part.m4a`, dest);
}

/** Guided part of a practice (and its spoken conclusion, for OUTRO_REFS). */
async function encodeGuide(src: string, guide: string, outro: string | null) {
  if (existsSync(guide) && (!outro || existsSync(outro))) return;
  const bounds = guideBounds(analyze(await pcm(src), ANALYSIS_RATE), outro !== null);
  if (!bounds) throw new Error(`${src}: no voice found`);
  await encodeClip(src, guide, bounds.start, bounds.end);
  if (outro && bounds.outro) await encodeClip(src, outro, bounds.outro.start, bounds.outro.end);
}

/** Announcement of a practice (first spoken phrase), see titleBounds. */
async function encodeTitle(src: string, dest: string) {
  if (existsSync(dest)) return;
  const bounds = titleBounds(analyze(await pcm(src), ANALYSIS_RATE));
  if (!bounds) throw new Error(`${src}: no voice found`);
  // The margin after the last word is short: a short fade-out keeps the word whole.
  await encodeClip(src, dest, bounds.start, bounds.end, 0.3);
}

/** The bell (first seconds of any practice) and silences, bundled in assets/sounds. */
async function buildSounds(bellSrc: string) {
  await mkdir(SOUNDS_DIR, { recursive: true });
  const bell = `${SOUNDS_DIR}/cloche.m4a`;
  if (!existsSync(bell)) {
    await run('ffmpeg', ['-loglevel', 'error', '-y', '-t', '5', '-i', bellSrc, '-vn', '-map_metadata', '-1', '-ac', '1', '-c:a', 'aac', '-b:a', '96k', bell]);
  }
  for (const seconds of SILENCE_SECONDS) {
    const out = `${SOUNDS_DIR}/silence-${seconds}.m4a`;
    if (existsSync(out)) continue;
    await run('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', String(seconds), '-c:a', 'aac', '-b:a', '16k', out]);
  }
}

async function pool<T>(items: T[], size: number, task: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) await task(items[next++]);
    }),
  );
}

async function main() {
  const book = JSON.parse(await readFile(BOOK, 'utf8')) as Book;
  const urls = [...new Set(book.parts.flatMap((p) => p.sections).map((s) => s.audioUrl).filter((u): u is string => !!u))];

  const names = new Map<string, string>();
  for (const url of urls) {
    const name = assetName(url);
    const clash = [...names].find(([, n]) => n === name);
    if (clash) throw new Error(`Asset name clash: ${clash[0]} and ${url} → ${name}`);
    names.set(url, name);
  }

  await mkdir(SRC_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const manifest: AudioManifest = {
    release: RELEASE,
    baseUrl: `https://github.com/${REPO}/releases/download/${RELEASE}/`,
    totalBytes: 0,
    tracks: {},
  };

  // Practices played by the sitting sessions get a guide clip.
  const sections = book.parts.flatMap((p) => p.sections);
  const programRefs = new Set(PROGRAM.flatMap((w) => w.sitting.steps.flatMap((s) => s.refs)));
  const guided = new Map(
    sections.filter((s) => s.ref && programRefs.has(s.ref as `P${number}`) && s.audioUrl).map((s) => [s.audioUrl!, s.ref!]),
  );
  const bellUrl = sections.find((s) => s.ref === BELL_SOURCE_REF)?.audioUrl;
  if (!bellUrl) throw new Error(`${BELL_SOURCE_REF} has no audio`);

  let done = 0;
  await pool(urls, CONCURRENCY, async (url) => {
    const name = names.get(url)!;
    const src = `${SRC_DIR}/${name}.mp3`;
    const out = `${OUT_DIR}/${name}.m4a`;
    await download(url, src);
    await encode(src, out);
    const { size } = await stat(out);
    manifest.tracks[url] = { file: `${name}.m4a`, bytes: size, seconds: await duration(out) };
    const ref = guided.get(url);
    if (ref) {
      const clip = async (kind: string) => {
        const path = `${OUT_DIR}/${name}.${kind}.m4a`;
        return { file: `${name}.${kind}.m4a`, bytes: (await stat(path)).size, seconds: await duration(path, 1) };
      };
      const withOutro = OUTRO_REFS.has(ref);
      await encodeGuide(src, `${OUT_DIR}/${name}.guide.m4a`, withOutro ? `${OUT_DIR}/${name}.outro.m4a` : null);
      manifest.tracks[url].guide = await clip('guide');
      if (withOutro) manifest.tracks[url].outro = await clip('outro');
      await encodeTitle(src, `${OUT_DIR}/${name}.title.m4a`);
      manifest.tracks[url].title = await clip('title');
    }
    done++;
    process.stdout.write(`\r${done}/${urls.length} ${name}`.padEnd(70));
  });

  // Stable key order keeps the committed manifest's diff readable.
  manifest.tracks = Object.fromEntries(Object.entries(manifest.tracks).sort(([a], [b]) => a.localeCompare(b)));
  const files = Object.values(manifest.tracks).flatMap((t) => [t, t.guide, t.outro, t.title].filter((f) => f !== undefined));
  manifest.totalBytes = files.reduce((sum, t) => sum + t.bytes, 0);
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`\n✓ ${urls.length} tracks, ${guided.size} guides and titles, ${(manifest.totalBytes / 1e6).toFixed(0)} MB → ${MANIFEST}`);

  await buildSounds(`${SRC_DIR}/${names.get(bellUrl)}.mp3`);
  console.log(`✓ bell and silences → ${SOUNDS_DIR}`);

  if (process.argv.includes('--upload')) {
    const paths = files.map((t) => `${OUT_DIR}/${t.file}`);
    const exists = await run('gh', ['release', 'view', RELEASE, '--repo', REPO]).then(() => true, () => false);
    if (!exists) {
      await run('gh', ['release', 'create', RELEASE, '--repo', REPO, '--title', `Audios du livre (${RELEASE})`, '--notes', 'Méditations du livre réencodées en AAC mono pour l’écoute hors connexion. Contenu sous CC BY-NC-SA 4.0 (voir CONTENT_LICENSE.md).']);
    }
    await run('gh', ['release', 'upload', RELEASE, '--repo', REPO, '--clobber', ...paths], { maxBuffer: 1 << 24 });
    console.log(`✓ uploaded to ${manifest.baseUrl}`);
  } else {
    console.log(`Publish: gh release upload ${RELEASE} ${OUT_DIR}/*.m4a --repo ${REPO}`);
  }
}

await main();
