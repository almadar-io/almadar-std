import type { StdOperatorMeta } from '../types.js';
import { NUMBER, STRING, lit, union } from '../signature.js';
import { OS_DATA, OS_HANDLE, OS_HOST, OS_PORT, arg, osEffect } from './os-common.js';

export const OS_NET_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/tcp-connect': osEffect({
    description: 'Open a TCP connection (grant net: tcp). Success payload: { sock }.',
    params: [arg('host', OS_HOST, 'Host name or address'), arg('port', OS_PORT, 'Port')],
    example: '["os/tcp-connect", "db.internal", 5432, { "emit": { "success": "SOCK_OPENED", "failure": "NET_FAILED" } }]',
  }),
  'os/tcp-listen': osEffect({
    description: 'Listen for TCP connections (grant net: listen). The first answer is { sock }; each connection arrives on the onMessage route as { sock, peer }. An accepted sock takes any number of os/send and os/recv until os/close (keep-alive, streamed replies); a keyed os/recv armed on it reports a client abort as { eof: true } or a closed failure, and os/close with that read pending ends the connection at once.',
    params: [arg('host', OS_HOST, 'Address to bind'), arg('port', OS_PORT, 'Port')],
    stream: true,
    example: '["os/tcp-listen", "0.0.0.0", 8080, { "key": "listener", "emit": { "success": "LISTENING", "failure": "NET_FAILED", "onMessage": "SOCK_ACCEPTED" } }]',
  }),
  'os/send': osEffect({
    description: 'Send on a connected socket (grant net). Success payload: { bytes }. Sends on one socket are written in call order and never interleave. A keyed send under a declared route writes in the background and answers its route when the write ends (success { bytes }, or a failure such as timeout after the 5 s socket bound or closed), so a peer that stops reading does not hold the dispatch; an unkeyed send answers in place.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('data', OS_DATA, 'Content to send')],
    example: '["os/send", "@payload.sock", "cGluZw==", { "emit": { "success": "SOCK_SENT", "failure": "NET_FAILED" } }]',
  }),
  'os/recv': osEffect({
    description: 'Receive from a connected socket (grant net). Success payload: { data: bytes, eof }.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('count', NUMBER, 'Maximum bytes to receive')],
    example: '["os/recv", "@payload.sock", 4096, { "emit": { "success": "SOCK_RECEIVED", "failure": "NET_FAILED" } }]',
  }),
  'os/udp-bind': osEffect({
    description: 'Bind a UDP socket (grant net: udp). Success payload: { sock }.',
    params: [arg('host', OS_HOST, 'Address to bind'), arg('port', OS_PORT, 'Port')],
    example: '["os/udp-bind", "0.0.0.0", 5353, { "emit": { "success": "SOCK_OPENED", "failure": "NET_FAILED" } }]',
  }),
  'os/sendto': osEffect({
    description: 'Send a UDP datagram (grant net: udp). Success payload: { bytes }.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('data', OS_DATA, 'Content to send'), arg('host', OS_HOST, 'Destination host'), arg('port', OS_PORT, 'Destination port')],
    example: '["os/sendto", "@payload.sock", "cGluZw==", "10.0.0.2", 5353, { "emit": { "success": "DATAGRAM_SENT", "failure": "NET_FAILED" } }]',
  }),
  'os/recvfrom': osEffect({
    description: 'Receive a UDP datagram (grant net: udp). Success payload: { data: bytes, peer }.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('count', NUMBER, 'Maximum bytes to receive')],
    example: '["os/recvfrom", "@payload.sock", 1500, { "emit": { "success": "DATAGRAM_RECEIVED", "failure": "NET_FAILED" } }]',
  }),
  'os/dns-resolve': osEffect({
    description: 'Resolve a host name (grant net). Success payload: { addresses }.',
    params: [arg('name', STRING, 'Host name'), arg('family', union(lit(4), lit(6)), 'Address family: 4 or 6', true)],
    example: '["os/dns-resolve", "db.internal", { "emit": { "success": "DNS_RESOLVED", "failure": "NET_FAILED" } }]',
  }),
  'os/shutdown': osEffect({
    description: 'Shut down a socket (grant net). Success payload: {}.',
    params: [arg('sock', OS_HANDLE, 'Socket handle')],
    example: '["os/shutdown", "@payload.sock", { "emit": { "success": "SOCK_SHUT", "failure": "NET_FAILED" } }]',
  }),
  'os/watch-port': osEffect({
    description: 'Watch a local port (grant net). Events are { port, open }. The options object also takes debounceMs.',
    params: [arg('port', OS_PORT, 'Port number to monitor'), arg('proto', union(lit('tcp'), lit('udp')), 'Protocol: "tcp" or "udp"')],
    stream: true,
    example: '["os/watch-port", 3000, "tcp", { "emit": { "success": "PORT_CHANGED", "failure": "WATCH_FAILED", "key": "port-3000" } }]',
  }),
  'os/watch-http': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 2,
    description: 'Register HTTP response interceptor. Emits OS_HTTP_RESPONSE events with { url, method, status, headers, body, duration } payload.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'urlPattern', type: STRING, description: 'URL pattern to intercept (e.g., "https://api.example.com/*")' },
      { name: 'method', type: STRING, description: 'HTTP method filter (e.g., "POST")', optional: true },
    ],
    example: '["os/watch-http", "https://api.example.com/*", "POST"]',
  },
};
