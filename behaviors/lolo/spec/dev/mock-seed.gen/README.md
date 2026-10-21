`gen_atom.py` writes `dev/atoms/std-mock-seed.lolo` whole: the field-tree sampler (a stack machine in one `array/reduce`, repeated in each arm that samples) and the dataset program, using `sampler.py`.
Regenerate with `python3 packages/almadar-std/behaviors/lolo/spec/dev/mock-seed.gen/gen_atom.py` from the repo root (it needs only python3 and writes the atom beside the generator's `../../../dev/atoms`).
The atom is generated output: never hand-edit it, change the generator and regenerate (`orb validate` and `orb goldens` on `spec/dev/mock-seed.replay.goldens.json` are the checks).
