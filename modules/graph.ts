/**
 * Graph Module - Graph Neural Network Operations
 *
 * Provides operators for building and manipulating graphs for GNN workloads.
 * Graphs are PyG-style data structures with node features, edge indices,
 * and optional edge features.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Graph module operators.
 * These operators build and manipulate graph data structures.
 */
export const GRAPH_OPERATORS: Record<string, StdOperatorMeta> = {
  // ============================================================================
  // Construction
  // ============================================================================

  'graph/from-entities': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Build PyG graph from entity collections',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'config', type: 'object', description: 'Graph construction config (nodes, edges, node-features, edge-features, directed)' },
    ],
    example: '["graph/from-entities", { "nodes": "User", "edges": "Follows" }]',
  },
  'graph/from-adjacency': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 2,
    maxArity: 2,
    description: 'Build graph from adjacency matrix and features',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'adjacency', type: 'tensor', description: 'Adjacency matrix' },
      { name: 'features', type: 'tensor', description: 'Node feature matrix' },
    ],
    example: '["graph/from-adjacency", "@entity.adj", "@entity.features"]',
  },
  'graph/from-edge-list': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 2,
    maxArity: 2,
    description: 'Build graph from edge list and features',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'edges', type: 'tensor', description: 'Edge index tensor [2, num_edges]' },
      { name: 'features', type: 'tensor', description: 'Node feature matrix' },
    ],
    example: '["graph/from-edge-list", "@entity.edges", "@entity.features"]',
  },

  // ============================================================================
  // Transforms
  // ============================================================================

  'graph/add-self-loops': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Add self-loop edges to graph',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/add-self-loops", "@entity.graph"]',
  },
  'graph/to-undirected': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Convert directed graph to undirected',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/to-undirected", "@entity.graph"]',
  },
  'graph/subgraph': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 2,
    maxArity: 2,
    description: 'Extract subgraph by node mask',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
      { name: 'mask', type: 'tensor', description: 'Boolean node mask' },
    ],
    example: '["graph/subgraph", "@entity.graph", "@entity.mask"]',
  },
  'graph/k-hop': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 3,
    maxArity: 3,
    description: 'K-hop neighborhood subgraph',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
      { name: 'node', type: 'number', description: 'Center node index' },
      { name: 'k', type: 'number', description: 'Number of hops' },
    ],
    example: '["graph/k-hop", "@entity.graph", 0, 2]',
  },

  // ============================================================================
  // Accessors
  // ============================================================================

  'graph/node-features': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Get node feature matrix',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/node-features", "@entity.graph"]',
  },
  'graph/edge-index': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Get edge index tensor',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/edge-index", "@entity.graph"]',
  },
  'graph/edge-features': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Get edge feature matrix',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/edge-features", "@entity.graph"]',
  },
  'graph/num-nodes': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Get node count',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/num-nodes", "@entity.graph"]',
  },
  'graph/num-edges': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Get edge count',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/num-edges", "@entity.graph"]',
  },
  'graph/degree': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Get node degree tensor',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'graph', type: 'graph', description: 'Input graph' },
    ],
    example: '["graph/degree", "@entity.graph"]',
  },

  // ============================================================================
  // Batching
  // ============================================================================

  'graph/batch': {
    module: 'graph',
    category: 'ml-graph',
    minArity: 1,
    maxArity: 1,
    description: 'Batch multiple graphs into one',
    hasSideEffects: false,
    returnType: 'graph',
    params: [
      { name: 'graphs', type: 'array', description: 'List of graphs' },
    ],
    example: '["graph/batch", "@entity.graphs"]',
  },
};

/**
 * Get all graph operator names.
 */
export function getGraphOperators(): string[] {
  return Object.keys(GRAPH_OPERATORS);
}
