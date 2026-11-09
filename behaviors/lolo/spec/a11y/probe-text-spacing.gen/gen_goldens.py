import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
rec = json.load(open(os.path.join(HERE, "recorded.json")))
js = {n: open(os.path.join(HERE, f"{n}.measure.js")).read().strip() for n in ["clipped", "inject", "remove"]}
URL = "http://127.0.0.1:24680/"
STYLE_ID = "almadar-a11y-text-spacing"
E = {"runKey": "k1", "pageUrl": URL, "baseline": [], "findings": []}
compact = lambda v: json.dumps(v, separators=(",", ":"))


def measure(key, expression):
    return {"event": "PAGE_MEASURE", "payload": {"key": key, "expression": expression}}


CLIPPED = measure("k1:base", f"({js['clipped']})()")
INJECT = measure("k1:inject", f"({js['inject']})({json.dumps(STYLE_ID)},{json.dumps(rec['css'])})")
SPACED = measure("k1:spaced", f"({js['clipped']})()")
REMOVE = measure("k1:remove", f"({js['remove']})({json.dumps(STYLE_ID)})")


def finding(el):
    return {"id": f"{URL}#text-spacing#{el['selector']}", "pageUrl": URL, "rule": "text-spacing", "wcag": [{"criterion": "1.4.12", "level": "AA", "version": "2.1"}], "method": "probe", "engines": ["probe"], "impact": "moderate", "confidence": "needs-verification", "selector": el["selector"], "snippet": el["snippet"], "evidence": "", "count": 1}


def els(page, step):
    return json.loads(rec[page][step])["elements"]


def el(sel, sw, cw, sh, ch, ox="hidden", oy="hidden"):
    return {"selector": sel, "snippet": "<p>", "overflowX": ox, "overflowY": oy, "scrollWidth": sw, "clientWidth": cw, "scrollHeight": sh, "clientHeight": ch}


def base_case(id, page, baseline):
    return {"id": id, "steps": [{"from": "baselining", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:base", "json": rec[page]["base"]},
                                 "expect": {"state": "injecting", "emits": [INJECT], "entity": {"baseline": baseline}}}]}


def spaced_case(id, page, baseline, findings):
    return {"id": id, "steps": [{"from": "spaced", "event": "PAGE_MEASURED", "entity": dict(E, baseline=baseline), "payload": {"key": "k1:spaced", "json": rec[page]["spaced"]},
                                 "expect": {"state": "removing", "emits": [REMOVE], "entity": {"findings": findings}}}]}


def synthetic(id, baseline, spaced, findings):
    return {"id": id, "steps": [{"from": "spaced", "event": "PAGE_MEASURED", "entity": dict(E, baseline=baseline), "payload": {"key": "k1:spaced", "json": compact({"elements": spaced})},
                                 "expect": {"state": "removing", "entity": {"findings": findings}}}]}


