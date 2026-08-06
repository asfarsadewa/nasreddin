# Story 06 — The Moon in the Well

## Source note

“The Moon in the Well” is a widely travelled fool-tale motif catalogued as ATU 1335A. This production follows the Turkish Nasreddin Hodja formulation recorded by Albert Wesselski in *Der Hodscha Nasreddin*, volume 1 (1911), no. 124: Hodja sees the full moon reflected in a well, lowers a rope and hook, catches a rock, falls backward when the rope breaks, sees the moon overhead, and congratulates himself on the rescue. D. L. Ashliman’s [comparative tale index and English translation](https://sites.pitt.edu/~dash/type1335a.html) identifies the Wesselski source and related 19th-century English collections. A later [Saudi Aramco World retelling](https://archive.aramcoworld.com/issue/199705/tales.of.the.hoja.htm) uses a bucket rather than a hook and lets it pull free rather than breaking the rope; those are treated here as later variant details.

The telling tradition belongs to the broader, multi-country Nasreddin Hodja / Molla Nesreddin / Apendi anecdote tradition. The story does not establish a dynasty, date, named ruler, or exact place, so this production uses an intentionally non-specific stone courtyard and well at night. Nasreddin retains the familiar wrapped headcloth and robe as a readable folk-stage silhouette, without claiming a period reconstruction. The contradiction stays visual rather than moralized: the reflection breaks below while the untouched moon is revealed above.

## Twelve-beat treatment

| Beat | Action and sound | Camera intention |
|---|---|---|
| 1 | Nasreddin crosses a silent courtyard beneath the full moon. | Descend from moonlit sky to the small human figure and well. |
| 2 | He leans over; the procedural reflection quivers far below. | Cross the rim and look vertically down into the second sky. |
| 3 | He declares that the moon has fallen. | Reverse from inside the shaft, making his face eclipse the real sky. |
| 4 | Nasreddin promises to rescue his “old friend.” | Close on rope, hands, and complete conviction. |
| 5 | Hook and camera descend together; silver rings split the reflection. | Travel down the well as if entering Nasreddin’s mistaken reality. |
| 6 | Iron catches stone. | Macro view at water level: hook, stone, and fractured moon share one plane. |
| 7 | “I have you!” | Side profile turns the rope into a taut diagonal across the frame. |
| 8 | He braces and pulls; rope fibres strain. | Low shot makes the well appear to pull back. |
| 9 | He insists the world needs its moon. | Return inside the shaft, with rope leading up to his effort. |
| 10 | Rope snaps; Nasreddin falls; reflection shatters. | Overhead fall collapses into a ground-level landing. |
| 11 | From his back, he sees the real moon. | First-person view makes the full moon the only stable object. |
| 12 | He praises the successful rescue and rubs his back. | Pull away until well, man, and moon settle into one quiet vertical axis. |

## Visual and interaction direction

- Palette: ink `#050712`, wet slate `#263244`, moonmilk `#EEF4E2`, reflection blue `#9FC4CF`, copper rope `#C88949`, and pomegranate robe `#812B36`.
- Material language: faceted stone, matte cloth, oxidized iron, pale water light, and restrained bloom.
- Typography: Eczar for the impossible storybook scale, Manrope for readable controls, and IBM Plex Mono for the vertical sky / stone / water / moon depth notation.
- Signature effect: a custom shader renders the moon as a living reflection rather than a flat prop. Semantic hook, strain, snap, and settling states distort it independently of wall-clock time.
- The authored camera moves above, inside, and below the well mouth. There is no orbit control.
- Reduced motion keeps every narrative state but removes tremor, drift, and secondary camera sway.

## Language and audio decisions

- Intentional default: Mandarin voice (`zh`) with Indonesian subtitles (`id`).
- Voice cast, kept continuous with Story 01: Charon as Narrator and Orus as Nasreddin in English, Mandarin, and Indonesian.
- All subtitle strings in `src/stories/moon-in-the-well/story.js` must remain byte-for-byte equal to the corresponding manifest text.
- Three score functions: moonlit opening identity, a low deep-water rescue underscore, and the airy comic release when the real moon is revealed.
- Essential diegetic cues: quiet courtyard/well ambience, descending rope and hook, iron catching stone, rope strain and snap, and the backward landing with water ripples.
