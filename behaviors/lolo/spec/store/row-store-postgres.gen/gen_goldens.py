import json, base64, struct, hashlib, hmac as hm, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "postgres-twin.replay.goldens.json"
b64 = lambda b: base64.b64encode(b).decode()

def msg(kind, body=b""):
    return kind + struct.pack(">I", len(body) + 4) + body
def cstr(s): return s.encode() + b"\0"

USER, PASSWORD, DB, HOST, PORT = "app", "secret", "app", "postgres.example.test", 5432
SSL_REQUEST = bytes([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f])

def startup(timeout_ms=10000):
    body = struct.pack(">I", 196608)
    pairs = [("user", USER), ("database", DB), ("client_encoding", "UTF8")]
    if timeout_ms:
        pairs.append(("options", f"-c statement_timeout={timeout_ms}"))
    for n, v in pairs:
        body += cstr(n) + cstr(v)
    body += b"\0"
    return struct.pack(">I", len(body) + 4) + body

def query_frame(sql, params):
    parse = b"\0" + cstr(sql) + struct.pack(">H", 0)
    bind = b"\0\0" + struct.pack(">H", 0) + struct.pack(">H", len(params))
    for p in params:
        if p is None: bind += struct.pack(">i", -1)
        else:
            e = p.encode(); bind += struct.pack(">i", len(e)) + e
    bind += struct.pack(">H", 0)
    return msg(b"P", parse) + msg(b"B", bind) + msg(b"D", b"P\0") + msg(b"E", b"\0" + struct.pack(">I", 0)) + msg(b"S")

def prm(p): return {"kind": "null"} if p is None else {"kind": "text", "text": p}

# ---- backend messages
def R(code, extra=b""): return msg(b"R", struct.pack(">I", code) + extra)
def S(n, v): return msg(b"S", cstr(n) + cstr(v))
def K(): return msg(b"K", struct.pack(">II", 4242, 99))
def Z(st=b"I"): return msg(b"Z", st)
def E(code, message, sev="ERROR"):
    return msg(b"E", b"S" + cstr(sev) + b"V" + cstr(sev) + b"C" + cstr(code) + b"M" + cstr(message) + b"\0")
def T(cols):
    body = struct.pack(">H", len(cols))
    for name, oid in cols:
        body += cstr(name) + struct.pack(">IHIhiH", 0, 0, oid, -1, -1, 0)
    return msg(b"T", body)
def D(cells):
    body = struct.pack(">H", len(cells))
    for c in cells:
        if c is None: body += struct.pack(">i", -1)
        else:
            e = c.encode(); body += struct.pack(">i", len(e)) + e
    return msg(b"D", body)
def C(tag): return msg(b"C", cstr(tag))
PARSE_BIND = msg(b"1") + msg(b"2")
def result(cols, rows, tag):
    return PARSE_BIND + T(cols) + b"".join(D(r) for r in rows) + C(tag) + Z()
def nodata(tag, st=b"I"): return PARSE_BIND + msg(b"n") + C(tag) + Z(st)

TXT, I4, JSONB, TSTZ = 25, 23, 3802, 1184
TICKET_COLS = [("id", TXT), ("created_at", TSTZ), ("updated_at", TSTZ), ("title", TXT), ("status", TXT), ("priority", I4), ("tags", JSONB)]
def ticket(i, title, status, prio, tags, created="2026-03-05 10:00:00.123456+00", updated="2026-03-06 11:00:00+00"):
    return [i, created, updated, title, status, None if prio is None else str(prio), tags]
def ticket_row(i, title, status, prio, tags, createdAt="2026-03-05T10:00:00.123Z", updatedAt="2026-03-06T11:00:00.000Z"):
    return {"id": i, "title": title, "status": status, "priority": prio, "tags": tags, "createdAt": createdAt, "updatedAt": updatedAt}

KINDS = {"id": "text", "created_at": "other", "updated_at": "other", "title": "text", "status": "text", "priority": "other", "tags": "jsonb"}
def warm(extra=None):
    e = {"id": "f", "sock": 3, "schema": {"tickets": KINDS}}
    if extra: e.update(extra)
    return e
WARM_NOSCHEMA = {"id": "f", "sock": 3}

DISCOVERY_SQL = "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1"
def discovery_reply():
    pairs = [("id","text"),("created_at","timestamp with time zone"),("updated_at","timestamp with time zone"),("title","text"),("status","text"),("priority","integer"),("tags","jsonb")]
    return result([("column_name", 19), ("data_type", 1043)], [list(p) for p in pairs], "SELECT 7")

# ---- step builders
def recv(data, frm=None, entity=None, expect=None):
    s = {"event": "PG_RECEIVED", "payload": {"data": b64(data), "eof": False}}
    if frm: s["from"] = frm
    if entity: s["entity"] = entity
    if expect: s["expect"] = expect
    return s
def wire(stage, sql, params, frame):
    return {"event": "PG_WIRE_SENT", "payload": {"stage": stage, "sql": sql, "params": [prm(p) for p in params], "frame": b64(frame)}}
def emit(ev, **p): return {"event": ev, "payload": p}
SEND_RECV = [{"type": "let"}]
def stmt(stage, sql, params): return wire(stage, sql, params, query_frame(sql, params))

def ask(event, payload, entity, state, emits, effects=SEND_RECV, nev=("STORE_FAILED",)):
    ex = {"state": state, "emits": emits, "effects": effects}
    if nev: ex["neverEmits"] = list(nev)
    return {"event": event, "payload": payload, "from": "ready", "entity": entity, "expect": ex}

cases = []
def case(id, steps, note=None, skip=None):
    c = {"id": id, "steps": steps}
    if note: c["note"] = note
    if skip: c["skip"] = skip
    cases.append(c)

def connect():
    return {"event": "PG_CONNECTED", "payload": {"sock": 3}, "expect": {"state": "negotiating", "emits": [wire("ssl-request", "", [], SSL_REQUEST)]}}

# ================= connection and login =================
case("good-cold-ask-connects-to-the-configured-origin",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"},
       "expect": {"state": "connecting", "effects": [{"type": "os/tcp-connect", "arg0": HOST, "arg1": PORT}], "neverEmits": ["STORE_FAILED", "ROW_FOUND"]}}],
     note="no session yet: one os/tcp-connect before anything else")
case("bad-connection-refused-fails-with-the-address",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      {"event": "PG_IO_FAILED", "payload": {"error": "Connection refused (os error 61)", "kind": "io"},
       "expect": {"state": "ready", "emits": [emit("STORE_FAILED", key="k", message=f"cannot connect to {HOST}:{PORT}: Connection refused (os error 61)")], "neverEmits": ["ROW_FOUND"]}}],
     note="twin: PgPort::connect error `cannot connect to {host}:{port}: {e}`")
case("good-connected-asks-for-tls-first-under-sslmode-prefer",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      {"event": "PG_CONNECTED", "payload": {"sock": 3},
       "expect": {"state": "negotiating", "emits": [wire("ssl-request", "", [], SSL_REQUEST)], "effects": [{"type": "let"}], "neverEmits": ["STORE_FAILED"]}}],
     note="SSLRequest is 00 00 00 08 04 d2 16 2f")
case("good-server-answers-n-and-startup-follows",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      connect(),
      recv(b"N", expect={"state": "startup", "emits": [wire("startup", "", [], startup())], "neverEmits": ["STORE_FAILED"]})],
     note="user, database, client_encoding and the options pair `-c statement_timeout=10000` the fixture sets through the statementTimeoutMs knob (the atom default 0 sends none)")
case("bad-tls-answer-s-is-refused-because-no-tls-over-os-sockets",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      connect(),
      recv(b"S", expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="the server answered S to the TLS request and this driver speaks no TLS over os sockets: set sslmode=disable, or have the server answer N")], "neverEmits": ["ROW_FOUND"], "effects": [{"type": "os/close"}]})],
     note="DROP vs the Rust twin (TlsConn): new text, owner call (G-STD-NEW tls)")
case("bad-tls-answer-other-byte-is-refused",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      connect(),
      recv(b"x", expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="the answer to the TLS request is 0x78, neither S nor N")]})])
