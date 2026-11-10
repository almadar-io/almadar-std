import base64, json, os, re, shutil, socket, struct, subprocess, sys, tempfile, time, urllib.request

CHROME = os.environ.get("ORB_CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
HERE = os.path.dirname(os.path.abspath(__file__))
ATOM = os.path.join(HERE, "..", "..", "..", "connect", "atoms", "std-chrome.lolo")
FIXTURES = os.path.join(HERE, "..", "..", "a11y", "fixtures")
OUT = sys.argv[1]


def knob(name):
    src = open(ATOM).read()
    m = re.search(r"^\s*%s : string = (\".*\")$" % name, src, re.M)
    return json.loads(m.group(1))


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def ws_send(sock, text):
    raw = text.encode()
    mask = os.urandom(4)
    n = len(raw)
    if n < 126:
        head = bytes([0x81, 0x80 | n])
    elif n < 65536:
        head = bytes([0x81, 0x80 | 126]) + struct.pack(">H", n)
    else:
        head = bytes([0x81, 0x80 | 127]) + struct.pack(">Q", n)
    sock.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(raw)))


def recv_exact(sock, n):
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise EOFError
        buf += chunk
    return buf


def ws_recv(sock):
    b0, b1 = recv_exact(sock, 2)
    n = b1 & 0x7F
    if n == 126:
        n = struct.unpack(">H", recv_exact(sock, 2))[0]
    elif n == 127:
        n = struct.unpack(">Q", recv_exact(sock, 8))[0]
    return recv_exact(sock, n).decode()


class Cdp:
    def __init__(self, port):
        body = None
        for _ in range(100):
            try:
                body = urllib.request.urlopen("http://127.0.0.1:%d/json/version" % port).read().decode()
                break
            except OSError:
                time.sleep(0.2)
        self.version_body = body
        url = json.loads(body)["webSocketDebuggerUrl"]
        path = "/" + url.split("/", 3)[3]
        self.sock = socket.create_connection(("127.0.0.1", port))
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall(("GET %s HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                           "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, port, key)).encode())
        head = b""
        while b"\r\n\r\n" not in head:
            head += self.sock.recv(1)
        self.next = 1
        self.session = None

    def call(self, method, params, session=True, settle=0.4):
        i = self.next
        self.next += 1
        msg = {"id": i, "method": method, "params": params}
        if session and self.session:
            msg["sessionId"] = self.session
        ws_send(self.sock, json.dumps(msg, separators=(",", ":")))
        events, reply = [], None
        while reply is None:
            f = ws_recv(self.sock)
            if '"id":%d,' % i in f[:20] or f.startswith('{"id":%d}' % i):
                reply = f
            elif '"id"' not in f[:12]:
                events.append(f)
        self.sock.settimeout(settle)
        try:
            while True:
                f = ws_recv(self.sock)
                events.append(f)
        except (socket.timeout, TimeoutError):
            pass
        self.sock.settimeout(None)
        return {"reply": reply, "events": events}

    def evaluate(self, expr, **kw):
        return self.call("Runtime.evaluate", {"expression": expr, "returnByValue": True, **kw})


def value_of(frame):
    return json.loads(json.loads(frame)["result"]["result"]["value"])


port = free_port()
http_port = free_port()
profile = tempfile.mkdtemp(prefix="chrome-capture-profile-")
dl = tempfile.mkdtemp(prefix="chrome-capture-dl-")
os.makedirs(os.path.join(profile, "Default"))
open(os.path.join(profile, "Default", "Preferences"), "w").write(json.dumps(json.loads(knob("preferences"))))
server = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "--bind", "127.0.0.1", str(http_port)],
                          cwd=FIXTURES, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % port, "--no-first-run",
                         "--no-default-browser-check", "--disable-gpu", "--window-size=1280,800",
                         "--user-data-dir=" + profile, "about:blank"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
