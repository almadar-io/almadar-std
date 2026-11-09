import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
rec = json.load(open(os.path.join(HERE, "recorded.json")))
OUT = os.path.join(HERE, "..", "probe-operability.replay.goldens.json")
RULES = {
    "not-operable": ("serious", [("2.1.1", "A", "2.0"), ("4.1.2", "A", "2.0")]),
    "pointer-only": ("serious", [("2.1.1", "A", "2.0")]),
    "pointer-only-unchecked": ("minor", [("2.1.1", "A", "2.0")]),
}
URL = "http://127.0.0.1:24680/x.html"


def E(**kw):
    return dict({"runKey": "k1", "pageUrl": URL}, **kw)


def verdict(rule, conf, sel, snippet, count=1):
    return {"rule": rule, "confidence": conf, "selector": sel, "snippet": snippet, "count": count}


def finding(v):
    impact, wcag = RULES[v["rule"]]
    return {"id": f"{URL}#{v['rule']}#{v['selector']}", "pageUrl": URL, "rule": v["rule"], "wcag": [{"criterion": c, "level": l, "version": ver} for c, l, ver in wcag],
            "method": "probe", "engines": ["probe"], "impact": impact, "confidence": v["confidence"], "selector": v["selector"], "snippet": v["snippet"], "evidence": "", "count": v["count"]}


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


def items(page):
    return json.loads(rec[page]["list"])["items"]


def btn(page):
    return [i for i in items(page) if i["role"] == "button"][0]


po, ko = btn("pointer-only"), btn("keyboard-ok")
poc, koc = rec["pointer-only"]["checks"][0], rec["keyboard-ok"]["checks"][0]
div = [i for i in items("operability-fail") if i["tag"] == "div"][0]
cases = []
cases.append(case("PROBE_RUN asks for the clickable list under the run's step key", [
    step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": URL}, None, {"state": "listing", "emits": emits(("PAGE_MEASURE", {"key": "k1:list"})), "entity": {"runKey": "k1", "pageUrl": URL, "queue": [], "idx": 0, "verdicts": []}})]))
nov = verdict("not-operable", "confirmed", div["selector"], div["snippet"])
cases.append(case("operability-fail.html: a div with onclick, no role and no tabindex is neither native nor focusable, a confirmed not-operable; the links are native", [
    step("listing", "PAGE_MEASURED", {"key": "k1:list", "json": rec["operability-fail"]["list"]}, E(), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [nov], "queue": []}}),
    step("checking", "OP_NEXT", {}, E(verdicts=[nov]), {"state": "restoring", "emits": emits(("PAGE_NAVIGATE", {"key": "k1:restore", "url": URL})), "neverEmits": ["PAGE_KEY"]}),
    step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": URL, "title": "t"}, E(verdicts=[nov]), {"state": "idle", "emits": emits(("PROBE_DONE", {"key": "k1", "probe": "operability", "findings": [finding(nov)]}))})],
    "recorded in headless Chrome (probe-operability.gen/record.py); the div has onclick and cursor:pointer, tabIndex -1"))
cases.append(case("control: operability-pass.html: a native button with onclick is focusable, no findings", [
    step("listing", "PAGE_MEASURED", {"key": "k1:list", "json": rec["operability-pass"]["list"]}, E(), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [], "queue": []}}),
    step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": URL, "title": "t"}, E(verdicts=[]), {"state": "idle", "emits": emits(("PROBE_DONE", {"key": "k1", "probe": "operability", "findings": []}))})]))
cases.append(case("a focusable role=button div is queued for the Enter and Space check and is not a not-operable", [
    step("listing", "PAGE_MEASURED", {"key": "k1:list", "json": rec["pointer-only"]["list"]}, E(), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [], "queue": [po]}}),
    step("checking", "OP_NEXT", {}, E(queue=[po]), {"state": "focusing", "emits": emits(("PAGE_MEASURE", {"key": "k1:focus0"}))})],
    "probe-operability.gen/pointer-only.html: role=button tabindex=0 with an onclick and no key handler"))
capv = verdict("pointer-only-unchecked", "needs-verification", "html", "1 focusable role=button elements past the cap of 0 were not tried with Enter and Space", 1)
cases.append(case("elements past the maxChecks cap are counted in one finding, not dropped", [
    step("listing", "PAGE_MEASURED", {"key": "k1:list", "json": rec["pointer-only"]["list"]}, E(), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [capv], "queue": []}})], config={"maxChecks": 0}))
