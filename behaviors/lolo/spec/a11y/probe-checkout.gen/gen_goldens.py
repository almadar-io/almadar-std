import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
MEAS = (here / "checkout-links.measure.js").read_text().strip()
EXPR = f"({MEAS})()"
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
W = {"keyboard": [{"criterion": "2.1.1", "level": "A", "version": "2.0"}], "review": [{"criterion": "3.3.4", "level": "AA", "version": "2.0"}], "captcha": [{"criterion": "1.1.1", "level": "A", "version": "2.0"}]}
def finding(page, rule, sel, snippet, wcag, impact, conf):
    return {"id": f"{page}#{rule}" + (f"#{sel}" if rule in ("checkout-not-keyboard",) else ""), "pageUrl": page, "rule": rule, "wcag": wcag, "method": "probe", "engines": ["probe"], "impact": impact, "confidence": conf, "selector": sel, "snippet": snippet, "evidence": "", "count": 1}
def step(frm, event, payload, state, emits=(), entity=None, never=(), eent=None):
    e = {"state": state}
    if emits: e["emits"] = list(emits)
    if never: e["neverEmits"] = list(never)
    if eent is not None: e["entity"] = eent
    s = {"from": frm, "event": event, "payload": payload, "expect": e}
    if entity is not None: s["entity"] = entity
    return s
def case(id, *steps, config=None):
    c = {"id": id, "steps": list(steps)}
    if config: c["config"] = config
    return c
em = lambda event, **p: {"event": event, "payload": p}

walk = rec["walk"]; add, cart, chk = walk
P1 = add["url"]; P2 = cart["url"]; P3 = chk["after"]["url"]
ls_add = json.loads(add["links"]); ls_cart = json.loads(cart["links"]); ls_chk = json.loads(rec["checkout"]["links"]); ls_pay = json.loads(rec["pay"]["links"])
PAYURL = rec["pay"]["url"]
sel_of = lambda ls, t: [l for l in ls["links"] if l["text"] == t or l["text"].startswith(t)][0]
addb = sel_of(ls_add, "Dodaj v košarico"); navcart = sel_of(ls_cart, "Košarica"); gob = sel_of(ls_cart, "Na blagajno"); pay = sel_of(ls_pay, "Plačaj")
hay = lambda l: (l["text"] + " " + l["href"]).lower()
base = {"runKey": "k", "startUrl": P1, "pageUrl": P1, "findings": [], "complete": False, "stopReachable": False}
cases = []

