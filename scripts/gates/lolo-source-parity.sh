#!/bin/bash
# Proves the native renderers of std-lolo-source (python typescript rust swift kotlin) emit code that
# compiles against each shell's real `orb compile` models and gives the kernel's answers.
# Usage: lolo-source-parity.sh [lang...]    (default: all five). Runs the dev build (orb-dev; ORB_DEV overrides).
# Kernel answers: spec/codec/lolo-source.parity/<example>.replay.goldens.json (pinned by `orb goldens`): the emits and,
# where a step pins expect.entity, the row after the step. A course example renders from its pinned language-goldens
# text; a std atom example (source_of) is rendered live from the atom by the language atom itself. An optional
# payload key the kernel leaves out and a native model carries as null compare equal (a native optional field cannot
# tell absent from null).
# Runs locally at the checkpoint only (owner ruling 2026-11-05: not wired into CI).
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
STD=$(cd "$HERE/../.." && pwd)
ROOT=$(cd "$STD/../.." && pwd)
LOLO=$STD/behaviors/lolo
PAR=$LOLO/spec/codec/lolo-source.parity
PY=$HERE/lolo-source-parity.py
EXAMPLES="cosine recall-at-k agent-step chunk game-score ml-ladder router-trio store-pair"
LANGS="${*:-python typescript rust swift kotlin}"
KOTLIN_PLUGIN=/opt/homebrew/opt/kotlin/libexec/lib/kotlinx-serialization-compiler-plugin.jar
KLIBS=$HOME/.almadar/kotlin-libs
KCP=$KLIBS/kotlinx-serialization-core-jvm-1.9.0.jar:$KLIBS/kotlinx-serialization-json-jvm-1.9.0.jar
TSC=$ROOT/node_modules/.bin/tsc
CARGO_ONE=$HOME/.almadar/bin/cargo-one
ORB=${ORB_DEV:-$HOME/bin/orb-dev}

T=$(mktemp -d "${TMPDIR:-/tmp}/lolo-source-parity.XXXXXX")
trap 'rm -rf "$T"' EXIT
FAILS=0

trait_of() { case $1 in cosine) echo Score;; recall-at-k) echo RecallAtK;; agent-step) echo Loop;; chunk) echo Chunk;; esac; }
entity_of() { case $1 in cosine) echo Pair;; recall-at-k) echo Eval;; agent-step) echo Run;; chunk) echo Doc;; esac; }

need() { # lang tool...
  local lang=$1 missing=0; shift
  for t in "$@"; do
    if ! command -v "$t" >/dev/null 2>&1 && [ ! -x "$t" ]; then echo "MISSING TOOLCHAIN $lang: $t"; missing=1; fi
  done
  return $missing
}
need_file() { [ -f "$2" ] || { echo "MISSING TOOLCHAIN $1: $2"; return 1; }; }

report() { # lang example status [detail-file]
  if [ "$3" = ok ]; then echo "PASS $1 $2"; else echo "FAIL $1 $2"; [ -n "${4:-}" ] && sed 's/^/  /' "$4"; FAILS=$((FAILS + 1)); fi
}

finish() { # lang ex actualfile logfile ranOk
  local lang=$1 ex=$2 actual=$3 log=$4
  if python3 -I "$PY" compare "$PAR/$ex.replay.goldens.json" "$actual" >>"$log" 2>&1; then report "$lang" "$ex" ok; else report "$lang" "$ex" bad "$log"; fi
}

source_of() {
  case $1 in
    game-score) echo packages/almadar-std/behaviors/lolo/ui/game/atoms/std-score.lolo;;
    ml-ladder) echo packages/almadar-std/behaviors/lolo/ml/atoms/std-ml-ladder.lolo;;
    router-trio) echo packages/almadar-std/behaviors/lolo/spec/codec/lolo-source.fixtures/router-trio.lolo;;
    store-pair) echo packages/almadar-std/behaviors/lolo/spec/codec/lolo-source.fixtures/store-pair.lolo;;
  esac
}
# A language an example does not cover yet prints PENDING with the gap that tracks it; it is never a pass.
pending_of() { :; }
covers() { local gap; gap=$(pending_of "$2" "$1"); [ -z "$gap" ] || { echo "PENDING $1 $2 ($gap)"; return 1; }; }
# The models a leg compiles against: a std atom example's own file in client mode (so the rendered names are the
# atom's), a course example's program (the server program for the server shells).
models() { # lang ex out shell [server]
  local src; src=$(source_of "$2")
  if [ -n "$src" ]; then "$ORB" compile "$ROOT/$src" -s "$4" --mode client -o "$3"
  elif [ "${5:-}" = server ]; then "$ORB" compile "$PAR/$2.server.lolo" -s "$4" -o "$3"
  else "$ORB" compile "$PAR/$2.lolo" -s "$4" $([ "$4" = typescript ] && echo -m client) -o "$3"; fi
}

