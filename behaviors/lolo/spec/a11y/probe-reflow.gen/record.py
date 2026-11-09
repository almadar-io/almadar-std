import json, os, random, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cdp import Chrome
FIX = os.path.abspath(os.path.join(HERE, "..", "fixtures"))
ATOM = os.path.abspath(os.path.join(HERE, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-reflow.lolo"))
js = open(os.path.join(HERE, "reflow.measure.js")).read().strip()
assert '"' + js + '"' in open(ATOM).read(), "the atom measure knob differs from reflow.measure.js"
allowed = "table,pre,img,video,canvas,svg,[role=img],map,object,embed"
pages = {"reflow-fail": FIX, "reflow-pass": FIX, "reflow-offender": HERE}
out = {}
srv = {}
c = Chrome()
try:
    for name, root in pages.items():
        port = random.randint(20000, 29999)
        p = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", root], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.6)
        try:
            c.navigate(f"http://127.0.0.1:{port}/{name}.html")
            c.viewport(320, 256)
            out[name] = c.evaluate(f"({js})({json.dumps(allowed)})")
            c.viewport(1280, 800)
        finally:
            p.kill()
finally:
    c.close()
json.dump(out, open(os.path.join(HERE, "recorded.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
