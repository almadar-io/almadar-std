import json, os, random, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from cdp import Chrome
FIX = os.path.abspath(os.path.join(HERE, "..", "fixtures"))
ATOM = os.path.abspath(os.path.join(HERE, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-text-resize.lolo"))
clip = open(os.path.join(HERE, "clipped.measure.js")).read().strip()
vp = open(os.path.join(HERE, "viewport.measure.js")).read().strip()
src = open(ATOM).read()
assert '"' + clip + '"' in src and '"' + vp + '"' in src, "the atom knobs differ from the .js files"
out = {}
c = Chrome()
try:
    for name, root in [("text-resize-fail", FIX), ("text-resize-pass", FIX), ("text-resize-preclipped", HERE), ("viewport-blocked", HERE), ("viewport-maxscale", HERE), ("viewport-open", HERE), ("viewport-none", HERE)]:
        port = random.randint(20000, 29999)
        p = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", root], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.6)
        try:
            c.navigate(f"http://127.0.0.1:{port}/{name}.html")
            c.viewport(1280, 800)
            r = {"meta": c.evaluate(f"({vp})()"), "base": c.evaluate(f"({clip})()")}
            # Chrome page zoom 200%: the same 1280x800 window is 640x400 CSS px at device scale 2
            c.viewport(640, 400, 2)
            r["zoomed"] = c.evaluate(f"({clip})()")
            out[name] = r
        finally:
            p.kill()
finally:
    c.close()
json.dump(out, open(os.path.join(HERE, "recorded.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
