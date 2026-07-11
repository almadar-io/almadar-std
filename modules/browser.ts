/**
 * Browser Module - Browser Device Operators (client host path)
 *
 * User-initiated, async device APIs that resolve through the standard
 * trailing emit envelope `{ emit: { success, failure } }`. These run on
 * the client side only: in the React/runtime path they delegate to the
 * real `window`/`navigator` APIs; in the compiled Dioxus-native path they
 * are routed through the hybrid host bridge (WASI + capability manifest).
 *
 * All operators have side effects (they reach out to the device / user).
 * Effect-position only; never valid in guards.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const BROWSER_OPERATORS: Record<string, StdOperatorMeta> = {
  'browser/open-file-picker': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 1,
    description:
      'Open the OS file picker (window.showOpenFilePicker / host dialog). Resolves with the selected file metadata list, or emits failure when the user cancels or the capability is denied. Async; use the trailing { emit } envelope for success/failure events.',
    hasSideEffects: true,
    returnType: 'array',
    params: [
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            multiple: 'string',
            accept: 'string',
          },
          open: true,
        },
        description: 'Optional picker config: { multiple?: boolean, accept?: string, types?: Array<{description, accept}> }',
        optional: true,
      },
    ],
    effect: {
      kind: 'custom',
      produces: {
        kind: 'array',
        of: {
          kind: 'object',
          fields: {
            name: 'string',
            size: 'number',
            type: 'string',
            lastModified: 'number',
          },
        },
      },
    },
    example: '["browser/open-file-picker", { "multiple": false }, { "emit": { "success": "FILES_PICKED", "failure": "PICK_CANCELLED" } }]',
  },
  'browser/clipboard-read': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 0,
    description:
      'Read text from the system clipboard (navigator.clipboard.readText / host clipboard). Requires a user gesture and clipboard permission. Resolves with the clipboard text via the trailing { emit } envelope.',
    hasSideEffects: true,
    returnType: 'string',
    effect: {
      kind: 'custom',
      produces: 'string',
    },
    example: '["browser/clipboard-read", { "emit": { "success": "CLIPBOARD_READ", "failure": "CLIPBOARD_DENIED" } }]',
  },
  'browser/clipboard-write': {
    module: 'browser',
    category: 'std-browser',
    minArity: 1,
    maxArity: 1,
    description:
      'Write text to the system clipboard (navigator.clipboard.writeText / host clipboard). Requires a user gesture. Emits success/failure via the trailing { emit } envelope.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'text', type: 'string', description: 'Text to write to the clipboard' },
    ],
    effect: {
      kind: 'custom',
      produces: 'string',
    },
    example: '["browser/clipboard-write", "@entity.inviteUrl", { "emit": { "success": "COPIED", "failure": "COPY_DENIED" } }]',
  },
  'browser/geolocation-current': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 1,
    description:
      'Read the current device position (navigator.geolocation.getCurrentPosition / host geolocation). Requires location permission. Resolves with { latitude, longitude, accuracy } via the trailing { emit } envelope.',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            enableHighAccuracy: 'string',
            timeout: 'number',
            maximumAge: 'number',
          },
          open: true,
        },
        description: 'Optional PositionOptions: { enableHighAccuracy?: boolean, timeout?: number, maximumAge?: number }',
        optional: true,
      },
    ],
    effect: {
      kind: 'custom',
      produces: {
        kind: 'object',
        fields: {
          latitude: 'number',
          longitude: 'number',
          accuracy: 'number',
        },
      },
    },
    example: '["browser/geolocation-current", { "enableHighAccuracy": true }, { "emit": { "success": "LOCATED", "failure": "LOCATION_DENIED" } }]',
  },
};
