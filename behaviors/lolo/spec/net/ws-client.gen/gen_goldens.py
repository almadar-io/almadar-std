import json, base64, hashlib, sys

OUT = sys.argv[1]
GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
b64 = lambda raw: base64.b64encode(raw).decode()
KEY_RAW = b"the sample nonce"
KEY_URL = base64.urlsafe_b64encode(KEY_RAW).decode().rstrip("=")
KEY_STD = base64.b64encode(KEY_RAW).decode()
ACCEPT = base64.b64encode(hashlib.sha1((KEY_STD + GUID).encode()).digest()).decode()
assert KEY_STD == "dGhlIHNhbXBsZSBub25jZQ==" and ACCEPT == "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=", "RFC 6455 section 1.3 example"
MASK = bytes([0x37, 0xFA, 0x21, 0x3D])
MASK_URL = base64.urlsafe_b64encode(MASK).decode().rstrip("=")
MASK2 = bytes([0x01, 0x02, 0x03, 0x04])
MASK2_URL = base64.urlsafe_b64encode(MASK2).decode().rstrip("=")
HOST, PORT, PATH = "127.0.0.1", 9222, "/devtools/browser/abc"

cases = []


def case(id, steps, config=None, note=None):
    c = {"id": id}
    if note:
        c["note"] = note
    c["config"] = dict({"dynamicHost": True}, **(config or {}))
    c["steps"] = steps
    cases.append(c)


def step(event, payload, expect=None):
    s = {"event": event, "payload": payload}
    if expect:
        s["expect"] = expect
    return s


def request(host=HOST, port=PORT, path=PATH, tls=False, extra=()):
    hp = host if port == (443 if tls else 80) else "%s:%d" % (host, port)
    return ("GET %s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
            "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n%s\r\n"
            % (path, hp, KEY_STD, "".join("%s: %s\r\n" % kv for kv in extra))).encode()


def head101(accept=ACCEPT, extra=()):
    return ("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
            "Sec-WebSocket-Accept: %s\r\n%s\r\n" % (accept, "".join("%s: %s\r\n" % kv for kv in extra))).encode()


def read(data, eof=False):
    return {"data": b64(data), "eof": eof, "key": "read"}


def frame(op, payload=b"", fin=True, mask=None, rsv=0):
    b0 = (0x80 if fin else 0) | rsv | op
    n = len(payload)
    mbit = 0x80 if mask else 0
    if n < 126:
        h = bytes([b0, mbit | n])
    elif n < 65536:
        h = bytes([b0, mbit | 126]) + n.to_bytes(2, "big")
    else:
        h = bytes([b0, mbit | 127]) + n.to_bytes(8, "big")
    if mask:
        return h + mask + bytes(c ^ mask[i % 4] for i, c in enumerate(payload))
    return h + payload


def masked(op, payload):
    return frame(op, payload, mask=MASK)


WANT = {"type": "os/recv"}
DRAW = {"type": "random-bytes", "arg0": 4}


def open_steps(tls=False, headers=None, extra=(), read_tail=b"", proto=(), final_expect=None):
    hdrs = headers or []
    port = 443 if tls else PORT
    conn = {"type": "os/tcp-connect"}
    steps = [
        step("WS_OPEN", {"host": HOST, "port": port, "path": PATH, "tls": tls, "headers": hdrs},
             {"state": "connecting", "effects": [conn], "entity": {"host": HOST, "port": port, "tls": tls}}),
        step("WC_CONNECTED", {"sock": 5, "key": "connect"},
             {"state": "handshaking", "effects": [{"type": "random-bytes", "arg0": 16}]}),
        step("WC_KEYED", {"value": KEY_URL, "key": "key"},
             {"state": "handshaking", "effects": [{"type": "os/send"}], "entity": {"request": b64(request(HOST, port, PATH, tls, extra))}}),
        step("WC_SENT", {"bytes": 10, "key": "send"}, {"state": "handshaking", "effects": [WANT]}),
        step("WC_READ", read(head101(extra=proto) + read_tail),
             final_expect or {"state": "open", "emits": [{"event": "WS_OPENED", "payload": {"protocol": proto[0][1] if proto else ""}}], "effects": [WANT]}),
    ]
    return steps


