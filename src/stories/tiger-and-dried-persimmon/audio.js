import { StoryAudioCore } from '../../shared/story-audio.js';

export class StoryAudio extends StoryAudioCore {
  constructor(lines, trackDefinitions, musicDefinitions, sfxDefinitions, initialLanguage = 'id') {
    super({
      lines,
      trackDefinitions,
      musicDefinitions,
      sfxDefinitions,
      initialLanguage,
      timing: { lead: 1.15, gap: 0.52, tail: 3.4 },
      masterGain: 0.88,
    });
    this.fearActive = false;
    this.narrationDuckGain = 0.62;
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
    this.fearFilter = this.context.createBiquadFilter();
    this.fearFilter.type = 'lowpass';
    this.fearFilter.frequency.value = 18000;
    this.musicOutput.connect(this.musicDuck).connect(this.fearFilter).connect(this.master);

    this.sfxOutput = this.context.createGain();
    this.sfxOutput.gain.value = 0.44;
    this.sfxOutput.connect(this.master);
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 18) - 0.6);
    const underscoreStart = 18;
    const underscoreDuration = endingStart + 3.2 - underscoreStart;
    this.scheduleMusicCue('opening', offset, {
      start: 0,
      stop: 29,
      envelope: [[0, 0], [1.8, 0.36], [15, 0.32], [29, 0]],
    });
    this.scheduleMusicCue('ambience', offset, {
      start: underscoreStart,
      stop: endingStart + 3.2,
      loop: true,
      envelope: [[0, 0], [3.2, 0.42], [Math.max(4, underscoreDuration - 4.5), 0.44], [underscoreDuration, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 28;
    this.scheduleMusicCue('ending', offset, {
      start: endingStart,
      envelope: [[0, 0], [1.8, 0.28], [9, 0.31], [18, 0.38], [endingDuration, 0]],
    });
  }

  setNarrationActive(active) {
    if (!this.context || active === this.narrationActive) return;
    this.narrationActive = active;
    this.musicDuck.gain.setTargetAtTime(
      active ? this.narrationDuckGain : 1,
      this.context.currentTime,
      active ? 0.08 : 0.2,
    );
  }

  startAmbient() {
    const buffer = this.sfxBuffers.village;
    if (!buffer) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.11;
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

  setFear(active) {
    if (!this.context || active === this.fearActive) return;
    this.fearActive = active;
    const now = this.context.currentTime;
    this.fearFilter.frequency.setTargetAtTime(active ? 3400 : 18000, now, active ? 0.18 : 0.35);
  }
}
