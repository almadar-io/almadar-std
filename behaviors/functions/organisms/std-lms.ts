/**
 * std-lms
 *
 * Learning management system organism. Composes molecules via compose:
 * - stdList(Course): CRUD list of courses
 * - stdWizard(Enrollment): multi-step enrollment wizard
 * - stdDisplay(Progress): read-only progress dashboard
 *
 * Pages: /courses (initial), /enroll, /progress
 * Connections: ENROLL (courses->enrollment), COMPLETE_LESSON (enrollment->progress)
 *
 * @level organism
 * @family education
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

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdWizard } from '../atoms/std-wizard.js';
import { stdDisplay } from '../atoms/std-display.js';
import { lmsCourseView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdLmsParams {
  appName?: string;
  courseFields?: EntityField[];
  enrollmentFields?: EntityField[];
  progressFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_COURSE_FIELDS: EntityField[] = [
  { name: 'title', type: 'string', default: '' },
  { name: 'description', type: 'string', default: '' },
  { name: 'instructor', type: 'string', default: '' },
  { name: 'duration', type: 'string', default: '' },
  { name: 'level', type: 'string', default: 'Beginner', values: ['Beginner', 'Intermediate', 'Advanced'] },
];

const DEFAULT_ENROLLMENT_FIELDS: EntityField[] = [
  { name: 'studentName', type: 'string', default: '' },
  { name: 'email', type: 'string', default: '' },
  { name: 'courseId', type: 'string', default: '' },
  { name: 'enrolledAt', type: 'date', default: '' },
  { name: 'status', type: 'string', default: 'pending', values: ['pending', 'active', 'completed', 'dropped'] },
];

const DEFAULT_PROGRESS_FIELDS: EntityField[] = [
  { name: 'courseName', type: 'string', default: '' },
  { name: 'lessonsCompleted', type: 'number', default: 0 },
  { name: 'totalLessons', type: 'number', default: 0 },
  { name: 'percentComplete', type: 'number', default: 0 },
  { name: 'lastActivity', type: 'date', default: '' },
];

// ============================================================================
// Composed Application
// ============================================================================

export function stdLms(params: StdLmsParams): OrbitalSchema {
  const appName = params.appName ?? 'LMS';

  const courseOrbital = stdList({
    entityName: 'Course',
    fields: params.courseFields ?? DEFAULT_COURSE_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Courses',
    headerIcon: 'book-open',
    createButtonLabel: 'Add Course',
    createFormTitle: 'New Course',
    emptyTitle: 'No courses yet',
    emptyDescription: 'Create a course to start teaching.',
    pageName: 'CoursesPage',
    pagePath: '/courses',
    isInitial: true,
    ...lmsCourseView(),
  });

  const enrollmentOrbital = stdWizard({
    entityName: 'Enrollment',
    fields: params.enrollmentFields ?? DEFAULT_ENROLLMENT_FIELDS,
    persistence: 'runtime',
    wizardTitle: 'Course Enrollment',
    completeTitle: 'Enrolled!',
    completeDescription: 'You have been successfully enrolled in the course.',
    headerIcon: 'user-plus',
    steps: [
      { name: 'Student Info', fields: ['studentName', 'email'] },
      { name: 'Course Selection', fields: ['courseId'] },
    ],
    pageName: 'EnrollPage',
    pagePath: '/enroll',
  });

  const progressOrbital = stdDisplay({
    entityName: 'Progress',
    fields: params.progressFields ?? DEFAULT_PROGRESS_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Progress',
    headerIcon: 'trending-up',
    columns: 3,
    pageName: 'ProgressPage',
    pagePath: '/progress',
  });

  const pages: ComposePage[] = [
    { name: 'CoursesPage', path: '/courses', traits: ['CourseBrowse', 'CourseCreate', 'CourseEdit', 'CourseView', 'CourseDelete'], isInitial: true },
    { name: 'EnrollPage', path: '/enroll', traits: ['EnrollmentWizard'] },
    { name: 'ProgressPage', path: '/progress', traits: ['ProgressDisplay'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'CourseBrowse',
      to: 'EnrollmentWizard',
      event: { event: 'ENROLL', description: 'Enroll in a course', payload: [{ name: 'id', type: 'string', required: true }] },
    },
    {
      from: 'EnrollmentWizard',
      to: 'ProgressDisplay',
      event: { event: 'COMPLETE_LESSON', description: 'Lesson completed, update progress', payload: [{ name: 'id', type: 'string', required: true }] },
    },
  ];

  const schema = compose([courseOrbital, enrollmentOrbital, progressOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
