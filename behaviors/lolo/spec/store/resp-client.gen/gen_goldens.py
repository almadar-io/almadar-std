import json,glob,base64,sys,os
FIX=sys.argv[1]; OUT=sys.argv[2]
d64=lambda s: base64.b64decode(s)
def parse_cmd(raw):
    parts=raw.split(b'\r\n'); n=int(parts[0][1:]); items=[]; i=1
    for _ in range(n):
        items.append(parts[i+1].decode()); i+=2
    return items,raw
def parse_reply(raw):
    t=chr(raw[0]); line=raw.split(b'\r\n')[0][1:].decode()
    if t=='+': return 'simple',line
    if t==':': return 'int',line
    if t=='$':
        n=int(line)
        if n<0: return 'null',''
        return 'bulk',raw.split(b'\r\n')[1].decode()
    raise SystemExit('reply '+t)
cases=[]
for f in sorted(glob.glob(FIX+'/*.json')):
    d=json.load(open(f))
    if 'osExchanges' not in d or d['env'] or not d['osExchanges']: continue
    ex=d['osExchanges']
    sends=[e for e in ex if e['os']['op']=='os/send']
    if not sends: 
        steps=[]
    hello=None
    first=d64(sends[0]['os']['args'][1]) if sends else b''
    cmdsend=sends[-1] if sends else None
    argv,_=parse_cmd(d64(cmdsend['os']['args'][1])) if cmdsend else (['GET','k'],b'')
    db=0
    handshake=len(sends)==2
    if handshake:
        h,_=parse_cmd(first)
        assert h[0]=='SELECT'; db=int(h[1])
    out=d['outcome']
    key=d['case']
    steps=[{"event":"RESP_RUN","payload":{"key":key,"argv":argv},"expect":{"state":"connecting"}}]
    ok=out['ok']
    recvs=[e for e in ex if e['os']['op']=='os/recv']
    fail=None
    if not ok:
        fail={"event":"RESP_FAILED","payload":{"key":key,"kind":out['kind'],"message":out['message']}}
        if out.get('code'): fail["payload"]["code"]=out['code']
    # final expectation
    last_ok_reply=None
    if ok:
        stream=b"".join(d64(e['answer']['ok']['data']) for e in recvs if 'ok' in e['answer'])
        last_ok_reply=None
        while stream:
            t=chr(stream[0]); end=stream.index(b"\r\n")
            if t=='$' and int(stream[1:end])>=0:
                n=int(stream[1:end]); frame=stream[:end+2+n+2]
            else: frame=stream[:end+2]
            last_ok_reply=parse_reply(frame); stream=stream[len(frame):]
        k,t=last_ok_reply
        succ={"event":"RESP_REPLIED","payload":{"key":key,"kind":k,"text":t}}
    final_ev= succ if ok else fail
    never=["RESP_FAILED"] if ok else ["RESP_REPLIED"]
    # walk exchanges
    pend=[e for e in ex if e['os']['op']!='os/close']
    n=len(pend)
    for idx,e in enumerate(pend):
        op=e['os']['op']; a=e['answer']; is_last=idx==n-1
        if op=='os/tcp-connect':
            if 'error' in a:
                steps.append({"event":"RESP_IO_FAILED","payload":{"error":a['error']['message'],"kind":a['error']['kind'],"key":"connect"},"expect":{"state":"aborting","emits":[final_ev],"neverEmits":never}})
            else:
                stage="handshake" if handshake else "command"
                b=sends[0]['os']['args'][1]
                steps.append({"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open","emits":[{"event":"RESP_WIRE_SENT","payload":{"key":key,"stage":stage,"bytes":b}}]}})
        elif op=='os/send':
            steps.append({"event":"RESP_SENT","payload":{"bytes":a['ok']['bytes']},"expect":{"state":"open"}})
        elif op=='os/recv':
            if 'error' in a:
                steps.append({"event":"RESP_IO_FAILED","payload":{"error":a['error']['message'],"kind":a['error']['kind'],"key":"read3"},"expect":{"state":"aborting","emits":[final_ev],"neverEmits":never}})
            else:
                exp={}
                nxt=pend[idx+1]['os']['op'] if idx+1<n else None
                # does this read finish the call or start the command send?
                if handshake and idx==2 and nxt=='os/send':
                    exp={"emits":[{"event":"RESP_WIRE_SENT","payload":{"key":key,"stage":"command","bytes":cmdsend['os']['args'][1]}}],"neverEmits":["RESP_FAILED","RESP_REPLIED"]}
                elif nxt is None or (not ok and True and idx>=0 and (nxt is None)):
                    exp={"emits":[final_ev],"neverEmits":never}
                else:
                    exp={"neverEmits":["RESP_FAILED","RESP_REPLIED"]}
                if nxt is None and not (handshake and idx==2 and nxt=='os/send'):
                    exp={"emits":[final_ev],"neverEmits":never}
                steps.append({"event":"RESP_READ","payload":{"data":a['ok']['data'],"eof":a['ok']['eof'],"key":"read3"},"expect":exp})
    # a failure after the handshake reply: final step handled above (nxt None)
    c={"id":d['case'],"steps":steps}
    if db: c["config"]={"db":db}
    if d.get('synthetic'): c["note"]=d['synthetic']
    cases.append(c)
