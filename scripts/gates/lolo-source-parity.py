import json
import os
import sys


def load(path):
    with open(path) as f:
        return json.load(f)


def norm(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, float) and v == v and v not in (float("inf"), float("-inf")) and v == int(v):
        return int(v)
    if isinstance(v, list):
        return [norm(x) for x in v]
    if isinstance(v, dict):
        return {k: norm(x) for k, x in v.items()}
    return v


def canon(v):
    return json.dumps(norm(v), sort_keys=True, separators=(",", ":"))


def kernel_lines(goldens):
    out = []
    for i, step in enumerate(load(goldens)["cases"][0]["steps"]):
        for e in step["expect"]["emits"]:
            out.append(canon({"step": i, "event": e["event"], "payload": e["payload"]}))
    return out


def cmd_text(goldens, case, out):
    for c in load(goldens)["cases"]:
        if c["id"] == case:
            text = c["steps"][0]["expect"]["emits"][0]["payload"]["text"]
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "w") as f:
                f.write(text)
            return 0
    print("no case " + case + " in " + goldens)
    return 1


def cmd_events(goldens, events):
    want = [(s["event"], canon(s["payload"])) for s in load(goldens)["cases"][0]["steps"]]
    got = [(s["event"], canon(s["payload"])) for s in load(events)["steps"]]
    if want != got:
        print("event script differs from the kernel goldens' steps")
        return 1
    return 0


def cmd_compare(goldens, actual):
    want = kernel_lines(goldens)
    got = []
    with open(actual) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    got.append(canon(json.loads(line)))
                except ValueError:
                    print("  not JSON: " + line)
                    return 1
    if want == got:
        return 0
    for i in range(max(len(want), len(got))):
        w = want[i] if i < len(want) else "<missing>"
        g = got[i] if i < len(got) else "<missing>"
        if w != g:
            print("  kernel: " + w)
            print("  shell : " + g)
    return 1


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    sys.exit({"text": cmd_text, "events": cmd_events, "compare": cmd_compare}[cmd](*args))
