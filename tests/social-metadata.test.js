import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { SOCIAL_METADATA, metadataForPath } from '../worker/index.js';

const ROOT = process.cwd();
const EXPECTED_IMAGE = 'https://stories.asfar.family/social/wisdom-short-stories-og.png';

test('every public route has canonical social metadata on the production origin', () => {
  assert.deepEqual(Object.keys(SOCIAL_METADATA).sort(), [
    '/',
    '/stories/smell-of-soup',
    '/stories/yan-er-dao-ling',
  ]);

  for (const [route, configured] of Object.entries(SOCIAL_METADATA)) {
    const metadata = metadataForPath(`${route === '/' ? '' : route}/`);
    assert.match(metadata.title, /Wisdom Short Stories/);
    assert.ok(metadata.description.length >= 80, `${route} needs a substantial social description`);
    assert.equal(metadata.image, EXPECTED_IMAGE);
    assert.ok(metadata.canonical.startsWith('https://stories.asfar.family/'));
    assert.equal(metadata.type, configured.type);
    assert.equal(metadata.status, 200);
    assert.equal(metadata.robots, 'index, follow, max-image-preview:large');
  }
});

test('unknown HTML routes receive dedicated noindex metadata and a 404 status', () => {
  const metadata = metadataForPath('/stories/not-on-the-shelf/');
  assert.equal(metadata.status, 404);
  assert.equal(metadata.robots, 'noindex, follow');
  assert.equal(metadata.title, 'Story Not Found | Wisdom Short Stories');
  assert.equal(metadata.canonical, 'https://stories.asfar.family/stories/not-on-the-shelf/');
  assert.notEqual(metadata.description, SOCIAL_METADATA['/'].description);
});

test('the static document has complete Open Graph and Twitter fallbacks', async () => {
  const html = await readFile(join(ROOT, 'index.html'), 'utf8');
  for (const marker of [
    'rel="canonical"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'name="twitter:card" content="summary_large_image"',
    'name="twitter:image"',
    EXPECTED_IMAGE,
  ]) {
    assert.ok(html.includes(marker), `index.html must include ${marker}`);
  }
});

test('the generated sharing banner is a valid 1200 by 630 PNG', async () => {
  const image = await readFile(join(ROOT, 'public/social/wisdom-short-stories-og.png'));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test('Wrangler binds static assets, rewrites navigations, and owns the custom domain', async () => {
  const config = JSON.parse(await readFile(join(ROOT, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.main, 'worker/index.js');
  assert.equal(config.assets.binding, 'ASSETS');
  assert.deepEqual(config.assets.run_worker_first, ['/*', '!/assets/*', '!/audio/*', '!/social/*']);
  assert.deepEqual(config.routes, [{ pattern: 'stories.asfar.family', custom_domain: true }]);
});
