import json,hashlib,sys
J=lambda o: json.dumps(o,separators=(',',':'))
cases=[]
def case(id,steps,entity=None):
    c={"id":id,"defaults":["KnobDriver","KnobDelay"],"steps":steps}
    if entity: c["entity"]=entity
    cases.append(c)
M="vendor/model"
SYS="You are a helpful assistant."
def gjob(key="",stream=False,temp=0.7,prompt="hi",system=SYS):
    return J({"action":"generate","attempt":0,"system":system,"user":prompt,"base":prompt,"model":M,"temperature":temp,"maxTokens":1024,"categories":[],"itemIds":[],"callKey":key,"images":[],"stream":stream})
def wkey(j,kind="chat"): return J({"kind":kind,"id":j})
def step(trait,event,payload,expect=None,**kw):
    s={"trait":trait,"event":event,"payload":payload}
    if expect is not None: s["expect"]=expect
    s.update(kw); return s
def emits(*e,never=None):
    d={"emits":list(e)}
    if never: d["neverEmits"]=never
    return d
PROV={"sort":"throughput","order":["a","b"],"quantizations":["fp8"]}
SYSCC=[{"type":"text","text":SYS,"cache_control":{"type":"ephemeral"}}]
USER={"role":"user","content":"hi"}
# chat body per knob
kbody=J({"model":M,"temperature":0.7,"stream":False,"tool_choice":"auto","usage":{"include":True},"max_tokens":1024,"reasoning":{"enabled":False},"provider":PROV,"messages":[{"role":"system","content":SYSCC},USER]})
pbody=J({"model":M,"temperature":0.7,"stream":False,"tool_choice":"auto","usage":{"include":True},"max_tokens":1024,"messages":[{"role":"system","content":SYS},USER]})
obody=J({"model":M,"temperature":0.7,"stream":False,"tool_choice":"auto","usage":{"include":True},"max_tokens":1024,"reasoning":{"enabled":True},"messages":[{"role":"system","content":SYS},USER]})
kj=gjob(); kk=wkey(kj)
case("every-routing-reasoning-and-cache-control-knob-shapes-the-openrouter-chat-body",[step("KnobLlm","LLM_GENERATE",{"userPrompt":"hi"},emits({"event":"LLM_CHAT_WIRE","payload":{"key":kk,"path":"/api/v1/chat/completions","json":kbody}}))])
case("control-an-openrouter-chat-with-no-knob-keeps-today-s-body-and-arms-no-timer",[step("PlainLlm","LLM_GENERATE",{"userPrompt":"hi"},emits({"event":"LLM_CHAT_WIRE","payload":{"json":pbody}},never=["LLM_FIRST_BYTE_START"]))])
case("reasoning-on-sends-enabled-true-on-a-plain-openrouter-chat",[step("OnLlm","LLM_GENERATE",{"userPrompt":"hi"},emits({"event":"LLM_CHAT_WIRE","payload":{"json":obody}}))])
# tools body
TOOLS=[{"name":"read_x","description":"d","parameters":{"type":"object"}}]
tl=[{"type":"function","function":{"name":"read_x","description":"d","parameters":{"type":"object"}}}]
msgs=lambda sysc:[{"role":"system","content":sysc},{"role":"user","content":"hi"}]
ktools=J({"model":M,"messages":msgs([{"type":"text","text":"sys","cache_control":{"type":"ephemeral"}}]),"parallel_tool_calls":True,"temperature":0.2,"tools":tl,"reasoning":{"enabled":False},"usage":{"include":True},"provider":PROV})
ptools=J({"model":M,"messages":msgs("sys"),"parallel_tool_calls":False,"temperature":0.7,"tools":tl,"reasoning":{"enabled":True},"usage":{"include":True}})
tp={"messages":[{"role":"user","content":"hi"}],"instructions":"sys","tools":TOOLS,"key":"t1"}
case("every-knob-shapes-the-openrouter-tool-body-reasoning-off-parallel-calls-temperature-provider-and-cache-control",[step("KnobLlm","LLM_CALL_TOOLS",tp,emits({"event":"LLM_CHAT_WIRE","payload":{"path":"/api/v1/chat/completions","json":ktools}}))])
case("control-an-openrouter-tool-call-with-no-knob-keeps-reasoning-on-sequential-calls-and-0-7",[step("PlainLlm","LLM_CALL_TOOLS",tp,emits({"event":"LLM_CHAT_WIRE","payload":{"json":ptools}},never=["LLM_FIRST_BYTE_START"]))])
# classify
def cj(user,temp=0.1):
    return J({"action":"classify","attempt":0,"system":"You are a text classifier. Classify the given text into one of these categories: a, b. Return JSON with: category, confidence (0-1), and reasoning.","user":user,"base":user,"model":M,"temperature":temp,"maxTokens":0,"categories":["a","b"],"itemIds":[],"callKey":""})
