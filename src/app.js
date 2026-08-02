import './styles.css';
import { findStory, normalizePath } from './catalog.js';
import { mountCollection, mountNotFound } from './collection.js';

async function mountApplication() {
  const app = document.querySelector('#app');
  const path = normalizePath(window.location.pathname);
  const story = findStory(path);

  if (path === '/') {
    document.body.classList.add('collection-page');
    mountCollection(app);
  } else if (story) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.body.classList.add('story-page');
    const storyModule = await story.load();
    await storyModule.mount(app);
  } else {
    document.body.classList.add('collection-page');
    mountNotFound(app);
  }
}

mountApplication().catch((error) => {
  console.error('Unable to mount Wisdom Short Stories.', error);
  document.body.classList.remove('story-page');
  document.body.classList.add('collection-page');
  mountNotFound(document.querySelector('#app'));
});
