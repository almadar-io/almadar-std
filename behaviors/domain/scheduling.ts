/**
 * Scheduling Domain Behaviors
 *
 * Standard behaviors for scheduling operations: calendars, bookings,
 * availability management, and reminders.
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

// ── Shared Scheduling Theme ────────────────────────────────────────

const SCHEDULING_THEME = {
  name: 'scheduling-violet',
  tokens: {
    colors: {
      primary: '#7c3aed',
      'primary-hover': '#6d28d9',
      'primary-foreground': '#ffffff',
      accent: '#a78bfa',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-calendar - Calendar View
// ============================================================================

// ── Reusable main-view effects (calendar browsing) ─────────────────

const calendarBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header row: calendar icon + title + create button
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'calendar', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Calendar' },
    ]},
    { type: 'button', label: 'New Event', icon: 'calendar-plus', variant: 'primary', action: 'CREATE' },
  ]},
  { type: 'divider' },
  // Stats row
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total Events', icon: 'calendar', value: '@entity.id' },
    { type: 'stats', label: 'All Day', icon: 'clock', value: '@entity.isAllDay' },
  ]},
  { type: 'divider' },
  // Calendar grid view
  { type: 'calendar-grid', entity: 'CalendarEvent',
    dateField: 'startDate',
    titleField: 'title',
    itemActions: [
      { label: 'View', event: 'VIEW', icon: 'eye' },
    ],
  },
  // Search bar
  { type: 'search-input', placeholder: 'Search events...', icon: 'search', entity: 'CalendarEvent' },
  // Data list below calendar
  { type: 'data-list', entity: 'CalendarEvent', variant: 'card',
    fields: [
      { name: 'title', label: 'Event', icon: 'calendar-check', variant: 'h4' },
      { name: 'startDate', label: 'Start', icon: 'clock', variant: 'body' },
      { name: 'endDate', label: 'End', icon: 'clock', variant: 'caption' },
      { name: 'location', label: 'Location', icon: 'map-pin', variant: 'badge' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW', icon: 'eye' },
    ],
  },
]}];

/**
 * std-calendar - Calendar event management with CRUD operations.
 * Supports browsing, creating, viewing, and editing calendar events.
 */
