/**
 * Layout wrappers for organism behaviors.
 *
 * Post-processes a composed OrbitalSchema to wrap all render-ui 'main' effects
 * in a dashboard-layout or game-shell pattern, giving every page a consistent
 * application shell with sidebar navigation, top bar, and user menu.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema, SExpr } from '@almadar/core/types';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: string;
}

/**
 * Optional chrome forwarded into the dashboard-layout pattern at every
 * wrapped render-ui main effect. All keys are passthroughs to the
 * pattern's props (see DashboardLayout.tsx in @almadar/ui). Event-name
 * fields are typed as plain strings here because the Rust render-ui
 * pattern resolver translates them into bus dispatchers at runtime.
 */
export interface DashboardLayoutChrome {
  /** Search box: any of these flips it on. `searchEvent` is what gets
   *  dispatched on Enter (`UI:{searchEvent}` with `{ value }` payload). */
  showSearch?: boolean;
  searchEvent?: string;
  /** Notifications bell: pass an array (even `[]`) to render the bell;
   *  omit/null hides it. The value can be a literal payload binding
   *  string like `'@payload.data'` so render-ui resolves it from the
   *  trait's bus payload at render time. */
  notifications?: unknown;
  /** Event-name dispatched on bell click (`UI:{notificationClickEvent}`
   *  with empty payload). */
  notificationClickEvent?: string;
  /** Custom sidebar footer content (UI pattern subtree). Omitted →
   *  no footer. Apps that want Settings should add a navItems entry
   *  instead of stuffing it into the footer. */
  sidebarFooter?: unknown;
  /** Theme toggle visibility. Default true. */
  showThemeToggle?: boolean;
}

/**
 * Wrap all render-ui 'main' effects in a dashboard-layout pattern.
 *
 * Walks the composed schema's transitions and wraps each
 * `['render-ui', 'main', content]` as
 * `['render-ui', 'main', { type: 'dashboard-layout', appName, navItems,
 *  ...chrome, children: [content] }]`.
 *
 * `chrome` is the optional opt-in surface for search box, notification
 * bell, sidebar footer, and theme toggle (see DashboardLayoutChrome).
 *
 * The compiler renders this naturally since `dashboard-layout` is a
 * registered pattern. Event-name strings get translated into bus
 * dispatchers by the render-ui pattern resolver.
 */
export function wrapInDashboardLayout(
  schema: OrbitalSchema,
  appName: string,
  navItems: NavItemConfig[],
  chrome: DashboardLayoutChrome = {},
): OrbitalSchema {
  // Strip undefined/null entries so the rendered tree only carries
  // explicit opt-ins (matches "omitted = hide" semantics in the
  // DashboardLayout component).
  const chromeProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(chrome)) {
    if (value !== undefined && value !== null) {
      chromeProps[key] = value;
    }
  }

  const layoutWrapper = {
    type: 'dashboard-layout',
    appName,
    navItems,
    ...chromeProps,
  };

  // Chrome event-name props become emits on every wrapped trait — the
  // dashboard-layout pattern dispatches them via the bus, and the
  // trait's contract must declare every emit it can produce. Without
  // this, the validator's `ORB_X_RENDER_UI_EVENT_LITERAL_STALE` rule
  // (correctly) rejects render-ui literals that reference undeclared
  // event keys.
  const chromeEventNames: string[] = [];
  for (const key of ['searchEvent', 'notificationClickEvent'] as const) {
    const value = chromeProps[key];
    if (typeof value === 'string' && value.length > 0) {
      chromeEventNames.push(value);
    }
  }

  for (const orbital of schema.orbitals) {
    if (!orbital.traits) continue;
    for (const traitRef of orbital.traits) {
      if (typeof traitRef === 'string' || !('stateMachine' in traitRef)) continue;
      const sm = traitRef.stateMachine;
      if (!sm || !('transitions' in sm)) continue;
      const transitions = sm.transitions as Array<{
        effects: SExpr[];
      }>;

      let wrappedAny = false;
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
            wrappedAny = true;
          }
        }
      }

      // Only extend emits on traits that actually got chrome — unwrapped
      // traits keep their original contract.
      if (wrappedAny && chromeEventNames.length > 0) {
        const traitWithEmits = traitRef as { emits?: Array<{ event: string; scope?: string }> };
        const emits = traitWithEmits.emits ?? [];
        const declared = new Set(emits.map((e) => e.event));
        for (const eventName of chromeEventNames) {
          if (!declared.has(eventName)) {
            emits.push({ event: eventName, scope: 'internal' });
            declared.add(eventName);
          }
        }
        traitWithEmits.emits = emits;
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
        effects: SExpr[];
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
