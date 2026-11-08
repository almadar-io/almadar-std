import json, os
E = "e"
def key(k, expect=None, ctrl=False):
    s = {"event": "KEY", "payload": {"editorId": E, "key": k, "ctrl": ctrl}}
    if expect is not None: s["expect"] = expect
    return s
def emits(*evs): return {"emits": [{"event": n, "payload": p} for n, p in evs]}
def st(name): return {"state": name}
def both(state, *evs): d = emits(*evs); d["state"] = state; return d
def mode(m, caret): return ("SET_MODE", {"editorId": E, "mode": m, "caret": caret})
def mot(m, n=1): return ("MOTION", {"editorId": E, "motion": m, "count": n})
def opr(o, m, n=1): return ("OPERATE", {"editorId": E, "operator": o, "motion": m, "count": n})
def ins(t): return ("INSERT_TEXT", {"editorId": E, "text": t})
def ex(name, **more): p = {"editorId": E, "name": name}; p.update(more); return ("EX_COMMAND", p)

baseline = [
 ("i-enters-insert-and-escape-steps-left", [key("i", both("INSERT", mode("INSERT", "bar"))), key("Escape", both("NORMAL", mot("left"), mode("NORMAL", "block")))]),
 ("a-moves-right-then-inserts", [key("a", both("INSERT", mot("right"), mode("INSERT", "bar")))]),
 ("o-opens-below", [key("o", emits(mot("line-end"), mot("right"), ins("\n"), mode("INSERT", "bar")))]),
 ("O-opens-above", [key("O", emits(mot("line-start"), ins("\n"), mot("up"), mode("INSERT", "bar")))]),
 ("count-then-motion", [key("3"), key("j", emits(mot("down", 3)))]),
 ("zero-alone-is-line-start", [key("0", emits(mot("line-start")))]),
 ("dw-and-d3w", [key("d", st("OPERATOR_PENDING")), key("w", both("NORMAL", opr("delete", "word-forward"))),
   key("d"), key("3"), key("w", emits(opr("delete", "word-forward", 3)))]),
 ("dd-doubles-to-line", [key("2"), key("d"), key("d", both("NORMAL", opr("delete", "line", 2)))]),
 ("cc-and-cw-enter-insert", [key("c"), key("c", both("INSERT", opr("change", "line"), mode("INSERT", "bar"))), key("Escape"),
   key("c"), key("w", both("INSERT", opr("change", "word-forward"), mode("INSERT", "bar")))]),
 ("gg-goes-to-doc-start", [key("g", st("OPERATOR_PENDING")), key("g", both("NORMAL", mot("doc-start")))]),
 ("r-replaces-one-char", [key("r"), key("z", both("NORMAL", opr("delete", "right"), ins("z"), mot("left")))]),
 ("u-and-ctrl-r", [key("u", emits(opr("undo", "right"))), key("r", emits(opr("redo", "right")), ctrl=True)]),
 ("dot-repeats-last-change", [key("d"), key("w"), key(".", emits(opr("delete", "word-forward")))]),
 ("visual-delete", [key("v", both("VISUAL", mode("VISUAL", "block"))), key("e", emits(mot("word-end"))), key("d", both("NORMAL", opr("delete", "selection"), mode("NORMAL", "block")))]),
 ("ex-command-w", [key(":", both("COMMAND", mode("COMMAND", "block"))), key("w"), key("Enter", both("NORMAL", ex("save"), mode("NORMAL", "block")))]),
 ("unknown-ex-command-returns-to-normal-silently", [key(":"), key("z"), key("Enter", {"state": "NORMAL", "neverEmits": ["EX_COMMAND"]})]),
]
EXS = {"w": "save", "q": "close-tab", "q!": "close-tab-discard", "e": "edit", "b": "buffer"}
def typed(text): return [key(ch) for ch in text]
def cl(kind, text): return ("CMDLINE_CHANGED", {"editorId": E, "kind": kind, "text": text})
added = [
 ("ex-command-carries-the-rest-of-the-line-as-args", {"exCommands": EXS, "commandLineAnyChar": True},
   [key(":")] + typed("e src/A_b.lolo") + [key("Enter", both("NORMAL", ex("edit", args="src/A_b.lolo"), mode("NORMAL", "block")))]),
 ("ex-command-without-args-has-empty-args", [key(":"), key("w"), key("Enter", emits(ex("save", args="")))]),
 ("ex-word-with-bang-still-matches", {"exCommands": EXS}, [key(":"), key("q"), key("!"), key("Enter", emits(ex("close-tab-discard", args="")))]),
 ("command-line-refuses-uncaptured-chars-by-default", {"exCommands": EXS}, [key(":")] + typed("e a/b") + [key("Enter", emits(ex("edit", args="ab")))]),
 ("command-line-announces-every-change", [key(":", emits(cl(":", ""))), key("w", emits(cl(":", "w"))), key("Backspace", emits(cl(":", ""))), key("Escape", emits(cl("", "")))]),
 ("register-prefix-selects-before-an-operator", [key('"', st("OPERATOR_PENDING")), key("a", both("NORMAL", ("SELECT_REGISTER", {"editorId": E, "name": "a"}))),
   key("y"), key("y", emits(opr("yank", "line")))]),
 ("register-prefix-escape-cancels", [key('"'), key("Escape", {"state": "NORMAL", "neverEmits": ["SELECT_REGISTER"]})]),
 ("mark-set-even-on-a-motion-letter", [key("m"), key("j", both("NORMAL", ("MARK_SET", {"editorId": E, "name": "j"}))), key("j", emits(mot("down")))]),
 ("mark-jumps-linewise-and-exact", [key("'"), key("a", emits(("MARK_JUMP", {"editorId": E, "name": "a", "exact": False}))),
   key("`"), key("a", emits(("MARK_JUMP", {"editorId": E, "name": "a", "exact": True})))]),
 ("operator-to-a-mark", [key("d"), key("'"), key("a", both("NORMAL", ("OPERATE", {"editorId": E, "operator": "delete", "motion": "mark-line", "count": 1, "mark": "a"}))),
   key("y"), key("`"), key("b", emits(("OPERATE", {"editorId": E, "operator": "yank", "motion": "mark-exact", "count": 1, "mark": "b"})))]),
 ("macro-record-stop-and-play", [key("q"), key("a", emits(("MACRO_RECORD", {"editorId": E, "register": "a"}))), key("j", emits(mot("down"))),
   key("q", emits(("MACRO_STOP", {"editorId": E}))), key("2"), key("@"), key("a", emits(("MACRO_PLAY", {"editorId": E, "register": "a", "count": 2}))),
   key("@"), key("@", emits(("MACRO_PLAY", {"editorId": E, "register": "a", "count": 1})))]),
 ("search-forward-backward-and-next", {"commandLineAnyChar": True}, [key("/", both("COMMAND", mode("COMMAND", "block"), cl("/", ""))), key("f"), key("o"), key("o"),
   key("Enter", both("NORMAL", ("SEARCH", {"editorId": E, "pattern": "foo", "forward": True}), mode("NORMAL", "block"))),
   key("?"), key("x"), key("Enter", emits(("SEARCH", {"editorId": E, "pattern": "x", "forward": False}))),
   key("n", emits(("SEARCH_NEXT", {"editorId": E, "reverse": False}))), key("N", emits(("SEARCH_NEXT", {"editorId": E, "reverse": True})))]),
 ("empty-search-does-nothing", [key("/"), key("Enter", {"state": "NORMAL", "neverEmits": ["SEARCH"]})]),
 ("ctrl-w-window-commands-and-plain-w-still-moves", [key("w", st("OPERATOR_PENDING"), ctrl=True), key("v", both("NORMAL", ex("window-vsplit", args=""))),
   key("w", ctrl=True), key("l", emits(ex("window-right", args=""))), key("w", emits(mot("word-forward")))]),
 ("leader-sequences", {"leaderMaps": {"ff": "find-files", "fg": "live-grep"}}, [key(" ", st("OPERATOR_PENDING")), key("f", st("OPERATOR_PENDING")),
   key("f", both("NORMAL", ex("find-files", args=""))), key(" "), key("f"), key("g", emits(ex("live-grep", args=""))),
   key(" "), key("x", {"state": "NORMAL", "neverEmits": ["EX_COMMAND"]})]),
 ("leader-is-off-without-maps", [key(" ", {"state": "NORMAL", "neverEmits": ["EX_COMMAND"]})]),
 ("single-key-commands", {"normalCommands": {"K": "hover"}}, [key("K", both("NORMAL", ex("hover", args="")))]),
 ("visual-line-and-switching-kinds", [key("V", both("VISUAL", mode("VISUAL_LINE", "block"))), key("v", emits(mode("VISUAL", "block"))),
   key("V", emits(mode("VISUAL_LINE", "block"))), {"event": "EDITOR_FOCUS", "payload": {"editorId": E}, "expect": emits(mode("VISUAL_LINE", "block"))}, key("d", both("NORMAL", opr("delete", "selection"), mode("NORMAL", "block")))]),
]
added += [
 ("insert-types-printable-keys-enter-tab-and-backspace", [key("i"), key("x", both("INSERT", ("TYPE", {"editorId": E, "text": "x"}))),
   key("Enter", emits(("TYPE", {"editorId": E, "text": "\n"}))), key("Tab", emits(("TYPE", {"editorId": E, "text": "\t"}))),
   key("Backspace", emits(("BACKSPACE", {"editorId": E}))), key("ArrowLeft", emits(mot("left")))]),
 ("insert-ignores-ctrl-chords", [key("i"), key("s", {"state": "INSERT", "neverEmits": ["TYPE"]}, ctrl=True)]),
 ("arrows-move-in-normal", [key("ArrowDown", emits(mot("down"))), key("ArrowRight", emits(mot("right")))]),
]
added += [
 ("unknown-commands-pass-through-when-asked", {"exCommands": EXS, "commandLineAnyChar": True, "passUnknown": True}, [key(":")] + typed("Fmt all") + [key("Enter", emits(ex("Fmt", args="all")))]),
]
cases = baseline + added
out = {"atom": "../ui/core/atoms/std-modal-editor.lolo", "trait": "Modes",
       "cases": [dict({"id": c[0], "steps": c[-1]}, **({"config": c[1]} if len(c) == 3 else {})) for c in cases]}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "modal-editor.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