def opened(**kw):
    return open_steps(**kw)


def after_open(*steps, **kw):
    return opened(**kw) + list(steps)


# 1 handshake
case("a-101-with-the-right-accept-key-opens-the-connection", open_steps(),
     note="RFC 6455 4.2.2: the accept is base64(SHA-1(key + GUID)); the Upgrade request carries the fresh key")
case("a-101-with-a-wrong-accept-key-fails-the-handshake",
     open_steps()[:4] + [step("WC_READ", read(head101(accept=b64(b"x" * 20))),
                              {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "handshake"}}],
                               "neverEmits": ["WS_OPENED"], "effects": [{"type": "os/close"}]})])
case("a-missing-accept-header-fails-the-handshake",
     open_steps()[:4] + [step("WC_READ", read(b"HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\n\r\n"),
                              {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "handshake"}}],
                               "neverEmits": ["WS_OPENED"]})])
case("a-non-101-reply-fails-the-handshake",
     open_steps()[:4] + [step("WC_READ", read(b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n"),
                              {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "handshake"}}],
                               "neverEmits": ["WS_OPENED"]})])
case("a-reply-head-split-across-reads-waits-for-the-rest",
     open_steps()[:4] + [step("WC_READ", read(head101()[:20]), {"state": "handshaking", "effects": [WANT], "neverEmits": ["WS_OPENED", "WS_FAILED"]}),
                         step("WC_READ", read(head101()[20:]), {"state": "open", "emits": [{"event": "WS_OPENED"}]})])
case("the-chosen-subprotocol-is-reported-and-extra-headers-are-written",
     open_steps(headers=[{"name": "Sec-WebSocket-Protocol", "value": "cdp"}, {"name": "Origin", "value": "http://x.test"}],
                extra=[("Sec-WebSocket-Protocol", "cdp"), ("Origin", "http://x.test")], proto=[("Sec-WebSocket-Protocol", "cdp")]))
case("tls-connects-offering-http-1-1-with-the-host-as-server-name",
     [step("WS_OPEN", {"host": HOST, "port": 443, "path": PATH, "tls": True, "headers": []},
           {"effects": [{"type": "os/tcp-connect", "arg2": {"serverName": ["default", "@payload.host", ""], "alpn": ["list", "http/1.1"]}}],
            "entity": {"tls": True, "host": HOST, "port": 443}})],
     note="the replay host grants no net entry, so the connect fails and routes to WC_IO_FAILED; the asserted effect is the call as written")
case("a-tls-request-omits-the-default-port-from-the-host-header",
     [dict(step("WC_KEYED", {"value": KEY_URL, "key": "key"},
                {"effects": [{"type": "os/send"}], "entity": {"request": b64(request(HOST, 443, PATH, True))}}),
           **{"from": "handshaking", "entity": {"id": "c", "sock": 5, "host": HOST, "port": 443, "path": PATH, "tls": True}})])
case("a-clear-text-open-does-not-offer-tls-options",
     [step("WS_OPEN", {"host": HOST, "port": 80, "path": PATH, "tls": False, "headers": []},
           {"state": "connecting", "effects": [{"type": "os/tcp-connect"}]}),
      step("WC_CONNECTED", {"sock": 5, "key": "connect"}, {"state": "handshaking"}),
      step("WC_KEYED", {"value": KEY_URL, "key": "key"},
           {"effects": [{"type": "os/send"}], "entity": {"request": b64(request(HOST, 80, PATH, False))}})])

# refusals
refuse = lambda p, cfg=None: [step("WS_OPEN", p, {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "refused"}}], "neverEmits": ["WS_OPENED"], "effects": []})]
base = {"host": HOST, "port": PORT, "path": PATH, "tls": False, "headers": []}
KN = {"dynamicHost": False, "host": "127.0.0.1", "port": 9222}
nohost = {"path": PATH, "headers": []}
case("a-knob-host-connects-without-dynamic-host",
     [step("WS_OPEN", nohost, {"state": "connecting", "effects": [{"type": "os/tcp-connect", "arg0": ["let", [["knob_host", "127.0.0.1", "{\"version\":1,\"type\":{\"kind\":\"string\"}}"]], "@knob_host"], "arg1": ["let", [["knob_port", 9222, "{\"version\":1,\"type\":{\"kind\":\"number\"}}"]], "@knob_port"]}],
                              "entity": {"host": HOST, "port": PORT, "tls": False}, "neverEmits": ["WS_FAILED"]}),
      step("WC_CONNECTED", {"sock": 5, "key": "connect"}, {"state": "handshaking"}),
      step("WC_KEYED", {"value": KEY_URL, "key": "key"}, {"effects": [{"type": "os/send"}], "entity": {"request": b64(request(HOST, PORT, PATH, False))}})],
     config=KN)
