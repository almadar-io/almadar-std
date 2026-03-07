/**
 * Workflow Domain Behaviors
 *
 * Standard behaviors for workflow operations: approvals, pipelines,
 * kanban boards, and review processes.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-approval - Approval Workflow
// ============================================================================

/**
 * std-approval - Approval workflow with review and decision states.
 * Supports browsing requests, reviewing details, and approving or rejecting.
 */
export const APPROVAL_BEHAVIOR: OrbitalSchema = {
  name: 'std-approval',
  version: '1.0.0',
  description: 'Approval workflow with review and decision flow',
  orbitals: [
    {
      name: 'ApprovalOrbital',
      entity: {
        name: 'ApprovalRequest',
        persistence: 'persistent',
        collection: 'approval_requests',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'requester', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'pending' },
          { name: 'approver', type: 'string', default: '' },
          { name: 'notes', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ApprovalFlow',
          linkedEntity: 'ApprovalRequest',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'reviewing' },
              { name: 'approved' },
              { name: 'rejected' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'REVIEW', name: 'Review Request', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'APPROVE', name: 'Approve', payloadSchema: [{ name: 'notes', type: 'string', required: true }] },
              { key: 'REJECT', name: 'Reject', payloadSchema: [{ name: 'notes', type: 'string', required: true }] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'ApprovalRequest'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Approvals' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'ApprovalRequest',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'reviewing',
                event: 'REVIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Review Request',
                    actions: [
                      { label: 'Approve', event: 'APPROVE' },
                      { label: 'Reject', event: 'REJECT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'reviewing',
                to: 'approved',
                event: 'APPROVE',
                effects: [
                  ['set', '@entity.status', 'approved'],
                  ['set', '@entity.notes', '@payload.notes'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Request Approved',
                    actions: [
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'reviewing',
                to: 'rejected',
                event: 'REJECT',
                effects: [
                  ['set', '@entity.status', 'rejected'],
                  ['set', '@entity.notes', '@payload.notes'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Request Rejected',
                    actions: [
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'reviewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'reviewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'approved',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'ApprovalRequest'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'ApprovalRequest',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'approved',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'ApprovalRequest'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'ApprovalRequest',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'rejected',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'ApprovalRequest'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'ApprovalRequest',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'rejected',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'ApprovalRequest'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'ApprovalRequest',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ApprovalsPage',
          path: '/approvals',
          isInitial: true,
          traits: [{ ref: 'ApprovalFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-pipeline - Pipeline Stages
// ============================================================================

/**
 * std-pipeline - Pipeline stage management with item progression.
 * Supports browsing items, viewing details, and moving through stages.
 */
export const PIPELINE_BEHAVIOR: OrbitalSchema = {
  name: 'std-pipeline',
  version: '1.0.0',
  description: 'Pipeline stage management with item progression',
  orbitals: [
    {
      name: 'PipelineOrbital',
      entity: {
        name: 'PipelineItem',
        persistence: 'persistent',
        collection: 'pipeline_items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'stage', type: 'string', default: 'backlog' },
          { name: 'assignee', type: 'string', default: '' },
          { name: 'priority', type: 'string', default: 'medium' },
        ],
      },
      traits: [
        {
          name: 'PipelineManager',
          linkedEntity: 'PipelineItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'moving' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Item', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'MOVE', name: 'Move Item' },
              { key: 'SET_STAGE', name: 'Set Stage', payloadSchema: [{ name: 'stage', type: 'string', required: true }] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'PipelineItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Pipeline' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PipelineItem',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.name',
                    actions: [
                      { label: 'Move', event: 'MOVE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'moving',
                event: 'MOVE',
                effects: [
                  ['fetch', 'PipelineItem'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'PipelineItem',
                    title: 'Move to Stage',
                    submitEvent: 'SET_STAGE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'moving',
                to: 'browsing',
                event: 'SET_STAGE',
                effects: [
                  ['set', '@entity.stage', '@payload.stage'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'PipelineItem'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PipelineItem',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'moving',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'PipelinePage',
          path: '/pipeline',
          isInitial: true,
          traits: [{ ref: 'PipelineManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-kanban - Kanban Board
// ============================================================================

/**
 * std-kanban - Kanban board card management.
 * Supports browsing, creating, viewing, and editing kanban cards.
 */
export const KANBAN_BEHAVIOR: OrbitalSchema = {
  name: 'std-kanban',
  version: '1.0.0',
  description: 'Kanban board card management',
  orbitals: [
    {
      name: 'KanbanOrbital',
      entity: {
        name: 'KanbanCard',
        persistence: 'persistent',
        collection: 'kanban_cards',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'column', type: 'string', default: 'todo' },
          { name: 'assignee', type: 'string', default: '' },
          { name: 'dueDate', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'KanbanManager',
          linkedEntity: 'KanbanCard',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'Create Card' },
              { key: 'SUBMIT', name: 'Submit Card', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'column', type: 'string', required: true },
                { name: 'assignee', type: 'string', required: true },
                { name: 'dueDate', type: 'string', required: true },
              ] },
              { key: 'VIEW', name: 'View Card', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'EDIT', name: 'Edit Card' },
              { key: 'UPDATE', name: 'Update Card', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'column', type: 'string', required: true },
                { name: 'assignee', type: 'string', required: true },
                { name: 'dueDate', type: 'string', required: true },
              ] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'KanbanCard'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Kanban Board', 
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'KanbanCard',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'KanbanCard'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'KanbanCard',
                    title: 'New Card',
                    submitEvent: 'SUBMIT',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SUBMIT',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.column', '@payload.column'],
                  ['set', '@entity.assignee', '@payload.assignee'],
                  ['set', '@entity.dueDate', '@payload.dueDate'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'KanbanCard'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'KanbanCard',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.title',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'KanbanCard'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'KanbanCard',
                    title: 'Edit Card',
                    submitEvent: 'UPDATE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'UPDATE',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.column', '@payload.column'],
                  ['set', '@entity.assignee', '@payload.assignee'],
                  ['set', '@entity.dueDate', '@payload.dueDate'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'KanbanCard'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'KanbanCard',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'KanbanPage',
          path: '/kanban',
          isInitial: true,
          traits: [{ ref: 'KanbanManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-review - Review Process
// ============================================================================

/**
 * std-review - Review process with scoring and feedback.
 * Supports browsing items, reviewing with score, and viewing scored results.
 */
export const REVIEW_BEHAVIOR: OrbitalSchema = {
  name: 'std-review',
  version: '1.0.0',
  description: 'Review process with scoring and feedback',
  orbitals: [
    {
      name: 'ReviewOrbital',
      entity: {
        name: 'ReviewItem',
        persistence: 'persistent',
        collection: 'review_items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'content', type: 'string', default: '' },
          { name: 'reviewer', type: 'string', default: '' },
          { name: 'score', type: 'number', default: 0 },
          { name: 'feedback', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ReviewProcess',
          linkedEntity: 'ReviewItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'reviewing' },
              { name: 'scored' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'REVIEW', name: 'Review Item', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'SUBMIT_REVIEW', name: 'Submit Review', payloadSchema: [
                { name: 'score', type: 'number', required: true },
                { name: 'feedback', type: 'string', required: true },
                { name: 'reviewer', type: 'string', required: true },
              ] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'ReviewItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reviews' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'ReviewItem',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'reviewing',
                event: 'REVIEW',
                effects: [
                  ['fetch', 'ReviewItem'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'ReviewItem',
                    title: 'Submit Review',
                    submitEvent: 'SUBMIT_REVIEW',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'reviewing',
                to: 'scored',
                event: 'SUBMIT_REVIEW',
                effects: [
                  ['set', '@entity.score', '@payload.score'],
                  ['set', '@entity.feedback', '@payload.feedback'],
                  ['set', '@entity.reviewer', '@payload.reviewer'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Review Submitted',
                    actions: [
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'reviewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'scored',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'ReviewItem'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'ReviewItem',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'scored',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'ReviewItem'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'ReviewItem',
                    itemActions: [
                      { label: 'Review', event: 'REVIEW' },
                    ],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ReviewsPage',
          path: '/reviews',
          isInitial: true,
          traits: [{ ref: 'ReviewProcess' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Workflow Behaviors
// ============================================================================

export const WORKFLOW_BEHAVIORS: OrbitalSchema[] = [
  APPROVAL_BEHAVIOR,
  PIPELINE_BEHAVIOR,
  KANBAN_BEHAVIOR,
  REVIEW_BEHAVIOR,
];
