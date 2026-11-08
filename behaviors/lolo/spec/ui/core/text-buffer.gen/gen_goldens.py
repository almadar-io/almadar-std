import json, os
E = "e"
def load(text): return ev("LOAD_TEXT", path="f.lolo", text=text)
def ev(evname, expect=None, **payload):
    p = {"editorId": E}; p.update(payload)
    s = {"event": evname, "payload": p}
    if expect is not None: s["expect"] = expect
    return s
def mo(m, n=1, expect=None): return ev("MOTION", expect, motion=m, count=n)
def op(o, m="right", n=1, expect=None): return ev("OPERATE", expect, operator=o, motion=m, count=n)
def mode(m, expect=None): return ev("SET_MODE", expect, mode=m, caret="bar" if m == "INSERT" else "block", keys=[])
def at(row, col, lines=None, **more):
    e = {"row": row, "col": col}
    if lines is not None: e["lines"] = lines
    e.update(more)
    return {"entity": e}
def lines(ls, **more): e = {"lines": ls}; e.update(more); return {"entity": e}

cases = [
 ("hjkl-clamp-to-line-and-buffer", [load("abc\nde\nfghij"),
   mo("right", 2, at(0, 2)), mo("down", 1, at(1, 2)), mo("down", 1, at(2, 2)), mo("up", 5, at(0, 2)), mo("left", 5, at(0, 0)), mo("right", 9, at(0, 3))]),
 ("vertical-motion-keeps-goal-column-across-a-short-line", [load("abcdef\nx\nabcdef"),
   mo("right", 4), mo("down", 1, at(1, 1)), mo("down", 1, at(2, 4))]),
 ("word-forward-splits-punctuation-and-crosses-lines", [load("foo.bar  baz\nqux"),
   mo("word-forward", 1, at(0, 3)), mo("word-forward", 1, at(0, 4)), mo("word-forward", 1, at(0, 9)), mo("word-forward", 1, at(1, 0)), mo("word-forward", 1, at(1, 3))]),
 ("word-forward-count", [load("foo.bar  baz"), mo("word-forward", 2, at(0, 4))]),
 ("word-back-crosses-lines", [load("foo.bar  baz\nqux"), mo("down", 1),
   mo("word-back", 1, at(0, 9)), mo("word-back", 1, at(0, 4)), mo("word-back", 1, at(0, 3)), mo("word-back", 1, at(0, 0)), mo("word-back", 1, at(0, 0))]),
 ("word-end-skips-blank-lines", [load("foo bar\n\n  baz"),
   mo("word-end", 1, at(0, 2)), mo("word-end", 1, at(0, 6)), mo("word-end", 1, at(2, 4))]),
 ("line-end-start-first-nonblank", [load("  hello"),
   mo("line-end", 1, at(0, 6)), mo("line-start", 1, at(0, 0)), mo("first-nonblank", 1, at(0, 2))]),
 ("doc-end-and-start", [load("a\nbc"), mo("doc-end", 1, at(1, 2)), mo("doc-start", 1, at(0, 0))]),
 ("paragraph-forward-and-back", [load("a\nb\n\nc\n\nd"),
   mo("paragraph-forward", 1, at(2, 0)), mo("paragraph-forward", 1, at(4, 0)), mo("paragraph-forward", 1, at(5, 1)),
   mo("paragraph-back", 1, at(4, 0)), mo("paragraph-back", 1, at(2, 0)), mo("paragraph-back", 1, at(0, 0))]),
 ("match-bracket-scans-to-first-bracket-and-back", [load("f(a[b]{c})"),
   mo("match-bracket", 1, at(0, 9)), mo("match-bracket", 1, at(0, 1)), mo("right", 2), mo("match-bracket", 1, at(0, 5))]),
 ("match-bracket-across-lines", [load("{\n  x\n}"), mo("match-bracket", 1, at(2, 0)), mo("match-bracket", 1, at(0, 0))]),
 ("match-bracket-no-bracket-stays", [load("abc"), mo("match-bracket", 1, at(0, 0))]),
 ("other-editor-is-ignored", [load("abc"), ev("MOTION", at(0, 0), motion="right", count=1, editorId="other")]),
 ("dw-deletes-word-and-trailing-space", [load("foo bar baz"),
   op("delete", "word-forward", 1, {"entity": {"lines": ["bar baz"], "row": 0, "col": 0, "registers": {"\"": {"text": "foo ", "linewise": False}, "1": {"text": "foo ", "linewise": False}}}})]),
 ("dw-on-last-word-stops-at-line-end", [load("foo\nbar"), op("delete", "word-forward", 1, lines(["", "bar"]))]),
 ("de-is-inclusive", [load("foo bar"), op("delete", "word-end", 1, lines([" bar"]))]),
 ("d-dollar-from-mid-line", [load("abc"), mo("right", 1), op("delete", "line-end", 1, at(0, 1, ["a"]))]),
 ("dj-is-linewise", [load("a\nb\nc"), op("delete", "down", 1, at(0, 0, ["c"]))]),
 ("dd-count-then-put-linewise", [load("a\nb\nc"),
   op("delete", "line", 2, {"entity": {"lines": ["c"], "registers": {"\"": {"text": "a\nb", "linewise": True}, "1": {"text": "a\nb", "linewise": True}}}}),
   op("put", "right", 1, at(1, 0, ["c", "a", "b"])),
   op("put-before", "right", 1, at(1, 0, ["c", "a", "b", "a", "b"]))]),
 ("dd-last-line-leaves-one-empty-line", [load("a"), op("delete", "line", 1, at(0, 0, [""]))]),
 ("cw-keeps-the-space-and-one-undo-reverts-the-change", [load("foo bar"),
   op("change", "word-forward", 1, at(0, 0, [" bar"])), mode("INSERT"), ev("TYPE", at(0, 1, ["x bar"]), text="x"),
   mo("left"), mode("NORMAL"), op("undo", "right", 1, lines(["foo bar"]))]),
 ("x-twice-is-two-undo-steps-and-redo-replays", [load("abc"),
   op("delete"), op("delete", expect=lines(["c"])), op("undo", expect=lines(["bc"])), op("undo", expect=lines(["abc"])),
   op("redo", expect=lines(["bc"])), op("redo", expect=lines(["c"])), op("redo", expect=lines(["c"]))]),
 ("undo-count-and-redo-order", [load("abcd"), op("delete"), op("delete"), op("delete", expect=lines(["d"])),
   op("undo", "right", 2, lines(["bcd"])), op("redo", "right", 1, lines(["cd"])), op("redo", "right", 1, lines(["d"]))]),
 ("r-replace-is-one-undo-step", [load("abc"),
   op("delete"), ev("INSERT_TEXT", text="Z"), mo("left", 1, at(0, 0, ["Zbc"])), op("undo", expect=lines(["abc"]))]),
 ("o-opens-a-line-and-one-undo-removes-it-with-its-text", [load("a"),
   mo("line-end"), mo("right"), ev("INSERT_TEXT", text="\n"), mode("INSERT"), ev("TYPE", text="b"), mo("left"), mode("NORMAL", at(1, 0, ["a", "b"])),
   op("undo", expect=lines(["a"]))]),
 ("an-insert-session-that-changes-nothing-leaves-no-step", [load("a"), mode("INSERT"), mode("NORMAL", {"entity": {"past": []}})]),
 ("yank-then-put-charwise", [load("abc"),
   op("yank", "right", 2, {"entity": {"lines": ["abc"], "col": 0, "registers": {"\"": {"text": "ab", "linewise": False}, "0": {"text": "ab", "linewise": False}}}}),
   op("put", expect=at(0, 2, ["aabbc"]))]),
 ("put-with-empty-register-does-nothing", [load("abc"), op("put", expect=at(0, 0, ["abc"], past=[]))]),
 ("named-register-and-uppercase-append", [load("l1\nl2"),
   ev("SELECT_REGISTER", name="a"), op("yank", "line", 1), mo("down"), ev("SELECT_REGISTER", name="A"),
   op("yank", "line", 1, {"entity": {"registers": {"\"": {"text": "l1\nl2", "linewise": True}, "0": {"text": "l2", "linewise": True}, "a": {"text": "l1\nl2", "linewise": True}}, "activeRegister": "\""}})]),
 ("black-hole-register-keeps-the-unnamed-one", [load("a\nb"),
   op("yank", "line", 1), ev("SELECT_REGISTER", name="_"), op("delete", "line", 1, {"entity": {"lines": ["b"], "registers": {"\"": {"text": "a", "linewise": True}, "0": {"text": "a", "linewise": True}}, "activeRegister": "\""}})]),
 ("visual-delete-is-inclusive", [load("hello world"), mode("VISUAL"), mo("word-end"), op("delete", "selection", 1, at(0, 0, [" world"]))]),
 ("toggle-case", [load("abC"), op("toggle-case", "right", 3, lines(["ABc"]))]),
 ("indent-and-dedent", [load("a\n\tb"), op("indent", "line", 1, at(0, 2, ["  a", "\tb"])), op("dedent", "line", 1, lines(["a", "\tb"])),
   mo("down"), op("dedent", "line", 1, lines(["a", "b"]))]),
 ("join-trims-leading-blanks", [load("a\n   b\nc"), op("join", "line", 2, at(0, 1, ["a b", "c"])), op("join", "line", 2, lines(["a b c"])),
   op("join", "line", 2, lines(["a b c"]))]),
 ("type-newline-splits-and-backspace-joins", [load("ab"), mo("right"), mode("INSERT"),
   ev("TYPE", at(1, 1, ["ax", "yb"]), text="x\ny"), ev("BACKSPACE", at(1, 0, ["ax", "b"])), ev("BACKSPACE", at(0, 2, ["axb"])),
   mo("doc-start"), ev("BACKSPACE", at(0, 0, ["axb"]))]),
 ("search-forward-wraps-and-reverses", [load("foo\nbar foo\nbaz"),
   ev("SEARCH", {"entity": {"row": 1, "col": 4}, "emits": [{"event": "SEARCH_RESULT", "payload": {"found": True, "row": 1, "col": 4, "wrapped": False}}]}, pattern="foo", forward=True),
   ev("SEARCH_NEXT", {"emits": [{"event": "SEARCH_RESULT", "payload": {"found": True, "row": 0, "col": 0, "wrapped": True}}]}, reverse=False),
   ev("SEARCH_NEXT", {"emits": [{"event": "SEARCH_RESULT", "payload": {"found": True, "row": 1, "col": 4, "wrapped": True}}]}, reverse=True),
   ev("SEARCH", {"entity": {"row": 1, "col": 4}, "emits": [{"event": "SEARCH_RESULT", "payload": {"found": False}}]}, pattern="zzz", forward=True)]),
 ("marks-exact-and-linewise", [load("abc\n  def"), mo("down"), mo("right", 3), ev("MARK_SET", name="a"), mo("doc-start"),
   ev("MARK_JUMP", at(1, 3), name="a", exact=True), mo("doc-start"), ev("MARK_JUMP", at(1, 2), name="a", exact=False),
   ev("MARK_JUMP", at(1, 2), name="b", exact=True)]),
 ("decorations-by-source", [load("abc"),
   ev("DECORATE", {"entity": {"decorations": {"syntax": [{"id": "k1", "fromRow": 0, "fromCol": 0, "toRow": 0, "toCol": 3, "tone": "keyword"}]}}}, source="syntax",
      ranges=[{"id": "k1", "fromRow": 0, "fromCol": 0, "toRow": 0, "toCol": 3, "tone": "keyword"}]),
   ev("CLEAR_DECORATIONS", {"entity": {"decorations": {}}}, source="syntax")]),
 ("load-reports-clean-and-edits-report-dirty", [
   ev("LOAD_TEXT", {"emits": [{"event": "BUFFER_EDITED", "payload": {"text": "ab", "dirty": False, "version": 0}}]}, path="f.lolo", text="ab"),
   op("delete", expect={"emits": [{"event": "BUFFER_EDITED", "payload": {"text": "b", "dirty": True, "version": 1}}]}),
   ev("SAVED", {"emits": [{"event": "BUFFER_EDITED", "payload": {"dirty": False}}]}, version=1)]),

 ("undo-levels-caps-the-oldest-steps", {"undoLevels": 2}, [load("abcd"), op("delete"), op("delete"), op("delete", expect={"entity": {"lines": ["d"], "past": [{"lines": ["bcd"], "row": 0, "col": 0}, {"lines": ["cd"], "row": 0, "col": 0}]}}),
   op("undo", expect=lines(["cd"])), op("undo", expect=lines(["bcd"])), op("undo", expect=lines(["bcd"]))]),
 ("undo-levels-default-keeps-every-step", [load("abcd"), op("delete"), op("delete"), op("delete"), op("undo", "right", 3, lines(["abcd"]))]),
 ("snapshot-and-restore-carry-history-and-marks", [load("abc"), op("delete"), ev("MARK_SET", name="a"),
   ev("SNAPSHOT", {"emits": [{"event": "BUFFER_STATE", "payload": {"editorId": E, "state": {"path": "f.lolo", "lines": ["bc"], "row": 0, "col": 0, "goalCol": 0, "version": 1, "savedVersion": 0, "past": [{"lines": ["abc"], "row": 0, "col": 0}], "future": [], "marks": {"a": {"row": 0, "col": 0}}, "lastSearch": "", "lastForward": True}}}]}),
   ev("LOAD_TEXT", lines(["other"]), path="g.lolo", text="other"),
   ev("RESTORE", {"entity": {"path": "f.lolo", "lines": ["bc"], "version": 1}, "emits": [{"event": "BUFFER_EDITED", "payload": {"path": "f.lolo", "text": "bc", "dirty": True}}]},
      state={"path": "f.lolo", "lines": ["bc"], "row": 0, "col": 0, "goalCol": 0, "version": 1, "savedVersion": 0,
             "past": [{"lines": ["abc"], "row": 0, "col": 0}], "future": [], "marks": {"a": {"row": 0, "col": 0}}, "lastSearch": "", "lastForward": True}),
   op("undo", expect=lines(["abc"])), ev("MARK_JUMP", at(0, 0), name="a", exact=True)]),
 ("delete-to-mark-line-is-linewise", [load("a\nb\nc\nd"), ev("MARK_SET", name="a"), mo("down", 2),
   ev("OPERATE", at(0, 0, ["d"]), operator="delete", motion="mark-line", count=1, mark="a")]),
 ("delete-to-mark-exact-is-charwise-exclusive", [load("abcdef"), mo("right"), ev("MARK_SET", name="a"), mo("right", 3),
   ev("OPERATE", at(0, 1, ["aef"]), operator="delete", motion="mark-exact", count=1, mark="a")]),
 ("operator-to-a-missing-mark-does-nothing", [load("abc"), ev("OPERATE", {"entity": {"lines": ["abc"], "past": [], "pendingOperator": ""}}, operator="delete", motion="mark-line", count=1, mark="z")]),
 ("visual-line-delete-is-linewise", [load("a\nb\nc"), mode("VISUAL_LINE"), mo("down"),
   op("delete", "selection", 1, {"entity": {"lines": ["c"], "registers": {"\"": {"text": "a\nb", "linewise": True}, "1": {"text": "a\nb", "linewise": True}}}})]),
 ("switching-visual-kinds-keeps-the-anchor", [load("a\nb\nc"), mode("VISUAL"), mo("down"), mode("VISUAL_LINE", {"entity": {"anchorRow": 0, "anchorCol": 0, "mode": "VISUAL_LINE"}})]),
 ("search-highlights-every-match-and-follow-edits", [load("foo x foo\nfoo"),
   ev("SEARCH", {"entity": {"decorations": {"search": [
      {"id": "search-0-0", "fromRow": 0, "fromCol": 0, "toRow": 0, "toCol": 3, "tone": "search", "label": ""},
      {"id": "search-0-6", "fromRow": 0, "fromCol": 6, "toRow": 0, "toCol": 9, "tone": "search", "label": ""},
      {"id": "search-1-0", "fromRow": 1, "fromCol": 0, "toRow": 1, "toCol": 3, "tone": "search", "label": ""}]}}}, pattern="foo", forward=True),
   mo("doc-start"), op("delete", expect={"entity": {"decorations": {"search": [
      {"id": "search-0-5", "fromRow": 0, "fromCol": 5, "toRow": 0, "toCol": 8, "tone": "search", "label": ""},
      {"id": "search-1-0", "fromRow": 1, "fromCol": 0, "toRow": 1, "toCol": 3, "tone": "search", "label": ""}]}}}),
   ev("CLEAR_DECORATIONS", {"entity": {"decorations": {}}}, source="search"),
   op("delete", expect={"entity": {"decorations": {}}})]),

 ("regex-search-forward-and-backward", [load("cat cot\ncut"),
   ev("SEARCH", {"entity": {"row": 0, "col": 4}}, pattern="c[aeiou]t", forward=True),
   ev("SEARCH_NEXT", {"entity": {"row": 1, "col": 0}}, reverse=False),
   ev("SEARCH_NEXT", {"entity": {"row": 0, "col": 4}}, reverse=True),
   ev("SEARCH_NEXT", {"entity": {"row": 0, "col": 0}}, reverse=True)]),
 ("regex-highlights-use-match-lengths", [load("a1 b22 c333"),
   ev("SEARCH", {"entity": {"decorations": {"search": [
      {"id": "search-0-4", "fromRow": 0, "fromCol": 4, "toRow": 0, "toCol": 6, "tone": "search", "label": ""},
      {"id": "search-0-8", "fromRow": 0, "fromCol": 8, "toRow": 0, "toCol": 11, "tone": "search", "label": ""}]}}}, pattern="[0-9]{2,}", forward=True)]),
 ("invalid-pattern-finds-nothing", [load("abc"), ev("SEARCH", {"entity": {"row": 0, "col": 0}, "emits": [{"event": "SEARCH_RESULT", "payload": {"found": False}}]}, pattern="(x", forward=True)]),

 ("cursor-set-clamps-into-the-buffer", [load("abc\nde"), ev("CURSOR_SET", at(1, 2), row=1, col=9), ev("CURSOR_SET", at(1, 0), row=7, col=0)]),
 ("popover-opens-and-closes", [load("abc"),
   ev("POPOVER", {"entity": {"popover": {"fromRow": 0, "fromCol": 0, "toRow": 0, "toCol": 3, "title": "t", "sections": [{"heading": "h", "lines": ["x"]}], "busy": True}}},
      popover={"fromRow": 0, "fromCol": 0, "toRow": 0, "toCol": 3, "title": "t", "sections": [{"heading": "h", "lines": ["x"]}], "busy": True}),
   ev("CLOSE_POPOVER", {"entity": {"popover": None}})]),
 ("a-change-paints-the-surface-once-more-than-before", [load("ab"), op("delete", expect={"emits": [{"event": "PAINT", "payload": {}}]})]),
]
out = {"atom": "../ui/core/atoms/std-text-buffer.lolo", "trait": "Buffer",
       "cases": [dict({"id": c[0], "steps": c[-1]}, **({"config": c[1]} if len(c) == 3 else {})) for c in cases]}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "text-buffer.replay.goldens.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False); f.write("\n")
print(len(cases), "cases")
