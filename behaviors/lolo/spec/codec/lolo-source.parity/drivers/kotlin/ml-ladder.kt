import generated.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.serializer

val json = Json { encodeDefaults = true }

fun payloadJson(p: Any): JsonElement =
    if (p == Unit) JsonObject(emptyMap()) else json.encodeToJsonElement(serializer(p.javaClass), p)

fun out(i: Int, emitted: List<Any>, entity: JsonElement) {
    for (e in emitted) {
        val (event, payload) = when (e) {
            is LadderEntry.Emitted -> e.event to e.payload
            is LadderVerdictSink.Emitted -> e.event to e.payload
            else -> error("unknown emit")
        }
        println(buildJsonObject {
            put("step", JsonPrimitive(i))
            put("event", JsonPrimitive(event))
            put("payload", payloadJson(payload))
        })
    }
    println(buildJsonObject {
        put("step", JsonPrimitive(i))
        put("entity", entity)
    })
}

fun main(args: Array<String>) {
    val spec = json.parseToJsonElement(java.io.File(args[0]).readText()).jsonObject
    val row = buildJsonObject { put("id", JsonPrimitive("1")) }
    val entry = LadderEntry(json.decodeFromJsonElement(LadderRequest.serializer(), row))
    val sink = LadderVerdictSink(json.decodeFromJsonElement(LadderVerdict.serializer(), row))
    spec.getValue("steps").jsonArray.forEachIndexed { i, step ->
        val s = step.jsonObject
        val payload = s.getValue("payload")
        val event = s.getValue("event").jsonPrimitive.content
        if (s.getValue("trait").jsonPrimitive.content == "LadderEntry") {
            val n = entry.emitted.size
            when (event) {
                "INIT" -> entry.onInit()
                "RESET" -> entry.onReset()
                "DECIDE" -> entry.onDecide(json.decodeFromJsonElement(LadderEntryDECIDEPayload.serializer(), payload))
                else -> error("unknown event " + event)
            }
            out(i, entry.emitted.drop(n), json.encodeToJsonElement(LadderRequest.serializer(), entry.entity))
        } else {
            val n = sink.emitted.size
            when (event) {
                "INIT" -> sink.onInit()
                "RESET" -> sink.onReset()
                "FROM_EXACT" -> sink.onFromExact(json.decodeFromJsonElement(LadderVerdictSinkFROM_EXACTPayload.serializer(), payload))
                "FROM_LOOKUP" -> sink.onFromLookup(json.decodeFromJsonElement(LadderVerdictSinkFROM_LOOKUPPayload.serializer(), payload))
                "FROM_SIMILARITY" -> sink.onFromSimilarity(json.decodeFromJsonElement(LadderVerdictSinkFROM_SIMILARITYPayload.serializer(), payload))
                "FROM_INFER" -> sink.onFromInfer(json.decodeFromJsonElement(LadderVerdictSinkFROM_INFERPayload.serializer(), payload))
                "FROM_CLASSIFY" -> sink.onFromClassify(json.decodeFromJsonElement(LadderVerdictSinkFROM_CLASSIFYPayload.serializer(), payload))
                "FROM_CLASSIFY_FAILURE" -> sink.onFromClassifyFailure(json.decodeFromJsonElement(LadderVerdictSinkFROM_CLASSIFY_FAILUREPayload.serializer(), payload))
                else -> error("unknown event " + event)
            }
            out(i, sink.emitted.drop(n), json.encodeToJsonElement(LadderVerdict.serializer(), sink.entity))
        }
    }
}
