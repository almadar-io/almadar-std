import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-focus-walk.lolo")


def lit(name):
    s = open(os.path.join(HERE, name)).read().strip()
    return json.dumps(s, ensure_ascii=False)


t = open(os.path.join(HERE, "atom.template")).read()
for k, f in [("@@DOM@@", "dom.measure.js"), ("@@IND@@", "indicator.measure.js"), ("@@SKIP@@", "skipstate.measure.js")]:
    t = t.replace(k, lit(f))
open(OUT, "w").write(t)