render_text() { # lang ex out
  local src; src=$(source_of "$2")
  if [ -z "$src" ]; then python3 -I "$PY" text "$LOLO/spec/codec/lolo-$1.replay.goldens.json" "course-$2" "$3"; return; fi
  python3 -I "$PY" drive "$1" "$ROOT" "$src" "$T/drive-$1-$2.lolo" || return 1
  (cd "$ROOT" && "$ORB" run "$T/drive-$1-$2.lolo") >"$T/drive-$1-$2.answer" 2>&1
  python3 -I "$PY" live "$T/drive-$1-$2.answer" "$3"
}

goldens_leg() { # lang
  local out
  if ! out=$(cd "$LOLO" && "$ORB" goldens "spec/codec/lolo-$1.replay.goldens.json" 2>&1); then
    echo "FAIL $1 goldens"; echo "$out" | grep -v '^pass' | sed 's/^/  /'; FAILS=$((FAILS + 1)); return 1
  fi
  echo "PASS $1 goldens ($(echo "$out" | tail -1))"
}

for ex in $EXAMPLES; do
  python3 -I "$PY" events "$PAR/$ex.replay.goldens.json" "$PAR/$ex.events.json" || { echo "FAIL events $ex"; FAILS=$((FAILS + 1)); }
done
if ! (cd "$LOLO" && "$ORB" goldens spec/codec/lolo-source.parity >"$T/kernel.log" 2>&1); then
  echo "FAIL kernel goldens (the course programs no longer give the pinned answers)"; sed 's/^/  /' "$T/kernel.log"; FAILS=$((FAILS + 1))
else echo "PASS kernel goldens ($(tail -1 "$T/kernel.log"))"; fi

run_python() {
  need python python3 "$ORB" || { FAILS=$((FAILS + 1)); return; }
  goldens_leg python || return
  for ex in $EXAMPLES; do
    covers python "$ex" || continue
    local d=$T/py-$ex log=$T/py-$ex.log
    if ! models python "$ex" "$d" python server >"$log" 2>&1; then report python "$ex" bad "$log"; continue; fi
    render_text python "$ex" "$d/src/rendered.py" || { report python "$ex" bad "$log"; continue; }
    python3 -I "$PAR/drivers/python/$ex.py" "$d/src" "$PAR/$ex.events.json" >"$d/actual" 2>"$log"
    finish python "$ex" "$d/actual" "$log"
  done
}

run_typescript() {
  need typescript node "$ORB" "$TSC" || { FAILS=$((FAILS + 1)); return; }
  goldens_leg typescript || return
  for ex in $EXAMPLES; do
    covers typescript "$ex" || continue
    local d=$T/ts-$ex log=$T/ts-$ex.log
    if ! models typescript "$ex" "$d" typescript >"$log" 2>&1; then report typescript "$ex" bad "$log"; continue; fi
    render_text typescript "$ex" "$d/packages/shared/src/traits/rendered.ts" || { report typescript "$ex" bad "$log"; continue; }
    cp "$PAR/drivers/typescript/$ex.mts" "$d/main.mts"
    cat >"$d/tsconfig.parity.json" <<J
{"compilerOptions":{"target":"ES2022","module":"ESNext","moduleResolution":"Bundler","strict":true,"noUncheckedIndexedAccess":true,"noImplicitOverride":true,"exactOptionalPropertyTypes":true,"noEmit":true,"allowImportingTsExtensions":true,"skipLibCheck":true,"lib":["ES2023","DOM"],"types":["node"],"typeRoots":["$ROOT/node_modules/@types"],"paths":{"@almadar/core":["$ROOT/node_modules/@almadar/core/dist/index"]}},
"include":["packages/shared/src/traits/rendered.ts","packages/shared/src/types/*.ts","main.mts"]}
J
    if ! (cd "$d" && "$TSC" -p tsconfig.parity.json) >"$log" 2>&1; then report typescript "$ex" bad "$log"; continue; fi
    (cd "$d" && node main.mts "$PAR/$ex.events.json") >"$d/actual" 2>"$log"
    finish typescript "$ex" "$d/actual" "$log"
  done
}