case("a-payload-host-is-ignored-when-dynamic-host-is-off",
     [step("WS_OPEN", {"host": "evil.test", "port": 1, "tls": True, "path": PATH, "headers": []},
           {"state": "connecting", "entity": {"host": HOST, "port": PORT, "tls": False}})], config=KN)
case("a-dynamic-host-uses-the-payload-host-and-not-the-knobs",
     [step("WS_OPEN", {"host": "other.test", "port": 81, "tls": False, "path": PATH, "headers": []},
           {"state": "connecting", "entity": {"host": "other.test", "port": 81}})], config={"dynamicHost": True, "host": HOST, "port": PORT})
case("a-knob-tls-connects-with-the-server-name-knob",
     [step("WS_OPEN", nohost, {"effects": [{"type": "os/tcp-connect", "arg2": {"serverName": "chrome.test", "alpn": ["list", "http/1.1"]}}],
                              "entity": {"tls": True, "host": HOST, "port": 443}})],
     config=dict(KN, tls=True, port=443, serverName="chrome.test"),
     note="the replay host grants no net entry, so the connect fails and routes to WC_IO_FAILED; the asserted effect is the call as written")
case("a-dynamic-open-without-a-host-is-refused",
     refuse(nohost), config={"dynamicHost": True})
case("a-knob-open-with-a-reserved-header-is-refused",
     refuse(dict(nohost, headers=[{"name": "Upgrade", "value": "x"}])), config=KN)
case("an-open-with-a-reserved-header-is-refused", refuse(dict(base, headers=[{"name": "Connection", "value": "close"}])))
case("an-open-with-a-path-without-a-slash-is-refused", refuse(dict(base, path="x")))
case("an-open-with-a-port-out-of-range-is-refused", refuse(dict(base, port=70000)))
case("an-open-with-a-control-character-in-a-header-is-refused", refuse(dict(base, headers=[{"name": "X-A", "value": "a\r\nb"}])))
case("an-open-with-an-allowed-header-is-not-refused",
     [step("WS_OPEN", dict(base, headers=[{"name": "X-A", "value": "ab"}]), {"state": "connecting", "neverEmits": ["WS_FAILED"]})])
case("a-send-before-the-connection-is-open-is-refused",
     [step("WS_SEND", {"text": "x"}, {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "refused"}}]})])
case("a-transport-failure-on-connect-keeps-the-host-kind",
     [step("WS_OPEN", base, {"state": "connecting"}),
      step("WC_IO_FAILED", {"error": "no route", "kind": "denied"}, {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "denied"}}]})])

# receiving
MSG = lambda text: {"event": "WS_MESSAGE", "payload": {"text": text, "binary": False}}
case("a-text-message-in-one-frame-is-delivered",
     after_open(step("WC_READ", read(frame(1, b"hello")), {"state": "open", "emits": [MSG("hello")], "neverEmits": ["WS_FAILED"], "effects": [WANT]})))
case("frame-bytes-after-the-reply-head-are-the-first-frame",
     open_steps(read_tail=frame(1, b"early"),
                final_expect={"state": "open", "emits": [{"event": "WS_OPENED"}, MSG("early")], "effects": [WANT]}))
case("a-frame-split-across-two-reads-waits-for-the-rest",
     after_open(step("WC_READ", read(frame(1, b"hello")[:4]), {"state": "open", "neverEmits": ["WS_MESSAGE", "WS_FAILED"], "effects": [WANT]}),
                step("WC_READ", read(frame(1, b"hello")[4:]), {"state": "open", "emits": [MSG("hello")], "effects": [WANT]})))
