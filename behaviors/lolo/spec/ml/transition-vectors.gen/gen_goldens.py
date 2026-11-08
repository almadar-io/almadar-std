import json, os, base64
def ev(name, expect=None, frm=None, **payload):
    s = {"event": name, "payload": payload}
    if frm: s["from"] = frm
    if expect is not None: s["expect"] = expect
    return s
def b(text): return base64.b64encode(text.encode()).decode()
ROOTS = ["/c"]
ENTRIES = [{"key": "/c/a.lolo#p0", "path": "/c/a.lolo", "label": "A.GO", "text": "GO -> x"},
           {"key": "/c/b.lolo#p0", "path": "/c/b.lolo", "label": "B.STOP", "text": "STOP -> y"},
           {"key": "/c/b.lolo#p1", "path": "/c/b.lolo", "label": "B.GO", "text": "GO -> z"}]
SRC = {"snapshots": [], "snapshotPaths": [], "userDir": "/u", "userAnchor": "home", "providerModel": "m", "providerKind": "lmstudio", "embedModel": "m"}
VECS = [{"key": "/c/a.lolo#p0", "vector": [1, 0]}, {"key": "/c/b.lolo#p0", "vector": [0, 1]}, {"key": "/c/b.lolo#p1", "vector": [0.8, 0.6]}]
def item(ptr, trait, event, src): return {"pointer": ptr, "trait": trait, "event": event, "from": "s", "to": "s", "fromRow": 0, "fromCol": 0, "toRow": 0, "source": src}
cases = [
 ("rebuild-lists-the-roots", [ev("TV_INDEX", {"state": "listing", "emits": [{"event": "TV_LIST", "payload": {"stage": "list"}}]}, roots=ROOTS, rebuild=True)]),
 ("listing-sorts-the-files-and-reads-the-first", [ev("TV_INDEX", roots=ROOTS, rebuild=True),
   ev("CLI_DONE", {"state": "reading", "entity": {"files": ["/c/a.lolo", "/c/b.lolo", "/c/broken.lolo"], "cursor": 0}}, frm="listing", stage="list", exitCode=0, signal=0, stdout="/c/b.lolo\n/c/broken.lolo\n/c/a.lolo\n", stdoutBytes="", stderr="")]),
 ("a-read-file-is-outlined", [ev("TV_FILE_READ", {"emits": [{"event": "TV_OUTLINE", "payload": {"key": "/c/a.lolo", "path": "/c/a.lolo", "text": "aa"}}]}, frm="reading", data=b("aa"))]),
 ("outlines-accumulate-and-the-last-file-resolves", [
   ev("TRANSITIONS", {"entity": {"cursor": 1, "entries": ENTRIES[:1]}, "emits": [{"event": "TV_PROGRESS", "payload": {"done": 1, "total": 3}}]}, frm="reading", key="/c/a.lolo", path="/c/a.lolo", items=[item("p0", "A", "GO", "GO -> x")]),
   ev("TRANSITIONS", {"entity": {"cursor": 2, "entries": ENTRIES}}, frm="reading", key="/c/b.lolo", path="/c/b.lolo", items=[item("p0", "B", "STOP", "STOP -> y"), item("p1", "B", "GO", "GO -> z")]),
   ev("TRANSITIONS_FAILED", {"emits": [{"event": "TV_PROGRESS", "payload": {"done": 3, "total": 3}}, {"event": "TV_SOURCES", "payload": {"paths": []}}]}, frm="reading", key="/c/broken.lolo", path="/c/broken.lolo", error="parse"),
   ev("SOURCES_READY", {"emits": [{"event": "TV_RESOLVE", "payload": {"wanted": [{"key": e["key"], "text": e["text"]} for e in ENTRIES]}}]}, frm="sourcing", **SRC),
   ev("VECTORS_ANSWERED", {"emits": [{"event": "TV_READY", "payload": {"count": 3, "model": "m"}}]}, frm="resolving", model="m", vectors=VECS)]),
 ("nothing-listed-is-refused", [ev("TV_INDEX", roots=ROOTS, rebuild=True),
   ev("CLI_DONE", {"state": "idle", "emits": [{"event": "TV_REFUSED", "payload": {"code": "TV_NOTHING_LISTED"}}]}, frm="listing", stage="list", exitCode=1, signal=0, stdout="", stdoutBytes="", stderr="")]),
 ("a-cache-for-other-roots-rebuilds", [ev("TV_INDEX", {"state": "loading"}, roots=ROOTS, rebuild=False),
   ev("TV_CACHE_READ", {"state": "listing"}, frm="loading", data=b(json.dumps({"roots": ["/other"], "entries": ENTRIES}))),
  ]),
 ("a-cache-for-these-roots-loads", [ev("TV_INDEX", roots=ROOTS, rebuild=False),
   ev("TV_CACHE_READ", {"state": "sourcing", "entity": {"entries": ENTRIES}}, frm="loading", data=b(json.dumps({"roots": ROOTS, "entries": ENTRIES})))]),
 ("a-missing-cache-builds", [ev("TV_INDEX", roots=ROOTS, rebuild=False), ev("TV_CACHE_MISSING", {"state": "listing"}, frm="loading", error="absent")]),
 ("nearest-ranks-by-cosine-and-skips-its-own-file", [
   ev("TV_NEAREST", {"entity": {"requestId": "r1"}, "emits": [{"event": "TV_RESOLVE", "payload": {"wanted": [{"key": "ask:q", "text": "GO -> q"}]}}]}, frm="ready", requestId="r1", items=[{"key": "q", "path": "/c/a.lolo", "text": "GO -> q"}]),
   ev("VECTORS_ANSWERED", {"state": "ready", "emits": [{"event": "TV_PEERS", "payload": {"requestId": "r1", "results": [{"key": "q", "peers": [
       {"key": "/c/b.lolo#p1", "path": "/c/b.lolo", "label": "B.GO", "score": 0.8},
       {"key": "/c/b.lolo#p0", "path": "/c/b.lolo", "label": "B.STOP", "score": 0}]}]}}]}, frm="querying", model="m", vectors=[{"key": "ask:q", "vector": [1, 0]}])],
  ),
 ("a-lookup-before-ready-waits", [ev("TV_INDEX", roots=ROOTS, rebuild=True), ev("TV_NEAREST", {"state": "listing", "entity": {"nextId": "r9"}}, frm="listing", requestId="r9", items=[])]),

 ("installed-packages-are-the-roots", [ev("TV_INDEX_PACKAGES", {"entity": {"rebuildPackages": True}}, rebuild=True),
   ev("TV_PACKAGES", {"emits": [{"event": "TV_INDEX", "payload": {"roots": ["/n/std/behaviors/lolo", "/n/io/behaviors/lolo"], "rebuild": True}}]}, frm="idle",
      result=[{"root": "/n/std", "prefix": "std", "vectors": None, "vectorsRel": None, "vectorsIn": None}, {"root": "/n/io/", "prefix": "almadar-behaviors", "vectors": None, "vectorsRel": None, "vectorsIn": None}])]),
 ("unreadable-packages-are-refused", [ev("TV_INDEX_PACKAGES", rebuild=False),
   ev("TV_PACKAGES_FAILED", {"emits": [{"event": "TV_REFUSED", "payload": {"code": "TV_PACKAGES_UNREAD"}}]}, frm="idle", error="no store")]),
]
ENTITY_READY = {"entries": ENTRIES, "vectors": {v["key"]: v["vector"] for v in VECS}, "ready": True, "model": "m", **SRC, "sourced": True}
out = {"atom": "ml/atoms/std-transition-vectors.lolo", "trait": "TransitionVectors", "cases": []}
for c in cases:
    case = {"id": c[0], "steps": c[1]}
    if c[0].startswith("nearest"): case["entity"] = ENTITY_READY
    if c[0] in ("a-read-file-is-outlined", "outlines-accumulate-and-the-last-file-resolves"): case["entity"] = {"roots": ROOTS, "files": ["/c/a.lolo", "/c/b.lolo", "/c/broken.lolo"], "cursor": 0, "entries": []}
    out["cases"].append(case)
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "transition-vectors.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
