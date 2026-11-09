import json, sys

CAP = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
cases = []


def case(id, steps, note=None, config=None):
    c = {"id": id}
    if note:
        c["note"] = note
    if config:
        c["config"] = config
    c["defaults"] = ["CdpHttp", "CdpWs", "CdpDelay"]
    c["steps"] = steps
    cases.append(c)


def step(event, payload, expect=None, **seed):
    s = {"event": event, "payload": payload}
    s.update(seed)
    if expect:
        s["expect"] = expect
    return s


def emit(event, payload=None):
    e = {"event": event}
    if payload is not None:
        e["payload"] = payload
    return e


def err(key, method, code):
    return emit("CDP_ERROR", {"key": key, "method": method, "code": code})


def cmd(key, method, params="{}", session=None):
    p = {"key": key, "method": method, "paramsJson": params}
    if session:
        p["sessionId"] = session
    return p


def msg(text):
    return {"text": text, "binary": False}


def pend(*rows):
    return [{"id": i, "key": k, "method": m} for i, k, m in rows]


def connected(pending=(), next_id=1):
    return {"from": "connected", "entity": {"id": "c", "nextId": next_id, "pending": pend(*pending), "closing": False}}


VERSION = json.loads(CAP["versionBody"])
PATH = CAP["path"]
BROWSER = VERSION["Browser"]
REPLY, ERROR, EVENT = CAP["reply"], CAP["error"], CAP["event"]
GET_VERSION = "Browser.getVersion"

# connect
case("connect-reads-json-version-opens-the-socket-and-answers-connected", [
    step("CDP_CONNECT", {}, {"state": "connecting", "emits": [emit("CDP_HTTP_SEND", {"key": "cdp-version", "method": "GET", "target": "/json/version", "stream": "none"})]}),
    step("CDP_VERSION", {"status": 200, "body": CAP["versionBody"]}, {"state": "connecting", "emits": [emit("CDP_PROBED", {"browser": BROWSER, "path": PATH}), emit("CDP_WS_OPEN", {"path": PATH})], "entity": {"browser": BROWSER}, "neverEmits": ["CDP_CONNECT_FAILED", "CDP_FAILED"]}),
    step("CDP_WS_OPENED", {}, {"state": "connected", "emits": [emit("CDP_CONNECTED", {"browser": BROWSER})]}, **{"from": "connecting", "entity": {"id": "c", "browser": BROWSER}}),
], note="the version body and socket path are captured from real headless Chrome by cdp.gen/capture.py")

case("connect-control-a-port-that-answers-500-fails-with-kind-http", [
    step("CDP_CONNECT", {}, {"state": "connecting"}),
    step("CDP_VERSION", {"status": 500, "body": ""}, {"state": "connecting", "emits": [emit("CDP_CONNECT_FAILED", {"kind": "http"}), emit("CDP_FAILED", {"kind": "http"})], "neverEmits": ["CDP_PROBED", "CDP_CONNECTED"]}),
    step("CDP_COMMAND", cmd("a", GET_VERSION), {"state": "disconnected", "emits": [err("a", GET_VERSION, "not-connected")]}),
])
case("connect-control-a-body-that-is-not-the-version-document-fails-with-kind-protocol", [
    step("CDP_CONNECT", {}, {"state": "connecting"}),
    step("CDP_VERSION", {"status": 200, "body": "{\"Browser\":\"x\"}"}, {"emits": [emit("CDP_CONNECT_FAILED", {"kind": "protocol"})], "neverEmits": ["CDP_PROBED"]}),
])
case("connect-control-a-socket-url-without-a-path-fails-with-kind-protocol", [
    step("CDP_CONNECT", {}, {"state": "connecting"}),
    step("CDP_VERSION", {"status": 200, "body": "{\"Browser\":\"x\",\"webSocketDebuggerUrl\":\"ws://127.0.0.1:9222\"}"}, {"emits": [emit("CDP_CONNECT_FAILED", {"kind": "protocol"})], "neverEmits": ["CDP_PROBED"]}),
])
case("connect-a-transport-failure-of-the-socket-answers-cdp-failed-with-its-kind", [
    step("CDP_WS_FAILED", {"error": "bad accept", "kind": "handshake"}, {"state": "disconnected", "emits": [emit("CDP_FAILED", {"error": "bad accept", "kind": "handshake"})], "neverEmits": ["CDP_CONNECTED"]}, **{"from": "connecting"}),
])
case("connect-control-a-second-connect-while-connecting-or-connected-is-refused-and-changes-nothing", [
    step("CDP_CONNECT", {}, {"state": "connecting", "emits": [emit("CDP_FAILED", {"kind": "busy"})], "neverEmits": ["CDP_HTTP_SEND"]}, **{"from": "connecting"}),
    step("CDP_CONNECT", {}, {"state": "connected", "emits": [emit("CDP_FAILED", {"kind": "connected"})], "neverEmits": ["CDP_HTTP_SEND"]}, **connected()),
])

