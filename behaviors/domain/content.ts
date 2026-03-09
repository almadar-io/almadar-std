/**
 * Content Domain Behaviors
 *
 * Standard behaviors for content management: articles, reading experience,
 * bookmarks, annotations, and content feeds.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * Molecule-first UI: all render-ui effects use atom/molecule compositions
 * (stack, typography, icon, button, badge, etc.) instead of organism-level
 * patterns (entity-cards, entity-table, entity-list, detail-panel, page-header).
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ============================================================================
// Theme
// ============================================================================

const contentAmberTheme = {
  name: 'content-amber',
  tokens: {
    colors: {
      primary: '#d97706',
      'primary-hover': '#b45309',
      'primary-foreground': '#ffffff',
      accent: '#f59e0b',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-article - Shared main-view effects
// ============================================================================

const articleBrowsingMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'stack',
    direction: 'vertical',
    gap: 'lg',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        justify: 'space-between',
        align: 'center',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'file-text', size: 'lg' },
              { type: 'typography', variant: 'h2', text: 'Articles' },
            ],
          },
          { type: 'badge', label: 'Content Hub', color: 'primary' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stats',
        entity: 'Article',
      },
      {
        type: 'search-input',
        placeholder: 'Search articles by title or author...',
        event: 'EDIT_ARTICLE',
      },
      {
        type: 'data-grid',
        entity: 'Article',
        columns: [
          { field: 'title', label: 'Title' },
          { field: 'author', label: 'Author' },
          { field: 'status', label: 'Status' },
          { field: 'publishedAt', label: 'Published' },
        ],
        itemActions: [
          { label: 'Edit', event: 'EDIT_ARTICLE', icon: 'pencil' },
        ],
      },
    ],
  }],
];

const articleEditMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'stack',
    direction: 'vertical',
    gap: 'md',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        gap: 'sm',
        align: 'center',
        children: [
          { type: 'icon', name: 'pen-tool', size: 'lg' },
          { type: 'typography', variant: 'h2', text: 'Edit Article' },
        ],
      },
      { type: 'divider' },
      {
        type: 'form-section',
        entity: 'Article',
      },
    ],
  }],
];

// ============================================================================
// std-article - Article Management
// ============================================================================

/**
 * std-article - Article management with content workflow.
 * Entity: Article with title, body, status, author, publishedAt.
 * States: browsing -> editing -> previewing -> published.
 */
