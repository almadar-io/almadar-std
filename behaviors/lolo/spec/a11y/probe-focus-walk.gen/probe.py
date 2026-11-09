import json, subprocess, sys, time, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome
HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, "..", "fixtures"))
PAGES = ["skip-link-missing-fail", "skip-link-notfirst-fail", "skip-link-broken-fail", "skip-link-pass", "focus-visible-fail", "focus-visible-pass", "keyboard-trap-fail", "keyboard-trap-pass"]
KEYS = {"Tab": ("Tab", "Tab", 9, None), "Enter": ("Enter", "Enter", 13, "\r"), "Space": (" ", "Space", 32, " ")}


def press(c, name, shift=False):
    key, code, vk, text = KEYS[name]
    base = {"key": key, "code": code, "windowsVirtualKeyCode": vk, "modifiers": 8 if shift else 0}
    down = dict(base, type="keyDown")
    if text:
        down["text"] = text
    c.ws.call("Input.dispatchKeyEvent", down)
    c.ws.call("Input.dispatchKeyEvent", dict(base, type="keyUp"))
    time.sleep(0.15)


def js(name):
    return open(os.path.join(HERE, name)).read().strip()


def focused(c):
    return c.evaluate("JSON.stringify(document.activeElement && document.activeElement !== document.body ? {tag: document.activeElement.tagName} : null)")


def run(c, base, page, max_tabs=12):
    c.navigate(f"{base}/{page}.html")
    out = {"page": page, "dom": c.evaluate(f"({js('dom.measure.js')})()"), "tabs": [], "shift": None, "skip": None}
    for i in range(max_tabs):
        press(c, "Tab")
        out["tabs"].append(c.evaluate(f"({js('indicator.measure.js')})()"))
    return out


if __name__ == "__main__":
    port = random.randint(20000, 29999)
    srv = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", FIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.6)
    c = Chrome()
    try:
        for p in PAGES:
            r = run(c, f"http://127.0.0.1:{port}", p, 8)
            print("==", p)
            print(r["dom"])
            for t in r["tabs"]:
                d = json.loads(t)
                print(" ", d["present"], d["selector"], d["domIndex"], d["focused"]["outlineStyle"], d["focused"]["outlineWidth"], "|", d["blurred"]["outlineStyle"], d["focused"]["background"], "|", d["blurred"]["background"], d["focused"]["border"])
    finally:
        c.close(); srv.kill()
