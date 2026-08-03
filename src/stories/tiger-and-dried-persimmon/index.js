import './interface.css';
import { createStoryController } from '../../shared/story-controller.js';
import { StoryAudio } from './audio.js';
import { AUDIO_TRACKS, MUSIC_CUES, SFX_CUES, STORY_LINES, UI_COPY } from './story.js';
import { StoryWorld } from './world.js';

const audio = new StoryAudio(STORY_LINES, AUDIO_TRACKS, MUSIC_CUES, SFX_CUES, 'id');
const world = new StoryWorld(document.querySelector('#canvas-stage'));
const firedEffects = new Set();

createStoryController({
  audio,
  world,
  lines: STORY_LINES,
  uiCopy: UI_COPY,
  initialVoice: 'id',
  initialSubtitle: 'zh',
  onReset({ elements }) {
    firedEffects.clear();
    audio.setFear(false);
    elements.experience.classList.remove('is-feared', 'is-running');
  },
  onState({ state, elements }) {
    const fear = state.started && state.index >= 5 && state.index <= 9 && !state.ended;
    audio.setFear(fear);
    elements.experience.classList.toggle('is-feared', fear);
    elements.experience.classList.toggle('is-running', state.started && state.index >= 9 && state.index <= 10 && !state.ended);
    if (state.paused || !state.speaking) return;
    if (state.index === 1 && state.localProgress >= 0.12 && !firedEffects.has('baby')) {
      firedEffects.add('baby');
      audio.playEffect('baby', { volume: 0.28 });
    }
    if (state.index === 4 && state.localProgress >= 0.08 && !firedEffects.has('persimmon')) {
      firedEffects.add('persimmon');
      audio.playEffect('persimmon', { volume: 0.45 });
    }
    if (state.index === 6 && state.localProgress >= 0.18 && !firedEffects.has('shed')) {
      firedEffects.add('shed');
      audio.playEffect('shed', { volume: 0.38 });
    }
    if (state.index === 9 && state.localProgress >= 0.2 && !firedEffects.has('run')) {
      firedEffects.add('run');
      audio.playEffect('run', { volume: 0.54, playbackRate: 1.02 });
    }
  },
});