case("bad-tls-request-closed-by-server",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      connect(),
      {"event": "PG_RECEIVED", "payload": {"data": "", "eof": True}, "expect": {"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="the server closed the connection answering the TLS request")]}}])

def to_startup():
    return [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
            connect(), recv(b"N", expect={"state": "startup", "emits": [wire("startup", "", [], startup())]})]

READ_SQL = 'SELECT * FROM "tickets" WHERE "id" = $1'
ok_session = R(0) + S("server_version", "16.2") + S("client_encoding", "UTF8") + K() + Z()
case("good-trusted-login-runs-the-parked-ask",
     to_startup() + [recv(ok_session, expect={"state": "running", "emits": [stmt("statement", READ_SQL, ["t1"])], "neverEmits": ["STORE_FAILED"]})],
     note="R0 .. ReadyForQuery, then the parked ROW_READ is sent")
case("good-cleartext-login-answers-the-password",
     to_startup() + [recv(R(3), expect={"state": "startup", "emits": [wire("password", "", [], msg(b"p", cstr(PASSWORD)))]}),
                     recv(ok_session, expect={"state": "running", "emits": [stmt("statement", READ_SQL, ["t1"])]})])
salt = bytes([0xaf, 0xc0, 0x33, 0x1d])
md5hex = lambda b: hashlib.md5(b).hexdigest()
md5pw = "md5" + md5hex((md5hex((PASSWORD + USER).encode())).encode() + salt)
case("good-md5-login-answers-md5-of-md5-password-user-and-salt",
     to_startup() + [recv(R(5, salt), expect={"state": "startup", "emits": [wire("password", "", [], msg(b"p", cstr(md5pw)))]}),
                     recv(ok_session, expect={"state": "running"})],
     note="md5 + hex(md5(hex(md5(password+user)) + salt)), the recorded fixtures/postgres/md5-login salt")

# SCRAM: recorded server-first from fixtures/postgres/scram-wrong-password-fails
NONCE_BYTES = bytes(range(1, 19)); NONCE = b64(NONCE_BYTES)
server_first = "r=AQIDBAUGBwgJCgsMDQ4PEBESJNXubcZ3b8qDQc8YOZhDLCsX,s=nKHGkexFELM/hS7LviqlRg==,i=4096"
client_first_bare = f"n={USER},r={NONCE}"
client_first = "n,,"+client_first_bare
first_body = cstr("SCRAM-SHA-256") + struct.pack(">I", len(client_first)) + client_first.encode()
salt_s = base64.b64decode("nKHGkexFELM/hS7LviqlRg==")
sp = hashlib.pbkdf2_hmac("sha256", PASSWORD.encode(), salt_s, 4096)
H = lambda k, m: hm.new(k, m, hashlib.sha256).digest()
ck = H(sp, b"Client Key"); sk = hashlib.sha256(ck).digest()
nonce_all = "AQIDBAUGBwgJCgsMDQ4PEBESJNXubcZ3b8qDQc8YOZhDLCsX"
wo_proof = f"c=biws,r={nonce_all}"
auth_message = f"{client_first_bare},{server_first},{wo_proof}"
sig = H(sk, auth_message.encode())
proof = bytes(a ^ b for a, b in zip(ck, sig))
client_final = f"{wo_proof},p={b64(proof)}"
server_key = H(sp, b"Server Key"); server_sig = H(server_key, auth_message.encode())
server_final = "v=" + b64(server_sig)

def scram_to_proof():
    return to_startup() + [
        recv(R(10, cstr("SCRAM-SHA-256") + b"\0"), expect={"state": "drawing", "effects": [{"type": "let"}]}),
        {"event": "PG_NONCE_DRAWN", "payload": {"value": NONCE}, "from": "drawing",
         "expect": {"state": "startup", "emits": [wire("scram-first", "", [], msg(b"p", first_body))]}},
        recv(R(11, server_first.encode()), expect={"state": "startup", "emits": [wire("scram-final", "", [], msg(b"p", client_final.encode()))]})]
case("good-scram-sha-256-login-sends-first-then-proof-and-verifies-the-server",
     scram_to_proof() + [recv(R(12, server_final.encode()) + ok_session, expect={"state": "running", "emits": [stmt("statement", READ_SQL, ["t1"])], "neverEmits": ["STORE_FAILED"]})],
     note="client nonce = base64 of 18 bytes 01..12 (random-bytes 18); salt, iterations and server nonce are the recorded fixtures/postgres/scram-wrong-password-fails values; proof computed with pbkdf2/hmac (no hmac-over-bytes operator, so the atom builds HMAC from hash/sha256 bytes)")
case("bad-scram-server-first-that-is-not-text-is-store-failed",
     scram_to_proof()[:-1] + [recv(R(11, b"\xff\xfe"), expect={"emits": [emit("STORE_FAILED", key="k", message="the SCRAM server-first message is not text")], "neverEmits": ["ROW_FOUND"]})],
     note="the server-first message must decode as text before r, s and i are read; undecodable bytes end the login with the proof error, never an empty string")
case("bad-scram-server-signature-mismatch-fails",
     scram_to_proof() + [recv(R(12, ("v="+b64(bytes(32))).encode()) + ok_session, expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="the SCRAM server signature does not match: the server does not know the password")], "neverEmits": ["ROW_FOUND"]})],
     note="Scram::verify text")
case("bad-scram-wrong-password-fails-with-the-server-message",
     scram_to_proof() + [recv(E("28P01", f'password authentication failed for user "{USER}"', "FATAL"), expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message=f'password authentication failed for user "{USER}"')], "effects": [{"type": "let"}], "neverEmits": ["ROW_FOUND"]})],
     note="E 28P01 recorded in scram-wrong-password-fails; the row-store message is the server message only")
case("bad-unsupported-authentication-method",
     to_startup() + [recv(R(7), expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="unsupported authentication method 7")]})])
case("bad-startup-database-missing-fails-with-the-server-message",
     to_startup() + [recv(E("3D000", 'database "app" does not exist', "FATAL"), expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message='database "app" does not exist')]})])
case("skip-password-required-but-none-in-the-url", [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}}],
     note="expect STORE_FAILED `the server asks for a password and DATABASE_URL has none` after R3/R5/R10 with a url without a password",
     skip="needs the server's answer frames (R3/R5/R10) scripted, with config.url without a password")
case("skip-sslmode-require-and-server-answers-n", [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}}],
     note="expect STORE_FAILED `the server does not support TLS and sslmode requires it` after answer N",
     skip="needs the server's N answer scripted, with config sslmode=require")
case("skip-sslmode-disable-sends-startup-without-ssl-request", [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}}],
     note="expect PG_CONNECTED -> startup frame directly, no SSLRequest", skip="needs the startup frame checked, with config sslmode=disable")

# ================= read / list =================
r1 = ticket("t1", "Fix login", "open", 3, '["a","b"]')
case("good-read-answers-the-row-with-stamps-as-millisecond-iso-and-jsonb-parsed",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])]),
      recv(result(TICKET_COLS, [r1], "SELECT 1"), expect={"state": "ready", "emits": [emit("ROW_FOUND", key="k", row=ticket_row("t1", "Fix login", "open", 3, ["a", "b"]))], "neverEmits": ["STORE_FAILED"]})])
case("good-read-of-a-missing-row-answers-no-row",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "zz"}, warm(), "running", [stmt("statement", READ_SQL, ["zz"])]),
      recv(result(TICKET_COLS, [], "SELECT 0"), expect={"state": "ready", "emits": [emit("ROW_FOUND", key="k")], "neverEmits": ["STORE_FAILED"]})],
     note="ROW_FOUND without a row field: select_one returns None")
case("good-null-cell-is-null-in-the-row",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t2"}, warm(), "running", [stmt("statement", READ_SQL, ["t2"])]),
      recv(result(TICKET_COLS, [ticket("t2", None, "open", None, None)], "SELECT 1"),
           expect={"emits": [emit("ROW_FOUND", key="k", row={"id": "t2", "title": None, "status": "open", "priority": None, "tags": None, "createdAt": "2026-03-05T10:00:00.123Z", "updatedAt": "2026-03-06T11:00:00.000Z"})]})],
     note="SQL NULL cells are null (cell_value(None)); G-ORB-339: the atom decodes DataRow itself into a local tagged cell, length -1 = null")
case("bad-read-missing-table-fails-with-the-server-message",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])]),
      recv(PARSE_BIND[:0] + E("42P01", 'relation "tickets" does not exist') + Z(), expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message='relation "tickets" does not exist')], "neverEmits": ["ROW_FOUND"]})],
     note="E arrives before ReadyForQuery; the error is reported at Z; a server error keeps the session")
