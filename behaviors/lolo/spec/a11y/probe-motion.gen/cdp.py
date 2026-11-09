import base64, json, os, socket, struct, subprocess, tempfile, time, urllib.request, random

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


class Ws:
    def __init__(self, host, port, path):
        self.s = socket.create_connection((host, port))
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(1)
        self.n = 0

    def _read(self, n):
        b = b""
        while len(b) < n:
            c = self.s.recv(n - len(b))
            if not c:
                raise EOFError
            b += c
        return b

    def recv(self):
        data = b""
        while True:
            h = self._read(2)
            fin, ln = h[0] & 0x80, h[1] & 0x7F
            if ln == 126:
                ln = struct.unpack(">H", self._read(2))[0]
            elif ln == 127:
                ln = struct.unpack(">Q", self._read(8))[0]
            data += self._read(ln)
            if fin:
                return data.decode()

    def call(self, method, params=None):
        self.n += 1
        payload = json.dumps({"id": self.n, "method": method, "params": params or {}}).encode()
        mask = os.urandom(4)
        n = len(payload)
        head = b"\x81" + (bytes([0x80 | n]) if n < 126 else b"\xfe" + struct.pack(">H", n) if n < 65536 else b"\xff" + struct.pack(">Q", n))
        self.s.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))
        while True:
            m = json.loads(self.recv())
            if m.get("id") == self.n:
                if "error" in m:
                    raise RuntimeError(m["error"])
                return m["result"]


class Chrome:
    def __init__(self):
        self.port = random.randint(20000, 29999)
        self.dir = tempfile.mkdtemp()
        self.proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={self.port}", f"--user-data-dir={self.dir}", "--no-first-run", "--disable-gpu", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{self.port}/json"))
                page = [t for t in tabs if t["type"] == "page"][0]
                break
            except Exception:
                time.sleep(0.2)
        path = "/" + page["webSocketDebuggerUrl"].split("/", 3)[3]
        self.ws = Ws("127.0.0.1", self.port, path)

    def navigate(self, url):
        self.ws.call("Page.enable")
        self.ws.call("Page.navigate", {"url": url})
        time.sleep(0.8)

    def viewport(self, width, height, dsf=1, mobile=False):
        self.ws.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": dsf, "mobile": mobile})

    def evaluate(self, expression):
        r = self.ws.call("Runtime.evaluate", {"expression": expression, "returnByValue": True})
        if "exceptionDetails" in r:
            raise RuntimeError(r["exceptionDetails"])
        return r["result"]["value"]

    def close(self):
        self.proc.kill()


class Site:
    def __init__(self, gen_dir):
        import shutil, sys
        fix = os.path.abspath(os.path.join(gen_dir, "..", "fixtures"))
        self.dir = tempfile.mkdtemp()
        shutil.copytree(fix, self.dir, dirs_exist_ok=True)
        pages = os.path.join(gen_dir, "pages")
        if os.path.isdir(pages):
            shutil.copytree(pages, self.dir, dirs_exist_ok=True)
        self.port = random.randint(20000, 29999)
        self.proc = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(self.port), "--directory", self.dir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.6)
        self.base = f"http://127.0.0.1:{self.port}"

    def close(self):
        self.proc.kill()


KEYS = {"Tab": ("Tab", "Tab", 9, ""), "Enter": ("Enter", "Enter", 13, "\r"), "Space": (" ", "Space", 32, " "), "Escape": ("Escape", "Escape", 27, ""), "ArrowDown": ("ArrowDown", "ArrowDown", 40, ""), "ArrowUp": ("ArrowUp", "ArrowUp", 38, ""), "ArrowLeft": ("ArrowLeft", "ArrowLeft", 37, ""), "ArrowRight": ("ArrowRight", "ArrowRight", 39, ""), "Home": ("Home", "Home", 36, ""), "End": ("End", "End", 35, "")}


def _key(self, name, shift=False):
    k, code, vk, text = KEYS[name]
    mods = 8 if shift else 0
    base = {"key": k, "code": code, "windowsVirtualKeyCode": vk, "nativeVirtualKeyCode": vk, "modifiers": mods}
    self.ws.call("Input.dispatchKeyEvent", dict(base, type="keyDown", text=text) if text else dict(base, type="rawKeyDown"))
    self.ws.call("Input.dispatchKeyEvent", dict(base, type="keyUp"))
    time.sleep(0.15)


Chrome.key = _key
