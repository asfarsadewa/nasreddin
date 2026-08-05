import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const cues = [
  {
    file: 'river-at-dusk-opening.mp3',
    durationMs: 30000,
    prompt: `Original instrumental cinematic opening for the Indonesian fable Si Kancil dan Buaya at a humid river in late afternoon. Begin with spacious river air, one soft bronze-gong reflection, a nimble kecapi-like plucked figure, quiet bamboo flute breath, and restrained wooden or kendang-like hand percussion. The small motif should feel observant, quick, and slightly dangerous, leaving generous room for narration. Indonesian archipelago inspired without copying a traditional, ceremonial, folk, film, television, or commercial melody. No vocals, chanting, animal sounds, cartoon stings, modern synthesizers, orchestral strings, trailer impacts, or sentimental swell. End with the motif held above a darker current so it can dissolve into underscore.`,
  },
  {
    file: 'crocodile-current-underscore.mp3',
    durationMs: 50000,
    prompt: `Original seamless low instrumental underscore loop for Si Kancil facing crocodiles in an Indonesian river. Sparse kecapi-like plucked wood, muted kendang-like skin taps, bamboo breath without a foreground melody, tiny bronze overtones, and a quiet irregular pulse that can tighten during an argument and become an exact eight-step crossing rhythm. Clever, humid, tactile, and suspenseful without horror. Stable low dynamics, genuine continuous loop point, and ample space for speech and Foley. Indonesian inspired without imitating a sacred, court, folk, existing television, or commercial pattern. No vocals, chanting, animal calls, water field recording, modern synthesizers, orchestral strings, cinematic booms, comedy stings, or prominent drums.`,
  },
  {
    file: 'far-bank-ending.mp3',
    durationMs: 32000,
    prompt: `Original instrumental cinematic ending for Si Kancil making the final leap to the far riverbank while eight crocodiles realize they formed his bridge. Recall the opening kecapi-like figure as eight separated plucked notes, then open into airy bamboo flute, restrained kendang-like hand rhythm, warm wooden resonance, and distant soft bronze reflections. Wry, quick, sunlit, and spacious rather than triumphant or moralizing. Indonesian archipelago inspired without copying any sacred, folk, film, television, or commercial music. No vocals, chanting, animal sounds, modern synthesizers, orchestral swell, trailer drums, cartoon sting, or sentimental cadence. Finish with the small motif disappearing into a wide natural decay.`,
  },
];

const outputDirectory = resolve('public/audio/stories/si-kancil-dan-buaya/music');
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
