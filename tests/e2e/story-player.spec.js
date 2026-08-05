import { expect, test } from '@playwright/test';

function watchApplicationFailures(page) {
  const failures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin === 'http://127.0.0.1:4175') {
      failures.push(`request: ${request.url()} (${request.failure()?.errorText ?? 'failed'})`);
    }
  });
  page.on('response', (response) => {
    if (new URL(response.url()).origin === 'http://127.0.0.1:4175' && response.status() >= 400) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });
  return failures;
}

test('the collection count follows the catalogue and the Indonesian identity is first-class', async ({ page }) => {
  const failures = watchApplicationFailures(page);
  await page.goto('/');
  await expect(page.locator('.story-card')).toHaveCount(5);
  await expect(page.locator('[data-story-count]')).toHaveText('5 stories');
  await page.locator('[data-site-language="id"]').click();
  await expect(page.locator('#collection-title')).toContainText('Kumpulan KisahTeladan');
  await expect(page.locator('[data-story-count]')).toHaveText('5 kisah');
  await page.locator('[data-site-language="zh"]').click();
  await expect(page.locator('#collection-title')).toContainText('智慧短篇');
  await expect(page.locator('[data-story-count]')).toHaveText('5 则故事');
  await page.locator('[data-site-language="en"]').click();
  await expect(page.locator('[data-story-count]')).toHaveText('5 stories');
  expect(failures).toEqual([]);
});

const stories = [
  {
    name: 'The Smell of Soup',
    path: '/stories/smell-of-soup/',
    initialVoice: 'en',
    switchVoice: 'zh',
  },
  {
    name: '掩耳盗铃',
    path: '/stories/yan-er-dao-ling/',
    initialVoice: 'zh',
    switchVoice: 'en',
  },
  {
    name: 'The Tiger and the Dried Persimmon',
    path: '/stories/tiger-and-dried-persimmon/',
    initialVoice: 'id',
    switchVoice: 'zh',
  },
  {
    name: 'Anansi and the Pot',
    path: '/stories/anansi-and-the-pot/',
    initialVoice: 'en',
    switchVoice: 'id',
  },
  {
    name: 'Si Kancil dan Buaya',
    path: '/stories/si-kancil-dan-buaya/',
    initialVoice: 'id',
    switchVoice: 'en',
  },
];

for (const story of stories) {
  test(`${story.name} starts after one voice, switches languages, and pauses cleanly`, async ({ page }) => {
    const failures = watchApplicationFailures(page);
    const voiceRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('/voice/')) voiceRequests.push(request.url());
    });
    await page.route(`**/voice/${story.switchVoice}/*.wav`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      await route.continue();
    });

    await page.goto(story.path);
    await expect(page.locator('#begin')).toBeEnabled({ timeout: 30_000 });
    expect(voiceRequests.length).toBeGreaterThan(0);
    expect(voiceRequests.every((url) => url.includes(`/voice/${story.initialVoice}/`))).toBe(true);
    await expect(page.locator(`[data-voice="${story.initialVoice}"]`)).toHaveAttribute('data-audio-ready', 'true');

    await page.locator('.language-launch--opening').click();
    const alternate = page.locator(`[data-voice="${story.switchVoice}"]`);
    await alternate.click();
    await expect(alternate).toHaveClass(/is-loading/);
    await expect(alternate).toHaveAttribute('aria-busy', 'true');
    await expect(alternate).toHaveAttribute('aria-checked', 'true', { timeout: 30_000 });
    await expect(alternate).toHaveAttribute('data-audio-ready', 'true');
    await page.locator('#language-close').click();

    await page.locator('#begin').click();
    await expect(page.locator('#opening')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#play-toggle')).toBeVisible();
    await page.locator('#play-toggle').click();
    await expect(page.locator('#play-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-voice][data-audio-ready="true"]')).toHaveCount(3, { timeout: 30_000 });
    expect(failures).toEqual([]);
  });
}

