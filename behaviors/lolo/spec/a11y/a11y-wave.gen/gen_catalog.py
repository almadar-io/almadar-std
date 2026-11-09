import json, re, sys, urllib.request
from pathlib import Path

here = Path(__file__).resolve().parent
atom = here.parent.parent.parent / "a11y" / "atoms" / "std-a11y-wave.lolo"
raw = here / "wave-docs.json"

V21 = {"1.3.4", "1.3.5", "1.4.10", "1.4.11", "1.4.12", "1.4.13", "2.1.4", "2.5.1", "2.5.2", "2.5.3", "2.5.4", "4.1.3"}
V22 = {"2.4.11", "2.4.12", "2.4.13", "2.5.7", "2.5.8", "3.2.6", "3.3.7", "3.3.8", "3.3.9"}

if len(sys.argv) > 1 and sys.argv[1] == "--offline":
    catalog = json.loads(raw.read_text())
else:
    with urllib.request.urlopen("https://wave.webaim.org/api/docs", timeout=30) as r:
        catalog = json.loads(r.read().decode())
    raw.write_text(json.dumps(catalog, indent=1) + "\n")

label = re.compile(r"^(\d+\.\d+\.\d+) .*\(Level (A|AA|AAA)\)$")
rows = []
for entry in catalog:
    refs = []
    for g in entry["guidelines"]:
        m = label.match(g["name"])
        if not m:
            raise SystemExit("unparsed guideline label: " + g["name"])
        crit, level = m.groups()
        version = "2.1" if crit in V21 else "2.2" if crit in V22 else "2.0"
        refs.append('{ criterion: "%s", level: "%s", version: "%s" }' % (crit, level, version))
    rows.append('{ item: "%s", wcag: [%s] }' % (entry["name"], ", ".join(refs)))

line = "      catalog : [WaveCatalogEntry] = [" + ", ".join(rows) + "]\n"
src = atom.read_text().splitlines(keepends=True)
out = [line if l.startswith("      catalog : [WaveCatalogEntry] = ") else l for l in src]
atom.write_text("".join(out))
print(len(rows), "catalog entries")