cases += [
 case("PROBE_RUN starts the forms probe on the product page, nothing is pressed",
  step("idle", "PROBE_RUN", {"key": "k", "pageUrl": P1}, "forms", [em("FORMS_RUN", key="k:forms0", pageUrl=P1)], never=["PAGE_KEY", "PAGE_MEASURE"], eent={"runKey": "k", "startUrl": P1, "stepIdx": 0, "reached": [], "findings": []})),
 case("the forms probe's answer for this run is kept and the page links are measured; another run's answer is ignored (control)",
  step("forms", "FORMS_PROBE_DONE", {"key": "k:forms0", "probe": "forms", "findings": [finding(P1, "form-label", "#x", "<input>", [], "serious", "confirmed")]}, "listing", [em("PAGE_MEASURE", key="k:links0", expression=EXPR)], entity={**base, "formsSeq": 0}, eent={"findings": [finding(P1, "form-label", "#x", "<input>", [], "serious", "confirmed")]}),
  step("forms", "FORMS_PROBE_DONE", {"key": "z:forms0", "probe": "forms", "findings": []}, "forms", never=["PAGE_MEASURE"], entity={**base, "formsSeq": 0})),
 case("the forms probe failing fails the run and returns the tab; a failure of another run is ignored (control)",
  step("forms", "FORMS_PROBE_FAILED", {"key": "k:forms0", "probe": "forms", "error": "x", "code": "probe_page_failed"}, "idle", [em("PROBE_FAILED", key="k", probe="checkout", code="probe_forms_failed"), em("PAGE_NAVIGATE", key="k:back", url=P1)], entity={**base, "formsSeq": 0}),
  step("forms", "FORMS_PROBE_FAILED", {"key": "z:forms0", "probe": "forms", "error": "x", "code": "probe_page_failed"}, "forms", never=["PROBE_FAILED"], entity={**base, "formsSeq": 0})),
 case("real product page links: the add-to-cart button is the target for step 0",
  step("listing", "PAGE_MEASURED", {"key": "k:links0", "json": add["links"]}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "formsSeq": 0, "stepIdx": 0}, eent={"targetSel": addb["selector"], "targetHay": hay(addb), "targetSnippet": addb["snippet"]})),
 case("a page without any add-to-cart control leaves no target (control)",
  step("listing", "PAGE_MEASURED", {"key": "k:links0", "json": J({"links": [l for l in ls_add["links"] if l is not addb], "frames": []})}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "formsSeq": 0, "stepIdx": 0}, eent={"targetSel": ""})),
 case("real cart page: step 1 is the Košarica link and step 2 the Na blagajno link",
  step("listing", "PAGE_MEASURED", {"key": "k:links1", "json": cart["links"]}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "pageUrl": P2, "formsSeq": 1, "stepIdx": 1}, eent={"targetSel": navcart["selector"]}),
  step("listing", "PAGE_MEASURED", {"key": "k:links2", "json": cart["links"]}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "pageUrl": P2, "formsSeq": 2, "stepIdx": 2}, eent={"targetSel": gob["selector"]})),
 case("SAFETY: a link that matches the checkout step and the stop list is never chosen; the plain one is",
  step("listing", "PAGE_MEASURED", {"key": "k:links2", "json": J({"links": [{"selector": "#pay", "text": "Plačaj in zaključi nakup", "href": "http://s.test/checkout/pay", "snippet": "<a id=\"pay\">"}, {"selector": "#go", "text": "Na blagajno", "href": "http://s.test/checkout", "snippet": "<a id=\"go\">"}], "frames": []})}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "formsSeq": 2, "stepIdx": 2}, eent={"targetSel": "#go"}),
  step("listing", "PAGE_MEASURED", {"key": "k:links2", "json": J({"links": [{"selector": "#pay", "text": "Plačaj in zaključi nakup", "href": "http://s.test/checkout/pay", "snippet": "<a id=\"pay\">"}], "frames": []})}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "formsSeq": 2, "stepIdx": 2}, eent={"targetSel": ""})),
 case("a measurement that is not the link list fails the run (control: the real list above is accepted)",
  step("listing", "PAGE_MEASURED", {"key": "k:links0", "json": "{\"links\":\"many\"}"}, "idle", [em("PROBE_FAILED", key="k", probe="checkout", code="probe_bad_measure"), em("PAGE_NAVIGATE", key="k:back", url=P1)], entity={**base, "formsSeq": 0})),
 case("planning with a target starts the Tab walk",
  step("planning", "CHECKOUT_PLAN", {}, "tabbing", [em("CHECKOUT_TAB"), em("PAGE_KEY", key="k:tab1", keyName="Tab")], entity={**base, "stepIdx": 0, "targetSel": addb["selector"]}, eent={"mode": "step", "tabs": 1, "stoppedAt": "add-to-cart", "complete": False})),
 case("planning without a target ends with checkout-step-not-found and no key is pressed (control: the case above has a target)",
  step("planning", "CHECKOUT_PLAN", {}, "ending", [em("CHECKOUT_END")], never=["CHECKOUT_TAB", "PAGE_KEY"], entity={**base, "stepIdx": 1, "targetSel": "", "reached": ["add-to-cart"]}, eent={"stoppedAt": "cart", "complete": False, "findings": [{"id": f"{P1}#checkout-step-not-found#cart", "pageUrl": P1, "rule": "checkout-step-not-found", "wcag": [], "method": "probe", "engines": ["probe"], "impact": "minor", "confidence": "needs-verification", "selector": "", "snippet": "cart", "evidence": "", "count": 1}]})),
 case("Tab is pressed below the cap; at the cap the walk ends with checkout-not-keyboard (2.1.1, confirmed)",
  step("tabbing", "CHECKOUT_TAB", {}, "tabbing", [em("PAGE_KEY", key="k:tab1", keyName="Tab")], entity={**base, "tabs": 0, "targetSel": addb["selector"]}),
  step("tabbing", "CHECKOUT_TAB", {}, "ending", [em("CHECKOUT_END")], never=["PAGE_KEY"], entity={**base, "tabs": 3, "targetSel": addb["selector"], "targetSnippet": addb["snippet"]}, eent={"findings": [{"id": f"{P1}#checkout-not-keyboard#{addb['selector']}", "pageUrl": P1, "rule": "checkout-not-keyboard", "wcag": W["keyboard"], "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": "confirmed", "selector": addb["selector"], "snippet": addb["snippet"], "evidence": "", "count": 1}]}), config={"maxTabs": 3}),
 case("a Tab acknowledgement asks for the focused element; another key's acknowledgement is ignored (control)",
  step("tabbing", "PAGE_KEY_SENT", {"key": "k:tab2"}, "tabbing", [em("PAGE_FOCUSED", key="k:focus2")], entity={**base, "tabs": 2}),
  step("tabbing", "PAGE_KEY_SENT", {"key": "k:enter0"}, "tabbing", never=["PAGE_FOCUSED"], entity={**base, "tabs": 2})),
 case("real focus read: Tab reached the add-to-cart button, Enter is pressed; focus elsewhere or on nothing keeps tabbing (controls)",
  step("tabbing", "PAGE_FOCUS_READ", {"key": "k:focus6", "focused": {"tag": "button", "role": "button", "name": add["focused"]["name"], "selector": add["focused"]["selector"], "rect": {"x": 0, "y": 0, "width": 10, "height": 10}}}, "entering", [em("PAGE_KEY", key="k:enter0", keyName="Enter")], entity={**base, "tabs": 6, "mode": "step", "stepIdx": 0, "targetSel": addb["selector"], "targetHay": hay(addb)}),
  step("tabbing", "PAGE_FOCUS_READ", {"key": "k:focus5", "focused": {"tag": "a", "role": "link", "name": "Domov", "selector": "#other", "rect": {"x": 0, "y": 0, "width": 10, "height": 10}}}, "tabbing", [em("CHECKOUT_TAB")], never=["PAGE_FOCUSED"], entity={**base, "tabs": 5, "mode": "step", "stepIdx": 0, "targetSel": addb["selector"], "targetHay": hay(addb)}),
  step("tabbing", "PAGE_FOCUS_READ", {"key": "k:focus1"}, "tabbing", [em("CHECKOUT_TAB")], never=["PAGE_FOCUSED"], entity={**base, "tabs": 1, "mode": "step", "stepIdx": 0, "targetSel": addb["selector"], "targetHay": hay(addb)})),
 case("SAFETY: the browser reports a stop-list name for the focused target, so Enter is never pressed; with a harmless name it is (control)",
  step("tabbing", "PAGE_FOCUS_READ", {"key": "k:focus7", "focused": {"tag": "a", "role": "link", "name": "Plačaj 43,90 EUR", "selector": gob["selector"], "rect": {"x": 0, "y": 0, "width": 10, "height": 10}}}, "ending", [em("CHECKOUT_END")], never=["PAGE_KEY"], entity={**base, "tabs": 7, "mode": "step", "stepIdx": 2, "targetSel": gob["selector"], "targetHay": hay(gob)}, eent={"stopReachable": True}),
  step("tabbing", "PAGE_FOCUS_READ", {"key": "k:focus7", "focused": {"tag": "a", "role": "link", "name": "Na blagajno", "selector": gob["selector"], "rect": {"x": 0, "y": 0, "width": 10, "height": 10}}}, "entering", [em("PAGE_KEY", key="k:enter2", keyName="Enter")], entity={**base, "tabs": 7, "mode": "step", "stepIdx": 2, "targetSel": gob["selector"], "targetHay": hay(gob)})),
 case("an Enter acknowledgement reads the page reached; another key's is ignored (control)",
  step("entering", "PAGE_KEY_SENT", {"key": "k:enter0"}, "paging", [em("PAGE_TEXT", key="k:page0")], entity={**base, "stepIdx": 0}),
  step("entering", "PAGE_KEY_SENT", {"key": "k:tab3"}, "entering", never=["PAGE_TEXT"], entity={**base, "stepIdx": 0})),
 case("the page reached is recorded and the forms probe runs on it; another page read is ignored (control)",
  step("paging", "PAGE_TEXT_READ", {"key": "k:page0", "url": add["after"]["url"], "title": add["after"]["title"], "lang": "sl", "text": "Košarica"}, "forms", [em("FORMS_RUN", key="k:forms1", pageUrl=add["after"]["url"])], entity={**base, "stepIdx": 0, "formsSeq": 0}, eent={"reached": ["add-to-cart"], "stepIdx": 1, "formsSeq": 1, "pageUrl": add["after"]["url"]}),
  step("paging", "PAGE_TEXT_READ", {"key": "k:page9", "url": "u", "title": "t", "lang": "sl", "text": ""}, "paging", never=["FORMS_RUN"], entity={**base, "stepIdx": 0, "formsSeq": 0})),
 case("checkout page (blagajna): every step reached, no stop control on it, so the walk ends without a Tab",
  step("listing", "PAGE_MEASURED", {"key": "k:links3", "json": rec["checkout"]["links"]}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "pageUrl": P3, "formsSeq": 3, "stepIdx": 3, "reached": ["add-to-cart", "cart", "checkout"]}, eent={"targetSel": ""}),
  step("planning", "CHECKOUT_PLAN", {}, "ending", [em("CHECKOUT_END")], never=["CHECKOUT_TAB", "PAGE_KEY"], entity={**base, "pageUrl": P3, "stepIdx": 3, "targetSel": "", "reached": ["add-to-cart", "cart", "checkout"]}, eent={"complete": True, "stoppedAt": "checkout", "stopReachable": False})),
 case("payment page: the real Plačaj control is the stop target, Tab-walked to and Enter is never pressed",
  step("listing", "PAGE_MEASURED", {"key": "k:links3", "json": rec["pay"]["links"]}, "planning", [em("CHECKOUT_PLAN")], entity={**base, "pageUrl": PAYURL, "formsSeq": 3, "stepIdx": 3, "reached": ["add-to-cart", "cart", "checkout"]}, eent={"targetSel": pay["selector"]}),
  step("planning", "CHECKOUT_PLAN", {}, "tabbing", [em("CHECKOUT_TAB")], never=["PAGE_FOCUSED"], entity={**base, "pageUrl": PAYURL, "stepIdx": 3, "targetSel": pay["selector"], "reached": ["add-to-cart", "cart", "checkout"]}, eent={"mode": "stop", "complete": True, "stoppedAt": "checkout"}),
  step("tabbing", "PAGE_FOCUS_READ", {"key": "k:focus6", "focused": {"tag": "a", "role": "link", "name": rec["pay"]["focused"]["name"], "selector": rec["pay"]["focused"]["selector"], "rect": {"x": 0, "y": 0, "width": 10, "height": 10}}}, "ending", [em("CHECKOUT_END")], never=["PAGE_KEY"], entity={**base, "pageUrl": PAYURL, "tabs": 6, "mode": "stop", "stepIdx": 3, "complete": True, "targetSel": pay["selector"], "targetHay": hay(pay)}, eent={"stopReachable": True})),
 case("a stop control that Tab cannot reach is checkout-not-keyboard on the pay control and Enter is never pressed",
  step("tabbing", "CHECKOUT_TAB", {}, "ending", [em("CHECKOUT_END")], never=["PAGE_KEY"], entity={**base, "pageUrl": PAYURL, "tabs": 2, "mode": "stop", "stepIdx": 3, "complete": True, "targetSel": pay["selector"], "targetSnippet": pay["snippet"]}, eent={"stopReachable": False}), config={"maxTabs": 2}),
]