case("a-header-split-after-one-byte-waits-for-the-rest",
     after_open(step("WC_READ", read(frame(1, b"hello")[:1]), {"neverEmits": ["WS_MESSAGE", "WS_FAILED"], "effects": [WANT]}),
                step("WC_READ", read(frame(1, b"hello")[1:]), {"emits": [MSG("hello")]})))
case("two-frames-in-one-read-are-both-delivered",
     after_open(step("WC_READ", read(frame(1, b"a") + frame(1, b"b")),
                     {"emits": [MSG("a"), MSG("b")], "emitCounts": {"WS_MESSAGE": 2}})))
case("a-binary-frame-is-delivered-as-data",
     after_open(step("WC_READ", read(frame(2, b"\xff\x00\x01")),
                     {"emits": [{"event": "WS_MESSAGE", "payload": {"data": b64(b"\xff\x00\x01"), "binary": True}}], "neverEmits": ["WS_FAILED"]})))
case("a-message-fragmented-across-frames-is-joined",
     after_open(step("WC_READ", read(frame(1, b"Hel", fin=False)), {"neverEmits": ["WS_MESSAGE", "WS_FAILED"], "effects": [WANT]}),
                step("WC_READ", read(frame(0, b"l", fin=False)), {"neverEmits": ["WS_MESSAGE", "WS_FAILED"]}),
                step("WC_READ", read(frame(0, b"o")), {"emits": [MSG("Hello")], "emitCounts": {"WS_MESSAGE": 1}})))
case("a-fragmented-binary-message-is-joined-as-data",
     after_open(step("WC_READ", read(frame(2, b"\x01", fin=False)), {"neverEmits": ["WS_MESSAGE"]}),
                step("WC_READ", read(frame(0, b"\x02")), {"emits": [{"event": "WS_MESSAGE", "payload": {"data": b64(b"\x01\x02"), "binary": True}}]})))
case("a-ping-between-fragments-does-not-break-the-message",
     after_open(step("WC_READ", read(frame(1, b"He", fin=False)), {"neverEmits": ["WS_MESSAGE"]}),
                step("WC_READ", read(frame(9, b"p")), {"effects": [DRAW, WANT], "neverEmits": ["WS_MESSAGE", "WS_FAILED"]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(10, b"p"))}}),
                step("WC_READ", read(frame(0, b"y")), {"emits": [MSG("Hey")]})))
big16 = b"x" * 200
big64 = b"y" * 70000
case("a-16-bit-length-frame-is-delivered",
     after_open(step("WC_READ", read(frame(1, big16)), {"emits": [MSG(big16.decode())], "neverEmits": ["WS_FAILED"]})))
case("a-64-bit-length-frame-is-delivered",
     after_open(step("WC_READ", read(frame(1, big64)), {"emits": [MSG(big64.decode())], "neverEmits": ["WS_FAILED"]})))
case("a-64-bit-length-frame-split-across-reads-is-delivered",
     after_open(step("WC_READ", read(frame(1, big64)[:30000]), {"neverEmits": ["WS_MESSAGE", "WS_FAILED"], "effects": [WANT]}),
                step("WC_READ", read(frame(1, big64)[30000:]), {"emits": [MSG(big64.decode())]})))
case("a-125-byte-frame-uses-the-7-bit-length",
     after_open(step("WC_READ", read(frame(1, b"z" * 125)), {"emits": [MSG("z" * 125)]})))
case("a-64-bit-length-above-the-signed-range-fails-as-protocol",
     after_open(step("WC_READ", read(bytes([0x81, 127]) + (2**63).to_bytes(8, "big")),
                     {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "protocol"}}], "neverEmits": ["WS_MESSAGE"]})))

# ping, pong
case("a-ping-is-answered-with-a-pong-carrying-the-same-payload",
     after_open(step("WC_READ", read(frame(9, b"abc")), {"state": "open", "effects": [DRAW, WANT], "neverEmits": ["WS_MESSAGE", "WS_FAILED"]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(10, b"abc"))}}),
                step("WC_SENT", {"bytes": 9, "key": "send"}, {"state": "open", "neverEmits": ["WS_FAILED"]})))
