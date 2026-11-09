import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
rec = json.load(open(os.path.join(HERE, "recorded.json")))
OUT = os.path.join(HERE, "..", "probe-focus-walk.replay.goldens.json")
FILE_PAGES = {"skip-inert", "focus-order", "focus-jump"}
RULES = {
    "skip-missing": ("moderate", [("2.4.1", "A", "2.0")]),
    "skip-not-first": ("moderate", [("2.4.1", "A", "2.0")]),
    "skip-broken": ("serious", [("2.4.1", "A", "2.0")]),
    "focus-not-visible": ("serious", [("2.4.7", "AA", "2.0")]),
    "focus-not-visible-element": ("serious", [("2.4.7", "AA", "2.0")]),
    "focus-order": ("moderate", [("2.4.3", "A", "2.0")]),
    "keyboard-trap": ("critical", [("2.1.2", "A", "2.0")]),
    "focus-walk-capped": ("minor", [("2.4.3", "A", "2.0")]),
}


def url(page):
    return f"http://127.0.0.1:24680/{page}.html"


def E(page="skip-link-pass", **kw):
    return dict({"runKey": "k1", "pageUrl": url(page)}, **kw)


def verdict(rule, conf, sel, snippet, count=1):
    return {"rule": rule, "confidence": conf, "selector": sel, "snippet": snippet, "count": count}


def finding(page, v):
    impact, wcag = RULES[v["rule"]]
    return {"id": f"{url(page)}#{v['rule']}#{v['selector']}", "pageUrl": url(page), "rule": v["rule"],
            "wcag": [{"criterion": c, "level": l, "version": ver} for c, l, ver in wcag], "method": "probe", "engines": ["probe"],
            "impact": impact, "confidence": v["confidence"], "selector": v["selector"], "snippet": v["snippet"], "evidence": "", "count": v["count"]}


def visible(ind):
    f, b = ind["focused"], ind["blurred"]
    none = f["outlineStyle"] == "none" or f["outlineWidth"].startswith("0px")
    return not (none and f["boxShadow"] == b["boxShadow"] and f["border"] == b["border"] and f["background"] == b["background"])


def walk(page):
    """The stops a Tab walk records on a page, from the real rows."""
    stops, repeat = [], 0
    for row in rec[page]["tabs"]:
        ind = json.loads(row["indicator"])
        if not ind["present"]:
            break
        if stops and ind["selector"] == stops[-1]["selector"]:
            repeat += 1
            continue
        if stops and ind["selector"] == stops[0]["selector"]:
            break
        repeat = 1
        stops.append({"selector": ind["selector"], "snippet": ind["snippet"], "tag": ind["tag"], "href": ind["href"], "domIndex": ind["domIndex"], "rect": row["rect"], "visible": visible(ind)})
    return stops


def focus(sel, rect=None):
    return {"tag": "a", "role": "", "name": "", "selector": sel, "rect": rect or {"x": 0, "y": 0, "width": 10, "height": 10}}


def step(frm, event, payload, entity, expect):
    s = {"from": frm, "event": event, "payload": payload, "expect": expect}
    if entity is not None:
        s["entity"] = entity
    return s


def case(id, steps, note=None, config=None):
    c = {"id": id, "steps": steps}
    if note:
        c["note"] = note
    if config:
        c["config"] = config
    return c


def emits(*items):
    return [{"event": e, "payload": p} for e, p in items]


def key(page, step_name):
    return f"k1:{step_name}"


def fixture_state(page, extra_verdicts=None):
    dom = json.loads(rec[page]["dom"])
    stops = walk(page)
    return dom, stops, dict(E(page), dom=dom, stops=stops, presses=len(stops) + 1, firstIdx=stops[0]["domIndex"], firstSel=stops[0]["selector"], lastSel=stops[-1]["selector"], verdicts=extra_verdicts or [])


def ind_verdicts(stops):
    bad = [s for s in stops if not s["visible"]]
    if stops and len(bad) == len(stops):
        return [verdict("focus-not-visible", "confirmed", stops[0]["selector"], stops[0]["snippet"], len(stops))]
    return [verdict("focus-not-visible-element", "needs-verification", s["selector"], s["snippet"]) for s in bad]


