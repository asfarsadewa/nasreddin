function waitForIdle() {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(resolve, { timeout: 1500 });
      return;
    }
    window.setTimeout(resolve, 250);
  });
}

export class StoryAudioCore {
  constructor({
    lines,
    trackDefinitions,
    musicDefinitions = {},
    sfxDefinitions = {},
    initialLanguage,
    timing,
    masterGain = 0.92,
  }) {
    this.lines = lines;
    this.trackDefinitions = trackDefinitions;
    this.musicDefinitions = musicDefinitions;
    this.sfxDefinitions = sfxDefinitions;
    this.language = initialLanguage;
    this.timing = timing;
    this.masterGain = masterGain;
    this.tracks = {};
    this.musicBuffers = {};
    this.sfxBuffers = {};
    this.languageLoads = {};
    this.languageProgress = {};
    this.languageProgressListeners = {};
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
    this.prefetchStarted = false;
  }

  get activeTrack() {
    return this.tracks[this.language];
  }

  get totalDuration() {
    return this.activeTrack?.totalDuration ?? 0;
  }

  isLanguageReady(language) {
    return Boolean(this.tracks[language]);
  }

  isLanguageLoading(language) {
    return Boolean(this.languageLoads[language]);
  }

  initializeContext() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio is not supported in this browser.');
    this.context = new AudioContext();
    this.setupAudioGraph();
  }

  setupAudioGraph() {
    throw new Error('A story audio class must implement setupAudioGraph().');
  }

  async fetchBuffer(url, label) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${label}`);
    return this.context.decodeAudioData(await response.arrayBuffer());
  }

  notifyLanguageProgress(language, progress) {
    this.languageProgress[language] = progress;
    this.languageProgressListeners[language]?.forEach((listener) => listener(progress));
  }

  ensureLanguage(language, onProgress = () => {}) {
    if (!this.trackDefinitions[language]) {
      return Promise.reject(new Error(`Unknown voice language: ${language}`));
    }

    this.initializeContext();
    this.languageProgressListeners[language] ??= new Set();
    this.languageProgressListeners[language].add(onProgress);

    if (this.tracks[language]) {
      onProgress(1);
      this.languageProgressListeners[language].delete(onProgress);
      return Promise.resolve(this.tracks[language]);
    }

    onProgress(this.languageProgress[language] ?? 0);
    if (!this.languageLoads[language]) {
      let completed = 0;
      const definition = this.trackDefinitions[language];
      this.languageLoads[language] = Promise.all(this.lines.map(async (line) => {
        const buffer = await this.fetchBuffer(`${definition.root}${line.file}`, `${language}/${line.file}`);
        completed += 1;
        this.notifyLanguageProgress(language, completed / this.lines.length);
        return buffer;
      })).then((buffers) => {
        const track = this.createTrack(buffers);
        this.tracks[language] = track;
        return track;
      }).finally(() => {
        delete this.languageLoads[language];
      });
    }

    return this.languageLoads[language].finally(() => {
      this.languageProgressListeners[language].delete(onProgress);
    });
  }

  async load(onProgress = () => {}) {
    this.initializeContext();
    const musicEntries = Object.entries(this.musicDefinitions);
    const sfxEntries = Object.entries(this.sfxDefinitions);
    const totalFiles = this.lines.length + musicEntries.length + sfxEntries.length;
    let voiceProgress = 0;
    let staticLoaded = 0;
    const report = () => onProgress((voiceProgress * this.lines.length + staticLoaded) / totalFiles);
    const loadStatic = async (url, label, collection, key) => {
      collection[key] = await this.fetchBuffer(url, label);
      staticLoaded += 1;
      report();
    };

    await Promise.all([
      this.ensureLanguage(this.language, (progress) => {
        voiceProgress = progress;
        report();
      }),
      ...musicEntries.map(([name, url]) => loadStatic(url, `music cue ${name}`, this.musicBuffers, name)),
      ...sfxEntries.map(([name, url]) => loadStatic(url, `sound effect ${name}`, this.sfxBuffers, name)),
    ]);

    onProgress(1);
    return this.totalDuration;
  }

  async prefetchLanguages(onStatus = () => {}) {
    if (this.prefetchStarted) return;
    this.prefetchStarted = true;
    const languages = Object.keys(this.trackDefinitions).filter((language) => !this.isLanguageReady(language));

    for (const language of languages) {
      await waitForIdle();
      try {
        onStatus(language, 'loading', this.languageProgress[language] ?? 0);
        await this.ensureLanguage(language, (progress) => onStatus(language, 'loading', progress));
        onStatus(language, 'ready', 1);
      } catch {
        onStatus(language, 'error', this.languageProgress[language] ?? 0);
      }
    }
  }

  createTrack(buffers) {
    let cursor = this.timing.lead;
    const schedule = buffers.map((buffer, index) => {
      const entry = {
        ...this.lines[index],
        index,
        start: cursor,
        end: cursor + buffer.duration,
        duration: buffer.duration,
      };
      cursor = entry.end + this.timing.gap;
      return entry;
    });
    return {
      buffers,
      schedule,
      totalDuration: cursor - this.timing.gap + this.timing.tail,
    };
  }

  async start(offset = 0) {
    await this.context.resume();
    this.stopSources();
    this.started = true;
    this.paused = false;
    this.anchor = this.context.currentTime - offset;
    this.scheduleNarration(offset);
    this.scheduleMusic(offset);
    this.startAmbient();
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

  scheduleMusic() {}

  startAmbient() {}

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
    this.applyMusicEnvelope(gain.gain, start, offset, envelope);
    source.start(Math.max(this.context.currentTime + 0.035, this.anchor + start), bufferOffset);
    if (stop && this.anchor + stop > this.context.currentTime) source.stop(this.anchor + stop);
    this.musicSources.push(source);
  }

  applyMusicEnvelope(parameter, cueStart, offset, envelope) {
    const relativeNow = Math.max(0, offset - cueStart);
    let value = envelope[0][1];
    for (let index = 1; index < envelope.length; index += 1) {
      const [nextTime, nextValue] = envelope[index];
      const [previousTime, previousValue] = envelope[index - 1];
      if (relativeNow >= nextTime) {
        value = nextValue;
        continue;
      }
      if (relativeNow > previousTime) {
        const progress = (relativeNow - previousTime) / (nextTime - previousTime);
        value = previousValue + (nextValue - previousValue) * progress;
      }
      break;
    }
    parameter.setValueAtTime(value, this.context.currentTime);
    envelope.forEach(([time, target]) => {
      if (time > relativeNow) parameter.linearRampToValueAtTime(target, this.anchor + cueStart + time);
    });
  }

  stopSources() {
    [...this.sources, ...this.musicSources, ...this.effectSources, this.ambientSource]
      .filter(Boolean)
      .forEach((source) => {
        try { source.stop(); } catch { /* already stopped */ }
      });
    this.sources = [];
    this.musicSources = [];
    this.effectSources = [];
    this.ambientSource = null;
  }

  async setLanguage(language) {
    if (language === this.language) return this.getState();
    await this.ensureLanguage(language);
    const previous = this.getState();
    const wasPaused = this.paused;
    this.language = language;
    if (this.started) {
      const matching = this.activeTrack.schedule[previous.index];
      const matchedOffset = matching.start + previous.localProgress * matching.duration;
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
    this.master.gain.setTargetAtTime(muted ? 0 : this.masterGain, this.context.currentTime, 0.035);
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
    for (let current = 0; current < track.schedule.length; current += 1) {
      const entry = track.schedule[current];
      if (elapsed >= entry.start) index = current;
      if (elapsed >= entry.start && elapsed <= entry.end) {
        speaking = true;
        index = current;
        break;
      }
      if (elapsed < entry.start) break;
    }

    const entry = track.schedule[index];
    const localProgress = entry
      ? Math.min(1, Math.max(0, (elapsed - entry.start) / entry.duration))
      : 0;
    return {
      started: this.started,
      paused: this.paused,
      ended: this.started && elapsed >= this.totalDuration,
      elapsed,
      total: this.totalDuration,
      overallProgress: this.totalDuration ? elapsed / this.totalDuration : 0,
      poseProgress: track.schedule.length > 1
        ? Math.min(1, (index + localProgress) / (track.schedule.length - 1))
        : 0,
      index,
      entry,
      speaking,
      localProgress,
      language: this.language,
    };
  }
}