instr="<instructions>\nbe strict\n</instructions>\n\nthe text"
cbody=lambda user,temp: J({"model":M,"temperature":temp,"stream":False,"tool_choice":"auto","usage":{"include":True},"messages":[{"role":"system","content":"You are a text classifier. Classify the given text into one of these categories: a, b. Return JSON with: category, confidence (0-1), and reasoning."},{"role":"user","content":user}]})
case("classify-instructions-go-before-the-text-between-instruction-tags-and-the-temperature-is-the-caller-s",[step("PlainLlm","LLM_CLASSIFY",{"text":"the text","categories":["a","b"],"instructions":"be strict","temperature":0},emits({"event":"LLM_CHAT_WIRE","payload":{"json":cbody(instr,0)}}))])
case("control-a-classify-without-instructions-sends-the-bare-text-at-0-1",[step("PlainLlm","LLM_CLASSIFY",{"text":"the text","categories":["a","b"]},emits({"event":"LLM_CHAT_WIRE","payload":{"json":cbody("the text",0.1)}}))])
rep=lambda cat: J({"category":cat,"confidence":0.9,"reasoning":"r"})
case("a-classify-reply-with-an-undeclared-category-is-still-refused-with-instructions",[step("PlainLlm","LLM_CHAT_JSON",{"job":cj(instr,0),"json":rep("zzz")},emits({"event":"LLM_CHAT_CHECKED","payload":{"issues":"category: Invalid enum value. Expected 'a' | 'b', received 'zzz'"}}))])
case("control-a-classify-reply-with-a-declared-category-passes",[step("PlainLlm","LLM_CHAT_JSON",{"job":cj(instr,0),"json":rep("a")},emits({"event":"LLM_CHAT_CHECKED","payload":{"issues":""}}))])
# classify many
def mj(user="[1] x"):
    return J({"action":"classifyMany","attempt":0,"system":"s","user":user,"base":user,"model":M,"temperature":0.1,"maxTokens":0,"categories":["a","b"],"itemIds":["x"],"callKey":""})
mbody=lambda user: J({"model":M,"temperature":0.1,"stream":False,"tool_choice":"auto","usage":{"include":True},"messages":[{"role":"system","content":"You are a text classifier. Classify each item below into exactly one of these categories:\n- a\n- b\nAnswer with one verdict per item: its id, the category, your confidence from 0 to 1 and a short reasoning. Return JSON: { \"verdicts\": [{ \"id\", \"category\", \"confidence\", \"reasoning\" }] }."},{"role":"user","content":user}]})
case("classify-many-asks-for-a-reasoning-per-verdict-and-puts-instructions-before-the-items",[step("PlainLlm","LLM_CLASSIFY_MANY",{"items":[{"id":"x","text":"x"}],"categories":["a","b"],"instructions":"be strict"},emits({"event":"LLM_CHAT_WIRE","payload":{"json":mbody("<instructions>\nbe strict\n</instructions>\n\n[1] x")}}))])
vj=lambda r: J({"verdicts":[dict({"id":"1","category":"a","confidence":0.8},**({"reasoning":"because"} if r else {}))]})
case("a-classify-many-verdict-without-reasoning-is-refused-for-the-model-to-redo",[step("PlainLlm","LLM_CHAT_JSON",{"job":mj(),"json":vj(False)},emits({"event":"LLM_CHAT_CHECKED","payload":{"issues":"verdicts.0.reasoning: Required"}}))])
case("control-a-classify-many-verdict-with-reasoning-passes-and-the-result-carries-it",[
 step("PlainLlm","LLM_CHAT_JSON",{"job":mj(),"json":vj(True)},emits({"event":"LLM_CHAT_CHECKED","payload":{"issues":""}})),
 step("PlainLlm","LLM_CHAT_VERDICTS",{"job":mj(),"json":vj(True),"problem":""},emits({"event":"LLM_CLASSIFY_MANY_RESULT","payload":{"verdicts":[{"id":"x","category":"a","confidence":0.8,"reasoning":"because"}]}},never=["LLM_FAILED"]))])
