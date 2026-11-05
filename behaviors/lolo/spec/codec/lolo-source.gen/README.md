`build.py` writes `codec/atoms/std-lolo-source.lolo` whole. The `.in` files hold the trait's arms, `knobs.py` its config knobs (name, type, default, label, description), `description.txt` its description, and `expand.py` with `lolo_macros.py` expands the repeated expression macros (FILL, CASE, REC) the fold needs.

Regenerate with `python3 packages/almadar-std/behaviors/lolo/spec/codec/lolo-source.gen/build.py` from anywhere (needs only python3). The atom is generated output: never hand-edit it. Change the generator and regenerate; the checks are `orb validate` and `orb goldens` on `spec/codec/lolo-source.replay.goldens.json` and `spec/codec/lolo-python.replay.goldens.json`.

The language atoms (`std-lolo-python` and its siblings) are hand-authored: each composes `LoloSource` and sets only config.
