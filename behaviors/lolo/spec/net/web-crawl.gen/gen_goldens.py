# usage: python3 -I record.py && python3 -I gen_goldens.py   (reads recorded.json, writes ../web-crawl.replay.goldens.json)
# The expectations come from a small independent model of the crawl (below); the replay runner checks the atom against it.
import json, pathlib, re
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
PORT = rec["port"]
O = f"http://127.0.0.1:{PORT}"
PAGES = rec["pages"]
ROBOTS = rec["robotsRead"]
def url(p): return f"{O}/{p}"
def links_of(u):
    p = u[len(O) + 1:].split("#")[0].split("?")[0]
    return PAGES[p]["links"]
def title_of(u): return PAGES[u[len(O) + 1:]]["title"]
def step(frm, event, payload, state, emits=None, before=None, after=None, never=None):
    s = {"event": event, "payload": payload, "expect": {"state": state}}
    if frm: s["from"] = frm
    if before is not None: s["entity"] = before
    if emits is not None: s["expect"]["emits"] = emits
    if after is not None: s["expect"]["entity"] = after
    if never: s["expect"]["neverEmits"] = never
    return s
def em(event, payload): return {"event": event, "payload": payload}
def case(id, steps, config=None, note=None):
    c = {"id": id}
    if note: c["note"] = note
    c["defaults"] = ["CrawlDelay"]
    if config: c["config"] = config
    c["steps"] = steps
    return c
def link(href, text="x", download=False, kind="link", index=0): return {"index": index, "text": text, "href": href, "download": download, "kind": kind}

def parse_robots(text):
    rules, star, after = [], False, False
    for raw in text.split("\n"):
        line = re.sub(r"#.*$", "", raw).strip()
        if ":" not in line: continue
        f, v = line.split(":", 1); f = f.strip().lower(); v = v.strip()
        if f == "user-agent":
            star = (v == "*") if after else (star or v == "*"); after = False
        elif f in ("allow", "disallow"):
            after = True
            if star and v: rules.append({"allow": f == "allow", "rule": v, "pattern": rule_pattern(v)})
    return rules
def rule_pattern(v):
    anchored = v.endswith("$"); body = v[:-1] if anchored else v
    return "^" + ".*".join(re.escape(s) for s in body.split("*")) + ("$" if anchored else "")
def rule_pattern(v):
    anchored = v.endswith("$"); body = v[:-1] if anchored else v
    def esc(seg):
        for c in "\\.+?^{}()|[]$": seg = seg.replace(c, "\\" + c)
        return seg
    return "^" + ".*".join(esc(s) for s in body.split("*")) + ("$" if anchored else "")
def blocked_by(rules, path):
    best = {True: 0, False: 0}
    for r in rules:
        if re.search(r["pattern"], path) and len(r["rule"]) > best[r["allow"]]: best[r["allow"]] = len(r["rule"])
    return best[False] > best[True]

class Model:
    def __init__(s, start, depth, pages, include=(), exclude=(), rules=()):
        s.start, s.depth, s.maxpages, s.include, s.exclude, s.rules = start, depth, pages, include, exclude, list(rules)
        s.queue, s.seen, s.pages, s.docs, s.blocked, s.cur = [], [], [], [], 0, None
    def enqueue(s, links, frm, child):
        anchors = [(l["href"].split("#")[0], l["text"], l["download"]) for l in links if l["kind"] == "link"]
        here = [a for a in anchors if a[0] != "" and (a[0].lower() == O or a[0].lower().startswith(O + "/") or a[0].lower().startswith(O + "?"))]
        isdoc = lambda a: a[2]
        for a in here:
            if isdoc(a) and not any(d["url"] == a[0] for d in s.docs): s.docs.append({"url": a[0], "text": a[1], "fromPage": frm})
        wanted = [a[0] for a in here if not isdoc(a) and (not s.include or any(re.search(p, a[0]) for p in s.include)) and not any(re.search(p, a[0]) for p in s.exclude)]
        fresh = []
        for u in wanted:
            if u not in fresh and u not in s.seen: fresh.append(u)
        allowed = []
        for u in fresh:
            rest = u[len(O):]; path = "/" if rest == "" else ("/" + rest if rest.startswith("?") else rest)
            if not blocked_by(s.rules, path): allowed.append(u)
        s.blocked += len(fresh) - len(allowed); s.seen += fresh
        s.queue += [{"url": u, "depth": child, "fromPage": frm} for u in allowed]

