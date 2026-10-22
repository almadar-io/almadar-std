RX='^[+-]?([0-9]+[.]?[0-9]*|[.][0-9]+)([eE][+-]?[0-9]+)?$'
IMG='["image", "imageurl", "image_url", "photo", "photourl", "photo_url", "avatar", "avatarurl", "avatar_url", "thumbnail", "thumbnailurl", "thumbnail_url", "picture", "pictureurl", "cover", "coverurl", "banner", "bannerurl"]'
M32='4294967296'
def nxt(s): return f'(math/mod (+ (* {s} 1664525) 1013904223) {M32})'
def uu(s): return f'(/ {s} {M32})'
def rint(s,a,b): return f'(+ (math/floor (* {uu(s)} {b-a+1})) {a})'
def numok(x): return f'(and (!= (str/trim {x}) "") (= (str/replace-pattern (str/trim {x}) "{RX}" "") ""))'
def numv(x): return f'(str/to-number (str/trim {x}))'
def pad(x,n): return f'(str/padStart (str/concat "" {x}) {n} "0")'
def slug(x): return f'(let ((sg (str/lower (str/replace-pattern {x} "[^A-Za-z0-9]" "")))) (if (= @sg "") "value" @sg))'
def titlecase(x): return f'(str/join (array/map (array/filter (str/split (str/replaceAll (str/replaceAll (str/join (array/map (str/split {x} "") (fn c (if (and (!= @c (str/lower @c)) (= @c (str/upper @c))) (str/concat " " @c) @c))) "") "_" " ") "-" " ") " ") (fn w (!= @w ""))) (fn w (str/concat (str/upper (str/slice @w 0 1)) (str/slice @w 1 (str/len @w))))) " ")'
def isoparts(ms):
    d=f'(time/format {ms} "YYYY-MM-DD")'
    dt=f'(str/concat (time/format {ms} "YYYY-MM-DD") "T" (time/format {ms} "HH:mm:ss") "." (str/padStart (str/concat "" (math/mod (math/floor {ms}) 1000)) 3 "0") "Z")'
    return d,dt
def draws(n,s0): return f'(array/reduce (array/range {n}) [{s0}] (fn da dj (array/append @da {nxt("(array/last @da)")})))'
def cell(path,kind,text='""',num='0',extra=''): return f'{{ path: {path}, kind: {kind}, text: {text}, num: {num}{extra} }}'
def res(cellx,push='[]',s='@s0'):
    cells = '[]' if cellx is None else f'[{cellx}]'
    return f'{{ cells: {cells}, push: {push}, s: {s} }}'
def qs(x): return '"'+x+'"'

def string_default(value):
    return f'(let ((dd {value})) (if (validate/string @dd) (str/template "{{{{value}}}}" {{ value: @dd }}) ""))'

