import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from cdp import Chrome, Site
from gl import step, case, emit, write, URL

def js(name):
    return open(os.path.join(here, name + ".measure.js")).read().strip()

SELECTORS = "[aria-describedby],[aria-haspopup],[data-tooltip]"
q = lambda v: json.dumps(v, separators=(",", ":"), ensure_ascii=False)
site = Site(here)
c = Chrome()
live = {}
try:
    for name in ["hover-content-fail", "hover-content-pass"]:
        c.navigate(f"{site.base}/{name}.html")
        found = c.evaluate(f"({js('find')})({q(SELECTORS)})")
        trig = json.loads(found)["triggers"][0]
        focus = c.evaluate(f"({js('focus')})({q(trig['selector'])})")
        f = json.loads(focus)
        hover = c.evaluate(f"({js('hover')})({q(trig['selector'])},{q(f['content'])})")
        c.key("Escape")
        after = c.evaluate(f"({js('after')})({q(f['revealed'])})")
        live[name] = {"find": found, "focus": focus, "hover": hover, "after": after}
        if name == "hover-content-fail":
            live["missing"] = {"focus": c.evaluate(f"({js('focus')})({q('#no-such-trigger')})")}
finally:
    c.close(); site.close()
json.dump(live, open(os.path.join(here, "recorded.json"), "w"), indent=1)

fail, ok = "hover-content-fail", "hover-content-pass"
P = lambda n: URL + n + ".html"
T = lambda n: json.loads(live[n]["find"])["triggers"][0]
F = lambda n: json.loads(live[n]["focus"])
ent = lambda n, **kw: dict({"runKey": "k1", "pageUrl": P(n)}, **kw)

def finding(n, reason, impact, conf):
    t = T(n)
    return {"id": f"{P(n)}#hover-content#{t['selector']}#{reason}", "pageUrl": P(n), "rule": "hover-content",
            "wcag": [{"criterion": "1.4.13", "level": "AA", "version": "2.1"}], "method": "probe", "engines": ["probe"],
            "impact": impact, "confidence": conf, "selector": t["selector"], "snippet": t["snippet"], "evidence": "", "count": 1}

def st(frm, event, payload, state, n, emits=None, entity=None, **expect_entity):
    s = step(frm, event, payload, state, emits if emits is not None else [], ent(n, **(entity or {})))
    if emits is None:
        del s["expect"]["emits"]
    if expect_entity:
        s["expect"]["entity"] = expect_entity
    return s

