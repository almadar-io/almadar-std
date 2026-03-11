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

import type { BehaviorSchema } from '../types.js';

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
    // Interactive map
    { type: 'map-view', height: '400px', centerLat: 51.505, centerLng: -0.09, zoom: 13 },
    { type: 'divider' },
    // Selected marker coordinates
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Latitude', value: '@entity.latitude', icon: 'navigation' },
      { type: 'stats', label: 'Longitude', value: '@entity.longitude', icon: 'compass' },
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
export const MAP_VIEW_BEHAVIOR: BehaviorSchema = {
  name: "std-map-view",
  version: "1.0.0",
  description: "Map display with markers and creation",
  theme: {
    name: "geospatial-cyan",
    tokens: {
      colors: {
        primary: "#0891b2",
        "primary-hover": "#0e7490",
        "primary-foreground": "#ffffff",
        accent: "#06b6d4",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "MapViewOrbital",
      entity: {
        name: "MapMarker",
        persistence: "persistent",
        collection: "map_markers",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "latitude",
            type: "number",
            default: 0,
          },
          {
            name: "longitude",
            type: "number",
            default: 0,
          },
          {
            name: "category",
            type: "string",
            default: "default",
          },
        ],
      },
      traits: [
        {
          name: "MapViewControl",
          linkedEntity: "MapMarker",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "viewing",
              },
              {
                name: "creating",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SELECT_MARKER",
                name: "Select Marker",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CREATE",
                name: "Create Marker",
              },
              {
                key: "SAVE",
                name: "Save Marker",
                payloadSchema: [
                  {
                    name: "name",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "latitude",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "longitude",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "MapMarker"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "search-input",
                              placeholder: "Search places...",
                            },
                            {
                              type: "button",
                              label: "Layers",
                              icon: "layers",
                              variant: "secondary",
                            },
                            {
                              type: "button",
                              label: "Add Marker",
                              icon: "map-pin",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          entity: "MapMarker",
                          markerClickEvent: "SELECT_MARKER",
                        },
                        {
                          type: "card",
                          title: "Marker Details",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "Click a marker to view details",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "SELECT_MARKER",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "search-input",
                              placeholder: "Search places...",
                            },
                            {
                              type: "button",
                              label: "Layers",
                              icon: "layers",
                              variant: "secondary",
                            },
                            {
                              type: "button",
                              label: "Add Marker",
                              icon: "map-pin",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          entity: "MapMarker",
                          markerClickEvent: "SELECT_MARKER",
                        },
                        {
                          type: "card",
                          title: "@entity.name",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "badge",
                                      label: "@entity.category",
                                    },
                                  ],
                                },
                                {
                                  type: "data-list",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "map",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.latitude",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.longitude",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.category",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  type: "divider",
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "end",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "button",
                                      label: "Close",
                                      icon: "x",
                                      variant: "secondary",
                                      event: "CLOSE",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "search-input",
                              placeholder: "Search places...",
                            },
                            {
                              type: "button",
                              label: "Layers",
                              icon: "layers",
                              variant: "secondary",
                            },
                            {
                              type: "button",
                              label: "Add Marker",
                              icon: "map-pin",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          entity: "MapMarker",
                          markerClickEvent: "SELECT_MARKER",
                        },
                        {
                          type: "card",
                          title: "Marker Details",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "Click a marker to view details",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "search-input",
                              placeholder: "Search places...",
                            },
                            {
                              type: "button",
                              label: "Layers",
                              icon: "layers",
                              variant: "secondary",
                            },
                            {
                              type: "button",
                              label: "Add Marker",
                              icon: "map-pin",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          entity: "MapMarker",
                          markerClickEvent: "SELECT_MARKER",
                        },
                        {
                          type: "card",
                          title: "Marker Details",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "Click a marker to view details",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "MapMarker"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "map-pin",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Marker",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "MapMarker",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "latitude",
                              type: "number",
                            },
                            {
                              name: "longitude",
                              type: "number",
                            },
                            {
                              name: "category",
                              type: "string",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.name", "@payload.name"],
                  ["set", "@entity.latitude", "@payload.latitude"],
                  ["set", "@entity.longitude", "@payload.longitude"],
                  ["render-ui", "modal", null],
                  ["fetch", "MapMarker"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "search-input",
                              placeholder: "Search places...",
                            },
                            {
                              type: "button",
                              label: "Layers",
                              icon: "layers",
                              variant: "secondary",
                            },
                            {
                              type: "button",
                              label: "Add Marker",
                              icon: "map-pin",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          entity: "MapMarker",
                          markerClickEvent: "SELECT_MARKER",
                        },
                        {
                          type: "card",
                          title: "Marker Details",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "Click a marker to view details",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "MapPage",
          path: "/map",
          isInitial: true,
          traits: [
            {
              ref: "MapViewControl",
            },
          ],
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
        { type: 'icon', name: 'map-pin', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Location Picker' },
      ]},
      { type: 'button', label: 'Select Location', icon: 'target', variant: 'primary', action: 'START_SELECTION' },
    ]},
    { type: 'divider' },
    // Static map preview (no interaction in idle)
    { type: 'map-view', height: '300px', centerLat: 51.505, centerLng: -0.09, zoom: 10 },
    { type: 'divider' },
    // Empty state hint
    { type: 'typography', variant: 'body', content: 'No location selected. Tap the button above to pick a point on the map.' },
  ]},
] as const;

