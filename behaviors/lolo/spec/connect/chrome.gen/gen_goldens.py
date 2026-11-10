import json, sys

CAP = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
SESS, TARGET, DL = CAP["sessionId"], CAP["targetId"], "/work/downloads"
cases = []
DEFAULTS = []
BASE_CONFIG = {
    "scriptDir": "node_modules/",
    "profileDir": {"anchor": "cwd", "path": "profile"},
    "downloadDir": {"anchor": "cwd", "path": "downloads"},
    "preferencesDir": {"anchor": "cwd", "path": "profile/Default"},
    "preferencesFile": {"anchor": "cwd", "path": "profile/Default/Preferences"},
}


def case(id, steps, note=None, config=None):
    c = {"id": id}
    if note:
        c["note"] = note
    merged = dict(BASE_CONFIG)
    merged.update(config or {})
    c["config"] = merged
    c["defaults"] = DEFAULTS
    cur = None
    for st in steps:
        if "from" in st:
            cur = st["from"]
        elif cur is not None:
            st["from"] = cur
        ex = st.get("expect", {})
        if "state" in ex:
            cur = ex["state"]
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


def ready(**extra):
    e = {"id": "t", "sessionId": SESS, "targetId": TARGET, "url": "", "downloadPath": DL, "browser": "Chrome/156"}
    e.update(extra)
    return {"from": "ready", "entity": e}


def busy(op, stage, key="k1", **extra):
    e = {"id": "t", "sessionId": SESS, "targetId": TARGET, "url": "", "downloadPath": DL, "op": op, "stage": stage, "callerKey": key}
    e.update(extra)
    return {"from": "busy", "entity": e}


def cmd(key, method, params=None, session=True):
    p = {"key": key, "method": method}
    if session:
        p["sessionId"] = SESS
    if params is not None:
        p["paramsJson"] = params
    return emit("CDP_COMMAND", p)


def reply(key, method, frame):
    return {"key": key, "method": method, "frame": frame}


def event(method, frame, session=SESS):
    return {"method": method, "sessionId": session, "frame": frame}


def failed(key, code, extra=None):
    p = {"key": key, "code": code}
    if extra:
        p.update(extra)
    return emit("PAGE_FAILED", p)


def val(blob):
    return json.loads(json.loads(blob["reply"])["result"]["result"]["value"])


def ev_with(blob, prefix, nosub=None):
    for e in blob["events"]:
        if e.startswith('{"method":"%s"' % prefix) and (nosub is None or nosub not in e):
            return e
    raise KeyError(prefix)


R = lambda name: CAP[name]["reply"]
NAVINFO = val(CAP["navInfo"])
LOAD = ev_with(CAP["navigate"], "Page.loadEventFired")
FRAMENAV = ev_with(CAP["click"], "Page.frameNavigated", '"parentId"')
BEGIN = next(e for e in CAP["dlEvents"] if e.startswith('{"method":"Browser.downloadWillBegin"'))
PROGRESS = [e for e in CAP["dlEvents"] if e.startswith('{"method":"Browser.downloadProgress"')]
INPROG = next(e for e in PROGRESS if '"inProgress"' in e)
DONE = next(e for e in PROGRESS if '"completed"' in e)
DONE_J = json.loads(DONE)["params"]
BEGIN_J = json.loads(BEGIN)["params"]
CANCELED = DONE.replace('"completed"', '"canceled"')
LINKS = CAP["linkList"]
START_PATHS = "/work/profile"

# ---------------- start
CREATE, ATTACH = R("create"), R("attach")
VERSION = json.loads(CAP["versionBody"])["Browser"]
case("start-creates-directories-writes-preferences-launches-connects-attaches-and-answers-ready", [
    step("CHROME_START", {}, {"state": "starting", "effects": [{"type": "os/mkdir"}]}, **{"from": "stopped", "entity": {"id": "t"}}),
    step("CHROME_DIR_MADE", {}, {"state": "starting", "effects": [{"type": "os/realpath"}]}),
    step("CHROME_PATH_RESOLVED", {"path": START_PATHS}, {"state": "starting", "effects": [{"type": "os/write-file"}], "entity": {"profilePath": START_PATHS}}),
    step("CHROME_FILE_WROTE", {}, {"state": "starting", "effects": [{"type": "os/mkdir"}]}),
    step("CHROME_DIR_MADE", {}, {"state": "starting", "effects": [{"type": "os/realpath"}]}),
    step("CHROME_PATH_RESOLVED", {"path": DL}, {"state": "starting", "entity": {"downloadPath": DL},
         "emits": [emit("DAEMON_START", {"argv": ["--headless=new", "--remote-debugging-port=9222", "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1280,800", "--user-data-dir=" + START_PATHS, "about:blank"]})]}),
    step("CHROME_DAEMON_READY", {"pid": 4242, "reused": False}, {"state": "starting", "emits": [emit("CDP_CONNECT", {})]}),
    step("CHROME_CONNECTED", {"browser": VERSION}, {"state": "starting", "emits": [cmd("create", "Target.createTarget", '{"url":"about:blank"}', False)]}),
    step("CHROME_REPLY", reply("create", "Target.createTarget", CREATE), {"state": "starting", "entity": {"targetId": TARGET},
         "emits": [cmd("attach", "Target.attachToTarget", '{"targetId":"%s","flatten":true}' % TARGET, False)]}),
    step("CHROME_REPLY", reply("attach", "Target.attachToTarget", ATTACH), {"state": "starting", "entity": {"sessionId": SESS},
         "emits": [cmd("enable-page", "Page.enable", "{}")]}),
    step("CHROME_REPLY", reply("enable-page", "Page.enable", R("enablePage")), {"emits": [cmd("enable-runtime", "Runtime.enable", "{}")]}),
    step("CHROME_REPLY", reply("enable-runtime", "Runtime.enable", R("enableRuntime")), {"emits": [cmd("enable-ax", "Accessibility.enable", "{}")]}),
    step("CHROME_REPLY", reply("enable-ax", "Accessibility.enable", R("enableAx")),
         {"emits": [cmd("download", "Browser.setDownloadBehavior", json.dumps({"behavior": "allow", "downloadPath": DL, "eventsEnabled": True}, separators=(",", ":")), False)]}),
    step("CHROME_REPLY", reply("download", "Browser.setDownloadBehavior", R("download")), {"state": "ready", "emits": [emit("CHROME_READY", {"browser": VERSION})]}),
], note="the version, target, session and download-behavior replies are captured from real headless Chrome by chrome.gen/capture.py")