SCAN_FAILED = "the server sent a message this driver cannot read"
ROWS_FAILED = "the server sent a value this driver cannot decode"
def malformed(reply, message, id, note):
    case(id,
         [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])]),
          recv(reply, expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message=message)], "neverEmits": ["ROW_FOUND"]})],
         note=note)
ID_COL = struct.pack(">IHIhiH", 0, 0, TXT, -1, -1, 0)
malformed(PARSE_BIND + msg(b"T", struct.pack(">H", 1) + b"\xff\xfe\0" + ID_COL) + C("SELECT 0") + Z(), SCAN_FAILED,
          "bad-read-reply-with-a-column-name-that-is-not-text-is-store-failed",
          "a column name that does not decode as UTF-8 is a protocol failure: the whole chunk is refused, no stand-in name")
malformed(PARSE_BIND + T([("id", TXT)]) + msg(b"D", struct.pack(">H", 1) + struct.pack(">i", 2) + b"\xff\xfe") + C("SELECT 1") + Z(), SCAN_FAILED,
          "bad-read-reply-with-a-cell-that-is-not-text-is-store-failed",
          "a cell whose bytes do not decode as UTF-8 is a protocol failure, not an empty string")
malformed(PARSE_BIND + T([("id", TXT)]) + msg(b"D", struct.pack(">H", 1) + struct.pack(">i", 50) + b"ab") + C("SELECT 1") + Z(), SCAN_FAILED,
          "bad-read-reply-with-a-cell-longer-than-its-message-is-store-failed",
          "a cell length that runs past the end of its DataRow is a protocol failure")
malformed(PARSE_BIND + msg(b"E", b"\xff\xfe\0") + Z(), SCAN_FAILED,
          "bad-read-reply-with-an-error-that-is-not-text-is-store-failed",
          "an ErrorResponse whose bytes do not decode as UTF-8 is a protocol failure, not an error with an empty message")
malformed(PARSE_BIND + msg(b"R", b"\0\0") + Z(), SCAN_FAILED,
          "bad-read-reply-with-an-authentication-code-that-is-too-short-is-store-failed",
          "an authentication message too short to hold its four-byte code is a protocol failure")
bad_ts = ticket("t1", "Fix login", "open", 3, '["a"]', created="not a time")
malformed(result(TICKET_COLS, [bad_ts], "SELECT 1"), ROWS_FAILED,
          "bad-read-reply-with-a-timestamp-that-does-not-parse-is-store-failed",
          "a timestamptz cell that time/parse refuses fails the ask; no epoch date stands in for it")
malformed(PARSE_BIND + T([("data", 17)]) + D(["\\xzz"]) + C("SELECT 1") + Z(), ROWS_FAILED,
          "bad-read-reply-with-a-bytea-that-is-not-hex-is-store-failed",
          "a bytea cell with a non-hex digit fails the ask instead of decoding to a wrong byte")
malformed(PARSE_BIND + T([("seen", 1185)]) + D(['{"not a time"}']) + C("SELECT 1") + Z(), ROWS_FAILED,
          "bad-read-reply-with-an-array-element-that-does-not-decode-is-store-failed",
          "a timestamptz[] element that time/parse refuses fails the whole row")
case("bad-read-connection-closed-mid-reply-fails-and-drops-the-session",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])]),
      {"event": "PG_RECEIVED", "payload": {"data": "", "eof": True}, "expect": {"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="the server closed the connection")], "effects": [{"type": "os/close"}]}}])
case("good-reply-split-across-reads-waits-for-the-whole-frame",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])]),
      {"event": "PG_RECEIVED", "payload": {"data": b64(result(TICKET_COLS, [r1], "SELECT 1")[:30]), "eof": False}, "expect": {"state": "running", "effects": [{"type": "os/recv"}], "neverEmits": ["ROW_FOUND", "STORE_FAILED"]}},
      {"event": "PG_RECEIVED", "payload": {"data": b64(result(TICKET_COLS, [r1], "SELECT 1")[30:]), "eof": False}, "expect": {"state": "ready", "emits": [emit("ROW_FOUND", key="k", row=ticket_row("t1", "Fix login", "open", 3, ["a", "b"]))]}}])
LIST_SQL = 'SELECT * FROM "tickets"'
r2 = ticket("t2", "Add search", "closed", 1, '[]', created="2026-03-04 09:00:00+00", updated="2026-03-04 09:00:00+00")
case("good-list-answers-every-row-unordered",
     [ask("ROW_LIST", {"key": "k", "entityType": "Ticket"}, warm(), "running", [stmt("statement", LIST_SQL, [])]),
      recv(result(TICKET_COLS, [r1, r2], "SELECT 2"), expect={"state": "ready", "emits": [emit("ROWS_LISTED", key="k", rows=[ticket_row("t1", "Fix login", "open", 3, ["a", "b"]), ticket_row("t2", "Add search", "closed", 1, [], "2026-03-04T09:00:00.000Z", "2026-03-04T09:00:00.000Z")])]})])
case("good-list-of-an-empty-table-answers-no-rows",
     [ask("ROW_LIST", {"key": "k", "entityType": "Ticket"}, warm(), "running", [stmt("statement", LIST_SQL, [])]),
      recv(result(TICKET_COLS, [], "SELECT 0"), expect={"emits": [emit("ROWS_LISTED", key="k", rows=[])]})])
case("good-declared-collection-is-the-table-as-written",
     [ask("ROW_LIST", {"key": "k", "entityType": "TimeEntry", "collection": "timesheet"}, warm(), "running", [stmt("statement", 'SELECT * FROM "timesheet"', [])])],
     note="EXEC-STORE-4: the verb's collection is the table as written; control below is the pluralised snake_case name")
case("good-declared-collection-addresses-a-read",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1", "collection": "support_tickets"}, warm(), "running", [stmt("statement", READ_SQL.replace('"tickets"', '"support_tickets"'), ["t1"])])],
     note="the read names the declared collection; control below keys by entityType")
case("good-read-without-a-collection-keys-by-entity-type",
     [ask("ROW_READ", {"key": "k", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])])])

# ================= query / push-down =================
FILTER = {"kind": "all", "of": [
    {"kind": "compare", "field": "status", "op": "==", "value": "open"},
    {"kind": "compare", "field": "priority", "op": ">=", "value": 3},
    {"kind": "member", "field": "title", "values": ["a", "b"]}]}
Q_SQL = 'SELECT *, (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE (COALESCE("status" = $1, FALSE) AND COALESCE("priority" >= $2, FALSE) AND COALESCE("title" = ANY($3), FALSE)) ORDER BY "title" COLLATE "C" DESC NULLS LAST, "id" COLLATE "C" ASC LIMIT $4 OFFSET $5'
Q_PARAMS = ["open", "3", '{"a","b"}', "3", "2"]
q = {"filter": FILTER, "order": {"field": "title", "direction": "desc"}, "offset": 2, "limit": 3}
tot_cols = TICKET_COLS + [("__total", I4)]
case("good-query-pushes-filter-order-and-window-down-and-reads-the-total-from-the-page",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": q, "project": "rows"}, warm(), "running", [stmt("statement", Q_SQL, Q_PARAMS)]),
      recv(result(tot_cols, [r1 + ["7"]], "SELECT 1"), expect={"state": "ready", "emits": [emit("ROWS_PAGE", key="k", rows=[ticket_row("t1", "Fix login", "open", 3, ["a", "b"])], total=7)], "neverEmits": ["STORE_FAILED", "STORE_UNSUPPORTED"]})],
     note="the exact SQL and binds of the Rust unit test a_query_is_parameterized_sql_with_two_valued_logic_...; __total is dropped from the row")
case("good-query-discovers-column-kinds-once-then-builds-the-sql",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": q, "project": "rows"}, WARM_NOSCHEMA, "discovering", [stmt("discover", DISCOVERY_SQL, ["tickets"])]),
      recv(discovery_reply(), expect={"state": "running", "emits": [stmt("statement", Q_SQL, Q_PARAMS)]}),
      recv(result(tot_cols, [r1 + ["7"]], "SELECT 1"), expect={"state": "ready", "emits": [emit("ROWS_PAGE", key="k", rows=[ticket_row("t1", "Fix login", "open", 3, ["a", "b"])], total=7)]})],
     note="information_schema.columns for current_schema(); data_type text|character varying|character=text, jsonb, ARRAY=array, else other; cached per table")
