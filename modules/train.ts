/**
 * Training Module - Neural Network Training Operations
 *
 * Provides operators for training neural networks with explicit constraints.
 * Training is bounded by readable rules: gradient clipping, weight constraints,
 * forbidden output regions, and validation gates.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Training module operators.
 * These operators handle training loops, validation, and constraint enforcement.
 */
export const TRAIN_OPERATORS: Record<string, StdOperatorMeta> = {
  // ============================================================================
  // Training Loop
  // ============================================================================

  'train/loop': {
    module: 'train',
    category: 'ml-effect',
    minArity: 3,
    maxArity: 3,
    description: 'Execute training loop with constraints',
    hasSideEffects: true,
    returnType: 'train/result',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network to train' },
      { name: 'data', type: 'array', description: 'Training data (array of {input, target} or experiences)' },
      { name: 'config', type: 'train/config', description: 'Training configuration with constraints' },
    ],
    example: '["train/loop", {"layers": [{"type": "dense", "units": 2}]}, [{"state": [0], "action": 1, "reward": 1}], {"epochs": 10}]',
  },
  'train/step': {
    module: 'train',
    category: 'ml-effect',
    minArity: 4,
    maxArity: 4,
    description: 'Execute single training step (forward, loss, backward, update)',
    hasSideEffects: true,
    returnType: 'train/stepResult',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'input', type: 'tensor', description: 'Input tensor' },
      { name: 'target', type: 'tensor', description: 'Target tensor' },
      { name: 'config', type: 'train/config', description: 'Training configuration' },
    ],
    example: '["train/step", {"layers": [{"type": "dense", "units": 2}]}, [0.1, 0.2], [1], {"lr": 0.01}]',
  },

  // ============================================================================
  // Validation
  // ============================================================================

  'train/validate': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Validate model on test cases, returns pass/fail metrics',
    hasSideEffects: false,
    returnType: 'train/validationResult',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'testCases', type: 'array', description: 'Array of {input, expected, tolerance?}' },
    ],
    example: '["train/validate", {"layers": [{"type": "dense", "units": 2}]}, [{"input": [0], "expected": [1]}]]',
  },
  'train/checkRegression': {
    module: 'train',
    category: 'ml-effect',
    minArity: 3,
    maxArity: 3,
    description: 'Check if new model regresses on required invariants',
    hasSideEffects: false,
    returnType: 'train/regressionResult',
    params: [
      { name: 'newModule', type: 'nn/module', description: 'Newly trained network' },
      { name: 'oldModule', type: 'nn/module', description: 'Previous network' },
      { name: 'invariants', type: 'array', description: 'Test cases that must not regress' },
    ],
    example: '["train/checkRegression", [0.1, 0.2], {"layers": [{"type": "dense", "units": 2}]}, [{"input": [0], "expected": [1]}]]',
  },

  // ============================================================================
  // Constraint Checking
  // ============================================================================

  'train/checkConstraints': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Check if network weights satisfy all constraints',
    hasSideEffects: false,
    returnType: 'train/constraintResult',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'constraints', type: 'train/constraints', description: 'Constraint specification' },
    ],
    example: '["train/checkConstraints", [0.1, 0.2], {"maxMagnitude": 10}]',
  },
  'train/checkWeightMagnitude': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Check if all weights are within magnitude limit',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'maxMagnitude', type: 'number', description: 'Maximum allowed weight magnitude' },
    ],
    example: '["train/checkWeightMagnitude", {"layers": [{"type": "dense", "units": 2}]}, 10.0]',
  },
  'train/checkForbiddenOutputs': {
    module: 'train',
    category: 'ml-effect',
    minArity: 3,
    maxArity: 3,
    description: 'Check if model produces outputs in forbidden regions',
    hasSideEffects: false,
    returnType: 'train/forbiddenResult',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'testInputs', type: 'array', description: 'Inputs to test' },
      { name: 'forbiddenRegions', type: 'array', description: 'Forbidden output regions' },
    ],
    example: '["train/checkForbiddenOutputs", {"layers": [{"type": "dense", "units": 2}]}, [[0], [1]], {"0": {"min": 100, "max": 200}}]',
  },

  // ============================================================================
  // Gradient Operations
  // ============================================================================

  'train/clipGradients': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Clip gradients to max norm (modifies in place)',
    hasSideEffects: true,
    returnType: 'number',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'maxNorm', type: 'number', description: 'Maximum gradient norm' },
    ],
    example: '["train/clipGradients", {"layers": [{"type": "dense", "units": 2}]}, 1.0]',
  },
  'train/getGradientNorm': {
    module: 'train',
    category: 'ml-effect',
    minArity: 1,
    maxArity: 1,
    description: 'Get current gradient norm',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
    ],
    example: '["train/getGradientNorm", {"layers": [{"type": "dense", "units": 2}]}]',
  },

  // ============================================================================
  // Weight Operations
  // ============================================================================

  'train/clipWeights': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Clip weights to max magnitude (modifies in place)',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'maxMagnitude', type: 'number', description: 'Maximum weight magnitude' },
    ],
    example: '["train/clipWeights", {"layers": [{"type": "dense", "units": 2}]}, 10.0]',
  },
  'train/getMaxWeightMagnitude': {
    module: 'train',
    category: 'ml-effect',
    minArity: 1,
    maxArity: 1,
    description: 'Get maximum weight magnitude in network',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
    ],
    example: '["train/getMaxWeightMagnitude", {"layers": [{"type": "dense", "units": 2}]}]',
  },

  // ============================================================================
  // Loss Functions
  // ============================================================================

  'train/mse': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Mean squared error loss',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'predicted', type: 'tensor', description: 'Predicted values' },
      { name: 'target', type: 'tensor', description: 'Target values' },
    ],
    example: '["train/mse", [0.5, 0.7], [1, 0]]',
  },
  'train/crossEntropy': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Cross-entropy loss for classification',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'logits', type: 'tensor', description: 'Raw model outputs (logits)' },
      { name: 'labels', type: 'tensor', description: 'Target class labels' },
    ],
    example: '["train/crossEntropy", [2.0, 0.5], [1, 0]]',
  },
  'train/huber': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 3,
    description: 'Huber loss (smooth L1, robust to outliers)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'predicted', type: 'tensor', description: 'Predicted values' },
      { name: 'target', type: 'tensor', description: 'Target values' },
      { name: 'delta', type: 'number', description: 'Threshold for quadratic vs linear', optional: true, defaultValue: 1.0 },
    ],
    example: '["train/huber", [0.5, 1.2], [1, 0], 1.0]',
  },

  // ============================================================================
  // Optimizers
  // ============================================================================

  'train/sgd': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 3,
    description: 'Stochastic gradient descent optimizer step',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'lr', type: 'number', description: 'Learning rate' },
      { name: 'momentum', type: 'number', description: 'Momentum factor', optional: true, defaultValue: 0 },
    ],
    example: '["train/sgd", {"layers": [{"type": "dense", "units": 2}]}, 0.01, 0.9]',
  },
  'train/adam': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 4,
    description: 'Adam optimizer step',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'module', type: 'nn/module', description: 'The neural network' },
      { name: 'lr', type: 'number', description: 'Learning rate' },
      { name: 'beta1', type: 'number', description: 'First moment decay', optional: true, defaultValue: 0.9 },
      { name: 'beta2', type: 'number', description: 'Second moment decay', optional: true, defaultValue: 0.999 },
    ],
    example: '["train/adam", {"layers": [{"type": "dense", "units": 2}]}, 0.001]',
  },

  // ============================================================================
  // Experience Replay (for RL)
  // ============================================================================

  'train/sampleBatch': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Sample random batch from experience buffer',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'buffer', type: 'array', description: 'Experience buffer' },
      { name: 'batchSize', type: 'number', description: 'Number of samples' },
    ],
    example: '["train/sampleBatch", [{"state": [0], "reward": 1}, {"state": [1], "reward": 0}], 2]',
  },
  'train/computeReturns': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Compute discounted returns from rewards',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'rewards', type: 'array', description: 'Array of rewards' },
      { name: 'gamma', type: 'number', description: 'Discount factor' },
    ],
    example: '["train/computeReturns", [1, 0, 1], 0.99]',
  },
  'train/computeAdvantages': {
    module: 'train',
    category: 'ml-effect',
    minArity: 3,
    maxArity: 3,
    description: 'Compute GAE advantages for policy gradient',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'rewards', type: 'array', description: 'Array of rewards' },
      { name: 'values', type: 'tensor', description: 'Value estimates' },
      { name: 'config', type: 'object', description: 'Config with gamma, lambda' },
    ],
    example: '["train/computeAdvantages", [1, 0, 1], [0.5, 0.4, 0.3], { "gamma": 0.99, "lambda": 0.95 }]',
  },

  // ============================================================================
  // ML lifecycle effects (bare aliases invoked by std ML behaviors)
  // ============================================================================

  'train': {
    module: 'train',
    category: 'ml-effect',
    minArity: 1,
    maxArity: 3,
    description: 'Train a model over a dataset (ML effect)',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      { name: 'model', type: 'nn/module', description: 'The neural network module' },
      { name: 'data', type: 'array', description: 'Training data (optional)' },
      { name: 'config', type: 'object', description: 'Training config (optional)' },
    ],
    example: '["train", {"layers": [{"type": "dense", "units": 2}]}, [[0, 1], [1, 0]], { "epochs": 100 }]',
  },
  'evaluate': {
    module: 'train',
    category: 'ml-effect',
    minArity: 1,
    maxArity: 2,
    description: 'Evaluate a model against test cases (ML effect)',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'model', type: 'nn/module', description: 'The neural network module' },
      { name: 'testCases', type: 'array', description: 'Test cases (optional)' },
    ],
    example: '["evaluate", {"layers": [{"type": "dense", "units": 2}]}, [{"input": [0], "expected": [1]}]]',
  },
  'checkpoint/save': {
    module: 'train',
    category: 'ml-effect',
    minArity: 2,
    maxArity: 2,
    description: 'Save a model checkpoint (ML effect)',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'model', type: 'nn/module', description: 'The neural network module' },
      { name: 'key', type: 'string', description: 'Checkpoint identifier' },
    ],
    example: '["checkpoint/save", {"layers": [{"type": "dense", "units": 2}]}, "ckpt-1"]',
  },
  'checkpoint/load': {
    module: 'train',
    category: 'ml-effect',
    minArity: 1,
    maxArity: 1,
    description: 'Load a model checkpoint (ML effect)',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'key', type: 'string', description: 'Checkpoint identifier' },
    ],
    example: '["checkpoint/load", "ckpt-1"]',
  },
};

/**
 * Get all train operator names.
 */
export function getTrainOperators(): string[] {
  return Object.keys(TRAIN_OPERATORS);
}
