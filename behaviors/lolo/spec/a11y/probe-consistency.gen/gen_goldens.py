# usage: python3 -I record.py && python3 -I gen_goldens.py   (reads recorded.json, writes ../probe-consistency.replay.goldens.json)
# The expectations come from the small independent model below; the replay runner checks the atom against it.
import json, pathlib, re
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
O = f"http://127.0.0.1:{rec['port']}"
MEASURE = (here / "measure.js").read_text().strip()
PATTERNS = ["^mailto:", "^tel:", "/kontakt", "/contact", "/pomoc", "/help"]
def page(name):
    m = json.loads(rec["pages"][name]["measured"])
    return {"url": f"{O}/{name}", "nav": m["nav"], "helpLinks": m["helpLinks"]}
def uniq(xs):
    out = []
    for x in xs:
        if x not in out: out.append(x)
    return out
def model(pages, patterns=PATTERNS):
    if not pages: return []
    ref = pages[0]; refnav = uniq(ref["nav"])
    nav = []
    for p in pages[1:]:
        pn = uniq(p["nav"]); cr = [t for t in refnav if t in pn]; cp = [t for t in pn if t in refnav]
        if cr != cp:
            nav.append({"id": "nav-inconsistent:" + p["url"], "pageUrl": p["url"], "rule": "nav-inconsistent", "wcag": [{"criterion": "3.2.3", "level": "AA", "version": "2.0"}], "method": "probe", "engines": ["probe"], "impact": "moderate", "confidence": "needs-verification", "selector": "nav", "snippet": f"order on {ref['url']}: {' > '.join(cr)}; on {p['url']}: {' > '.join(cp)}", "evidence": "", "count": 1})
    rows = []
    for p in pages:
        helps = []
        for i, h in enumerate(p["helpLinks"]):
            if any(re.search(pat, h.lower()) for pat in patterns) and h not in [e[0] for e in helps]: helps.append((h, i))
        rows.append((p["url"], helps))
    allh = uniq([h for _, hs in rows for h, _ in hs])
    help_ = []
    for h in allh:
        first = next(r for r in rows if any(e[0] == h for e in r[1]))
        at = next(e[1] for e in first[1] if e[0] == h)
        for url, hs in rows:
            if url == first[0]: continue
            mine = next((e[1] for e in hs if e[0] == h), -1)
            if mine == at: continue
            snip = f"help link {h} is at index {at} on {first[0]} and " + ("missing here" if mine == -1 else f"at index {mine} here")
            help_.append({"id": f"help-inconsistent:{url}:{h}", "pageUrl": url, "rule": "help-inconsistent", "wcag": [{"criterion": "3.2.6", "level": "A", "version": "2.2"}], "method": "probe", "engines": ["probe"], "impact": "moderate", "confidence": "needs-verification", "selector": f'a[href="{h}"]', "snippet": snip, "evidence": "", "count": 1})
    return nav + help_
def case(id, pages, config=None, note=None, findings=None):
    c = {"id": id}
    if note: c["note"] = note
    if config: c["config"] = config
    fs = model(pages, (config or {}).get("helpPatterns", PATTERNS)) if findings is None else findings
    c["steps"] = [{"event": "CONSISTENCY_CHECK", "payload": {"key": "k1", "pages": pages}, "from": "ready", "expect": {"state": "ready", "emits": [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "consistency", "findings": fs}}]}}]
    return c, fs
P = {n: page(n + ".html") for n in ["index", "kosarica", "izdelek-1", "izdelek-2", "placilo", "povratne-informacije", "izjava-o-dostopnosti", "blagajna", "nadzorni-organ"]}
cases = []
def add(*a, expect_rules=None, **k):
    c, fs = case(*a, **k)
    if expect_rules is not None: assert [f["rule"] for f in fs] == expect_rules, (a[0], [f["rule"] for f in fs])
    cases.append(c)
