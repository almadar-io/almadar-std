/**
 * Geospatial Domain Behaviors
 *
 * Standard behaviors for maps, location picking, and route planning.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ── Shared Geospatial Theme ─────────────────────────────────────────

const GEOSPATIAL_THEME = {
  name: 'geospatial-cyan',
  tokens: {
    colors: {
      primary: '#0891b2',
      'primary-hover': '#0e7490',
      'primary-foreground': '#ffffff',
      accent: '#06b6d4',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-map-view - Map Display with Markers
// ============================================================================

// ── Reusable main-view effects (map view: browsing) ─────────────────

const mapBrowsingMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + create button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'map', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Map' },
      ]},
      { type: 'button', label: 'Create', icon: 'map-pin', variant: 'primary', action: 'CREATE' },
    ]},
    { type: 'divider' },
    // Stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Markers', icon: 'map-pin', entity: 'MapMarker' },
      { type: 'stats', label: 'Categories', icon: 'layers', entity: 'MapMarker' },
    ]},
    { type: 'divider' },
    // Map visualization placeholder
    { type: 'stack', direction: 'vertical', gap: 'md', align: 'center', children: [
      { type: 'icon', name: 'map', size: 'xl' },
      { type: 'typography', variant: 'body', content: 'Map visualization area' },
    ]},
    { type: 'divider' },
    // Selected marker coordinates
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Latitude', value: '@entity.latitude', icon: 'navigation' },
      { type: 'stat-card', label: 'Longitude', value: '@entity.longitude', icon: 'compass' },
    ]},
    { type: 'divider' },
    // Data zone: marker cards
    { type: 'data-grid', entity: 'MapMarker', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'latitude', label: 'Lat', icon: 'navigation', variant: 'body', format: 'number' },
        { name: 'longitude', label: 'Lng', icon: 'compass', variant: 'body', format: 'number' },
        { name: 'category', label: 'Category', icon: 'layers', variant: 'badge' },
      ],
      itemActions: [
        { label: 'View', event: 'SELECT_MARKER' },
      ],
    },
  ]},
] as const;

/**
 * std-map-view - Map display with markers and creation.
 * States: browsing -> viewing -> creating
 */
export const MAP_VIEW_BEHAVIOR: OrbitalSchema = {
  name: 'std-map-view',
  version: '1.0.0',
  description: 'Map display with markers and creation',
  theme: GEOSPATIAL_THEME,
  orbitals: [
    {
      name: 'MapViewOrbital',
      entity: {
        name: 'MapMarker',
        persistence: 'persistent',
        collection: 'map_markers',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'latitude', type: 'number', default: 0 },
          { name: 'longitude', type: 'number', default: 0 },
          { name: 'category', type: 'string', default: 'default' },
        ],
      },
      traits: [
        {
          name: 'MapViewControl',
          linkedEntity: 'MapMarker',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'creating' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT_MARKER', name: 'Select Marker', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CREATE', name: 'Create Marker' },
              { key: 'SAVE', name: 'Save Marker', payloadSchema: [{ name: 'name', type: 'string', required: true }, { name: 'latitude', type: 'number', required: true }, { name: 'longitude', type: 'number', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'MapMarker'],
                  [...mapBrowsingMainEffect],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'SELECT_MARKER',
                effects: [
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
                    // Detail header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'map-pin', size: 'lg' },
                      { type: 'typography', variant: 'h3', content: '@entity.name' },
                    ]},
                    { type: 'divider' },
                    // Coordinate details
                    { type: 'data-list', fields: [
                      { name: 'latitude', label: 'Latitude', icon: 'navigation', format: 'number' },
                      { name: 'longitude', label: 'Longitude', icon: 'compass', format: 'number' },
                      { name: 'category', label: 'Category', icon: 'layers' },
                    ]},
                    { type: 'divider' },
                    // Actions
                    { type: 'stack', direction: 'horizontal', justify: 'end', gap: 'sm', children: [
                      { type: 'button', label: 'Close', icon: 'x', variant: 'secondary', action: 'CLOSE' },
                    ]},
                  ]}],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'MapMarker'],
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
                    // Create header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'map-pin', size: 'lg' },
                      { type: 'typography', variant: 'h3', content: 'New Marker' },
                    ]},
                    { type: 'divider' },
                    // Creation form
                    { type: 'form-section', entity: 'MapMarker', submitEvent: 'SAVE', cancelEvent: 'CANCEL' },
                  ]}],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.latitude', '@payload.latitude'],
                  ['set', '@entity.longitude', '@payload.longitude'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'MapMarker'],
                  [...mapBrowsingMainEffect],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'MapPage',
          path: '/map',
          isInitial: true,
          traits: [{ ref: 'MapViewControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-location-picker - Location Selection
// ============================================================================

// ── Reusable main-view effects (location picker: idle) ──────────────

const locationIdleMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + select button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'target', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Location Picker' },
      ]},
      { type: 'button', label: 'Select Location', icon: 'map-pin', variant: 'primary', action: 'START_SELECTION' },
    ]},
    { type: 'divider' },
    // Coordinate display
    { type: 'form-section', entity: 'SelectedLocation', title: 'Coordinates' },
  ]},
] as const;

