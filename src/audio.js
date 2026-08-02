const GAP_SECONDS = 0.48;
const LEAD_SECONDS = 1.1;
const TAIL_SECONDS = 2.8;

export class StoryAudio {
  constructor(lines, trackDefinitions, initialLanguage = 'en') {
    this.lines = lines;
    this.trackDefinitions = trackDefinitions;
    this.language = initialLanguage;
    this.tracks = {};
    this.context = null;
    this.master = null;
    this.narration = null;
    this.sources = [];
    this.anchor = 0;
    this.started = false;
    this.paused = false;
    this.muted = false;
    this.ambientSource = null;
  }

  get activeTrack() {
    return this.tracks[this.language];
  }

  get totalDuration() {
    return this.activeTrack?.totalDuration ?? 0;
  }

  async load(onProgress = () => {}) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio is not supported in this browser.');

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.92;
    this.master.connect(this.context.destination);

    this.narration = this.context.createGain();
    this.narration.gain.value = 1;
    this.narration.connect(this.master);

    const definitions = Object.entries(this.trackDefinitions);
    const totalFiles = definitions.length * this.lines.length;
    let loaded = 0;

    await Promise.all(definitions.map(async ([language, definition]) => {
      const buffers = await Promise.all(this.lines.map(async (line) => {
        const response = await fetch(`${definition.root}${line.file}`);
        if (!response.ok) throw new Error(`Could not load ${language}/${line.file}`);
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        loaded += 1;
        onProgress(loaded / totalFiles);
        return buffer;
      }));
      this.tracks[language] = this.createTrack(buffers);
    }));

    return this.totalDuration;
  }

  createTrack(buffers) {
    let cursor = LEAD_SECONDS;
    const schedule = buffers.map((buffer, index) => {
      const entry = {
        ...this.lines[index],
        index,
        start: cursor,
        end: cursor + buffer.duration,
        duration: buffer.duration,
      };
      cursor = entry.end + GAP_SECONDS;
      return entry;
    });
    return {
      buffers,
      schedule,
      totalDuration: cursor - GAP_SECONDS + TAIL_SECONDS,
    };
  }

  async start(offset = 0) {
    await this.context.resume();
    this.stopSources();
    this.started = true;
    this.paused = false;
    this.anchor = this.context.currentTime - offset;
    this.scheduleFrom(offset);
    if (!this.ambientSource) this.startAtmosphere();
  }

  scheduleFrom(offset) {
    const now = this.context.currentTime;
    const track = this.activeTrack;
    track.schedule.forEach((entry, index) => {
      if (entry.end <= offset) return;
      const source = this.context.createBufferSource();
      source.buffer = track.buffers[index];
      source.connect(this.narration);
      const clipOffset = Math.max(0, offset - entry.start);
      const when = Math.max(now + 0.035, this.anchor + entry.start);
      source.start(when, clipOffset);
      this.sources.push(source);
    });
  }

  stopSources() {
    this.sources.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    this.sources = [];
  }

  async setLanguage(language) {
    if (language === this.language || !this.tracks[language]) return this.getState();
    const previousState = this.getState();
    const wasPaused = this.paused;
    this.language = language;

    if (this.started) {
      const matchingEntry = this.activeTrack.schedule[previousState.index];
      const matchedOffset = matchingEntry.start + previousState.localProgress * matchingEntry.duration;
      await this.start(Math.min(matchedOffset, this.totalDuration));
      if (wasPaused) {
        await this.context.suspend();
        this.paused = true;
      }
    }
    return this.getState();
  }

  async togglePause() {
    if (!this.started) return false;
    if (this.context.state === 'suspended') {
      await this.context.resume();
      this.paused = false;
    } else {
      await this.context.suspend();
      this.paused = true;
    }
    return this.paused;
  }

  setMuted(muted) {
    this.muted = muted;
    const target = muted ? 0 : 0.92;
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.035);
  }

  get elapsed() {
    if (!this.started) return 0;
    return Math.min(this.totalDuration, Math.max(0, this.context.currentTime - this.anchor));
  }

  getState() {
    const track = this.activeTrack;
    if (!track) {
      return {
        started: false,
        paused: false,
        ended: false,
        elapsed: 0,
        total: 0,
        overallProgress: 0,
        poseProgress: 0,
        index: 0,
        entry: null,
        speaking: false,
        localProgress: 0,
        language: this.language,
      };
    }

    const elapsed = this.elapsed;
    let index = 0;
    let speaking = false;

    for (let i = 0; i < track.schedule.length; i += 1) {
      const entry = track.schedule[i];
      if (elapsed >= entry.start) index = i;
      if (elapsed >= entry.start && elapsed <= entry.end) {
        speaking = true;
        index = i;
        break;
      }
      if (elapsed < entry.start) break;
    }

    const entry = track.schedule[index];
    const localProgress = entry
      ? Math.min(1, Math.max(0, (elapsed - entry.start) / entry.duration))
      : 0;
    const poseProgress = track.schedule.length > 1
      ? Math.min(1, (index + localProgress) / (track.schedule.length - 1))
      : 0;

    return {
      started: this.started,
      paused: this.paused,
      ended: this.started && elapsed >= this.totalDuration,
      elapsed,
      total: this.totalDuration,
      overallProgress: this.totalDuration ? elapsed / this.totalDuration : 0,
      poseProgress,
      index,
      entry,
      speaking,
      localProgress,
      language: this.language,
    };
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

  startAtmosphere() {
    const duration = 3;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 620;
    gain.gain.value = 0.065;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.ambientSource = source;
  }
}
