export function createStoryTemplate() {
  return `
    <main id="experience">
      <div id="canvas-stage" aria-hidden="true"></div>

      <div class="atmosphere" aria-hidden="true"></div>
      <div class="grain" aria-hidden="true"></div>

      <section class="opening" id="opening" aria-labelledby="story-title">
        <a class="collection-back collection-back--opening" href="/" data-collection-back>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6m5-5-5 5 5 5" /></svg>
          <span>All stories</span>
        </a>
        <button class="language-launch language-launch--opening" type="button" data-language-menu aria-haspopup="dialog" aria-controls="language-panel">
          <span class="language-launch__pulse" aria-hidden="true"></span>
          <span data-language-summary>EN · CC ID</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
        </button>
        <p class="opening__eyebrow" id="opening-eyebrow">An animated Nasreddin Hodja tale</p>
        <h1 id="story-title">
          <span>The smell</span>
          <span class="opening__join">of soup <i>&amp;</i> the sound</span>
          <span>of money</span>
        </h1>
        <p class="opening__deck" id="opening-deck">
          A poor traveler, an expensive aroma, and the only judgment that could balance them.
        </p>
        <button class="begin" id="begin" type="button" disabled>
          <span class="begin__disc" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z" /></svg>
          </span>
          <span>
            <b id="begin-label">Preparing the story</b>
            <small id="load-status">Loading voices…</small>
          </span>
        </button>
        <p class="opening__hint">Headphones recommended · about 90 seconds</p>
      </section>

      <header class="hud" id="hud" aria-hidden="true" hidden>
        <div class="hud__identity">
          <a class="collection-back collection-back--hud" href="/" data-collection-back>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6m5-5-5 5 5 5" /></svg>
            <span>All stories</span>
          </a>
          <div class="hud__mark">
            <span>Akşehir</span>
            <i aria-hidden="true"></i>
            <span id="tale-mark">A Nasreddin tale</span>
          </div>
        </div>
        <div class="hud__actions">
          <button class="language-launch language-launch--hud" type="button" data-language-menu aria-haspopup="dialog" aria-controls="language-panel">
            <span class="language-launch__pulse" aria-hidden="true"></span>
            <span data-language-summary>EN · CC ID</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
          </button>
          <button class="icon-button" id="caption-toggle" type="button" aria-label="Hide captions" aria-pressed="true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 10h2m4 0h2m-8 4h3m2 0h3" /></svg>
          </button>
          <button class="icon-button" id="music-toggle" type="button" aria-label="Mute music" aria-pressed="false">
            <svg class="music-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V7l10-2v11M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" /></svg>
            <svg class="music-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 15.2V7l10-2v10.2M9 18a3 3 0 1 1-3-3m10.2-1.8A3 3 0 0 1 19 16M4 4l16 16" /></svg>
          </button>
          <button class="icon-button" id="sound-toggle" type="button" aria-label="Mute sound" aria-pressed="false">
            <svg class="sound-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm12.5.5a4 4 0 0 1 0 5m2-7a7 7 0 0 1 0 9" /></svg>
            <svg class="sound-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm12 1 4 4m0-4-4 4" /></svg>
          </button>
          <button class="icon-button" id="play-toggle" type="button" aria-label="Pause story" aria-pressed="false">
            <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12m8-12v12" /></svg>
            <svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" /></svg>
          </button>
        </div>
      </header>

      <div class="chapter" id="chapter" aria-hidden="true" hidden>
        <span id="chapter-number">I</span>
        <div>
          <small id="chapter-label">Chapter</small>
          <strong id="chapter-name">The hungry traveler</strong>
        </div>
      </div>

      <section class="captions" id="captions" aria-live="polite" aria-atomic="true">
        <p class="captions__speaker" id="speaker"></p>
        <p class="captions__line" id="caption-line"></p>
      </section>

      <footer class="timeline" id="timeline" aria-hidden="true" hidden>
        <span class="timeline__time" id="current-time">0:00</span>
        <div class="timeline__track"><i id="timeline-progress"></i></div>
        <span class="timeline__time" id="total-time">0:00</span>
      </footer>

      <div class="language-scrim" id="language-scrim" hidden></div>
      <section class="language-panel" id="language-panel" role="dialog" aria-modal="true" aria-labelledby="language-title" hidden>
        <header class="language-panel__header">
          <div>
            <p id="language-eyebrow">Listening options</p>
            <h2 id="language-title">Hear it your way</h2>
          </div>
          <button class="language-panel__close" id="language-close" type="button" aria-label="Close language options">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>
        </header>
        <p class="language-panel__intro" id="language-intro">Choose the performed language and the words shown on screen.</p>

        <fieldset class="language-group">
          <legend>
            <span id="voice-label">Voice</span>
            <small id="voice-help">Fully acted narration</small>
          </legend>
          <div class="language-group__choices" role="radiogroup" aria-labelledby="voice-label">
            <button class="language-choice" type="button" role="radio" aria-checked="true" data-voice="en">
              <span><b>EN</b><strong id="voice-english">English</strong></span>
              <i aria-hidden="true"></i>
            </button>
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-voice="id">
              <span><b>ID</b><strong id="voice-indonesian">Bahasa Indonesia</strong></span>
              <i aria-hidden="true"></i>
            </button>
          </div>
        </fieldset>

        <fieldset class="language-group">
          <legend>
            <span id="subtitle-label">Subtitles</span>
            <small id="subtitle-help">Choose independently from the voice</small>
          </legend>
          <div class="language-group__choices language-group__choices--subtitles" role="radiogroup" aria-labelledby="subtitle-label">
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-subtitle="en">
              <span><b>CC</b><strong id="subtitle-english">English</strong></span>
              <i aria-hidden="true"></i>
            </button>
            <button class="language-choice" type="button" role="radio" aria-checked="true" data-subtitle="id">
              <span><b>CC</b><strong id="subtitle-indonesian">Bahasa Indonesia</strong></span>
              <i aria-hidden="true"></i>
            </button>
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-subtitle="off">
              <span><b>—</b><strong id="subtitle-off">Off</strong></span>
              <i aria-hidden="true"></i>
            </button>
          </div>
        </fieldset>
      </section>

      <section class="ending" id="ending" aria-labelledby="ending-title" aria-hidden="true" hidden>
        <p id="ending-eyebrow">The judgment</p>
        <h2 id="ending-title">A scent for a sound.<br />A debt paid in full.</h2>
        <div class="ending__actions">
          <button class="replay" id="replay" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V3m0 0h5M4 3l4 4a7 7 0 1 1-2 8" /></svg>
            <span id="replay-label">Tell it again</span>
          </button>
          <a class="collection-back collection-back--ending" href="/" data-collection-back>
            <span>All stories</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </a>
        </div>
      </section>

      <div class="letterbox letterbox--top" aria-hidden="true"></div>
      <div class="letterbox letterbox--bottom" aria-hidden="true"></div>
      <p class="sr-only" id="live-status" aria-live="polite"></p>
    </main>
  `;
}
