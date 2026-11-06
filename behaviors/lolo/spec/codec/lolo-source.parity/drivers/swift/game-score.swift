import Foundation

struct Box: Encodable {
    let value: any Encodable
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}

struct Line: Encodable {
    let step: Int
    let event: String
    let payload: Box
}

struct Row: Encodable {
    let step: Int
    let entity: ScoreState
}

func run() throws {
    let spec = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as? [String: Any] ?? [:]
    let dec = JSONDecoder()
    let enc = JSONEncoder()
    enc.outputFormatting = [.sortedKeys]
    let t = ScoreKeeper(entity: try dec.decode(ScoreState.self, from: JSONSerialization.data(withJSONObject: spec["entity"] ?? [:])))
    let config = spec["config"] as? [String: Any] ?? [:]
    if let v = config["pointsPerKill"] as? Double { t.config.pointsPerKill = v }
    if let v = config["startScore"] as? Double { t.config.startScore = v }
    if let v = config["initialEnemies"] as? Double { t.config.initialEnemies = v }
    if let v = config["running"] as? Bool { t.config.running = v }
    let steps = spec["steps"] as? [[String: Any]] ?? []
    for (i, step) in steps.enumerated() {
        let n = t.emitted.count
        let data = try JSONSerialization.data(withJSONObject: step["payload"] ?? [:])
        switch step["event"] as? String ?? "" {
        case "INIT":
            t.onInit()
        case "UNITS_CHANGED":
            t.onUnitsChanged(try dec.decode(ScoreKeeperUNITS_CHANGEDPayload.self, from: data))
        default:
            fatalError("unknown event")
        }
        for e in t.emitted[n...] {
            print(String(decoding: try enc.encode(Line(step: i, event: e.event, payload: Box(value: e.payload))), as: UTF8.self))
        }
        print(String(decoding: try enc.encode(Row(step: i, entity: t.entity)), as: UTF8.self))
    }
}

try run()