test('Si Kancil dan Buaya keeps every voice, subtitle, and playback control independent', async ({ page }) => {
  test.setTimeout(90_000);
  const failures = watchApplicationFailures(page);
  await page.goto('/stories/si-kancil-dan-buaya/');
  await expect(page.locator('#begin')).toBeEnabled({ timeout: 30_000 });
  await page.locator('.language-launch--opening').click();

  for (const language of ['en', 'zh', 'id']) {
    const choice = page.locator(`[data-voice="${language}"]`);
    if (await choice.getAttribute('aria-checked') !== 'true') await choice.click();
    await expect(choice).toHaveAttribute('aria-checked', 'true', { timeout: 30_000 });
    await expect(choice).toHaveAttribute('data-audio-ready', 'true');
  }

  for (const language of ['en', 'zh', 'id', 'off']) {
    const choice = page.locator(`[data-subtitle="${language}"]`);
    await choice.click();
    await expect(choice).toHaveAttribute('aria-checked', 'true');
  }
  await page.locator('[data-subtitle="en"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#language-panel')).toBeHidden();

  await page.locator('#begin').click();
  await expect(page.locator('#opening')).toHaveAttribute('aria-hidden', 'true');

  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#music-toggle').click();
  await expect(page.locator('#music-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#music-toggle').click();
  await expect(page.locator('#music-toggle')).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#caption-toggle').click();
  await expect(page.locator('#caption-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#caption-toggle').click();
  await expect(page.locator('#caption-toggle')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#play-toggle').click();
  await expect(page.locator('#play-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#play-toggle').click();
  await expect(page.locator('#play-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(failures).toEqual([]);
});

test('Si Kancil dan Buaya keeps its mobile opening, dialog, captions, and controls inside a narrow viewport', async ({ page }) => {
  const failures = watchApplicationFailures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/stories/si-kancil-dan-buaya/');
  await expect(page.locator('#begin')).toBeEnabled({ timeout: 30_000 });

  const openingLayout = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom } : null;
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      title: box('#story-title'),
      begin: box('#begin'),
      language: box('.language-launch--opening'),
      canvas: box('#canvas-stage canvas'),
    };
  });
  expect(openingLayout.documentWidth).toBeLessThanOrEqual(openingLayout.viewport.width);
  for (const element of [openingLayout.title, openingLayout.begin, openingLayout.language, openingLayout.canvas]) {
    expect(element).not.toBeNull();
    expect(element.x).toBeGreaterThanOrEqual(0);
    expect(element.right).toBeLessThanOrEqual(openingLayout.viewport.width + 1);
  }
  expect(openingLayout.begin.bottom).toBeLessThanOrEqual(openingLayout.viewport.height);
  if (process.env.CAPTURE_VISUALS) await page.screenshot({ path: 'test-results/kancil-mobile-opening.png' });

  await page.locator('.language-launch--opening').click();
  await expect(page.locator('#language-panel')).toBeVisible();
  const panelLayout = await page.locator('#language-panel').evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    return { x: rect.x, width: rect.width, right: rect.right, top: rect.top, bottom: rect.bottom, scrollTop: panel.scrollTop };
  });
  expect(panelLayout.x).toBeGreaterThanOrEqual(0);
  expect(panelLayout.right).toBeLessThanOrEqual(391);
  expect(panelLayout.top).toBeGreaterThanOrEqual(0);
  expect(panelLayout.bottom).toBeLessThanOrEqual(845);
  expect(panelLayout.scrollTop).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#language-panel')).toBeHidden();

  await page.locator('#begin').click();
  await expect(page.locator('#opening')).toHaveAttribute('aria-hidden', 'true');
  await page.waitForTimeout(1_000);
  const playbackLayout = await page.evaluate(() => {
    const caption = document.querySelector('#captions')?.getBoundingClientRect();
    const controls = [...document.querySelectorAll('.hud__actions button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, right: rect.right };
    });
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      caption: caption ? { x: caption.x, width: caption.width, right: caption.right, bottom: caption.bottom } : null,
      controls,
    };
  });
  expect(playbackLayout.documentWidth).toBeLessThanOrEqual(playbackLayout.viewportWidth);
  expect(playbackLayout.caption.x).toBeGreaterThanOrEqual(0);
  expect(playbackLayout.caption.right).toBeLessThanOrEqual(playbackLayout.viewportWidth + 1);
  for (const control of playbackLayout.controls) {
    expect(control.width).toBeGreaterThanOrEqual(39);
    expect(control.height).toBeGreaterThanOrEqual(39);
    expect(control.right).toBeLessThanOrEqual(playbackLayout.viewportWidth + 1);
  }
  if (process.env.CAPTURE_VISUALS) await page.screenshot({ path: 'test-results/kancil-mobile-playback.png' });
  expect(failures).toEqual([]);
});

test('an unregistered HTML route is a crawler-safe 404', async ({ page }) => {
  const response = await page.goto('/stories/not-on-the-shelf/');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Story Not Found | Wisdom Short Stories');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://stories.asfar.family/stories/not-on-the-shelf/',
  );
  await expect(page.locator('.not-found')).toBeVisible();
});
