/**
 * std-realtime-chat
 *
 * Realtime chat organism.
 * Composes: stdMessaging(ChatMessage) + stdList(Channel) + stdDisplay(OnlineUser)
 *
 * Pages: /chat (initial), /channels, /online
 *
 * @level organism
 * @family communication
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
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdMessaging } from '../molecules/std-messaging.js';
import { stdList } from '../molecules/std-list.js';
import { stdDisplay } from '../atoms/std-display.js';
import { chatChannelView, chatMessageView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdRealtimeChatParams {
  chatMessageFields?: EntityField[];
  channelFields?: EntityField[];
  onlineUserFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultChatMessageFields: EntityField[] = [
  { name: 'sender', type: 'string', required: true },
  { name: 'content', type: 'string', required: true },
  { name: 'channel', type: 'string' },
  { name: 'timestamp', type: 'date' },
];

const defaultChannelFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'memberCount', type: 'number', default: 0 },
  { name: 'isPrivate', type: 'boolean', default: false },
];

const defaultOnlineUserFields: EntityField[] = [
  { name: 'username', type: 'string', required: true },
  { name: 'status', type: 'string', default: 'online', values: ['online', 'away', 'busy', 'offline'] },
  { name: 'lastActive', type: 'date' },
  { name: 'avatar', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdRealtimeChat(params: StdRealtimeChatParams): OrbitalSchema {
  const chatMessageFields = params.chatMessageFields ?? defaultChatMessageFields;
  const channelFields = params.channelFields ?? defaultChannelFields;
  const onlineUserFields = params.onlineUserFields ?? defaultOnlineUserFields;

  const messagingOrbital = stdMessaging({
    entityName: 'ChatMessage',
    fields: chatMessageFields,
    headerIcon: 'message-circle',
    pageTitle: 'Chat',
    ...chatMessageView(),
  });

  const channelOrbital = stdList({
    entityName: 'Channel',
    fields: channelFields,
    headerIcon: 'hash',
    pageTitle: 'Channels',
    emptyTitle: 'No channels yet',
    emptyDescription: 'Create a channel to start conversations.',
    ...chatChannelView(),
  });

  const onlineOrbital = stdDisplay({
    entityName: 'OnlineUser',
    fields: onlineUserFields,
    headerIcon: 'users',
    pageTitle: 'Online Users',
  });

  const pages: ComposePage[] = [
    { name: 'ChatPage', path: '/chat', traits: ['ChatMessageBrowse', 'ChatMessageCompose', 'ChatMessageView'], isInitial: true },
    { name: 'ChannelsPage', path: '/channels', traits: ['ChannelBrowse', 'ChannelCreate', 'ChannelEdit', 'ChannelView', 'ChannelDelete'] },
    { name: 'OnlinePage', path: '/online', traits: ['OnlineUserDisplay'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Realtime Chat';


  const schema = compose([messagingOrbital, channelOrbital, onlineOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
