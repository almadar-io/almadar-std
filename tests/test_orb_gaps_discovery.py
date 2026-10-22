import json
import os
from pathlib import Path
import subprocess
import unittest


ATOM = Path(__file__).resolve().parents[1] / "behaviors/lolo/cli/atoms/std-orb-gaps.lolo"
TS = "orbital-rust/crates/orbital-shell-typescript"
FOLDED = [f"{TS}/{path}" for path in ["core", "runtime/logger", "tooling/eslint", "tooling/syntax", "src/chrome"]]


def play(event, entity, state="probing", payload=None):
    result = subprocess.run(
        [os.environ.get("ORB", "orb"), "execute", str(ATOM), "--json",
         "--steps", json.dumps([{"trait": "OrbGaps", "from": state, "event": event, "payload": payload or {}, "entity": entity}])],
        check=True, capture_output=True, text=True,
    )
    response = json.loads(result.stdout)
    if not response["success"]:
        raise AssertionError(response)
    for outcome in response["steps"][0]["outcomes"]:
        if outcome.get("failure"):
            raise AssertionError(outcome["failure"])
    return response["steps"][0]["entityAfter"]


class GapDiscovery(unittest.TestCase):
    def test_folded_owners_are_explicit_and_archives_are_not_seeded(self):
        row = play("GAPS_PARSED", {"cmd": "status", "fail": ""}, "ready")
        self.assertEqual(row["work"], [{"path": ".", "nested": False}] +
                         [{"path": path, "nested": True} for path in FOLDED])

    def test_check_reads_master_without_discovery(self):
        row = play("GAPS_PARSED", {"cmd": "check", "fail": ""}, "ready")
        self.assertEqual(row["queue"], ["docs/Almadar_Gaps.md"])
        self.assertNotIn("work", row)

    def test_folded_owner_requires_a_present_ledger(self):
        probes = [{"path": path, "nested": True, "dirOk": True,
                   "hasLedger": index != 1, "hasPy": False, "hasModules": False}
                  for index, path in enumerate(FOLDED)]
        row = play("GAPS_PROBE", {"work": [], "cursor": 0, "probes": probes})
        self.assertEqual(row["repos"], [FOLDED[2], FOLDED[0], FOLDED[3], FOLDED[4]])

    def test_direct_submodule_without_ledger_remains_available(self):
        probes = [{"path": path, "nested": False, "dirOk": True,
                   "hasLedger": False, "hasPy": python, "hasModules": False}
                  for path, python in [(".", False), ("packages/almadar-std", False),
                                       ("python-package", True)]]
        row = play("GAPS_PROBE", {"work": [], "cursor": 0, "probes": probes})
        self.assertEqual(row["repos"], ["packages/almadar-std"])

    def test_relocated_master_and_baseline_owners_normalize_before_merge(self):
        for old, active in [("packages/almadar-core", FOLDED[0]),
                            ("packages/almadar-logger", FOLDED[1]),
                            ("packages/almadar-eslint", FOLDED[2]),
                            ("packages/almadar-syntax", FOLDED[3])]:
            with self.subTest(owner=old):
                entry = {"code": "G-CORE-001", "repo": old, "heading": "", "body": "preserved master edit",
                         "at": 1, "endAt": 2}
                baseline = {"version": 1, "entries": [[entry["code"],
                            {"repo": old, "heading": "", "body": "original baseline"}]]}
                row = self.analyze([old], [entry], baseline)
                self.assertEqual(row["hdrRepos"], [active, "unknown-control"])
                self.assertEqual(row["hdrSrcs"][0], f"{active}/Almadar_Gaps.md")
                self.assertEqual(row["mEntries"][0]["repo"], active)
                self.assertEqual(row["mEntries"][0]["body"], "preserved master edit")
                self.assertEqual(row["bEntries"][0]["repo"], active)
                self.assertEqual(row["bEntries"][0]["body"], "original baseline")

    def test_retired_master_sections_are_removed_without_discarding_active_entries(self):
        owners = ["packages/almadar-runtime", "packages/almadar-std"]
        entries = [{"code": code, "repo": owner, "heading": "", "body": code,
                    "at": index * 2 + 1, "endAt": index * 2 + 2}
                   for index, (owner, code) in enumerate(zip(owners, ["G-RUNTIME-001", "G-STD-001"]))]
        row = self.analyze(owners, entries)
        self.assertEqual(row["hdrRepos"], ["packages/almadar-std", "unknown-control"])
        self.assertEqual([entry["code"] for entry in row["mEntries"]], ["G-STD-001"])

    def test_retired_baseline_entry_is_skipped(self):
        entry = {"code": "G-RUNTIME-001", "repo": "packages/almadar-runtime", "heading": "",
                 "body": "retired fixture", "at": 0, "endAt": 0}
        row = play("GAPS_ROWS", {"mCodes": [], "lCodes": [], "mEntries": [], "lEntries": [],
                   "bEntries": [entry], "repos": [], "ledgerRepos": [], "hasBaseline": True,
                   "from": "", "cmd": "status", "mode": "preview", "mPre": "", "mPost": "",
                   "masterText": ""}, "merging")
        self.assertEqual(row["rows"][0]["side"], "skip")
        self.assertEqual(row["merged"], [])

    def test_rollup_still_refuses_unsynchronized_active_master_edit(self):
        row = play("GAPS_ROLLUP", {"rows": [{"code": "G-CORE-001", "m": "edited master",
                   "p": "original baseline", "l": "original baseline"}], "hasBaseline": True}, "merging")
        self.assertIn("master has unsynchronized edits for G-CORE-001", row["fail"])

    def test_zip_scan_ignores_lines_without_a_matching_flag(self):
        lines = ["## `packages/almadar-std` (source: `packages/almadar-std/Almadar_Gaps.md`)",
                 "## `unknown-control` (source: `unknown-control/Almadar_Gaps.md`)"]
        scans = [{"key": "__body__", "lines": lines, "flags": [True], "entries": [], "gapLines": []},
                 {"key": "__root__", "lines": [], "flags": [], "entries": [], "gapLines": []}]
        row = play("GAPS_S4", {"scans": scans, "reads": [], "repos": ["packages/almadar-std"],
                               "ledgerRepos": [], "cmd": "status"}, "analyzing")
        self.assertEqual(row["hdrRepos"], ["packages/almadar-std"])

    def test_duplicate_codes_keep_group_order(self):
        refs = [{"code": code, "line": "[mechanical]", "path": "fixture"}
                for code in ["G-Z-001", "G-A-001", "G-Z-001", "G-A-001"]]
        row = play("GAPS_REPORT", {"codeRefs": refs, "reads": []}, "analyzing")
        self.assertCountEqual(row["findings"], ["DUPLICATE G-A-001", "DUPLICATE G-Z-001"])
        self.assertEqual(row["findings"], [f"DUPLICATE {code}" for code in row["codeGroups"]])

    def test_empty_duplicate_input_stays_clean(self):
        row = play("GAPS_REPORT", {"codeRefs": [], "reads": []}, "analyzing")
        self.assertEqual(row["findings"], [])

    def test_empty_flag_list_ignores_all_headers(self):
        scans = [{"key": "__body__", "lines": ["## `bad` (source: `bad/Almadar_Gaps.md`)"],
                  "flags": [], "entries": [], "gapLines": []},
                 {"key": "__root__", "lines": [], "flags": [], "entries": [], "gapLines": []}]
        row = play("GAPS_S4", {"scans": scans, "reads": [], "repos": [], "ledgerRepos": [],
                               "cmd": "status", "mode": "preview", "mPre": "", "mPost": "", "masterText": ""},
                   "analyzing")
        self.assertEqual(row["hdrRepos"], [])

    def test_gap_atom_has_no_operator_type_errors(self):
        result = subprocess.run([os.environ.get("ORB", "orb"), "validate", str(ATOM), "--json"],
                                capture_output=True, text=True)
        report = json.loads(result.stdout)
        errors = [error for error in report.get("errors", [])
                  if error["code"].startswith("ORB_X_OPERATOR_ARG_") and
                  "(OrbGaps)" in error.get("path", "")]
        self.assertEqual(errors, [])

    def analyze(self, owners, entries, baseline=None):
        lines = []
        for owner in owners + ["unknown-control"]:
            lines.extend([f"## `{owner}` (source: `{owner}/Almadar_Gaps.md`)", ""])
        scans = [{"key": "__body__", "lines": lines, "flags": [True] * len(lines),
                  "entries": entries, "gapLines": []},
                 {"key": "__root__", "lines": [], "flags": [], "entries": [], "gapLines": []}]
        reads = [] if baseline is None else [{"path": ".almadar/gaps-sync-state.json", "ok": True,
                                               "text": json.dumps(baseline)}]
        return play("GAPS_S4", {"scans": scans, "reads": reads, "repos": owners + FOLDED,
                               "ledgerRepos": [], "cmd": "status"}, "analyzing")


if __name__ == "__main__":
    unittest.main()
