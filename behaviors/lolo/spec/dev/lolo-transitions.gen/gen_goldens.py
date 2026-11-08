import json, os
P = "/w/a.lolo"
def ev(name, expect=None, frm=None, **payload):
    s = {"event": name, "payload": payload}
    if frm: s["from"] = frm
    if expect is not None: s["expect"] = expect
    return s
prog = {"orbitals": [{"name": "O", "traits": [{"name": "T", "stateMachine": {"states": [{"name": "idle"}], "transitions": [
    {"from": "idle", "to": "idle", "event": "INIT"},
    {"from": "idle", "to": "busy", "event": "GO", "guard": [">", "@entity.n", 0], "effects": [["set", "@entity.n", 1]]}]}}]}]}
def anchor(ptr, line, col, end, scope, path=P, exact=True):
    return {"path": path, "line": line, "column": col, "endLine": end, "endColumn": 9, "exact": exact, "pointer": ptr, "scopeEndLine": scope}
T = "orbitals[0].traits[0].stateMachine.transitions"
result = {"program": prog, "sourceMap": [
    anchor("orbitals[0].traits[0]", 3, 3, 3, 12),
    anchor(T + "[0]", 6, 7, 6, 6),
    anchor(T + "[1]", 7, 7, 7, 9),
    anchor(T + "[1].effects[0]", 8, 9, 8, 8),
    anchor(T + "[0]", 2, 1, 2, 2, path="/w/imported.lolo")]}
cases = [
 ("asks-for-the-inspected-program", [ev("TRANSITIONS_OF", {"state": "reading", "entity": {"key": "k1", "path": P}}, key="k1", path=P, text="app x")]),
 ("answers-each-transition-of-this-file-with-rows", [ev("TRANSITIONS_OF", key="k1", path=P, text="a\nb\nc\nd\ne\nf\ng\nh\ni\nj"),
   ev("LT_INSPECTED", {"emits": [{"event": "TRANSITIONS", "payload": {"key": "k1", "path": P, "items": [
       {"pointer": T + "[0]", "trait": "T", "event": "INIT", "from": "idle", "to": "idle", "fromRow": 5, "fromCol": 6, "toRow": 5,
        "source": "f"},
       {"pointer": T + "[1]", "trait": "T", "event": "GO", "from": "idle", "to": "busy", "fromRow": 6, "fromCol": 6, "toRow": 8,
        "source": "g\nh\ni"}]}}]}, frm="reading", result=result)]),
 ("a-read-failure-is-answered", [ev("TRANSITIONS_OF", key="k1", path=P, text="app ("),
   ev("LT_FAILED", {"state": "idle", "emits": [{"event": "TRANSITIONS_FAILED", "payload": {"key": "k1", "path": P, "error": "parse error"}}]}, frm="reading", error="parse error")]),
 ("a-request-while-reading-runs-next", [ev("TRANSITIONS_OF", key="k1", path=P, text="app x"),
   ev("TRANSITIONS_OF", {"state": "reading", "entity": {"nextKey": "k2"}}, frm="reading", key="k2", path=P, text="app y"),
   ev("LT_INSPECTED", {"state": "reading", "entity": {"key": "k2", "nextKey": ""}}, frm="reading", result=result)]),
]
out = {"atom": "dev/atoms/std-lolo-transitions.lolo", "trait": "LoloTransitions",
       "cases": [dict({"id": c[0], "steps": c[-1]}, **({"config": c[1]} if len(c) == 3 else {})) for c in cases]}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "lolo-transitions.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
