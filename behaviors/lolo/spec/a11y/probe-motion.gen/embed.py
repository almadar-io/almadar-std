import re, os
here = os.path.dirname(os.path.abspath(__file__))
atom = os.path.join(here, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-motion.lolo")
src = open(atom).read()
js = open(os.path.join(here, "snapshot.measure.js")).read().strip()
lit = js.replace("\\", "\\\\").replace('"', '\\"')
src = re.sub(r'(      measure : string = )".*"', lambda m: m.group(1) + '"' + lit + '"', src, count=1)
open(atom, "w").write(src)
