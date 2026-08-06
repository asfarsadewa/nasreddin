import assert from 'node:assert/strict';
import test from 'node:test';

import { StoryAudio as SoupAudio } from '../src/stories/smell-of-soup/audio.js';
import {
  AUDIO_TRACKS as SOUP_AUDIO_TRACKS,
  CAMERA_POSES as SOUP_CAMERA_POSES,
  MUSIC_CUES as SOUP_MUSIC_CUES,
  STORY_LINES as SOUP_LINES,
  UI_COPY as SOUP_UI_COPY,
} from '../src/stories/smell-of-soup/story.js';
import { createStoryTemplate as createSoupTemplate } from '../src/stories/smell-of-soup/template.js';
import { StoryAudio as BellAudio } from '../src/stories/yan-er-dao-ling/audio.js';
import {
  AUDIO_TRACKS as BELL_AUDIO_TRACKS,
  CAMERA_POSES as BELL_CAMERA_POSES,
  MUSIC_CUES as BELL_MUSIC_CUES,
  SFX_CUES as BELL_SFX_CUES,
  STORY_LINES as BELL_LINES,
  UI_COPY as BELL_UI_COPY,
} from '../src/stories/yan-er-dao-ling/story.js';
import { createStoryTemplate as createBellTemplate } from '../src/stories/yan-er-dao-ling/template.js';
import { StoryAudio as TigerAudio } from '../src/stories/tiger-and-dried-persimmon/audio.js';
import {
  AUDIO_TRACKS as TIGER_AUDIO_TRACKS,
  CAMERA_POSES as TIGER_CAMERA_POSES,
  MUSIC_CUES as TIGER_MUSIC_CUES,
  SFX_CUES as TIGER_SFX_CUES,
  STORY_LINES as TIGER_LINES,
  UI_COPY as TIGER_UI_COPY,
} from '../src/stories/tiger-and-dried-persimmon/story.js';
import { createStoryTemplate as createTigerTemplate } from '../src/stories/tiger-and-dried-persimmon/template.js';
import { StoryAudio as AnansiAudio } from '../src/stories/anansi-and-the-pot/audio.js';
import {
  AUDIO_TRACKS as ANANSI_AUDIO_TRACKS,
  CAMERA_POSES as ANANSI_CAMERA_POSES,
  MUSIC_CUES as ANANSI_MUSIC_CUES,
  SFX_CUES as ANANSI_SFX_CUES,
  STORY_LINES as ANANSI_LINES,
  UI_COPY as ANANSI_UI_COPY,
} from '../src/stories/anansi-and-the-pot/story.js';
import { createStoryTemplate as createAnansiTemplate } from '../src/stories/anansi-and-the-pot/template.js';
import { StoryAudio as KancilAudio } from '../src/stories/si-kancil-dan-buaya/audio.js';
import {
  AUDIO_TRACKS as KANCIL_AUDIO_TRACKS,
  CAMERA_POSES as KANCIL_CAMERA_POSES,
  MUSIC_CUES as KANCIL_MUSIC_CUES,
  SFX_CUES as KANCIL_SFX_CUES,
  STORY_LINES as KANCIL_LINES,
  UI_COPY as KANCIL_UI_COPY,
} from '../src/stories/si-kancil-dan-buaya/story.js';
import { createStoryTemplate as createKancilTemplate } from '../src/stories/si-kancil-dan-buaya/template.js';
import { StoryAudio as MoonwellAudio } from '../src/stories/moon-in-the-well/audio.js';
import {
  AUDIO_TRACKS as MOONWELL_AUDIO_TRACKS,
  CAMERA_POSES as MOONWELL_CAMERA_POSES,
  MUSIC_CUES as MOONWELL_MUSIC_CUES,
  SFX_CUES as MOONWELL_SFX_CUES,
  STORY_LINES as MOONWELL_LINES,
  UI_COPY as MOONWELL_UI_COPY,
} from '../src/stories/moon-in-the-well/story.js';
import { createStoryTemplate as createMoonwellTemplate } from '../src/stories/moon-in-the-well/template.js';

const REQUIRED_TEMPLATE_IDS = [
  'experience', 'canvas-stage', 'opening', 'story-title', 'begin', 'load-status',
  'hud', 'caption-toggle', 'music-toggle', 'sound-toggle', 'play-toggle',
  'chapter', 'captions', 'caption-line', 'timeline', 'timeline-progress',
  'language-scrim', 'language-panel', 'language-close', 'ending', 'replay', 'live-status',
];

