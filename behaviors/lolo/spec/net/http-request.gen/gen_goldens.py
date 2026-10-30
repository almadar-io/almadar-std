import json,base64,sys
b=lambda s: base64.b64encode(s.encode()).decode()
def req(**kw):
    p={"key":"r1","method":"GET","path":"/x","query":{},"headers":{},"form":{},"multipartParts":[],"stream":"none","retryMax":0,"retryOn":[],"retryOnFailure":[],"retryDelaysMs":[],"paginate":"none","maxPages":1}; p.update(kw); return p
def wire(target="/x",headers=(),body="",method="GET",key="r1"):
    return {"event":"HTTP_SEND","payload":{"key":key,"method":method,"target":target,"headers":[{"name":n,"value":v} for n,v in headers],"body":b(body),"stream":"none"}}
cases=[]
def case(id,steps,config=None):
    c={"id":id,"steps":steps}
    if config: c["config"]=config
    cases.append(c)
def one(id,payload,expect,config=None):
    case(id,[{"event":"HTTP_REQUEST","payload":payload,"expect":expect}],config)
def st(ev,payload,expect=None):
    s={"event":ev,"payload":payload}
    if expect: s["expect"]=expect
    return s
ok=lambda *e: {"emits":list(e),"neverEmits":["HTTP_REQUEST_REFUSED"]}
one("a-get-with-a-query-is-percent-encoded-in-map-order",req(query={"q":"a b&c","limit":"2"}),ok(wire("/x?q=a%20b%26c&limit=2")))
one("control-no-query-has-no-question-mark",req(),ok(wire("/x")))
one("a-json-body-sets-content-type-and-bytes",req(method="POST",json='{"a":1}'),ok(wire("/x",[("content-type","application/json")],'{"a":1}',"POST")))
one("a-caller-content-type-wins",req(method="POST",json='{"a":1}',headers={"Content-Type":"application/vnd.api+json"}),ok(wire("/x",[("Content-Type","application/vnd.api+json")],'{"a":1}',"POST")))
one("a-form-body-is-html-encoded",req(method="POST",form={"a":"b c","d":"e&f"}),ok(wire("/x",[("content-type","application/x-www-form-urlencoded")],"a=b+c&d=e%26f","POST")))
one("control-a-form-body-in-rfc3986-writes-a-space-as-percent-20",req(method="POST",form={"a":"b c"}),ok(wire("/x",[("content-type","application/x-www-form-urlencoded")],"a=b%20c","POST")),{"formEncoding":"rfc3986"})
one("a-text-body",req(method="PUT",text="hi"),ok(wire("/x",[("content-type","text/plain; charset=utf-8")],"hi","PUT")))
one("a-bytes-body",req(method="PUT",bytes=b("AB")),ok(wire("/x",[("content-type","application/octet-stream")],"AB","PUT")))
one("rfc3986-query-escapes-the-sub-delims",req(query={"q":"a(b)!"}),ok(wire("/x?q=a%28b%29%21")),{"queryEncoding":"rfc3986"})
one("control-uri-query-leaves-the-sub-delims",req(query={"q":"a(b)!"}),ok(wire("/x?q=a(b)!")))
ref=lambda: {"emits":[{"event":"HTTP_REQUEST_REFUSED","payload":{"key":"r1"}}],"neverEmits":["HTTP_SEND"]}
one("two-body-keys-are-refused",req(method="POST",json="{}",text="x"),ref())
one("a-path-without-a-slash-is-refused",req(path="x"),ref())
one("an-empty-query-key-is-refused",req(query={"":"v"}),ref())
one("an-unknown-pagination-is-refused",req(paginate="cursor"),ref())
# multipart
mp=lambda kind="related",bd="BND",parts=None: req(method="POST",multipartKind=kind,multipartBoundary=bd,multipartParts=parts if parts is not None else [{"headers":{"Content-Type":"application/json"},"text":'{"n":1}'},{"headers":{"Content-Type":"text/plain"},"bytes":b("raw")}])
body="--BND\r\nContent-Type: application/json\r\n\r\n{\"n\":1}\r\n--BND\r\nContent-Type: text/plain\r\n\r\nraw\r\n--BND--\r\n"
one("a-multipart-related-body-is-framed-by-the-boundary",mp(),ok(wire("/x",[("content-type","multipart/related; boundary=BND")],body,"POST")))
one("a-multipart-form-data-body-names-its-kind",mp("form-data"),ok(wire("/x",[("content-type","multipart/form-data; boundary=BND")],body,"POST")))
one("a-multipart-boundary-that-is-not-allowed-is-refused",mp(bd="a b"),ref())
one("a-multipart-kind-that-is-unknown-is-refused",mp("mixed"),ref())
one("a-multipart-with-no-parts-is-refused",mp(parts=[]),ref())
one("a-multipart-part-with-both-text-and-bytes-is-refused",mp(parts=[{"headers":{},"text":"a","bytes":b("b")}]),ref())
one("a-multipart-part-with-neither-text-nor-bytes-is-refused",mp(parts=[{"headers":{}}]),ref())
one("multipart-and-json-together-are-refused",dict(mp(),json="{}"),ref())
# retry
RR=dict(retryMax=2,retryOn=[503],retryOnFailure=["timeout"],retryDelaysMs=[10,20])
rep=lambda status,headers=None,body="": {"event":"HTTP_REPLIED","payload":{"key":"r1","status":status,"headers":headers or {},"body":b(body)}}
def sendstep(**kw): return st("HTTP_REQUEST",req(**kw),{"emits":[wire()]})
el=lambda: st("RETRY_ELAPSED",{"waitedMs":10})
case("a-503-is-retried-after-each-delay-until-it-succeeds",[
 sendstep(**RR),
 dict(rep(503),expect={"emits":[{"event":"RETRY_WAIT","payload":{"delayMs":10}}],"neverEmits":["HTTP_RESULT"]}),
 dict(el(),expect={"emits":[wire()]}),
 dict(rep(503),expect={"emits":[{"event":"RETRY_WAIT","payload":{"delayMs":20}}]}),
 dict(el(),expect={"emits":[wire()]}),
 dict(rep(200,{"a":"b"},"ok"),expect={"emits":[{"event":"HTTP_RESULT","payload":{"key":"r1","status":200,"attempts":3,"pages":1}}],"neverEmits":["RETRY_WAIT"]})])