/**
 * std-location-picker - Location selection input.
 * States: idle -> selecting -> confirmed
 */
export const LOCATION_PICKER_BEHAVIOR: OrbitalSchema = {
  name: 'std-location-picker',
  version: '1.0.0',
  description: 'Location selection with address and coordinates',
  theme: GEOSPATIAL_THEME,
  orbitals: [
    {
      name: 'LocationPickerOrbital',
      entity: {
        name: 'SelectedLocation',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'address', type: 'string', default: '' },
          { name: 'latitude', type: 'number', default: 0 },
          { name: 'longitude', type: 'number', default: 0 },
          { name: 'label', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'LocationPickerControl',
          linkedEntity: 'SelectedLocation',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'selecting' },
              { name: 'confirmed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START_SELECTION', name: 'Start Selection' },
              { key: 'PICK_LOCATION', name: 'Pick Location', payloadSchema: [{ name: 'address', type: 'string', required: true }, { name: 'latitude', type: 'number', required: true }, { name: 'longitude', type: 'number', required: true }] },
              { key: 'CONFIRM', name: 'Confirm Location' },
              { key: 'CLEAR_SELECTION', name: 'Clear Selection' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.address', ''],
                  ['set', '@entity.latitude', 0],
                  ['set', '@entity.longitude', 0],
                  [...locationIdleMainEffect],
                ],
              },
              {
                from: 'idle',
                to: 'selecting',
                event: 'START_SELECTION',
                effects: [
                  ['fetch', 'SelectedLocation'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'globe', size: 'lg' },
                      { type: 'typography', variant: 'h2', content: 'Select Location' },
                    ]},
                    { type: 'divider' },
                    // Search input for address
                    { type: 'search-input', placeholder: 'Search address...', icon: 'search' },
                    // Form for coordinate entry
                    { type: 'form-section', entity: 'SelectedLocation' },
                  ]}],
                ],
              },
              {
                from: 'selecting',
                to: 'selecting',
                event: 'PICK_LOCATION',
                effects: [
                  ['set', '@entity.address', '@payload.address'],
                  ['set', '@entity.latitude', '@payload.latitude'],
                  ['set', '@entity.longitude', '@payload.longitude'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Header with confirm
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'map-pin', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Selected Location' },
                      ]},
                      { type: 'button', label: 'Confirm', icon: 'check', variant: 'primary', action: 'CONFIRM' },
                    ]},
                    { type: 'divider' },
                    // Location details
                    { type: 'data-list', fields: [
                      { name: 'address', label: 'Address', icon: 'map-pin' },
                      { name: 'latitude', label: 'Latitude', icon: 'navigation', format: 'number' },
                      { name: 'longitude', label: 'Longitude', icon: 'compass', format: 'number' },
                    ]},
                    // Coordinate meter
                    { type: 'meter', value: 0, label: 'Accuracy', icon: 'target', entity: 'SelectedLocation' },
                  ]}],
                ],
              },
              {
                from: 'selecting',
                to: 'confirmed',
                event: 'CONFIRM',
                effects: [
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Confirmed header
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'check', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Location Confirmed' },
                      ]},
                      { type: 'button', label: 'Clear', icon: 'x', variant: 'secondary', action: 'CLEAR_SELECTION' },
                    ]},
                    { type: 'divider' },
                    // Confirmed location details
                    { type: 'badge', label: 'Confirmed', variant: 'success', icon: 'check' },
                    { type: 'data-list', fields: [
                      { name: 'address', label: 'Address', icon: 'map-pin' },
                      { name: 'latitude', label: 'Latitude', icon: 'navigation', format: 'number' },
                      { name: 'longitude', label: 'Longitude', icon: 'compass', format: 'number' },
                      { name: 'label', label: 'Label', icon: 'tag' },
                    ]},
                  ]}],
                ],
              },
              {
                from: 'confirmed',
                to: 'idle',
                event: 'CLEAR_SELECTION',
                effects: [
                  ['set', '@entity.address', ''],
                  ['set', '@entity.latitude', 0],
                  ['set', '@entity.longitude', 0],
                  [...locationIdleMainEffect],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'LocationPage',
          path: '/location',
          isInitial: true,
          traits: [{ ref: 'LocationPickerControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-route-planner - Route Planning
// ============================================================================

// ── Reusable main-view effects (route planner: browsing) ────────────

const routeBrowsingMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + new route button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'navigation', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Routes' },
      ]},
      { type: 'button', label: 'New Route', icon: 'compass', variant: 'primary', action: 'NEW_ROUTE' },
    ]},
    { type: 'divider' },
    // Stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Route Points', icon: 'map-pin', entity: 'RoutePoint' },
      { type: 'stats', label: 'Distance', icon: 'navigation', entity: 'RoutePoint' },
    ]},
    { type: 'divider' },
    // Route point list
    { type: 'data-list', entity: 'RoutePoint',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag' },
        { name: 'latitude', label: 'Lat', icon: 'navigation', format: 'number' },
        { name: 'longitude', label: 'Lng', icon: 'compass', format: 'number' },
        { name: 'order', label: 'Order', icon: 'hash', format: 'number' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW' },
      ],
    },
  ]},
] as const;

