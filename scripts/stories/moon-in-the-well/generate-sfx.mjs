import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const effects = [
  {
    file: 'courtyard-by-the-well.mp3', durationSeconds: 22, loop: true, promptInfluence: 0.5,
    text: 'Seamless realistic quiet stone courtyard beside a deep well on a clear still night: faint dry leaves, very distant night insects, occasional soft air across stone, subtle deep well resonance, and one rare water drop far below. Intimate low field-recording level. No people, voices, animals nearby, rope, bucket, footsteps, wind gust, rain, village activity, music, or dramatic event.',
  },
  {
    file: 'hook-descends-into-well.mp3', durationSeconds: 8, loop: false, promptInfluence: 0.78,
    text: 'Close-to-deep cinematic Foley of a coarse natural-fibre rope feeding slowly over a rounded stone well rim while a small iron hook descends through a tall enclosed shaft. Gentle fibre friction starts near the listener, then the iron makes two tiny distant wall taps and approaches still water far below. Realistic, careful, resonant, and spatially vertical. No splash, no break, no voices, no bucket, no music.',
  },
  {
    file: 'iron-hook-catches-stone.mp3', durationSeconds: 4, loop: false, promptInfluence: 0.82,
    text: 'Extreme close cinematic well Foley: a small iron hook brushes dark water, clicks once across submerged stone, then catches firmly beneath a heavy rock as the rope becomes taut. Deep stone-shaft echo with a tight final fibre creak. Realistic and precise. No splash impact, no rope snap, no human effort, no voice, no music.',
  },
  {
    file: 'rope-strain-and-snap.mp3', durationSeconds: 8, loop: false, promptInfluence: 0.84,
    text: 'Cinematic escalating natural-fibre rope strain across a rough stone well rim: slow heavy tension, individual fibres tightening and complaining, one shoe bracing on stone, stronger sustained pull, then a single sudden dry rope snap with the broken end whipping through air. Realistic, controlled, and close. No human voice, no fall impact, no water splash, no music, no exaggerated explosion.',
  },
  {
    file: 'backward-fall-and-ripples.mp3', durationSeconds: 6, loop: false, promptInfluence: 0.8,
    text: 'Cinematic physical comedy Foley without cartoon exaggeration: an adult in layered cloth is pulled backward through a short airy arc, lands flat but safely on dusty stone with a soft body thump and cloth settling; inside the nearby deep well, disturbed water answers with widening silver ripples and several delicate echoes. No cry, speech, bone crack, huge impact, splash, laughter, or music.',
  },
];

const outputDirectory = resolve('public/audio/stories/moon-in-the-well/sfx');
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