case("control-a-404-is-a-result-not-a-retry",[sendstep(**RR),dict(rep(404),expect={"emits":[{"event":"HTTP_RESULT","payload":{"status":404,"attempts":1}}],"neverEmits":["RETRY_WAIT"]})])
case("the-last-delay-repeats-and-the-retries-run-out",[
 sendstep(retryMax=3,retryOn=[503],retryDelaysMs=[10]),
 dict(rep(503),expect={"emits":[{"event":"RETRY_WAIT","payload":{"delayMs":10}}]}),dict(el(),expect={"emits":[wire()]}),
 dict(rep(503),expect={"emits":[{"event":"RETRY_WAIT","payload":{"delayMs":10}}]}),dict(el(),expect={"emits":[wire()]}),
 dict(rep(503),expect={"emits":[{"event":"RETRY_WAIT","payload":{"delayMs":10}}]}),dict(el(),expect={"emits":[wire()]}),
 dict(rep(503),expect={"emits":[{"event":"HTTP_RESULT","payload":{"status":503,"attempts":4}}],"neverEmits":["RETRY_WAIT"]})])
fail=lambda kind: {"event":"HTTP_FAILED","payload":{"key":"r1","error":"e","kind":kind}}
case("a-timeout-failure-is-retried",[sendstep(**RR),dict(fail("timeout"),expect={"emits":[{"event":"RETRY_WAIT","payload":{"delayMs":10}}]})])
case("control-a-denied-failure-is-not-retried",[sendstep(**RR),dict(fail("denied"),expect={"emits":[{"event":"HTTP_REQUEST_FAILED","payload":{"key":"r1","kind":"denied"}}],"neverEmits":["RETRY_WAIT"]})])
case("a-second-request-while-waiting-to-retry-is-refused",[sendstep(**RR),dict(rep(503),expect={"emits":[{"event":"RETRY_WAIT"}]}),st("HTTP_REQUEST",req(key="r2"),{"emits":[{"event":"HTTP_REQUEST_REFUSED","payload":{"key":"r2"}}]})])
# pagination
LK='<https://api.example.test/x?page=2>; rel="next", <https://api.example.test/x?page=9>; rel="last"'
case("link-header-pagination-follows-rel-next-to-the-last-page",[
 st("HTTP_REQUEST",req(paginate="link-header",maxPages=5),{"emits":[wire()]}),
 dict(rep(200,{"link":LK},"p1"),expect={"emits":[{"event":"HTTP_PAGE","payload":{"page":1,"status":200,"body":b("p1")}},wire("/x?page=2")],"neverEmits":["HTTP_RESULT"]}),
 dict(rep(200,{},"p2"),expect={"emits":[{"event":"HTTP_PAGE","payload":{"page":2,"body":b("p2")}},{"event":"HTTP_RESULT","payload":{"status":200,"pages":2,"body":b("p2")}}]})])
