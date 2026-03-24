/**
 * std-graph-classifier
 *
 * Graph neural network classification molecule. Composes two traits
 * on one page sharing the event bus:
 * - Graph builder: constructs adjacency + feature matrices from entity data
 * - Forward: runs GNN classification on the built graph
 *
 * Event flow: CLASSIFY -> BUILD_GRAPH -> GRAPH_READY -> forward -> CLASSIFIED
 *
 * @level molecule
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGraphClassifierParams {
  entityName: string;
  /** Entity representing graph nodes */
  nodeEntity: string;
  /** Field on node entity containing edge references (adjacency) */
  edgeField: string;
  /** Node feature field names */
  nodeFeatures: string[];
  /** GNN architecture (e.g. GCN, GAT layers) */
  architecture: unknown;
  /** Classification labels */
  classes: string[];
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GraphClassifierConfig {
  entityName: string;
  fields: EntityField[];
  nodeEntity: string;
  edgeField: string;
  nodeFeatures: string[];
  architecture: unknown;
  classes: string[];
  graphTraitName: string;
  classifyTraitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGraphClassifierParams): GraphClassifierConfig {
  const { entityName } = params;

  const baseFields: EntityField[] = [{ name: 'id', type: 'string', default: '' }];
  const domainFields: EntityField[] = [
    { name: 'nodeCount', type: 'number', default: 0 },
    { name: 'edgeCount', type: 'number', default: 0 },
    { name: 'predictedClass', type: 'string', default: '' },
    { name: 'confidence', type: 'number', default: 0 },
    { name: 'graphStatus', type: 'string', default: 'idle' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = ensureIdField([...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))]);

  const p = plural(entityName);

  return {
    entityName,
    fields,
    nodeEntity: params.nodeEntity,
    edgeField: params.edgeField,
    nodeFeatures: params.nodeFeatures,
    architecture: params.architecture,
    classes: params.classes,
    graphTraitName: `${entityName}GraphBuilder`,
    classifyTraitName: `${entityName}GnnClassify`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}GraphPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/graph-classify`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builders
// ============================================================================

function buildGraphBuilderTrait(c: GraphClassifierConfig): Trait {
  const { entityName, nodeEntity, edgeField, nodeFeatures } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'git-branch', size: 'lg' },
          { type: 'typography', content: `${entityName} Graph Classifier`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.graphStatus' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Nodes: ${nodeEntity} | Features: ${nodeFeatures.join(', ')}` },
      { type: 'typography', variant: 'caption', content: `Classes: ${c.classes.join(', ')}` },
      { type: 'button', label: 'Classify Graph', event: 'CLASSIFY', variant: 'primary', icon: 'play' },
    ],
  };

  const buildingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Building Graph', variant: 'h3' },
      { type: 'spinner', size: 'md' },
      { type: 'typography', variant: 'body', color: 'muted', content: 'Constructing adjacency matrix and feature vectors...' },
    ],
  };

  const buildGraphEffect: unknown[] = ['graph-build', 'primary', {
    nodeEntity,
    edgeField,
    features: nodeFeatures,
    'on-complete': 'GRAPH_READY',
  }];

  return {
    name: c.graphTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['GRAPH_READY'],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'building' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CLASSIFY', name: 'Classify' },
        { key: 'GRAPH_READY', name: 'Graph Ready' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.graphStatus', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'idle', to: 'building', event: 'CLASSIFY',
          effects: [
            ['set', '@entity.graphStatus', 'building'],
            buildGraphEffect,
            ['render-ui', 'main', buildingView],
          ],
        },
        {
          from: 'building', to: 'idle', event: 'GRAPH_READY',
          effects: [
            ['set', '@entity.nodeCount', '@payload.nodeCount'],
            ['set', '@entity.edgeCount', '@payload.edgeCount'],
            ['set', '@entity.graphStatus', 'graph_ready'],
            ['emit', 'GRAPH_READY'],
            ['render-ui', 'main', idleView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildGnnClassifyTrait(c: GraphClassifierConfig): Trait {
  const { entityName, classes } = c;

  const waitingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'brain', size: 'lg' },
      { type: 'typography', content: 'GNN Classification', variant: 'h3' },
      { type: 'badge', label: 'Waiting for graph', variant: 'neutral' },
    ],
  };

  const classifyingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Running GNN Forward Pass', variant: 'h3' },
      { type: 'spinner', size: 'md' },
    ],
  };

  const resultView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Classification Result', variant: 'h3' },
      { type: 'badge', label: '@entity.predictedClass', variant: 'success' },
      { type: 'typography', variant: 'caption', content: 'Confidence' },
      { type: 'progress-bar', value: '@entity.confidence', max: 1 },
      { type: 'typography', variant: 'body', content: 'Nodes: @entity.nodeCount | Edges: @entity.edgeCount' },
    ],
  };

  const forwardEffect: unknown[] = ['forward', 'primary', {
    architecture: c.architecture,
    input: '@payload.graph',
    'output-contract': { type: 'tensor', shape: [classes.length], dtype: 'float32', labels: classes, activation: 'softmax' },
    'on-complete': 'CLASSIFIED',
  }];

  return {
    name: c.classifyTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['CLASSIFIED'],
    stateMachine: {
      states: [
        { name: 'waiting', isInitial: true },
        { name: 'classifying' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GRAPH_READY', name: 'Graph Ready' },
        { key: 'CLASSIFIED', name: 'Classified' },
      ],
      transitions: [
        {
          from: 'waiting', to: 'waiting', event: 'INIT',
          effects: [
            ['render-ui', 'main', waitingView],
          ],
        },
        {
          from: 'waiting', to: 'classifying', event: 'GRAPH_READY',
          effects: [
            forwardEffect,
            ['render-ui', 'main', classifyingView],
          ],
        },
        {
          from: 'classifying', to: 'waiting', event: 'CLASSIFIED',
          effects: [
            ['set', '@entity.predictedClass', ['tensor/argmax-label', '@payload.output', classes]],
            ['set', '@entity.confidence', ['tensor/max', '@payload.output']],
            ['set', '@entity.graphStatus', 'classified'],
            ['emit', 'CLASSIFIED'],
            ['render-ui', 'main', resultView],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdGraphClassifierEntity(params: StdGraphClassifierParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
}

export function stdGraphClassifierTrait(params: StdGraphClassifierParams): Trait {
  return buildGraphBuilderTrait(resolve(params));
}

export function stdGraphClassifierPage(params: StdGraphClassifierParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.graphTraitName },
      { ref: c.classifyTraitName },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdGraphClassifier(params: StdGraphClassifierParams): OrbitalDefinition {
  const c = resolve(params);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });

  const graphTrait = buildGraphBuilderTrait(c);
  const classifyTrait = buildGnnClassifyTrait(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: graphTrait.name },
      { ref: classifyTrait.name },
    ],
  } as Page;

  return {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [graphTrait, classifyTrait],
    pages: [page],
  } as OrbitalDefinition;
}