case("a-classify-many-verdict-with-an-undeclared-category-is-still-refused",[step("PlainLlm","LLM_CHAT_JSON",{"job":mj(),"json":J({"verdicts":[{"id":"1","category":"zzz","confidence":0.8,"reasoning":"r"}]})},emits({"event":"LLM_CHAT_CHECKED","payload":{"issues":": every category must be a declared one"}}))])
# first byte
armed=emits({"event":"LLM_FIRST_BYTE_START","payload":{"key":kk,"delayMs":5000}})
sendstep=step("KnobLlm","LLM_GENERATE",{"userPrompt":"hi"},armed)
ok=J({"choices":[{"message":{"content":"hello"}}],"usage":{"prompt_tokens":1,"completion_tokens":1}})
import base64
b=lambda s: base64.b64encode(s.encode()).decode()
okres=lambda k: step("KnobLlm","LLM_CHAT_WIRE_RESULT",{"key":k,"status":200,"headers":{},"body":b(ok),"attempts":1,"pages":1},emits({"event":"LLM_FIRST_BYTE_STOP","payload":{"key":k}},{"event":"LLM_GENERATE_RESULT","payload":{"content":"hello"}},never=["LLM_FAILED"]))
elapsed=lambda k,exp: step("KnobLlm","LLM_FIRST_BYTE_ELAPSED",{"key":k,"waitedMs":5000},exp)
resent=emits({"event":"LLM_CHAT_WIRE_CANCEL","payload":{"key":kk}},{"event":"LLM_CHAT_WIRE","payload":{"key":kk,"json":kbody}},{"event":"LLM_FIRST_BYTE_START","payload":{"key":kk,"delayMs":5000}},never=["LLM_FAILED"])
case("a-first-byte-miss-aborts-the-request-on-the-wire-and-sends-it-once-more-and-the-answer-then-completes",[sendstep,elapsed(kk,resent),okres(kk)])
case("a-second-first-byte-miss-ends-in-llm-failed-first-byte-timeout",[sendstep,elapsed(kk,resent),elapsed(kk,emits({"event":"LLM_CHAT_WIRE_CANCEL","payload":{"key":kk}},{"event":"LLM_FAILED","payload":{"code":"first-byte-timeout"}},never=["LLM_CHAT_WIRE"]))])
case("control-a-second-miss-after-the-answer-did-nothing-is-ignored",[sendstep,okres(kk),elapsed(kk,{"neverEmits":["LLM_CHAT_WIRE_CANCEL","LLM_CHAT_WIRE","LLM_FAILED"]})])
sj=gjob("c2",True); sk=wkey(sj)
frame=step("KnobLlm","LLM_CHAT_WIRE_STREAM",{"key":sk,"data":J({"choices":[{"delta":{"content":"h"}}]})},emits({"event":"LLM_FIRST_BYTE_STOP","payload":{"key":sk}},{"event":"LLM_GENERATE_DELTA","payload":{"delta":"h"}}))
case("the-first-stream-frame-disarms-the-first-byte-deadline-so-a-late-elapse-aborts-nothing",[
 step("KnobLlm","LLM_GENERATE",{"userPrompt":"hi","key":"c2","stream":True},emits({"event":"LLM_FIRST_BYTE_START","payload":{"key":sk,"delayMs":5000}})),
 frame,elapsed(sk,{"neverEmits":["LLM_CHAT_WIRE_CANCEL","LLM_FAILED"]})])
