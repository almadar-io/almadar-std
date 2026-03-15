/**
 * std-healthcare
 *
 * Healthcare organism. Composes molecules via compose:
 * - stdList(Patient): patient registry with CRUD
 * - stdList(Appointment): appointment management
 * - stdWizard(IntakeForm): patient intake wizard
 * - stdDetail(Prescription): prescription browse + view
 * - stdDisplay(Dashboard): clinic dashboard KPIs
 *
 * Cross-orbital connections:
 * - INTAKE_COMPLETE: IntakeFormWizard -> PatientBrowse
 * - PRESCRIBE: AppointmentBrowse -> PrescriptionBrowse
 *
 * @level organism
 * @family healthcare
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdWizard } from '../atoms/std-wizard.js';
import { stdDetail } from '../molecules/std-detail.js';
import { stdDisplay } from '../atoms/std-display.js';

// ============================================================================
// Params
// ============================================================================

export interface StdHealthcareParams {
  appName?: string;
  patientFields?: EntityField[];
  appointmentFields?: EntityField[];
  intakeFormFields?: EntityField[];
  prescriptionFields?: EntityField[];
  dashboardFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PATIENT_FIELDS: EntityField[] = [
  { name: 'firstName', type: 'string', required: true },
  { name: 'lastName', type: 'string', required: true },
  { name: 'dateOfBirth', type: 'string', required: true },
  { name: 'phone', type: 'string' },
  { name: 'insuranceId', type: 'string' },
  { name: 'status', type: 'string', default: 'active' },
];

const DEFAULT_APPOINTMENT_FIELDS: EntityField[] = [
  { name: 'patientName', type: 'string', required: true },
  { name: 'doctorName', type: 'string', required: true },
  { name: 'date', type: 'string', required: true },
  { name: 'time', type: 'string', required: true },
  { name: 'reason', type: 'string' },
  { name: 'status', type: 'string', default: 'scheduled' },
];

const DEFAULT_INTAKE_FORM_FIELDS: EntityField[] = [
  { name: 'firstName', type: 'string', required: true },
  { name: 'lastName', type: 'string', required: true },
  { name: 'dateOfBirth', type: 'string', required: true },
  { name: 'allergies', type: 'string' },
  { name: 'medications', type: 'string' },
  { name: 'emergencyContact', type: 'string' },
  { name: 'insuranceProvider', type: 'string' },
  { name: 'insuranceId', type: 'string' },
];

const DEFAULT_PRESCRIPTION_FIELDS: EntityField[] = [
  { name: 'medication', type: 'string', required: true },
  { name: 'dosage', type: 'string', required: true },
  { name: 'frequency', type: 'string', required: true },
  { name: 'patientName', type: 'string', required: true },
  { name: 'prescribedBy', type: 'string' },
  { name: 'startDate', type: 'string' },
  { name: 'endDate', type: 'string' },
];

const DEFAULT_DASHBOARD_FIELDS: EntityField[] = [
  { name: 'totalPatients', type: 'number', default: 0 },
  { name: 'appointmentsToday', type: 'number', default: 0 },
  { name: 'pendingIntakes', type: 'number', default: 0 },
  { name: 'activePrescriptions', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdHealthcare(params: StdHealthcareParams): OrbitalSchema {
  const patientFields = params.patientFields ?? DEFAULT_PATIENT_FIELDS;
  const appointmentFields = params.appointmentFields ?? DEFAULT_APPOINTMENT_FIELDS;
  const intakeFormFields = params.intakeFormFields ?? DEFAULT_INTAKE_FORM_FIELDS;
  const prescriptionFields = params.prescriptionFields ?? DEFAULT_PRESCRIPTION_FIELDS;
  const dashboardFields = params.dashboardFields ?? DEFAULT_DASHBOARD_FIELDS;

  const patients = stdList({
    entityName: 'Patient',
    fields: patientFields,
    pageTitle: 'Patients',
    headerIcon: 'users',
    pageName: 'PatientsPage',
    pagePath: '/patients',
    isInitial: true,
  });

  const appointments = stdList({
    entityName: 'Appointment',
    fields: appointmentFields,
    pageTitle: 'Appointments',
    headerIcon: 'calendar',
    pageName: 'AppointmentsPage',
    pagePath: '/appointments',
  });

  const intake = stdWizard({
    entityName: 'IntakeForm',
    fields: intakeFormFields,
    wizardTitle: 'Patient Intake',
    headerIcon: 'clipboard',
    pageName: 'IntakePage',
    pagePath: '/intake',
    steps: [
      { name: 'Personal Info', fields: ['firstName', 'lastName', 'dateOfBirth'] },
      { name: 'Medical History', fields: ['allergies', 'medications'] },
      { name: 'Insurance', fields: ['emergencyContact', 'insuranceProvider', 'insuranceId'] },
    ],
    completeTitle: 'Intake Complete',
    completeDescription: 'Patient intake form has been submitted successfully.',
    submitButtonLabel: 'Submit Intake',
  });

  const prescriptions = stdDetail({
    entityName: 'Prescription',
    fields: prescriptionFields,
    pageTitle: 'Prescriptions',
    headerIcon: 'file-text',
    pageName: 'PrescriptionsPage',
    pagePath: '/prescriptions',
  });

  const dashboard = stdDisplay({
    entityName: 'Dashboard',
    fields: dashboardFields,
    pageTitle: 'Clinic Dashboard',
    headerIcon: 'activity',
    pageName: 'DashboardPage',
    pagePath: '/dashboard',
    columns: 4,
    persistence: 'singleton',
  });

  return compose(
    [patients, appointments, intake, prescriptions, dashboard],
    [
      { name: 'PatientsPage', path: '/patients', traits: ['PatientBrowse', 'PatientCreate', 'PatientEdit', 'PatientView', 'PatientDelete'], isInitial: true },
      { name: 'AppointmentsPage', path: '/appointments', traits: ['AppointmentBrowse', 'AppointmentCreate', 'AppointmentEdit', 'AppointmentView', 'AppointmentDelete'] },
      { name: 'IntakePage', path: '/intake', traits: ['IntakeFormWizard'] },
      { name: 'PrescriptionsPage', path: '/prescriptions', traits: ['PrescriptionBrowse', 'PrescriptionCreate', 'PrescriptionView'] },
      { name: 'DashboardPage', path: '/dashboard', traits: ['DashboardDisplay'] },
    ],
    [
      { from: 'IntakeFormWizard', to: 'PatientBrowse', event: { event: 'INTAKE_COMPLETE', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'AppointmentBrowse', to: 'PrescriptionBrowse', event: { event: 'PRESCRIBE', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],
    params.appName ?? 'HealthcareApp',
  );
}
