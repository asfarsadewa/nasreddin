import { StoryAudioCore } from '../../shared/story-audio.js';

export class StoryAudio extends StoryAudioCore {
  constructor(lines, trackDefinitions, musicDefinitions, sfxDefinitions, initialLanguage = 'zh') {
    super({
      lines,
      trackDefinitions,
      musicDefinitions,
      sfxDefinitions,
      initialLanguage,
      timing: { lead: 1.2, gap: 0.5, tail: 4.2 },
      masterGain: 0.76,
    });
    this.straining = false;
    this.narrationDuckGain = 0.66;
  }

  setupAudioGraph() {
    this.master = this.context.createGain();
    this.master.gain.value = this.masterGain;
    this.master.connect(this.context.destination);

    this.narration = this.context.createGain();
    this.narration.gain.value = 1;
    this.narration.connect(this.master);

    this.musicOutput = this.context.createGain();
    this.musicDuck = this.context.createGain();
    this.wellFilter = this.context.createBiquadFilter();
    this.wellFilter.type = 'lowpass';
    this.wellFilter.frequency.value = 18000;
    this.musicOutput.connect(this.musicDuck).connect(this.wellFilter).connect(this.master);

    this.sfxOutput = this.context.createGain();
    this.sfxOutput.gain.value = 0.64;
    this.sfxOutput.connect(this.master);
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 22) - 0.6);
    const underscoreStart = 15;
    const underscoreDuration = endingStart + 3.8 - underscoreStart;
    this.scheduleMusicCue('opening', offset, {
      start: 0, stop: 30,
      envelope: [[0, 0], [1.4, 0.38], [15, 0.34], [30, 0]],
    });
    this.scheduleMusicCue('ambience', offset, {
      start: underscoreStart, stop: endingStart + 3.8, loop: true,
      envelope: [[0, 0], [2.7, 0.31], [Math.max(4, underscoreDuration - 4.4), 0.34], [underscoreDuration, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 30;
    this.scheduleMusicCue('ending', offset, {
      start: endingStart,
      envelope: [[0, 0], [1.5, 0.36], [8, 0.39], [19, 0.44], [endingDuration, 0]],
    });
  }

  setNarrationActive(active) {
    if (!this.context || active === this.narrationActive) return;
    this.narrationActive = active;
    this.musicDuck.gain.setTargetAtTime(active ? this.narrationDuckGain : 1, this.context.currentTime, active ? 0.08 : 0.24);
  }

  startAmbient() {
    const buffer = this.sfxBuffers.courtyard;
    if (!buffer) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.13;
    source.connect(gain).connect(this.musicOutput);
    source.start();
    this.ambientSource = source;
  }

  playEffect(name, { volume = 1, playbackRate = 1 } = {}) {
    if (!this.context || this.context.state !== 'running' || !this.sfxBuffers[name]) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.sfxBuffers[name];
    source.playbackRate.value = playbackRate;
    gain.gain.value = volume;
    source.connect(gain).connect(this.sfxOutput);
    source.start();
    source.addEventListener('ended', () => { this.effectSources = this.effectSources.filter((entry) => entry !== source); });
    this.effectSources.push(source);
  }

  setStraining(active) {
    if (!this.context || active === this.straining) return;
    this.straining = active;
    this.wellFilter.frequency.setTargetAtTime(active ? 6100 : 18000, this.context.currentTime, active ? 0.2 : 0.55);
  }
}
