import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const effects = [
  {
    file: 'bronze-bell-strike.mp3',
    durationSeconds: 6,
    loop: false,
    promptInfluence: 0.78,
    text: 'A single forceful hammer strike on a very large ancient Chinese bronze zhong bell in an open stone courtyard at night. Immediate solid bronze attack, deep fundamental tone, complex metallic overtones, and a long majestic natural decay. Physically realistic field recording, cinematic clarity, no music, no voices, no extra strikes.',
  },
  {
    file: 'courtyard-night.mp3',
    durationSeconds: 24,
    loop: true,
    promptInfluence: 0.52,
    text: 'Seamless quiet night ambience in an old Chinese courtyard: a soft breeze through bamboo leaves, sparse crickets, subtle wooden eaves settling, wide calm air. Intimate and realistic, steady level, no voices, no footsteps, no bells, no music, no dramatic events.',
  },
  {
    file: 'villagers-approach.mp3',
    durationSeconds: 4,
    loop: false,
    promptInfluence: 0.7,
    text: 'Three people hurry toward a courtyard across old stone flagstones, cloth shoes and robes moving, beginning distant and approaching quickly. Natural outdoor night acoustics, concerned but not panicked, no speech, no bell, no music.',
  },
];

const outputDirectory = resolve('public/audio/stories/yan-er-dao-ling/sfx');
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
