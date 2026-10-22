import json
import os
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[7]
ATOM = ROOT / "packages/almadar-std/behaviors/lolo/ui/avl/atoms/std-graph-layout.lolo"
ORB = os.environ.get("ORB_BIN", os.environ.get("ORB", "orb"))


def node(key, width=12, height=3):
    return {"id": key, "label": key, "width": width, "height": height}


def edge(key, source, target, width=8, height=1):
    return {"id": key, "source": source, "target": target,
            "label": key, "labelWidth": width, "labelHeight": height}


def execute(nodes, edges, direction="down"):
    with tempfile.TemporaryDirectory(prefix="graph-layout-") as directory:
        fixture = Path(directory) / "direction.lolo"
        fixture.write_text(
            'app layout-direction-check [version: "1.0.0", description: "Native layout direction fixture"]\n'
            'uses Layout from "std/behaviors/std-graph-layout"\n'
            'orbital Fixture = Layout.orbitals.GraphLayoutOrbital {\n'
            '  traits { GraphLayout { config { direction: ' + direction + ' } } }\n}\n')
        result = subprocess.run(
            [ORB, "execute", str(fixture), "--trait", "FixtureGraphLayout", "--event", "LAYOUT_REQUEST",
             "--payload", json.dumps({"nodes": nodes, "edges": edges}), "--cascade", "--json"],
            cwd=ROOT, capture_output=True, text=True, check=True)
    report = json.loads(result.stdout)
    assert report["success"], report
    emissions = [emission for step in report["steps"] for outcome in step["outcomes"]
                 for emission in outcome.get("emits", [])]
    answers = [emission for emission in emissions
               if emission["event"] in ("LAYOUT_READY", "LAYOUT_REJECTED")]
    assert len(answers) == 1, emissions
    return answers[0]


def overlaps(a, b):
    return (a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3])


def check(name, nodes, edges, direction="down"):
    answer = execute(nodes, edges, direction)
    assert answer["event"] == "LAYOUT_READY", answer
    layout = answer["payload"]
    assert layout == execute(nodes, edges, direction)["payload"], "non-deterministic layout"
    assert {n["id"] for n in layout["nodes"]} == {n["id"] for n in nodes}
    assert [e["id"] for e in layout["edges"]] == [e["id"] for e in edges]
    boxes = [(n["x"], n["y"], n["x"] + n["width"], n["y"] + n["height"])
             for n in layout["nodes"]]
    labels = [(e["labelX"], e["labelY"], e["labelX"] + e["labelWidth"],
               e["labelY"] + e["labelHeight"]) for e in layout["edges"]]
    for index, box in enumerate(boxes + labels):
        assert all(value == int(value) for value in box), box
        assert box[0] >= 0 and box[1] >= 0, box
        assert box[2] <= layout["width"] and box[3] <= layout["height"], (box, layout)
        for other in (boxes + labels)[index + 1:]:
            assert not overlaps(box, other), (box, other)
    placed = {n["id"]: n for n in layout["nodes"]}
    for original in nodes:
        measured = placed[original["id"]]
        assert measured["width"] >= original["width"] and measured["width"] < original["width"] + 1
        assert measured["height"] >= original["height"] and measured["height"] < original["height"] + 1
    for route, original in zip(layout["edges"], edges):
        assert route["source"] == original["source"] and route["target"] == original["target"]
        source, target = placed[route["source"]], placed[route["target"]]
        assert route["labelWidth"] >= original["labelWidth"] and route["labelWidth"] < original["labelWidth"] + 1
        assert route["labelHeight"] >= original["labelHeight"] and route["labelHeight"] < original["labelHeight"] + 1
        if direction == "down":
            assert route["points"][0]["y"] == source["y"] + source["height"]
            assert route["points"][-1]["y"] == target["y"]
        elif direction == "up":
            assert route["points"][0]["y"] == source["y"]
            assert route["points"][-1]["y"] == target["y"] + target["height"]
        elif direction == "right":
            assert route["points"][0]["x"] == source["x"] + source["width"]
            assert route["points"][-1]["x"] == target["x"]
        else:
            assert route["points"][0]["x"] == source["x"]
            assert route["points"][-1]["x"] == target["x"] + target["width"]
        for start, end in zip(route["points"], route["points"][1:]):
            assert all(value == int(value) for value in [start["x"], start["y"], end["x"], end["y"]]), route
            assert start["x"] == end["x"] or start["y"] == end["y"], route
            for left, top, right, bottom in boxes:
                if start["x"] == end["x"]:
                    assert not (left < start["x"] < right and
                                max(start["y"], end["y"]) > top and min(start["y"], end["y"]) < bottom)
                else:
                    assert not (top < start["y"] < bottom and
                                max(start["x"], end["x"]) > left and min(start["x"], end["x"]) < right)
        if source["id"] != target["id"]:
            assert ((source["rank"] > target["rank"]) if route["reversed"]
                    else (source["rank"] < target["rank"])), route
    print(f"PASS {name} ({direction}): {len(nodes)} nodes, {len(edges)} edges", flush=True)


