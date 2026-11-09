import json, subprocess, sys, time, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, "..", "fixtures"))
KEYS = {"Enter": ("Enter", "Enter", 13, "\r"), "Space": (" ", "Space", 32, " ")}


def press(c, name):
    key, code, vk, text = KEYS[name]
    base = {"key": key, "code": code, "windowsVirtualKeyCode": vk, "modifiers": 0}
    c.ws.call("Input.dispatchKeyEvent", dict(base, type="keyDown", text=text))
    c.ws.call("Input.dispatchKeyEvent", dict(base, type="keyUp"))
    time.sleep(0.15)


def js(name):
    return open(os.path.join(HERE, name)).read().strip()


def observe(c, sel, focus):
    return c.evaluate(f"({js('observe.measure.js')})({json.dumps(sel)},{json.dumps(focus)})")


def record(c, target):
    c.navigate(target)
    listed = c.evaluate(f"({js('clickable.measure.js')})()")
    out = {"list": listed, "checks": []}
    for item in json.loads(listed)["items"]:
        if item["role"] == "button" and not item["native"] and item["tabIndex"] >= 0:
            c.navigate(target)
            pre = observe(c, item["selector"], True)
            press(c, "Enter")
            after_enter = observe(c, item["selector"], False)
            press(c, "Space")
            after_space = observe(c, item["selector"], False)
            out["checks"].append({"selector": item["selector"], "pre": pre, "afterEnter": after_enter, "afterSpace": after_space})
    return out


if __name__ == "__main__":
    port = random.randint(20000, 29999)
    srv = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", FIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.6)
    c = Chrome()
    try:
        rec = {p: record(c, f"http://127.0.0.1:{port}/{p}.html") for p in ["operability-fail", "operability-pass"]}
        for p in ["pointer-only", "keyboard-ok"]:
            rec[p] = record(c, "file://" + os.path.join(HERE, p + ".html"))
        json.dump(rec, open(os.path.join(HERE, "recorded.json"), "w"), indent=1, ensure_ascii=False)
        print(json.dumps(rec, indent=1, ensure_ascii=False))
    finally:
        c.close(); srv.kill()
