/**
 * Audio Module - Sound and music asks the client host answers
 *
 * One ask each, answered by the client host, which plays what std-audio-cue resolved and picks nothing. Effect-position only; they run on the client.
 * The decode ask is the exception: audio/decode is kernel-owned like the mem/ effects, writing the decoded samples into an arena block, so no host is asked.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { arg, osEffect } from './os-common.js';
import { BOOLEAN, BYTES, INT, NUMBER, STRING, list, lit, shape, union } from '../signature.js';

const ARENA: OperatorTypeRef = 'Arena';
const BORROW: OperatorTypeRef = 'Borrow';

const AUDIO_DECODE_OPTIONS: OperatorTypeRef = shape({ mono: BOOLEAN }, ['mono']);
const AUDIO_START: OperatorTypeRef = shape({ key: STRING, source: STRING, at: NUMBER, offset: NUMBER, duration: NUMBER, rate: NUMBER, gain: NUMBER }, ['duration']);
const AUDIO_STOP: OperatorTypeRef = shape({ key: STRING, at: NUMBER });
const AUDIO_RAMP: OperatorTypeRef = shape({ key: STRING, param: union(lit('gain'), lit('rate')), value: NUMBER, at: NUMBER, endAt: NUMBER, curve: union(lit('linear'), lit('exponential')) });
const AUDIO_COMMAND: OperatorTypeRef = union(shape({ start: AUDIO_START }), shape({ stop: AUDIO_STOP }), shape({ ramp: AUDIO_RAMP }));
const AUDIO_CLOCK: OperatorTypeRef = shape({ audio: NUMBER, wall: NUMBER });

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
  'audio/decode': {
    ...osEffect({
      answer: shape({ block: 'Block', sampleRate: INT, channels: INT, frames: INT }),
      grant: [],
      description: 'Decode an encoded audio file (wav, flac, mp3, ogg/vorbis, aac/m4a) into a new block of the arena: f32 little-endian samples interleaved by channel; mono averages the channels. Success payload: { block, sampleRate, channels, frames }. Failure kind: closed (the arena is not live), invalid (undecodable data, no room left in the arena), unsupported (a kernel built without the decoder).',
      params: [
        arg('arena', ARENA, 'The arena that receives the decoded block'),
        arg('data', union(BYTES, BORROW), 'The encoded file, as bytes or a live Borrow of the block holding it'),
        arg('options', AUDIO_DECODE_OPTIONS, 'Optional: { mono } averages the channels into one', true),
      ],
      example: '["audio/decode", "@entity.arena", "@payload.data", { "mono": true }, { "emit": { "success": "AUDIO_DECODED", "failure": "AUDIO_FAILED" } }]',
    }),
    module: 'audio',
    category: 'std-audio',
    runsOn: 'any',
    host: 'kernel',
  },
  'audio/schedule': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 1, maxArity: 1,
    description: 'Schedule voices on the host\'s audio clock, all times in seconds of audio/clock: start plays source from offset (seconds into the source) at time at, for duration (absent: to the end), at playback rate rate and gain gain; stop ends the voice key at at; ramp moves the voice\'s gain or playback rate from its value at at to value at endAt along curve. The host plays exactly what is declared and picks nothing; a voice key is known from its start until it is stopped, so a stop of a voice that already ended on its own answers ok (a no-op), a ramp of an ended voice is a no-op ok, and a stop or ramp for a key never started (or already stopped) fails the ask (invalid). Resolves via the trailing { emit } envelope. Success payload: {}. Failure kind: invalid (a malformed command, a stop or ramp for a key never started or already stopped), unavailable (a source that cannot be loaded or decoded, a host with no audio output).',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    effect: {
      kind: 'custom',
      produces: shape({}),
    },
    params: [
      { name: 'commands', type: list(AUDIO_COMMAND), description: 'The commands, applied in list order: start, stop or ramp records with exactly one key each' }
    ],
    example: '["audio/schedule", [{"start": {"key": "kick", "source": "/sfx/kick.ogg", "at": 1.5, "offset": 0, "rate": 1, "gain": 0.9}}, {"ramp": {"key": "kick", "param": "gain", "value": 0, "at": 1.5, "endAt": 2, "curve": "linear"}}], { "emit": { "failure": "AUDIO_REFUSED" } }]',
  },
  'audio/clock': {
    module: 'audio', category: 'std-audio',
    host: 'substrate',
    minArity: 0, maxArity: 0,
    description: 'Read the host\'s audio clock: audio is seconds on the clock audio/schedule times use, wall is epoch milliseconds on the canvas clock (performance.timeOrigin + performance.now()), read at the same instant as audio. Resolves via the trailing { emit } envelope. Success payload: { audio, wall }. Failure kind: unavailable (a host with no audio output).',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    effect: {
      kind: 'custom',
      produces: AUDIO_CLOCK,
    },
    example: '["audio/clock", { "emit": { "success": "AUDIO_CLOCK", "failure": "AUDIO_UNAVAILABLE" } }]',
  },
};

export function getAudioOperators(): string[] {
  return Object.keys(AUDIO_OPERATORS);
}