focus_expr = lambda n: "(" + js("focus") + ")(" + q(T(n)["selector"]) + ")"
cases = [
    case("PROBE_RUN asks the page for the declared trigger elements", [step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": URL}, "finding", [emit("PAGE_MEASURE", {"key": "k1:find", "expression": "(" + js("find") + ")(" + q(SELECTORS) + ")"})])]),
    case("control: a second PROBE_RUN while a run is in flight is refused as probe_busy", [step("finding", "PROBE_RUN", {"key": "k2", "pageUrl": URL}, "finding", [emit("PROBE_FAILED", {"key": "k2", "probe": "hover", "error": f"a run on {P(fail)} is in flight", "code": "probe_busy"})], ent(fail))]),
    case("control: a trigger list under another run's key is ignored", [st("finding", "PAGE_MEASURED", {"key": "k2:find", "json": live[fail]["find"]}, "finding", fail, emits=[])]),
    case("a page failure answers PROBE_FAILED probe_page_failed", [st("finding", "PAGE_FAILED", {"key": "k1:find", "error": "evaluation threw", "code": "chrome_eval"}, "idle", fail, emits=[emit("PROBE_FAILED", {"key": "k1", "probe": "hover", "error": "evaluation threw", "code": "probe_page_failed"})])]),
    case("a trigger list that is not the declared shape answers probe_bad_measure", [st("finding", "PAGE_MEASURED", {"key": "k1:find", "json": "{\"triggers\":3}"}, "idle", fail, emits=[emit("PROBE_FAILED", {"key": "k1", "probe": "hover", "error": "the page measurement is not the trigger list shape", "code": "probe_bad_measure"})])]),
    case("hover-content-fail: the trigger list is held", [st("finding", "PAGE_MEASURED", {"key": "k1:find", "json": live[fail]["find"]}, "finding", fail, triggers=[T(fail)])]),
    case("a held trigger list focuses the first trigger", [st("finding", "HOVER_FOUND", {}, "focusing", fail, entity={"triggers": [T(fail)]}, emits=[emit("PAGE_MEASURE", {"key": "k1:focus", "expression": focus_expr(fail)})])]),
    case("control: a page with no trigger answers no findings and touches nothing", [st("finding", "HOVER_FOUND", {}, "idle", fail, entity={"triggers": []}, emits=[emit("PROBE_DONE", {"key": "k1", "probe": "hover", "findings": []})])]),
    case("hover-content-fail: focusing the trigger reveals the bubble, held with its gap to the trigger", [st("focusing", "PAGE_MEASURED", {"key": "k1:focus", "json": live[fail]["focus"]}, "focusing", fail, entity={"triggers": [T(fail)], "at": 0}, focused=F(fail)["focused"], revealed=F(fail)["revealed"], content=F(fail)["content"], gap=F(fail)["gap"])]),
    case("a trigger the page no longer has is measured as missing, not focused, with nothing revealed, and the page is restored", [
        st("focusing", "PAGE_MEASURED", {"key": "k1:focus", "json": live["missing"]["focus"]}, "focusing", fail, entity={"triggers": [T(fail)], "at": 0}, focused=False, revealed=[], content="", gap=0),
        st("focusing", "HOVER_FOCUSED", {}, "restoring", fail, entity={"triggers": [T(fail)], "at": 0, "focused": False, "revealed": []}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": P(fail)})])]),
    case("hover-content-pass: the bubble touches its trigger so the gap is zero", [st("focusing", "PAGE_MEASURED", {"key": "k1:focus", "json": live[ok]["focus"]}, "focusing", ok, entity={"triggers": [T(ok)], "at": 0}, gap=F(ok)["gap"])]),
    case("revealed content sends mouseover to the trigger and the content", [st("focusing", "HOVER_FOCUSED", {}, "hovering", fail, entity={"triggers": [T(fail)], "at": 0, "focused": True, "revealed": F(fail)["revealed"], "content": F(fail)["content"]}, emits=[emit("PAGE_MEASURE", {"key": "k1:hover", "expression": "(" + js("hover") + ")(" + q(T(fail)["selector"]) + "," + q(F(fail)["content"]) + ")"})])]),
    case("control: a trigger that did not take focus is skipped and the page restored", [st("focusing", "HOVER_FOCUSED", {}, "restoring", fail, entity={"triggers": [T(fail)], "at": 0, "focused": False, "revealed": []}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": P(fail)})])]),
    case("control: a focused trigger that revealed nothing is skipped and the page restored", [st("focusing", "HOVER_FOCUSED", {}, "restoring", fail, entity={"triggers": [T(fail)], "at": 0, "focused": True, "revealed": []}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": P(fail)})])]),
    case("hover-content-fail: content that stays visible under the pointer presses Escape", [st("hovering", "PAGE_MEASURED", {"key": "k1:hover", "json": live[fail]["hover"]}, "escaping", fail, emits=[emit("PAGE_KEY", {"key": "k1:escape", "keyName": "Escape"})], hoverLost=False)]),
    case("content that hides as the pointer moves onto it is held as lost", [st("hovering", "PAGE_MEASURED", {"key": "k1:hover", "json": "{\"visible\":false}"}, "escaping", fail, emits=[emit("PAGE_KEY", {"key": "k1:escape", "keyName": "Escape"})], hoverLost=True)]),
    case("Escape sent asks which revealed elements are still visible", [st("escaping", "PAGE_KEY_SENT", {"key": "k1:escape"}, "checking", fail, entity={"revealed": F(fail)["revealed"]}, emits=[emit("PAGE_MEASURE", {"key": "k1:after", "expression": "(" + js("after") + ")(" + q(F(fail)["revealed"]) + ")"})])]),
    case("control: a key answer under another run's key is ignored", [st("escaping", "PAGE_KEY_SENT", {"key": "k2:escape"}, "escaping", fail, emits=[])]),
    case("hover-content-fail: the bubble is still visible after Escape, so not dismissible (confirmed) and a gap to its trigger (needs-verification)", [st("checking", "PAGE_MEASURED", {"key": "k1:after", "json": live[fail]["after"]}, "restoring", fail, entity={"triggers": [T(fail)], "at": 0, "revealed": F(fail)["revealed"], "gap": F(fail)["gap"], "hoverLost": False, "findings": []}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": P(fail)})], findings=[finding(fail, "not-dismissible", "serious", "confirmed"), finding(fail, "gap", "moderate", "needs-verification")])]),
    case("control: hover-content-pass dismisses on Escape and touches its trigger, so no finding", [st("checking", "PAGE_MEASURED", {"key": "k1:after", "json": live[ok]["after"]}, "restoring", ok, entity={"triggers": [T(ok)], "at": 0, "revealed": F(ok)["revealed"], "gap": F(ok)["gap"], "hoverLost": False, "findings": []}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": P(ok)})], findings=[])]),
    case("content lost under the pointer is not hoverable (confirmed)", [st("checking", "PAGE_MEASURED", {"key": "k1:after", "json": live[ok]["after"]}, "restoring", ok, entity={"triggers": [T(ok)], "at": 0, "revealed": F(ok)["revealed"], "gap": 0, "hoverLost": True, "findings": []}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": P(ok)})], findings=[finding(ok, "not-hoverable", "serious", "confirmed")])]),
    case("a restored page moves to the next trigger", [st("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": P(fail), "title": "t"}, "focusing", fail, entity={"triggers": [T(fail), {"selector": "#second", "snippet": "<a id=\"second\">"}], "at": 0}, emits=[emit("PAGE_MEASURE", {"key": "k1:focus", "expression": "(" + js("focus") + ")(" + q("#second") + ")"})], at=1)]),
    case("control: after the last trigger the restored page answers the held findings", [st("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": P(fail), "title": "t"}, "idle", fail, entity={"triggers": [T(fail)], "at": 0, "findings": [finding(fail, "not-dismissible", "serious", "confirmed")]}, emits=[emit("PROBE_DONE", {"key": "k1", "probe": "hover", "findings": [finding(fail, "not-dismissible", "serious", "confirmed")]})])]),
]
write(os.path.join(here, "..", "probe-hover.replay.goldens.json"), "a11y/atoms/std-a11y-probe-hover.lolo", "HoverProbe",
      "std-a11y-probe-hover with the page answers played as events. The measure JSON of each live case is the real result of the four measure knobs run in headless Chrome (probe-hover.gen/gen_goldens.py, with a real Escape key through CDP) on hover-content-fail and hover-content-pass; the expressions asserted are probe-hover.gen/*.measure.js. Regenerate with python3 -I probe-hover.gen/gen_goldens.py.", cases)
print(json.dumps(live, indent=1))
