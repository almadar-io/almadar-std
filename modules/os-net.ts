import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { BOOLEAN, BYTES, NUMBER, STRING, list, lit, shape, union } from '../signature.js';
import { OS_DATA, OS_HANDLE, OS_HOST, OS_PORT, OS_SEND_DATA, arg, osEffect } from './os-common.js';

const TLS_SPEC: OperatorTypeRef = shape({ serverName: STRING, ca: STRING, alpn: list(STRING) }, ['ca', 'alpn']);
const TLS_ANSWER: OperatorTypeRef = shape({ sock: NUMBER, alpn: STRING }, ['alpn']);
const FETCH_HEADER: OperatorTypeRef = shape({ name: STRING, value: STRING });
const FETCH_REQUEST: OperatorTypeRef = shape({ headers: list(FETCH_HEADER), body: BYTES, timeoutMs: NUMBER, stream: BOOLEAN }, ['headers', 'body', 'timeoutMs', 'stream']);
const FETCH_ANSWER: OperatorTypeRef = shape({ status: NUMBER, headers: list(FETCH_HEADER), body: BYTES, handle: NUMBER }, ['handle']);

export const OS_NET_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/fetch': {
    ...osEffect({
      answer: FETCH_ANSWER,
      grant: [],
      description: 'Ask a browser host to perform one HTTP fetch (the host owns no protocol: the kernel hands it the method, the url and the request bytes, and it answers the status, the response headers and the body bytes). The url\'s origin must be one the program declares in egress, else the kernel answers denied without asking the host. A non-2xx status is a success answer. A host with no fetch (every native host, which speaks HTTP over os/tcp-connect and os/tls-upgrade) answers kind unsupported. With request.stream true the host answers as soon as the head arrives: { status, headers, body: empty, handle }, and the body is read afterwards with os/recv on the handle (each answer { data, eof }, eof true once the body ended) and the handle is released with os/close; a native host answers unsupported either way. Success payload: { status, headers, body, handle? }.',
      params: [arg('method', STRING, 'HTTP method, e.g. GET'), arg('url', STRING, 'Absolute url; its origin is checked against egress'), arg('request', FETCH_REQUEST, 'Optional request: { headers?, body?, timeoutMs?, stream? }; body is bytes; timeoutMs bounds the wait for the head when stream is true', true)],
      example: '["os/fetch", "GET", "https://api.example.com/items", { "headers": [{ "name": "accept", "value": "application/json" }] }, { "emit": { "success": "FETCHED", "failure": "FETCH_FAILED" } }]',
    }),
    runsOn: 'any',
  },
  'os/tcp-connect': osEffect({
    answer: TLS_ANSWER,
    grant: [{ kind: 'net', access: ['tcp'], host: 0, port: 1 }],
    description: 'Open a TCP connection (grant net: tcp). Success payload: { sock }. With a third argument { serverName, ca?, alpn? } the kernel runs the TLS client handshake over the connected socket before answering (as os/tls-upgrade does) and the payload also carries alpn, the protocol the peer chose, when it chose one; a handshake or certificate failure answers { error, kind: "tls" } and closes the socket.',
    params: [arg('host', OS_HOST, 'Host name or address'), arg('port', OS_PORT, 'Port'), arg('tls', TLS_SPEC, 'Optional TLS: { serverName, ca?, alpn? }. serverName is verified against the certificate and must be a host the net grant names; ca is PEM roots, else the web roots; alpn lists protocol names in offer order', true)],
    example: '["os/tcp-connect", "db.internal", 5432, { "emit": { "success": "SOCK_OPENED", "failure": "NET_FAILED" } }]',
  }),
  'os/tcp-listen': osEffect({
    answer: shape({ sock: NUMBER, address: STRING, port: NUMBER }),
    events: shape({ sock: NUMBER, peer: STRING }),
    grant: [{ kind: 'net', access: ['listen'], host: 0, port: 1 }],
    description: 'Listen for TCP connections (grant net: listen). The first answer is { sock, address, port }, with the actual bound address and port (including an assigned ephemeral port); each connection arrives on the onMessage route as { sock, peer }. An accepted sock takes any number of os/send and os/recv until os/close (keep-alive, streamed replies); a keyed os/recv armed on it reports a client abort as { eof: true } or a closed failure, and os/close with that read pending ends the connection at once.',
    params: [arg('host', OS_HOST, 'Address to bind'), arg('port', OS_PORT, 'Port')],
    stream: true,
    example: '["os/tcp-listen", "0.0.0.0", 8080, { "key": "listener", "emit": { "success": "LISTENING", "failure": "NET_FAILED", "onMessage": "SOCK_ACCEPTED" } }]',
  }),
  'os/tls-upgrade': osEffect({
    answer: TLS_ANSWER,
    grant: [],
    description: 'Turn a connected socket into a TLS stream the kernel owns (serverName must be a host the net grant names). The kernel runs the client handshake as a journaled sequence of raw os/send and os/recv asks; a replay is byte-identical. Success payload: { sock, alpn? }, alpn being the protocol the peer chose from those offered; a handshake or certificate failure answers { error, kind: "tls" } and closes the socket. Afterwards os/send, os/recv and os/close on the socket carry plaintext; one os/send and one os/recv may be outstanding together.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('tls', TLS_SPEC, 'TLS: { serverName, ca?, alpn? }. serverName is verified against the certificate; ca is PEM roots, else the web roots; alpn lists protocol names in offer order')],
    example: '["os/tls-upgrade", "@payload.sock", { "serverName": "db.internal" }, { "emit": { "success": "TLS_READY", "failure": "NET_FAILED" } }]',
  }),
  'os/send': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [],
    description: 'Send on a connected socket (grant net). The data is bytes, or a list of { bytes, credential, encode?, scope? } segments written in order as one send: a segment is its bytes followed by the value of the credential it names, passed through its encode when it has one (base64 is standard padded base64, uri is encodeURIComponent, form is application/x-www-form-urlencoded with a space as +; any other value is refused), where the credential is a secret-typed @config knob (the empty string names none, so a segment of bytes alone), and the host fills the value in at the boundary, so the value never enters program data, the journal or the answer (the journal records the segment as the credential reference). A segment scope is app (the default: the app-wide credential) or user (the credential of the signed-in viewer of the dispatch, so two viewers send two values; a user segment with no signed-in viewer fails the send as denied before anything is written; any other scope is refused); the journal records the credential reference and its scope, never a value. A credential that is not held fails the send as denied before anything is written. Success payload: { bytes }. Sends on one socket are written in call order and never interleave. A keyed send under a declared route writes in the background and answers its route when the write ends (success { bytes }, or a failure such as timeout after the 5 s socket bound or closed), so a peer that stops reading does not hold the dispatch; an unkeyed send answers in place.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('data', OS_SEND_DATA, 'Content to send: bytes, or a list of { bytes, credential, encode?, scope? } segments')],
    example: '["os/send", "@payload.sock", "cGluZw==", { "emit": { "success": "SOCK_SENT", "failure": "NET_FAILED" } }]',
  }),
  'os/recv': {
    ...osEffect({
      answer: shape({ data: BYTES, eof: BOOLEAN }),
      grant: [],
      description: 'Receive from a connected socket (grant net), or the next bytes of a streamed os/fetch response (a browser host answers its handle; eof is true once the body ended). Success payload: { data: bytes, eof }.',
      params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('count', NUMBER, 'Maximum bytes to receive')],
      example: '["os/recv", "@payload.sock", 4096, { "emit": { "success": "SOCK_RECEIVED", "failure": "NET_FAILED" } }]',
    }),
    runsOn: 'any',
  },
  'os/udp-bind': osEffect({
    answer: shape({ sock: NUMBER }),
    grant: [{ kind: 'net', access: ['udp'], host: 0, port: 1 }],
    description: 'Bind a UDP socket (grant net: udp). Success payload: { sock }.',
    params: [arg('host', OS_HOST, 'Address to bind'), arg('port', OS_PORT, 'Port')],
    example: '["os/udp-bind", "0.0.0.0", 5353, { "emit": { "success": "SOCK_OPENED", "failure": "NET_FAILED" } }]',
  }),
  'os/sendto': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [{ kind: 'net', access: ['udp'], host: 2, port: 3 }],
    description: 'Send a UDP datagram (grant net: udp). Success payload: { bytes }.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('data', OS_DATA, 'Content to send'), arg('host', OS_HOST, 'Destination host'), arg('port', OS_PORT, 'Destination port')],
    example: '["os/sendto", "@payload.sock", "cGluZw==", "10.0.0.2", 5353, { "emit": { "success": "DATAGRAM_SENT", "failure": "NET_FAILED" } }]',
  }),
  'os/recvfrom': osEffect({
    answer: shape({ data: BYTES, peer: STRING }),
    grant: [],
    description: 'Receive a UDP datagram (grant net: udp). Success payload: { data: bytes, peer }.',
    params: [arg('sock', OS_HANDLE, 'Socket handle'), arg('count', NUMBER, 'Maximum bytes to receive')],
    example: '["os/recvfrom", "@payload.sock", 1500, { "emit": { "success": "DATAGRAM_RECEIVED", "failure": "NET_FAILED" } }]',
  }),
  'os/dns-resolve': osEffect({
    answer: shape({ addresses: list(STRING) }),
    grant: [{ kind: 'net', access: ['tcp', 'udp'], host: 0 }],
    description: 'Resolve a host name (grant net). Success payload: { addresses }.',
    params: [arg('name', STRING, 'Host name'), arg('family', union(lit(4), lit(6)), 'Address family: 4 or 6', true)],
    example: '["os/dns-resolve", "db.internal", { "emit": { "success": "DNS_RESOLVED", "failure": "NET_FAILED" } }]',
  }),
  'os/shutdown': osEffect({
    answer: shape({}),
    grant: [],
    description: 'Shut down a socket (grant net). Success payload: {}.',
    params: [arg('sock', OS_HANDLE, 'Socket handle')],
    example: '["os/shutdown", "@payload.sock", { "emit": { "success": "SOCK_SHUT", "failure": "NET_FAILED" } }]',
  }),
  'os/watch-port': osEffect({
    answer: shape({}),
    events: shape({ port: NUMBER, open: BOOLEAN }),
    grant: [],
    description: 'Watch a local port (grant net). Events are { port, open }. The options object also takes debounceMs.',
    params: [arg('port', OS_PORT, 'Port number to monitor'), arg('proto', union(lit('tcp'), lit('udp')), 'Protocol: "tcp" or "udp"')],
    stream: true,
    example: '["os/watch-port", 3000, "tcp", { "emit": { "success": "PORT_CHANGED", "failure": "WATCH_FAILED", "key": "port-3000" } }]',
  }),
};
