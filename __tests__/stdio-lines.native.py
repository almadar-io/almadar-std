import base64
import json
import os
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "packages/almadar-std/behaviors/lolo/connect/atoms/std-stdio-lines.lolo"


def step(event, payload=None, start=None):
    result = {"trait": "StdioLines", "event": event, "payload": payload or {}}
    if start:
        result["from"] = start
    return result


def execute(steps, data=None):
    command = [os.environ.get("ORB_BIN", "orb"), "execute", str(SOURCE), "--steps", json.dumps(steps), "--json"]
    if data is not None:
        command.append("--live")
    result = subprocess.run(command, input=data, capture_output=True, cwd=ROOT, timeout=60, check=True)
    return json.loads(result.stdout)["steps"]


def events(steps, event):
    return [emitted["payload"] for result in steps for outcome in result["outcomes"]
            for emitted in outcome["emits"] if emitted["event"] == event]


class StdioLinesNative(unittest.TestCase):
    def test_multiple_empty_and_unterminated_lines_require_acknowledgement(self):
        result = execute([
            step("STDIO_READ", {"data": base64.b64encode("α\n\nlast".encode()).decode(), "eof": True}, "active"),
            step("STDIO_PUMP"),
            step("INPUT_NEXT"), step("INPUT_NEXT"), step("INPUT_NEXT"), step("INPUT_NEXT"),
        ])
        self.assertEqual(events(result, "INPUT_LINE"), [{"line": "α"}, {"line": ""}, {"line": "last"}])
        self.assertEqual(events(result[:2], "INPUT_LINE"), [{"line": "α"}])
        self.assertEqual(events(result[:4], "STDIO_CLOSED"), [])
        self.assertEqual(events(result, "STDIO_CLOSED"), [{}])
        self.assertEqual(result[-1]["states"]["StdioLines"], "closed")

    def test_split_utf8_and_cr_are_preserved(self):
        encoded = "界\r\n".encode()
        result = execute([
            step("STDIO_READ", {"data": base64.b64encode(b"\n" + encoded[:1]).decode(), "eof": False}, "active"),
            step("STDIO_READ", {"data": base64.b64encode(encoded[1:]).decode(), "eof": True}),
            step("INPUT_NEXT"), step("INPUT_NEXT"),
        ])
        self.assertEqual(events(result[:2], "INPUT_LINE"), [{"line": ""}])
        self.assertEqual(events(result, "INPUT_LINE"), [{"line": ""}, {"line": "界\r"}])
        self.assertEqual(events(result, "STDIO_CLOSED"), [{}])

    def test_native_stdin_and_eof(self):
        result = execute([step("INPUT_START")] + [step("INPUT_NEXT")] * 4, "α\n\nlast".encode())
        self.assertEqual(events(result, "STDIO_ERROR"), [])
        self.assertEqual(events(result, "INPUT_LINE"), [{"line": "α"}, {"line": ""}, {"line": "last"}])
        self.assertEqual(events(result, "STDIO_CLOSED"), [{}])


if __name__ == "__main__":
    unittest.main()