case("start-control-empty-preferences-skip-the-write-and-go-straight-to-the-download-directory", [
    step("CHROME_PATH_RESOLVED", {"path": START_PATHS}, {"state": "starting", "effects": [{"type": "os/mkdir"}], "neverEmits": ["DAEMON_START"]}, **{"from": "starting", "entity": {"id": "t", "stage": "rp-profile"}}),
], config={"preferences": ""})
case("start-control-with-preferences-the-same-answer-writes-the-file", [
    step("CHROME_PATH_RESOLVED", {"path": START_PATHS}, {"state": "starting", "effects": [{"type": "os/write-file"}]}, **{"from": "starting", "entity": {"id": "t", "stage": "rp-profile"}}),
])
case("start-extra-args-follow-about-blank", [
    step("CHROME_PATH_RESOLVED", {"path": DL}, {"emits": [emit("DAEMON_START", {"argv": ["--headless=new", "--remote-debugging-port=9333", "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=800,600", "--user-data-dir=/work/profile", "about:blank", "--no-sandbox"]})]},
         **{"from": "starting", "entity": {"id": "t", "stage": "rp-download", "profilePath": START_PATHS}}),
], config={"port": 9333, "windowWidth": 800, "windowHeight": 600, "extraArgs": ["--no-sandbox"]})
case("start-the-daemon-failing-answers-chrome-failed-and-stays-stopped", [
    step("CHROME_DAEMON_FAILED", {"code": "daemon_timeout", "message": "no port"}, {"state": "stopped", "emits": [emit("CHROME_FAILED", {"code": "daemon_timeout"})], "neverEmits": ["CHROME_READY"]},
         **{"from": "starting", "entity": {"id": "t", "stage": "launch"}}),
])
case("start-a-connection-failure-answers-chrome-failed-and-stops-the-daemon", [
    step("CHROME_CDP_FAILED", {"error": "refused", "kind": "http"}, {"state": "stopped", "emits": [emit("CHROME_FAILED", {"code": "http", "message": "refused"}), emit("DAEMON_STOP", {})]},
         **{"from": "starting", "entity": {"id": "t", "stage": "connect"}}),
])
case("start-a-protocol-error-in-a-step-answers-chrome-failed-and-tears-down", [
    step("CHROME_ERROR", {"key": "create", "method": "Target.createTarget", "code": "-32000", "message": "no target"},
         {"state": "starting", "emits": [emit("CHROME_START_FAILED", {"code": "-32000", "message": "no target"})]},
         **{"from": "starting", "entity": {"id": "t", "stage": "create"}}),
    step("CHROME_START_FAILED", {"code": "-32000", "message": "no target"},
         {"state": "stopped", "emits": [emit("CHROME_FAILED", {"code": "-32000", "message": "no target"}), emit("CDP_DISCONNECT", {}), emit("DAEMON_STOP", {})]}),
])
case("start-control-an-error-for-another-key-does-not-fail-the-start", [
    step("CHROME_ERROR", {"key": "other", "method": "X.y", "code": "1", "message": "m"}, {"state": "starting", "neverEmits": ["CHROME_FAILED"]},
         **{"from": "starting", "entity": {"id": "t", "stage": "create"}}),
])
case("start-an-unreadable-create-reply-fails-the-start", [
    step("CHROME_REPLY", reply("create", "Target.createTarget", '{"id":1,"result":{}}'), {"state": "starting", "emits": [emit("CHROME_START_FAILED", {"code": "bad-reply"})]},
         **{"from": "starting", "entity": {"id": "t", "stage": "create"}}),
])
case("start-a-host-failure-answers-chrome-failed", [
    step("CHROME_HOST_FAILED", {"error": "denied"}, {"state": "stopped", "emits": [emit("CHROME_FAILED", {"code": "host-failed", "message": "denied"})]},
         **{"from": "starting", "entity": {"id": "t", "stage": "mk-profile"}}),
])
case("start-twice-is-refused-and-a-ready-browser-is-not-restarted", [
    step("CHROME_START", {}, {"state": "starting", "emits": [emit("CHROME_FAILED", {"code": "busy"})], "neverEmits": ["DAEMON_START"]}, **{"from": "starting", "entity": {"id": "t"}}),
    step("CHROME_START", {}, {"state": "ready", "emits": [emit("CHROME_FAILED", {"code": "already-started"})]}, **ready()),
])

# ---------------- not ready / busy
for st, code, seed in [("stopped", "not-started", {"from": "stopped", "entity": {"id": "t"}}), ("starting", "not-ready", {"from": "starting", "entity": {"id": "t"}}), ("busy", "busy", busy("text", "text"))]:
    case("a-page-request-while-%s-answers-page-failed-%s" % (st, code), [
        step("PAGE_TEXT", {"key": "q1"}, {"state": st, "emits": [failed("q1", code)], "neverEmits": ["CDP_COMMAND"]}, **seed),
    ])
case("control-a-page-request-while-ready-is-accepted", [
    step("PAGE_TEXT", {"key": "q1"}, {"state": "busy", "emits": [cmd("text", "Runtime.evaluate")]}, **ready()),
])

# ---------------- navigate
URL = NAVINFO["url"]
case("navigate-waits-for-the-reply-then-the-load-event-then-reads-location-and-title", [
    step("PAGE_NAVIGATE", {"key": "k1", "url": URL}, {"state": "busy", "emits": [cmd("nav", "Page.navigate", json.dumps({"url": URL}, separators=(",", ":"))), emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 30000})]}, **ready()),
    step("CHROME_REPLY", reply("nav", "Page.navigate", R("navigate")), {"state": "busy", "entity": {"stage": "nav-wait"}, "neverEmits": ["PAGE_LOADED", "CHROME_FAIL"]}),
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD), {"state": "busy", "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), cmd("nav-info", "Runtime.evaluate")]}),
    step("CHROME_REPLY", reply("nav-info", "Runtime.evaluate", R("navInfo")), {"state": "ready", "entity": {"url": URL}, "emits": [emit("PAGE_LOADED", {"key": "k1", "url": URL, "title": NAVINFO["title"]})]}),
], note="the navigate reply, load event and location reply are captured from real headless Chrome")
case("navigate-the-load-event-before-the-reply-also-completes", [
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD), {"state": "busy", "entity": {"loadSeen": True}, "neverEmits": ["CDP_COMMAND"]}, **busy("navigate", "nav")),
    step("CHROME_REPLY", reply("nav", "Page.navigate", R("navigate")), {"state": "busy", "emits": [cmd("nav-info", "Runtime.evaluate")]}),
])
case("navigate-control-a-load-event-of_another-session-is-ignored", [
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD, "OTHER"), {"state": "busy", "neverEmits": ["CDP_COMMAND"], "emits": []}, **busy("navigate", "nav-wait")),
])
case("navigate-an-error-text-in-the-reply-answers-page-failed", [
    step("CHROME_REPLY", reply("nav", "Page.navigate", R("navFail")), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "navigation-failed", "error": "net::ERR_UNSAFE_PORT"})], "neverEmits": ["PAGE_LOADED"]}, **busy("navigate", "nav")),
    step("CHROME_FAIL", {"code": "navigation-failed", "error": "net::ERR_UNSAFE_PORT"}, {"state": "ready", "emits": [failed("k1", "navigation-failed", {"error": "net::ERR_UNSAFE_PORT"})]}),
], note="net::ERR_UNSAFE_PORT is the real answer for http://127.0.0.1:1/")
case("navigate-a-timer-before-the-load-event-answers-navigation-timeout", [
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "navigation-timeout"})], "neverEmits": ["PAGE_LOADED"]}, **busy("navigate", "nav-wait")),
    step("CHROME_FAIL", {"code": "navigation-timeout", "error": "the page did not fire its load event in time"}, {"state": "ready", "emits": [failed("k1", "navigation-timeout")]}),
])
case("navigate-control-the-timer-after-the-page-moved-on-is-ignored", [
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "neverEmits": ["PAGE_FAILED"]}, **busy("text", "text")),
])
case("navigate-a-protocol-error-answers-page-failed-with-its-code", [
    step("CHROME_ERROR", {"key": "nav", "method": "Page.navigate", "code": "-32602", "message": "Invalid parameters"}, {"state": "ready", "emits": [failed("k1", "-32602", {"error": "Invalid parameters"})]}, **busy("navigate", "nav")),
])
case("navigate-an-unreadable-reply-answers-bad-reply", [
    step("CHROME_REPLY", reply("nav", "Page.navigate", '{"id":1}'), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "bad-reply"})]}, **busy("navigate", "nav")),
    step("CHROME_FAIL", {"code": "bad-reply", "error": "Page.navigate answered an unexpected shape"}, {"state": "ready", "emits": [failed("k1", "bad-reply")]}),
])

