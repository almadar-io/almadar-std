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

func run() throws {
    let spec = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as? [String: Any] ?? [:]
    let dec = JSONDecoder()
    let enc = JSONEncoder()
    enc.outputFormatting = [.sortedKeys]
    let t = Score(entity: try dec.decode(Pair.self, from: JSONSerialization.data(withJSONObject: spec["entity"] ?? [:])))
    let steps = spec["steps"] as? [[String: Any]] ?? []
    for (i, step) in steps.enumerated() {
        let n = t.emitted.count
        let data = try JSONSerialization.data(withJSONObject: step["payload"] ?? [:])
        switch step["event"] as? String ?? "" {
        case "SCORE":
            t.onScore(try dec.decode(ScoreSCOREPayload.self, from: data))
        default:
            fatalError("unknown event")
        }
        for e in t.emitted[n...] {
            print(String(decoding: try enc.encode(Line(step: i, event: e.event, payload: Box(value: e.payload))), as: UTF8.self))
        }
    }
}

try run()
