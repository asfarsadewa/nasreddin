import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const effects = [
  {
    file: 'tropical-river-dusk.mp3',
    durationSeconds: 22,
    loop: true,
    promptInfluence: 0.5,
    text: 'Seamless realistic quiet tropical river at humid late afternoon in Indonesia: broad steady current, soft water against muddy banks and roots, sparse reeds shifting, distant insects, and very occasional leaf movement. Intimate low field-recording level, no voices, no crocodile or deer sounds, no birdsong melody, no rain, no boats, no village, no music, and no dramatic event.',
  },
  {
    file: 'crocodiles-wake.mp3',
    durationSeconds: 4,
    loop: false,
    promptInfluence: 0.74,
    text: 'Close cinematic river Foley: one heavy crocodile eyelid opens just above water, a small displaced ripple spreads, then several large crocodile bodies wake and surface around a muddy bank with restrained water movement and two low jaw clacks. Realistic, tense, and spatially widening. No roars, no voices, no monster growls, no splash impact, no music.',
  },
  {
    file: 'crocodile-bridge.mp3',
    durationSeconds: 7,
    loop: false,
    promptInfluence: 0.76,
    text: 'Continuous wide realistic Foley of eight large crocodile bodies arranging snout to tail across a tropical river: wet scales sliding through current, heavy tails steering, low water displacement moving from near bank to far bank, then the current settles around one long living line. Precise and cinematic, no roars, no voices, no attacking bites, no music.',
  },
  {
    file: 'kancil-crossing.mp3',
    durationSeconds: 10,
    loop: false,
    promptInfluence: 0.8,
    text: 'Eight clearly separated light mousedeer hoof landings across broad wet crocodile backs, each contact followed by a delicate concentric river ripple and tiny scale movement. The first four are cautious and evenly spaced; the last four accelerate with springy confidence. Realistic close-to-wide stereo movement from one riverbank to the other. No animal voices, no human counting, no biting, no large splashes, no music.',
  },
  {
    file: 'final-bank-leap.mp3',
    durationSeconds: 5,
    loop: false,
    promptInfluence: 0.76,
    text: 'Cinematic final leap of a very small mousedeer from one wet crocodile back to a muddy tropical riverbank: a light spring from scales, fast airy arc, two neat hooves landing on damp earth, reeds brushing aside, then several crocodile tails turn in confused water behind. Realistic, nimble, and wry, no animal voices, no roar, no impact boom, no music.',
  },
];

const outputDirectory = resolve('public/audio/stories/si-kancil-dan-buaya/sfx');
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
