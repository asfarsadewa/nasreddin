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
  initialSubtitle: 'id',
  onReset({ elements }) {
    firedEffects.clear();
    audio.setStraining(false);
    elements.experience.classList.remove('is-descending', 'is-caught', 'is-straining', 'is-snapped', 'is-saved');
  },
  onState({ state, elements }) {
    const descending = state.started && state.index >= 4 && state.index <= 5 && !state.ended;
    const caught = state.started && state.index >= 5 && state.index <= 6 && !state.ended;
    const straining = state.started && state.index >= 6 && state.index <= 8 && !state.ended;
    const snapped = state.started && state.index === 9 && !state.ended;
    const saved = state.started && state.index >= 10 && !state.ended;
    audio.setStraining(straining);
    elements.experience.classList.toggle('is-descending', descending);
    elements.experience.classList.toggle('is-caught', caught);
    elements.experience.classList.toggle('is-straining', straining);
    elements.experience.classList.toggle('is-snapped', snapped);
    elements.experience.classList.toggle('is-saved', saved);
    if (state.paused || !state.speaking) return;
    if (state.index === 4 && state.localProgress >= 0.05 && !firedEffects.has('descend')) {
      firedEffects.add('descend');
      audio.playEffect('descend', { volume: 0.42 });
    }
    if (state.index === 5 && state.localProgress >= 0.12 && !firedEffects.has('catch')) {
      firedEffects.add('catch');
      audio.playEffect('catch', { volume: 0.5 });
    }
    if (state.index === 7 && state.localProgress >= 0.06 && !firedEffects.has('strain')) {
      firedEffects.add('strain');
      audio.playEffect('strain', { volume: 0.5 });
    }
    if (state.index === 9 && state.localProgress >= 0.04 && !firedEffects.has('fall')) {
      firedEffects.add('fall');
      audio.playEffect('fall', { volume: 0.58 });
    }
  },
});
