const GAP_SECONDS = 0.5;
const LEAD_SECONDS = 1.2;
const TAIL_SECONDS = 3.2;

export class StoryAudio {
  constructor(lines, trackDefinitions, musicDefinitions, sfxDefinitions, initialLanguage = 'zh') {
    this.lines = lines;
    this.trackDefinitions = trackDefinitions;
    this.musicDefinitions = musicDefinitions;
    this.sfxDefinitions = sfxDefinitions;
    this.language = initialLanguage;
    this.tracks = {};
    this.musicBuffers = {};
    this.sfxBuffers = {};
    this.context = null;
    this.sources = [];
    this.musicSources = [];
    this.effectSources = [];
    this.ambientSource = null;
    this.anchor = 0;
    this.started = false;
    this.paused = false;
    this.muted = false;
    this.musicMuted = false;
    this.narrationActive = false;
    this.earsCovered = false;
  }

  get activeTrack() { return this.tracks[this.language]; }
  get totalDuration() { return this.activeTrack?.totalDuration ?? 0; }

  async load(onProgress = () => {}) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio is not supported in this browser.');

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.9;
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

    const voiceEntries = Object.entries(this.trackDefinitions);
    const musicEntries = Object.entries(this.musicDefinitions);
    const sfxEntries = Object.entries(this.sfxDefinitions);
    const totalFiles = voiceEntries.length * this.lines.length + musicEntries.length + sfxEntries.length;
    let loaded = 0;
    const fetched = async (url, label) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${label}`);
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      loaded += 1;
      onProgress(loaded / totalFiles);
      return buffer;
    };

    await Promise.all([
      ...voiceEntries.map(async ([language, definition]) => {
        const buffers = await Promise.all(this.lines.map((line) => fetched(`${definition.root}${line.file}`, `${language}/${line.file}`)));
        this.tracks[language] = this.createTrack(buffers);
      }),
      ...musicEntries.map(async ([name, url]) => { this.musicBuffers[name] = await fetched(url, `music cue ${name}`); }),
      ...sfxEntries.map(async ([name, url]) => { this.sfxBuffers[name] = await fetched(url, `sound effect ${name}`); }),
    ]);
    return this.totalDuration;
  }

  createTrack(buffers) {
    let cursor = LEAD_SECONDS;
    const schedule = buffers.map((buffer, index) => {
      const entry = { ...this.lines[index], index, start: cursor, end: cursor + buffer.duration, duration: buffer.duration };
      cursor = entry.end + GAP_SECONDS;
      return entry;
    });
    return { buffers, schedule, totalDuration: cursor - GAP_SECONDS + TAIL_SECONDS };
  }

  async start(offset = 0) {
    await this.context.resume();
    this.stopSources();
    this.started = true;
    this.paused = false;
    this.anchor = this.context.currentTime - offset;
    this.scheduleNarration(offset);
    this.scheduleMusic(offset);
    this.startCourtyard();
  }

  scheduleNarration(offset) {
    const now = this.context.currentTime;
    this.activeTrack.schedule.forEach((entry, index) => {
      if (entry.end <= offset) return;
      const source = this.context.createBufferSource();
      source.buffer = this.activeTrack.buffers[index];
      source.connect(this.narration);
      const clipOffset = Math.max(0, offset - entry.start);
      source.start(Math.max(now + 0.035, this.anchor + entry.start), clipOffset);
      this.sources.push(source);
    });
  }

  scheduleMusic(offset) {
    const endingStart = Math.max(0, (this.activeTrack.schedule[10]?.start ?? this.totalDuration - 20) - 0.8);
    const underscoreStart = 18;
    const underscoreEnd = endingStart + 3.5;
    this.scheduleMusicCue('opening', offset, { start: 0, stop: 26, envelope: [[0, 0], [1.7, 0.25], [15, 0.24], [26, 0]] });
    this.scheduleMusicCue('ambience', offset, {
      start: underscoreStart, stop: underscoreEnd, loop: true,
      envelope: [[0, 0], [3.5, 0.12], [Math.max(5, endingStart - underscoreStart - 2), 0.12], [underscoreEnd - underscoreStart, 0]],
    });
    const endingDuration = this.musicBuffers.ending?.duration ?? 28;
    this.scheduleMusicCue('ending', offset, { start: endingStart, envelope: [[0, 0], [1.6, 0.17], [10, 0.19], [20, 0.26], [endingDuration, 0]] });
  }

  scheduleMusicCue(name, offset, { start, stop, loop = false, envelope }) {
    const buffer = this.musicBuffers[name];
    if (!buffer || (stop && offset >= stop) || (!loop && offset >= start + buffer.duration)) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const cueOffset = Math.max(0, offset - start);
    const bufferOffset = loop ? cueOffset % buffer.duration : cueOffset;
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gain).connect(this.musicOutput);
    this.applyEnvelope(gain.gain, start, offset, envelope);
    source.start(Math.max(this.context.currentTime + 0.035, this.anchor + start), bufferOffset);
    if (stop && this.anchor + stop > this.context.currentTime) source.stop(this.anchor + stop);
    this.musicSources.push(source);
  }

  applyEnvelope(parameter, cueStart, offset, envelope) {
    const relativeNow = Math.max(0, offset - cueStart);
    let value = envelope[0][1];
    for (let i = 1; i < envelope.length; i += 1) {
      const [nextTime, nextValue] = envelope[i];
      const [previousTime, previousValue] = envelope[i - 1];
      if (relativeNow >= nextTime) { value = nextValue; continue; }
      if (relativeNow > previousTime) value = previousValue + (nextValue - previousValue) * ((relativeNow - previousTime) / (nextTime - previousTime));
      break;
    }
    parameter.setValueAtTime(value, this.context.currentTime);
    envelope.forEach(([time, target]) => {
      if (time > relativeNow) parameter.linearRampToValueAtTime(target, this.anchor + cueStart + time);
    });
  }

  stopSources() {
    [...this.sources, ...this.musicSources, ...this.effectSources, this.ambientSource].filter(Boolean).forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    this.sources = [];
    this.musicSources = [];
    this.effectSources = [];
    this.ambientSource = null;
  }

  startCourtyard() {
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

  async setLanguage(language) {
    if (language === this.language || !this.tracks[language]) return this.getState();
    const previous = this.getState();
    const wasPaused = this.paused;
    this.language = language;
    if (this.started) {
      const matching = this.activeTrack.schedule[previous.index];
      const matchedOffset = matching.start + previous.localProgress * matching.duration;
      await this.start(Math.min(matchedOffset, this.totalDuration));
      if (wasPaused) { await this.context.suspend(); this.paused = true; }
    }
    return this.getState();
  }

  async togglePause() {
    if (!this.started) return false;
    if (this.context.state === 'suspended') { await this.context.resume(); this.paused = false; }
    else { await this.context.suspend(); this.paused = true; }
    return this.paused;
  }

  setMuted(muted) {
    this.muted = muted;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.context.currentTime, 0.035);
  }

  setMusicMuted(muted) {
    this.musicMuted = muted;
    this.musicOutput.gain.setTargetAtTime(muted ? 0 : 1, this.context.currentTime, 0.045);
  }

  setNarrationActive(active) {
    if (!this.context || active === this.narrationActive) return;
    this.narrationActive = active;
    this.musicDuck.gain.setTargetAtTime(active ? 0.42 : 1, this.context.currentTime, active ? 0.08 : 0.28);
  }

  setEarsCovered(active) {
    if (!this.context || active === this.earsCovered) return;
    this.earsCovered = active;
    const now = this.context.currentTime;
    this.worldFilter.frequency.setTargetAtTime(active ? 720 : 18000, now, active ? 0.09 : 0.22);
    this.worldMuffle.gain.setTargetAtTime(active ? 0.38 : 1, now, active ? 0.08 : 0.24);
  }

  get elapsed() {
    if (!this.started) return 0;
    return Math.min(this.totalDuration, Math.max(0, this.context.currentTime - this.anchor));
  }

  getState() {
    const track = this.activeTrack;
    if (!track) return { started: false, paused: false, ended: false, elapsed: 0, total: 0, overallProgress: 0, poseProgress: 0, index: 0, entry: null, speaking: false, localProgress: 0, language: this.language };
    const elapsed = this.elapsed;
    let index = 0;
    let speaking = false;
    for (let i = 0; i < track.schedule.length; i += 1) {
      const entry = track.schedule[i];
      if (elapsed >= entry.start) index = i;
      if (elapsed >= entry.start && elapsed <= entry.end) { speaking = true; index = i; break; }
      if (elapsed < entry.start) break;
    }
    const entry = track.schedule[index];
    const localProgress = entry ? Math.min(1, Math.max(0, (elapsed - entry.start) / entry.duration)) : 0;
    return {
      started: this.started, paused: this.paused, ended: this.started && elapsed >= this.totalDuration,
      elapsed, total: this.totalDuration, overallProgress: this.totalDuration ? elapsed / this.totalDuration : 0,
      poseProgress: track.schedule.length > 1 ? Math.min(1, (index + localProgress) / (track.schedule.length - 1)) : 0,
      index, entry, speaking, localProgress, language: this.language,
    };
  }
}