export const CALENDAR_BEHAVIOR: BehaviorSchema = {
  name: "std-calendar",
  version: "1.0.0",
  description: "Calendar event management with CRUD operations",
  theme: {
    name: "scheduling-violet",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "CalendarOrbital",
      entity: {
        name: "CalendarEvent",
        persistence: "persistent",
        collection: "calendar_events",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "startDate",
            type: "string",
            default: "",
          },
          {
            name: "endDate",
            type: "string",
            default: "",
          },
          {
            name: "location",
            type: "string",
            default: "",
          },
          {
            name: "isAllDay",
            type: "boolean",
            default: false,
          },
        ],
      },
      traits: [
        {
          name: "CalendarManager",
          linkedEntity: "CalendarEvent",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
              },
              {
                name: "viewing",
              },
              {
                name: "editing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "CREATE",
                name: "Create Event",
              },
              {
                key: "SUBMIT",
                name: "Submit Event",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "startDate",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "endDate",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "location",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "isAllDay",
                    type: "boolean",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW",
                name: "View Event",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "EDIT",
                name: "Edit Event",
              },
              {
                key: "UPDATE",
                name: "Update Event",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "startDate",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "endDate",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "location",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "isAllDay",
                    type: "boolean",
                    required: true,
                  },
                ],
              },
              {
                key: "QUICK_CREATE",
                name: "Quick Create Event",
              },
              {
                key: "NEXT_WEEK",
                name: "Next Week",
              },
              {
                key: "PREV_WEEK",
                name: "Previous Week",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "CalendarEvent"],
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
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  icon: "chevron-left",
                                  variant: "ghost",
                                  size: "sm",
                                  event: "INIT",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "March 2026",
                                },
                                {
                                  type: "button",
                                  icon: "chevron-right",
                                  variant: "ghost",
                                  size: "sm",
                                  event: "INIT",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "tabs",
                                  items: [
                                    {
                                      id: "month",
                                      label: "Month",
                                    },
                                    {
                                      id: "week",
                                      label: "Week",
                                    },
                                    {
                                      id: "day",
                                      label: "Day",
                                    },
                                  ],
                                  defaultActiveTab: "month",
                                  variant: "pills",
                                },
                                {
                                  type: "button",
                                  label: "New Event",
                                  icon: "calendar-plus",
                                  variant: "primary",
                                  event: "CREATE",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "calendar-grid",
                          entity: "CalendarEvent",
                          longPressEvent: "QUICK_CREATE",
                          swipeLeftEvent: "NEXT_WEEK",
                          swipeRightEvent: "PREV_WEEK",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Upcoming Events",
                        },
                        {
                          type: "data-list",
                          entity: "CalendarEvent",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
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
                                      name: "calendar",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.startDate",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.location",
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
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "CalendarEvent"],
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
                              name: "calendar-plus",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Event",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "CalendarEvent",
                          title: "Event Details",
                          submitEvent: "SUBMIT",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "startDate",
                              type: "string",
                            },
                            {
                              name: "endDate",
                              type: "string",
                            },
                            {
                              name: "location",
                              type: "string",
                            },
                            {
                              name: "isAllDay",
                              type: "boolean",
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
                event: "SUBMIT",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.startDate", "@payload.startDate"],
                  ["set", "@entity.endDate", "@payload.endDate"],
                  ["set", "@entity.location", "@payload.location"],
                  ["set", "@entity.isAllDay", "@payload.isAllDay"],
                  ["render-ui", "modal", null],
                  ["fetch", "CalendarEvent"],
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
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  icon: "chevron-left",
                                  variant: "ghost",
                                  size: "sm",
                                  event: "INIT",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "March 2026",
                                },
                                {
                                  type: "button",
                                  icon: "chevron-right",
                                  variant: "ghost",
                                  size: "sm",
                                  event: "INIT",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "tabs",
                                  items: [
                                    {
                                      id: "month",
                                      label: "Month",
                                    },
                                    {
                                      id: "week",
                                      label: "Week",
                                    },
                                    {
                                      id: "day",
                                      label: "Day",
                                    },
                                  ],
                                  defaultActiveTab: "month",
                                  variant: "pills",
                                },
                                {
                                  type: "button",
                                  label: "New Event",
                                  icon: "calendar-plus",
                                  variant: "primary",
                                  event: "CREATE",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "calendar-grid",
                          entity: "CalendarEvent",
                          longPressEvent: "QUICK_CREATE",
                          swipeLeftEvent: "NEXT_WEEK",
                          swipeRightEvent: "PREV_WEEK",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Upcoming Events",
                        },
                        {
                          type: "data-list",
                          entity: "CalendarEvent",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
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
                                      name: "calendar",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.startDate",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.location",
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
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
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
                              name: "calendar-check",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.title",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "clock",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.startDate",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "to",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.endDate",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "map-pin",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.location",
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
                          gap: "sm",
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Edit",
                              icon: "edit",
                              variant: "secondary",
                              event: "EDIT",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
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
                to: "editing",
                event: "EDIT",
                effects: [
                  ["fetch", "CalendarEvent"],
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
                              name: "edit",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Edit Event",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "CalendarEvent",
                          title: "Update Details",
                          submitEvent: "UPDATE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "startDate",
                              type: "string",
                            },
                            {
                              name: "endDate",
                              type: "string",
                            },
                            {
                              name: "location",
                              type: "string",
                            },
                            {
                              name: "isAllDay",
                              type: "boolean",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "UPDATE",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.startDate", "@payload.startDate"],
                  ["set", "@entity.endDate", "@payload.endDate"],
                  ["set", "@entity.location", "@payload.location"],
                  ["set", "@entity.isAllDay", "@payload.isAllDay"],
                  ["render-ui", "modal", null],
                  ["fetch", "CalendarEvent"],
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
                          align: "center",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  icon: "chevron-left",
                                  variant: "ghost",
                                  size: "sm",
                                  event: "INIT",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "March 2026",
                                },
                                {
                                  type: "button",
                                  icon: "chevron-right",
                                  variant: "ghost",
                                  size: "sm",
                                  event: "INIT",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "tabs",
                                  items: [
                                    {
                                      id: "month",
                                      label: "Month",
                                    },
                                    {
                                      id: "week",
                                      label: "Week",
                                    },
                                    {
                                      id: "day",
                                      label: "Day",
                                    },
                                  ],
                                  defaultActiveTab: "month",
                                  variant: "pills",
                                },
                                {
                                  type: "button",
                                  label: "New Event",
                                  icon: "calendar-plus",
                                  variant: "primary",
                                  event: "CREATE",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "calendar-grid",
                          entity: "CalendarEvent",
                          longPressEvent: "QUICK_CREATE",
                          swipeLeftEvent: "NEXT_WEEK",
                          swipeRightEvent: "PREV_WEEK",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Upcoming Events",
                        },
                        {
                          type: "data-list",
                          entity: "CalendarEvent",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
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
                                      name: "calendar",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.startDate",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.location",
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
                from: "editing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "QUICK_CREATE",
                effects: [
                  ["fetch", "CalendarEvent"],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "NEXT_WEEK",
                effects: [
                  ["fetch", "CalendarEvent"],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "PREV_WEEK",
                effects: [
                  ["fetch", "CalendarEvent"],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "CalendarPage",
          path: "/calendar",
          isInitial: true,
          traits: [
            {
              ref: "CalendarManager",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-booking - Booking System
// ============================================================================

// ── Reusable main-view effects (booking browsing) ──────────────────

const bookingBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: users icon + title + new booking button
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'users', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Bookings' },
    ]},
    { type: 'button', label: 'New Booking', icon: 'calendar-plus', variant: 'primary', action: 'SELECT' },
  ]},
  { type: 'divider' },
  // Stats row: total bookings + status breakdown
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total Bookings', icon: 'calendar', value: '@entity.id' },
    { type: 'stats', label: 'Status', icon: 'check-circle', value: '@entity.status' },
  ]},
  { type: 'divider' },
  // Search
  { type: 'search-input', placeholder: 'Search bookings...', icon: 'search', entity: 'Booking' },
  // Data grid with booking details
  { type: 'data-grid', entity: 'Booking',
    columns: [
      { name: 'service', label: 'Service', icon: 'briefcase' },
      { name: 'clientName', label: 'Client', icon: 'user' },
      { name: 'date', label: 'Date', icon: 'calendar' },
      { name: 'time', label: 'Time', icon: 'clock' },
      { name: 'status', label: 'Status', icon: 'activity', variant: 'badge' },
    ],
    itemActions: [
      { label: 'Select', event: 'SELECT', icon: 'arrow-right' },
    ],
  },
  // Timeline of upcoming bookings
  { type: 'line-chart', entity: 'Booking', label: 'Booking Trend', icon: 'trending-up',
    xField: 'date', yField: 'id',
  },
]}];

