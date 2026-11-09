import re, os
here = os.path.dirname(os.path.abspath(__file__))
atom = os.path.join(here, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-widgets.lolo")
src = open(atom).read()
for knob, f in [("findMeasure", "find"), ("stateMeasure", "state"), ("targetMeasure", "targets")]:
    js = open(os.path.join(here, f + ".measure.js")).read().strip()
    lit = js.replace("\\", "\\\\").replace('"', '\\"')
    src = re.sub(r'(      ' + knob + r' : string = )".*"', lambda m: m.group(1) + '"' + lit + '"', src, count=1)
open(atom, "w").write(src)
