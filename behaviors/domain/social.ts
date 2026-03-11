/**
 * Social Domain Behaviors
 *
 * Standard behaviors for social features: feeds, messaging,
 * user profiles, and reaction systems.
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

// ── Shared Social Theme ─────────────────────────────────────────────

const SOCIAL_THEME = {
  name: 'social-sky',
  tokens: {
    colors: {
      primary: '#0284c7',
      'primary-hover': '#0369a1',
      'primary-foreground': '#ffffff',
      accent: '#38bdf8',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-feed - Social Feed
// ============================================================================

// ── Reusable main-view effects (feed: browsing) ─────────────────────

const feedBrowsingMainEffects: BehaviorEffect[] = [
  ['fetch', 'FeedPost'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header row: icon + title + create button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'users', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Feed' },
      ]},
      { type: 'button', label: 'New Post', icon: 'send', variant: 'primary', action: 'CREATE' },
    ]},
    { type: 'divider' },
    // Stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Posts', icon: 'message-circle', entity: 'FeedPost' },
      { type: 'stats', label: 'Engagement', icon: 'heart', entity: 'FeedPost' },
      { type: 'stats', label: 'Authors', icon: 'user-plus', entity: 'FeedPost' },
    ]},
    // Search
    { type: 'search-input', placeholder: 'Search posts...', icon: 'at-sign', event: 'VIEW' },
    { type: 'divider' },
    // Post list
    { type: 'data-list', entity: 'FeedPost',
      fields: [
        { name: 'author', label: 'Author', icon: 'users', variant: 'h4' },
        { name: 'content', label: 'Content', icon: 'message-circle', variant: 'body' },
        { name: 'timestamp', label: 'Posted', icon: 'clock', variant: 'caption' },
        { name: 'likeCount', label: 'Likes', icon: 'heart', variant: 'badge', format: 'number' },
      ],
      actions: [
        { label: 'View', event: 'VIEW' },
      ],
    },
  ]}],
];

/**
 * std-feed - Social feed with post browsing, viewing, and creation.
 * Supports browsing posts, viewing detail, and creating new posts.
 */
