import assert from 'node:assert/strict';
import test from 'node:test';

import { StoryAudioCore } from '../src/shared/story-audio.js';

class TestStoryAudio extends StoryAudioCore {
  constructor() {
    super({
      lines: [{ file: '01.wav' }, { file: '02.wav' }],
      trackDefinitions: {
        en: { root: '/voice/en/' },
        zh: { root: '/voice/zh/' },
        id: { root: '/voice/id/' },
      },
      musicDefinitions: { opening: '/music/opening.mp3' },
      sfxDefinitions: { bell: '/sfx/bell.mp3' },
      initialLanguage: 'en',
      timing: { lead: 1, gap: 0.5, tail: 2 },
    });
  }

  setupAudioGraph() {}
}

class FakeAudioContext {
  currentTime = 0;
  state = 'running';

  async decodeAudioData() {
    return { duration: 2 };
  }
}

test('initial audio preparation fetches one voice and idle prefetch fills the rest without duplicates', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.window = {
    AudioContext: FakeAudioContext,
    requestIdleCallback(callback) { callback(); },
  };
  globalThis.fetch = async (url) => {
    requests.push(url);
    return { ok: true, async arrayBuffer() { return new ArrayBuffer(8); } };
  };

  try {
    const audio = new TestStoryAudio();
    const loadProgress = [];
    await audio.load((progress) => loadProgress.push(progress));

    assert.deepEqual(requests.sort(), [
      '/music/opening.mp3',
      '/sfx/bell.mp3',
      '/voice/en/01.wav',
      '/voice/en/02.wav',
    ]);
    assert.equal(audio.isLanguageReady('en'), true);
    assert.equal(audio.isLanguageReady('zh'), false);
    assert.equal(audio.isLanguageReady('id'), false);
    assert.equal(loadProgress.at(-1), 1);

    const beforeChinese = requests.length;
    await Promise.all([audio.ensureLanguage('zh'), audio.ensureLanguage('zh')]);
    assert.equal(requests.length - beforeChinese, 2, 'concurrent callers must share one language download');
    assert.equal(audio.isLanguageReady('zh'), true);

    const statuses = [];
    await audio.prefetchLanguages((language, status, progress) => statuses.push({ language, status, progress }));
    assert.equal(audio.isLanguageReady('id'), true);
    assert.equal(requests.filter((url) => url.startsWith('/voice/id/')).length, 2);
    assert.ok(statuses.some(({ language, status }) => language === 'id' && status === 'ready'));
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});
