import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
expression = "(" + (here / "a11y-tree.measure.js").read_text().strip() + ")()"
SYN = "https://a.test/p"

def wc(c, lvl, ver): return {"criterion": c, "level": lvl, "version": ver}
W = {
    "button": [wc("4.1.2", "A", "2.0")],
    "link": [wc("2.4.4", "A", "2.0"), wc("4.1.2", "A", "2.0")],
    "imglink": [wc("1.1.1", "A", "2.0"), wc("2.4.4", "A", "2.0"), wc("4.1.2", "A", "2.0")],
    "img": [wc("1.1.1", "A", "2.0")],
    "mismatch": [wc("2.5.3", "A", "2.1")],
    "dup": [wc("2.4.4", "A", "2.0")],
}
def finding(page, rule, wcag, impact, conf, sel, snippet, count=1):
    return {"id": f"{page}#{rule}#{sel}", "pageUrl": page, "rule": rule, "wcag": wcag, "method": "probe", "engines": ["probe"], "impact": impact, "confidence": conf, "selector": sel, "snippet": snippet, "evidence": "", "count": count}

def item(selector, tag, **kw):
    base = {"selector": selector, "snippet": f"<{tag}>", "tag": tag, "type": "", "roleAttr": "", "visible": "", "ariaLabel": "", "labelledby": "", "content": "", "alt": "", "altPresent": False, "title": "", "value": "", "href": "", "hidden": False, "containsImage": False}
    base.update(kw)
    return base
def measure(*items): return json.dumps({"items": list(items)}, ensure_ascii=False, separators=(",", ":"))
def ax(id, role, name="", parent=None, ignored=False):
    n = {"id": id, "role": role, "name": name, "ignored": ignored}
    if parent is not None: n["parent"] = parent
    return n

def chain(id, url, nodes, js, lines, findings, config=None, note=None):
    steps = [
        {"from": "idle", "event": "PROBE_RUN", "payload": {"key": "k", "pageUrl": url}, "expect": {"state": "reading", "emits": [{"event": "PAGE_AX_TREE", "payload": {"key": "k:ax"}}]}},
        {"from": "reading", "event": "PAGE_AX_TREE_READ", "payload": {"key": "k:ax", "nodes": nodes}, "expect": {"state": "measuring", "emits": [{"event": "PAGE_MEASURE", "payload": {"key": "k:measure", "expression": expression}}]}},
        {"from": "measuring", "event": "PAGE_MEASURED", "payload": {"key": "k:measure", "json": js}, "expect": {"state": "idle", "emits": [{"event": "TRANSCRIPT_READY", "payload": {"key": "k", "pageUrl": url, "lines": lines}}, {"event": "PROBE_DONE", "payload": {"key": "k", "probe": "a11y-tree", "findings": findings}}]}},
    ]
    c = {"id": id, "steps": steps}
    if config: c["config"] = config
    return c

R = lambda n: rec[n]
icon_lines = ["dokument: icon-name", "povezava: Preskoči na vsebino", "navigacija: Glavna navigacija", "povezava: Domov", "povezava: Izdelki", "glavna vsebina: ", "naslov: icon-name"]
lib_lines = ["dokument: label-in-name", "povezava: Preskoči na vsebino", "navigacija: Glavna navigacija", "povezava: Domov", "povezava: Izdelki", "glavna vsebina: ", "naslov: label-in-name"]
cases = [
 chain("icon-name-fail: the icon-only button has no name; the transcript reads an empty gumb and the finding is confirmed by the tree",
       R("icon-name-fail")["url"], R("icon-name-fail")["nodes"], R("icon-name-fail")["json"], icon_lines + ["gumb: "],
       [finding(R("icon-name-fail")["url"], "name-missing", W["button"], "serious", "confirmed", "#main > button", '<button type="button" class="icon-btn">')]),
 chain("control: icon-name-pass has an aria-label, so the transcript reads gumb: Iskanje and there is no finding",
       R("icon-name-pass")["url"], R("icon-name-pass")["nodes"], R("icon-name-pass")["json"], icon_lines + ["gumb: Iskanje"], []),
 chain("label-in-name-fail: the visible Išči is not whole words of the name Poišči izdelke, a confirmed name-mismatch",
       R("label-in-name-fail")["url"], R("label-in-name-fail")["nodes"], R("label-in-name-fail")["json"], lib_lines + ["gumb: Poišči izdelke"],
       [finding(R("label-in-name-fail")["url"], "name-mismatch", W["mismatch"], "moderate", "confirmed", "#main > button", '<button type="button" class="search" aria-label="Poišči izdelke">')]),
 chain("control: label-in-name-pass has the name Išči izdelke, which starts with the visible Išči",
       R("label-in-name-pass")["url"], R("label-in-name-pass")["nodes"], R("label-in-name-pass")["json"], lib_lines + ["gumb: Išči izdelke"], []),
]

