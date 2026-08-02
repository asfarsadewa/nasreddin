import './styles.css';
import { findStory, normalizePath } from './catalog.js';
import { mountCollection, mountNotFound } from './collection.js';

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
