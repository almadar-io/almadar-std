#!/usr/bin/env bash
# T5 gate: every std lint rule names a finding code only from its declared `codes` record (orb lint finding-codes); failures ratchet against scripts/gates/known-failures/finding-codes.txt.
set -u
cd "$(dirname "$0")/../.."
ORB=${ORB:-orb}
mkdir -p scripts/gates/.observed scripts/gates/known-failures
touch scripts/gates/known-failures/finding-codes.txt
obs=scripts/gates/.observed/finding-codes.txt
: > "$obs"
files=$(find behaviors/lolo/cli/atoms -name 'std-orb-lint-*.lolo' | LC_ALL=C sort)
count=$(printf '%s\n' "$files" | grep -c . || true)
if [ "$count" -eq 0 ]; then
  echo "t5 finding-codes: no lint atoms found under behaviors/lolo/cli/atoms"
  exit 2
fi
for f in $files; do
  out=$($ORB lint finding-codes "$f" 2>/dev/null)
  printf '%s\n' "$out" | awk -v f="$f" '/^\[ORB_LINT_FINDING_CODE_UNDECLARED\]/{ print f "#" $0 }' >> "$obs"
  if ! printf '%s\n' "$out" | grep -qE '^(lint finding-codes: clean|\[ORB_)'; then
    echo "$f#FILE" >> "$obs"
  fi
done
echo "t5 finding-codes: $count lint atoms checked"
$ORB gate scripts/gates/known-failures/finding-codes.txt "$obs"
