import Foundation

func run() throws {
    let spec = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as? [String: Any] ?? [:]
    let probe = Probe(entity: try JSONDecoder().decode(Ops.self, from: try JSONSerialization.data(withJSONObject: ["id": "1"])))
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    let steps = spec["steps"] as? [[String: Any]] ?? []
    for (i, step) in steps.enumerated() {
        let n = probe.emitted.count
        switch step["event"] as? String ?? "" {
        case "INIT": probe.onInit()
        default: fatalError("no handler for " + (step["event"] as? String ?? ""))
        }
        for entry in probe.emitted[n...] {
            print("{\"step\":\(i),\"event\":\"\(entry.event)\",\"payload\":\(String(decoding: try encoder.encode(entry.payload), as: UTF8.self))}")
        }
        print("{\"step\":\(i),\"entity\":\(String(decoding: try encoder.encode(probe.entity), as: UTF8.self))}")
    }
}

try run()