export const FEED_BEHAVIOR: BehaviorSchema = {
  name: "std-feed",
  version: "1.0.0",
  description: "Social feed with post browsing and creation",
  theme: {
    name: "social-sky",
    tokens: {
      colors: {
        primary: "#0284c7",
        "primary-hover": "#0369a1",
        "primary-foreground": "#ffffff",
        accent: "#38bdf8",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "FeedOrbital",
      entity: {
        name: "FeedPost",
        persistence: "persistent",
        collection: "feed_posts",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "author",
            type: "string",
            default: "",
          },
          {
            name: "content",
            type: "string",
            default: "",
          },
          {
            name: "timestamp",
            type: "string",
            default: "",
          },
          {
            name: "likeCount",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "FeedManager",
          linkedEntity: "FeedPost",
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
                name: "creating",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Post",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CREATE",
                name: "Create Post",
              },
              {
                key: "SUBMIT",
                name: "Submit Post",
                payloadSchema: [
                  {
                    name: "content",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "author",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "LIKE",
                name: "Like Post",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "LOAD_MORE",
                name: "Load More",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "FeedPost"],
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
                              type: "typography",
                              variant: "h2",
                              content: "Feed",
                            },
                            {
                              type: "button",
                              label: "Compose",
                              icon: "send",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "data-list",
                          entity: "FeedPost",
                          variant: "card",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
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
                                      name: "rss",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.author",
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
                                      content: "@entity.timestamp",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "Like",
                              icon: "heart",
                              event: "VIEW",
                            },
                            {
                              label: "Comment",
                              icon: "message-circle",
                              event: "VIEW",
                            },
                            {
                              label: "Share",
                              icon: "share-2",
                              event: "VIEW",
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "message-circle",
                          title: "No posts yet",
                          description: "Be the first to share something with the community.",
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
                              name: "message-circle",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.id",
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
                              type: "typography",
                              variant: "label",
                              content: "Author",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.author",
                            },
                            {
                              type: "typography",
                              variant: "label",
                              content: "Content",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.content",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "heart",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "@entity.likeCount",
                              variant: "info",
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
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Like",
                              icon: "heart",
                              variant: "secondary",
                              event: "LIKE",
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
                to: "viewing",
                event: "LIKE",
                effects: [
                  [
                    "set",
                    "@entity.likeCount",
                    ["+", "@entity.likeCount", 1],
                  ],
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
                              name: "message-circle",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.id",
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
                              type: "typography",
                              variant: "label",
                              content: "Author",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.author",
                            },
                            {
                              type: "typography",
                              variant: "label",
                              content: "Content",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.content",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "heart",
                              size: "sm",
                            },
                            {
                              type: "badge",
                              label: "@entity.likeCount",
                              variant: "info",
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
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Like",
                              icon: "heart",
                              variant: "secondary",
                              event: "LIKE",
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
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "FeedPost"],
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
                              name: "send",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Post",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "FeedPost",
                          title: "New Post",
                          submitEvent: "SUBMIT",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "author",
                              type: "string",
                            },
                            {
                              name: "content",
                              type: "string",
                            },
                            {
                              name: "timestamp",
                              type: "string",
                            },
                            {
                              name: "likeCount",
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
                from: "creating",
                to: "browsing",
                event: "SUBMIT",
                effects: [
                  ["set", "@entity.content", "@payload.content"],
                  ["set", "@entity.author", "@payload.author"],
                  ["set", "@entity.likeCount", 0],
                  ["render-ui", "modal", null],
                  ["fetch", "FeedPost"],
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
                              type: "typography",
                              variant: "h2",
                              content: "Feed",
                            },
                            {
                              type: "button",
                              label: "Compose",
                              icon: "send",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "data-list",
                          entity: "FeedPost",
                          variant: "card",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
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
                                      name: "rss",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.author",
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
                                      content: "@entity.timestamp",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "Like",
                              icon: "heart",
                              event: "VIEW",
                            },
                            {
                              label: "Comment",
                              icon: "message-circle",
                              event: "VIEW",
                            },
                            {
                              label: "Share",
                              icon: "share-2",
                              event: "VIEW",
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "message-circle",
                          title: "No posts yet",
                          description: "Be the first to share something with the community.",
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
                to: "browsing",
                event: "LOAD_MORE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "FeedPage",
          path: "/feed",
          isInitial: true,
          traits: [
            {
              ref: "FeedManager",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-messaging - Messaging System
// ============================================================================

// ── Reusable main-view effects (messaging: browsing) ────────────────

const messagingBrowsingMainEffects: BehaviorEffect[] = [
  ['fetch', 'Message'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + compose button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'message-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Messages' },
      ]},
      { type: 'button', label: 'Compose', icon: 'send', variant: 'primary', action: 'COMPOSE' },
    ]},
    { type: 'divider' },
    // Stats: total messages + unread indicator
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Messages', icon: 'message-circle', entity: 'Message' },
      { type: 'stats', label: 'Unread', icon: 'bell', entity: 'Message' },
    ]},
    // Search
    { type: 'search-input', placeholder: 'Search conversations...', icon: 'at-sign', event: 'OPEN_CHAT' },
    { type: 'divider' },
    // Message list (compact, conversation-style)
    { type: 'data-list', entity: 'Message',
      fields: [
        { name: 'sender', label: 'From', icon: 'user-plus', variant: 'h4' },
        { name: 'content', label: 'Message', icon: 'message-circle', variant: 'body' },
        { name: 'timestamp', label: 'Time', icon: 'clock', variant: 'caption' },
        { name: 'isRead', label: 'Read', icon: 'check', variant: 'badge' },
      ],
      actions: [
        { label: 'Open', event: 'OPEN_CHAT' },
      ],
    },
    { type: 'divider' },
    // Compose area: quick message input
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'search-input', placeholder: 'Type a message...', icon: 'message-circle', entity: 'Message' },
      { type: 'button', label: 'Send', action: 'COMPOSE', icon: 'send', variant: 'primary' },
    ]},
  ]}],
];

