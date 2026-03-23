/**
 * Contract Module - ML Contract Validation Operations
 *
 * Provides operators for validating tensors against input/output contracts
 * and converting between entity fields and tensors via contract mappings.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Contract module operators.
 * These operators validate and transform data using contract specifications.
 */
export const CONTRACT_OPERATORS: Record<string, StdOperatorMeta> = {
  // ============================================================================
  // Validation
  // ============================================================================

  'contract/validate-input': {
    module: 'contract',
    category: 'ml-contract',
    minArity: 2,
    maxArity: 2,
    description: 'Validate tensor against input contract',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'tensor', type: 'tensor', description: 'Input tensor' },
      { name: 'contract', type: 'object', description: 'Input contract spec' },
    ],
    example: '["contract/validate-input", "@payload.input", "@entity.inputContract"]',
  },
  'contract/validate-output': {
    module: 'contract',
    category: 'ml-contract',
    minArity: 2,
    maxArity: 2,
    description: 'Validate tensor against output contract',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'tensor', type: 'tensor', description: 'Output tensor' },
      { name: 'contract', type: 'object', description: 'Output contract spec' },
    ],
    example: '["contract/validate-output", "@entity.output", "@entity.outputContract"]',
  },
  'contract/clamp-output': {
    module: 'contract',
    category: 'ml-contract',
    minArity: 2,
    maxArity: 2,
    description: 'Clamp output tensor to contract ranges',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'Output tensor' },
      { name: 'contract', type: 'object', description: 'Output contract spec' },
    ],
    example: '["contract/clamp-output", "@entity.output", "@entity.outputContract"]',
  },
  'contract/violations': {
    module: 'contract',
    category: 'ml-contract',
    minArity: 2,
    maxArity: 2,
    description: 'List contract violations',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'tensor', type: 'tensor', description: 'Tensor to check' },
      { name: 'contract', type: 'object', description: 'Contract spec' },
    ],
    example: '["contract/violations", "@entity.output", "@entity.outputContract"]',
  },

  // ============================================================================
  // Conversion
  // ============================================================================

  'contract/entity-to-tensor': {
    module: 'contract',
    category: 'ml-contract',
    minArity: 2,
    maxArity: 2,
    description: 'Convert entity fields to tensor via contract',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'entity', type: 'object', description: 'Entity data' },
      { name: 'contract', type: 'object', description: 'Input contract mapping fields to dims' },
    ],
    example: '["contract/entity-to-tensor", "@entity", "@entity.inputContract"]',
  },
  'contract/tensor-to-payload': {
    module: 'contract',
    category: 'ml-contract',
    minArity: 2,
    maxArity: 2,
    description: 'Convert output tensor to event payload via contract',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'tensor', type: 'tensor', description: 'Output tensor' },
      { name: 'contract', type: 'object', description: 'Output contract mapping dims to fields' },
    ],
    example: '["contract/tensor-to-payload", "@entity.output", "@entity.outputContract"]',
  },
};

/**
 * Get all contract operator names.
 */
export function getContractOperators(): string[] {
  return Object.keys(CONTRACT_OPERATORS);
}
