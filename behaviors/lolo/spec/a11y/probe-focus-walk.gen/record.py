import json, subprocess, sys, time, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome
from probe import press, js, FIX, PAGES

RECT = "JSON.stringify((() => { const a = document.activeElement; if (!a || a === document.body || a === document.documentElement) return null; const r = a.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })())"


def tab_walk(c, count):
    rows = []
    for _ in range(count):
        press(c, "Tab")
        rows.append({"rect": json.loads(c.evaluate(RECT)), "indicator": c.evaluate(f"({js('indicator.measure.js')})()")})
    return rows


def record(c, base, page):
    c.navigate(page if page.startswith("file:") else f"{base}/{page}.html")
    out = {"dom": c.evaluate(f"({js('dom.measure.js')})()"), "tabs": tab_walk(c, 8)}
    c.navigate(page if page.startswith("file:") else f"{base}/{page}.html")
    for _ in range(5):
        press(c, "Tab")
    out["tabs5"] = c.evaluate(f"({js('indicator.measure.js')})()")
    c.navigate(page if page.startswith("file:") else f"{base}/{page}.html")
    for _ in range(8 if "trap" in page else 4):
        press(c, "Tab")
    press(c, "Tab", shift=True)
    out["shift"] = {"rect": json.loads(c.evaluate(RECT)), "indicator": c.evaluate(f"({js('indicator.measure.js')})()")}
    dom = json.loads(out["dom"])
    if dom["anchors"]:
        href = dom["anchors"][0]["href"]
        arg = json.dumps(href)
        c.navigate(page if page.startswith("file:") else f"{base}/{page}.html")
        press(c, "Tab")
        out["skip"] = {"href": href, "pre": c.evaluate(f"({js('skipstate.measure.js')})({arg})")}
        press(c, "Enter")
        out["skip"]["post"] = c.evaluate(f"({js('skipstate.measure.js')})({arg})")
    return out


if __name__ == "__main__":
    port = random.randint(20000, 29999)
    srv = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", FIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.6)
    c = Chrome()
    try:
        rec = {p: record(c, f"http://127.0.0.1:{port}", p) for p in PAGES}
        for extra in ["skip-inert", "focus-order", "focus-jump"]:
            rec[extra] = record(c, "", "file://" + os.path.join(os.path.dirname(os.path.abspath(__file__)), extra + ".html"))
        json.dump(rec, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "recorded.json"), "w"), indent=1, ensure_ascii=False)
        for p, r in rec.items():
            print(p, "skip", r.get("skip"))
    finally:
        c.close(); srv.kill()