# ---------------- text / links
T = val(CAP["text"])
case("text-reads-url-title-language-and-visible-text", [
    step("PAGE_TEXT", {"key": "k1"}, {"state": "busy", "emits": [cmd("text", "Runtime.evaluate")]}, **ready()),
    step("CHROME_REPLY", reply("text", "Runtime.evaluate", R("text")), {"state": "ready", "emits": [emit("PAGE_TEXT_READ", {"key": "k1", "url": T["url"], "title": T["title"], "lang": "sl", "text": T["text"]})]}),
], note="the evaluate reply is captured from real headless Chrome on shop/index.html")
case("text-an-exception-answers-script-error", [
    step("CHROME_REPLY", reply("text", "Runtime.evaluate", R("measureThrow")), {"state": "ready", "emits": [failed("k1", "script-error")], "neverEmits": ["PAGE_TEXT_READ"]}, **busy("text", "text")),
])
case("text-a-value-that-is-not-the-declared-shape-answers-bad-reply", [
    step("CHROME_REPLY", reply("text", "Runtime.evaluate", R("measureOk")), {"state": "ready", "emits": [failed("k1", "bad-reply")]}, **busy("text", "text")),
])
case("links-lists-every-link-in-document-order-with-the-download-flag", [
    step("PAGE_LINKS", {"key": "k1"}, {"state": "busy", "emits": [cmd("links", "Runtime.evaluate")]}, **ready()),
    step("CHROME_REPLY", reply("links", "Runtime.evaluate", R("links")), {"state": "ready", "emits": [emit("PAGE_LINKS_READ", {"key": "k1", "links": LINKS})]}),
], note="Cenik (PDF) is the one entry with download true, captured from real headless Chrome")

# ---------------- click
INFO_AFTER = val(CAP["clickAfter"])
CLICK_OK = R("click")
case("click-by-index-settles-then-reports-the-new-location-as-navigated", [
    step("PAGE_CLICK", {"key": "k1", "index": CAP["clickIndex"]}, {"state": "busy", "emits": [cmd("click", "Runtime.evaluate")]}, **ready()),
    step("CHROME_EVENT", event("Page.frameNavigated", FRAMENAV), {"state": "busy", "entity": {"navSeen": True}}),
    step("CHROME_REPLY", reply("click", "Runtime.evaluate", CLICK_OK), {"state": "busy", "entity": {"stage": "click-settle", "startUrl": URL}, "emits": [emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 500})]}),
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "emits": [cmd("click-after", "Runtime.evaluate")]}),
    step("CHROME_REPLY", reply("click-after", "Runtime.evaluate", R("clickAfter")), {"state": "ready", "emits": [emit("PAGE_CLICKED", {"key": "k1", "url": INFO_AFTER["url"], "navigated": True})]}),
], note="click, frameNavigated and location replies are captured from real headless Chrome clicking the Kosarica link")
case("click-a-changed-location-alone-counts-as-navigated", [
    step("CHROME_REPLY", reply("click-after", "Runtime.evaluate", R("clickAfter")), {"state": "ready", "emits": [emit("PAGE_CLICKED", {"navigated": True})]}, **busy("click", "click-after", startUrl=URL, navSeen=False)),
])
case("click-control-the-same-location-and-no-navigation-event-is-not-navigated", [
    step("CHROME_REPLY", reply("click-after", "Runtime.evaluate", R("navInfo")), {"state": "ready", "emits": [emit("PAGE_CLICKED", {"navigated": False})]}, **busy("click", "click-after", startUrl=URL, navSeen=False)),
])
case("click-by-selector-sends-the-selector", [
    step("PAGE_CLICK", {"key": "k1", "selector": "#buy"}, {"state": "busy", "emits": [cmd("click", "Runtime.evaluate")]}, **ready()),
])
case("click-no-matching-element-answers-not-found", [
    step("CHROME_REPLY", reply("click", "Runtime.evaluate", R("clickNotFound")), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "not-found"})]}, **busy("click", "click")),
    step("CHROME_FAIL", {"code": "not-found", "error": "no element matched"}, {"state": "ready", "emits": [failed("k1", "not-found")]}),
])
case("click-both-index-and-selector-or-neither-is-bad-request", [
    step("PAGE_CLICK", {"key": "k1", "index": 1, "selector": "a"}, {"state": "ready", "emits": [failed("k1", "bad-request")], "neverEmits": ["CDP_COMMAND"]}, **ready()),
    step("PAGE_CLICK", {"key": "k2"}, {"state": "ready", "emits": [failed("k2", "bad-request")], "neverEmits": ["CDP_COMMAND"]}),
])
case("click-control-index-zero-is-an-index-not-absent", [
    step("PAGE_CLICK", {"key": "k1", "index": 0}, {"state": "busy", "emits": [cmd("click", "Runtime.evaluate")]}, **ready()),
])

# ---------------- key
case("key-tab-sends-keydown-then-keyup", [
    step("PAGE_KEY", {"key": "k1", "keyName": "Tab"}, {"state": "busy", "emits": [cmd("key-down", "Input.dispatchKeyEvent", '{"type":"rawKeyDown","key":"Tab","code":"Tab","windowsVirtualKeyCode":9,"modifiers":0,"text":""}')]}, **ready()),
    step("CHROME_REPLY", reply("key-down", "Input.dispatchKeyEvent", R("tabDown")), {"state": "busy", "emits": [cmd("key-up", "Input.dispatchKeyEvent", '{"type":"keyUp","key":"Tab","code":"Tab","windowsVirtualKeyCode":9,"modifiers":0}')]}),
    step("CHROME_REPLY", reply("key-up", "Input.dispatchKeyEvent", R("tabUp")), {"state": "ready", "emits": [emit("PAGE_KEY_SENT", {"key": "k1"})]}),
], note="the dispatchKeyEvent replies are captured from real headless Chrome")
case("key-shift-adds-modifier-eight-on-both-events", [
    step("PAGE_KEY", {"key": "k1", "keyName": "Tab", "shift": True}, {"state": "busy", "emits": [cmd("key-down", "Input.dispatchKeyEvent", '{"type":"rawKeyDown","key":"Tab","code":"Tab","windowsVirtualKeyCode":9,"modifiers":8,"text":""}')]}, **ready()),
    step("CHROME_REPLY", reply("key-down", "Input.dispatchKeyEvent", R("tabDown")), {"emits": [cmd("key-up", "Input.dispatchKeyEvent", '{"type":"keyUp","key":"Tab","code":"Tab","windowsVirtualKeyCode":9,"modifiers":8}')]}),
])
case("key-enter-waits-for-a-navigation-that-began-and-for-its-load-event", [
    step("PAGE_KEY", {"key": "k1", "keyName": "Enter"}, {"state": "busy", "entity": {"keyNav": True, "stage": "key-down"}, "emits": [cmd("key-down", "Input.dispatchKeyEvent")]}, **ready()),
    step("CHROME_REPLY", reply("key-down", "Input.dispatchKeyEvent", R("tabDown")), {"state": "busy", "emits": [cmd("key-up", "Input.dispatchKeyEvent")]}),
    step("CHROME_EVENT", event("Page.frameNavigated", FRAMENAV), {"state": "busy", "entity": {"navSeen": True}}),
    step("CHROME_REPLY", reply("key-up", "Input.dispatchKeyEvent", R("tabUp")), {"state": "busy", "entity": {"stage": "key-settle"}, "emits": [emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 1500})], "neverEmits": ["PAGE_KEY_SENT"]}),
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "entity": {"stage": "key-load"}, "emits": [emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 30000})], "neverEmits": ["PAGE_KEY_SENT"]}),
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD), {"state": "ready", "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), emit("PAGE_KEY_SENT", {"key": "k1"})]}),
], note="frameNavigated and loadEventFired are real frames; the key replies are real dispatchKeyEvent answers")
case("key-enter-without-a-navigation-answers-after-the-wait", [
    step("CHROME_REPLY", reply("key-up", "Input.dispatchKeyEvent", R("tabUp")), {"state": "busy", "emits": [emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 1500})]}, **busy("key", "key-up", keyNav=True, keyName="Enter")),
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "ready", "emits": [emit("PAGE_KEY_SENT", {"key": "k1"})]}),
])
case("key-enter-a-navigation-that-never-loads-answers-navigation-timeout", [
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "navigation-timeout"})]}, **busy("key", "key-load", keyNav=True)),
    step("CHROME_FAIL", {"code": "navigation-timeout", "error": "x"}, {"state": "ready", "emits": [failed("k1", "navigation-timeout")]}),
])
case("key-control-tab-does-not-wait-for-a-navigation", [
    step("CHROME_REPLY", reply("key-up", "Input.dispatchKeyEvent", R("tabUp")), {"state": "ready", "emits": [emit("PAGE_KEY_SENT", {"key": "k1"})], "neverEmits": ["CHROME_TIMER_ARM"]}, **busy("key", "key-up", keyNav=False, keyName="Tab")),
])
case("key-enter-types-a-carriage-return-and-space-a-space", [
    step("PAGE_KEY", {"key": "k1", "keyName": "Enter"}, {"emits": [cmd("key-down", "Input.dispatchKeyEvent", '{"type":"keyDown","key":"Enter","code":"Enter","windowsVirtualKeyCode":13,"modifiers":0,"text":"\\r"}')]}, **ready()),
    step("PAGE_KEY", {"key": "k2", "keyName": "Space"}, {"emits": [cmd("key-down", "Input.dispatchKeyEvent", '{"type":"keyDown","key":" ","code":"Space","windowsVirtualKeyCode":32,"modifiers":0,"text":" "}')]}, **ready()),
])
case("key-a-name-missing-from-the-configured-table-answers-unknown-key", [
    step("PAGE_KEY", {"key": "k1", "keyName": "Enter"}, {"state": "ready", "emits": [failed("k1", "unknown-key")], "neverEmits": ["CDP_COMMAND"]}, **ready()),
], config={"keys": {"Tab": {"key": "Tab", "code": "Tab", "vk": 9}}})