def sampler_step(P):
    RT,SD,NOW,EN,W=P['RT'],P['SD'],P['NOW'],P['EN'],P['WORDS']
    C=lambda kind,text='""',num='0',extra='': cell('@pa',kind,text,num,extra)
    dflt='(object/get @sp "default" null)'
    dk=f'(let ((dd {dflt})) (if (validate/string @dd) "string" (if (validate/array @dd) "array" (if (validate/object @dd) "object" (if (validate/boolean @dd) "boolean" (if (validate/number @dd) "number" "null"))))))'
    ds=string_default(dflt)
    honored=f'(and @hasdef (or {RT} (array/includes ["array", "object"] {dk}) (and (= {dk} "string") (if (= {ds} "") (array/includes @vals "") (= (array/len @vals) 0)))))'
    mockv='(object/get @sp "mock" "")'
    cands=f'(array/filter (array/map (str/split {mockv} ",") (fn p (str/trim @p))) (fn p (!= @p "")))'
    ncs='(array/len @cs)'
    pick='(array/nth @cs (math/mod (- @o 1) (array/len @cs)))'
    def resolve(lit):
        base=f'(if {SD} {NOW} 1781481600000)'
        ms=f'(+ {base} (* (if (= @sg2 "-") -1 1) (str/to-number @dg) (if (= @un "m") 60000 (if (= @un "h") 3600000 (if (= @un "d") 86400000 604800000)))))'
        d,dt=isoparts(ms)
        return (f'(let ((tt (str/trim {lit}))) (let ((sg2 (str/slice @tt 0 1)) (un (str/slice @tt (- (str/len @tt) 1) (str/len @tt))) (dg (str/slice @tt 1 (- (str/len @tt) 1)))) '
                f'(if (and (or (= @sg2 "-") (= @sg2 "+")) (array/includes ["m", "h", "d", "w"] @un) (!= @dg "") (= (str/replace-pattern @dg "[0-9]" "") "")) (if (= @ty "date") {d} {dt}) {lit})))')
    mock_member=C(qs('string'),pick)
    mock_beh=f'(if (> {ncs} 0) {C(qs("behavior"),pick)} {C(qs("null"))})'
    lit_date=f'(if (> {ncs} 0) {pick} {mockv})'
    mock_date=C(qs('string'),resolve(lit_date))
    lit_t=f'(if (> {ncs} 1) {pick} (str/concat (str/trim {mockv}) "-" @o))'
    mock_typed=(f'(let ((lt {lit_t})) (if (and (array/includes ["number", "money"] @ty) {numok("@lt")} (= (- {numv("@lt")} {numv("@lt")}) 0)) {C(qs("number"),"@lt",numv("@lt"))} '
                f'(if (and (= @ty "boolean") (array/includes ["true", "false"] @lt)) {C(qs("boolean"),"@lt")} {C(qs("string"),"@lt")})))')
    mock_chain=(f'(if (and (> (array/len @vals) 0) (> {ncs} 0)) {res(mock_member)} (if (= @ty "behavior") {res(mock_beh)} '
                f'(if (array/includes ["date", "datetime", "timestamp"] @ty) {res(mock_date)} {res(mock_typed)})))')
    mock_gate=f'(let ((cs {cands})) {mock_chain})'
    projected='(or (object/has @sp "projectedFrom") (and (= @ty "array") (object/has (object/get @sp "items" {}) "projectedFrom")))'
    vocab=C(qs('string'),'(array/nth @vals (math/mod (- @o 1) (array/len @vals)))')
    kid_frames=lambda n,spec,namex,idx,pathx: f'(array/map (array/range {n}) (fn ki {{ spec: {spec}, name: {namex}, index: {idx}, depth: (+ @dp 1), path: {pathx} }}))'
    arr_body=lambda n,s1: res(C(qs('array'),'""',n,f', kids: (array/map (array/range {n}) (fn ki (str/concat @pa "[" @ki "]")))'),
        kid_frames(n,'(object/get @sp "items")','(str/concat (if (= @nm "") "item" @nm) "[" @ki "]")','(+ (* @ix 10) @ki)','(str/concat @pa "[" @ki "]")'),s1)
    arr=(f'(if (or (not (object/has @sp "items")) (>= @dp 3)) {res(C(qs("array")))} (if {SD} (let ((s1 {nxt("@s0")})) (let ((n {rint("@s1",3,5)})) {arr_body("@n","@s1")})) {arr_body("3","@s0")}))')
    props='(object/get @sp "properties" {})'
    keys=f'(array/sort (object/keys {props}))'
    obj_cell=C(qs('object'),'""','0',f', keys: {keys}, kids: (array/map {keys} (fn n (str/concat @pa "." @n)))')
    obj_push=f'(array/map {keys} (fn n {{ spec: (object/get {props} @n), name: @n, index: @ix, depth: (+ @dp 1), path: (str/concat @pa "." @n) }}))'
    obj=f'(if (or (not (object/has @sp "properties")) (>= @dp 3)) {res(C(qs("null")))} {res(obj_cell,obj_push)})'
    slots='(object/get @sp "slots" [])'
    tup=res(C(qs('tuple'),'""',f'(array/len {slots})',f', kids: (array/map (array/range (array/len {slots})) (fn ki (str/concat @pa "[" @ki "]")))'),
            f'(array/map (array/range (array/len {slots})) (fn ki {{ spec: (array/nth {slots} @ki), name: (object/get (array/nth {slots} @ki) "name" ""), index: @ix, depth: (+ @dp 1), path: (str/concat @pa "[" @ki "]") }}))')
    uni_cell_none=res(C(qs('omit')))
    uni_push=f'[{{ spec: (object/get {props} (array/nth (object/get @sp "values" []) 0)), name: @nm, index: @ix, depth: (+ @dp 1), path: @pa }}]'
    uni=(f'(if (or (>= @dp 3) (= (array/len (object/get @sp "values" [])) 0) (not (object/has {props} (array/nth (object/get @sp "values" []) 0)))) {uni_cell_none} '
         f'{res(None,uni_push)})')
    sgx=slug('@nm')
    imgname=f'(array/includes {IMG} (str/lower @nm))'
    def imgurl(x): return f'(str/concat "https://picsum.photos/seed/" (str/encode-uri-component (str/concat {EN} "-" @nm "-" {x})) "/400/400")'
    last='(array/last @dr)'
    wd=lambda f: f'(array/nth {W} (math/floor (* {uu(f)} (array/len {W}))))'
    ws=f'(array/map (array/drop @dr 1) (fn wf {wd("@wf")}))'
    def withdraw(n,body): return f'(let ((dr {draws(n,"@s0")})) {body})'
    email_s=withdraw(2,res(C(qs('email'),f'(let ((wl {ws})) (str/concat (str/lower (array/nth @wl 0)) (str/slice "x@y" 1 2) (str/lower (array/nth @wl 1)) ".com"))'),'[]',last))
    email=f'(if {SD} {email_s} {res(C(qs("email"),f"(str/concat {sgx} @ix (str/slice {qs(chr(120)+chr(64)+chr(121))} 1 2) {qs(chr(101)+chr(120)+chr(97)+chr(109)+chr(112)+chr(108)+chr(101)+chr(46)+chr(99)+chr(111)+chr(109))})"))})'
    url_s=withdraw(2,res(C(qs('url'),f'(let ((wl {ws})) (str/concat "https://example.com/" (str/lower (array/nth @wl 0)) "-" (str/lower (array/nth @wl 1))))'),'[]',last))
    url=f'(if {SD} {url_s} {res(C(qs("url"),f"(str/concat {qs(chr(104)+chr(116)+chr(116)+chr(112)+chr(115)+chr(58)+chr(47)+chr(47)+chr(101)+chr(120)+chr(97)+chr(109)+chr(112)+chr(108)+chr(101)+chr(46)+chr(99)+chr(111)+chr(109)+chr(47))} {sgx} {qs(chr(47))} @ix)"))})'
    fl=lambda i,m: f'(math/floor (* {uu(f"(array/nth @dr {i})")} {m}))'
    phone_s=withdraw(3,res(C(qs('phone'),f'(str/concat "+1 (" (+ {fl(1,800)} 200) ") " (+ {fl(2,800)} 200) "-" {pad(fl(3,10000),4)})'),'[]',last))
    phone_i=f'(str/concat "+1-555-" {pad("(+ 1000 (math/mod @ix 9000))",4)})'
    phone=f'(if {SD} {phone_s} {res(C(qs("phone"),phone_i))})'
    hexs='(str/join (array/map (array/drop @dr 1) (fn hf (str/slice "0123456789abcdef" (math/floor (* (/ @hf 4294967296) 16)) (+ (math/floor (* (/ @hf 4294967296) 16)) 1)))) "")'
    uuid_s=withdraw(31,res(C(qs('uuid'),f'(let ((hx {hexs})) (str/concat (str/slice @hx 0 8) "-" (str/slice @hx 8 12) "-4" (str/slice @hx 12 15) "-" (str/slice @hx 15 19) "-" (str/slice @hx 19 31)))'),'[]',last))
    uuid_i='(str/concat "00000000-0000-4000-8000-" (str/join (array/map (array/reverse (array/range 12)) (fn uk (str/slice "0123456789abcdef" (math/mod (math/floor (/ @ix (math/pow 16 @uk))) 16) (+ (math/mod (math/floor (/ @ix (math/pow 16 @uk))) 16) 1)))) ""))'
    uuid=f'(if {SD} {uuid_s} {res(C(qs("uuid"),uuid_i))})'
    def numeric(a,b):
        seeded=f'(let ((s1 {nxt("@s0")})) (let ((v {rint("@s1",a,b)})) {res(C("@ty","(str/concat "+qs("")+" @v)","@v"),"[]","@s1")}))'
        idx=res(C("@ty","(str/concat "+qs("")+" (* @ix 10))","(* @ix 10)"))
        return f'(if {SD} {seeded} {idx})'
    tru,fal=qs('true'),qs('false')
    bool_=(f'(if {SD} (let ((s1 {nxt("@s0")})) {res(C("@ty",f"(if (< {uu(chr(64)+chr(115)+chr(49))} 0.5) {tru} {fal})"),"[]","@s1")}) '
           f'{res(C("@ty",f"(if (= (math/mod @ix 2) 0) {tru} {fal})"))})')
    img_s=f'(let ((s1 {nxt("@s0")})) {res(C("@ty",imgurl(rint("@s1",0,1000))),"[]","@s1")})'
    img=f'(if {SD} {img_s} {res(C("@ty",imgurl("@ix")))})'
    str_words=withdraw(2,res(C(qs('string'),f'(str/titleCase (str/join {ws} " "))'),'[]',last))
    str_idx=res(C(qs('string'),f'(str/concat {titlecase("@nm")} " " @ix)'))
    string=f'(if {imgname} {img} (if {SD} {str_words} {str_idx}))'
    ms_s=f'(+ {NOW} (- (math/floor (* {uu("@s1")} (* 120 86400000 2))) (* 120 86400000)))'
    d_s,dt_s=isoparts('@dms')
    date_seed=f'(let ((s1 {nxt("@s0")})) (let ((dms {ms_s})) {res(C("@ty",f"(if (= @ty {qs(chr(100)+chr(97)+chr(116)+chr(101))}) {d_s} {dt_s})"),"[]","@s1")}))'
    mon='(str/padStart (str/concat "" (+ (math/mod @ix 12) 1)) 2 "0")'
    date_idx=res(C('@ty',f'(let ((dd2 (str/concat "2026-" {mon} "-15"))) (if (= @ty "date") @dd2 (str/concat @dd2 "T00:00:00.000Z")))'))
    date=f'(if {SD} {date_seed} {date_idx})'
    bytes_=res(C(qs('bytes'),f'(base64/encode (str/concat {sgx} "-" @ix))'))
    file_=res(C(qs('file'),f'(str/concat {sgx} "-" @ix ".pdf")','(* @ix 1024)',f', url: (str/concat "https://example.com/files/" {sgx} "/" @ix ".pdf"), mime: "application/pdf"'))
    rel=res(C('(if (= (object/get (object/get @sp "relation" {}) "cardinality" "") "one") "relation-one" "relation-many")'))
    nullr=res(C(qs('null'))); omitr=res(C(qs('omit')))
    typed_dispatch=(f'(if (= @ty "array") {arr} (if (= @ty "object") {obj} (if (= @ty "tuple") {tup} (if (= @ty "union") {uni} '
        f'(if (= @ty "email") {email} (if (= @ty "url") {url} (if (= @ty "phone") {phone} (if (= @ty "uuid") {uuid} '
        f'(if (= @ty "number") {numeric(1,250)} (if (= @ty "money") {numeric(10,900)} (if (= @ty "boolean") {bool_} '
        f'(if (= @ty "string") {string} (if (= @ty "image") {img} (if (array/includes ["date", "datetime", "timestamp"] @ty) {date} '
        f'(if (= @ty "bytes") {bytes_} (if (= @ty "file") {file_} (if (= @ty "relation") {rel} '
        f'(if (array/includes ["enum", "trait", "orbital", "behavior"] @ty) {nullr} {omitr}))))))))))))))))))')
    intr='(= (object/get @sp "intrinsic" false) true)'
    defcell=res(C(qs('default'),'""','0',f', val: {dflt}'))
    chain=(f'(if {intr} (if @hasdef {defcell} {omitr}) '
           f'(if {honored} {defcell} '
           f'(if @hasmock {mock_gate} '
           f'(if {projected} {res(C(chr(40)+"if (= @ty "+qs("array")+") "+qs("relation-many")+" "+qs("string")+")"))} '
           f'(if (> (array/len @vals) 0) {res(vocab)} {typed_dispatch})))))')
    body=(f'(let ((fr (array/first (object/get @acc "stack")))) (let ((rest (array/drop (object/get @acc "stack") 1)) (s0 (object/get @acc "s")) (sp (object/get @fr "spec")) (nm (object/get @fr "name")) (ix (object/get @fr "index")) (dp (object/get @fr "depth")) (pa (object/get @fr "path"))) '
          f'(let ((ty (object/get @sp "type")) (o (if {RT} 1 @ix))) (let ((vals (if (= @ty "union") [] (object/get @sp "values" []))) (hasdef (object/has @sp "default")) (hasmock (object/has @sp "mock"))) '
          f'(let ((rr {chain})) {{ stack: (array/concat (object/get @rr "push") @rest), cells: (array/concat (object/get @acc "cells") (object/get @rr "cells")), s: (object/get @rr "s") }})))))')
    return f'(fn acc kk (if (= (array/len (object/get @acc "stack")) 0) @acc {body}))'

