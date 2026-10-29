import json, os
HERE = os.path.dirname(os.path.abspath(__file__))


def real_case():
    rec = json.load(open(os.path.join(HERE, "real-redis7.json")))
    run = lambda k, *argv: {"event": "RESP_RUN", "payload": {"key": k, "argv": list(argv)}}
    steps = [dict(run("a", "GET", "x"), expect={"state": "connecting"}),
             dict(run("b", "INCRBY", "n", "7"), expect={"state": "connecting", "effects": []}),
             {"event": "RESP_CONNECTED", "payload": {"sock": 3}, "expect": {"state": "open", "emits": [{"event": "RESP_WIRE_SENT", "payload": {"key": "a", "stage": "command", "bytes": rec["send"]}}]}},
             {"event": "RESP_SENT", "payload": {"bytes": 62}, "expect": {"state": "open"}},
             {"event": "RESP_READ", "payload": {"data": rec["reads"][0], "eof": False, "key": "read3"},
              "expect": {"emits": [{"event": "RESP_REPLIED", "payload": {"key": "a", "kind": "bulk", "text": "v1"}}, {"event": "RESP_REPLIED", "payload": {"key": "b", "kind": "int", "text": "7"}}], "neverEmits": ["RESP_FAILED"]}}]
    return {"id": "good-real-redis-7-two-overlapping-keys-pipelined-on-one-connection", "note": "recorded by record_real_redis.py against redis:7: both commands are written in one send, and the server's one read carries both replies, matched to the keys in write order", "steps": steps}
