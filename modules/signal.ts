/**
 * Signal Module - domain-free numeric signal primitives over PCM held in kernel memory (f32 little-endian, interleaved) or over number lists.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { arg } from './os-common.js';
import { INT, NUMBER, list, shape } from '../signature.js';

const BORROW: OperatorTypeRef = 'Borrow';

type SignalParam = NonNullable<StdOperatorMeta['params']>[number];

function signalPure(def: { description: string; params: SignalParam[]; returnType: OperatorTypeRef; example: string }): StdOperatorMeta {
  const required = def.params.filter((p) => p.optional !== true).length;
  return {
    module: 'signal',
    category: 'std-signal',
    minArity: required,
    maxArity: def.params.length,
    description: def.description,
    hasSideEffects: false,
    returnType: def.returnType,
    params: def.params,
    example: def.example,
  };
}

const FRAMES_SPEC: OperatorTypeRef = shape(
  { sampleRate: INT, channels: INT, channel: INT, window: INT, hop: INT, bands: list(list(NUMBER)), start: INT, count: INT },
  ['start', 'count'],
);
const ENVELOPE_SPEC: OperatorTypeRef = shape({ channels: INT, channel: INT, window: INT, hop: INT, start: INT, count: INT }, ['start', 'count']);

export const SIGNAL_OPERATORS: Record<string, StdOperatorMeta> = {
  'signal/frames': signalPure({
    description: 'Band magnitudes per frame of the PCM a live borrow lends: frame f covers mono samples [f*hop, f*hop+window) under a Hann window, zero-padded past the end; each band [lowHz, highHz) is the mean FFT magnitude (divided by window) of the bins whose frequency falls in it, 0 when none does. channel is a channel index, or -1 for the mean of all channels. window is a power of two. start/count select frames (default all). A closed borrow, a window that is not a power of two, a non-positive sampleRate, channels, window or hop, a channel outside -1..channels-1, a band that is not a [lowHz, highHz) pair, or a negative start or count is an evaluation error.',
    params: [arg('borrow', BORROW, 'A live borrow of the block holding f32 little-endian interleaved PCM'), arg('spec', FRAMES_SPEC, 'The framing: sampleRate, channels, channel, window, hop, bands, optional start and count')],
    returnType: list(list(NUMBER)),
    example: '["signal/frames", "@entity.borrow", {"sampleRate": 44100, "channels": 2, "channel": -1, "window": 2048, "hop": 512, "bands": [[20, 150], [150, 2000], [2000, 16000]]}] // => [[0.12, 0.03, 0.001], ...]',
  }),
  'signal/envelope': signalPure({
    description: 'RMS of each frame of mono samples (zero-padded past the end, divided by window): frame f covers mono samples [f*hop, f*hop+window); channel is a channel index, or -1 for the mean of all channels. start/count select frames (default all). A closed borrow, a non-positive channels, window or hop, a channel outside -1..channels-1, or a negative start or count is an evaluation error.',
    params: [arg('borrow', BORROW, 'A live borrow of the block holding f32 little-endian interleaved PCM'), arg('spec', ENVELOPE_SPEC, 'The framing: channels, channel, window, hop, optional start and count')],
    returnType: list(NUMBER),
    example: '["signal/envelope", "@entity.borrow", {"channels": 1, "channel": 0, "window": 1024, "hop": 512}] // => [0.2, 0.31, ...]',
  }),
  'signal/autocorrelate': signalPure({
    description: 'r[lag] = (1/(n-lag)) * sum of xs[i]*xs[i+lag], for lag minLag..maxLag; a lag at or beyond the length is 0. Answers one number per lag, minLag first. A negative minLag or a maxLag below minLag is an evaluation error.',
    params: [arg('xs', list(NUMBER), 'The samples'), arg('minLag', INT, 'First lag; not negative'), arg('maxLag', INT, 'Last lag, inclusive; not below minLag')],
    returnType: list(NUMBER),
    example: '["signal/autocorrelate", [1, 0, 1, 0], 0, 2] // => [0.5, 0, 1]',
  }),
};

export function getSignalOperators(): string[] {
  return Object.keys(SIGNAL_OPERATORS);
}