const STORIES = [
  {
    slug: 'smell-of-soup', lines: SOUP_LINES, tracks: SOUP_AUDIO_TRACKS,
    cameras: SOUP_CAMERA_POSES, ui: SOUP_UI_COPY, music: SOUP_MUSIC_CUES,
    languages: ['en', 'zh', 'id'], createTemplate: createSoupTemplate,
    createAudio: () => new SoupAudio(SOUP_LINES, SOUP_AUDIO_TRACKS, SOUP_MUSIC_CUES, 'en'),
    timing: { lead: 1.1, gap: 0.48, tail: 2.8 }, defaults: { voice: 'en', subtitle: 'id' },
  },
  {
    slug: 'yan-er-dao-ling', lines: BELL_LINES, tracks: BELL_AUDIO_TRACKS,
    cameras: BELL_CAMERA_POSES, ui: BELL_UI_COPY, music: BELL_MUSIC_CUES, sfx: BELL_SFX_CUES,
    languages: ['zh', 'en', 'id'], createTemplate: createBellTemplate,
    createAudio: () => new BellAudio(BELL_LINES, BELL_AUDIO_TRACKS, BELL_MUSIC_CUES, BELL_SFX_CUES, 'zh'),
    timing: { lead: 1.2, gap: 0.5, tail: 3.2 }, defaults: { voice: 'zh', subtitle: 'en' },
  },
  {
    slug: 'tiger-and-dried-persimmon', lines: TIGER_LINES, tracks: TIGER_AUDIO_TRACKS,
    cameras: TIGER_CAMERA_POSES, ui: TIGER_UI_COPY, music: TIGER_MUSIC_CUES, sfx: TIGER_SFX_CUES,
    languages: ['en', 'zh', 'id'], createTemplate: createTigerTemplate,
    createAudio: () => new TigerAudio(TIGER_LINES, TIGER_AUDIO_TRACKS, TIGER_MUSIC_CUES, TIGER_SFX_CUES, 'id'),
    timing: { lead: 1.15, gap: 0.52, tail: 3.4 }, defaults: { voice: 'id', subtitle: 'zh' },
  },
  {
    slug: 'anansi-and-the-pot', lines: ANANSI_LINES, tracks: ANANSI_AUDIO_TRACKS,
    cameras: ANANSI_CAMERA_POSES, ui: ANANSI_UI_COPY, music: ANANSI_MUSIC_CUES, sfx: ANANSI_SFX_CUES,
    languages: ['en', 'zh', 'id'], createTemplate: createAnansiTemplate,
    createAudio: () => new AnansiAudio(ANANSI_LINES, ANANSI_AUDIO_TRACKS, ANANSI_MUSIC_CUES, ANANSI_SFX_CUES, 'en'),
    timing: { lead: 1.15, gap: 0.5, tail: 3.8 }, defaults: { voice: 'en', subtitle: 'id' },
  },
  {
    slug: 'si-kancil-dan-buaya', lines: KANCIL_LINES, tracks: KANCIL_AUDIO_TRACKS,
    cameras: KANCIL_CAMERA_POSES, ui: KANCIL_UI_COPY, music: KANCIL_MUSIC_CUES, sfx: KANCIL_SFX_CUES,
    languages: ['en', 'zh', 'id'], createTemplate: createKancilTemplate,
    createAudio: () => new KancilAudio(KANCIL_LINES, KANCIL_AUDIO_TRACKS, KANCIL_MUSIC_CUES, KANCIL_SFX_CUES, 'id'),
    timing: { lead: 1.2, gap: 0.5, tail: 4.0 }, defaults: { voice: 'id', subtitle: 'en' },
  },
  {
    slug: 'moon-in-the-well', lines: MOONWELL_LINES, tracks: MOONWELL_AUDIO_TRACKS,
    cameras: MOONWELL_CAMERA_POSES, ui: MOONWELL_UI_COPY, music: MOONWELL_MUSIC_CUES, sfx: MOONWELL_SFX_CUES,
    languages: ['en', 'zh', 'id'], createTemplate: createMoonwellTemplate,
    createAudio: () => new MoonwellAudio(MOONWELL_LINES, MOONWELL_AUDIO_TRACKS, MOONWELL_MUSIC_CUES, MOONWELL_SFX_CUES, 'zh'),
    timing: { lead: 1.2, gap: 0.5, tail: 4.2 }, defaults: { voice: 'zh', subtitle: 'id' },
  },
];

function assertLocalizedString(map, languages, label) {
  assert.deepEqual(Object.keys(map).sort(), [...languages].sort(), `${label} languages drifted`);
  for (const language of languages) {
    assert.equal(typeof map[language], 'string', `${label}.${language} must be a string`);
    assert.ok(map[language].trim(), `${label}.${language} must not be empty`);
  }
}

function attributeForChoice(template, attribute, value) {
  const pattern = new RegExp(`<button[^>]*${attribute}="${value}"[^>]*>`, 'g');
  const matches = template.match(pattern) ?? [];
  assert.equal(matches.length, 1, `expected one ${attribute}=${value} choice`);
  return matches[0];
}

