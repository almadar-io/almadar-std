import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
rd = lambda n: (here / f"context-{n}.measure.js").read_text().strip()
INV, READ = f"({rd('inventory')})()", f"({rd('read')})()"
ACT = lambda sel, kind, ch="a": f"({rd('act')})({json.dumps(sel)},{json.dumps(kind)},{json.dumps(ch)})"
SYN = "https://a.test/p"
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
W = [{"criterion": "3.2.2", "level": "A", "version": "2.0"}]
RULE = {"select": "context-change-select", "search": "context-change-input"}
def finding(page, kind, sel, snippet):
    return {"id": f"{page}#{RULE[kind]}#{sel}", "pageUrl": page, "rule": RULE[kind], "wcag": W, "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": "confirmed", "selector": sel, "snippet": snippet, "evidence": "", "count": 1}
def step(frm, event, payload, state, emits, entity=None):
    s = {"from": frm, "event": event, "payload": payload, "expect": {"state": state, "emits": emits}}
    if entity is not None: s["entity"] = entity
    return s
measure = lambda key, expr: {"event": "PAGE_MEASURE", "payload": {"key": key, "expression": expr}}
nav = lambda url: {"event": "PAGE_NAVIGATE", "payload": {"key": "k:back", "url": url}}
done = lambda findings: {"event": "PROBE_DONE", "payload": {"key": "k", "probe": "context-change", "findings": findings}}
item = lambda sel, kind="select", testable=True: {"selector": sel, "snippet": f"<{'select' if kind == 'select' else 'input'} id=\"{sel[1:]}\">", "kind": kind, "testable": testable}
acted = lambda href=SYN, found=True: J({"found": found, "href": href, "api": True})
readj = lambda href=SYN, navs=(), opened=0, patched=True: J({"patched": patched, "href": href, "navigations": list(navs), "opened": opened, "api": True})
NAV = {"url": "https://a.test/other", "hashChange": False, "cancelable": True}

def real(name, kind, id, findings):
    r = rec[name]; url = r["url"]; it = r["item"]
    return {"id": id, "steps": [
        step("idle", "PROBE_RUN", {"key": "k", "pageUrl": url}, "inventorying", [measure("k:inventory", INV)]),
        step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": r["inventory"]}, "acting", [measure("k:act", r["actExpression"])]),
        step("acting", "PAGE_MEASURED", {"key": "k:act", "json": r["act"]}, "reading", [measure("k:read", READ)]),
        step("reading", "PAGE_MEASURED", {"key": "k:read", "json": r["read"]}, "returning", [nav(url)]),
        step("returning", "PAGE_LOADED", {"key": "k:back", "url": url, "title": "T"}, "idle", [done(findings)]),
    ]}