def crawl_steps(key, start, depth, maxpages, robots=None, include=(), exclude=(), fail=None, first_from=True, payload_extra=None):
    """robots None = respectRobots off; else the robots.txt text. fail maps url -> 'nav' | 'links'.
    The replay runner delivers the internal CRAWL_ENQUEUE and CRAWL_NEXT itself, so each step lists the whole cascade."""
    fail = fail or {}
    m = Model(start, depth, maxpages, include, exclude)
    rob = "off" if robots is None else "read"
    def advance():
        if not m.queue:
            return [em("CRAWL_NEXT", {}), em("CRAWL_DONE", {"key": key, "pages": list(m.pages), "documents": list(m.docs), "truncated": False, "skipped": 0, "blocked": m.blocked, "robots": rob})]
        if len(m.pages) >= m.maxpages:
            return [em("CRAWL_NEXT", {}), em("CRAWL_DONE", {"key": key, "pages": list(m.pages), "documents": list(m.docs), "truncated": True, "skipped": len(m.queue), "blocked": m.blocked, "robots": rob})]
        head = m.queue.pop(0)
        m.cur = head
        return [em("CRAWL_NEXT", {}), em("PAGE_NAVIGATE", {"key": key + ":nav", "url": head["url"]})]
    steps = []
    p = {"key": key, "startUrl": start}
    if payload_extra: p.update(payload_extra)
    seed = em("CRAWL_ENQUEUE", {"fromPage": "", "childDepth": 0, "links": [link(start, "", index=0)]})
    def seeded():
        m.enqueue([link(start, "", index=0)], "", 0)
        return [seed] + advance()
    if robots is None:
        steps.append(step("idle" if first_from else None, "CRAWL_START", p, "enqueuing", seeded()))
    else:
        steps.append(step("idle" if first_from else None, "CRAWL_START", p, "robots_loading", [em("PAGE_NAVIGATE", {"key": key + ":robots", "url": O + "/robots.txt"})]))
        steps.append(step(None, "PAGE_LOADED", {"key": key + ":robots", "url": O + "/robots.txt", "title": ""}, "robots_reading", [em("PAGE_TEXT", {"key": key + ":robots-text"})]))
        m.rules = parse_robots(robots)
        steps.append(step(None, "PAGE_TEXT_READ", {"key": key + ":robots-text", "url": O + "/robots.txt", "title": "", "lang": "", "text": robots}, "enqueuing", seeded()))
    while m.cur is not None or False:
        head = m.cur; m.cur = None
        u = head["url"]
        if fail.get(u) == "nav":
            m.pages.append({"url": u, "title": "", "depth": head["depth"], "error": "net::ERR_CONNECTION_REFUSED"})
            pg = em("CRAWL_PAGE", {"key": key, "url": u, "title": "", "depth": head["depth"], "links": [], "error": "net::ERR_CONNECTION_REFUSED"})
            steps.append(step(None, "PAGE_FAILED", {"key": key + ":nav", "error": "net::ERR_CONNECTION_REFUSED", "code": "navigate_failed"}, "stepping", [pg] + advance()))
            continue
        t = title_of(u)
        steps.append(step(None, "PAGE_LOADED", {"key": key + ":nav", "url": u, "title": t}, "linking", [em("PAGE_LINKS", {"key": key + ":links"})]))
        if fail.get(u) == "links":
            m.pages.append({"url": u, "title": t, "depth": head["depth"], "error": "execution context destroyed"})
            pg = em("CRAWL_PAGE", {"key": key, "url": u, "title": t, "depth": head["depth"], "links": [], "error": "execution context destroyed"})
            steps.append(step(None, "PAGE_FAILED", {"key": key + ":links", "error": "execution context destroyed", "code": "cdp_error"}, "stepping", [pg] + advance()))
            continue
        ls = links_of(u)
        m.pages.append({"url": u, "title": t, "depth": head["depth"]})
        follow = ls if head["depth"] < m.depth else []
        pre = [em("CRAWL_PAGE", {"key": key, "url": u, "title": t, "depth": head["depth"], "links": ls}), em("CRAWL_ENQUEUE", {"fromPage": u, "childDepth": head["depth"] + 1, "links": follow})]
        m.enqueue(follow, u, head["depth"] + 1)
        steps.append(step(None, "PAGE_LINKS_READ", {"key": key + ":links", "links": ls}, "enqueuing", pre + advance(), after={"blocked": m.blocked}))
    return steps, m

