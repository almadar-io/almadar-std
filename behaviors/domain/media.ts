/**
 * Media Domain Behaviors
 *
 * Standard behaviors for media: galleries, playback, playlists,
 * and file uploads.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * stack wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema } from '../types.js';

// ── Shared Media Theme ──────────────────────────────────────────────

const MEDIA_THEME = {
  name: 'media-fuchsia',
  tokens: {
    colors: {
      primary: '#c026d3',
      'primary-hover': '#a21caf',
      'primary-foreground': '#ffffff',
      accent: '#e879f9',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-gallery - Media Gallery
// ============================================================================

// ── Reusable main-view effects (gallery browsing) ───────────────────

const galleryBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: image icon + title + upload button
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'image', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Media Gallery' },
    ]},
    { type: 'button', label: 'Upload', icon: 'upload', variant: 'primary', action: 'UPLOAD' },
  ]},
  { type: 'divider' },
  // Stats row
  { type: 'stats', label: 'Total Media', icon: 'image', entity: 'MediaItem' },
  { type: 'divider' },
  // Empty state guidance
  { type: 'stack', direction: 'vertical', gap: 'sm', align: 'center', children: [
    { type: 'icon', name: 'image', size: 'xl' },
    { type: 'typography', variant: 'body', content: 'Upload your first image to get started' },
  ]},
  // Search
  { type: 'search-input', placeholder: 'Search media...', icon: 'search' },
  // Gallery grid
  { type: 'data-grid', entity: 'MediaItem', variant: 'card', columns: 3,
    fields: [
      { name: 'title', label: 'Title', icon: 'film', variant: 'h4' },
      { name: 'type', label: 'Type', icon: 'folder', variant: 'badge' },
      { name: 'createdAt', label: 'Added', variant: 'caption' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW', icon: 'eye', variant: 'primary' },
    ],
  },
]}];

/**
 * std-gallery - Media gallery with lightbox viewing and upload.
 * States: browsing -> viewing -> uploading
 */
