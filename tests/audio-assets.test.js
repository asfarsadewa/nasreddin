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
import {
  AUDIO_TRACKS as TIGER_TRACKS,
  MUSIC_CUES as TIGER_MUSIC,
  SFX_CUES as TIGER_SFX,
  STORY_LINES as TIGER_LINES,
} from '../src/stories/tiger-and-dried-persimmon/story.js';
import {
  AUDIO_TRACKS as ANANSI_TRACKS,
  MUSIC_CUES as ANANSI_MUSIC,
  SFX_CUES as ANANSI_SFX,
  STORY_LINES as ANANSI_LINES,
} from '../src/stories/anansi-and-the-pot/story.js';
import { StoryAudio as TigerStoryAudio } from '../src/stories/tiger-and-dried-persimmon/audio.js';
import { StoryAudio as AnansiStoryAudio } from '../src/stories/anansi-and-the-pot/audio.js';
import {
  AUDIO_TRACKS as KANCIL_TRACKS,
  MUSIC_CUES as KANCIL_MUSIC,
  SFX_CUES as KANCIL_SFX,
  STORY_LINES as KANCIL_LINES,
} from '../src/stories/si-kancil-dan-buaya/story.js';
import { StoryAudio as KancilStoryAudio } from '../src/stories/si-kancil-dan-buaya/audio.js';

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

function inspectMusicPlan(audio, language) {
  audio.tracks[language] = {
    schedule: Array.from({ length: 12 }, (_, index) => ({ start: index * 10 })),
    totalDuration: 124,
  };
  audio.musicBuffers.ending = { duration: 30 };
  const cues = [];
  audio.scheduleMusicCue = (name, offset, options) => cues.push({ name, offset, ...options });
  audio.scheduleMusic(0);
  return Object.fromEntries(cues.map((cue) => [cue.name, cue]));
}