cases.append(case("control: a cap of one leaves the one element queued and no unchecked finding", [
    step("listing", "PAGE_MEASURED", {"key": "k1:list", "json": rec["pointer-only"]["list"]}, E(), {"state": "checking", "entity": {"verdicts": [], "queue": [po]}})], config={"maxChecks": 1}))
cases.append(case("control: a clickable list under another run's key is ignored", [
    step("listing", "PAGE_MEASURED", {"key": "k2:list", "json": rec["pointer-only"]["list"]}, E(), {"state": "listing", "emits": []})]))
cases.append(case("a clickable list that is not the ClickList shape fails the probe", [
    step("listing", "PAGE_MEASURED", {"key": "k1:list", "json": "{\"items\":\"many\"}"}, E(), {"state": "idle", "emits": emits(("PROBE_FAILED", {"key": "k1", "probe": "operability", "code": "probe_bad_measure"})), "neverEmits": ["PAGE_KEY"]})]))
cases.append(case("a page failure under the run's key fails the probe", [
    step("focusing", "PAGE_FAILED", {"key": "k1:focus0", "error": "gone", "code": "x"}, E(queue=[po]), {"state": "idle", "emits": emits(("PROBE_FAILED", {"key": "k1", "probe": "operability", "error": "gone", "code": "probe_page_failed"}))})]))

# keys on a focusable role=button
obs_pre = json.loads(poc["pre"])
cases.append(case("the focus observation puts Enter next and keeps the observation as the baseline", [
    step("focusing", "PAGE_MEASURED", {"key": "k1:focus0", "json": poc["pre"]}, E(queue=[po]), {"state": "pressingEnter", "emits": emits(("PAGE_KEY", {"key": "k1:enter0", "keyName": "Enter"})), "entity": {"baseline": obs_pre}})]))
unfocused = dict(obs_pre, focused=False)
unv = verdict("pointer-only-unchecked", "needs-verification", po["selector"], po["snippet"])
cases.append(case("an element that took no focus is counted as unchecked and the next one is tried", [
    step("focusing", "PAGE_MEASURED", {"key": "k1:focus0", "json": json.dumps(unfocused, separators=(",", ":"))}, E(queue=[po]), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [unv], "idx": 1}})],
    "the pointer-only focus observation with focused set to false"))
cases.append(case("the Enter key answer asks for the observation", [
    step("pressingEnter", "PAGE_KEY_SENT", {"key": "k1:enter0"}, E(queue=[po]), {"state": "afterEnter", "emits": emits(("PAGE_MEASURE", {"key": "k1:aenter0"}))})]))
cases.append(case("control: a key answer under a stale step key is ignored", [
    step("pressingEnter", "PAGE_KEY_SENT", {"key": "k1:enter1"}, E(queue=[po]), {"state": "pressingEnter", "emits": []})]))
cases.append(case("pointer-only.html: Enter changes nothing observable, so Space is tried next with enterChanged false", [
    step("afterEnter", "PAGE_MEASURED", {"key": "k1:aenter0", "json": poc["afterEnter"]}, E(queue=[po], baseline=obs_pre), {"state": "pressingSpace", "emits": emits(("PAGE_KEY", {"key": "k1:space0", "keyName": "Space"})), "entity": {"enterChanged": False}})]))
cases.append(case("control: keyboard-ok.html: Enter flips aria-expanded, so enterChanged is true", [
    step("afterEnter", "PAGE_MEASURED", {"key": "k1:aenter0", "json": koc["afterEnter"]}, E(queue=[ko], baseline=json.loads(koc["pre"])), {"state": "pressingSpace", "emits": emits(("PAGE_KEY", {"key": "k1:space0", "keyName": "Space"})), "entity": {"enterChanged": True}})]))