S = url("index.html")
N0 = {"delayMs": 0, "respectRobots": False}
cases = []

# depth limit, with its control
st, m = crawl_steps("d1", S, 1, 25)
cases.append(case("depth-limit: maxDepth 1 visits the start page and its links and nothing deeper, every page visited once", st, {**N0, "maxDepth": 1}, "pages, links and titles are real, read through headless Chrome by record.py; the model in gen_goldens.py checks the frontier"))
assert len(m.pages) == 6
st, m = crawl_steps("d2", S, 2, 25)
assert len(m.pages) == 9 and len(m.docs) == 1
cases.append(case("control: maxDepth 2 also visits the pages those link to (blagajna, nadzorni-organ, povratne-informacije), the one document is recorded once with the page that first held it, truncated is false", st, {**N0, "maxDepth": 2}))

# page limit, with its control being the run above
st, m = crawl_steps("p3", S, 2, 3)
assert len(m.pages) == 3 and m.queue
cases.append(case("page-limit: maxPages 3 stops with the frontier left, truncated true and skipped counting the urls not visited", st, {**N0, "maxDepth": 2, "maxPages": 3}))
st, m = crawl_steps("p9", S, 2, 9)
assert not m.queue and len(m.pages) == 9
cases.append(case("control: maxPages equal to the pages found ends with an empty frontier, truncated false and skipped 0", st, {**N0, "maxDepth": 2, "maxPages": 9}))

# knobs overridden by the start payload
cases.append(case("CRAWL_START maxDepth and maxPages in the payload override the knobs", [
    step("idle", "CRAWL_START", {"key": "o1", "startUrl": S, "maxDepth": 0, "maxPages": 4}, "enqueuing", None, after={"maxDepth": 0, "maxPages": 4, "origin": O})], {**N0, "maxDepth": 2, "maxPages": 25}))
cases.append(case("control: without them the knobs apply", [
    step("idle", "CRAWL_START", {"key": "o2", "startUrl": S}, "enqueuing", None, after={"maxDepth": 2, "maxPages": 25, "origin": O})], {**N0, "maxDepth": 2, "maxPages": 25}))

# exclude / include
idx = links_of(S)
base = {"origin": O, "seen": [S], "maxDepth": 2, "maxPages": 0, "runKey": "x", "curUrl": S}
def enq(links, before, after, id, config=None, frm="enqueuing"):
    return case(id, [step(frm, "CRAWL_ENQUEUE", {"fromPage": S, "childDepth": 1, "links": links}, "stepping", [em("CRAWL_NEXT", {})], before={**base, **before}, after=after)], config, "maxPages 0 in the entity: the cascade ends the run at once, so the queue the enqueue built is still there to read")
def q(*ps): return [{"url": url(p), "depth": 1, "fromPage": S} for p in ps]
allq = ["kosarica.html", "izjava-o-dostopnosti.html", "izdelek-1.html", "izdelek-2.html", "izdelek-3.html"]
cases.append(enq(idx, {}, {"queue": q(*allq)}, "control: the index page links queue the five pages once each, in document order, with the fragment and the page's own url dropped", N0))
cases.append(enq(idx, {}, {"queue": q("kosarica.html", "izjava-o-dostopnosti.html")}, "exclude-pattern: izdelek- urls are not queued", {**N0, "exclude": ["izdelek-"]}))
cases.append(enq(idx, {}, {"queue": q("kosarica.html")}, "include-pattern: only urls matching an include pattern are queued", {**N0, "include": ["kosarica"]}))
cases.append(enq(idx, {}, {"queue": q("kosarica.html", "izjava-o-dostopnosti.html")}, "an exclude pattern is tried on the whole url, so a pattern on the path does not touch the host", {**N0, "exclude": ["izdelek-[12]\\.html$", "izdelek-3"]}))

