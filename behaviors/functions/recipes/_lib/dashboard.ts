/**
 * Resolve a ref-based recipe schema, then wrap every render-ui `main`
 * effect in a dashboard-layout chrome. Two-step pipeline:
 *
 *   1. Write the recipe's ref-based schema to a temp .orb.
 *   2. Shell out to `~/bin/orbital resolve` to materialize every imported
 *      atom — refs collapse, state machines inline, render-ui literals
 *      become reachable from TS.
 *   3. Walk the resolved schema with `wrapInDashboardLayout(...)` so
 *      every `['render-ui', 'main', content]` becomes
 *      `['render-ui', 'main', { type: 'dashboard-layout', appName,
 *      navItems, children: [content] }]`.
 *
 * Recipes that want chrome call `resolveAndWrap(schema, appName)` and
 * export the result. The caller can pass explicit `navItems` or let the
 * helper derive them from the resolved schema's pages via
 * `buildNavItems(...)`.
 *
 * The output is no longer composable via further refs (everything is
 * inline now), but that's fine — chrome-wrapping is the last step before
 * the schema goes to `orbital validate` / `orbital compile`.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { OrbitalSchema } from '@almadar/core/types';
import {
  wrapInDashboardLayout,
  buildNavItems,
  type NavItemConfig,
  type DashboardLayoutChrome,
} from '../../layout';

export interface ResolveAndWrapOpts extends DashboardLayoutChrome {
  /** App name shown in the dashboard sidebar header. */
  appName: string;
  /**
   * Explicit nav items. When omitted, derived from the resolved
   * schema's pages via `buildNavItems(...)`.
   */
  navItems?: NavItemConfig[];
  /**
   * Override the icon mapping `buildNavItems` uses when deriving from
   * pages. Ignored when `navItems` is explicit.
   */
  iconMap?: Record<string, string>;
}

export function resolveAndWrap(
  schema: OrbitalSchema,
  opts: ResolveAndWrapOpts,
): OrbitalSchema {
  const refsPath = `/tmp/recipe-${schema.name}-refs.orb`;
  const resolvedPath = `/tmp/recipe-${schema.name}-resolved.orb`;
  writeFileSync(refsPath, JSON.stringify(schema, null, 2));

  const orbitalBin = join(homedir(), 'bin', 'orbital');
  execSync(`${orbitalBin} resolve "${refsPath}" -o "${resolvedPath}"`, {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  const resolved = JSON.parse(readFileSync(resolvedPath, 'utf-8')) as OrbitalSchema;

  const navItems = opts.navItems ?? buildNavItems(
    resolved.orbitals.flatMap((o) =>
      (o.pages ?? []).filter(
        (p): p is { name: string; path: string } =>
          typeof p === 'object' && 'name' in p && typeof p.name === 'string'
            && 'path' in p && typeof p.path === 'string',
      ),
    ),
    opts.iconMap,
  );

  // Pull chrome props out of opts (everything except the
  // resolveAndWrap-specific keys forwards to wrapInDashboardLayout).
  const {
    appName: _a,
    navItems: _n,
    iconMap: _i,
    ...chrome
  } = opts;

  return wrapInDashboardLayout(resolved, opts.appName, navItems, chrome);
}
