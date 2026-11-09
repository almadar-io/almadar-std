# usage: python3 -I record.py && python3 -I gen_goldens.py   (reads recorded.json, writes ../probe-documents.replay.goldens.json)
import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = json.loads((here / "recorded.json").read_text())
PORT = rec["port"]; O = f"http://127.0.0.1:{PORT}"
SCAN_PAGE = f"{O}/documents-pdf-notext-fail.html"; TEXT_PAGE = f"{O}/documents-pdf-text-pass.html"; NONE_PAGE = f"{O}/lang-missing-pass.html"
LINKS = {SCAN_PAGE: rec["pages"]["documents-pdf-notext-fail.html"]["links"], TEXT_PAGE: rec["pages"]["documents-pdf-text-pass.html"]["links"], NONE_PAGE: rec["pages"]["lang-missing-pass.html"]["links"]}
SCAN, CENIK = rec["pdfs"]["docs/scan.pdf"], rec["pdfs"]["docs/cenik.pdf"]
assert not SCAN["hasText"] and CENIK["hasText"]
DL = "/downloads"
def link(href, text="x", download=False, kind="link", index=0): return {"index": index, "text": text, "href": href, "download": download, "kind": kind}
def em(event, payload): return {"event": event, "payload": payload}
def step(frm, event, payload, state, emits=None, before=None, after=None, never=None):
    s = {"trait": "DocumentsProbe", "event": event, "payload": payload, "expect": {"state": state}}
    if frm: s["from"] = frm
    if before is not None: s["entity"] = before
    if emits is not None: s["expect"]["emits"] = emits
    if after is not None: s["expect"]["entity"] = after
    if never: s["expect"]["neverEmits"] = never
    return s
def case(id, steps, config=None, note=None):
    c = {"id": id}
    if note: c["note"] = note
    c["defaults"] = ["PdfText", "PdfCli"]
    if config: c["config"] = config
    c["steps"] = steps
    return c
def finding(page, href, text, count):
    return {"id": f"pdf-scanned:{page}:{href}", "pageUrl": page, "rule": "pdf-scanned", "wcag": [{"criterion": "1.1.1", "level": "A", "version": "2.0"}], "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": "confirmed", "selector": f'a[href="{href}"]', "snippet": f'<a href="{href}">{text}</a> is a PDF of {count} pages with no text', "evidence": "", "count": 1}
def done(key, findings): return em("PROBE_DONE", {"key": key, "probe": "documents", "findings": findings})
def failed(key, code, error=None):
    p = {"key": key, "probe": "documents", "code": code}
    if error: p["error"] = error
    return em("PROBE_FAILED", p)
def pdf_ran(key, pdf, exit_code=None):
    r = rec["notPdf"] if pdf is None else {"exitCode": 0, "stdout": pdf["stdout"], "stderr": ""}
    return {"trait": "PdfText", "event": "PDF_RAN", "payload": {"stage": key, "exitCode": r["exitCode"], "signal": 0, "stdout": r["stdout"], "stdoutBytes": "", "stderr": r["stderr"]}, "expect": {"state": "ready"}}
def cli_idle(): return {"trait": "PdfCli", "event": "INIT", "from": "idle", "payload": {}, "expect": {}}
def with_emits(st, emits, never=None):
    st["expect"]["emits"] = emits
    if never: st["expect"]["neverEmits"] = never
    return st
def doc_entry(l): return {"index": l["index"], "text": l["text"], "href": l["href"]}
def run_start(key, page): return step("idle", "PROBE_RUN", {"key": key, "pageUrl": page}, "linking", [em("PAGE_LINKS", {"key": key + ":links"})])
cases = []
cases.append(case("PROBE_RUN asks the tab for its links under the run key", [run_start("k1", SCAN_PAGE)]))

