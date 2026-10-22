import base64
import json
import os
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
ATOM = Path(os.environ.get("X509_ATOM", str(ROOT / "behaviors/lolo/codec/atoms/std-x509.lolo")))
ORB = os.environ.get("ORB_BIN", str(Path.home() / "bin/orb"))


def parse(pem):
    result = subprocess.run(
        [ORB, "execute", str(ATOM), "--trait", "X509Parse", "--event", "X509_PARSE",
         "--payload", json.dumps({"pem": pem}), "--cascade", "--json"],
        capture_output=True, text=True, check=True,
    )
    wire = json.loads(result.stdout)
    assert wire["success"], wire
    outcomes = wire["outcomes"]
    assert all(not item["failure"] for item in outcomes), outcomes
    answers = [answer for item in outcomes for answer in item["emits"]
               if answer["event"] in {"X509_PARSED", "X509_REFUSED"}]
    assert len(answers) == 1, answers
    return answers[0]


def pem(data):
    return "-----BEGIN CERTIFICATE-----\n" + base64.b64encode(data).decode() + "\n-----END CERTIFICATE-----\n"


def tlv(tag, data):
    size = len(data)
    length = bytes([size]) if size < 128 else bytes([0x81, size]) if size < 256 else bytes([0x82]) + size.to_bytes(2, "big")
    return bytes([tag]) + length + data


def public_key_prefix(modulus):
    algorithm = tlv(0x30, bytes.fromhex("06092a864886f70d0101010500"))
    rsa = tlv(0x30, tlv(2, b"\x00" + modulus) + tlv(2, b"\x01\x00\x01"))
    spki = tlv(0x30, algorithm + tlv(3, b"\x00" + rsa))
    skipped = tlv(2, b"\x01") + algorithm + tlv(0x30, b"") * 3
    return tlv(0x30, tlv(0x30, skipped + spki))


goldens = json.loads((ROOT / "behaviors/lolo/spec/codec/x509.goldens.json").read_text())
for case in goldens["cases"]:
    expected = case["steps"][-1]["expect"]["emits"][0]
    actual = parse(case["steps"][0]["payload"]["pem"])
    assert actual == expected, (case["id"], actual, expected)
    print("PASS", case["id"], flush=True)

for size, form in [(16, "short"), (128, "one-byte long"), (256, "two-byte long")]:
    modulus = b"\x80" + b"\x01" * (size - 1)
    answer = parse(pem(public_key_prefix(modulus)))
    assert answer == {"event": "X509_PARSED", "payload": {
        "n": base64.b64encode(modulus).decode(), "e": "AQAB"}}, (form, answer)
    print("PASS", form, "DER lengths", flush=True)

prefix = public_key_prefix(b"\x80" + b"\x01" * 15)
for name, data in [
    ("indefinite length", b"\x30\x80\x00\x00"),
    ("indefinite certificate containing a valid RSA key", b"\x30\x80" + prefix[2:] + b"\x00\x00"),
    ("truncated one-byte length", b"\x30\x81"),
    ("truncated two-byte length", b"\x30\x82\x01"),
    ("content beyond input", b"\x30\x03\x00"),
    ("overstated certificate containing a valid RSA key", prefix[:1] + bytes([prefix[1] + 1]) + prefix[2:]),
    ("unsupported three-byte length", b"\x30\x83\x00\x00\x01\x00"),
]:
    answer = parse(pem(data))
    assert answer == {"event": "X509_REFUSED", "payload": {"reason": "der"}}, (name, answer)
    print("PASS", name, flush=True)
