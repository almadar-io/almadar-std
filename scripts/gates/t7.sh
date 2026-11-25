#!/usr/bin/env bash
# T7 gate: the .lolo kernel answers as the native kernel (P-044). Every std replay-goldens case is played on both kernels
# (`orb goldens --parity`), and the cases where they differ are ratcheted against scripts/gates/known-failures/kernel-parity.txt.
# A change to either kernel that makes a case differ fails here until the other kernel follows or the line is ledgered.
set -u
cd "${T4_ROOT:-$(dirname "$0")/../..}"
ORB=${ORB:-orb}
G=${GATES_DIR:-scripts/gates}
mkdir -p $G/.observed $G/known-failures
touch $G/known-failures/kernel-parity.txt
obs=$G/.observed/kernel-parity.txt
: > "$obs"
files=$(find behaviors/lolo/spec -name '*.replay.goldens.json' | LC_ALL=C sort)
count=$(printf '%s\n' "$files" | grep -c . || true)
if [ "$count" -eq 0 ]; then
  echo "t7 kernel parity: no replay goldens files found under behaviors/lolo/spec"
  exit 2
fi
for f in $files; do
  out=$($ORB goldens --parity "$f" 2>/dev/null)
  printf '%s\n' "$out" | awk -v f="$f" '/^fail  /{ sub(/^fail  /, ""); print f "#" $0 }' >> "$obs"
  if ! printf '%s\n' "$out" | grep -qE '^(pass|fail|skip)  '; then
    echo "$f#FILE" >> "$obs"
  fi
done
echo "t7 kernel parity: $count files played on both kernels"
$ORB gate $G/known-failures/kernel-parity.txt "$obs"