# scanned PDF, with its control
sl = LINKS[SCAN_PAGE][3]; tl = LINKS[TEXT_PAGE][3]
assert sl["href"].endswith("docs/scan.pdf") and tl["href"].endswith("docs/cenik.pdf")
cases.append(case("pdf-scanned-fail: the linked PDF has no text on any page, so it is the confirmed pdf-scanned finding", [
    run_start("k1", SCAN_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "k1:links", "links": LINKS[SCAN_PAGE]}, "stepping", [em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "k1:dl:0", "index": sl["index"]})], after={"docs": [doc_entry(sl)], "total": 1, "pos": 0}),
    step(None, "PAGE_DOWNLOADED", {"key": "k1:dl:0", "path": f"{DL}/scan.pdf", "url": sl["href"], "size": 1024}, "reading", [em("PDF_REQUEST", {"key": "k1:pdf:0", "path": f"{DL}/scan.pdf"})]),
    with_emits(pdf_ran("k1:pdf:0", SCAN), [em("PDF_NO_TEXT", {"key": "k1:pdf:0", "pageCount": len(SCAN["pages"])}), em("DOCS_NEXT", {}), done("k1", [finding(SCAN_PAGE, sl["href"], sl["text"], len(SCAN["pages"]))])], ["DOCUMENT_READ"])],
    note="links from headless Chrome (record.py); scan.pdf is a real PDF of drawn rectangles, pageCount from real pdftotext; the download is played"))
cases.append(case("control: a linked PDF with a text layer is no finding and answers DOCUMENT_READ with its pages, for the knowledge base", [
    run_start("k2", TEXT_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "k2:links", "links": LINKS[TEXT_PAGE]}, "stepping", [em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "k2:dl:0", "index": tl["index"]})]),
    step(None, "PAGE_DOWNLOADED", {"key": "k2:dl:0", "path": f"{DL}/cenik.pdf", "url": tl["href"], "size": 2048}, "reading", [em("PDF_REQUEST", {"key": "k2:pdf:0", "path": f"{DL}/cenik.pdf"})]),
    with_emits(pdf_ran("k2:pdf:0", CENIK), [em("PDF_TEXT", {"key": "k2:pdf:0", "pages": CENIK["pages"]}), em("DOCUMENT_READ", {"key": "k2", "url": tl["href"], "path": f"{DL}/cenik.pdf", "pages": CENIK["pages"]}), em("DOCS_NEXT", {}), done("k2", [])], ["DOCUMENTS_UNCHECKED"])],
    note="the pages are the text of the real cenik.pdf from pdftotext -layout"))
cases.append(case("control: a page that links no document ends at once with no finding and downloads nothing", [
    run_start("k3", NONE_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "k3:links", "links": LINKS[NONE_PAGE]}, "stepping", [em("DOCS_NEXT", {}), done("k3", [])], never=["PAGE_DOWNLOAD"])]))

# which links are documents
def sel(links, expect_idx, id, config=None, note=None):
    first = None
    steps = [run_start("s", SCAN_PAGE), step(None, "PAGE_LINKS_READ", {"key": "s:links", "links": links}, "stepping", [em("DOCS_NEXT", {})] + ([em("PAGE_DOWNLOAD", {"key": "s:dl:0", "index": expect_idx[0]})] if expect_idx else [done("s", [])]), after={"docs": [doc_entry(l) for l in links if l["index"] in expect_idx], "total": len(expect_idx)})]
    return case(id, steps, config, note)
mix = [link(f"{O}/a.html", "page", index=0), link(f"{O}/export/podatki.csv", "Podatki", download=True, index=1), link(f"{O}/B.PDF?v=2", "upper", index=2), link(f"{O}/c.pdf#page=3", "fragment", index=3), link(f"{O}/pdf-info.html", "pdf word in the name", index=4), link(f"{O}/x.pdf", "btn", kind="button", index=5), link("", "empty", index=6)]
cases.append(sel(mix, [1, 2, 3], "documents: the download flag, a .PDF in any case with a query, and .pdf with a fragment are documents; a page, a name containing pdf, a button and an empty href are not", {"maxPdfs": 10}))
cases.append(sel(mix, [1], "control: with no document patterns only the download flag makes a document", {"maxPdfs": 10, "documentPatterns": []}))
dup = [link(f"{O}/x.pdf", "first", index=2), link(f"{O}/x.pdf", "second", index=7), link(f"{O}/y.pdf", "other", index=8)]
cases.append(sel(dup, [2, 8], "documents: the same href linked twice is checked once, at its first link", {"maxPdfs": 10}))

