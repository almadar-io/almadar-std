import json, os
def ev(name, expect=None, **payload):
    s = {"event": name, "payload": payload}
    if expect is not None: s["expect"] = expect
    return s
def d(tone, row, a, b): return {"id": f"syntax-{row}-{a}", "fromRow": row, "fromCol": a, "toRow": row, "toCol": b, "tone": tone, "label": ""}
def deco(ranges): return {"emits": [{"event": "DECORATE", "payload": {"editorId": "e", "source": "syntax", "ranges": ranges}}]}
RULES = {"toy": [{"tone": "comment", "pattern": ";;.*$"}, {"tone": "string", "pattern": "\"[^\"]*\""}, {"tone": "keyword", "pattern": "\\b(when|state)\\b"}, {"tone": "number", "pattern": "\\b[0-9]+\\b"}]}
cases = [
 ("rules-claim-ranges-in-order", {"languages": RULES}, [ev("TOKENIZE", deco([d("string", 0, 0, 6), d("keyword", 0, 7, 11), d("number", 0, 12, 14)]), editorId="e", language="toy", text="\"when\" when 42")]),
 ("a-comment-swallows-what-follows", {"languages": RULES}, [ev("TOKENIZE", deco([d("keyword", 0, 0, 5), d("comment", 0, 6, 15), d("number", 1, 0, 1)]), editorId="e", language="toy", text="state ;; when 1\n7")]),
 ("an-unknown-language-paints-nothing", {"languages": RULES}, [ev("TOKENIZE", deco([]), editorId="e", language="nope", text="when 1")]),
 ("an-invalid-rule-pattern-paints-nothing", {"languages": {"bad": [{"tone": "keyword", "pattern": "(x"}]}}, [ev("TOKENIZE", deco([]), editorId="e", language="bad", text="(x")]),
 ("lolo-default-rules", [ev("TOKENIZE", deco([
     d("keyword", 0, 2, 7), d("function", 0, 8, 12), d("operator", 0, 13, 15), d("keyword", 0, 22, 26),
     d("function", 0, 28, 35), d("variable", 0, 36, 45), d("number", 0, 46, 47), d("comment", 0, 49, 56)]),
   editorId="e", language="lolo", text="  state INIT -> ready when (str/len @entity.x 1) ;; note")]),
]
out = {"atom": "../ui/core/atoms/std-syntax-tokens.lolo", "trait": "SyntaxTokens",
       "cases": [dict({"id": c[0], "steps": c[-1]}, **({"config": c[1]} if len(c) == 3 else {})) for c in cases]}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "syntax-tokens.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
