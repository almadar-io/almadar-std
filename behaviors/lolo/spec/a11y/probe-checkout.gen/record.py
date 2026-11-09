import json, subprocess, sys, time, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome
here = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(here, "..", "fixtures"))
port = random.randint(20000, 29999)
log = open(os.path.join(here, "server.log"), "w")
srv = subprocess.Popen(["python3", "-I", "-m", "http.server", "--bind", "127.0.0.1", str(port), "--directory", FIX], stdout=log, stderr=log)
time.sleep(0.6)
c = Chrome()
links_js = open(os.path.join(here, "checkout-links.measure.js")).read().strip()
KEYS = {"Tab": ("Tab", "Tab", 9, ""), "Enter": ("Enter", "Enter", 13, "\r")}
FOCUS = "(()=>{const e=document.activeElement;if(!e||e===document.body){return JSON.stringify({focused:null});}const sel=(n)=>{if(n.id){return '#'+CSS.escape(n.id);}const p=[];let c=n;while(c&&c.nodeType===1&&c!==document.documentElement){const par=c.parentElement;const t=c.tagName.toLowerCase();if(!par){break;}const k=[...par.children].filter(x=>x.tagName===c.tagName);p.unshift(t+':nth-of-type('+(k.indexOf(c)+1)+')');c=par;}return 'html > '+p.join(' > ');};return JSON.stringify({focused:{name:(e.innerText||e.value||'').trim(),selector:sel(e)}});})()"
def press(name):
    k, code, vk, text = KEYS[name]
    d = {"type": "keyDown" if text else "rawKeyDown", "key": k, "code": code, "windowsVirtualKeyCode": vk}
    if text: d["text"] = text
    c.ws.call("Input.dispatchKeyEvent", d)
    c.ws.call("Input.dispatchKeyEvent", {"type": "keyUp", "key": k, "code": code, "windowsVirtualKeyCode": vk})
def focused(): return json.loads(c.evaluate(FOCUS))["focused"]
def tab_to(sel, cap=30):
    trail = []
    for n in range(1, cap + 1):
        press("Tab"); f = focused(); trail.append(f["selector"] if f else None)
        if f and f["selector"] == sel: return n, f
    return None, None
out = {"walk": []}
try:
    page = f"http://127.0.0.1:{port}/shop/izdelek-1.html"
    c.navigate(page)
    for step, pick in (("add-to-cart", lambda l: "Dodaj" in l["text"]), ("cart", lambda l: l["text"] == "Košarica"), ("checkout", lambda l: l["text"] == "Na blagajno")):
        rec = {"step": step, "url": c.evaluate("location.href"), "links": c.evaluate(f"({links_js})()")}
        ls = json.loads(rec["links"])["links"]
        t = [l for l in ls if pick(l)][0]
        n, f = tab_to(t["selector"])
        rec["tabs"], rec["focused"] = n, f
        press("Enter"); time.sleep(0.8)
        rec["after"] = {"url": c.evaluate("location.href"), "title": c.evaluate("document.title")}
        out["walk"].append(rec)
    last = {"url": c.evaluate("location.href"), "links": c.evaluate(f"({links_js})()"), "text": c.evaluate("document.body.innerText")}
    ls = json.loads(last["links"])["links"]
    out["checkout"] = last
    # the pay control lives on the next page; the stop list is Tab-walked there without Enter
    c.navigate(f"http://127.0.0.1:{port}/shop/placilo.html")
    pay = {"url": c.evaluate("location.href"), "links": c.evaluate(f"({links_js})()")}
    pl = [l for l in json.loads(pay["links"])["links"] if l["text"].startswith("Plačaj")][0]
    n, f = tab_to(pl["selector"]); pay["tabs"], pay["focused"] = n, f
    pay["urlAfterTabOnly"] = c.evaluate("location.href")
    out["pay"] = pay
    json.dump(out, open(os.path.join(here, "recorded.json"), "w"), indent=1, ensure_ascii=False)
finally:
    c.close(); srv.kill(); log.close()
print(open(os.path.join(here, "server.log")).read())
