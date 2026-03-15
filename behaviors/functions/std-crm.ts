/**
 * std-crm
 *
 * Customer relationship management organism. Composes molecules via compose:
 * - stdList(Contact): CRUD list of contacts
 * - stdList(Deal): CRUD list of deals
 * - stdDisplay(Pipeline): read-only pipeline dashboard
 * - stdMessaging(Note): notes/communication thread
 *
 * Pages: /contacts (initial), /deals, /pipeline, /notes
 * Connections: CONVERT_LEAD (contacts->deals), CLOSE_DEAL (deals->pipeline)
 *
 * @level organism
 * @family business
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdList } from './std-list.js';
import { stdDisplay } from './std-display.js';
import { stdMessaging } from './std-messaging.js';

// ============================================================================
// Params
// ============================================================================

export interface StdCrmParams {
  appName?: string;
  contactFields?: Array<{ name: string; type: string; default?: unknown }>;
  dealFields?: Array<{ name: string; type: string; default?: unknown }>;
  pipelineFields?: Array<{ name: string; type: string; default?: unknown }>;
  noteFields?: Array<{ name: string; type: string; default?: unknown }>;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_CONTACT_FIELDS = [
  { name: 'name', type: 'string', default: '' },
  { name: 'company', type: 'string', default: '' },
  { name: 'email', type: 'string', default: '' },
  { name: 'phone', type: 'string', default: '' },
  { name: 'status', type: 'string', default: 'lead' },
];

const DEFAULT_DEAL_FIELDS = [
  { name: 'title', type: 'string', default: '' },
  { name: 'contactId', type: 'string', default: '' },
  { name: 'value', type: 'number', default: 0 },
  { name: 'stage', type: 'string', default: 'prospecting' },
  { name: 'closedAt', type: 'string', default: '' },
];

const DEFAULT_PIPELINE_FIELDS = [
  { name: 'totalDeals', type: 'number', default: 0 },
  { name: 'totalValue', type: 'number', default: 0 },
  { name: 'wonDeals', type: 'number', default: 0 },
  { name: 'lostDeals', type: 'number', default: 0 },
  { name: 'conversionRate', type: 'number', default: 0 },
];

const DEFAULT_NOTE_FIELDS = [
  { name: 'subject', type: 'string', default: '' },
  { name: 'body', type: 'string', default: '' },
  { name: 'author', type: 'string', default: '' },
  { name: 'createdAt', type: 'string', default: '' },
];

// ============================================================================
// Composed Application
// ============================================================================

export function stdCrm(params: StdCrmParams): OrbitalSchema {
  const appName = params.appName ?? 'CRM';

  const contactOrbital = stdList({
    entityName: 'Contact',
    fields: params.contactFields ?? DEFAULT_CONTACT_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Contacts',
    headerIcon: 'users',
    createButtonLabel: 'Add Contact',
    createFormTitle: 'New Contact',
    pageName: 'ContactsPage',
    pagePath: '/contacts',
    isInitial: true,
  });

  const dealOrbital = stdList({
    entityName: 'Deal',
    fields: params.dealFields ?? DEFAULT_DEAL_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Deals',
    headerIcon: 'briefcase',
    createButtonLabel: 'New Deal',
    createFormTitle: 'Create Deal',
    pageName: 'DealsPage',
    pagePath: '/deals',
  });

  const pipelineOrbital = stdDisplay({
    entityName: 'Pipeline',
    fields: params.pipelineFields ?? DEFAULT_PIPELINE_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Pipeline',
    headerIcon: 'bar-chart-2',
    columns: 3,
    pageName: 'PipelinePage',
    pagePath: '/pipeline',
  });

  const noteOrbital = stdMessaging({
    entityName: 'Note',
    fields: params.noteFields ?? DEFAULT_NOTE_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Notes',
    headerIcon: 'file-text',
    composerTitle: 'New Note',
    pageName: 'NotesPage',
    pagePath: '/notes',
  });

  const pages: ComposePage[] = [
    { name: 'ContactsPage', path: '/contacts', traits: ['ContactBrowse', 'ContactCreate', 'ContactEdit', 'ContactView', 'ContactDelete'], isInitial: true },
    { name: 'DealsPage', path: '/deals', traits: ['DealBrowse', 'DealCreate', 'DealEdit', 'DealView', 'DealDelete'] },
    { name: 'PipelinePage', path: '/pipeline', traits: ['PipelineDisplay'] },
    { name: 'NotesPage', path: '/notes', traits: ['NoteBrowse', 'NoteCompose', 'NoteView'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'ContactBrowse',
      to: 'DealBrowse',
      event: { event: 'CONVERT_LEAD', description: 'Convert contact lead to a deal' },
    },
    {
      from: 'DealBrowse',
      to: 'PipelineDisplay',
      event: { event: 'CLOSE_DEAL', description: 'Close a deal and update pipeline' },
    },
  ];

  return compose([contactOrbital, dealOrbital, pipelineOrbital, noteOrbital], pages, connections, appName);
}
