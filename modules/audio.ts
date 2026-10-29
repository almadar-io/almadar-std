/**
 * Audio Module - Sound and music asks the client host answers
 *
 * One ask each, answered by the client host. Effect-position only; they run on the client.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const AUDIO_OPERATORS: Record<string, StdOperatorMeta> = {
  'audio/play-sound': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 1, maxArity: 1,
    description: 'Play the one-shot sound the host manifest names by key.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'key', type: 'string', description: 'Manifest key of the sound' }
    ],
    example: '["audio/play-sound", "footstep"]',
  },
  'audio/stop-sound': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 0, maxArity: 1,
    description: 'Stop the sound the host manifest names by key; with no key, stop every sound.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'key', type: 'string', description: 'Manifest key of the sound; absent stops all', optional: true }
    ],
    example: '["audio/stop-sound", "footstep"]',
  },
  'audio/change-music': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 0, maxArity: 1,
    description: 'Crossfade to the looping track the host manifest names by key; with no key, stop the music.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [
      { name: 'key', type: 'string', description: 'Manifest key of the track; absent stops the music', optional: true }
    ],
    example: '["audio/change-music", "theme"]',
  },
  'audio/stop-music': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 0, maxArity: 0,
    description: 'Stop the looping music.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [],
    example: '["audio/stop-music"]',
  },
};

export function getAudioOperators(): string[] {
  return Object.keys(AUDIO_OPERATORS);
}