IDS_SQL = 'SELECT "id", (COUNT(*) OVER ())::int AS "__total" FROM "tickets" ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC'
case("good-query-ids-projects-only-the-id-column",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {}, "project": "ids"}, warm(), "running", [stmt("statement", IDS_SQL, [])]),
      recv(result([("id", TXT), ("__total", I4)], [["t1", "2"], ["t2", "2"]], "SELECT 2"), expect={"emits": [emit("ROWS_IDS", key="k", ids=["t1", "t2"], total=2)]})],
     note="default order is createdAt asc; createdAt lives in created_at because the table declares no createdAt column")
case("good-query-with-an-empty-window-page-counts-separately",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"offset": 5, "limit": 2}, "project": "rows"}, warm(), "running",
          [stmt("statement", 'SELECT *, (COUNT(*) OVER ())::int AS "__total" FROM "tickets" ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC LIMIT $1 OFFSET $2', ["2", "5"])]),
      recv(result(tot_cols, [], "SELECT 0"), expect={"state": "running", "emits": [stmt("count", 'SELECT COUNT(*)::int AS total FROM "tickets"', [])], "neverEmits": ["ROWS_PAGE"]}),
      recv(result([("total", I4)], [["9"]], "SELECT 1"), expect={"state": "ready", "emits": [emit("ROWS_PAGE", key="k", rows=[], total=9)]})],
     note="no row carried __total and offset>0: the count query takes the filter binds and no window")
case("good-query-with-total-none-counts-the-returned-rows",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"total": "none", "limit": 2}, "project": "rows"}, warm(), "running",
          [stmt("statement", 'SELECT * FROM "tickets" ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC LIMIT $1', ["2"])]),
      recv(result(TICKET_COLS, [r1, r2], "SELECT 2"), expect={"emits": [emit("ROWS_PAGE", key="k", rows=[ticket_row("t1", "Fix login", "open", 3, ["a", "b"]), ticket_row("t2", "Add search", "closed", 1, [], "2026-03-04T09:00:00.000Z", "2026-03-04T09:00:00.000Z")], total=2)]})])
MISSING_SQL = 'SELECT "id", (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE TRUE ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC'
case("good-query-on-a-missing-column-rereads-the-columns-then-treats-it-as-absent",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"filter": {"kind": "isNull", "field": "nowhere", "isNull": True}}, "project": "ids"}, warm(), "discovering", [stmt("discover", DISCOVERY_SQL, ["tickets"])]),
      recv(discovery_reply(), expect={"state": "running", "emits": [stmt("statement", MISSING_SQL, [])]})],
     note="kinds_for re-reads information_schema once when a queried field is not among the cached kinds (a column added since); the field is still missing, so it is null on every row: isNull true -> TRUE (Rust a_missing_column_is_absent...)")
case("good-query-has-element-on-jsonb-uses-containment",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"filter": {"kind": "hasElement", "field": "tags", "value": "a"}}, "project": "ids"}, warm(), "running",
          [stmt("statement", 'SELECT "id", (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE COALESCE("tags" @> $1::jsonb, FALSE) ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC', ['["a"]'])])])
case("good-query-has-element-on-a-text-column-is-false",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"filter": {"kind": "hasElement", "field": "title", "value": "a"}}, "project": "ids"}, warm(), "running",
          [stmt("statement", 'SELECT "id", (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE FALSE ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC', [])])],
     note="control for the jsonb case")
case("good-query-contains-case-insensitive-and-sensitive",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"filter": {"kind": "any", "of": [
            {"kind": "contains", "field": "title", "text": "Log", "caseSensitive": False},
            {"kind": "not", "of": {"kind": "contains", "field": "title", "text": "x", "caseSensitive": True}}]}}, "project": "ids"}, warm(), "running",
          [stmt("statement", 'SELECT "id", (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE (COALESCE(position(lower($1::text) in lower("title")) > 0, FALSE) OR NOT (COALESCE(position($2::text in "title") > 0, FALSE))) ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC', ["Log", "x"])])])
case("bad-query-type-mismatch-is-unsupported-so-the-kernel-filters-itself",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {"filter": {"kind": "compare", "field": "priority", "op": "==", "value": "abc"}}, "project": "rows"}, warm(), "running",
          [stmt("statement", 'SELECT *, (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE COALESCE("priority" = $1, FALSE) ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC', ["abc"])], nev=None),
      recv(E("22P02", 'invalid input syntax for type integer: "abc"') + Z(), expect={"state": "ready", "emits": [emit("STORE_UNSUPPORTED", key="k", reason="a compared value does not fit its column type")], "neverEmits": ["STORE_FAILED", "ROWS_PAGE"]})],
     note="SQLSTATE 22P02 22007 22008 22003 42883 42804 decline the push-down (Rust returns None). The reason text is NEW: the Rust driver gives none")
case("bad-query-nearest-is-unsupported-before-any-ask",
     [{"event": "ROWS_QUERY", "payload": {"key": "k", "entityType": "Ticket", "query": {"nearest": {"field": "emb", "vector": [0.1], "k": 3}}, "project": "rows"}, "from": "ready", "entity": warm(),
       "expect": {"state": "ready", "emits": [emit("STORE_UNSUPPORTED", key="k", reason="nearest is unsupported by this store")], "effects": [], "neverEmits": ["STORE_FAILED"]}}],
     note="run_query returns None on nearest; reason text NEW")
case("bad-query-server-error-fails-with-the-message",
     [ask("ROWS_QUERY", {"key": "k", "entityType": "Ticket", "query": {}, "project": "ids"}, warm(), "running", [stmt("statement", IDS_SQL, [])], nev=None),
      recv(E("57014", "canceling statement due to statement timeout") + Z(), expect={"emits": [emit("STORE_FAILED", key="k", message="canceling statement due to statement timeout")]})])

# ================= writes =================
def wr(ops, mode="stop"): return {"key": "k", "batch": {"ops": ops, "onFailure": mode}}
CREATE_SQL = 'INSERT INTO "tickets" ("id", "title") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING RETURNING *'
cr_op = {"kind": "create", "entityType": "Ticket", "data": {"id": "t1", "title": "x"}}
created_row = [ "t1", "2026-03-05 10:00:00+00", "2026-03-05 10:00:00+00", "x", None, None, None ]
created_out = {"kind": "created", "row": {"id": "t1", "title": "x", "status": None, "priority": None, "tags": None, "createdAt": "2026-03-05T10:00:00.000Z", "updatedAt": "2026-03-05T10:00:00.000Z"}}
case("good-create-inserts-and-answers-the-returned-row",
     [ask("ROWS_WRITE", wr([cr_op]), warm(), "running", [stmt("statement", CREATE_SQL, ["t1", "x"])]),
      recv(result(TICKET_COLS, [created_row], "INSERT 0 1"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[created_out])]})],
     note="a one-op stop batch: no BEGIN")
case("bad-create-on-a-taken-id-is-duplicate-id-not-an-error",
     [ask("ROWS_WRITE", wr([cr_op]), warm(), "running", [stmt("statement", CREATE_SQL, ["t1", "x"])]),
      recv(result(TICKET_COLS, [], "INSERT 0 0"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "duplicate-id"}])], "neverEmits": ["STORE_FAILED"]})],
     note="ON CONFLICT DO NOTHING returns no row: duplicate-id; the unique-conflict text `Entity .. already exists` belongs to the EntitySource::create path, not this verb")
case("bad-create-without-a-string-id-fails-without-an-ask",
     [{"event": "ROWS_WRITE", "payload": wr([{"kind": "create", "entityType": "Ticket", "data": {"title": "x"}}]), "from": "ready", "entity": warm(),
       "expect": {"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "failed", "message": "create needs a string id"}])], "effects": []}}])
case("bad-create-server-error-is-a-failed-outcome",
     [ask("ROWS_WRITE", wr([cr_op]), warm(), "running", [stmt("statement", CREATE_SQL, ["t1", "x"])], nev=None),
      recv(E("23502", 'null value in column "title" violates not-null constraint') + Z(), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "failed", "message": 'null value in column "title" violates not-null constraint'}])], "neverEmits": ["STORE_FAILED"]})])