def build_expr(cells_expr, root_path_expr='""', row_root=False):
    """Build each value into the reverse walk's map accumulator."""
    def put(value):
        return f'(object/set @vm (object/get @cl "path") {value})'
    row_value='(object/fromEntries (array/map (array/filter (array/range (array/len @ks)) (fn i (!= (object/get (array/find @allc (fn c (= (object/get @c "path") (array/nth @ks @i)))) "kind") "omit"))) (fn i [(array/nth (object/get @cl "keys" []) @i), (object/get @vm (array/nth @ks @i))])))'
    cases = [
        ('(or (= @kd "array") (= @kd "tuple"))', '(array/map @ks (fn p (object/get @vm @p)))'),
        ('(= @kd "row")', row_value),
        ('(= @kd "object")', '(object/fromEntries (array/map (array/range (array/len @ks)) (fn i [(array/nth (object/get @cl "keys" []) @i), (object/get @vm (array/nth @ks @i))])))'),
        ('(= @kd "default")', '(object/get @cl "val" null)'),
        ('(= @kd "behavior")', '{ behavior: (object/get @cl "text" "") }'),
        ('(= @kd "file")', '{ name: (object/get @cl "text" ""), url: (object/get @cl "url" ""), mimeType: (object/get @cl "mime" ""), sizeBytes: (object/get @cl "num" 0) }'),
        ('(or (= @kd "number") (= @kd "money"))', '(object/get @cl "num" 0)'),
        ('(= @kd "boolean")', '(= (object/get @cl "text" "") "true")'),
        ('(= @kd "relation-one")', '""'),
        ('(= @kd "relation-many")', '[]'),
        ('(or (= @kd "null") (= @kd "omit"))', 'null'),
    ]
    step = put('(object/get @cl "text" "")')
    for condition, value in reversed(cases):
        step = f'(if {condition} {put(value)} {step})'
    step = f'(let ((kd (object/get @cl "kind")) (ks (object/get @cl "kids" []))) {step})'
    if row_root:
        step=f'(if (= (object/get @cl "path") {root_path_expr}) @vm {step})'
        result=f'(let ((cl (array/find @allc (fn c (= (object/get @c "path") {root_path_expr}))))) (let ((ks (object/get @cl "kids" []))) {row_value}))'
    else:
        result=f'(object/get @vm {root_path_expr} null)'
    return (f'(let ((allc {cells_expr}) (initialValues : SampleValueMap {{}})) (let ((vm (array/reduce (array/range (array/len @allc)) @initialValues (fn vm j (let ((cl (array/nth @allc (- (array/len @allc) (+ @j 1))))) {step}))))) {result}))')

def run(P, stack_expr, cells_init, s_expr, root='""', K=400, row_root=False):
    """returns an expression: {cells, s, value}"""
    step=sampler_step(P)
    return (f'(let ((fin (array/reduce (array/range {K}) {{ stack: {stack_expr}, cells: {cells_init}, s: {s_expr} }} {step}))) '
            f'{{ cells: (object/get @fin "cells"), s: (object/get @fin "s"), value: {build_expr("(object/get @fin "+chr(34)+"cells"+chr(34)+")", root, row_root=row_root)} }})')
