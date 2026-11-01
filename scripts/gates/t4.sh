#!/usr/bin/env bash
# T4 gate: replay every std goldens file, replay-goldens and plain, and ratchet the failures against scripts/gates/known-failures/goldens.txt.
# A file that is not a readable goldens file, or holds zero cases, is a failure; so is a run that finds no goldens file at all.
set -u
cd "${T4_ROOT:-$(dirname "$0")/../..}"
ORB=${ORB:-orb}
G=${GATES_DIR:-scripts/gates}
mkdir -p $G/.observed $G/known-failures
touch $G/known-failures/goldens.txt
obs=$G/.observed/goldens.txt
: > "$obs"
files=$(find behaviors/lolo/spec -name '*.goldens.json' | LC_ALL=C sort)
count=$(printf '%s\n' "$files" | grep -c . || true)
if [ "$count" -eq 0 ]; then
  echo "t4 goldens: no goldens files found under behaviors/lolo/spec"
  exit 2
fi
for f in $files; do
  out=$($ORB goldens "$f" 2>/dev/null)
  printf '%s\n' "$out" | awk -v f="$f" '/^fail  /{ sub(/^fail  /, ""); print f "#" $0 }' >> "$obs"
  if ! printf '%s\n' "$out" | grep -qE '^(pass|fail|skip)  '; then
    echo "$f#FILE" >> "$obs"
  elif ! printf '%s\n' "$out" | grep -qE '^[0-9]+ passed, [0-9]+ failed' || printf '%s\n' "$out" | grep -qE '^0 passed, 0 failed, 0 skipped'; then
    echo "$f#NO_CASES" >> "$obs"
  fi
done
echo "t4 goldens: $count files replayed"
$ORB gate $G/known-failures/goldens.txt "$obs"