def multi(id, items, results, findings):
    # results: list of (act json, read json) per testable item; chain through the cursor
    testable = [i for i in items if i["testable"]]
    steps = [step("idle", "PROBE_RUN", {"key": "k", "pageUrl": SYN}, "inventorying", [measure("k:inventory", INV)]),
             step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": J({"items": items})}, "acting", [measure("k:act", ACT(testable[0]["selector"], testable[0]["kind"]))])]
    for n, (a, r) in enumerate(results):
        steps += [step("acting", "PAGE_MEASURED", {"key": "k:act", "json": a}, "reading", [measure("k:read", READ)]),
                  step("reading", "PAGE_MEASURED", {"key": "k:read", "json": r}, "returning", [nav(SYN)])]
        if n + 1 < len(results):
            nx = testable[n + 1]
            steps.append(step("returning", "PAGE_LOADED", {"key": "k:back", "url": SYN, "title": "T"}, "acting", [measure("k:act", ACT(nx["selector"], nx["kind"]))]))
        else:
            steps.append(step("returning", "PAGE_LOADED", {"key": "k:back", "url": SYN, "title": "T"}, "idle", [done(findings)]))
    return {"id": id, "steps": steps}

F = lambda n: rec[n]
cases = [
 real("context-change-fail", "select", "context-change-fail: the select onchange asks for a navigation, a confirmed context-change-select", [finding(F("context-change-fail")["url"], "select", "#cat", F("context-change-fail")["item"]["snippet"])]),
 real("context-change-pass", "select", "control: context-change-pass changes nothing until the Pojdi button, so no finding", []),
 real("search-fail", "search", "search-fail: typing in the search input asks for a navigation, a confirmed context-change-input", [finding(F("search-fail")["url"], "search", "#q", F("search-fail")["item"]["snippet"])]),
 real("search-pass", "search", "control: search-pass waits for a submit button, so no finding", []),
 multi("two selects then a search: the first changes the page, the second does not, the third opens a window; the cursor moves on after each navigation back and a non-testable select is skipped",
   [item("#a"), item("#skip", "select", False), item("#b"), item("#c", "search")],
   [(acted(), readj(navs=[NAV])), (acted(), readj()), (acted(), readj(opened=1))],
   [finding(SYN, "select", "#a", '<select id="a">'), finding(SYN, "search", "#c", '<input id="c">')]),
 multi("a same-document hash change is not a context change", [item("#a")], [(acted(), readj(navs=[{"url": SYN + "#x", "hashChange": True, "cancelable": True}]))], []),
 multi("a url that differs after the change is a context change even when no navigate event was seen", [item("#a")], [(acted(), readj(href="https://a.test/next"))], [finding(SYN, "select", "#a", '<select id="a">')]),
 multi("a page that replaced itself (the watch is gone) is a context change", [item("#a")], [(acted(), readj(patched=False))], [finding(SYN, "select", "#a", '<select id="a">')]),
 multi("control: a select that only changes its own value leaves url, windows and navigations untouched", [item("#a")], [(acted(), readj())], []),
 {"id": "a page with no testable select or search input answers an empty list at once", "steps": [
   step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": J({"items": [item("#a", "select", False)]})}, "idle", [done([])], {"runKey": "k", "pageUrl": SYN}),
   step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": J({"items": []})}, "idle", [done([])], {"runKey": "k", "pageUrl": SYN})]},
]
E = {"runKey": "k", "pageUrl": SYN, "items": [item("#a")], "cursor": 0}
failed = lambda code: {"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "context-change", "code": code}}
cases += [
 {"id": "an element that disappeared before it was changed answers probe_element_missing and navigates back", "steps": [step("acting", "PAGE_MEASURED", {"key": "k:act", "json": acted(found=False)}, "idle", [failed("probe_element_missing"), nav(SYN)], E)]},
 {"id": "a page failure while listing answers probe_page_failed and changes nothing", "steps": [step("inventorying", "PAGE_FAILED", {"key": "k:inventory", "error": "boom", "code": "x"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "context-change", "error": "boom", "code": "probe_page_failed"}}], E)]},
 {"id": "a page failure while changing answers probe_page_failed and navigates back", "steps": [step("acting", "PAGE_FAILED", {"key": "k:act", "error": "boom", "code": "x"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "context-change", "error": "boom", "code": "probe_page_failed"}}, nav(SYN)], E)]},
 {"id": "a page failure while reading answers probe_page_failed and navigates back", "steps": [step("reading", "PAGE_FAILED", {"key": "k:read", "error": "boom", "code": "x"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "context-change", "error": "boom", "code": "probe_page_failed"}}, nav(SYN)], E)]},
 {"id": "a navigation back that fails answers probe_page_failed", "steps": [step("returning", "PAGE_FAILED", {"key": "k:back", "error": "boom", "code": "x"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "context-change", "error": "boom", "code": "probe_page_failed"}}], E)]},
 {"id": "control: a page failure under another run's key is ignored", "steps": [step("acting", "PAGE_FAILED", {"key": "j:act", "error": "boom", "code": "x"}, "acting", [], E)]},
 {"id": "control: a load answer under another run's key does not move the run on", "steps": [step("returning", "PAGE_LOADED", {"key": "j:back", "url": SYN, "title": "T"}, "returning", [], E)]},
 {"id": "an inventory that is not the list answers probe_bad_measure", "steps": [step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": "{\"x\":1}"}, "idle", [failed("probe_bad_measure")], E)]},
 {"id": "a change answer that is not its shape answers probe_bad_measure and navigates back", "steps": [step("acting", "PAGE_MEASURED", {"key": "k:act", "json": "{\"x\":1}"}, "idle", [failed("probe_bad_measure"), nav(SYN)], E)]},
 {"id": "a result that is not its shape answers probe_bad_measure and navigates back", "steps": [step("reading", "PAGE_MEASURED", {"key": "k:read", "json": "{\"x\":1}"}, "idle", [failed("probe_bad_measure"), nav(SYN)], E)]},
 {"id": "control: a measure answer under another run's key is ignored", "steps": [step("reading", "PAGE_MEASURED", {"key": "j:read", "json": readj()}, "reading", [], E)]},
]
out = {"atom": "a11y/atoms/std-a11y-probe-context-change.lolo", "trait": "ContextChangeProbe",
       "note": "std-a11y-probe-context-change with the page answers played as events. The four fixture cases carry the real PAGE_MEASURED json recorded by probe-context-change.gen/record.py from headless Chrome on the context-change fixtures and on probe-context-change.gen/search-fail.html and search-pass.html (the fixtures hold no search input); the navigate event the page's own handler raised was recorded and cancelled, and the tab stayed on its page. The other cases are hand-built answers. The expressions asserted are probe-context-change.gen/context-*.measure.js. Regenerate with python3 -I probe-context-change.gen/gen_goldens.py.",
       "cases": cases}
(here.parent / "probe-context-change.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
