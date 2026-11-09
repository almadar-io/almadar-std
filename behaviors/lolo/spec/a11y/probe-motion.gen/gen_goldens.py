import json, os, sys, time
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from cdp import Chrome, Site
from gl import step, case, emit, write, URL

js = open(os.path.join(here, "snapshot.measure.js")).read().strip()
q = lambda v: json.dumps(v, separators=(",", ":"), ensure_ascii=False)
CAR = '[aria-roledescription="carousel"]'
EXPR = "(" + js + ")(" + q(CAR) + "," + q("marquee,blink") + ")"
pages = ["carousel-fail", "carousel-pass", "motion-extra", "motion-controlled"]
site = Site(here)
c = Chrome()
live = {}
try:
    for n in pages:
        c.navigate(f"{site.base}/{n}.html")
        a = c.evaluate(EXPR)
        time.sleep(3.2)
        b = c.evaluate(EXPR)
        live[n] = {"first": a, "second": b}
finally:
    c.close(); site.close()
json.dump(live, open(os.path.join(here, "recorded.json"), "w"), indent=1)

P = lambda n: URL + n + ".html"
S = lambda n, w: json.loads(live[n][w])
ent = lambda n, **kw: dict({"runKey": "k1", "pageUrl": P(n)}, **kw)

def finding(n, reason, selector, snippet, conf):
    return {"id": f"{P(n)}#motion-no-pause#{selector}#{reason}", "pageUrl": P(n), "rule": "motion-no-pause",
            "wcag": [{"criterion": "2.2.2", "level": "A", "version": "2.0"}], "method": "probe", "engines": ["probe"],
            "impact": "serious", "confidence": conf, "selector": selector, "snippet": snippet, "evidence": "", "count": 1}

def by(n, kind, selector):
    return [x for x in S(n, "second")[kind] if x["selector"] == selector][0]

def fnd(n, reason, kind, selector, conf):
    return finding(n, reason, selector, by(n, kind, selector)["snippet"], conf)

def second(n, findings, cid):
    return case(cid, [step("second", "PAGE_MEASURED", {"key": "k1:second", "json": live[n]["second"]}, "idle", [emit("PROBE_DONE", {"key": "k1", "probe": "motion", "findings": findings})], ent(n, snap=S(n, "first")))])

def firstmeasured(n, cid):
    s = step("first", "PAGE_MEASURED", {"key": "k1:first", "json": live[n]["first"]}, "waiting", [], ent(n))
    del s["expect"]["emits"]
    s["now"] = 1700000000000
    s["expect"]["entity"] = {"snap": S(n, "first"), "dueAt": "2023-11-14T22:13:23.000Z"}
    return case(cid, [s])

cf, cp, ex, ct = pages
cases = [
    case("PROBE_RUN asks the page for the first snapshot", [step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": URL}, "first", [emit("PAGE_MEASURE", {"key": "k1:first", "expression": EXPR})])]),
    case("control: a second PROBE_RUN while a run is in flight is refused as probe_busy", [step("waiting", "PROBE_RUN", {"key": "k2", "pageUrl": URL}, "waiting", [emit("PROBE_FAILED", {"key": "k2", "probe": "motion", "error": f"a run on {P(cf)} is in flight", "code": "probe_busy"})], ent(cf))]),
    case("control: a snapshot under another run's key is ignored", [step("first", "PAGE_MEASURED", {"key": "k2:first", "json": live[cf]["first"]} if False else {"key": "k2:first", "json": live[cf]["first"]}, "first", [], ent(cf))]),
    case("a page failure while waiting answers PROBE_FAILED probe_page_failed", [step("waiting", "PAGE_FAILED", {"key": "k1:first", "error": "tab closed", "code": "chrome_gone"}, "idle", [emit("PROBE_FAILED", {"key": "k1", "probe": "motion", "error": "tab closed", "code": "probe_page_failed"})], ent(cf))]),
    case("a first snapshot that is not the motion shape answers probe_bad_measure", [step("first", "PAGE_MEASURED", {"key": "k1:first", "json": "{\"elements\":3}"}, "idle", [emit("PROBE_FAILED", {"key": "k1", "probe": "motion", "error": "the page measurement is not the motion shape", "code": "probe_bad_measure"})], ent(cf))]),
    case("a second snapshot that is not the motion shape answers probe_bad_measure", [step("second", "PAGE_MEASURED", {"key": "k1:second", "json": "[]"}, "idle", [emit("PROBE_FAILED", {"key": "k1", "probe": "motion", "error": "the page measurement is not the motion shape", "code": "probe_bad_measure"})], ent(cf))]),
    firstmeasured(cf, "carousel-fail: the first snapshot is held and the second is due intervalMs later"),
    case("MOTION_DUE asks the page for the second snapshot", [step("waiting", "MOTION_DUE", {}, "second", [emit("PAGE_MEASURE", {"key": "k1:second", "expression": EXPR})], ent(cf))]),
    case("control: MOTION_DUE before the first snapshot is ignored", [step("first", "MOTION_DUE", {}, "first", [], ent(cf))]),
    second(cf, [fnd(cf, "advanced", "carousels", "#main>div:nth-of-type(1)", "confirmed")], "carousel-fail: the slide text changed between the snapshots and no button has aria-controls, so one confirmed finding"),
    second(cp, [], "control: carousel-pass advances too but holds a button with aria-pressed, a declared pause control, so no finding"),
    second(ex, [
        fnd(ex, "animation", "animations", "#spin", "confirmed"),
        fnd(ex, "animation", "animations", "#long", "confirmed"),
        fnd(ex, "moved", "elements", "#slider", "confirmed"),
        fnd(ex, "marquee", "marquees", "#news", "confirmed"),
    ], "motion-extra: the endless spinner, the 6 s fade, the moving slider and the marquee are found; the still element, the 4 s fade and the ended 2 s fade are not, and the spinner is not also reported as moved"),
    second(ct, [fnd(ct, "moved", "elements", "#slider", "needs-verification")], "motion-controlled: the spinner has an aria-controls pause button so only the slider is found, needs-verification because the page has a button with aria-controls"),
]
write(os.path.join(here, "..", "probe-motion.replay.goldens.json"), "a11y/atoms/std-a11y-probe-motion.lolo", "MotionProbe",
      "std-a11y-probe-motion with the page answers played as events. The snapshot JSON of each live case is the real result of the measure knob run in headless Chrome twice, 3.2 s apart (probe-motion.gen/gen_goldens.py), on carousel-fail, carousel-pass and probe-motion.gen/pages/motion-extra.html and motion-controlled.html; the expression asserted is probe-motion.gen/snapshot.measure.js. The 100 ms [background] tick that turns the due-at instant into MOTION_DUE is not played; MOTION_DUE is sent by hand. Regenerate with python3 -I probe-motion.gen/gen_goldens.py.", cases)
