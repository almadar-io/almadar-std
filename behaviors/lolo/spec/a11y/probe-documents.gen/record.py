# usage: python3 -I record.py   (writes recorded.json; needs headless Chrome and pdftotext)
# Reads the links of the documents fixtures through headless Chrome with the PAGE_LINKS expression of std-chrome
# and the text of the fixture PDFs through the real pdftotext -layout, split at the form feed exactly as std-pdf-text does.
import re, socket, os, sys, json, base64, struct, subprocess, time, urllib.request, random, pathlib
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
fix = here.parent / "fixtures"
links_js = chrome_links_expression()
PAGES = ["documents-pdf-notext-fail.html", "documents-pdf-text-pass.html", "lang-missing-pass.html"]
PDFS = ["docs/scan.pdf", "docs/cenik.pdf"]
hp = random.randint(20000, 29999); cp = hp + 1
srv = subprocess.Popen(["python3", "-m", "http.server", "--bind", "127.0.0.1", str(hp)], cwd=fix, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
profile = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"doc-rec-profile-{cp}")
chrome = subprocess.Popen(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", f"--remote-debugging-port={cp}", "--user-data-dir=" + profile, "--no-first-run", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
    out = {"port": hp, "pages": {}, "pdfs": {}}
    for p in PAGES:
        ws.call("Page.navigate", url=f"http://127.0.0.1:{hp}/{p}"); time.sleep(1.2)
        out["pages"][p] = {"title": ev(ws, "document.title"), "links": json.loads(ev(ws, links_js))}
    for f in PDFS:
        text = subprocess.run(["pdftotext", "-layout", str(fix / f), "-"], capture_output=True, text=True, check=True).stdout
        pieces = text.split("\f")
        if pieces and pieces[-1] == "": pieces = pieces[:-1]
        out["pdfs"][f] = {"stdout": text, "pages": [{"page": i + 1, "text": t} for i, t in enumerate(pieces)], "hasText": any(t.strip() for t in pieces)}
    bad = subprocess.run(["pdftotext", "-layout", str(fix / "manifest.json"), "-"], capture_output=True, text=True)
    out["notPdf"] = {"exitCode": bad.returncode, "stdout": bad.stdout, "stderr": bad.stderr}
    (here / "recorded.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print("recorded", len(PAGES), "pages,", len(PDFS), "pdfs on port", hp)
finally:
    chrome.kill(); srv.kill()