// ── Reusable main-view: route point data-list with view action ──────

const routePointListMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'data-list', entity: 'RoutePoint',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag' },
        { name: 'latitude', label: 'Lat', icon: 'navigation', format: 'number' },
        { name: 'longitude', label: 'Lng', icon: 'compass', format: 'number' },
        { name: 'order', label: 'Order', icon: 'hash', format: 'number' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW' },
      ],
    },
  ]},
] as const;

/**
 * std-route-planner - Route creation with waypoints.
 * States: browsing -> planning -> viewing
 */
export const ROUTE_PLANNER_BEHAVIOR: OrbitalSchema = {
  name: 'std-route-planner',
  version: '1.0.0',
  description: 'Route planning with ordered waypoints',
  theme: GEOSPATIAL_THEME,
  orbitals: [
    {
      name: 'RoutePlannerOrbital',
      entity: {
        name: 'RoutePoint',
        persistence: 'persistent',
        collection: 'route_points',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'latitude', type: 'number', default: 0 },
          { name: 'longitude', type: 'number', default: 0 },
          { name: 'order', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'RoutePlannerControl',
          linkedEntity: 'RoutePoint',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'planning' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'NEW_ROUTE', name: 'New Route' },
              { key: 'ADD_POINT', name: 'Add Point', payloadSchema: [{ name: 'name', type: 'string', required: true }, { name: 'latitude', type: 'number', required: true }, { name: 'longitude', type: 'number', required: true }] },
              { key: 'VIEW_ROUTE', name: 'View Route' },
              { key: 'BACK', name: 'Back to Routes' },
              { key: 'VIEW', name: 'View Point', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'RoutePoint'],
                  [...routeBrowsingMainEffect],
                ],
              },
              {
                from: 'browsing',
                to: 'planning',
                event: 'NEW_ROUTE',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Planning header
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'compass', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Plan Route' },
                      ]},
                      { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
                    ]},
                    { type: 'divider' },
                    // Add point form
                    { type: 'form-section', entity: 'RoutePoint' },
                  ]}],
                ],
              },
              {
                from: 'planning',
                to: 'planning',
                event: 'ADD_POINT',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.latitude', '@payload.latitude'],
                  ['set', '@entity.longitude', '@payload.longitude'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Planning header with view route
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'compass', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Plan Route' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'button', label: 'View Route', icon: 'eye', variant: 'primary', action: 'VIEW_ROUTE' },
                        { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
                      ]},
                    ]},
                    { type: 'divider' },
                    // Stats
                    { type: 'stats', label: 'Route Points', icon: 'map-pin', entity: 'RoutePoint' },
                    { type: 'divider' },
                    // Current waypoints
                    { type: 'data-list', entity: 'RoutePoint',
                      fields: [
                        { name: 'name', label: 'Name', icon: 'tag' },
                        { name: 'latitude', label: 'Lat', icon: 'navigation', format: 'number' },
                        { name: 'longitude', label: 'Lng', icon: 'compass', format: 'number' },
                        { name: 'order', label: 'Order', icon: 'hash', format: 'number' },
                      ],
                      itemActions: [{ label: 'View', event: 'VIEW' }],
                    },
                    { type: 'divider' },
                    // Add another point form
                    { type: 'form-section', entity: 'RoutePoint' },
                  ]}],
                ],
              },
              {
                from: 'planning',
                to: 'viewing',
                event: 'VIEW_ROUTE',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Route overview header
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'satellite', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Route Overview' },
                      ]},
                      { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
                    ]},
                    { type: 'divider' },
                    // Stats
                    { type: 'stats', label: 'Route Points', icon: 'map-pin', entity: 'RoutePoint' },
                    { type: 'divider' },
                    // Route point list
                    { type: 'data-list', entity: 'RoutePoint',
                      fields: [
                        { name: 'name', label: 'Name', icon: 'tag' },
                        { name: 'latitude', label: 'Lat', icon: 'navigation', format: 'number' },
                        { name: 'longitude', label: 'Lng', icon: 'compass', format: 'number' },
                        { name: 'order', label: 'Order', icon: 'hash', format: 'number' },
                      ],
                      itemActions: [{ label: 'View', event: 'VIEW' }],
                    },
                    // Route completeness meter
                    { type: 'meter', value: 0, label: 'Route Progress', icon: 'navigation', entity: 'RoutePoint' },
                  ]}],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'RoutePoint'],
                  [...routeBrowsingMainEffect],
                ],
              },
              {
                from: 'planning',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'RoutePoint'],
                  [...routeBrowsingMainEffect],
                ],
              },
              // VIEW self-transitions
              { from: 'browsing', to: 'browsing', event: 'VIEW', effects: [['fetch', 'RoutePoint'], [...routePointListMainEffect]] },
              { from: 'planning', to: 'planning', event: 'VIEW', effects: [['fetch', 'RoutePoint'], [...routePointListMainEffect]] },
              { from: 'viewing', to: 'viewing', event: 'VIEW', effects: [['fetch', 'RoutePoint'], [...routePointListMainEffect]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'RoutesPage',
          path: '/routes',
          isInitial: true,
          traits: [{ ref: 'RoutePlannerControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Geospatial Behaviors
// ============================================================================

export const GEOSPATIAL_BEHAVIORS: OrbitalSchema[] = [
  MAP_VIEW_BEHAVIOR,
  LOCATION_PICKER_BEHAVIOR,
  ROUTE_PLANNER_BEHAVIOR,
];