# command and reply
WIRE1 = '{"id":1,"method":"Browser.getVersion","params":{}}'
case("a-command-writes-the-assembled-frame-and-its-reply-is-routed-by-id", [
    step("CDP_COMMAND", cmd("a", GET_VERSION), {"state": "connected", "entity": {"wire": WIRE1, "nextId": 2, "pending": pend((1, "a", GET_VERSION))},
         "emits": [emit("CDP_TIMER_ARM", {"key": "1", "delayMs": 30000}), emit("CDP_WS_SEND", {"text": WIRE1})]}, **connected()),
    step("CDP_WS_MESSAGE", msg(REPLY), {"state": "connected", "emits": [emit("CDP_TIMER_CANCEL", {"key": "1"}), emit("CDP_REPLY", {"key": "a", "method": GET_VERSION, "frame": REPLY})],
         "neverEmits": ["CDP_ERROR", "CDP_STRAY"], "entity": {"pending": []}}),
], note="the reply frame is the real Browser.getVersion answer of headless Chrome")

WIRE_S = '{"id":1,"method":"Page.enable","sessionId":"SESS","params":{"a":[1,"x"]}}'
case("a-command-with-a-session-and-params-carries-both-in-the-frame", [
    step("CDP_COMMAND", cmd("a", "Page.enable", '{"a":[1,"x"]}', "SESS"), {"entity": {"wire": WIRE_S}, "emits": [emit("CDP_WS_SEND", {"text": WIRE_S})]}, **connected()),
])
case("control-a-command-without-a-session-has-no-sessionId-in-the-frame", [
    step("CDP_COMMAND", cmd("a", "Page.enable", '{"a":[1,"x"]}'), {"entity": {"wire": '{"id":1,"method":"Page.enable","params":{"a":[1,"x"]}}'}}, **connected()),
])
case("a-command-whose-params-are-not-json-answers-bad-params-and-writes-nothing", [
    step("CDP_COMMAND", cmd("a", GET_VERSION, "{oops"), {"state": "connected", "emits": [err("a", GET_VERSION, "bad-params")], "neverEmits": ["CDP_WS_SEND", "CDP_TIMER_ARM"], "entity": {"nextId": 1, "pending": []}}, **connected()),
])

# error reply
case("an-error-reply-answers-cdp-error-with-the-protocol-code-and-message", [
    step("CDP_WS_MESSAGE", msg(ERROR), {"state": "connected", "emits": [emit("CDP_ERROR", {"key": "b", "method": "Nope.nothing", "code": "-32601", "message": "'Nope.nothing' wasn't found"})],
         "neverEmits": ["CDP_REPLY"], "entity": {"pending": []}}, **connected([(2, "b", "Nope.nothing")], 3)),
], note="the error frame is the real answer of headless Chrome to an unknown method")
case("control-a-reply-with-a-result-and-the-same-id-is-not-an-error", [
    step("CDP_WS_MESSAGE", msg('{"id":2,"result":{}}'), {"emits": [emit("CDP_REPLY", {"key": "b", "method": "Nope.nothing"})], "neverEmits": ["CDP_ERROR"]}, **connected([(2, "b", "Nope.nothing")], 3)),
])