export const ARTICLE_BEHAVIOR: BehaviorSchema = {
  name: 'std-article',
  version: '1.0.0',
  description: 'Article management with editing, preview, and publish workflow',
  theme: contentAmberTheme,
  orbitals: [
    {
      name: 'ArticleOrbital',
      entity: {
        name: 'Article',
        persistence: 'persistent',
        collection: 'articles',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'body', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'draft' },
          { name: 'author', type: 'string', default: '' },
          { name: 'publishedAt', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ArticleWorkflow',
          linkedEntity: 'Article',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'editing' },
              { name: 'previewing' },
              { name: 'published' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'EDIT_ARTICLE', name: 'Edit Article', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'SAVE_DRAFT', name: 'Save Draft', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'body', type: 'string', required: true },
              ] },
              { key: 'PREVIEW', name: 'Preview' },
              { key: 'PUBLISH', name: 'Publish' },
              { key: 'BACK_TO_EDIT', name: 'Back to Edit' },
              { key: 'BACK_TO_LIST', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Article'],
                  ...articleBrowsingMainEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT_ARTICLE',
                effects: [
                  ['fetch', 'Article'],
                  ...articleEditMainEffects,
                ],
              },
              {
                from: 'editing',
                to: 'editing',
                event: 'SAVE_DRAFT',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.body', '@payload.body'],
                  ['set', '@entity.status', 'draft'],
                  ['render-ui', 'main', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'sm',
                        align: 'center',
                        children: [
                          { type: 'icon', name: 'pen-tool', size: 'lg' },
                          { type: 'typography', variant: 'h2', text: 'Edit Article' },
                          { type: 'badge', label: 'Draft Saved', color: 'success' },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'form-section', entity: 'Article' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'previewing',
                event: 'PREVIEW',
                effects: [
                  ['fetch', 'Article'],
                  ['render-ui', 'main', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        justify: 'space-between',
                        align: 'center',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'eye', size: 'lg' },
                              { type: 'typography', variant: 'h2', text: 'Preview Article' },
                            ],
                          },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            children: [
                              { type: 'button', label: 'Back to Edit', event: 'BACK_TO_EDIT', variant: 'secondary' },
                              { type: 'button', label: 'Publish', event: 'PUBLISH', variant: 'primary' },
                            ],
                          },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'typography', variant: 'h3', text: '@entity.title' },
                      { type: 'typography', variant: 'body', text: '@entity.body' },
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'md',
                        children: [
                          { type: 'badge', label: '@entity.status', color: 'warning' },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'type', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: '@entity.author' },
                            ],
                          },
                        ],
                      },
                    ],
                  }],
                ],
              },
              {
                from: 'previewing',
                to: 'editing',
                event: 'BACK_TO_EDIT',
                effects: [
                  ['fetch', 'Article'],
                  ...articleEditMainEffects,
                ],
              },
              {
                from: 'previewing',
                to: 'published',
                event: 'PUBLISH',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.status', 'published'],
                  ['render-ui', 'main', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'sm',
                        align: 'center',
                        children: [
                          { type: 'icon', name: 'book-open', size: 'lg' },
                          { type: 'typography', variant: 'h2', text: 'Published' },
                          { type: 'badge', label: 'Live', color: 'success' },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'typography', variant: 'h3', text: '@entity.title' },
                      { type: 'typography', variant: 'body', text: '@entity.body' },
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'md',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'type', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: '@entity.author' },
                            ],
                          },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'calendar', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: '@entity.publishedAt' },
                            ],
                          },
                        ],
                      },
                      { type: 'button', label: 'Back to Articles', event: 'BACK_TO_LIST', variant: 'secondary' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'Article'],
                  ...articleBrowsingMainEffects,
                ],
              },
              {
                from: 'published',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'Article'],
                  ...articleBrowsingMainEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ArticlesPage',
          path: '/articles',
          isInitial: true,
          traits: [{ ref: 'ArticleWorkflow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-reader - Shared main-view effects
// ============================================================================

const readerBrowsingMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'stack',
    direction: 'vertical',
    gap: 'lg',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        justify: 'space-between',
        align: 'center',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'book-open', size: 'lg' },
              { type: 'typography', variant: 'h2', text: 'Library' },
            ],
          },
          { type: 'badge', label: 'Reading Hub', color: 'accent' },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-list',
        entity: 'ReadingState',
        fields: ['articleId', 'fontSize', 'theme'],
        itemActions: [
          { label: 'Read', event: 'OPEN_ARTICLE', icon: 'book-open' },
        ],
      },
    ],
  }],
];

// ============================================================================
// std-reader - Reading Experience
// ============================================================================

/**
 * std-reader - Reading experience with list-to-detail navigation.
 * Entity: ReadingState with articleId, scrollPosition, fontSize, theme.
 * States: browsing -> reading.
 */
