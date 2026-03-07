/**
 * Media Domain Behaviors
 *
 * Standard behaviors for media: galleries, playback, playlists,
 * and file uploads.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-gallery - Media Gallery
// ============================================================================

/**
 * std-gallery - Media gallery with lightbox viewing and upload.
 * States: browsing -> viewing -> uploading
 */
export const GALLERY_BEHAVIOR: OrbitalSchema = {
  name: 'std-gallery',
  version: '1.0.0',
  description: 'Media gallery with lightbox viewing and upload',
  orbitals: [
    {
      name: 'GalleryOrbital',
      entity: {
        name: 'MediaItem',
        persistence: 'persistent',
        collection: 'media_items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'url', type: 'string', default: '' },
          { name: 'type', type: 'string', default: 'image' },
          { name: 'thumbnailUrl', type: 'string', default: '' },
          { name: 'createdAt', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'GalleryControl',
          linkedEntity: 'MediaItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'uploading' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Item', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'UPLOAD', name: 'Start Upload' },
              { key: 'SAVE', name: 'Save Upload', payloadSchema: [{ name: 'title', type: 'string', required: true }, { name: 'url', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'MediaItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Media Gallery' }],
                  ['render-ui', 'main', { type: 'media-gallery', title: 'Gallery' }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.title',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
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
              {
                from: 'browsing',
                to: 'uploading',
                event: 'UPLOAD',
                effects: [
                  ['fetch', 'MediaItem'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'MediaItem',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'uploading',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.url', '@payload.url'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'MediaItem'],
                  ['render-ui', 'main', { type: 'media-gallery', title: 'Gallery' }],
                ],
              },
              {
                from: 'uploading',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'uploading',
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
          name: 'GalleryPage',
          path: '/gallery',
          isInitial: true,
          traits: [{ ref: 'GalleryControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-player - Media Player
// ============================================================================

/**
 * std-player - Media playback with play/pause controls.
 * States: idle -> playing -> paused
 */
export const PLAYER_BEHAVIOR: OrbitalSchema = {
  name: 'std-player',
  version: '1.0.0',
  description: 'Media player with playback controls',
  orbitals: [
    {
      name: 'PlayerOrbital',
      entity: {
        name: 'PlayerState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'url', type: 'string', default: '' },
          { name: 'duration', type: 'number', default: 0 },
          { name: 'currentTime', type: 'number', default: 0 },
          { name: 'isPlaying', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'PlayerControl',
          linkedEntity: 'PlayerState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'playing' },
              { name: 'paused' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'PLAY', name: 'Play' },
              { key: 'PAUSE', name: 'Pause' },
              { key: 'STOP', name: 'Stop' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.currentTime', 0],
                  ['set', '@entity.isPlaying', false],
                  ['render-ui', 'main', { type: 'page-header', title: 'Media Player' }],
                  ['render-ui', 'main', { type: 'card', title: '@entity.title' }],
                ],
              },
              {
                from: 'idle',
                to: 'playing',
                event: 'PLAY',
                effects: [
                  ['set', '@entity.isPlaying', true],
                  ['render-ui', 'main', { type: 'card', title: '@entity.title' }],
                ],
              },
              {
                from: 'playing',
                to: 'paused',
                event: 'PAUSE',
                effects: [
                  ['set', '@entity.isPlaying', false],
                  ['render-ui', 'main', { type: 'card', title: '@entity.title' }],
                ],
              },
              {
                from: 'paused',
                to: 'playing',
                event: 'PLAY',
                effects: [
                  ['set', '@entity.isPlaying', true],
                  ['render-ui', 'main', { type: 'card', title: '@entity.title' }],
                ],
              },
              {
                from: 'playing',
                to: 'idle',
                event: 'STOP',
                effects: [
                  ['set', '@entity.isPlaying', false],
                  ['set', '@entity.currentTime', 0],
                  ['render-ui', 'main', { type: 'card', title: '@entity.title' }],
                ],
              },
              {
                from: 'paused',
                to: 'idle',
                event: 'STOP',
                effects: [
                  ['set', '@entity.isPlaying', false],
                  ['set', '@entity.currentTime', 0],
                  ['render-ui', 'main', { type: 'card', title: '@entity.title' }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'PlayerPage',
          path: '/player',
          isInitial: true,
          traits: [{ ref: 'PlayerControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-playlist - Playlist Management
// ============================================================================

/**
 * std-playlist - Playlist management with ordering.
 * States: browsing -> viewing -> editing
 */
export const PLAYLIST_BEHAVIOR: OrbitalSchema = {
  name: 'std-playlist',
  version: '1.0.0',
  description: 'Playlist management with track ordering',
  orbitals: [
    {
      name: 'PlaylistOrbital',
      entity: {
        name: 'PlaylistItem',
        persistence: 'persistent',
        collection: 'playlist_items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'artist', type: 'string', default: '' },
          { name: 'duration', type: 'number', default: 0 },
          { name: 'order', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'PlaylistControl',
          linkedEntity: 'PlaylistItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Track', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'EDIT', name: 'Edit Track' },
              { key: 'SAVE', name: 'Save Track', payloadSchema: [{ name: 'title', type: 'string', required: true }, { name: 'artist', type: 'string', required: true }] },
              { key: 'BACK', name: 'Back to Playlist' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'PlaylistItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Playlist' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'PlaylistItem',
                  
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Track Details', 
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', title: '@entity.title' }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'PlaylistItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Edit Track', 
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'PlaylistItem' }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.artist', '@payload.artist'],
                  ['fetch', 'PlaylistItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Playlist' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'PlaylistItem',
                  
  itemActions: [
    { label: 'View', event: 'VIEW' },
  ],
}],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'PlaylistItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Playlist' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'PlaylistItem',
                  
  itemActions: [
    { label: 'View', event: 'VIEW' },
  ],
}],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'PlaylistItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Playlist' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'PlaylistItem',
                  
  itemActions: [
    { label: 'View', event: 'VIEW' },
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
          name: 'PlaylistPage',
          path: '/playlist',
          isInitial: true,
          traits: [{ ref: 'PlaylistControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-upload - File Upload
// ============================================================================

/**
 * std-upload - File upload tracking with progress.
 * States: idle -> uploading -> completed -> failed
 */
export const UPLOAD_BEHAVIOR: OrbitalSchema = {
  name: 'std-upload',
  version: '1.0.0',
  description: 'File upload tracking with progress indicator',
  orbitals: [
    {
      name: 'UploadOrbital',
      entity: {
        name: 'UploadState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'fileName', type: 'string', default: '' },
          { name: 'fileSize', type: 'number', default: 0 },
          { name: 'progress', type: 'number', default: 0 },
          { name: 'status', type: 'string', default: 'idle' },
        ],
      },
      traits: [
        {
          name: 'UploadControl',
          linkedEntity: 'UploadState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'uploading' },
              { name: 'completed' },
              { name: 'failed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START_UPLOAD', name: 'Start Upload', payloadSchema: [{ name: 'fileName', type: 'string', required: true }] },
              { key: 'COMPLETE', name: 'Upload Complete' },
              { key: 'FAIL', name: 'Upload Failed' },
              { key: 'RETRY', name: 'Retry Upload' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.progress', 0],
                  ['set', '@entity.status', 'idle'],
                  ['render-ui', 'main', { type: 'page-header', title: 'File Upload' }],
                  ['render-ui', 'main', { type: 'card', title: '@entity.id' }],
                ],
              },
              {
                from: 'idle',
                to: 'uploading',
                event: 'START_UPLOAD',
                effects: [
                  ['set', '@entity.fileName', '@payload.fileName'],
                  ['set', '@entity.progress', 0],
                  ['set', '@entity.status', 'uploading'],
                  ['render-ui', 'main', { type: 'progress-bar', value: 0, label: 'Upload Progress' }],
                ],
              },
              {
                from: 'uploading',
                to: 'completed',
                event: 'COMPLETE',
                effects: [
                  ['set', '@entity.progress', 100],
                  ['set', '@entity.status', 'completed'],
                  ['render-ui', 'main', { type: 'card', title: '@entity.id' }],
                ],
              },
              {
                from: 'uploading',
                to: 'failed',
                event: 'FAIL',
                effects: [
                  ['set', '@entity.status', 'failed'],
                  ['render-ui', 'main', { type: 'card', title: '@entity.id' }],
                ],
              },
              {
                from: 'failed',
                to: 'uploading',
                event: 'RETRY',
                effects: [
                  ['set', '@entity.progress', 0],
                  ['set', '@entity.status', 'uploading'],
                  ['render-ui', 'main', { type: 'progress-bar', value: 0, label: 'Upload Progress' }],
                ],
              },
              {
                from: 'completed',
                to: 'idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.progress', 0],
                  ['set', '@entity.status', 'idle'],
                  ['render-ui', 'main', { type: 'card', title: '@entity.id' }],
                ],
              },
              {
                from: 'failed',
                to: 'idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.progress', 0],
                  ['set', '@entity.status', 'idle'],
                  ['render-ui', 'main', { type: 'card', title: '@entity.id' }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'UploadPage',
          path: '/upload',
          isInitial: true,
          traits: [{ ref: 'UploadControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Media Behaviors
// ============================================================================

export const MEDIA_BEHAVIORS: OrbitalSchema[] = [
  GALLERY_BEHAVIOR,
  PLAYER_BEHAVIOR,
  PLAYLIST_BEHAVIOR,
  UPLOAD_BEHAVIOR,
];
