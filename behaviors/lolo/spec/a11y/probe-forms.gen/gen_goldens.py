import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
rd = lambda n: (here / f"forms-{n}.measure.js").read_text().strip()
EX = {"inventory": f"({rd('inventory')})()", "read": f"({rd('read')})()", "restore": f"({rd('restore')})()"}
stim = lambda submit: f"({rd('stimulate')})({'true' if submit else 'false'})"
SYN = "https://a.test/p"

def wc(c, lvl, ver): return {"criterion": c, "level": lvl, "version": ver}
W = {
    "label": [wc("1.3.1", "A", "2.0"), wc("3.3.2", "A", "2.0"), wc("4.1.2", "A", "2.0")],
    "auto": [wc("1.3.5", "AA", "2.1")],
    "ident": [wc("3.3.1", "A", "2.0")],
    "colour": [wc("1.4.1", "A", "2.0"), wc("3.3.1", "A", "2.0")],
    "announce": [wc("4.1.3", "AA", "2.1")],
}
IMP = {"label": "serious", "auto": "moderate", "ident": "serious", "colour": "serious", "announce": "moderate"}
RULE = {"label": "form-label", "auto": "autocomplete-missing", "ident": "form-error-not-identified", "colour": "form-error-colour", "announce": "form-error-not-announced"}
CONF = {"label": "confirmed"}
def finding(page, k, sel, snippet):
    return {"id": f"{page}#{RULE[k]}#{sel}", "pageUrl": page, "rule": RULE[k], "wcag": W[k], "method": "probe", "engines": ["probe"], "impact": IMP[k], "confidence": CONF.get(k, "needs-verification"), "selector": sel, "snippet": snippet, "evidence": "", "count": 1}

def ctl(selector, **kw):
    b = {"selector": selector, "snippet": f"<input id=\"{selector[1:]}\">", "tag": "input", "type": "", "form": "#f", "labels": "Oznaka", "ariaLabel": "", "labelledby": "", "title": "", "required": False, "autocomplete": "", "describedby": "", "disabled": False, "hidden": False}
    b.update(kw); return b
def rctl(selector, **kw):
    b = {"selector": selector, "snippet": f"<input id=\"{selector[1:]}\">", "form": "#f", "valid": True, "ariaInvalid": "", "describedText": "", "errorText": "", "borderBefore": "rgb(118, 118, 118)", "borderAfter": "rgb(118, 118, 118)", "borderRef": "rgb(118, 118, 118)", "styleBefore": "inset", "styleAfter": "inset", "styleRef": "inset", "colorBefore": "rgb(0, 0, 0)", "colorAfter": "rgb(0, 0, 0)", "colorRef": "rgb(0, 0, 0)"}
    b.update(kw); return b
def appeared(selector, text="Napaka", form="#f", live=False, referenced=False):
    return {"selector": selector, "snippet": f"<div id=\"{selector[1:]}\">", "text": text, "form": form, "live": live, "referenced": referenced}
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
INV = lambda *cs: J({"controls": list(cs)})
READ = lambda controls=(), app=(), lost=False: J({"lost": lost, "controls": list(controls), "appeared": list(app)})

def step(frm, event, payload, state, emits, entity=None):
    s = {"from": frm, "event": event, "payload": payload, "expect": {"state": state, "emits": emits}}
    if entity is not None: s["entity"] = entity
    return s
measure = lambda key, expr: {"event": "PAGE_MEASURE", "payload": {"key": key, "expression": expr}}
nav = lambda url, k="k:back": {"event": "PAGE_NAVIGATE", "payload": {"key": k, "url": url}}

def full(id, url, inv, stimj, readj, submit=False, findings=(), config=None, restj='{"restored":1}'):
    cfg = dict(config or {})
    if submit: cfg["dispatchSubmit"] = True
    steps = [
        step("idle", "PROBE_RUN", {"key": "k", "pageUrl": url}, "inventorying", [measure("k:inventory", EX["inventory"])]),
        step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": inv}, "stimulating", [measure("k:stimulate", stim(submit))]),
        step("stimulating", "PAGE_MEASURED", {"key": "k:stimulate", "json": stimj}, "reading", [measure("k:read", EX["read"])]),
        step("reading", "PAGE_MEASURED", {"key": "k:read", "json": readj}, "restoring", [measure("k:restore", EX["restore"])]),
        step("restoring", "PAGE_MEASURED", {"key": "k:restore", "json": restj}, "returning", [nav(url)]),
        step("returning", "PAGE_LOADED", {"key": "k:back", "url": url, "title": "T"}, "idle", [{"event": "PROBE_DONE", "payload": {"key": "k", "probe": "forms", "findings": list(findings)}}]),
    ]
    c = {"id": id, "steps": steps}
    if cfg: c["config"] = cfg
    return c

