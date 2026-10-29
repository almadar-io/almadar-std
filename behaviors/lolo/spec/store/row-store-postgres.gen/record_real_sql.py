"""Records ROWS_SQL replies from a real Postgres 16 (docker, port 15433, role app / secret, table tickets seeded with t1) into real-sql-pg16.json.
One held session: the login, then each statement of STATEMENTS in turn. The atom's own frames are read from the replay harness (a bogus
expectation prints the actual emit), sent to the server, and the real replies fed back; gen_goldens.py turns the file into the golden case."""
import base64, json, os, re, socket, struct, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOLO = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
ORB = os.environ.get("ORB_BIN", os.path.expanduser("~/bin/orb"))
ENV = dict(os.environ)
b64 = lambda b: base64.b64encode(b).decode()
d64 = base64.b64decode
NONCE = b64(bytes(range(1, 19)))
BOGUS = {"event": "PG_WIRE_SENT", "payload": {"stage": "x", "sql": "", "params": [], "frame": ""}}

STATEMENTS = [
    ("read-one-row", "SELECT id, title, priority, tags, created_at FROM tickets WHERE id = $1", ["t1"]),
    ("types", "SELECT 1 AS one, NULL::text AS nothing, true AS ok, 1.5::float8 AS ratio, 9007199254740993::int8 AS big, '{\"a\": 1}'::jsonb AS doc, ARRAY[1, 2]::int[] AS nums, 'x'::bytea AS raw, 12.50::numeric AS price", []),
    ("no-rows", "SELECT id FROM tickets WHERE id = $1", ["none"]),
    ("array-bind", "SELECT $1::text[] AS tags, $2::int AS n", [["a", "b c", None], 7]),
    ("server-error", "SELECT * FROM missing_table", []),
]


def run(steps, tag):
    doc = {"atom": "spec/store/row-store-postgres-fixture.lolo", "trait": "RowStoreDriver", "cases": [{"id": tag, "steps": steps}]}
    path = LOLO + f"/spec/store/_recsql_{tag}.replay.goldens.json"
    json.dump(doc, open(path, "w"))
    try:
        out = subprocess.run([ORB, "goldens", path], cwd=LOLO, env=ENV, capture_output=True, text=True, timeout=600)
    finally:
        os.remove(path)
    return out.stdout + out.stderr


LAST_WIRE = [None]


def actual_frame(output, stage):
    tail = output[output.index("actual:"):] if "actual:" in output else output
    dec = json.JSONDecoder()
    found = None
    for m in re.finditer(r"PG_WIRE_SENT ", tail):
        try:
            obj, _ = dec.raw_decode(tail[m.end():])
        except ValueError:
            continue
        if obj.get("stage") == stage:
            found = obj
    if found is None:
        raise SystemExit("no %s frame in: %s" % (stage, output[:1500]))
    LAST_WIRE[0] = found
    return d64(found["frame"])


def actual_emit(output, name):
    tail = output[output.index("actual:"):] if "actual:" in output else output
    dec = json.JSONDecoder()
    m = re.search(name + r" ", tail)
    if not m:
        raise SystemExit("no %s in: %s" % (name, output[:1500]))
    obj, _ = dec.raw_decode(tail[m.end():])
    return obj


def recv_msgs(sock, until="ZE"):
    buf = b""
    while True:
        chunk = sock.recv(65536)
        buf += chunk
        msgs = []
        i = 0
        while i + 5 <= len(buf):
            n = struct.unpack(">I", buf[i + 1:i + 5])[0]
            if i + 1 + n > len(buf):
                break
            msgs.append((chr(buf[i]), buf[i + 5:i + 1 + n]))
            i += 1 + n
        if msgs and msgs[-1][0] in until and i == len(buf):
            return buf, msgs
        if not chunk:
            return buf, msgs


def ask(key, sql, params):
    return {"event": "ROWS_SQL", "payload": {"key": key, "sql": sql, "params": params}}


