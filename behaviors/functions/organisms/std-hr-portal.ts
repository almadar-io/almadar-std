/**
 * std-hr-portal
 *
 * HR portal organism. Composes molecules via compose:
 * - stdList(Employee): CRUD list of employees
 * - stdWizard(Onboarding): multi-step onboarding wizard
 * - stdList(TimeOff): CRUD list of time-off requests
 * - stdDisplay(OrgChart): read-only org chart dashboard
 *
 * Pages: /employees (initial), /onboarding, /timeoff, /org-chart
 * Connections: ONBOARD (employees->onboarding), APPROVE_LEAVE (timeoff->orgchart)
 *
 * @level organism
 * @family hr
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdWizard } from '../atoms/std-wizard.js';
import { stdDisplay } from '../atoms/std-display.js';
import { hrEmployeeView, hrTimeOffView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdHrPortalParams {
  appName?: string;
  employeeFields?: EntityField[];
  onboardingFields?: EntityField[];
  timeOffFields?: EntityField[];
  orgChartFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_EMPLOYEE_FIELDS: EntityField[] = [
  { name: 'name', type: 'string', default: '' },
  { name: 'email', type: 'string', default: '' },
  { name: 'department', type: 'string', default: '' },
  { name: 'role', type: 'string', default: '' },
  { name: 'startDate', type: 'date', default: '' },
];

const DEFAULT_ONBOARDING_FIELDS: EntityField[] = [
  { name: 'employeeName', type: 'string', default: '' },
  { name: 'department', type: 'string', default: '' },
  { name: 'manager', type: 'string', default: '' },
  { name: 'equipmentReady', type: 'boolean', default: false },
  { name: 'accessGranted', type: 'boolean', default: false },
];

const DEFAULT_TIMEOFF_FIELDS: EntityField[] = [
  { name: 'employeeName', type: 'string', default: '' },
  { name: 'leaveType', type: 'string', default: 'vacation', values: ['vacation', 'sick', 'personal', 'parental'] },
  { name: 'startDate', type: 'date', default: '' },
  { name: 'endDate', type: 'date', default: '' },
  { name: 'status', type: 'string', default: 'pending', values: ['pending', 'approved', 'denied'] },
];

const DEFAULT_ORGCHART_FIELDS: EntityField[] = [
  { name: 'totalEmployees', type: 'number', default: 0 },
  { name: 'departments', type: 'number', default: 0 },
  { name: 'openPositions', type: 'number', default: 0 },
  { name: 'avgTenure', type: 'string', default: '0 years' },
  { name: 'headcount', type: 'number', default: 0 },
];

// ============================================================================
// Composed Application
// ============================================================================

export function stdHrPortal(params: StdHrPortalParams): OrbitalSchema {
  const appName = params.appName ?? 'HRPortal';

  const employeeOrbital = stdList({
    entityName: 'Employee',
    fields: params.employeeFields ?? DEFAULT_EMPLOYEE_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Employees',
    headerIcon: 'users',
    createButtonLabel: 'Add Employee',
    createFormTitle: 'New Employee',
    emptyTitle: 'No employees yet',
    emptyDescription: 'Add employees to your organization.',
    pageName: 'EmployeesPage',
    pagePath: '/employees',
    isInitial: true,
    ...hrEmployeeView(),
  });

  const onboardingOrbital = stdWizard({
    entityName: 'Onboarding',
    fields: params.onboardingFields ?? DEFAULT_ONBOARDING_FIELDS,
    persistence: 'runtime',
    wizardTitle: 'Employee Onboarding',
    completeTitle: 'Onboarding Complete!',
    completeDescription: 'The new employee has been fully onboarded.',
    headerIcon: 'clipboard-check',
    steps: [
      { name: 'Employee Details', fields: ['employeeName', 'department'] },
      { name: 'Manager Assignment', fields: ['manager'] },
      { name: 'Setup Checklist', fields: ['equipmentReady', 'accessGranted'] },
    ],
    pageName: 'OnboardingPage',
    pagePath: '/onboarding',
  });

  const timeOffOrbital = stdList({
    entityName: 'TimeOff',
    fields: params.timeOffFields ?? DEFAULT_TIMEOFF_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Time Off Requests',
    headerIcon: 'calendar',
    createButtonLabel: 'Request Time Off',
    createFormTitle: 'New Time Off Request',
    emptyTitle: 'No time-off requests',
    emptyDescription: 'Submit a request when you need time off.',
    pageName: 'TimeOffPage',
    pagePath: '/timeoff',
    ...hrTimeOffView(),
  });

  const orgChartOrbital = stdDisplay({
    entityName: 'OrgChart',
    fields: params.orgChartFields ?? DEFAULT_ORGCHART_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Org Chart',
    headerIcon: 'git-branch',
    columns: 3,
    pageName: 'OrgChartPage',
    pagePath: '/org-chart',
  });

  const pages: ComposePage[] = [
    { name: 'EmployeesPage', path: '/employees', traits: ['EmployeeBrowse', 'EmployeeCreate', 'EmployeeEdit', 'EmployeeView', 'EmployeeDelete'], isInitial: true },
    { name: 'OnboardingPage', path: '/onboarding', traits: ['OnboardingWizard'] },
    { name: 'TimeOffPage', path: '/timeoff', traits: ['TimeOffBrowse', 'TimeOffCreate', 'TimeOffEdit', 'TimeOffView', 'TimeOffDelete'] },
    { name: 'OrgChartPage', path: '/org-chart', traits: ['OrgChartDisplay'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'EmployeeBrowse',
      to: 'OnboardingWizard',
      event: { event: 'ONBOARD', description: 'Start onboarding for a new employee', payload: [{ name: 'id', type: 'string', required: true }] },
    },
    {
      from: 'TimeOffBrowse',
      to: 'OrgChartDisplay',
      event: { event: 'APPROVE_LEAVE', description: 'Approve leave and update org chart', payload: [{ name: 'id', type: 'string', required: true }] },
    },
  ];

  const schema = compose([employeeOrbital, onboardingOrbital, timeOffOrbital, orgChartOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
