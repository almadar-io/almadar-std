/**
 * Data Module - ML Data Preprocessing Operations
 *
 * Provides operators for creating datasets, dataloaders, and preprocessing
 * pipelines for ML training workflows.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { union, DATA_CONFIG, list, rec, shape, tuple } from '../signature.js';

/**
 * Data module operators.
 * These operators handle dataset creation, splitting, normalization, and augmentation.
 */
export const DATA_OPERATORS: Record<string, StdOperatorMeta> = {
  // ============================================================================
  // Dataset Creation
  // ============================================================================

  'data/dataset': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Create dataset from entity collection and contracts',
    hasSideEffects: false,
    returnType: 'Dataset',
    params: [
      { name: 'entities', type: list(union(rec('E'), 'TensorValue')), description: 'Entity records or tensors' },
      { name: 'contracts', type: shape({ input: 'ContractSpec', output: 'ContractSpec' }), description: 'Input/output contract pair' },
    ],
    example: '["data/dataset", [{"x": 1, "y": 2}], {"input": {"fields": ["x"]}, "output": {"fields": ["y"]}}]',
  },
  'data/dataloader': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Create batched dataloader from dataset',
    hasSideEffects: false,
    returnType: 'DataLoader',
    params: [
      { name: 'dataset', type: 'Dataset', description: 'Dataset' },
      { name: 'config', type: DATA_CONFIG, description: 'Config with batch_size, shuffle, etc.' },
    ],
    example: '["data/dataloader", ["data/dataset", [[1, 2], [3, 4], [5, 6]], {}], { "batch-size": 2, "shuffle": true }]',
  },
  'data/split': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Train/validation split. Config carries `trainRatio` (default 0.8); the remainder is the validation split.',
    hasSideEffects: false,
    returnType: tuple('Dataset', 'Dataset'),
    params: [
      { name: 'dataset', type: 'Dataset', description: 'Dataset' },
      { name: 'config', type: DATA_CONFIG, description: 'Split config, e.g. { trainRatio: 0.8 }' },
    ],
    example: '["data/split", ["data/dataset", [1, 2, 3, 4, 5], {}], { "trainRatio": 0.8 }]',
  },

  // ============================================================================
  // Preprocessing
  // ============================================================================

  'data/normalize': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Normalize features (mean/std or min/max)',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'Feature tensor' },
      { name: 'config', type: DATA_CONFIG, description: 'Normalization config (method, per_dim, etc.)' },
    ],
    example: '["data/normalize", [[1, 2], [3, 4]], { "method": "standard" }]',
  },
  'data/augment': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Apply data augmentation',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'data', type: 'tensor', description: 'Numeric data (nested arrays)' },
      { name: 'config', type: DATA_CONFIG, description: 'Augmentation config' },
    ],
    example: '["data/augment", [[1.0, 2.0], [3.0, 4.0]], { "flip": true, "rotate": 15 }]',
  },

  // ============================================================================
  // Tokenization & Padding
  // ============================================================================

  'data/tokenize': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Tokenize text fields',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'text', type: 'string', description: 'Text to tokenize' },
      { name: 'config', type: DATA_CONFIG, description: 'Tokenizer config (method, vocab_size, max_length)' },
    ],
    example: '["data/tokenize", "hello world", { "method": "bpe", "max-length": 512 }]',
  },
  'data/pad': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Pad sequences to uniform length',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'sequences', type: 'TensorValue', description: 'List of token sequences' },
      { name: 'config', type: DATA_CONFIG, description: 'Padding config (max_length, pad_value)' },
    ],
    example: '["data/pad", [[1, 2, 3], [4, 5]], { "max-length": 4, "pad-value": 0 }]',
  },
};

/**
 * Get all data operator names.
 */
export function getDataOperators(): string[] {
  return Object.keys(DATA_OPERATORS);
}