fail_base = els("text-spacing-fail", "base")
pre_base = els("text-spacing-preclipped", "base")
pre_spaced = els("text-spacing-preclipped", "spaced")
cases = [
    {"id": "PROBE_RUN measures the clipped text before any change", "steps": [
        {"from": "idle", "event": "PROBE_RUN", "payload": {"key": "k1", "pageUrl": URL},
         "expect": {"state": "baselining", "emits": [CLIPPED], "entity": {"runKey": "k1", "pageUrl": URL, "baseline": [], "findings": []}}}]},
    base_case("text-spacing-fail.html at normal spacing: the 3-line note already overflows its 2-line box and is the baseline", "text-spacing-fail", fail_base),
    base_case("control: text-spacing-pass.html has nothing clipped", "text-spacing-pass", []),
    base_case("text-spacing-preclipped.html at normal spacing: only the box already losing lines is in the baseline", "text-spacing-preclipped", [pre_base[1]]),
    {"id": "the style answer asks for the measurement under the overrides", "steps": [
        {"from": "injecting", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:inject", "json": rec["text-spacing-fail"]["inject"]},
         "expect": {"state": "spaced", "emits": [SPACED]}}]},
    spaced_case("text-spacing-fail.html with the overrides: the note loses more lines (scrollHeight 58 to 96 in a 38px box), one finding", "text-spacing-fail", fail_base, [finding(els("text-spacing-fail", "spaced")[0])]),
    spaced_case("control: text-spacing-pass.html grows with its text and has no findings", "text-spacing-pass", [], []),
    spaced_case("a box that fitted and now clips is a finding, and so is a box that already clipped and loses more", "text-spacing-preclipped", [pre_base[1]], [finding(pre_spaced[0]), finding(pre_spaced[1])]),
    synthetic("control: a box clipped before and clipped the same amount is not reported", [el("#a", 100, 100, 58, 38)], [el("#a", 100, 100, 58, 38)], []),
    synthetic("control: growth of one px is inside the tolerance of 1", [el("#a", 100, 100, 58, 38)], [el("#a", 100, 100, 59, 38)], []),
    synthetic("growth of two px past the baseline extent is reported", [el("#a", 100, 100, 58, 38)], [el("#a", 100, 100, 60, 38)], [finding(el("#a", 100, 100, 60, 38))]),
    synthetic("growth on an axis that does not clip is not reported", [el("#a", 100, 100, 58, 38, "hidden", "auto")], [el("#a", 100, 100, 90, 38, "hidden", "auto")], []),
    synthetic("clipping on x that appears with the overrides is reported", [], [el("#a", 140, 100, 20, 20, "clip", "visible")], [finding(el("#a", 140, 100, 20, 20, "clip", "visible"))]),
    {"id": "the removal answer finishes with the held findings", "steps": [
        {"from": "removing", "event": "PAGE_MEASURED", "entity": dict(E, findings=[finding(els("text-spacing-fail", "spaced")[0])]), "payload": {"key": "k1:remove", "json": rec["text-spacing-fail"]["remove"]},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "text-spacing", "findings": [finding(els("text-spacing-fail", "spaced")[0])]}}]}}]},
    {"id": "control: a removal that finds no style fails the probe", "steps": [
        {"from": "removing", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:remove", "json": compact({"id": STYLE_ID, "removed": False})},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "text-spacing", "code": "probe_style_missing"}}], "neverEmits": ["PROBE_DONE"]}}]},
    {"id": "a removal answer that is not the declared shape fails the probe", "steps": [
        {"from": "removing", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:remove", "json": "[]"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "text-spacing", "code": "probe_style_missing"}}]}}]},
    {"id": "control: a removal answer under another run's key is ignored", "steps": [
        {"from": "removing", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k2:remove", "json": rec["text-spacing-fail"]["remove"]}, "expect": {"state": "removing", "emits": []}}]},
    {"id": "a clipped-text measurement that is not the declared shape fails the probe", "steps": [
        {"from": "spaced", "event": "PAGE_MEASURED", "entity": E, "payload": {"key": "k1:spaced", "json": "{\"elements\":3}"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "text-spacing", "code": "probe_bad_measure"}}]}}]},
    {"id": "a page failure under the run key fails the probe", "steps": [
        {"from": "injecting", "event": "PAGE_FAILED", "entity": E, "payload": {"key": "k1:inject", "error": "eval threw", "code": "chrome_eval"},
         "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "text-spacing", "error": "eval threw", "code": "probe_page_failed"}}]}}]},
    {"id": "control: a page failure under another run's key is ignored", "steps": [
        {"from": "injecting", "event": "PAGE_FAILED", "entity": E, "payload": {"key": "k2:inject", "error": "eval threw", "code": "chrome_eval"}, "expect": {"state": "injecting", "emits": []}}]},
]
doc = {"atom": "a11y/atoms/std-a11y-probe-text-spacing.lolo", "trait": "TextSpacingProbe",
       "note": "std-a11y-probe-text-spacing with the page answers played as events. Every measure JSON of the fixture cases is the real result of the atom's expressions in headless Chrome with the WCAG 1.4.12 style injected and removed (probe-text-spacing.gen/record.py); the style text asserted is the one the knobs build. Regenerate with python3 -I probe-text-spacing.gen/gen_goldens.py.",
       "cases": cases}
json.dump(doc, open(os.path.join(HERE, "..", "probe-text-spacing.replay.goldens.json"), "w"), indent=1)
