import os
here = os.path.dirname(os.path.abspath(__file__))
atom = os.path.abspath(os.path.join(here, "..", "..", "..", "a11y", "atoms", "std-a11y-probe-a11y-tree.lolo"))
src = open(atom).read()
lit = open(os.path.join(here, "a11y-tree.measure.js")).read().strip().replace("\\", "\\\\").replace('"', '\\"')
marker = '      measure : string = "'
i = src.index(marker) + len(marker)
k = src.index('"\n        @label', i)
open(atom, "w").write(src[:i] + lit + src[k:])
