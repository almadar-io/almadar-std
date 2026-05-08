/**
 * Recipe 08 — Slice one orbital out of a multi-orbital organism.
 *
 * Organisms (every app organism — std-cms, std-crm, std-ecommerce…)
 * publish multiple orbitals from one factory. `stdCms({...})` returns
 * `OrbitalDefinition[]`. The agent can pick any subset of those
 * orbitals and embed them in a custom schema — useful when a domain
 * needs the Article side of CMS but not the Media or Categories.
 *
 * Here we slice the first orbital (Articles) out of std-cms and ship
 * just that one in our schema.
 */
import { stdCms } from '@almadar/std/behaviors/functions';
import { makeSchema } from '@almadar/core/builders';
import type { OrbitalSchema } from '@almadar/core/types';

const allCmsOrbitals = stdCms();
// std-cms publishes 4 orbitals: Articles, MediaAssets, Categories, CmsHub.
// Slicing has a contract: the agent picks orbital(s) whose emit/listen
// graph is self-contained, otherwise cross-orbital `*Browse` traits
// produce `ORB_X_UNUSED_EMISSION` because their downstream sibling
// listener (e.g. CategoryBrowse listening to ArticleBrowse.CATEGORIZE)
// is no longer in the schema. CmsHubOrbital (orbital index 3) is the
// safe slice — it's the Tabs+Layout orbital that wires into the others
// via internal events only. Use that as the slicing demonstration.
const cmsHub = allCmsOrbitals[3]; // CmsHubOrbital — internal-only emits

export const schema: OrbitalSchema = makeSchema(
  'recipe-08-organism-slice',
  cmsHub,
);