case("a-wire-failure-disarms-the-first-byte-deadline",[sendstep,step("KnobLlm","LLM_CHAT_WIRE_FAILED",{"key":kk,"error":"x","kind":"io"},emits({"event":"LLM_FIRST_BYTE_STOP","payload":{"key":kk}})),elapsed(kk,{"neverEmits":["LLM_CHAT_WIRE_CANCEL"]})])
tsess=J({"key":"t1","model":M,"system":"sys","userPrompt":"hi","maxSteps":8,"tools":TOOLS,"messages":msgs("sys"),"steps":[],"usage":{"promptTokens":0,"completionTokens":0,"totalTokens":0,"modelCalls":0}})
tkey=wkey(tsess,"tools")
case("a-first-byte-miss-on-a-tool-call-resends-the-same-model-call-and-a-second-miss-fails-the-run-under-its-key",[
 elapsed(tkey,emits({"event":"LLM_CHAT_WIRE_CANCEL","payload":{"key":tkey}},{"event":"LLM_CHAT_WIRE","payload":{"key":tkey,"json":"{}"}},never=["LLM_FAILED"])),
 elapsed(tkey,emits({"event":"LLM_FAILED","payload":{"code":"first-byte-timeout","key":"t1"}}))],
 entity={"fbArmed":[{"key":tkey,"kind":"tools","id":tsess,"body":"{}","retried":False}]})
# cache
def ejob(text,temp,ck=None,stream=False):
    d={"action":"extract","attempt":0,"system":"You are a structured data extractor. Extract data from the given text according to this schema:\n\n{}\n\nReturn ONLY valid JSON matching the schema.","user":text,"base":text,"model":M,"temperature":temp,"maxTokens":0,"categories":[],"itemIds":[],"callKey":"","images":[],"stream":stream}
    if ck: d["ck"]=ck
    return J(d)
def ck_of(action,system,base,temp,maxt,cats=""):
    f=[action,"openrouter",M,temp,maxt,system,base,cats,""]
    return hashlib.sha256("|".join("%d:%s"%(len(x),x) for x in f).encode()).hexdigest()
esys="You are a structured data extractor. Extract data from the given text according to this schema:\n\n{}\n\nReturn ONLY valid JSON matching the schema."
ek=ck_of("extract",esys,"doc","0","0")
ep={"text":"doc","schema":"{}","temperature":0}
T0=1700000000000
TTL=604800000
store=lambda now,res="{\"a\":1}": step("CacheLlm","LLM_CACHE_STORE",{"key":ek,"result":res},emits({"event":"LLM_CACHE_STORED"}),now=now)
lookup=emits({"event":"LLM_CACHE_LOOKUP","payload":{"job":ejob("doc",0,ek)}},{"event":"LLM_CHAT_SEND","payload":{"job":ejob("doc",0,ek)}},{"event":"LLM_CHAT_WIRE"})
reply=J({"choices":[{"message":{"content":"{\"a\":1}"}}],"usage":{"prompt_tokens":1,"completion_tokens":1}})
ewk=wkey(ejob("doc",0,ek))
done=step("CacheLlm","LLM_CHAT_WIRE_RESULT",{"key":ewk,"status":200,"headers":{},"body":b(reply),"attempts":1,"pages":1},emits({"event":"LLM_EXTRACT_RESULT","payload":{"json":"{\"a\":1}"}},{"event":"LLM_CACHE_STORE","payload":{"key":ek,"result":"{\"a\":1}"}},{"event":"LLM_CACHE_STORED"}),now=T0)
hit=lambda now,res="{\"a\":1}": step("CacheLlm","LLM_EXTRACT",ep,emits({"event":"LLM_EXTRACT_RESULT","payload":{"json":res}},never=["LLM_CHAT_WIRE","LLM_CACHE_STORE"]),now=now)
case("a-cache-miss-sends-the-request-and-writes-the-validated-reply-under-the-request-key-and-the-next-call-hits",[step("CacheLlm","LLM_EXTRACT",ep,lookup,now=T0),done,hit(T0+1000)])
case("a-cache-hit-within-the-ttl-answers-the-result-with-no-request-and-no-write",[store(T0),hit(T0+TTL-1)])
case("edge-a-row-exactly-ttl-old-is-expired",[store(T0),step("CacheLlm","LLM_EXTRACT",ep,emits({"event":"LLM_CHAT_WIRE"},never=["LLM_EXTRACT_RESULT"]),now=T0+TTL)])
case("an-expired-cache-row-is-a-miss-the-request-is-sent-and-the-row-replaced",[store(T0,"{\"old\":1}"),
 step("CacheLlm","LLM_EXTRACT",ep,emits({"event":"LLM_CHAT_WIRE"},never=["LLM_EXTRACT_RESULT"]),now=T0+TTL+1),
 step("CacheLlm","LLM_CHAT_WIRE_RESULT",{"key":ewk,"status":200,"headers":{},"body":b(reply),"attempts":1,"pages":1},emits({"event":"LLM_EXTRACT_RESULT","payload":{"json":"{\"a\":1}"}},{"event":"LLM_CACHE_STORE"},{"event":"LLM_CACHE_STORED"}),now=T0+TTL+2),
 hit(T0+TTL+3)])
