import json, pathlib
here = pathlib.Path(__file__).resolve().parent
rec = {k: json.loads(v) for k, v in json.loads((here / "recorded.json").read_text()).items()}
URL = "http://127.0.0.1:24700/"
LANGS = ["sl", "en", "de", "hr", "it", "hu"]
def ent(lang="", declared=""): return {"runKey": "k1", "pageUrl": URL, "lang": lang, "declared": declared}
def read(page, key="k1:text", lang=None, text=None):
    r = rec[page]
    return {"key": key, "url": URL, "title": page, "lang": r["lang"] if lang is None else lang, "text": r["text"] if text is None else text}
def finding(rule, conf, snippet): return {"id": f"{rule}:{URL}", "pageUrl": URL, "rule": rule, "wcag": [{"criterion": "3.1.1", "level": "A", "version": "2.0"}], "method": "probe", "engines": ["probe"], "impact": "serious", "confidence": conf, "selector": "html", "snippet": snippet, "evidence": "", "count": 1}
def done(findings): return [{"event": "PROBE_DONE", "payload": {"key": "k1", "probe": "language", "findings": findings}}]
def failed(code, error=None):
    p = {"key": "k1", "probe": "language", "code": code}
    if error: p["error"] = error
    return [{"event": "PROBE_FAILED", "payload": p}]
def case(id, *steps, config=None):
    c = {"id": id, "steps": list(steps)}
    if config: c["config"] = config
    return c
def step(frm, event, payload, state, emits=None, entity=None):
    s = {"from": frm, "event": event, "payload": payload, "expect": {"state": state}}
    if entity is not None: s["entity"] = entity
    if emits is not None: s["expect"]["emits"] = emits
    return s
def go(page): return step("classifying", "LANGUAGE_CLASSIFY_GO", {"text": rec[page]["text"]}, "classifying", [{"event": "LLM_CLASSIFY", "payload": {"text": rec[page]["text"], "categories": LANGS, "key": "k1:classify"}}], ent(rec[page]["lang"], rec[page]["lang"]))
def classify_case(page, answer, findings, id):
    r = rec[page]
    return case(id,
        step("reading", "PAGE_TEXT_READ", read(page), "classifying", [{"event": "LANGUAGE_CLASSIFY_GO", "payload": {"text": r["text"]}}], ent()),
        go(page),
        step("classifying", "LLM_CLASSIFY_RESULT", {"category": answer, "confidence": 0.97, "reasoning": "classifier answer played by the golden"}, "idle", done(findings), ent(r["lang"], r["lang"])))
