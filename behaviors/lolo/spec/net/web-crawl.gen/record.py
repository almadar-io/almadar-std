# usage: python3 -I record.py   (writes recorded.json; needs headless Chrome)
# The PAGE_LINKS expression is read from std-chrome itself (chrome_links_expression), so it cannot drift.
import re, socket, os, sys, json, base64, struct, subprocess, time, urllib.request, random, shutil, tempfile, pathlib
here = pathlib.Path(__file__).resolve().parent

CHROME = pathlib.Path(__file__).resolve().parents[3] / "connect" / "atoms" / "std-chrome.lolo"
def chrome_links_expression():
    """The PAGE_LINKS expression exactly as std-chrome runs it: linksScript applied to { sel: elementSelector, exts: downloadExtensions }."""
    t = CHROME.read_text()
    script = re.search(r'linksScript : string = "(.*)"\n', t).group(1)
    sel = re.search(r'elementSelector : string = "(.*)"\n', t).group(1)
    exts = json.loads("[" + re.search(r'downloadExtensions : \[string\] = \[(.*)\]\n', t).group(1) + "]")
    assert "\\" not in script and "\\" not in sel
    return script + "(" + json.dumps({"sel": sel, "exts": exts}) + ")"
shop = here.parent.parent / "a11y" / "fixtures" / "shop"
ROBOTS = "User-agent: Googlebot\nDisallow: /\n\n# everyone else\nUser-agent: *\nDisallow: /nadzorni-organ.html\nDisallow: /docs/\nAllow: /docs/cenik.pdf\nDisallow: /*.json$\n\nSitemap: /sitemap.xml\n"
PAGES = ["index.html", "izdelek-1.html", "izdelek-2.html", "izdelek-3.html", "kosarica.html", "blagajna.html", "izjava-o-dostopnosti.html", "nadzorni-organ.html", "povratne-informacije.html", "placilo.html"]
tmp = tempfile.mkdtemp(prefix="crawl-shop-")
root = pathlib.Path(tmp) / "site"
shutil.copytree(shop, root)
(root / "robots.txt").write_text(ROBOTS)
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
    expr = chrome_links_expression()
    out = {"port": hp, "robots": ROBOTS, "pages": {}}
    ws.call("Page.navigate", url=f"http://127.0.0.1:{hp}/robots.txt"); time.sleep(1)
    out["robotsRead"] = ev(ws, "document.body.innerText")
    for p in PAGES:
        ws.call("Page.navigate", url=f"http://127.0.0.1:{hp}/{p}"); time.sleep(1.2)
        out["pages"][p] = {"title": ev(ws, "document.title"), "links": json.loads(ev(ws, expr))}
    (here / "recorded.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print("recorded", len(PAGES), "pages on port", hp)
finally:
    chrome.kill(); srv.kill(); shutil.rmtree(tmp, ignore_errors=True)