run_rust() {
  need rust rustc "$CARGO_ONE" "$ORB" || { FAILS=$((FAILS + 1)); return; }
  goldens_leg rust || return
  local c=$T/rs-crate; mkdir -p "$c"
  printf '[package]\nname = "lolo-source-parity"\nversion = "0.1.0"\nedition = "2021"\n\n[workspace]\n\n[dependencies]\nserde = { version = "1", features = ["derive"] }\nserde_json = "1"\n' >"$c/Cargo.toml"
  local ex ready=""
  for ex in $EXAMPLES; do
    covers rust "$ex" || continue
    local d=$c/cases/$ex log=$T/rs-$ex.log
    mkdir -p "$d/generated"
    if ! models rust "$ex" "$T/rs-$ex" rust server >"$log" 2>&1; then report rust "$ex" bad "$log"; continue; fi
    render_text rust "$ex" "$d/lolo.rs" || { report rust "$ex" bad "$log"; continue; }
    cp "$T/rs-$ex/src/generated/"*.rs "$d/generated/"
    cp "$PAR/drivers/rust/$ex.rs" "$d/main.rs"
    printf '\n[[bin]]\nname = "%s"\npath = "cases/%s/main.rs"\n' "$ex" "$ex" >>"$c/Cargo.toml"
    ready="$ready $ex"
  done
  [ -n "$ready" ] || return
  if ! "$CARGO_ONE" build --manifest-path "$c/Cargo.toml" --target-dir "$T/rs-target" >"$T/rs-build.log" 2>&1; then
    for ex in $ready; do report rust "$ex" bad "$T/rs-build.log"; done; return
  fi
  for ex in $ready; do
    local log=$T/rs-$ex.log
    "$T/rs-target/debug/$ex" "$PAR/$ex.events.json" >"$T/rs-$ex.actual" 2>"$log"
    finish rust "$ex" "$T/rs-$ex.actual" "$log"
  done
}

run_swift() {
  need swift swiftc "$ORB" || { FAILS=$((FAILS + 1)); return; }
  goldens_leg swift || return
  for ex in $EXAMPLES; do
    covers swift "$ex" || continue
    local d=$T/sw-$ex log=$T/sw-$ex.log
    if ! models swift "$ex" "$d" ios >"$log" 2>&1; then report swift "$ex" bad "$log"; continue; fi
    local b=$d/build; mkdir -p "$b"
    cp "$d/Sources/OrbitalApp/Generated/Entities.swift" "$d/Sources/OrbitalApp/Generated/Events.swift" "$b/"
    render_text swift "$ex" "$b/Emitted.swift" || { report swift "$ex" bad "$log"; continue; }
    cp "$PAR/drivers/swift/$ex.swift" "$b/main.swift"
    if ! (cd "$b" && swiftc -o run Entities.swift Events.swift Emitted.swift main.swift) >"$log" 2>&1; then report swift "$ex" bad "$log"; continue; fi
    "$b/run" "$PAR/$ex.events.json" >"$d/actual" 2>"$log"
    finish swift "$ex" "$d/actual" "$log"
  done
}

run_kotlin() {
  need kotlin kotlinc java "$ORB" || { FAILS=$((FAILS + 1)); return; }
  need_file kotlin "$KOTLIN_PLUGIN" && need_file kotlin "$KLIBS/kotlinx-serialization-core-jvm-1.9.0.jar" && need_file kotlin "$KLIBS/kotlinx-serialization-json-jvm-1.9.0.jar" || { FAILS=$((FAILS + 1)); return; }
  goldens_leg kotlin || return
  for ex in $EXAMPLES; do
    covers kotlin "$ex" || continue
    local d=$T/kt-$ex log=$T/kt-$ex.log
    if ! models kotlin "$ex" "$d" android >"$log" 2>&1; then report kotlin "$ex" bad "$log"; continue; fi
    local b=$d/build; mkdir -p "$b"
    cp "$d/app/src/main/kotlin/generated/Entities.kt" "$d/app/src/main/kotlin/generated/Events.kt" "$b/"
    render_text kotlin "$ex" "$b/Emitted.kt" || { report kotlin "$ex" bad "$log"; continue; }
    cp "$PAR/drivers/kotlin/$ex.kt" "$b/Main.kt"
    if ! (cd "$b" && kotlinc -Xplugin="$KOTLIN_PLUGIN" -cp "$KCP" Entities.kt Events.kt Emitted.kt Main.kt -include-runtime -d run.jar) >"$log" 2>&1; then report kotlin "$ex" bad "$log"; continue; fi
    java -cp "$b/run.jar:$KCP" MainKt "$PAR/$ex.events.json" >"$d/actual" 2>"$log"
    finish kotlin "$ex" "$d/actual" "$log"
  done
}

for lang in $LANGS; do
  case $lang in
    python) run_python;; typescript) run_typescript;; rust) run_rust;; swift) run_swift;; kotlin) run_kotlin;;
    *) echo "unknown language $lang"; FAILS=$((FAILS + 1));;
  esac
done

if [ "$FAILS" -ne 0 ]; then echo "lolo-source-parity: $FAILS failure(s)"; exit 1; fi
echo "lolo-source-parity: all legs pass"
