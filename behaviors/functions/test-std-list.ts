/**
 * Test script for stdList function.
 *
 * Generates .orb files and validates with `orbital validate`.
 *
 * Usage: npx tsx behaviors/functions/test-std-list.ts
 */

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { stdList } from './std-list.ts';

const ORBITAL_BIN = '/home/osamah/bin/orbital';
const OUT_DIR = join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'verification-screenshots', 'behaviors', 'std-list');
const ORB_DIR = join(import.meta.dirname, '..', 'exports');

function validate(filePath: string, label: string): boolean {
  console.log(`\n--- Validating: ${label} ---`);
  try {
    const output = execSync(`${ORBITAL_BIN} validate ${filePath}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(output || '(no output)');
    console.log(`RESULT: PASS`);
    return true;
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; status?: number };
    if (execErr.stdout) console.log(execErr.stdout);
    if (execErr.stderr) console.error(execErr.stderr);
    console.log(`RESULT: FAIL (exit code ${execErr.status})`);
    return false;
  }
}

function toSchema(name: string, ...orbitals: ReturnType<typeof stdList>[]) {
  return { name, version: '1.0.0', orbitals };
}

// Test 1: Doctor
const doctor = stdList({
  entityName: 'Doctor',
  fields: [
    { name: 'name', type: 'string', required: true },
    { name: 'specialty', type: 'string' },
    { name: 'licenseNumber', type: 'string' },
  ],
  pageTitle: 'Doctors',
  createButtonLabel: 'Add Doctor',
  headerIcon: 'stethoscope',
  pagePath: '/doctors',
  isInitial: true,
});

const doctorFile = join(ORB_DIR, 'std-list-doctor.orb');
writeFileSync(doctorFile, JSON.stringify(toSchema('DoctorApp', doctor), null, 2));
const doctorPass = validate(doctorFile, 'Doctor');

// Test 2: Task
const task = stdList({
  entityName: 'Task',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'status', type: 'string', default: 'todo', values: ['todo', 'in-progress', 'done'] },
    { name: 'priority', type: 'string', default: 'medium', values: ['low', 'medium', 'high'] },
  ],
  pageTitle: 'Tasks',
  headerIcon: 'check-square',
  pagePath: '/tasks',
  isInitial: true,
});

const taskFile = join(ORB_DIR, 'std-list-task.orb');
writeFileSync(taskFile, JSON.stringify(toSchema('TaskApp', task), null, 2));
const taskPass = validate(taskFile, 'Task');

// Test 3: Combined
const taskNonInitial = stdList({
  entityName: 'Task',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'status', type: 'string', default: 'todo', values: ['todo', 'in-progress', 'done'] },
    { name: 'priority', type: 'string', default: 'medium', values: ['low', 'medium', 'high'] },
  ],
  pagePath: '/tasks',
});

const combinedFile = join(ORB_DIR, 'std-list-combined.orb');
writeFileSync(combinedFile, JSON.stringify(toSchema('ClinicApp', doctor, taskNonInitial), null, 2));
const combinedPass = validate(combinedFile, 'Combined (Doctor + Task)');

// Summary
console.log('\n========== SUMMARY ==========');
console.log(`Doctor:    ${doctorPass ? 'PASS' : 'FAIL'}`);
console.log(`Task:      ${taskPass ? 'PASS' : 'FAIL'}`);
console.log(`Combined:  ${combinedPass ? 'PASS' : 'FAIL'}`);

const allPass = doctorPass && taskPass && combinedPass;
console.log(`\nOverall: ${allPass ? 'ALL PASSED' : 'SOME FAILED'}`);
process.exit(allPass ? 0 : 1);
