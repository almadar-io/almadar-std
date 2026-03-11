/**
 * Workflow Domain Behaviors
 *
 * Standard behaviors for workflow operations: approvals, pipelines,
 * kanban boards, and review processes.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ── Shared Workflow Theme ──────────────────────────────────────────

const WORKFLOW_THEME = {
  name: 'workflow-orange',
  tokens: {
    colors: {
      primary: '#ea580c',
      'primary-hover': '#c2410c',
      'primary-foreground': '#ffffff',
      accent: '#fb923c',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ── Reusable main-view effects (approval) ──────────────────────────

const approvalMainEffects: BehaviorEffect[] = [
  ['fetch', 'ApprovalRequest'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'check-square', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Approvals' },
      ]},
      { type: 'badge', label: 'Pending Review', variant: 'warning', icon: 'flag' },
    ]},
    { type: 'divider' },
    // Stats row: pending count + approved count + rejected count
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Pending', icon: 'flag', entity: 'ApprovalRequest' },
      { type: 'stats', label: 'Approved', icon: 'check-square', entity: 'ApprovalRequest' },
      { type: 'stats', label: 'Rejected', icon: 'x-circle', entity: 'ApprovalRequest' },
    ]},
    // Progress bar showing approval throughput
    { type: 'progress-bar', value: 0, label: 'Approval Throughput' },
    { type: 'divider' },
    // Data: approval request list with status badges
    { type: 'data-list', entity: 'ApprovalRequest', variant: 'card',
      fields: [
        { name: 'title', label: 'Request', icon: 'file-text', variant: 'h4' },
        { name: 'requester', label: 'Requester', icon: 'user', variant: 'body' },
        { name: 'status', label: 'Status', icon: 'circle-dot', variant: 'badge' },
        { name: 'approver', label: 'Approver', icon: 'user-check', variant: 'caption' },
      ],
      itemActions: [
        { label: 'Review', event: 'REVIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (pipeline) ──────────────────────────

const pipelineMainEffects: BehaviorEffect[] = [
  ['fetch', 'PipelineItem'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: git-branch icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'git-branch', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Pipeline' },
      ]},
      { type: 'badge', label: 'Active', variant: 'primary', icon: 'play' },
    ]},
    { type: 'divider' },
    // Stats row: stage counts
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Backlog', icon: 'inbox', entity: 'PipelineItem' },
      { type: 'stats', label: 'In Progress', icon: 'play', entity: 'PipelineItem' },
      { type: 'stats', label: 'Done', icon: 'check-square', entity: 'PipelineItem' },
    ]},
    // Progress meter
    { type: 'meter', value: 0, label: 'Pipeline Progress', icon: 'arrow-right' },
    { type: 'divider' },
    // Data: pipeline items as a grid
    { type: 'data-grid', entity: 'PipelineItem',
      columns: [
        { name: 'name', label: 'Item', icon: 'file-text' },
        { name: 'stage', label: 'Stage', icon: 'git-branch' },
        { name: 'assignee', label: 'Assignee', icon: 'user' },
        { name: 'priority', label: 'Priority', icon: 'flag' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (kanban) ────────────────────────────

const kanbanMainEffects: BehaviorEffect[] = [
  ['fetch', 'KanbanCard'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: workflow icon + title + create button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'list-checks', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Kanban Board' },
      ]},
      { type: 'button', label: 'New Card', icon: 'plus', variant: 'primary', action: 'CREATE' },
    ]},
    { type: 'divider' },
    // Stats row: column counts
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'To Do', icon: 'circle', entity: 'KanbanCard' },
      { type: 'stats', label: 'In Progress', icon: 'play', entity: 'KanbanCard' },
      { type: 'stats', label: 'Done', icon: 'check-square', entity: 'KanbanCard' },
    ]},
    // Search bar
    { type: 'search-input', placeholder: 'Search cards...', entity: 'KanbanCard' },
    { type: 'divider' },
    // Column swim lanes via tabs grouped by column field
    { type: 'tabs', entity: 'KanbanCard', groupBy: 'column', tabs: [
      { label: 'To Do', value: 'todo', icon: 'circle' },
      { label: 'In Progress', value: 'in-progress', icon: 'play' },
      { label: 'Done', value: 'done', icon: 'check-square' },
      { label: 'Review', value: 'review', icon: 'eye' },
    ], children: [
      { type: 'data-list', entity: 'KanbanCard', variant: 'card',
        fields: [
          { name: 'title', label: 'Title', icon: 'file-text', variant: 'h4' },
          { name: 'assignee', label: 'Assignee', icon: 'user', variant: 'caption' },
          { name: 'dueDate', label: 'Due', icon: 'calendar', variant: 'caption', format: 'date' },
        ],
        itemActions: [
          { label: 'View', event: 'VIEW', icon: 'eye' },
        ],
      },
    ]},
  ]}],
];

// ── Reusable main-view effects (review) ────────────────────────────

const reviewMainEffects: BehaviorEffect[] = [
  ['fetch', 'ReviewItem'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: star icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'workflow', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Reviews' },
      ]},
      { type: 'badge', label: 'Review Queue', variant: 'accent', icon: 'list-checks' },
    ]},
    { type: 'divider' },
    // Stats row: total reviews, average score, pending
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Items', icon: 'hash', entity: 'ReviewItem' },
      { type: 'stats', label: 'Avg Score', icon: 'bar-chart-2', entity: 'ReviewItem' },
      { type: 'stats', label: 'Pending', icon: 'flag', entity: 'ReviewItem' },
    ]},
    // Score distribution chart
    { type: 'line-chart', entity: 'ReviewItem' },
    { type: 'divider' },
    // Data: review items as cards with score badges
    { type: 'data-list', entity: 'ReviewItem', variant: 'card',
      fields: [
        { name: 'title', label: 'Title', icon: 'file-text', variant: 'h4' },
        { name: 'content', label: 'Content', icon: 'align-left', variant: 'body' },
        { name: 'reviewer', label: 'Reviewer', icon: 'user', variant: 'caption' },
        { name: 'score', label: 'Score', icon: 'bar-chart-2', variant: 'badge' },
        { name: 'feedback', label: 'Feedback', icon: 'message-circle', variant: 'body' },
      ],
      itemActions: [
        { label: 'Review', event: 'REVIEW', icon: 'edit' },
      ],
    },
  ]}],
];

// ============================================================================
// std-approval - Approval Workflow
// ============================================================================

/**
 * std-approval - Approval workflow with review and decision states.
 * Supports browsing requests, reviewing details, and approving or rejecting.
 */