def real(name, findings, id):
    r = rec[name]
    return full(id, r["url"], r["inventory"], r["stimulate"], r["read"], r["submit"], findings, restj=r["restore"])

R = lambda n: rec[n]
U = lambda n: rec[n]["url"]
email_snip = lambda n: json.loads(rec[n]["inventory"])["controls"][0]["snippet"]
cases = [
 real("form-label-fail", [finding(U("form-label-fail"), "label", "#email", email_snip("form-label-fail")), finding(U("form-label-fail"), "auto", "#email", email_snip("form-label-fail"))], "form-label-fail: the placeholder-only email input has no name (confirmed form-label); its missing autocomplete is also reported"),
 real("form-label-pass", [finding(U("form-label-pass"), "auto", "#email", email_snip("form-label-pass"))], "control: form-label-pass has a label for the input, so only the missing autocomplete is reported"),
 real("form-error-colour-fail", [finding(U("form-error-colour-fail"), "colour", "#zip", json.loads(R("form-error-colour-fail")["inventory"])["controls"][0]["snippet"])], "form-error-colour-fail: the zip field is marked invalid by a red border and aria-invalid but no text, so form-error-colour"),
 real("form-error-colour-pass", [], "control: form-error-colour-pass states the error in text referenced by aria-describedby, so no finding"),
 real("form-error-announce-fail", [finding(U("form-error-announce-fail"), "auto", "#em", email_snip("form-error-announce-fail")), finding(U("form-error-announce-fail"), "announce", "#msg", '<div id="msg">')], "form-error-announce-fail (submit event dispatched): the error appears in a plain div, so form-error-not-announced"),
 real("form-error-announce-pass", [finding(U("form-error-announce-pass"), "auto", "#em", email_snip("form-error-announce-pass"))], "control: form-error-announce-pass puts the same error in role=alert, so only the missing autocomplete is reported"),
]
cases[4]["steps"][2]["payload"]["json"]  # recorded with submit
cases += [
 full("a control marked aria-invalid with no text and no colour difference is form-error-not-identified", SYN, INV(ctl("#a", required=True)), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", ariaInvalid="true")]), findings=[finding(SYN, "ident", "#a", '<input id="a">')]),
 full("control: the same control with an aria-describedby error text is identified", SYN, INV(ctl("#a", required=True, describedby="e")), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", ariaInvalid="true", describedText="Vnesite vrednost")])),
 full("control: an aria-errormessage text identifies the error too", SYN, INV(ctl("#a", required=True)), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", ariaInvalid="true", errorText="Vnesite vrednost")])),
 full("control: a text that appeared in the same form identifies the error", SYN, INV(ctl("#a", required=True)), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", ariaInvalid="true")], [appeared("#m", live=True)])),
 full("a text that appeared in another form does not identify the error", SYN, INV(ctl("#a", required=True)), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", ariaInvalid="true")], [appeared("#m", form="#g", live=True)]), findings=[finding(SYN, "ident", "#a", '<input id="a">')]),
 full("a border colour that changed on blur, with no aria-invalid and no text, is form-error-colour", SYN, INV(ctl("#a", required=True)), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", borderAfter="rgb(204, 0, 0)")]), findings=[finding(SYN, "colour", "#a", '<input id="a">')]),
 full("control: a text colour that did not change and matches a fresh control is not an error mark", SYN, INV(ctl("#a", required=True)), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a")])),
 full("control: the browser's own invalid state (valid false) with no page reaction is not a finding", SYN, INV(ctl("#a", type="email", autocomplete="email")), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a", valid=False)])),
 full("an appeared text outside a live region and not referenced is form-error-not-announced; one in a live region and one referenced are not", SYN, INV(ctl("#a")), J({"stimulated": ["#a"], "submitted": 0}), READ([rctl("#a")], [appeared("#m1"), appeared("#m2", live=True), appeared("#m3", referenced=True)]), findings=[{**finding(SYN, "announce", "#m1", '<div id="m1">')}]),
 full("autocomplete: tel without it is reported, tel with it and a text input are not", SYN, INV(ctl("#t", type="tel"), ctl("#u", type="tel", autocomplete="tel"), ctl("#v", type="text")), J({"stimulated": ["#t", "#u", "#v"], "submitted": 0}), READ([rctl("#t"), rctl("#u"), rctl("#v")]), findings=[finding(SYN, "auto", "#t", '<input id="t">')]),
 full("a control named by aria-labelledby, aria-label, a label or a title has a name; one with none is form-label", SYN, INV(ctl("#a", labels="", labelledby="Ime"), ctl("#b", labels="", ariaLabel="Ime"), ctl("#c"), ctl("#d", labels="", title="Ime"), ctl("#e", labels="")), J({"stimulated": ["#a", "#b", "#c", "#d", "#e"], "submitted": 0}), READ([rctl("#a"), rctl("#b"), rctl("#c"), rctl("#d"), rctl("#e")]), findings=[finding(SYN, "label", "#e", '<input id="e">')]),
 full("the dispatchSubmit knob is passed to the trigger expression as true", SYN, INV(ctl("#a")), J({"stimulated": ["#a"], "submitted": 1}), READ([rctl("#a")]), submit=True),
 {"id": "hidden and disabled controls are not measured further: with none left the probe answers at once and touches nothing", "steps": [
   step("idle", "PROBE_RUN", {"key": "k", "pageUrl": SYN}, "inventorying", [measure("k:inventory", EX["inventory"])]),
   step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": INV(ctl("#h", hidden=True, labels=""), ctl("#d", disabled=True, labels=""))}, "idle", [{"event": "PROBE_DONE", "payload": {"key": "k", "probe": "forms", "findings": []}}])]},
 {"id": "a page that has no controls answers an empty list", "steps": [
   step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": INV()}, "idle", [{"event": "PROBE_DONE", "payload": {"key": "k", "probe": "forms", "findings": []}}], {"runKey": "k", "pageUrl": SYN})]},
]
E = {"runKey": "k", "pageUrl": SYN}
fail = lambda st, key, code="probe_page_failed", back=True: step(st, "PAGE_FAILED", {"key": key, "error": "boom", "code": "x"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "forms", "error": "boom", "code": code}}] + ([nav(SYN)] if back else []), E)
cases += [
 {"id": "the page replacing itself while validating answers probe_page_changed and navigates back", "steps": [step("reading", "PAGE_MEASURED", {"key": "k:read", "json": READ(lost=True)}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "forms", "code": "probe_page_changed"}}, nav(SYN)], E)]},
 {"id": "a page failure while measuring the inventory answers probe_page_failed and changes nothing", "steps": [fail("inventorying", "k:inventory", back=False)]},
 {"id": "a page failure while triggering validation answers probe_page_failed and navigates back", "steps": [fail("stimulating", "k:stimulate")]},
 {"id": "a page failure while reading answers probe_page_failed and navigates back", "steps": [fail("reading", "k:read")]},
 {"id": "a page failure while restoring answers probe_page_failed and navigates back", "steps": [fail("restoring", "k:restore")]},
 {"id": "control: a page failure under another run's key is ignored", "steps": [step("reading", "PAGE_FAILED", {"key": "j:read", "error": "boom", "code": "x"}, "reading", [], E)]},
 {"id": "a navigation back that fails answers probe_page_failed", "steps": [fail("returning", "k:back", back=False)]},
 {"id": "control: a load answer under another run's key does not finish the run", "steps": [step("returning", "PAGE_LOADED", {"key": "j:back", "url": SYN, "title": "T"}, "returning", [], E)]},
 {"id": "an inventory that is not the control list answers probe_bad_measure", "steps": [step("inventorying", "PAGE_MEASURED", {"key": "k:inventory", "json": "{\"x\":1}"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "forms", "code": "probe_bad_measure"}}], E)]},
 {"id": "a validation trigger answer that is not its shape answers probe_bad_measure and navigates back", "steps": [step("stimulating", "PAGE_MEASURED", {"key": "k:stimulate", "json": "{\"x\":1}"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "forms", "code": "probe_bad_measure"}}, nav(SYN)], E)]},
 {"id": "a read that is not its shape answers probe_bad_measure and navigates back", "steps": [step("reading", "PAGE_MEASURED", {"key": "k:read", "json": "{\"x\":1}"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "forms", "code": "probe_bad_measure"}}, nav(SYN)], E)]},
 {"id": "a restore that is not its shape answers probe_bad_measure and navigates back", "steps": [step("restoring", "PAGE_MEASURED", {"key": "k:restore", "json": "{\"x\":1}"}, "idle", [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "forms", "code": "probe_bad_measure"}}, nav(SYN)], E)]},
 {"id": "control: a measure answer under another run's key is ignored", "steps": [step("stimulating", "PAGE_MEASURED", {"key": "j:stimulate", "json": J({"stimulated": [], "submitted": 0})}, "stimulating", [], E)]},
]
out = {"atom": "a11y/atoms/std-a11y-probe-forms.lolo", "trait": "FormsProbe",
       "note": "std-a11y-probe-forms with the page answers played as events. The six fixture cases carry the real PAGE_MEASURED json recorded by probe-forms.gen/record.py from headless Chrome on the form-label, form-error-colour and form-error-announce fixtures (the announce pair with dispatchSubmit on); the server log of that run shows only the page GETs, so nothing was submitted. The other cases are small hand-built pages. The expressions asserted are probe-forms.gen/forms-*.measure.js. Regenerate with python3 -I probe-forms.gen/gen_goldens.py.",
       "cases": cases}
(here.parent / "probe-forms.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