case("a-pong-from-the-server-is-ignored",
     after_open(step("WC_READ", read(frame(10, b"abc")), {"state": "open", "effects": [WANT], "neverEmits": ["WS_MESSAGE", "WS_FAILED"]})))

# close
case("a-server-close-is-answered-and-ends-in-ws-closed",
     after_open(step("WC_READ", read(frame(8, (1000).to_bytes(2, "big") + b"bye")),
                     {"state": "open", "emits": [{"event": "WS_CLOSED", "payload": {"code": 1000, "reason": "bye"}}], "effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(8, (1000).to_bytes(2, "big") + b"bye"))}}),
                step("WC_SENT", {"bytes": 9, "key": "send"}, {"state": "closed", "effects": [{"type": "os/close"}]})))
case("a-server-close-without-a-payload-reports-1005",
     after_open(step("WC_READ", read(frame(8)), {"emits": [{"event": "WS_CLOSED", "payload": {"code": 1005, "reason": ""}}]})))
case("a-client-close-sends-a-close-frame-and-waits-for-the-peer",
     after_open(step("WS_CLOSE", {"code": 1000, "reason": "done"}, {"state": "open", "effects": [DRAW], "neverEmits": ["WS_CLOSED", "WS_FAILED"]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(8, (1000).to_bytes(2, "big") + b"done"))}}),
                step("WC_SENT", {"bytes": 9, "key": "send"}, {"state": "open", "neverEmits": ["WS_CLOSED"]}),
                step("WC_READ", read(frame(8, (1000).to_bytes(2, "big") + b"done")),
                     {"state": "closed", "emits": [{"event": "WS_CLOSED", "payload": {"code": 1000, "reason": "done"}}], "effects": [{"type": "os/close"}]})))
case("a-send-after-a-close-was-started-is-refused",
     after_open(step("WS_CLOSE", {}, {"effects": [DRAW]}),
                step("WS_SEND", {"text": "late"}, {"emits": [{"event": "WS_FAILED", "payload": {"kind": "refused"}}]})))
case("a-close-with-a-code-out-of-range-is-refused",
     after_open(step("WS_CLOSE", {"code": 999}, {"emits": [{"event": "WS_FAILED", "payload": {"kind": "refused"}}], "state": "open"})))
case("a-peer-that-drops-the-socket-without-a-close-frame-fails-as-io",
     after_open(step("WC_READ", read(b"", eof=True), {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "io"}}]})))
case("a-peer-that-drops-the-socket-after-our-close-ends-in-1006",
     after_open(step("WS_CLOSE", {}, {"effects": [DRAW]}),
                step("WC_READ", read(b"", eof=True), {"state": "closed", "emits": [{"event": "WS_CLOSED", "payload": {"code": 1006}}], "neverEmits": ["WS_FAILED"]})))
case("a-close-frame-with-a-one-byte-payload-fails-as-protocol",
     after_open(step("WC_READ", read(frame(8, b"\x03")), {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "protocol"}}], "neverEmits": ["WS_CLOSED"]})))

# sending
case("a-text-send-writes-one-masked-frame",
     after_open(step("WS_SEND", {"text": "Hello"}, {"state": "open", "effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(bytes.fromhex("818537fa213d7f9f4d5158"))}}),
                step("WC_SENT", {"bytes": 11, "key": "send"}, {"state": "open", "entity": {"busy": False}})),
     note="RFC 6455 5.7: a masked Hello is 81 85 37fa213d 7f9f4d5158")
case("a-different-mask-gives-different-wire-bytes",
     after_open(step("WS_SEND", {"text": "Hello"}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK2_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked_with := frame(1, b"Hello", mask=MASK2))}})))
case("a-binary-send-writes-a-binary-masked-frame",
     after_open(step("WS_SEND", {"data": b64(b"\x00\x01\x02\x03\x04\x05\x06")}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(2, b"\x00\x01\x02\x03\x04\x05\x06"))}})))
case("a-200-byte-send-uses-the-16-bit-length",
     after_open(step("WS_SEND", {"text": "q" * 200}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(1, b"q" * 200))}})))
case("a-70000-byte-send-uses-the-64-bit-length",
     after_open(step("WS_SEND", {"data": b64(b"w" * 70000)}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(2, b"w" * 70000))}})))
