import './interface.css';
import { createStoryController } from '../../shared/story-controller.js';
import { StoryAudio } from './audio.js';
import { AUDIO_TRACKS, MUSIC_CUES, STORY_LINES, UI_COPY } from './story.js';
import { StoryWorld } from './world.js';

const audio = new StoryAudio(STORY_LINES, AUDIO_TRACKS, MUSIC_CUES, 'en');
const world = new StoryWorld(document.querySelector('#canvas-stage'));
const firedClinks = new Set();

createStoryController({
  audio,
  world,
  lines: STORY_LINES,
  uiCopy: UI_COPY,
  initialVoice: 'en',
  initialSubtitle: 'id',
  onReset() {
    firedClinks.clear();
  },
  onState({ state }) {
    if (state.index !== 8 || !state.speaking || state.paused) return;
    if (state.localProgress >= 0.69 && !firedClinks.has('first')) {
      firedClinks.add('first');
      audio.playCoinClink(1);
    }
    if (state.localProgress >= 0.84 && !firedClinks.has('second')) {
      firedClinks.add('second');
      audio.playCoinClink(1.08);
    }
  },
});
