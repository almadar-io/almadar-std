import os
here = os.path.dirname(os.path.abspath(__file__))
atom = os.path.abspath(os.path.join(here, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-checkout.lolo"))
s = open(atom).read()
lit = open(os.path.join(here, "checkout-links.measure.js")).read().strip().replace("\\", "\\\\").replace('"', '\\"')
m = '      linksMeasure : string = "'
i = s.index(m) + len(m); k = s.index('"\n        @label', i)
open(atom, "w").write(s[:i] + lit + s[k:])