# ---------------- focused
FOC = val(CAP["focused"])["focused"]
case("focused-reads-tag-role-name-selector-and-rectangle", [
    step("PAGE_FOCUSED", {"key": "k1"}, {"state": "busy", "emits": [cmd("focused", "Runtime.evaluate")]}, **ready()),
    step("CHROME_REPLY", reply("focused", "Runtime.evaluate", R("focused")), {"state": "ready", "emits": [emit("PAGE_FOCUS_READ", {"key": "k1", "focused": FOC})]}),
], note="after a real Tab on shop/index.html the skip link is focused")
case("focused-control-the-body-focused-leaves-focused-absent", [
    step("CHROME_REPLY", reply("focused", "Runtime.evaluate", R("focusedBody")), {"state": "ready", "emits": [emit("PAGE_FOCUS_READ", {"key": "k1"})]}, **busy("focused", "focused")),
])

# ---------------- viewport
case("viewport-text-zoom-two-halves-the-css-viewport-and-doubles-the-scale", [
    step("PAGE_VIEWPORT", {"key": "k1", "width": 1280, "height": 800, "deviceScaleFactor": 1, "mobile": False, "textZoom": 2}, {"state": "busy", "emits": [cmd("viewport", "Emulation.setDeviceMetricsOverride", '{"width":640,"height":400,"deviceScaleFactor":2,"mobile":false}')]}, **ready()),
    step("CHROME_REPLY", reply("viewport", "Emulation.setDeviceMetricsOverride", R("viewport")), {"state": "ready", "emits": [emit("PAGE_VIEWPORT_SET", {"key": "k1"})]}),
], note="the metrics reply is captured from real headless Chrome")
case("viewport-control-zoom-one-sends-the-plain-metrics", [
    step("PAGE_VIEWPORT", {"key": "k1", "width": 320, "height": 640, "deviceScaleFactor": 2, "mobile": True, "textZoom": 1}, {"emits": [cmd("viewport", "Emulation.setDeviceMetricsOverride", '{"width":320,"height":640,"deviceScaleFactor":2,"mobile":true}')]}, **ready()),
])
case("viewport-a-zoom-of-zero-is-bad-request", [
    step("PAGE_VIEWPORT", {"key": "k1", "width": 320, "height": 640, "deviceScaleFactor": 1, "mobile": False, "textZoom": 0}, {"state": "ready", "emits": [failed("k1", "bad-request")], "neverEmits": ["CDP_COMMAND"]}, **ready()),
])

# ---------------- screenshot / ax
SHOT = json.loads(R("screenshot"))["result"]["data"]
case("screenshot-turns-the-base64-data-into-png-bytes", [
    step("PAGE_SCREENSHOT", {"key": "k1", "fullPage": False}, {"state": "busy", "emits": [cmd("screenshot", "Page.captureScreenshot", '{"format":"png","captureBeyondViewport":false}')]}, **ready()),
    step("CHROME_REPLY", reply("screenshot", "Page.captureScreenshot", R("screenshot")), {"state": "ready", "emits": [emit("PAGE_SCREENSHOT_TAKEN", {"key": "k1", "png": SHOT})]}),
], note="the PNG is a 160x100 viewport of a tiny fixture page, captured from real headless Chrome")
case("screenshot-control-full-page-asks-to-capture-beyond-the-viewport", [
    step("PAGE_SCREENSHOT", {"key": "k1", "fullPage": True}, {"emits": [cmd("screenshot", "Page.captureScreenshot", '{"format":"png","captureBeyondViewport":true}')]}, **ready()),
])
case("screenshot-data-that-is-not-base64-answers-bad-reply", [
    step("CHROME_REPLY", reply("screenshot", "Page.captureScreenshot", '{"id":1,"result":{"data":"@@not base64@@"}}'), {"state": "ready", "emits": [failed("k1", "bad-reply")], "neverEmits": ["PAGE_SCREENSHOT_TAKEN"]}, **busy("screenshot", "screenshot")),
])
AX = json.loads(R("ax"))["result"]["nodes"]
AXN = []
for n in AX:
    o = {"id": n["nodeId"], "role": n.get("role", {}).get("value", ""), "name": n.get("name", {}).get("value", ""), "ignored": n.get("ignored", False)}
    if n.get("parentId") is not None:
        o["parent"] = n["parentId"]
    AXN.append(o)
case("ax-tree-maps-node-id-parent-role-name-and-ignored", [
    step("PAGE_AX_TREE", {"key": "k1"}, {"state": "busy", "emits": [cmd("ax", "Accessibility.getFullAXTree", "{}")]}, **ready()),
    step("CHROME_REPLY", reply("ax", "Accessibility.getFullAXTree", R("ax")), {"state": "ready", "emits": [emit("PAGE_AX_TREE_READ", {"key": "k1", "nodes": AXN})]}),
], note="the tree is captured from real headless Chrome on img-alt-pass.html; the root has no parent")
case("ax-tree-control-a-node-without-role-or-name-defaults-them", [
    step("CHROME_REPLY", reply("ax", "Accessibility.getFullAXTree", '{"id":1,"result":{"nodes":[{"nodeId":"1","ignored":true},{"nodeId":"2","parentId":"1","role":{"type":"role","value":"image"},"name":{"type":"computedString","value":"logo"}}]}}'),
         {"state": "ready", "emits": [emit("PAGE_AX_TREE_READ", {"key": "k1", "nodes": [{"id": "1", "role": "", "name": "", "ignored": True}, {"id": "2", "parent": "1", "role": "image", "name": "logo", "ignored": False}]})]}, **busy("ax", "ax")),
])