export const APPROVAL_BEHAVIOR: BehaviorSchema = {
  name: "std-approval",
  version: "1.0.0",
  description: "Approval workflow with review and decision flow",
  theme: {
    name: "workflow-orange",
    tokens: {
      colors: {
        primary: "#ea580c",
        "primary-hover": "#c2410c",
        "primary-foreground": "#ffffff",
        accent: "#fb923c",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ApprovalOrbital",
      entity: {
        name: "ApprovalRequest",
        persistence: "persistent",
        collection: "approval_requests",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "requester",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "pending",
          },
          {
            name: "approver",
            type: "string",
            default: "",
          },
          {
            name: "notes",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "ApprovalFlow",
          linkedEntity: "ApprovalRequest",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "reviewing",
              },
              {
                name: "approved",
              },
              {
                name: "rejected",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "REVIEW",
                name: "Review Request",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "APPROVE",
                name: "Approve",
                payloadSchema: [
                  {
                    name: "notes",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "REJECT",
                name: "Reject",
                payloadSchema: [
                  {
                    name: "notes",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "ApprovalRequest"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Approval Workflow",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Pending Review",
                              variant: "warning",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Approval Chain",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 0,
                                  label: "Approval Progress",
                                  progressType: "stepped",
                                  steps: 3,
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "success",
                                          label: "Submitted",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Submitted",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "warning",
                                          pulse: true,
                                          label: "Under Review",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Under Review",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "inactive",
                                          label: "Decision",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Decision",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "clock",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Approved",
                              icon: "check-circle",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              icon: "x-circle",
                              entity: "ApprovalRequest",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Review",
                              event: "REVIEW",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Approval History",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          title: "Audit Trail",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "reviewing",
                event: "REVIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "eye",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Review Approval Request",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "@entity.title",
                          subtitle: "Approval request details",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "Requester:",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.requester",
                                      variant: "default",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "Approver:",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.approver",
                                      variant: "default",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "circle-dot",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "Status:",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                      variant: "warning",
                                      icon: "clock",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          title: "Decision",
                          submitEvent: "APPROVE",
                          cancelEvent: "REJECT",
                          submitLabel: "Approve",
                          cancelLabel: "Reject",
                          showCancel: true,
                          fields: [
                            {
                              name: "notes",
                              label: "Comments",
                              type: "textarea",
                              required: true,
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Close",
                          icon: "x",
                          variant: "ghost",
                          event: "CLOSE",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "approved",
                event: "APPROVE",
                effects: [
                  ["set", "@entity.status", "approved"],
                  ["set", "@entity.notes", "@payload.notes"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "check-circle",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Request Approved",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "@entity.title",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 100,
                                  label: "Approval Complete",
                                  progressType: "stepped",
                                  steps: 3,
                                  variant: "success",
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "status-dot",
                                      status: "success",
                                      label: "Approved",
                                    },
                                    {
                                      type: "badge",
                                      label: "Approved",
                                      variant: "success",
                                      icon: "check-circle",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Notes",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "@entity.notes",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Close",
                          icon: "x",
                          variant: "ghost",
                          event: "CLOSE",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "rejected",
                event: "REJECT",
                effects: [
                  ["set", "@entity.status", "rejected"],
                  ["set", "@entity.notes", "@payload.notes"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "x-circle",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Request Rejected",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "@entity.title",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 66,
                                  label: "Approval Stopped",
                                  progressType: "stepped",
                                  steps: 3,
                                  variant: "error",
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "status-dot",
                                      status: "error",
                                      label: "Rejected",
                                    },
                                    {
                                      type: "badge",
                                      label: "Rejected",
                                      variant: "error",
                                      icon: "x-circle",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Rejection Reason",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "@entity.notes",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Close",
                          icon: "x",
                          variant: "ghost",
                          event: "CLOSE",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "reviewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "approved",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "ApprovalRequest"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Approval Workflow",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Pending Review",
                              variant: "warning",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Approval Chain",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 0,
                                  label: "Approval Progress",
                                  progressType: "stepped",
                                  steps: 3,
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "success",
                                          label: "Submitted",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Submitted",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "warning",
                                          pulse: true,
                                          label: "Under Review",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Under Review",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "inactive",
                                          label: "Decision",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Decision",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "clock",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Approved",
                              icon: "check-circle",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              icon: "x-circle",
                              entity: "ApprovalRequest",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Review",
                              event: "REVIEW",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Approval History",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          title: "Audit Trail",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "approved",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "ApprovalRequest"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Approval Workflow",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Pending Review",
                              variant: "warning",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Approval Chain",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 0,
                                  label: "Approval Progress",
                                  progressType: "stepped",
                                  steps: 3,
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "success",
                                          label: "Submitted",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Submitted",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "warning",
                                          pulse: true,
                                          label: "Under Review",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Under Review",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "inactive",
                                          label: "Decision",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Decision",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "clock",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Approved",
                              icon: "check-circle",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              icon: "x-circle",
                              entity: "ApprovalRequest",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Review",
                              event: "REVIEW",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Approval History",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          title: "Audit Trail",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "rejected",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "ApprovalRequest"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Approval Workflow",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Pending Review",
                              variant: "warning",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Approval Chain",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 0,
                                  label: "Approval Progress",
                                  progressType: "stepped",
                                  steps: 3,
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "success",
                                          label: "Submitted",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Submitted",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "warning",
                                          pulse: true,
                                          label: "Under Review",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Under Review",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "inactive",
                                          label: "Decision",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Decision",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "clock",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Approved",
                              icon: "check-circle",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              icon: "x-circle",
                              entity: "ApprovalRequest",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Review",
                              event: "REVIEW",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Approval History",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          title: "Audit Trail",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "rejected",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "ApprovalRequest"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Approval Workflow",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Pending Review",
                              variant: "warning",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Approval Chain",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "progress-bar",
                                  value: 0,
                                  label: "Approval Progress",
                                  progressType: "stepped",
                                  steps: 3,
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "success",
                                          label: "Submitted",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Submitted",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "warning",
                                          pulse: true,
                                          label: "Under Review",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Under Review",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      align: "center",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "inactive",
                                          label: "Decision",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Decision",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "clock",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Approved",
                              icon: "check-circle",
                              entity: "ApprovalRequest",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              icon: "x-circle",
                              entity: "ApprovalRequest",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Review",
                              event: "REVIEW",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Approval History",
                        },
                        {
                          type: "data-list",
                          entity: "ApprovalRequest",
                          title: "Audit Trail",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "user-check",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.requester",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "ApprovalsPage",
          path: "/approvals",
          isInitial: true,
          traits: [
            {
              ref: "ApprovalFlow",
            },
          ],
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
export const PIPELINE_BEHAVIOR: BehaviorSchema = {
  name: "std-pipeline",
  version: "1.0.0",
  description: "Pipeline stage management with item progression",
  theme: {
    name: "workflow-orange",
    tokens: {
      colors: {
        primary: "#ea580c",
        "primary-hover": "#c2410c",
        "primary-foreground": "#ffffff",
        accent: "#fb923c",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "PipelineOrbital",
      entity: {
        name: "PipelineItem",
        persistence: "persistent",
        collection: "pipeline_items",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "stage",
            type: "string",
            default: "backlog",
          },
          {
            name: "assignee",
            type: "string",
            default: "",
          },
          {
            name: "priority",
            type: "string",
            default: "medium",
          },
          {
            name: "value",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "PipelineManager",
          linkedEntity: "PipelineItem",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "viewing",
              },
              {
                name: "moving",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Item",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "MOVE",
                name: "Move Item",
              },
              {
                key: "SET_STAGE",
                name: "Set Stage",
                payloadSchema: [
                  {
                    name: "stage",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "REORDER_DEAL",
                name: "Reorder Deal",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "PipelineItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          content: "Pipeline",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          wrap: true,
                          children: [
                            {
                              type: "badge",
                              label: "Backlog",
                              variant: "secondary",
                              icon: "inbox",
                            },
                            {
                              type: "icon",
                              name: "chevron-right",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "In Progress",
                              variant: "primary",
                              icon: "play",
                            },
                            {
                              type: "icon",
                              name: "chevron-right",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "Review",
                              variant: "warning",
                              icon: "eye",
                            },
                            {
                              type: "icon",
                              name: "chevron-right",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "Done",
                              variant: "success",
                              icon: "check-square",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PipelineItem",
                          variant: "card",
                          groupBy: "stage",
                          reorderable: true,
                          reorderEvent: "REORDER_DEAL",
                          columns: [
                            {
                              name: "name",
                              label: "Item",
                              icon: "file-text",
                            },
                            {
                              name: "stage",
                              label: "Stage",
                              icon: "git-branch",
                            },
                            {
                              name: "assignee",
                              label: "Assignee",
                              icon: "user",
                            },
                            {
                              name: "value",
                              label: "Value",
                              icon: "dollar-sign",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Pipeline Value",
                              icon: "dollar-sign",
                              entity: "PipelineItem",
                            },
                            {
                              type: "stat-display",
                              label: "Conversion Rate",
                              icon: "trending-up",
                              entity: "PipelineItem",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "git-branch",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.name",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Stage:",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.stage",
                                  variant: "primary",
                                  icon: "arrow-right",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Assignee:",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.assignee",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Priority:",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.priority",
                                  variant: "warning",
                                  icon: "flag",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Move Stage",
                              icon: "arrow-right",
                              variant: "primary",
                              event: "MOVE",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "moving",
                event: "MOVE",
                effects: [
                  ["fetch", "PipelineItem"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "arrow-right",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Move to Stage",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "PipelineItem",
                          title: "Select Stage",
                          submitEvent: "SET_STAGE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "stage",
                              type: "string",
                            },
                            {
                              name: "assignee",
                              type: "string",
                            },
                            {
                              name: "priority",
                              type: "string",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "moving",
                to: "browsing",
                event: "SET_STAGE",
                effects: [
                  ["set", "@entity.stage", "@payload.stage"],
                  ["render-ui", "modal", null],
                  ["fetch", "PipelineItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          content: "Pipeline",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          wrap: true,
                          children: [
                            {
                              type: "badge",
                              label: "Backlog",
                              variant: "secondary",
                              icon: "inbox",
                            },
                            {
                              type: "icon",
                              name: "chevron-right",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "In Progress",
                              variant: "primary",
                              icon: "play",
                            },
                            {
                              type: "icon",
                              name: "chevron-right",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "Review",
                              variant: "warning",
                              icon: "eye",
                            },
                            {
                              type: "icon",
                              name: "chevron-right",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "Done",
                              variant: "success",
                              icon: "check-square",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PipelineItem",
                          variant: "card",
                          groupBy: "stage",
                          reorderable: true,
                          reorderEvent: "REORDER_DEAL",
                          columns: [
                            {
                              name: "name",
                              label: "Item",
                              icon: "file-text",
                            },
                            {
                              name: "stage",
                              label: "Stage",
                              icon: "git-branch",
                            },
                            {
                              name: "assignee",
                              label: "Assignee",
                              icon: "user",
                            },
                            {
                              name: "value",
                              label: "Value",
                              icon: "dollar-sign",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Pipeline Value",
                              icon: "dollar-sign",
                              entity: "PipelineItem",
                            },
                            {
                              type: "stat-display",
                              label: "Conversion Rate",
                              icon: "trending-up",
                              entity: "PipelineItem",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "moving",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "REORDER_DEAL",
                effects: [
                  ["fetch", "PipelineItem"],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "PipelinePage",
          path: "/pipeline",
          isInitial: true,
          traits: [
            {
              ref: "PipelineManager",
            },
          ],
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
export const KANBAN_BEHAVIOR: BehaviorSchema = {
  name: "std-kanban",
  version: "1.0.0",
  description: "Kanban board card management",
  theme: {
    name: "workflow-orange",
    tokens: {
      colors: {
        primary: "#ea580c",
        "primary-hover": "#c2410c",
        "primary-foreground": "#ffffff",
        accent: "#fb923c",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "KanbanOrbital",
      entity: {
        name: "KanbanCard",
        persistence: "persistent",
        collection: "kanban_cards",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "column",
            type: "string",
            default: "todo",
          },
          {
            name: "assignee",
            type: "string",
            default: "",
          },
          {
            name: "dueDate",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "KanbanManager",
          linkedEntity: "KanbanCard",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
              },
              {
                name: "viewing",
              },
              {
                name: "editing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "CREATE",
                name: "Create Card",
              },
              {
                key: "SUBMIT",
                name: "Submit Card",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "column",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "assignee",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "dueDate",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW",
                name: "View Card",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "EDIT",
                name: "Edit Card",
              },
              {
                key: "UPDATE",
                name: "Update Card",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "column",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "assignee",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "dueDate",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "REORDER_CARD",
                name: "Reorder Card",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "KanbanCard"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "list-checks",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Kanban Board",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Card",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "To Do",
                              icon: "circle",
                              entity: "KanbanCard",
                            },
                            {
                              type: "stat-display",
                              label: "In Progress",
                              icon: "play",
                              entity: "KanbanCard",
                            },
                            {
                              type: "stat-display",
                              label: "Done",
                              icon: "check-square",
                              entity: "KanbanCard",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search cards...",
                          entity: "KanbanCard",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "KanbanCard",
                          variant: "card",
                          groupBy: "column",
                          reorderable: true,
                          reorderEvent: "REORDER_CARD",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "columns",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.assignee",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.column",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "list-checks",
                          emptyTitle: "No cards on the board",
                          emptyDescription: "Create your first card to start organizing tasks.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "KanbanCard"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "plus",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Card",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "KanbanCard",
                          title: "Card Details",
                          submitEvent: "SUBMIT",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "column",
                              type: "string",
                            },
                            {
                              name: "assignee",
                              type: "string",
                            },
                            {
                              name: "dueDate",
                              type: "string",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "SUBMIT",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.column", "@payload.column"],
                  ["set", "@entity.assignee", "@payload.assignee"],
                  ["set", "@entity.dueDate", "@payload.dueDate"],
                  ["render-ui", "modal", null],
                  ["fetch", "KanbanCard"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "list-checks",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Kanban Board",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Card",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "To Do",
                              icon: "circle",
                              entity: "KanbanCard",
                            },
                            {
                              type: "stat-display",
                              label: "In Progress",
                              icon: "play",
                              entity: "KanbanCard",
                            },
                            {
                              type: "stat-display",
                              label: "Done",
                              icon: "check-square",
                              entity: "KanbanCard",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search cards...",
                          entity: "KanbanCard",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "KanbanCard",
                          variant: "card",
                          groupBy: "column",
                          reorderable: true,
                          reorderEvent: "REORDER_CARD",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "columns",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.assignee",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.column",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "list-checks",
                          emptyTitle: "No cards on the board",
                          emptyDescription: "Create your first card to start organizing tasks.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "list-checks",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.title",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Column:",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.column",
                                  variant: "primary",
                                  icon: "list-checks",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Assignee:",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.assignee",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Due Date:",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.dueDate",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Edit",
                              icon: "edit",
                              variant: "primary",
                              event: "EDIT",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "editing",
                event: "EDIT",
                effects: [
                  ["fetch", "KanbanCard"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "edit",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Edit Card",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "KanbanCard",
                          title: "Update Card",
                          submitEvent: "UPDATE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "column",
                              type: "string",
                            },
                            {
                              name: "assignee",
                              type: "string",
                            },
                            {
                              name: "dueDate",
                              type: "string",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "UPDATE",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.column", "@payload.column"],
                  ["set", "@entity.assignee", "@payload.assignee"],
                  ["set", "@entity.dueDate", "@payload.dueDate"],
                  ["render-ui", "modal", null],
                  ["fetch", "KanbanCard"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "list-checks",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Kanban Board",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Card",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "To Do",
                              icon: "circle",
                              entity: "KanbanCard",
                            },
                            {
                              type: "stat-display",
                              label: "In Progress",
                              icon: "play",
                              entity: "KanbanCard",
                            },
                            {
                              type: "stat-display",
                              label: "Done",
                              icon: "check-square",
                              entity: "KanbanCard",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search cards...",
                          entity: "KanbanCard",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "KanbanCard",
                          variant: "card",
                          groupBy: "column",
                          reorderable: true,
                          reorderEvent: "REORDER_CARD",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "columns",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.assignee",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.column",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "list-checks",
                          emptyTitle: "No cards on the board",
                          emptyDescription: "Create your first card to start organizing tasks.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "REORDER_CARD",
                effects: [
                  ["fetch", "KanbanCard"],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "KanbanPage",
          path: "/kanban",
          isInitial: true,
          traits: [
            {
              ref: "KanbanManager",
            },
          ],
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
export const REVIEW_BEHAVIOR: BehaviorSchema = {
  name: "std-review",
  version: "1.0.0",
  description: "Review process with scoring and feedback",
  theme: {
    name: "workflow-orange",
    tokens: {
      colors: {
        primary: "#ea580c",
        "primary-hover": "#c2410c",
        "primary-foreground": "#ffffff",
        accent: "#fb923c",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ReviewOrbital",
      entity: {
        name: "ReviewItem",
        persistence: "persistent",
        collection: "review_items",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "content",
            type: "string",
            default: "",
          },
          {
            name: "reviewer",
            type: "string",
            default: "",
          },
          {
            name: "score",
            type: "number",
            default: 0,
          },
          {
            name: "feedback",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "ReviewProcess",
          linkedEntity: "ReviewItem",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "reviewing",
              },
              {
                name: "scored",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "REVIEW",
                name: "Review Item",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "SUBMIT_REVIEW",
                name: "Submit Review",
                payloadSchema: [
                  {
                    name: "score",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "feedback",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "reviewer",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "ReviewItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Review",
                            },
                            {
                              type: "badge",
                              label: "Review Queue",
                              variant: "accent",
                              icon: "list-checks",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Items",
                              icon: "hash",
                              entity: "ReviewItem",
                            },
                            {
                              type: "stat-display",
                              label: "Avg Score",
                              icon: "bar-chart-2",
                              entity: "ReviewItem",
                            },
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "flag",
                              entity: "ReviewItem",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Items to Review",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "ReviewItem",
                                  variant: "card",
                                  itemActions: [
                                    {
                                      label: "Review",
                                      event: "REVIEW",
                                      icon: "edit",
                                    },
                                  ],
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "star",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.title",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.reviewer",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.score",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              title: "Review History",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "ReviewItem",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "star",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.title",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.reviewer",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.score",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "reviewing",
                event: "REVIEW",
                effects: [
                  ["fetch", "ReviewItem"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Review Item",
                            },
                            {
                              type: "badge",
                              label: "In Review",
                              variant: "accent",
                              icon: "edit",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Content Under Review",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
                                    },
                                    {
                                      type: "divider",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.content",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              title: "Review Feedback",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "Rating",
                                    },
                                    {
                                      type: "star-rating",
                                      value: "@entity.score",
                                      max: 5,
                                      label: "Review score",
                                    },
                                    {
                                      type: "divider",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "Decision",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      children: [
                                        {
                                          type: "button",
                                          label: "Approve",
                                          variant: "primary",
                                          icon: "check",
                                        },
                                        {
                                          type: "button",
                                          label: "Request Changes",
                                          variant: "secondary",
                                          icon: "edit",
                                        },
                                        {
                                          type: "button",
                                          label: "Reject",
                                          variant: "danger",
                                          icon: "x",
                                        },
                                      ],
                                    },
                                    {
                                      type: "divider",
                                    },
                                    {
                                      type: "form-section",
                                      entity: "ReviewItem",
                                      title: "Submit Feedback",
                                      submitEvent: "SUBMIT_REVIEW",
                                      cancelEvent: "CANCEL",
                                      fields: [
                                        {
                                          name: "reviewer",
                                          type: "string",
                                        },
                                        {
                                          name: "score",
                                          type: "number",
                                        },
                                        {
                                          name: "feedback",
                                          type: "string",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "scored",
                event: "SUBMIT_REVIEW",
                effects: [
                  ["set", "@entity.score", "@payload.score"],
                  ["set", "@entity.feedback", "@payload.feedback"],
                  ["set", "@entity.reviewer", "@payload.reviewer"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Review Submitted",
                            },
                            {
                              type: "badge",
                              label: "Scored",
                              variant: "success",
                              icon: "check-circle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "star-rating",
                              value: "@entity.score",
                              max: 5,
                              readOnly: true,
                              label: "Final score",
                            },
                            {
                              type: "stat-display",
                              label: "Score",
                              value: "@entity.score",
                              icon: "bar-chart-2",
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Feedback",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.feedback",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Close",
                          icon: "x",
                          variant: "ghost",
                          event: "CLOSE",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "scored",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "ReviewItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Review",
                            },
                            {
                              type: "badge",
                              label: "Review Queue",
                              variant: "accent",
                              icon: "list-checks",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Items",
                              icon: "hash",
                              entity: "ReviewItem",
                            },
                            {
                              type: "stat-display",
                              label: "Avg Score",
                              icon: "bar-chart-2",
                              entity: "ReviewItem",
                            },
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "flag",
                              entity: "ReviewItem",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Items to Review",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "ReviewItem",
                                  variant: "card",
                                  itemActions: [
                                    {
                                      label: "Review",
                                      event: "REVIEW",
                                      icon: "edit",
                                    },
                                  ],
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "star",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.title",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.reviewer",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.score",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              title: "Review History",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "ReviewItem",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "star",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.title",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.reviewer",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.score",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "scored",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "ReviewItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Review",
                            },
                            {
                              type: "badge",
                              label: "Review Queue",
                              variant: "accent",
                              icon: "list-checks",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Items",
                              icon: "hash",
                              entity: "ReviewItem",
                            },
                            {
                              type: "stat-display",
                              label: "Avg Score",
                              icon: "bar-chart-2",
                              entity: "ReviewItem",
                            },
                            {
                              type: "stat-display",
                              label: "Pending",
                              icon: "flag",
                              entity: "ReviewItem",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Items to Review",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "ReviewItem",
                                  variant: "card",
                                  itemActions: [
                                    {
                                      label: "Review",
                                      event: "REVIEW",
                                      icon: "edit",
                                    },
                                  ],
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "star",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.title",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.reviewer",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.score",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              title: "Review History",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "ReviewItem",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "star",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.title",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.reviewer",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.score",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "ReviewsPage",
          path: "/reviews",
          isInitial: true,
          traits: [
            {
              ref: "ReviewProcess",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Workflow Behaviors
// ============================================================================

export const WORKFLOW_BEHAVIORS: BehaviorSchema[] = [
  APPROVAL_BEHAVIOR,
  PIPELINE_BEHAVIOR,
  KANBAN_BEHAVIOR,
  REVIEW_BEHAVIOR,
];
