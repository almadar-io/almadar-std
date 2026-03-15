/**
 * std-booking-system
 *
 * Booking system organism. Composes molecules via compose:
 * - stdList(Provider): provider directory with CRUD
 * - stdWizard(Booking): booking wizard
 * - stdList(Appointment): appointment list with CRUD
 * - stdDisplay(Schedule): schedule overview dashboard
 *
 * Cross-orbital connections:
 * - BOOK: ProviderBrowse -> BookingWizard
 * - CONFIRM: BookingWizard -> AppointmentBrowse
 *
 * @level organism
 * @family scheduling
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import { stdList } from './std-list.js';
import { stdWizard } from './std-wizard.js';
import { stdDisplay } from './std-display.js';

// ============================================================================
// Params
// ============================================================================

export interface StdBookingSystemParams {
  appName?: string;
  providerFields?: EntityField[];
  bookingFields?: EntityField[];
  appointmentFields?: EntityField[];
  scheduleFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PROVIDER_FIELDS: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'specialty', type: 'string', required: true },
  { name: 'location', type: 'string' },
  { name: 'phone', type: 'string' },
  { name: 'rating', type: 'number', default: 0 },
  { name: 'available', type: 'boolean', default: true },
];

const DEFAULT_BOOKING_FIELDS: EntityField[] = [
  { name: 'providerName', type: 'string', required: true },
  { name: 'customerName', type: 'string', required: true },
  { name: 'customerEmail', type: 'string', required: true },
  { name: 'date', type: 'string', required: true },
  { name: 'time', type: 'string', required: true },
  { name: 'notes', type: 'string' },
];

const DEFAULT_APPOINTMENT_FIELDS: EntityField[] = [
  { name: 'providerName', type: 'string', required: true },
  { name: 'customerName', type: 'string', required: true },
  { name: 'date', type: 'string', required: true },
  { name: 'time', type: 'string', required: true },
  { name: 'status', type: 'string', default: 'confirmed' },
  { name: 'notes', type: 'string' },
];

const DEFAULT_SCHEDULE_FIELDS: EntityField[] = [
  { name: 'totalBookings', type: 'number', default: 0 },
  { name: 'confirmedToday', type: 'number', default: 0 },
  { name: 'pendingBookings', type: 'number', default: 0 },
  { name: 'availableSlots', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdBookingSystem(params: StdBookingSystemParams): OrbitalSchema {
  const providerFields = params.providerFields ?? DEFAULT_PROVIDER_FIELDS;
  const bookingFields = params.bookingFields ?? DEFAULT_BOOKING_FIELDS;
  const appointmentFields = params.appointmentFields ?? DEFAULT_APPOINTMENT_FIELDS;
  const scheduleFields = params.scheduleFields ?? DEFAULT_SCHEDULE_FIELDS;

  const providers = stdList({
    entityName: 'Provider',
    fields: providerFields,
    pageTitle: 'Providers',
    headerIcon: 'briefcase',
    pageName: 'ProvidersPage',
    pagePath: '/providers',
    isInitial: true,
  });

  const booking = stdWizard({
    entityName: 'Booking',
    fields: bookingFields,
    wizardTitle: 'Book Appointment',
    headerIcon: 'calendar',
    pageName: 'BookPage',
    pagePath: '/book',
    steps: [
      { name: 'Provider Selection', fields: ['providerName'] },
      { name: 'Your Details', fields: ['customerName', 'customerEmail'] },
      { name: 'Date and Time', fields: ['date', 'time', 'notes'] },
    ],
    completeTitle: 'Booking Confirmed',
    completeDescription: 'Your appointment has been booked successfully.',
    submitButtonLabel: 'Confirm Booking',
  });

  const appointments = stdList({
    entityName: 'Appointment',
    fields: appointmentFields,
    pageTitle: 'Appointments',
    headerIcon: 'clock',
    pageName: 'AppointmentsPage',
    pagePath: '/appointments',
  });

  const schedule = stdDisplay({
    entityName: 'Schedule',
    fields: scheduleFields,
    pageTitle: 'Schedule Overview',
    headerIcon: 'bar-chart-2',
    pageName: 'SchedulePage',
    pagePath: '/schedule',
    columns: 4,
    persistence: 'singleton',
  });

  return compose(
    [providers, booking, appointments, schedule],
    [
      { name: 'ProvidersPage', path: '/providers', traits: ['ProviderBrowse', 'ProviderCreate', 'ProviderEdit', 'ProviderView', 'ProviderDelete'], isInitial: true },
      { name: 'BookPage', path: '/book', traits: ['BookingWizard'] },
      { name: 'AppointmentsPage', path: '/appointments', traits: ['AppointmentBrowse', 'AppointmentCreate', 'AppointmentEdit', 'AppointmentView', 'AppointmentDelete'] },
      { name: 'SchedulePage', path: '/schedule', traits: ['ScheduleDisplay'] },
    ],
    [
      { from: 'ProviderBrowse', to: 'BookingWizard', event: { event: 'BOOK', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'BookingWizard', to: 'AppointmentBrowse', event: { event: 'CONFIRM', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],
    params.appName ?? 'BookingSystemApp',
  );
}
