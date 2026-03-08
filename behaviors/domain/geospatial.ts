/**
 * Geospatial Domain Behaviors
 *
 * Standard behaviors for maps, location picking, and route planning.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-map-view - Map Display with Markers
// ============================================================================

/**
 * std-map-view - Map display with markers and creation.
 * States: browsing -> viewing -> creating
 */
export const MAP_VIEW_BEHAVIOR: OrbitalSchema = {
  name: 'std-map-view',
  version: '1.0.0',
  description: 'Map display with markers and creation',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Map',
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Markers', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'MapMarker',
                    itemActions: [
                      { label: 'View', event: 'SELECT_MARKER' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'SELECT_MARKER',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.name',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
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
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'MapMarker',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
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
                  ['render-ui', 'main', { type: 'stats', label: 'Markers', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'MapMarker',
                    itemActions: [
                      { label: 'View', event: 'SELECT_MARKER' },
                    ],
                  }],
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

/**
 * std-location-picker - Location selection input.
 * States: idle -> selecting -> confirmed
 */
export const LOCATION_PICKER_BEHAVIOR: OrbitalSchema = {
  name: 'std-location-picker',
  version: '1.0.0',
  description: 'Location selection with address and coordinates',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Location Picker',
                    actions: [{ label: 'Select Location', event: 'START_SELECTION' }],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'SelectedLocation', title: 'Coordinates' }],
                ],
              },
              {
                from: 'idle',
                to: 'selecting',
                event: 'START_SELECTION',
                effects: [
                  ['fetch', 'SelectedLocation'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Select Location' }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'SelectedLocation' }],
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
                  ['render-ui', 'main', { type: 'detail-panel', title: 'Selected Location',
                    actions: [{ label: 'Confirm', event: 'CONFIRM' }],
                  }],
                ],
              },
              {
                from: 'selecting',
                to: 'confirmed',
                event: 'CONFIRM',
                effects: [
                  ['render-ui', 'main', { type: 'page-header', title: 'Location Confirmed' }],
                  ['render-ui', 'main', { type: 'detail-panel', title: 'Confirmed Location',
                    actions: [{ label: 'Clear', event: 'CLEAR_SELECTION' }],
                  }],
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Location Picker',
                    actions: [{ label: 'Select Location', event: 'START_SELECTION' }],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'SelectedLocation', title: 'Coordinates' }],
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

/**
 * std-route-planner - Route creation with waypoints.
 * States: browsing -> planning -> viewing
 */
export const ROUTE_PLANNER_BEHAVIOR: OrbitalSchema = {
  name: 'std-route-planner',
  version: '1.0.0',
  description: 'Route planning with ordered waypoints',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Routes',
                    actions: [{ label: 'New Route', event: 'NEW_ROUTE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Route Points', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'RoutePoint',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'planning',
                event: 'NEW_ROUTE',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Plan Route', 
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'RoutePoint' }],
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
                  ['render-ui', 'main', { type: 'stats', label: 'Route Points', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'RoutePoint',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                  ['render-ui', 'main', { type: 'timeline', entity: 'RoutePoint' }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'RoutePoint' }],
                ],
              },
              {
                from: 'planning',
                to: 'viewing',
                event: 'VIEW_ROUTE',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Route Overview',
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Route Points', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'RoutePoint',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                  ['render-ui', 'main', { type: 'timeline', entity: 'RoutePoint' }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Routes',
                    actions: [{ label: 'New Route', event: 'NEW_ROUTE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Route Points', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'RoutePoint',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'planning',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'RoutePoint'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Routes',
                    actions: [{ label: 'New Route', event: 'NEW_ROUTE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Route Points', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'RoutePoint',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions
              { from: 'browsing', to: 'browsing', event: 'VIEW', effects: [['fetch', 'RoutePoint'], ['render-ui', 'main', { type: 'entity-list', entity: 'RoutePoint', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'planning', to: 'planning', event: 'VIEW', effects: [['fetch', 'RoutePoint'], ['render-ui', 'main', { type: 'entity-list', entity: 'RoutePoint', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'viewing', to: 'viewing', event: 'VIEW', effects: [['fetch', 'RoutePoint'], ['render-ui', 'main', { type: 'entity-list', entity: 'RoutePoint', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
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