/**
 * std-messaging - Messaging system with conversation browsing and composing.
 * Supports browsing messages, chatting in detail, and composing new messages.
 */
export const MESSAGING_BEHAVIOR: BehaviorSchema = {
  name: "std-messaging",
  version: "1.0.0",
  description: "Messaging system with conversation flow",
  theme: {
    name: "social-sky",
    tokens: {
      colors: {
        primary: "#0284c7",
        "primary-hover": "#0369a1",
        "primary-foreground": "#ffffff",
        accent: "#38bdf8",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "MessagingOrbital",
      entity: {
        name: "Message",
        persistence: "persistent",
        collection: "messages",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "sender",
            type: "string",
            default: "",
          },
          {
            name: "content",
            type: "string",
            default: "",
          },
          {
            name: "timestamp",
            type: "string",
            default: "",
          },
          {
            name: "isRead",
            type: "boolean",
            default: false,
          },
        ],
      },
      traits: [
        {
          name: "MessagingFlow",
          linkedEntity: "Message",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "chatting",
              },
              {
                name: "composing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "OPEN_CHAT",
                name: "Open Chat",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "COMPOSE",
                name: "Compose Message",
              },
              {
                key: "SEND",
                name: "Send Message",
                payloadSchema: [
                  {
                    name: "content",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "sender",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "MARK_READ",
                name: "Mark as Read",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "LOAD_MORE",
                name: "Load More",
              },
              {
                key: "ARCHIVE_CONVERSATION",
                name: "Archive Conversation",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Message"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
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
                                  name: "message-circle",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Messages",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Compose",
                              icon: "send",
                              variant: "primary",
                              event: "COMPOSE",
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
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "search-input",
                                      placeholder: "Search conversations...",
                                      icon: "search",
                                      entity: "Message",
                                    },
                                    {
                                      type: "data-list",
                                      entity: "Message",
                                      variant: "card",
                                      groupBy: "sender",
                                      swipeLeftEvent: "ARCHIVE_CONVERSATION",
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
                                                  name: "message-square",
                                                  size: "sm",
                                                },
                                                {
                                                  type: "typography",
                                                  variant: "h4",
                                                  content: "@entity.sender",
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
                                                  content: "@entity.timestamp",
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                      itemActions: [
                                        {
                                          label: "Open",
                                          event: "OPEN_CHAT",
                                          icon: "chevron-right",
                                        },
                                      ],
                                      emptyIcon: "message-circle",
                                      emptyTitle: "No conversations",
                                      emptyDescription: "Start a conversation by composing a new message.",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "message-circle",
                                      size: "xl",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h3",
                                      content: "Select a conversation",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "Choose a conversation from the list to start chatting.",
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
                to: "chatting",
                event: "OPEN_CHAT",
                effects: [
                  ["set", "@entity.isRead", true],
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
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "avatar",
                                  name: "@entity.sender",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.sender",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "status-dot",
                                  status: "online",
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
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Message",
                          variant: "message",
                          groupBy: "timestamp",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          fields: [
                            {
                              name: "sender",
                              label: "Sender",
                              variant: "caption",
                            },
                            {
                              name: "content",
                              label: "Message",
                              variant: "body",
                            },
                            {
                              name: "timestamp",
                              label: "Time",
                              variant: "caption",
                            },
                          ],
                          emptyIcon: "message-circle",
                          emptyTitle: "No messages yet",
                          emptyDescription: "Send a message to start the conversation.",
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
                              type: "search-input",
                              placeholder: "Type a message...",
                              icon: "message-circle",
                              entity: "Message",
                            },
                            {
                              type: "button",
                              label: "Send",
                              icon: "send",
                              variant: "primary",
                              event: "SEND",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "chatting",
                to: "chatting",
                event: "MARK_READ",
                effects: [
                  ["set", "@entity.isRead", true],
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
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "message-circle",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Conversation",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Read",
                              variant: "success",
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
                                  type: "icon",
                                  name: "user-plus",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "From",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.sender",
                                },
                              ],
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.content",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "clock",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.timestamp",
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
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Mark Read",
                              icon: "check",
                              variant: "secondary",
                              event: "MARK_READ",
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
                from: "chatting",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "chatting",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "composing",
                event: "COMPOSE",
                effects: [
                  ["fetch", "Message"],
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
                              name: "send",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Message",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "Message",
                          title: "New Message",
                          submitEvent: "SEND",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "sender",
                              type: "string",
                            },
                            {
                              name: "content",
                              type: "string",
                            },
                            {
                              name: "timestamp",
                              type: "string",
                            },
                            {
                              name: "isRead",
                              type: "boolean",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "composing",
                to: "browsing",
                event: "SEND",
                effects: [
                  ["set", "@entity.content", "@payload.content"],
                  ["set", "@entity.sender", "@payload.sender"],
                  ["set", "@entity.isRead", false],
                  ["render-ui", "modal", null],
                  ["fetch", "Message"],
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
                                  name: "message-circle",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Messages",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Compose",
                              icon: "send",
                              variant: "primary",
                              event: "COMPOSE",
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
                              label: "Total Messages",
                              icon: "message-circle",
                              entity: "Message",
                            },
                            {
                              type: "stat-display",
                              label: "Unread",
                              icon: "bell",
                              entity: "Message",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search conversations...",
                          icon: "at-sign",
                          event: "OPEN_CHAT",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Message",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          swipeLeftEvent: "ARCHIVE_CONVERSATION",
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
                                      name: "message-square",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.sender",
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
                                      content: "@entity.timestamp",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          actions: [
                            {
                              label: "Open",
                              event: "OPEN_CHAT",
                            },
                          ],
                          emptyIcon: "message-circle",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
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
                              type: "search-input",
                              placeholder: "Type a message...",
                              icon: "message-circle",
                              entity: "Message",
                            },
                            {
                              type: "button",
                              label: "Send",
                              icon: "send",
                              variant: "primary",
                              event: "COMPOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "composing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "LOAD_MORE",
                effects: [],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "ARCHIVE_CONVERSATION",
                effects: [],
              },
              {
                from: "chatting",
                to: "chatting",
                event: "LOAD_MORE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "MessagesPage",
          path: "/messages",
          isInitial: true,
          traits: [
            {
              ref: "MessagingFlow",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-profile - User Profile
// ============================================================================

// ── Reusable main-view effects (profile: viewing) ───────────────────

const profileViewingMainEffects: BehaviorEffect[] = [
  ['fetch', 'UserProfile'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: avatar area + title + edit button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'users', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Profile' },
      ]},
      { type: 'button', label: 'Edit', icon: 'edit', variant: 'secondary', action: 'EDIT' },
    ]},
    { type: 'divider' },
    // Profile stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Profiles', icon: 'users', entity: 'UserProfile' },
      { type: 'stats', label: 'Active', icon: 'user-plus', entity: 'UserProfile' },
    ]},
    { type: 'divider' },
    // Profile card: structured detail display
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      // Display name row
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'user-plus', size: 'md' },
        { type: 'stack', direction: 'vertical', gap: 'xs', children: [
          { type: 'typography', variant: 'label', content: 'Display Name' },
          { type: 'typography', variant: 'h3', content: '@entity.displayName' },
        ]},
      ]},
      // Bio row
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'message-circle', size: 'md' },
        { type: 'stack', direction: 'vertical', gap: 'xs', children: [
          { type: 'typography', variant: 'label', content: 'Bio' },
          { type: 'typography', variant: 'body', content: '@entity.bio' },
        ]},
      ]},
      // Avatar URL row
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'image', size: 'md' },
        { type: 'stack', direction: 'vertical', gap: 'xs', children: [
          { type: 'typography', variant: 'label', content: 'Avatar' },
          { type: 'typography', variant: 'caption', content: '@entity.avatarUrl' },
        ]},
      ]},
      // Join date row
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'clock', size: 'md' },
        { type: 'stack', direction: 'vertical', gap: 'xs', children: [
          { type: 'typography', variant: 'label', content: 'Member Since' },
          { type: 'typography', variant: 'caption', content: '@entity.joinDate' },
        ]},
      ]},
    ]},
  ]}],
];

