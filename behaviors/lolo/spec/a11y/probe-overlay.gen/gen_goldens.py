import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
expression = (here / "expression.js").read_text().strip()
URL = "http://127.0.0.1:24812/"
ENT = {"runKey": "k1", "pageUrl": URL}
def done(findings): return [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "overlay", "findings": findings}}]
def f(src, vendor): return {"id": f"overlay:{vendor}:{src}", "pageUrl": URL, "rule": "overlay", "wcag": [], "method": "probe", "engines": ["probe"], "impact": "moderate", "confidence": "confirmed", "selector": f'script[src="{src}"]', "snippet": src, "evidence": "", "count": 1}
def meas(json_text, emits, key="k1:measure"):
    return {"from": "measuring", "event": "PAGE_MEASURED", "entity": ENT, "payload": {"key": key, "json": json_text}, "expect": {"state": "idle", "emits": emits}}
def case(id, *steps): return {"id": id, "steps": list(steps)}
fail_src = json.loads(rec["overlay-script-fail.html"])["scripts"][0]
vendors = ["https://cdn.acsbapp.com/widget.js", "https://cdn.userway.org/widget.js", "https://vlibras.equalweb.com/x.js", "https://x.audioeye.com/ae.js", "https://api.reciteme.com/asset/js"]
names = ["accessiBe", "UserWay", "EqualWeb", "AudioEye", "Recite Me"]
cases = [
 case("PROBE_RUN asks the page for every script src under the run key",
  {"from": "idle", "event": "PROBE_RUN", "payload": {"key": "k1", "pageUrl": URL}, "expect": {"state": "measuring", "emits": [{"event": "PAGE_MEASURE", "payload": {"key": "k1:measure", "expression": expression}}]}}),
 case("overlay-script-fail: the local widget script is one confirmed overlay finding with no WCAG criterion", meas(rec["overlay-script-fail.html"], done([f(fail_src, "UserWay")]))),
 case("control: overlay-script-pass lists only the site's own script and finds no overlay", meas(rec["overlay-script-pass.html"], done([]))),
 case("each of the five vendors' hosts is recognised and the site's own script beside them is not",
  meas(json.dumps({"scripts": ["https://a.test/app.js"] + vendors}), done([f(s, n) for s, n in zip(vendors, names)]))),
 case("control: a host that only resembles a vendor name does not match", meas(json.dumps({"scripts": ["https://acsbapp-com.example/x.js", "https://notuserway.example/x.js"]}), done([]))),
 case("a page failure answers PROBE_FAILED with the page's code",
  {"from": "measuring", "event": "PAGE_FAILED", "entity": ENT, "payload": {"key": "k1:measure", "error": "evaluate threw", "code": "measure_failed"},
   "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "overlay", "error": "evaluate threw", "code": "measure_failed"}}]}}),
 case("control: an answer under another run's key is ignored", {"from": "measuring", "event": "PAGE_MEASURED", "entity": ENT, "payload": {"key": "k2:measure", "json": rec["overlay-script-fail.html"]}, "expect": {"state": "measuring", "emits": []}}),
 case("a measurement that is not a script list answers overlay_bad_reply",
  meas("{\"x\":1}", [{"event": "PROBE_FAILED", "payload": {"key": "k1", "probe": "overlay", "error": "the page answered no script list", "code": "overlay_bad_reply"}}])),
 case("a second PROBE_RUN while one is in flight answers probe_busy",
  {"from": "measuring", "event": "PROBE_RUN", "entity": ENT, "payload": {"key": "k2", "pageUrl": URL}, "expect": {"state": "measuring", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k2", "probe": "overlay", "code": "probe_busy"}}]}}),
]
out = {"atom": "a11y/atoms/std-a11y-probe-overlay.lolo", "trait": "OverlayProbe",
 "note": "std-a11y-probe-overlay with the page answer played as an event. The script lists of the fixtures are real, recorded through headless Chrome with record.py and expression.js. Regenerate with python3 -I probe-overlay.gen/gen_goldens.py.",
 "cases": cases}
(here.parent / "probe-overlay.replay.goldens.json").write_text(json.dumps(out, indent=1) + "\n")
