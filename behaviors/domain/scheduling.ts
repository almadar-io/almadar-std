/**
 * Scheduling Domain Behaviors
 *
 * Standard behaviors for scheduling operations: calendars, bookings,
 * availability management, and reminders.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-calendar - Calendar View
// ============================================================================

/**
 * std-calendar - Calendar event management with CRUD operations.
 * Supports browsing, creating, viewing, and editing calendar events.
 */
export const CALENDAR_BEHAVIOR: OrbitalSchema = {
  name: 'std-calendar',
  version: '1.0.0',
  description: 'Calendar event management with CRUD operations',
  orbitals: [
    {
      name: 'CalendarOrbital',
      entity: {
        name: 'CalendarEvent',
        persistence: 'persistent',
        collection: 'calendar_events',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'startDate', type: 'string', default: '' },
          { name: 'endDate', type: 'string', default: '' },
          { name: 'location', type: 'string', default: '' },
          { name: 'isAllDay', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'CalendarManager',
          linkedEntity: 'CalendarEvent',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'Create Event' },
              { key: 'SUBMIT', name: 'Submit Event', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'startDate', type: 'string', required: true },
                { name: 'endDate', type: 'string', required: true },
                { name: 'location', type: 'string', required: true },
                { name: 'isAllDay', type: 'boolean', required: true },
              ] },
              { key: 'VIEW', name: 'View Event', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'EDIT', name: 'Edit Event' },
              { key: 'UPDATE', name: 'Update Event', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'startDate', type: 'string', required: true },
                { name: 'endDate', type: 'string', required: true },
                { name: 'location', type: 'string', required: true },
                { name: 'isAllDay', type: 'boolean', required: true },
              ] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'CalendarEvent'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Calendar', 
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'CalendarEvent',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'CalendarEvent'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'CalendarEvent',
                    title: 'New Event',
                    submitEvent: 'SUBMIT',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SUBMIT',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.startDate', '@payload.startDate'],
                  ['set', '@entity.endDate', '@payload.endDate'],
                  ['set', '@entity.location', '@payload.location'],
                  ['set', '@entity.isAllDay', '@payload.isAllDay'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'CalendarEvent'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'CalendarEvent',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
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
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.title',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'CalendarEvent'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'CalendarEvent',
                    title: 'Edit Event',
                    submitEvent: 'UPDATE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'UPDATE',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.startDate', '@payload.startDate'],
                  ['set', '@entity.endDate', '@payload.endDate'],
                  ['set', '@entity.location', '@payload.location'],
                  ['set', '@entity.isAllDay', '@payload.isAllDay'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'CalendarEvent'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'CalendarEvent',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
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
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CalendarPage',
          path: '/calendar',
          isInitial: true,
          traits: [{ ref: 'CalendarManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-booking - Booking System
// ============================================================================

/**
 * std-booking - Booking system with service selection and confirmation flow.
 * Supports browsing, selecting, confirming, and viewing confirmed bookings.
 */
export const BOOKING_BEHAVIOR: OrbitalSchema = {
  name: 'std-booking',
  version: '1.0.0',
  description: 'Booking system with service selection and confirmation',
  orbitals: [
    {
      name: 'BookingOrbital',
      entity: {
        name: 'Booking',
        persistence: 'persistent',
        collection: 'bookings',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'service', type: 'string', default: '' },
          { name: 'date', type: 'string', default: '' },
          { name: 'time', type: 'string', default: '' },
          { name: 'clientName', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'pending' },
        ],
      },
      traits: [
        {
          name: 'BookingFlow',
          linkedEntity: 'Booking',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'selecting' },
              { name: 'confirming' },
              { name: 'confirmed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT', name: 'Select Booking', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'FILL_DETAILS', name: 'Fill Details', payloadSchema: [
                { name: 'service', type: 'string', required: true },
                { name: 'date', type: 'string', required: true },
                { name: 'time', type: 'string', required: true },
                { name: 'clientName', type: 'string', required: true },
              ] },
              { key: 'CONFIRM', name: 'Confirm Booking' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'BACK', name: 'Go Back' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Booking'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Bookings' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Booking',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'selecting',
                event: 'SELECT',
                effects: [
                  ['fetch', 'Booking'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Booking',
                    title: 'Book a Service',
                    submitEvent: 'FILL_DETAILS',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'selecting',
                to: 'confirming',
                event: 'FILL_DETAILS',
                effects: [
                  ['set', '@entity.service', '@payload.service'],
                  ['set', '@entity.date', '@payload.date'],
                  ['set', '@entity.time', '@payload.time'],
                  ['set', '@entity.clientName', '@payload.clientName'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Confirm Booking',
                    actions: [
                      { label: 'Confirm', event: 'CONFIRM' },
                      { label: 'Back', event: 'BACK' },
                    ],
                  }],
                ],
              },
              {
                from: 'confirming',
                to: 'confirmed',
                event: 'CONFIRM',
                effects: [
                  ['set', '@entity.status', 'confirmed'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: 'Booking Confirmed',
                    actions: [
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'confirming',
                to: 'selecting',
                event: 'BACK',
                effects: [
                  ['fetch', 'Booking'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Booking',
                    title: 'Book a Service',
                    submitEvent: 'FILL_DETAILS',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'selecting',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'confirming',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'confirmed',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'Booking'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Booking',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                    ],
                  }],
                ],
              },
              {
                from: 'confirmed',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'Booking'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Booking',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                    ],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'BookingsPage',
          path: '/bookings',
          isInitial: true,
          traits: [{ ref: 'BookingFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-availability - Availability Management
// ============================================================================

/**
 * std-availability - Manage available time slots.
 * Supports browsing and editing time slot availability.
 */
export const AVAILABILITY_BEHAVIOR: OrbitalSchema = {
  name: 'std-availability',
  version: '1.0.0',
  description: 'Availability time slot management',
  orbitals: [
    {
      name: 'AvailabilityOrbital',
      entity: {
        name: 'TimeSlot',
        persistence: 'persistent',
        collection: 'time_slots',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'dayOfWeek', type: 'string', default: '' },
          { name: 'startTime', type: 'string', default: '' },
          { name: 'endTime', type: 'string', default: '' },
          { name: 'isAvailable', type: 'boolean', default: true },
        ],
      },
      traits: [
        {
          name: 'AvailabilityManager',
          linkedEntity: 'TimeSlot',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'EDIT', name: 'Edit Slot', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'UPDATE', name: 'Update Slot', payloadSchema: [
                { name: 'dayOfWeek', type: 'string', required: true },
                { name: 'startTime', type: 'string', required: true },
                { name: 'endTime', type: 'string', required: true },
                { name: 'isAvailable', type: 'boolean', required: true },
              ] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'TimeSlot'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Availability' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'TimeSlot',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'TimeSlot'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'TimeSlot',
                    title: 'Edit Time Slot',
                    submitEvent: 'UPDATE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'UPDATE',
                effects: [
                  ['set', '@entity.dayOfWeek', '@payload.dayOfWeek'],
                  ['set', '@entity.startTime', '@payload.startTime'],
                  ['set', '@entity.endTime', '@payload.endTime'],
                  ['set', '@entity.isAvailable', '@payload.isAvailable'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'TimeSlot'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'TimeSlot',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CLOSE',
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
          name: 'AvailabilityPage',
          path: '/availability',
          isInitial: true,
          traits: [{ ref: 'AvailabilityManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-reminder - Reminder System
// ============================================================================

/**
 * std-reminder - Simple reminder system with CRUD operations.
 * Supports browsing, creating, and viewing reminders.
 */
export const REMINDER_BEHAVIOR: OrbitalSchema = {
  name: 'std-reminder',
  version: '1.0.0',
  description: 'Reminder system with priority tracking',
  orbitals: [
    {
      name: 'ReminderOrbital',
      entity: {
        name: 'Reminder',
        persistence: 'persistent',
        collection: 'reminders',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'dueDate', type: 'string', default: '' },
          { name: 'priority', type: 'string', default: 'medium' },
          { name: 'isCompleted', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'ReminderManager',
          linkedEntity: 'Reminder',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'Create Reminder' },
              { key: 'SUBMIT', name: 'Submit Reminder', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'dueDate', type: 'string', required: true },
                { name: 'priority', type: 'string', required: true },
              ] },
              { key: 'VIEW', name: 'View Reminder', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'COMPLETE', name: 'Complete Reminder' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Reminder'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reminders', 
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Reminder',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'Reminder'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Reminder',
                    title: 'New Reminder',
                    submitEvent: 'SUBMIT',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SUBMIT',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.dueDate', '@payload.dueDate'],
                  ['set', '@entity.priority', '@payload.priority'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Reminder'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Reminder',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
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
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.title',
                    actions: [
                      { label: 'Complete', event: 'COMPLETE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'COMPLETE',
                effects: [
                  ['set', '@entity.isCompleted', true],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Reminder'],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Reminder',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
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
            ],
          },
        },
      ],
      pages: [
        {
          name: 'RemindersPage',
          path: '/reminders',
          isInitial: true,
          traits: [{ ref: 'ReminderManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Scheduling Behaviors
// ============================================================================

export const SCHEDULING_BEHAVIORS: OrbitalSchema[] = [
  CALENDAR_BEHAVIOR,
  BOOKING_BEHAVIOR,
  AVAILABILITY_BEHAVIOR,
  REMINDER_BEHAVIOR,
];