# ---------------- pdf
PDF = json.loads(R("pdfPrint"))["result"]["data"]
HTML = CAP["pdfHtml"]
FID = json.loads(R("pdfTree"))["result"]["frameTree"]["frame"]["id"]
case("print-pdf-blanks-the-page-sets-the-document-and-prints", [
    step("PAGE_PRINT_PDF", {"key": "k1", "html": HTML}, {"state": "busy", "emits": [cmd("pdf-blank", "Page.navigate", '{"url":"about:blank"}')]}, **ready()),
    step("CHROME_REPLY", reply("pdf-blank", "Page.navigate", R("pdfBlank")), {"state": "busy", "emits": [cmd("pdf-tree", "Page.getFrameTree", "{}")]}),
    step("CHROME_REPLY", reply("pdf-tree", "Page.getFrameTree", R("pdfTree")), {"state": "busy", "emits": [cmd("pdf-set", "Page.setDocumentContent", json.dumps({"frameId": FID, "html": HTML}, separators=(",", ":")))]}),
    step("CHROME_REPLY", reply("pdf-set", "Page.setDocumentContent", R("pdfSet")), {"state": "busy", "emits": [cmd("pdf-print", "Page.printToPDF", '{"printBackground":true,"preferCSSPageSize":true}')]}),
    step("CHROME_REPLY", reply("pdf-print", "Page.printToPDF", R("pdfPrint")), {"state": "ready", "emits": [emit("PAGE_PDF_PRINTED", {"key": "k1", "pdf": PDF})]}),
], note="all four replies are captured from real headless Chrome printing a tiny HTML; the data is a real PDF")
case("print-pdf-a-protocol-error-while-printing-answers-page-failed", [
    step("CHROME_ERROR", {"key": "pdf-print", "method": "Page.printToPDF", "code": "-32000", "message": "Printing failed"}, {"state": "ready", "emits": [failed("k1", "-32000")]}, **busy("pdf", "pdf-print")),
])

# ---------------- download
case("download-clicks-then-completes-on-the-completed-progress-event", [
    step("PAGE_DOWNLOAD", {"key": "k1", "index": CAP["cenikIndex"]}, {"state": "busy", "emits": [emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 30000}), cmd("dl-click", "Runtime.evaluate")]}, **ready()),
    step("CHROME_REPLY", reply("dl-click", "Runtime.evaluate", R("dlClick")), {"state": "busy", "entity": {"stage": "dl-wait"}}),
    step("CHROME_EVENT", {"method": "Browser.downloadWillBegin", "frame": BEGIN}, {"state": "busy", "entity": {"dlGuid": BEGIN_J["guid"], "dlName": "cenik.pdf", "dlUrl": BEGIN_J["url"]}}),
    step("CHROME_EVENT", {"method": "Browser.downloadProgress", "frame": INPROG}, {"state": "busy", "neverEmits": ["PAGE_DOWNLOADED", "PAGE_FAILED"]}),
    step("CHROME_EVENT", {"method": "Browser.downloadProgress", "frame": DONE}, {"state": "busy", "emits": [emit("CHROME_DL_PROGRESS", {"state": "completed"})]}),
    step("CHROME_DL_PROGRESS", {"guid": DONE_J["guid"], "state": "completed", "received": DONE_J["receivedBytes"], "filePath": DONE_J["filePath"]},
         {"state": "ready", "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), emit("PAGE_DOWNLOADED", {"key": "k1", "path": DONE_J["filePath"], "url": BEGIN_J["url"], "size": 787})]}),
], note="click, begin, progress and completed frames are captured from real headless Chrome downloading shop/docs/cenik.pdf (787 bytes)")
case("download-control-progress-of-another-guid-does-not-complete", [
    step("CHROME_DL_PROGRESS", {"guid": "other", "state": "completed", "received": 1, "filePath": "/x"}, {"state": "busy", "neverEmits": ["PAGE_DOWNLOADED"]}, **busy("download", "dl-wait", dlGuid="mine", dlName="a.pdf", dlUrl="http://x/a.pdf")),
])
case("download-a-canceled-download-answers-page-failed", [
    step("CHROME_EVENT", {"method": "Browser.downloadProgress", "frame": CANCELED}, {"state": "busy", "emits": [emit("CHROME_DL_PROGRESS", {"state": "canceled"})]}, **busy("download", "dl-wait", dlGuid=DONE_J["guid"])),
    step("CHROME_DL_PROGRESS", {"guid": DONE_J["guid"], "state": "canceled", "received": 0}, {"state": "ready", "emits": [failed("k1", "download-canceled")], "neverEmits": ["PAGE_DOWNLOADED"]}),
])
case("download-no-completion-in-time-answers-download-timeout", [
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "download-timeout"})]}, **busy("download", "dl-wait")),
    step("CHROME_FAIL", {"code": "download-timeout", "error": "no completed download in time"}, {"state": "ready", "emits": [failed("k1", "download-timeout"), emit("CHROME_TIMER_CANCEL", {"key": "op"})]}),
])
case("download-a-click_that-finds-nothing-answers-not-found", [
    step("CHROME_REPLY", reply("dl-click", "Runtime.evaluate", R("clickNotFound")), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "not-found"})]}, **busy("download", "dl-click")),
])
case("download-control-a-download-event-while-no-download-is-asked-is-ignored", [
    step("CHROME_EVENT", {"method": "Browser.downloadWillBegin", "frame": BEGIN}, {"state": "busy", "neverEmits": ["PAGE_FAILED", "CHROME_DL_PROGRESS"]}, **busy("text", "text")),
])

# ---------------- inject / measure
case("inject-reads-the-script-file-then-evaluates-its-text", [
    step("PAGE_INJECT", {"key": "k1", "script": "axe-core/axe.min.js"}, {"state": "busy", "effects": [{"type": "os/read-file"}]}, **ready()),
    step("CHROME_FILE_READ", {"data": "eD0x"}, {"state": "busy", "emits": [cmd("inject", "Runtime.evaluate", '{"expression":"x=1"}')]}),
    step("CHROME_REPLY", reply("inject", "Runtime.evaluate", '{"id":1,"result":{"result":{"type":"number","value":1}}}'), {"state": "ready", "emits": [emit("PAGE_INJECTED", {"key": "k1"})]}),
])
case("inject-an-absolute-script-path-answers-bad-script", [
    step("PAGE_INJECT", {"key": "k1", "script": "/etc/passwd"}, {"state": "ready", "emits": [failed("k1", "bad-script")], "effects": []}, **ready()),
])
case("inject-a-script-path-that-climbs-out-answers-bad-script", [
    step("PAGE_INJECT", {"key": "k1", "script": "../secret.js"}, {"state": "ready", "emits": [failed("k1", "bad-script")], "effects": []}, **ready()),
])
case("inject-control-a-nested-relative-path-is-read", [
    step("PAGE_INJECT", {"key": "k1", "script": "a/../axe-core/axe.min.js"}, {"state": "busy", "effects": [{"type": "os/read-file"}]}, **ready()),
])
case("inject-a-throwing-script-answers-script-error", [
    step("CHROME_REPLY", reply("inject", "Runtime.evaluate", R("injectThrow")), {"state": "ready", "emits": [failed("k1", "script-error")], "neverEmits": ["PAGE_INJECTED"]}, **busy("inject", "inject")),
], note="the exception reply is captured from real headless Chrome")
case("inject-an-unreadable-file-answers-read-failed", [
    step("CHROME_HOST_FAILED", {"error": "no such file"}, {"state": "ready", "emits": [failed("k1", "read-failed")]}, **busy("inject", "inject-read")),
])
case("measure-returns-the-json-text-the-expression-produced", [
    step("PAGE_MEASURE", {"key": "k1", "expression": "Promise.resolve(JSON.stringify({a:1}))"}, {"state": "busy", "emits": [cmd("measure", "Runtime.evaluate", '{"expression":"Promise.resolve(JSON.stringify({a:1}))","returnByValue":true,"awaitPromise":true}')]}, **ready()),
    step("CHROME_REPLY", reply("measure", "Runtime.evaluate", R("measureOk")), {"state": "ready", "emits": [emit("PAGE_MEASURED", {"key": "k1", "json": '{"a":1}'})]}),
], note="the reply is captured from real headless Chrome with awaitPromise and returnByValue")
case("measure-an-exception-answers-script-error", [
    step("CHROME_REPLY", reply("measure", "Runtime.evaluate", R("measureThrow")), {"state": "ready", "emits": [failed("k1", "script-error")], "neverEmits": ["PAGE_MEASURED"]}, **busy("measure", "measure")),
])
case("measure-a-number-or-an-object-answers-not-json", [
    step("CHROME_REPLY", reply("measure", "Runtime.evaluate", R("measureNumber")), {"state": "ready", "emits": [failed("k1", "not-json")], "neverEmits": ["PAGE_MEASURED"]}, **busy("measure", "measure")),
    step("CHROME_REPLY", reply("measure", "Runtime.evaluate", R("measureObject")), {"state": "ready", "emits": [failed("k1", "not-json")]}, **busy("measure", "measure")),
])
case("measure-a-protocol-error-keeps-its-code", [
    step("CHROME_ERROR", {"key": "measure", "method": "Nope.nothing", "code": "-32601", "message": "'Nope.nothing' wasn't found"}, {"state": "ready", "emits": [failed("k1", "-32601")]}, **busy("measure", "measure")),
], note="-32601 and its message are the real answer of headless Chrome to an unknown method")

