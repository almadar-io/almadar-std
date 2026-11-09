import json, os, random, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from cdp import Chrome
FIX = os.path.abspath(os.path.join(HERE, "..", "fixtures"))
ATOM = open(os.path.join(HERE, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-text-spacing.lolo")).read()
js = {n: open(os.path.join(HERE, f"{n}.measure.js")).read().strip() for n in ["clipped", "inject", "remove"]}
for n, v in js.items():
    assert '"' + v + '"' in ATOM, f"the atom {n} knob differs from {n}.measure.js"
STYLE_ID = "almadar-a11y-text-spacing"
CSS = "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }"
out = {"css": CSS}
c = Chrome()
try:
    for name, root in [("text-spacing-fail", FIX), ("text-spacing-pass", FIX), ("text-spacing-preclipped", HERE)]:
        port = random.randint(20000, 29999)
        p = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", root], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.6)
        try:
            c.navigate(f"http://127.0.0.1:{port}/{name}.html")
            c.viewport(1280, 800)
            r = {"base": c.evaluate(f"({js['clipped']})()")}
            r["inject"] = c.evaluate(f"({js['inject']})({json.dumps(STYLE_ID)},{json.dumps(CSS)})")
            r["spaced"] = c.evaluate(f"({js['clipped']})()")
            r["remove"] = c.evaluate(f"({js['remove']})({json.dumps(STYLE_ID)})")
            r["after"] = c.evaluate(f"({js['clipped']})()")
            r["styles"] = c.evaluate("document.querySelectorAll('style#' + " + json.dumps(STYLE_ID) + ").length")
            out[name] = r
        finally:
            p.kill()
finally:
    c.close()
json.dump(out, open(os.path.join(HERE, "recorded.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
