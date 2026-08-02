const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const LANGUAGE_COPY_KEYS = { en: 'english', zh: 'chinese', id: 'indonesian' };
const displayCode = (language) => ({ zh: '中文', en: 'EN', id: 'ID' }[language] ?? language.toUpperCase());
const subtitleCode = (language) => language === 'off'
  ? 'CC —'
  : `CC ${language === 'zh' ? '中' : language.toUpperCase()}`;

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function collectElements() {
  return {
    experience: $('#experience'),
    stage: $('#canvas-stage'),
    opening: $('#opening'),
    openingEyebrow: $('#opening-eyebrow'),
    storyTitle: $('#story-title'),
    openingDeck: $('#opening-deck'),
    begin: $('#begin'),
    beginLabel: $('#begin-label'),
    loadStatus: $('#load-status'),
    hint: $('.opening__hint'),
    hud: $('#hud'),
    taleMark: $('#tale-mark'),
    captionToggle: $('#caption-toggle'),
    musicToggle: $('#music-toggle'),
    soundToggle: $('#sound-toggle'),
    playToggle: $('#play-toggle'),
    chapter: $('#chapter'),
    chapterLabel: $('#chapter-label'),
    chapterNumber: $('#chapter-number'),
    chapterName: $('#chapter-name'),
    captions: $('#captions'),
    speaker: $('#speaker'),
    captionLine: $('#caption-line'),
    timeline: $('#timeline'),
    timelineProgress: $('#timeline-progress'),
    currentTime: $('#current-time'),
    totalTime: $('#total-time'),
    ending: $('#ending'),
    endingEyebrow: $('#ending-eyebrow'),
    endingTitle: $('#ending-title'),
    replay: $('#replay'),
    replayLabel: $('#replay-label'),
    liveStatus: $('#live-status'),
    languageLaunchers: $$('[data-language-menu]'),
    languageSummaries: $$('[data-language-summary]'),
    languageScrim: $('#language-scrim'),
    languagePanel: $('#language-panel'),
    languageClose: $('#language-close'),
    collectionBacks: $$('[data-collection-back]'),
    languageEyebrow: $('#language-eyebrow'),
    languageTitle: $('#language-title'),
    languageIntro: $('#language-intro'),
    voiceLabel: $('#voice-label'),
    voiceHelp: $('#voice-help'),
    subtitleLabel: $('#subtitle-label'),
    subtitleHelp: $('#subtitle-help'),
    languageNames: $$('[data-language-name]'),
    subtitleOff: $('#subtitle-off'),
    voiceChoices: $$('[data-voice]'),
    subtitleChoices: $$('[data-subtitle]'),
  };
}

