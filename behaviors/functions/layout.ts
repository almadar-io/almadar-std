/**
 * Layout wrappers for organism behaviors.
 *
 * Post-processes a composed OrbitalSchema to wrap all render-ui 'main' effects
 * in a dashboard-layout or game-shell pattern, giving every page a consistent
 * application shell with sidebar navigation, top bar, and user menu.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';

interface NavItemConfig {
  label: string;
  href: string;
  icon: string;
}

/**
 * Wrap all render-ui 'main' effects in a dashboard-layout pattern.
 *
 * Walks the composed schema's transitions and wraps each
 * `['render-ui', 'main', content]` as
 * `['render-ui', 'main', { type: 'dashboard-layout', appName, navItems, children: [content] }]`.
 *
 * The compiler renders this naturally since `dashboard-layout` is a registered pattern.
 */
export function wrapInDashboardLayout(
  schema: OrbitalSchema,
  appName: string,
  navItems: NavItemConfig[],
): OrbitalSchema {
  const layoutWrapper = {
    type: 'dashboard-layout',
    appName,
    navItems,
  };

  for (const orbital of schema.orbitals) {
    if (!orbital.traits) continue;
    for (const traitRef of orbital.traits) {
      if (typeof traitRef === 'string' || !('stateMachine' in traitRef)) continue;
      const sm = traitRef.stateMachine;
      if (!sm || !('transitions' in sm)) continue;
      const transitions = sm.transitions as Array<{
        effects: unknown[];
      }>;
      for (const transition of transitions) {
        if (!transition.effects) continue;
        for (let i = 0; i < transition.effects.length; i++) {
          const effect = transition.effects[i];
          if (
            Array.isArray(effect) &&
            effect[0] === 'render-ui' &&
            effect[1] === 'main' &&
            effect[2] != null
          ) {
            const content = effect[2];
            transition.effects[i] = [
              'render-ui',
              'main',
              { ...layoutWrapper, children: [content] },
            ];
          }
        }
      }
    }
  }

  return schema;
}

/**
 * Wrap all render-ui 'main' effects in a game-shell pattern.
 *
 * Similar to wrapInDashboardLayout but uses the game-shell pattern which
 * provides a full-screen dark container with optional HUD, no sidebar.
 */
export function wrapInGameShell(
  schema: OrbitalSchema,
  appName: string,
): OrbitalSchema {
  const shellWrapper = {
    type: 'game-shell',
    appName,
    showTopBar: true,
  };

  for (const orbital of schema.orbitals) {
    if (!orbital.traits) continue;
    for (const traitRef of orbital.traits) {
      if (typeof traitRef === 'string' || !('stateMachine' in traitRef)) continue;
      const sm = traitRef.stateMachine;
      if (!sm || !('transitions' in sm)) continue;
      const transitions = sm.transitions as Array<{
        effects: unknown[];
      }>;
      for (const transition of transitions) {
        if (!transition.effects) continue;
        for (let i = 0; i < transition.effects.length; i++) {
          const effect = transition.effects[i];
          if (
            Array.isArray(effect) &&
            effect[0] === 'render-ui' &&
            effect[1] === 'main' &&
            effect[2] != null
          ) {
            const content = effect[2];
            transition.effects[i] = [
              'render-ui',
              'main',
              { ...shellWrapper, children: [content] },
            ];
          }
        }
      }
    }
  }

  return schema;
}

/**
 * Build navItems from a ComposePage array.
 *
 * Extracts page name, path, and derives an icon from the page name or
 * accepts an explicit iconMap.
 */
export function buildNavItems(
  pages: Array<{ name: string; path: string }>,
  iconMap?: Record<string, string>,
): NavItemConfig[] {
  // Default icon mapping by common page name patterns
  const defaultIcons: Record<string, string> = {
    contacts: 'users',
    deals: 'briefcase',
    pipeline: 'bar-chart-2',
    notes: 'file-text',
    products: 'package',
    cart: 'shopping-cart',
    checkout: 'credit-card',
    orders: 'clipboard-list',
    patients: 'heart',
    appointments: 'calendar',
    prescriptions: 'pill',
    dashboard: 'layout-dashboard',
    tickets: 'inbox',
    responses: 'message-circle',
    tasks: 'check-square',
    sprints: 'zap',
    channels: 'hash',
    messages: 'message-circle',
    transactions: 'dollar-sign',
    reports: 'bar-chart',
    devices: 'cpu',
    readings: 'activity',
    alerts: 'bell',
    articles: 'file-text',
    categories: 'folder',
    media: 'image',
    courses: 'book-open',
    lessons: 'play-circle',
    students: 'graduation-cap',
    employees: 'users',
    departments: 'building',
    timeoff: 'calendar',
    reviews: 'star',
    positions: 'trending-up',
    watchlist: 'eye',
    routes: 'git-branch',
    backends: 'server',
    analytics: 'bar-chart-2',
    builds: 'hammer',
    stages: 'layers',
    deploy: 'rocket',
    services: 'server',
    logs: 'terminal',
    infrastructure: 'database',
    posts: 'edit',
    comments: 'message-square',
    providers: 'user-check',
    schedule: 'clock',
    book: 'calendar-plus',
    game: 'gamepad-2',
    scores: 'trophy',
    hud: 'activity',
    canvas: 'monitor',
    settings: 'settings',
  };

  return pages.map(page => {
    // Derive label: "ContactsPage" -> "Contacts", "DealsPage" -> "Deals"
    const label = page.name
      .replace(/Page$/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2');

    // Derive icon from path segment
    const pathKey = page.path.replace(/^\//, '').split('/')[0].toLowerCase();
    const icon = iconMap?.[pathKey] ?? defaultIcons[pathKey] ?? 'layout-list';

    return { label, href: page.path, icon };
  });
}
