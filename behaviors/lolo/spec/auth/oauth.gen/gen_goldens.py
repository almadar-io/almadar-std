import json, sys, base64

out = sys.argv[1]
b = lambda s: base64.b64encode(s.encode()).decode()

STATE = "A" * 43
VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
VALUE = STATE + VERIFIER
NOW = 1700000000000
U1 = {"id": "u1", "role": "member", "claims": []}
U2 = {"id": "u2", "role": "member", "claims": []}
CB = "https://app.example/cb"
CBQ = "https%3A%2F%2Fapp.example%2Fcb"
GH = {"provider": "github", "redirectUri": CB, "authClientId": "cid", "userinfoOrigin": "https://api.github.com"}
GH_NOORIGIN = {"provider": "github", "redirectUri": CB, "authClientId": "cid"}
GG = {"provider": "google", "redirectUri": CB, "authClientId": "cid"}
DOC = {
    "issuer": "https://accounts.google.com",
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "token_endpoint": "https://oauth2.googleapis.com/token",
    "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
    "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
}

cases = []


def step(event, payload=None, expect=None, viewer=U1, now=None):
    s = {"event": event, "payload": payload or {}}
    if viewer:
        s["viewer"] = viewer
    if now is not None:
        s["now"] = now
    if expect:
        s["expect"] = expect
    return s


def case(id, config, steps, note=None):
    c = {"id": id, "config": config, "now": NOW, "defaults": ["OAuthDiscoveryHttp", "OAuthUserinfoHttp", "OAuthRevokeHttp", "OAuthTimeout"], "steps": steps}
    if note:
        c["note"] = note
    cases.append(c)


def em(event, payload):
    return {"event": event, "payload": payload}


def authorize(scopes=("repo",), redirect="", subject="u1", expect=None, viewer=U1):
    return step("OAUTH_AUTHORIZE", {"scopes": list(scopes), "redirectUri": redirect, "subject": subject}, expect, viewer)


def drawn(value=VALUE, expect=None, viewer=U1):
    return step("OAUTH_DRAWN", {"value": value}, expect, viewer)


def http(key, status, body, expect=None, viewer=U1):
    return step("OAUTH_HTTP_REPLIED", {"key": key, "status": status, "body": body if isinstance(body, str) else json.dumps(body)}, expect, viewer)


def urlq(extra, endpoint, redirect=CBQ, scope="repo"):
    return (endpoint + "?" + extra + "redirect_uri=" + redirect + "&scope=" + scope + "&state=" + STATE + "&code_challenge=" + CHALLENGE
            + "&code_challenge_method=S256&client_id=cid&response_type=code")


GH_AUTH = "https://github.com/login/oauth/authorize"
SEND_DISCOVERY = lambda target: em("OAUTH_HTTP_SEND", {"key": "discovery", "method": "GET", "target": target, "headers": [{"name": "accept", "value": "application/json"}], "body": "", "stream": "none"})

# --- authorize
case("github-without-an-issuer-draws-at-once-from-the-static-endpoints", GH, [
    authorize(expect={"effects": [{"type": "random-bytes", "arg0": 64}], "neverEmits": ["OAUTH_HTTP_SEND", "OAUTH_AUTHORIZE_ERROR"]})])
case("github-authorization-url-is-the-fixed-order-pkce-url-and-the-grant-row-is-written", GH, [
    authorize(),
    drawn(expect={"effects": [{"type": "let"}], "exactEmits": [
        em("OAUTH_STORED", {"id": STATE, "owner": "u1", "provider": "github", "verifier": VERIFIER, "redirectUri": CB, "subject": "u1", "scopes": ["repo"],
                            "tokenEndpoint": "https://github.com/login/oauth/access_token", "userinfoEndpoint": "https://api.github.com/user", "revocationEndpoint": "",
                            "expiresAt": "2023-11-14T22:23:20.000Z"}),
        em("OAUTH_AUTHORIZED", {"authUrl": urlq("", GH_AUTH), "state": STATE, "code": ""})], "neverEmits": ["OAUTH_AUTHORIZE_ERROR"]})],
    note="the challenge is the RFC 7636 appendix B vector for the verifier; the verifier is stored in the owner row, never emitted")
case("a-payload-redirect-overrides-the-knob", dict(GH, redirectUri="https://other.example/cb"), [
    authorize(redirect=CB),
    drawn(expect={"emits": [em("OAUTH_AUTHORIZED", {"authUrl": urlq("", GH_AUTH), "state": STATE, "code": ""})]})])
