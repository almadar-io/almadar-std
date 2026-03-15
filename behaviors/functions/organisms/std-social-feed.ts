/**
 * std-social-feed
 *
 * Social feed organism. Composes molecules via compose:
 * - stdDetail(Post): browse + create + view posts
 * - stdMessaging(Comment): messaging thread for comments
 *
 * Pages: /feed (initial), /messages
 * Connections: COMMENT event wires posts to comments.
 *
 * @level organism
 * @family social
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdDetail } from '../molecules/std-detail.js';
import { stdMessaging } from '../molecules/std-messaging.js';

// ============================================================================
// Params
// ============================================================================

export interface StdSocialFeedParams {
  appName?: string;
  postFields?: EntityField[];
  commentFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_POST_FIELDS: EntityField[] = [
  { name: 'title', type: 'string', default: '' },
  { name: 'content', type: 'string', default: '' },
  { name: 'author', type: 'string', default: '' },
  { name: 'createdAt', type: 'string', default: '' },
  { name: 'likes', type: 'number', default: 0 },
];

const DEFAULT_COMMENT_FIELDS: EntityField[] = [
  { name: 'body', type: 'string', default: '' },
  { name: 'author', type: 'string', default: '' },
  { name: 'postId', type: 'string', default: '' },
  { name: 'createdAt', type: 'string', default: '' },
];

// ============================================================================
// Composed Application
// ============================================================================

export function stdSocialFeed(params: StdSocialFeedParams): OrbitalSchema {
  const appName = params.appName ?? 'SocialFeed';

  const postOrbital = stdDetail({
    entityName: 'Post',
    fields: params.postFields ?? DEFAULT_POST_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Feed',
    headerIcon: 'rss',
    createButtonLabel: 'New Post',
    createFormTitle: 'Create Post',
    pageName: 'FeedPage',
    pagePath: '/feed',
    isInitial: true,
  });

  const commentOrbital = stdMessaging({
    entityName: 'Comment',
    fields: params.commentFields ?? DEFAULT_COMMENT_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Messages',
    headerIcon: 'message-circle',
    composerTitle: 'New Comment',
    pageName: 'MessagesPage',
    pagePath: '/messages',
  });

  const pages: ComposePage[] = [
    { name: 'FeedPage', path: '/feed', traits: ['PostBrowse', 'PostCreate', 'PostView'], isInitial: true },
    { name: 'MessagesPage', path: '/messages', traits: ['CommentBrowse', 'CommentCompose', 'CommentView'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'PostBrowse',
      to: 'CommentBrowse',
      event: { event: 'COMMENT', description: 'Navigate to comments for a post', payload: [{ name: 'id', type: 'string', required: true }] },
    },
  ];

  return compose([postOrbital, commentOrbital], pages, connections, appName);
}
