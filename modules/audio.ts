/**
 * Audio Module - Sound and music asks the client host answers
 *
 * One ask each, answered by the client host, which plays what std-audio-cue resolved and picks nothing. Effect-position only; they run on the client.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const AUDIO_OPERATORS: Record<string, StdOperatorMeta> = {
  'audio/play-sound': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 1, maxArity: 1,
    description: 'Play a one-shot sound std-audio-cue resolved: the host plays the source as given (volume, pooling) and picks nothing.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'play', type: 'AudioPlay', description: 'The resolved sound: key, source, volume, loop, poolSize, fadeMs' }
    ],
    example: '["audio/play-sound", {"key": "footstep", "source": "/sfx/step-2.ogg", "volume": 0.8, "loop": false, "poolSize": 3, "fadeMs": 0}]',
  },
  'audio/stop-sound': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 0, maxArity: 1,
    description: 'Stop the playing sound with this key; with no key, stop every sound.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'key', type: 'string', description: 'Key of the playing sound; absent stops all', optional: true }
    ],
    example: '["audio/stop-sound", "footstep"]',
  },
  'audio/change-music': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 1, maxArity: 1,
    description: 'Crossfade over the play\'s fadeMs to the looping track std-audio-cue resolved.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'play', type: 'AudioPlay', description: 'The resolved track: key, source, volume, loop, poolSize, fadeMs' }
    ],
    example: '["audio/change-music", {"key": "theme", "source": "/music/theme.ogg", "volume": 0.6, "loop": true, "poolSize": 1, "fadeMs": 1500}]',
  },
  'audio/stop-music': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 1, maxArity: 1,
    description: 'Fade the looping music out over fadeMs milliseconds and stop it.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'fadeMs', type: 'number', description: 'Fade-out length in milliseconds (0 stops at once)' }
    ],
    example: '["audio/stop-music", 1000]',
  },
};

export function getAudioOperators(): string[] {
  return Object.keys(AUDIO_OPERATORS);
}