export const READER_BEHAVIOR: BehaviorSchema = {
  name: 'std-reader',
  version: '1.0.0',
  description: 'Reading experience with customizable display settings',
  theme: contentAmberTheme,
  orbitals: [
    {
      name: 'ReaderOrbital',
      entity: {
        name: 'ReadingState',
        persistence: 'persistent',
        collection: 'reading_states',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'articleId', type: 'string', default: '' },
          { name: 'scrollPosition', type: 'number', default: 0 },
          { name: 'fontSize', type: 'number', default: 16 },
          { name: 'theme', type: 'string', default: 'light' },
        ],
      },
      traits: [
        {
          name: 'ReaderControl',
          linkedEntity: 'ReadingState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'reading' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'OPEN_ARTICLE', name: 'Open Article', payloadSchema: [
                { name: 'articleId', type: 'string', required: true },
              ] },
              { key: 'UPDATE_SETTINGS', name: 'Update Settings', payloadSchema: [
                { name: 'fontSize', type: 'number', required: true },
              ] },
              { key: 'BACK_TO_LIST', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'ReadingState'],
                  ...readerBrowsingMainEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'reading',
                event: 'OPEN_ARTICLE',
                effects: [
                  ['fetch', 'ReadingState'],
                  ['set', '@entity.articleId', '@payload.articleId'],
                  ['render-ui', 'main', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        justify: 'space-between',
                        align: 'center',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'eye', size: 'lg' },
                              { type: 'typography', variant: 'h2', text: 'Reading' },
                            ],
                          },
                          { type: 'button', label: 'Back to Library', event: 'BACK_TO_LIST', variant: 'secondary' },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'meter', value: '@entity.scrollPosition', max: 100, label: 'Reading Progress' },
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'lg',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'type', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: 'Font Size' },
                              { type: 'badge', label: '@entity.fontSize', color: 'primary' },
                            ],
                          },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'image', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: 'Theme' },
                              { type: 'badge', label: '@entity.theme', color: 'accent' },
                            ],
                          },
                        ],
                      },
                      { type: 'typography', variant: 'body', text: '@entity.articleId' },
                    ],
                  }],
                ],
              },
              {
                from: 'reading',
                to: 'reading',
                event: 'UPDATE_SETTINGS',
                effects: [
                  ['fetch', 'ReadingState'],
                  ['set', '@entity.fontSize', '@payload.fontSize'],
                  ['render-ui', 'main', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        justify: 'space-between',
                        align: 'center',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'eye', size: 'lg' },
                              { type: 'typography', variant: 'h2', text: 'Reading' },
                              { type: 'badge', label: 'Settings Updated', color: 'success' },
                            ],
                          },
                          { type: 'button', label: 'Back to Library', event: 'BACK_TO_LIST', variant: 'secondary' },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'meter', value: '@entity.scrollPosition', max: 100, label: 'Reading Progress' },
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'lg',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'type', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: 'Font Size' },
                              { type: 'badge', label: '@entity.fontSize', color: 'primary' },
                            ],
                          },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'image', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: 'Theme' },
                              { type: 'badge', label: '@entity.theme', color: 'accent' },
                            ],
                          },
                        ],
                      },
                      { type: 'typography', variant: 'body', text: '@entity.articleId' },
                    ],
                  }],
                ],
              },
              {
                from: 'reading',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'ReadingState'],
                  ...readerBrowsingMainEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ReaderPage',
          path: '/reader',
          isInitial: true,
          traits: [{ ref: 'ReaderControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-bookmark - Shared main-view effects
// ============================================================================

const bookmarkBrowsingMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'stack',
    direction: 'vertical',
    gap: 'lg',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        justify: 'space-between',
        align: 'center',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'tag', size: 'lg' },
              { type: 'typography', variant: 'h2', text: 'Bookmarks' },
            ],
          },
          { type: 'button', label: 'Create Bookmark', event: 'CREATE', variant: 'primary', icon: 'tag' },
        ],
      },
      { type: 'divider' },
      { type: 'stats', entity: 'Bookmark' },
      { type: 'search-input', placeholder: 'Filter by title, URL, or category...', event: 'VIEW' },
      {
        type: 'data-list',
        entity: 'Bookmark',
        fields: ['title', 'url', 'category', 'createdAt'],
        itemActions: [
          { label: 'View', event: 'VIEW', icon: 'eye' },
        ],
      },
    ],
  }],
];

// ============================================================================
// std-bookmark - Bookmark Management
// ============================================================================

/**
 * std-bookmark - Bookmark management with CRUD operations.
 * Entity: Bookmark with title, url, category, createdAt.
 * States: browsing -> creating -> viewing.
 */