case("control-an-empty-payload-redirect-takes-the-knob", dict(GH, redirectUri="https://other.example/cb"), [
    authorize(),
    drawn(expect={"emits": [em("OAUTH_AUTHORIZED", {"authUrl": urlq("", GH_AUTH, redirect="https%3A%2F%2Fother.example%2Fcb"), "state": STATE, "code": ""})]})])
case("two-scopes-are-joined-by-one-space-and-encoded", GH, [
    authorize(scopes=("repo", "user")),
    drawn(expect={"emits": [em("OAUTH_AUTHORIZED", {"authUrl": urlq("", GH_AUTH, scope="repo%20user"), "state": STATE, "code": ""})]})])
case("no-redirect-anywhere-is-refused", {"provider": "github", "authClientId": "cid"}, [
    authorize(expect={"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "VALIDATION_ERROR", "message": "No redirect URI: pass redirectUri or set the redirectUri knob"})], "neverEmits": ["OAUTH_HTTP_SEND"]})])
case("auth0-without-an-issuer-names-the-missing-issuer", {"provider": "auth0", "redirectUri": CB, "authClientId": "cid"}, [
    authorize(expect={"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "NOT_CONFIGURED", "message": "Provider \"auth0\" has no OIDC issuer — set OIDC_ISSUER_URL to an OIDC-compliant issuer"})], "neverEmits": ["OAUTH_HTTP_SEND"]})])
case("control-auth0-with-an-issuer-discovers-it", {"provider": "auth0", "redirectUri": CB, "authClientId": "cid", "issuerUrl": "https://idp.example.com"}, [
    authorize(expect={"emits": [SEND_DISCOVERY("/.well-known/openid-configuration")]})])
case("google-discovers-the-built-in-issuer-first", GG, [
    authorize(expect={"emits": [SEND_DISCOVERY("/.well-known/openid-configuration")], "neverEmits": ["OAUTH_DRAWN"]})])
case("an-issuer-with-a-path-keeps-the-path-and-a-trailing-slash-is-dropped", dict(GG, issuerUrl="https://idp.example.com/tenant/"), [
    authorize(expect={"emits": [SEND_DISCOVERY("/tenant/.well-known/openid-configuration")]})])
case("a-matching-discovery-document-draws-and-the-url-adds-the-google-extras-first", GG, [
    authorize(scopes=("openid", "email")),
    http("discovery", 200, DOC, expect={"effects": [{"type": "let"}]}),
    drawn(expect={"emits": [em("OAUTH_AUTHORIZED", {"authUrl": urlq("access_type=offline&prompt=consent&", DOC["authorization_endpoint"], scope="openid%20email"), "state": STATE, "code": ""})]})])
case("control-an-endpoint-that-already-has-a-query-takes-an-ampersand", GG, [
    authorize(),
    http("discovery", 200, dict(DOC, authorization_endpoint="https://accounts.google.com/auth?tenant=1")),
    drawn(expect={"emits": [em("OAUTH_AUTHORIZED", {"authUrl": "https://accounts.google.com/auth?tenant=1&access_type=offline&prompt=consent&redirect_uri=" + CBQ + "&scope=repo&state=" + STATE + "&code_challenge=" + CHALLENGE + "&code_challenge_method=S256&client_id=cid&response_type=code", "state": STATE, "code": ""})]})])
for name, status, body, msg in [
    ("a-failing-discovery-status-is-refused", 500, DOC, "The issuer discovery document could not be read"),
    ("an-unparsable-discovery-body-is-refused", 200, "not json", "The issuer discovery document could not be read"),
    ("a-discovery-issuer-that-differs-is-refused", 200, dict(DOC, issuer="https://evil.example"), "The discovered issuer does not match the expected issuer"),
    ("a-discovery-token-endpoint-that-is-not-https-is-refused", 200, dict(DOC, token_endpoint="http://oauth2.googleapis.com/token"), "The issuer's authorization or token endpoint is missing or not https"),
    ("a-discovery-without-an-authorization-endpoint-is-refused", 200, {k: v for k, v in DOC.items() if k != "authorization_endpoint"}, "The issuer's authorization or token endpoint is missing or not https"),
]:
    case(name, GG, [authorize(), http("discovery", status, body, expect={"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "SERVICE_ERROR", "message": msg})], "neverEmits": ["OAUTH_AUTHORIZED"]})])
case("a-draw-of-the-wrong-length-is-refused", GH, [
    authorize(),
    drawn("short", expect={"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "SERVICE_ERROR", "message": "The host drew an unusable state"})], "neverEmits": ["OAUTH_AUTHORIZED"]})])
case("a-failed-draw-answers-the-authorize-error", GH, [
    authorize(),
    step("OAUTH_HOST_FAILED", {"error": "no entropy"}, {"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "SERVICE_ERROR", "message": "The host could not complete the request"})]})])
case("a-discovery-transport-failure-answers-the-authorize-error", GG, [
    authorize(),
    step("OAUTH_STEP_FAILED", {"error": "connection refused", "kind": "io"}, {"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "SERVICE_ERROR", "message": "The provider could not be reached or answered something unusable"})]})])

case("no-client-id-is-a-visible-not-configured-error", {"provider": "github", "redirectUri": CB}, [
    authorize(expect={"emits": [em("OAUTH_AUTHORIZE_ERROR", {"code": "NOT_CONFIGURED", "message": "No OAuth client id: set the authClientId knob"})], "neverEmits": ["OAUTH_HTTP_SEND"], "effects": [{"type": "emit"}]})])

# --- callback state and the exchange
def to_connect(config, state=STATE, viewer=U1, now=None, authorize_viewer=U1, subject="u1", doc=None):
    pre = [authorize(subject=subject, viewer=authorize_viewer)]
    if config["provider"] == "google":
        pre.append(http("discovery", 200, doc or DOC, viewer=authorize_viewer))
    return pre + [drawn(viewer=authorize_viewer), step("OAUTH_CONNECT", {"code": "CODE-1", "state": state}, None, viewer, now)]


UNAVAILABLE_ERR = em("OAUTH_CONNECT_ERROR", {"code": "NOT_CONFIGURED", "message": "Sign-in is unavailable on this host"})
mm = to_connect(GH, state="wrong-state")
mm[-1]["expect"] = {"exactEmits": [em("OAUTH_GRANT_ABSENT", {"error": "OAuthGrant wrong-state not found", "code": "not-found"}), em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "Unknown or expired authorization state"})],
                    "neverEmits": ["OAUTH_GRANT_TAKEN", "OAUTH_STEP_FAILED"]}
case("a-callback-state-that-does-not-match-a-grant-is-refused", GH, mm)
ok = to_connect(GH)
ok[-1]["expect"] = {"effects": [{"type": "fetch", "arg0": "OAuthGrant"}], "emits": [em("OAUTH_GRANT_TAKEN", {"id": STATE, "deleted": True}), UNAVAILABLE_ERR], "neverEmits": ["OAUTH_GRANT_ABSENT"]}
case("a-matching-state-takes-the-grant-and-an-unavailable-store-answers-sign-in-unavailable", GH, ok,
     note="the replay host answers credential-connect as a bare host does: kind unavailable")
reuse = to_connect(GH) + [step("OAUTH_CONNECT", {"code": "CODE-1", "state": STATE}, {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "Unknown or expired authorization state"})], "neverEmits": ["OAUTH_GRANT_TAKEN"]})]
case("a-grant-is-single-use-the-second-callback-is-refused", GH, reuse)
exp = to_connect(GH, now=NOW + 600001)
exp[-1]["expect"] = {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "The authorization has expired"})], "neverEmits": ["OAUTH_GRANT_TAKEN"]}
case("an-expired-grant-is-refused-and-dropped", GH, exp)
edge = to_connect(GH, now=NOW + 599999)
edge[-1]["expect"] = {"emits": [em("OAUTH_GRANT_TAKEN", {"id": STATE, "deleted": True})], "neverEmits": ["OAUTH_GRANT_ABSENT"]}
case("control-a-grant-one-millisecond-before-expiry-is-taken", GH, edge)
subj = to_connect(GH, viewer=U2)
subj[-1]["expect"] = {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "Unknown or expired authorization state"})], "neverEmits": ["OAUTH_GRANT_TAKEN"]}
case("a-grant-started-by-one-user-is-not-taken-by-another-the-owner-check", GH, subj)
OTHER = {"id": STATE, "owner": "u1", "provider": "github", "verifier": VERIFIER, "redirectUri": CB, "scopes": [], "tokenEndpoint": "", "userinfoEndpoint": "", "revocationEndpoint": "", "expiresAt": "2099-01-01T00:00:00.000Z"}
case("a-grant-bound-to-another-subject-is-refused-even-when-owned", GH, [
    step("OAUTH_GRANT_LOADED", {"data": dict(OTHER, subject="u1", owner="u2")}, {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "The authorization was started for a different user"})], "neverEmits": ["OAUTH_GRANT_TAKEN"]}, viewer=U2)])
case("control-the-bound-subject-itself-takes-the-grant", GH, [
    authorize(), drawn(), step("OAUTH_CONNECT", {"code": "C", "state": STATE}, {"emits": [em("OAUTH_GRANT_TAKEN", {"id": STATE, "deleted": True})]}, U1)])
case("control-a-grant-with-no-subject-is-taken", GH, [authorize(subject=""), drawn(), step("OAUTH_CONNECT", {"code": "C", "state": STATE}, {"emits": [em("OAUTH_GRANT_TAKEN", {"id": STATE, "deleted": True})]}, U1)])
prov = {"provider": "google", "redirectUri": CB, "authClientId": "cid"}
case("a-grant-of-another-provider-is-refused", prov, [
    step("OAUTH_GRANT_LOADED", {"data": {"id": STATE, "owner": "u1", "provider": "github", "verifier": VERIFIER, "redirectUri": CB, "subject": "", "scopes": [], "tokenEndpoint": "", "userinfoEndpoint": "", "revocationEndpoint": "", "expiresAt": "2099-01-01T00:00:00.000Z"}},
         {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "The authorization belongs to a different provider"})], "neverEmits": ["OAUTH_GRANT_TAKEN"]})])

