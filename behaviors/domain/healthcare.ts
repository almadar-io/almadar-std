/**
 * Healthcare Domain Behaviors
 *
 * Standard behaviors for vital signs, patient intake forms,
 * and prescription management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-vitals - Vital Signs Tracking
// ============================================================================

/**
 * std-vitals - Vital signs recording and monitoring.
 * States: browsing -> recording -> viewing
 */
export const VITALS_BEHAVIOR: OrbitalSchema = {
  name: 'std-vitals',
  version: '1.0.0',
  description: 'Vital signs recording and monitoring dashboard',
  orbitals: [
    {
      name: 'VitalsOrbital',
      entity: {
        name: 'VitalReading',
        persistence: 'persistent',
        collection: 'vital_readings',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'vitalType', type: 'string', default: '' },
          { name: 'value', type: 'number', default: 0 },
          { name: 'unit', type: 'string', default: '' },
          { name: 'recordedAt', type: 'string', default: '' },
          { name: 'patientId', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'VitalsControl',
          linkedEntity: 'VitalReading',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'recording' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'RECORD', name: 'Record Vitals' },
              { key: 'SAVE', name: 'Save Reading', payloadSchema: [{ name: 'vitalType', type: 'string', required: true }, { name: 'value', type: 'number', required: true }, { name: 'unit', type: 'string', required: true }] },
              { key: 'VIEW', name: 'View Reading', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'VitalReading'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Vital Signs',
                    actions: [{ label: 'Record', event: 'RECORD' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', entity: 'VitalReading' }],
                  ['render-ui', 'main', { type: 'line-chart',
                    data: [],
                  }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'VitalReading',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'recording',
                event: 'RECORD',
                effects: [
                  ['fetch', 'VitalReading'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'VitalReading',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'recording',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.vitalType', '@payload.vitalType'],
                  ['set', '@entity.value', '@payload.value'],
                  ['set', '@entity.unit', '@payload.unit'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'VitalReading'],
                  ['render-ui', 'main', { type: 'stats', entity: 'VitalReading' }],
                  ['render-ui', 'main', { type: 'line-chart',
                    data: [],
                  }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'VitalReading',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'recording',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'recording',
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
                  ['fetch', 'VitalReading'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'VitalReading',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                  ['render-ui', 'modal', { type: 'meter',
                    value: '@entity.value',
                    label: 'Current Reading',
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
          name: 'VitalsPage',
          path: '/vitals',
          isInitial: true,
          traits: [{ ref: 'VitalsControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-intake-form - Patient Intake
// ============================================================================

/**
 * std-intake-form - Multi-step patient intake form.
 * States: idle -> filling -> reviewing -> submitted
 */
export const INTAKE_FORM_BEHAVIOR: OrbitalSchema = {
  name: 'std-intake-form',
  version: '1.0.0',
  description: 'Multi-step patient intake form with review',
  orbitals: [
    {
      name: 'IntakeFormOrbital',
      entity: {
        name: 'IntakeForm',
        persistence: 'persistent',
        collection: 'intake_forms',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'patientName', type: 'string', default: '' },
          { name: 'dateOfBirth', type: 'string', default: '' },
          { name: 'symptoms', type: 'string', default: '' },
          { name: 'medications', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'IntakeFormControl',
          linkedEntity: 'IntakeForm',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'filling' },
              { name: 'reviewing' },
              { name: 'submitted' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Form' },
              { key: 'UPDATE', name: 'Update Fields', payloadSchema: [{ name: 'patientName', type: 'string', required: true }, { name: 'symptoms', type: 'string', required: true }] },
              { key: 'REVIEW', name: 'Review Form' },
              { key: 'SUBMIT', name: 'Submit Form' },
              { key: 'BACK', name: 'Go Back' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'IntakeForm'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Patient Intake',
                    actions: [{ label: 'New Intake', event: 'START' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'IntakeForm',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'filling',
                event: 'START',
                effects: [
                  ['fetch', 'IntakeForm'],
                  ['render-ui', 'main', { type: 'wizard-progress',
                    currentStep: 0,
                    steps: [{ label: 'Patient Info' }, { label: 'Symptoms' }, { label: 'Medications' }],
                  }],
                  ['render-ui', 'main', { type: 'wizard-container',
                    entity: 'IntakeForm',
                    steps: ['Patient Info', 'Symptoms', 'Medications'],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'IntakeForm' }],
                ],
              },
              {
                from: 'filling',
                to: 'filling',
                event: 'UPDATE',
                effects: [
                  ['fetch', 'IntakeForm'],
                  ['set', '@entity.patientName', '@payload.patientName'],
                  ['set', '@entity.symptoms', '@payload.symptoms'],
                  ['render-ui', 'main', { type: 'wizard-progress',
                    currentStep: 1,
                    steps: [{ label: 'Patient Info' }, { label: 'Symptoms' }, { label: 'Medications' }],
                  }],
                  ['render-ui', 'main', { type: 'wizard-container',
                    entity: 'IntakeForm',
                    steps: ['Patient Info', 'Symptoms', 'Medications'],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'IntakeForm' }],
                ],
              },
              {
                from: 'filling',
                to: 'reviewing',
                event: 'REVIEW',
                effects: [
                  ['fetch', 'IntakeForm'],
                  ['render-ui', 'main', { type: 'wizard-progress',
                    currentStep: 2,
                    steps: [{ label: 'Patient Info' }, { label: 'Symptoms' }, { label: 'Medications' }],
                  }],
                  ['render-ui', 'main', { type: 'page-header', title: 'Review Intake',
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'IntakeForm' }],
                ],
              },
              {
                from: 'reviewing',
                to: 'submitted',
                event: 'SUBMIT',
                effects: [
                  ['render-ui', 'main', { type: 'page-header', title: 'Submitted',
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', entity: 'IntakeForm' }],
                  ['render-ui', 'main', { type: 'card', title: 'Intake Form Submitted' }],
                ],
              },
              {
                from: 'reviewing',
                to: 'filling',
                event: 'BACK',
                effects: [
                  ['fetch', 'IntakeForm'],
                  ['render-ui', 'main', { type: 'wizard-progress',
                    currentStep: 0,
                    steps: [{ label: 'Patient Info' }, { label: 'Symptoms' }, { label: 'Medications' }],
                  }],
                  ['render-ui', 'main', { type: 'wizard-container',
                    entity: 'IntakeForm',
                    steps: ['Patient Info', 'Symptoms', 'Medications'],
                  }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'IntakeForm' }],
                ],
              },
              {
                from: 'submitted',
                to: 'idle',
                event: 'BACK',
                effects: [
                  ['fetch', 'IntakeForm'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Patient Intake',
                    actions: [{ label: 'New Intake', event: 'START' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'IntakeForm',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
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
          name: 'IntakePage',
          path: '/intake',
          isInitial: true,
          traits: [{ ref: 'IntakeFormControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-prescription - Prescription Management
// ============================================================================

/**
 * std-prescription - Prescription CRUD.
 * States: browsing -> creating -> viewing
 */
export const PRESCRIPTION_BEHAVIOR: OrbitalSchema = {
  name: 'std-prescription',
  version: '1.0.0',
  description: 'Prescription management with medication details',
  orbitals: [
    {
      name: 'PrescriptionOrbital',
      entity: {
        name: 'Prescription',
        persistence: 'persistent',
        collection: 'prescriptions',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'medication', type: 'string', default: '' },
          { name: 'dosage', type: 'string', default: '' },
          { name: 'frequency', type: 'string', default: '' },
          { name: 'startDate', type: 'string', default: '' },
          { name: 'endDate', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'PrescriptionControl',
          linkedEntity: 'Prescription',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'New Prescription' },
              { key: 'SAVE', name: 'Save Prescription', payloadSchema: [{ name: 'medication', type: 'string', required: true }, { name: 'dosage', type: 'string', required: true }, { name: 'frequency', type: 'string', required: true }] },
              { key: 'VIEW', name: 'View Prescription', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Prescription'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Prescriptions',
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Prescription' }],
                  ['render-ui', 'main', { type: 'timeline', entity: 'Prescription' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search prescriptions', event: 'VIEW' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Prescription',
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
                  ['fetch', 'Prescription'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Prescription',
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
                  ['set', '@entity.medication', '@payload.medication'],
                  ['set', '@entity.dosage', '@payload.dosage'],
                  ['set', '@entity.frequency', '@payload.frequency'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Prescription'],
                  ['render-ui', 'main', { type: 'stats', entity: 'Prescription' }],
                  ['render-ui', 'main', { type: 'timeline', entity: 'Prescription' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Prescription',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
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
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Prescription'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Prescription',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                  ['render-ui', 'modal', { type: 'meter', value: 0, label: 'Dosage' }],
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
          name: 'PrescriptionsPage',
          path: '/prescriptions',
          isInitial: true,
          traits: [{ ref: 'PrescriptionControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Healthcare Behaviors
// ============================================================================

export const HEALTHCARE_BEHAVIORS: OrbitalSchema[] = [
  VITALS_BEHAVIOR,
  INTAKE_FORM_BEHAVIOR,
  PRESCRIPTION_BEHAVIOR,
];
