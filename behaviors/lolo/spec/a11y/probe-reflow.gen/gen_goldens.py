import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
JS = open(os.path.join(HERE, "reflow.measure.js")).read().strip()
ALLOWED = "table,pre,img,video,canvas,svg,[role=img],map,object,embed"
rec = json.load(open(os.path.join(HERE, "recorded.json")))
URL = "http://127.0.0.1:24680/"
WCAG = [{"criterion": "1.4.10", "level": "AA", "version": "2.1"}]
E = {"runKey": "k1", "pageUrl": URL}


def viewport(key, w, h):
    return {"event": "PAGE_VIEWPORT", "payload": {"key": key, "width": w, "height": h, "deviceScaleFactor": 1, "mobile": False, "textZoom": 1}}


def finding(sel, snippet, conf):
    return {"id": f"{URL}#reflow#{sel}", "pageUrl": URL, "rule": "reflow", "wcag": WCAG, "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": conf, "selector": sel, "snippet": snippet, "evidence": "", "count": 1}


def page_finding(sw, cw):
    return finding("html", f"scrollWidth {sw} exceeds clientWidth {cw} at 320 CSS px", "confirmed")


def flow(id, name, findings, note=None):
    """Measured JSON -> restore request -> done with findings; the run steps are separate cases."""
    c = {"id": id, "steps": [
        {"from": "measuring", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:measure", "json": rec[name]},
         "expect": {"state": "restoring", "emits": [viewport("k1:restore", 1280, 800)]}},
        {"from": "restoring", "event": "PAGE_VIEWPORT_SET", "entity": dict(E, findings=findings), "payload": {"key": "k1:restore"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "reflow", "findings": findings}}]}}]}
    if note:
        c["note"] = note
    return c


def judged(id, raw, findings):
    return {"id": id, "steps": [
        {"from": "measuring", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:measure", "json": json.dumps(raw, separators=(",", ":"))},
         "expect": {"state": "restoring", "emits": [viewport("k1:restore", 1280, 800)], "entity": {"findings": findings}}}]}


offender = json.loads(rec["reflow-offender"])["offenders"][0]
cases = [
    {"id": "PROBE_RUN narrows the viewport to 320x256 under the run's step key", "steps": [
        {"from": "idle", "event": "PROBE_RUN", "payload": {"key": "k1", "pageUrl": URL},
         "expect": {"state": "narrowing", "emits": [viewport("k1:narrow", 320, 256)], "entity": {"runKey": "k1", "pageUrl": URL, "findings": []}}}]},
    {"id": "the narrow viewport answer asks for the measurement with the allowed list embedded", "steps": [
        {"from": "narrowing", "event": "PAGE_VIEWPORT_SET", "entity": E, "payload": {"key": "k1:narrow"},
         "expect": {"state": "measuring", "emits": [{"event": "PAGE_MEASURE", "payload": {"key": "k1:measure", "expression": f"({JS})({json.dumps(ALLOWED)})"}}]}}]},
    {"id": "control: a viewport answer under another run's key is ignored", "steps": [
        {"from": "narrowing", "event": "PAGE_VIEWPORT_SET", "entity": E, "payload": {"key": "k2:narrow"}, "expect": {"state": "narrowing", "emits": []}}]},
    flow("reflow-fail.html: a table 600px wide leaves scrollWidth 616 over clientWidth 320, one confirmed finding on the document",
         "reflow-fail", [page_finding(616, 320)], "recorded in headless Chrome at 320x256 (probe-reflow.gen/record.py); the table is two-dimensional content so no element is listed"),
    flow("control: reflow-pass.html scrolls no wider than the viewport and has no findings", "reflow-pass", []),
    flow("an element outside the allowed list that passes the viewport is a needs-verification finding after the confirmed one",
         "reflow-offender", [page_finding(500, 320), finding(offender["selector"], offender["snippet"], "needs-verification")],
         "probe-reflow.gen/reflow-offender.html: a 500px div and a 300px table"),
    judged("scrollWidth one over clientWidth is inside the tolerance of 1: no findings", {"scrollWidth": 321, "clientWidth": 320, "offenders": []}, []),
    judged("control: scrollWidth two over clientWidth is overflow", {"scrollWidth": 322, "clientWidth": 320, "offenders": []}, [page_finding(322, 320)]),
    judged("offenders without a page overflow are not reported", {"scrollWidth": 320, "clientWidth": 320, "offenders": [{"selector": "#a", "snippet": "<div>", "rect": {"x": 0, "y": 0, "width": 400, "height": 10}}]}, []),
    {"id": "a measurement that is not the reflow shape fails the probe", "steps": [
        {"from": "measuring", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:measure", "json": "{\"scrollWidth\":\"wide\"}"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "reflow", "code": "probe_bad_measure"}}], "neverEmits": ["PAGE_VIEWPORT"]}}]},
    {"id": "a page failure under the run key fails the probe", "steps": [
        {"from": "measuring", "event": "PAGE_FAILED", "entity": E, "payload": {"key": "k1:measure", "error": "no tab", "code": "chrome_no_tab"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "reflow", "error": "no tab", "code": "probe_page_failed"}}]}}]},
    {"id": "control: a page failure under another run's key is ignored", "steps": [
        {"from": "measuring", "event": "PAGE_FAILED", "entity": E, "payload": {"key": "k2:measure", "error": "no tab", "code": "chrome_no_tab"},
         "expect": {"state": "measuring", "emits": []}}]},
    {"id": "the restore answer finishes with an empty list when nothing was found", "steps": [
        {"from": "restoring", "event": "PAGE_VIEWPORT_SET", "entity": dict(E, findings=[]), "payload": {"key": "k1:restore"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "reflow", "findings": []}}]}}]},
]
doc = {"atom": "a11y/atoms/std-a11y-probe-reflow.lolo", "trait": "ReflowProbe",
       "note": "std-a11y-probe-reflow with the page answers played as events. The measure JSON of the reflow-fail, reflow-pass and reflow-offender cases is the real result of the measure expression in headless Chrome at 320x256 (probe-reflow.gen/record.py). Regenerate with python3 -I probe-reflow.gen/gen_goldens.py.",
       "cases": cases}
json.dump(doc, open(os.path.join(HERE, "..", "probe-reflow.replay.goldens.json"), "w"), indent=1)
