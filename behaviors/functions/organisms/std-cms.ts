/**
 * std-cms
 *
 * Content management organism. Composes molecules via compose:
 * - stdList(Article): article management with CRUD
 * - stdDetail(MediaAsset): media library browse + view
 * - stdList(Category): category management
 *
 * Cross-orbital connections:
 * - PUBLISH: ArticleBrowse -> MediaAssetBrowse
 * - CATEGORIZE: ArticleBrowse -> CategoryBrowse
 *
 * @level organism
 * @family content
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

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposePage } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDetail } from '../molecules/std-detail.js';
import { cmsArticleView, cmsCategoryView, cmsMediaView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdCmsParams {
  appName?: string;
  articleFields?: EntityField[];
  mediaAssetFields?: EntityField[];
  categoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_ARTICLE_FIELDS: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'slug', type: 'string', required: true },
  { name: 'content', type: 'string' },
  { name: 'author', type: 'string' },
  { name: 'status', type: 'string', default: 'draft', values: ['draft', 'review', 'published', 'archived'] },
  { name: 'publishedAt', type: 'date' },
];

const DEFAULT_MEDIA_ASSET_FIELDS: EntityField[] = [
  { name: 'fileName', type: 'string', required: true },
  { name: 'fileType', type: 'string', required: true },
  { name: 'fileSize', type: 'number' },
  { name: 'url', type: 'string' },
  { name: 'altText', type: 'string' },
  { name: 'uploadedAt', type: 'date' },
];

const DEFAULT_CATEGORY_FIELDS: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'slug', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'parentCategory', type: 'string' },
  { name: 'articleCount', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdCms(params: StdCmsParams): OrbitalSchema {
  const articleFields = params.articleFields ?? DEFAULT_ARTICLE_FIELDS;
  const mediaAssetFields = params.mediaAssetFields ?? DEFAULT_MEDIA_ASSET_FIELDS;
  const categoryFields = params.categoryFields ?? DEFAULT_CATEGORY_FIELDS;

  const articles = stdList({
    entityName: 'Article',
    fields: articleFields,
    pageTitle: 'Articles',
    headerIcon: 'file-text',
    emptyTitle: 'No articles yet',
    emptyDescription: 'Write your first article.',
    pageName: 'ArticlesPage',
    pagePath: '/articles',
    isInitial: true,
    ...cmsArticleView(),
  });

  const media = stdDetail({
    entityName: 'MediaAsset',
    fields: mediaAssetFields,
    pageTitle: 'Media Library',
    headerIcon: 'image',
    emptyTitle: 'No media assets',
    emptyDescription: 'Upload media to build your library.',
    pageName: 'MediaPage',
    pagePath: '/media',
    ...cmsMediaView(),
  });

  const categories = stdList({
    entityName: 'Category',
    fields: categoryFields,
    pageTitle: 'Categories',
    headerIcon: 'folder',
    emptyTitle: 'No categories yet',
    emptyDescription: 'Create categories to organize your content.',
    pageName: 'CategoriesPage',
    pagePath: '/categories',
    ...cmsCategoryView(),
  });

  const appName = params.appName ?? 'CmsApp';



  const pages: ComposePage[] = [
      { name: 'ArticlesPage', path: '/articles', traits: ['ArticleBrowse', 'ArticleCreate', 'ArticleEdit', 'ArticleView', 'ArticleDelete'], isInitial: true },
      { name: 'MediaPage', path: '/media', traits: ['MediaAssetBrowse', 'MediaAssetCreate', 'MediaAssetView'] },
      { name: 'CategoriesPage', path: '/categories', traits: ['CategoryBrowse', 'CategoryCreate', 'CategoryEdit', 'CategoryView', 'CategoryDelete'] },
    ];



  const schema = compose(


    [articles, media, categories],


    pages,


    [
      { from: 'ArticleBrowse', to: 'MediaAssetBrowse', event: { event: 'PUBLISH', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'ArticleBrowse', to: 'CategoryBrowse', event: { event: 'CATEGORIZE', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],


    appName,


  );


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