def skip_steps(page, plan_verdicts):
    """Enter test on the first stop: Tab, read, Enter, read, judge, restore, done."""
    dom, stops, ent = fixture_state(page)
    sk = rec[page]["skip"]
    pre = json.loads(sk["pre"])
    post = json.loads(sk["post"])
    moved = (post["activeIsTarget"] and not pre["activeIsTarget"]) or (post["targetPseudo"] and not pre["targetPseudo"]) or post["scrollY"] != pre["scrollY"]
    base = dict(E(page), stops=stops, skipPlan="test", skipHref=sk["href"], verdicts=plan_verdicts)
    final = list(plan_verdicts) if moved else plan_verdicts + [verdict("skip-broken", "confirmed", stops[0]["selector"], stops[0]["snippet"])]
    return [
        step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": url(page), "title": "t"}, base, {"state": "skipTabbing", "emits": emits(("PAGE_KEY", {"key": "k1:skiptab", "keyName": "Tab"}))}),
        step("skipTabbing", "PAGE_KEY_SENT", {"key": "k1:skiptab"}, base, {"state": "skipPre", "emits": emits(("PAGE_MEASURE", {"key": "k1:skippre"}))}),
        step("skipPre", "PAGE_MEASURED", {"key": "k1:skippre", "json": sk["pre"]}, base, {"state": "skipEnter", "emits": emits(("PAGE_KEY", {"key": "k1:skipenter", "keyName": "Enter"}))}),
        step("skipEnter", "PAGE_KEY_SENT", {"key": "k1:skipenter"}, base, {"state": "skipPost", "emits": emits(("PAGE_MEASURE", {"key": "k1:skippost"}))}),
        step("skipPost", "PAGE_MEASURED", {"key": "k1:skippost", "json": sk["post"]}, dict(base, skipPre=pre),
             {"state": "restoring", "emits": emits(("PAGE_NAVIGATE", {"key": "k1:restore", "url": url(page)})), "entity": {"skipPlan": "done", "verdicts": final}}),
        step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": url(page), "title": "t"}, dict(base, skipPlan="done", verdicts=final),
             {"state": "idle", "emits": emits(("PROBE_DONE", {"key": "k1", "probe": "focus-walk", "findings": [finding(page, v) for v in final]}))}),
    ]


def fixture_case(id, page, before_skip, plan, note=None, stops_override=None):
    """WALK_END on the real stops of a page: verdicts so far, the restore request, then the end."""
    dom, stops, ent = fixture_state(page, [v for v in before_skip if v["rule"] == "keyboard-trap"])
    if stops_override is not None:
        stops = stops_override
        ent = dict(ent, stops=stops, firstIdx=stops[0]["domIndex"], firstSel=stops[0]["selector"], lastSel=stops[-1]["selector"])
    sk = rec[page].get("skip")
    expect_entity = {"skipPlan": plan, "verdicts": before_skip}
    if plan == "test":
        expect_entity["skipHref"] = sk["href"]
    steps = [step("ending", "WALK_END", {"reason": "end"}, ent, {"state": "restoring", "emits": emits(("PAGE_NAVIGATE", {"key": "k1:restore", "url": url(page)})), "entity": expect_entity})]
    if plan == "test":
        steps += skip_steps(page, before_skip)
    else:
        steps.append(step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": url(page), "title": "t"}, dict(E(page), stops=stops, skipPlan="none", verdicts=before_skip),
                          {"state": "idle", "emits": emits(("PROBE_DONE", {"key": "k1", "probe": "focus-walk", "findings": [finding(page, v) for v in before_skip]}))}))
    return case(id, steps, note)


cases = []
pass_dom = rec["skip-link-pass"]["dom"]
cases.append(case("PROBE_RUN asks for the focusable list and the same-page links under the run's step key", [
    step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": url("skip-link-pass")}, None,
         {"state": "scanning", "emits": emits(("PAGE_MEASURE", {"key": "k1:dom"})), "entity": {"runKey": "k1", "pageUrl": url("skip-link-pass"), "stops": [], "presses": 0, "verdicts": []}})]))
