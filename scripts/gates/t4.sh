#!/usr/bin/env bash
# T4 gate: replay every std replay-goldens file and ratchet the failures against scripts/gates/known-failures/goldens.txt.
set -u
cd "$(dirname "$0")/../.."
ORB=${ORB:-orb}
mkdir -p scripts/gates/.observed scripts/gates/known-failures
touch scripts/gates/known-failures/goldens.txt
obs=scripts/gates/.observed/goldens.txt
: > "$obs"
files=$(find behaviors/lolo/spec -name '*.replay.goldens.json' | LC_ALL=C sort)
count=$(printf '%s\n' "$files" | grep -c . || true)
if [ "$count" -eq 0 ]; then
  echo "t4 goldens: no replay goldens files found under behaviors/lolo/spec"
  exit 2
fi
for f in $files; do
  out=$($ORB goldens "$f" 2>/dev/null)
  printf '%s\n' "$out" | awk -v f="$f" '/^fail  /{ sub(/^fail  /, ""); print f "#" $0 }' >> "$obs"
  if ! printf '%s\n' "$out" | grep -qE '^(pass|fail|skip)  '; then
    echo "$f#FILE" >> "$obs"
  fi
done
echo "t4 goldens: $count files replayed"
$ORB gate scripts/gates/known-failures/goldens.txt "$obs"
