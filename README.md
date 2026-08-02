# Wisdom Short Stories

A multilingual collection of timeless tales retold as short cinematic web experiences. The collection landing page stays lightweight; each story owns and lazy-loads its visual world, performance, subtitles, music, and interaction code.

- [Open the collection](https://stories.asfar.family/)
- [Watch Story 01: The Smell of Soup & The Sound of Money](https://stories.asfar.family/stories/smell-of-soup/)
- [Watch Story 02: 掩耳盗铃](https://stories.asfar.family/stories/yan-er-dao-ling/)

The first story is a Three.js retelling of the Nasreddin Hodja folktale with fully acted English, Mandarin, and Indonesian performances. The second retells the Chinese fable 掩耳盗铃 with the same three-language voice-and-subtitle contract, a moonlit bronze-bell courtyard, a perceptual muffling sequence, original music, and authored cinematic cameras.

Default playback is English voice + Indonesian subtitles for Story 01, and Mandarin voice + English subtitles for Story 02.

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

The suite uses Node's built-in test runner with concurrency fixed to one. It performs no network or provider calls and validates catalog routing, localization completeness, lazy-loading boundaries, story timelines, template defaults, voice-manifest/subtitle parity, WAV structure, MP3 assets, and generation provenance.

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
- `src/stories/<slug>/` contains one story's template, runtime, data, audio orchestration, world, and styles.
- `public/audio/stories/<slug>/` contains namespaced English, Chinese, and Indonesian voice, music, SFX, and generation metadata.
- `worker/index.js` serves route-specific canonical and social metadata at the custom production domain.

To add another story:

1. Create a self-contained folder under `src/stories/<slug>/` with an `entry.js` that exports `mount(app)`.
2. Add one record to `STORIES` in `src/catalog.js`, supplying complete English, Chinese, and Indonesian metadata plus its lazy loader.
3. Ship complete English, Chinese, and Indonesian voice acting, subtitles, UI copy, and manifests; partial language stories fail the deterministic contracts.
4. Keep story-specific code and assets inside that module or its clearly named public asset directory.
5. Register authored crawler metadata for the route in `worker/index.js`.

The root bundle deliberately does not import Three.js or story audio. Those are downloaded only after a visitor chooses the relevant story.

Read [AGENTS.md](AGENTS.md) for the repository contract and [docs/STORY_PRODUCTION.md](docs/STORY_PRODUCTION.md) for the complete cold-start production pipeline.

## Story controls

- Space: pause or resume
- M: mute or unmute all sound
- B: mute or unmute background music
- C: show or hide captions

## Voice assets

The narration scripts, Gemini voices, and performance directions for each story live under `public/audio/stories/<slug>/voice/{en,zh,id}/manifest.json`. To regenerate Story 01, set `GEMINI_API_KEY`, dry-run each manifest first, then run:

```bash
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/stories/smell-of-soup/voice/en/manifest.json --out-dir public/audio/stories/smell-of-soup/voice/en --overwrite
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/stories/smell-of-soup/voice/zh/manifest.json --out-dir public/audio/stories/smell-of-soup/voice/zh --overwrite
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/stories/smell-of-soup/voice/id/manifest.json --out-dir public/audio/stories/smell-of-soup/voice/id --overwrite
```

Each story records combined generation provenance in its namespaced `audio-manifest.json`.

## Music assets

The opening theme, looping market ambience, and ending theme are original instrumental cues generated with ElevenLabs Music v2. Story 01 metadata lives under `public/audio/stories/smell-of-soup/`, and its generator is namespaced under `scripts/stories/smell-of-soup/`. To regenerate the MP3 files, set `ELEVENLABS_API_KEY`, then run:

```bash
npm run audio:music
```

The Web Audio mix crossfades cues on the story timeline and ducks the score beneath narration. The music-note button controls the score independently from the global sound control.

Story 02's namespaced music and effects can be regenerated with:

```bash
npm run audio:music:yan-er-dao-ling
npm run audio:sfx:yan-er-dao-ling
```
