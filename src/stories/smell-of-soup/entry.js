import { createStoryTemplate } from './template.js';

export async function mount(app) {
  app.innerHTML = createStoryTemplate();
  await import('./index.js');
}
