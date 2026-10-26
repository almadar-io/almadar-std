import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, NUMBER, STRING, lit, union } from '../signature.js';
import { arg, osEffect } from './os-common.js';

export const OS_DESKTOP_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/notify': osEffect({
    grant: [{ kind: 'desktop', access: 'notify' }],
    description: 'Show a desktop notification (grant desktop: notify). Success payload: {}.',
    params: [arg('title', STRING, 'Title'), arg('body', STRING, 'Body text'), arg('urgency', union(lit('low'), lit('normal'), lit('critical')), 'Urgency', true)],
    example: '["os/notify", "Build done", "All green", { "emit": { "success": "NOTIFIED", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/speak': osEffect({
    grant: [{ kind: 'desktop', access: 'speak' }],
    description: 'Speak text aloud (grant desktop: speak). Success payload: {}.',
    params: [arg('text', STRING, 'Text to speak')],
    example: '["os/speak", "Build done", { "emit": { "success": "SPOKEN", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/brightness-get': osEffect({
    grant: [{ kind: 'desktop', access: 'brightness' }],
    description: 'Read the display brightness (grant desktop: brightness). Success payload: { level }.',
    params: [],
    example: '["os/brightness-get", { "emit": { "success": "BRIGHTNESS_READ", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/brightness-set': osEffect({
    grant: [{ kind: 'desktop', access: 'brightness' }],
    description: 'Set the display brightness (grant desktop: brightness). Success payload: {}.',
    params: [arg('level', NUMBER, 'Brightness level')],
    example: '["os/brightness-set", 50, { "emit": { "success": "BRIGHTNESS_SET", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/volume-get': osEffect({
    grant: [{ kind: 'desktop', access: 'volume' }],
    description: 'Read the output volume (grant desktop: volume). Success payload: { level }.',
    params: [],
    example: '["os/volume-get", { "emit": { "success": "VOLUME_READ", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/volume-set': osEffect({
    grant: [{ kind: 'desktop', access: 'volume' }],
    description: 'Set the output volume (grant desktop: volume). Success payload: {}.',
    params: [arg('level', NUMBER, 'Volume level')],
    example: '["os/volume-set", 30, { "emit": { "success": "VOLUME_SET", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/volume-mute': osEffect({
    grant: [{ kind: 'desktop', access: 'volume' }],
    description: 'Mute or unmute the output (grant desktop: volume). Success payload: {}.',
    params: [arg('muted', BOOLEAN, 'True to mute, false to unmute')],
    example: '["os/volume-mute", true, { "emit": { "success": "VOLUME_MUTED", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/suspend': osEffect({
    grant: [{ kind: 'desktop', access: 'power' }],
    description: 'Suspend the machine (grants desktop and power). Success payload: {}.',
    params: [],
    example: '["os/suspend", { "emit": { "success": "SUSPENDED", "failure": "DESKTOP_FAILED" } }]',
  }),
  'os/hibernate': osEffect({
    grant: [{ kind: 'desktop', access: 'power' }],
    description: 'Hibernate the machine (grants desktop and power). Success payload: {}.',
    params: [],
    example: '["os/hibernate", { "emit": { "success": "HIBERNATED", "failure": "DESKTOP_FAILED" } }]',
  }),
};
