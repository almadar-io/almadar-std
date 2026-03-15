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
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdMessaging } from './std-messaging.js';
import { stdList } from './std-list.js';
import { stdDisplay } from './std-display.js';

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
  { name: 'timestamp', type: 'string' },
];

const defaultChannelFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'memberCount', type: 'number', default: 0 },
  { name: 'isPrivate', type: 'boolean', default: false },
];

const defaultOnlineUserFields: EntityField[] = [
  { name: 'username', type: 'string', required: true },
  { name: 'status', type: 'string', default: 'online' },
  { name: 'lastActive', type: 'string' },
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
  });

  const channelOrbital = stdList({
    entityName: 'Channel',
    fields: channelFields,
    headerIcon: 'hash',
    pageTitle: 'Channels',
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

  return compose(
    [messagingOrbital, channelOrbital, onlineOrbital],
    pages,
    connections,
    'Realtime Chat',
  );
}