# same-origin filter
foreign = [link("https://example.org/page.html", "ext"), link(f"http://127.0.0.1:{PORT + 1}/index.html", "other port"), link(f"http://127.0.0.1:{PORT}@evil.example/x.html", "userinfo"), link(f"http://127.0.0.1.evil.example:{PORT}/x.html", "lookalike host"), link(f"https://127.0.0.1:{PORT}/index.html?x=1", "other scheme"), link("mailto:a@b.si", "mail"), link(O.upper() + "/IZDELEK-9.html", "upper-case origin")]
cases.append(enq(idx[:3] + foreign, {}, {"queue": [{"url": url("kosarica.html"), "depth": 1, "fromPage": S}, {"url": O.upper() + "/IZDELEK-9.html", "depth": 1, "fromPage": S}]}, "same-origin: other hosts, ports, schemes, a userinfo trick and mailto are never queued; the origin compares case-insensitively", N0))
cases.append(enq(idx[:3], {}, {"queue": q("kosarica.html")}, "control: the same page without the foreign links queues the same-origin one", N0))
cases.append(enq([link(f"{O}/kosarica.html?a=1#top", "q"), link(f"{O}/kosarica.html?a=1", "q again"), link(f"{O}?x=1", "root query"), link("#frag", "frag only")], {}, {"queue": [{"url": f"{O}/kosarica.html?a=1", "depth": 1, "fromPage": S}, {"url": f"{O}?x=1", "depth": 1, "fromPage": S}]}, "a fragment is dropped, so two links differing in it are one; a bare fragment link is nothing; a query stays part of the url", N0))
cases.append(enq([link(f"{O}/izdelek-1.html", "buy", kind="button", index=3), link("", "Dodaj", kind="button", index=4)], {}, {"queue": []}, "buttons are not followed", N0))
cases.append(enq(idx, {"seen": [S] + [url(p) for p in allq]}, {"queue": []}, "control: urls already seen are not queued again", N0))

# documents
dl = [link(f"{O}/export/podatki.csv", "Podatki (CSV)", download=True), link(f"{O}/export/page-2.html", "Page 2")]
cases.append(enq(dl, {}, {"queue": q("export/page-2.html"), "documents": [{"url": f"{O}/export/podatki.csv", "text": "Podatki (CSV)", "fromPage": S}]}, "documents: an anchor with the download flag is recorded as a document with its text and page and never queued", N0))
cases.append(enq([link(f"{O}/export/podatki.csv", "Podatki (CSV)")], {}, {"queue": q("export/podatki.csv"), "documents": []}, "control: the same url without the download flag, and no document pattern, is a page", N0))
cases.append(enq([link("https://example.org/x.pdf", "ext pdf", download=True)], {}, {"queue": [], "documents": []}, "a document on another origin is not collected", N0))
cases.append(enq([link(f"{O}/a.pdf", "again", download=True)], {"documents": [{"url": f"{O}/a.pdf", "text": "first", "fromPage": url("izdelek-1.html")}]}, {"documents": [{"url": f"{O}/a.pdf", "text": "first", "fromPage": url("izdelek-1.html")}]}, "a document already recorded is not recorded again", N0))

# robots
rr = parse_robots(ROBOTS)
assert [r["rule"] for r in rr] == ["/nadzorni-organ.html", "/docs/", "/docs/cenik.pdf", "/*.json$"]
steps = [step("idle", "CRAWL_START", {"key": "r1", "startUrl": S}, "robots_loading", [em("PAGE_NAVIGATE", {"key": "r1:robots", "url": O + "/robots.txt"})], after={"robots": "unreadable", "navigations": 1}),
         step(None, "PAGE_LOADED", {"key": "r1:robots", "url": O + "/robots.txt", "title": ""}, "robots_reading", [em("PAGE_TEXT", {"key": "r1:robots-text"})]),
         step(None, "PAGE_TEXT_READ", {"key": "r1:robots-text", "url": O + "/robots.txt", "title": "", "lang": "", "text": ROBOTS}, "enqueuing", [em("CRAWL_ENQUEUE", {"fromPage": "", "childDepth": 0})], after={"robots": "read", "rules": rr})]
cases.append(case("robots: robots.txt is loaded before the first page, only the User-agent * group is kept (the Googlebot group's Disallow / is not), comments and Sitemap lines are ignored", steps, {"delayMs": 0}))
cases.append(case("control: respectRobots off loads no robots.txt, goes straight to the start page and reports robots off", [
    step("idle", "CRAWL_START", {"key": "r2", "startUrl": S}, "enqueuing", [em("CRAWL_ENQUEUE", {}), em("CRAWL_NEXT", {}), em("PAGE_NAVIGATE", {"key": "r2:nav", "url": S})], after={"robots": "off", "rules": [], "navigations": 1})], N0))
