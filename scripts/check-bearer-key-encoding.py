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
    answers = emitted(wire, "JWS_VERIFY")
    assert len(answers) == 1, answers
    return answers[0]["jwk"], wire["steps"][-1]["entities"]["Check"]["keys"]


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
key, cache = bearer("x509", {kid: cert}, [parsed])
assert key == expected and cache == [expected], (key, cache)
assert all(base64.urlsafe_b64decode(key[name] + "=" * (-len(key[name]) % 4)) == base64.b64decode(parsed[name]) for name in ["n", "e"])
print("PASS real RSA certificate becomes exact base64url JWK", flush=True)

_, cache = bearer("x509", {kid: cert, "second": cert}, [parsed, parsed])
assert cache == [expected, {**expected, "kid": "second"}], cache
print("PASS multiple certificate accumulation preserves both keys", flush=True)

for original in GOLDENS["oidc"]["jwks"]["keys"]:
    key, cache = bearer("jwks", {"keys": [original]})
    assert key == original and cache == [original], (key, original)
    algorithm = "RS256" if original["kty"] == "RSA" else "ES256"
    case = next(case for case in GOLDENS["oidc"]["cases"] if case["expect"].get("ok")
                and json.loads(base64.urlsafe_b64decode(case["token"].split(".")[0] + "=="))["alg"] == algorithm)
    wire = run("execute", str(ROOT / "behaviors/lolo/auth/atoms/std-jws.lolo"), "--trait", "JwsVerifier",
               "--event", "JWS_VERIFY", "--payload", json.dumps({"token": case["token"], "jwk": key}), "--cascade", "--json")
    event, fields = ("JWS_RSA_VERIFY", ["n", "e"]) if algorithm == "RS256" else ("JWS_EC_VERIFY", ["x", "y"])
    request = emitted(wire, event)[0]
    assert all(request[field] == padded(original[field]) for field in fields), request
    print("PASS", algorithm, "JWKS and downstream binary key conversion", flush=True)
    if algorithm == "ES256":
        for valid in [True, False]:
            payload = dict(request)
            if not valid:
                signature = bytearray(base64.b64decode(payload["signature"]))
                signature[-1] ^= 1
                payload["signature"] = base64.b64encode(signature).decode()
            print("RUN real ES256 signature", "valid" if valid else "altered", flush=True)
            wire = run("execute", str(ROOT / "behaviors/lolo/auth/atoms/std-ecdsa.lolo"), "--trait", "EcdsaVerifier",
                       "--event", "ECDSA_VERIFY", "--payload", json.dumps(payload), "--cascade", "--json")
            assert emitted(wire, "ECDSA_VERIFIED") == [{"valid": valid}], wire
            print("PASS real ES256 signature", "valid" if valid else "altered", flush=True)

now = int(time.time())
minimal = {"iss": "", "sub": "subject", "aud": "", "exp": now + 3600}
for name, claims, expected in [
    ("optional dates and extra map omitted", minimal, None),
    ("missing expiration", {key: value for key, value in minimal.items() if key != "exp"}, "malformed"),
    ("expired token", {**minimal, "exp": now - 3600}, "expired"),
    ("future not-before", {**minimal, "nbf": now + 3600}, "not-yet-valid"),
    ("future issued-at", {**minimal, "iat": now + 3600}, "issued-in-future"),
]:
    steps = [{"trait": "BearerVerifier", "event": "JWS_VERIFIED", "from": "verifying",
              "payload": {"header": {}, "payload": claims}}]
    wire = run("execute", str(ROOT / "behaviors/lolo/auth/atoms/std-bearer-verify.lolo"), "--steps", json.dumps(steps), "--json")
    if expected is None:
        answer = emitted(wire, "BEARER_VERIFIED")
        assert len(answer) == 1 and answer[0]["viewer"]["id"] == "subject" and answer[0]["viewer"]["claims"] == [], answer
    else:
        answer = emitted(wire, "BEARER_REFUSED")
        assert len(answer) == 1 and answer[0]["reason"] == expected, answer
    print("PASS", name, flush=True)
