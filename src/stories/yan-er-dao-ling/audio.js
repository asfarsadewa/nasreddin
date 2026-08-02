import { StoryAudioCore } from '../../shared/story-audio.js';

export class StoryAudio extends StoryAudioCore {
  constructor(lines, trackDefinitions, musicDefinitions, sfxDefinitions, initialLanguage = 'zh') {
    super({
      lines,
      trackDefinitions,
      musicDefinitions,
      sfxDefinitions,
      initialLanguage,
      timing: { lead: 1.2, gap: 0.5, tail: 3.2 },
      masterGain: 0.9,
    });
    this.earsCovered = false;
  }

  setupAudioGraph() {
    this.master = this.context.createGain();
    this.master.gain.value = this.masterGain;
    this.master.connect(this.context.destination);

    this.narration = this.context.createGain();
    this.narration.connect(this.master);

    this.worldInput = this.context.createGain();
    this.worldFilter = this.context.createBiquadFilter();
    this.worldFilter.type = 'lowpass';
    this.worldFilter.frequency.value = 18000;
    this.worldMuffle = this.context.createGain();
    this.worldMuffle.gain.value = 1;
    this.worldInput.connect(this.worldFilter).connect(this.worldMuffle).connect(this.master);

    this.musicOutput = this.context.createGain();
    this.musicDuck = this.context.createGain();
    this.musicOutput.connect(this.musicDuck).connect(this.worldInput);

    this.sfxOutput = this.context.createGain();
    this.sfxOutput.connect(this.worldInput);
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 20) - 0.8);
    const underscoreStart = 18;
    const underscoreEnd = endingStart + 3.5;
    this.scheduleMusicCue('opening', offset, {
      start: 0,
      stop: 26,
      envelope: [[0, 0], [1.7, 0.25], [15, 0.24], [26, 0]],
    });
    this.scheduleMusicCue('ambience', offset, {
      start: underscoreStart,
      stop: underscoreEnd,
      loop: true,
      envelope: [[0, 0], [3.5, 0.12], [Math.max(5, endingStart - underscoreStart - 2), 0.12], [underscoreEnd - underscoreStart, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 28;
    this.scheduleMusicCue('ending', offset, {
      start: endingStart,
      envelope: [[0, 0], [1.6, 0.17], [10, 0.19], [20, 0.26], [endingDuration, 0]],
    });
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
    source.addEventListener('ended', () => {
      this.effectSources = this.effectSources.filter((entry) => entry !== source);
    });
    this.effectSources.push(source);
  }

  setEarsCovered(active) {
    if (!this.context || active === this.earsCovered) return;
    this.earsCovered = active;
    const now = this.context.currentTime;
    this.worldFilter.frequency.setTargetAtTime(active ? 720 : 18000, now, active ? 0.09 : 0.22);
    this.worldMuffle.gain.setTargetAtTime(active ? 0.38 : 1, now, active ? 0.08 : 0.24);
  }
}