case("an-empty-text-send-writes-a-zero-length-frame",
     after_open(step("WS_SEND", {"text": ""}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(1, b""))}})))
case("a-send-naming-neither-text-nor-data-is-refused",
     after_open(step("WS_SEND", {}, {"state": "open", "effects": [], "emits": [{"event": "WS_FAILED", "payload": {"kind": "refused"}}]})))
case("a-send-naming-both-text-and-data-is-refused",
     after_open(step("WS_SEND", {"text": "a", "data": b64(b"b")}, {"state": "open", "effects": [], "emits": [{"event": "WS_FAILED", "payload": {"kind": "refused"}}]})))

# queued sends
case("sends-that-arrive-while-a-frame-is-in-flight-are-queued-in-order",
     after_open(step("WS_SEND", {"text": "a"}, {"effects": [DRAW]}),
                step("WS_SEND", {"text": "b"}, {"effects": [], "neverEmits": ["WS_FAILED"]}),
                step("WS_SEND", {"data": b64(b"c")}, {"effects": [], "neverEmits": ["WS_FAILED"]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(1, b"a"))}}),
                step("WC_SENT", {"bytes": 7, "key": "send"}, {"effects": [DRAW], "entity": {"busy": True}}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(1, b"b"))}}),
                step("WC_SENT", {"bytes": 7, "key": "send"}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(2, b"c"))}}),
                step("WC_SENT", {"bytes": 7, "key": "send"}, {"effects": [], "entity": {"busy": False}})))
case("a-send-after-the-queue-drained-draws-a-fresh-mask-at-once",
     after_open(step("WS_SEND", {"text": "a"}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}]}),
                step("WC_SENT", {"bytes": 7, "key": "send"}, {"entity": {"busy": False}}),
                step("WS_SEND", {"text": "b"}, {"effects": [DRAW]})))
case("a-pong-and-a-send-in-flight-are-written-one-after-the-other",
     after_open(step("WS_SEND", {"text": "a"}, {"effects": [DRAW]}),
                step("WC_READ", read(frame(9, b"p")), {"effects": [WANT]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(1, b"a"))}}),
                step("WC_SENT", {"bytes": 7, "key": "send"}, {"effects": [DRAW]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}], "entity": {"wire": b64(masked(10, b"p"))}})))

# limits and protocol errors
PROTO = lambda: {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "protocol"}}], "neverEmits": ["WS_MESSAGE"]}
case("a-message-longer-than-max-message-fails-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"x" * 11)), PROTO()), ), config={"maxMessage": 10})
case("a-message-exactly-max-message-long-is-delivered",
     after_open(step("WC_READ", read(frame(1, b"x" * 10)), {"state": "open", "emits": [MSG("x" * 10)], "neverEmits": ["WS_FAILED"]})), config={"maxMessage": 10})
case("fragments-together-longer-than-max-message-fail-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"x" * 6, fin=False)), {"state": "open", "neverEmits": ["WS_FAILED"]}),
                step("WC_READ", read(frame(0, b"x" * 5)), PROTO())), config={"maxMessage": 10})
case("fragments-together-exactly-max-message-long-are-delivered",
     after_open(step("WC_READ", read(frame(1, b"x" * 6, fin=False)), {"state": "open"}),
                step("WC_READ", read(frame(0, b"x" * 4)), {"state": "open", "emits": [MSG("x" * 10)], "neverEmits": ["WS_FAILED"]})), config={"maxMessage": 10})
case("a-text-message-with-invalid-utf8-fails-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"ab\xff")), PROTO())))
case("a-text-message-with-valid-multibyte-utf8-is-delivered",
     after_open(step("WC_READ", read(frame(1, "héllo —".encode())), {"emits": [MSG("héllo —")], "neverEmits": ["WS_FAILED"]})))
case("a-fragmented-text-message-with-invalid-utf8-fails-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"a\xc3", fin=False)), {"state": "open", "neverEmits": ["WS_FAILED"]}),
                step("WC_READ", read(frame(0, b"(")), PROTO())))
