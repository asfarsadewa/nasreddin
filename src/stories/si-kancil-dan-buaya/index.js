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
  initialSubtitle: 'en',
  onReset({ elements }) {
    firedEffects.clear();
    audio.setThreat(false);
    elements.experience.classList.remove('is-threatened', 'is-bridged', 'is-crossing', 'is-escaped');
  },
  onState({ state, elements }) {
    const threatened = state.started && state.index >= 1 && state.index <= 5 && !state.ended;
    const bridged = state.started && state.index >= 7 && state.index <= 10 && !state.ended;
    const crossing = state.started && state.index >= 8 && state.index <= 10 && !state.ended;
    const escaped = state.started && state.index === 11 && !state.ended;
    audio.setThreat(threatened);
    elements.experience.classList.toggle('is-threatened', threatened);
    elements.experience.classList.toggle('is-bridged', bridged);
    elements.experience.classList.toggle('is-crossing', crossing);
    elements.experience.classList.toggle('is-escaped', escaped);
    if (state.paused || !state.speaking) return;
    if (state.index === 1 && state.localProgress >= 0.08 && !firedEffects.has('wake')) {
      firedEffects.add('wake');
      audio.playEffect('wake', { volume: 0.42 });
    }
    if (state.index === 7 && state.localProgress >= 0.08 && !firedEffects.has('formation')) {
      firedEffects.add('formation');
      audio.playEffect('formation', { volume: 0.42 });
    }
    if (state.index === 8 && state.localProgress >= 0.04 && !firedEffects.has('crossing')) {
      firedEffects.add('crossing');
      audio.playEffect('crossing', { volume: 0.5 });
    }
    if (state.index === 10 && state.localProgress >= 0.12 && !firedEffects.has('leap')) {
      firedEffects.add('leap');
      audio.playEffect('leap', { volume: 0.52 });
    }
  },
});