export const BOOKMARK_BEHAVIOR: BehaviorSchema = {
  name: 'std-bookmark',
  version: '1.0.0',
  description: 'Bookmark management with create, browse, and view',
  theme: contentAmberTheme,
  orbitals: [
    {
      name: 'BookmarkOrbital',
      entity: {
        name: 'Bookmark',
        persistence: 'persistent',
        collection: 'bookmarks',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'url', type: 'string', default: '' },
          { name: 'category', type: 'string', default: '' },
          { name: 'createdAt', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'BookmarkControl',
          linkedEntity: 'Bookmark',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'Create Bookmark' },
              { key: 'SAVE', name: 'Save Bookmark', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'url', type: 'string', required: true },
                { name: 'category', type: 'string', required: true },
              ] },
              { key: 'VIEW', name: 'View Bookmark', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Bookmark'],
                  ...bookmarkBrowsingMainEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'Bookmark'],
                  ['render-ui', 'modal', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'sm',
                        align: 'center',
                        children: [
                          { type: 'icon', name: 'tag', size: 'md' },
                          { type: 'typography', variant: 'h3', text: 'New Bookmark' },
                        ],
                      },
                      { type: 'divider' },
                      {
                        type: 'form-section',
                        entity: 'Bookmark',
                        submitEvent: 'SAVE',
                        cancelEvent: 'CANCEL',
                      },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['fetch', 'Bookmark'],
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.url', '@payload.url'],
                  ['set', '@entity.category', '@payload.category'],
                  ['render-ui', 'modal', null],
                  ...bookmarkBrowsingMainEffects,
                ],
              },
              { from: 'creating', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'creating', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Bookmark'],
                  ['render-ui', 'modal', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        justify: 'space-between',
                        align: 'center',
                        children: [
                          { type: 'typography', variant: 'h3', text: '@entity.title' },
                          { type: 'button', label: 'Close', event: 'CLOSE', variant: 'ghost' },
                        ],
                      },
                      { type: 'divider' },
                      {
                        type: 'stack',
                        direction: 'vertical',
                        gap: 'sm',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'tag', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: 'URL' },
                            ],
                          },
                          { type: 'typography', variant: 'body', text: '@entity.url' },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'md',
                            children: [
                              { type: 'badge', label: '@entity.category', color: 'primary' },
                              {
                                type: 'stack',
                                direction: 'horizontal',
                                gap: 'xs',
                                align: 'center',
                                children: [
                                  { type: 'icon', name: 'calendar', size: 'sm' },
                                  { type: 'typography', variant: 'caption', text: '@entity.createdAt' },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  }],
                ],
              },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'BookmarksPage',
          path: '/bookmarks',
          isInitial: true,
          traits: [{ ref: 'BookmarkControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-annotation - Shared main-view effects
// ============================================================================

const annotationBrowsingMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'stack',
    direction: 'vertical',
    gap: 'lg',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        justify: 'space-between',
        align: 'center',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'pencil', size: 'lg' },
              { type: 'typography', variant: 'h2', text: 'Annotations' },
            ],
          },
          { type: 'button', label: 'Add Annotation', event: 'ADD_ANNOTATION', variant: 'primary', icon: 'pencil' },
        ],
      },
      { type: 'divider' },
      { type: 'stats', entity: 'Annotation' },
      { type: 'search-input', placeholder: 'Search highlights and notes...', event: 'VIEW_ANNOTATION' },
      {
        type: 'data-grid',
        entity: 'Annotation',
        columns: [
          { field: 'text', label: 'Highlighted Text' },
          { field: 'note', label: 'Note' },
          { field: 'color', label: 'Color' },
          { field: 'pageNumber', label: 'Page' },
        ],
        itemActions: [
          { label: 'View', event: 'VIEW_ANNOTATION', icon: 'eye' },
        ],
      },
    ],
  }],
];

// ============================================================================
// std-annotation - Text Annotations
// ============================================================================

/**
 * std-annotation - Text annotation management with highlight and note.
 * Entity: Annotation with text, note, color, pageNumber.
 * States: browsing -> annotating -> viewing.
 */
