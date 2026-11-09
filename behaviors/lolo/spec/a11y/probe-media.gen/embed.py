import re, sys, os
here = os.path.dirname(os.path.abspath(__file__))
atom = os.path.join(here, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-media.lolo")
js = open(os.path.join(here, "media.measure.js")).read().strip()
lit = js.replace("\\", "\\\\").replace('"', '\\"')
src = open(atom).read()
new = re.sub(r'(      measure : string = )".*"', lambda m: m.group(1) + '"' + lit + '"', src, count=1)
open(atom, "w").write(new)