# cap
three = [link(f"{O}/1.pdf", "one", index=1), link(f"{O}/2.pdf", "two", index=2), link(f"{O}/3.pdf", "three", index=3)]
cases.append(case("cap: with maxPdfs 1 and three PDFs linked, the first is checked and DOCUMENTS_UNCHECKED reports the other two", [
    run_start("c1", SCAN_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "c1:links", "links": three}, "stepping", [em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "c1:dl:0", "index": 1})], after={"total": 3, "docs": [doc_entry(three[0])]}),
    step(None, "PAGE_DOWNLOADED", {"key": "c1:dl:0", "path": f"{DL}/1.pdf", "url": three[0]["href"], "size": 1}, "reading", None),
    with_emits(pdf_ran("c1:pdf:0", CENIK), [em("DOCUMENT_READ", {"key": "c1"}), em("DOCS_NEXT", {}), em("DOCUMENTS_UNCHECKED", {"key": "c1", "unchecked": 2, "total": 3}), done("c1", [])])], {"maxPdfs": 1}))
cases.append(case("control: with maxPdfs 3 all three are checked and nothing is reported unchecked", [
    run_start("c2", SCAN_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "c2:links", "links": three}, "stepping", None, after={"total": 3, "docs": [doc_entry(l) for l in three]}),
    step(None, "PAGE_DOWNLOADED", {"key": "c2:dl:0", "path": f"{DL}/1.pdf", "url": three[0]["href"], "size": 1}, "reading", None),
    with_emits(pdf_ran("c2:pdf:0", CENIK), [em("DOCUMENT_READ", {"key": "c2"}), em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "c2:dl:1", "index": 2})], ["DOCUMENTS_UNCHECKED"]), cli_idle(),
    step(None, "PAGE_DOWNLOADED", {"key": "c2:dl:1", "path": f"{DL}/2.pdf", "url": three[1]["href"], "size": 1}, "reading", None),
    with_emits(pdf_ran("c2:pdf:1", SCAN), [em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "c2:dl:2", "index": 3})]), cli_idle(),
    step(None, "PAGE_DOWNLOADED", {"key": "c2:dl:2", "path": f"{DL}/3.pdf", "url": three[2]["href"], "size": 1}, "reading", None),
    with_emits(pdf_ran("c2:pdf:2", CENIK), [em("DOCUMENT_READ", {"key": "c2"}), em("DOCS_NEXT", {}), done("c2", [finding(SCAN_PAGE, three[1]["href"], "two", len(SCAN["pages"]))])], ["DOCUMENTS_UNCHECKED"])], {"maxPdfs": 3}))

# unreadable
two = three[:2]
cases.append(case("a PDF pdftotext cannot read answers DOCUMENT_UNREADABLE and the run goes on to the next document", [
    run_start("u1", SCAN_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "u1:links", "links": two}, "stepping", None),
    step(None, "PAGE_DOWNLOADED", {"key": "u1:dl:0", "path": f"{DL}/1.pdf", "url": two[0]["href"], "size": 1}, "reading", None),
    with_emits(pdf_ran("u1:pdf:0", None), [em("PDF_FAILED", {"key": "u1:pdf:0", "code": "pdf_unreadable"}), em("DOCUMENT_UNREADABLE", {"key": "u1", "url": two[0]["href"], "code": "pdf_unreadable"}), em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "u1:dl:1", "index": 2})], ["PROBE_FAILED"])],
    note="the exit code and stderr are what real pdftotext answers for a file that is not a PDF"))
