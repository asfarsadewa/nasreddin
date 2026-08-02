import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AUDIO_TRACKS as SOUP_TRACKS,
  MUSIC_CUES as SOUP_MUSIC,
  STORY_LINES as SOUP_LINES,
} from '../src/stories/smell-of-soup/story.js';
import {
  AUDIO_TRACKS as BELL_TRACKS,
  MUSIC_CUES as BELL_MUSIC,
  SFX_CUES as BELL_SFX,
  STORY_LINES as BELL_LINES,
} from '../src/stories/yan-er-dao-ling/story.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fromPublicUrl = (url) => join(ROOT, 'public', ...url.replace(/^\//, '').split('/'));

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function inspectPcmWav(buffer, label) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${label} is missing RIFF`);
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WAVE', `${label} is missing WAVE`);
  let offset = 12;
  let format = null;
  let dataBytes = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.subarray(offset, offset + 4).toString('ascii');
    const size = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (id === 'fmt ' && size >= 16) {
      format = {
        encoding: buffer.readUInt16LE(dataOffset),
        channels: buffer.readUInt16LE(dataOffset + 2),
        sampleRate: buffer.readUInt32LE(dataOffset + 4),
        bitsPerSample: buffer.readUInt16LE(dataOffset + 14),
      };
    }
    if (id === 'data') dataBytes = size;
    offset = dataOffset + size + (size % 2);
  }

  assert.ok(format, `${label} has no fmt chunk`);
  assert.equal(format.encoding, 1, `${label} must be uncompressed PCM`);
  assert.equal(format.channels, 1, `${label} must be mono`);
  assert.equal(format.sampleRate, 24000, `${label} must use the Gemini 24kHz output contract`);
  assert.equal(format.bitsPerSample, 16, `${label} must be 16-bit`);
  assert.ok(dataBytes > 10000, `${label} has implausibly little audio data`);
  const duration = dataBytes / (format.sampleRate * format.channels * (format.bitsPerSample / 8));
  assert.ok(duration > 0.2 && duration < 30, `${label} duration ${duration} is implausible`);
  return duration;
}

function assertMp3(buffer, label) {
  const hasId3 = buffer.subarray(0, 3).toString('ascii') === 'ID3';
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  assert.ok(hasId3 || hasFrameSync, `${label} does not begin with an MP3 header`);
  assert.ok(buffer.length > 50000, `${label} is implausibly small`);
}

const VOICE_PRODUCTIONS = [
  {
    slug: 'smell-of-soup', lines: SOUP_LINES, tracks: SOUP_TRACKS,
    manifests: {
      en: join(ROOT, 'public/audio/story/manifest.json'),
      id: join(ROOT, 'public/audio/story/id/manifest.json'),
    },
  },
  {
    slug: 'yan-er-dao-ling', lines: BELL_LINES, tracks: BELL_TRACKS,
    manifests: Object.fromEntries(['zh', 'en', 'id'].map((language) => [
      language,
      join(ROOT, `public/audio/stories/yan-er-dao-ling/voice/${language}/manifest.json`),
    ])),
  },
];

for (const production of VOICE_PRODUCTIONS) {
  test(`${production.slug} manifests exactly match subtitles and rendered PCM assets`, async () => {
    for (const [language, track] of Object.entries(production.tracks)) {
      const manifest = await readJson(production.manifests[language]);
      assert.equal(manifest.mode, 'per_line');
      assert.equal(manifest.lines.length, production.lines.length);
      assert.equal(new Set(manifest.lines.map((line) => line.file)).size, production.lines.length);

      const voiceDirectory = fromPublicUrl(track.root);
      const renderedFiles = (await readdir(voiceDirectory)).filter((file) => file.endsWith('.wav')).sort();
      assert.deepEqual(renderedFiles, production.lines.map((line) => line.file).sort(), `${production.slug} ${language} has missing or orphaned voice files`);

      for (let index = 0; index < production.lines.length; index += 1) {
        const line = production.lines[index];
        const manifestLine = manifest.lines[index];
        assert.equal(manifestLine.file, line.file);
        assert.equal(manifestLine.speaker, line.speaker[language]);
        assert.equal(manifestLine.text, line.text[language]);
        assert.ok(manifestLine.direction.trim(), `${production.slug} ${language} line ${index + 1} needs acting direction`);

        const audioPath = join(voiceDirectory, line.file);
        const info = await stat(audioPath);
        assert.ok(info.size > 10000, `${audioPath} is implausibly small`);
        inspectPcmWav(await readFile(audioPath), `${production.slug}/${language}/${line.file}`);
      }
    }
  });
}

test('all referenced score and effect cues are valid, non-trivial MP3 files', async () => {
  const cues = {
    ...Object.fromEntries(Object.entries(SOUP_MUSIC).map(([name, url]) => [`soup:${name}`, url])),
    ...Object.fromEntries(Object.entries(BELL_MUSIC).map(([name, url]) => [`bell:music:${name}`, url])),
    ...Object.fromEntries(Object.entries(BELL_SFX).map(([name, url]) => [`bell:sfx:${name}`, url])),
  };
  assert.equal(new Set(Object.values(cues)).size, Object.values(cues).length, 'each score/effect cue should have its own public asset');
  for (const [name, url] of Object.entries(cues)) assertMp3(await readFile(fromPublicUrl(url)), name);
});

test('audio provenance manifests cover every generated score and effect cue', async () => {
  const soupManifest = await readJson(join(ROOT, 'public/audio/music/manifest.json'));
  assert.equal(soupManifest.provider, 'ElevenLabs Music');
  assert.equal(soupManifest.model, 'music_v2');
  assert.deepEqual(soupManifest.cues.map((cue) => cue.file).sort(), Object.values(SOUP_MUSIC).map((url) => url.split('/').at(-1)).sort());

  const bellManifest = await readJson(join(ROOT, 'public/audio/stories/yan-er-dao-ling/audio-manifest.json'));
  assert.equal(bellManifest.voice.linesPerLanguage, BELL_LINES.length);
  assert.deepEqual(bellManifest.voice.languages.sort(), ['en-US', 'id-ID', 'zh-CN']);
  assert.deepEqual(
    bellManifest.music.cues.map((cue) => `/audio/stories/yan-er-dao-ling/${cue.file}`).sort(),
    Object.values(BELL_MUSIC).sort(),
  );
  assert.deepEqual(
    bellManifest.soundEffects.cues.map((cue) => `/audio/stories/yan-er-dao-ling/${cue.file}`).sort(),
    Object.values(BELL_SFX).sort(),
  );
});