cases.append(case("robots: a robots.txt that fails to load allows everything and the run says robots unreadable", [
    step("idle", "CRAWL_START", {"key": "r3", "startUrl": S}, "robots_loading", None),
    step(None, "PAGE_FAILED", {"key": "r3:robots", "error": "net::ERR_ABORTED", "code": "navigate_failed"}, "enqueuing", [em("CRAWL_ENQUEUE", {"fromPage": "", "childDepth": 0}), em("CRAWL_NEXT", {}), em("PAGE_NAVIGATE", {"key": "r3:nav", "url": S})], after={"robots": "unreadable", "rules": [], "queue": []})], {"delayMs": 0}))
cases.append(case("robots: a failure reading the robots text also allows everything", [
    step("robots_reading", "PAGE_FAILED", {"key": "r4:robots-text", "error": "no body", "code": "cdp_error"}, "enqueuing", [em("CRAWL_ENQUEUE", {})], before={"runKey": "r4", "origin": O, "curUrl": S, "robots": "unreadable", "rules": []}, after={"robots": "unreadable", "rules": []})], {"delayMs": 0}))
rb = {"rules": rr}
cases.append(enq(idx[:2] + [link(url("nadzorni-organ.html"), "organ"), link(url("kosarica.html"), "k")], rb, {"queue": q("kosarica.html"), "blocked": 1}, "robots: a url under a Disallow rule is not queued and is counted blocked", {**N0, "respectRobots": True}))
cases.append(enq(idx[:2] + [link(url("nadzorni-organ.html"), "organ"), link(url("kosarica.html"), "k")], {}, {"queue": q("nadzorni-organ.html", "kosarica.html"), "blocked": 0}, "control: with no rules the same links are all queued", {**N0, "respectRobots": True}))
cases.append(enq([link(url("docs/stran.html"), "s"), link(url("docs/cenik.pdf.html"), "c")], rb, {"queue": q("docs/cenik.pdf.html"), "blocked": 1}, "robots: the longest matching rule wins, so Allow /docs/cenik.pdf beats Disallow /docs/", N0))
cases.append(enq([link(url("podatki.json"), "j"), link(url("podatki.json.html"), "jh"), link(url("podatki.json?x=1"), "jq")], rb, {"queue": q("podatki.json.html", "podatki.json?x=1"), "blocked": 1}, "robots: * and a trailing $ work as RFC 9309 says (/*.json$ blocks podatki.json, not podatki.json.html or podatki.json?x=1)", N0))
cases.append(enq([link(url("nadzorni-organ.html"), "organ")], {"rules": [{"allow": False, "rule": "/", "pattern": "^/"}]}, {"queue": [], "blocked": 1}, "robots: Disallow / blocks everything", N0))
cases.append(enq([link(url("nadzorni-organ.html"), "organ")], {"rules": [{"allow": False, "rule": "/", "pattern": "^/"}, {"allow": True, "rule": "/nadzorni-organ.html", "pattern": "^/nadzorni-organ\\.html"}]}, {"queue": q("nadzorni-organ.html"), "blocked": 0}, "control: a longer Allow overrides Disallow /", N0))
cases.append(enq([link(O + "?a=1", "root query")], {"rules": [{"allow": False, "rule": "/?", "pattern": "^/\\?"}]}, {"queue": [], "blocked": 1}, "robots: a url with no path is matched as /, a query keeps its place after it", N0))

# failures
fail_nav = {url("izdelek-2.html"): "nav", url("kosarica.html"): "links"}
st, m = crawl_steps("f1", S, 1, 25, fail=fail_nav)
assert [p.get("error") for p in m.pages].count(None) == 4 and len(m.pages) == 6
cases.append(case("failed page: a page that does not load, and one whose links cannot be read, are recorded with an error and the crawl goes on to the rest", st, {**N0, "maxDepth": 1}))
cases.append(case("control: a failure answer under another run's key is ignored", [
    step("loading", "PAGE_FAILED", {"key": "zz:nav", "error": "x", "code": "c"}, "loading", [], before={"runKey": "f2", "curUrl": S, "origin": O})], N0))
cases.append(case("control: a page load answer under another run's key is ignored", [
    step("loading", "PAGE_LOADED", {"key": "zz:nav", "url": S, "title": "t"}, "loading", [], before={"runKey": "f2", "curUrl": S, "origin": O})], N0))