case("control-a-request-above-temperature-0-is-never-cached",[step("CacheLlm","LLM_EXTRACT",{"text":"doc","schema":"{}","temperature":0.2},emits({"event":"LLM_CHAT_WIRE"},never=["LLM_CACHE_LOOKUP"]))])
case("control-a-tool-call-is-never-cached",[step("CacheLlm","LLM_CALL_TOOLS",tp,emits({"event":"LLM_CHAT_WIRE"},never=["LLM_CACHE_LOOKUP"]))])
case("control-with-the-cache-knob-off-a-temperature-0-request-is-sent",[step("PlainLlm","LLM_EXTRACT",ep,emits({"event":"LLM_CHAT_WIRE"},never=["LLM_CACHE_LOOKUP"]))])
gk=ck_of("generate",SYS,"hi","0","1024")
case("a-cached-stream-generate-answers-the-final-result-directly-with-zero-usage-and-no-delta",[
 step("CacheLlm","LLM_CACHE_STORE",{"key":gk,"result":"cached text"},emits({"event":"LLM_CACHE_STORED"}),now=T0),
 step("CacheLlm","LLM_GENERATE",{"userPrompt":"hi","temperature":0,"stream":True},emits({"event":"LLM_GENERATE_RESULT","payload":{"content":"cached text","usage":{"promptTokens":0,"completionTokens":0,"totalTokens":0}}},never=["LLM_GENERATE_DELTA","LLM_CHAT_WIRE","LLM_USAGE_REPORTED"]),now=T0+1)])
csys="You are a text classifier. Classify the given text into one of these categories: a, b. Return JSON with: category, confidence (0-1), and reasoning."
ckc=ck_of("classify",csys,"t","0","0","a,b")
case("a-classify-at-temperature-0-is-answered-from-the-cache",[
 step("CacheLlm","LLM_CACHE_STORE",{"key":ckc,"result":rep("a")},emits({"event":"LLM_CACHE_STORED"}),now=T0),
 step("CacheLlm","LLM_CLASSIFY",{"text":"t","categories":["a","b"],"temperature":0},emits({"event":"LLM_CLASSIFY_RESULT","payload":{"category":"a","confidence":0.9,"reasoning":"r"}},never=["LLM_CHAT_WIRE","LLM_CACHE_STORE"]),now=T0+1)])
case("a-store-failure-other-than-not-found-fails-the-request-and-sends-nothing",[step("CacheLlm","LLM_CACHE_ABSENT",{"code":"denied","error":"no store"},emits({"event":"LLM_FAILED","payload":{"code":"cache-read-failed","key":"k9"}},never=["LLM_CHAT_WIRE"]),entity={"cacheQueue":[ejob("doc",0,ek).replace('"callKey":""','"callKey":"k9"')]})])
case("a-cache-write-failure-is-reported-and-never-hidden",[step("CacheLlm","LLM_CACHE_NOT_STORED",{"error":"disk full"},emits({"event":"LLM_CACHE_WRITE_FAILED","payload":{"message":"disk full"}}))])
json.dump({"atom":"spec/connect/llm-knobs-fixture.lolo","trait":"PlainLlm","note":"std-llm request knobs: openrouter provider routing, reasoning switch, tool temperature and parallel calls, cache control, classify instructions and classify-many reasoning, first-byte timeout with one re-send, and the temperature-0 response cache","cases":cases},open(sys.argv[1],"w"),indent=1)
print(len(cases))
