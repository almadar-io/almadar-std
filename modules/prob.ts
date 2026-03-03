/**
 * Prob Module - Probabilistic Programming Operators
 *
 * Provides distribution sampling, Bayesian inference via rejection sampling,
 * and statistical summary functions.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Probabilistic module operators.
 */
export const PROB_OPERATORS: Record<string, StdOperatorMeta> = {
  // ========================================
  // Distribution Sampling
  // ========================================
  'prob/seed': {
    module: 'prob',
    category: 'std-prob',
    minArity: 1,
    maxArity: 1,
    description: 'Set seeded PRNG for deterministic probabilistic sampling',
    hasSideEffects: true,
    returnType: 'void',
    params: [{ name: 'n', type: 'number', description: 'Seed value (integer)' }],
    example: '["prob/seed", 42]',
  },
  'prob/flip': {
    module: 'prob',
    category: 'std-prob',
    minArity: 1,
    maxArity: 1,
    description: 'Bernoulli trial: returns true with probability p',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'p', type: 'number', description: 'Probability of true (0 to 1)' }],
    example: '["prob/flip", 0.5] // => true or false with equal probability',
  },
  'prob/gaussian': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Sample from a Gaussian (normal) distribution',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'mu', type: 'number', description: 'Mean' },
      { name: 'sigma', type: 'number', description: 'Standard deviation' },
    ],
    example: '["prob/gaussian", 0, 1] // => standard normal sample',
  },
  'prob/uniform': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Sample from a uniform distribution [lo, hi)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'lo', type: 'number', description: 'Lower bound (inclusive)' },
      { name: 'hi', type: 'number', description: 'Upper bound (exclusive)' },
    ],
    example: '["prob/uniform", 0, 10] // => number in [0, 10)',
  },
  'prob/beta': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Sample from a Beta(alpha, beta) distribution',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'alpha', type: 'number', description: 'Alpha shape parameter (> 0)' },
      { name: 'beta', type: 'number', description: 'Beta shape parameter (> 0)' },
    ],
    example: '["prob/beta", 2, 5] // => number in [0, 1], mean ~ 0.286',
  },
  'prob/categorical': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Weighted random selection from items',
    hasSideEffects: false,
    returnType: 'any',
    params: [
      { name: 'items', type: 'array', description: 'Array of items to choose from' },
      { name: 'weights', type: 'number[]', description: 'Array of weights (same length as items)' },
    ],
    example: '["prob/categorical", ["a", "b", "c"], [1, 2, 1]] // => "b" most likely',
  },
  'prob/poisson': {
    module: 'prob',
    category: 'std-prob',
    minArity: 1,
    maxArity: 1,
    description: 'Sample from a Poisson distribution',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'lambda', type: 'number', description: 'Rate parameter (> 0)' }],
    example: '["prob/poisson", 4] // => non-negative integer, mean ~ 4',
  },

  // ========================================
  // Inference
  // ========================================
  'prob/condition': {
    module: 'prob',
    category: 'std-prob',
    minArity: 1,
    maxArity: 1,
    description: 'Mark current sample as rejected if predicate is false',
    hasSideEffects: true,
    returnType: 'void',
    params: [{ name: 'predicate', type: 'boolean', description: 'Condition that must hold' }],
    example: '["prob/condition", [">", "@entity.x", 0]]',
  },
  'prob/sample': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Evaluate an expression n times and collect results',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'n', type: 'number', description: 'Number of samples' },
      { name: 'expr', type: 'SExpr', description: 'Expression to evaluate (lazy)' },
    ],
    example: '["prob/sample", 1000, ["prob/flip", 0.5]] // => array of booleans',
  },
  'prob/posterior': {
    module: 'prob',
    category: 'std-prob',
    minArity: 4,
    maxArity: 4,
    description: 'Rejection sampling: returns accepted query values',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'model', type: 'SExpr', description: 'Model expression (lazy, may call set/condition)' },
      { name: 'evidence', type: 'SExpr', description: 'Evidence expression (lazy, boolean)' },
      { name: 'query', type: 'SExpr', description: 'Query expression (lazy, value to collect)' },
      { name: 'n', type: 'number', description: 'Number of samples to attempt' },
    ],
    example: '["prob/posterior", model, evidence, query, 5000]',
  },
  'prob/infer': {
    module: 'prob',
    category: 'std-prob',
    minArity: 4,
    maxArity: 4,
    description: 'Like posterior but returns {mean, variance, samples, acceptRate}',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'model', type: 'SExpr', description: 'Model expression (lazy)' },
      { name: 'evidence', type: 'SExpr', description: 'Evidence expression (lazy, boolean)' },
      { name: 'query', type: 'SExpr', description: 'Query expression (lazy)' },
      { name: 'n', type: 'number', description: 'Number of samples to attempt' },
    ],
    example: '["prob/infer", model, evidence, query, 5000]',
  },

  // ========================================
  // Statistics
  // ========================================
  'prob/expected-value': {
    module: 'prob',
    category: 'std-prob',
    minArity: 1,
    maxArity: 1,
    description: 'Mean of numeric samples',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'samples', type: 'number[]', description: 'Array of numeric samples' }],
    example: '["prob/expected-value", [2, 4, 6, 8]] // => 5',
  },
  'prob/variance': {
    module: 'prob',
    category: 'std-prob',
    minArity: 1,
    maxArity: 1,
    description: 'Population variance of numeric samples',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'samples', type: 'number[]', description: 'Array of numeric samples' }],
    example: '["prob/variance", [2, 4, 4, 4, 5, 5, 7, 9]] // => 4',
  },
  'prob/histogram': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Bin numeric samples into a histogram',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'samples', type: 'number[]', description: 'Array of numeric samples' },
      { name: 'bins', type: 'number', description: 'Number of bins' },
    ],
    example: '["prob/histogram", [1, 2, 3, 4, 5], 2] // => {binEdges, counts}',
  },
  'prob/percentile': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Get the p-th percentile (0-100) from samples',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'samples', type: 'number[]', description: 'Array of numeric samples' },
      { name: 'p', type: 'number', description: 'Percentile (0 to 100)' },
    ],
    example: '["prob/percentile", [1, 2, 3, 4, 5], 50] // => 3',
  },
  'prob/credible-interval': {
    module: 'prob',
    category: 'std-prob',
    minArity: 2,
    maxArity: 2,
    description: 'Compute symmetric credible interval from samples',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'samples', type: 'number[]', description: 'Array of numeric samples' },
      { name: 'alpha', type: 'number', description: 'Significance level (e.g., 0.05 for 95% interval)' },
    ],
    example: '["prob/credible-interval", samples, 0.05] // => [lo, hi]',
  },
};

/**
 * Get all probabilistic operators.
 */
export function getProbOperators(): Record<string, StdOperatorMeta> {
  return PROB_OPERATORS;
}
