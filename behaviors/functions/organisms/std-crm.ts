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

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDisplay } from '../atoms/std-display.js';
import { stdMessaging } from '../molecules/std-messaging.js';
import { crmContactView, crmDealView, crmNoteView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdCrmParams {
  appName?: string;
  contactFields?: EntityField[];
  dealFields?: EntityField[];
  pipelineFields?: EntityField[];
  noteFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_CONTACT_FIELDS: EntityField[] = [
  { name: 'name', type: 'string', default: '' },
  { name: 'company', type: 'string', default: '' },
  { name: 'email', type: 'string', default: '' },
  { name: 'phone', type: 'string', default: '' },
  { name: 'status', type: 'string', default: 'lead', values: ['lead', 'prospect', 'customer', 'inactive'] },
];

const DEFAULT_DEAL_FIELDS: EntityField[] = [
  { name: 'title', type: 'string', default: '' },
  { name: 'contactId', type: 'string', default: '' },
  { name: 'value', type: 'number', default: 0 },
  { name: 'stage', type: 'string', default: 'prospecting', values: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] },
  { name: 'closedAt', type: 'date', default: '' },
];

const DEFAULT_PIPELINE_FIELDS: EntityField[] = [
  { name: 'totalDeals', type: 'number', default: 0 },
  { name: 'totalValue', type: 'number', default: 0 },
  { name: 'wonDeals', type: 'number', default: 0 },
  { name: 'lostDeals', type: 'number', default: 0 },
  { name: 'conversionRate', type: 'number', default: 0 },
];

const DEFAULT_NOTE_FIELDS: EntityField[] = [
  { name: 'subject', type: 'string', default: '' },
  { name: 'body', type: 'string', default: '' },
  { name: 'author', type: 'string', default: '' },
  { name: 'createdAt', type: 'date', default: '' },
];

// ============================================================================
// Composed Application
// ============================================================================

export function stdCrm(params: StdCrmParams): OrbitalSchema {
  const appName = params.appName ?? 'CRM';

  const contactView = crmContactView();
  const contactOrbital = stdList({
    entityName: 'Contact',
    fields: params.contactFields ?? DEFAULT_CONTACT_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Contacts',
    headerIcon: 'users',
    createButtonLabel: 'Add Contact',
    createFormTitle: 'New Contact',
    emptyTitle: 'No contacts yet',
    emptyDescription: 'Add your first contact to start building your CRM.',
    pageName: 'ContactsPage',
    pagePath: '/contacts',
    isInitial: true,
    ...contactView,
  });

  const dealView = crmDealView();
  const dealOrbital = stdList({
    entityName: 'Deal',
    fields: params.dealFields ?? DEFAULT_DEAL_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Deals',
    headerIcon: 'briefcase',
    createButtonLabel: 'New Deal',
    createFormTitle: 'Create Deal',
    emptyTitle: 'No deals yet',
    emptyDescription: 'Create a deal to track your sales pipeline.',
    pageName: 'DealsPage',
    pagePath: '/deals',
    ...dealView,
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

  const noteView = crmNoteView();
  const noteOrbital = stdMessaging({
    entityName: 'Note',
    fields: params.noteFields ?? DEFAULT_NOTE_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Notes',
    headerIcon: 'file-text',
    composerTitle: 'New Note',
    pageName: 'NotesPage',
    pagePath: '/notes',
    ...noteView,
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
      event: { event: 'CONVERT_LEAD', description: 'Convert contact lead to a deal', payload: [{ name: 'id', type: 'string', required: true }] },
    },
    {
      from: 'DealBrowse',
      to: 'PipelineDisplay',
      event: { event: 'CLOSE_DEAL', description: 'Close a deal and update pipeline', payload: [{ name: 'id', type: 'string', required: true }] },
    },
  ];

  const schema = compose([contactOrbital, dealOrbital, pipelineOrbital, noteOrbital], pages, connections, appName);
  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