export const ANNOTATION_BEHAVIOR: BehaviorSchema = {
  name: 'std-annotation',
  version: '1.0.0',
  description: 'Text annotation with highlight, note, and color coding',
  theme: contentAmberTheme,
  orbitals: [
    {
      name: 'AnnotationOrbital',
      entity: {
        name: 'Annotation',
        persistence: 'persistent',
        collection: 'annotations',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'text', type: 'string', default: '' },
          { name: 'note', type: 'string', default: '' },
          { name: 'color', type: 'string', default: 'yellow' },
          { name: 'pageNumber', type: 'number', default: 1 },
        ],
      },
      traits: [
        {
          name: 'AnnotationControl',
          linkedEntity: 'Annotation',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'annotating' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'ADD_ANNOTATION', name: 'Add Annotation' },
              { key: 'SAVE_ANNOTATION', name: 'Save Annotation', payloadSchema: [
                { name: 'text', type: 'string', required: true },
                { name: 'note', type: 'string', required: true },
                { name: 'color', type: 'string', required: true },
              ] },
              { key: 'VIEW_ANNOTATION', name: 'View Annotation', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Annotation'],
                  ...annotationBrowsingMainEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'annotating',
                event: 'ADD_ANNOTATION',
                effects: [
                  ['fetch', 'Annotation'],
                  ['render-ui', 'modal', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'sm',
                        align: 'center',
                        children: [
                          { type: 'icon', name: 'pencil', size: 'md' },
                          { type: 'typography', variant: 'h3', text: 'New Annotation' },
                        ],
                      },
                      { type: 'divider' },
                      {
                        type: 'form-section',
                        entity: 'Annotation',
                        submitEvent: 'SAVE_ANNOTATION',
                        cancelEvent: 'CANCEL',
                      },
                    ],
                  }],
                ],
              },
              {
                from: 'annotating',
                to: 'browsing',
                event: 'SAVE_ANNOTATION',
                effects: [
                  ['fetch', 'Annotation'],
                  ['set', '@entity.text', '@payload.text'],
                  ['set', '@entity.note', '@payload.note'],
                  ['set', '@entity.color', '@payload.color'],
                  ['render-ui', 'modal', null],
                  ...annotationBrowsingMainEffects,
                ],
              },
              { from: 'annotating', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'annotating', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_ANNOTATION',
                effects: [
                  ['fetch', 'Annotation'],
                  ['render-ui', 'modal', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        justify: 'space-between',
                        align: 'center',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'pencil', size: 'md' },
                              { type: 'typography', variant: 'h3', text: 'Annotation Detail' },
                            ],
                          },
                          { type: 'button', label: 'Close', event: 'CLOSE', variant: 'ghost' },
                        ],
                      },
                      { type: 'divider' },
                      {
                        type: 'stack',
                        direction: 'vertical',
                        gap: 'sm',
                        children: [
                          { type: 'typography', variant: 'label', text: 'Highlighted Text' },
                          { type: 'typography', variant: 'body', text: '@entity.text' },
                          { type: 'divider' },
                          { type: 'typography', variant: 'label', text: 'Note' },
                          { type: 'typography', variant: 'body', text: '@entity.note' },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'md',
                            children: [
                              { type: 'badge', label: '@entity.color', color: 'accent' },
                              {
                                type: 'stack',
                                direction: 'horizontal',
                                gap: 'xs',
                                align: 'center',
                                children: [
                                  { type: 'icon', name: 'file-text', size: 'sm' },
                                  { type: 'typography', variant: 'caption', text: 'Page' },
                                  { type: 'badge', label: '@entity.pageNumber', color: 'primary' },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  }],
                ],
              },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'AnnotationsPage',
          path: '/annotations',
          isInitial: true,
          traits: [{ ref: 'AnnotationControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-content-feed - Shared main-view effects
// ============================================================================

const feedBrowsingMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'stack',
    direction: 'vertical',
    gap: 'lg',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        justify: 'space-between',
        align: 'center',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'file-text', size: 'lg' },
              { type: 'typography', variant: 'h2', text: 'Content Feed' },
            ],
          },
          { type: 'badge', label: 'Live', color: 'success' },
        ],
      },
      { type: 'divider' },
      { type: 'stats', entity: 'FeedItem' },
      { type: 'search-input', placeholder: 'Search feed by title or source...', event: 'READ_ITEM' },
      {
        type: 'data-list',
        entity: 'FeedItem',
        fields: ['title', 'summary', 'source', 'publishedAt', 'isRead'],
        itemActions: [
          { label: 'Read', event: 'READ_ITEM', icon: 'book-open' },
        ],
      },
    ],
  }],
];

// ============================================================================
// std-content-feed - Content Feed
// ============================================================================

/**
 * std-content-feed - Content feed consumption with read and archive.
 * Entity: FeedItem with title, summary, source, publishedAt, isRead.
 * States: browsing -> reading -> archiving.
 */
