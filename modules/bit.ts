/**
 * Bit Module - pure operators over unsigned 32-bit words
 *
 * Operands are whole numbers 0..4294967295 and counts are whole numbers 0..31;
 * anything else is refused, never wrapped or masked.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { NUMBER } from '../signature.js';

const WORD = 'a whole number 0..4294967295 (an unsigned 32-bit word)';
const REFUSED =
  'An operand that is negative, not whole, not finite, 2^32 or above, or not a number fails with kind invalid; nothing is wrapped.';
const COUNT_REFUSED = 'A count outside the whole numbers 0..31 (32 included) fails with kind invalid; nothing is masked.';
const RESULT = 'The result is a whole number 0..4294967295.';

function fold(name: string, label: string, example: string): StdOperatorMeta {
  return {
    module: 'bit',
    category: 'std-math',
    minArity: 2,
    maxArity: null,
    description: `${label} of two or more 32-bit words, folded left. Each operand must be ${WORD}. ${REFUSED} ${RESULT}`,
    hasSideEffects: false,
    returnType: NUMBER,
    params: [{ name: '...words', type: NUMBER, description: 'Unsigned 32-bit words' }],
    example: `["${name}", ${example}`,
  };
}

function shift(name: string, label: string, example: string): StdOperatorMeta {
  return {
    module: 'bit',
    category: 'std-math',
    minArity: 2,
    maxArity: 2,
    description: `${label} The word must be ${WORD}. ${REFUSED} ${COUNT_REFUSED} ${RESULT}`,
    hasSideEffects: false,
    returnType: NUMBER,
    params: [
      { name: 'a', type: NUMBER, description: 'Unsigned 32-bit word' },
      { name: 'n', type: NUMBER, description: 'Bit count, a whole number 0..31' },
    ],
    example: `["${name}", ${example}`,
  };
}

export const BIT_OPERATORS: Record<string, StdOperatorMeta> = {
  'bit/and': fold('bit/and', 'Bitwise AND', '305419896, 255] // => 120'),
  'bit/or': fold('bit/or', 'Bitwise OR', '2147483648, 1] // => 2147483649'),
  'bit/xor': fold('bit/xor', 'Bitwise XOR', '305419896, 2596069104] // => 2290649224'),
  'bit/not': {
    module: 'bit',
    category: 'std-math',
    minArity: 1,
    maxArity: 1,
    description: `Bitwise NOT over 32 bits (4294967295 - a). The operand must be ${WORD}. ${REFUSED} ${RESULT}`,
    hasSideEffects: false,
    returnType: NUMBER,
    params: [{ name: 'a', type: NUMBER, description: 'Unsigned 32-bit word' }],
    example: '["bit/not", 0] // => 4294967295',
  },
  'bit/shl': shift('bit/shl', 'Left shift by n bits; bits shifted past bit 31 are discarded.', '305419896, 4] // => 591751040'),
  'bit/shr': shift('bit/shr', 'Logical (zero-fill) right shift by n bits.', '305419896, 8] // => 1193046'),
  'bit/rotl': shift('bit/rotl', 'Rotate left by n bits within 32 bits.', '305419896, 8] // => 878082066'),
  'bit/rotr': shift('bit/rotr', 'Rotate right by n bits within 32 bits.', '305419896, 8] // => 2014458966'),
};