/**
 * std-profile - User profile management with viewing and editing.
 * Supports viewing profile details and editing fields.
 */
export const PROFILE_BEHAVIOR: BehaviorSchema = {
  name: "std-profile",
  version: "1.0.0",
  description: "User profile viewing and editing",
  theme: {
    name: "social-sky",
    tokens: {
      colors: {
        primary: "#0284c7",
        "primary-hover": "#0369a1",
        "primary-foreground": "#ffffff",
        accent: "#38bdf8",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ProfileOrbital",
      entity: {
        name: "UserProfile",
        persistence: "persistent",
        collection: "user_profiles",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "displayName",
            type: "string",
            default: "",
          },
          {
            name: "bio",
            type: "string",
            default: "",
          },
          {
            name: "avatarUrl",
            type: "string",
            default: "",
          },
          {
            name: "location",
            type: "string",
            default: "",
          },
          {
            name: "joinDate",
            type: "string",
            default: "",
          },
          {
            name: "postsCount",
            type: "number",
            default: 0,
          },
          {
            name: "followersCount",
            type: "number",
            default: 0,
          },
          {
            name: "followingCount",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "ProfileManager",
          linkedEntity: "UserProfile",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "viewing",
                isInitial: true,
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
                key: "EDIT",
                name: "Edit Profile",
              },
              {
                key: "UPDATE",
                name: "Update Profile",
                payloadSchema: [
                  {
                    name: "displayName",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "bio",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "avatarUrl",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "location",
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
                from: "viewing",
                to: "viewing",
                event: "INIT",
                effects: [
                  ["fetch", "UserProfile"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      align: "center",
                      children: [
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "avatar",
                              src: "@entity.avatarUrl",
                              name: "@entity.displayName",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "@entity.displayName",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.bio",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.location",
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
                          gap: "lg",
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Posts",
                              value: "@entity.postsCount",
                              icon: "file-text",
                              compact: true,
                            },
                            {
                              type: "stat-display",
                              label: "Followers",
                              value: "@entity.followersCount",
                              icon: "users",
                              compact: true,
                            },
                            {
                              type: "stat-display",
                              label: "Following",
                              value: "@entity.followingCount",
                              icon: "user-plus",
                              compact: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Edit Profile",
                          icon: "edit",
                          variant: "primary",
                          event: "EDIT",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "tabs",
                          tabs: [
                            {
                              id: "posts",
                              label: "Posts",
                            },
                            {
                              id: "about",
                              label: "About",
                            },
                            {
                              id: "activity",
                              label: "Activity",
                            },
                          ],
                          defaultActiveTab: "posts",
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
                  ["fetch", "UserProfile"],
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
                              content: "Edit Profile",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "UserProfile",
                          title: "Edit Profile",
                          submitEvent: "UPDATE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "displayName",
                              type: "string",
                            },
                            {
                              name: "bio",
                              type: "string",
                            },
                            {
                              name: "avatarUrl",
                              type: "string",
                            },
                            {
                              name: "location",
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
                to: "viewing",
                event: "UPDATE",
                effects: [
                  ["set", "@entity.displayName", "@payload.displayName"],
                  ["set", "@entity.bio", "@payload.bio"],
                  ["set", "@entity.avatarUrl", "@payload.avatarUrl"],
                  ["set", "@entity.location", "@payload.location"],
                  ["render-ui", "modal", null],
                  ["fetch", "UserProfile"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      align: "center",
                      children: [
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "avatar",
                              src: "@entity.avatarUrl",
                              name: "@entity.displayName",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "@entity.displayName",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.bio",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.location",
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
                          gap: "lg",
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Posts",
                              value: "@entity.postsCount",
                              icon: "file-text",
                              compact: true,
                            },
                            {
                              type: "stat-display",
                              label: "Followers",
                              value: "@entity.followersCount",
                              icon: "users",
                              compact: true,
                            },
                            {
                              type: "stat-display",
                              label: "Following",
                              value: "@entity.followingCount",
                              icon: "user-plus",
                              compact: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Edit Profile",
                          icon: "edit",
                          variant: "primary",
                          event: "EDIT",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "tabs",
                          tabs: [
                            {
                              id: "posts",
                              label: "Posts",
                            },
                            {
                              id: "about",
                              label: "About",
                            },
                            {
                              id: "activity",
                              label: "Activity",
                            },
                          ],
                          defaultActiveTab: "posts",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "viewing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "editing",
                to: "viewing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "ProfilePage",
          path: "/profile",
          isInitial: true,
          traits: [
            {
              ref: "ProfileManager",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-reactions - Reaction System
// ============================================================================

// ── Reusable main-view effects (reactions: browsing) ────────────────

const reactionsBrowsingMainEffects: BehaviorEffect[] = [
  ['fetch', 'Reaction'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'heart', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Reactions' },
      ]},
      { type: 'badge', label: 'Live', variant: 'success' },
    ]},
    { type: 'divider' },
    // Stats row: totals
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Reactions', icon: 'heart', entity: 'Reaction' },
      { type: 'stats', label: 'Users Reacting', icon: 'users', entity: 'Reaction' },
      { type: 'stats', label: 'Targets', icon: 'share-2', entity: 'Reaction' },
    ]},
    { type: 'divider' },
    // Chart: reaction distribution over time
    { type: 'line-chart', entity: 'Reaction', label: 'Reaction Trends', icon: 'trending-up' },
    { type: 'divider' },
    // Reaction grid: each reaction as a card
    { type: 'data-grid', entity: 'Reaction', cols: 3, gap: 'md',
      fields: [
        { name: 'reactionType', label: 'Type', icon: 'heart', variant: 'badge' },
        { name: 'userId', label: 'User', icon: 'user-plus', variant: 'body' },
        { name: 'targetId', label: 'Target', icon: 'share-2', variant: 'caption' },
        { name: 'timestamp', label: 'When', icon: 'clock', variant: 'caption' },
      ],
      actions: [
        { label: 'React', event: 'REACT' },
      ],
    },
    // Engagement meter
    { type: 'meter', value: 0, label: 'Engagement Level', icon: 'activity', entity: 'Reaction' },
  ]}],
];

/**
 * std-reactions - Simple reaction system with add/remove.
 * Supports browsing reactions and toggling reaction state.
 */
export const REACTIONS_BEHAVIOR: BehaviorSchema = {
  name: "std-reactions",
  version: "1.0.0",
  description: "Reaction system with add and remove",
  theme: {
    name: "social-sky",
    tokens: {
      colors: {
        primary: "#0284c7",
        "primary-hover": "#0369a1",
        "primary-foreground": "#ffffff",
        accent: "#38bdf8",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ReactionsOrbital",
      entity: {
        name: "Reaction",
        persistence: "persistent",
        collection: "reactions",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "reactionType",
            type: "string",
            default: "",
          },
          {
            name: "userId",
            type: "string",
            default: "",
          },
          {
            name: "targetId",
            type: "string",
            default: "",
          },
          {
            name: "timestamp",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "ReactionManager",
          linkedEntity: "Reaction",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "reacting",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "REACT",
                name: "Add Reaction",
                payloadSchema: [
                  {
                    name: "reactionType",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "userId",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "targetId",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CONFIRM",
                name: "Confirm Reaction",
              },
              {
                key: "REMOVE",
                name: "Remove Reaction",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "SHOW_REACTORS",
                name: "Show Reactors",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Reaction"],
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
                              content: "Reactions",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "heart",
                              entity: "Reaction",
                              compact: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "React to this content",
                          longPressEvent: "SHOW_REACTORS",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  label: "Like",
                                  icon: "heart",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Thumbs Up",
                                  icon: "thumbs-up",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Smile",
                                  icon: "smile",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Star",
                                  icon: "star",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Fire",
                                  icon: "flame",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Recent Reactions",
                        },
                        {
                          type: "data-list",
                          entity: "Reaction",
                          groupBy: "reactionType",
                          gap: "sm",
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
                                      name: "heart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.userId",
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
                                      content: "@entity.timestamp",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.reactionType",
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
                to: "reacting",
                event: "REACT",
                effects: [
                  ["set", "@entity.reactionType", "@payload.reactionType"],
                  ["set", "@entity.userId", "@payload.userId"],
                  ["set", "@entity.targetId", "@payload.targetId"],
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
                              name: "heart",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Confirm Reaction",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
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
                                      name: "heart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "label",
                                      content: "Reaction",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.reactionType",
                                      variant: "info",
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
                                      type: "avatar",
                                      name: "@entity.userId",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.userId",
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
                                      name: "link",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.targetId",
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
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Cancel",
                              icon: "x",
                              variant: "ghost",
                              event: "CANCEL",
                            },
                            {
                              type: "button",
                              label: "Remove",
                              icon: "trash-2",
                              variant: "danger",
                              event: "REMOVE",
                            },
                            {
                              type: "button",
                              label: "Confirm",
                              icon: "check",
                              variant: "primary",
                              event: "CONFIRM",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reacting",
                to: "browsing",
                event: "CONFIRM",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "Reaction"],
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
                              content: "Reactions",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "heart",
                              entity: "Reaction",
                              compact: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "React to this content",
                          longPressEvent: "SHOW_REACTORS",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  label: "Like",
                                  icon: "heart",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Thumbs Up",
                                  icon: "thumbs-up",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Smile",
                                  icon: "smile",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Star",
                                  icon: "star",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Fire",
                                  icon: "flame",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Recent Reactions",
                        },
                        {
                          type: "data-list",
                          entity: "Reaction",
                          groupBy: "reactionType",
                          gap: "sm",
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
                                      name: "heart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.userId",
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
                                      content: "@entity.timestamp",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.reactionType",
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
                from: "reacting",
                to: "browsing",
                event: "REMOVE",
                effects: [
                  ["set", "@entity.reactionType", ""],
                  ["set", "@entity.userId", ""],
                  ["set", "@entity.targetId", ""],
                  ["render-ui", "modal", null],
                  ["fetch", "Reaction"],
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
                              content: "Reactions",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "heart",
                              entity: "Reaction",
                              compact: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "React to this content",
                          longPressEvent: "SHOW_REACTORS",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  label: "Like",
                                  icon: "heart",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Thumbs Up",
                                  icon: "thumbs-up",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Smile",
                                  icon: "smile",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Star",
                                  icon: "star",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                                {
                                  type: "button",
                                  label: "Fire",
                                  icon: "flame",
                                  variant: "ghost",
                                  event: "REACT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                          label: "Recent Reactions",
                        },
                        {
                          type: "data-list",
                          entity: "Reaction",
                          groupBy: "reactionType",
                          gap: "sm",
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
                                      name: "heart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.userId",
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
                                      content: "@entity.timestamp",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.reactionType",
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
                from: "reacting",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "reacting",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "SHOW_REACTORS",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "ReactionsPage",
          path: "/reactions",
          isInitial: true,
          traits: [
            {
              ref: "ReactionManager",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Social Behaviors
// ============================================================================

export const SOCIAL_BEHAVIORS: BehaviorSchema[] = [
  FEED_BEHAVIOR,
  MESSAGING_BEHAVIOR,
  PROFILE_BEHAVIOR,
  REACTIONS_BEHAVIOR,
];