export const CONTENT_FEED_BEHAVIOR: BehaviorSchema = {
  name: 'std-content-feed',
  version: '1.0.0',
  description: 'Content feed with read tracking and archiving',
  theme: contentAmberTheme,
  orbitals: [
    {
      name: 'ContentFeedOrbital',
      entity: {
        name: 'FeedItem',
        persistence: 'persistent',
        collection: 'feed_items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'summary', type: 'string', default: '' },
          { name: 'source', type: 'string', default: '' },
          { name: 'publishedAt', type: 'string', default: '' },
          { name: 'isRead', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'FeedControl',
          linkedEntity: 'FeedItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'reading' },
              { name: 'archiving' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'READ_ITEM', name: 'Read Item', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'ARCHIVE_ITEM', name: 'Archive Item' },
              { key: 'CONFIRM_ARCHIVE', name: 'Confirm Archive' },
              { key: 'BACK_TO_FEED', name: 'Back to Feed' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'FeedItem'],
                  ...feedBrowsingMainEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'reading',
                event: 'READ_ITEM',
                effects: [
                  ['fetch', 'FeedItem'],
                  ['set', '@entity.isRead', true],
                  ['render-ui', 'main', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        justify: 'space-between',
                        align: 'center',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'book-open', size: 'lg' },
                              { type: 'typography', variant: 'h2', text: '@entity.title' },
                            ],
                          },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'sm',
                            children: [
                              { type: 'button', label: 'Archive', event: 'ARCHIVE_ITEM', variant: 'secondary' },
                              { type: 'button', label: 'Back to Feed', event: 'BACK_TO_FEED', variant: 'ghost' },
                            ],
                          },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'typography', variant: 'body', text: '@entity.summary' },
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'md',
                        children: [
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'file-text', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: '@entity.source' },
                            ],
                          },
                          {
                            type: 'stack',
                            direction: 'horizontal',
                            gap: 'xs',
                            align: 'center',
                            children: [
                              { type: 'icon', name: 'calendar', size: 'sm' },
                              { type: 'typography', variant: 'caption', text: '@entity.publishedAt' },
                            ],
                          },
                          { type: 'badge', label: 'Read', color: 'success' },
                        ],
                      },
                    ],
                  }],
                ],
              },
              {
                from: 'reading',
                to: 'archiving',
                event: 'ARCHIVE_ITEM',
                effects: [
                  ['render-ui', 'modal', {
                    type: 'stack',
                    direction: 'vertical',
                    gap: 'md',
                    children: [
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'sm',
                        align: 'center',
                        children: [
                          { type: 'icon', name: 'tag', size: 'md' },
                          { type: 'typography', variant: 'h3', text: 'Archive Item' },
                        ],
                      },
                      { type: 'divider' },
                      { type: 'typography', variant: 'body', text: 'Are you sure you want to archive this item?' },
                      {
                        type: 'stack',
                        direction: 'horizontal',
                        gap: 'sm',
                        justify: 'flex-end',
                        children: [
                          { type: 'button', label: 'Cancel', event: 'CANCEL', variant: 'secondary' },
                          { type: 'button', label: 'Confirm', event: 'CONFIRM_ARCHIVE', variant: 'primary' },
                        ],
                      },
                    ],
                  }],
                ],
              },
              {
                from: 'archiving',
                to: 'browsing',
                event: 'CONFIRM_ARCHIVE',
                effects: [
                  ['fetch', 'FeedItem'],
                  ['render-ui', 'modal', null],
                  ...feedBrowsingMainEffects,
                ],
              },
              { from: 'archiving', to: 'reading', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'archiving', to: 'reading', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'reading',
                to: 'browsing',
                event: 'BACK_TO_FEED',
                effects: [
                  ['fetch', 'FeedItem'],
                  ...feedBrowsingMainEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'FeedPage',
          path: '/feed',
          isInitial: true,
          traits: [{ ref: 'FeedControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Content Behaviors
// ============================================================================

export const CONTENT_BEHAVIORS: BehaviorSchema[] = [
  ARTICLE_BEHAVIOR,
  READER_BEHAVIOR,
  BOOKMARK_BEHAVIOR,
  ANNOTATION_BEHAVIOR,
  CONTENT_FEED_BEHAVIOR,
];
