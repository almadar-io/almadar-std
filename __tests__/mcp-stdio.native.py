import json
import os
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class McpStdioNative(unittest.TestCase):
    def test_long_session_does_not_accumulate_one_cascade_budget(self):
        messages = [{"jsonrpc": "2.0", "id": index, "method": "ping"} for index in range(2100)]
        data = "\n".join(json.dumps(message) for message in messages).encode()
        result = subprocess.run([os.environ.get("ORB_BIN", "orb"), "mcp"], input=data,
                                capture_output=True, cwd=ROOT, timeout=60)
        self.assertEqual(result.returncode, 0, result.stdout.decode() + result.stderr.decode())
        replies = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
        self.assertEqual([reply["id"] for reply in replies], list(range(2100)))

    def test_queued_requests_finish_before_eof_and_unknown_tool_replies_once(self):
        messages = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-03-26"}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "missing界", "arguments": {}}},
            {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "read_behavior", "arguments": {"spec": "almadar-std/std-brotli"}}},
            {"jsonrpc": "2.0", "id": 5, "method": "ping"},
        ]
        data = "\n".join(json.dumps(message, ensure_ascii=False) for message in messages).encode()
        result = subprocess.run([os.environ.get("ORB_BIN", "orb"), "mcp"], input=data,
                                capture_output=True, cwd=ROOT, timeout=60)
        self.assertEqual(result.returncode, 0, result.stdout.decode() + result.stderr.decode())
        replies = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
        self.assertEqual([reply["id"] for reply in replies], [1, 2, 3, 4, 5])
        self.assertEqual(replies[0]["result"]["protocolVersion"], "2025-03-26")
        names = {tool["name"] for tool in replies[1]["result"]["tools"]}
        self.assertTrue({"validate", "read_behavior", "play", "evaluate"}.issubset(names))
        self.assertTrue(replies[2]["result"]["isError"])
        self.assertFalse(replies[3]["result"]["isError"])
        self.assertIn("source", replies[3]["result"]["structuredContent"])
        self.assertEqual(replies[4]["result"], {})

    def test_client_handshake_notification_after_initialize_is_answered_through(self):
        messages = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "ping"},
        ]
        self.assertEqual([reply["id"] for reply in self.serve(messages)], [1, 2])

    def test_identical_notifications_and_blank_lines_in_one_read_are_each_acknowledged(self):
        lines = [json.dumps({"jsonrpc": "2.0", "id": 1, "method": "ping"}),
                 json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
                 json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}),
                 "", "",
                 json.dumps({"jsonrpc": "2.0", "id": 2, "method": "ping"}),
                 json.dumps({"jsonrpc": "2.0", "id": 2, "method": "ping"})]
        self.assertEqual([reply["id"] for reply in self.serve_lines(lines)], [1, 2, 2])

    def test_control_requests_without_notifications_still_answer_in_order(self):
        messages = [{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}},
                    {"jsonrpc": "2.0", "id": 2, "method": "ping"}]
        self.assertEqual([reply["id"] for reply in self.serve(messages)], [1, 2])

    def serve(self, messages):
        return self.serve_lines([json.dumps(message) for message in messages])

    def serve_lines(self, lines):
        result = subprocess.run([os.environ.get("ORB_BIN", "orb"), "mcp"], input="\n".join(lines).encode(),
                                capture_output=True, cwd=ROOT, timeout=60)
        self.assertEqual(result.returncode, 0, result.stdout.decode() + result.stderr.decode())
        return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]


if __name__ == "__main__":
    unittest.main()
