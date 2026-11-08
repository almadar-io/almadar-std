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
        return {k: norm(x) for k, x in v.items() if x is not None}
    return v


def canon(v):
    return json.dumps(norm(v), sort_keys=True, separators=(",", ":"))


def kernel_lines(goldens):
    out = []
    for i, step in enumerate(load(goldens)["cases"][0]["steps"]):
        for e in step["expect"].get("exactEmits", step["expect"].get("emits", [])):
            out.append(canon({"step": i, "event": e["event"], "payload": e["payload"]}))
        if "entity" in step["expect"]:
            out.append(canon({"step": i, "entity": step["expect"]["entity"]}))
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
                    row = json.loads(line)
                    if isinstance(row, dict) and isinstance(row.get("entity"), dict) and len(got) < len(want):
                        pinned = json.loads(want[len(got)]).get("entity")
                        if isinstance(pinned, dict):
                            row["entity"] = {k: row["entity"][k] for k in pinned if k in row["entity"]}
                    got.append(canon(row))
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


LIVE_ATOMS = {
    "python": ("std-lolo-python", "LoloPython", "PYTHON"),
    "typescript": ("std-lolo-typescript", "LoloTypescript", "TYPESCRIPT"),
    "rust": ("std-lolo-rust", "LoloRust", "RUST"),
    "swift": ("std-lolo-swift", "LoloSwift", "SWIFT"),
    "kotlin": ("std-lolo-kotlin", "LoloKotlin", "KOTLIN"),
}

DRIVE = """app drive-%(lang)s [
  version: "1.0.0",
  stdio: [out]
]
orbital DriveOrbital [fs: { cwd: "**": [read] }] {
  uses R from "std/behaviors/%(atom)s"
  entity DriveRun [runtime] {
    id : string!
  }
  trait DriveR = R.traits.%(trait)s {
    listens {
      Drive.LOLO_TO_%(up)s -> LOLO_TO_%(up)s
    }
  }
  trait Drive -> DriveRun [optimistic] {
    initial: s
    state s {
      INIT -> s
        (os/read-file { anchor: "cwd" path: %(rel)s } { key: "src" emit: { success: SRC_READ, failure: R_FAILED } })
      SRC_READ -> s
        (emit LOLO_TO_%(up)s { path: %(abs)s, source: (bytes/to-string @payload.data)%(only)s })
      R_DONE -> s
        (os/stdout-write (bytes/from-string (str/concat (json/stringify { text: @payload.text, warnings: @payload.warnings }) "\\n")))
      R_FAILED -> s
        (os/stdout-write (bytes/from-string (str/concat (json/stringify { error: (default @payload.error "") }) "\\n")))
    }
    emits {
      LOLO_TO_%(up)s -> external { source : string!  path : string?  orbitals : [string]? }
    }
    listens {
      SRC_READ { data : bytes! }
      R_DONE { text : string!  warnings : [string]! }
      DriveR.%(up)s_RENDERED -> R_DONE
      R_FAILED { error : string }
      DriveR.%(up)s_RENDER_FAILED -> R_FAILED
    }
  }
  page boot as DriveStart -> Drive, DriveR
}
"""


def cmd_drive(lang, root, rel, out, orbitals=""):
    atom, trait, up = LIVE_ATOMS[lang]
    names = [n for n in orbitals.split(",") if n]
    only = (", orbitals: [" + ", ".join(json.dumps(n) for n in names) + "]") if names else ""
    with open(out, "w") as f:
        f.write(DRIVE % {"lang": lang, "atom": atom, "trait": trait, "up": up, "only": only,
                         "rel": json.dumps(rel), "abs": json.dumps(os.path.join(root, rel))})
    return 0


def cmd_live(answer, out):
    lines = [l for l in open(answer).read().splitlines() if l.startswith("{")]
    if not lines:
        print("  the renderer answered nothing")
        return 1
    got = json.loads(lines[-1])
    if "error" in got:
        print("  render failed: " + got["error"])
        return 1
    if got["warnings"]:
        print("  render warnings: " + json.dumps(got["warnings"]))
        return 1
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        f.write(got["text"])
    return 0


def cmd_examples(manifest):
    for e in load(manifest)["examples"]:
        print(e["name"])
    return 0


def cmd_example(manifest, name, key):
    for e in load(manifest)["examples"]:
        if e["name"] == name:
            value = e.get(key, [] if key == "orbitals" else "")
            print(",".join(value) if key == "orbitals" else value)
            return 0
    print("no example " + name + " in " + manifest, file=sys.stderr)
    return 1


TEMPLATE_KNOBS = ("operators", "unary", "infix", "lambdaOperators", "callees")


def in_scope(families, table):
    scope, bare, structural = set(families["inScope"]), set(families["inScopeBare"]), set(families["structural"])
    pure = (name for name, op in table["operators"].items() if not op.get("hasSideEffects"))
    return sorted(n for n in pure if n not in structural and (n in bare or ("/" in n and n.split("/")[0] in scope)))


def templated(resolved):
    program = resolved.get("program", resolved)
    for orbital in program["orbitals"]:
        for trait in orbital["traits"]:
            config = trait.get("config") or {}
            if "operators" in config:
                return {key.split("#")[0] for knob in TEMPLATE_KNOBS for key in (config.get(knob) or {}).get("default", {})}
    raise SystemExit("the resolved atom composes no renderer config")


def cmd_coverage(families, table, *resolved_atoms):
    scope = in_scope(load(families), load(table))
    missing = 0
    for pair in resolved_atoms:
        lang, path = pair.split("=", 1)
        have = templated(load(path))
        gaps = [n for n in scope if n not in have]
        missing += len(gaps)
        print("%s %d/%d%s" % (lang, len(scope) - len(gaps), len(scope), (": " + " ".join(gaps)) if gaps else ""))
    return 1 if missing else 0


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    sys.exit({"text": cmd_text, "events": cmd_events, "compare": cmd_compare, "drive": cmd_drive, "live": cmd_live, "examples": cmd_examples, "example": cmd_example, "coverage": cmd_coverage}[cmd](*args))
