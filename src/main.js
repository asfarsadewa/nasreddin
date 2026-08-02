import './styles.css';
import { StoryAudio } from './audio.js';
import { AUDIO_TRACKS, MUSIC_CUES, STORY_LINES, UI_COPY } from './story.js';
import { StoryWorld } from './world.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const elements = {
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
  languageEyebrow: $('#language-eyebrow'),
  languageTitle: $('#language-title'),
  languageIntro: $('#language-intro'),
  voiceLabel: $('#voice-label'),
  voiceHelp: $('#voice-help'),
  subtitleLabel: $('#subtitle-label'),
  subtitleHelp: $('#subtitle-help'),
  voiceEnglish: $('#voice-english'),
  voiceIndonesian: $('#voice-indonesian'),
  subtitleEnglish: $('#subtitle-english'),
  subtitleIndonesian: $('#subtitle-indonesian'),
  subtitleOff: $('#subtitle-off'),
  voiceChoices: $$('[data-voice]'),
  subtitleChoices: $$('[data-subtitle]'),
};

const world = new StoryWorld(elements.stage);
const audio = new StoryAudio(STORY_LINES, AUDIO_TRACKS, MUSIC_CUES, 'en');
const clock = { last: performance.now() / 1000 };

let ready = false;
let voiceLanguage = 'en';
let subtitleLanguage = 'id';
let lastSubtitleLanguage = 'id';
let muted = false;
let musicMuted = false;
let previousCaptionKey = '';
let previousChapterKey = '';
let endingShown = false;
let loadProgress = 0;
let languageTrigger = null;
let menuPausedStory = false;
const firedClinks = new Set();

const copy = () => UI_COPY[voiceLanguage];

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function subtitleSummary() {
  if (subtitleLanguage === 'off') return 'CC —';
  return `CC ${subtitleLanguage.toUpperCase()}`;
}

function updateLanguageSummary() {
  const summary = `${voiceLanguage.toUpperCase()} · ${subtitleSummary()}`;
  elements.languageSummaries.forEach((element) => { element.textContent = summary; });
  elements.languageLaunchers.forEach((button) => {
    button.setAttribute('aria-label', `${copy().optionsLabel}: ${summary}`);
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
  elements.languageIntro.textContent = currentCopy.optionsIntro;
  elements.voiceLabel.textContent = currentCopy.voice;
  elements.voiceHelp.textContent = currentCopy.voiceHelp;
  elements.subtitleLabel.textContent = currentCopy.subtitles;
  elements.subtitleHelp.textContent = currentCopy.subtitlesHelp;
  elements.voiceEnglish.textContent = currentCopy.english;
  elements.voiceIndonesian.textContent = currentCopy.indonesian;
  elements.subtitleEnglish.textContent = currentCopy.english;
  elements.subtitleIndonesian.textContent = currentCopy.indonesian;
  elements.subtitleOff.textContent = currentCopy.off;
  elements.languageClose.setAttribute('aria-label', currentCopy.close);

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
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => elements.ending.classList.add('is-visible'));
  });
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

  const line = STORY_LINES[state.index];
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

  if (state.index === 8 && state.speaking && !state.paused) {
    if (state.localProgress >= 0.69 && !firedClinks.has('first')) {
      firedClinks.add('first');
      audio.playCoinClink(1);
    }
    if (state.localProgress >= 0.84 && !firedClinks.has('second')) {
      firedClinks.add('second');
      audio.playCoinClink(1.08);
    }
  }

  if (state.ended) showEnding();
}

async function beginStory() {
  if (!ready) return;
  await closeLanguagePanel(false);
  elements.begin.disabled = true;
  elements.opening.classList.add('is-gone');
  elements.opening.setAttribute('aria-hidden', 'true');
  setStoryChrome(true);
  hideEnding();
  firedClinks.clear();
  previousCaptionKey = '';
  previousChapterKey = '';
  await audio.start(0);
  updatePlaybackControls();
  elements.liveStatus.textContent = copy().started;
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
  elements.languageLaunchers.forEach((button) => button.setAttribute('aria-expanded', 'true'));
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
  elements.languageLaunchers.forEach((button) => button.setAttribute('aria-expanded', 'false'));
  if (menuPausedStory) {
    menuPausedStory = false;
    await togglePlayback(false);
  }
  if (restoreFocus && languageTrigger) languageTrigger.focus();
}

async function setVoiceLanguage(language) {
  if (language === voiceLanguage) return;
  const previousVoice = voiceLanguage;
  voiceLanguage = language;
  if (subtitleLanguage === previousVoice) setSubtitleLanguage(language, false);
  if (ready) await audio.setLanguage(language);
  else audio.language = language;
  localizeInterface();
  elements.totalTime.textContent = formatTime(audio.totalDuration);
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
  if (announce) elements.liveStatus.textContent = language === 'off'
    ? copy().hideSubtitles
    : `${copy().subtitles}: ${language === 'en' ? copy().english : copy().indonesian}`;
}

elements.begin.addEventListener('click', beginStory);
elements.playToggle.addEventListener('click', () => togglePlayback());
elements.replay.addEventListener('click', beginStory);
elements.languageLaunchers.forEach((button) => button.addEventListener('click', openLanguagePanel));
elements.languageClose.addEventListener('click', () => closeLanguagePanel());
elements.languageScrim.addEventListener('click', () => closeLanguagePanel());

elements.voiceChoices.forEach((button) => {
  button.addEventListener('click', async () => {
    elements.voiceChoices.forEach((choice) => { choice.disabled = true; });
    await setVoiceLanguage(button.dataset.voice);
    elements.voiceChoices.forEach((choice) => { choice.disabled = false; });
  });
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
