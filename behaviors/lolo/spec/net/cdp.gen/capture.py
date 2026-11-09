import base64, json, os, socket, struct, subprocess, sys, tempfile, time, urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = sys.argv[1]


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def send(sock, text):
    raw = text.encode()
    mask = os.urandom(4)
    n = len(raw)
    head = bytes([0x81]) + (bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack(">H", n))
    sock.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(raw)))


def recv_exact(sock, n):
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise EOFError
        buf += chunk
    return buf


def recv(sock):
    b0, b1 = recv_exact(sock, 2)
    n = b1 & 0x7F
    if n == 126:
        n = struct.unpack(">H", recv_exact(sock, 2))[0]
    elif n == 127:
        n = struct.unpack(">Q", recv_exact(sock, 8))[0]
    return recv_exact(sock, n).decode()


port = free_port()
tmp = tempfile.mkdtemp(prefix="cdp-capture-")
proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % port,
                         "--user-data-dir=" + tmp, "about:blank"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    body = None
    for _ in range(100):
        try:
            body = urllib.request.urlopen("http://127.0.0.1:%d/json/version" % port).read().decode()
            break
        except OSError:
            time.sleep(0.2)
    version = json.loads(body)
    url = version["webSocketDebuggerUrl"]
    path = "/" + url.split("/", 3)[3]
    sock = socket.create_connection(("127.0.0.1", port))
    key = base64.b64encode(os.urandom(16)).decode()
    sock.sendall(("GET %s HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                  "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, port, key)).encode())
    head = b""
    while b"\r\n\r\n" not in head:
        head += sock.recv(1)
    assert b" 101 " in head.split(b"\r\n")[0]
    send(sock, '{"id":1,"method":"Browser.getVersion","params":{}}')
    ok = recv(sock)
    send(sock, '{"id":2,"method":"Nope.nothing","params":{}}')
    err = recv(sock)
    send(sock, '{"id":3,"method":"Target.setDiscoverTargets","params":{"discover":true}}')
    frames = [recv(sock), recv(sock)]
    event = next(f for f in frames if '"method"' in f and '"id"' not in f)
    sock.close()
    fixed = lambda s: s.replace(str(port), "9222")
    json.dump({"versionBody": body, "path": path, "reply": ok, "error": err, "event": event}, open(OUT, "w"), indent=1)
finally:
    proc.kill()
    proc.wait()
