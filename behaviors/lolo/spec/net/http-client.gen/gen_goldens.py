import json,base64,sys
out=sys.argv[1]
b=lambda s: base64.b64encode(s.encode()).decode()
def send(key="k1",method="GET",target="/x?a=1",headers=None,body="",stream="none"):
    return {"event":"HTTP_SEND","payload":{"key":key,"method":method,"target":target,"headers":headers or [],"body":b(body),"stream":stream}}
def step(ev,payload,expect=None,frm=None):
    s={"event":ev,"payload":payload}
    if frm: s["from"]=frm
    if expect: s["expect"]=expect
    return s
def start(**kw):
    s=send(**kw); return s
def head(status=200,reason="OK",fields=()):
    return f"HTTP/1.1 {status} {reason}\r\n"+"".join(f"{k}: {v}\r\n" for k,v in fields)+"\r\n"
def read(data,eof=False): return {"data":b(data),"eof":eof,"key":"read"}
def replied(key,status,headers,body):
    return {"event":"HTTP_REPLIED","payload":{"key":key,"status":status,"headers":headers,"body":b(body)}}
def failed(key,kind,error=None):
    p={"key":key,"kind":kind}
    if error: p["error"]=error
    return {"event":"HTTP_FAILED","payload":p}
def flow(sendstep, reads, final, extra=None):
    steps=[]
    st=dict(sendstep); st["expect"]={"state":"connecting","effects":[{"type":"os/tcp-connect","arg0":"api.example.test","arg1":80}]}
    steps.append(st)
    steps.append(step("HC_CONNECTED",{"sock":5,"key":"connect"},{"state":"sending","effects":[{"type":"os/send"}]}))
    steps.append(step("HC_SENT",{"bytes":10,"key":"send"},{"state":"reading","effects":[{"type":"os/recv"}]}))
    for i,(r,ex) in enumerate(reads):
        ex=dict(ex); ex.pop("state",None)
        steps.append(step("HC_READ",r,ex))
    return steps
cases=[]
def case(id,steps,note=None):
    c={"id":id,"steps":steps}
    if note: c["note"]=note
    cases.append(c)
WANT={"state":"reading","effects":[{"type":"os/recv"}]}
OKH=lambda extra=(): [("content-type","text/plain")]+list(extra)
# A content-length reply
body="hello"
raw=head(200,"OK",[("Content-Type","text/plain"),("Content-Length","5")])+body
case("a-get-is-written-and-a-content-length-reply-is-answered",
 flow(send(headers=[{"name":"Accept","value":"text/plain"}]),[(read(raw),{"state":"ready","emits":[replied("k1",200,{"content-type":"text/plain","content-length":"5"},body)],"neverEmits":["HTTP_FAILED"]})],None))
cases[-1]["steps"][0]["expect"]["emits"]=[{"event":"HC_BUILT","payload":{"request":b("GET /x?a=1 HTTP/1.1\r\nhost: api.example.test\r\naccept: text/plain\r\n\r\n")}}]
# control: content-length reply split across reads asks for the second read
case("a-content-length-body-split-across-reads-asks-for-more",
 flow(send(),[(read(head(200,"OK",[("Content-Length","6")])+"abc"),{"state":"reading","emits":[{"event":"HC_WANT"}],"neverEmits":["HTTP_REPLIED","HTTP_FAILED"]}),(read("def"),{"state":"ready","emits":[replied("k1",200,{"content-length":"6"},"abcdef")]})],None))