export function createStoryController({
  audio,
  world,
  lines,
  uiCopy,
  initialVoice,
  initialSubtitle,
  onReset = () => {},
  onState = () => {},
}) {
  const elements = collectElements();
  const clock = { last: performance.now() / 1000 };
  let ready = false;
  let voiceLanguage = initialVoice;
  let subtitleLanguage = initialSubtitle;
  let lastSubtitleLanguage = initialSubtitle;
  let muted = false;
  let musicMuted = false;
  let previousCaptionKey = '';
  let previousChapterKey = '';
  let endingShown = false;
  let loadProgress = 0;
  let languageTrigger = null;
  let menuPausedStory = false;
  let voiceLoadLanguage = null;
  let voiceLoadProgress = 0;

  const copy = () => uiCopy[voiceLanguage];
  const languageName = (language) => copy()[LANGUAGE_COPY_KEYS[language]];

  function voiceLoadingMessage(language, progress) {
    return interpolate(copy().voiceLoading, {
      language: languageName(language),
      progress: Math.round(progress * 100),
    });
  }

  function updateLanguageSummary() {
    const summary = `${displayCode(voiceLanguage)} · ${subtitleCode(subtitleLanguage)}`;
    elements.languageSummaries.forEach((element) => { element.textContent = summary; });
    elements.languageLaunchers.forEach((button) => {
      button.setAttribute('aria-label', `${copy().optionsLabel}: ${summary}`);
      button.setAttribute('aria-expanded', String(!elements.languagePanel.hidden));
    });
  }

  function updateChoiceStates() {
    elements.voiceChoices.forEach((button) => {
      button.setAttribute('aria-checked', String(button.dataset.voice === voiceLanguage));
    });
    elements.subtitleChoices.forEach((button) => {
      button.setAttribute('aria-checked', String(button.dataset.subtitle === subtitleLanguage));
    });
  }

  function updatePlaybackControls() {
    const currentCopy = copy();
    const paused = audio.paused;
    elements.playToggle.classList.toggle('is-paused', paused);
    elements.playToggle.setAttribute('aria-pressed', String(paused));
    elements.playToggle.setAttribute('aria-label', paused ? currentCopy.resume : currentCopy.pause);
    elements.soundToggle.setAttribute('aria-label', muted ? currentCopy.unmute : currentCopy.mute);
    elements.musicToggle.setAttribute('aria-label', musicMuted ? currentCopy.unmuteMusic : currentCopy.muteMusic);
    const subtitlesOn = subtitleLanguage !== 'off';
    elements.captionToggle.setAttribute('aria-pressed', String(subtitlesOn));
    elements.captionToggle.setAttribute('aria-label', subtitlesOn ? currentCopy.hideSubtitles : currentCopy.showSubtitles);
  }

  function localizeInterface() {
    const currentCopy = copy();
    document.documentElement.lang = currentCopy.htmlLanguage;
    document.title = currentCopy.documentTitle;
    elements.openingEyebrow.textContent = currentCopy.eyebrow;
    elements.storyTitle.innerHTML = currentCopy.titleHtml;
    elements.openingDeck.textContent = currentCopy.deck;
    elements.taleMark.textContent = currentCopy.taleMark;
    elements.chapterLabel.textContent = currentCopy.chapter;
    elements.endingEyebrow.textContent = currentCopy.judgment;
    elements.endingTitle.innerHTML = currentCopy.endingHtml;
    elements.replayLabel.textContent = currentCopy.replay;
    elements.languageEyebrow.textContent = currentCopy.optionsEyebrow;
    elements.languageTitle.textContent = currentCopy.optionsTitle;
    elements.languageIntro.textContent = voiceLoadLanguage
      ? voiceLoadingMessage(voiceLoadLanguage, voiceLoadProgress)
      : currentCopy.optionsIntro;
    elements.voiceLabel.textContent = currentCopy.voice;
    elements.voiceHelp.textContent = currentCopy.voiceHelp;
    elements.subtitleLabel.textContent = currentCopy.subtitles;
    elements.subtitleHelp.textContent = currentCopy.subtitlesHelp;
    elements.languageNames.forEach((element) => {
      element.textContent = currentCopy[element.dataset.languageName];
    });
    elements.subtitleOff.textContent = currentCopy.off;
    elements.languageClose.setAttribute('aria-label', currentCopy.close);
    elements.collectionBacks.forEach((link) => {
      const label = link.querySelector('span');
      if (label) label.textContent = currentCopy.allStories;
      link.setAttribute('aria-label', currentCopy.allStories);
    });

    if (ready) {
      elements.beginLabel.textContent = currentCopy.begin;
      elements.loadStatus.textContent = currentCopy.ready;
      elements.hint.textContent = `${currentCopy.headphones} · ${formatTime(audio.totalDuration)}`;
    } else {
      elements.beginLabel.textContent = currentCopy.preparing;
      elements.loadStatus.textContent = `${currentCopy.loading} · ${Math.round(loadProgress * 100)}%`;
    }

    updateLanguageSummary();
    updateChoiceStates();
    updatePlaybackControls();
    previousCaptionKey = '';
    previousChapterKey = '';
    if (audio.started) updateInterface(audio.getState());
  }

  function setStoryChrome(visible) {
    [elements.hud, elements.chapter, elements.timeline].forEach((element) => {
      element.hidden = !visible;
      element.classList.toggle('is-visible', visible);
      element.setAttribute('aria-hidden', String(!visible));
    });
    elements.hud.classList.toggle('is-playing', visible);
  }

  function showEnding() {
    if (endingShown) return;
    endingShown = true;
    elements.ending.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => elements.ending.classList.add('is-visible')));
    elements.ending.setAttribute('aria-hidden', 'false');
    elements.captions.classList.remove('is-visible');
    elements.chapter.classList.remove('is-visible');
    elements.liveStatus.textContent = copy().ended;
    window.setTimeout(() => elements.replay.focus(), 1200);
  }

  function hideEnding() {
    endingShown = false;
    elements.ending.classList.remove('is-visible');
    elements.ending.hidden = true;
    elements.ending.setAttribute('aria-hidden', 'true');
    elements.chapter.classList.add('is-visible');
  }

  function updateInterface(state) {
    audio.setNarrationActive(state.speaking && !state.paused);
    elements.timelineProgress.style.transform = `scaleX(${state.overallProgress})`;
    elements.currentTime.textContent = formatTime(state.elapsed);
    elements.totalTime.textContent = formatTime(state.total);

    const line = lines[state.index];
    const captionKey = `${state.index}|${subtitleLanguage}`;
    if (line && captionKey !== previousCaptionKey) {
      previousCaptionKey = captionKey;
      if (subtitleLanguage !== 'off') {
        elements.speaker.textContent = line.speaker[subtitleLanguage];
        elements.captionLine.textContent = line.text[subtitleLanguage];
      }
      elements.liveStatus.textContent = `${line.speaker[voiceLanguage]}: ${line.text[voiceLanguage]}`;
    }

    const chapterKey = line ? `${line.chapter[0]}|${voiceLanguage}` : '';
    if (line && chapterKey !== previousChapterKey) {
      previousChapterKey = chapterKey;
      elements.chapterNumber.textContent = line.chapter[0];
      elements.chapterName.textContent = line.chapter[1][voiceLanguage];
    }

    const captionsOn = subtitleLanguage !== 'off';
    elements.captions.classList.toggle('is-visible', Boolean(state.speaking && captionsOn && !state.ended));
    elements.captions.classList.toggle('is-hidden', !captionsOn);
    onState({ state, audio, elements });
    if (state.ended) showEnding();
  }

  async function beginStory() {
    if (!ready) return;
    elements.experience.scrollTop = 0;
    await closeLanguagePanel(false);
    elements.begin.disabled = true;
    elements.opening.classList.add('is-gone');
    elements.opening.setAttribute('aria-hidden', 'true');
    setStoryChrome(true);
    hideEnding();
    onReset({ audio, elements });
    previousCaptionKey = '';
    previousChapterKey = '';
    await audio.start(0);
    updatePlaybackControls();
    elements.liveStatus.textContent = copy().started;
    void audio.prefetchLanguages((language, status) => {
      if (status !== 'ready') return;
      const choice = elements.voiceChoices.find((button) => button.dataset.voice === language);
      if (choice) choice.dataset.audioReady = 'true';
    });
  }

  async function togglePlayback(announce = true) {
    if (!audio.started || endingShown) return audio.paused;
    const paused = await audio.togglePause();
    updatePlaybackControls();
    if (announce) elements.liveStatus.textContent = paused ? copy().paused : copy().resumed;
    return paused;
  }

  async function openLanguagePanel(event) {
    languageTrigger = event.currentTarget;
    elements.languagePanel.hidden = false;
    elements.languageScrim.hidden = false;
    updateLanguageSummary();
    if (audio.started && !audio.paused && !endingShown) {
      await togglePlayback(false);
      menuPausedStory = true;
    }
    elements.languageClose.focus();
  }

  async function closeLanguagePanel(restoreFocus = true) {
    if (elements.languagePanel.hidden) return;
    elements.languagePanel.hidden = true;
    elements.languageScrim.hidden = true;
    updateLanguageSummary();
    if (menuPausedStory) {
      menuPausedStory = false;
      await togglePlayback(false);
    }
    if (restoreFocus && languageTrigger) languageTrigger.focus();
  }

  function setVoiceLoading(language, progress) {
    voiceLoadLanguage = language;
    voiceLoadProgress = progress;
    const percentage = `${Math.round(progress * 100)}%`;
    elements.voiceChoices.forEach((choice) => {
      choice.disabled = true;
      const active = choice.dataset.voice === language;
      choice.classList.toggle('is-loading', active);
      choice.setAttribute('aria-busy', String(active));
      if (active) choice.dataset.loadProgress = percentage;
      else delete choice.dataset.loadProgress;
    });
    const message = voiceLoadingMessage(language, progress);
    elements.languageIntro.textContent = message;
    elements.liveStatus.textContent = message;
  }

  function clearVoiceLoading() {
    voiceLoadLanguage = null;
    voiceLoadProgress = 0;
    elements.voiceChoices.forEach((choice) => {
      choice.disabled = false;
      choice.classList.remove('is-loading');
      choice.removeAttribute('aria-busy');
      delete choice.dataset.loadProgress;
    });
    elements.languageIntro.textContent = copy().optionsIntro;
  }

  async function setVoiceLanguage(language) {
    if (language === voiceLanguage || voiceLoadLanguage) return;
    const previousVoice = voiceLanguage;
    try {
      if (!audio.isLanguageReady(language)) {
        setVoiceLoading(language, 0);
        await audio.ensureLanguage(language, (progress) => setVoiceLoading(language, progress));
      }
      await audio.setLanguage(language);
      voiceLanguage = language;
      if (subtitleLanguage === previousVoice) setSubtitleLanguage(language, false);
      clearVoiceLoading();
      const choice = elements.voiceChoices.find((button) => button.dataset.voice === language);
      if (choice) choice.dataset.audioReady = 'true';
      localizeInterface();
      elements.totalTime.textContent = formatTime(audio.totalDuration);
    } catch (error) {
      console.error(error);
      clearVoiceLoading();
      const message = interpolate(copy().voiceLoadError, { language: languageName(language) });
      elements.languageIntro.textContent = message;
      elements.liveStatus.textContent = message;
    }
  }

  function setSubtitleLanguage(language, announce = true) {
    subtitleLanguage = language;
    if (language !== 'off') lastSubtitleLanguage = language;
    previousCaptionKey = '';
    updateLanguageSummary();
    updateChoiceStates();
    updatePlaybackControls();
    elements.captions.classList.toggle('is-hidden', language === 'off');
    if (audio.started) updateInterface(audio.getState());
    if (announce) {
      elements.liveStatus.textContent = language === 'off'
        ? copy().hideSubtitles
        : `${copy().subtitles}: ${languageName(language)}`;
    }
  }

  elements.begin.addEventListener('click', beginStory);
  elements.playToggle.addEventListener('click', () => togglePlayback());
  elements.replay.addEventListener('click', beginStory);
  elements.languageLaunchers.forEach((button) => button.addEventListener('click', openLanguagePanel));
  elements.languageClose.addEventListener('click', () => closeLanguagePanel());
  elements.languageScrim.addEventListener('click', () => closeLanguagePanel());
  elements.voiceChoices.forEach((button) => {
    button.disabled = true;
    button.addEventListener('click', () => setVoiceLanguage(button.dataset.voice));
  });
  elements.subtitleChoices.forEach((button) => {
    button.addEventListener('click', () => setSubtitleLanguage(button.dataset.subtitle));
  });
  elements.soundToggle.addEventListener('click', () => {
    muted = !muted;
    audio.setMuted(muted);
    elements.soundToggle.classList.toggle('is-muted', muted);
    elements.soundToggle.setAttribute('aria-pressed', String(muted));
    updatePlaybackControls();
  });
  elements.musicToggle.addEventListener('click', () => {
    musicMuted = !musicMuted;
    audio.setMusicMuted(musicMuted);
    elements.musicToggle.classList.toggle('is-music-muted', musicMuted);
    elements.musicToggle.setAttribute('aria-pressed', String(musicMuted));
    elements.liveStatus.textContent = musicMuted ? copy().musicMuted : copy().musicPlaying;
    updatePlaybackControls();
  });
  elements.captionToggle.addEventListener('click', () => {
    setSubtitleLanguage(subtitleLanguage === 'off' ? lastSubtitleLanguage : 'off', false);
  });

  window.addEventListener('keydown', (event) => {
    if (!elements.languagePanel.hidden && event.key === 'Escape') {
      event.preventDefault();
      closeLanguagePanel();
      return;
    }
    if (!elements.languagePanel.hidden && event.key === 'Tab') {
      const focusable = $$('button:not([disabled])').filter((button) => elements.languagePanel.contains(button));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.target instanceof HTMLButtonElement) return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlayback();
    }
    if (event.key.toLowerCase() === 'm' && audio.started) elements.soundToggle.click();
    if (event.key.toLowerCase() === 'b' && audio.started) elements.musicToggle.click();
    if (event.key.toLowerCase() === 'c' && audio.started) elements.captionToggle.click();
  });

  async function prepare() {
    try {
      const duration = await audio.load((progress) => {
        loadProgress = progress;
        elements.loadStatus.textContent = `${copy().loading} · ${Math.round(progress * 100)}%`;
      });
      ready = true;
      elements.begin.disabled = false;
      elements.voiceChoices.forEach((choice) => { choice.disabled = false; });
      const initialChoice = elements.voiceChoices.find((choice) => choice.dataset.voice === voiceLanguage);
      if (initialChoice) initialChoice.dataset.audioReady = 'true';
      localizeInterface();
      elements.totalTime.textContent = formatTime(duration);
    } catch (error) {
      console.error(error);
      elements.beginLabel.textContent = copy().loadError;
      elements.loadStatus.textContent = copy().retry;
      elements.liveStatus.textContent = `${copy().loadError}. ${copy().retry}.`;
    }
  }

  function animate(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(0.05, now - clock.last);
    clock.last = now;
    const state = audio.getState();
    world.update(now, dt, state);
    if (state.started) updateInterface(state);
    requestAnimationFrame(animate);
  }

  localizeInterface();
  requestAnimationFrame(animate);
  prepare();

  return {
    audio,
    elements,
    setVoiceLanguage,
    setSubtitleLanguage,
  };
}
