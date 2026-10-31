import base64
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time


ROOT = Path(__file__).resolve().parents[1]
ORB = os.environ.get("ORB_BIN", str(Path.home() / "bin/orb"))
GOLDENS = json.loads((ROOT / "behaviors/lolo/spec/auth/bearer-tokens.goldens.json").read_text())


def run(*args):
    process = subprocess.run([ORB, *args], capture_output=True, text=True, check=True)
    return json.loads(process.stdout)


def emitted(wire, event):
    assert wire["success"], wire
    outcomes = wire.get("outcomes", []) or [item for step in wire["steps"] for item in step["outcomes"]]
    assert all(not item["failure"] for item in outcomes), outcomes
    return [answer["payload"] for item in outcomes for answer in item["emits"] if answer["event"] == event]


def bearer(keys_format, body, parsed=()):
    source = f'''app bearer-key-probe [egress: ["https://www.googleapis.com"]]
uses B from "std/behaviors/std-bearer-verify"
orbital Probe {{
  entity Row [runtime] {{ id:string! }}
  trait Check = B.traits.BearerVerifier {{ config {{ keysFormat:"{keys_format}" }} }}
}}
'''
    steps = [{"trait": "Check", "event": "JWKS_REPLIED", "from": "fetching",
              "payload": {"status": 200, "body": json.dumps(body), "headers": {}}}]
    steps += [{"trait": "Check", "event": "X509_PARSED", "payload": key} for key in parsed]
    with tempfile.NamedTemporaryFile("w", suffix=".lolo") as fixture:
        fixture.write(source)
        fixture.flush()
        wire = run("execute", fixture.name, "--steps", json.dumps(steps), "--json")
    answers = emitted(wire, "BEARER_CHECK")
    assert len(answers) == 1, answers
    return wire["steps"][-1]["entities"]["Check"]["keys"]


def padded(url):
    return base64.b64encode(base64.urlsafe_b64decode(url + "=" * (-len(url) % 4))).decode()


binary = ["bytes/slice", ["bytes/from-string", "ÿ"], 0, 1]
assert run("evaluate", json.dumps(["str/template", "{{value}}", {"value": binary}]), "--output", "json") == "ww=="
print("PASS explicit formatter preserves non-UTF8 byte base64", flush=True)
invalid_utf8 = subprocess.run([ORB, "evaluate", json.dumps(["bytes/to-string", binary]), "--output", "json"], capture_output=True, text=True)
assert invalid_utf8.returncode != 0 and "UTF-8" in invalid_utf8.stderr, invalid_utf8
print("PASS UTF8 decoding is a distinct refusing operation", flush=True)

kid, cert = next(iter(GOLDENS["firebase"]["certs"].items()))
wire = run("execute", str(ROOT / "behaviors/lolo/codec/atoms/std-x509.lolo"), "--trait", "X509Parse",
           "--event", "X509_PARSE", "--payload", json.dumps({"pem": cert}), "--cascade", "--json")
parsed = emitted(wire, "X509_PARSED")[0]
expected = {"kty": "RSA", "alg": "RS256", "use": "sig", "kid": kid,
            **{name: base64.urlsafe_b64encode(base64.b64decode(value)).decode().rstrip("=") for name, value in parsed.items()}}
cache = bearer("x509", {kid: cert}, [parsed])
assert cache == [expected], cache
key = cache[0]
assert all(base64.urlsafe_b64decode(key[name] + "=" * (-len(key[name]) % 4)) == base64.b64decode(parsed[name]) for name in ["n", "e"])
print("PASS real RSA certificate becomes exact base64url JWK", flush=True)

cache = bearer("x509", {kid: cert, "second": cert}, [parsed, parsed])
assert cache == [expected, {**expected, "kid": "second"}], cache
print("PASS multiple certificate accumulation preserves both keys", flush=True)

for original in GOLDENS["oidc"]["jwks"]["keys"]:
    cache = bearer("jwks", {"keys": [original]})
    assert cache == [original], (cache, original)
    print("PASS", "RSA" if original["kty"] == "RSA" else "EC", "JWKS key reaches jws/verify unchanged", flush=True)
