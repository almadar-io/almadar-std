# usage: python3 -I record.py <expression.js> <axe.min.js | -> <fixture.html>... (prints {page: json}); needs headless Chrome
import socket, os, sys, json, base64, struct, subprocess, time, urllib.request, random, signal
FIX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fixtures")
EXPR = open(sys.argv[1]).read().strip()
AXE = sys.argv[2]
PAGES = sys.argv[3:]
hp = random.randint(20000, 29999); cp = hp + 1
srv = subprocess.Popen(["python3", "-m", "http.server", "--bind", "127.0.0.1", str(hp)], cwd=FIX, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
chrome = subprocess.Popen(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", f"--remote-debugging-port={cp}", "--user-data-dir=" + "/tmp/axe-rec-profile-%d" % cp, "--no-first-run", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
try:
    for _ in range(50):
        try: urllib.request.urlopen(f"http://127.0.0.1:{cp}/json/version"); break
        except Exception: time.sleep(0.2)
    req = urllib.request.Request(f"http://127.0.0.1:{cp}/json/new?about:blank", method="PUT")
    tab = json.load(urllib.request.urlopen(req))
    ws = WS(tab["webSocketDebuggerUrl"])
    ws.call("Page.enable")
    axe = open(AXE).read() if AXE != "-" else None
    res = {}
    for p in PAGES:
        ws.call("Page.navigate", url=f"http://127.0.0.1:{hp}/{p}")
        time.sleep(1.5)
        if axe: ws.call("Runtime.evaluate", expression=axe)
        r = ws.call("Runtime.evaluate", expression=EXPR, awaitPromise=True, returnByValue=True)
        res[p] = r["result"]["result"].get("value", r)
    print(json.dumps(res, indent=1))
finally:
    chrome.kill(); srv.kill()