def mk(k, ctrl=False): return {"key": k, "code": "", "ctrl": ctrl, "alt": False, "shift": False, "meta": False}
def mev(name, expect=None, **payload):
    q = {"editorId": E}; q.update(payload)
    st_ = {"event": name, "payload": q}
    if expect is not None: st_["expect"] = expect
    return st_
macro_cases = [
 ("records-keys-and-drops-the-stop-key", [mev("MACRO_RECORD", register="a"), key("j"), key("x"), key("q"),
   mev("MACRO_STOP", {"entity": {"recording": "", "macros": {"a": [mk("j"), mk("x")]}}}, key="q")]),
 ("keys-outside-a-recording-are-not-kept", [key("j", {"fired": False})]),
 ("stop-keeps-a-last-key-that-is-not-the-stop-key", [mev("MACRO_RECORD", register="a"), key("j"),
   mev("MACRO_STOP", {"entity": {"macros": {"a": [mk("j")]}}}, key="q")]),
 ("re-recording-replaces-the-register", [mev("MACRO_RECORD", register="a"), key("j"), mev("MACRO_STOP", key="q"),
   mev("MACRO_RECORD", register="a"), key("k"), mev("MACRO_STOP", {"entity": {"macros": {"a": [mk("k")]}}}, key="q")]),
 ("play-queues-count-copies", [mev("MACRO_RECORD", register="a"), key("j"), key("x"), mev("MACRO_STOP", key="q"),
   mev("MACRO_PLAY", {"entity": {"queue": [mk("j"), mk("x"), mk("j"), mk("x")]}}, register="a", count=2)]),
 ("play-of-an-empty-register-queues-nothing", [mev("MACRO_PLAY", {"fired": False}, register="z", count=1)]),
]
mout = {"atom": "../ui/core/atoms/std-modal-editor.lolo", "trait": "Macros",
        "cases": [{"id": c[0], "steps": c[-1]} for c in macro_cases]}
with open(os.path.join(here, "..", "modal-editor-macros.replay.goldens.json"), "w") as f:
    json.dump(mout, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