const VOICE_PRODUCTIONS = [
  {
    slug: 'smell-of-soup', lines: SOUP_LINES, tracks: SOUP_TRACKS,
    manifests: Object.fromEntries(['en', 'zh', 'id'].map((language) => [
      language,
      join(ROOT, `public/audio/stories/smell-of-soup/voice/${language}/manifest.json`),
    ])),
  },
  {
    slug: 'yan-er-dao-ling', lines: BELL_LINES, tracks: BELL_TRACKS,
    manifests: Object.fromEntries(['zh', 'en', 'id'].map((language) => [
      language,
      join(ROOT, `public/audio/stories/yan-er-dao-ling/voice/${language}/manifest.json`),
    ])),
  },
  {
    slug: 'tiger-and-dried-persimmon', lines: TIGER_LINES, tracks: TIGER_TRACKS,
    manifests: Object.fromEntries(['en', 'zh', 'id'].map((language) => [
      language,
      join(ROOT, `public/audio/stories/tiger-and-dried-persimmon/voice/${language}/manifest.json`),
    ])),
  },
  {
    slug: 'anansi-and-the-pot', lines: ANANSI_LINES, tracks: ANANSI_TRACKS,
    manifests: Object.fromEntries(['en', 'zh', 'id'].map((language) => [
      language,
      join(ROOT, `public/audio/stories/anansi-and-the-pot/voice/${language}/manifest.json`),
    ])),
  },
  {
    slug: 'si-kancil-dan-buaya', lines: KANCIL_LINES, tracks: KANCIL_TRACKS,
    manifests: Object.fromEntries(['en', 'zh', 'id'].map((language) => [
      language,
      join(ROOT, `public/audio/stories/si-kancil-dan-buaya/voice/${language}/manifest.json`),
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
    ...Object.fromEntries(Object.entries(TIGER_MUSIC).map(([name, url]) => [`tiger:music:${name}`, url])),
    ...Object.fromEntries(Object.entries(TIGER_SFX).map(([name, url]) => [`tiger:sfx:${name}`, url])),
    ...Object.fromEntries(Object.entries(ANANSI_MUSIC).map(([name, url]) => [`anansi:music:${name}`, url])),
    ...Object.fromEntries(Object.entries(ANANSI_SFX).map(([name, url]) => [`anansi:sfx:${name}`, url])),
    ...Object.fromEntries(Object.entries(KANCIL_MUSIC).map(([name, url]) => [`kancil:music:${name}`, url])),
    ...Object.fromEntries(Object.entries(KANCIL_SFX).map(([name, url]) => [`kancil:sfx:${name}`, url])),
  };
  assert.equal(new Set(Object.values(cues)).size, Object.values(cues).length, 'each score/effect cue should have its own public asset');
  for (const [name, url] of Object.entries(cues)) assertMp3(await readFile(fromPublicUrl(url)), name);
});

test('story 03, 04, and 05 mix plans keep opening, middle, and ending score audible under narration', () => {
  const productions = [
    {
      slug: 'tiger-and-dried-persimmon',
      audio: new TigerStoryAudio(TIGER_LINES, TIGER_TRACKS, TIGER_MUSIC, TIGER_SFX, 'id'),
      language: 'id',
    },
    {
      slug: 'anansi-and-the-pot',
      audio: new AnansiStoryAudio(ANANSI_LINES, ANANSI_TRACKS, ANANSI_MUSIC, ANANSI_SFX, 'en'),
      language: 'en',
    },
    {
      slug: 'si-kancil-dan-buaya',
      audio: new KancilStoryAudio(KANCIL_LINES, KANCIL_TRACKS, KANCIL_MUSIC, KANCIL_SFX, 'id'),
      language: 'id',
    },
  ];

  for (const production of productions) {
    const plan = inspectMusicPlan(production.audio, production.language);
    assert.deepEqual(Object.keys(plan).sort(), ['ambience', 'ending', 'opening']);
    assert.ok(production.audio.narrationDuckGain >= 0.6, `${production.slug} over-ducks its score`);
    assert.ok(Math.max(...plan.opening.envelope.map((point) => point[1])) >= 0.3, `${production.slug} opening score is too low`);
    assert.ok(Math.max(...plan.ambience.envelope.map((point) => point[1])) >= 0.28, `${production.slug} middle score is too low`);
    assert.ok(Math.max(...plan.ending.envelope.map((point) => point[1])) >= 0.3, `${production.slug} ending score is too low`);
    assert.ok(plan.ambience.loop, `${production.slug} middle score must sustain across the narrative`);
  }
});

test('audio provenance manifests cover every generated score and effect cue', async () => {
  const soupManifest = await readJson(join(ROOT, 'public/audio/stories/smell-of-soup/audio-manifest.json'));
  assert.equal(soupManifest.voice.linesPerLanguage, SOUP_LINES.length);
  assert.deepEqual(soupManifest.voice.languages.sort(), ['en-US', 'id-ID', 'zh-CN']);
  assert.equal(soupManifest.music.provider, 'ElevenLabs Music');
  assert.equal(soupManifest.music.model, 'music_v2');
  assert.deepEqual(
    soupManifest.music.cues.map((cue) => `/audio/stories/smell-of-soup/${cue.file}`).sort(),
    Object.values(SOUP_MUSIC).sort(),
  );

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

  const tigerManifest = await readJson(join(ROOT, 'public/audio/stories/tiger-and-dried-persimmon/audio-manifest.json'));
  assert.equal(tigerManifest.voice.linesPerLanguage, TIGER_LINES.length);
  assert.deepEqual(tigerManifest.voice.languages.sort(), ['en-US', 'id-ID', 'zh-CN']);
  assert.deepEqual(
    tigerManifest.music.cues.map((cue) => `/audio/stories/tiger-and-dried-persimmon/${cue.file}`).sort(),
    Object.values(TIGER_MUSIC).sort(),
  );
  assert.deepEqual(
    tigerManifest.soundEffects.cues.map((cue) => `/audio/stories/tiger-and-dried-persimmon/${cue.file}`).sort(),
    Object.values(TIGER_SFX).sort(),
  );

  const anansiManifest = await readJson(join(ROOT, 'public/audio/stories/anansi-and-the-pot/audio-manifest.json'));
  assert.equal(anansiManifest.voice.linesPerLanguage, ANANSI_LINES.length);
  assert.deepEqual(anansiManifest.voice.languages.sort(), ['en-US', 'id-ID', 'zh-CN']);
  assert.deepEqual(
    anansiManifest.music.cues.map((cue) => `/audio/stories/anansi-and-the-pot/${cue.file}`).sort(),
    Object.values(ANANSI_MUSIC).sort(),
  );
  assert.deepEqual(
    anansiManifest.soundEffects.cues.map((cue) => `/audio/stories/anansi-and-the-pot/${cue.file}`).sort(),
    Object.values(ANANSI_SFX).sort(),
  );

  const kancilManifest = await readJson(join(ROOT, 'public/audio/stories/si-kancil-dan-buaya/audio-manifest.json'));
  assert.equal(kancilManifest.voice.linesPerLanguage, KANCIL_LINES.length);
  assert.deepEqual(kancilManifest.voice.languages.sort(), ['en-US', 'id-ID', 'zh-CN']);
  assert.deepEqual(
    kancilManifest.music.cues.map((cue) => `/audio/stories/si-kancil-dan-buaya/${cue.file}`).sort(),
    Object.values(KANCIL_MUSIC).sort(),
  );
  assert.deepEqual(
    kancilManifest.soundEffects.cues.map((cue) => `/audio/stories/si-kancil-dan-buaya/${cue.file}`).sort(),
    Object.values(KANCIL_SFX).sort(),
  );
});
