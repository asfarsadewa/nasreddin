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
  assert.match(catalog, /load:\s*\(\)\s*=>\s*import\('\.\/stories\/tiger-and-dried-persimmon\/entry\.js'\)/);
  assert.match(catalog, /load:\s*\(\)\s*=>\s*import\('\.\/stories\/anansi-and-the-pot\/entry\.js'\)/);
  assert.match(catalog, /load:\s*\(\)\s*=>\s*import\('\.\/stories\/si-kancil-dan-buaya\/entry\.js'\)/);

  const app = rootSources[0];
  assert.match(app, /async function mountApplication\(\)/, 'story loading must run outside root-module evaluation');
  assert.match(app, /mountApplication\(\)\.catch\(/, 'mount failures need a deterministic fallback');
});

test('story entry modules expose only the lazy mount boundary', async () => {
  for (const slug of ['smell-of-soup', 'yan-er-dao-ling', 'tiger-and-dried-persimmon', 'anansi-and-the-pot', 'si-kancil-dan-buaya']) {
    const entry = await readSource(`src/stories/${slug}/entry.js`);
    assert.match(entry, /export async function mount\(app\)/);
    assert.match(entry, /await import\('\.\/index\.js'\)/);
    assert.doesNotMatch(entry, /from\s+['"]three/);
  }
});

test('stories share only the player and audio timeline machinery', async () => {
  const sharedAudio = await readSource('src/shared/story-audio.js');
  const sharedController = await readSource('src/shared/story-controller.js');
  assert.match(sharedAudio, /export class StoryAudioCore/);
  assert.match(sharedController, /export function createStoryController/);
  assert.match(sharedController, /prefetchLanguages/);
  assert.match(sharedController, /ensureLanguage/);

  for (const slug of ['smell-of-soup', 'yan-er-dao-ling', 'tiger-and-dried-persimmon', 'anansi-and-the-pot', 'si-kancil-dan-buaya']) {
    const [audio, controller] = await Promise.all([
      readSource(`src/stories/${slug}/audio.js`),
      readSource(`src/stories/${slug}/index.js`),
    ]);
    assert.match(audio, /extends StoryAudioCore/);
    assert.match(controller, /createStoryController\(/);
    assert.match(controller, /onState\(/, `${slug} must retain local semantic story cues`);
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
    'scripts/stories/tiger-and-dried-persimmon/generate-music.mjs',
    'scripts/stories/tiger-and-dried-persimmon/generate-sfx.mjs',
    'scripts/stories/anansi-and-the-pot/generate-music.mjs',
    'scripts/stories/anansi-and-the-pot/generate-sfx.mjs',
    'scripts/stories/si-kancil-dan-buaya/generate-music.mjs',
    'scripts/stories/si-kancil-dan-buaya/generate-sfx.mjs',
  ];
  for (const path of scripts) {
    const source = await readSource(path);
    assert.match(source, /process\.env\.ELEVENLABS_API_KEY/);
    assert.doesNotMatch(source, /sk_[a-zA-Z0-9_-]{16,}/, `${path} appears to contain a literal credential`);
  }

  const bellMusic = await readSource(scripts[1]);
  const bellSfx = await readSource(scripts[2]);
  const soupMusic = await readSource(scripts[0]);
  const tigerMusic = await readSource(scripts[3]);
  const tigerSfx = await readSource(scripts[4]);
  const anansiMusic = await readSource(scripts[5]);
  const anansiSfx = await readSource(scripts[6]);
  const kancilMusic = await readSource(scripts[7]);
  const kancilSfx = await readSource(scripts[8]);
  assert.ok(soupMusic.includes('public/audio/stories/smell-of-soup/music'));
  assert.ok(bellMusic.includes('public/audio/stories/yan-er-dao-ling/music'));
  assert.ok(bellSfx.includes('public/audio/stories/yan-er-dao-ling/sfx'));
  assert.ok(tigerMusic.includes('public/audio/stories/tiger-and-dried-persimmon/music'));
  assert.ok(tigerSfx.includes('public/audio/stories/tiger-and-dried-persimmon/sfx'));
  assert.ok(anansiMusic.includes('public/audio/stories/anansi-and-the-pot/music'));
  assert.ok(anansiSfx.includes('public/audio/stories/anansi-and-the-pot/sfx'));
  assert.ok(kancilMusic.includes('public/audio/stories/si-kancil-dan-buaya/music'));
  assert.ok(kancilSfx.includes('public/audio/stories/si-kancil-dan-buaya/sfx'));
});

test('the persimmon world uses explicit GPU instancing for its repeated visual grammar', async () => {
  const world = await readSource('src/stories/tiger-and-dried-persimmon/world.js');
  const instancedConstructions = world.match(/new THREE\.InstancedMesh\(/g) ?? [];
  assert.ok(instancedConstructions.length >= 5, 'persimmons, pines, roof tiles, and tiger stripes should remain instanced');
  assert.match(world, /DynamicDrawUsage/);
  assert.match(world, /instanceMatrix\.needsUpdate\s*=\s*true/);
  assert.match(world, /setMatrixAt\(/);
});

test('the Anansi world instances repeated wisdom and articulated spider anatomy', async () => {
  const world = await readSource('src/stories/anansi-and-the-pot/world.js');
  const instancedConstructions = world.match(/new THREE\.InstancedMesh\(/g) ?? [];
  assert.ok(instancedConstructions.length >= 8, 'wisdom, forest motifs, eyes, and repeated leg segments should remain instanced');
  assert.match(world, /wisdomRelease/);
  assert.match(world, /upperLegs/);
  assert.match(world, /lowerLegs/);
  assert.match(world, /syncSpiderLegs/);
  assert.match(world, /showChild\s*=\s*started\s*&&\s*index\s*>=\s*5/);
  assert.match(world, /group\.scale\.setScalar\(0\.64\)/);
  assert.match(world, /cameraPath\.getPoint\(/);
  assert.doesNotMatch(world, /cameraPath\.getPointAt\(/);
  assert.match(world, /DynamicDrawUsage/);
  assert.match(world, /instanceMatrix\.needsUpdate\s*=\s*true/);
  assert.match(world, /setMatrixAt\(/);
});

test('the Kancil world builds a dynamic instanced crocodile bridge and counted landing path', async () => {
  const world = await readSource('src/stories/si-kancil-dan-buaya/world.js');
  const instancedConstructions = world.match(/new THREE\.InstancedMesh\(/g) ?? [];
  assert.ok(instancedConstructions.length >= 13, 'crocodile anatomy, forest, river details, and count ripples should remain instanced');
  for (const batch of ['crocBodies', 'crocHeads', 'crocJaws', 'crocTails', 'crocEyes', 'crocScutes']) {
    assert.match(world, new RegExp(`this\\.${batch}`), `${batch} must remain a dedicated instanced batch`);
  }
  assert.match(world, /crossingPoints/);
  assert.match(world, /crossingPosition\(/);
  assert.match(world, /updateCountRipples\(/);
  assert.match(world, /endPosition/);
  assert.match(world, /DynamicDrawUsage/);
  assert.match(world, /instanceMatrix\.needsUpdate\s*=\s*true/);
  assert.match(world, /setMatrixAt\(/);
});

test('cold-agent documentation carries the production and validation contracts', async () => {
  const [agents, pipeline] = await Promise.all([readSource('AGENTS.md'), readSource('docs/STORY_PRODUCTION.md')]);
  for (const required of ['src/stories/<slug>/', 'src/shared/story-controller.js', 'src/shared/story-audio.js', 'public/audio/stories/<slug>/', 'npm run build', 'npm run test:e2e', 'npm run deploy:dry-run']) {
    assert.ok(agents.includes(required), `AGENTS.md is missing ${required}`);
  }
  for (const required of ['Gemini TTS', 'Music and sound design', 'Browser matrix', 'Release only on request']) {
    assert.ok(pipeline.includes(required), `production pipeline is missing ${required}`);
  }
  for (const required of ['English, Chinese, and Indonesian', 'No language may fall back silently']) {
    assert.ok(agents.includes(required), `AGENTS.md is missing ${required}`);
  }
  for (const required of ['idle-prefetch', 'not a runtime dependency', 'HTTP status 404']) {
    assert.ok(agents.includes(required), `AGENTS.md is missing ${required}`);
  }
});
