import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const cues = [
  {
    file: 'ink-moon-opening.mp3',
    durationMs: 28000,
    prompt: `Original instrumental cinematic opening for a Korean folktale unfolding on a cold mountain-village night. Begin with one dry buk frame-drum touch, a low gayageum harmonic, and a distant breath of daegeum. Introduce a spare five-note motif with the tactile irregularity of brush ink on hanji paper. Mysterious but humane, with the faintest suggestion that the proud tiger is not as fearsome as he thinks. Intimate dynamics and generous room for narration. Historically suggestive without imitating a specific court or dynasty and without tourist pastiche. No vocals, chanting, modern synthesizers, trailer percussion, or sentimental swell. End suspended so it can dissolve into a nocturnal underscore.`,
  },
  {
    file: 'mountain-night-underscore.mp3',
    durationMs: 44000,
    prompt: `Original seamless instrumental underscore loop for a Korean comic folktale at night. Sparse gayageum harmonics, quiet ajaeng-like bowed texture, occasional daegeum breath, and a restrained wooden or janggu pulse that can subtly quicken the feeling of a misunderstanding without becoming foreground music. Dark indigo atmosphere, light dry humor, stable dynamics, no obvious melody or climax, and a genuinely continuous loop point. Designed beneath spoken narration, a crying baby effect, and a forest chase. No vocals, chanting, animal sounds, modern synthesizers, cinematic booms, or prominent percussion.`,
  },
  {
    file: 'dawn-ending.mp3',
    durationMs: 28000,
    prompt: `Original instrumental cinematic ending for the dawn resolution of a Korean folktale. Recall the opening five-note gayageum and daegeum motif, first breathless and sparse, then allow it to settle into a clear warm cadence as tiger and thief flee in opposite directions. Gayageum, soft daegeum, restrained bowed strings, and one gentle buk punctuation. Wry, humane, and relieved rather than triumphant, childish, or sentimental. No vocals, chanting, modern synthesizers, trailer drums, or comedy stings. Finish with a single unforced note and long natural decay.`,
  },
];

const outputDirectory = resolve('public/audio/stories/tiger-and-dried-persimmon/music');
await mkdir(outputDirectory, { recursive: true });

for (const cue of cues) {
  process.stdout.write(`Generating ${cue.file}… `);
  const response = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      prompt: cue.prompt,
      music_length_ms: cue.durationMs,
      model_id: 'music_v2',
      force_instrumental: true,
    }),
  });
  if (!response.ok) throw new Error(`${cue.file}: ${response.status} ${await response.text()}`);
  await writeFile(resolve(outputDirectory, cue.file), Buffer.from(await response.arrayBuffer()));
  console.log(`${cue.durationMs / 1000}s (${response.headers.get('song-id') ?? 'no song id'})`);
}
