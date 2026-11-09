import json, os, sys, copy
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from cdp import Chrome, Site
from gl import step, case, emit, write, URL

def js(n):
    return open(os.path.join(here, n + ".measure.js")).read().strip()

q = lambda v: json.dumps(v, separators=(",", ":"), ensure_ascii=False)
S = lambda key, exp=(), anyl=(): {"key": key, "expect": list(exp), "expectAny": list(anyl)}
def P(role, selector, focus, trig, need, steps):
    return {"role": role, "selector": selector, "focus": focus, "focusTrigger": trig, "needsTrigger": need, "steps": steps}
PATTERNS = [
    P("tablist", '[role="tablist"]', '[role="tab"][aria-selected="true"]', False, False, [S("ArrowRight", ["focusMoved", "ariaSelectedMoved"])]),
    P("menu", '[role="menu"]', '[role="menuitem"]', False, False, [S("ArrowDown", ["focusMoved", "focusInside"]), S("Escape", ["expandedFalse"])]),
    P("menubar", '[role="menubar"]', '[role="menuitem"]', False, False, [S("ArrowRight", ["focusMoved", "focusInside"])]),
    P("dialog", '[role="dialog"]', '', True, True, [S("Enter", ["focusInside"]), S("Escape", ["expandedFalse", "focusReturned"])]),
    P("combobox", '[role="combobox"]', '', False, False, [S("ArrowDown", [], ["activeDescendantChanged"])]),
    P("listbox", '[role="listbox"]', '[role="option"]', False, False, [S("ArrowDown", [], ["focusMoved", "activeDescendantChanged"])]),
    P("tree", '[role="tree"]', '[role="treeitem"]', False, False, [S("ArrowDown", [], ["focusMoved", "activeDescendantChanged"])]),
    P("carousel", '[aria-roledescription="carousel"]', '', False, False, []),
]
PAT = {p["role"]: p for p in PATTERNS}
TARGETS = ['a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', 'summary', '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[tabindex]:not([tabindex="-1"])']
FIND_EXPR = "(" + js("find") + ")(" + q(PATTERNS) + ")"
TARGET_EXPR = "(" + js("targets") + ")(" + q(",".join(TARGETS)) + ")"

site = Site(here)
c = Chrome()
live = {}
def state(sel, focus, trig, do):
    return c.evaluate("(" + js("state") + ")(" + q(sel) + "," + q(focus) + "," + q(trig) + "," + q(do) + ")")

try:
    for n in ["widgets-tabs-fail", "widgets-tabs-pass", "widgets-roles-fail", "widgets-roles-pass"]:
        url = f"{site.base}/{n}.html"
        c.navigate(url)
        found = c.evaluate(FIND_EXPR)
        rec = {"find": found, "widgets": {}}
        for w in json.loads(found)["widgets"]:
            c.navigate(url)
            p = PAT[w["role"]]
            seq = [state(w["selector"], p["focus"], p["focusTrigger"], True)]
            for st in p["steps"]:
                c.key(st["key"])
                seq.append(state(w["selector"], "", False, False))
            rec["widgets"][w["role"]] = {"widget": w, "states": seq}
        live[n] = rec
    for n in ["targets-fail", "targets-pass"]:
        c.navigate(f"{site.base}/{n}.html")
        live[n] = {"targets": c.evaluate(TARGET_EXPR)}
finally:
    c.close(); site.close()
json.dump(live, open(os.path.join(here, "recorded.json"), "w"), indent=1)

PU = lambda n: URL + n + ".html"
WS = lambda n, role: live[n]["widgets"][role]
ST = lambda n, role, i: json.loads(WS(n, role)["states"][i])

def finding(n, role, key, obs):
    w = WS(n, role)["widget"]
    return {"id": f"{PU(n)}#widget-keyboard#{w['selector']}#{role}:{key}:{obs}", "pageUrl": PU(n), "rule": "widget-keyboard",
            "wcag": [{"criterion": "2.1.1", "level": "A", "version": "2.0"}, {"criterion": "4.1.2", "level": "A", "version": "2.0"}],
            "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": "needs-verification",
            "selector": w["selector"], "snippet": w["snippet"], "evidence": "", "count": 1}

