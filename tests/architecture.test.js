import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readSource = (path) => readFile(join(ROOT, path), 'utf8');

test('the collection entry remains free of eager Three.js and media imports', async () => {
  const rootSources = await Promise.all(['src/app.js', 'src/catalog.js', 'src/collection.js'].map(readSource));
  for (const [index, source] of rootSources.entries()) {
    assert.doesNotMatch(source, /from\s+['"]three(?:\/|['"])/, `root source ${index} imports Three.js eagerly`);
    assert.doesNotMatch(source, /import\s+['"][^'"]*stories\//, `root source ${index} imports story runtime CSS eagerly`);
    assert.doesNotMatch(source, /\/audio\//, `root source ${index} embeds a media request`);
  }

  const catalog = rootSources[1];
  assert.match(catalog, /load:\s*\(\)\s*=>\s*import\('\.\/stories\/smell-of-soup\/entry\.js'\)/);
  assert.match(catalog, /load:\s*\(\)\s*=>\s*import\('\.\/stories\/yan-er-dao-ling\/entry\.js'\)/);
});

test('story entry modules expose only the lazy mount boundary', async () => {
  for (const slug of ['smell-of-soup', 'yan-er-dao-ling']) {
    const entry = await readSource(`src/stories/${slug}/entry.js`);
    assert.match(entry, /export async function mount\(app\)/);
    assert.match(entry, /await import\('\.\/index\.js'\)/);
    assert.doesNotMatch(entry, /from\s+['"]three/);
  }
});

test('the document shell points at the collection app and includes trilingual fonts', async () => {
  const html = await readSource('index.html');
  assert.match(html, /<script type="module" src="\/src\/app\.js"><\/script>/);
  assert.match(html, /Noto\+Sans\+SC/);
  assert.match(html, /Noto\+Serif\+SC/);
  assert.match(html, /<title>Wisdom Short Stories<\/title>/);
});

test('generation scripts use environment credentials and namespaced output paths', async () => {
  const scripts = [
    'scripts/stories/smell-of-soup/generate-music.mjs',
    'scripts/stories/yan-er-dao-ling/generate-music.mjs',
    'scripts/stories/yan-er-dao-ling/generate-sfx.mjs',
  ];
  for (const path of scripts) {
    const source = await readSource(path);
    assert.match(source, /process\.env\.ELEVENLABS_API_KEY/);
    assert.doesNotMatch(source, /sk_[a-zA-Z0-9_-]{16,}/, `${path} appears to contain a literal credential`);
  }

  const bellMusic = await readSource(scripts[1]);
  const bellSfx = await readSource(scripts[2]);
  const soupMusic = await readSource(scripts[0]);
  assert.ok(soupMusic.includes('public/audio/stories/smell-of-soup/music'));
  assert.ok(bellMusic.includes('public/audio/stories/yan-er-dao-ling/music'));
  assert.ok(bellSfx.includes('public/audio/stories/yan-er-dao-ling/sfx'));
});

test('cold-agent documentation carries the production and validation contracts', async () => {
  const [agents, pipeline] = await Promise.all([readSource('AGENTS.md'), readSource('docs/STORY_PRODUCTION.md')]);
  for (const required of ['src/stories/<slug>/', 'public/audio/stories/<slug>/', 'npm run build', 'npm run deploy:dry-run']) {
    assert.ok(agents.includes(required), `AGENTS.md is missing ${required}`);
  }
  for (const required of ['Gemini TTS', 'Music and sound design', 'Browser matrix', 'Release only on request']) {
    assert.ok(pipeline.includes(required), `production pipeline is missing ${required}`);
  }
  for (const required of ['English, Chinese, and Indonesian', 'No language may fall back silently']) {
    assert.ok(agents.includes(required), `AGENTS.md is missing ${required}`);
  }
});
