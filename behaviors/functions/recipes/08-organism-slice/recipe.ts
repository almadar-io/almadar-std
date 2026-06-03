/**
 * Recipe 08 — Ship one orbital out of a multi-orbital organism.
 *
 * A multi-orbital organism (e.g. std-generic-app: Contact / Item / Activity /
 * Task / Calendar / Widget / Feed / Note) publishes one factory PER orbital.
 * The agent can pick any subset and embed just those in a custom schema —
 * useful when a domain needs the Contact side but not the rest.
 *
 * Here we slice the Contact orbital out of std-generic-app and ship just
 * that one. Each per-orbital factory returns a self-contained
 * `OrbitalDefinition` (its emit/listen graph is internal), so a single-orbital
 * slice never produces a cross-orbital `ORB_X_UNUSED_EMISSION`.
 */
import { stdGenericAppContactOrbital } from '@almadar/std/behaviors/functions';
import { makeSchema } from '@almadar/core/builders';
import type { OrbitalSchema } from '@almadar/core/types';

const contactOrbital = stdGenericAppContactOrbital();

export const schema: OrbitalSchema = makeSchema(
  'recipe-08-organism-slice',
  contactOrbital,
);
