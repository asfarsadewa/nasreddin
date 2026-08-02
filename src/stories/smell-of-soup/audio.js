import { StoryAudioCore } from '../../shared/story-audio.js';

export class StoryAudio extends StoryAudioCore {
  constructor(lines, trackDefinitions, musicDefinitions, initialLanguage = 'en') {
    super({
      lines,
      trackDefinitions,
      musicDefinitions,
      initialLanguage,
      timing: { lead: 1.1, gap: 0.48, tail: 2.8 },
      masterGain: 0.92,
    });
  }

  setupAudioGraph() {
    this.master = this.context.createGain();
    this.master.gain.value = this.masterGain;
    this.master.connect(this.context.destination);

    this.narration = this.context.createGain();
    this.narration.connect(this.master);

    this.musicOutput = this.context.createGain();
    this.musicDuck = this.context.createGain();
    this.musicOutput.connect(this.musicDuck).connect(this.master);
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 12) - 0.7);
    const ambienceStart = 17;
    const ambienceEnd = endingStart + 3.2;
    this.scheduleMusicCue('opening', offset, {
      start: 0,
      stop: 26,
      envelope: [[0, 0], [1.6, 0.23], [16, 0.23], [26, 0]],
    });
    this.scheduleMusicCue('ambience', offset, {
      start: ambienceStart,
      stop: ambienceEnd,
      loop: true,
      envelope: [[0, 0], [4, 0.1], [Math.max(5, endingStart - ambienceStart - 2), 0.1], [ambienceEnd - ambienceStart, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 28;
    this.scheduleMusicCue('ending', offset, {
      start: endingStart,
      envelope: [[0, 0], [1.4, 0.15], [8, 0.17], [18, 0.25], [Math.max(19, endingDuration - 1.5), 0.18], [endingDuration, 0]],
    });
  }

  playCoinClink(pitch = 1) {
    if (!this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    [0, 0.012].forEach((delay, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = index ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime((index ? 2460 : 1740) * pitch, now + delay);
      oscillator.frequency.exponentialRampToValueAtTime((index ? 1840 : 1160) * pitch, now + delay + 0.13);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(index ? 0.035 : 0.065, now + delay + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.24);
    });
  }

  startAmbient() {
    const duration = 3;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[index] = last;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 620;
    gain.gain.value = 0.025;
    source.connect(filter).connect(gain).connect(this.musicOutput);
    source.start();
    this.ambientSource = source;
  }
}