def targetf(n, selector):
    t = [x for x in json.loads(live[n]["targets"])["targets"] if x["selector"] == selector][0]
    return {"id": f"{PU(n)}#target-size#{selector}", "pageUrl": PU(n), "rule": "target-size",
            "wcag": [{"criterion": "2.5.8", "level": "AA", "version": "2.2"}], "method": "probe", "engines": ["probe"],
            "impact": "moderate", "confidence": "needs-verification", "selector": selector, "snippet": t["snippet"], "evidence": "", "count": 1}

BEFORE0 = {"hasTrigger": False, "active": "", "inside": False, "selected": [], "open": False, "activeDescendant": "", "triggerFocused": False}
def ent(n, **kw):
    return dict({"runKey": "k1", "pageUrl": PU(n)}, **kw)

def st(frm, event, payload, state, n, emits=None, entity=None, **expect_entity):
    s = step(frm, event, payload, state, emits if emits is not None else [], ent(n, **(entity or {})))
    if emits is None:
        del s["expect"]["emits"]
    if expect_entity:
        s["expect"]["entity"] = expect_entity
    return s

def reading(n, role, j, cid, fails):
    w = WS(n, role)["widget"]
    entity = {"cur": w, "pattern": PAT[role], "j": j, "before": json.loads(WS(n, role)["states"][j]), "findings": []}
    findings = [finding(n, role, PAT[role]["steps"][j]["key"], o) for o in fails]
    return case(cid, [st("reading", "PAGE_MEASURED", {"key": "k1:read", "json": WS(n, role)["states"][j + 1]}, "reading", n, entity=entity, findings=findings)])

fw, pw, fr, pr = "widgets-tabs-fail", "widgets-tabs-pass", "widgets-roles-fail", "widgets-roles-pass"
tabw = WS(pw, "tablist")["widget"]
menuw = WS(pr, "menu")["widget"]
dlgw = WS(pr, "dialog")["widget"]
state_expr = lambda sel, focus, trig, do: "(" + js("state") + ")(" + q(sel) + "," + q(focus) + "," + q(trig) + "," + q(do) + ")"
found_roles = [w["role"] for w in json.loads(live[pr]["find"])["widgets"]]
assert found_roles == ["menu", "dialog", "combobox", "listbox"], found_roles
pw_widgets = json.loads(live[pr]["find"])["widgets"]

