import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COLLECTION_COPY,
  STORIES,
  findStory,
  normalizePath,
} from '../src/catalog.js';

const COLLECTION_LANGUAGES = ['en', 'zh', 'id'];
const LOCALIZED_STORY_FIELDS = ['title', 'description', 'tradition', 'duration', 'format'];

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must not be empty`);
}

test('collection copy is complete and structurally identical in EN, ZH, and ID', () => {
  assert.deepEqual(Object.keys(COLLECTION_COPY).sort(), [...COLLECTION_LANGUAGES].sort());
  const referenceKeys = Object.keys(COLLECTION_COPY.en).sort();

  for (const language of COLLECTION_LANGUAGES) {
    assert.deepEqual(Object.keys(COLLECTION_COPY[language]).sort(), referenceKeys, `${language} collection copy keys drifted`);
    for (const [key, value] of Object.entries(COLLECTION_COPY[language])) {
      assertNonEmptyString(value, `COLLECTION_COPY.${language}.${key}`);
    }
  }
});

test('catalog entries have unique canonical routes and complete trilingual metadata', () => {
  assert.ok(STORIES.length >= 2, 'the collection must contain at least two stories');
  assert.equal(new Set(STORIES.map((story) => story.slug)).size, STORIES.length, 'story slugs must be unique');
  assert.equal(new Set(STORIES.map((story) => story.path)).size, STORIES.length, 'story paths must be unique');
  assert.equal(new Set(STORIES.map((story) => story.sequence)).size, STORIES.length, 'story sequence numbers must be unique');

  for (const story of STORIES) {
    assert.match(story.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${story.slug} is not a canonical slug`);
    assert.equal(story.path, `/stories/${story.slug}`, `${story.slug} route does not match its slug`);
    assert.match(story.sequence, /^\d{2}$/, `${story.slug} sequence must contain two digits`);
    assert.equal(story.status, 'available');
    assert.equal(typeof story.load, 'function');
    assertNonEmptyString(story.languages, `${story.slug}.languages`);

    for (const field of LOCALIZED_STORY_FIELDS) {
      assert.deepEqual(Object.keys(story[field]).sort(), [...COLLECTION_LANGUAGES].sort(), `${story.slug}.${field} must be trilingual`);
      for (const language of COLLECTION_LANGUAGES) {
        assertNonEmptyString(story[field][language], `${story.slug}.${field}.${language}`);
      }
    }
  }
});

test('path normalization and route lookup are deterministic', () => {
  const cases = [
    ['/', '/'],
    ['////', '/'],
    ['/index.html', '/'],
    ['/stories/smell-of-soup/', '/stories/smell-of-soup'],
    ['/stories/yan-er-dao-ling////', '/stories/yan-er-dao-ling'],
  ];

  for (const [input, expected] of cases) assert.equal(normalizePath(input), expected);
  for (const story of STORIES) {
    assert.equal(findStory(story.path), story);
    assert.equal(findStory(`${story.path}/`), story);
  }
  assert.equal(findStory('/stories/not-on-the-shelf'), undefined);
});

test('every catalog loader resolves to the minimal mount contract', async () => {
  for (const story of STORIES) {
    const module = await story.load();
    assert.equal(typeof module.mount, 'function', `${story.slug} entry must export mount(app)`);
  }
});
