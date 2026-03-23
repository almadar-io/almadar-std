/**
 * Data Module - ML Data Preprocessing Operations
 *
 * Provides operators for creating datasets, dataloaders, and preprocessing
 * pipelines for ML training workflows.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

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
    returnType: 'object',
    params: [
      { name: 'entities', type: 'array', description: 'Entity collection' },
      { name: 'contracts', type: 'object', description: 'Input/output contract pair' },
    ],
    example: '["data/dataset", "@entity.trainingData", "@entity.contracts"]',
  },
  'data/dataloader': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Create batched dataloader from dataset',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'dataset', type: 'object', description: 'Dataset' },
      { name: 'config', type: 'object', description: 'Config with batch_size, shuffle, etc.' },
    ],
    example: '["data/dataloader", "@entity.dataset", { "batch-size": 32, "shuffle": true }]',
  },
  'data/split': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Train/val/test split',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'dataset', type: 'object', description: 'Dataset' },
      { name: 'ratios', type: 'array', description: 'Split ratios e.g. [0.8, 0.1, 0.1]' },
    ],
    example: '["data/split", "@entity.dataset", [0.8, 0.1, 0.1]]',
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
      { name: 'config', type: 'object', description: 'Normalization config (method, per_dim, etc.)' },
    ],
    example: '["data/normalize", "@entity.features", { "method": "standard" }]',
  },
  'data/augment': {
    module: 'data',
    category: 'ml-data',
    minArity: 2,
    maxArity: 2,
    description: 'Apply data augmentation',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'dataset', type: 'object', description: 'Dataset' },
      { name: 'config', type: 'object', description: 'Augmentation config' },
    ],
    example: '["data/augment", "@entity.dataset", { "flip": true, "rotate": 15 }]',
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
      { name: 'config', type: 'object', description: 'Tokenizer config (method, vocab_size, max_length)' },
    ],
    example: '["data/tokenize", "@entity.text", { "method": "bpe", "max-length": 512 }]',
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
      { name: 'sequences', type: 'array', description: 'List of token sequences' },
      { name: 'config', type: 'object', description: 'Padding config (max_length, pad_value)' },
    ],
    example: '["data/pad", "@entity.sequences", { "max-length": 512, "pad-value": 0 }]',
  },
};

/**
 * Get all data operator names.
 */
export function getDataOperators(): string[] {
  return Object.keys(DATA_OPERATORS);
}