export const GALLERY_BEHAVIOR: BehaviorSchema = {
  name: "std-gallery",
  version: "1.0.0",
  description: "Media gallery with lightbox viewing and upload",
  theme: {
    name: "media-fuchsia",
    tokens: {
      colors: {
        primary: "#c026d3",
        "primary-hover": "#a21caf",
        "primary-foreground": "#ffffff",
        accent: "#e879f9",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "GalleryOrbital",
      entity: {
        name: "MediaItem",
        persistence: "persistent",
        collection: "media_items",
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
            name: "url",
            type: "string",
            default: "",
          },
          {
            name: "type",
            type: "string",
            default: "image",
          },
          {
            name: "thumbnailUrl",
            type: "string",
            default: "",
          },
          {
            name: "createdAt",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "GalleryControl",
          linkedEntity: "MediaItem",
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
                name: "uploading",
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
                key: "UPLOAD",
                name: "Start Upload",
              },
              {
                key: "SAVE",
                name: "Save Upload",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "url",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "REORDER_IMAGE",
                name: "Reorder Image",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "fromIndex",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "toIndex",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "SELECT_IMAGE",
                name: "Select Image",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "MediaItem"],
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
                              content: "Gallery",
                            },
                            {
                              type: "button",
                              label: "Upload",
                              icon: "upload",
                              variant: "primary",
                              event: "UPLOAD",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search images...",
                          entity: "MediaItem",
                        },
                        {
                          type: "data-grid",
                          entity: "MediaItem",
                          cols: 3,
                          imageField: "thumbnailUrl",
                          longPressEvent: "SELECT_IMAGE",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "primary",
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
                                      name: "image",
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
                                  type: "badge",
                                  label: "@entity.type",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "camera",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "No images yet",
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
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.title",
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
                        {
                          type: "lightbox",
                          images: "@entity.url",
                          isOpen: true,
                          showCounter: false,
                          closeAction: "CLOSE",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.title",
                            },
                            {
                              type: "badge",
                              label: "@entity.type",
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
                to: "uploading",
                event: "UPLOAD",
                effects: [
                  ["fetch", "MediaItem"],
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
                              content: "Upload Image",
                            },
                            {
                              type: "button",
                              label: "Cancel",
                              icon: "x",
                              variant: "ghost",
                              event: "CANCEL",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*",
                          label: "Drop images here",
                          description: "or click to browse files",
                          icon: "image",
                        },
                        {
                          type: "form-section",
                          entity: "MediaItem",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "url",
                              type: "string",
                            },
                            {
                              name: "type",
                              type: "string",
                            },
                            {
                              name: "thumbnailUrl",
                              type: "string",
                            },
                            {
                              name: "createdAt",
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
                from: "uploading",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.url", "@payload.url"],
                  ["render-ui", "modal", null],
                  ["fetch", "MediaItem"],
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
                              content: "Gallery",
                            },
                            {
                              type: "button",
                              label: "Upload",
                              icon: "upload",
                              variant: "primary",
                              event: "UPLOAD",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search images...",
                          entity: "MediaItem",
                        },
                        {
                          type: "data-grid",
                          entity: "MediaItem",
                          cols: 3,
                          imageField: "thumbnailUrl",
                          longPressEvent: "SELECT_IMAGE",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "primary",
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
                                      name: "image",
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
                                  type: "badge",
                                  label: "@entity.type",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "camera",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "No images yet",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "uploading",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "uploading",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "REORDER_IMAGE",
                effects: [],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "SELECT_IMAGE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "GalleryPage",
          path: "/gallery",
          isInitial: true,
          traits: [
            {
              ref: "GalleryControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-player - Media Player
// ============================================================================

// ── Reusable main-view effects (player idle) ────────────────────────

const playerIdleMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: play icon + title
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'play', size: 'lg' },
    { type: 'typography', variant: 'h2', content: 'Media Player' },
  ]},
  { type: 'divider' },
  // Track info card
  { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'music', size: 'md' },
      { type: 'typography', variant: 'h3', content: '@entity.title' },
    ]},
    { type: 'badge', label: 'Stopped', variant: 'default' },
  ]},
  { type: 'divider' },
  // Volume meter
  { type: 'meter', value: 0, label: 'Volume', icon: 'volume-2' },
  // Controls
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'button', label: 'Play', icon: 'play', variant: 'primary', action: 'PLAY' },
  ]},
]}];

// ── Reusable main-view effects (player playing) ─────────────────────

const playerPlayingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'play', size: 'lg' },
    { type: 'typography', variant: 'h2', content: 'Now Playing' },
  ]},
  { type: 'divider' },
  // Track info
  { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'music', size: 'md' },
      { type: 'typography', variant: 'h3', content: '@entity.title' },
    ]},
    { type: 'badge', label: 'Playing', variant: 'success' },
  ]},
  { type: 'divider' },
  // Playback progress
  { type: 'meter', value: '@entity.currentTime', label: 'Playback', icon: 'clock' },
  // Controls
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'button', label: 'Pause', icon: 'pause', variant: 'secondary', action: 'PAUSE' },
    { type: 'button', label: 'Stop', icon: 'square', variant: 'ghost', action: 'STOP' },
  ]},
]}];

// ── Reusable main-view effects (player paused) ─────────────────────

const playerPausedMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'pause', size: 'lg' },
    { type: 'typography', variant: 'h2', content: 'Paused' },
  ]},
  { type: 'divider' },
  // Track info
  { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'music', size: 'md' },
      { type: 'typography', variant: 'h3', content: '@entity.title' },
    ]},
    { type: 'badge', label: 'Paused', variant: 'warning' },
  ]},
  { type: 'divider' },
  // Playback progress (frozen)
  { type: 'meter', value: '@entity.currentTime', label: 'Paused', icon: 'clock' },
  // Controls
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'button', label: 'Resume', icon: 'play', variant: 'primary', action: 'PLAY' },
    { type: 'button', label: 'Stop', icon: 'square', variant: 'ghost', action: 'STOP' },
  ]},
]}];

/**
 * std-player - Media playback with play/pause controls.
 * States: idle -> playing -> paused
 */