# head split across reads
case("a-head-split-across-reads-asks-for-more",
 flow(send(),[(read("HTTP/1.1 200 OK\r\nContent-Le"),{"state":"reading","emits":[{"event":"HC_WANT"}],"neverEmits":["HTTP_REPLIED","HTTP_FAILED"]}),(read("ngth: 2\r\n\r\nok"),{"state":"ready","emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None))
# chunked
chunked="5\r\nhello\r\n6;ext=1\r\n world\r\n0\r\nX-Trailer: t\r\n\r\n"
case("a-chunked-body-is-assembled-and-trailers-skipped",
 flow(send(),[(read(head(200,"OK",[("Transfer-Encoding","chunked")])+chunked),{"state":"ready","emits":[replied("k1",200,{"transfer-encoding":"chunked"},"hello world")]})],None))
case("a-chunk-split-across-reads-asks-for-more",
 flow(send(),[(read(head(200,"OK",[("Transfer-Encoding","chunked")])+"5\r\nhel"),{"state":"reading","emits":[{"event":"HC_WANT"}],"neverEmits":["HTTP_REPLIED","HTTP_FAILED"]}),(read("lo\r\n0\r\n\r\n"),{"state":"ready","emits":[replied("k1",200,{"transfer-encoding":"chunked"},"hello")]})],None))
case("a-chunk-size-that-is-not-hex-fails-io",
 flow(send(),[(read(head(200,"OK",[("Transfer-Encoding","chunked")])+"zz\r\nhello\r\n"),{"state":"ready","emits":[failed("k1","io")],"neverEmits":["HTTP_REPLIED"]})],None))
# close delimited
case("a-body-with-no-length-is-read-until-the-peer-closes",
 flow(send(),[(read(head(200,"OK",[("Content-Type","text/plain")])+"par"),{"state":"reading","neverEmits":["HTTP_REPLIED"]}),({"data":b("tial"),"eof":True,"key":"read"},{"state":"ready","emits":[replied("k1",200,{"content-type":"text/plain"},"partial")]})],None))
# no body statuses
case("a-204-has-no-body",
 flow(send(),[(read(head(204,"No Content",[("Content-Length","0")])),{"state":"ready","emits":[replied("k1",204,{"content-length":"0"},"")]})],None))
case("a-head-request-reads-no-body-whatever-the-length",
 flow(send(method="HEAD"),[(read(head(200,"OK",[("Content-Length","99")])),{"state":"ready","emits":[replied("k1",200,{"content-length":"99"},"")]})],None))
# non-2xx is a reply
case("a-500-is-a-reply-not-a-failure",
 flow(send(),[(read(head(500,"Internal Server Error",[("Content-Length","1")])+"x"),{"state":"ready","emits":[replied("k1",500,{"content-length":"1"},"x")],"neverEmits":["HTTP_FAILED"]})],None))
# interim 1xx skipped
case("an-interim-100-head-is-skipped",
 flow(send(method="POST",headers=[{"name":"Content-Type","value":"application/json"}],body='{"a":1}'),[(read(head(100,"Continue")+head(200,"OK",[("Content-Length","2")])+"ok"),{"state":"ready","emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None))
cases[-1]["steps"][0]["expect"]["emits"]=[{"event":"HC_BUILT","payload":{"request":b('POST /x?a=1 HTTP/1.1\r\nhost: api.example.test\r\ncontent-type: application/json\r\ncontent-length: 7\r\n\r\n{"a":1}')}}]
# repeated headers joined
case("repeated-headers-are-joined-with-a-comma-and-a-space",
 flow(send(),[(read(head(200,"OK",[("Set-Cookie","a=1"),("Set-Cookie","b=2"),("Content-Length","0")])),{"state":"ready","emits":[replied("k1",200,{"set-cookie":"a=1, b=2","content-length":"0"},"")]})],None))
# malformed head
case("a-malformed-status-line-fails-io",
 flow(send(),[(read("garbage\r\n\r\n"),{"state":"ready","emits":[failed("k1","io")],"neverEmits":["HTTP_REPLIED"]})],None))
# close before body whole
case("a-close-before-the-content-length-is-met-fails-io",
 flow(send(),[({"data":b(head(200,"OK",[("Content-Length","9")])+"abc"),"eof":True,"key":"read"},{"state":"ready","emits":[failed("k1","io")],"neverEmits":["HTTP_REPLIED"]})],None))
# sse
sse="data: one\n\nevent: ping\nid: 7\ndata: two\ndata: lines\n\n: comment\n\ndata: tail"
case("an-event-stream-delivers-each-frame-and-the-cut-tail-at-the-end",
 flow(send(stream="sse"),[(read(head(200,"OK",[("Content-Type","text/event-stream")])+sse[:sse.index("tail")-6]),{"state":"reading","emits":[{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":"one"}},{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":"two\nlines","event":"ping","id":"7"}}],"neverEmits":["HTTP_REPLIED"]}),({"data":b("data: tail"),"eof":True,"key":"read"},{"state":"ready","emits":[{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":"tail"}},replied("k1",200,{"content-type":"text/event-stream"},"")]})],None))
jl='{"a":1}\n{"b":2}\n{"c":'
case("json-lines-deliver-each-complete-line",
 flow(send(stream="jsonl"),[(read(head(200,"OK",[])+jl),{"state":"reading","emits":[{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":'{"a":1}'}},{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":'{"b":2}'}}],"emitCounts":{"HTTP_STREAM_EVENT":2}}),({"data":b("3}"),"eof":True,"key":"read"},{"state":"ready","emits":[{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":'{"c":3}'}},replied("k1",200,{},"")]})],None))
# refusals (nothing opened)
def refuse(id,**kw):
    s=send(**kw); s["expect"]={"state":"ready","emits":[failed("k1","refused")],"neverEmits":["HC_BUILT"],"effects":[]}
    case(id,[s])
refuse("a-method-that-is-not-a-token-is-refused",method="GE T")
refuse("a-target-without-a-leading-slash-is-refused",target="x")
refuse("a-target-with-a-space-is-refused",target="/a b")
refuse("a-header-value-with-a-newline-is-refused",headers=[{"name":"X","value":"a\nb"}])
refuse("a-caller-content-length-is-refused",headers=[{"name":"Content-Length","value":"3"}])
refuse("a-caller-host-is-refused",headers=[{"name":"Host","value":"evil.test"}])
refuse("an-unknown-stream-is-refused",stream="websocket")
# control: a valid call opens
ok=send(); ok["expect"]={"state":"connecting","neverEmits":["HTTP_FAILED"]}
case("control-a-valid-call-is-not-refused",[ok])
# busy
bz=send(); bz["expect"]={"state":"connecting"}
b2=send(key="k2"); b2["expect"]={"state":"connecting","emits":[failed("k2","refused")]}
case("a-second-call-while-one-is-in-flight-is-refused-busy",[bz,b2])
# transport failures
case("a-denied-connect-keeps-kind-denied",[dict(send(),expect={"state":"connecting"}),step("HC_IO_FAILED",{"error":"net not granted","kind":"denied","key":"connect"},{"state":"ready","emits":[failed("k1","denied","net not granted")]})])
case("a-timeout-keeps-kind-timeout",[dict(send(),expect={"state":"connecting"}),step("HC_CONNECTED",{"sock":5,"key":"connect"},{"state":"sending"}),step("HC_SENT",{"bytes":10,"key":"send"},{"state":"reading"}),step("HC_IO_FAILED",{"error":"read timed out","kind":"timeout","key":"read"},{"state":"ready","emits":[failed("k1","timeout","read timed out")]})])
case("any-other-os-kind-is-io",[dict(send(),expect={"state":"connecting"}),step("HC_IO_FAILED",{"error":"connection refused","kind":"closed","key":"connect"},{"state":"ready","emits":[failed("k1","io","connection refused")]})])

# keep-alive
KEEP=head(200,"OK",[("Content-Length","2")])+"ok"
RAW=lambda bs: base64.b64encode(bs).decode()
def second(id,first_head,second_expect,extra=()):
    steps=flow(send(),[(read(first_head+"ok" if False else first_head),{"emits":[replied("k1",200,{h.split(': ')[0].lower():h.split(': ')[1] for h in first_head.split('\r\n')[1:-2]},"ok")]})],None)
    steps.append(dict(send(key="k2"),expect=second_expect))
    steps.extend(extra)
    case(id,steps)
case("a-keep-alive-socket-is-reused-by-the-next-call",[
 *flow(send(),[(read(KEEP),{"emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None),
 dict(send(key="k2"),expect={"state":"sending","emits":[{"event":"HC_BUILT"}],"neverEmits":["HTTP_FAILED"]})])
case("control-connection-close-is-not-reused",[
 *flow(send(),[(read(head(200,"OK",[("Content-Length","2"),("Connection","close")])+"ok"),{"emits":[replied("k1",200,{"content-length":"2","connection":"close"},"ok")]})],None),
 dict(send(key="k2"),expect={"state":"connecting"})])
case("control-a-close-delimited-reply-is-not-reused",[
 *flow(send(),[({"data":b(head(200,"OK",[])+"x"),"eof":True,"key":"read"},{"emits":[replied("k1",200,{},"x")]})],None),
 dict(send(key="k2"),expect={"state":"connecting"})])
case("control-an-http-1-0-reply-is-not-reused",[
 *flow(send(),[(read("HTTP/1.0 200 OK\r\nContent-Length: 2\r\n\r\nok"),{"emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None),
 dict(send(key="k2"),expect={"state":"connecting"})])
case("a-stale-idle-socket-failing-on-send-retries-on-a-fresh-connection",[
 *flow(send(),[(read(KEEP),{"emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None),
 dict(send(key="k2"),expect={"state":"sending"}),
 step("HC_IO_FAILED",{"error":"broken pipe","kind":"closed","key":"send"},{"state":"connecting","neverEmits":["HTTP_FAILED"],"effects":[{"type":"os/close"},{"type":"os/tcp-connect","arg0":"api.example.test","arg1":80}]})])
case("a-stale-idle-socket-closed-before-any-byte-retries-on-a-fresh-connection",[
 *flow(send(),[(read(KEEP),{"emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None),
 dict(send(key="k2"),expect={"state":"sending"}),
 step("HC_SENT",{"bytes":10,"key":"send"},{"state":"reading"}),
 step("HC_READ",{"data":"","eof":True,"key":"read"},{"neverEmits":["HTTP_FAILED","HTTP_REPLIED"]}),
 step("HC_CONNECTED",{"sock":6,"key":"connect"},{"state":"sending"}),
 step("HC_SENT",{"bytes":10,"key":"send"},{"state":"reading"}),
 step("HC_READ",read(KEEP),{"emits":[replied("k2",200,{"content-length":"2"},"ok")]})])
case("control-a-fresh-connection-closed-before-any-byte-fails-io",[
 *flow(send(),[({"data":"","eof":True,"key":"read"},{"emits":[failed("k1","io")]})],None)])
case("http-close-closes-the-idle-socket",[
 *flow(send(),[(read(KEEP),{"emits":[replied("k1",200,{"content-length":"2"},"ok")]})],None),
 step("HTTP_CLOSE",{},{"state":"ready","effects":[{"type":"os/close"}]}),
 dict(send(key="k2"),expect={"state":"connecting"})])
case("control-http-close-with-no-idle-socket-closes-nothing",[step("HTTP_CLOSE",{},{"state":"ready","effects":[]})])
# credentials never ride the payload
refuse("an-authorization-header-is-refused-credentials-ride-a-secret-slot",headers=[{"name":"Authorization","value":"Bearer x"}])
refuse("a-cookie-header-is-refused",headers=[{"name":"Cookie","value":"a=1"}])
# invalid utf-8
case("a-jsonl-line-that-is-not-utf-8-fails-encoding",flow(send(stream="jsonl"),[({"data":RAW(head(200,"OK",[]).encode()+b"\xff\n"),"eof":False,"key":"read"},{"emits":[failed("k1","encoding")],"neverEmits":["HTTP_REPLIED","HTTP_STREAM_EVENT"]})],None))
case("an-sse-block-that-is-not-utf-8-fails-encoding",flow(send(stream="sse"),[({"data":RAW(head(200,"OK",[]).encode()+b"data: \xff\n\n"),"eof":False,"key":"read"},{"emits":[failed("k1","encoding")],"neverEmits":["HTTP_REPLIED","HTTP_STREAM_EVENT"]})],None))
case("control-a-multibyte-sse-block-is-delivered",flow(send(stream="sse"),[(read(head(200,"OK",[])+"data: h\u00e9llo\r\n\r\n"),{"emits":[{"event":"HTTP_STREAM_EVENT","payload":{"key":"k1","data":"h\u00e9llo"}}],"neverEmits":["HTTP_FAILED"]})],None))

# tls (EXEC-HTTP-7): the kernel owns the handshake and answers an os/tcp-connect that carries a tls option itself, so the harness (no os host)
# answers a TLS connect ask with a denied failure at once; a case plays the connect ask alone and resumes the flow from the state the real answer leaves.
# The handshake transcript replay is pinned in orbital-core-runtime kernel::tls_sockets (os_tcp_connect_with_tls..., alpn).
TLS={"tls":True,"port":443}
TLSARG=lambda alpn=("http/1.1",): {"serverName":"api.example.test","alpn":["list",*alpn]}
def tcase(id,steps,config=TLS,entity=None):
    case(id,steps); cases[-1]["config"]=config
    if entity: cases[-1]["entity"]=entity
def hbuilt(req): return {"event":"HC_BUILT","payload":{"request":b(req)}}
tcase("an-https-get-asks-tcp-connect-with-the-tls-option-and-alpn",
 [dict(send(headers=[{"name":"Accept","value":"text/plain"}]),expect={"state":"connecting","effects":[{"type":"os/tcp-connect","arg0":"api.example.test","arg1":443,"arg2":TLSARG()}],"emits":[hbuilt("GET /x?a=1 HTTP/1.1\r\nhost: api.example.test\r\naccept: text/plain\r\n\r\n")]})])
tcase("the-offered-alpn-protocols-are-the-configured-list-in-order",
 [dict(send(),expect={"state":"connecting","effects":[{"type":"os/tcp-connect","arg0":"api.example.test","arg1":443,"arg2":TLSARG(("h2","http/1.1"))}]})],
 config={"tls":True,"port":443,"alpn":["h2","http/1.1"]})
tcase("a-tls-port-other-than-443-is-written-in-the-host-header",
 [dict(send(),expect={"state":"connecting","effects":[{"type":"os/tcp-connect","arg0":"api.example.test","arg1":8443,"arg2":TLSARG()}],"emits":[hbuilt("GET /x?a=1 HTTP/1.1\r\nhost: api.example.test:8443\r\n\r\n")]})],
 config={"tls":True,"port":8443})
case("control-a-plain-port-80-host-header-has-no-port",
 [dict(send(),expect={"state":"connecting","emits":[hbuilt("GET /x?a=1 HTTP/1.1\r\nhost: api.example.test\r\n\r\n")]})])
case("control-a-plain-port-443-names-the-port-because-it-is-not-the-plain-default",
 [dict(send(),expect={"state":"connecting","emits":[hbuilt("GET /x?a=1 HTTP/1.1\r\nhost: api.example.test:443\r\n\r\n")]})])
cases[-1]["config"]={"port":443}
SEED={"key":"k1","stage":"head"}
tcase("a-tls-get-is-written-and-answered-once-the-kernel-answers-the-connect-with-the-chosen-alpn",[
 step("HC_CONNECTED",{"sock":5,"key":"connect","alpn":"http/1.1"},{"state":"sending","effects":[{"type":"os/send"}]},frm="connecting"),
 step("HC_SENT",{"bytes":10,"key":"send"},{"state":"reading","effects":[{"type":"os/recv"}]}),
 step("HC_READ",read(head(200,"OK",[("Content-Type","text/plain"),("Content-Length","5")])+"hello"),{"emits":[replied("k1",200,{"content-type":"text/plain","content-length":"5"},"hello")],"neverEmits":["HTTP_FAILED"]})],entity=SEED)
tcase("control-a-tls-connect-answered-without-an-alpn-is-also-accepted",[
 step("HC_CONNECTED",{"sock":5,"key":"connect"},{"state":"sending","effects":[{"type":"os/send"}]},frm="connecting")],entity=SEED)
tcase("a-tls-handshake-failure-keeps-kind-tls",
 [step("HC_IO_FAILED",{"error":"certificate not valid for the name","kind":"tls","key":"connect"},{"state":"ready","emits":[failed("k1","tls","certificate not valid for the name")],"neverEmits":["HTTP_REPLIED"]},frm="connecting")],entity=SEED)
tcase("a-denied-tls-connect-keeps-kind-denied",
 [step("HC_IO_FAILED",{"error":"net not granted","kind":"denied","key":"connect"},{"state":"ready","emits":[failed("k1","denied","net not granted")]},frm="connecting")],entity=SEED)
tcase("a-stale-idle-tls-socket-reconnects-with-the-tls-option",
 [step("HC_IO_FAILED",{"error":"broken pipe","kind":"closed","key":"send"},{"effects":[{"type":"os/close"},{"type":"os/tcp-connect","arg0":"api.example.test","arg1":443,"arg2":TLSARG()}]},frm="sending")],
 entity={"key":"k2","stage":"head","sock":5,"reused":True})
case("control-a-stale-idle-plain-socket-reconnects-without-the-tls-option-and-tls-reconnect-differs-only-in-the-third-argument",
 [step("HC_IO_FAILED",{"error":"broken pipe","kind":"closed","key":"send"},{"state":"connecting","neverEmits":["HTTP_FAILED"],"effects":[{"type":"os/close"},{"type":"os/tcp-connect","arg0":"api.example.test","arg1":80}]},frm="sending")])
cases[-1]["entity"]={"key":"k2","stage":"head","sock":5,"reused":True}
tcase("a-tls-idle-socket-is-reused-by-the-next-call-without-a-new-connect",
 [dict(send(key="k2"),expect={"state":"sending","emits":[{"event":"HC_BUILT"}],"neverEmits":["HTTP_FAILED"],"effects":[]},**{"from":"ready"})],
 entity={"idle":5})

# body limit
json.dump({"atom":"net/atoms/std-http-client.lolo","trait":"HttpClient","spec":"spec/net/http-client.lolo","note":"parity oracle: the retired drivers/http_request wire loop; request composition, framing, streaming, refusals and failure kinds","cases":cases},open(out,'w'),indent=1)
print(len(cases))
