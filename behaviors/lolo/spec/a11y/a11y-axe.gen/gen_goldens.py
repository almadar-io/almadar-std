import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
expression = (here / "expression.js").read_text().strip()
URL = "http://127.0.0.1:24680/"
ENT = lambda: {"runKey": "k1", "pageUrl": URL}
def wc(c, lvl, ver): return {"criterion": c, "level": lvl, "version": ver}
def finding(page, rule, wcag, impact, conf, sel, html, ver="axe-core 4.14.0"):
    return {"id": f"axe:{rule}:{sel}", "pageUrl": page, "rule": rule, "wcag": wcag, "method": "engine", "engines": ["axe"], "impact": impact, "confidence": conf, "selector": sel, "snippet": html, "evidence": ver, "count": 1}
def measured(name, key="k1:measure", entity=None, findings=None, reply=None):
    return {"from": "measuring", "event": "PAGE_MEASURED", "entity": entity or ENT(), "payload": {"key": key, "json": reply if reply is not None else rec[name]},
            "expect": {"state": "idle", "emits": [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "axe", "findings": findings}}]}}
def case(id, *steps): return {"id": id, "steps": list(steps)}
def reply(v): return json.dumps({"version": "4.14.0", "violations": v}, separators=(",", ":"))
cases = [
 case("PROBE_RUN asks the page to evaluate the granted script under the run key",
  {"from": "idle", "event": "PROBE_RUN", "payload": {"key": "k1", "pageUrl": URL},
   "expect": {"state": "injecting", "emits": [{"event": "PAGE_INJECT", "payload": {"key": "k1:inject", "script": "axe-core/axe.min.js"}}]}}),
 case("PAGE_INJECTED asks the page to run axe with the recorded expression",
  {"from": "injecting", "event": "PAGE_INJECTED", "entity": ENT(), "payload": {"key": "k1:inject"},
   "expect": {"state": "measuring", "emits": [{"event": "PAGE_MEASURE", "payload": {"key": "k1:measure", "expression": expression}}]}}),
 case("control: an injected answer under another run's key is ignored",
  {"from": "injecting", "event": "PAGE_INJECTED", "entity": ENT(), "payload": {"key": "k2:inject"},
   "expect": {"state": "injecting", "emits": []}}),
 case("img-alt-fail: the missing alt is one confirmed critical finding with WCAG 1.1.1 and the axe version",
  measured("img-alt-fail.html", findings=[finding(URL, "image-alt", [wc("1.1.1", "A", "2.0")], "critical", "confirmed", "img", '<img class="photo" src="img/lonec.svg" width="120" height="80">')])),
 case("control: img-alt-pass has no violation and answers no findings",
  measured("img-alt-pass.html", findings=[])),
 case("contrast-fail: low contrast is serious and needs verification, WCAG 1.4.3 AA",
  measured("contrast-fail.html", findings=[finding(URL, "color-contrast", [wc("1.4.3", "AA", "2.0")], "serious", "needs-verification", "p", '<p class="muted" style="color:#999">Cena brez DDV ni prikazana.</p>')])),
 case("control: contrast-pass has no violation and answers no findings",
  measured("contrast-pass.html", findings=[])),
 case("lang-missing-fail: html-has-lang is confirmed, WCAG 3.1.1",
  measured("lang-missing-fail.html", findings=[finding(URL, "html-has-lang", [wc("3.1.1", "A", "2.0")], "serious", "confirmed", "html", "<html>")])),
 case("a WCAG 2.2 rule with a two digit sub-criterion keeps its version and dotted criterion; a rule with two nodes gives two findings",
  measured(None, reply=reply([{"id": "target-size", "impact": "serious", "tags": ["cat.sensory-and-visual-cues", "wcag22aa", "wcag258"], "nodes": [{"target": "#a", "html": "<a id=\"a\">x</a>"}, {"target": "#b", "html": "<a id=\"b\">y</a>"}]}]),
   findings=[finding(URL, "target-size", [wc("2.5.8", "AA", "2.2")], "serious", "needs-verification", "#a", "<a id=\"a\">x</a>"), finding(URL, "target-size", [wc("2.5.8", "AA", "2.2")], "serious", "needs-verification", "#b", "<a id=\"b\">y</a>")])),
 case("a four digit criterion tag becomes a dotted criterion and a null impact takes the unmapped impact",
  measured(None, reply=reply([{"id": "avoid-inline-spacing", "tags": ["wcag21aa", "wcag1412"], "nodes": [{"target": "p", "html": "<p>"}]}]),
   findings=[finding(URL, "avoid-inline-spacing", [wc("1.4.12", "AA", "2.1")], "moderate", "needs-verification", "p", "<p>")])),
 case("a rule with no wcagNNN tag keeps an empty wcag list",
  measured(None, reply=reply([{"id": "x-rule", "impact": "minor", "tags": ["wcag2a"], "nodes": [{"target": "p", "html": "<p>"}]}]),
   findings=[finding(URL, "x-rule", [], "minor", "needs-verification", "p", "<p>")])),
 case("a page failure while injecting answers PROBE_FAILED with the page's code",
  {"from": "injecting", "event": "PAGE_FAILED", "entity": ENT(), "payload": {"key": "k1:inject", "error": "no such file", "code": "inject_failed"},
   "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "axe", "error": "no such file", "code": "inject_failed"}}]}}),
 case("a measure answer that is not an axe result answers axe_bad_reply",
  {"from": "measuring", "event": "PAGE_MEASURED", "entity": ENT(), "payload": {"key": "k1:measure", "json": "{\"x\":1}"},
   "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "axe", "error": "the page answered no axe result", "code": "axe_bad_reply"}}]}}),
 case("a second PROBE_RUN while one is in flight answers probe_busy and keeps the first",
  {"from": "measuring", "event": "PROBE_RUN", "entity": ENT(), "payload": {"key": "k2", "pageUrl": URL},
   "expect": {"state": "measuring", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k2", "probe": "axe", "code": "probe_busy"}}]}}),
]
out = {"atom": "a11y/atoms/std-a11y-axe.lolo", "trait": "AxeProbe",
       "note": "std-a11y-axe with the page answers played as events. The measure JSON of the img-alt, contrast and lang-missing cases is the real reduced result of axe-core 4.14.0 run through headless Chrome (a11y-axe.gen/record.py) on the fixtures; the expression asserted is a11y-axe.gen/expression.js. Regenerate with python3 -I a11y-axe.gen/gen_goldens.py.",
       "cases": cases}
(here.parent / "a11y-axe.replay.goldens.json").write_text(json.dumps(out, indent=1) + "\n")
