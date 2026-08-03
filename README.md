# Wisdom Short Stories

A multilingual collection of timeless tales retold as short cinematic web experiences. The collection landing page stays lightweight; each story owns and lazy-loads its visual world, performance, subtitles, music, and interaction code.

- [Open the collection](https://stories.asfar.family/)
- [Watch Story 01: The Smell of Soup & The Sound of Money](https://stories.asfar.family/stories/smell-of-soup/)
- [Watch Story 02: 掩耳盗铃](https://stories.asfar.family/stories/yan-er-dao-ling/)
- Story 03 is in local production: The Tiger and the Dried Persimmon

The first story is a Three.js retelling of the Nasreddin Hodja folktale with fully acted English, Mandarin, and Indonesian performances. The second retells the Chinese fable 掩耳盗铃 with the same three-language voice-and-subtitle contract, a moonlit bronze-bell courtyard, a perceptual muffling sequence, original music, and authored cinematic cameras. The third brings the Korean folktale 호랑이와 곶감 into an ink-and-hanji mountain night built around instanced persimmons, pines, roof tiles, and tiger stripes.

Default playback is English voice + Indonesian subtitles for Story 01, Mandarin voice + English subtitles for Story 02, and Indonesian voice + Chinese subtitles for Story 03.

## Run it

```bash
npm install
npm run dev
```

Run the deterministic contract and media-integrity suite:

```bash
npm test
npm run check
```

The suite uses Node's built-in test runner with concurrency fixed to one. It performs no network or provider calls and validates catalog routing, localization completeness, progressive audio loading, shared-runtime boundaries, story timelines, template defaults, voice-manifest/subtitle parity, WAV structure, MP3 assets, and generation provenance.

Run the Chromium journey tests against the local Cloudflare Worker:

```bash
npx playwright install chromium
npm run test:e2e
```

These tests exercise the collection, both story players, Start and pause, on-demand voice switching, background language prefetch, same-origin asset delivery, and the true-404 fallback. They are also run by `.github/workflows/ci.yml`.

Build or deploy the Cloudflare Worker with static assets:

```bash
npm run build
npm run deploy:dry-run
npm run deploy
```

## Collection architecture

- `src/app.js` resolves the current collection or story route.
- `src/catalog.js` is the trilingual registry for story metadata and lazy loaders.
- `src/collection.js` renders and localizes the collection and not-found pages.
- `src/shared/story-controller.js` owns the proven common player behavior: controls, captions, dialogs, localization, progress, endings, and voice switching.
- `src/shared/story-audio.js` owns timeline mapping, playback state, score scheduling primitives, and progressive voice loading.
- `src/stories/<slug>/` contains one story's template, data, visual world, semantic effect hooks, score envelopes, audio graph details, and styles.
- `public/audio/stories/<slug>/` contains namespaced English, Chinese, and Indonesian voice, music, SFX, and generation metadata.
- `worker/index.js` serves route-specific canonical and social metadata at the custom production domain.

To add another story:

1. Create a self-contained folder under `src/stories/<slug>/` with an `entry.js` that exports `mount(app)`.
2. Add one record to `STORIES` in `src/catalog.js`, supplying complete English, Chinese, and Indonesian metadata plus its lazy loader.
3. Ship complete English, Chinese, and Indonesian voice acting, subtitles, UI copy, and manifests; partial language stories fail the deterministic contracts.
4. Extend the two small shared runtime primitives for genuinely common player behavior; keep worlds, cameras, timing hooks, effects, mix decisions, and visual identity story-local.
5. Register authored crawler metadata for the route in `worker/index.js`.

The root bundle deliberately does not import Three.js or story audio. Those are downloaded only after a visitor chooses the relevant story.

On a story route, preparation downloads only the selected/default voice plus its score and essential effects. Start is enabled at that point. The other two performances are prefetched during playback in browser idle time; an early language switch reuses that work or shows a compact progress state while the requested performance finishes.

Read [AGENTS.md](AGENTS.md) for the repository contract and [docs/STORY_PRODUCTION.md](docs/STORY_PRODUCTION.md) for the complete cold-start production pipeline.

## Story controls

- Space: pause or resume
- M: mute or unmute all sound
- B: mute or unmute background music
- C: show or hide captions

## Voice assets

All production WAVs are committed. A contributor can run, test, and extend the application without Gemini, ElevenLabs, provider keys, or any Codex skill installed.

The narration scripts, Gemini voices, and performance directions for each story live under `public/audio/stories/<slug>/voice/{en,zh,id}/manifest.json`. Maintainers generated them with the optional, locally installed `gemini-tts` Codex skill. That skill is maintainer-local tooling: it is not part of this repository, is not required to run or test the site, and may live at a different path on every machine. The repository owns the durable manifests, generated WAVs, filenames, and provenance. To regenerate a voice, install the skill locally, set `GEMINI_API_KEY`, dry-run first, and substitute your own local skill path:

```bash
python <path-to-local-gemini-tts-skill>/scripts/gemini_tts.py manifest public/audio/stories/<slug>/voice/<lang>/manifest.json --out-dir public/audio/stories/<slug>/voice/<lang> --dry-run
python <path-to-local-gemini-tts-skill>/scripts/gemini_tts.py manifest public/audio/stories/<slug>/voice/<lang>/manifest.json --out-dir public/audio/stories/<slug>/voice/<lang> --overwrite
```

Each story records combined generation provenance in its namespaced `audio-manifest.json`.

## Music assets

The original instrumental cues were generated with ElevenLabs Music v2. Sound effects were prompt-designed with the optional, locally installed `sound-effects` Codex skill. Both are maintainer-local production tools, not runtime dependencies. Unlike the local skills, the executable ElevenLabs generation scripts and complete prompts are repository-owned and namespaced under `scripts/stories/<slug>/`; generated metadata lives under `public/audio/stories/<slug>/`. To regenerate MP3 files, no Codex skill path is needed: set `ELEVENLABS_API_KEY`, then run the relevant repository script.

```bash
npm run audio:music
```

The Web Audio mix crossfades cues on the story timeline and ducks the score beneath narration. The music-note button controls the score independently from the global sound control.

Story 02's namespaced music and effects can be regenerated with:

```bash
npm run audio:music:yan-er-dao-ling
npm run audio:sfx:yan-er-dao-ling
```

Story 03 uses the same repository-owned boundary:

```bash
npm run audio:music:tiger-and-dried-persimmon
npm run audio:sfx:tiger-and-dried-persimmon
```
