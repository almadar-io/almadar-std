import Foundation

func json(_ value: Any) throws -> String {
    String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed]), as: UTF8.self)
}

func run() throws {
    let spec = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as? [String: Any] ?? [:]
    let row = try JSONSerialization.data(withJSONObject: ["id": "1"])
    let program = Program(try JSONDecoder().decode(Note.self, from: row), store: MemoryStore())
    let key = "StoreOrbital.Notes"
    let steps = spec["steps"] as? [[String: Any]] ?? []
    for (i, step) in steps.enumerated() {
        let n = program.log.count
        program.dispatch("StoreOrbital." + (step["trait"] as? String ?? ""), step["event"] as? String ?? "", try JSONSerialization.data(withJSONObject: step["payload"] ?? [:]))
        for entry in program.log[n...] {
            print("{\"step\":\(i),\"event\":\(try json(entry.event)),\"payload\":\(String(decoding: entry.payload, as: UTF8.self))}")
        }
        print("{\"step\":\(i),\"entity\":\(String(decoding: program.entry(key)?.entity() ?? Data("{}".utf8), as: UTF8.self))}")
    }
}

try run()
