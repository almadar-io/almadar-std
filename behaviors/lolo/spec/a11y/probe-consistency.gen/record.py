# usage: python3 -I record.py   (writes recorded.json; needs headless Chrome)
# Serves a copy of the a11y fixture shop in which the footers and navs of some pages are patched (PATCHES below), and runs measure.js
# (identical to the measureExpression knob of std-a11y-probe-consistency; checked against the atom here) on every page in headless Chrome.
import socket, os, sys, json, base64, struct, subprocess, time, urllib.request, random, shutil, tempfile, pathlib, re
here = pathlib.Path(__file__).resolve().parent
shop = here.parent / "fixtures" / "shop"
atom = (here.parent.parent.parent / "a11y" / "atoms" / "std-a11y-probe-consistency.lolo").read_text()
expr = (here / "measure.js").read_text().strip()
knob = re.search(r'measureExpression : string = "(.*)"\n', atom).group(1)
assert knob == expr, "measure.js and the measureExpression knob differ"
FOOT = '<a href="izjava-o-dostopnosti.html">Izjava o dostopnosti</a> · <a href="docs/cenik.pdf">Cenik (PDF)</a>'
CONTACT = '<a href="kontakt.html">Kontakt</a> · <a href="mailto:info@loncarna.example">info@loncarna.example</a>'
NAV = '<nav aria-label="Glavna navigacija"><a href="index.html">Domov</a><a href="kosarica.html">Košarica</a><a href="izjava-o-dostopnosti.html">Izjava o dostopnosti</a></nav>'
def foot(inner): return f"<footer><div><p>{inner}</p></div></footer>"
PATCHES = {
    "index.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT))],
    "kosarica.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT))],
    "izdelek-1.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT))],
    "placilo.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT))],
    "izdelek-2.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT)), (NAV, '<nav aria-label="Glavna navigacija"><a href="index.html">Domov</a><a href="izjava-o-dostopnosti.html">Izjava o dostopnosti</a></nav>')],
    "povratne-informacije.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT)), (NAV, '<nav aria-label="Glavna navigacija"><a href="nadzorni-organ.html">Nadzorni organ</a><a href="index.html">Domov</a><a href="kosarica.html">Košarica</a><a href="izjava-o-dostopnosti.html">Izjava o dostopnosti</a></nav>')],
    "izjava-o-dostopnosti.html": [],
    "blagajna.html": [(foot(FOOT), foot(CONTACT + " · " + FOOT))],
    "nadzorni-organ.html": [(foot(FOOT), foot(FOOT + " · " + CONTACT)), (NAV, '<nav aria-label="Glavna navigacija"><a href="kosarica.html">Košarica</a><a href="index.html">Domov</a><a href="izjava-o-dostopnosti.html">Izjava o dostopnosti</a></nav>')],
}
tmp = tempfile.mkdtemp(prefix="consistency-shop-")
root = pathlib.Path(tmp) / "site"
shutil.copytree(shop, root)
for page, subs in PATCHES.items():
    t = (root / page).read_text()
    for old, new in subs:
        assert old in t, (page, old)
        t = t.replace(old, new)
    (root / page).write_text(t)
hp = random.randint(20000, 29999); cp = hp + 1
srv = subprocess.Popen(["python3", "-m", "http.server", "--bind", "127.0.0.1", str(hp)], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
chrome = subprocess.Popen(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", f"--remote-debugging-port={cp}", "--user-data-dir=" + os.path.join(tmp, "profile"), "--no-first-run", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
class WS:
    def __init__(s, url):
        host, rest = url[5:].split("/", 1); h, p = host.split(":")
        s.k = socket.create_connection((h, int(p)))
        key = base64.b64encode(os.urandom(16)).decode()
        s.k.sendall(f"GET /{rest} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n".encode())
        b = b""
        while b"\r\n\r\n" not in b: b += s.k.recv(1)
        s.n = 0
    def send(s, o):
        d = json.dumps(o).encode(); m = os.urandom(4)
        h = bytes([0x81])
        if len(d) < 126: h += bytes([0x80 | len(d)])
        elif len(d) < 65536: h += bytes([0x80 | 126]) + struct.pack(">H", len(d))
        else: h += bytes([0x80 | 127]) + struct.pack(">Q", len(d))
        s.k.sendall(h + m + bytes(c ^ m[i % 4] for i, c in enumerate(d)))
    def rd(s, n):
        b = b""
        while len(b) < n:
            c = s.k.recv(n - len(b))
            if not c: raise EOFError
            b += c
        return b
    def recv(s):
        out = b""
        while True:
            a, b = s.rd(2); ln = b & 0x7f
            if ln == 126: ln = struct.unpack(">H", s.rd(2))[0]
            elif ln == 127: ln = struct.unpack(">Q", s.rd(8))[0]
            out += s.rd(ln)
            if a & 0x80: return json.loads(out)
    def call(s, method, **params):
        s.n += 1; s.send({"id": s.n, "method": method, "params": params})
        while True:
            r = s.recv()
            if r.get("id") == s.n: return r
def ev(ws, expr):
    return ws.call("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)["result"]["result"]["value"]
try:
    for _ in range(50):
        try: urllib.request.urlopen(f"http://127.0.0.1:{cp}/json/version"); break
        except Exception: time.sleep(0.2)
    tab = json.load(urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{cp}/json/new?about:blank", method="PUT")))
    ws = WS(tab["webSocketDebuggerUrl"]); ws.call("Page.enable")
    out = {"port": hp, "pages": {}}
    for page in PATCHES:
        ws.call("Page.navigate", url=f"http://127.0.0.1:{hp}/{page}"); time.sleep(1.2)
        out["pages"][page] = {"measured": ev(ws, expr)}
    (here / "recorded.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print("recorded", len(PATCHES), "pages on port", hp)
finally:
    chrome.kill(); srv.kill(); shutil.rmtree(tmp, ignore_errors=True)