/**
 * std-location-picker - Location selection via interactive map.
 *
 * UX: User clicks "Select Location", an interactive map appears.
 * Clicking the map drops a pin and captures the coordinates.
 * User reviews the picked location, then confirms or retries.
 *
 * States: idle -> selecting -> picked -> confirmed
 */
export const LOCATION_PICKER_BEHAVIOR: BehaviorSchema = {
  name: "std-location-picker",
  version: "2.0.0",
  description: "Location selection via interactive map click",
  theme: {
    name: "geospatial-cyan",
    tokens: {
      colors: {
        primary: "#0891b2",
        "primary-hover": "#0e7490",
        "primary-foreground": "#ffffff",
        accent: "#06b6d4",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "LocationPickerOrbital",
      entity: {
        name: "SelectedLocation",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "latitude",
            type: "number",
            default: 0,
          },
          {
            name: "longitude",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "LocationPickerControl",
          linkedEntity: "SelectedLocation",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "idle",
                isInitial: true,
              },
              {
                name: "selecting",
              },
              {
                name: "picked",
              },
              {
                name: "confirmed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START_SELECTION",
                name: "Start Selection",
              },
              {
                key: "PICK_LOCATION",
                name: "Pick Location",
                payloadSchema: [
                  {
                    name: "latitude",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "longitude",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "CANCEL",
                name: "Cancel Selection",
              },
              {
                key: "CONFIRM",
                name: "Confirm Location",
              },
              {
                key: "CLEAR_SELECTION",
                name: "Clear Selection",
              },
            ],
            transitions: [
              {
                from: "idle",
                to: "idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.latitude", 0],
                  ["set", "@entity.longitude", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Location Picker",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Select Location",
                              icon: "target",
                              variant: "primary",
                              event: "START_SELECTION",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 10,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "No location selected. Tap the button above to pick a point on the map.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "idle",
                to: "selecting",
                event: "START_SELECTION",
                effects: [
                  ["fetch", "SelectedLocation"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "target",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Click the Map",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Cancel",
                              icon: "x",
                              variant: "secondary",
                              event: "CANCEL",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Click anywhere on the map to drop a pin and select that location.",
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          mapClickEvent: "PICK_LOCATION",
                          showClickedPin: true,
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "selecting",
                to: "idle",
                event: "CANCEL",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Location Picker",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Select Location",
                              icon: "target",
                              variant: "primary",
                              event: "START_SELECTION",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 10,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "No location selected. Tap the button above to pick a point on the map.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "selecting",
                to: "picked",
                event: "PICK_LOCATION",
                effects: [
                  ["set", "@entity.latitude", "@payload.latitude"],
                  ["set", "@entity.longitude", "@payload.longitude"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Review Location",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Try Again",
                                  icon: "rotate-ccw",
                                  variant: "secondary",
                                  event: "START_SELECTION",
                                },
                                {
                                  type: "button",
                                  label: "Confirm",
                                  icon: "check",
                                  variant: "primary",
                                  event: "CONFIRM",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "SelectedLocation",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "map-pin",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.latitude",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.longitude",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          emptyIcon: "map-pin",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 14,
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "picked",
                to: "selecting",
                event: "START_SELECTION",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "target",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Click the Map",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Cancel",
                              icon: "x",
                              variant: "secondary",
                              event: "CANCEL",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Click anywhere on the map to drop a pin and select that location.",
                        },
                        {
                          type: "map-view",
                          height: "400px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 13,
                          mapClickEvent: "PICK_LOCATION",
                          showClickedPin: true,
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "picked",
                to: "confirmed",
                event: "CONFIRM",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "check-circle",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Location Confirmed",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Clear",
                              icon: "x",
                              variant: "secondary",
                              event: "CLEAR_SELECTION",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Confirmed",
                          variant: "success",
                          icon: "check",
                        },
                        {
                          type: "data-list",
                          entity: "SelectedLocation",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "map-pin",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.latitude",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.longitude",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          emptyIcon: "check-circle",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "250px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 14,
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "confirmed",
                to: "idle",
                event: "CLEAR_SELECTION",
                effects: [
                  ["set", "@entity.latitude", 0],
                  ["set", "@entity.longitude", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Location Picker",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Select Location",
                              icon: "target",
                              variant: "primary",
                              event: "START_SELECTION",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 10,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "No location selected. Tap the button above to pick a point on the map.",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "LocationPage",
          path: "/location",
          isInitial: true,
          traits: [
            {
              ref: "LocationPickerControl",
            },
          ],
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
    // Route map overview
    { type: 'map-view', height: '300px', centerLat: 51.505, centerLng: -0.09, zoom: 11 },
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
export const ROUTE_PLANNER_BEHAVIOR: BehaviorSchema = {
  name: "std-route-planner",
  version: "1.0.0",
  description: "Route planning with ordered waypoints",
  theme: {
    name: "geospatial-cyan",
    tokens: {
      colors: {
        primary: "#0891b2",
        "primary-hover": "#0e7490",
        "primary-foreground": "#ffffff",
        accent: "#06b6d4",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "RoutePlannerOrbital",
      entity: {
        name: "RoutePoint",
        persistence: "persistent",
        collection: "route_points",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "latitude",
            type: "number",
            default: 0,
          },
          {
            name: "longitude",
            type: "number",
            default: 0,
          },
          {
            name: "order",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "RoutePlannerControl",
          linkedEntity: "RoutePoint",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "planning",
              },
              {
                name: "viewing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "NEW_ROUTE",
                name: "New Route",
              },
              {
                key: "ADD_POINT",
                name: "Add Point",
                payloadSchema: [
                  {
                    name: "name",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "latitude",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "longitude",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW_ROUTE",
                name: "View Route",
              },
              {
                key: "BACK",
                name: "Back to Routes",
              },
              {
                key: "VIEW",
                name: "View Point",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "navigation",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Routes",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Route",
                              icon: "compass",
                              variant: "primary",
                              event: "NEW_ROUTE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Route Points",
                              icon: "map-pin",
                              entity: "RoutePoint",
                            },
                            {
                              type: "stat-display",
                              label: "Distance",
                              icon: "navigation",
                              entity: "RoutePoint",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 11,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "navigation",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "planning",
                event: "NEW_ROUTE",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "compass",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Plan Route",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back",
                              icon: "arrow-left",
                              variant: "secondary",
                              event: "BACK",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "RoutePoint",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "latitude",
                              type: "number",
                            },
                            {
                              name: "longitude",
                              type: "number",
                            },
                            {
                              name: "order",
                              type: "number",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "planning",
                to: "planning",
                event: "ADD_POINT",
                effects: [
                  ["fetch", "RoutePoint"],
                  ["set", "@entity.name", "@payload.name"],
                  ["set", "@entity.latitude", "@payload.latitude"],
                  ["set", "@entity.longitude", "@payload.longitude"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "compass",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Plan Route",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "View Route",
                                  icon: "eye",
                                  variant: "primary",
                                  event: "VIEW_ROUTE",
                                },
                                {
                                  type: "button",
                                  label: "Back",
                                  icon: "arrow-left",
                                  variant: "secondary",
                                  event: "BACK",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Route Points",
                          icon: "map-pin",
                          entity: "RoutePoint",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "compass",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "RoutePoint",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "latitude",
                              type: "number",
                            },
                            {
                              name: "longitude",
                              type: "number",
                            },
                            {
                              name: "order",
                              type: "number",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "planning",
                to: "viewing",
                event: "VIEW_ROUTE",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "satellite",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Route Overview",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back",
                              icon: "arrow-left",
                              variant: "secondary",
                              event: "BACK",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Route Points",
                          icon: "map-pin",
                          entity: "RoutePoint",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "satellite",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 50,
                          max: 100,
                          label: "Route Progress",
                          icon: "navigation",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "BACK",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "navigation",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Routes",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Route",
                              icon: "compass",
                              variant: "primary",
                              event: "NEW_ROUTE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Route Points",
                              icon: "map-pin",
                              entity: "RoutePoint",
                            },
                            {
                              type: "stat-display",
                              label: "Distance",
                              icon: "navigation",
                              entity: "RoutePoint",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 11,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "navigation",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "planning",
                to: "browsing",
                event: "BACK",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "navigation",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Routes",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Route",
                              icon: "compass",
                              variant: "primary",
                              event: "NEW_ROUTE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Route Points",
                              icon: "map-pin",
                              entity: "RoutePoint",
                            },
                            {
                              type: "stat-display",
                              label: "Distance",
                              icon: "navigation",
                              entity: "RoutePoint",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "map-view",
                          height: "300px",
                          centerLat: 51.505,
                          centerLng: -0.09,
                          zoom: 11,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "navigation",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "VIEW",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "inbox",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "planning",
                to: "planning",
                event: "VIEW",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "inbox",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  ["fetch", "RoutePoint"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "data-list",
                          entity: "RoutePoint",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                            },
                          ],
                          emptyIcon: "inbox",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "navigation",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.latitude",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.order",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "RoutesPage",
          path: "/routes",
          isInitial: true,
          traits: [
            {
              ref: "RoutePlannerControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Geospatial Behaviors
// ============================================================================

export const GEOSPATIAL_BEHAVIORS: BehaviorSchema[] = [
  MAP_VIEW_BEHAVIOR,
  LOCATION_PICKER_BEHAVIOR,
  ROUTE_PLANNER_BEHAVIOR,
];