il_head = ["dokument: img-link-alt"] + lib_lines[1:5] + ["glavna vsebina: ", "naslov: img-link-alt"]
cases += [
 chain("img-link-alt-fail: the link holds only an img with no alt, so the link has no name and contains an image (name-missing-image-link, N4), and the img is a name-missing; both confirmed by the tree",
       R("img-link-alt-fail")["url"], R("img-link-alt-fail")["nodes"], R("img-link-alt-fail")["json"], il_head + ["povezava: ", "slika: "],
       [finding(R("img-link-alt-fail")["url"], "name-missing-image-link", W["imglink"], "serious", "confirmed", "#main > a", '<a class="home" href="index.html">'),
        finding(R("img-link-alt-fail")["url"], "name-missing", W["img"], "serious", "confirmed", "#main > a > img", '<img src="img/lonec.svg" width="120" height="80">')]),
 chain("control: img-link-alt-pass gives the img alt Domov, so the link is named and there is no finding",
       R("img-link-alt-pass")["url"], R("img-link-alt-pass")["nodes"], R("img-link-alt-pass")["json"], il_head + ["povezava: Domov", "slika: Domov"], []),
]

tiny = [ax("1", "RootWebArea", "T"), ax("2", "main", "", "1")]
def tiny_chain(id, items, findings, extra=(), lines=None, nodes=None):
    return chain(id, SYN, nodes or (tiny + list(extra)), measure(*items), lines if lines is not None else ["dokument: T", "glavna vsebina: "] + [], findings)

cases += [
 tiny_chain("a link with only an image with no alt has no name (needs-verification when the tree holds no nameless link); the image is a name-missing too",
   [item("a.home", "a", href="https://a.test/", snippet="<a class=\"home\">", containsImage=True), item("a.home img", "img", snippet="<img>")],
   [finding(SYN, "name-missing-image-link", W["imglink"], "serious", "needs-verification", "a.home", '<a class="home">'), finding(SYN, "name-missing", W["img"], "serious", "needs-verification", "a.home img", "<img>")]),
 tiny_chain("control: an img with alt attribute and empty text is decorative and is not a name-missing",
   [item("img.deco", "img", altPresent=True, alt="")], []),
 tiny_chain("an img with no alt attribute is a name-missing, confirmed when the tree has a nameless image node",
   [item("img.photo", "img", snippet="<img class=\"photo\">")],
   [finding(SYN, "name-missing", W["img"], "serious", "confirmed", "img.photo", '<img class="photo">')],
   extra=[ax("3", "image", "", "2")], lines=["dokument: T", "glavna vsebina: ", "slika: "]),
 tiny_chain("control: a hidden unnamed button (aria-hidden ancestor) is not a name-missing",
   [item("button.x", "button", hidden=True)], []),
 tiny_chain("aria-labelledby text wins over aria-label and content, so the button is named",
   [item("button.x", "button", labelledby="Dodaj v košarico", ariaLabel="x", content="Dodaj", visible="Dodaj")], []),
 tiny_chain("control: a button named only by its title is named",
   [item("button.x", "button", title="Zapri")], []),
 tiny_chain("an input of type submit is named by its value, and is empty without it",
   [item("input.a", "input", type="submit", value="Naprej", visible=""), item("input.b", "input", type="submit", snippet="<input type=\"submit\">")],
   [finding(SYN, "name-missing", W["button"], "serious", "needs-verification", "input.b", '<input type="submit">')]),
 tiny_chain("the visible text is matched case-insensitively and ignoring punctuation: ISKANJE! is in iskanje izdelkov",
   [item("button.a", "button", visible="ISKANJE!", ariaLabel="iskanje izdelkov", content="ISKANJE!")], []),
 tiny_chain("control: a symbol-only visible text (no letter or digit) is not compared with the name",
   [item("button.a", "button", visible="×", ariaLabel="Zapri", content="×")], []),
 tiny_chain("the visible text must be whole words of the name: Iš is not in Išči izdelke",
   [item("button.a", "button", visible="Iš", ariaLabel="Išči izdelke", content="Iš", snippet="<button class=\"a\">")],
   [finding(SYN, "name-mismatch", W["mismatch"], "moderate", "confirmed", "button.a", '<button class="a">')]),
 tiny_chain("duplicate-name: two links named Več to different hrefs are one finding with count 2",
   [item("a.one", "a", visible="Več", content="Več", href="https://a.test/a", snippet="<a class=\"one\">"), item("button.mid", "button", visible="Mid", content="Mid"), item("a.two", "a", visible="Več", content="Več", href="https://a.test/b")],
   [finding(SYN, "duplicate-name", W["dup"], "moderate", "needs-verification", "a.one", '<a class="one">', 2)]),
 tiny_chain("control: two links named Več to the same href are not a duplicate-name",
   [item("a.one", "a", visible="Več", content="Več", href="https://a.test/a"), item("button.mid", "button", visible="Mid", content="Mid"), item("a.two", "a", visible="Več", content="Več", href="https://a.test/a")], []),
 tiny_chain("redundant-link: a link right after a link with the same name and href is one finding on the second",
   [item("a.one", "a", visible="Domov", content="Domov", href="https://a.test/"), item("a.two", "a", visible="Domov", content="Domov", href="https://a.test/", snippet="<a class=\"two\">")],
   [finding(SYN, "redundant-link", W["dup"], "minor", "needs-verification", "a.two", '<a class="two">', 2)]),
 tiny_chain("control: a link and a link with different names to the same href (the shared nav of the fixtures) is not redundant",
   [item("a.one", "a", visible="Domov", content="Domov", href="https://a.test/"), item("a.two", "a", visible="Izdelki", content="Izdelki", href="https://a.test/")], []),
]

