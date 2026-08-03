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
  await expect(page.locator('.story-card')).toHaveCount(3);
  await expect(page.locator('[data-story-count]')).toHaveText('3 stories');
  await page.locator('[data-site-language="id"]').click();
  await expect(page.locator('#collection-title')).toContainText('Kumpulan KisahTeladan');
  await expect(page.locator('[data-story-count]')).toHaveText('3 kisah');
  await page.locator('[data-site-language="zh"]').click();
  await expect(page.locator('#collection-title')).toContainText('智慧短篇');
  await expect(page.locator('[data-story-count]')).toHaveText('3 则故事');
  await page.locator('[data-site-language="en"]').click();
  await expect(page.locator('[data-story-count]')).toHaveText('3 stories');
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

test('The Tiger and the Dried Persimmon keeps every voice, subtitle, and playback control independent', async ({ page }) => {
  const failures = watchApplicationFailures(page);
  await page.goto('/stories/tiger-and-dried-persimmon/');
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
  await page.locator('[data-subtitle="zh"]').click();
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