cases.append(case("the focusable list answer is held and the first Tab is asked for", [
    step("scanning", "PAGE_MEASURED", {"key": "k1:dom", "json": pass_dom}, E(), {"state": "advancing", "emits": emits(("WALK_NEXT", {})), "entity": {"dom": json.loads(pass_dom)}})]))
cases.append(case("control: a focusable list answer under another run's key is ignored", [
    step("scanning", "PAGE_MEASURED", {"key": "k2:dom", "json": pass_dom}, E(), {"state": "scanning", "emits": []})]))
cases.append(case("a focusable list that is not the DomFacts shape fails the probe", [
    step("scanning", "PAGE_MEASURED", {"key": "k1:dom", "json": "{\"focusables\":\"many\"}"}, E(),
         {"state": "idle", "emits": emits(("PROBE_FAILED", {"key": "k1", "probe": "focus-walk", "code": "probe_bad_measure"})), "neverEmits": ["PAGE_KEY"]})]))
cases.append(case("a page failure under the run's key fails the probe", [
    step("tabbing", "PAGE_FAILED", {"key": "k1:tab3", "error": "no tab", "code": "x"}, E(presses=3),
         {"state": "idle", "emits": emits(("PROBE_FAILED", {"key": "k1", "probe": "focus-walk", "error": "no tab", "code": "probe_page_failed"}))})]))
cases.append(case("control: a page failure under another run's key is ignored", [
    step("tabbing", "PAGE_FAILED", {"key": "k2:tab3", "error": "no tab", "code": "x"}, E(presses=3), {"state": "tabbing", "emits": []})]))

cases.append(case("WALK_NEXT presses Tab and counts the press", [
    step("advancing", "WALK_NEXT", {}, E(presses=0), {"state": "tabbing", "emits": emits(("PAGE_KEY", {"key": "k1:tab1", "keyName": "Tab"})), "entity": {"presses": 1}})]))
cases.append(case("control: WALK_NEXT one press under the maxTabs cap still presses Tab", [
    step("advancing", "WALK_NEXT", {}, E(presses=2), {"state": "tabbing", "emits": emits(("PAGE_KEY", {"key": "k1:tab3", "keyName": "Tab"}))})], config={"maxTabs": 3}))
cases.append(case("at the maxTabs cap the walk ends and presses no more", [
    step("advancing", "WALK_NEXT", {}, E(presses=3), {"state": "ending", "emits": emits(("WALK_END", {"reason": "capped"})), "neverEmits": ["PAGE_KEY"]})], config={"maxTabs": 3}))
d, s, ent = fixture_state("skip-link-pass")
capv = verdict("focus-walk-capped", "needs-verification", "html", "no return to the first element within 3 Tab presses", 3)
cases.append(case("the capped end is a finding, not a silent cut", [
    step("ending", "WALK_END", {"reason": "capped"}, dict(ent, presses=3), {"state": "restoring", "emits": emits(("PAGE_NAVIGATE", {"key": "k1:restore", "url": url("skip-link-pass")})), "entity": {"verdicts": [capv]}}),
    step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": url("skip-link-pass"), "title": "t"}, dict(E("skip-link-pass"), stops=s, skipPlan="none", verdicts=[capv]),
         {"state": "idle", "emits": emits(("PROBE_DONE", {"key": "k1", "probe": "focus-walk", "findings": [finding("skip-link-pass", capv)]}))})], config={"maxTabs": 3}))

cases.append(case("a Tab key answer asks for the focused element", [
    step("tabbing", "PAGE_KEY_SENT", {"key": "k1:tab2"}, E(presses=2), {"state": "reading", "emits": emits(("PAGE_FOCUSED", {"key": "k1:focus2"}))})]))
cases.append(case("control: a key answer under a stale step key is ignored", [
    step("tabbing", "PAGE_KEY_SENT", {"key": "k1:tab1"}, E(presses=2), {"state": "tabbing", "emits": []})]))

