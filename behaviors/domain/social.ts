/**
 * Social Domain Behaviors
 *
 * Standard behaviors for social features: feeds, messaging,
 * user profiles, and reaction systems.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-feed - Social Feed
// ============================================================================

/**
 * std-feed - Social feed with post browsing, viewing, and creation.
 * Supports browsing posts, viewing detail, and creating new posts.
 */
export const FEED_BEHAVIOR: OrbitalSchema = {
  name: 'std-feed',
  version: '1.0.0',
  description: 'Social feed with post browsing and creation',
  orbitals: [
    {
      name: 'FeedOrbital',
      entity: {
        name: 'FeedPost',
        persistence: 'persistent',
        collection: 'feed_posts',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'author', type: 'string', default: '' },
          { name: 'content', type: 'string', default: '' },
          { name: 'timestamp', type: 'string', default: '' },
          { name: 'likeCount', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'FeedManager',
          linkedEntity: 'FeedPost',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'creating' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Post', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CREATE', name: 'Create Post' },
              { key: 'SUBMIT', name: 'Submit Post', payloadSchema: [
                { name: 'content', type: 'string', required: true },
                { name: 'author', type: 'string', required: true },
              ] },
              { key: 'LIKE', name: 'Like Post' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'FeedPost'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Feed', 
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FeedPost',
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
                    title: '@entity.id',
                    actions: [
                      { label: 'Like', event: 'LIKE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'viewing',
                event: 'LIKE',
                effects: [
                  ['set', '@entity.likeCount', ['+', '@entity.likeCount', 1]],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.id',
                    actions: [
                      { label: 'Like', event: 'LIKE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
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
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'FeedPost'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'FeedPost',
                    title: 'New Post',
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
                  ['set', '@entity.content', '@payload.content'],
                  ['set', '@entity.author', '@payload.author'],
                  ['set', '@entity.likeCount', 0],
                  ['render-ui', 'modal', null],
                  ['fetch', 'FeedPost'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FeedPost',
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
            ],
          },
        },
      ],
      pages: [
        {
          name: 'FeedPage',
          path: '/feed',
          isInitial: true,
          traits: [{ ref: 'FeedManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-messaging - Messaging System
// ============================================================================

/**
 * std-messaging - Messaging system with conversation browsing and composing.
 * Supports browsing messages, chatting in detail, and composing new messages.
 */
export const MESSAGING_BEHAVIOR: OrbitalSchema = {
  name: 'std-messaging',
  version: '1.0.0',
  description: 'Messaging system with conversation flow',
  orbitals: [
    {
      name: 'MessagingOrbital',
      entity: {
        name: 'Message',
        persistence: 'persistent',
        collection: 'messages',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'sender', type: 'string', default: '' },
          { name: 'content', type: 'string', default: '' },
          { name: 'timestamp', type: 'string', default: '' },
          { name: 'isRead', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'MessagingFlow',
          linkedEntity: 'Message',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'chatting' },
              { name: 'composing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'OPEN_CHAT', name: 'Open Chat', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'COMPOSE', name: 'Compose Message' },
              { key: 'SEND', name: 'Send Message', payloadSchema: [
                { name: 'content', type: 'string', required: true },
                { name: 'sender', type: 'string', required: true },
              ] },
              { key: 'MARK_READ', name: 'Mark as Read' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Message'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Messages' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Message',
                    itemActions: [
                      { label: 'Open', event: 'OPEN_CHAT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'chatting',
                event: 'OPEN_CHAT',
                effects: [
                  ['set', '@entity.isRead', true],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Conversation',
                    actions: [
                      { label: 'Mark Read', event: 'MARK_READ' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'chatting',
                to: 'chatting',
                event: 'MARK_READ',
                effects: [
                  ['set', '@entity.isRead', true],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Conversation',
                    actions: [
                      { label: 'Mark Read', event: 'MARK_READ' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'chatting',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'chatting',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'composing',
                event: 'COMPOSE',
                effects: [
                  ['fetch', 'Message'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Message',
                    title: 'New Message',
                    submitEvent: 'SEND',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'composing',
                to: 'browsing',
                event: 'SEND',
                effects: [
                  ['set', '@entity.content', '@payload.content'],
                  ['set', '@entity.sender', '@payload.sender'],
                  ['set', '@entity.isRead', false],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Message'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Message',
                    itemActions: [
                      { label: 'Open', event: 'OPEN_CHAT' },
                    ],
                  }],
                ],
              },
              {
                from: 'composing',
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
          name: 'MessagesPage',
          path: '/messages',
          isInitial: true,
          traits: [{ ref: 'MessagingFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-profile - User Profile
// ============================================================================

/**
 * std-profile - User profile management with viewing and editing.
 * Supports viewing profile details and editing fields.
 */
export const PROFILE_BEHAVIOR: OrbitalSchema = {
  name: 'std-profile',
  version: '1.0.0',
  description: 'User profile viewing and editing',
  orbitals: [
    {
      name: 'ProfileOrbital',
      entity: {
        name: 'UserProfile',
        persistence: 'persistent',
        collection: 'user_profiles',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'displayName', type: 'string', default: '' },
          { name: 'bio', type: 'string', default: '' },
          { name: 'avatarUrl', type: 'string', default: '' },
          { name: 'joinDate', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ProfileManager',
          linkedEntity: 'UserProfile',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'viewing', isInitial: true },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'EDIT', name: 'Edit Profile' },
              { key: 'UPDATE', name: 'Update Profile', payloadSchema: [
                { name: 'displayName', type: 'string', required: true },
                { name: 'bio', type: 'string', required: true },
                { name: 'avatarUrl', type: 'string', required: true },
              ] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'viewing',
                to: 'viewing',
                event: 'INIT',
                effects: [
                  ['fetch', 'UserProfile'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Profile' }],
                  ['render-ui', 'main', { type: 'detail-panel',
                    title: '@entity.id',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'UserProfile'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'UserProfile',
                    title: 'Edit Profile',
                    submitEvent: 'UPDATE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'viewing',
                event: 'UPDATE',
                effects: [
                  ['set', '@entity.displayName', '@payload.displayName'],
                  ['set', '@entity.bio', '@payload.bio'],
                  ['set', '@entity.avatarUrl', '@payload.avatarUrl'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'UserProfile'],
                  ['render-ui', 'main', { type: 'detail-panel',
                    title: '@entity.id',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'viewing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'editing',
                to: 'viewing',
                event: 'CLOSE',
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
          name: 'ProfilePage',
          path: '/profile',
          isInitial: true,
          traits: [{ ref: 'ProfileManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-reactions - Reaction System
// ============================================================================

/**
 * std-reactions - Simple reaction system with add/remove.
 * Supports browsing reactions and toggling reaction state.
 */
export const REACTIONS_BEHAVIOR: OrbitalSchema = {
  name: 'std-reactions',
  version: '1.0.0',
  description: 'Reaction system with add and remove',
  orbitals: [
    {
      name: 'ReactionsOrbital',
      entity: {
        name: 'Reaction',
        persistence: 'persistent',
        collection: 'reactions',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'type', type: 'string', default: '' },
          { name: 'userId', type: 'string', default: '' },
          { name: 'targetId', type: 'string', default: '' },
          { name: 'timestamp', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ReactionManager',
          linkedEntity: 'Reaction',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'reacting' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'REACT', name: 'Add Reaction', payloadSchema: [
                { name: 'type', type: 'string', required: true },
                { name: 'userId', type: 'string', required: true },
                { name: 'targetId', type: 'string', required: true },
              ] },
              { key: 'CONFIRM', name: 'Confirm Reaction' },
              { key: 'REMOVE', name: 'Remove Reaction' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Reaction'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reactions' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Reaction',
                    itemActions: [
                      { label: 'React', event: 'REACT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'reacting',
                event: 'REACT',
                effects: [
                  ['set', '@entity.type', '@payload.type'],
                  ['set', '@entity.userId', '@payload.userId'],
                  ['set', '@entity.targetId', '@payload.targetId'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Confirm Reaction',
                    actions: [
                      { label: 'Confirm', event: 'CONFIRM' },
                      { label: 'Remove', event: 'REMOVE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'reacting',
                to: 'browsing',
                event: 'CONFIRM',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'Reaction'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Reaction',
                    itemActions: [
                      { label: 'React', event: 'REACT' },
                    ],
                  }],
                ],
              },
              {
                from: 'reacting',
                to: 'browsing',
                event: 'REMOVE',
                effects: [
                  ['set', '@entity.type', ''],
                  ['set', '@entity.userId', ''],
                  ['set', '@entity.targetId', ''],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Reaction'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Reaction',
                    itemActions: [
                      { label: 'React', event: 'REACT' },
                    ],
                  }],
                ],
              },
              {
                from: 'reacting',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'reacting',
                to: 'browsing',
                event: 'CLOSE',
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
          name: 'ReactionsPage',
          path: '/reactions',
          isInitial: true,
          traits: [{ ref: 'ReactionManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Social Behaviors
// ============================================================================

export const SOCIAL_BEHAVIORS: OrbitalSchema[] = [
  FEED_BEHAVIOR,
  MESSAGING_BEHAVIOR,
  PROFILE_BEHAVIOR,
  REACTIONS_BEHAVIOR,
];