def mk(id,payload,expect,config=None):
    c={"id":id,"steps":[{"event":"RESP_RUN","payload":payload,"expect":expect}]}
    if config: c["config"]=config
    cases.append(c)
mk("an-empty-command-is-refused-before-any-ask",{"key":"k","argv":[]},{"emits":[{"event":"RESP_FAILED","payload":{"key":"k","kind":"refused"}}],"effects":[]})
mk("an-empty-command-item-is-refused-before-any-ask",{"key":"k","argv":["GET",""]},{"emits":[{"event":"RESP_FAILED","payload":{"key":"k","kind":"refused"}}],"effects":[]})
mk("an-authenticated-call-is-unconfigured-until-the-secret-knob-feeds-os-send",{"key":"k","argv":["GET","k"]},{"emits":[{"event":"RESP_FAILED","payload":{"key":"k","kind":"unconfigured"}}],"effects":[]},{"authenticated":True})

import base64 as _b
def _b64(s): return _b.b64encode(s.encode()).decode()
def _cmd(*a): return "*%d\r\n"%len(a)+"".join("$%d\r\n%s\r\n"%(len(x.encode()),x) for x in a)
RUN=lambda k,*a:{"event":"RESP_RUN","payload":{"key":k,"argv":list(a)}}
cases.append({"id":"two-overlapping-keys-share-one-connection-and-are-answered-in-order","note":"pipelined: the second command is written while the first is in flight, replies are matched to keys in write order",
 "steps":[dict(RUN("a","GET","x"),expect={"state":"connecting"}),
  dict(RUN("b","GET","y"),expect={"state":"connecting","effects":[]}),
  {"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open","emits":[{"event":"RESP_WIRE_SENT","payload":{"key":"a","stage":"command","bytes":_b64(_cmd("GET","x")+_cmd("GET","y"))}}]}},
  {"event":"RESP_SENT","payload":{"bytes":40},"expect":{"state":"open"}},
  {"event":"RESP_READ","payload":{"data":_b64("$2\r\nv1\r\n"),"eof":False,"key":"read3"},"expect":{"emits":[{"event":"RESP_REPLIED","payload":{"key":"a","kind":"bulk","text":"v1"}}],"neverEmits":["RESP_FAILED"]}},
  {"event":"RESP_READ","payload":{"data":_b64("$2\r\nv2\r\n"),"eof":False,"key":"read3"},"expect":{"emits":[{"event":"RESP_REPLIED","payload":{"key":"b","kind":"bulk","text":"v2"}}],"neverEmits":["RESP_FAILED"]}},
  dict(RUN("c","GET","z"),expect={"state":"connecting"})]})