sk0 = walk("skip-link-pass")
cases.append(case("a newly focused element has its focus indicator measured", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus2", "focused": focus("#b", {"x": 1, "y": 2, "width": 3, "height": 4})}, E(presses=2, firstSel="#a", lastSel="#a", repeat=1),
         {"state": "measuring", "emits": emits(("PAGE_MEASURE", {"key": "k1:ind2"})), "entity": {"pendingSel": "#b", "pendingRect": {"x": 1, "y": 2, "width": 3, "height": 4}, "repeat": 1}})]))
cases.append(case("nothing focused ends the walk", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus3"}, E(presses=3, firstSel="#a", lastSel="#b"), {"state": "ending", "emits": emits(("WALK_END", {"reason": "end"}))})]))
cases.append(case("focus back on the first element ends the walk", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus4", "focused": focus("#a")}, E(presses=4, firstSel="#a", lastSel="#c"), {"state": "ending", "emits": emits(("WALK_END", {"reason": "end"}))})]))
cases.append(case("control: a focus answer under a stale step key is ignored", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus1", "focused": focus("#z")}, E(presses=4, firstSel="#a", lastSel="#c"), {"state": "reading", "emits": []})]))
cases.append(case("the same element again counts a repeat and presses Tab again", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus5", "focused": focus("#trap")}, E(presses=5, firstSel="#a", lastSel="#trap", repeat=2),
         {"state": "advancing", "emits": emits(("WALK_NEXT", {})), "entity": {"repeat": 3}})]))
cases.append(case("the same element for trapRepeat Tabs asks whether Shift+Tab leaves it", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus8", "focused": focus("#trap")}, E(presses=8, firstSel="#a", lastSel="#trap", repeat=4),
         {"state": "shifting", "emits": emits(("PAGE_KEY", {"key": "k1:shift", "keyName": "Tab", "shift": True})), "entity": {"repeat": 5}})]))
cases.append(case("control: a lower trapRepeat makes an earlier trap check", [
    step("reading", "PAGE_FOCUS_READ", {"key": "k1:focus4", "focused": focus("#trap")}, E(presses=4, firstSel="#a", lastSel="#trap", repeat=2),
         {"state": "shifting", "emits": emits(("PAGE_KEY", {"key": "k1:shift", "keyName": "Tab", "shift": True}))})], config={"trapRepeat": 3}))
cases.append(case("the Shift+Tab key answer asks for the focused element", [
    step("shifting", "PAGE_KEY_SENT", {"key": "k1:shift"}, E(), {"state": "shiftReading", "emits": emits(("PAGE_FOCUSED", {"key": "k1:shiftfocus"}))})]))

tf = rec["keyboard-trap-fail"]["shift"]["indicator"]
tp = rec["keyboard-trap-pass"]["shift"]["indicator"]
tfi, tpi = json.loads(tf), json.loads(tp)
tstops = walk("keyboard-trap-fail")
trap_v = verdict("keyboard-trap", "confirmed", "#trap", tstops[-1]["snippet"], 5)
cases.append(case("keyboard-trap-fail.html: Shift+Tab also lands on #trap, which is a confirmed keyboard trap", [
    step("shiftReading", "PAGE_FOCUS_READ", {"key": "k1:shiftfocus", "focused": focus(tfi["selector"], rec["keyboard-trap-fail"]["shift"]["rect"])}, E("keyboard-trap-fail", dom=json.loads(rec["keyboard-trap-fail"]["dom"]), firstIdx=0, stops=tstops, lastSel="#trap", repeat=5),
         {"state": "ending", "emits": emits(("WALK_END", {"reason": "end"})), "entity": {"verdicts": [trap_v]}})],
    "recorded in headless Chrome: eight Tab presses and one Shift+Tab (probe-focus-walk.gen/record.py)"))
cases.append(case("control: keyboard-trap-pass.html: Shift+Tab leaves #trap, so no trap", [
    step("shiftReading", "PAGE_FOCUS_READ", {"key": "k1:shiftfocus", "focused": focus(tpi["selector"], rec["keyboard-trap-pass"]["shift"]["rect"])}, E("keyboard-trap-pass", dom=json.loads(rec["keyboard-trap-pass"]["dom"]), firstIdx=0, stops=tstops, lastSel="#trap", repeat=5),
         {"state": "ending", "emits": emits(("WALK_END", {"reason": "end"})), "entity": {"verdicts": []}})]))
cases.append(case("control: nothing focused after Shift+Tab leaves the element, so no trap", [
    step("shiftReading", "PAGE_FOCUS_READ", {"key": "k1:shiftfocus"}, E(dom=json.loads(rec["keyboard-trap-pass"]["dom"]), firstIdx=0, stops=tstops, lastSel="#trap", repeat=5), {"state": "ending", "emits": emits(("WALK_END", {"reason": "end"})), "entity": {"verdicts": []}})]))

# indicator measurement rows from the real pages
def ind_case(id, page, idx, want_visible, note=None):
    row = rec[page]["tabs"][idx]
    ind = json.loads(row["indicator"])
    assert visible(ind) == want_visible
    stop = {"selector": ind["selector"], "snippet": ind["snippet"], "tag": ind["tag"], "href": ind["href"], "domIndex": ind["domIndex"], "rect": row["rect"], "visible": want_visible}
    return case(id, [
        step("measuring", "PAGE_MEASURED", {"key": f"k1:ind{idx + 1}", "json": row["indicator"]}, E(page, presses=idx + 1, pendingSel=ind["selector"], pendingRect=row["rect"]),
             {"state": "advancing", "emits": emits(("WALK_NEXT", {})), "entity": {"stops": [stop], "firstSel": ind["selector"], "lastSel": ind["selector"], "firstIdx": ind["domIndex"]}})], note)


cases.append(ind_case("focus-visible-pass.html: the skip link gets a 3px outline when focused, so its indicator is visible", "focus-visible-pass", 0, True, "recorded in headless Chrome: outline solid 3px focused, none blurred"))
cases.append(ind_case("focus-visible-fail.html: a nav link with outline none and no other change has no visible indicator", "focus-visible-fail", 1, False, "recorded: outline none focused and blurred, same box-shadow, border and background"))
cases.append(ind_case("focus-visible-fail.html: the skip link still changes background when focused, so it counts as visible", "focus-visible-fail", 0, True, "recorded: background rgb(255, 255, 255) focused against rgba(0, 0, 0, 0) blurred"))
cases.append(ind_case("focus-visible-fail.html: the button with outline none keeps its default border and background, so no indicator", "focus-visible-fail", 3, False))
cases.append(case("an indicator measurement with nothing focused ends the walk", [
    step("measuring", "PAGE_MEASURED", {"key": "k1:ind3", "json": rec["skip-link-missing-fail"]["tabs"][2]["indicator"]}, E(presses=3, pendingSel="#x"), {"state": "ending", "emits": emits(("WALK_END", {"reason": "end"}))})]))
cases.append(case("an indicator measurement that is not the Indicator shape fails the probe", [
    step("measuring", "PAGE_MEASURED", {"key": "k1:ind1", "json": "{\"present\":\"yes\"}"}, E(presses=1), {"state": "idle", "emits": emits(("PROBE_FAILED", {"key": "k1", "probe": "focus-walk", "code": "probe_bad_measure"}))})]))

# whole pages
sk = lambda page, i: json.loads(rec[page]["dom"])["anchors"][i]
cases.append(fixture_case("skip-link-pass.html: a working skip link is first, targets main, Enter moves to it: no findings", "skip-link-pass", [], "test",
                          "Enter on the link makes #main the :target element in headless Chrome"))
a = sk("skip-link-missing-fail", 0) if rec["skip-link-missing-fail"]["dom"] and json.loads(rec["skip-link-missing-fail"]["dom"])["anchors"] else None
cases.append(fixture_case("skip-link-missing-fail.html: no in-page link at all is skip-missing", "skip-link-missing-fail", [verdict("skip-missing", "needs-verification", "body", "")], "none"))
a = sk("skip-link-notfirst-fail", 0)
cases.append(fixture_case("skip-link-notfirst-fail.html: the first stop is not the skip link, which follows the nav, so skip-not-first", "skip-link-notfirst-fail", [verdict("skip-not-first", "needs-verification", a["selector"], a["snippet"])], "none"))
a = sk("skip-link-broken-fail", 0)
cases.append(fixture_case("skip-link-broken-fail.html: the first stop links to #glavna-vsebina, which does not exist, so skip-broken", "skip-link-broken-fail", [verdict("skip-broken", "confirmed", a["selector"], a["snippet"])], "none"))
cases.append(fixture_case("skip-inert.html: the link and its target exist but Enter moves neither focus nor scroll nor :target, so skip-broken", "skip-inert", [], "test",
                          "probe-focus-walk.gen/skip-inert.html: the link click handler calls preventDefault"))
fvs = walk("focus-visible-fail")
cases.append(fixture_case("focus-visible-fail.html: four of five stops show no focus change; the skip link does change background, so each is focus-not-visible-element", "focus-visible-fail", ind_verdicts(fvs), "test"))
cases.append(fixture_case("control: focus-visible-pass.html: every stop shows a 3px outline, no findings", "focus-visible-pass", [], "test"))
nav_only = fvs[1:]
nv = ind_verdicts(nav_only)
assert nv[0]["rule"] == "focus-not-visible"
cases.append(fixture_case("when every stop has no indicator the finding is one confirmed focus-not-visible", "focus-visible-fail", nv + [verdict("skip-not-first", "needs-verification", sk("focus-visible-fail", 0)["selector"], sk("focus-visible-fail", 0)["snippet"])], "none",
                          "the stops are the four non-skip stops recorded on focus-visible-fail.html; the skip link is left out because it changes background when focused", stops_override=nav_only))
cases.append(fixture_case("keyboard-trap-fail.html: #trap holds focus for five Tabs and Shift+Tab, one confirmed keyboard-trap", "keyboard-trap-fail", [trap_v], "test"))
cases.append(fixture_case("control: keyboard-trap-pass.html: Tab leaves the field, no findings", "keyboard-trap-pass", [], "test"))
fo = walk("focus-order")
posd = json.loads(rec["focus-order"]["dom"])["focusables"]
pos = [f for f in posd if f["tabindex"] > 0][0]
cases.append(fixture_case("focus-order.html: a positive tabindex sends Tab to the button before the links, one focus-order finding", "focus-order",
                          [verdict("focus-order", "needs-verification", pos["selector"], pos["snippet"]), verdict("skip-missing", "needs-verification", "body", "")], "none",
                          "recorded in headless Chrome: Tab visits the tabindex=2 button first"))
fj = walk("focus-jump")
cases.append(fixture_case("focus-jump.html: the second stop sits more than 200 CSS px above the first, one focus-order finding on it", "focus-jump",
                          [verdict("focus-order", "needs-verification", fj[1]["selector"], fj[1]["snippet"]), verdict("skip-missing", "needs-verification", "body", "")], "none"))
cases.append(case("control: a tab order that follows the DOM and the page down has no focus-order finding", [
    step("ending", "WALK_END", {"reason": "end"}, fixture_state("skip-link-missing-fail")[2], {"state": "restoring", "entity": {"verdicts": [verdict("skip-missing", "needs-verification", "body", "")]}})]))

json.dump({"atom": "a11y/atoms/std-a11y-probe-focus-walk.lolo", "trait": "FocusWalkProbe",
           "note": "std-a11y-probe-focus-walk with the page answers played as events. Every measurement JSON, rect and Shift+Tab result is the real output of the page functions and Tab/Shift+Tab/Enter key events (CDP Input.dispatchKeyEvent) in headless Chrome against spec/a11y/fixtures and probe-focus-walk.gen/*.html (probe-focus-walk.gen/record.py). Regenerate with python3 -I probe-focus-walk.gen/record.py then python3 -I probe-focus-walk.gen/gen_goldens.py.",
           "cases": cases}, open(OUT, "w"), indent=1, ensure_ascii=False)
open(OUT, "a").write("\n")
print(len(cases), "cases")
