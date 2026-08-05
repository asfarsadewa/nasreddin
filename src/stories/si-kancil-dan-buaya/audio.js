import { StoryAudioCore } from '../../shared/story-audio.js';

export class StoryAudio extends StoryAudioCore {
  constructor(lines, trackDefinitions, musicDefinitions, sfxDefinitions, initialLanguage = 'id') {
    super({
      lines,
      trackDefinitions,
      musicDefinitions,
      sfxDefinitions,
      initialLanguage,
      timing: { lead: 1.2, gap: 0.5, tail: 4.0 },
      masterGain: 0.76,
    });
    this.threatened = false;
    this.narrationDuckGain = 0.64;
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
    this.currentFilter = this.context.createBiquadFilter();
    this.currentFilter.type = 'lowpass';
    this.currentFilter.frequency.value = 18000;
    this.musicOutput.connect(this.musicDuck).connect(this.currentFilter).connect(this.master);

    this.sfxOutput = this.context.createGain();
    this.sfxOutput.gain.value = 0.62;
    this.sfxOutput.connect(this.master);
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 22) - 0.5);
    const underscoreStart = 16;
    const underscoreDuration = endingStart + 3.6 - underscoreStart;
    this.scheduleMusicCue('opening', offset, {
      start: 0,
      stop: 30,
      envelope: [[0, 0], [1.5, 0.4], [16, 0.35], [30, 0]],
    });
    this.scheduleMusicCue('ambience', offset, {
      start: underscoreStart,
      stop: endingStart + 3.6,
      loop: true,
      envelope: [[0, 0], [2.8, 0.3], [Math.max(4, underscoreDuration - 4.2), 0.32], [underscoreDuration, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 30;
    this.scheduleMusicCue('ending', offset, {
      start: endingStart,
      envelope: [[0, 0], [1.6, 0.34], [8, 0.38], [19, 0.44], [endingDuration, 0]],
    });
  }

  setNarrationActive(active) {
    if (!this.context || active === this.narrationActive) return;
    this.narrationActive = active;
    this.musicDuck.gain.setTargetAtTime(
      active ? this.narrationDuckGain : 1,
      this.context.currentTime,
      active ? 0.08 : 0.22,
    );
  }

  startAmbient() {
    const buffer = this.sfxBuffers.river;
    if (!buffer) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.12;
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

  setThreat(active) {
    if (!this.context || active === this.threatened) return;
    this.threatened = active;
    this.currentFilter.frequency.setTargetAtTime(active ? 6800 : 18000, this.context.currentTime, active ? 0.18 : 0.5);
  }
}
