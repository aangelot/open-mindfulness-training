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
 * manifest's release with what they downloaded.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import type { Book } from '../../src/features/book/types.ts';
import type { AudioManifest } from '../../src/core/audio/manifest-types.ts';
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

async function duration(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Math.round(Number(stdout.trim()));
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

  let done = 0;
  await pool(urls, CONCURRENCY, async (url) => {
    const name = names.get(url)!;
    const src = `${SRC_DIR}/${name}.mp3`;
    const out = `${OUT_DIR}/${name}.m4a`;
    await download(url, src);
    await encode(src, out);
    const { size } = await stat(out);
    manifest.tracks[url] = { file: `${name}.m4a`, bytes: size, seconds: await duration(out) };
    done++;
    process.stdout.write(`\r${done}/${urls.length} ${name}`.padEnd(70));
  });

  // Stable key order keeps the committed manifest's diff readable.
  manifest.tracks = Object.fromEntries(Object.entries(manifest.tracks).sort(([a], [b]) => a.localeCompare(b)));
  manifest.totalBytes = Object.values(manifest.tracks).reduce((sum, t) => sum + t.bytes, 0);
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`\n✓ ${urls.length} tracks, ${(manifest.totalBytes / 1e6).toFixed(0)} MB → ${MANIFEST}`);

  if (process.argv.includes('--upload')) {
    const files = Object.values(manifest.tracks).map((t) => `${OUT_DIR}/${t.file}`);
    const exists = await run('gh', ['release', 'view', RELEASE, '--repo', REPO]).then(() => true, () => false);
    if (!exists) {
      await run('gh', ['release', 'create', RELEASE, '--repo', REPO, '--title', `Audios du livre (${RELEASE})`, '--notes', 'Méditations du livre réencodées en AAC mono pour l’écoute hors connexion. Contenu sous CC BY-NC-SA 4.0 (voir CONTENT_LICENSE.md).']);
    }
    await run('gh', ['release', 'upload', RELEASE, '--repo', REPO, '--clobber', ...files], { maxBuffer: 1 << 24 });
    console.log(`✓ uploaded to ${manifest.baseUrl}`);
  } else {
    console.log(`Publish: gh release upload ${RELEASE} ${OUT_DIR}/*.m4a --repo ${REPO}`);
  }
}

await main();