for (const story of STORIES) {
  test(`${story.slug} has a complete localized twelve-beat production contract`, () => {
    assert.equal(story.lines.length, 12);
    assert.deepEqual(Object.keys(story.tracks).sort(), [...story.languages].sort());
    assert.deepEqual(Object.keys(story.ui).sort(), [...story.languages].sort());
    assert.equal(story.cameras.length, story.lines.length, 'each beat needs one authored camera pose');
    assert.equal(new Set(story.lines.map((line) => line.file)).size, story.lines.length, 'voice filenames must be unique');

    story.lines.forEach((line, index) => {
      assert.match(line.file, new RegExp(`^${String(index + 1).padStart(2, '0')}_[a-z0-9_]+\\.wav$`));
      assertLocalizedString(line.speaker, story.languages, `${story.slug}.line[${index}].speaker`);
      assertLocalizedString(line.text, story.languages, `${story.slug}.line[${index}].text`);
      assert.match(line.chapter[0], /^[IVX]+$/);
      assertLocalizedString(line.chapter[1], story.languages, `${story.slug}.line[${index}].chapter`);

      const pose = story.cameras[index];
      assert.equal(pose.position.length, 3);
      assert.equal(pose.target.length, 3);
      assert.ok([...pose.position, ...pose.target, pose.fov].every(Number.isFinite));
      assert.ok(pose.fov >= 20 && pose.fov <= 60, `camera ${index + 1} has an implausible field of view`);
    });

    const uiKeys = Object.keys(story.ui[story.languages[0]]).sort();
    for (const language of story.languages) {
      assert.deepEqual(Object.keys(story.ui[language]).sort(), uiKeys, `${story.slug} ${language} UI keys drifted`);
      for (const [key, value] of Object.entries(story.ui[language])) {
        assert.equal(typeof value, 'string', `${story.slug}.ui.${language}.${key} must be a string`);
        assert.ok(value.trim(), `${story.slug}.ui.${language}.${key} must not be empty`);
      }
    }

    for (const [language, track] of Object.entries(story.tracks)) {
      assert.ok(track.root.startsWith('/audio/'), `${story.slug} ${language} audio root must be public-root relative`);
      assert.ok(track.root.endsWith('/'), `${story.slug} ${language} audio root needs a trailing slash`);
    }
    for (const url of Object.values(story.music)) assert.match(url, /^\/audio\/.+\.mp3$/);
    for (const url of Object.values(story.sfx ?? {})) assert.match(url, /^\/audio\/.+\.mp3$/);
  });

  test(`${story.slug} template keeps required IDs unique and defaults explicit`, () => {
    const template = story.createTemplate();
    for (const id of REQUIRED_TEMPLATE_IDS) {
      const matches = template.match(new RegExp(`id="${id}"`, 'g')) ?? [];
      assert.equal(matches.length, 1, `${story.slug} must contain exactly one #${id}`);
    }

    for (const language of story.languages) {
      const voiceChoice = attributeForChoice(template, 'data-voice', language);
      const subtitleChoice = attributeForChoice(template, 'data-subtitle', language);
      assert.equal(voiceChoice.includes('aria-checked="true"'), language === story.defaults.voice, `${story.slug} default voice drifted`);
      assert.equal(subtitleChoice.includes('aria-checked="true"'), language === story.defaults.subtitle, `${story.slug} default subtitle drifted`);
    }
    assert.match(template, /data-subtitle="off"/);
    assert.match(template, /role="dialog"/);
    assert.match(template, /aria-live="polite"/);
  });

  test(`${story.slug} timeline math is monotonic and independent of wall-clock timing`, () => {
    const durations = story.lines.map((_, index) => 0.75 + index * 0.125);
    const audio = story.createAudio();
    const track = audio.createTrack(durations.map((duration) => ({ duration })));

    assert.equal(track.schedule[0].start, story.timing.lead);
    track.schedule.forEach((entry, index) => {
      assert.equal(entry.duration, durations[index]);
      assert.equal(entry.end, entry.start + durations[index]);
      if (index > 0) assert.equal(entry.start, track.schedule[index - 1].end + story.timing.gap);
    });
    assert.equal(track.totalDuration, track.schedule.at(-1).end + story.timing.tail);

    audio.tracks[story.defaults.voice] = track;
    audio.language = story.defaults.voice;
    audio.context = { currentTime: track.schedule[3].start + durations[3] / 2 };
    audio.anchor = 0;
    audio.started = true;
    const speaking = audio.getState();
    assert.equal(speaking.index, 3);
    assert.equal(speaking.speaking, true);
    assert.equal(speaking.localProgress, 0.5);

    audio.context.currentTime = track.schedule[3].end + story.timing.gap / 2;
    const gap = audio.getState();
    assert.equal(gap.index, 3);
    assert.equal(gap.speaking, false);

    audio.context.currentTime = track.totalDuration + 20;
    const ending = audio.getState();
    assert.equal(ending.elapsed, track.totalDuration);
    assert.equal(ending.ended, true);
    assert.equal(ending.overallProgress, 1);
  });
}
