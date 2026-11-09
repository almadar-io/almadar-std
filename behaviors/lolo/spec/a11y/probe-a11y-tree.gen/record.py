import json, subprocess, sys, time, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome, ax_nodes
FIX = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fixtures"))
port = random.randint(20000, 29999)
srv = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", FIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)
c = Chrome()
out = {}
try:
    js = open(os.path.join(os.path.dirname(__file__), "a11y-tree.measure.js")).read().strip()
    for name in sys.argv[1:] or ["icon-name-fail", "icon-name-pass", "label-in-name-fail", "label-in-name-pass"]:
        c.navigate(f"http://127.0.0.1:{port}/{name}.html")
        nodes, raw = ax_nodes(c)
        out[name] = {"url": f"http://127.0.0.1:{port}/{name}.html", "nodes": nodes, "json": c.evaluate(f"({js})()")}
    json.dump(out, open(os.path.join(os.path.dirname(__file__), "recorded.json"), "w"), indent=1, ensure_ascii=False)
    for k, v in out.items():
        print(k); print(json.dumps(v["nodes"], ensure_ascii=False)); print(v["json"])
finally:
    c.close(); srv.kill()