case("good-create-with-a-stamp-discovers-kinds-then-writes-the-framework-column",
     [ask("ROWS_WRITE", wr([{"kind": "create", "entityType": "Ticket", "data": {"id": "t1", "title": "x", "createdAt": "2026-01-01T00:00:00.000Z"}}]), WARM_NOSCHEMA, "discovering", [stmt("discover", DISCOVERY_SQL, ["tickets"])]),
      recv(discovery_reply(), expect={"state": "running", "emits": [stmt("statement", 'INSERT INTO "tickets" ("id", "title", "created_at") VALUES ($1, $2, $3) ON CONFLICT ("id") DO NOTHING RETURNING *', ["t1", "x", "2026-01-01T00:00:00.000Z"])]})])
case("good-create-serialises-lists-as-json-and-null-as-sql-null",
     [ask("ROWS_WRITE", wr([{"kind": "create", "entityType": "Ticket", "data": {"id": "t1", "title": None, "tags": ["a"], "priority": 3, "ok": True}}]), warm(), "running",
          [stmt("statement", 'INSERT INTO "tickets" ("id", "title", "tags", "priority", "ok") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("id") DO NOTHING RETURNING *', ["t1", None, '["a"]', "3", "true"])])],
     note="serialize_value: Null -> NULL bind, list/object -> JSON text, number -> js_number_string, bool -> true|false; G-ORB-339: params are a local tagged union {null}|{text}")
UPSERT = {"kind": "upsert", "entityType": "Ticket", "data": {"id": "t1", "title": "x", "createdAt": "2026-01-01T00:00:00.000Z"}}
case("good-upsert-keeps-created-at-refreshes-updated-at-and-defaults-the-rest",
     [ask("ROWS_WRITE", wr([UPSERT]), warm(), "running",
          [stmt("statement", 'INSERT INTO "tickets" ("id", "title", "created_at") VALUES ($1, $2, $3) ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "priority" = DEFAULT, "status" = DEFAULT, "tags" = DEFAULT, "updated_at" = now() RETURNING *, (xmax = 0) AS "__inserted"', ["t1", "x", "2026-01-01T00:00:00.000Z"])]),
      recv(result(TICKET_COLS + [("__inserted", 16)], [created_row + ["t"]], "INSERT 0 1"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[created_out])]})],
     note="every other table column in sorted order: priority, status, tags, updated_at (sorted over the kinds keys, minus id/created/written); __inserted t -> created, f -> updated")
case("good-upsert-over-an-existing-row-is-updated-with-no-before",
     [ask("ROWS_WRITE", wr([UPSERT]), warm(), "running", [stmt("statement", 'INSERT INTO "tickets" ("id", "title", "created_at") VALUES ($1, $2, $3) ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "priority" = DEFAULT, "status" = DEFAULT, "tags" = DEFAULT, "updated_at" = now() RETURNING *, (xmax = 0) AS "__inserted"', ["t1", "x", "2026-01-01T00:00:00.000Z"])]),
      recv(result(TICKET_COLS + [("__inserted", 16)], [created_row + ["f"]], "INSERT 0 1"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "updated", "row": created_out["row"]}])]})])

UPD_GUARD = {"kind": "compare", "field": "priority", "op": ">", "value": 0}
UPD = {"kind": "update", "entityType": "Ticket", "id": "t1", "data": {"title": "x", "tags": ["a"]}, "guard": UPD_GUARD}
UPD_SQL = 'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "tickets" SET "title" = $2, "tags" = $3 WHERE "id" = $1 AND COALESCE("priority" > $4, FALSE) RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"'
UPD_PARAMS = ["t1", "x", '["a"]', "0"]
part_cols = [("__part", TXT)] + TICKET_COLS
before = ["before"] + ticket("t1", "Fix login", "open", 3, '["b"]')
after = ["after"] + ticket("t1", "x", "open", 3, '["a"]')
case("good-guarded-update-is-one-statement-and-answers-row-and-before",
     [ask("ROWS_WRITE", wr([UPD]), warm(), "running", [stmt("statement", UPD_SQL, UPD_PARAMS)]),
      recv(result(part_cols, [before, after], "SELECT 2"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "updated", "row": ticket_row("t1", "x", "open", 3, ["a"]), "before": ticket_row("t1", "Fix login", "open", 3, ["b"])}])]})],
     note="the exact SQL of a_guarded_update_is_one_statement_that_reads_the_pre_image_for_update; __part is removed from the rows")
case("bad-update-of-a-missing-row-is-not-found",
     [ask("ROWS_WRITE", wr([UPD]), warm(), "running", [stmt("statement", UPD_SQL, UPD_PARAMS)]),
      recv(result(part_cols, [], "SELECT 0"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "not-found"}])]})])
case("bad-update-whose-guard-does-not-hold-is-refused",
     [ask("ROWS_WRITE", wr([UPD]), warm(), "running", [stmt("statement", UPD_SQL, UPD_PARAMS)]),
      recv(result(part_cols, [before], "SELECT 1"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "refused"}])]})],
     note="the pre-image exists, the post-image is empty: the guard failed")
case("good-unguarded-update-reports-no-before",
     [ask("ROWS_WRITE", wr([{"kind": "update", "entityType": "Ticket", "id": "t1", "data": {"id": "t9", "title": "x"}}]), warm(), "running",
          [stmt("statement", 'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "tickets" SET "title" = $2 WHERE "id" = $1 RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"', ["t1", "x"])]),
      recv(result(part_cols, [before, after], "SELECT 2"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "updated", "row": ticket_row("t1", "x", "open", 3, ["a"])}])]})],
     note="the data id key is skipped; with no guard before is absent (guarded.map)")
case("good-update-with-empty-data-sets-id-to-itself",
     [ask("ROWS_WRITE", wr([{"kind": "update", "entityType": "Ticket", "id": "t1", "data": {}}]), warm(), "running",
          [stmt("statement", 'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "tickets" SET "id" = "id" WHERE "id" = $1 RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"', ["t1"])])])
UPD_EMPTY = lambda tb: 'WITH "pre" AS (SELECT * FROM "%s" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "%s" SET "id" = "id" WHERE "id" = $1 RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"' % (tb, tb)
case("good-declared-collection-addresses-a-write",
     [ask("ROWS_WRITE", dict(wr([{"kind": "update", "entityType": "Ticket", "id": "t1", "data": {}}]), collections={"Ticket": "support_tickets"}), warm(), "running", [stmt("statement", UPD_EMPTY("support_tickets"), ["t1"])])],
     note="a write batch names the collection per entity type; control below keys by entityType")
case("good-write-without-collections-keys-by-entity-type",
     [ask("ROWS_WRITE", wr([{"kind": "update", "entityType": "Ticket", "id": "t1", "data": {}}]), warm(), "running", [stmt("statement", UPD_EMPTY("tickets"), ["t1"])])])
DEL = {"kind": "delete", "entityType": "Ticket", "id": "t1", "guard": UPD_GUARD}
DEL_SQL = 'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (DELETE FROM "tickets" WHERE "id" = $1 AND COALESCE("priority" > $2, FALSE) RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"'
case("good-atomic-take-is-a-guarded-delete-in-a-one-op-batch-answering-the-before-row",
     [ask("ROWS_WRITE", wr([DEL]), warm(), "running", [stmt("statement", DEL_SQL, ["t1", "0"])]),
      recv(result(part_cols, [before, ["after"] + ticket("t1", "Fix login", "open", 3, '["b"]')], "SELECT 2"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "deleted", "before": ticket_row("t1", "Fix login", "open", 3, ["b"])}])]})],
     note="the take/claim: pre-image FOR UPDATE and the delete in ONE statement, no BEGIN, no second round trip")
case("bad-take-whose-guard-fails-is-refused-and-the-row-stays",
     [ask("ROWS_WRITE", wr([DEL]), warm(), "running", [stmt("statement", DEL_SQL, ["t1", "0"])]),
      recv(result(part_cols, [before], "SELECT 1"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "refused"}])]})])