# ---------------- stop / loss
case("stop-closes-the-target-disconnects-stops-the-daemon-and-answers-stopped", [
    step("CHROME_STOP", {}, {"state": "stopping", "emits": [cmd("close-target", "Target.closeTarget", '{"targetId":"%s"}' % TARGET, False)]}, **ready()),
    step("CHROME_REPLY", reply("close-target", "Target.closeTarget", '{"id":1,"result":{"success":true}}'), {"state": "stopping", "emits": [emit("CDP_DISCONNECT", {})]}),
    step("CHROME_DISCONNECTED", {"reason": "closed 1000"}, {"state": "stopping", "emits": [emit("DAEMON_STOP", {})]}),
    step("CHROME_DAEMON_STOPPED", {"pid": 4242}, {"state": "stopped", "emits": [emit("CHROME_STOPPED", {})]}),
])
case("stop-a-reused-browser-that-is-not-stopped-still-answers-stopped", [
    step("CHROME_DAEMON_FAILED", {"code": "daemon_idle", "message": "not ours"}, {"state": "stopped", "emits": [emit("CHROME_STOPPED", {})]}, **{"from": "stopping", "entity": {"id": "t"}}),
])
case("stop-while-stopped-answers-stopped-at-once", [
    step("CHROME_STOP", {}, {"state": "stopped", "emits": [emit("CHROME_STOPPED", {})], "neverEmits": ["CDP_COMMAND"]}, **{"from": "stopped", "entity": {"id": "t"}}),
])
case("stop-during-an-operation-fails-the-operation-then-stops", [
    step("CHROME_STOP", {}, {"state": "stopping", "emits": [failed("k1", "stopped"), cmd("close-target", "Target.closeTarget", None, False)]}, **busy("text", "text")),
])
case("a-lost-connection-fails-the-operation-and-stops", [
    step("CHROME_DISCONNECTED", {"reason": "closed 1006"}, {"state": "stopped", "emits": [failed("k1", "disconnected"), emit("CHROME_FAILED", {"code": "disconnected"})]}, **busy("text", "text")),
])
case("a-lost-connection-while-ready-answers-chrome-failed", [
    step("CHROME_DISCONNECTED", {"reason": "closed 1006"}, {"state": "stopped", "emits": [emit("CHROME_FAILED", {"code": "disconnected"})]}, **ready()),
])
case("a-protocol-error-for-the-command-in-flight-keeps-the-error-code", [
    step("CHROME_ERROR", {"key": "text", "method": "Nope.nothing", "code": "-32601", "message": "'Nope.nothing' wasn't found"}, {"state": "ready", "emits": [failed("k1", "-32601")]}, **busy("text", "text")),
])
case("control-a-protocol-error-for-another-command-is-ignored", [
    step("CHROME_ERROR", {"key": "stale", "method": "X.y", "code": "1", "message": "m"}, {"state": "busy", "neverEmits": ["PAGE_FAILED"]}, **busy("text", "text")),
])

# ---------------- settle, element shot, preload, print from path (frames below are written from the CDP protocol shapes, not captured)
J = lambda o: json.dumps(o, separators=(",", ":"))
NAVF = json.loads(R("navigate"))["result"]["frameId"]
OK = lambda **r: J({"id": 1, "result": r, "sessionId": SESS})
LC = lambda name, frame=NAVF: J({"method": "Page.lifecycleEvent", "params": {"frameId": frame, "loaderId": "L1", "name": name, "timestamp": 1.5}, "sessionId": SESS})
IDLE = {"waitFor": "networkIdle"}
FONTS = '{"expression":"document.fonts.ready.then(() => true)","awaitPromise":true,"returnByValue":true}'
FONTS_OK = OK(result={"type": "boolean", "value": True})