/**
 * std-booking - Booking system with service selection and confirmation flow.
 * Supports browsing, selecting, confirming, and viewing confirmed bookings.
 */
export const BOOKING_BEHAVIOR: BehaviorSchema = {
  name: "std-booking",
  version: "1.0.0",
  description: "Booking system with service selection and confirmation",
  theme: {
    name: "scheduling-violet",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "BookingOrbital",
      entity: {
        name: "Booking",
        persistence: "persistent",
        collection: "bookings",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "service",
            type: "string",
            default: "",
          },
          {
            name: "date",
            type: "string",
            default: "",
          },
          {
            name: "time",
            type: "string",
            default: "",
          },
          {
            name: "clientName",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "pending",
          },
        ],
      },
      traits: [
        {
          name: "BookingFlow",
          linkedEntity: "Booking",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "selecting",
              },
              {
                name: "confirming",
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
                key: "SELECT",
                name: "Select Booking",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "FILL_DETAILS",
                name: "Fill Details",
                payloadSchema: [
                  {
                    name: "service",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "date",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "time",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "clientName",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CONFIRM",
                name: "Confirm Booking",
              },
              {
                key: "SELECT_SLOT",
                name: "Select Time Slot",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "BACK",
                name: "Go Back",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Booking"],
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
                                  name: "calendar",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Book Appointment",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Booking",
                              icon: "calendar-plus",
                              variant: "primary",
                              event: "SELECT",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Booking",
                          columns: [
                            {
                              name: "service",
                              label: "Service",
                            },
                            {
                              name: "clientName",
                              label: "Client",
                            },
                            {
                              name: "date",
                              label: "Date",
                            },
                            {
                              name: "time",
                              label: "Time",
                            },
                            {
                              name: "status",
                              label: "Status",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "SELECT",
                              icon: "arrow-right",
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
                to: "selecting",
                event: "SELECT",
                effects: [
                  ["fetch", "Booking"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "typography",
                          variant: "h3",
                          content: "Book Appointment",
                        },
                        {
                          type: "wizard-progress",
                          steps: [
                            {
                              title: "Details",
                            },
                            {
                              title: "Confirm",
                            },
                          ],
                          currentStep: 0,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "calendar-grid",
                          longPressEvent: "SELECT_SLOT",
                        },
                        {
                          type: "form-section",
                          entity: "Booking",
                          title: "Service Details",
                          submitEvent: "FILL_DETAILS",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "service",
                              type: "string",
                            },
                            {
                              name: "date",
                              type: "string",
                            },
                            {
                              name: "time",
                              type: "string",
                            },
                            {
                              name: "clientName",
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
                from: "selecting",
                to: "confirming",
                event: "FILL_DETAILS",
                effects: [
                  ["set", "@entity.service", "@payload.service"],
                  ["set", "@entity.date", "@payload.date"],
                  ["set", "@entity.time", "@payload.time"],
                  ["set", "@entity.clientName", "@payload.clientName"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "typography",
                          variant: "h3",
                          content: "Book Appointment",
                        },
                        {
                          type: "wizard-progress",
                          steps: [
                            {
                              title: "Details",
                            },
                            {
                              title: "Confirm",
                            },
                          ],
                          currentStep: 1,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Booking Summary",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "stat-display",
                                      label: "Service",
                                      value: "@entity.service",
                                    },
                                    {
                                      type: "stat-display",
                                      label: "Client",
                                      value: "@entity.clientName",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "stat-display",
                                      label: "Date",
                                      value: "@entity.date",
                                    },
                                    {
                                      type: "stat-display",
                                      label: "Time",
                                      value: "@entity.time",
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
                          gap: "sm",
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Back",
                              icon: "arrow-left",
                              variant: "ghost",
                              event: "BACK",
                            },
                            {
                              type: "button",
                              label: "Confirm Booking",
                              icon: "check",
                              variant: "primary",
                              event: "CONFIRM",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "confirming",
                to: "confirmed",
                event: "CONFIRM",
                effects: [
                  ["set", "@entity.status", "confirmed"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      align: "center",
                      children: [
                        {
                          type: "icon",
                          name: "check-circle",
                          size: "xl",
                        },
                        {
                          type: "typography",
                          variant: "h3",
                          content: "Booking Confirmed",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Your appointment has been scheduled.",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Appointment Details",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "briefcase",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.service",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "calendar",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.date",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "clock",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.time",
                                    },
                                  ],
                                },
                                {
                                  type: "badge",
                                  label: "Confirmed",
                                  variant: "success",
                                  icon: "check",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
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
                ],
              },
              {
                from: "confirming",
                to: "selecting",
                event: "BACK",
                effects: [
                  ["fetch", "Booking"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "typography",
                          variant: "h3",
                          content: "Book Appointment",
                        },
                        {
                          type: "wizard-progress",
                          steps: [
                            {
                              title: "Details",
                            },
                            {
                              title: "Confirm",
                            },
                          ],
                          currentStep: 0,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "calendar-grid",
                          longPressEvent: "SELECT_SLOT",
                        },
                        {
                          type: "form-section",
                          entity: "Booking",
                          title: "Service Details",
                          submitEvent: "FILL_DETAILS",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "service",
                              type: "string",
                            },
                            {
                              name: "date",
                              type: "string",
                            },
                            {
                              name: "time",
                              type: "string",
                            },
                            {
                              name: "clientName",
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
                from: "selecting",
                to: "selecting",
                event: "SELECT_SLOT",
                effects: [
                  ["fetch", "Booking"],
                ],
              },
              {
                from: "selecting",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "confirming",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "confirmed",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "Booking"],
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
                                  name: "calendar",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Book Appointment",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Booking",
                              icon: "calendar-plus",
                              variant: "primary",
                              event: "SELECT",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Booking",
                          columns: [
                            {
                              name: "service",
                              label: "Service",
                            },
                            {
                              name: "clientName",
                              label: "Client",
                            },
                            {
                              name: "date",
                              label: "Date",
                            },
                            {
                              name: "time",
                              label: "Time",
                            },
                            {
                              name: "status",
                              label: "Status",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "SELECT",
                              icon: "arrow-right",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "confirmed",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "Booking"],
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
                                  name: "calendar",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Book Appointment",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Booking",
                              icon: "calendar-plus",
                              variant: "primary",
                              event: "SELECT",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Booking",
                          columns: [
                            {
                              name: "service",
                              label: "Service",
                            },
                            {
                              name: "clientName",
                              label: "Client",
                            },
                            {
                              name: "date",
                              label: "Date",
                            },
                            {
                              name: "time",
                              label: "Time",
                            },
                            {
                              name: "status",
                              label: "Status",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "SELECT",
                              icon: "arrow-right",
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
          name: "BookingsPage",
          path: "/bookings",
          isInitial: true,
          traits: [
            {
              ref: "BookingFlow",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-availability - Availability Management
// ============================================================================

// ── Reusable main-view effects (availability browsing) ─────────────

const availabilityBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: clock icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'clock', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Availability' },
    ]},
  ]},
  { type: 'divider' },
  // Stats: available vs total slots
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total Slots', icon: 'timer', value: '@entity.id' },
    { type: 'stats', label: 'Available', icon: 'check-circle', value: '@entity.isAvailable' },
  ]},
  // Availability progress
  { type: 'progress-bar', label: 'Availability Rate', icon: 'activity', value: 80, max: 100 },
  { type: 'divider' },
  // Weekly grid of time slots
  { type: 'data-grid', entity: 'TimeSlot',
    columns: [
      { name: 'dayOfWeek', label: 'Day', icon: 'calendar' },
      { name: 'startTime', label: 'Start', icon: 'clock' },
      { name: 'endTime', label: 'End', icon: 'clock' },
      { name: 'isAvailable', label: 'Available', icon: 'check-circle', variant: 'badge' },
    ],
    itemActions: [
      { label: 'Edit', event: 'EDIT', icon: 'edit' },
    ],
  },
]}];

/**
 * std-availability - Manage available time slots.
 * Supports browsing and editing time slot availability.
 */
export const AVAILABILITY_BEHAVIOR: BehaviorSchema = {
  name: "std-availability",
  version: "1.0.0",
  description: "Availability time slot management",
  theme: {
    name: "scheduling-violet",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "AvailabilityOrbital",
      entity: {
        name: "TimeSlot",
        persistence: "persistent",
        collection: "time_slots",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "dayOfWeek",
            type: "string",
            default: "",
          },
          {
            name: "startTime",
            type: "string",
            default: "",
          },
          {
            name: "endTime",
            type: "string",
            default: "",
          },
          {
            name: "isAvailable",
            type: "boolean",
            default: true,
          },
        ],
      },
      traits: [
        {
          name: "AvailabilityManager",
          linkedEntity: "TimeSlot",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "editing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "EDIT",
                name: "Edit Slot",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "UPDATE",
                name: "Update Slot",
                payloadSchema: [
                  {
                    name: "dayOfWeek",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "startTime",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "endTime",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "isAvailable",
                    type: "boolean",
                    required: true,
                  },
                ],
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "TimeSlot"],
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
                                  name: "clock",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Availability",
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
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Slots",
                              icon: "timer",
                              value: "@entity.id",
                            },
                            {
                              type: "stat-display",
                              label: "Available",
                              icon: "check-circle",
                              value: "@entity.isAvailable",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          label: "Availability Rate",
                          icon: "activity",
                          value: 80,
                          max: 100,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "TimeSlot",
                          columns: [
                            {
                              name: "dayOfWeek",
                              label: "Day",
                              icon: "calendar",
                            },
                            {
                              name: "startTime",
                              label: "Start",
                              icon: "clock",
                            },
                            {
                              name: "endTime",
                              label: "End",
                              icon: "clock",
                            },
                            {
                              name: "isAvailable",
                              label: "Available",
                              icon: "check-circle",
                              variant: "badge",
                            },
                          ],
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "clock",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "editing",
                event: "EDIT",
                effects: [
                  ["fetch", "TimeSlot"],
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
                              name: "edit",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Edit Time Slot",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "@entity.dayOfWeek",
                              variant: "default",
                              icon: "calendar",
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.startTime",
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "-",
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.endTime",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "TimeSlot",
                          title: "Slot Details",
                          submitEvent: "UPDATE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "dayOfWeek",
                              type: "string",
                            },
                            {
                              name: "startTime",
                              type: "string",
                            },
                            {
                              name: "endTime",
                              type: "string",
                            },
                            {
                              name: "isAvailable",
                              type: "boolean",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "UPDATE",
                effects: [
                  ["set", "@entity.dayOfWeek", "@payload.dayOfWeek"],
                  ["set", "@entity.startTime", "@payload.startTime"],
                  ["set", "@entity.endTime", "@payload.endTime"],
                  ["set", "@entity.isAvailable", "@payload.isAvailable"],
                  ["render-ui", "modal", null],
                  ["fetch", "TimeSlot"],
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
                                  name: "clock",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Availability",
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
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Slots",
                              icon: "timer",
                              value: "@entity.id",
                            },
                            {
                              type: "stat-display",
                              label: "Available",
                              icon: "check-circle",
                              value: "@entity.isAvailable",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          label: "Availability Rate",
                          icon: "activity",
                          value: 80,
                          max: 100,
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "TimeSlot",
                          columns: [
                            {
                              name: "dayOfWeek",
                              label: "Day",
                              icon: "calendar",
                            },
                            {
                              name: "startTime",
                              label: "Start",
                              icon: "clock",
                            },
                            {
                              name: "endTime",
                              label: "End",
                              icon: "clock",
                            },
                            {
                              name: "isAvailable",
                              label: "Available",
                              icon: "check-circle",
                              variant: "badge",
                            },
                          ],
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "clock",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CLOSE",
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
          name: "AvailabilityPage",
          path: "/availability",
          isInitial: true,
          traits: [
            {
              ref: "AvailabilityManager",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-reminder - Reminder System
// ============================================================================

// ── Reusable main-view effects (reminder browsing) ─────────────────

const reminderBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: bell icon + title + create button
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'repeat', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Reminders' },
    ]},
    { type: 'button', label: 'New Reminder', icon: 'calendar-plus', variant: 'primary', action: 'CREATE' },
  ]},
  { type: 'divider' },
  // Stats: total + completed + by priority
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total', icon: 'list', value: '@entity.id' },
    { type: 'stats', label: 'Completed', icon: 'check-circle', value: '@entity.isCompleted' },
    { type: 'stats', label: 'Priority', icon: 'alert-triangle', value: '@entity.priority' },
  ]},
  { type: 'divider' },
  // Search
  { type: 'search-input', placeholder: 'Search reminders...', icon: 'search', entity: 'Reminder' },
  // Reminder data list
  { type: 'data-list', entity: 'Reminder', variant: 'card',
    fields: [
      { name: 'title', label: 'Reminder', icon: 'repeat', variant: 'h4' },
      { name: 'dueDate', label: 'Due', icon: 'calendar', variant: 'body' },
      { name: 'priority', label: 'Priority', icon: 'alert-triangle', variant: 'badge' },
      { name: 'isCompleted', label: 'Done', icon: 'check-circle', variant: 'badge' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW', icon: 'eye' },
    ],
  },
  // Timeline chart
  { type: 'line-chart', entity: 'Reminder', label: 'Due Date Timeline', icon: 'trending-up',
    xField: 'dueDate', yField: 'id',
  },
]}];

/**
 * std-reminder - Simple reminder system with CRUD operations.
 * Supports browsing, creating, and viewing reminders.
 */
export const REMINDER_BEHAVIOR: BehaviorSchema = {
  name: "std-reminder",
  version: "1.0.0",
  description: "Reminder system with priority tracking",
  theme: {
    name: "scheduling-violet",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ReminderOrbital",
      entity: {
        name: "Reminder",
        persistence: "persistent",
        collection: "reminders",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "dueDate",
            type: "string",
            default: "",
          },
          {
            name: "priority",
            type: "string",
            default: "medium",
          },
          {
            name: "isCompleted",
            type: "boolean",
            default: false,
          },
        ],
      },
      traits: [
        {
          name: "ReminderManager",
          linkedEntity: "Reminder",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
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
                key: "CREATE",
                name: "Create Reminder",
              },
              {
                key: "SUBMIT",
                name: "Submit Reminder",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "dueDate",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "priority",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW",
                name: "View Reminder",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "COMPLETE",
                name: "Complete Reminder",
              },
              {
                key: "DELETE",
                name: "Delete Reminder",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Reminder"],
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
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Reminders",
                            },
                            {
                              type: "button",
                              label: "Add Reminder",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Add a reminder...",
                          entity: "Reminder",
                        },
                        {
                          type: "data-list",
                          entity: "Reminder",
                          variant: "card",
                          groupBy: "priority",
                          swipeLeftEvent: "DELETE",
                          swipeRightEvent: "COMPLETE",
                          itemActions: [
                            {
                              label: "Complete",
                              event: "COMPLETE",
                              icon: "check",
                            },
                            {
                              label: "Edit",
                              event: "VIEW",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "bell",
                          emptyTitle: "No reminders",
                          emptyDescription: "Your reminders will appear here. Tap Add Reminder to get started.",
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
                                      name: "alarm-clock",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dueDate",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.priority",
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
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "Reminder"],
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
                              name: "calendar-plus",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Reminder",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "Reminder",
                          title: "Reminder Details",
                          submitEvent: "SUBMIT",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "dueDate",
                              type: "string",
                            },
                            {
                              name: "priority",
                              type: "string",
                            },
                            {
                              name: "isCompleted",
                              type: "boolean",
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
                event: "SUBMIT",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.dueDate", "@payload.dueDate"],
                  ["set", "@entity.priority", "@payload.priority"],
                  ["render-ui", "modal", null],
                  ["fetch", "Reminder"],
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
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Reminders",
                            },
                            {
                              type: "button",
                              label: "Add Reminder",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Add a reminder...",
                          entity: "Reminder",
                        },
                        {
                          type: "data-list",
                          entity: "Reminder",
                          variant: "card",
                          groupBy: "priority",
                          swipeLeftEvent: "DELETE",
                          swipeRightEvent: "COMPLETE",
                          itemActions: [
                            {
                              label: "Complete",
                              event: "COMPLETE",
                              icon: "check",
                            },
                            {
                              label: "Edit",
                              event: "VIEW",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "bell",
                          emptyTitle: "No reminders",
                          emptyDescription: "Your reminders will appear here. Tap Add Reminder to get started.",
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
                                      name: "alarm-clock",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dueDate",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.priority",
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
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "typography",
                          variant: "h3",
                          content: "@entity.title",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.dueDate",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "flag",
                                  size: "sm",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.priority",
                                  variant: "warning",
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
                          gap: "sm",
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Complete",
                              icon: "check",
                              variant: "primary",
                              event: "COMPLETE",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
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
                event: "COMPLETE",
                effects: [
                  ["set", "@entity.isCompleted", true],
                  ["render-ui", "modal", null],
                  ["fetch", "Reminder"],
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
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Reminders",
                            },
                            {
                              type: "button",
                              label: "Add Reminder",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Add a reminder...",
                          entity: "Reminder",
                        },
                        {
                          type: "data-list",
                          entity: "Reminder",
                          variant: "card",
                          groupBy: "priority",
                          swipeLeftEvent: "DELETE",
                          swipeRightEvent: "COMPLETE",
                          itemActions: [
                            {
                              label: "Complete",
                              event: "COMPLETE",
                              icon: "check",
                            },
                            {
                              label: "Edit",
                              event: "VIEW",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "bell",
                          emptyTitle: "No reminders",
                          emptyDescription: "Your reminders will appear here. Tap Add Reminder to get started.",
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
                                      name: "alarm-clock",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dueDate",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.priority",
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
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "DELETE",
                effects: [
                  ["fetch", "Reminder"],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "COMPLETE",
                effects: [
                  ["set", "@entity.isCompleted", true],
                  ["fetch", "Reminder"],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "RemindersPage",
          path: "/reminders",
          isInitial: true,
          traits: [
            {
              ref: "ReminderManager",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Scheduling Behaviors
// ============================================================================

export const SCHEDULING_BEHAVIORS: BehaviorSchema[] = [
  CALENDAR_BEHAVIOR,
  BOOKING_BEHAVIOR,
  AVAILABILITY_BEHAVIOR,
  REMINDER_BEHAVIOR,
];
