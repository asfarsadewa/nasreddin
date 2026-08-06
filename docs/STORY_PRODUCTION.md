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
| speaker | Stable role name in English, Chinese, and Indonesian |
| text | Natural spoken copy, not a literal translation |
| direction | Acting intention, pace, and emotional turn |
| chapter | Roman numeral plus localized chapter name |
| visual action | Character pose, object motion, or environmental response |
| camera | Authored position, target, and field of view |
| sound event | Music transition, ambience, or one-shot SFX |

Every story is trilingual by contract: natural English, Chinese, and Indonesian voice acting and subtitles are release requirements, not optional per-story capabilities. Read every language aloud. Favor clean breath groups and leave silence for visual or sound punctuation. Subtitle text must later remain identical to the recorded text; no language may fall back to another.

## 3. Create the story module

Required structure:

```text
src/stories/<slug>/
  entry.js       # exports mount(app); imports template, then lazy-loads runtime
  template.js    # accessible DOM shell and language dialog
  story.js       # lines, localized UI, asset roots, camera cue sheet
  audio.js       # story-specific graph, envelopes, ambience, and SFX atop StoryAudioCore
  world.js       # Three.js scene, characters, semantic animation
  index.js       # creates the shared controller and supplies semantic story hooks
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

Common player mechanics live in `src/shared/story-controller.js`; common timeline, playback, and progressive-loading mechanics live in `src/shared/story-audio.js`. Reuse those two seams. Do not move cameras, worlds, signature effects, story timing, or mix identity into them.

Add one lazy registry record to `src/catalog.js`. Supply `zh`, `en`, and `id` for title, description, tradition, duration, and format. The `load` function must use a dynamic import.

## 4. Voice production with Gemini TTS

Use one manifest for each required language (`en`, `zh`, and `id`) and keep character-to-voice casting stable across all lines. Current established casting for **掩耳盗铃** is Charon for narrator, Puck for thief, and Kore for the responding villager in all three languages.

The committed WAVs and manifests are the repository contract. The optional `gemini-tts` Codex skill is maintainer-local tooling, not a runtime dependency and not something to vendor into this project. Its installation path is machine-specific. A contributor who is not regenerating voices needs no provider account or skill installation.

First validate without spending generation quota:

```powershell
$env:PYTHONUTF8='1'
python <path-to-local-gemini-tts-skill>/scripts/gemini_tts.py manifest public/audio/stories/<slug>/voice/zh/manifest.json --out-dir public/audio/stories/<slug>/voice/zh --dry-run
```

Then render each language with `--overwrite` only when regeneration is intended. Never place the API key in a command, manifest, log, or tracked file.

Repeat the dry run and render for `voice/en/manifest.json`, `voice/zh/manifest.json`, and `voice/id/manifest.json`. A story is incomplete until all three directories contain one decodable WAV per scripted beat.

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
- score presence is a release requirement, not an asset-presence checkbox: during a full playback, toggle music off and on at the opening, middle underscore, and ending, and confirm each change is plainly audible on ordinary speakers without masking speech;
- inspect the effective signal path—source loudness, cue envelope, narration duck, story filter, and master gain together—because individually valid settings can multiply into an inaudible mix;
- global sound mute controls every bus;
- music mute controls score and bed ambience, not essential diegetic punctuation;
- story-specific perceptual effects should preserve narration intelligibility;
- test simultaneous narration, music, and the loudest SFX for clipping.

Loading rules:

- prepare only the intentional default/selected voice, score, and essential SFX before enabling Start;
- begin idle-time prefetch of the other voices only after playback starts;
- deduplicate on-demand and background requests through `StoryAudioCore.ensureLanguage()`;
- show localized progress in the language panel only if a visitor requests a voice that is still loading;
- a failed background prefetch must not interrupt current playback and an on-demand retry must remain possible.

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

Voice and subtitle selectors must be separate radio groups. Include English, Chinese, Indonesian, and subtitles off. The visible summary should always show both choices.

Default combinations are deliberate product decisions:

- Story 01, `smell-of-soup`: English voice + Indonesian subtitles.
- Story 02, `yan-er-dao-ling`: Mandarin voice + English subtitles.
- Story 03, `tiger-and-dried-persimmon`: Indonesian voice + Chinese subtitles.
- Story 04, `anansi-and-the-pot`: English voice + Indonesian subtitles.
- Story 05, `si-kancil-dan-buaya`: Indonesian voice + English subtitles.
- Story 06, `moon-in-the-well`: Mandarin voice + Indonesian subtitles.

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
npm test
npm audit --audit-level=high
npm run build
npm run test:e2e
npm run deploy:dry-run
```

Browser matrix:

| Surface | Checks |
|---|---|
| Collection desktop | EN/ZH/ID copy, all cards, hover/focus, lazy loading |
| Collection mobile | no clipping, language control usable, cards readable |
| Story opening | canvas fills viewport, copy fits, load reaches ready |
| Playback | first frame, every chapter, camera continuity, ending/replay |
| Languages | all voices play; all subtitle languages display exact script |
| Controls | pause, global mute, music mute, captions, language dialog; music off/on is plainly audible at opening, middle, and ending |
| Mid-story switch | correct line/progress retained; no doubled sources |
| Mobile story | controls hit-test, captions clear scene, internal scroll starts at top |
| Accessibility | keyboard, focus trap, focus-visible, live announcements, reduced motion |
| Network/console | no failed assets, MIME issues, unhandled errors; registered routes refresh, unknown routes return authored 404s |

Do not declare production ready based only on source inspection or a successful bundle. The Playwright suite is the repeatable browser floor; still watch the opening, the central turn, and the ending in a real browser, and verify at least one full playback for a new production.

## 9. Release only on request

When the user asks to push and deploy:

1. inspect the diff and preserve unrelated work;
2. run the full validation gates;
3. commit intentionally and push the requested branch;
4. add route-specific title, description, canonical URL, Open Graph, and Twitter metadata in `worker/index.js`;
5. update the 1200×630 sharing banner and its `public/social/manifest.json` provenance only when the collection artwork needs to change;
6. deploy with `npm run deploy`;
7. verify `/`, the new story route, a direct asset request, route refresh, raw crawler metadata, and the social image on `https://stories.asfar.family/`;
8. report the commit, remote repository, Worker URL, custom domain, and concrete smoke results.

Never describe local files as deployed, and never expose provider credentials in release output.