case("settle-network-idle-enables-lifecycle-waits-for-load-then-idle-then-fonts-then-settle-then-reads-location", [
    step("PAGE_NAVIGATE", {"key": "k1", "url": URL}, {"state": "busy", "entity": {"stage": "nav-lc", "navUrl": URL}, "emits": [cmd("nav-lc", "Page.setLifecycleEventsEnabled", '{"enabled":true}'), emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 30000})], "neverEmits": ["PAGE_LOADED"]}, **ready()),
    step("CHROME_REPLY", reply("nav-lc", "Page.setLifecycleEventsEnabled", OK()), {"state": "busy", "entity": {"stage": "nav"}, "emits": [cmd("nav", "Page.navigate", J({"url": URL}))]}),
    step("CHROME_REPLY", reply("nav", "Page.navigate", R("navigate")), {"state": "busy", "entity": {"stage": "nav-wait", "frameId": NAVF}, "neverEmits": ["PAGE_LOADED", "CHROME_FAIL"]}),
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD), {"state": "busy", "entity": {"stage": "nav-idle"}, "neverEmits": ["CDP_COMMAND", "CHROME_TIMER_CANCEL"]}),
    step("CHROME_EVENT", event("Page.lifecycleEvent", LC("networkAlmostIdle")), {"state": "busy", "entity": {"stage": "nav-idle"}, "neverEmits": ["CDP_COMMAND"]}),
    step("CHROME_EVENT", event("Page.lifecycleEvent", LC("networkIdle", "OTHERFRAME")), {"state": "busy", "entity": {"stage": "nav-idle"}, "neverEmits": ["CDP_COMMAND"]}),
    step("CHROME_EVENT", event("Page.lifecycleEvent", LC("networkIdle")), {"state": "busy", "entity": {"stage": "nav-fonts"}, "emits": [cmd("nav-fonts", "Runtime.evaluate", FONTS)]}),
    step("CHROME_REPLY", reply("nav-fonts", "Runtime.evaluate", FONTS_OK), {"state": "busy", "entity": {"stage": "nav-settle"}, "emits": [emit("CHROME_TIMER_ARM", {"key": "settle", "delayMs": 250})], "neverEmits": ["PAGE_LOADED"]}),
    step("CHROME_TIMER_DUE", {"key": "settle"}, {"state": "busy", "entity": {"stage": "nav-info"}, "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), cmd("nav-info", "Runtime.evaluate")]}),
    step("CHROME_REPLY", reply("nav-info", "Runtime.evaluate", R("navInfo")), {"state": "ready", "entity": {"url": URL}, "emits": [emit("PAGE_LOADED", {"key": "k1", "url": URL, "title": NAVINFO["title"]})]}),
], config={"waitFor": "networkIdle", "settleMs": 250}, note="the navigate reply, load event and location reply are the captured frames; the lifecycle frames follow the Page.lifecycleEvent shape")
case("settle-network-idle-with-zero-settle-reads-the-location-right-after-fonts", [
    step("CHROME_REPLY", reply("nav-fonts", "Runtime.evaluate", FONTS_OK), {"state": "busy", "entity": {"stage": "nav-info"}, "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), cmd("nav-info", "Runtime.evaluate")], "neverEmits": ["CHROME_TIMER_ARM"]}, **busy("navigate", "nav-fonts", frameId=NAVF)),
], config=IDLE)
case("settle-network-idle-reply_after_load-goes-straight-to-waiting-for-idle", [
    step("CHROME_REPLY", reply("nav", "Page.navigate", R("navigate")), {"state": "busy", "entity": {"stage": "nav-idle", "frameId": NAVF}, "neverEmits": ["CDP_COMMAND"]}, **busy("navigate", "nav", loadSeen=True, navUrl=URL)),
], config=IDLE)
case("settle-network-idle-control-an-idle-event-before-the-load-event-is-ignored", [
    step("CHROME_EVENT", event("Page.lifecycleEvent", LC("networkIdle")), {"state": "busy", "entity": {"stage": "nav-wait"}, "neverEmits": ["CDP_COMMAND"]}, **busy("navigate", "nav-wait", frameId=NAVF)),
], config=IDLE)
case("settle-network-idle-a-fonts-exception-answers-script-error", [
    step("CHROME_REPLY", reply("nav-fonts", "Runtime.evaluate", OK(exceptionDetails={"text": "Uncaught"})), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "script-error", "error": "Uncaught"})]}, **busy("navigate", "nav-fonts", frameId=NAVF)),
], config=IDLE)
for stg in ["nav-lc", "nav-idle", "nav-fonts", "nav-settle"]:
    case("settle-network-idle-the-timeout-during-%s-answers-navigation-timeout" % stg, [
        step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "navigation-timeout"})]}, **busy("navigate", stg, frameId=NAVF)),
        step("CHROME_FAIL", {"code": "navigation-timeout", "error": "the page did not fire its load event in time"}, {"state": "ready", "emits": [failed("k1", "navigation-timeout"), emit("CHROME_TIMER_CANCEL", {"key": "settle"})]}),
    ], config=IDLE)
case("settle-control-the-default-load-mode-never-enables-lifecycle-events", [
    step("PAGE_NAVIGATE", {"key": "k1", "url": URL}, {"state": "busy", "entity": {"stage": "nav"}, "emits": [cmd("nav", "Page.navigate")], "neverEmits": ["CHROME_FAIL"]}, **ready()),
])
case("settle-control-the-default-load-mode-ignores-a-lifecycle-event", [
    step("CHROME_EVENT", event("Page.lifecycleEvent", LC("networkIdle")), {"state": "busy", "entity": {"stage": "nav-wait"}, "neverEmits": ["CDP_COMMAND"]}, **busy("navigate", "nav-wait", frameId=NAVF)),
])

# element shot
SEL = "#hero"
QUAD = [20, 300, 220, 300, 220, 380, 20, 380]
def el_run(extra_payload, fmt, params_clip, clip, box, extra_cfg=None, margin=160, quality=None, note=None, cid=""):
    cfg = dict(extra_cfg or {})
    shot_params = '{"format":"%s","captureBeyondViewport":true,"clip":%s%s}' % (fmt, params_clip, "" if quality is None else ',"quality":%s' % quality)
    payload = {"key": "k1", "selector": SEL}
    payload.update(extra_payload)
    case(cid, [
        step("PAGE_ELEMENT_SHOT", payload, {"state": "busy", "entity": {"stage": "el-doc", "shotMargin": margin, "shotFormat": fmt}, "emits": [cmd("el-doc", "DOM.getDocument", '{"depth":0}')]}, **ready()),
        step("CHROME_REPLY", reply("el-doc", "DOM.getDocument", OK(root={"nodeId": 1, "backendNodeId": 2, "nodeType": 9})), {"state": "busy", "entity": {"stage": "el-query"}, "emits": [cmd("el-query", "DOM.querySelector", J({"nodeId": 1, "selector": SEL}))]}),
        step("CHROME_REPLY", reply("el-query", "DOM.querySelector", OK(nodeId=7)), {"state": "busy", "entity": {"stage": "el-scroll", "nodeId": 7}, "emits": [cmd("el-scroll", "DOM.scrollIntoViewIfNeeded", '{"nodeId":7}')]}),
        step("CHROME_REPLY", reply("el-scroll", "DOM.scrollIntoViewIfNeeded", OK()), {"state": "busy", "entity": {"stage": "el-settle"}, "emits": [emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": cfg.get("elementSettleMs", 150)})], "neverEmits": ["CDP_COMMAND"]}),
        step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "entity": {"stage": "el-box"}, "emits": [cmd("el-box", "DOM.getBoxModel", '{"nodeId":7}')]}),
        step("CHROME_REPLY", reply("el-box", "DOM.getBoxModel", OK(model={"content": QUAD, "padding": QUAD, "border": QUAD, "margin": QUAD, "width": 200, "height": 80})), {"state": "busy", "entity": {"stage": "el-metrics", "elRect": {"x": 20, "y": 300, "width": 200, "height": 80}}, "emits": [cmd("el-metrics", "Page.getLayoutMetrics", "{}")]}),
        step("CHROME_REPLY", reply("el-metrics", "Page.getLayoutMetrics", OK(contentSize={"x": 0, "y": 0, "width": 1000, "height": 900}, cssVisualViewport={"pageX": 0, "pageY": 500, "clientWidth": 1280, "clientHeight": 800})),
             {"state": "busy", "entity": {"stage": "el-shot", "shotClip": clip, "shotBox": box}, "emits": [cmd("el-shot", "Page.captureScreenshot", shot_params)]}),
        step("CHROME_REPLY", reply("el-shot", "Page.captureScreenshot", R("screenshot")), {"state": "ready", "emits": [emit("PAGE_ELEMENT_SHOT_TAKEN", {"key": "k1", "image": SHOT, "format": fmt, "clip": clip, "box": box})]}),
    ], config=cfg, note=note)

el_run({}, "png", '{"x":0,"y":640,"width":380,"height":260,"scale":1}', {"x": 0, "y": 640, "width": 380, "height": 260}, {"x": 20, "y": 160, "width": 200, "height": 80},
       note="margin 160 around the element at page (20,800) of size 200x80 in a 1000x900 page: the left edge clamps to 0 and the bottom edge to 900, so the box origin inside the clip is (20,160)", cid="element-shot-scrolls-settles-measures-clamps-the-clip-inside-the-content-and-answers-the-image-with-the-box-relative-to-the-clip")
el_run({"margin": 10, "format": "jpeg", "quality": 80}, "jpeg", '{"x":10,"y":790,"width":220,"height":100,"scale":1}', {"x": 10, "y": 790, "width": 220, "height": 100}, {"x": 10, "y": 10, "width": 200, "height": 80}, margin=10, quality=80,
       note="a margin of 10 and jpeg at quality 80: the quality reaches Page.captureScreenshot and the clip is not clamped except at the bottom (800+80+10=890<900 so 100 high)", cid="element-shot-control-a-request-margin-and-jpeg-quality-replace-the-defaults")
el_run({"quality": 80}, "png", '{"x":0,"y":640,"width":380,"height":260,"scale":1}', {"x": 0, "y": 640, "width": 380, "height": 260}, {"x": 20, "y": 160, "width": 200, "height": 80}, extra_cfg={"elementMargin": 160, "elementSettleMs": 40},
       note="control: png ignores quality; the elementSettleMs knob sets the wait", cid="element-shot-control-png-leaves-quality-out-and-the-settle-knob-sets-the-wait")
case("element-shot-no-match-answers-element-missing", [
    step("CHROME_REPLY", reply("el-query", "DOM.querySelector", OK(nodeId=0)), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "element-missing"})], "neverEmits": ["CDP_COMMAND"]}, **busy("elshot", "el-query", selector=SEL)),
    step("CHROME_FAIL", {"code": "element-missing", "error": "no element matched the selector"}, {"state": "ready", "emits": [failed("k1", "element-missing")]}),
])
case("element-shot-a-box-model-error-answers-element-hidden", [
    step("CHROME_ERROR", {"key": "el-box", "method": "DOM.getBoxModel", "code": "-32000", "message": "Could not compute box model."}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "element-hidden"})]}, **busy("elshot", "el-box", nodeId=7)),
    step("CHROME_FAIL", {"code": "element-hidden", "error": "the element has no box to capture"}, {"state": "ready", "emits": [failed("k1", "element-hidden")]}),
])
case("element-shot-a-scroll-error-answers-element-hidden", [
    step("CHROME_ERROR", {"key": "el-scroll", "method": "DOM.scrollIntoViewIfNeeded", "code": "-32000", "message": "Node does not have a layout object"}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "element-hidden"})]}, **busy("elshot", "el-scroll", nodeId=7)),
])
for nm, q in [("zero-width", [20, 300, 20, 300, 20, 380, 20, 380]), ("zero-height", [20, 300, 220, 300, 220, 300, 20, 300])]:
    case("element-shot-%s-answers-element-hidden" % nm, [
        step("CHROME_REPLY", reply("el-box", "DOM.getBoxModel", OK(model={"content": q, "padding": q, "border": q, "margin": q, "width": 0, "height": 0})), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "element-hidden"})], "neverEmits": ["CDP_COMMAND"]}, **busy("elshot", "el-box", nodeId=7)),
    ])