rev = lambda: finding(P3, "checkout-no-review", "", "", W["review"], "moderate", "needs-verification")
cap = lambda src: {**finding(P3, "captcha", "iframe", src, W["captcha"], "serious", "needs-verification"), "id": f"{P3}#captcha#{src}"}
txt = rec["checkout"]["text"]
END = {**base, "pageUrl": P3, "complete": True, "reached": ["add-to-cart", "cart", "checkout"], "pageText": txt}
back = [em("PAGE_NAVIGATE", key="k:back", url=P1)]
cases += [
 case("the stop page without a review step is checkout-no-review (3.3.4, needs-verification); with the review text there is none (control)",
  step("ending", "CHECKOUT_END", {}, "returning", back, entity=END, eent={"findings": [rev()]}),
  step("ending", "CHECKOUT_END", {}, "returning", back, entity={**END, "pageText": txt + "\nPregled naročila"}, eent={"findings": []})),
 case("an iframe with a CAPTCHA signature is captcha (N48, needs-verification); another iframe is not (control)",
  step("ending", "CHECKOUT_END", {}, "returning", back, entity={**END, "pageText": "review order", "frames": ["https://www.google.com/recaptcha/api2/anchor?k=1"]}, eent={"findings": [cap("https://www.google.com/recaptcha/api2/anchor?k=1")]}),
  step("ending", "CHECKOUT_END", {}, "returning", back, entity={**END, "pageText": "review order", "frames": ["https://maps.example/embed"]}, eent={"findings": []})),
 case("a walk that did not complete gives no review or captcha verdict (control)",
  step("ending", "CHECKOUT_END", {}, "returning", back, entity={**END, "complete": False, "reached": ["add-to-cart"], "frames": ["https://www.google.com/recaptcha/api2/anchor?k=1"]}, eent={"findings": []})),
 case("the tab is back: PROBE_DONE and CHECKOUT_WALKED; another key's load is ignored (control)",
  step("returning", "PAGE_LOADED", {"key": "k:back", "url": P1, "title": "t"}, "idle", [em("PROBE_DONE", key="k", probe="checkout", findings=[]), em("CHECKOUT_WALKED", key="k", reached=["add-to-cart", "cart", "checkout"], stoppedAt="checkout", stopControlReachable=True)], entity={**base, "reached": ["add-to-cart", "cart", "checkout"], "stoppedAt": "checkout", "stopReachable": True}),
  step("returning", "PAGE_LOADED", {"key": "z:back", "url": P1, "title": "t"}, "returning", never=["PROBE_DONE", "CHECKOUT_WALKED"], entity=base)),
 case("a missing step still ends in PROBE_DONE with the informational finding, not PROBE_FAILED",
  step("returning", "PAGE_LOADED", {"key": "k:back", "url": P1, "title": "t"}, "idle", [em("PROBE_DONE", key="k", probe="checkout"), em("CHECKOUT_WALKED", key="k", reached=["add-to-cart"], stoppedAt="cart", stopControlReachable=False)], never=["PROBE_FAILED"], entity={**base, "reached": ["add-to-cart"], "stoppedAt": "cart"})),
 case("a page failure of the walk fails the run; a failure keyed to the forms probe is left to it (control)",
  step("tabbing", "PAGE_FAILED", {"key": "k:tab2", "error": "busy", "code": "busy"}, "idle", [em("PROBE_FAILED", key="k", probe="checkout", code="probe_page_failed"), em("PAGE_NAVIGATE", key="k:back", url=P1)], entity=base),
  step("tabbing", "PAGE_FAILED", {"key": "k:forms1:inventory", "error": "busy", "code": "busy"}, "tabbing", never=["PROBE_FAILED"], entity=base)),
]
out = {"atom": "a11y/atoms/std-a11y-probe-checkout.lolo", "trait": "CheckoutProbe",
 "note": "std-a11y-probe-checkout with the page answers played as events. The link lists, focus reads and page texts are the real answers recorded by probe-checkout.gen/record.py from headless Chrome on the Slovenian fixture shop (Tab presses and Enter over CDP, keyDown with text \\r; the server log shows only page GETs, nothing was submitted and the Plačaj control was only focused). The stop-list cases prove a control matching the stop patterns is never activated. Regenerate with python3 -I probe-checkout.gen/gen_goldens.py.",
 "cases": cases}
(here.parent / "probe-checkout.replay.goldens.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
print(len(cases), "cases")