cases = [
 case("PROBE_RUN asks the page for its text under the run key", step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": URL}, "reading", [{"event": "PAGE_TEXT", "payload": {"key": "k1:text"}}])),
 case("lang-missing-fail: an empty lang is the confirmed lang-missing finding and nothing is classified",
  step("reading", "PAGE_TEXT_READ", read("lang-missing-fail.html"), "idle", done([finding("lang-missing", "confirmed", "<html>")]), ent())),
]
page = "lang-mismatch-fail.html"
cases.append(classify_case(page, "sl", [finding("lang-wrong", "needs-verification", '<html lang="en"> text classified as sl')], "lang-mismatch-fail: lang en over Slovenian text is lang-wrong, needs verification, and the whole text goes to the classifier"))
cases.append(classify_case("lang-mismatch-pass.html", "sl", [], "control: lang-mismatch-pass, lang sl over Slovenian text, has no finding"))
cases.append(classify_case("lang-missing-pass.html", "sl", [], "control: lang-missing-pass declares sl and is classified, no finding"))
cases.append(case("control: a regional subtag compares by its primary subtag (sl-SI against sl)",
  step("reading", "PAGE_TEXT_READ", read("lang-mismatch-pass.html", lang="sl-SI"), "classifying", [{"event": "LANGUAGE_CLASSIFY_GO", "payload": {"text": rec["lang-mismatch-pass.html"]["text"]}}], ent()),
  step("classifying", "LLM_CLASSIFY_RESULT", {"category": "sl", "confidence": 0.9, "reasoning": "r"}, "idle", done([]), ent("sl-SI", "sl"))))
cases.append(case("a declared language outside the languages knob is added to the categories so it can be chosen",
  step("classifying", "LANGUAGE_CLASSIFY_GO", {"text": "Bonjour"}, "classifying", [{"event": "LLM_CLASSIFY", "payload": {"text": "Bonjour", "categories": LANGS + ["fr"], "key": "k1:classify"}}], ent("fr", "fr"))))
cases.append(case("a declared language that the classifier does not recognise in the text is lang-wrong with the classified language in the snippet",
  step("classifying", "LLM_CLASSIFY_RESULT", {"category": "de", "confidence": 0.8, "reasoning": "r"}, "idle", done([finding("lang-wrong", "needs-verification", '<html lang="sl-SI"> text classified as de')]), ent("sl-SI", "sl"))))
cases.append(case("text over maxClassifyChars is refused, never cut", step("reading", "PAGE_TEXT_READ", read("lang-mismatch-fail.html"), "idle", failed("text_too_long"), ent()), config={"maxClassifyChars": 20}))
cases.append(case("control: text of exactly maxClassifyChars is classified", step("reading", "PAGE_TEXT_READ", read("lang-mismatch-fail.html", text="x" * 20), "classifying", None, ent()), config={"maxClassifyChars": 20}))
cases.append(case("control: a lang-missing page over the limit is still lang-missing, the text size does not matter",
  step("reading", "PAGE_TEXT_READ", read("lang-missing-fail.html"), "idle", done([finding("lang-missing", "confirmed", "<html>")]), ent()), config={"maxClassifyChars": 20}))
cases.append(case("a page with a lang and no visible text has nothing to classify and no finding",
  step("reading", "PAGE_TEXT_READ", read("lang-mismatch-pass.html", text="  "), "idle", done([]), ent())))
cases.append(case("a page failure answers PROBE_FAILED with the page's code",
  step("reading", "PAGE_FAILED", {"key": "k1:text", "error": "gone", "code": "page_gone"}, "idle", failed("page_gone", "gone"), ent())))
cases.append(case("a classifier failure answers PROBE_FAILED with its code",
  step("classifying", "LLM_FAILED", {"code": "SERVICE_ERROR", "message": "model down", "key": "k1:classify"}, "idle", failed("SERVICE_ERROR", "model down"), ent("en", "en"))))
cases.append(case("control: a classifier failure without a code answers llm_failed",
  step("classifying", "LLM_FAILED", {"message": "model down", "key": "k1:classify"}, "idle", failed("llm_failed", "model down"), ent("en", "en"))))
cases.append(case("control: a classifier failure under another run's key is ignored",
  step("classifying", "LLM_FAILED", {"message": "model down", "key": "k2:classify"}, "classifying", [], ent("en", "en"))))
cases.append(case("control: a text answer under another run's key is ignored",
  step("reading", "PAGE_TEXT_READ", read("lang-missing-fail.html", key="k2:text"), "reading", [], ent())))
cases.append(case("a second PROBE_RUN while one is in flight answers probe_busy",
  step("classifying", "PROBE_RUN", {"key": "k2", "pageUrl": URL}, "classifying", [{"event": "PROBE_FAILED", "payload": {"key": "k2", "probe": "language", "code": "probe_busy"}}], ent("en", "en"))))
out = {"atom": "a11y/atoms/std-a11y-probe-language.lolo", "trait": "LanguageProbe",
 "note": "std-a11y-probe-language with the page and classifier answers played as events. The lang and text of the fixture cases are real, read through headless Chrome (record.py, read-text.js). The classifier answers are played by the golden, no model ran. Regenerate with python3 -I probe-language.gen/gen_goldens.py.",
 "cases": cases}
(here.parent / "probe-language.replay.goldens.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
