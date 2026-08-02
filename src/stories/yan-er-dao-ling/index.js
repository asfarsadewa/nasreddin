import './interface.css';
import { createStoryController } from '../../shared/story-controller.js';
import { StoryAudio } from './audio.js';
import { AUDIO_TRACKS, MUSIC_CUES, SFX_CUES, STORY_LINES, UI_COPY } from './story.js';
import { StoryWorld } from './world.js';

const audio = new StoryAudio(STORY_LINES, AUDIO_TRACKS, MUSIC_CUES, SFX_CUES, 'zh');
const world = new StoryWorld(document.querySelector('#canvas-stage'));
const firedEffects = new Set();

createStoryController({
  audio,
  world,
  lines: STORY_LINES,
  uiCopy: UI_COPY,
  initialVoice: 'zh',
  initialSubtitle: 'en',
  onReset({ elements }) {
    firedEffects.clear();
    audio.setEarsCovered(false);
    elements.experience.classList.remove('is-muffled');
  },
  onState({ state, elements }) {
    const earsCovered = state.started && state.index >= 7 && state.index <= 9 && !state.ended;
    audio.setEarsCovered(earsCovered);
    elements.experience.classList.toggle('is-muffled', earsCovered);
    if (state.paused || !state.speaking) return;
    if (state.index === 4 && state.localProgress >= 0.66 && !firedEffects.has('bell-one')) {
      firedEffects.add('bell-one');
      audio.playEffect('bell', { volume: 0.74, playbackRate: 1 });
    }
    if (state.index === 9 && state.localProgress >= 0.52 && !firedEffects.has('bell-two')) {
      firedEffects.add('bell-two');
      audio.playEffect('bell', { volume: 0.9, playbackRate: 0.93 });
    }
    if (state.index === 10 && state.localProgress >= 0.04 && !firedEffects.has('approach')) {
      firedEffects.add('approach');
      audio.playEffect('approach', { volume: 0.52 });
    }
  },
});
