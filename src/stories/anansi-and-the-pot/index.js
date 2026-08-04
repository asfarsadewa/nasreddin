import './interface.css';
import { createStoryController } from '../../shared/story-controller.js';
import { StoryAudio } from './audio.js';
import { AUDIO_TRACKS, MUSIC_CUES, SFX_CUES, STORY_LINES, UI_COPY } from './story.js';
import { StoryWorld } from './world.js';

const audio = new StoryAudio(STORY_LINES, AUDIO_TRACKS, MUSIC_CUES, SFX_CUES, 'en');
const world = new StoryWorld(document.querySelector('#canvas-stage'));
const firedEffects = new Set();

createStoryController({
  audio,
  world,
  lines: STORY_LINES,
  uiCopy: UI_COPY,
  initialVoice: 'en',
  initialSubtitle: 'id',
  onReset({ elements }) {
    firedEffects.clear();
    audio.setHoarding(false);
    elements.experience.classList.remove('is-hoarding', 'is-climbing', 'is-scattered');
  },
  onState({ state, elements }) {
    const hoarding = state.started && state.index >= 2 && state.index <= 10 && !state.ended;
    const climbing = state.started && state.index >= 4 && state.index <= 9 && !state.ended;
    const scattered = state.started && state.index === 11 && !state.ended;
    audio.setHoarding(hoarding);
    elements.experience.classList.toggle('is-hoarding', hoarding);
    elements.experience.classList.toggle('is-climbing', climbing);
    elements.experience.classList.toggle('is-scattered', scattered);
    if (state.paused || !state.speaking) return;
    if (state.index === 1 && state.localProgress >= 0.08 && !firedEffects.has('gather')) {
      firedEffects.add('gather');
      audio.playEffect('gather', { volume: 0.38 });
    }
    if (state.index === 4 && state.localProgress >= 0.12 && !firedEffects.has('knock')) {
      firedEffects.add('knock');
      audio.playEffect('knock', { volume: 0.46 });
    }
    if (state.index === 9 && state.localProgress >= 0.08 && !firedEffects.has('climb')) {
      firedEffects.add('climb');
      audio.playEffect('climb', { volume: 0.38, playbackRate: 1.02 });
    }
    if (state.index === 11 && state.localProgress >= 0.16 && !firedEffects.has('scatter')) {
      firedEffects.add('scatter');
      audio.playEffect('scatter', { volume: 0.48 });
    }
  },
});