check("empty", [], [])
check("disconnected-variable-measures", [node("a", 5, 2), node("b", 31, 7), node("c", 9, 4)], [])
check("chain", [node("a"), node("b"), node("c")], [edge("ab", "a", "b"), edge("bc", "b", "c")])
check("cycle-parallel-self-long-label", [node("a"), node("b", 27, 8), node("c"), node("isolated")],
      [edge("ab", "a", "b"), edge("ab2", "a", "b", 45, 3), edge("bc", "b", "c"),
       edge("ca", "c", "a"), edge("bb", "b", "b", 22, 4)])
check("diamond-long-edge", [node("root"), node("left"), node("right"), node("sink")],
      [edge("rl", "root", "left"), edge("rr", "root", "right"), edge("ls", "left", "sink"),
       edge("rs", "right", "sink"), edge("direct", "root", "sink")])
check("fractional-metrics", [node("a", 5.2, 2.2), node("b", 7.3, 3.1)], [edge("ab", "a", "b", 5.5, 1.1)])
check("odd-terminal-measures", [node("a", 9, 3), node("b", 11, 3)], [edge("ab", "a", "b", 7, 1)])
for direction in ("up", "right", "left"):
    check("direction-cycle-parallel-self-long-label",
          [node("a", 9, 3), node("b", 27, 8), node("c", 13, 3), node("isolated", 17, 4)],
          [edge("ab", "a", "b"), edge("ab2", "a", "b", 45, 3), edge("bc", "b", "c"),
           edge("ca", "c", "a"), edge("bb", "b", "b", 22, 4)], direction)
    check("direction-fractional-metrics", [node("a", 5.2, 2.2), node("b", 7.3, 3.1)],
          [edge("ab", "a", "b", 5.5, 1.1)], direction)
for forward, reverse, axis, extent, size in [
        ("down", "up", "y", "height", "height"),
        ("right", "left", "x", "width", "width")]:
    nodes = [node("a", 9, 3), node("b", 17, 5)]
    edges = [edge("ab", "a", "b", 11, 2), edge("ba", "b", "a", 7, 3)]
    original = execute(nodes, edges, forward)["payload"]
    reflected = execute(nodes, edges, reverse)["payload"]
    assert original["width"] == reflected["width"] and original["height"] == reflected["height"]
    for before, after in zip(original["nodes"], reflected["nodes"]):
        assert after[axis] == original[extent] - before[axis] - before[size]
    label_axis, label_size = ("labelY", "labelHeight") if axis == "y" else ("labelX", "labelWidth")
    for before, after in zip(original["edges"], reflected["edges"]):
        assert after[label_axis] == original[extent] - before[label_axis] - before[label_size]
        for point, mirrored in zip(before["points"], after["points"]):
            assert mirrored[axis] == original[extent] - point[axis]
    print(f"PASS exact canvas reflection {forward} -> {reverse}", flush=True)
for name, nodes, edges, reason in [
        ("duplicate-node", [node("a"), node("a")], [], "invalid-measurement-or-duplicate-id"),
        ("duplicate-edge", [node("a")], [edge("x", "a", "a"), edge("x", "a", "a")], "invalid-measurement-or-duplicate-id"),
        ("bad-node-measure", [node("a", 0)], [], "invalid-measurement-or-duplicate-id"),
        ("bad-label-measure", [node("a")], [edge("x", "a", "a", -1)], "invalid-measurement-or-duplicate-id"),
        ("missing-endpoint", [node("a")], [edge("x", "a", "missing")], "missing-endpoint")]:
    answer = execute(nodes, edges)
    assert answer["event"] == "LAYOUT_REJECTED" and answer["payload"]["reason"] == reason, answer
    print(f"PASS {name}: explicit rejection", flush=True)