base = "http://127.0.0.1:%d/" % http_port
cap = {"base": base, "port": port}
try:
    time.sleep(0.5)
    c = Cdp(port)
    cap["versionBody"] = c.version_body
    cap["create"] = c.call("Target.createTarget", {"url": "about:blank"}, session=False)
    target = json.loads(cap["create"]["reply"])["result"]["targetId"]
    cap["attach"] = c.call("Target.attachToTarget", {"targetId": target, "flatten": True}, session=False)
    c.session = json.loads(cap["attach"]["reply"])["result"]["sessionId"]
    cap["targetId"], cap["sessionId"] = target, c.session
    cap["enablePage"] = c.call("Page.enable", {})
    cap["enableRuntime"] = c.call("Runtime.enable", {})
    cap["enableAx"] = c.call("Accessibility.enable", {})
    cap["download"] = c.call("Browser.setDownloadBehavior", {"behavior": "allow", "downloadPath": dl, "eventsEnabled": True}, session=False)
    cap["downloadPath"] = dl

    info = knob("infoScript")
    cap["navigate"] = c.call("Page.navigate", {"url": base + "shop/index.html"}, settle=1.0)
    cap["navInfo"] = c.evaluate(info)
    cap["navFail"] = c.call("Page.navigate", {"url": "http://127.0.0.1:1/"}, settle=1.0)
    cap["navigate"] = c.call("Page.navigate", {"url": base + "shop/index.html"}, settle=1.0)
    cap["text"] = c.evaluate(knob("textScript"))
    links_expr = knob("linksScript") + "(" + json.dumps({"sel": "a[href], button, [role=button]", "exts": ["pdf", "doc", "docx", "xls", "xlsx", "zip", "csv"]}, separators=(",", ":")) + ")"
    cap["links"] = c.evaluate(links_expr)
    links = value_of(cap["links"]["reply"])
    cap["linkList"] = links
    click_fn = knob("clickScript")

    def click_args(index=None, selector=None):
        return json.dumps({"sel": "a[href], button, [role=button]", "index": index, "selector": selector}, separators=(",", ":"))

    kos = next(l["index"] for l in links if l["text"] == "Košarica")
    cap["clickIndex"] = kos
    cap["click"] = c.evaluate(click_fn + "(" + click_args(index=kos) + ")", )
    time.sleep(0.6)
    cap["clickAfter"] = c.evaluate(info)
    cap["clickNotFound"] = c.evaluate(click_fn + "(" + click_args(selector="#nothing-here") + ")")

    cap["navigate"] = c.call("Page.navigate", {"url": base + "shop/index.html"}, settle=1.0)
    for name, key in [("tabDown", {"type": "keyDown", "key": "Tab", "code": "Tab", "windowsVirtualKeyCode": 9, "modifiers": 0}),
                      ("tabUp", {"type": "keyUp", "key": "Tab", "code": "Tab", "windowsVirtualKeyCode": 9, "modifiers": 0})]:
        cap[name] = c.call("Input.dispatchKeyEvent", key)
    roles = {"a": "link", "button": "button", "select": "combobox", "textarea": "textbox", "input:text": "textbox", "input:checkbox": "checkbox"}
    cap["focused"] = c.evaluate(knob("focusScript") + "(" + json.dumps(roles) + ")")
    cap["focusedBody"] = None
    c.call("Page.navigate", {"url": base + "shop/izjava-o-dostopnosti.html"}, settle=1.0)
    cap["focusedBody"] = c.evaluate(knob("focusScript") + "(" + json.dumps(roles) + ")")

    cap["measureOk"] = c.call("Runtime.evaluate", {"expression": "Promise.resolve(JSON.stringify({a:1}))", "returnByValue": True, "awaitPromise": True})
    cap["measureThrow"] = c.call("Runtime.evaluate", {"expression": "(()=>{throw new Error('boom')})()", "returnByValue": True, "awaitPromise": True})
    cap["measureUndefinedGlobal"] = c.call("Runtime.evaluate", {"expression": "axe.run(document).then(function (r) { return JSON.stringify(r); })", "returnByValue": True, "awaitPromise": True})
    cap["measureRejectText"] = c.call("Runtime.evaluate", {"expression": "Promise.reject('plain')", "returnByValue": True, "awaitPromise": True})
    cap["measureNumber"] = c.call("Runtime.evaluate", {"expression": "42", "returnByValue": True, "awaitPromise": True})
    cap["measureObject"] = c.call("Runtime.evaluate", {"expression": "({a:1})", "returnByValue": True, "awaitPromise": True})
    cap["injectThrow"] = c.call("Runtime.evaluate", {"expression": "nope.nothing()"})
    cap["protocolError"] = c.call("Nope.nothing", {})

    c.call("Page.navigate", {"url": base + "img-alt-pass.html"}, settle=1.0)
    cap["viewport"] = c.call("Emulation.setDeviceMetricsOverride", {"width": 160, "height": 100, "deviceScaleFactor": 1, "mobile": False})
    cap["screenshot"] = c.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
    cap["ax"] = c.call("Accessibility.getFullAXTree", {})

    cap["pdfBlank"] = c.call("Page.navigate", {"url": "about:blank"})
    cap["pdfTree"] = c.call("Page.getFrameTree", {})
    frame_id = json.loads(cap["pdfTree"]["reply"])["result"]["frameTree"]["frame"]["id"]
    cap["pdfHtml"] = "<html><body><h1>Tiny</h1><p>pdf</p></body></html>"
    cap["pdfSet"] = c.call("Page.setDocumentContent", {"frameId": frame_id, "html": cap["pdfHtml"]})
    cap["pdfPrint"] = c.call("Page.printToPDF", {"printBackground": True, "preferCSSPageSize": True})

    c.call("Page.navigate", {"url": base + "shop/index.html"}, settle=1.0)
    cenik = next(l["index"] for l in links if l["text"] == "Cenik (PDF)")
    cap["cenikIndex"] = cenik
    cap["dlClick"] = c.evaluate(click_fn + "(" + click_args(index=cenik) + ")")
    time.sleep(1.5)
    cap["dlEvents"] = [f for f in cap["dlClick"]["events"] if "Browser.download" in f]
    c.sock.settimeout(1.0)
    try:
        while True:
            f = ws_recv(c.sock)
            if "Browser.download" in f:
                cap["dlEvents"].append(f)
    except (socket.timeout, TimeoutError):
        pass
    cap["dlFiles"] = {n: os.path.getsize(os.path.join(dl, n)) for n in os.listdir(dl)}
    json.dump(cap, open(OUT, "w"), indent=1)
finally:
    proc.kill()
    proc.wait()
    server.kill()
    server.wait()
    shutil.rmtree(profile, ignore_errors=True)
    shutil.rmtree(dl, ignore_errors=True)