case("a-multibyte-character-split-across-fragments-is-delivered",
     after_open(step("WC_READ", read(frame(1, b"a\xc3", fin=False)), {"state": "open"}),
                step("WC_READ", read(frame(0, b"\xa9")), {"emits": [MSG("aé")], "neverEmits": ["WS_FAILED"]})))
case("a-binary-message-with-bytes-that-are-not-utf8-is-delivered",
     after_open(step("WC_READ", read(frame(2, b"\xff\xfe")), {"emits": [{"event": "WS_MESSAGE", "payload": {"binary": True}}], "neverEmits": ["WS_FAILED"]})))
case("a-masked-server-frame-fails-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"hi", mask=MASK)), PROTO())))
case("a-frame-with-a-reserved-bit-fails-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"hi", rsv=0x40)), PROTO())))
case("a-frame-with-an-unknown-opcode-fails-as-protocol",
     after_open(step("WC_READ", read(frame(3, b"hi")), PROTO())))
case("a-continuation-without-a-message-fails-as-protocol",
     after_open(step("WC_READ", read(frame(0, b"hi")), PROTO())))
case("a-new-message-inside-a-fragmented-one-fails-as-protocol",
     after_open(step("WC_READ", read(frame(1, b"a", fin=False)), {"state": "open"}),
                step("WC_READ", read(frame(1, b"b")), PROTO())))
case("a-fragmented-control-frame-fails-as-protocol",
     after_open(step("WC_READ", read(frame(9, b"a", fin=False)), PROTO())))
case("a-control-frame-longer-than-125-bytes-fails-as-protocol",
     after_open(step("WC_READ", read(frame(9, b"a" * 126)), PROTO())))
case("a-read-failure-while-open-fails-as-io",
     after_open(step("WC_IO_FAILED", {"error": "reset", "kind": "io"}, {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "io"}}]})))
case("a-reopen-after-a-close-starts-from-a-clean-state",
     after_open(step("WC_READ", read(frame(1, b"a", fin=False)), {"state": "open"}),
                step("WC_READ", read(frame(8)), {"emits": [{"event": "WS_CLOSED"}]}),
                step("WC_MASKED", {"value": MASK_URL, "key": "mask"}, {"effects": [{"type": "os/send"}]}),
                step("WC_SENT", {"bytes": 6, "key": "send"}, {"state": "closed"}),
                step("WS_OPEN", base, {"state": "connecting", "entity": {"fragging": False, "closing": False, "busy": False}})))


PROBE_OPEN = {"event": "WC_WANT", "payload": {}, "expect": {"state": "open", "effects": [{"type": "os/recv"}]}}
PROBE_CLOSED = {"event": "WS_SEND", "payload": {"text": "x"}, "expect": {"state": "closed", "emits": [{"event": "WS_FAILED", "payload": {"kind": "refused", "error": "the connection is not open"}}]}}


def finalize(steps):
    out = []
    for st in steps:
        st = json.loads(json.dumps(st))
        ex = st.get("expect")
        if st["event"] == "WC_READ" and ex:
            want_state = ex.pop("state", None)
            effects = ex.pop("effects", None)
            ent = ex.setdefault("entity", {}) if effects else ex.get("entity")
            for e in effects or []:
                if e["type"] == "random-bytes":
                    ent["busy"] = True
                elif e["type"] == "os/close":
                    ent["sock"] = -1
                elif e["type"] == "os/recv":
                    ex.setdefault("emits", []).append({"event": "WC_WANT"})
            if not ex.get("entity"):
                ex.pop("entity", None)
            out.append(st)
            if want_state == "open":
                out.append(json.loads(json.dumps(PROBE_OPEN)))
            elif want_state == "closed":
                out.append(json.loads(json.dumps(PROBE_CLOSED)))
            continue
        out.append(st)
    return out


for c in cases:
    c["steps"] = finalize(c["steps"])

json.dump({"atom": "net/atoms/std-ws-client.lolo", "trait": "WsClient", "spec": "spec/net/ws-client.lolo",
           "note": "RFC 6455 client: handshake accept check, frame decode (7/16/64-bit lengths, fragments, ping, close), masked sends (RFC 5.7 example), queued sends, limits and protocol errors; generated by ws-client.gen/gen_goldens.py",
           "cases": cases}, open(OUT, "w"), indent=1)
