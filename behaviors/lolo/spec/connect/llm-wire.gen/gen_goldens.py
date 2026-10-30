import json,base64,sys
b=lambda s: base64.b64encode(s.encode()).decode()
J=lambda o: json.dumps(o,separators=(',',':'))
cases=[]
def case(id,steps): cases.append({"id":id,"steps":steps})
def job(model,key,stream,system="You are a helpful assistant.",prompt="hi"):
    return J({"action":"generate","attempt":0,"system":system,"user":prompt,"base":prompt,"model":model,"temperature":0.7,"maxTokens":1024,"categories":[],"itemIds":[],"callKey":key,"images":[],"stream":stream})
def wkey(j): return J({"kind":"chat","id":j})
ABODY=lambda stream: J({"model":"claude-sonnet-4-5","stream":stream,"max_tokens":1024,"temperature":0.7,"messages":[{"role":"user","content":"hi"}],"system":[{"type":"text","text":"You are a helpful assistant.","cache_control":{"type":"ephemeral"}}]})
wire=lambda key,path,headers,body,stream: {"event":"LLM_CHAT_WIRE","payload":{"key":key,"method":"POST","path":path,"query":{},"headers":headers,"json":body,"form":{},"multipartParts":[],"stream":stream,"retryMax":0,"retryOn":[],"retryOnFailure":[],"retryDelaysMs":[],"paginate":"none","maxPages":1}}
def send(key,target,headers,body,stream): return {"event":"HTTP_SEND","payload":{"key":key,"method":"POST","target":target,"headers":headers,"body":b(body),"stream":stream}}
def start(trait,event,key,stream,exp):
    p={"userPrompt":"hi"}
    if key: p["key"]=key
    if stream: p["stream"]=True
    return {"trait":trait,"event":event,"payload":p,"expect":exp}
def result(trait,key,status,body,exp):
    return {"trait":trait,"event":"LLM_CHAT_WIRE_RESULT","payload":{"key":key,"status":status,"headers":{"content-type":"application/json"},"body":b(body),"attempts":1,"pages":1},"expect":exp}
AH=[{"name":"Accept","value":"application/json"},{"name":"anthropic-version","value":"2023-06-01"},{"name":"content-type","value":"application/json"}]
def anthropic_start(key,stream,extra=()):
    j=job("claude-sonnet-4-5",key,stream); k=wkey(j); body=ABODY(stream)
    acc="text/event-stream" if stream else "application/json"
    hs=[{"name":"Accept","value":acc},{"name":"anthropic-version","value":"2023-06-01"},{"name":"content-type","value":"application/json"}]
    head="POST /v1/messages HTTP/1.1\r\nhost: api.anthropic.com\r\nx-api-key: "
    tail="\r\naccept: %s\r\nanthropic-version: 2023-06-01\r\ncontent-type: application/json\r\ncontent-length: %d\r\n%s\r\n%s"%(acc,len(body.encode()),"connection: close\r\n" if stream else "",body)
    exp={"emits":[wire(k,"/v1/messages",{"Accept":acc,"anthropic-version":"2023-06-01"},body,"sse" if stream else "none"),
                  send(k,"/v1/messages",hs,body,"sse" if stream else "none"),
                  {"event":"TIMEOUT_START","payload":{"delayMs":300000}},
                  {"event":"HC_BUILT","payload":{"head":b(head),"request":b(tail)}}]+list(extra)}
    return k,exp