cases = [
    case("PROBE_RUN asks the page for the widgets the patterns declare", [step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": URL}, "finding", [emit("PAGE_MEASURE", {"key": "k1:find", "expression": FIND_EXPR})])]),
    case("control: a second PROBE_RUN while a run is in flight is refused as probe_busy", [st("pressing", "PROBE_RUN", {"key": "k2", "pageUrl": URL}, "pressing", pw, emits=[emit("PROBE_FAILED", {"key": "k2", "probe": "widgets", "error": f"a run on {PU(pw)} is in flight", "code": "probe_busy"})])]),
    case("control: a widget list under another run's key is ignored", [st("finding", "PAGE_MEASURED", {"key": "k2:find", "json": live[pr]["find"]}, "finding", pr, emits=[])]),
    case("a page failure answers PROBE_FAILED probe_page_failed", [st("reading", "PAGE_FAILED", {"key": "k1:read", "error": "evaluation threw", "code": "chrome_eval"}, "idle", pw, emits=[emit("PROBE_FAILED", {"key": "k1", "probe": "widgets", "error": "evaluation threw", "code": "probe_page_failed"})])]),
    case("a widget list that is not the declared shape answers probe_bad_measure", [st("finding", "PAGE_MEASURED", {"key": "k1:find", "json": "{\"widgets\":3}"}, "idle", pw, emits=[emit("PROBE_FAILED", {"key": "k1", "probe": "widgets", "error": "the page measurement is not the widget list shape", "code": "probe_bad_measure"})])]),
    case("widgets-roles-pass: the visible menu, the dialog that a trigger opens, the combobox and the visible listbox are held; the closed combobox popup is not", [st("finding", "PAGE_MEASURED", {"key": "k1:find", "json": live[pr]["find"]}, "finding", pr, widgets=pw_widgets)]),
    case("a page with no widget goes straight to the target measurement", [st("finding", "WIDGETS_FOUND", {}, "sizing", pw, entity={"widgets": []}, emits=[emit("PAGE_MEASURE", {"key": "k1:targets", "expression": TARGET_EXPR})])]),
    case("control: a page with widgets starts the first one", [st("finding", "WIDGETS_FOUND", {}, "focusing", pw, entity={"widgets": [tabw]})]),
    case("WIDGET_START holds the widget and its pattern and focuses the entry point", [st("focusing", "WIDGET_START", {}, "focusing", pw, entity={"widgets": [tabw], "w": 0}, emits=[emit("PAGE_MEASURE", {"key": "k1:focus", "expression": state_expr(tabw["selector"], PAT["tablist"]["focus"], False, True)})], cur=tabw, pattern=PAT["tablist"])]),
    case("a dialog's entry point is its trigger", [st("focusing", "WIDGET_START", {}, "focusing", pr, entity={"widgets": [dlgw], "w": 0}, emits=[emit("PAGE_MEASURE", {"key": "k1:focus", "expression": state_expr(dlgw["selector"], "", True, True)})], cur=dlgw, pattern=PAT["dialog"])]),
    case("widgets-tabs-pass: the focused tab is held as the state before the key", [st("focusing", "PAGE_MEASURED", {"key": "k1:focus", "json": WS(pw, "tablist")["states"][0]}, "focusing", pw, entity={"cur": tabw, "pattern": PAT["tablist"]}, before=ST(pw, "tablist", 0), j=0)]),
    case("a focused widget presses the first key of its pattern", [st("focusing", "WIDGET_FOCUSED", {}, "pressing", pw, entity={"cur": tabw, "pattern": PAT["tablist"], "before": ST(pw, "tablist", 0)}, emits=[emit("PAGE_KEY", {"key": "k1:press", "keyName": "ArrowRight"})])]),
    case("control: a dialog with no trigger is skipped and the page restored", [st("focusing", "WIDGET_FOCUSED", {}, "restoring", pr, entity={"cur": dlgw, "pattern": PAT["dialog"], "before": BEFORE0}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": PU(pr)})])]),
    case("a key sent asks for the widget's state without focusing", [st("pressing", "PAGE_KEY_SENT", {"key": "k1:press"}, "reading", pw, entity={"cur": tabw, "pattern": PAT["tablist"]}, emits=[emit("PAGE_MEASURE", {"key": "k1:read", "expression": state_expr(tabw["selector"], "", False, False)})])]),
    case("control: a key answer under another run's key is ignored", [st("pressing", "PAGE_KEY_SENT", {"key": "k2:press"}, "pressing", pw, emits=[])]),
    reading(fw, "tablist", 0, "widgets-tabs-fail: div tabs take no focus and ignore ArrowRight, so neither focusMoved nor ariaSelectedMoved holds (two findings)", ["focusMoved", "ariaSelectedMoved"]),
    reading(pw, "tablist", 0, "control: widgets-tabs-pass moves focus and aria-selected to the next tab, so no finding", []),
    reading(fr, "menu", 0, "widgets-roles-fail: ArrowDown in the menu moves nothing (focusMoved)", ["focusMoved"]),
    reading(pr, "menu", 0, "control: widgets-roles-pass ArrowDown moves focus inside the menu", []),
    reading(fr, "menu", 1, "widgets-roles-fail: Escape leaves the menu open (expandedFalse)", ["expandedFalse"]),
    reading(pr, "menu", 1, "control: widgets-roles-pass Escape closes the menu", []),
    reading(fr, "dialog", 0, "widgets-roles-fail: the dialog opens but focus stays outside (focusInside)", ["focusInside"]),
    reading(pr, "dialog", 0, "control: widgets-roles-pass moves focus into the dialog", []),
    reading(fr, "dialog", 1, "widgets-roles-fail: Escape does not close the dialog (expandedFalse; focus never left the trigger, so focusReturned holds)", ["expandedFalse"]),
    reading(pr, "dialog", 1, "control: widgets-roles-pass Escape closes the dialog and returns focus to the trigger", []),
    reading(fr, "combobox", 0, "widgets-roles-fail: ArrowDown in the combobox opens nothing and sets no active descendant", ["activeDescendantChanged"]),
    reading(pr, "combobox", 0, "control: widgets-roles-pass ArrowDown opens the popup and sets the active descendant", []),
    reading(fr, "listbox", 0, "widgets-roles-fail: ArrowDown in the listbox moves neither focus nor the active descendant (any of two)", ["focusMoved|activeDescendantChanged"]),
    reading(pr, "listbox", 0, "control: widgets-roles-pass ArrowDown moves the active descendant", []),
    case("a pattern with another step presses its next key", [st("reading", "WIDGET_READ", {}, "pressing", pr, entity={"cur": menuw, "pattern": PAT["menu"], "j": 0}, emits=[emit("PAGE_KEY", {"key": "k1:press", "keyName": "Escape"})], j=1)]),
    case("control: after the last step the page is restored", [st("reading", "WIDGET_READ", {}, "restoring", pr, entity={"cur": menuw, "pattern": PAT["menu"], "j": 1}, emits=[emit("PAGE_NAVIGATE", {"key": "k1:restore", "url": PU(pr)})])]),
    case("a restored page starts the next widget", [st("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": PU(pr), "title": "t"}, "focusing", pr, entity={"widgets": pw_widgets, "w": 0}, w=1)]),
    case("control: after the last widget the restored page measures targets", [st("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": PU(pr), "title": "t"}, "sizing", pr, entity={"widgets": pw_widgets, "w": 3}, emits=[emit("PAGE_MEASURE", {"key": "k1:targets", "expression": TARGET_EXPR})])]),
    case("targets-fail: two 16 px buttons 20 px apart are both found; the isolated 16 px button, the 24 px button and the link inside a sentence are not", [st("sizing", "PAGE_MEASURED", {"key": "k1:targets", "json": live["targets-fail"]["targets"]}, "idle", "targets-fail", entity={"findings": []}, emits=[emit("PROBE_DONE", {"key": "k1", "probe": "widgets", "findings": [targetf("targets-fail", "#a"), targetf("targets-fail", "#b")]})])]),
    case("control: targets-pass has 24 px buttons so no finding", [st("sizing", "PAGE_MEASURED", {"key": "k1:targets", "json": live["targets-pass"]["targets"]}, "idle", "targets-pass", entity={"findings": []}, emits=[emit("PROBE_DONE", {"key": "k1", "probe": "widgets", "findings": []})])]),
    case("the held widget findings come before the target findings", [st("sizing", "PAGE_MEASURED", {"key": "k1:targets", "json": live["targets-fail"]["targets"]}, "idle", "targets-fail", entity={"findings": [finding(fw, "tablist", "ArrowRight", "focusMoved")]}, emits=[emit("PROBE_DONE", {"key": "k1", "probe": "widgets", "findings": [finding(fw, "tablist", "ArrowRight", "focusMoved"), targetf("targets-fail", "#a"), targetf("targets-fail", "#b")]})])]),
    case("a target list that is not the declared shape answers probe_bad_measure", [st("sizing", "PAGE_MEASURED", {"key": "k1:targets", "json": "[]"}, "idle", pw, emits=[emit("PROBE_FAILED", {"key": "k1", "probe": "widgets", "error": "the page measurement is not the target list shape", "code": "probe_bad_measure"})])]),
]
write(os.path.join(here, "..", "probe-widgets.replay.goldens.json"), "a11y/atoms/std-a11y-probe-widgets.lolo", "WidgetsProbe",
      "std-a11y-probe-widgets with the page answers played as events. The state JSON of each live case is the real result of the measure knobs run in headless Chrome with real keys through CDP (probe-widgets.gen/gen_goldens.py) on widgets-tabs-fail and widgets-tabs-pass, probe-widgets.gen/pages/widgets-roles-fail.html and widgets-roles-pass.html (menu, dialog, combobox, listbox) and targets-fail.html and targets-pass.html; the expressions asserted are probe-widgets.gen/*.measure.js. Regenerate with python3 -I probe-widgets.gen/gen_goldens.py.", cases)
print(live[fr]["widgets"].keys())
