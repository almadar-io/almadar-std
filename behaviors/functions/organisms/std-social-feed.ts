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
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdDetail } from '../molecules/std-detail.js';
import { stdMessaging } from '../molecules/std-messaging.js';
import { socialPostView, socialCommentView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

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
  { name: 'createdAt', type: 'date', default: '' },
  { name: 'likes', type: 'number', default: 0 },
];

const DEFAULT_COMMENT_FIELDS: EntityField[] = [
  { name: 'body', type: 'string', default: '' },
  { name: 'author', type: 'string', default: '' },
  { name: 'postId', type: 'string', default: '' },
  { name: 'createdAt', type: 'date', default: '' },
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
    emptyTitle: 'No posts yet',
    emptyDescription: 'Share your first post.',
    pageName: 'FeedPage',
    pagePath: '/feed',
    isInitial: true,
    ...socialPostView(),
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
    ...socialCommentView(),
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

  const schema = compose([postOrbital, commentOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
