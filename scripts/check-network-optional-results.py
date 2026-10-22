import base64
import gzip
import json
import os
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
ORB = os.environ.get("ORB_BIN", str(Path.home() / "bin/orb"))


def execute(path, trait, event, payload, prepare_request=False):
    command = [ORB, "execute", str(ROOT / "behaviors/lolo" / path),
               "--trait", trait, "--event", event, "--payload", json.dumps(payload),
               "--cascade", "--json"]
    if prepare_request:
        steps = [{"trait": trait, "event": "REQUEST_RECEIVED", "payload": {
            "requestId": 17, "method": "POST", "path": "/api/orbitals/Probe/events",
            "query": "stream=true", "headers": {}, "body": "e30=", "peer": "127.0.0.1:1"}},
                 {"trait": trait, "event": event, "payload": payload}]
        command = [ORB, "execute", str(ROOT / "behaviors/lolo" / path),
                   "--steps", json.dumps(steps), "--json"]
    wire = json.loads(subprocess.run(command, capture_output=True, text=True, check=True).stdout)
    assert wire["success"], wire
    assert all(not outcome["failure"] for step in wire["steps"] for outcome in step["outcomes"]), wire
    outcomes = wire["steps"][-1]["outcomes"]
    return [item for outcome in outcomes for item in outcome["emits"]]


raw = b"native gzip payload\x00\xff"
encoded = base64.b64encode(raw).decode()
packed = base64.b64encode(gzip.compress(raw, mtime=0)).decode()
answers = execute("codec/atoms/std-gzip.lolo", "Gunzip", "GZIP", {"data": encoded})
compressed = next(item["payload"] for item in answers if item["event"] == "GZIP_ANSWERED")
assert gzip.decompress(base64.b64decode(compressed["data"])) == raw
assert compressed["size"] == len(raw)
print("PASS gzip compression preserves exact binary payload", flush=True)

for label, payload, expected_event, expected in [
    ("success", {"data": packed}, "GUNZIP_ANSWERED", encoded),
    ("empty success", {"data": base64.b64encode(gzip.compress(b"", mtime=0)).decode()}, "GUNZIP_ANSWERED", ""),
    ("invalid magic", {"data": base64.b64encode(b"not a gzip member at all").decode()}, "GZIP_REFUSED", "magic"),
    ("output cap", {"data": packed, "maxBytes": 1}, "GZIP_REFUSED", "output-limit"),
]:
    answers = execute("codec/atoms/std-gzip.lolo", "Gunzip", "GUNZIP", payload)
    answer = next(item["payload"] for item in answers if item["event"] == expected_event)
    assert answer["data" if expected_event == "GUNZIP_ANSWERED" else "reason"] == expected, answers
    print(f"PASS gunzip {label}", flush=True)

for label, result in [("ordered items", {"items": [{"type": "first"}, {"type": "complete"}]}),
                      ("empty items", {"items": []}), ("missing items", {})]:
    answers = execute("net/atoms/std-http-dispatch.lolo", "ServerDispatch", "DISPATCH_ANSWERED",
                      {"key": "dispatch-17", "result": result}, prepare_request=True)
    assert [item["payload"]["requestId"] for item in answers if item["event"] == "SSE_OPEN"] == [17], answers
    frames = [json.loads(item["payload"]["data"]) for item in answers if item["event"] == "SSE_SEND"]
    if "items" in result:
        assert frames == result["items"], answers
    else:
        assert len(frames) == 1 and frames[0]["type"] == "error", answers
        assert frames[0]["data"]["message"] == "Streamed dispatch response is missing items", answers
    assert [item["payload"]["requestId"] for item in answers if item["event"] == "SSE_CLOSE"] == [17], answers
    print(f"PASS streamed dispatch {label}", flush=True)