case("link-header-pagination-stops-at-max-pages",[
 st("HTTP_REQUEST",req(paginate="link-header",maxPages=1),{"emits":[wire()]}),
 dict(rep(200,{"link":LK},"p1"),expect={"emits":[{"event":"HTTP_PAGE","payload":{"page":1}},{"event":"HTTP_RESULT","payload":{"pages":1}}],"neverEmits":["HTTP_SEND"]})])
case("control-a-link-header-without-rel-next-ends-the-pages",[
 st("HTTP_REQUEST",req(paginate="link-header",maxPages=5),{"emits":[wire()]}),
 dict(rep(200,{"link":'<https://api.example.test/x?page=1>; rel="prev"'},"p1"),expect={"emits":[{"event":"HTTP_PAGE"},{"event":"HTTP_RESULT","payload":{"pages":1}}],"neverEmits":["HTTP_SEND"]})])
case("caller-pagination-waits-for-next-and-sends-the-new-query",[
 st("HTTP_REQUEST",req(paginate="caller",maxPages=3,query={"page":"1"}),{"emits":[wire("/x?page=1")]}),
 dict(rep(200,{},"p1"),expect={"state":"paging","emits":[{"event":"HTTP_PAGE","payload":{"page":1}}],"neverEmits":["HTTP_RESULT"]}),
 st("HTTP_NEXT",{"key":"r1","query":{"page":"2"}},{"state":"awaiting","emits":[wire("/x?page=2")]})])
case("caller-pagination-ends-on-stop",[
 st("HTTP_REQUEST",req(paginate="caller",maxPages=3),{"emits":[wire()]}),
 dict(rep(200,{},"p1"),expect={"state":"paging"}),
 st("HTTP_STOP",{"key":"r1"},{"state":"ready","emits":[{"event":"HTTP_RESULT","payload":{"pages":1}}]})])
case("a-request-while-paging-is-refused",[
 st("HTTP_REQUEST",req(paginate="caller",maxPages=3),{"emits":[wire()]}),dict(rep(200,{},"p1"),expect={"state":"paging"}),
 st("HTTP_REQUEST",req(key="r2"),{"emits":[{"event":"HTTP_REQUEST_REFUSED","payload":{"key":"r2"}}]})])

# deadline and cancel
tstart=lambda ms: {"event":"TIMEOUT_START","payload":{"delayMs":ms}}
tstop={"event":"TIMEOUT_STOP"}
tel=lambda: st("TIMEOUT_ELAPSED",{"waitedMs":5000})
cancel=lambda key="r1": st("HTTP_REQUEST_CANCEL",{"key":key})
hcancel=lambda key="r1": {"event":"HTTP_CANCEL","payload":{"key":key}}
NORES=["HTTP_RESULT","HTTP_REQUEST_FAILED","HTTP_REQUEST_REFUSED","HTTP_PAGE"]
case("a-request-with-its-own-timeout-arms-that-deadline",[st("HTTP_REQUEST",req(timeoutMs=5000),{"emits":[wire(),tstart(5000)]})])
case("a-request-without-a-timeout-arms-the-configured-deadline",[st("HTTP_REQUEST",req(),{"emits":[wire(),tstart(1500)]})],{"timeoutMs":1500})
case("control-a-timeout-of-zero-arms-no-deadline",[st("HTTP_REQUEST",req(timeoutMs=0),{"emits":[wire()],"neverEmits":["TIMEOUT_START"]})])
case("control-a-configured-timeout-of-zero-arms-no-deadline",[st("HTTP_REQUEST",req(),{"emits":[wire()],"neverEmits":["TIMEOUT_START"]})],{"timeoutMs":0})
case("a-reply-disarms-the-deadline",[st("HTTP_REQUEST",req(timeoutMs=5000),{"emits":[wire(),tstart(5000)]}),dict(rep(200,{},"ok"),expect={"emits":[tstop,{"event":"HTTP_RESULT","payload":{"status":200}}]})])
case("a-failure-disarms-the-deadline",[st("HTTP_REQUEST",req(timeoutMs=5000),{"emits":[wire(),tstart(5000)]}),dict(fail("denied"),expect={"emits":[tstop,{"event":"HTTP_REQUEST_FAILED","payload":{"kind":"denied"}}]})])
case("a-passed-deadline-aborts-the-wire-call-and-fails-the-request-as-a-timeout",[
 st("HTTP_REQUEST",req(timeoutMs=5000),{"emits":[wire(),tstart(5000)]}),
 dict(tel(),expect={"state":"ready","emits":[hcancel(),{"event":"HTTP_REQUEST_FAILED","payload":{"key":"r1","kind":"timeout","error":"the request timed out"}}],"neverEmits":["HTTP_RESULT","RETRY_WAIT"]}),
 dict(rep(200,{},"late"),expect={"state":"ready","neverEmits":["HTTP_RESULT","HTTP_REQUEST_FAILED"]})])
