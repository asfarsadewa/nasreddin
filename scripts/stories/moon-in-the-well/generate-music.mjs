import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const cues = [
  {
    file: 'moon-over-stone-opening.mp3',
    durationMs: 30000,
    prompt: `Original instrumental cinematic opening for the Nasreddin Hodja tale The Moon in the Well. A vast midnight courtyard, a full moon over old stone, and one quietly comic human purpose. Begin with a single airy ney-like breath, sparse warm oud-like plucks, a very low bowed drone, faint frame-drum skin touched by fingertips, and glassy moonlit overtones. Intimate, spacious, curious, and dignified, with generous room for narration and no obvious punchline. Anatolian and West Asian inspired without copying any traditional, sacred, folk, film, television, or commercial melody. No vocals, chanting, field recording, modern synthesizer pulse, orchestral strings, trailer impacts, cartoon comedy, or sentimental swell. End suspended over one low water-like resonance so it can dissolve into underscore.`,
  },
  {
    file: 'deep-water-underscore.mp3',
    durationMs: 50000,
    prompt: `Original seamless low instrumental underscore loop for Nasreddin lowering a rope into a moonlit stone well. Sparse muted oud-like plucks, breathy ney texture without a foreground tune, low hand-muted frame drum, bowed wood resonance, tiny iron overtones, and widely spaced water-drop-like musical articulations. The pulse should gradually suggest tightening rope and earnest effort while remaining restrained, tactile, dryly comic, and speech-friendly. Anatolian and West Asian inspired without imitating sacred, classical, folk, film, television, or commercial music. Stable low dynamics and a genuine continuous loop point. No vocals, chanting, literal rope or water effects, modern synthesizers, orchestral swell, trailer drums, horror drones, or comedy sting.`,
  },
  {
    file: 'back-in-the-sky-ending.mp3',
    durationMs: 32000,
    prompt: `Original instrumental cinematic ending for Nasreddin falling backward, opening his eyes, and believing he returned the moon to the sky. Begin with one soft release of frame drum and a bright iron overtone, then let the opening oud-like motif rise into airy ney, warm wooden resonance, and a broad halo of glassy harmonics. Tender, relieved, wry, and spacious rather than triumphant or moralizing. Anatolian and West Asian inspired without copying any sacred, folk, classical, film, television, or commercial music. No vocals, chanting, slapstick sting, modern synthesizer pulse, orchestral climax, trailer percussion, or sentimental cadence. Let the last note hang like a moon that was never in danger.`,
  },
];

const outputDirectory = resolve('public/audio/stories/moon-in-the-well/music');
await mkdir(outputDirectory, { recursive: true });

for (const cue of cues) {
  process.stdout.write(`Generating ${cue.file}… `);
  const response = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({ prompt: cue.prompt, music_length_ms: cue.durationMs, model_id: 'music_v2', force_instrumental: true }),
  });
  if (!response.ok) throw new Error(`${cue.file}: ${response.status} ${await response.text()}`);
  await writeFile(resolve(outputDirectory, cue.file), Buffer.from(await response.arrayBuffer()));
  console.log(`${cue.durationMs / 1000}s (${response.headers.get('song-id') ?? 'no song id'})`);
}