# two in flight
case("two-commands-in-flight-are-answered-out-of-order-each-to-its-own-key", [
    step("CDP_COMMAND", cmd("a", "A.one"), {"entity": {"nextId": 2}}, **connected()),
    step("CDP_COMMAND", cmd("b", "B.two"), {"entity": {"nextId": 3, "wire": '{"id":2,"method":"B.two","params":{}}', "pending": pend((1, "a", "A.one"), (2, "b", "B.two"))}}),
    step("CDP_WS_MESSAGE", msg('{"id":2,"result":{"v":2}}'), {"emits": [emit("CDP_REPLY", {"key": "b", "method": "B.two", "frame": '{"id":2,"result":{"v":2}}'})], "entity": {"pending": pend((1, "a", "A.one"))}}),
    step("CDP_WS_MESSAGE", msg('{"id":1,"result":{"v":1}}'), {"emits": [emit("CDP_REPLY", {"key": "a", "method": "A.one", "frame": '{"id":1,"result":{"v":1}}'})], "entity": {"pending": []}, "neverEmits": ["CDP_STRAY"]}),
])

# events
SESSION_EVENT = '{"method":"Page.loadEventFired","sessionId":"S1","params":{"timestamp":1}}'
case("a-frame-with-a-method-and-no-id-answers-cdp-event", [
    step("CDP_WS_MESSAGE", msg(EVENT), {"emits": [emit("CDP_EVENT", {"method": "Target.targetCreated", "frame": EVENT})], "neverEmits": ["CDP_REPLY", "CDP_ERROR", "CDP_STRAY"], "entity": {"pending": pend((1, "a", "A.one"))}}, **connected([(1, "a", "A.one")], 2)),
], note="the event frame is a real Target.targetCreated of headless Chrome; control: the pending command is untouched")
case("an-event-with-a-session-carries-its-sessionId", [
    step("CDP_WS_MESSAGE", msg(SESSION_EVENT), {"emits": [emit("CDP_EVENT", {"method": "Page.loadEventFired", "sessionId": "S1", "frame": SESSION_EVENT})]}, **connected()),
])

# timeout
case("a-command-still-pending-at-its-deadline-answers-timeout-and-is-forgotten", [
    step("CDP_TIMEOUT", {"key": "1"}, {"emits": [err("a", "A.one", "timeout")], "entity": {"pending": pend((2, "b", "B.two"))}, "neverEmits": ["CDP_STRAY"]}, **connected([(1, "a", "A.one"), (2, "b", "B.two")], 3)),
    step("CDP_WS_MESSAGE", msg('{"id":1,"result":{}}'), {"emits": [emit("CDP_STRAY", {"reason": "unknown-id"})], "neverEmits": ["CDP_REPLY"]}),
], note="control: the other command stays pending and the late reply of the timed-out one is a stray")
case("control-a-timer-of-a-command-already-answered-is-a-stray-not-an-error", [
    step("CDP_TIMEOUT", {"key": "7"}, {"emits": [emit("CDP_STRAY", {"reason": "timer-without-command"})], "neverEmits": ["CDP_ERROR"], "entity": {"pending": pend((1, "a", "A.one"))}}, **connected([(1, "a", "A.one")], 2)),
])
case("timeoutMs-sets-the-deadline-armed-for-a-command", [
    step("CDP_COMMAND", cmd("a", "A.one"), {"emits": [emit("CDP_TIMER_ARM", {"key": "1", "delayMs": 5000})]}, **connected()),
], config={"timeoutMs": 5000})

