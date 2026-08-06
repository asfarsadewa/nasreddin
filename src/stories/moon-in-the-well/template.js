export function createStoryTemplate() {
  return `
    <main id="experience" class="moonwell-story">
      <div id="canvas-stage" aria-hidden="true"></div>
      <div class="well-signal" aria-hidden="true"><i></i><i></i><i></i><span></span></div>
      <div class="grain" aria-hidden="true"></div>

      <section class="opening" id="opening" aria-labelledby="story-title">
        <a class="collection-back collection-back--opening" href="/" data-collection-back>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6m5-5-5 5 5 5" /></svg><span>全部故事</span>
        </a>
        <button class="language-launch language-launch--opening" type="button" data-language-menu aria-haspopup="dialog" aria-controls="language-panel">
          <span class="language-launch__pulse" aria-hidden="true"></span><span data-language-summary>中文 · CC ID</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
        </button>
        <p class="opening__eyebrow" id="opening-eyebrow">纳斯尔丁·霍加故事 · 电影化短篇</p>
        <p class="opening__depth" aria-hidden="true">SKY&nbsp;&nbsp; / &nbsp;&nbsp;STONE&nbsp;&nbsp; / &nbsp;&nbsp;WATER&nbsp;&nbsp; / &nbsp;&nbsp;MOON</p>
        <h1 id="story-title"><span>井里的</span><span class="opening__descent"><i>月亮</i></span></h1>
        <p class="opening__deck" id="opening-deck">天上一轮月亮，水里一轮月亮，还有一场急得顾不上多想的营救。</p>
        <button class="begin" id="begin" type="button" disabled>
          <span class="begin__disc" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z" /></svg></span>
          <span><b id="begin-label">正在准备故事</b><small id="load-status">加载配音、音乐与音效…</small></span>
        </button>
        <p class="opening__hint">建议佩戴耳机 · 约两分钟</p>
        <div class="opening__well" aria-hidden="true">
          <div class="opening__well-rings"><i></i><i></i><i></i><i></i></div>
          <span class="opening__moon"></span><b class="opening__rope"></b>
        </div>
      </section>

      <header class="hud" id="hud" aria-hidden="true" hidden>
        <div class="hud__identity">
          <a class="collection-back collection-back--hud" href="/" data-collection-back>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6m5-5-5 5 5 5" /></svg><span>全部故事</span>
          </a>
          <div class="hud__mark"><span>THE MOON / THE WELL</span><i aria-hidden="true"></i><span id="tale-mark">纳斯尔丁·霍加故事</span></div>
        </div>
        <div class="hud__actions">
          <button class="language-launch language-launch--hud" type="button" data-language-menu aria-haspopup="dialog" aria-controls="language-panel">
            <span class="language-launch__pulse" aria-hidden="true"></span><span data-language-summary>中文 · CC ID</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
          </button>
          <button class="icon-button" id="caption-toggle" type="button" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 10h2m4 0h2m-8 4h3m2 0h3" /></svg></button>
          <button class="icon-button" id="music-toggle" type="button" aria-pressed="false">
            <svg class="music-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V7l10-2v11M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" /></svg>
            <svg class="music-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 15.2V7l10-2v10.2M9 18a3 3 0 1 1-3-3m10.2-1.8A3 3 0 0 1 19 16M4 4l16 16" /></svg>
          </button>
          <button class="icon-button" id="sound-toggle" type="button" aria-pressed="false">
            <svg class="sound-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm12.5.5a4 4 0 0 1 0 5m2-7a7 7 0 0 1 0 9" /></svg>
            <svg class="sound-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm12 1 4 4m0-4-4 4" /></svg>
          </button>
          <button class="icon-button" id="play-toggle" type="button" aria-pressed="false">
            <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12m8-12v12" /></svg>
            <svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" /></svg>
          </button>
        </div>
      </header>

      <div class="chapter" id="chapter" aria-hidden="true" hidden><span id="chapter-number">I</span><div><small id="chapter-label">章</small><strong id="chapter-name">第二个月亮</strong></div></div>
      <section class="captions" id="captions" aria-live="polite" aria-atomic="true"><p class="captions__speaker" id="speaker"></p><p class="captions__line" id="caption-line"></p></section>
      <footer class="timeline" id="timeline" aria-hidden="true" hidden><span class="timeline__time" id="current-time">0:00</span><div class="timeline__track"><i id="timeline-progress"></i></div><span class="timeline__time" id="total-time">0:00</span></footer>

      <div class="language-scrim" id="language-scrim" hidden></div>
      <section class="language-panel" id="language-panel" role="dialog" aria-modal="true" aria-labelledby="language-title" hidden>
        <header class="language-panel__header"><div><p id="language-eyebrow">播放选项</p><h2 id="language-title">选择由哪轮月亮开口</h2></div>
          <button class="language-panel__close" id="language-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg></button>
        </header>
        <p class="language-panel__intro" id="language-intro">配音与屏幕字幕可以分别选择。</p>
        <fieldset class="language-group"><legend><span id="voice-label">配音</span><small id="voice-help">完整角色演绎</small></legend>
          <div class="language-group__choices language-group__choices--three" role="radiogroup" aria-labelledby="voice-label">
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-voice="en"><span><b>EN</b><strong data-language-name="english">English</strong></span><i aria-hidden="true"></i></button>
            <button class="language-choice" type="button" role="radio" aria-checked="true" data-voice="zh"><span><b>中</b><strong data-language-name="chinese">中文</strong></span><i aria-hidden="true"></i></button>
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-voice="id"><span><b>ID</b><strong data-language-name="indonesian">Bahasa Indonesia</strong></span><i aria-hidden="true"></i></button>
          </div>
        </fieldset>
        <fieldset class="language-group"><legend><span id="subtitle-label">字幕</span><small id="subtitle-help">可与配音语言不同</small></legend>
          <div class="language-group__choices language-group__choices--subtitles language-group__choices--four" role="radiogroup" aria-labelledby="subtitle-label">
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-subtitle="en"><span><b>CC</b><strong data-language-name="english">English</strong></span><i aria-hidden="true"></i></button>
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-subtitle="zh"><span><b>CC</b><strong data-language-name="chinese">中文</strong></span><i aria-hidden="true"></i></button>
            <button class="language-choice" type="button" role="radio" aria-checked="true" data-subtitle="id"><span><b>CC</b><strong data-language-name="indonesian">Bahasa Indonesia</strong></span><i aria-hidden="true"></i></button>
            <button class="language-choice" type="button" role="radio" aria-checked="false" data-subtitle="off"><span><b>—</b><strong id="subtitle-off">关闭</strong></span><i aria-hidden="true"></i></button>
          </div>
        </fieldset>
      </section>

      <section class="ending" id="ending" aria-labelledby="ending-title" aria-hidden="true" hidden>
        <p id="ending-eyebrow">营救成功</p><h2 id="ending-title">月亮回到了天上。<br>纳斯尔丁揉着后背回了家。</h2>
        <div class="ending__actions"><button class="replay" id="replay" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V3m0 0h5M4 3l4 4a7 7 0 1 1-2 8" /></svg><span id="replay-label">再救一次月亮</span></button>
          <a class="collection-back collection-back--ending" href="/" data-collection-back><span>全部故事</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" /></svg></a></div>
      </section>

      <div class="letterbox letterbox--top" aria-hidden="true"></div><div class="letterbox letterbox--bottom" aria-hidden="true"></div>
      <p class="sr-only" id="live-status" aria-live="polite"></p>
    </main>
  `;
}