case("element-shot-control-another-protocol-error-keeps-its-code", [
    step("CHROME_ERROR", {"key": "el-query", "method": "DOM.querySelector", "code": "-32000", "message": "invalid selector"}, {"state": "ready", "emits": [failed("k1", "-32000")]}, **busy("elshot", "el-query")),
])

# preload
case("preload-registers-the-script-for-new-documents-and-answers-the-identifier", [
    step("PAGE_PRELOAD", {"key": "k1", "script": "window.__axe = 1"}, {"state": "busy", "emits": [cmd("preload", "Page.addScriptToEvaluateOnNewDocument", '{"source":"window.__axe = 1"}')]}, **ready()),
    step("CHROME_REPLY", reply("preload", "Page.addScriptToEvaluateOnNewDocument", OK(identifier="3")), {"state": "ready", "emits": [emit("PAGE_PRELOADED", {"key": "k1", "identifier": "3"})]}),
])
case("preload-a-protocol-error-answers-page-failed", [
    step("CHROME_ERROR", {"key": "preload", "method": "Page.addScriptToEvaluateOnNewDocument", "code": "-32000", "message": "bad"}, {"state": "ready", "emits": [failed("k1", "-32000")]}, **busy("preload", "preload")),
])

# print from path
PATH = "/tmp/report.html"
case("print-pdf-from-a-path-navigates-to-the-file-waits-for-load-and-prints", [
    step("PAGE_PRINT_PDF", {"key": "k1", "path": PATH}, {"state": "busy", "entity": {"stage": "pdf-nav"}, "emits": [cmd("pdf-nav", "Page.navigate", J({"url": "file://" + PATH})), emit("CHROME_TIMER_ARM", {"key": "op", "delayMs": 30000})]}, **ready()),
    step("CHROME_REPLY", reply("pdf-nav", "Page.navigate", R("navigate")), {"state": "busy", "entity": {"stage": "pdf-load"}, "neverEmits": ["CDP_COMMAND"]}),
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD), {"state": "busy", "entity": {"stage": "pdf-print"}, "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), cmd("pdf-print", "Page.printToPDF", '{"printBackground":true,"preferCSSPageSize":true}')]}),
    step("CHROME_REPLY", reply("pdf-print", "Page.printToPDF", R("pdfPrint")), {"state": "ready", "emits": [emit("PAGE_PDF_PRINTED", {"key": "k1", "pdf": PDF})]}),
], note="the navigate, load and print frames are the captured ones")
case("print-pdf-from-a-path-the-load-event-before-the-reply-also-prints", [
    step("CHROME_EVENT", event("Page.loadEventFired", LOAD), {"state": "busy", "entity": {"loadSeen": True}, "neverEmits": ["CDP_COMMAND"]}, **busy("pdf", "pdf-nav")),
    step("CHROME_REPLY", reply("pdf-nav", "Page.navigate", R("navigate")), {"state": "busy", "entity": {"stage": "pdf-print"}, "emits": [emit("CHROME_TIMER_CANCEL", {"key": "op"}), cmd("pdf-print", "Page.printToPDF")]}),
])
case("print-pdf-from-a-path-an-error-text-answers-navigation-failed", [
    step("CHROME_REPLY", reply("pdf-nav", "Page.navigate", R("navFail")), {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "navigation-failed"})]}, **busy("pdf", "pdf-nav")),
])
case("print-pdf-from-a-path-the-timeout-answers-navigation-timeout", [
    step("CHROME_TIMER_DUE", {"key": "op"}, {"state": "busy", "emits": [emit("CHROME_FAIL", {"code": "navigation-timeout"})]}, **busy("pdf", "pdf-load")),
])
case("print-pdf-both-html-and-path-answers-bad-request", [
    step("PAGE_PRINT_PDF", {"key": "k1", "html": HTML, "path": PATH}, {"state": "ready", "emits": [failed("k1", "bad-request")], "neverEmits": ["CDP_COMMAND"]}, **ready()),
])
case("print-pdf-neither-html-nor-path-answers-bad-request", [
    step("PAGE_PRINT_PDF", {"key": "k1"}, {"state": "ready", "emits": [failed("k1", "bad-request")], "neverEmits": ["CDP_COMMAND"]}, **ready()),
])
case("print-pdf-control-html-alone-still-blanks-the-page-first", [
    step("PAGE_PRINT_PDF", {"key": "k1", "html": HTML}, {"state": "busy", "entity": {"stage": "pdf-blank"}, "emits": [cmd("pdf-blank", "Page.navigate", '{"url":"about:blank"}')], "neverEmits": ["CHROME_TIMER_ARM"]}, **ready()),
])

json.dump({
    "atom": "connect/atoms/std-chrome.lolo",
    "trait": "Chrome",
    "spec": "spec/connect/chrome.lolo",
    "note": "std-chrome: start, every page operation (happy path and failure), busy, stop; the frames are captured from real headless Chrome by chrome.gen/capture.py (python3 -I capture.py capture.json; python3 -I gen_goldens.py capture.json ../chrome.replay.goldens.json)",
    "cases": cases,
}, open(OUT, "w"), indent=1, ensure_ascii=False)
print(len(cases), "cases")
