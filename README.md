# Wisdom Short Stories

A multilingual collection of timeless tales retold as short cinematic web experiences. The collection landing page stays lightweight; each story owns and lazy-loads its visual world, performance, subtitles, music, and interaction code.

- [Open the collection](https://nasreddin.asfar-sadewa-0c2.workers.dev/)
- [Watch Story 01: The Smell of Soup & The Sound of Money](https://nasreddin.asfar-sadewa-0c2.workers.dev/stories/smell-of-soup/)
- Story 02 (local, not deployed yet): `/stories/yan-er-dao-ling/`

The first story is a Three.js retelling of the Nasreddin Hodja folktale with fully acted English and Indonesian performances. The second retells the Chinese fable 掩耳盗铃 with Mandarin, English, and Indonesian voice acting and subtitles, a moonlit bronze-bell courtyard, a perceptual muffling sequence, original music, and authored cinematic cameras.

Default playback is English voice + Indonesian subtitles for Story 01, and Mandarin voice + English subtitles for Story 02.

## Run it

```bash
npm install
npm run dev
```

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
- `public/audio/stories/<slug>/` contains namespaced voice, music, SFX, and generation metadata for newer stories.

To add another story:

1. Create a self-contained folder under `src/stories/<slug>/` with an `entry.js` that exports `mount(app)`.
2. Add one record to `STORIES` in `src/catalog.js`, supplying complete English, Chinese, and Indonesian metadata plus its lazy loader.
3. Keep story-specific code and assets inside that module or its clearly named public asset directory.

The root bundle deliberately does not import Three.js or story audio. Those are downloaded only after a visitor chooses the relevant story.

Read [AGENTS.md](AGENTS.md) for the repository contract and [docs/STORY_PRODUCTION.md](docs/STORY_PRODUCTION.md) for the complete cold-start production pipeline.

## Story controls

- Space: pause or resume
- M: mute or unmute all sound
- B: mute or unmute background music
- C: show or hide captions

## Voice assets

The narration scripts, Gemini voices, and performance directions for Story 01 live in `public/audio/story/manifest.json` and `public/audio/story/id/manifest.json`. To regenerate the WAV files, set `GEMINI_API_KEY`, then run:

```bash
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/story/manifest.json --out-dir public/audio/story --overwrite
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/story/id/manifest.json --out-dir public/audio/story/id --overwrite
```

Story 02 uses one manifest per language under `public/audio/stories/yan-er-dao-ling/voice/{zh,en,id}/`. Its combined generation provenance is recorded in `public/audio/stories/yan-er-dao-ling/audio-manifest.json`.

## Music assets

The opening theme, looping market ambience, and ending theme are original instrumental cues generated with ElevenLabs Music v2. Their metadata lives in `public/audio/music/manifest.json`, and the generator is namespaced under `scripts/stories/smell-of-soup/`. To regenerate the MP3 files, set `ELEVENLABS_API_KEY`, then run:

```bash
npm run audio:music
```

The Web Audio mix crossfades cues on the story timeline and ducks the score beneath narration. The music-note button controls the score independently from the global sound control.

Story 02's namespaced music and effects can be regenerated with:

```bash
npm run audio:music:yan-er-dao-ling
npm run audio:sfx:yan-er-dao-ling
```