base = [P[n] for n in ("index", "kosarica", "izdelek-1", "placilo")]
add("control: pages with the same navigation order and the same help links at the same positions have no finding", base, expect_rules=[], note="pages measured in headless Chrome with the measureExpression (record.py); some footers and navs of the shop copy are patched there to plant the defects")
add("control: an extra navigation link on a page does not change the order of the links it shares, so no finding", [P["index"], P["povratne-informacije"]], expect_rules=[])
add("control: a navigation link missing from a page does not change the order of the others, so no finding", [P["index"], P["izdelek-2"]], expect_rules=[])
add("nav-inconsistent: two shared navigation links in the other order is one needs-verification finding on that page", base + [P["nadzorni-organ"]], expect_rules=["nav-inconsistent"])
add("help-inconsistent: contact links missing from a page that has the other pages' footer are one finding each", [P["index"], P["izjava-o-dostopnosti"]], expect_rules=["help-inconsistent", "help-inconsistent"])
add("help-inconsistent: contact links at another index among the footer links are one finding each", [P["index"], P["blagajna"]], expect_rules=["help-inconsistent", "help-inconsistent"])
add("help-inconsistent: when the first page lacks the link, the first page that has it is the reference and the first page is flagged", [P["izjava-o-dostopnosti"], P["index"], P["kosarica"]], expect_rules=["help-inconsistent", "help-inconsistent"])
add("findings of a whole site: navigation first, then help, each on its page", base + [P["nadzorni-organ"], P["izjava-o-dostopnosti"], P["blagajna"]], expect_rules=["nav-inconsistent"] + ["help-inconsistent"] * 4)
add("control: a help pattern list that matches nothing finds no help inconsistency", [P["index"], P["izjava-o-dostopnosti"]], {"helpPatterns": []}, expect_rules=[])
add("help patterns are declared: with only the cenik pdf as a pattern its position is compared", [P["index"], P["blagajna"]], {"helpPatterns": ["\\.pdf$"]}, expect_rules=["help-inconsistent"])
add("control: only links matching a pattern are compared, so with /kontakt alone the mailto link is not", [P["index"], P["blagajna"]], {"helpPatterns": ["/kontakt"]}, expect_rules=["help-inconsistent"])
a = {"url": O + "/a", "nav": ["A", "B"], "helpLinks": ["https://x.example/KONTAKT", "tel:+38612345678"]}
b = {"url": O + "/b", "nav": ["A", "B"], "helpLinks": ["tel:+38612345678"]}
add("help patterns are tried on the lowercase href (KONTAKT matches /kontakt), and tel: counts", [a, b], expect_rules=["help-inconsistent", "help-inconsistent"][:2])
add("control: the same two pages with the same help links are consistent", [a, dict(a, url=O + "/c")], expect_rules=[])
d = {"url": O + "/d", "nav": ["A", "B", "A", "C"], "helpLinks": []}
e = {"url": O + "/e", "nav": ["A", "C", "B"], "helpLinks": []}
add("a navigation text that appears twice counts once, at its first place", [d, e], expect_rules=["nav-inconsistent"])
add("control: the same duplicated texts in the same order are consistent", [d, dict(d, url=O + "/f")], expect_rules=[])
add("one page has nothing to compare", [P["index"]], expect_rules=[])
add("no pages have nothing to compare", [], expect_rules=[])
cases.append({"id": "CONSISTENCY_EXPRESSION_ASK answers the measureExpression knob, which is the expression record.py ran in Chrome", "steps": [{"event": "CONSISTENCY_EXPRESSION_ASK", "payload": {"key": "k2"}, "from": "ready", "expect": {"state": "ready", "emits": [{"event": "CONSISTENCY_EXPRESSION", "payload": {"key": "k2", "expression": MEASURE}}]}}]})
out = {"atom": "a11y/atoms/std-a11y-probe-consistency.lolo", "trait": "ConsistencyProbe", "spec": "spec/a11y/probe-consistency.lolo",
       "note": "std-a11y-probe-consistency on per-page measurements taken in headless Chrome with the measureExpression knob from a copy of the a11y fixture shop whose footers and navs are patched to plant the defects (record.py). Regenerate with python3 -I record.py && python3 -I gen_goldens.py.",
       "cases": cases}
(here.parent / "probe-consistency.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print(len(cases), "cases")
