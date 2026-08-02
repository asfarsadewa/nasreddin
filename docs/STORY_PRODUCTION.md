# Cinematic Story Production Pipeline

This is the repeatable path from “next story” to a production-ready fragment in **Wisdom Short Stories**. It is written for an agent with no prior conversation context.

## 1. Orient and define the story

Inspect the repository before writing:

```powershell
git status --short
rg --files src public/audio scripts
Get-Content src/catalog.js
```

Write a one-paragraph source note covering:

- canonical source or oral tradition;
- popular later title or variants;
- which version this production follows;
- facts that should not be embellished;
- the central contradiction the staging will reveal.

For culturally specific material, use primary sources and an appropriate language/history checker when available. Keep a recognizable popular title if useful, but stage the selected source accurately.

## 2. Make a twelve-beat treatment

Twelve separately voiced beats have proven short enough for a roughly two-minute film and granular enough for camera direction. Adjust only when the story genuinely needs a different rhythm.

For every beat define:

| Field | Purpose |
|---|---|
| speaker | Stable role name in every supported language |
| text | Natural spoken copy, not a literal translation |
| direction | Acting intention, pace, and emotional turn |
| chapter | Roman numeral plus localized chapter name |
| visual action | Character pose, object motion, or environmental response |
| camera | Authored position, target, and field of view |
| sound event | Music transition, ambience, or one-shot SFX |

Read every language aloud. Favor clean breath groups and leave silence for visual or sound punctuation. Subtitle text must later remain identical to the recorded text.

## 3. Create the story module

Required structure:

```text
src/stories/<slug>/
  entry.js       # exports mount(app); imports template, then lazy-loads runtime
  template.js    # accessible DOM shell and language dialog
  story.js       # lines, localized UI, asset roots, camera cue sheet
  audio.js       # loading, schedules, language mapping, music/SFX mix
  world.js       # Three.js scene, characters, semantic animation
  index.js       # controller and input/accessibility wiring
  interface.css  # this story's visual language and responsive states

public/audio/stories/<slug>/
  audio-manifest.json
  voice/zh/manifest.json
  voice/en/manifest.json
  voice/id/manifest.json
  music/
  sfx/

scripts/stories/<slug>/
  generate-music.mjs
  generate-sfx.mjs
```

Add one lazy registry record to `src/catalog.js`. Supply `zh`, `en`, and `id` for title, description, tradition, duration, and format. The `load` function must use a dynamic import.

## 4. Voice production with Gemini TTS

Use one manifest per language and keep character-to-voice casting stable across all lines. Current established casting for **掩耳盗铃** is Charon for narrator, Puck for thief, and Kore for the responding villager in all three languages.

First validate without spending generation quota:

```powershell
$env:PYTHONUTF8='1'
python C:/Users/asfar/.codex/skills/gemini-tts/scripts/gemini_tts.py manifest public/audio/stories/<slug>/voice/zh/manifest.json --out-dir public/audio/stories/<slug>/voice/zh --dry-run
```

Then render each language with `--overwrite` only when regeneration is intended. Never place the API key in a command, manifest, log, or tracked file.

After generation, inspect every file with an audio decoder such as `ffprobe`. Confirm file count, codec, duration, and non-trivial size. Listen to the opening, emotional turn, comic or dramatic pivot, and final line in every language. Regenerate a weak line rather than hiding it beneath music.

## 5. Music and sound design

Plan three music functions:

1. opening identity;
2. low, loop-safe narrative underscore or ambience;
3. ending resolution.

Then list concrete story sounds. Generate only sounds that sharpen an action or spatial idea. Save generation model, prompt summary, duration, output format, and provider identifiers in `audio-manifest.json`.

Mix rules:

- narration connects clearly to the master bus;
- music ducks under active narration and releases smoothly;
- global sound mute controls every bus;
- music mute controls score and bed ambience, not essential diegetic punctuation;
- story-specific perceptual effects should preserve narration intelligibility;
- test simultaneous narration, music, and the loudest SFX for clipping.

## 6. Build the world and camera grammar

Start with an explicit design sentence: palette, material language, time of day, compositional motif, and signature effect. Reusing controls is fine; cloning another story's visual identity is not.

Create low-poly geometry from purposeful silhouettes. Author camera positions and targets in `story.js`; interpolate with eased or centripetal curves. Each shot should answer one of these questions:

- What object matters now?
- Whose belief are we inside?
- What new spatial fact contradicts that belief?
- What image should remain after the final line?

Drive action from `state.index` and `state.localProgress`. This preserves synchronization when voices have different durations and when language changes mid-story. A voice switch should map the current line and local progress into the selected language's timeline.

For **掩耳盗铃**, the signature device is split perception: covering the thief's ears applies a low-pass/level reduction to his world and drains the scene, while luminous bell waves visibly continue beyond the courtyard.

## 7. Interface and language behavior

Voice and subtitle selectors must be separate radio groups. Include every supported language and subtitles off. The visible summary should always show both choices.

Default combinations are deliberate product decisions:

- Story 01, `smell-of-soup`: English voice + Indonesian subtitles.
- Story 02, `yan-er-dao-ling`: Mandarin voice + English subtitles.

Localize title, deck, button states, loading/error messages, chapters, speaker names, ending copy, accessibility labels, and live announcements. Update `<html lang>`, page title, and description where relevant.

Keyboard baseline:

- Space: pause/resume
- M: global mute
- B: background music mute
- C: captions on/off
- Escape: close language dialog

## 8. Validate as a film, not only as a build

Static gates:

```powershell
npm audit --audit-level=high
npm run build
npm run deploy:dry-run
```

Browser matrix:

| Surface | Checks |
|---|---|
| Collection desktop | EN/ZH/ID copy, both cards, hover/focus, lazy loading |
| Collection mobile | no clipping, language control usable, cards readable |
| Story opening | canvas fills viewport, copy fits, load reaches ready |
| Playback | first frame, every chapter, camera continuity, ending/replay |
| Languages | all voices play; all subtitle languages display exact script |
| Controls | pause, global mute, music mute, captions, language dialog |
| Mid-story switch | correct line/progress retained; no doubled sources |
| Mobile story | controls hit-test, captions clear scene, internal scroll starts at top |
| Accessibility | keyboard, focus trap, focus-visible, live announcements, reduced motion |
| Network/console | no failed assets, MIME issues, unhandled errors, or route refresh 404 |

Do not declare production ready based only on source inspection or a successful bundle. Watch the opening, the central turn, and the ending in a real browser, and verify at least one full playback.

## 9. Release only on request

When the user asks to push and deploy:

1. inspect the diff and preserve unrelated work;
2. run the full validation gates;
3. commit intentionally and push the requested branch;
4. deploy with `npm run deploy`;
5. verify `/`, the new story route, a direct asset request, and route refresh on the live Worker;
6. report the commit, remote repository, Worker URL, and concrete smoke results.

Never describe local files as deployed, and never expose provider credentials in release output.