cases.append(case("control: a links answer under another run's key is ignored", [
    step("linking", "PAGE_LINKS_READ", {"key": "zz:links", "links": []}, "linking", [], before={"runKey": "f2", "curUrl": S, "origin": O})], N0))

# robots through a whole run
st, m = crawl_steps("rr", S, 2, 25, robots=ROBOTS)
assert m.blocked == 1
cases.append(case("robots in a whole run: nadzorni-organ is never navigated and CRAWL_DONE reports blocked 1 and robots read", st, {"delayMs": 0, "maxDepth": 2}))

# politeness
qd = [{"url": url("kosarica.html"), "depth": 1, "fromPage": S}]
cases.append(case("delay: the second navigation waits delayMs through std-delay before PAGE_NAVIGATE", [
    step("stepping", "CRAWL_NEXT", {}, "pausing", [em("CRAWL_TIMER_ARM", {"key": "w1", "delayMs": 500})], before={"runKey": "w1", "origin": O, "queue": qd, "navigations": 1, "maxPages": 25, "pages": [{"url": S, "title": "t", "depth": 0}]}, after={"curUrl": url("kosarica.html"), "curDepth": 1, "queue": [], "navigations": 2}, never=["PAGE_NAVIGATE"]),
    step(None, "CRAWL_WAITED", {"key": "w1"}, "loading", [em("PAGE_NAVIGATE", {"key": "w1:nav", "url": url("kosarica.html")})])], {"delayMs": 500}))
cases.append(case("control: delayMs 0 navigates at once", [
    step("stepping", "CRAWL_NEXT", {}, "loading", [em("PAGE_NAVIGATE", {"key": "w2:nav", "url": url("kosarica.html")})], before={"runKey": "w2", "origin": O, "queue": qd, "navigations": 1, "maxPages": 25, "pages": [{"url": S, "title": "t", "depth": 0}]}, never=["CRAWL_TIMER_ARM"])], {"delayMs": 0}))
cases.append(case("control: the first navigation of a run without robots does not wait", [
    step("stepping", "CRAWL_NEXT", {}, "loading", [em("PAGE_NAVIGATE", {"key": "w3:nav", "url": S})], before={"runKey": "w3", "origin": O, "queue": [{"url": S, "depth": 0, "fromPage": ""}], "navigations": 0, "maxPages": 25}, never=["CRAWL_TIMER_ARM"])], {"delayMs": 500}))
cases.append(case("control: an elapsed pause of another run is ignored", [
    step("pausing", "CRAWL_WAITED", {"key": "zz"}, "pausing", [], before={"runKey": "w1", "origin": O, "curUrl": url("kosarica.html")})], {"delayMs": 500}))

# start refusals
cases.append(case("a start url that is not http or https answers bad_start_url", [
    step("idle", "CRAWL_START", {"key": "b1", "startUrl": "ftp://example.org/x"}, "idle", [em("CRAWL_FAILED", {"key": "b1", "code": "bad_start_url"})])], N0))
cases.append(case("control: a start url with no scheme is refused the same way", [
    step("idle", "CRAWL_START", {"key": "b2", "startUrl": "example.org/x"}, "idle", [em("CRAWL_FAILED", {"key": "b2", "code": "bad_start_url"})])], N0))
for stname in ("robots_loading", "robots_reading", "enqueuing", "stepping", "pausing", "loading", "linking"):
    cases.append(case(f"a second CRAWL_START while the run is in {stname} answers crawl_busy and leaves it", [
        step(stname, "CRAWL_START", {"key": "b9", "startUrl": S}, stname, [em("CRAWL_FAILED", {"key": "b9", "code": "crawl_busy"})], before={"runKey": "b0", "origin": O})], N0))

# bot challenges: an interstitial title is waited out and reloaded, then reported as a typed interstitial
CH = "Just a moment..."
CHB = {"runKey": "c1", "origin": O, "curUrl": S, "curDepth": 0}
cases.append(case("challenge: a page that loads with a bot-check title is waited on and loaded again, never read for links", [
    step("loading", "PAGE_LOADED", {"key": "c1:nav", "url": S, "title": CH}, "challenged", [em("CRAWL_TIMER_ARM", {"key": "c1:challenge", "delayMs": 5000})], before=CHB, after={"challengeTries": 1}, never=["PAGE_LINKS", "CRAWL_PAGE"]),
    step(None, "CRAWL_WAITED", {"key": "c1:challenge"}, "loading", [em("PAGE_NAVIGATE", {"key": "c1:nav", "url": S})])], N0))