k,exp=anthropic_start("c1",False)
case("an-anthropic-chat-is-a-messages-request-with-the-api-key-as-a-credential-segment-never-as-payload",[start("AnthropicLlm","LLM_GENERATE_ANTHROPIC","c1",False,exp)])
rb=J({"content":[{"type":"text","text":"hello"}],"usage":{"input_tokens":3,"output_tokens":1}})
case("the-anthropic-reply-comes-back-as-the-generated-text",[result("AnthropicLlm",k,200,rb,{"emits":[{"event":"LLM_GENERATE_RESULT","payload":{"content":"hello"}}],"neverEmits":["LLM_FAILED"]})])
case("control-an-anthropic-401-is-a-failure-and-gives-no-text",[result("AnthropicLlm",k,401,J({"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}),{"emits":[{"event":"LLM_FAILED"}],"neverEmits":["LLM_GENERATE_RESULT"]})])
ks,exps=anthropic_start("c2",True)
ev=lambda t: {"trait":"AnthropicLlm","event":"LLM_CHAT_WIRE_STREAM","payload":{"key":ks,"data":J({"type":"content_block_delta","delta":{"type":"text_delta","text":t}})}}
s1=ev("hel"); s1["expect"]={"emits":[{"event":"LLM_GENERATE_DELTA","payload":{"key":"c2","delta":"hel","text":"hel"}}]}
s2=ev("lo"); s2["expect"]={"emits":[{"event":"LLM_GENERATE_DELTA","payload":{"key":"c2","delta":"lo","text":"hello"}}]}
done={"trait":"AnthropicLlm","event":"LLM_CHAT_WIRE_RESULT","payload":{"key":ks,"status":200,"headers":{"content-type":"text/event-stream"},"body":"","attempts":1,"pages":1},"expect":{"emits":[{"event":"LLM_GENERATE_RESULT","payload":{"content":"hello"}}],"neverEmits":["LLM_FAILED"]}}
case("an-anthropic-stream-is-an-sse-request-and-each-frame-is-a-delta-before-the-whole-text",[start("AnthropicLlm","LLM_GENERATE_ANTHROPIC","c2",True,exps),s1,s2,done])
case("control-a-non-streaming-call-asks-for-json-and-the-wire-reads-no-frames",[start("AnthropicLlm","LLM_GENERATE_ANTHROPIC","c1",False,{"emits":[wire(k,"/v1/messages",{"Accept":"application/json","anthropic-version":"2023-06-01"},ABODY(False),"none")],"neverEmits":["LLM_GENERATE_DELTA"]})])
# keyless local server: no authorization header is written
lj=job("qwen3-30b-a3b","",False); lk=wkey(lj)
lbody=J({"model":"qwen3-30b-a3b","temperature":0.7,"stream":False,"max_tokens":1024,"messages":[{"role":"system","content":"You are a helpful assistant."},{"role":"user","content":"hi"}]})
ltail="POST /v1/chat/completions HTTP/1.1\r\nhost: 127.0.0.1:1234\r\naccept: application/json\r\ncontent-type: application/json\r\ncontent-length: %d\r\n\r\n%s"%(len(lbody.encode()),lbody)
case("a-keyless-lm-studio-chat-writes-no-authorization-header",[start("LocalLlm","LLM_GENERATE_LOCAL",None,False,{"emits":[wire(lk,"/v1/chat/completions",{"Accept":"application/json"},lbody,"none"),{"event":"HC_BUILT","payload":{"head":"","request":b(ltail)}}],"neverEmits":["HTTP_FAILED","HTTP_REQUEST_REFUSED"]})])
# cancel aborts the request on the wire. The harness answers a connect as a failure, so the in-flight rows are seeded.
k,exp=anthropic_start("c1",False)
j1=job("claude-sonnet-4-5","c1",False)
SEED={"inflight":[{"key":"c1","httpKey":j1,"wireKey":k}]}
can=lambda key: {"trait":"AnthropicLlm","event":"LLM_CANCEL_ANTHROPIC","payload":{"key":key}}
c1=dict(can("c1")); c1["expect"]={"emits":[{"event":"LLM_CHAT_WIRE_CANCEL","payload":{"key":k}},{"event":"LLM_CANCELLED","payload":{"key":"c1"}}],"neverEmits":["LLM_FAILED","LLM_GENERATE_RESULT"]}
case("a-cancel-announces-the-chat-wire-key-to-abort",[c1])
cases[-1]["entity"]=SEED
c2=dict(can("other")); c2["expect"]={"neverEmits":["LLM_CHAT_WIRE_CANCEL","HTTP_CANCEL","LLM_CANCELLED"]}
rep=result("AnthropicLlm",k,200,rb,{"emits":[{"event":"LLM_GENERATE_RESULT","payload":{"content":"hello"}}]})
case("control-a-cancel-for-another-key-leaves-the-chat-request-in-flight",[c2,rep])
cases[-1]["entity"]=SEED
# the wire side: the request trait aborts the client call
rq={"trait":"AnthropicRequest","event":"HTTP_REQUEST_CANCEL","payload":{"key":k},"from":"awaiting","expect":{"state":"ready","emits":[{"event":"TIMEOUT_STOP"},{"event":"HTTP_CANCEL","payload":{"key":k}}],"neverEmits":["HTTP_REQUEST_FAILED","HTTP_RESULT"]}}
REQ={"req":{"key":k,"method":"POST","path":"/v1/messages","query":{},"headers":{},"form":{},"multipartParts":[],"stream":"none","retryMax":0,"retryOn":[],"retryOnFailure":[],"retryDelaysMs":[],"paginate":"none","maxPages":1}}
case("the-chat-wire-cancel-aborts-the-client-call-through-the-request",[rq])
cases[-1]["entity"]=dict(REQ)
to={"trait":"AnthropicRequest","event":"TIMEOUT_ELAPSED","payload":{"waitedMs":300000},"from":"awaiting","expect":{"state":"ready","emits":[{"event":"HTTP_CANCEL","payload":{"key":k}},{"event":"HTTP_REQUEST_FAILED","payload":{"key":k,"kind":"timeout"}}],"neverEmits":["HTTP_RESULT"]}}
case("a-passed-deadline-aborts-the-client-call-and-fails-the-request-as-a-timeout",[to])
cases[-1]["entity"]=dict(REQ)
tf={"trait":"AnthropicLlm","event":"LLM_CHAT_WIRE_FAILED","payload":{"key":k,"error":"the request timed out","kind":"timeout"},"expect":{"emits":[{"event":"LLM_FAILED"}],"neverEmits":["LLM_GENERATE_RESULT"]}}
case("a-timeout-from-the-wire-fails-the-chat-call",[tf])
# an embeddings call is cancelled the same way: the wire key is its job
ejob=J({"generic":0,"limited":0,"model":"baai/bge-base-en-v1.5","texts":["a"],"callKey":"e1"})
case("a-cancel-announces-the-embeddings-wire-key-to-abort",[
 {"trait":"AnthropicLlm","event":"LLM_EMBED","payload":{"texts":["a"],"key":"e1"},"expect":{"emits":[{"event":"LLM_EMBED_WIRE","payload":{"key":ejob}}]}},
 {"trait":"AnthropicLlm","event":"LLM_CANCEL_ANTHROPIC","payload":{"key":"e1"},"expect":{"emits":[{"event":"LLM_EMBED_WIRE_CANCEL","payload":{"key":ejob}},{"event":"LLM_CANCELLED","payload":{"key":"e1"}}],"neverEmits":["LLM_FAILED","LLM_EMBED_RESULT"]}}])
case("control-an-embeddings-cancel-for-another-key-aborts-nothing",[
 {"trait":"AnthropicLlm","event":"LLM_EMBED","payload":{"texts":["a"],"key":"e1"},"expect":{"emits":[{"event":"LLM_EMBED_WIRE"}]}},
 {"trait":"AnthropicLlm","event":"LLM_CANCEL_ANTHROPIC","payload":{"key":"other"},"expect":{"neverEmits":["LLM_EMBED_WIRE_CANCEL","LLM_CANCELLED"]}}])
json.dump({"atom":"spec/connect/llm-wire-fixture.lolo","trait":"AnthropicLlm","note":"std-llm over std-http-request and std-http-client: an anthropic Messages request and its streamed round trip, a keyless LM Studio request, cancel and the deadline on the wire","cases":cases},open(sys.argv[1],"w"),indent=1)
print(len(cases))