cases.append(case("the Space key answer asks for the observation", [
    step("pressingSpace", "PAGE_KEY_SENT", {"key": "k1:space0"}, E(queue=[po]), {"state": "afterSpace", "emits": emits(("PAGE_MEASURE", {"key": "k1:aspace0"}))})]))
pov = verdict("pointer-only", "needs-verification", po["selector"], po["snippet"])
cases.append(case("pointer-only.html: neither Enter nor Space changed anything, a needs-verification pointer-only", [
    step("afterSpace", "PAGE_MEASURED", {"key": "k1:aspace0", "json": poc["afterSpace"]}, E(queue=[po], baseline=json.loads(poc["afterEnter"]), enterChanged=False), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [pov], "idx": 1}}),
    step("checking", "OP_NEXT", {}, E(queue=[po], idx=1, verdicts=[pov]), {"state": "restoring", "emits": emits(("PAGE_NAVIGATE", {"key": "k1:restore", "url": URL}))}),
    step("restoring", "PAGE_LOADED", {"key": "k1:restore", "url": URL, "title": "t"}, E(queue=[po], idx=1, verdicts=[pov]), {"state": "idle", "emits": emits(("PROBE_DONE", {"key": "k1", "probe": "operability", "findings": [finding(pov)]}))})],
    "recorded: pointer-only.html in headless Chrome, Enter then Space key events, observed after each"))
cases.append(case("control: keyboard-ok.html: Enter flipped aria-expanded and Space flipped it back, no finding", [
    step("afterSpace", "PAGE_MEASURED", {"key": "k1:aspace0", "json": koc["afterSpace"]}, E(queue=[ko], baseline=json.loads(koc["afterEnter"]), verdicts=[unv], enterChanged=True), {"state": "checking", "emits": emits(("OP_NEXT", {})), "entity": {"verdicts": [unv], "idx": 1}})]))
cases.append(case("control: Enter changed nothing but Space changed the element, so no finding", [
    step("afterSpace", "PAGE_MEASURED", {"key": "k1:aspace0", "json": koc["afterSpace"]}, E(queue=[ko], baseline=json.loads(koc["afterEnter"]) | {"expanded": "true", "bodyLength": 425}, verdicts=[unv], enterChanged=False), {"state": "checking", "entity": {"verdicts": [unv], "idx": 1}})],
    "keyboard-ok.html's Space observation against a baseline that differs from it"))
cases.append(case("control: Enter changed the element but Space left it as it was, so no finding", [
    step("afterSpace", "PAGE_MEASURED", {"key": "k1:aspace0", "json": koc["afterEnter"]}, E(queue=[ko], baseline=json.loads(koc["afterEnter"]), verdicts=[unv], enterChanged=True), {"state": "checking", "entity": {"verdicts": [unv], "idx": 1}})]))
cases.append(case("the queue's second element is focused with its own selector under the next step key", [
    step("checking", "OP_NEXT", {}, E(queue=[po, ko], idx=1), {"state": "focusing", "emits": emits(("PAGE_MEASURE", {"key": "k1:focus1"}))})]))

json.dump({"atom": "a11y/atoms/std-a11y-probe-operability.lolo", "trait": "OperabilityProbe",
           "note": "std-a11y-probe-operability with the page answers played as events. Every measurement JSON is the real output of the page functions and Enter/Space key events (CDP Input.dispatchKeyEvent) in headless Chrome against spec/a11y/fixtures/operability-{fail,pass}.html and probe-operability.gen/{pointer-only,keyboard-ok}.html (probe-operability.gen/record.py). Regenerate with python3 -I probe-operability.gen/record.py then python3 -I probe-operability.gen/gen_goldens.py.",
           "cases": cases}, open(OUT, "w"), indent=1, ensure_ascii=False)
open(OUT, "a").write("\n")
print(len(cases), "cases")
