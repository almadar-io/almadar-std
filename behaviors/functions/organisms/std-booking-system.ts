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
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposePage } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdWizard } from '../atoms/std-wizard.js';
import { stdDisplay } from '../atoms/std-display.js';
import { bookingProviderView, bookingAppointmentView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

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
  { name: 'date', type: 'date', required: true },
  { name: 'time', type: 'string', required: true },
  { name: 'status', type: 'string', default: 'confirmed', values: ['confirmed', 'pending', 'cancelled', 'completed'] },
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
    emptyTitle: 'No providers listed',
    emptyDescription: 'Add service providers to enable bookings.',
    pageName: 'ProvidersPage',
    pagePath: '/providers',
    isInitial: true,
    ...bookingProviderView(),
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
    emptyTitle: 'No appointments',
    emptyDescription: 'Book an appointment to get started.',
    pageName: 'AppointmentsPage',
    pagePath: '/appointments',
    ...bookingAppointmentView(),
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

  const appName = params.appName ?? 'BookingSystemApp';



  const pages: ComposePage[] = [
      { name: 'ProvidersPage', path: '/providers', traits: ['ProviderBrowse', 'ProviderCreate', 'ProviderEdit', 'ProviderView', 'ProviderDelete'], isInitial: true },
      { name: 'BookPage', path: '/book', traits: ['BookingWizard'] },
      { name: 'AppointmentsPage', path: '/appointments', traits: ['AppointmentBrowse', 'AppointmentCreate', 'AppointmentEdit', 'AppointmentView', 'AppointmentDelete'] },
      { name: 'SchedulePage', path: '/schedule', traits: ['ScheduleDisplay'] },
    ];



  const schema = compose(


    [providers, booking, appointments, schedule],


    pages,


    [
      { from: 'ProviderBrowse', to: 'BookingWizard', event: { event: 'BOOK', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'BookingWizard', to: 'AppointmentBrowse', event: { event: 'CONFIRM', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],


    appName,


  );


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