cases.append({"id":"a-second-key-written_while_the_first_is_in_flight_goes_out_at_once",
 "steps":[dict(RUN("a","GET","x"),expect={"state":"connecting"}),
  {"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open"}},
  {"event":"RESP_SENT","payload":{"bytes":20},"expect":{"state":"open"}},
  dict(RUN("b","GET","y"),expect={"state":"open","emits":[{"event":"RESP_WIRE_SENT","payload":{"key":"b","stage":"command","bytes":_b64(_cmd("GET","y"))}}]}),
  {"event":"RESP_SENT","payload":{"bytes":20},"expect":{"state":"open"}},
  {"event":"RESP_READ","payload":{"data":_b64("$2\r\nv1\r\n$-1\r\n"),"eof":False,"key":"read3"},"expect":{"emits":[{"event":"RESP_REPLIED","payload":{"key":"a","kind":"bulk","text":"v1"}},{"event":"RESP_REPLIED","payload":{"key":"b","kind":"null","text":""}}],"neverEmits":["RESP_FAILED"]}}]})
cases.append({"id":"a-reply_split_across_reads_while_two_keys_are_in_flight",
 "steps":[dict(RUN("a","GET","x"),expect={"state":"connecting"}),dict(RUN("b","GET","y"),expect={"state":"connecting"}),
  {"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open"}},
  {"event":"RESP_SENT","payload":{"bytes":40},"expect":{"state":"open"}},
  {"event":"RESP_READ","payload":{"data":_b64("$2\r\nv"),"eof":False,"key":"read3"},"expect":{"neverEmits":["RESP_REPLIED","RESP_FAILED"]}},
  {"event":"RESP_READ","payload":{"data":_b64("1\r\n:7\r\n"),"eof":False,"key":"read3"},"expect":{"emits":[{"event":"RESP_REPLIED","payload":{"key":"a","kind":"bulk","text":"v1"}},{"event":"RESP_REPLIED","payload":{"key":"b","kind":"int","text":"7"}}]}}]})
cases.append({"id":"a-server-error-answers-only-its-own-key",
 "steps":[dict(RUN("a","GET","x"),expect={"state":"connecting"}),dict(RUN("b","GET","y"),expect={"state":"connecting"}),
  {"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open"}},
  {"event":"RESP_SENT","payload":{"bytes":40},"expect":{"state":"open"}},
  {"event":"RESP_READ","payload":{"data":_b64("-WRONGTYPE bad\r\n$2\r\nv2\r\n"),"eof":False,"key":"read3"},"expect":{"emits":[{"event":"RESP_FAILED","payload":{"key":"a","kind":"redis","code":"WRONGTYPE"}},{"event":"RESP_REPLIED","payload":{"key":"b","kind":"bulk","text":"v2"}}]}}]})
cases.append({"id":"a-lost-connection-fails-every-key-in-flight",
 "steps":[dict(RUN("a","GET","x"),expect={"state":"connecting"}),dict(RUN("b","GET","y"),expect={"state":"connecting"}),
  {"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open"}},
  {"event":"RESP_SENT","payload":{"bytes":40},"expect":{"state":"open"}},
  {"event":"RESP_READ","payload":{"data":"","eof":True,"key":"read3"},"expect":{"state":"aborting","emits":[{"event":"RESP_FAILED","payload":{"key":"a","kind":"failed"}},{"event":"RESP_FAILED","payload":{"key":"b","kind":"failed"}}],"neverEmits":["RESP_REPLIED"]}}]})
cases.append({"id":"a-stale-read-of-a-closed-socket-is-ignored",
 "steps":[dict(RUN("a","GET","x"),expect={"state":"connecting"}),
  {"event":"RESP_CONNECTED","payload":{"sock":3},"expect":{"state":"open"}},
  {"event":"RESP_SENT","payload":{"bytes":20},"expect":{"state":"open"}},
  {"event":"RESP_READ","payload":{"data":_b64("$2\r\nv1\r\n"),"eof":False,"key":"read9"},"expect":{"state":"open","neverEmits":["RESP_REPLIED","RESP_FAILED"]}}]})
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real_case import real_case
cases.append(real_case())
json.dump({"atom":"store/atoms/std-resp-client.lolo","trait":"RespClient","note":"parity oracle: the recorded fixtures of orbital-integration-tests/fixtures/redis (recorded against Redis 7 by fixtures/redis/record.py) without a password; the AUTH cases wait for the secret knob","cases":cases},open(OUT,'w'),indent=1)
print(len(cases))
