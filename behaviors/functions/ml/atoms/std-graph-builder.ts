/**
 * std-graph-builder
 *
 * Graph construction atom for building graph structures from entities.
 * Converts entity collections into node/edge representations with
 * configurable features for graph neural network pipelines.
 *
 * @level atom
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGraphBuilderParams {
  /** Entity name in PascalCase (e.g., "GraphData", "NetworkGraph") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Entity name to source nodes from */
  nodeEntity: string;
  /** Field on node entity that defines edges (adjacency) */
  edgeField: string;
  /** Fields on node entity to include as node features */
  nodeFeatures: string[];
  /** Fields to include as edge features */
  edgeFeatures?: string[];
  /** Whether the graph is directed (default: false) */
  directed?: boolean;
  /** Event that triggers graph construction (default: "BUILD_GRAPH") */
  buildEvent?: string;
  /** Event emitted when graph is ready (default: "GRAPH_READY") */
  graphReadyEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime';
  /** Page name (defaults to "{Entity}GraphPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/graph") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GraphBuilderConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'runtime';
  traitName: string;
  pluralName: string;
  nodeEntity: string;
  edgeField: string;
  nodeFeatures: string[];
  edgeFeatures: string[];
  directed: boolean;
  buildEvent: string;
  graphReadyEvent: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGraphBuilderParams): GraphBuilderConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure graph-specific fields exist on entity
  const graphFields: EntityField[] = [
    ...(baseFields.some(f => f.name === 'graph') ? [] : [{ name: 'graph', type: 'object' as const }]),
    ...(baseFields.some(f => f.name === 'nodeCount') ? [] : [{ name: 'nodeCount', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'edgeCount') ? [] : [{ name: 'edgeCount', type: 'number' as const, default: 0 }]),
  ];

  const fields = [...baseFields, ...graphFields];
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}GraphBuilder`,
    pluralName: p,
    nodeEntity: params.nodeEntity,
    edgeField: params.edgeField,
    nodeFeatures: params.nodeFeatures,
    edgeFeatures: params.edgeFeatures ?? [],
    directed: params.directed ?? false,
    buildEvent: params.buildEvent ?? 'BUILD_GRAPH',
    graphReadyEvent: params.graphReadyEvent ?? 'GRAPH_READY',
    pageName: params.pageName ?? `${entityName}GraphPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/graph`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: GraphBuilderConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: GraphBuilderConfig): Trait {
  const { entityName, buildEvent, graphReadyEvent, nodeEntity, edgeField, nodeFeatures, directed } = c;

  // Ready view: graph config summary with build action
  const readyUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'git-branch', size: 'lg' },
          { type: 'typography', content: `${entityName} Graph Builder`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Nodes: ${nodeEntity}. Edges: ${edgeField}. Features: ${nodeFeatures.join(', ')}. Directed: ${directed}.` },
      { type: 'button', label: 'Build Graph', event: buildEvent, variant: 'primary', icon: 'play' },
    ],
  };

  // Building view: progress indicator
  const buildingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Building graph', message: `Constructing graph from ${nodeEntity} entities...` },
      { type: 'spinner', size: 'lg' },
      { type: 'progress-bar', value: 50, showPercentage: true },
    ],
  };

  // Complete view: graph stats
  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Graph Ready', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'Graph constructed successfully.' },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Nodes: @entity.nodeCount. Edges: @entity.edgeCount.` },
      { type: 'button', label: 'Rebuild', event: buildEvent, variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'building' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: buildEvent, name: 'Build Graph' },
        {
          key: graphReadyEvent, name: 'Graph Ready',
          payload: [
            { name: 'graph', type: 'object', required: true },
            { name: 'nodeCount', type: 'number', required: true },
            { name: 'edgeCount', type: 'number', required: true },
          ],
        },
      ],
      transitions: [
        // INIT: ready -> ready, render config summary
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [['render-ui', 'main', readyUI]],
        },
        // Build: ready -> building
        {
          from: 'ready', to: 'building', event: buildEvent,
          effects: [
            ['render-ui', 'main', buildingUI],
            ['graph/from-entities', {
              nodes: nodeEntity,
              edges: edgeField,
              'node-features': nodeFeatures,
              directed,
            }],
          ],
        },
        // Graph ready: building -> ready
        {
          from: 'building', to: 'ready', event: graphReadyEvent,
          effects: [
            ['set', '@entity.graph', '@payload.graph'],
            ['set', '@entity.nodeCount', '@payload.nodeCount'],
            ['set', '@entity.edgeCount', '@payload.edgeCount'],
            ['render-ui', 'main', completeUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: GraphBuilderConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdGraphBuilderEntity(params: StdGraphBuilderParams): Entity {
  return buildEntity(resolve(params));
}

export function stdGraphBuilderTrait(params: StdGraphBuilderParams): Trait {
  return buildTrait(resolve(params));
}

export function stdGraphBuilderPage(params: StdGraphBuilderParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdGraphBuilder(params: StdGraphBuilderParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
