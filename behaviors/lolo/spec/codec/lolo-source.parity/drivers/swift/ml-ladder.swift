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

struct Row<E: Encodable>: Encodable {
    let step: Int
    let entity: E
}

func run() throws {
    let spec = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as? [String: Any] ?? [:]
    let dec = JSONDecoder()
    let enc = JSONEncoder()
    enc.outputFormatting = [.sortedKeys]
    let row = try JSONSerialization.data(withJSONObject: ["id": "1"])
    let entry = LadderEntry(entity: try dec.decode(LadderRequest.self, from: row))
    let sink = LadderVerdictSink(entity: try dec.decode(LadderVerdict.self, from: row))
    func out(_ i: Int, _ lines: ArraySlice<(event: String, payload: any Encodable)>, _ entity: some Encodable) throws {
        for e in lines {
            print(String(decoding: try enc.encode(Line(step: i, event: e.event, payload: Box(value: e.payload))), as: UTF8.self))
        }
        print(String(decoding: try enc.encode(Row(step: i, entity: entity)), as: UTF8.self))
    }
    let steps = spec["steps"] as? [[String: Any]] ?? []
    for (i, step) in steps.enumerated() {
        let data = try JSONSerialization.data(withJSONObject: step["payload"] ?? [:])
        let event = step["event"] as? String ?? ""
        if step["trait"] as? String == "LadderEntry" {
            let n = entry.emitted.count
            switch event {
            case "INIT": entry.onInit()
            case "RESET": entry.onReset()
            case "DECIDE": entry.onDecide(try dec.decode(LadderEntryDECIDEPayload.self, from: data))
            default: fatalError("unknown event")
            }
            try out(i, entry.emitted[n...], entry.entity)
        } else {
            let n = sink.emitted.count
            switch event {
            case "INIT": sink.onInit()
            case "RESET": sink.onReset()
            case "FROM_EXACT": sink.onFromExact(try dec.decode(LadderVerdictSinkFROM_EXACTPayload.self, from: data))
            case "FROM_LOOKUP": sink.onFromLookup(try dec.decode(LadderVerdictSinkFROM_LOOKUPPayload.self, from: data))
            case "FROM_SIMILARITY": sink.onFromSimilarity(try dec.decode(LadderVerdictSinkFROM_SIMILARITYPayload.self, from: data))
            case "FROM_INFER": sink.onFromInfer(try dec.decode(LadderVerdictSinkFROM_INFERPayload.self, from: data))
            case "FROM_CLASSIFY": sink.onFromClassify(try dec.decode(LadderVerdictSinkFROM_CLASSIFYPayload.self, from: data))
            case "FROM_CLASSIFY_FAILURE": sink.onFromClassifyFailure(try dec.decode(LadderVerdictSinkFROM_CLASSIFY_FAILUREPayload.self, from: data))
            default: fatalError("unknown event")
            }
            try out(i, sink.emitted[n...], sink.entity)
        }
    }
}

try run()
