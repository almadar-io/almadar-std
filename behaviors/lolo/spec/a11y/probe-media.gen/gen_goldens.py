import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from cdp import Chrome, Site
from gl import step, case, emit, write, URL

js = open(os.path.join(here, "media.measure.js")).read().strip()
RULES = {
    "video-no-captions": ([("1.2.2", "A", "2.0")], "serious", "needs-verification"),
    "video-no-description": ([("1.2.3", "A", "2.0"), ("1.2.5", "AA", "2.0")], "moderate", "needs-verification"),
    "audio-no-transcript": ([("1.2.1", "A", "2.0")], "serious", "needs-verification"),
    "media-autoplay-sound": ([("1.4.2", "A", "2.0")], "serious", "confirmed"),
    "player-no-captions": ([("1.2.2", "A", "2.0")], "minor", "needs-verification"),
    "player-no-description": ([("1.2.3", "A", "2.0"), ("1.2.5", "AA", "2.0")], "minor", "needs-verification"),
}


def finding(url, rule, selector, snippet):
    wcag, impact, conf = RULES[rule]
    return {"id": f"{url}#{rule}#{selector}", "pageUrl": url, "rule": rule,
            "wcag": [{"criterion": c, "level": l, "version": v} for c, l, v in wcag],
            "method": "probe", "engines": ["probe"], "impact": impact, "confidence": conf,
            "selector": selector, "snippet": snippet, "evidence": "", "count": 1}


def done(url, findings):
    return emit("PROBE_DONE", {"key": "k1", "probe": "media", "findings": findings})


ENT = lambda url: {"runKey": "k1", "pageUrl": url}
site = Site(here)
c = Chrome()
live = {}
try:
    for name in ["video-captions-fail", "video-captions-pass", "media-extra"]:
        c.navigate(f"{site.base}/{name}.html")
        live[name] = c.evaluate(f"({js})()")
finally:
    c.close(); site.close()
json.dump(live, open(os.path.join(here, "recorded.json"), "w"), indent=1)

def run(name, expect_findings, cid):
    url = URL + name + ".html"
    return case(cid, [step("measuring", "PAGE_MEASURED", {"key": "k1:measure", "json": live[name]}, "idle", [done(url, expect_findings)], ENT(url))])

def f(name, rule, i=None):
    m = json.loads(live[name])
    if rule.startswith("player"):
        e = [x for x in m["frames"] if "youtube" in x["src"]][0]
    else:
        e = m["media"][i]
    return finding(URL + name + ".html", rule, e["selector"], e["snippet"])

fail, ok, ex = "video-captions-fail", "video-captions-pass", "media-extra"
cases = [
    case("PROBE_RUN asks the page to measure under the run key", [step("idle", "PROBE_RUN", {"key": "k1", "pageUrl": URL}, "measuring", [emit("PAGE_MEASURE", {"key": "k1:measure", "expression": "(" + js + ")()"})])]),
    case("control: a second PROBE_RUN while measuring is refused as probe_busy", [step("measuring", "PROBE_RUN", {"key": "k2", "pageUrl": URL}, "measuring", [emit("PROBE_FAILED", {"key": "k2", "probe": "media", "error": f"a run on {URL} is in flight", "code": "probe_busy"})], ENT(URL))]),
    case("control: a measurement under another run's key is ignored", [step("measuring", "PAGE_MEASURED", {"key": "k2:measure", "json": live[fail]}, "measuring", [], ENT(URL))]),
    case("a page failure answers PROBE_FAILED probe_page_failed", [step("measuring", "PAGE_FAILED", {"key": "k1:measure", "error": "evaluation threw", "code": "chrome_eval"}, "idle", [emit("PROBE_FAILED", {"key": "k1", "probe": "media", "error": "evaluation threw", "code": "probe_page_failed"})], ENT(URL))]),
    case("a measurement that is not the media shape answers probe_bad_measure", [step("measuring", "PAGE_MEASURED", {"key": "k1:measure", "json": "{\"media\":3}"}, "idle", [emit("PROBE_FAILED", {"key": "k1", "probe": "media", "error": "the page measurement is not the media shape", "code": "probe_bad_measure"})], ENT(URL))]),
    run(fail, [f(fail, "video-no-captions", 0), f(fail, "video-no-description", 0)], "video-captions-fail: a video with no captions track is video-no-captions and, with no descriptions track, video-no-description (both needs-verification)"),
    run(ok, [f(ok, "video-no-description", 0)], "control: video-captions-pass has a captions track so only video-no-description remains"),
    run(ex, [f(ex, "video-no-description", i) for i in []] + [
        f(ex, "media-autoplay-sound", 0),
        f(ex, "player-no-captions"), f(ex, "player-no-description")], "media-extra: audio without a transcript, an autoplay video with sound (confirmed) and a YouTube embed are found; the muted autoplay video, the described audio and the non-video iframe are not"),
]
# audio-no-transcript sits between description and autoplay: rebuild the extra case in rule order
m = json.loads(live[ex])
aud = [i for i, e in enumerate(m["media"]) if e["kind"] == "audio" and e["transcriptRefs"] == 0]
assert len(aud) == 1
cases[-1] = run(ex, [f(ex, "audio-no-transcript", aud[0]), f(ex, "media-autoplay-sound", 0), f(ex, "player-no-captions"), f(ex, "player-no-description")], cases[-1]["id"])
write(os.path.join(here, "..", "probe-media.replay.goldens.json"), "a11y/atoms/std-a11y-probe-media.lolo", "MediaProbe",
      "std-a11y-probe-media with the page answers played as events. The measure JSON of each live case is the real result of the measure knob run in headless Chrome (probe-media.gen/gen_goldens.py) on video-captions-fail, video-captions-pass and probe-media.gen/pages/media-extra.html; the expression asserted is probe-media.gen/media.measure.js. Regenerate with python3 -I probe-media.gen/gen_goldens.py.", cases)
print(json.dumps(live, indent=1)[:3000])