# the exchange request
for ca, mode, secret in (("secret", "body", True), ("basic", "basic", True), ("none", "none", False)):
    req = {"credential": "@config.credential", "scope": "user", "tokenEndpoint": "@entity.tokenEndpoint", "grant": "authorization_code", "code": "@entity.code",
           "redirectUri": "@entity.redirectUri", "verifier": "@entity.verifier", "clientId": "@config.clientId", "clientAuth": mode}
    if secret:
        req["clientSecret"] = "@config.clientSecret"
    case("the-exchange-asks-the-store-with-clientauth-%s-and-names-credentials-only" % ca, dict(GH, clientAuth=ca), [
        authorize(), drawn(),
        step("OAUTH_GRANT_TAKEN", {"id": STATE, "deleted": True}, {"effects": [{"type": "credential-connect", "arg0": req}]})])

# store answers
CONN_ROW = lambda **kw: dict({"provider": "github", "connected": True, "account": "octo", "avatarUrl": "", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z"}, **kw)
NOUI_DOC = {k: v for k, v in DOC.items() if k != "userinfo_endpoint"}
case("a-connected-answer-without-a-userinfo-endpoint-keeps-the-label-and-answers-only-the-row", GG, to_connect(GG, doc=NOUI_DOC) + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ada@example.com", "access_token": "SECRET-TOKEN"},
         {"exactEmits": [
             em("OAUTH_STORED", {"id": "u1|google", "owner": "u1", "provider": "google", "account": "ada@example.com", "avatarUrl": "", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z",
                                 "tokenEndpoint": DOC["token_endpoint"], "userinfoEndpoint": "", "revocationEndpoint": DOC["revocation_endpoint"]}),
             em("OAUTH_CONNECTED", {"provider": "google", "connected": True, "account": "ada@example.com", "avatarUrl": "", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z"})], "neverEmits": ["OAUTH_CONNECT_ERROR", "OAUTH_HTTP_SEND"]})],
     note="the store answer carries a stray access_token field: the connected row is exact, so no token reaches an emit")
GH_SEND = em("OAUTH_HTTP_SEND", {"key": "userinfo", "method": "GET", "target": "/user", "headers": [{"name": "accept", "value": "application/json"}, {"name": "user-agent", "value": "almadar-oauth"}], "body": "", "stream": "none"})
GH_PROFILE = {"login": "octo", "id": 1, "avatar_url": "https://avatars.example/o.png", "name": None, "email": None}
GH_STORED = lambda account: em("OAUTH_STORED", {"id": "u1|github", "owner": "u1", "provider": "github", "account": account, "avatarUrl": "https://avatars.example/o.png", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z",
                                                "tokenEndpoint": "https://github.com/login/oauth/access_token", "userinfoEndpoint": "https://api.github.com/user", "revocationEndpoint": ""})
GH_CONNECTED = lambda account: em("OAUTH_CONNECTED", {"provider": "github", "connected": True, "account": account, "avatarUrl": "https://avatars.example/o.png", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z"})
case("a-github-connect-reads-the-user-api-with-a-user-agent-and-fills-account-and-avatar-from-login-and-avatar-url", GH, to_connect(GH) + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ignored"}, {"emits": [GH_SEND]}),
    http("userinfo", 200, GH_PROFILE, {"exactEmits": [GH_STORED("octo"), GH_CONNECTED("octo")]})],
     note="GitHub answers null for name and email: the login names the account")
case("control-a-github-profile-with-a-name-names-the-account-by-it", GH, to_connect(GH) + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ignored"}),
    http("userinfo", 200, dict(GH_PROFILE, name="The Octocat"), {"exactEmits": [GH_STORED("The Octocat"), GH_CONNECTED("The Octocat")]})])
case("a-github-user-api-401-after-connecting-is-a-connect-error", GH, to_connect(GH) + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ignored"}),
    http("userinfo", 401, "bad", {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "The account profile could not be read after connecting"})], "neverEmits": ["OAUTH_CONNECTED"]})])
case("a-userinfo-endpoint-off-the-configured-origin-fails-the-connect-visibly", GH_NOORIGIN, to_connect(GH_NOORIGIN) + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ignored"}, {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "NOT_CONFIGURED", "message": "The userinfo endpoint is not on the configured userinfo origin"})], "neverEmits": ["OAUTH_HTTP_SEND", "OAUTH_CONNECTED"]})])
case("a-not-connected-answer-is-refused", GH, to_connect(GH) + [
    step("OAUTH_KNOWN", {"connected": False, "label": ""}, {"emits": [em("OAUTH_CONNECT_ERROR", {"code": "AUTH_ERROR", "message": "The provider did not connect the account"})], "neverEmits": ["OAUTH_CONNECTED"]})])
for kind, code, msg in [
    ("unavailable", "NOT_CONFIGURED", "Sign-in is unavailable on this host"),
    ("unsigned", "AUTH_ERROR", "Nobody is signed in"),
    ("invalid_grant", "AUTH_ERROR", "The provider refused the request or the connection is not held"),
    ("invalid_client", "AUTH_ERROR", "The provider refused the request or the connection is not held"),
    ("denied", "AUTH_ERROR", "The provider refused the request or the connection is not held"),
    ("transport", "SERVICE_ERROR", "The provider could not be reached or answered something unusable"),
    ("malformed", "SERVICE_ERROR", "The provider could not be reached or answered something unusable"),
    ("refused", "SERVICE_ERROR", "The provider could not be reached or answered something unusable"),
]:
    case("a-store-failure-of-kind-%s-answers-a-fixed-safe-connect-error" % kind.replace("_", "-"), GH, [
        step("OAUTH_CONNECT", {"code": "c", "state": "no-grant"}),
        step("OAUTH_STEP_FAILED", {"error": "vendor said: secret-body-7", "kind": kind}, {"exactEmits": [em("OAUTH_CONNECT_ERROR", {"code": code, "message": msg})]})])

# google connect: userinfo fills the row
GOOG_CONN = to_connect(GG)
case("a-google-connect-reads-userinfo-with-the-held-credential-and-fills-account-and-avatar", GG, GOOG_CONN + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ignored@x"}, {"emits": [em("OAUTH_HTTP_SEND", {"key": "userinfo", "method": "GET", "target": "/v1/userinfo", "headers": [{"name": "accept", "value": "application/json"}, {"name": "user-agent", "value": "almadar-oauth"}], "body": "", "stream": "none"})]}),
    http("userinfo", 200, {"sub": "s1", "email": "ada@example.com", "name": "Ada", "picture": "https://img.example/a.png"},
         {"exactEmits": [
             em("OAUTH_STORED", {"id": "u1|google", "owner": "u1", "provider": "google", "account": "ada@example.com", "avatarUrl": "https://img.example/a.png", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z",
                                 "tokenEndpoint": DOC["token_endpoint"], "userinfoEndpoint": DOC["userinfo_endpoint"], "revocationEndpoint": DOC["revocation_endpoint"]}),
             em("OAUTH_CONNECTED", {"provider": "google", "connected": True, "account": "ada@example.com", "avatarUrl": "https://img.example/a.png", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z"})]})])


# --- the connected rows used below
def google_connected():
    return to_connect(GG) + [
        step("OAUTH_KNOWN", {"connected": True, "label": "ignored@x"}),
        http("userinfo", 200, {"sub": "s1", "email": "ada@example.com", "name": "Ada", "picture": "https://img.example/a.png"})]


def github_connected():
    return to_connect(GH) + [step("OAUTH_KNOWN", {"connected": True, "label": "octo"}), http("userinfo", 200, GH_PROFILE)]


# --- refresh
case("refresh-reads-the-connection-and-asks-the-store-for-the-refresh-grant", GG, google_connected() + [
    step("OAUTH_REFRESH", {}, {"effects": [{"type": "fetch", "arg0": "OAuthConnection"}]}),
    step("OAUTH_ROW_LOADED", {"data": {"id": "u1|google", "owner": "u1", "provider": "google", "account": "ada@example.com", "avatarUrl": "", "scope": [], "connectedAt": "", "tokenEndpoint": DOC["token_endpoint"], "userinfoEndpoint": "", "revocationEndpoint": ""}},
         {"effects": [{"type": "credential-connect", "arg0": {"credential": "@config.credential", "scope": "user", "tokenEndpoint": "@payload.data.tokenEndpoint", "grant": "refresh_token", "code": "", "redirectUri": "", "verifier": "", "clientId": "@config.clientId", "clientSecret": "@config.clientSecret", "clientAuth": "body"}}]})])
case("a-refresh-the-store-cannot-carry-answers-the-fixed-error", GG, google_connected() + [
    step("OAUTH_REFRESH", {}, {"emits": [em("OAUTH_REFRESH_ERROR", {"code": "NOT_CONFIGURED", "message": "Sign-in is unavailable on this host"})], "neverEmits": ["OAUTH_REFRESHED"]})],
     note="the replay host answers every credential-connect as unavailable")
case("a-connected-refresh-answer-carries-no-token", GG, google_connected() + [
    step("OAUTH_REFRESH", {}),
    step("OAUTH_KNOWN", {"connected": True, "label": "ada@example.com", "access_token": "SECRET-TOKEN", "refresh_token": "SECRET-REFRESH"}, {"exactEmits": [em("OAUTH_REFRESHED", {"connected": True})]})])
case("a-not-connected-refresh-answer-is-refused", GG, google_connected() + [
    step("OAUTH_REFRESH", {}),
    step("OAUTH_KNOWN", {"connected": False, "label": ""}, {"emits": [em("OAUTH_REFRESH_ERROR", {"code": "AUTH_ERROR", "message": "The provider did not refresh the connection"})], "neverEmits": ["OAUTH_REFRESHED"]})])
case("refresh-without-a-connection-row-says-not-connected", GG, [
    step("OAUTH_REFRESH", {}, {"emits": [em("OAUTH_REFRESH_ERROR", {"code": "AUTH_ERROR", "message": "Not connected: there is no provider connection for the signed-in user"})], "neverEmits": ["OAUTH_REFRESHED"]})])

# --- userinfo
case("userinfo-sends-a-get-to-the-connection-endpoint-path", GG, google_connected() + [
    step("OAUTH_USERINFO", {}, {"emits": [em("OAUTH_HTTP_SEND", {"key": "userinfo", "method": "GET", "target": "/v1/userinfo", "headers": [{"name": "accept", "value": "application/json"}, {"name": "user-agent", "value": "almadar-oauth"}], "body": "", "stream": "none"})]}),
    http("userinfo", 200, {"sub": "s1", "email": "ada@example.com", "name": "Ada", "picture": "https://img.example/a.png", "access_token": "SECRET"},
         {"exactEmits": [em("OAUTH_USERINFO_RESULT", {"sub": "s1", "email": "ada@example.com", "name": "Ada", "picture": "https://img.example/a.png"})]})])
case("userinfo-fields-the-provider-omits-are-empty-text", GG, google_connected() + [
    step("OAUTH_USERINFO", {}),
    http("userinfo", 200, {"sub": "s1"}, {"exactEmits": [em("OAUTH_USERINFO_RESULT", {"sub": "s1", "email": "", "name": "", "picture": ""})]})])
case("a-userinfo-401-is-an-auth-error", GG, google_connected() + [
    step("OAUTH_USERINFO", {}),
    http("userinfo", 401, "denied", {"exactEmits": [em("OAUTH_USERINFO_ERROR", {"code": "AUTH_ERROR", "message": "The userinfo lookup failed"})]})])
case("a-userinfo-500-is-a-service-error", GG, google_connected() + [
    step("OAUTH_USERINFO", {}),
    http("userinfo", 500, "boom", {"exactEmits": [em("OAUTH_USERINFO_ERROR", {"code": "SERVICE_ERROR", "message": "The userinfo lookup failed"})]})])
case("userinfo-with-a-credential-the-client-cannot-use-answers-the-fixed-error", GG, google_connected() + [
    step("OAUTH_USERINFO", {}),
    step("OAUTH_STEP_FAILED", {"error": "credential not held", "kind": "denied"}, {"exactEmits": [em("OAUTH_USERINFO_ERROR", {"code": "AUTH_ERROR", "message": "The provider refused the request or the connection is not held"})]})])
case("github-userinfo-sends-the-user-api-get-and-names-the-login-when-there-is-no-name", GH, github_connected() + [
    step("OAUTH_USERINFO", {}, {"emits": [GH_SEND]}),
    http("userinfo", 200, GH_PROFILE, {"exactEmits": [em("OAUTH_USERINFO_RESULT", {"sub": "", "email": "", "name": "octo", "picture": "https://avatars.example/o.png"})]})])
case("a-provider-whose-discovery-has-no-userinfo-endpoint-says-so", GG, to_connect(GG, doc=NOUI_DOC) + [
    step("OAUTH_KNOWN", {"connected": True, "label": "ada@example.com"}),
    step("OAUTH_USERINFO", {}, {"emits": [em("OAUTH_USERINFO_ERROR", {"code": "NOT_CONFIGURED", "message": "Provider \"google\" has no userinfo endpoint — set OIDC_ISSUER_URL to an OIDC-compliant issuer"})]})])
case("a-userinfo-endpoint-off-the-configured-origin-is-refused", dict(GG, userinfoOrigin="https://other.example"), google_connected() + [
    step("OAUTH_USERINFO", {}, {"emits": [em("OAUTH_USERINFO_ERROR", {"code": "NOT_CONFIGURED", "message": "The userinfo endpoint is not on the configured userinfo origin"})], "neverEmits": ["OAUTH_HTTP_SEND"]})])
case("userinfo-without-a-connection-row-says-not-connected", GG, [
    step("OAUTH_USERINFO", {}, {"emits": [em("OAUTH_USERINFO_ERROR", {"code": "AUTH_ERROR", "message": "Not connected: there is no provider connection for the signed-in user"})]})])

# --- revoke
case("revoke-posts-an-empty-form-and-the-client-appends-the-credential", GG, google_connected() + [
    step("OAUTH_REVOKE", {}, {"emits": [em("OAUTH_HTTP_SEND", {"key": "revoke", "method": "POST", "target": "/revoke", "headers": [{"name": "content-type", "value": "application/x-www-form-urlencoded"}, {"name": "accept", "value": "application/json"}], "body": "", "stream": "none"})]}),
    http("revoke", 200, "", {"exactEmits": [em("OAUTH_REVOKED", {"revoked": True})]})])
case("a-revocation-the-provider-refuses-is-an-error", GG, google_connected() + [
    step("OAUTH_REVOKE", {}),
    http("revoke", 400, "bad", {"exactEmits": [em("OAUTH_REVOKE_ERROR", {"code": "SERVICE_ERROR", "message": "The revocation failed"})]})])
case("github-has-no-revocation-endpoint-and-says-so", GH, github_connected() + [
    step("OAUTH_REVOKE", {}, {"emits": [em("OAUTH_REVOKE_ERROR", {"code": "NOT_CONFIGURED", "message": "Provider \"github\" has no revocation endpoint — set OIDC_ISSUER_URL to an OIDC-compliant issuer"})]})])
case("revoke-without-a-connection-row-says-not-connected", GG, [
    step("OAUTH_REVOKE", {}, {"emits": [em("OAUTH_REVOKE_ERROR", {"code": "AUTH_ERROR", "message": "Not connected: there is no provider connection for the signed-in user"})]})])
case("a-revocation-endpoint-off-the-configured-origin-is-refused", dict(GG, revocationOrigin="https://other.example"), google_connected() + [
    step("OAUTH_REVOKE", {}, {"emits": [em("OAUTH_REVOKE_ERROR", {"code": "NOT_CONFIGURED", "message": "The revocation endpoint is not on the configured revocation origin"})], "neverEmits": ["OAUTH_HTTP_SEND"]})])
case("a-revoke-timeout-answers-the-fixed-revoke-error", GG, google_connected() + [
    step("OAUTH_REVOKE", {}),
    step("OAUTH_STEP_FAILED", {"error": "timeout of 30000ms exceeded", "kind": "timeout"}, {"exactEmits": [em("OAUTH_REVOKE_ERROR", {"code": "SERVICE_ERROR", "message": "The provider could not be reached or answered something unusable"})]})])

# --- status and forget
case("status-asks-the-store-for-the-viewer-credential", GH, [
    step("OAUTH_CONNECTION", {}, {"effects": [{"type": "credential-status", "arg0": {"credential": "@config.credential", "scope": "user"}}]})])
case("not-connected-status-is-an-empty-row", GH, [
    step("OAUTH_CONNECTION", {}),
    step("OAUTH_KNOWN", {"connected": False, "label": ""}, {"exactEmits": [em("OAUTH_CONNECTION_RESULT", {"provider": "github", "connected": False, "account": "", "avatarUrl": "", "scope": [], "connectedAt": ""})]})])
case("connected-status-answers-the-stored-row", GG, google_connected() + [
    step("OAUTH_CONNECTION", {}),
    step("OAUTH_KNOWN", {"connected": True, "label": "ada@example.com"}, {"emits": [em("OAUTH_CONNECTION_RESULT", {"provider": "google", "connected": True, "account": "ada@example.com", "avatarUrl": "https://img.example/a.png", "scope": ["repo"], "connectedAt": "2023-11-14T22:13:20Z"})]})])
case("connected-status-without-a-row-answers-the-label", GH, [
    step("OAUTH_CONNECTION", {}),
    step("OAUTH_KNOWN", {"connected": True, "label": "octo"}, {"exactEmits": [
        em("OAUTH_ROW_ABSENT", {"error": "OAuthConnection u1|github not found", "code": "not-found"}),
        em("OAUTH_CONNECTION_RESULT", {"provider": "github", "connected": True, "account": "octo", "avatarUrl": "", "scope": [], "connectedAt": ""})]})])
case("a-status-the-host-cannot-answer-is-a-fixed-error", GH, [
    step("OAUTH_CONNECTION", {}),
    step("OAUTH_HOST_FAILED", {"error": "store down"}, {"exactEmits": [em("OAUTH_CONNECTION_ERROR", {"code": "SERVICE_ERROR", "message": "The host could not complete the request"})]})])
case("forget-drops-the-credential-and-the-row", GG, google_connected() + [
    step("OAUTH_DISCONNECT", {}, {"effects": [{"type": "set", "arg0": "@entity.op"}]}),
    step("OAUTH_KNOWN", {"connected": False, "label": ""}, {"emits": [em("OAUTH_DISCONNECTED", {"provider": "google", "connected": False, "account": "", "avatarUrl": "", "scope": [], "connectedAt": ""})]})])
case("forgetting-with-no-row-still-disconnects", GH, [
    step("OAUTH_DISCONNECT", {}),
    step("OAUTH_KNOWN", {"connected": False, "label": ""}, {"emits": [em("OAUTH_DISCONNECTED", {"provider": "github", "connected": False, "account": "", "avatarUrl": "", "scope": [], "connectedAt": ""})]})])
case("forgetting-when-nobody-is-signed-in-is-a-fixed-error", GH, [
    step("OAUTH_DISCONNECT", {}),
    step("OAUTH_HOST_FAILED", {"error": "nobody is signed in"}, {"exactEmits": [em("OAUTH_DISCONNECT_ERROR", {"code": "SERVICE_ERROR", "message": "The host could not complete the request"})]})])

json.dump({"atom": "auth/atoms/std-oauth.lolo", "trait": "OAuthClient", "spec": "spec/auth/oauth.lolo",
           "note": "the OAuth flow on std-http-client and the host credential store; the replay host answers credential-connect as unavailable, so a connected store answer is fed as OAUTH_KNOWN",
           "cases": cases}, open(out, "w"), indent=1)
print(len(cases))
