"""Re-records the std-row-store-postgres login and read bytes against a real Postgres 16 (docker, port 15433, role app / secret).
The atom's own frames are read from the replay harness (a bogus expectation prints the actual emit), sent to the server, and the real replies fed back."""
import base64, json, re, socket, struct, subprocess, sys, os
ROOT = "/Users/osamaalghanmi/kflow.ai.builder/.lanes/std-L4/packages/almadap-std".replace("almadap","almadar")
LOLO = ROOT + "/behaviors/lolo"
ORB = os.path.expanduser("~/.almadar/lane-targets/L4/debug/orb")
ENV = dict(os.environ, ALMADAR_ROOT="/private/tmp/claude-501/-Users-osamaalghanmi-kflow-ai-builder/282561cf-c19e-4b44-96ca-45398147c700/scratchpad/l4r3/root")
b64 = lambda b: base64.b64encode(b).decode()
d64 = base64.b64decode
READ = {"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}}

def run_steps(steps, tag):
    doc = {"atom": "spec/store/row-store-postgres-fixture.lolo", "trait": "RowStoreDriver", "cases": [{"id": tag, "steps": steps}]}
    path = LOLO + f"/spec/store/_rec_{tag}.replay.goldens.json"
    json.dump(doc, open(path, "w"))
    try:
        out = subprocess.run([ORB, "goldens", path], cwd=LOLO, env=ENV, capture_output=True, text=True, timeout=300)
    finally:
        os.remove(path)
    return out.stdout + out.stderr

def actual_frame(output, stage):
    tail = output[output.index("actual:"):] if "actual:" in output else output
    dec = json.JSONDecoder()
    for m in re.finditer(r"PG_WIRE_SENT ", tail):
        try:
            obj, _ = dec.raw_decode(tail[m.end():])
        except ValueError:
            continue
        if obj.get("stage") == stage:
            return d64(obj["frame"])
    raise SystemExit("no %s frame in: %s" % (stage, output[:1200]))

def recv_msgs(sock, until="ZE"):
    buf = b""
    while True:
        chunk = sock.recv(65536)
        buf += chunk
        msgs = []; i = 0
        while i + 5 <= len(buf):
            n = struct.unpack(">I", buf[i+1:i+5])[0]
            if i + 1 + n > len(buf): break
            msgs.append((chr(buf[i]), buf[i+5:i+1+n])); i += 1 + n
        if msgs and msgs[-1][0] in until and i == len(buf): return buf, msgs
        if not chunk: return buf, msgs

def main():
    s = socket.create_connection(("127.0.0.1", 15433))
    s.sendall(bytes([0,0,0,8,4,0xd2,0x16,0x2f])); ans = s.recv(1)
    print("ssl answer", ans)
    bogus = {"event": "PG_WIRE_SENT", "payload": {"stage": "x", "sql": "", "params": [], "frame": ""}}
    pre = [READ, {"event": "PG_CONNECTED", "payload": {"sock": 3}}, {"event": "PG_RECEIVED", "payload": {"data": b64(ans), "eof": False}, "expect": {"emits": [bogus]}}]
    startup = actual_frame(run_steps(pre, "startup"), "startup")
    print("startup frame", startup)
    s.sendall(startup)
    raw1, m1 = recv_msgs(s, "R")
    print("server:", [(k, body[:40]) for k, body in m1])
    steps = pre[:2] + [{"event": "PG_RECEIVED", "payload": {"data": b64(ans), "eof": False}}, {"event": "PG_RECEIVED", "payload": {"data": b64(raw1), "eof": False}}]
    # the real SCRAM list R10 arrives; the atom draws a nonce
    steps.append({"event": "PG_NONCE_DRAWN", "payload": {"value": b64(bytes(range(1, 19)))}, "from": "drawing", "expect": {"emits": [bogus]}})
    first = actual_frame(run_steps(steps, "first"), "scram-first")
    print("scram-first", first)
    s.sendall(first)
    raw2, m2 = recv_msgs(s, "R")
    print("server-first:", m2[0][1][:80])
    steps2 = steps[:-1] + [{"event": "PG_NONCE_DRAWN", "payload": {"value": b64(bytes(range(1, 19)))}, "from": "drawing"},
                            {"event": "PG_RECEIVED", "payload": {"data": b64(raw2), "eof": False}, "expect": {"emits": [bogus]}}]
    final = actual_frame(run_steps(steps2, "final"), "scram-final")
    s.sendall(final)
    raw3, m3 = recv_msgs(s)
    print("after scram-final:", [(k, body[:30]) for k, body in m3])
    ok = any(k == "R" and struct.unpack(">I", body[:4])[0] == 0 for k, body in m3) and m3[-1][0] == "Z"
    print("LOGIN", "ACCEPTED by the real server" if ok else "REJECTED")
    # statement stage: feed the real login tail, take the atom's discovery/read frames, run them
    steps3 = steps2[:-1] + [{"event": "PG_RECEIVED", "payload": {"data": b64(raw2), "eof": False}},
                            {"event": "PG_RECEIVED", "payload": {"data": b64(raw3), "eof": False}, "expect": {"emits": [bogus]}}]
    out = run_steps(steps3, "stmt")
    disc = actual_frame(out, "discover") if '"stage":"discover"' in out else actual_frame(out, "statement")
    stage = "discover" if '"stage":"discover"' in out else "statement"
    s.sendall(disc)
    raw4, m4 = recv_msgs(s)
    print(stage, "frame run:", [k for k, _ in m4], "error" if any(k == "E" for k, _ in m4) else "no error")
    open(os.path.dirname(os.path.abspath(__file__)) + "/real_replies.json", "w").write(json.dumps({"login": b64(raw3), "serverFirst": b64(raw2), "sslAnswer": b64(ans), "list": b64(raw1), "stage": stage, "stageReply": b64(raw4), "scramFirst": b64(first), "scramFinal": b64(final), "startup": b64(startup), "stageFrame": b64(disc)}))
    s.sendall(b"X\0\0\0\4")
main()