case("bad-take-of-a-missing-row-is-not-found",
     [ask("ROWS_WRITE", wr([DEL]), warm(), "running", [stmt("statement", DEL_SQL, ["t1", "0"])]),
      recv(result(part_cols, [], "SELECT 0"), expect={"emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "not-found"}])]})])
case("bad-guard-type-mismatch-declines-the-write-as-unsupported",
     [ask("ROWS_WRITE", wr([{"kind": "delete", "entityType": "Ticket", "id": "t1", "guard": {"kind": "compare", "field": "priority", "op": "==", "value": "abc"}}]), warm(), "running",
          [stmt("statement", 'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (DELETE FROM "tickets" WHERE "id" = $1 AND COALESCE("priority" = $2, FALSE) RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"', ["t1", "abc"])], nev=None),
      recv(E("22P02", 'invalid input syntax for type integer: "abc"') + Z(), expect={"emits": [emit("STORE_UNSUPPORTED", key="k", reason="a guard value does not fit its column type")], "neverEmits": ["ROWS_WRITTEN", "STORE_FAILED"]})],
     note="WriteFault::Declined only when the op carries a guard; reason text NEW")

# batches
UPD2 = {"kind": "update", "entityType": "Ticket", "id": "t1", "data": {"title": "y"}}
UPD2_SQL = 'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "tickets" SET "title" = $2 WHERE "id" = $1 RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"'
upd2_after = ["after"] + ticket("t1", "y", "open", 3, '[]')
upd2_before = ["before"] + ticket("t1", "x", None, None, None, created="2026-03-05 10:00:00+00", updated="2026-03-05 10:00:00+00")
BEGIN_OK = nodata("BEGIN", b"T")
case("good-atomic-batch-brackets-the-ops-in-begin-and-commit",
     [ask("ROWS_WRITE", wr([cr_op, UPD2], "atomic"), warm(), "beginning", [stmt("begin", "BEGIN", [])]),
      recv(BEGIN_OK, expect={"state": "running", "emits": [stmt("statement", CREATE_SQL, ["t1", "x"])]}),
      recv(result(TICKET_COLS, [created_row], "INSERT 0 1").replace(Z(), Z(b"T")), expect={"state": "running", "emits": [stmt("statement", UPD2_SQL, ["t1", "y"])]}),
      recv(result(part_cols, [upd2_before, upd2_after], "SELECT 2").replace(Z(), Z(b"T")), expect={"state": "committing", "emits": [stmt("commit", "COMMIT", [])]}),
      recv(nodata("COMMIT"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[created_out, {"kind": "updated", "row": ticket_row("t1", "y", "open", 3, [])}])]})],
     note="BEGIN, each op, COMMIT on the same session; every statement is Parse/Bind/Describe/Execute/Sync")
case("bad-atomic-batch-rolls-back-and-marks-the-earlier-ops-rolled-back",
     [ask("ROWS_WRITE", wr([cr_op, {"kind": "create", "entityType": "Ticket", "data": {"id": "t1", "title": "y"}}], "atomic"), warm(), "beginning", [stmt("begin", "BEGIN", [])]),
      recv(BEGIN_OK, expect={"emits": [stmt("statement", CREATE_SQL, ["t1", "x"])]}),
      recv(result(TICKET_COLS, [created_row], "INSERT 0 1").replace(Z(), Z(b"T")), expect={"emits": [stmt("statement", CREATE_SQL, ["t1", "y"])]}),
      recv(result(TICKET_COLS, [], "INSERT 0 0").replace(Z(), Z(b"T")), expect={"state": "rolling-back", "emits": [stmt("rollback", "ROLLBACK", [])], "neverEmits": ["ROWS_WRITTEN"]}),
      recv(nodata("ROLLBACK"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "rolled-back"}, {"kind": "duplicate-id"}])]})],
     note="earlier ops report rolled-back, the failing op its own outcome, later ops are not run")
case("bad-atomic-batch-server-error-in-an-op-rolls-back-with-a-failed-outcome",
     [ask("ROWS_WRITE", wr([cr_op], "atomic"), warm(), "beginning", [stmt("begin", "BEGIN", [])]),
      recv(BEGIN_OK, expect={"emits": [stmt("statement", CREATE_SQL, ["t1", "x"])]}),
      recv(E("23502", 'null value in column "title" violates not-null constraint') + Z(b"E"), expect={"state": "rolling-back", "emits": [stmt("rollback", "ROLLBACK", [])]}),
      recv(nodata("ROLLBACK"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[{"kind": "failed", "message": 'null value in column "title" violates not-null constraint'}])]})])
case("bad-atomic-batch-begin-refused-fails-the-verb",
     [ask("ROWS_WRITE", wr([cr_op], "atomic"), warm(), "beginning", [stmt("begin", "BEGIN", [])], nev=None),
      recv(E("25006", "cannot execute BEGIN in a read-only transaction") + Z(), expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="cannot execute BEGIN in a read-only transaction")], "neverEmits": ["ROWS_WRITTEN"]})])
case("good-stop-batch-has-no-transaction-and-keeps-what-ran",
     [ask("ROWS_WRITE", wr([cr_op, {"kind": "create", "entityType": "Ticket", "data": {"id": "t1", "title": "y"}}, UPD2], "stop"), warm(), "running", [stmt("statement", CREATE_SQL, ["t1", "x"])]),
      recv(result(TICKET_COLS, [created_row], "INSERT 0 1"), expect={"emits": [stmt("statement", CREATE_SQL, ["t1", "y"])]}),
      recv(result(TICKET_COLS, [], "INSERT 0 0"), expect={"state": "ready", "emits": [emit("ROWS_WRITTEN", key="k", outcomes=[created_out, {"kind": "duplicate-id"}])], "neverEmits": ["STORE_FAILED"]})],
     note="stop: no BEGIN or COMMIT, the first non-applied op ends the run and is reported last; the third op never runs")
