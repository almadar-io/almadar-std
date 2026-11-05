import generated.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.serializer

fun main(args: Array<String>) {
    val json = Json
    val spec = json.parseToJsonElement(java.io.File(args[0]).readText()).jsonObject
    val t = Loop(json.decodeFromJsonElement(Run.serializer(), spec.getValue("entity")))
    spec.getValue("steps").jsonArray.forEachIndexed { i, step ->
        val n = t.emitted.size
        val payload = step.jsonObject.getValue("payload")
        when (val event = step.jsonObject.getValue("event").jsonPrimitive.content) {
            "TOOL_CHOSEN" -> t.onToolChosen(json.decodeFromJsonElement(LoopTOOL_CHOSENPayload.serializer(), payload))
            "TOOL_RESULT" -> t.onToolResult(json.decodeFromJsonElement(LoopTOOL_RESULTPayload.serializer(), payload))
            "FINAL" -> t.onFinal(json.decodeFromJsonElement(LoopFINALPayload.serializer(), payload))
            else -> error("unknown event " + event)
        }
        for (e in t.emitted.drop(n)) {
            val out = buildJsonObject {
                put("step", JsonPrimitive(i))
                put("event", JsonPrimitive(e.event))
                put("payload", json.encodeToJsonElement(serializer(e.payload.javaClass), e.payload))
            }
            println(out)
        }
    }
}
