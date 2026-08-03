import { COLLECTION_COPY, STORIES, formatStoryCount } from './catalog.js';

function languageFromUrl() {
  const language = new URLSearchParams(window.location.search).get('lang');
  return ['zh', 'id'].includes(language) ? language : 'en';
}

function languageControl(language, copy) {
  return `
    <div class="site-language" role="group" aria-label="${copy.languageLabel}">
      <span>${copy.languageLabel}</span>
      <button type="button" data-site-language="en" aria-pressed="${language === 'en'}">EN</button>
      <i aria-hidden="true"></i>
      <button type="button" data-site-language="zh" aria-pressed="${language === 'zh'}">中文</button>
      <i aria-hidden="true"></i>
      <button type="button" data-site-language="id" aria-pressed="${language === 'id'}">ID</button>
    </div>
  `;
}

function storyVisual(story) {
  if (story.cover === 'persimmon') {
    return `
      <div class="story-card__visual story-card__visual--persimmon" aria-hidden="true">
        <span class="story-card__number">${story.sequence}</span>
        <div class="story-card__persimmon-moon"></div>
        <div class="story-card__pine"><i></i><i></i><i></i></div>
        <div class="story-card__tiger"><i></i><i></i><i></i><b></b></div>
        <div class="story-card__persimmons"><i></i><i></i><i></i><i></i><i></i></div>
        <span class="story-card__hangul">호랑이와<br>곶감</span>
      </div>
    `;
  }

  if (story.cover === 'bell') {
    return `
      <div class="story-card__visual story-card__visual--bell" aria-hidden="true">
        <span class="story-card__number">${story.sequence}</span>
        <div class="story-card__bell-moon"></div>
        <div class="story-card__bell-frame"><i></i><i></i><b></b></div>
        <div class="story-card__bell"><b></b><i></i></div>
        <div class="story-card__bell-rings"><i></i><i></i><i></i></div>
        <span class="story-card__seal">寓</span>
      </div>
    `;
  }

  return `
    <div class="story-card__visual" aria-hidden="true">
      <span class="story-card__number">${story.sequence}</span>
      <div class="story-card__moon"></div>
      <div class="story-card__pot"><i></i></div>
      <svg class="story-card__steam" viewBox="0 0 260 220">
        <path d="M118 203C58 161 177 137 117 92C75 61 143 41 130 4" />
        <path d="M151 208C99 170 203 146 158 108C123 78 180 57 169 24" />
      </svg>
      <div class="story-card__coin"></div>
    </div>
  `;
}

function storyCard(story, language, copy) {
  return `
    <article class="story-card">
      <a class="story-card__link" href="${story.path}/" aria-label="${copy.viewStory}: ${story.title[language]}">
        ${storyVisual(story)}
        <div class="story-card__body">
          <div class="story-card__kicker">
            <span>${story.tradition[language]}</span>
            <span>${story.languages}</span>
          </div>
          <h2>${story.title[language]}</h2>
          <p>${story.description[language]}</p>
          <dl>
            <div><dt>${story.duration[language]}</dt><dd>${story.format[language]}</dd></div>
          </dl>
          <span class="story-card__cta">
            ${copy.viewStory}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </span>
        </div>
      </a>
    </article>
  `;
}

function collectionTemplate(language) {
  const copy = COLLECTION_COPY[language];
  const availableStories = STORIES.filter((story) => story.status === 'available');
  return `
    <main class="collection" id="collection">
      <div class="collection__grain" aria-hidden="true"></div>
      <header class="collection-header">
        <a class="collection-brand" href="/" aria-label="Wisdom Short Stories">
          <span aria-hidden="true">W</span>
          <strong>Wisdom Short Stories</strong>
        </a>
        ${languageControl(language, copy)}
      </header>

      <section class="collection-hero" aria-labelledby="collection-title">
        <div class="collection-hero__copy">
          <p class="collection-eyebrow">${copy.eyebrow}</p>
          <h1 id="collection-title"><span>${copy.titleFirst}</span><span>${copy.titleSecond}</span></h1>
          <p class="collection-intro">${copy.introduction}</p>
        </div>
        <div class="wisdom-thread" aria-hidden="true">
          <div class="wisdom-thread__seal"><span>W</span></div>
          <svg viewBox="0 0 420 520"><path d="M209 10C105 95 321 147 191 229C83 297 310 356 210 510" /></svg>
          <i></i><i></i><i></i>
        </div>
      </section>

      <section class="story-shelf" aria-labelledby="shelf-title">
        <header class="story-shelf__header">
          <p id="shelf-title">${copy.showing}</p>
          <span data-story-count>${formatStoryCount(language, availableStories.length)}</span>
        </header>
        ${availableStories.map((story) => storyCard(story, language, copy)).join('')}
      </section>

      <aside class="future-shelf">
        <span class="future-shelf__line" aria-hidden="true"></span>
        <div>
          <p class="collection-eyebrow">${copy.shelfEyebrow}</p>
          <h2>${copy.shelfTitle}</h2>
        </div>
        <p>${copy.shelfBody}</p>
      </aside>

      <footer class="collection-footer">
        <span>Wisdom Short Stories</span>
        <p>${copy.footer}</p>
      </footer>
    </main>
  `;
}

function notFoundTemplate(language) {
  const copy = COLLECTION_COPY[language];
  return `
    <main class="not-found">
      <header class="collection-header">
        <a class="collection-brand" href="/" aria-label="Wisdom Short Stories"><span aria-hidden="true">W</span><strong>Wisdom Short Stories</strong></a>
        ${languageControl(language, copy)}
      </header>
      <section>
        <p class="collection-eyebrow">${copy.notFoundEyebrow}</p>
        <h1>${copy.notFoundTitle}</h1>
        <p>${copy.notFoundBody}</p>
        <a href="/">${copy.backHome}<span aria-hidden="true">→</span></a>
      </section>
    </main>
  `;
}

function mountLocalized(app, template, {
  titleKey = 'documentTitle',
  descriptionKey = 'description',
} = {}) {
  let language = languageFromUrl();

  const render = () => {
    const copy = COLLECTION_COPY[language];
    document.documentElement.lang = copy.htmlLanguage;
    document.title = copy[titleKey];
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy[descriptionKey]);
    app.innerHTML = template(language);
    window.requestAnimationFrame(() => app.firstElementChild?.classList.add('is-ready'));

    app.querySelectorAll('[data-site-language]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextLanguage = button.dataset.siteLanguage;
        if (nextLanguage === language) return;
        language = nextLanguage;
        const url = new URL(window.location.href);
        if (language !== 'en') url.searchParams.set('lang', language);
        else url.searchParams.delete('lang');
        window.history.replaceState({}, '', url);
        render();
      });
    });
  };

  render();
}

export function mountCollection(app) {
  mountLocalized(app, collectionTemplate);
}

export function mountNotFound(app) {
  mountLocalized(app, notFoundTemplate, {
    titleKey: 'notFoundDocumentTitle',
    descriptionKey: 'notFoundDescription',
  });
}
