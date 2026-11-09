import json, subprocess, sys, time, random, os, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome
here = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(here, "..", "fixtures"))
port = random.randint(20000, 29999)
log = open(os.path.join(here, "server.log"), "w")
srv = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", FIX], stdout=log, stderr=log)
time.sleep(0.6)
c = Chrome()
rd = lambda n: open(os.path.join(here, n)).read().strip()
inv, stim, read, rest = [rd(f"forms-{n}.measure.js") for n in ("inventory", "stimulate", "read", "restore")]
out = {}
try:
    for name in sys.argv[1:] or ["form-label-fail", "form-label-pass", "form-error-colour-fail", "form-error-colour-pass", "form-error-announce-fail", "form-error-announce-pass"]:
        url = f"http://127.0.0.1:{port}/{name}.html"
        c.navigate(url)
        submit = "announce" in name
        r = {"url": url, "submit": submit}
        r["inventory"] = c.evaluate(f"({inv})()")
        r["stimulate"] = c.evaluate(f"({stim})({'true' if submit else 'false'})")
        time.sleep(0.2)
        r["read"] = c.evaluate(f"({read})()")
        r["restore"] = c.evaluate(f"({rest})()")
        r["locationAfter"] = c.evaluate("location.href")
        out[name] = r
    json.dump(out, open(os.path.join(here, "recorded.json"), "w"), indent=1, ensure_ascii=False)
    for k, v in out.items():
        print(k, v["locationAfter"]); [print(" ", s, v[s]) for s in ("inventory", "stimulate", "read", "restore")]
finally:
    c.close(); srv.kill(); log.close()
print(open(os.path.join(here, "server.log")).read())