cases.append(case("challenge: a check that clears on reload is crawled as usual and the tries start over", [
    step("loading", "PAGE_LOADED", {"key": "c1:nav", "url": S, "title": "Lon\u010darna Mala"}, "linking", [em("PAGE_LINKS", {"key": "c1:links"})], before={**CHB, "challengeTries": 1}, after={"challengeTries": 0})], N0))
cases.append(case("challenge: a check still showing after the declared retries reports the page with its interstitial and the crawl goes on", [
    step("loading", "PAGE_LOADED", {"key": "c1:nav", "url": S, "title": CH}, "stepping",
         [em("CRAWL_PAGE", {"key": "c1", "url": S, "title": CH, "depth": 0, "links": [], "error": "the page answered a bot check: " + CH, "interstitial": CH}), em("CRAWL_NEXT", {})],
         before={**CHB, "challengeTries": 2}, after={"challengeTries": 0}, never=["CRAWL_TIMER_ARM"])], N0))
cases.append(case("control: a title that only mentions the words mid-title is not a bot check", [
    step("loading", "PAGE_LOADED", {"key": "c1:nav", "url": S, "title": "Wait just a moment | Shop"}, "linking", [em("PAGE_LINKS", {"key": "c1:links"})], before=CHB, never=["CRAWL_TIMER_ARM"])], N0))
cases.append(case("control: a wait of another run is ignored while a check is waited on", [
    step("challenged", "CRAWL_WAITED", {"key": "zz:challenge"}, "challenged", [], before={**CHB, "challengeTries": 1}, never=["PAGE_NAVIGATE"])], N0))

# redirects: the start page's landed origin is the crawl's origin
RS = "https://shop.example"
RW = "https://www.shop.example/"
RB = {"runKey": "r1", "origin": RS, "curUrl": RS, "curDepth": 0, "seen": [RS]}
cases.append(case("redirect: a start page that lands on another origin moves the crawl to that origin and marks the landed url seen", [
    step("loading", "PAGE_LOADED", {"key": "r1:nav", "url": RW, "title": "Shop"}, "linking", [em("PAGE_LINKS", {"key": "r1:links"})], before=RB, after={"origin": "https://www.shop.example", "seen": [RS, RW]})], N0))
cases.append(case("redirect: links of the landed origin are queued after the start page moved the crawl", [
    step("enqueuing", "CRAWL_ENQUEUE", {"fromPage": RS, "childDepth": 1, "links": [link("https://www.shop.example/izdelki"), link("https://shop.example/o-nas")]}, "stepping", [em("CRAWL_NEXT", {})],
         before={"runKey": "r1", "origin": "https://www.shop.example", "seen": [RS, RW], "queue": [], "rules": []}, after={"queue": [{"url": "https://www.shop.example/izdelki", "depth": 1, "fromPage": RS}]})], N0))
cases.append(case("control: a start page that lands on its own url keeps the origin and seen as they were", [
    step("loading", "PAGE_LOADED", {"key": "r1:nav", "url": RS, "title": "Shop"}, "linking", [em("PAGE_LINKS", {"key": "r1:links"})], before=RB, after={"origin": RS, "seen": [RS]})], N0))
cases.append(case("control: a deeper page that redirects to another site leaves the crawl's origin alone", [
    step("loading", "PAGE_LOADED", {"key": "r1:nav", "url": "https://other.example/x", "title": "Other"}, "linking", [em("PAGE_LINKS", {"key": "r1:links"})],
         before={**RB, "curUrl": RS + "/out", "curDepth": 1}, after={"origin": RS, "seen": [RS]})], N0))

out = {"atom": "net/atoms/std-web-crawl.lolo", "trait": "WebCrawl", "spec": "spec/net/web-crawl.lolo",
       "note": "std-web-crawl with the page answers played as events. The link lists, titles and robots text are real: record.py serves the a11y fixture shop with a robots.txt on a random port and reads each page through headless Chrome with links.js (which must stay identical to the PAGE_LINKS expression of std-chrome). The internal CRAWL_ENQUEUE and CRAWL_NEXT events are played as steps. Regenerate with python3 -I record.py && python3 -I gen_goldens.py.",
       "cases": cases}
(here.parent / "web-crawl.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print(len(cases), "cases")
