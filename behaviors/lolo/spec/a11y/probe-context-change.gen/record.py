import json, subprocess, sys, time, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome
here = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(here, "..", "fixtures"))
def serve(d):
    port = random.randint(20000, 29999)
    return port, subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", d], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
fp, fs = serve(FIX)
hp, hs = serve(here)
time.sleep(0.6)
c = Chrome()
rd = lambda n: open(os.path.join(here, f"context-{n}.measure.js")).read().strip()
inv, act, read = rd("inventory"), rd("act"), rd("read")
out = {}
try:
    for name, port, ch in [("context-change-fail", fp, "a"), ("context-change-pass", fp, "a"), ("search-fail", hp, "a"), ("search-pass", hp, "a")]:
        url = f"http://127.0.0.1:{port}/{name}.html"
        c.navigate(url)
        r = {"url": url, "inventory": c.evaluate(f"({inv})()")}
        item = json.loads(r["inventory"])["items"][0]
        r["item"] = item
        r["actExpression"] = f"({act})({json.dumps(item['selector'])},{json.dumps(item['kind'])},{json.dumps(ch)})"
        r["act"] = c.evaluate(r["actExpression"])
        time.sleep(0.3)
        r["read"] = c.evaluate(f"({read})()")
        r["locationAfter"] = c.evaluate("location.href")
        out[name] = r
    json.dump(out, open(os.path.join(here, "recorded.json"), "w"), indent=1, ensure_ascii=False)
    for k, v in out.items():
        print(k, v["locationAfter"]); [print(" ", s, v[s]) for s in ("inventory", "act", "read")]
finally:
    c.close(); fs.kill(); hs.kill()
