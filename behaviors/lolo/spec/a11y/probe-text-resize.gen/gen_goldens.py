import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
rec = json.load(open(os.path.join(HERE, "recorded.json")))
ATOM = open(os.path.join(HERE, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-text-resize.lolo")).read()
CLIP = open(os.path.join(HERE, "clipped.measure.js")).read().strip()
VP = open(os.path.join(HERE, "viewport.measure.js")).read().strip()
URL = "http://127.0.0.1:24680/"
E = {"runKey": "k1", "pageUrl": URL, "baseline": [], "findings": []}


def viewport(key, zoom):
    return {"event": "PAGE_VIEWPORT", "payload": {"key": key, "width": 1280, "height": 800, "deviceScaleFactor": 1, "mobile": False, "textZoom": zoom}}


def measure(key, js):
    return {"event": "PAGE_MEASURE", "payload": {"key": key, "expression": f"({js})()"}}


def zoom_finding(snippet):
    return {"id": f"{URL}#viewport-zoom-blocked#meta[name=viewport]", "pageUrl": URL, "rule": "viewport-zoom-blocked", "wcag": [{"criterion": "1.4.4", "level": "AA", "version": "2.0"}], "method": "probe", "engines": ["probe"], "impact": "critical", "confidence": "confirmed", "selector": "meta[name=viewport]", "snippet": snippet, "evidence": "", "count": 1}


def clip_finding(sel, snippet):
    return {"id": f"{URL}#text-resize#{sel}", "pageUrl": URL, "rule": "text-resize", "wcag": [{"criterion": "1.4.4", "level": "AA", "version": "2.0"}], "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": "needs-verification", "selector": sel, "snippet": snippet, "evidence": "", "count": 1}


def els(page, step):
    return json.loads(rec[page][step])["elements"]


def meta_case(id, page, findings, note=None):
    c = {"id": id, "steps": [{"from": "reading", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:meta", "json": rec[page]["meta"]},
                              "expect": {"state": "baselining", "emits": [measure("k1:base", CLIP)], "entity": {"findings": findings}}}]}
    if note:
        c["note"] = note
    return c


def base_case(id, page, baseline):
    return {"id": id, "steps": [{"from": "baselining", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:base", "json": rec[page]["base"]},
                                 "expect": {"state": "zooming", "emits": [viewport("k1:zoom", 2)], "entity": {"baseline": baseline}}}]}


def zoomed_case(id, page, baseline, before, findings):
    return {"id": id, "steps": [{"from": "zoomed", "event": "PAGE_MEASURED", "entity": dict(E, baseline=baseline, findings=before), "payload": {"key": "k1:zoomed", "json": rec[page]["zoomed"]},
                                 "expect": {"state": "restoring", "emits": [viewport("k1:restore", 1)], "entity": {"findings": findings}}}]}


SEL = "#main>div:nth-of-type(1)"
SEL2 = "#main>div:nth-of-type(2)"
promo = els("text-resize-fail", "zoomed")[0]["snippet"]
pre = els("text-resize-preclipped", "zoomed")
cases = [
    {"id": "PROBE_RUN reads the viewport meta tag under the run's step key", "steps": [
        {"from": "idle", "event": "PROBE_RUN", "payload": {"key": "k1", "pageUrl": URL},
         "expect": {"state": "reading", "emits": [measure("k1:meta", VP)], "entity": {"runKey": "k1", "pageUrl": URL, "baseline": [], "findings": []}}}]},
    meta_case("viewport-blocked.html: user-scalable=no is one confirmed viewport-zoom-blocked finding", "viewport-blocked",
              [zoom_finding(json.loads(rec["viewport-blocked"]["meta"])["snippet"])], "recorded in headless Chrome (probe-text-resize.gen/record.py)"),
    meta_case("viewport-maxscale.html: maximum-scale=1.5 is below 2 and blocks zoom", "viewport-maxscale", [zoom_finding(json.loads(rec["viewport-maxscale"]["meta"])["snippet"])]),
    meta_case("control: maximum-scale=5 leaves zoom open", "viewport-open", []),
    meta_case("control: a page with no viewport meta blocks nothing", "viewport-none", []),
    meta_case("control: the fixtures' width=device-width, initial-scale=1 blocks nothing", "text-resize-pass", []),
    base_case("text-resize-fail.html at zoom 1: the promo box is not yet clipped, the baseline is empty and zoom 2 is requested", "text-resize-fail", []),
    base_case("control: text-resize-pass.html has no clipping candidates", "text-resize-pass", []),
    base_case("text-resize-preclipped.html at zoom 1: the box that already loses lines goes into the baseline", "text-resize-preclipped", [SEL]),
    {"id": "the zoom viewport answer asks for the measurement again", "steps": [
        {"from": "zooming", "event": "PAGE_VIEWPORT_SET", "entity": E, "payload": {"key": "k1:zoom"}, "expect": {"state": "zoomed", "emits": [measure("k1:zoomed", CLIP)]}}]},
    zoomed_case("text-resize-fail.html at 200%: the promo box wraps to 48px in a 24px box, one text-resize finding", "text-resize-fail", [], [], [clip_finding(SEL, promo)]),
    zoomed_case("control: text-resize-pass.html grows with its text at 200% and has no findings", "text-resize-pass", [], [], []),
    zoomed_case("a box clipped at both sizes is not reported, only the one newly clipped", "text-resize-preclipped", [SEL], [], [clip_finding(SEL2, pre[1]["snippet"])]),
    zoomed_case("control: with an empty baseline both boxes are reported", "text-resize-preclipped", [], [], [clip_finding(SEL, pre[0]["snippet"]), clip_finding(SEL2, pre[1]["snippet"])]),
    zoomed_case("a blocked-zoom finding is kept ahead of the clipped-text findings", "text-resize-fail", [], [zoom_finding("<meta>")], [zoom_finding("<meta>"), clip_finding(SEL, promo)]),
    {"id": "text within the tolerance of its box is not clipped", "steps": [
        {"from": "zoomed", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:zoomed", "json": json.dumps({"elements": [
            {"selector": "#a", "snippet": "<p>", "overflowX": "hidden", "overflowY": "hidden", "scrollWidth": 100, "clientWidth": 100, "scrollHeight": 25, "clientHeight": 24}]}, separators=(",", ":"))},
         "expect": {"state": "restoring", "entity": {"findings": []}}}]},
    {"id": "control: scroll overflow on an axis whose overflow is auto is not clipping", "steps": [
        {"from": "zoomed", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:zoomed", "json": json.dumps({"elements": [
            {"selector": "#a", "snippet": "<p>", "overflowX": "auto", "overflowY": "auto", "scrollWidth": 300, "clientWidth": 100, "scrollHeight": 90, "clientHeight": 24}]}, separators=(",", ":"))},
         "expect": {"state": "restoring", "entity": {"findings": []}}}]},
    {"id": "control: the same extents with overflow hidden on x only are clipped on x", "steps": [
        {"from": "zoomed", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:zoomed", "json": json.dumps({"elements": [
            {"selector": "#a", "snippet": "<p>", "overflowX": "hidden", "overflowY": "auto", "scrollWidth": 300, "clientWidth": 100, "scrollHeight": 90, "clientHeight": 24}]}, separators=(",", ":"))},
         "expect": {"state": "restoring", "entity": {"findings": [clip_finding("#a", "<p>")]}}}]},
    {"id": "the restore answer finishes with the held findings", "steps": [
        {"from": "restoring", "event": "PAGE_VIEWPORT_SET", "entity": dict(E, findings=[clip_finding(SEL, promo)]), "payload": {"key": "k1:restore"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "text-resize", "findings": [clip_finding(SEL, promo)]}}]}}]},
    {"id": "control: a restore answer under another run's key is ignored", "steps": [
        {"from": "restoring", "event": "PAGE_VIEWPORT_SET", "entity": E, "payload": {"key": "k2:restore"}, "expect": {"state": "restoring", "emits": []}}]},
    {"id": "a clipped-text measurement that is not the declared shape fails the probe", "steps": [
        {"from": "baselining", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:base", "json": "{\"elements\":3}"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "text-resize", "code": "probe_bad_measure"}}]}}]},
    {"id": "a page failure under the run key fails the probe", "steps": [
        {"from": "zooming", "event": "PAGE_FAILED", "entity": E, "payload": {"key": "k1:zoom", "error": "no tab", "code": "chrome_no_tab"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "text-resize", "error": "no tab", "code": "probe_page_failed"}}]}}]},
    {"id": "control: a page failure under another run's key is ignored", "steps": [
        {"from": "zooming", "event": "PAGE_FAILED", "entity": E, "payload": {"key": "k2:zoom", "error": "no tab", "code": "chrome_no_tab"}, "expect": {"state": "zooming", "emits": []}}]},
]
doc = {"atom": "a11y/atoms/std-a11y-probe-text-resize.lolo", "trait": "TextResizeProbe",
       "note": "std-a11y-probe-text-resize with the page answers played as events. Every measure JSON of the fixture cases is the real result of the atom's expressions in headless Chrome (probe-text-resize.gen/record.py); 200% text zoom was recorded as Chrome page zoom, a 640x400 CSS px viewport at device scale 2, because scaling the root font-size does not reach text sized in px. Regenerate with python3 -I probe-text-resize.gen/gen_goldens.py.",
       "cases": cases}
json.dump(doc, open(os.path.join(HERE, "..", "probe-text-resize.replay.goldens.json"), "w"), indent=1)