case("a-passed-deadline-is-retried-when-retry-on-failure-names-timeout",[
 st("HTTP_REQUEST",req(timeoutMs=5000,retryMax=1,retryOnFailure=["timeout"],retryDelaysMs=[10]),{"emits":[wire(),tstart(5000)]}),
 dict(tel(),expect={"state":"waiting","emits":[hcancel(),{"event":"RETRY_WAIT","payload":{"delayMs":10}}],"neverEmits":["HTTP_REQUEST_FAILED"]}),
 dict(el(),expect={"state":"awaiting","emits":[wire(),tstart(5000)]}),
 dict(tel(),expect={"state":"ready","emits":[hcancel(),{"event":"HTTP_REQUEST_FAILED","payload":{"kind":"timeout"}}],"neverEmits":["RETRY_WAIT"]})])
case("control-a-deadline-that-passes-when-no-request-waits-does-nothing",[dict(tel(),expect={"state":"ready","neverEmits":["HTTP_CANCEL"]+NORES})])
case("a-cancel-aborts-the-wire-call-disarms-the-deadline-and-answers-nothing",[
 st("HTTP_REQUEST",req(timeoutMs=5000),{"emits":[wire(),tstart(5000)]}),
 dict(cancel(),expect={"state":"ready","emits":[tstop,hcancel()],"neverEmits":NORES}),
 dict(rep(200,{},"late"),expect={"state":"ready","neverEmits":NORES}),
 dict(fail("io"),expect={"state":"ready","neverEmits":NORES+["RETRY_WAIT"]})])
case("control-a-cancel-for-another-key-leaves-the-request-in-flight",[
 st("HTTP_REQUEST",req(timeoutMs=5000),{"emits":[wire(),tstart(5000)]}),
 dict(cancel("other"),expect={"state":"awaiting","neverEmits":["HTTP_CANCEL","TIMEOUT_STOP"]+NORES}),
 dict(rep(200,{},"ok"),expect={"emits":[{"event":"HTTP_RESULT","payload":{"status":200}}]})])
case("a-cancel-while-waiting-to-retry-disarms-the-retry-delay",[
 sendstep(**RR),dict(rep(503),expect={"state":"waiting","emits":[{"event":"RETRY_WAIT"}]}),
 dict(cancel(),expect={"state":"ready","emits":[{"event":"RETRY_STOP"}],"neverEmits":["HTTP_CANCEL"]+NORES}),
 dict(el(),expect={"state":"ready","neverEmits":["HTTP_SEND"]+NORES})])
case("a-cancel-while-paging-ends-the-request-silently",[
 st("HTTP_REQUEST",req(paginate="caller",maxPages=3),{"emits":[wire()]}),dict(rep(200,{},"p1"),expect={"state":"paging"}),
 dict(cancel(),expect={"state":"ready","neverEmits":["HTTP_RESULT","HTTP_CANCEL"]}),
 st("HTTP_NEXT",{"key":"r1","query":{"page":"2"}},{"state":"ready","neverEmits":["HTTP_SEND","HTTP_RESULT"]})])
case("control-a-cancel-with-no-request-is-a-no-op",[dict(cancel(),expect={"state":"ready","neverEmits":["HTTP_CANCEL"]+NORES})])
case("a-request-after-a-cancel-runs-whole",[
 st("HTTP_REQUEST",req(),{"emits":[wire()]}),dict(cancel(),expect={"state":"ready"}),
 st("HTTP_REQUEST",req(key="r2"),{"emits":[wire(key="r2")]}),
 dict(dict(rep(200,{},"ok"),**{}),expect={"emits":[{"event":"HTTP_RESULT","payload":{"status":200}}]})])
json.dump({"atom":"net/atoms/std-http-request.lolo","trait":"HttpRequest","note":"request composition of the retired drivers/http_request request.rs (query, bodies, multipart) and the retry and pagination of driver.rs; auth is not built","cases":cases},open(sys.argv[1],"w"),indent=1)
print(len(cases))
