/**
 * std-service-research-assistant
 *
 * Content research assistant organism. Composes service atoms/molecules via compose:
 * - stdServiceContentPipeline(Research): YouTube search + LLM summarization
 * - stdServiceRedis(CacheEntry): Redis cache management (standalone)
 * - stdServiceStorage(Report): saving research reports to storage (standalone)
 * - stdServiceCustomBearer(KnowledgeQuery): custom knowledge API queries (standalone)
 *
 * Cross-orbital connections:
 * (none - each page operates independently, user navigates via dashboard nav)
 *
 * @level organism
 * @family service
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposePage } from '@almadar/core/builders';
import { stdServiceContentPipeline } from '../molecules/std-service-content-pipeline.js';
import { stdServiceRedis } from '../atoms/std-service-redis.js';
import { stdServiceStorage } from '../atoms/std-service-storage.js';
import { stdServiceCustomBearer } from '../atoms/std-service-custom-bearer.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceResearchAssistantParams {
  appName?: string;
  researchFields?: EntityField[];
  cacheFields?: EntityField[];
  storageFields?: EntityField[];
}

// ============================================================================
// Organism
// ============================================================================

export function stdServiceResearchAssistant(params: StdServiceResearchAssistantParams): OrbitalSchema {
  const research = stdServiceContentPipeline({
    entityName: 'Research',
    fields: params.researchFields,
    pageName: 'ResearchPage',
    pagePath: '/research',
    isInitial: true,
  });

  const cache = stdServiceRedis({
    entityName: 'CacheEntry',
    fields: params.cacheFields,
    standalone: true,
    pageName: 'CachePage',
    pagePath: '/cache',
  });

  const reports = stdServiceStorage({
    entityName: 'Report',
    fields: params.storageFields,
    standalone: true,
    pageName: 'ReportsPage',
    pagePath: '/reports',
  });

  const knowledge = stdServiceCustomBearer({
    entityName: 'KnowledgeQuery',
    standalone: true,
    baseUrl: 'https://api.knowledge-base.example.com',
    pageName: 'KnowledgePage',
    pagePath: '/knowledge',
  });

  const appName = params.appName ?? 'ResearchAssistant';

  const pages: ComposePage[] = [
    { name: 'ResearchPage', path: '/research', traits: ['ResearchPipeline'], isInitial: true },
    { name: 'CachePage', path: '/cache', traits: ['CacheEntryRedis'] },
    { name: 'ReportsPage', path: '/reports', traits: ['ReportStorage'] },
    { name: 'KnowledgePage', path: '/knowledge', traits: ['KnowledgeQueryCustomBearer'] },
  ];

  const schema = compose(
    [research, cache, reports, knowledge],
    pages,
    [],
    appName,
  );

  // Strip all orbital-level service declarations to avoid ORB_GEN_DUPLICATE.
  // Platform services are validated via services-registry.json (loaded by the compiler).
  // Custom services must be declared at schema level.
  if (schema.orbitals) {
    for (const orbital of schema.orbitals) {
      delete (orbital as unknown as Record<string, unknown>).services;
    }
  }
  (schema as unknown as Record<string, unknown>).services = [
    { name: 'custom-bearer-api', type: 'rest', baseUrl: 'https://api.knowledge-base.example.com', auth: { type: 'bearer', secretEnv: 'CUSTOM_BEARER_TOKEN' } },
  ];

  const navItems = buildNavItems(pages, {
    research: 'search',
    cache: 'database',
    reports: 'file-text',
    knowledge: 'book-open',
  });

  return wrapInDashboardLayout(schema, appName, navItems);
}
