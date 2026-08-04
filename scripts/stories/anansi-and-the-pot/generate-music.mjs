import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const cues = [
  {
    file: 'calabash-opening.mp3',
    durationMs: 28000,
    prompt: `Original instrumental cinematic opening for an intimate Akan Anansesem about Kwaku Ananse gathering wisdom into a gourd. Begin with one hollow calabash pulse, a dry plucked seperewa-like figure, soft wooden idiophone, and a distant breath of flute. The motif should feel clever, tactile, and slightly secretive, with open twilight air around it. Ghanaian and Akan inspired without copying a ceremonial rhythm, specific existing melody, or commercial world-music trope. Restrained dynamics and generous room for narration. No vocals, chanting, crowd sounds, modern synthesizers, trailer percussion, comedy stings, or sentimental swell. End suspended so it can dissolve into a quiet climbing underscore.`,
  },
  {
    file: 'gourd-secret-underscore.mp3',
    durationMs: 46000,
    prompt: `Original seamless instrumental underscore loop for an Akan trickster tale beneath a tall tree at dusk. Sparse plucked seperewa-like strings, muted calabash and wood pulses, occasional soft bell metal, dry seed texture, and a restrained hand-drum heartbeat that can suggest repeated failed climbing without becoming foreground music. Clever and earthy, with a compressed secretive quality while wisdom is trapped in the gourd. Stable low dynamics, no obvious climax, and a genuinely continuous loop point beneath speech and Foley. Ghanaian and Akan inspired without copying a sacred or ceremonial pattern. No vocals, chanting, animal calls, modern synthesizers, orchestral strings, cinematic booms, or prominent percussion.`,
  },
  {
    file: 'wisdom-scattered-ending.mp3',
    durationMs: 30000,
    prompt: `Original instrumental cinematic ending for the moment a gourd breaks and wisdom scatters beyond Kwaku Ananse's keeping. Recall the opening plucked motif, first held in one narrow register, then let it open across seperewa-like strings, light wooden idiophone, airy flute, quiet hand drums, and tiny bell-metal reflections spreading through a wide twilight landscape. Wry, luminous, communal, and unresolved enough to avoid a preached moral. Ghanaian and Akan inspired without imitating a sacred rhythm or existing song. No vocals, chanting, modern synthesizers, orchestral swell, trailer drums, comedy sting, or sentimental ending. Finish with several separated notes answering one another across space and a long natural decay.`,
  },
];

const outputDirectory = resolve('public/audio/stories/anansi-and-the-pot/music');
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
