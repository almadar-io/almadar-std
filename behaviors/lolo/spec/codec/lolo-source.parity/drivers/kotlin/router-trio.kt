import generated.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

fun main(args: Array<String>) {
    val json = Json { encodeDefaults = true }
    val spec = json.parseToJsonElement(java.io.File(args[0]).readText()).jsonObject
    val row = { json.decodeFromJsonElement(Tally.serializer(), buildJsonObject { put("id", JsonPrimitive("1")) }) }
    val program = Program(row(), row(), row())
    spec.getValue("steps").jsonArray.forEachIndexed { i, step ->
        val s = step.jsonObject
        val n = program.log.size
        val key = "TrioOrbital." + s.getValue("trait").jsonPrimitive.content
        program.dispatch(key, s.getValue("event").jsonPrimitive.content, s.getValue("payload"))
        for ((_, event, payload) in program.log.drop(n)) {
            println(buildJsonObject {
                put("step", JsonPrimitive(i))
                put("event", JsonPrimitive(event))
                put("payload", payload)
            })
        }
        println(buildJsonObject {
            put("step", JsonPrimitive(i))
            put("entity", program.entry(key)?.entity?.invoke() ?: JsonPrimitive("missing"))
        })
    }
}
