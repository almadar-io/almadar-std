#!/usr/bin/env bash
# T6 gate: the std lint suite run over every std organism (`orb lint all`), ratcheted against scripts/gates/known-failures/lint.txt.
# The lint rules' own goldens run in t4 (spec/cli/lint-*.replay.goldens.json) and their finding codes in t5.
set -u
cd "${T4_ROOT:-$(dirname "$0")/../..}"
ORB=${ORB:-orb}
G=${GATES_DIR:-scripts/gates}
mkdir -p $G/.observed $G/known-failures
touch $G/known-failures/lint.txt
obs=$G/.observed/lint.txt
: > "$obs"
files=$(find behaviors/lolo -path '*/organisms/*.lolo' | LC_ALL=C sort)
count=$(printf '%s\n' "$files" | grep -c . || true)
if [ "$count" -eq 0 ]; then
  echo "t6 lint: no organism files found under behaviors/lolo"
  exit 2
fi
for f in $files; do
  $ORB lint all "$f" --json 2>/dev/null | node -e '
    const name = process.argv[1];
    let text = "";
    process.stdin.on("data", (c) => { text += c; });
    process.stdin.on("end", () => {
      let report;
      try { report = JSON.parse(text); } catch { console.log(`${name}#UNREADABLE`); return; }
      for (const finding of report.findings ?? []) console.log(`${name}#${finding.severity}#${finding.code}#${finding.path ?? ""}`);
    });' "$f" >> "$obs"
done
echo "t6 lint: $count organisms linted"
$ORB gate $G/known-failures/lint.txt "$obs"