export const PLAYER_BEHAVIOR: BehaviorSchema = {
  name: "std-player",
  version: "1.0.0",
  description: "Media player with playback controls",
  theme: {
    name: "media-fuchsia",
    tokens: {
      colors: {
        primary: "#c026d3",
        "primary-hover": "#a21caf",
        "primary-foreground": "#ffffff",
        accent: "#e879f9",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "PlayerOrbital",
      entity: {
        name: "PlayerState",
        persistence: "runtime",
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
            name: "url",
            type: "string",
            default: "",
          },
          {
            name: "duration",
            type: "number",
            default: 0,
          },
          {
            name: "currentTime",
            type: "number",
            default: 0,
          },
          {
            name: "isPlaying",
            type: "boolean",
            default: false,
          },
          {
            name: "artist",
            type: "string",
            default: "",
          },
          {
            name: "volume",
            type: "number",
            default: 75,
          },
        ],
      },
      traits: [
        {
          name: "PlayerControl",
          linkedEntity: "PlayerState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "idle",
                isInitial: true,
              },
              {
                name: "playing",
              },
              {
                name: "paused",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "PLAY",
                name: "Play",
              },
              {
                key: "PAUSE",
                name: "Pause",
              },
              {
                key: "STOP",
                name: "Stop",
              },
            ],
            transitions: [
              {
                from: "idle",
                to: "idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.currentTime", 0],
                  ["set", "@entity.isPlaying", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.artist",
                                },
                              ],
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
                              type: "typography",
                              variant: "caption",
                              content: "0:00",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: "@entity.duration",
                              value: 0,
                              step: 1,
                              disabled: true,
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.duration",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "center",
                          align: "center",
                          children: [
                            {
                              type: "button",
                              label: "Previous",
                              icon: "skip-back",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Rewind",
                              icon: "rewind",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Play",
                              icon: "play",
                              variant: "primary",
                              size: "lg",
                              event: "PLAY",
                            },
                            {
                              type: "button",
                              label: "Forward",
                              icon: "fast-forward",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Next",
                              icon: "skip-forward",
                              variant: "ghost",
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
                              name: "volume-2",
                              size: "sm",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: 100,
                              value: "@entity.volume",
                              step: 1,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlayerState",
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
                                      name: "play-circle",
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
                                      content: "@entity.artist",
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
                from: "idle",
                to: "playing",
                event: "PLAY",
                effects: [
                  ["set", "@entity.isPlaying", true],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.artist",
                                },
                              ],
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
                              type: "typography",
                              variant: "caption",
                              content: "@entity.currentTime",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: "@entity.duration",
                              value: "@entity.currentTime",
                              step: 1,
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.duration",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "center",
                          align: "center",
                          children: [
                            {
                              type: "button",
                              label: "Previous",
                              icon: "skip-back",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Rewind",
                              icon: "rewind",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Pause",
                              icon: "pause",
                              variant: "primary",
                              size: "lg",
                              event: "PAUSE",
                            },
                            {
                              type: "button",
                              label: "Forward",
                              icon: "fast-forward",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Next",
                              icon: "skip-forward",
                              variant: "ghost",
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
                              name: "volume-2",
                              size: "sm",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: 100,
                              value: "@entity.volume",
                              step: 1,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlayerState",
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
                                      name: "play-circle",
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
                                      content: "@entity.artist",
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
                from: "playing",
                to: "paused",
                event: "PAUSE",
                effects: [
                  ["set", "@entity.isPlaying", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.artist",
                                },
                              ],
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
                              type: "typography",
                              variant: "caption",
                              content: "@entity.currentTime",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: "@entity.duration",
                              value: "@entity.currentTime",
                              step: 1,
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.duration",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "center",
                          align: "center",
                          children: [
                            {
                              type: "button",
                              label: "Previous",
                              icon: "skip-back",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Rewind",
                              icon: "rewind",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Play",
                              icon: "play",
                              variant: "primary",
                              size: "lg",
                              event: "PLAY",
                            },
                            {
                              type: "button",
                              label: "Forward",
                              icon: "fast-forward",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Next",
                              icon: "skip-forward",
                              variant: "ghost",
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
                              name: "volume-2",
                              size: "sm",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: 100,
                              value: "@entity.volume",
                              step: 1,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlayerState",
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
                                      name: "play-circle",
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
                                      content: "@entity.artist",
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
                from: "paused",
                to: "playing",
                event: "PLAY",
                effects: [
                  ["set", "@entity.isPlaying", true],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.artist",
                                },
                              ],
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
                              type: "typography",
                              variant: "caption",
                              content: "@entity.currentTime",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: "@entity.duration",
                              value: "@entity.currentTime",
                              step: 1,
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.duration",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "center",
                          align: "center",
                          children: [
                            {
                              type: "button",
                              label: "Previous",
                              icon: "skip-back",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Rewind",
                              icon: "rewind",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Pause",
                              icon: "pause",
                              variant: "primary",
                              size: "lg",
                              event: "PAUSE",
                            },
                            {
                              type: "button",
                              label: "Forward",
                              icon: "fast-forward",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Next",
                              icon: "skip-forward",
                              variant: "ghost",
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
                              name: "volume-2",
                              size: "sm",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: 100,
                              value: "@entity.volume",
                              step: 1,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlayerState",
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
                                      name: "play-circle",
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
                                      content: "@entity.artist",
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
                from: "playing",
                to: "idle",
                event: "STOP",
                effects: [
                  ["set", "@entity.isPlaying", false],
                  ["set", "@entity.currentTime", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.artist",
                                },
                              ],
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
                              type: "typography",
                              variant: "caption",
                              content: "0:00",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: "@entity.duration",
                              value: 0,
                              step: 1,
                              disabled: true,
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.duration",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "center",
                          align: "center",
                          children: [
                            {
                              type: "button",
                              label: "Previous",
                              icon: "skip-back",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Rewind",
                              icon: "rewind",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Play",
                              icon: "play",
                              variant: "primary",
                              size: "lg",
                              event: "PLAY",
                            },
                            {
                              type: "button",
                              label: "Forward",
                              icon: "fast-forward",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Next",
                              icon: "skip-forward",
                              variant: "ghost",
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
                              name: "volume-2",
                              size: "sm",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: 100,
                              value: "@entity.volume",
                              step: 1,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlayerState",
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
                                      name: "play-circle",
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
                                      content: "@entity.artist",
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
                from: "paused",
                to: "idle",
                event: "STOP",
                effects: [
                  ["set", "@entity.isPlaying", false],
                  ["set", "@entity.currentTime", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.artist",
                                },
                              ],
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
                              type: "typography",
                              variant: "caption",
                              content: "0:00",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: "@entity.duration",
                              value: 0,
                              step: 1,
                              disabled: true,
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.duration",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "center",
                          align: "center",
                          children: [
                            {
                              type: "button",
                              label: "Previous",
                              icon: "skip-back",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Rewind",
                              icon: "rewind",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Play",
                              icon: "play",
                              variant: "primary",
                              size: "lg",
                              event: "PLAY",
                            },
                            {
                              type: "button",
                              label: "Forward",
                              icon: "fast-forward",
                              variant: "ghost",
                            },
                            {
                              type: "button",
                              label: "Next",
                              icon: "skip-forward",
                              variant: "ghost",
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
                              name: "volume-2",
                              size: "sm",
                            },
                            {
                              type: "range-slider",
                              min: 0,
                              max: 100,
                              value: "@entity.volume",
                              step: 1,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlayerState",
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
                                      name: "play-circle",
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
                                      content: "@entity.artist",
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
          name: "PlayerPage",
          path: "/player",
          isInitial: true,
          traits: [
            {
              ref: "PlayerControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-playlist - Playlist Management
// ============================================================================

// ── Reusable main-view effects (playlist browsing) ──────────────────

const playlistBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: music icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'music', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Playlist' },
    ]},
  ]},
  { type: 'divider' },
  // Playlist stats
  { type: 'stats', label: 'Tracks', icon: 'music', entity: 'PlaylistItem' },
  { type: 'divider' },
  // Search
  { type: 'search-input', placeholder: 'Search tracks...', icon: 'search' },
  // Track list
  { type: 'data-list', entity: 'PlaylistItem', variant: 'row',
    fields: [
      { name: 'title', label: 'Title', icon: 'music', variant: 'h4' },
      { name: 'artist', label: 'Artist', icon: 'user', variant: 'body' },
      { name: 'duration', label: 'Duration', icon: 'clock', variant: 'badge', format: 'duration' },
      { name: 'order', label: '#', variant: 'caption' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW', icon: 'eye', variant: 'primary' },
    ],
  },
]}];

/**
 * std-playlist - Playlist management with ordering.
 * States: browsing -> viewing -> editing
 */
export const PLAYLIST_BEHAVIOR: BehaviorSchema = {
  name: "std-playlist",
  version: "1.0.0",
  description: "Playlist management with track ordering",
  theme: {
    name: "media-fuchsia",
    tokens: {
      colors: {
        primary: "#c026d3",
        "primary-hover": "#a21caf",
        "primary-foreground": "#ffffff",
        accent: "#e879f9",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "PlaylistOrbital",
      entity: {
        name: "PlaylistItem",
        persistence: "persistent",
        collection: "playlist_items",
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
            name: "artist",
            type: "string",
            default: "",
          },
          {
            name: "duration",
            type: "number",
            default: 0,
          },
          {
            name: "order",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "PlaylistControl",
          linkedEntity: "PlaylistItem",
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
                name: "editing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Track",
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
                name: "Edit Track",
              },
              {
                key: "SAVE",
                name: "Save Track",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "artist",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "BACK",
                name: "Back to Playlist",
              },
              {
                key: "REORDER_TRACK",
                name: "Reorder Track",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "fromIndex",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "toIndex",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "REMOVE_TRACK",
                name: "Remove Track",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "PlaylistItem"],
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
                                  name: "music",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Playlist",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Tracks",
                          icon: "music",
                          entity: "PlaylistItem",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search tracks...",
                        },
                        {
                          type: "data-list",
                          entity: "PlaylistItem",
                          variant: "row",
                          reorderable: true,
                          reorderEvent: "REORDER_TRACK",
                          swipeLeftEvent: "REMOVE_TRACK",
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
                                      name: "list-music",
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
                                      content: "@entity.artist",
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
                              variant: "primary",
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
                                  name: "music",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Track Details",
                                },
                              ],
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
                                  label: "Back",
                                  icon: "arrow-left",
                                  variant: "ghost",
                                  event: "BACK",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PlaylistItem",
                          variant: "detail",
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
                                      name: "list-music",
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
                                      content: "@entity.artist",
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
                from: "viewing",
                to: "editing",
                event: "EDIT",
                effects: [
                  ["fetch", "PlaylistItem"],
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
                                  name: "edit",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Edit Track",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back",
                              icon: "arrow-left",
                              variant: "ghost",
                              event: "BACK",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "PlaylistItem",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "artist",
                              type: "string",
                            },
                            {
                              name: "duration",
                              type: "number",
                            },
                            {
                              name: "order",
                              type: "number",
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
                event: "SAVE",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.artist", "@payload.artist"],
                  ["fetch", "PlaylistItem"],
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
                                  name: "music",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Playlist",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Tracks",
                          icon: "music",
                          entity: "PlaylistItem",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search tracks...",
                        },
                        {
                          type: "data-list",
                          entity: "PlaylistItem",
                          variant: "row",
                          reorderable: true,
                          reorderEvent: "REORDER_TRACK",
                          swipeLeftEvent: "REMOVE_TRACK",
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
                                      name: "list-music",
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
                                      content: "@entity.artist",
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
                              variant: "primary",
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
                to: "browsing",
                event: "BACK",
                effects: [
                  ["fetch", "PlaylistItem"],
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
                                  name: "music",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Playlist",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Tracks",
                          icon: "music",
                          entity: "PlaylistItem",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search tracks...",
                        },
                        {
                          type: "data-list",
                          entity: "PlaylistItem",
                          variant: "row",
                          reorderable: true,
                          reorderEvent: "REORDER_TRACK",
                          swipeLeftEvent: "REMOVE_TRACK",
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
                                      name: "list-music",
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
                                      content: "@entity.artist",
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
                              variant: "primary",
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
                to: "browsing",
                event: "REORDER_TRACK",
                effects: [],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "REMOVE_TRACK",
                effects: [],
              },
              {
                from: "editing",
                to: "browsing",
                event: "BACK",
                effects: [
                  ["fetch", "PlaylistItem"],
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
                                  name: "music",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Playlist",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Tracks",
                          icon: "music",
                          entity: "PlaylistItem",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search tracks...",
                        },
                        {
                          type: "data-list",
                          entity: "PlaylistItem",
                          variant: "row",
                          reorderable: true,
                          reorderEvent: "REORDER_TRACK",
                          swipeLeftEvent: "REMOVE_TRACK",
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
                                      name: "list-music",
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
                                      content: "@entity.artist",
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
                              variant: "primary",
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
          name: "PlaylistPage",
          path: "/playlist",
          isInitial: true,
          traits: [
            {
              ref: "PlaylistControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-upload - File Upload
// ============================================================================

// ── Reusable main-view effects (upload idle) ────────────────────────

const uploadIdleMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: upload icon + title
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'upload', size: 'lg' },
    { type: 'typography', variant: 'h2', content: 'File Upload' },
  ]},
  { type: 'divider' },
  // Guidance text
  { type: 'stack', direction: 'vertical', gap: 'sm', align: 'center', children: [
    { type: 'icon', name: 'file-plus', size: 'xl' },
    { type: 'typography', variant: 'body', content: 'Select a file to upload' },
  ]},
  // Upload form
  { type: 'form-section', entity: 'UploadState', submitEvent: 'START_UPLOAD' },
  // Explicit start button
  { type: 'button', label: 'Start Upload', action: 'START_UPLOAD', icon: 'upload', variant: 'primary' },
]}];

// ── Reusable main-view effects (uploading in progress) ──────────────

const uploadProgressMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'upload', size: 'lg' },
    { type: 'typography', variant: 'h2', content: 'Uploading...' },
  ]},
  { type: 'divider' },
  // File info
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'file', size: 'md' },
    { type: 'typography', variant: 'h4', content: '@entity.fileName' },
  ]},
  // Progress
  { type: 'meter', value: 0, label: 'Upload Progress', icon: 'upload' },
  { type: 'badge', label: 'Uploading', variant: 'warning' },
]}];