deep = [ax("1", "RootWebArea", "T"), ax("2", "main", "", "1"), ax("3", "navigation", "N", "2"), ax("4", "list", "", "3"), ax("5", "listitem", "", "4")]
cases += [
 chain("a role with no word is shown as it is, an ignored node is left out, a StaticText under a named parent is folded and one under an unnamed parent is kept",
   SYN, [ax("1", "RootWebArea", "T"), ax("2", "tablist", "", "1"), ax("3", "none", "", "2", True), ax("4", "paragraph", "", "1"), ax("5", "StaticText", "Pozdravljeni", "4"), ax("6", "heading", "Naslov", "1"), ax("7", "StaticText", "Naslov", "6")],
   measure(), ["dokument: T", "tablist: ", "paragraph: ", "besedilo: Pozdravljeni", "naslov: Naslov"], []),
 chain("tree order is pre-order whatever the list order: the children of the first node come before its next sibling",
   SYN, [ax("1", "RootWebArea", "T"), ax("2", "navigation", "N1", "1"), ax("3", "main", "", "1"), ax("4", "link", "A", "3"), ax("5", "link", "B", "2")],
   measure(), ["dokument: T", "navigacija: N1", "povezava: B", "glavna vsebina: ", "povezava: A"], []),
 chain("a tree deeper than maxDepth answers probe_tree_too_deep and no transcript",
   SYN, deep, measure(), [], [], config={"maxDepth": 3}),
]
# the too-deep case emits PROBE_FAILED instead of the transcript and done
cases[-1]["steps"][2]["expect"]["emits"] = [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "a11y-tree", "code": "probe_tree_too_deep"}}]
cases.append({"id": "control: the same tree within maxDepth answers its transcript", "steps": [cases[-1]["steps"][0], cases[-1]["steps"][1], {"from": "measuring", "event": "PAGE_MEASURED", "payload": {"key": "k:measure", "json": measure()}, "expect": {"state": "idle", "emits": [{"event": "TRANSCRIPT_READY", "payload": {"key": "k", "lines": ["dokument: T", "glavna vsebina: ", "navigacija: N", "seznam: ", "element seznama: "]}}, {"event": "PROBE_DONE", "payload": {"key": "k", "probe": "a11y-tree", "findings": []}}]}}], "config": {"maxDepth": 8}})
cases[-1]["steps"][1] = dict(cases[-1]["steps"][1], payload={"key": "k:ax", "nodes": deep})

cases += [
 {"id": "a page failure while reading the tree answers PROBE_FAILED with probe_page_failed", "steps": [
   {"from": "reading", "event": "PAGE_FAILED", "entity": {"runKey": "k", "pageUrl": SYN}, "payload": {"key": "k:ax", "error": "no tab", "code": "no_tab"}, "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "a11y-tree", "error": "no tab", "code": "probe_page_failed"}}]}}]},
 {"id": "control: a page failure under another run's key is ignored", "steps": [
   {"from": "reading", "event": "PAGE_FAILED", "entity": {"runKey": "k", "pageUrl": SYN}, "payload": {"key": "j:ax", "error": "no tab", "code": "no_tab"}, "expect": {"state": "reading", "emits": []}}]},
 {"id": "a measurement that is not the element list answers probe_bad_measure", "steps": [
   {"from": "measuring", "event": "PAGE_MEASURED", "entity": {"runKey": "k", "pageUrl": SYN}, "payload": {"key": "k:measure", "json": "{\"x\":1}"}, "expect": {"state": "idle", "emits": [{"event": "PROBE_FAILED", "payload": {"key": "k", "probe": "a11y-tree", "code": "probe_bad_measure"}}]}}]},
 {"id": "control: a tree answer under another run's key is ignored", "steps": [
   {"from": "reading", "event": "PAGE_AX_TREE_READ", "entity": {"runKey": "k", "pageUrl": SYN}, "payload": {"key": "j:ax", "nodes": tiny}, "expect": {"state": "reading", "emits": []}}]},
]
out = {"atom": "a11y/atoms/std-a11y-probe-a11y-tree.lolo", "trait": "TreeProbe",
       "note": "std-a11y-probe-a11y-tree with the page answers played as events. The icon-name and label-in-name cases carry the real PAGE_AX_TREE_READ nodes (CDP Accessibility.getFullAXTree, mapped to id, parent, role, name, ignored) and the real PAGE_MEASURED json recorded by probe-a11y-tree.gen/record.py from headless Chrome on the fixtures; the other cases are small hand-built pages. The expression asserted is probe-a11y-tree.gen/a11y-tree.measure.js. Regenerate with python3 -I probe-a11y-tree.gen/gen_goldens.py.",
       "cases": cases}
(here.parent / "probe-a11y-tree.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
