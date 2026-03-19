/**
 * Shared utilities for standard behavior functions.
 *
 * @packageDocumentation
 */

/**
 * Convert a camelCase or PascalCase field name into a human-readable label.
 *
 * Examples:
 *   firstName  → "First Name"
 *   createdAt  → "Created At"
 *   userID     → "User ID"
 *   isActive   → "Is Active"
 */
export function humanizeLabel(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\bId\b/g, 'ID')
    .replace(/^./, s => s.toUpperCase());
}

/** Fields injected by the runtime/compiler that should not appear in user-facing forms or detail views. */
export const SYSTEM_FIELDS = new Set(['createdAt', 'updatedAt', 'pendingId']);
