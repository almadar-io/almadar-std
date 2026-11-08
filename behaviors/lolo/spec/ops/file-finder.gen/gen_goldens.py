import json, os
def ev(name, expect=None, frm=None, **payload):
    s = {"event": name, "payload": payload}
    if frm: s["from"] = frm
    if expect is not None: s["expect"] = expect
    return s
FILES = "/w/src/app.lolo\n/w/src/apple/pie.ts\n/w/docs/a-p-p.md\n/w/lib/zap.lolo\n"
def listed(stdout=FILES, code=0):
    return ev("CLI_DONE", None, stage="list", exitCode=code, signal=0, stdout=stdout, stdoutBytes="", stderr="")
cases = [
 ("open-lists-the-root-with-ripgrep", [ev("FINDER_OPEN", {"emits": [{"event": "FINDER_LIST", "payload": {"stage": "list", "argv": ["--files", "--hidden", "--glob", "!.git", "/w"]}}]}, root="/w")]),
 ("listed-files-are-relative-to-the-root", [ev("FINDER_OPEN", root="/w"), ev("CLI_DONE", {"entity": {"files": ["src/app.lolo", "src/apple/pie.ts", "docs/a-p-p.md", "lib/zap.lolo"]}, "emits": [{"event": "FINDER_READY", "payload": {"root": "/w", "count": 4}}]},
   stage="list", exitCode=0, signal=0, stdout=FILES, stdoutBytes="", stderr="")]),
 ("query-ranks-basename-then-span-then-length", [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_QUERY", {"emits": [{"event": "FINDER_RESULTS", "payload": {"query": "app", "paths": ["src/app.lolo", "docs/a-p-p.md", "src/apple/pie.ts"]}}]}, query="app")]),
 ("query-is-case-insensitive-and-a-subsequence", [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_QUERY", {"emits": [{"event": "FINDER_RESULTS", "payload": {"query": "ZpL", "paths": ["lib/zap.lolo"]}}]}, query="ZpL")]),
 ("regex-characters-in-a-query-are-literal", [ev("FINDER_OPEN", root="/w"), listed("/w/a.b\n/w/axb\n"),
   ev("FINDER_QUERY", {"emits": [{"event": "FINDER_RESULTS", "payload": {"query": "a.b", "paths": ["a.b"]}}]}, query="a.b")]),
 ("empty-query-lists-files-in-path-order", [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_QUERY", {"emits": [{"event": "FINDER_RESULTS", "payload": {"query": "", "paths": ["docs/a-p-p.md", "lib/zap.lolo", "src/app.lolo", "src/apple/pie.ts"]}}]}, query="")]),
 ("results-stop-at-max-results", {"maxResults": 2}, [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_QUERY", {"emits": [{"event": "FINDER_RESULTS", "payload": {"query": "", "paths": ["docs/a-p-p.md", "lib/zap.lolo"]}}]}, query="")]),
 ("pick-answers-the-absolute-path", [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_PICK", {"emits": [{"event": "FILE_PICKED", "payload": {"path": "/w/src/app.lolo"}}]}, path="src/app.lolo")]),
 ("a-failed-listing-is-reported", [ev("FINDER_OPEN", root="/w"),
   ev("CLI_FAILED", {"emits": [{"event": "FINDER_FAILED", "payload": {"root": "/w", "error": "rg not found"}}]}, stage="list", error="rg not found", code="spawn")]),

 ("grep-runs-ripgrep-vimgrep-under-the-root", [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_GREP", {"emits": [{"event": "FINDER_LIST", "payload": {"stage": "grep", "argv": ["--vimgrep", "--smart-case", "--fixed-strings", "--", "foo bar", "/w"]}}]}, query="foo bar")]),
 ("grep-hits-are-relative-zero-based-and-keep-colons-in-text", [ev("FINDER_OPEN", root="/w"), listed(), ev("FINDER_GREP", query="x"),
   ev("CLI_DONE", {"emits": [{"event": "GREP_RESULTS", "payload": {"query": "x", "hits": [
       {"path": "src/a.lolo", "row": 2, "col": 4, "text": "  x: y"}, {"path": "lib/b.ts", "row": 0, "col": 0, "text": "x"}]}}]},
     stage="grep", exitCode=0, signal=0, stdout="/w/src/a.lolo:3:5:  x: y\n/w/lib/b.ts:1:1:x\n", stdoutBytes="", stderr="")]),
 ("grep-with-no-match-answers-no-hits", [ev("FINDER_OPEN", root="/w"), listed(), ev("FINDER_GREP", query="zz"),
   ev("CLI_DONE", {"emits": [{"event": "GREP_RESULTS", "payload": {"query": "zz", "hits": []}}]}, stage="grep", exitCode=1, signal=0, stdout="", stdoutBytes="", stderr="")]),
 ("an-empty-grep-query-answers-no-hits-without-running", [ev("FINDER_OPEN", root="/w"), listed(),
   ev("FINDER_GREP", {"emits": [{"event": "GREP_RESULTS", "payload": {"query": "", "hits": []}}], "neverEmits": ["FINDER_LIST"]}, query="")]),
]
out = {"atom": "ops/atoms/std-file-finder.lolo", "trait": "FileFinder",
       "cases": [dict({"id": c[0], "steps": c[-1]}, **({"config": c[1]} if len(c) == 3 else {})) for c in cases]}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "file-finder.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
