import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required.');

const cues = [
  {
    file: 'opening-theme.mp3',
    durationMs: 26000,
    prompt: `Instrumental cinematic opening for an ancient Chinese fable in a moonlit courtyard. Begin with one low guqin harmonic and a spacious xiao flute answer, then introduce a restrained four-note pentatonic motif. Sparse silk-string texture, occasional muted wooden pulse, intimate and nocturnal, with curiosity and a trace of dry wit. Historically suggestive without sounding like a tourist pastiche. Leave generous room for narration. No vocals, chanting, modern synthesizers, trailer percussion, or sentimental swell. End suspended so it can dissolve into an ambient underscore.`,
  },
  {
    file: 'courtyard-underscore.mp3',
    durationMs: 42000,
    prompt: `Seamless instrumental underscore loop for an ancient Chinese courtyard fable at night. Very sparse guqin harmonics, low bowed silk-string drone, occasional breathy xiao fragments, and the faintest wooden pulse. Quiet tension with a sly undercurrent, steady dynamics, no foreground melody, no climax, no hard beginning or ending. Make the loop point musically continuous. Designed beneath spoken narration and a bronze bell effect. No vocals, chanting, crowd, modern synthesizers, cinematic booms, or prominent percussion.`,
  },
  {
    file: 'ending-theme.mp3',
    durationMs: 28000,
    prompt: `Instrumental cinematic ending for the wry resolution of an ancient Chinese fable. Recall the opening four-note guqin and xiao motif, beginning quietly beneath the final narration, then open into a clear warm pentatonic cadence. Guqin, xiao, restrained bowed strings, and one subtle wooden punctuation. Humane and lightly amused rather than triumphant or childish. No vocals, chanting, modern synthesizers, trailer drums, or sentimental excess. Finish with a confident final note and long natural decay.`,
  },
];

const outputDirectory = resolve('public/audio/stories/yan-er-dao-ling/music');
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