case("bad-rekey-is-refused-before-any-ask",
     [{"event": "ROWS_WRITE", "payload": wr([cr_op, {"kind": "rekey", "entityType": "Item", "target": {"kind": "key", "key": "a"}, "newId": "b"}], "atomic"), "from": "ready", "entity": {"id": "f"},
       "expect": {"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="rekey is unsupported by this store")], "effects": [], "neverEmits": ["ROWS_WRITTEN"]}}],
     note="no connection and no successful prefix, cold or warm (Rust rekey_is_refused_before_any_database_request...)")


# ================= extra cases =================
BEGIN_OK = nodata("BEGIN", b"T")
Zt = lambda r: r.replace(Z(), Z(b"T"))


case("x-atomic-create-without-id-rolls-back-with-the-failed-outcome",
   [ask("ROWS_WRITE", wr([{"kind":"create","entityType":"Ticket","data":{"title":"x"}}],"atomic"), warm(), "beginning", [stmt("begin","BEGIN",[])]),
    recv(BEGIN_OK, expect={"emits":[stmt("rollback","ROLLBACK",[])]}),
    recv(nodata("ROLLBACK"), expect={"state":"ready","emits":[emit("ROWS_WRITTEN", key="k", outcomes=[{"kind":"failed","message":"create needs a string id"}])]})])
GD = {"kind":"delete","entityType":"Ticket","id":"t1","guard":{"kind":"compare","field":"priority","op":"==","value":"abc"}}
case("x-atomic-guard-mismatch-rolls-back-then-declines",
   [ask("ROWS_WRITE", wr([GD],"atomic"), warm(), "beginning", [stmt("begin","BEGIN",[])]),
    recv(BEGIN_OK, expect={"state":"running"}),
    recv(E("22P02",'invalid input syntax for type integer: "abc"')+Z(b"E"), expect={"state":"rolling-back","emits":[stmt("rollback","ROLLBACK",[])]}),
    recv(nodata("ROLLBACK"), expect={"state":"ready","emits":[emit("STORE_UNSUPPORTED", key="k", reason="a guard value does not fit its column type")],"neverEmits":["ROWS_WRITTEN","STORE_FAILED"]})])
cr2 = {"kind":"create","entityType":"Ticket","data":{"id":"t2","title":"y"}}
created_row2 = ["t2", "2026-03-05 10:00:00+00", "2026-03-05 10:00:00+00", "y", None, None, None]
created_out2 = {"kind": "created", "row": {"id": "t2", "title": "y", "status": None, "priority": None, "tags": None, "createdAt": "2026-03-05T10:00:00.000Z", "updatedAt": "2026-03-05T10:00:00.000Z"}}
case("x-stop-batch-two-creates-both-applied",
   [ask("ROWS_WRITE", wr([cr_op, cr2],"stop"), warm(), "running", [stmt("statement", CREATE_SQL, ["t1","x"])]),
    recv(result(TICKET_COLS,[created_row],"INSERT 0 1"), expect={"state":"running","emits":[stmt("statement", CREATE_SQL, ["t2","y"])]}),
    recv(result(TICKET_COLS,[created_row2],"INSERT 0 1"), expect={"state":"ready","emits":[emit("ROWS_WRITTEN", key="k", outcomes=[created_out, created_out2])]})])
case("x-atomic-three-creates-commit",
   [ask("ROWS_WRITE", wr([cr_op, cr2, {"kind":"create","entityType":"Ticket","data":{"id":"t3","title":"z"}}],"atomic"), warm(), "beginning", [stmt("begin","BEGIN",[])]),
    recv(BEGIN_OK, expect={"emits":[stmt("statement", CREATE_SQL, ["t1","x"])]}),
    recv(Zt(result(TICKET_COLS,[created_row],"INSERT 0 1")), expect={"emits":[stmt("statement", CREATE_SQL, ["t2","y"])]}),
    recv(Zt(result(TICKET_COLS,[created_row2],"INSERT 0 1")), expect={"emits":[stmt("statement", CREATE_SQL, ["t3","z"])]}),
    recv(Zt(result(TICKET_COLS,[["t3","2026-03-05 10:00:00+00","2026-03-05 10:00:00+00","z",None,None,None]],"INSERT 0 1")), expect={"state":"committing","emits":[stmt("commit","COMMIT",[])]}),
    recv(nodata("COMMIT"), expect={"state":"ready","emits":[emit("ROWS_WRITTEN", key="k", outcomes=[created_out, created_out2, {"kind":"created","row":{"id":"t3","title":"z","status":None,"priority":None,"tags":None,"createdAt":"2026-03-05T10:00:00.000Z","updatedAt":"2026-03-05T10:00:00.000Z"}}])]})])
FILT = {"kind":"compare","field":"status","op":"==","value":"open"}
case("x-query-count-keeps-the-filter-binds",
   [ask("ROWS_QUERY", {"key":"k","entityType":"Ticket","query":{"filter":FILT,"offset":5,"limit":2},"project":"rows"}, warm(), "running",
        [stmt("statement", 'SELECT *, (COUNT(*) OVER ())::int AS "__total" FROM "tickets" WHERE COALESCE("status" = $1, FALSE) ORDER BY "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC LIMIT $2 OFFSET $3', ["open","2","5"])]),
    recv(result(TICKET_COLS+[("__total",23)],[],"SELECT 0"), expect={"state":"running","emits":[stmt("count",'SELECT COUNT(*)::int AS total FROM "tickets" WHERE COALESCE("status" = $1, FALSE)',["open"])],"neverEmits":["ROWS_PAGE"]}),
    recv(result([("total",23)],[["9"]],"SELECT 1"), expect={"state":"ready","emits":[emit("ROWS_PAGE", key="k", rows=[], total=9)]})])
case("x-guarded-update-on-an-unknown-table-discovers-first",
   [ask("ROWS_WRITE", wr([{"kind":"update","entityType":"Ticket","id":"t1","data":{"title":"x"},"guard":{"kind":"compare","field":"priority","op":">","value":0}}]), WARM_NOSCHEMA, "discovering", [stmt("discover", DISCOVERY_SQL, ["tickets"])]),
    recv(discovery_reply(), expect={"state":"running","emits":[stmt("statement",'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "tickets" SET "title" = $2 WHERE "id" = $1 AND COALESCE("priority" > $3, FALSE) RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"',["t1","x","0"])]})])
case("x-stop-batch-second-op-discovers-mid-batch",
   [ask("ROWS_WRITE", wr([cr_op, {"kind":"update","entityType":"Ticket","id":"t1","data":{"title":"y"},"guard":{"kind":"compare","field":"priority","op":">","value":0}}]), WARM_NOSCHEMA, "running", [stmt("statement", CREATE_SQL, ["t1","x"])]),
    recv(result(TICKET_COLS,[created_row],"INSERT 0 1"), expect={"state":"running","emits":[stmt("discover", DISCOVERY_SQL, ["tickets"])]}),
    recv(discovery_reply(), expect={"state":"running","emits":[stmt("statement",'WITH "pre" AS (SELECT * FROM "tickets" WHERE "id" = $1 FOR UPDATE), "post" AS (UPDATE "tickets" SET "title" = $2 WHERE "id" = $1 AND COALESCE("priority" > $3, FALSE) RETURNING *) SELECT \'before\' AS "__part", "pre".* FROM "pre" UNION ALL SELECT \'after\' AS "__part", "post".* FROM "post"',["t1","y","0"])]})])

cols_x=[("id",25),("labels",1009),("scores",1007),("blob",17),("seen",1185),("flag",16),("big",20),("ratio",701),("nested",1007)]
case("x-read-decodes-arrays-bytea-bool-and-floats",
   [ask("ROW_READ", {"key":"k","entityType":"Ticket","id":"t1"}, warm(), "running", [stmt("statement",'SELECT * FROM "tickets" WHERE "id" = $1',["t1"])]),
    recv(result(cols_x,[["t1",'{a,"b c",NULL,"q\\"uote"}','{1,2,NULL}','\\x48656c6c6f','{"2026-03-05 10:00:00+00"}','t','9007199254740993','1.5','{{1,2},{3}}']],"SELECT 1"),
         expect={"state":"ready","emits":[emit("ROW_FOUND", key="k", row={"id":"t1","labels":["a","b c",None,'q"uote'],"scores":[1,2,None],"blob":"SGVsbG8=","seen":["2026-03-05T10:00:00Z"],"flag":True,"big":"9007199254740993","ratio":1.5,"nested":[[1,2],[3]]})]})])

# ================= ensure indexes =================
ENS_P1 = {"fields": ["status"]}
ENS_P2 = {"fields": ["status", "priority"], "orderBy": "title:desc"}
IDX1 = 'CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets" ("status", "created_at" ASC NULLS LAST, "id" COLLATE "C" ASC)'
IDX2 = 'CREATE INDEX IF NOT EXISTS "tickets_status_priority_by_title_desc_idx" ON "tickets" ("status", "priority", "title" COLLATE "C" DESC NULLS LAST, "id" COLLATE "C" ASC)'
IDX3 = 'CREATE INDEX IF NOT EXISTS "tickets_status_by_title_idx" ON "tickets" ("status", "title" COLLATE "C" ASC NULLS LAST, "id" COLLATE "C" ASC)'
def ensure_ask(paths, entity, state, emits, nev=("STORE_FAILED",)):
    return ask("ROWS_ENSURE_INDEXES", {"key": "k", "entityType": "Ticket", "indexes": paths}, entity, state, emits, effects=[{"type": "set"}], nev=nev)
case("good-ensure-creates-one-index-per-path-in-order-then-answers",
     [ensure_ask([ENS_P1, ENS_P2], warm(), "running", [stmt("statement", IDX1, [])]),
      recv(nodata("CREATE INDEX"), expect={"state": "running", "emits": [stmt("statement", IDX2, [])], "neverEmits": ["ROWS_INDEXES_ENSURED", "STORE_FAILED"]}),
      recv(nodata("CREATE INDEX"), expect={"state": "ready", "emits": [emit("ROWS_INDEXES_ENSURED", key="k")], "neverEmits": ["STORE_FAILED"]})],
     note="path = equality fields, the order column (default createdAt) with the C collation and NULLS LAST the query uses, then id; the name is table_fields[_by_orderfield_dir]_idx so two paths over the same fields never share a name")
case("good-ensure-reads-the-column-kinds-first-when-they-are-not-cached",
     [ensure_ask([ENS_P1], WARM_NOSCHEMA, "running", [stmt("discover", DISCOVERY_SQL, ["tickets"])]),
      recv(discovery_reply(), expect={"state": "running", "emits": [stmt("statement", IDX1, [])]}),
      recv(nodata("CREATE INDEX"), expect={"state": "ready", "emits": [emit("ROWS_INDEXES_ENSURED", key="k")], "neverEmits": ["STORE_FAILED"]})],
     note="the schema-cache read that every query uses; control: the cached case above sends no discovery")
case("good-ensure-order-by-without-a-direction-is-ascending",
     [ensure_ask([{"fields": ["status"], "orderBy": "title"}], warm(), "running", [stmt("statement", IDX3, [])]),
      recv(nodata("CREATE INDEX"), expect={"state": "ready", "emits": [emit("ROWS_INDEXES_ENSURED", key="k")]})])
case("good-ensure-with-no-paths-answers-at-once",
     [{"event": "ROWS_ENSURE_INDEXES", "payload": {"key": "k", "entityType": "Ticket", "indexes": []}, "from": "ready", "entity": warm(),
       "expect": {"state": "ready", "emits": [emit("ROWS_INDEXES_ENSURED", key="k")], "neverEmits": ["STORE_FAILED"]}}],
     note="control: no statement is sent")
case("bad-ensure-path-naming-a-missing-column-fails-without-creating-anything",
     [ensure_ask([{"fields": ["nope"]}], warm(), "running", [stmt("discover", DISCOVERY_SQL, ["tickets"])]),
      recv(discovery_reply(), expect={"state": "running", "emits": [emit("STORE_FAILED", key="k", message="an index path names a column the table does not have")], "neverEmits": ["ROWS_INDEXES_ENSURED"]})],
     note="the column kinds are read once more because the cache does not know the field; the table has no such column, so no CREATE INDEX is sent")
case("bad-ensure-server-error-is-store-failed",
     [ensure_ask([ENS_P1], warm(), "running", [stmt("statement", IDX1, [])]),
      recv(PARSE_BIND[:0] + E("42501", "must be owner of table tickets") + Z(), expect={"state": "ready", "emits": [emit("STORE_FAILED", key="k", message="must be owner of table tickets")], "neverEmits": ["ROWS_INDEXES_ENSURED"]})])
case("good-cold-ensure-connects-first",
     [{"event": "ROWS_ENSURE_INDEXES", "payload": {"key": "k", "entityType": "Ticket", "indexes": [ENS_P1]}, "from": "ready", "entity": {"id": "f"},
       "expect": {"state": "connecting", "effects": [{"type": "os/tcp-connect", "arg0": HOST, "arg1": PORT}], "neverEmits": ["STORE_FAILED", "ROWS_INDEXES_ENSURED"]}}])
case("good-rows-are-unchanged-by-an-ensure-the-read-after-it-answers-the-same-row",
     [ensure_ask([ENS_P1], warm(), "running", [stmt("statement", IDX1, [])]),
      recv(nodata("CREATE INDEX"), expect={"state": "ready", "emits": [emit("ROWS_INDEXES_ENSURED", key="k")]}),
      ask("ROW_READ", {"key": "k2", "entityType": "Ticket", "id": "t1"}, warm(), "running", [stmt("statement", READ_SQL, ["t1"])]),
      recv(result(TICKET_COLS, [r1], "SELECT 1"), expect={"state": "ready", "emits": [emit("ROW_FOUND", key="k2", row=ticket_row("t1", "Fix login", "open", 3, ["a", "b"]))]})],
     note="pair of the read case: same SQL, same row; an index changes cost, never a result")

# ---- recorded against a real Postgres 16 (record_real.py: docker postgres:16, role app / secret, table tickets seeded with t1)
REAL = json.load(open(pathlib.Path(__file__).resolve().parent / "real-pg16.json"))
rb = lambda k: base64.b64decode(REAL[k])
case("good-real-postgres-16-scram-login-and-read-recorded-from-the-server",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      connect(),
      recv(rb("sslAnswer"), expect={"state": "startup", "emits": [wire("startup", "", [], rb("startup"))], "neverEmits": ["STORE_FAILED"]}),
      recv(rb("list"), expect={"state": "drawing", "effects": [{"type": "let"}]}),
      {"event": "PG_NONCE_DRAWN", "payload": {"value": NONCE}, "from": "drawing",
       "expect": {"state": "startup", "emits": [wire("scram-first", "", [], rb("scramFirst"))]}},
      recv(rb("serverFirst"), expect={"state": "startup", "emits": [wire("scram-final", "", [], rb("scramFinal"))]}),
      recv(rb("login"), expect={"state": "running", "emits": [wire("statement", READ_SQL, ["t1"], rb("stageFrame"))], "neverEmits": ["STORE_FAILED"]}),
      ],
     note="every server byte here was produced by a real Postgres 16 (SCRAM-SHA-256 server-first with its own salt and nonce, the login tail with its parameter statuses, the statement reply); the atom's startup (with the options pair), SCRAM proof and statement frames were sent to that server and accepted")
case("good-real-postgres-16-row-decode-recorded-from-the-server",
     [{"event": "ROW_READ", "payload": {"key": "k", "entityType": "Ticket", "id": "t1"}, "from": "ready", "entity": {"id": "f"}},
      connect(),
      recv(rb("sslAnswer")), recv(rb("list")),
      {"event": "PG_NONCE_DRAWN", "payload": {"value": NONCE}, "from": "drawing"},
      recv(rb("serverFirst")), recv(rb("login")),
      recv(rb("stageReply"), expect={"emits": [emit("ROW_FOUND", key="k", row=ticket_row("t1", "Fix login", "open", 3, ["a", "b"]))], "neverEmits": ["STORE_FAILED"]})],
     note="the statement reply a real Postgres 16 sent for the seeded ticket")

# ---- ROWS_SQL on a real Postgres 16 (record_real_sql.py): one held session, five statements
SQLREC = json.load(open(pathlib.Path(__file__).resolve().parent / "real-sql-pg16.json"))
sb = lambda k: base64.b64decode(SQLREC[k])
def sql_wire(st): return {"event": "PG_WIRE_SENT", "payload": {"stage": "statement", "sql": st["wireSql"], "params": st["wireParams"], "frame": st["frame"]}}
def sql_ask(i, st): return {"event": "ROWS_SQL", "payload": {"key": "k%d" % i, "sql": st["sql"], "params": st["params"]}}
sql_steps = []
for i, st in enumerate(SQLREC["statements"]):
    reply = {"event": "PG_RECEIVED", "payload": {"data": st["reply"], "eof": False}, "expect": {"state": "ready", "emits": [{"event": st["emit"], "payload": st["payload"]}]}}
    if i == 0:
        sql_steps += [dict(sql_ask(i, st), **{"from": "ready", "entity": {"id": "f"}}),
                      connect(),
                      recv(sb("sslAnswer"), expect={"state": "startup", "emits": [wire("startup", "", [], sb("startup"))], "neverEmits": ["STORE_FAILED"]}),
                      recv(sb("list"), expect={"state": "drawing", "effects": [{"type": "let"}]}),
                      {"event": "PG_NONCE_DRAWN", "payload": {"value": NONCE}, "from": "drawing", "expect": {"state": "startup", "emits": [wire("scram-first", "", [], sb("scramFirst"))]}},
                      recv(sb("serverFirst"), expect={"state": "startup", "emits": [wire("scram-final", "", [], sb("scramFinal"))]}),
                      recv(sb("login"), expect={"state": "running", "emits": [sql_wire(st)], "neverEmits": ["STORE_FAILED"]}),
                      reply]
    else:
        sql_steps += [dict(sql_ask(i, st), **{"from": "ready", "expect": {"state": "running", "emits": [sql_wire(st)], "neverEmits": ["STORE_FAILED"]}}), reply]
case("good-real-postgres-16-rows-sql-answers-rows-count-columns-and-the-server-error",
     sql_steps,
     note="ROWS_SQL on one held session against a real Postgres 16: a parameterised read (jsonb stays text, timestamptz is UTC ISO), the scalar types (null, bool, float, int8 past 2^53 as text, jsonb as text, int[], bytea as base64, numeric as text), an empty result with its column, a text[] bind sent as an array literal, and a server error with its SQLSTATE")
doc = {"atom": "spec/store/row-store-postgres-fixture.lolo", "trait": "RowStoreDriver",
       "spec": "spec/store/row-store-postgres.lolo",
       "source": "orbital-rust/crates/orbital-core/crates/runtime/src/stores/pg_rows.rs over drivers/postgres.rs (behavior and tests)",
       "note": "Replay goldens feed the os reply events the kernel would route (PG_CONNECTED, PG_RECEIVED with the server bytes as base64, PG_NONCE_DRAWN) and assert state, emits and the effects' types. Effect arguments are compared evaluated; the exact bytes the driver writes are asserted through the spec's PG_WIRE_SENT diagnostic emit (stage, sql, params, frame = base64 of the whole send). Server answers are hand-built Postgres v3 messages (cross-checked against fixtures/postgres/*.json); the SCRAM server-first is the recorded scram-wrong-password-fails one. Cases marked skip need the server's answer frames scripted. The Rust twin (`pg_rows.rs`) is archived under `archive/orbital-rust/`; each id's `source` names the Rust unit/live test it once mirrored.",
       "cases": cases}
json.dump(doc, open(OUT, "w"), indent=1)
open(OUT, "a").write("\n")
print(len(cases), "cases")