/**
 * std-upload - File upload tracking with progress.
 * States: idle -> uploading -> completed -> failed
 */
export const UPLOAD_BEHAVIOR: BehaviorSchema = {
  name: "std-upload",
  version: "1.0.0",
  description: "File upload tracking with progress indicator",
  theme: {
    name: "media-fuchsia",
    tokens: {
      colors: {
        primary: "#c026d3",
        "primary-hover": "#a21caf",
        "primary-foreground": "#ffffff",
        accent: "#e879f9",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "UploadOrbital",
      entity: {
        name: "UploadState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "fileName",
            type: "string",
            default: "",
          },
          {
            name: "fileSize",
            type: "number",
            default: 0,
          },
          {
            name: "progress",
            type: "number",
            default: 0,
          },
          {
            name: "status",
            type: "string",
            default: "idle",
          },
        ],
      },
      traits: [
        {
          name: "UploadControl",
          linkedEntity: "UploadState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "idle",
                isInitial: true,
              },
              {
                name: "uploading",
              },
              {
                name: "completed",
              },
              {
                name: "failed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START_UPLOAD",
                name: "Start Upload",
                payloadSchema: [
                  {
                    name: "fileName",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "COMPLETE",
                name: "Upload Complete",
              },
              {
                key: "FAIL",
                name: "Upload Failed",
              },
              {
                key: "RETRY",
                name: "Retry Upload",
              },
              {
                key: "RESET",
                name: "Reset",
              },
            ],
            transitions: [
              {
                from: "idle",
                to: "idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.progress", 0],
                  ["set", "@entity.status", "idle"],
                  ["fetch", "UploadState"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          action: "START_UPLOAD",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "inbox",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "No files uploaded",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "idle",
                to: "uploading",
                event: "START_UPLOAD",
                effects: [
                  ["set", "@entity.fileName", "@payload.fileName"],
                  ["set", "@entity.progress", 0],
                  ["set", "@entity.status", "uploading"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          disabled: true,
                        },
                        {
                          type: "card",
                          title: "@entity.fileName",
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
                                      name: "file",
                                      size: "md",
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.fileName",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.fileSize",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "Uploading",
                                      variant: "warning",
                                    },
                                  ],
                                },
                                {
                                  type: "progress-bar",
                                  value: "@entity.progress",
                                  label: "Upload Progress",
                                  variant: "primary",
                                  showPercentage: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stat-display",
                          label: "Upload Progress",
                          value: "0 of 1 files uploaded",
                          icon: "upload",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "uploading",
                to: "completed",
                event: "COMPLETE",
                effects: [
                  ["set", "@entity.progress", 100],
                  ["set", "@entity.status", "completed"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          action: "START_UPLOAD",
                        },
                        {
                          type: "card",
                          title: "@entity.fileName",
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
                                      name: "file",
                                      size: "md",
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.fileName",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.fileSize",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "Complete",
                                      variant: "success",
                                    },
                                  ],
                                },
                                {
                                  type: "progress-bar",
                                  value: 100,
                                  variant: "primary",
                                  showPercentage: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stat-display",
                          label: "Upload Progress",
                          value: "1 of 1 files uploaded",
                          icon: "check-circle",
                        },
                        {
                          type: "progress-bar",
                          value: 100,
                          variant: "primary",
                          showPercentage: true,
                          label: "Overall Progress",
                        },
                        {
                          type: "button",
                          label: "Upload Another",
                          icon: "upload",
                          variant: "primary",
                          event: "RESET",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "uploading",
                to: "failed",
                event: "FAIL",
                effects: [
                  ["set", "@entity.status", "failed"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          disabled: true,
                        },
                        {
                          type: "card",
                          title: "@entity.fileName",
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
                                      name: "file",
                                      size: "md",
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.fileName",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.fileSize",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "Failed",
                                      variant: "error",
                                    },
                                  ],
                                },
                                {
                                  type: "progress-bar",
                                  value: "@entity.progress",
                                  variant: "primary",
                                  showPercentage: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stat-display",
                          label: "Upload Progress",
                          value: "0 of 1 files uploaded",
                          icon: "alert-triangle",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "button",
                              label: "Retry",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RETRY",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "x",
                              variant: "ghost",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "failed",
                to: "uploading",
                event: "RETRY",
                effects: [
                  ["set", "@entity.progress", 0],
                  ["set", "@entity.status", "uploading"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          disabled: true,
                        },
                        {
                          type: "card",
                          title: "@entity.fileName",
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
                                      name: "file",
                                      size: "md",
                                    },
                                    {
                                      type: "stack",
                                      direction: "vertical",
                                      gap: "xs",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.fileName",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.fileSize",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "Uploading",
                                      variant: "warning",
                                    },
                                  ],
                                },
                                {
                                  type: "progress-bar",
                                  value: "@entity.progress",
                                  label: "Upload Progress",
                                  variant: "primary",
                                  showPercentage: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stat-display",
                          label: "Upload Progress",
                          value: "0 of 1 files uploaded",
                          icon: "upload",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "completed",
                to: "idle",
                event: "RESET",
                effects: [
                  ["set", "@entity.progress", 0],
                  ["set", "@entity.status", "idle"],
                  ["fetch", "UploadState"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          action: "START_UPLOAD",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "inbox",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "No files uploaded",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "failed",
                to: "idle",
                event: "RESET",
                effects: [
                  ["set", "@entity.progress", 0],
                  ["set", "@entity.status", "idle"],
                  ["fetch", "UploadState"],
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
                          content: "Upload Files",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "upload-drop-zone",
                          accept: "image/*,application/pdf,.doc,.docx",
                          maxSize: 10485760,
                          label: "Drop files here or click to browse",
                          description: "Supports images, PDFs, and documents up to 10 MB",
                          icon: "upload",
                          action: "START_UPLOAD",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "inbox",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "No files uploaded",
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
          name: "UploadPage",
          path: "/upload",
          isInitial: true,
          traits: [
            {
              ref: "UploadControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Media Behaviors
// ============================================================================

export const MEDIA_BEHAVIORS: BehaviorSchema[] = [
  GALLERY_BEHAVIOR,
  PLAYER_BEHAVIOR,
  PLAYLIST_BEHAVIOR,
  UPLOAD_BEHAVIOR,
];
