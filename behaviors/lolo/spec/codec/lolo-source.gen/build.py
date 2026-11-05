import sys, json
from expand import expand
from knobs import KNOBS

def lit(v):
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, str):
        assert not v.startswith("@")
        return json.dumps(v, ensure_ascii=True)
    if isinstance(v, list): return "[" + ", ".join(lit(x) for x in v) + "]"
    if isinstance(v, dict): return "{ " + ", ".join(f"{json.dumps(k, ensure_ascii=True)}: {lit(x)}" for k, x in v.items()) + " }"
    raise TypeError(v)

def knob_block(overrides=None, indent="      "):
    overrides = overrides or {}
    out = []
    for name, ty, default, tier, label, desc in KNOBS:
        val = overrides.get(name, default)
        out.append(f'{indent}{name} : {ty} = {lit(val)}\n{indent}  @label {json.dumps(label)}\n{indent}  @description {json.dumps(desc, ensure_ascii=True)}\n{indent}  @tier {json.dumps(tier)}')
    return "\n".join(out)

if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    head = open("src_head.in").read()
    trait = open("src_trait.in").read()
    fold = open("src_fold.in").read()
    render = open("src_render.in").read().replace("@@FOLD@@", fold)
    trait = (trait.replace("@@KNOBS@@", knob_block())
                  .replace("@@PREPARE@@", open("src_prepare.in").read().rstrip("\n"))
                  .replace("@@RENDER@@", render.rstrip("\n"))
                  .replace("@@ASSEMBLE@@", open("src_assemble.in").read().rstrip("\n"))
                  .replace("@@FINISH@@", open("src_finish.in").read().rstrip("\n")))
    desc = open("description.txt").read().strip()
    head = head.replace("@@DESCRIPTION@@", json.dumps(desc, ensure_ascii=True)[1:-1])
    import re
    text = expand(head + trait)
    text = re.sub(r"\\u([0-9a-fA-F]{4})", r"\\u{\1}", text)
    out = os.path.join(here, "..", "..", "..", "codec", "atoms", "std-lolo-source.lolo")
    open(out, "w").write(text)
