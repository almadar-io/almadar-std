/**
 * Auth Module - Session asks the client host answers
 *
 * One ask each, answered by the client host. Effect-position only; they run on the client.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, EMIT_ENVELOPE, STRING, shape } from '../signature.js';
import { withKey } from './os-common.js';

export const AUTH_OPERATORS: Record<string, StdOperatorMeta> = {
  'auth/sign-in': {
    module: 'auth', category: 'std-auth',
    host: 'substrate',
    minArity: 1, maxArity: 2,
    description: 'Start the viewer session through the host auth provider. The request names the method: google; email (email, password); emailLink with a continueUrl sends the link, with a link completes the sign-in (exactly one of the two); customToken (token). Success carries { uid, email?, displayName? } (emailLink send: { sent: true }); failure carries { error, kind } with kind cancelled, denied, invalid or unavailable.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    exampleSource: 'module',
    effect: { kind: 'custom', produces: withKey(shape({ uid: STRING, email: STRING, displayName: STRING, sent: BOOLEAN }, ['uid', 'email', 'displayName', 'sent'])) },
    params: [
      { name: 'request', type: shape({ method: STRING, email: STRING, password: STRING, token: STRING, continueUrl: STRING, link: STRING }, ['email', 'password', 'token', 'continueUrl', 'link']), description: 'The method (google | email | emailLink | customToken) and the credentials it takes' },
      { name: 'options', type: EMIT_ENVELOPE, description: 'Optional trailing options: { emit: { success, failure, key? } } routes the success payload and the { error, kind } failure', optional: true }
    ],
    example: '["auth/sign-in", { "method": "email", "email": "ada@example.com", "password": "secret" }, { "emit": { "success": "SIGNED_IN", "failure": "SIGN_IN_FAILED" } }]',
  },
  'auth/sign-out': {
    module: 'auth', category: 'std-auth',
    host: 'substrate',
    minArity: 0, maxArity: 0,
    description: 'End the viewer session through the host auth provider.',
    hasSideEffects: true, runsOn: 'client', returnType: 'void',
    params: [],
    example: '["auth/sign-out"]',
  },
};

export function getAuthOperators(): string[] {
  return Object.keys(AUTH_OPERATORS);
}