cases.append(case("a download that fails answers DOCUMENT_UNREADABLE with the page's code and the run goes on", [
    run_start("u2", SCAN_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "u2:links", "links": two}, "stepping", None),
    step(None, "PAGE_FAILED", {"key": "u2:dl:0", "error": "download timed out", "code": "download_timeout"}, "stepping", [em("DOCUMENT_UNREADABLE", {"key": "u2", "url": two[0]["href"], "error": "download timed out", "code": "download_timeout"}), em("DOCS_NEXT", {}), em("PAGE_DOWNLOAD", {"key": "u2:dl:1", "index": 2})])]))
cases.append(case("control: the last document failing ends the run with PROBE_DONE and no finding", [
    run_start("u3", SCAN_PAGE),
    step(None, "PAGE_LINKS_READ", {"key": "u3:links", "links": two[:1]}, "stepping", None),
    step(None, "PAGE_FAILED", {"key": "u3:dl:0", "error": "gone", "code": "download_failed"}, "stepping", [em("DOCUMENT_UNREADABLE", {"key": "u3"}), em("DOCS_NEXT", {}), done("u3", [])])]))

# failures, strays, busy
cases.append(case("a failure reading the links answers PROBE_FAILED with the page's code", [
    run_start("f1", SCAN_PAGE),
    step(None, "PAGE_FAILED", {"key": "f1:links", "error": "tab gone", "code": "page_gone"}, "idle", [failed("f1", "page_gone", "tab gone")])]))
cases.append(case("control: a links failure under another run's key is ignored", [
    step("linking", "PAGE_FAILED", {"key": "zz:links", "error": "x", "code": "c"}, "linking", [], before={"runKey": "f1", "pageUrl": SCAN_PAGE})]))
cases.append(case("control: a links answer under another run's key is ignored", [
    step("linking", "PAGE_LINKS_READ", {"key": "zz:links", "links": LINKS[SCAN_PAGE]}, "linking", [], before={"runKey": "f1", "pageUrl": SCAN_PAGE})]))
cases.append(case("control: a download answer for another document is ignored", [
    step("downloading", "PAGE_DOWNLOADED", {"key": "z1:dl:5", "path": "/x", "url": "u", "size": 1}, "downloading", [], before={"runKey": "z1", "pageUrl": SCAN_PAGE, "pos": 0, "docs": [doc_entry(sl)]})]))
cases.append(case("control: a PDF answer for another document is ignored", [
    step("reading", "PDF_NO_TEXT", {"key": "z1:pdf:5", "pageCount": 1}, "reading", [], before={"runKey": "z1", "pageUrl": SCAN_PAGE, "pos": 0, "docs": [doc_entry(sl)]})]))
for st in ("linking", "stepping", "downloading", "reading"):
    cases.append(case(f"a second PROBE_RUN while the run is in {st} answers probe_busy and leaves it", [
        step(st, "PROBE_RUN", {"key": "b2", "pageUrl": SCAN_PAGE}, st, [failed("b2", "probe_busy")], before={"runKey": "b1", "pageUrl": SCAN_PAGE})]))
out = {"atom": "a11y/atoms/std-a11y-probe-documents.lolo", "trait": "DocumentsProbe", "spec": "spec/a11y/probe-documents.lolo",
       "note": "std-a11y-probe-documents with the page answers and the std-pdf-text answers played as events. The links are real, read through headless Chrome with the PAGE_LINKS expression (record.py); the PDF text and page counts are real pdftotext -layout output of the fixture PDFs. The download path is played. The replay runner delivers the internal DOCS_NEXT itself. Regenerate with python3 -I record.py && python3 -I gen_goldens.py.",
       "cases": cases}
(here.parent / "probe-documents.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print(len(cases), "cases")
