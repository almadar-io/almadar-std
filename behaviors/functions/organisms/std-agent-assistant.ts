/**
 * std-agent-assistant
 *
 * Full chat assistant organism. Composes molecule + atoms into a multi-turn
 * conversational agent with memory persistence, context compaction,
 * provider switching, tabbed views, and a memory sidebar drawer.
 *
 * Composed from:
 * - stdAgentConversation: multi-turn chat with generate + context tracking
 * - stdAgentMemory: memory lifecycle (memorize, recall, pin, forget, reinforce, decay)
 * - stdAgentContextWindow: token monitoring and auto-compaction
 * - stdAgentProvider: provider switching based on task complexity
 * - stdTabs: Chat / Memory / Settings tab navigation
 * - stdDrawer: memory sidebar for quick recall
 *
 * Cross-trait events:
 * - MEMORIZE_RESPONSE (Conversation -> Memory): auto-memorize important responses
 * - PROVIDER_CHANGED (Provider -> Conversation): notify conversation of provider switch
 *
 * Pages: /chat (initial), /memory, /settings
 *
 * @level organism
 * @family agent
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

import type { OrbitalSchema, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, extractTrait, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentConversation } from '../atoms/std-agent-conversation.js';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { stdAgentContextWindow } from '../atoms/std-agent-context-window.js';
import { stdAgentProvider } from '../atoms/std-agent-provider.js';
import { stdTabs } from '../atoms/std-tabs.js';
import { stdDrawer } from '../atoms/std-drawer.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentAssistantParams {
  appName?: string;
  assistantFields?: EntityField[];
  memoryFields?: EntityField[];
  providerFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_ASSISTANT_FIELDS: EntityField[] = [
  { name: 'messages', type: 'string', default: '[]' },
  { name: 'currentMessage', type: 'string', default: '' },
  { name: 'response', type: 'string', default: '' },
  { name: 'memoryCount', type: 'number', default: 0 },
  { name: 'contextUsage', type: 'number', default: 0 },
  { name: 'provider', type: 'string', default: 'default' },
  { name: 'sessionId', type: 'string', default: '' },
  { name: 'status', type: 'string', default: 'idle' },
  { name: 'error', type: 'string', default: '' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdAgentAssistant(params: StdAgentAssistantParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Agent Assistant';

  // 1. Conversation orbital from atom
  const conversationOrbital = stdAgentConversation({
    entityName: 'Assistant',
    fields: params.assistantFields ?? DEFAULT_ASSISTANT_FIELDS,
    persistence: 'runtime',
    pageName: 'ChatPage',
    pagePath: '/chat',
    isInitial: true,
  });
  // Rename trait for cross-orbital wiring
  const convTrait = (conversationOrbital.traits as Trait[])[0];
  convTrait.name = 'AssistantConversation';
  convTrait.emits = [
    ...(convTrait.emits ?? []),
    { event: 'MEMORIZE_RESPONSE', description: 'Auto-memorize important responses', scope: 'internal' as const, payload: [
      { name: 'content', type: 'string' },
    ]},
  ];

  // 2. Memory from atom
  const memoryOrbital = stdAgentMemory({
    entityName: 'Memory',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'MemoryPage',
    pagePath: '/memory',
  });

  // 3. Context window from atom
  const contextOrbital = stdAgentContextWindow({
    entityName: 'AssistantContext',
    persistence: 'runtime',
    pageName: 'ContextPage',
    pagePath: '/context',
  });
  const ctxTrait = (contextOrbital.traits as Trait[])[0];
  ctxTrait.name = 'AssistantContextMonitor';

  // 4. Provider management from atom
  const providerOrbital = stdAgentProvider({
    entityName: 'ProviderConfig',
    fields: params.providerFields,
    persistence: 'runtime',
    pageName: 'SettingsPage',
    pagePath: '/settings',
  });
  const provTrait = (providerOrbital.traits as Trait[])[0];
  provTrait.name = 'ProviderManager';
  provTrait.emits = [
    ...(provTrait.emits ?? []),
    { event: 'PROVIDER_CHANGED', description: 'Provider was switched', scope: 'internal' as const, payload: [
      { name: 'provider', type: 'string' },
    ]},
  ];

  // 5. UI atom: tabs for Chat / Memory / Settings navigation
  const assistantFields = ensureIdField(params.assistantFields ?? DEFAULT_ASSISTANT_FIELDS);
  const tabsOrbital = stdTabs({
    entityName: 'Assistant',
    fields: assistantFields,
    tabItems: [
      { label: 'Chat', value: 'chat' },
      { label: 'Memory', value: 'memory' },
      { label: 'Settings', value: 'settings' },
    ],
    headerIcon: 'message-circle',
    pageTitle: 'Assistant',
  });
  const tabsTrait = extractTrait(tabsOrbital);
  tabsTrait.name = 'AssistantTabs';

  // 6. UI atom: drawer for memory sidebar
  const drawerOrbital = stdDrawer({
    entityName: 'MemorySidebar',
    fields: [
      { name: 'content', type: 'string', default: '' },
      { name: 'query', type: 'string', default: '' },
      { name: 'strength', type: 'number', default: 0 },
    ],
    standalone: false,
    drawerTitle: 'Memory Recall',
    headerIcon: 'brain',
  });
  const drawerTrait = extractTrait(drawerOrbital);
  drawerTrait.name = 'MemoryDrawer';

  // Assemble orbitals with tabs and drawer inline
  const tabsEntity = makeEntity({ name: 'AssistantNav', fields: assistantFields, persistence: 'runtime' });
  const tabsOrbDef = makeOrbital('AssistantNavOrbital', tabsEntity, [tabsTrait], [
    makePage({ name: 'NavPage', path: '/assistant/nav', traitName: 'AssistantTabs' }),
  ]);

  const drawerFields = ensureIdField([
    { name: 'content', type: 'string', default: '' },
    { name: 'query', type: 'string', default: '' },
    { name: 'strength', type: 'number', default: 0 },
  ]);
  const drawerEntity = makeEntity({ name: 'MemorySidebar', fields: drawerFields, persistence: 'runtime' });
  const drawerOrbDef = makeOrbital('MemorySidebarOrbital', drawerEntity, [drawerTrait], [
    makePage({ name: 'SidebarPage', path: '/assistant/sidebar', traitName: 'MemoryDrawer' }),
  ]);

  const pages: ComposePage[] = [
    { name: 'ChatPage', path: '/chat', traits: ['AssistantConversation'], isInitial: true },
    { name: 'ContextPage', path: '/context', traits: ['AssistantContextMonitor'] },
    { name: 'NavPage', path: '/assistant/nav', traits: ['AssistantTabs'] },
    { name: 'SidebarPage', path: '/assistant/sidebar', traits: ['MemoryDrawer'] },
    { name: 'MemoryPage', path: '/memory', traits: ['MemoryBrowse', 'MemoryCreate', 'MemoryAgent'] },
    { name: 'SettingsPage', path: '/settings', traits: ['ProviderManager'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'AssistantConversation',
      to: 'MemoryAgent',
      event: { event: 'MEMORIZE_RESPONSE', description: 'Auto-memorize important responses', payload: [{ name: 'content', type: 'string' }] },
      triggers: 'MEMORIZE',
    },
    {
      from: 'ProviderManager',
      to: 'AssistantConversation',
      event: { event: 'PROVIDER_CHANGED', description: 'Provider was switched', payload: [{ name: 'provider', type: 'string' }] },
      triggers: 'INIT',
    },
  ];

  const schema = compose(
    [conversationOrbital, memoryOrbital, contextOrbital, providerOrbital, tabsOrbDef, drawerOrbDef],
    pages,
    connections,
    appName,
  );

  const navPages = pages.filter(p => ['/chat', '/memory', '/settings'].includes(p.path));
  return wrapInDashboardLayout(schema, appName, buildNavItems(navPages, {
    chat: 'message-circle',
    memory: 'brain',
    settings: 'settings',
  }));
}
