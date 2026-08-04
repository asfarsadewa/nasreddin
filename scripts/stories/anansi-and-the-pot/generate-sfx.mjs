import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const effects = [
  {
    file: 'forest-dusk.mp3',
    durationSeconds: 22,
    loop: true,
    promptInfluence: 0.48,
    text: 'Seamless quiet tropical forest clearing at dusk in Ghana: warm evening air through a broad tree canopy, sparse leaves shifting, tiny distant insects, occasional dry seed settling on earth. Intimate realistic field recording, steady low level, no voices, no spider sounds, no birdsong melody, no rain, no music, and no dramatic event.',
  },
  {
    file: 'wisdom-gather.mp3',
    durationSeconds: 5,
    loop: false,
    promptInfluence: 0.7,
    text: 'Magical but organic close cinematic texture for many tiny pieces of wisdom being gathered into a hollow gourd: dry seeds skittering over earth, light raffia fibers, small wooden taps, delicate glass-like glints, and a subtle inward airy pull. Precise and restrained, no intelligible whispers, no voice, no whoosh impact, no music.',
  },
  {
    file: 'gourd-knock.mp3',
    durationSeconds: 3,
    loop: false,
    promptInfluence: 0.74,
    text: 'Close realistic Foley of a hollow dried calabash gourd tied with fiber rope knocking three uneven times against rough tree bark while a small climber slips downward. Dry woody resonance, rope strain, light bark scrape, no breakage, no human voice, no footsteps, no music.',
  },
  {
    file: 'tree-climb.mp3',
    durationSeconds: 4,
    loop: false,
    promptInfluence: 0.68,
    text: 'Fast close Foley of a lightweight many-legged creature climbing rough tree bark while carrying a gourd on its back: crisp repeated bark contacts, subtle fiber rope movement, three quick accelerating clusters, ending high above. Realistic and tactile, no insect buzzing, no voice, no breaking wood, no music.',
  },
  {
    file: 'wisdom-scatter.mp3',
    durationSeconds: 7,
    loop: false,
    promptInfluence: 0.76,
    text: 'Cinematic wide event: a dried calabash gourd tears free, falls through branches, splits sharply on packed earth, then releases hundreds of dry seeds, tiny wooden pieces, delicate glass-like glints, and airy luminous particles racing outward across a forest clearing. Begin close and end very wide with separated echoes. No explosion, no thunder, no voices, no music.',
  },
];

const outputDirectory = resolve('public/audio/stories/anansi-and-the-pot/sfx');
await mkdir(outputDirectory, { recursive: true });

for (const effect of effects) {
  process.stdout.write(`Generating ${effect.file}… `);
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text: effect.text,
      model_id: 'eleven_text_to_sound_v2',
      duration_seconds: effect.durationSeconds,
      prompt_influence: effect.promptInfluence,
      loop: effect.loop,
    }),
  });
  if (!response.ok) throw new Error(`${effect.file}: ${response.status} ${await response.text()}`);
  await writeFile(resolve(outputDirectory, effect.file), Buffer.from(await response.arrayBuffer()));
  console.log(`${effect.durationSeconds}s (${response.headers.get('request-id') ?? 'no request id'})`);
}
