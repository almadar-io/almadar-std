import os
here = os.path.dirname(os.path.abspath(__file__))
atom = os.path.abspath(os.path.join(here, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-forms.lolo"))
src = open(atom).read()
for knob, file in (("inventory", "forms-inventory"), ("stimulate", "forms-stimulate"), ("read", "forms-read"), ("restore", "forms-restore")):
    lit = open(os.path.join(here, file + ".measure.js")).read().strip().replace("\\", "\\\\").replace('"', '\\"')
    marker = f"      {knob} : string = \""
    i = src.index(marker) + len(marker)
    k = src.index('"\n        @label', i)
    src = src[:i] + lit + src[k:]
open(atom, "w").write(src)
