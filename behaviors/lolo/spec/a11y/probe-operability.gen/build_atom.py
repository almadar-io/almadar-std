import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-operability.lolo")


def lit(name):
    return json.dumps(open(os.path.join(HERE, name)).read().strip(), ensure_ascii=False)


t = open(os.path.join(HERE, "atom.template")).read()
for k, f in [("@@CLICK@@", "clickable.measure.js"), ("@@OBS@@", "observe.measure.js")]:
    t = t.replace(k, lit(f))
open(OUT, "w").write(t)
