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
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDetail } from '../molecules/std-detail.js';

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
  { name: 'status', type: 'string', default: 'draft' },
  { name: 'publishedAt', type: 'string' },
];

const DEFAULT_MEDIA_ASSET_FIELDS: EntityField[] = [
  { name: 'fileName', type: 'string', required: true },
  { name: 'fileType', type: 'string', required: true },
  { name: 'fileSize', type: 'number' },
  { name: 'url', type: 'string' },
  { name: 'altText', type: 'string' },
  { name: 'uploadedAt', type: 'string' },
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
    pageName: 'ArticlesPage',
    pagePath: '/articles',
    isInitial: true,
  });

  const media = stdDetail({
    entityName: 'MediaAsset',
    fields: mediaAssetFields,
    pageTitle: 'Media Library',
    headerIcon: 'image',
    pageName: 'MediaPage',
    pagePath: '/media',
  });

  const categories = stdList({
    entityName: 'Category',
    fields: categoryFields,
    pageTitle: 'Categories',
    headerIcon: 'folder',
    pageName: 'CategoriesPage',
    pagePath: '/categories',
  });

  return compose(
    [articles, media, categories],
    [
      { name: 'ArticlesPage', path: '/articles', traits: ['ArticleBrowse', 'ArticleCreate', 'ArticleEdit', 'ArticleView', 'ArticleDelete'], isInitial: true },
      { name: 'MediaPage', path: '/media', traits: ['MediaAssetBrowse', 'MediaAssetCreate', 'MediaAssetView'] },
      { name: 'CategoriesPage', path: '/categories', traits: ['CategoryBrowse', 'CategoryCreate', 'CategoryEdit', 'CategoryView', 'CategoryDelete'] },
    ],
    [
      { from: 'ArticleBrowse', to: 'MediaAssetBrowse', event: { event: 'PUBLISH', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'ArticleBrowse', to: 'CategoryBrowse', event: { event: 'CATEGORIZE', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],
    params.appName ?? 'CmsApp',
  );
}
