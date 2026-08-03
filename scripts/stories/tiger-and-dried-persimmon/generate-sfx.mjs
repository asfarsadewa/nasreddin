import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const effects = [
  {
    file: 'winter-village-night.mp3',
    durationSeconds: 22,
    loop: true,
    promptInfluence: 0.48,
    text: 'Seamless quiet winter-night ambience in a small mountain village: light cold wind around wooden eaves, very sparse dry leaves, distant forest air, occasional timber settling. Intimate realistic field recording, steady low level, no voices, no crying, no footsteps, no animals, no music, and no dramatic event.',
  },
  {
    file: 'baby-cry-behind-wall.mp3',
    durationSeconds: 6,
    loop: false,
    promptInfluence: 0.68,
    text: 'A baby crying from inside a warm room, heard softly through a closed paper-and-wood wall from outside at night. Natural short sequence with two or three plaintive cries, distant and gently muffled, then easing. No adult voice, no words, no music, no exaggerated cartoon crying.',
  },
  {
    file: 'persimmon-offered.mp3',
    durationSeconds: 3,
    loop: false,
    promptInfluence: 0.72,
    text: 'Close intimate Foley: a cloth sleeve moves, one small dried persimmon is lifted from a wooden tray and set gently into a hand, with a soft dry fruit texture and tiny wooden contact. Quiet indoor room, precise cinematic detail, no voices, no eating, no music.',
  },
  {
    file: 'cattle-shed-rustle.mp3',
    durationSeconds: 4,
    loop: false,
    promptInfluence: 0.68,
    text: 'A cautious person enters a dark wooden cattle shed at night: one soft latch, straw shifting under cloth shoes, fabric brushing rough fur, and a restrained timber creak. Realistic close Foley, furtive and quiet, no cow vocalization, no tiger growl, no speech, no music.',
  },
  {
    file: 'tiger-forest-run.mp3',
    durationSeconds: 7,
    loop: false,
    promptInfluence: 0.74,
    text: 'A large tiger sprints at full speed through a cold pine forest at night while carrying a rider: powerful four-beat padded paws on earth and needles, branches whipping past, cloth flapping, fast breath, beginning suddenly and racing away. Cinematic but physically realistic, no roar, no human voice, no music, no horse hoof sounds.',
  },
];

const outputDirectory = resolve('public/audio/stories/tiger-and-dried-persimmon/sfx');
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
