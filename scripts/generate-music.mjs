import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  throw new Error('ELEVENLABS_API_KEY is required.');
}

const cues = [
  {
    file: 'opening-theme.mp3',
    durationMs: 28000,
    prompt: `Instrumental cinematic opening cue for a timeless Anatolian folktale at night. 72 BPM, D minor with a restrained Hijaz color. Begin with a solitary breathy ney phrase, answered by warm plucked oud, faint bowed strings, and one soft frame-drum pulse. Intimate, elegant, curious, with gentle wit beneath solemn storytelling. Establish a clear four-note motif. Keep the arrangement sparse with generous room for narration. No vocals, chanting, crowd, modern synthesizers, or trailer booms. End in a suspended soft decay that can transition into a quiet ambient underscore.`,
  },
  {
    file: 'market-ambience.mp3',
    durationMs: 42000,
    prompt: `Seamless instrumental background loop for a moonlit Anatolian market folktale. Nearly pulse-free at about 62 BPM: quiet oud harmonics, a low bowed drone, occasional breathy ney fragments, soft frame-drum brushes, and distant copper shimmer. Extremely sparse, no foreground lead melody, steady dynamics, no climax, no hard introduction or final cadence. Make the beginning and ending musically continuous for clean looping. Designed to sit beneath spoken narration: dark blue night, warm firelight, humane and gently mysterious. No vocals, chanting, crowd sounds, footsteps, modern synthesizers, or heavy percussion.`,
  },
  {
    file: 'ending-theme.mp3',
    durationMs: 28000,
    prompt: `Instrumental cinematic ending cue for the witty and compassionate resolution of a Nasreddin folktale. Recall a simple four-note ney motif and transform its dark modal color into a warm luminous resolution. Nimble oud plucks, a smiling ney answer, light frame drum, one tiny coin-like metallic accent, and subtle strings. Begin softly enough to sit beneath the final spoken judgment, then blossom after the narration. Elegant dry humor, never slapstick. No vocals, chanting, modern synthesizers, or trailer drums. Finish with a clear final cadence and a long warm decay.`,
  },
];

const outputDirectory = resolve('public/audio/music');
await mkdir(outputDirectory, { recursive: true });

for (const cue of cues) {
  process.stdout.write(`Generating ${cue.file}… `);
  const response = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      prompt: cue.prompt,
      music_length_ms: cue.durationMs,
      model_id: 'music_v2',
      force_instrumental: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`${cue.file}: ${response.status} ${await response.text()}`);
  }

  const outputPath = resolve(outputDirectory, cue.file);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
  console.log(`${cue.durationMs / 1000}s (${response.headers.get('song-id') ?? 'no song id'})`);
}
