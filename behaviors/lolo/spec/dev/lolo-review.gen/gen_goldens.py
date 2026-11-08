import json, os
P = "/w/a.lolo"
TEXT = "app a\norbital O {\n  trait T -> R {\n    state s {\n      GO -> s\n        (set @entity.n 1)\n    }\n  }\n}"
ITEM = {"pointer": "orbitals[0].traits[0].stateMachine.transitions[0]", "trait": "T", "event": "GO", "from": "s", "to": "s", "fromRow": 4, "fromCol": 6, "toRow": 5, "source": "      GO -> s\n        (set @entity.n 1)"}
PTR = ITEM["pointer"]
NOW = 1794139200000 + 3600000
SHA = "a" * 40
ZERO = "0" * 40
def ev(name, expect=None, **payload):
    s = {"event": name, "payload": payload, "now": NOW}
    if expect is not None: s["expect"] = expect
    return s
BASE = {"editorId": "e", "path": P, "version": 3, "text": TEXT, "reviewing": True, "items": [ITEM], "itemsVersion": 3, "blameVersion": 3}
def blame(lines):
    out = []
    for i, sha in enumerate(lines):
        out.append(f"{sha} {i+1} {i+1} 1")
        if sha == SHA: out += ["author Ada", "author-time 1794139200", "summary add GO"]
        if sha == ZERO: out += ["author Not Committed Yet", "author-time 1794139200", "summary Version of a.lolo from a.lolo"]
        out.append("\tx")
    return "\n".join(out) + "\n"
def deco(ranges): return {"emits": [{"event": "DECORATE", "payload": {"editorId": "e", "source": "review", "ranges": ranges}}]}
REC = {"id": "recent-" + PTR, "fromRow": 4, "fromCol": 6, "toRow": 5, "toCol": 25, "tone": "review-recent", "label": "changed and not committed"}
DRIFT = {"id": "drift-" + PTR, "fromRow": 4, "fromCol": 6, "toRow": 5, "toCol": 25, "tone": "review", "label": "departs from the catalog: nearest X.GO scores 40%"}
cases = [
 ("only-lolo-files-are-reviewed", {}, [ev("BUFFER_EDITED", {"entity": {"editorId": "e"}, "neverEmits": ["DECORATE", "POPOVER"]}, editorId="e", path="/w/a.ts", version=1, text="x", dirty=False),
   ev("BUFFER_EDITED", {"entity": {"reviewing": True, "pending": True, "path": P, "indexAsked": True}, "emits": [{"event": "TV_INDEX_PACKAGES", "payload": {"rebuild": False, "prefixes": ["almadar-std"]}}]}, editorId="e", path=P, version=2, text=TEXT, dirty=False),
   ev("BUFFER_EDITED", {"neverEmits": ["TV_INDEX_PACKAGES"]}, editorId="e", path=P, version=3, text=TEXT, dirty=True)]),
 ("transitions-ask-for-peers-and-flag", dict(BASE, items=[], itemsVersion=-1, rows=[], blameVersion=-1),
   [ev("TRANSITIONS", {"emits": [{"event": "TV_NEAREST", "payload": {"requestId": "3", "items": [{"key": PTR, "path": P, "text": ITEM["source"]}]}}, {"event": "DECORATE", "payload": {"ranges": []}}]}, key="3", path=P, items=[ITEM])]),
 ("stale-transitions-are-ignored", dict(BASE, items=[], itemsVersion=-1), [ev("TRANSITIONS", {"fired": False}, key="2", path=P, items=[ITEM])]),
 ("uncommitted-lines-flag-recent", BASE, [ev("GIT_DONE", deco([REC]), requestId="blame:3", op="blame", exitCode=0, stdout=blame([SHA, SHA, SHA, SHA, SHA, ZERO, SHA, SHA, SHA]), stderr="")]),
 ("old-commits-are-not-flagged", BASE, [ev("GIT_DONE", deco([]), requestId="blame:3", op="blame", exitCode=0, stdout=blame([SHA] * 9).replace("author-time 1794139200", "author-time 1700000000"), stderr="")]),
 ("a-low-nearest-score-flags-drift", dict(BASE, rows=[]), [ev("TV_PEERS", deco([DRIFT]), requestId="3", results=[{"key": PTR, "peers": [{"key": "k", "path": "/c/x.lolo", "label": "X.GO", "score": 0.4}]}])]),
 ("a-close-peer-is-not-drift", dict(BASE, rows=[]), [ev("TV_PEERS", deco([]), requestId="3", results=[{"key": PTR, "peers": [{"key": "k", "path": "/c/x.lolo", "label": "X.GO", "score": 0.9}]}])]),
 ("k-opens-the-instant-popover-and-asks-the-model", dict(BASE, cursorRow=5, rows=[], peers={PTR: [{"key": "k", "path": "/c/x.lolo", "label": "X.GO", "score": 0.9}]}, indexNote=""),
   [ev("REVIEW_NOW", {"entity": {"open": PTR, "asking": PTR + "|3"}, "emits": [
      {"event": "POPOVER", "payload": {"editorId": "e", "popover": {"fromRow": 4, "fromCol": 6, "toRow": 5, "toCol": 25, "title": "T.GO  s -> s", "sections": [
          {"heading": "Edited", "lines": ["no history for these lines"]},
          {"heading": "Nearest in the catalog", "lines": ["X.GO  x.lolo  90%"]},
          {"heading": "Review (ternary-bonsai-2-27b)", "lines": ["asking the model..."]}], "busy": True}}},
      {"event": "LLM_GENERATE", "payload": {"key": PTR + "|3", "model": "ternary-bonsai-2-27b"}}]}, editorId="e")]),
 ("the-answer-fills-the-popover", dict(BASE, open=PTR, asking=PTR + "|3", rows=[], indexNote="idx"),
   [ev("LLM_GENERATE_RESULT", {"entity": {"asking": ""}, "emits": [{"event": "POPOVER", "payload": {"popover": {"fromRow": 4, "fromCol": 6, "toRow": 5, "toCol": 25, "title": "T.GO  s -> s", "sections": [
       {"heading": "Edited", "lines": ["no history for these lines"]}, {"heading": "Nearest in the catalog", "lines": ["idx"]},
       {"heading": "Review (ternary-bonsai-2-27b)", "lines": ["R11: matches on a label"]}], "busy": False}}}]}, content="R11: matches on a label\n")]),
 ("leaving-closes-and-cancels", dict(BASE, open=PTR, asking=PTR + "|3"),
   [ev("CURSOR_MOVED", {"entity": {"open": "", "asking": ""}, "emits": [{"event": "CLOSE_POPOVER", "payload": {"editorId": "e"}}, {"event": "LLM_CANCEL", "payload": {"key": PTR + "|3"}}]}, editorId="e", row=0, col=0, mode="NORMAL")]),
 ("a-kept-answer-is-not-asked-again", dict(BASE, cursorRow=4, rows=[], findings={PTR + "|3": "no findings"}),
   [ev("REVIEW_NOW", {"neverEmits": ["LLM_GENERATE"], "entity": {"open": PTR}}, editorId="e")]),
 ("k-off-a-transition-opens-nothing", dict(BASE, cursorRow=0), [ev("REVIEW_NOW", {"neverEmits": ["POPOVER", "LLM_GENERATE"]}, editorId="e")]),
]
out = {"atom": "dev/atoms/std-lolo-review.lolo", "trait": "LoloReview", "cases": []}
for cid, entity, steps in cases:
    c = {"id": cid, "steps": steps}
    if entity: c["entity"] = entity
    out["cases"].append(c)
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "lolo-review.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