def main():
    s = socket.create_connection(("127.0.0.1", 15433))
    s.sendall(bytes([0, 0, 0, 8, 4, 0xD2, 0x16, 0x2F]))
    ans = s.recv(1)
    first = {**ask("k0", STATEMENTS[0][1], STATEMENTS[0][2]), "from": "ready", "entity": {"id": "f"}}
    steps = [first, {"event": "PG_CONNECTED", "payload": {"sock": 3}}, {"event": "PG_RECEIVED", "payload": {"data": b64(ans), "eof": False}, "expect": {"emits": [BOGUS]}}]
    startup = actual_frame(run(steps, "startup"), "startup")
    s.sendall(startup)
    raw1, _ = recv_msgs(s, "R")
    steps = steps[:2] + [{"event": "PG_RECEIVED", "payload": {"data": b64(ans), "eof": False}}, {"event": "PG_RECEIVED", "payload": {"data": b64(raw1), "eof": False}},
                         {"event": "PG_NONCE_DRAWN", "payload": {"value": NONCE}, "from": "drawing", "expect": {"emits": [BOGUS]}}]
    scram_first = actual_frame(run(steps, "first"), "scram-first")
    s.sendall(scram_first)
    raw2, _ = recv_msgs(s, "R")
    steps = steps[:-1] + [{"event": "PG_NONCE_DRAWN", "payload": {"value": NONCE}, "from": "drawing"},
                          {"event": "PG_RECEIVED", "payload": {"data": b64(raw2), "eof": False}, "expect": {"emits": [BOGUS]}}]
    scram_final = actual_frame(run(steps, "final"), "scram-final")
    s.sendall(scram_final)
    raw3, m3 = recv_msgs(s)
    assert any(k == "R" and struct.unpack(">I", b[:4])[0] == 0 for k, b in m3) and m3[-1][0] == "Z", "login rejected"
    out = {"sslAnswer": b64(ans), "list": b64(raw1), "serverFirst": b64(raw2), "login": b64(raw3), "scramFirst": b64(scram_first), "scramFinal": b64(scram_final),
           "startup": b64(startup), "statements": []}
    steps = steps[:-1] + [{"event": "PG_RECEIVED", "payload": {"data": b64(raw2), "eof": False}}, {"event": "PG_RECEIVED", "payload": {"data": b64(raw3), "eof": False}, "expect": {"emits": [BOGUS]}}]
    strip = lambda st: {k: v for k, v in st.items() if k != "expect"}
    for i, (name, sql, params) in enumerate(STATEMENTS):
        if i > 0:
            steps = steps + [{**ask("k%d" % i, sql, params), "from": "ready", "expect": {"emits": [BOGUS]}}]
        frame = actual_frame(run(steps, "stmt%d" % i), "statement")
        s.sendall(frame)
        reply, msgs = recv_msgs(s)
        steps = steps[:-1] + [strip(steps[-1])]
        steps = steps + [{"event": "PG_RECEIVED", "payload": {"data": b64(reply), "eof": False}, "expect": {"emits": [BOGUS]}}]
        failed = any(k == "E" for k, _ in msgs)
        emit = actual_emit(run(steps, "reply%d" % i), "SQL_FAILED" if failed else "SQL_ROWS")
        print(name, "SQL_FAILED" if failed else "SQL_ROWS", json.dumps(emit))
        out["statements"].append({"name": name, "sql": sql, "params": params, "frame": b64(frame), "wireParams": LAST_WIRE[0]["params"], "wireSql": LAST_WIRE[0]["sql"], "reply": b64(reply), "emit": "SQL_FAILED" if failed else "SQL_ROWS", "payload": emit})
        steps = steps[:-1] + [strip(steps[-1])]
    s.sendall(b"X\0\0\0\4")
    json.dump(out, open(os.path.join(HERE, "real-sql-pg16.json"), "w"), indent=1)


main()
