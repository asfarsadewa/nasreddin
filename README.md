# The Smell of Soup & The Sound of Money

A cinematic Three.js retelling of the Nasreddin Hodja folktale. Four Gemini TTS voices drive fully acted English and Indonesian performances with chapter cues, independent bilingual subtitles, character blocking, an audio-reactive coin moment, an original ElevenLabs score, and a smooth camera path through a moonlit Akşehir market.

[Watch the story on Cloudflare Workers](https://nasreddin.asfar-sadewa-0c2.workers.dev/)

The story opens with English voice acting and Indonesian subtitles by default. The language sheet lets the listener combine either English or Indonesian voice acting with English subtitles, Indonesian subtitles, or no subtitles. A mid-story voice switch preserves the current scene and animation beat.

## Run it

```bash
npm install
npm run dev
```

Build the production bundle with:

```bash
npm run build
```

Deploy the production build as a Cloudflare Worker with static assets:

```bash
npm run deploy:dry-run
npm run deploy
```

## Controls

- Space: pause or resume
- M: mute or unmute
- B: mute or unmute background music
- C: show or hide captions

## Voice assets

The exact narration scripts, Gemini voices, and performance directions live in `public/audio/story/manifest.json` and `public/audio/story/id/manifest.json`. To regenerate the WAV files, set `GEMINI_API_KEY`, then run:

```bash
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/story/manifest.json --out-dir public/audio/story --overwrite
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/story/id/manifest.json --out-dir public/audio/story/id --overwrite
```

## Music assets

The opening theme, looping market ambience, and ending theme are original instrumental cues generated with ElevenLabs Music v2. Their metadata lives in `public/audio/music/manifest.json`. To regenerate all three MP3 files, set `ELEVENLABS_API_KEY`, then run:

```bash
npm run audio:music
```

The Web Audio mix crossfades cues on the story timeline and ducks the score beneath narration. The music-note button controls the score independently from the global sound control.
