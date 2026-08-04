import { StoryAudioCore } from '../../shared/story-audio.js';

export class StoryAudio extends StoryAudioCore {
  constructor(lines, trackDefinitions, musicDefinitions, sfxDefinitions, initialLanguage = 'en') {
    super({
      lines,
      trackDefinitions,
      musicDefinitions,
      sfxDefinitions,
      initialLanguage,
      timing: { lead: 1.15, gap: 0.5, tail: 3.8 },
      masterGain: 0.76,
    });
    this.hoarding = false;
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
    this.wisdomFilter = this.context.createBiquadFilter();
    this.wisdomFilter.type = 'lowpass';
    this.wisdomFilter.frequency.value = 18000;
    this.musicOutput.connect(this.musicDuck).connect(this.wisdomFilter).connect(this.master);

    this.sfxOutput = this.context.createGain();
    this.sfxOutput.gain.value = 0.64;
    this.sfxOutput.connect(this.master);
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 20) - 0.7);
    const underscoreStart = 17;
    const underscoreDuration = endingStart + 3.4 - underscoreStart;
    this.scheduleMusicCue('opening', offset, {
      start: 0,
      stop: 29,
      envelope: [[0, 0], [1.7, 0.38], [15, 0.34], [29, 0]],
    });
    this.scheduleMusicCue('ambience', offset, {
      start: underscoreStart,
      stop: endingStart + 3.4,
      loop: true,
      envelope: [[0, 0], [3.1, 0.28], [Math.max(4, underscoreDuration - 4.2), 0.3], [underscoreDuration, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 30;
    this.scheduleMusicCue('ending', offset, {
      start: endingStart,
      envelope: [[0, 0], [1.9, 0.3], [9, 0.34], [19, 0.44], [endingDuration, 0]],
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
    const buffer = this.sfxBuffers.forest;
    if (!buffer) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.1;
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

  setHoarding(active) {
    if (!this.context || active === this.hoarding) return;
    this.hoarding = active;
    const now = this.context.currentTime;
    this.wisdomFilter.frequency.setTargetAtTime(active ? 5200 : 18000, now, active ? 0.22 : 0.42);
  }
}