# disconnect
case("disconnect-closes-the-socket-then-fails-every-pending-command-oldest-first", [
    step("CDP_DISCONNECT", {}, {"state": "connected", "emits": [emit("CDP_WS_CLOSE")], "entity": {"closing": True}}, **connected([(1, "a", "A.one"), (2, "b", "B.two")], 3)),
    step("CDP_COMMAND", cmd("c", "C.three"), {"emits": [err("c", "C.three", "not-connected")], "neverEmits": ["CDP_WS_SEND"]}),
    step("CDP_WS_CLOSED", {"code": 1000, "reason": ""}, {"state": "disconnected", "emits": [err("a", "A.one", "disconnected"), err("b", "B.two", "disconnected"), emit("CDP_DISCONNECTED", {"reason": "closed 1000: "})], "entity": {"pending": []}}),
])
case("a-lost-connection-fails-pending-commands-with-the-failure-as-the-reason", [
    step("CDP_WS_FAILED", {"error": "reset", "kind": "io"}, {"state": "disconnected", "emits": [emit("CDP_ERROR", {"key": "a", "code": "disconnected", "message": "failed io: reset"}), emit("CDP_DISCONNECTED", {"reason": "failed io: reset"})]}, **connected([(1, "a", "A.one")], 2)),
])
case("control-a-refused-socket-failure-keeps-the-connection-and-its-pending-commands", [
    step("CDP_WS_FAILED", {"error": "closing", "kind": "refused"}, {"state": "connected", "emits": [emit("CDP_STRAY", {"reason": "ws-refused"})], "neverEmits": ["CDP_DRAIN", "CDP_DISCONNECTED"], "entity": {"pending": pend((1, "a", "A.one"))}}, **connected([(1, "a", "A.one")], 2)),
])
case("disconnect-with-no-connection-answers-disconnected-at-once", [
    step("CDP_DISCONNECT", {}, {"state": "disconnected", "emits": [emit("CDP_DISCONNECTED")]}),
])

# before connect
case("a-command-before-the-connection-is-open-answers-not-connected", [
    step("CDP_COMMAND", cmd("a", GET_VERSION), {"state": "disconnected", "emits": [err("a", GET_VERSION, "not-connected")], "neverEmits": ["CDP_WS_SEND", "CDP_TIMER_ARM"]}),
    step("CDP_COMMAND", cmd("b", GET_VERSION), {"state": "connecting", "emits": [err("b", GET_VERSION, "not-connected")], "neverEmits": ["CDP_WS_SEND"]}, **{"from": "connecting"}),
], note="control: the same command in the connected state writes a frame (the command cases above)")

# strays
case("a-reply-with-an-unknown-id-is-a-stray-and-leaves-the-pending-command", [
    step("CDP_WS_MESSAGE", msg('{"id":9,"result":{}}'), {"emits": [emit("CDP_STRAY", {"reason": "unknown-id"})], "neverEmits": ["CDP_REPLY", "CDP_ERROR"], "entity": {"pending": pend((1, "a", "A.one"))}}, **connected([(1, "a", "A.one")], 2)),
])
case("a-frame-that-is-not-json-is-a-stray-unparseable", [
    step("CDP_WS_MESSAGE", msg("not json"), {"emits": [emit("CDP_STRAY", {"reason": "unparseable", "frame": "not json"})], "neverEmits": ["CDP_REPLY", "CDP_EVENT"]}, **connected()),
])
case("a-frame-with-neither-id-nor-method-is-a-stray", [
    step("CDP_WS_MESSAGE", msg('{"result":{}}'), {"emits": [emit("CDP_STRAY", {"reason": "no-id-no-method"})], "neverEmits": ["CDP_EVENT"]}, **connected()),
])
case("a-binary-message-is-a-stray", [
    step("CDP_WS_MESSAGE", {"binary": True}, {"emits": [emit("CDP_STRAY", {"reason": "binary"})], "neverEmits": ["CDP_REPLY"]}, **connected()),
])

json.dump({"atom": "net/atoms/std-cdp.lolo", "trait": "Cdp", "spec": "spec/net/cdp.lolo",
           "note": "CDP client: connect via /json/version, command frames, id routing, errors, events, per-command timeout, disconnect drain, strays; the version body, reply, error and event frames are captured from real headless Chrome by cdp.gen/capture.py (python3 -I capture.py capture.json; python3 -I gen_goldens.py capture.json ../cdp.replay.goldens.json)",
           "cases": cases}, open(OUT, "w"), indent=1)
