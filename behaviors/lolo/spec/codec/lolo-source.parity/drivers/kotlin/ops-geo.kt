import generated.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.serializer

fun main(args: Array<String>) {
    val json = Json { encodeDefaults = true }
    val spec = json.parseToJsonElement(java.io.File(args[0]).readText()).jsonObject
    val probe = Probe(json.decodeFromJsonElement(Ops.serializer(), buildJsonObject { put("id", JsonPrimitive("1")) }))
    spec.getValue("steps").jsonArray.forEachIndexed { i, step ->
        val n = probe.emitted.size
        when (val event = step.jsonObject.getValue("event").jsonPrimitive.content) {
            "INIT" -> probe.onInit()
            else -> error("no handler for " + event)
        }
        for (e in probe.emitted.drop(n)) {
            println(buildJsonObject {
                put("step", JsonPrimitive(i))
                put("event", JsonPrimitive(e.event))
                put("payload", json.encodeToJsonElement(serializer(e.payload.javaClass), e.payload))
            })
        }
        println(buildJsonObject {
            put("step", JsonPrimitive(i))
            put("entity", json.encodeToJsonElement(Ops.serializer(), probe.entity))
        })
    }
}
