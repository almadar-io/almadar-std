/**
 * Content Domain Behaviors
 *
 * Standard behaviors for content management: articles, reading experience,
 * bookmarks, annotations, and content feeds.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-article - Article Management
// ============================================================================

/**
 * std-article - Article management with content workflow.
 * Entity: Article with title, body, status, author, publishedAt.
 * States: browsing -> editing -> previewing -> published.
 */
export const ARTICLE_BEHAVIOR: OrbitalSchema = {
  name: 'std-article',
  version: '1.0.0',
  description: 'Article management with editing, preview, and publish workflow',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Articles' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Article' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search articles', event: 'EDIT_ARTICLE' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Article',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT_ARTICLE' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT_ARTICLE',
                effects: [
                  ['fetch', 'Article'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Edit Article' }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Article' }],
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
                  ['render-ui', 'main', { type: 'form-section', entity: 'Article' }],
                ],
              },
              {
                from: 'editing',
                to: 'previewing',
                event: 'PREVIEW',
                effects: [
                  ['fetch', 'Article'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Preview Article' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Article' }],
                ],
              },
              {
                from: 'previewing',
                to: 'editing',
                event: 'BACK_TO_EDIT',
                effects: [
                  ['fetch', 'Article'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Edit Article' }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Article' }],
                ],
              },
              {
                from: 'previewing',
                to: 'published',
                event: 'PUBLISH',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.status', 'published'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Published' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Article' }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'Article'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Articles' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Article' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Article',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT_ARTICLE' },
                    ],
                  }],
                ],
              },
              {
                from: 'published',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'Article'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Articles' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Article' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Article',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT_ARTICLE' },
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
// std-reader - Reading Experience
// ============================================================================

/**
 * std-reader - Reading experience with list-to-detail navigation.
 * Entity: ReadingState with articleId, scrollPosition, fontSize, theme.
 * States: browsing -> reading.
 */
export const READER_BEHAVIOR: OrbitalSchema = {
  name: 'std-reader',
  version: '1.0.0',
  description: 'Reading experience with customizable display settings',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Library' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'ReadingState',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'reading',
                event: 'OPEN_ARTICLE',
                effects: [
                  ['fetch', 'ReadingState'],
                  ['set', '@entity.articleId', '@payload.articleId'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reading' }],
                  ['render-ui', 'main', { type: 'progress-bar', value: '@entity.scrollPosition', label: 'Reading Progress' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'ReadingState' }],
                ],
              },
              {
                from: 'reading',
                to: 'reading',
                event: 'UPDATE_SETTINGS',
                effects: [
                  ['fetch', 'ReadingState'],
                  ['set', '@entity.fontSize', '@payload.fontSize'],
                  ['render-ui', 'main', { type: 'progress-bar', value: '@entity.scrollPosition', label: 'Reading Progress' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'ReadingState' }],
                ],
              },
              {
                from: 'reading',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'ReadingState'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Library' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'ReadingState',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
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
// std-bookmark - Bookmark Management
// ============================================================================

/**
 * std-bookmark - Bookmark management with CRUD operations.
 * Entity: Bookmark with title, url, category, createdAt.
 * States: browsing -> creating -> viewing.
 */
export const BOOKMARK_BEHAVIOR: OrbitalSchema = {
  name: 'std-bookmark',
  version: '1.0.0',
  description: 'Bookmark management with create, browse, and view',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Bookmarks',
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Bookmark' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search bookmarks', event: 'VIEW' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Bookmark',
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
                  ['fetch', 'Bookmark'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Bookmark',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
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
                  ['render-ui', 'main', { type: 'stats', entity: 'Bookmark' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Bookmark',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
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
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Bookmark',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
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
// std-annotation - Text Annotations
// ============================================================================

/**
 * std-annotation - Text annotation management with highlight and note.
 * Entity: Annotation with text, note, color, pageNumber.
 * States: browsing -> annotating -> viewing.
 */
export const ANNOTATION_BEHAVIOR: OrbitalSchema = {
  name: 'std-annotation',
  version: '1.0.0',
  description: 'Text annotation with highlight, note, and color coding',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Annotations' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Annotation' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search annotations', event: 'VIEW_ANNOTATION' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Annotation',
                    itemActions: [
                      { label: 'View', event: 'VIEW_ANNOTATION' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'annotating',
                event: 'ADD_ANNOTATION',
                effects: [
                  ['fetch', 'Annotation'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Annotation',
                    submitEvent: 'SAVE_ANNOTATION',
                    cancelEvent: 'CANCEL',
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
                  ['render-ui', 'main', { type: 'stats', entity: 'Annotation' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Annotation',
                    itemActions: [
                      { label: 'View', event: 'VIEW_ANNOTATION' },
                    ],
                  }],
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
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Annotation',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
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
// std-content-feed - Content Feed
// ============================================================================

/**
 * std-content-feed - Content feed consumption with read and archive.
 * Entity: FeedItem with title, summary, source, publishedAt, isRead.
 * States: browsing -> reading -> archiving.
 */
export const CONTENT_FEED_BEHAVIOR: OrbitalSchema = {
  name: 'std-content-feed',
  version: '1.0.0',
  description: 'Content feed with read tracking and archiving',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Content Feed' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'FeedItem' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search feed', event: 'READ_ITEM' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FeedItem',
                    itemActions: [
                      { label: 'Read', event: 'READ_ITEM' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'reading',
                event: 'READ_ITEM',
                effects: [
                  ['fetch', 'FeedItem'],
                  ['set', '@entity.isRead', true],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reading' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'FeedItem' }],
                ],
              },
              {
                from: 'reading',
                to: 'archiving',
                event: 'ARCHIVE_ITEM',
                effects: [
                  ['render-ui', 'modal', { type: 'confirm-dialog',
                    title: 'Archive Item',
                    message: 'Are you sure you want to archive this item?',
                    confirmText: 'Confirm',
                    cancelText: 'Cancel',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Content Feed' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'FeedItem' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FeedItem',
                    itemActions: [
                      { label: 'Read', event: 'READ_ITEM' },
                    ],
                  }],
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Content Feed' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'FeedItem' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FeedItem',
                    itemActions: [
                      { label: 'Read', event: 'READ_ITEM' },
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

export const CONTENT_BEHAVIORS: OrbitalSchema[] = [
  ARTICLE_BEHAVIOR,
  READER_BEHAVIOR,
  BOOKMARK_BEHAVIOR,
  ANNOTATION_BEHAVIOR,
  CONTENT_FEED_BEHAVIOR,
];
