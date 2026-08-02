# Wisdom Short Stories — Agent Contract

This repository is a collection of short, self-contained cinematic story modules. A cold agent should preserve the collection architecture and complete the whole story experience—not merely add a card or a Three.js scene.

Before changing a story, read:

1. `src/catalog.js`
2. `docs/STORY_PRODUCTION.md`
3. The nearest completed story under `src/stories/`
4. That story's voice manifests and `audio-manifest.json`

## Non-negotiable architecture

- `/` is the lightweight collection. It must not eagerly import Three.js or story audio.
- Story routes are `/stories/<slug>/` and are registered once in `src/catalog.js`.
- `src/stories/<slug>/entry.js` exports `mount(app)` and lazy-loads the story runtime.
- A story owns its `template.js`, `story.js`, `audio.js`, `world.js`, `index.js`, and `interface.css`.
- Generated media belongs under `public/audio/stories/<slug>/`; generation scripts belong under `scripts/stories/<slug>/`.
- Do not share mutable runtime state between stories. Reusable infrastructure may be extracted only after at least two stories genuinely need the same behavior.

## Language and copy

- The collection interface and every catalog record must have complete `en`, `zh`, and `id` copy. No language may fall back silently to another.
- Each story declares the languages it supports. Voice and subtitles are independent controls, including an `off` subtitle choice.
- Put all spoken text, speaker names, chapter names, and interface copy in `story.js`; do not scatter user-facing strings through controllers.
- Subtitles in a given language must exactly match that language's recorded manifest.
- Set and document an intentional default voice and subtitle combination for every story.
- Chinese pages use `zh-CN`; Indonesian uses `id`; English uses `en`.
- Copy should sound written in each language, not mechanically translated. Check titles, idioms, punctuation, rhythm, and culturally specific names with a fluent reviewer or a suitable language/fact-checking tool.

## Canon and cultural treatment

- Establish a short source note before scripting: canonical source or tradition, common later variants, uncertain details, and visual facts that must be preserved.
- Do not invent a dynasty, location, named historical person, costume specificity, or moral framing unless supported by the chosen source.
- Prefer the story's contradiction and action over explanatory moralizing.
- For `yan-er-dao-ling`, the familiar title is 掩耳盗铃, while the older account in `吕氏春秋·自知` describes stealing a large bronze bell/钟. Keep the famous title and the substantial hanging bell.

## Audio contract

- Voice files are per line: `public/audio/stories/<slug>/voice/<lang>/<number>_<speaker>_<cue>.wav`.
- Preserve the text, direction, speaker, voice, locale, and output filename in each language manifest.
- Run Gemini TTS manifests in dry-run mode before rendering. On Windows, use `$env:PYTHONUTF8='1'` for Chinese output.
- Verify all rendered WAVs exist, decode, and have plausible non-zero duration.
- Music and SFX must be original/licensed for production use. Save generation metadata in `audio-manifest.json`; never commit or print API keys.
- The mix must duck music under speech, keep the global mute separate from the music control, and avoid clipping on simultaneous cues.

## Cinematic and runtime quality

- Give every story its own visual grammar, palette, signature transition, and camera cue sheet.
- Cameras must ease between authored poses. Avoid uncontrolled orbit-camera behavior, abrupt cuts, and constant motion without narrative purpose.
- Tie character motion and effects to semantic line progress, not arbitrary wall-clock time.
- Keep the collection fast: story code, Three.js, voices, score, and SFX load only after navigation to the story route.
- Support desktop and narrow mobile layouts, keyboard controls, reduced motion, focus trapping in dialogs, live text announcements, and independent captions.
- Do not add raster imagery when a procedural world communicates the story better. If imagery is required, record its provenance and optimization in the story notes.

## Definition of done

- `npm audit --audit-level=high`
- `npm run build`
- `npm run deploy:dry-run`
- Browser-check `/`, all three collection languages, the new story route, every voice and subtitle option, playback/pause/replay/mute/music, desktop, and mobile.
- Confirm no browser console errors, failed media requests, clipped controls, or route refresh failures.
- Push or deploy only when the user asks. When asked, verify the remote commit and the live Worker route directly.

The complete repeatable pipeline, templates, and checklists are in `docs/STORY_PRODUCTION.md`.
