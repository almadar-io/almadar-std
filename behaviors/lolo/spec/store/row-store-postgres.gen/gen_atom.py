"""Generates store/atoms/std-row-store-postgres.lolo (the atom is large and mechanical: the same planner expressions appear at every hop that must answer in one step).
Run from this directory: python3 gen_atom.py"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

# ============================== expr
import re

NUL = '"\\u{0}"'
MARK = '"\\u{0}"'


def S(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


def T(tpl, **kw):
    out = tpl
    for k, v in kw.items():
        out = out.replace('§' + k + '§', v)
    assert '§' not in out, out
    return out


def cat(*parts):
    return '(str/concat ' + ' '.join(parts) + ')'


def u32(n):
    return '(bytes/write-uint ' + n + ' 4 "be")'


def u16(n):
    return '(bytes/write-uint ' + n + ' 2 "be")'


def byte(n):
    return '(bytes/write-uint ' + n + ' 1 "be")'


def fromstr(s):
    return '(bytes/from-string ' + s + ')'


def msg(kind, body):
    # body is an expression; wrapped in let so it is evaluated once
    return T('(let ((mb §b§)) (bytes/concat [(bytes/from-string §k§), (bytes/write-uint (+ (bytes/length @mb) 4) 4 "be"), @mb]))', b=body, k=S(kind))


def quote_ident(x):
    return cat(S('"'), '(str/replaceAll ' + x + ' ' + S('"') + ' ' + S('""') + ')', S('"'))


def kind_of(col, v):
    return T('(let ((§v§ (array/find (object/entries @entity.kinds) (fn §v§e (= (array/nth @§v§e 0) §col§))))) (if (= @§v§ null) "absent" (array/nth @§v§ 1)))', col=col, v=v)


def stamp_col(f):
    return T('(if (= §f§ "createdAt") "created_at" (if (= §f§ "updatedAt") "updated_at" ""))', f=f)


def col_for(f, v):
    # column a row field lives in, given @entity.kinds
    return T('(let ((§v§sc §sc§)) (if (and (!= @§v§sc "") (= §k1§ "absent") (!= §k2§ "absent")) @§v§sc §f§))',
             v=v, sc=stamp_col(f), f=f, k1=kind_of(f, v + 'a'), k2=kind_of('@' + v + 'sc', v + 'b'))


def paren_check(text):
    depth = 0
    i = 0
    instr = False
    line = 1
    while i < len(text):
        c = text[i]
        if instr:
            if c == '\\':
                i += 2
                continue
            if c == '"':
                instr = False
        else:
            if c == '"':
                instr = True
            elif c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth < 0:
                    raise Exception('negative depth at line %d' % line)
        if c == '\n':
            line += 1
        i += 1
    return depth

# ============================== g2a

OUT = os.path.join(HERE, '..', '..', '..', 'store', 'atoms', 'std-row-store-postgres.lolo')
SPEC = os.path.join(HERE, '..', 'row-store-postgres.lolo')
spec_src = open(SPEC).read()
types_block = spec_src[spec_src.index('  type RowCell'):spec_src.index('  type PgNullParam')]


def AND(*xs):
    return '(and ' + ' '.join(xs) + ')'


def OR(*xs):
    return '(or ' + ' '.join(xs) + ')'


def NOT(x):
    return '(not ' + x + ')'


def EQ(a, b):
    return '(= ' + a + ' ' + b + ')'


def NE(a, b):
    return '(!= ' + a + ' ' + b + ')'


def IF(c, a, b):
    return '(if ' + c + ' ' + a + ' ' + b + ')'


SET = lambda f, v: '(set @entity.' + f + ' ' + v + ')'
EMIT = lambda ev, payload=None: '(emit ' + ev + (' ' + payload if payload else '') + ')'
EMPTY_BYTES = '(bytes/from-string "")'
RECV = '(os/recv @entity.sock @config.recvBytes { key: "recv" emit: { success: PG_RECEIVED, failure: PG_IO_FAILED } })'


def tr(event, target, when=None, effects=()):
    head = '      ' + event + ' -> ' + target + ((' when ' + when) if when else '')
    return '\n'.join([head] + ['        ' + e for e in effects])


def stg(*names):
    parts = ['(= @entity.stage ' + S(n) + ')' for n in names]
    return parts[0] if len(parts) == 1 else '(or ' + ' '.join(parts) + ')'


# ---------------------------------------------------------------- name -> typed lookups over @entity.kinds
def kind_of(col):
    return '(object/get @entity.kinds ' + col + ' "absent")'


def stamp_col(f):
    return T('(if (= §f§ "createdAt") "created_at" (if (= §f§ "updatedAt") "updated_at" ""))', f=f)


def col_for(f, v):
    return T('(let ((§v§sc §sc§)) (if (and (!= @§v§sc "") (= §k1§ "absent") (!= §k2§ "absent")) @§v§sc §f§))',
             v=v, sc=stamp_col(f), f=f, k1=kind_of(f), k2=kind_of('@' + v + 'sc'))


B64 = lambda b: '(bytes/to-base64 ' + b + ')'

TABLE_OF = lambda et, v: T(
    '(let ((§v§chars (str/split §et§ ""))) (let ((§v§snake (str/join (array/map (array/range 0 (array/len @§v§chars)) (fn §v§i (let ((§v§c (array/nth @§v§chars @§v§i))) (if (and (> @§v§i 0) (validate/pattern @§v§c "^[A-Z]$") (validate/pattern (array/nth @§v§chars (- @§v§i 1)) "^[a-z0-9]$")) (str/concat "_" (str/lower @§v§c)) (str/lower @§v§c))))) ""))) (let ((§v§decl (object/get @entity.collections §et§ ""))) (if (!= @§v§decl "") @§v§decl (if (str/endsWith @§v§snake "y") (str/concat (str/slice @§v§snake 0 (- (str/len @§v§snake) 1)) "ies") (if (str/endsWith @§v§snake "s") (str/concat @§v§snake "es") (str/concat @§v§snake "s")))))))',
    et=et, v=v)

NUMBERED = T(
    '(let ((np (str/split @entity.sql §m§))) (str/join (array/map (array/range 0 (array/len @np)) (fn ni (str/concat (array/nth @np @ni) (if (< @ni (- (array/len @np) 1)) (str/concat "$" (+ @entity.bindBase @ni 1)) "")))) ""))',
    m=MARK)

PARAMS_OF = lambda binds: '(array/map ' + binds + ' (fn pb (if @pb.isNull { kind: "null" } { kind: "text", text: @pb.text })))'

QUERY_FRAME = T(
    '(let ((qs (bytes/from-string @entity.sql)) (qp (array/map @entity.binds (fn p (if @p.isNull §neg§ (let ((tb (bytes/from-string @p.text))) (bytes/concat [§plen§, @tb])))))) (z (bytes/write-uint 0 1 "be"))) (bytes/concat [§parse§, §bind§, §desc§, §exec§, §sync§]))',
    neg=u32('4294967295'),
    plen='(bytes/write-uint (bytes/length @tb) 4 "be")',
    parse=msg('P', '(bytes/concat [@z, @qs, @z, ' + u16('0') + '])'),
    bind=msg('B', '(bytes/concat (array/append (array/concat [@z, @z, ' + u16('0') + ', ' + u16('(array/len @entity.binds)') + '] @qp) ' + u16('0') + '))'),
    desc=msg('D', '(bytes/concat [' + byte('80') + ', @z])'),
    exec=msg('E', '(bytes/concat [@z, ' + u32('0') + '])'),
    sync=msg('S', fromstr('""')))

TO_BYTES = lambda x: '(bytes/from-base64 ' + x + ')'
SHA_BYTES = lambda x: TO_BYTES('(hash/sha256 ' + x + ' "base64" "bytes")')

ESC_USER = '(str/replaceAll (str/replaceAll @entity.userName "=" "=3D") "," "=2C")'

MD5_PASSWORD = '(str/concat "md5" (hash/md5 ' + B64('(bytes/concat [(bytes/from-string (hash/md5 (base64/encode (str/concat @entity.secret @entity.userName)) "hex")), (bytes/slice @entity.act.body 4 8)])') + ' "hex"))'


def hmac(k, m, v):
    ik = '(bytes/concat (array/append (array/map (array/range 0 8) (fn ' + v + 'w (bytes/write-uint (bit/xor (bytes/read-uint ' + k + ' (* @' + v + 'w 4) 4 "be") 909522486) 4 "be"))) (bytes/from-string (str/repeat "6" 32))))'
    ok = '(bytes/concat (array/append (array/map (array/range 0 8) (fn ' + v + 'x (bytes/write-uint (bit/xor (bytes/read-uint ' + k + ' (* @' + v + 'x 4) 4 "be") 1549556828) 4 "be"))) (bytes/from-string (str/repeat "\\\\" 32))))'
    inner = SHA_BYTES('(bytes/concat [' + ik + ', ' + m + '])')
    return SHA_BYTES('(bytes/concat [' + ok + ', ' + inner + '])')


def scram_proof():
    fail = lambda msg_: '{ frame: ' + EMPTY_BYTES + ', sig: "", error: ' + S(msg_) + ' }'
    find = lambda key: T('(array/find @kv (fn kf (and (= (str/slice @kf 0 1) §k§) (= (str/slice @kf 1 2) "="))))', k=S(key))
    xor = '(bytes/concat (array/map (array/range 0 8) (fn pw ' + u32('(bit/xor (bytes/read-uint @ck (* @pw 4) 4 "be") (bytes/read-uint @cs (* @pw 4) 4 "be"))') + ')))'
    pframe = msg('p', fromstr('(str/concat @wop ",p=" ' + B64(xor) + ')'))
    return T(
        '(let ((sf (bytes/to-string (bytes/slice @entity.act.body 4)))) (let ((kv (str/split @sf ","))) (let ((r §fr§) (s §fs§) (i §fi§)) (if (or (= @r null) (= @s null) (= @i null)) §f1§ (if (not (validate/pattern (str/slice @i 2) "^[0-9]+$")) §f1§ (let ((combined (str/slice @r 2)) (salt (str/slice @s 2)) (iter (str/to-number (str/slice @i 2)))) (if (not (str/startsWith @combined @entity.nonce)) §f2§ (if (or (< @iter 1) (> @iter 1000000)) { frame: §eb§, sig: "", error: (str/concat "the SCRAM iteration count " @iter " is outside 1 to 1000000") } (let ((bare (str/concat "n=" §esc§ ",r=" @entity.nonce)) (wop (str/concat "c=biws,r=" @combined))) (let ((am (bytes/from-string (str/concat @bare "," @sf "," @wop))) (salted (hash/pbkdf2 (bytes/from-string @entity.secret) @salt @iter 32))) (let ((ck §hck§) (sk §hsk§)) (let ((stored §stored§)) (let ((cs §hcs§) (ss §hss§)) { frame: §pframe§, sig: @ss, error: "" })))))))))))))',
        fr=find('r'), fs=find('s'), fi=find('i'),
        f1=fail('the SCRAM server-first message lacks r, s or i'),
        f2=fail('the SCRAM server nonce does not extend the client nonce'),
        eb=EMPTY_BYTES, esc=ESC_USER,
        hck=hmac('@salted', fromstr('"Client Key"'), 'h1'),
        hsk=hmac('@salted', fromstr('"Server Key"'), 'h2'),
        hcs=hmac('@stored', '@am', 'h3'), stored=SHA_BYTES('@ck'),
        hss=hmac('@sk', '@am', 'h4'),
        pframe=pframe)


# ---------------------------------------------------------------- scan
def rec(**o):
    d = dict(pos='@acc.pos', cols='@acc.cols', raw='@acc.raw', err='@acc.err', auth='@acc.auth', done='@acc.done', stop='@acc.stop')
    d.update(o)
    return '{ ' + ', '.join(k + ': ' + d[k] for k in ['pos', 'cols', 'raw', 'err', 'auth', 'done', 'stop']) + ' }'


SCAN_COLS = '(let ((cn (bytes/read-uint @body 0 2 "be"))) (let ((cr (array/reduce (array/range 0 @cn) { p: 2, cols: @acc.cols } (fn ca cj (let ((cz (bytes/index-of @body @nul @ca.p))) { p: (+ @cz 19), cols: (array/append @ca.cols { name: (bytes/to-string (bytes/slice @body @ca.p @cz)), oid: (bytes/read-uint @body (+ @cz 7) 4 "be") }) }))))) (object/get @cr "cols")))'
SCAN_CELLS = '(let ((dn (bytes/read-uint @body 0 2 "be"))) (let ((dr (array/reduce (array/range 0 @dn) { p: 2, cells: [] } (fn da dj (let ((dl (math/default (bytes/read-uint @body @da.p 4 "be") 0))) (if (>= @dl 2147483648) { p: (+ @da.p 4), cells: (array/append @da.cells { isNull: true, text: "" }) } { p: (+ @da.p 4 @dl), cells: (array/append @da.cells { isNull: false, text: (bytes/to-string (bytes/slice @body (+ @da.p 4) (+ @da.p 4 @dl))) }) })))))) (object/get @dr "cells")))'
SCAN_ERR = T(
    '(let ((ep (str/split (bytes/to-string @body) §nul§))) { present: true, code: §ec§, message: §em§ })',
    nul=NUL,
    ec='(let ((ef (array/find @ep (fn eq (str/startsWith @eq "C"))))) (if (= @ef null) "" (str/slice @ef 1)))',
    em='(let ((eg (array/find @ep (fn er (str/startsWith @er "M"))))) (if (= @eg null) "" (str/slice @eg 1)))')

SCAN = T(
    '(let ((total (bytes/length @entity.inbox)) (nul (bytes/write-uint 0 1 "be"))) (array/reduce (array/range 0 (+ 1 (math/floor (/ @total 5)))) { pos: 0, cols: @entity.cols, raw: @entity.raw, err: @entity.err, auth: [], done: false, stop: false } (fn acc i (if (or @acc.done @acc.stop) @acc (if (< (- @total @acc.pos) 5) §stop§ (let ((len (bytes/read-uint @entity.inbox (+ @acc.pos 1) 4 "be"))) (if (< (- @total @acc.pos) (+ 1 @len)) §stop§ (let ((kind (bytes/at @entity.inbox @acc.pos)) (body (bytes/slice @entity.inbox (+ @acc.pos 5) (+ @acc.pos 1 @len))) (next (+ @acc.pos 1 @len))) (if (= @kind 84) §t§ (if (= @kind 68) §d§ (if (= @kind 69) §e§ (if (= @kind 82) §r§ (if (= @kind 90) §z§ §o§)))))))))))))',
    stop=rec(stop='true'), t=rec(pos='@next', cols=SCAN_COLS),
    d=rec(pos='@next', raw='(array/append @acc.raw { cells: ' + SCAN_CELLS + ' })'),
    e=rec(pos='@next', err=SCAN_ERR),
    r=rec(pos='@next', auth='(array/append @acc.auth { code: (bytes/read-uint @body 0 4 "be"), body: @body })'),
    z=rec(pos='@next', done='true'), o=rec(pos='@next'))

# ---------------------------------------------------------------- cell -> JSON entries
TS_CONVERT = '(if (str/endsWith @tx "infinity") @tx (let ((td (array/nth (str/split @tx " ") 0)) (tr (str/join (array/drop (str/split @tx " ") 1) " "))) (let ((toff (str/replace-pattern @tr "^[0-9:.]*" "")) (tclk (str/replace-pattern @tr "[+-][0-9:]*$" ""))) (let ((tclock (str/replace-pattern @tclk "\\\\..*$" "")) (tfrac (str/replace-pattern @tclk "^[^.]*\\\\.?" "")) (tsign (if (= (str/slice @toff 0 1) "-") -1 1)) (thms (str/split (str/slice @toff 1) ":"))) (let ((tsecs (+ (* 3600 (str/to-number (array/nth @thms 0))) (* 60 (if (= (array/nth @thms 1) null) 0 (str/to-number (array/nth @thms 1)))) (if (= (array/nth @thms 2) null) 0 (str/to-number (array/nth @thms 2)))))) (str/concat (time/format (- (time/parse (str/concat @td "T" @tclock "Z")) (* @tsign @tsecs 1000)) "YYYY-MM-DDTHH:mm:ss") (if (!= @tfrac "") (str/concat "." @tfrac) "") "Z"))))))'

# ---- values by type
ARR_OIDS = '[1000, 1001, 1005, 1007, 1009, 1014, 1015, 1016, 1021, 1022, 1115, 1182, 1185, 1231, 2951, 199, 3807]'
ELEM_OIDS = '[16, 17, 21, 23, 25, 1042, 1043, 20, 700, 701, 1114, 1082, 1184, 1700, 2950, 114, 3802]'
HEXV = lambda c: '(array/indexOf (str/split "0123456789abcdef" "") ' + c + ')'
BYTEA_B64 = lambda tx: B64('(bytes/concat (array/map (array/range 0 (math/floor (/ (- (str/len ' + tx + ') 2) 2))) (fn bk (bytes/write-uint (+ (* 16 ' + HEXV('(str/slice ' + tx + ' (+ 2 (* @bk 2)) (+ 3 (* @bk 2)))') + ') ' + HEXV('(str/slice ' + tx + ' (+ 3 (* @bk 2)) (+ 4 (* @bk 2)))') + ') 1 "be"))))')


def conv_json(oid, tx, ts, allow_json):
    sv = '(if (= ' + oid + ' 1184) ' + ts + ' (if (= ' + oid + ' 1114) (str/replace ' + tx + ' " " "T") ' + tx + '))'
    body = ('(if (= ' + oid + ' 16) (if (= ' + tx + ' "t") "true" "false") '
            '(if (or (= ' + oid + ' 21) (= ' + oid + ' 23) (= ' + oid + ' 26) (= ' + oid + ' 20)) (if (= (str/to-int ' + tx + ') null) (json/stringify ' + tx + ') ' + tx + ') '
            '(if (or (= ' + oid + ' 700) (= ' + oid + ' 701)) (if (array/includes ["NaN", "Infinity", "-Infinity"] ' + tx + ') "null" ' + tx + ') '
            '(if (= ' + oid + ' 17) (json/stringify ' + BYTEA_B64(tx) + ') (json/stringify ' + sv + ')))))')
    if allow_json:
        body = '(if (or (= ' + oid + ' 114) (= ' + oid + ' 3802)) ' + tx + ' ' + body + ')'
    return body, sv


ELEM_J, _ = conv_json('@eoid', '@etx', TS_CONVERT.replace('@tx', '@etx'), False)
FLUSH_EL = '(if (or @aa.quoted (!= @aa.tok "")) (if (and (not @aa.quoted) (= @aa.tok "NULL")) "null" (let ((eoid @aoid) (etx @aa.tok)) ' + ELEM_J + ')) "")'
ARRAY_JSON = T(
    '(let ((aoid (array/nth §elems§ (array/indexOf §arrs§ @oid))) (atx (if (str/startsWith @tx "[") (str/join (array/drop (str/split @tx "=") 1) "=") @tx))) (object/get (array/reduce (str/split @atx "") { out: "", inq: false, esc: false, tok: "", quoted: false } (fn aa ac (if @aa.esc §escd§ (if @aa.inq (if (= @ac "\\\\") §bs§ (if (= @ac "\\"") §cq§ §ap§)) (if (= @ac "\\"") §oq§ (if (= @ac "{") §ob§ (if (= @ac "}") §cb§ (if (= @ac ",") §cm§ §ap§)))))))) "out"))',
    elems=ELEM_OIDS, arrs=ARR_OIDS,
    escd='{ out: @aa.out, inq: @aa.inq, esc: false, tok: (str/concat @aa.tok @ac), quoted: @aa.quoted }',
    bs='{ out: @aa.out, inq: true, esc: true, tok: @aa.tok, quoted: @aa.quoted }',
    cq='{ out: @aa.out, inq: false, esc: false, tok: @aa.tok, quoted: true }',
    ap='{ out: @aa.out, inq: @aa.inq, esc: false, tok: (str/concat @aa.tok @ac), quoted: @aa.quoted }',
    oq='{ out: @aa.out, inq: true, esc: false, tok: @aa.tok, quoted: true }',
    ob='{ out: (str/concat @aa.out "["), inq: false, esc: false, tok: "", quoted: false }',
    cb='{ out: (str/concat @aa.out §flush§ "]"), inq: false, esc: false, tok: "", quoted: false }',
    cm='{ out: (str/concat @aa.out §flush§ ","), inq: false, esc: false, tok: "", quoted: false }',
    flush=FLUSH_EL)

CONV_CELL, SV_CELL = conv_json('@oid', '@tx', TS_CONVERT, True)
CELL_ENTRY = T(
    '(let ((oid @rc.oid) (tx @rcell.text)) (let ((isArr (>= (array/indexOf §arrs§ @oid) 0)) (isJson (or (= @oid 114) (= @oid 3802))) (isBool (= @oid 16)) (isInt (or (= @oid 21) (= @oid 23) (= @oid 26) (= @oid 20))) (isFloat (or (= @oid 700) (= @oid 701)))) { n: @rc.name, s: §sv§, isStr: (and (not @isArr) (not @isJson) (not @isBool) (not @isInt) (not @isFloat)), j: (if @rcell.isNull "null" (if @isArr §arr§ §conv§)) }))',
    arrs=ARR_OIDS, sv=SV_CELL, arr=ARRAY_JSON, conv=CONV_CELL)

ENTRIES = T(
    '(array/map (array/range 0 (array/len @entity.cols)) (fn rj (let ((rc (array/nth @entity.cols @rj)) (rcell (array/nth @rawrow.cells @rj))) §entry§)))',
    entry=CELL_ENTRY)

MILLIS = '(if (str/includes @en.s ".") (let ((mp (str/split @en.s "."))) (let ((mtail (str/join (array/drop @mp 1) "."))) (str/concat (array/nth @mp 0) "." (str/slice (str/padEnd (str/replace-pattern @mtail "[^0-9].*$" "") 3 "0") 0 3) (str/replace-pattern @mtail "^[0-9]*" "")))) (if (str/endsWith @en.s "Z") (str/concat (str/slice @en.s 0 (- (str/len @en.s) 1)) ".000Z") @en.s))'

ROW_OF = T(
    '(let ((es §entries§)) (let ((hasC (array/some @es (fn x1 (= @x1.n "createdAt")))) (hasU (array/some @es (fn x2 (= @x2.n "updatedAt"))))) (let ((fixed (array/map @es (fn en0 (let ((nn (if (and (= @en0.n "created_at") (not @hasC)) "createdAt" (if (and (= @en0.n "updated_at") (not @hasU)) "updatedAt" @en0.n)))) { n: @nn, s: @en0.s, isStr: @en0.isStr, j: @en0.j }))))) (let ((done (array/map @fixed (fn en (if (and @en.isStr (or (= @en.n "createdAt") (= @en.n "updatedAt"))) { n: @en.n, s: §ms§, isStr: true, j: (json/stringify §ms§) } @en))))) (json/parse (str/concat "{" (str/join (array/map @done (fn ej (str/concat (json/stringify @ej.n) ":" @ej.j))) ",") "}") Row)))))',
    entries=ENTRIES, ms=MILLIS)

# ---------------------------------------------------------------- scalar text of a RowCell-like value
SCALAR_TEXT = lambda v: T('(let ((stx §v§)) (if (validate/string @stx) @stx (json/stringify @stx)))', v=v)
BIND_OF = lambda v: T('(if (= §v§ null) { isNull: true, text: "" } (if (or (validate/array §v§) (validate/object §v§)) { isNull: false, text: (json/stringify §v§) } { isNull: false, text: §st§ }))', v=v, st=SCALAR_TEXT(v))

# ============================== g2b

# ---------------------------------------------------------------- predicate fold (results are PgWrapped { sql, binds })
WRAP = lambda sql, binds: T('{ sql: §s§, binds: §b§ }', s=sql, b=binds)
UNWRAP = lambda x: x
MARK_ = MARK

PRED_FIELDS = '(fn (pn pk) (let ((pkind (object/get @pn "kind" ""))) (if (or (= @pkind "all") (= @pkind "any")) { fields: (array/flatten (array/map (object/get @pk "of" []) (fn x @x.fields))) } (if (= @pkind "not") @pk.of { fields: (if (= @pkind "const") [] [(object/get @pn "field" "")]) }))))'

NONE_BINDS = '[]'


def leaf_json(sql, binds='[]'):
    return WRAP(sql, binds)


PRED_SQL_STEP = T(
    '(fn (node kids) (let ((k (object/get @node "kind" "")) (f (object/get @node "field" ""))) (let ((col §col§)) (let ((kd §kd§) (q §q§) (v (object/get @node "value" null)) (op (object/get @node "op" ""))) (if (and (array/includes ["compare", "member", "hasElement", "contains", "isNull"] @k) (= @kd "absent")) §absent§ (if (= @k "const") §const§ (if (= @k "compare") §compare§ (if (= @k "isNull") §isnull§ (if (= @k "member") §member§ (if (= @k "hasElement") §has§ (if (= @k "contains") §contains§ (if (= @k "all") §all§ (if (= @k "any") §any§ §not§)))))))))))))',
    col=col_for('@f', 'pc'), kd=kind_of('@col'), q=quote_ident('@col'),
    absent=leaf_json('(if (= @k "isNull") (if (= (object/get @node "isNull" false) true) "TRUE" "FALSE") (if (and (= @k "compare") (= @op "!=") (!= @v null)) "TRUE" "FALSE"))'),
    const=leaf_json('(if (= (object/get @node "value" false) true) "TRUE" "FALSE")'),
    compare=T('(if (= @v null) §nullc§ (if (or (validate/array @v) (validate/object @v)) §objc§ (let ((cp { isNull: false, text: §st§ })) (if (= @op "==") §eq§ (if (= @op "!=") §ne§ §rng§)))))',
              nullc=leaf_json('(if (= @op "!=") (str/concat @q " IS NOT NULL") "FALSE")'),
              objc=leaf_json('(if (= @op "!=") "TRUE" "FALSE")'),
              st=SCALAR_TEXT('@v'),
              eq=leaf_json('(str/concat "COALESCE(" @q " = " ' + MARK + ' ", FALSE)")', '[@cp]'),
              ne=leaf_json('(str/concat @q " IS DISTINCT FROM " ' + MARK + ')', '[@cp]'),
              rng=leaf_json('(str/concat "COALESCE(" @q (if (and (validate/string @v) (= @kd "text")) " COLLATE \\"C\\"" "") " " @op " " ' + MARK + ' ", FALSE)")', '[@cp]')),
    isnull=leaf_json('(str/concat @q (if (= (object/get @node "isNull" false) true) " IS NULL" " IS NOT NULL"))'),
    member=T('(let ((kept (array/filter (object/get @node "values" []) (fn mv §sc§)))) (if (= (array/len @kept) 0) §none§ §some§))',
             sc='(or (validate/string @mv) (validate/number @mv) (validate/boolean @mv))',
             none=leaf_json('"FALSE"'),
             some=leaf_json('(str/concat "COALESCE(" @q " = ANY(" ' + MARK + ' "), FALSE)")',
                            '[{ isNull: false, text: (str/concat "{" (str/join (array/map @kept (fn mx (str/concat "\\"" (str/replaceAll (str/replaceAll ' + SCALAR_TEXT('@mx') + ' "\\\\" "\\\\\\\\") "\\"" "\\\\\\"") "\\""))) ",") "}") }]')),
    has=T('(if (= @kd "jsonb") §jb§ (if (= @kd "array") §ar§ §no§))',
          jb=leaf_json('(str/concat "COALESCE(" @q " @> " ' + MARK + ' "::jsonb, FALSE)")', '[{ isNull: false, text: (json/stringify [@v]) }]'),
          ar=leaf_json('(str/concat "COALESCE(" ' + MARK + ' " = ANY(" @q "), FALSE)")', '[' + BIND_OF('@v') + ']'),
          no=leaf_json('"FALSE"')),
    contains=T('(if (= @kd "text") §ok§ §no§)',
               ok=leaf_json('(if (= (object/get @node "caseSensitive" false) true) (str/concat "COALESCE(position(" ' + MARK + ' "::text in " @q ") > 0, FALSE)") (str/concat "COALESCE(position(lower(" ' + MARK + ' "::text) in lower(" @q ")) > 0, FALSE)"))',
                            '[{ isNull: false, text: (object/get @node "text" "") }]'),
               no=leaf_json('"FALSE"')),
    all=T('(let ((ws (array/map (object/get @kids "of" []) (fn x §un§)))) §w§)', un=UNWRAP('@x'),
          w=WRAP('(if (= (array/len @ws) 0) "TRUE" (str/concat "(" (str/join (array/map @ws (fn w1 @w1.sql)) " AND ") ")"))', '(array/flatten (array/map @ws (fn w2 @w2.binds)))')),
    any=T('(let ((ws (array/map (object/get @kids "of" []) (fn x §un§)))) §w§)', un=UNWRAP('@x'),
          w=WRAP('(if (= (array/len @ws) 0) "FALSE" (str/concat "(" (str/join (array/map @ws (fn w1 @w1.sql)) " OR ") ")"))', '(array/flatten (array/map @ws (fn w2 @w2.binds)))')),
    **{'not': T('(let ((w @kids.of)) §w§)',
                w=WRAP('(str/concat "NOT (" @w.sql ")")', '@w.binds'))})

WHERE_OF_PREDS = T(
    '(let ((wr (array/map @entity.preds (fn wp (tree/fold @wp §step§ "RowPredicate"))))) { sqls: (array/map @wr (fn ws @ws.sql)), binds: (array/flatten (array/map @wr (fn wb @wb.binds))) })',
    step=PRED_SQL_STEP)

FIELDS_OF_PREDS = '(array/flatten (array/map @entity.preds (fn pp (let ((fl (tree/fold @pp §f§ "RowPredicate"))) @fl.fields))))'.replace('§f§', PRED_FIELDS)

# ============================== g2c

WAIT_STATE = {
    'discover': 'discovering', 'begin': 'beginning', 'statement': 'running', 'count': 'running',
    'commit': 'committing', 'rollback': 'rolling-back',
}
QUERY_STAGES = list(WAIT_STATE.keys())
LOGIN_STAGES = ['startup', 'password', 'scram-first', 'scram-final']

IS_ERR = '@entity.err.present'
ERR_MSG = '@entity.err.message'
MISMATCH = '(array/includes ["22P02", "22007", "22008", "22003", "42883", "42804"] @entity.err.code)'
WRITE_KINDS = '(array/includes ["created", "updated", "deleted"] (object/get @payload.outcome "kind" ""))'

NOSOCK = '(< @entity.sock 0)'
HASSOCK = '(>= @entity.sock 0)'

FAIL_CLOSE = lambda m: ['(os/close @entity.sock { key: "close" emit: { success: PG_CLOSED, failure: PG_CLOSED } })', SET('sock', '-1'), SET('inbox', EMPTY_BYTES),
                        EMIT('STORE_FAILED', '{ key: @entity.key, message: ' + m + ' }')]
FAIL_KEEP = lambda m: [EMIT('STORE_FAILED', '{ key: @entity.key, message: ' + m + ' }')]
DECLINE = lambda r: [EMIT('STORE_UNSUPPORTED', '{ key: @entity.key, reason: ' + r + ' }')]
SENT = lambda: [EMIT('PG_WIRE_SENT', '{ stage: @entity.stage, sql: @entity.sql, params: @entity.params, frame: @entity.frame }'),
                '(os/send @entity.sock @entity.frame { key: "send" emit: { failure: PG_IO_FAILED } })', RECV]

# ---- frames sent inline (login)
SSL_FRAME = '(bytes/concat [' + u32('8') + ', ' + u32('80877103') + '])'
STARTUP_FRAME = T('(let ((sb (bytes/concat [§v§, (bytes/from-string (str/concat "user" §n§ @entity.userName §n§ "database" §n§ @entity.dbName §n§ "client_encoding" §n§ "UTF8" §n§ §n§))]))) (bytes/concat [(bytes/write-uint (+ (bytes/length @sb) 4) 4 "be"), @sb]))', v=u32('196608'), n=NUL)
SCRAM_FIRST_FRAME = T('(let ((first (bytes/from-string (str/concat "n,,n=" §esc§ ",r=" @entity.nonce)))) §m§)', esc=ESC_USER,
                      m=msg('p', '(bytes/concat [(bytes/from-string (str/concat "SCRAM-SHA-256" ' + NUL + ')), ' + u32('(bytes/length @first)') + ', @first])'))
PASSWORD_FRAME = msg('p', '(if (= @entity.act.code 3) (bytes/from-string (str/concat @entity.secret ' + NUL + ')) (bytes/from-string (str/concat ' + MD5_PASSWORD + ' ' + NUL + ')))')


def send_inline(stage, frame, extra=()):
    return [SET('stage', S(stage)), SET('sql', '""'), SET('params', '[]'), SET('frame', frame)] + list(extra) + SENT()


# ---------------------------------------------------------------- composers
Q_TABLE = quote_ident('@entity.table')
CUR_KIND = '@entity.cur.kind'
HAS_GUARD = NE('(object/get @entity.cur "guard" null)', 'null')
DISCOVERY_SQL = 'SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1'
TEXT_BIND = lambda v: '{ isNull: false, text: ' + v + ' }'

COVERED = T('(let ((ce (object/get @entity.schema @entity.table {}))) (and (> (array/len (object/keys @ce)) 0) (array/every @entity.fields (fn cf (or (array/includes (object/keys @ce) @cf) (array/includes ["createdAt", "updatedAt"] @cf))))))')
KINDS_NOW = '(if @entity.needKinds (object/get @entity.schema @entity.table {}) {})'
KINDS_MAP = '(object/fromEntries (array/map @entity.raw (fn kr [(object/get (array/nth @kr.cells 0) "text" ""), (let ((dt (object/get (array/nth @kr.cells 1) "text" ""))) (if (array/includes ["text", "character varying", "character"] @dt) "text" (if (= @dt "jsonb") "jsonb" (if (= @dt "ARRAY") "array" "other"))))])))'
SCHEMA_UPDATE = '(object/set @entity.schema @entity.table ' + KINDS_MAP + ')'


def send_stmt(stage, sql, binds='[]', base='0'):
    return [SET('stage', S(stage)), SET('sql', sql), SET('binds', binds), SET('bindBase', base), EMIT('PG_FRAME')]


QUERY_COMPOSE = T(
    '(let ((qt §qt§) (qo (object/get @entity.query "order" { field: "createdAt", direction: "asc" })) (ql (object/get @entity.query "limit" null)) (qf (object/get @entity.query "offset" null)) (qw @entity.where)) (let ((oc §oc§)) (let ((ok §ok§) (idk §idk§)) (let ((tie (str/concat "\\"id\\"" (if (= @idk "text") " COLLATE \\"C\\"" "") " ASC")) (wsql (if (= (array/len @qw.sqls) 0) "" (str/concat " WHERE " (str/join @qw.sqls " AND "))))) { sql: (str/concat "SELECT " (if (= @entity.project "ids") "\\"id\\"" "*") (if (= (object/get @entity.query "total" "exact") "none") "" ", (COUNT(*) OVER ())::int AS \\"__total\\"") " FROM " @qt @wsql (if (!= @ok "absent") (str/concat " ORDER BY " §qoc§ (if (= @ok "text") " COLLATE \\"C\\"" "") " " (if (= (object/get @qo "direction" "asc") "desc") "DESC" "ASC") " NULLS LAST, " @tie) (str/concat " ORDER BY " @tie)) (if (!= @ql null) (str/concat " LIMIT " §m§) "") (if (!= @qf null) (str/concat " OFFSET " §m§) "")), binds: (array/concat (array/concat @qw.binds (if (!= @ql null) [{ isNull: false, text: (str/concat @ql) }] [])) (if (!= @qf null) [{ isNull: false, text: (str/concat @qf) }] [])), bindBase: 0, countSql: (str/concat "SELECT COUNT(*)::int AS total FROM " @qt @wsql), countBinds: @qw.binds }))))',
    qt=Q_TABLE, oc=col_for('(object/get @qo "field" "createdAt")', 'qo1'),
    ok=kind_of('@oc'), idk=kind_of('"id"'), qoc=quote_ident('@oc'), m=MARK)

CREATE_COMPOSE = T(
    '(let ((ck (object/keys (object/get @entity.cur "data" {})))) { sql: (str/concat "INSERT INTO " §qt§ " (" (str/join (array/map @ck (fn cx §qc§)) ", ") ") VALUES (" (str/join (array/map @ck (fn cy §m§)) ", ") ") ON CONFLICT (\\"id\\") DO NOTHING RETURNING *"), binds: (array/map @ck (fn cz §bind§)), bindBase: 0, countSql: "", countBinds: [] })',
    qt=Q_TABLE, qc=quote_ident(col_for('@cx', 'cc1')), m=MARK, bind=BIND_OF('(object/get (object/get @entity.cur "data" {}) @cz)'))

UPSERT_COMPOSE = T(
    '(let ((uk (object/keys (object/get @entity.cur "data" {})))) (let ((wcols (array/map @uk (fn ux §ucol§))) (ccol §ccol§) (ucol §ucol2§)) (let ((sets (array/concat (array/map (array/filter @wcols (fn w (and (!= @w "id") (!= @w @ccol)))) (fn w2 (str/concat §qw2§ " = EXCLUDED." §qw2§))) (array/map (array/filter (array/sort (object/keys @entity.kinds)) (fn c (and (!= @c "id") (!= @c @ccol) (not (array/includes @wcols @c))))) (fn c2 (if (and (= @c2 "updated_at") (= @ucol "updated_at")) (str/concat §qc2§ " = now()") (str/concat §qc2§ " = DEFAULT"))))))) { sql: (str/concat "INSERT INTO " §qt§ " (" (str/join (array/map @wcols (fn w3 §qw3§)) ", ") ") VALUES (" (str/join (array/map @uk (fn y §m§)) ", ") ") ON CONFLICT (\\"id\\") DO UPDATE SET " (if (= (array/len @sets) 0) "\\"id\\" = EXCLUDED.\\"id\\"" (str/join @sets ", ")) " RETURNING *, (xmax = 0) AS \\"__inserted\\""), binds: (array/map @uk (fn z §bind§)), bindBase: 0, countSql: "", countBinds: [] })))',
    ucol=col_for('@ux', 'uc1'), ccol=col_for('"createdAt"', 'uc2'), ucol2=col_for('"updatedAt"', 'uc3'),
    qw2=quote_ident('@w2'), qc2=quote_ident('@c2'), qw3=quote_ident('@w3'), qt=Q_TABLE, m=MARK, bind=BIND_OF('(object/get (object/get @entity.cur "data" {}) @z)'))


def modify_compose(kind):
    return T(
        '(let ((we (array/filter (object/keys (object/get @entity.cur "data" {})) (fn wx (!= @wx "id")))) (wg @entity.where)) (let ((sets (array/map @we (fn wy (str/concat §qwy§ " = " §m§))))) { sql: (str/concat "WITH \\"pre\\" AS (SELECT * FROM " §qt§ " WHERE \\"id\\" = $1 FOR UPDATE), \\"post\\" AS (" §head§ " WHERE \\"id\\" = $1" (if (> (array/len @wg.sqls) 0) (str/concat " AND " (array/nth @wg.sqls 0)) "") " RETURNING *) SELECT \'before\' AS \\"__part\\", \\"pre\\".* FROM \\"pre\\" UNION ALL SELECT \'after\' AS \\"__part\\", \\"post\\".* FROM \\"post\\""), binds: (array/concat (array/concat [§idp§] (array/map @we (fn wz §bind§))) @wg.binds), bindBase: 1, countSql: "", countBinds: [] }))',
        qwy=quote_ident(col_for('@wy', 'mc1')), m=MARK, qt=Q_TABLE,
        head=('(str/concat "UPDATE " ' + Q_TABLE + ' " SET " (if (= (array/len @sets) 0) "\\"id\\" = \\"id\\"" (str/join @sets ", ")))' if kind == 'update' else '(str/concat "DELETE FROM " ' + Q_TABLE + ')'),
        idp=TEXT_BIND('(object/get @entity.cur "id" "")'), bind=BIND_OF('(object/get (object/get @entity.cur "data" {}) @wz)'))


def compose_effects(built):
    return [SET('built', built), SET('sql', '@entity.built.sql'), SET('binds', '@entity.built.binds'), SET('bindBase', '@entity.built.bindBase'),
            SET('countSql', '@entity.built.countSql'), SET('countBinds', '@entity.built.countBinds'), SET('stage', '"statement"'), EMIT('PG_FRAME')]

# ============================== g3hub1

blocks = []
SSLMODES = '["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]'
NO_TLS = '(or (= @config.sslmode "disable") (= @config.sslmode "allow"))'

blocks = []
SSLMODES = '["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]'
NO_TLS = '(or (= @config.sslmode "disable") (= @config.sslmode "allow"))'

# ================================================================ running: the dispatcher and the statement wait
R = ['    state running {', '      INIT -> ready', '']
P = R.append
# ---- transport
# ---- frames for statements
P(tr('PG_FRAME', 'running', None, [
    SET('sql', NUMBERED), SET('params', PARAMS_OF('@entity.binds')), SET('frame', QUERY_FRAME),
    SET('err', '{ present: false, code: "", message: "" }'), SET('cols', '[]'), SET('raw', '[]'), SET('rows', '[]'), EMIT('PG_FLUSH')]))
for st, w in WAIT_STATE.items():
    P(tr('PG_FLUSH', w, stg(st), SENT()))

# ---- scram proof
P(tr('PG_PROOF', 'running', None, [SET('proof', scram_proof()), EMIT('PG_PROOFED')]))
P(tr('PG_PROOFED', 'ready', NE('@entity.proof.error', '""'), FAIL_CLOSE('@entity.proof.error')))
P(tr('PG_PROOFED', 'startup', EQ('@entity.proof.error', '""'), [SET('scram', '@entity.proof.sig')] + send_inline('scram-final', '@entity.proof.frame')))

# ---- reading a chunk
P(tr('PG_SCAN', 'running', None, [
    SET('scan', SCAN), SET('cols', '@entity.scan.cols'), SET('raw', '@entity.scan.raw'), SET('err', '@entity.scan.err'),
    SET('inbox', '(bytes/slice @entity.inbox @entity.scan.pos)'),
    SET('act', '(let ((cands (array/filter @entity.scan.auth (fn aa (and (!= @aa.code 0) (!= @aa.code 12)))))) (if (> (array/len @cands) 0) (array/nth @cands 0) { code: 0, body: ' + EMPTY_BYTES + ' }))'),
    SET('badSig', '(array/some @entity.scan.auth (fn ab (and (= @ab.code 12) (!= (bytes/to-string (bytes/slice @ab.body 4)) (str/concat "v=" @entity.scram)))))'),
    EMIT('PG_SCANNED')]))
Q = stg(*QUERY_STAGES)
P(tr('PG_SCANNED', 'running', AND(Q, '@entity.scan.done', stg('statement', 'count')),
     [SET('rows', '(array/map @entity.raw (fn rawrow ' + ROW_OF + '))'), EMIT('PG_PLAN')]))
P(tr('PG_SCANNED', 'running', AND(Q, '@entity.scan.done', NOT(stg('statement', 'count'))), [EMIT('PG_PLAN')]))
for w, sts in [('discovering', ['discover']), ('beginning', ['begin']), ('running', ['statement', 'count']), ('committing', ['commit']), ('rolling-back', ['rollback'])]:
    P(tr('PG_SCANNED', w, AND(stg(*sts), NOT('@entity.scan.done')), [RECV]))
L = stg(*LOGIN_STAGES)
P(tr('PG_SCANNED', 'ready', AND(L, IS_ERR), FAIL_CLOSE(ERR_MSG)))
P(tr('PG_SCANNED', 'ready', AND(L, NOT(IS_ERR), '@entity.badSig'), FAIL_CLOSE('"the SCRAM server signature does not match: the server does not know the password"')))
A = NE('@entity.act.code', '0')
P(tr('PG_SCANNED', 'ready', AND(L, NOT(IS_ERR), NOT('@entity.badSig'), A, OR(EQ('@entity.act.code', '3'), EQ('@entity.act.code', '5'), EQ('@entity.act.code', '11')), EQ('@entity.secret', '""')),
     FAIL_CLOSE('"the server asks for a password and DATABASE_URL has none"')))
OKL = AND(L, NOT(IS_ERR), NOT('@entity.badSig'))
P(tr('PG_SCANNED', 'startup', AND(OKL, OR(EQ('@entity.act.code', '3'), EQ('@entity.act.code', '5'))), send_inline('password', PASSWORD_FRAME)))
P(tr('PG_SCANNED', 'drawing', AND(OKL, EQ('@entity.act.code', '10')), ['(random-bytes 18 { key: "nonce" emit: { success: PG_NONCE_DRAWN, failure: PG_NONCE_FAILED } })']))
P(tr('PG_SCANNED', 'running', AND(OKL, EQ('@entity.act.code', '11')), [SET('stage', '"scram-final"'), EMIT('PG_PROOF')]))
P(tr('PG_SCANNED', 'ready', AND(OKL, A, NE('@entity.act.code', '3'), NE('@entity.act.code', '5'), NE('@entity.act.code', '10'), NE('@entity.act.code', '11')),
     FAIL_CLOSE('(str/concat "unsupported authentication method " @entity.act.code)')))
P(tr('PG_SCANNED', 'running', AND(OKL, NOT(A), '@entity.scan.done'), [SET('stage', '"start"'), EMIT('PG_PLAN')]))
P(tr('PG_SCANNED', 'startup', AND(OKL, NOT(A), NOT('@entity.scan.done')), [RECV]))

# ============================== g2e

START = stg('start')
ROWS_N = '(array/len @entity.rows)'
# ---- start of an ask
P(tr('PG_PLAN', 'running', AND(START, EQ('@entity.op', '"read"')),
     send_stmt('statement', cat(S('SELECT * FROM '), Q_TABLE, S(' WHERE "id" = '), MARK), '[' + TEXT_BIND('@entity.rowId') + ']')))
P(tr('PG_PLAN', 'running', AND(START, EQ('@entity.op', '"list"')), send_stmt('statement', cat(S('SELECT * FROM '), Q_TABLE))))
P(tr('PG_PLAN', 'running', AND(START, EQ('@entity.op', '"query"')), [
    SET('preds', '(array/filter [(object/get @entity.query "policy" null), (object/get @entity.query "filter" null)] (fn pq (!= @pq null)))'),
    SET('extra', '["id", (object/get (object/get @entity.query "order" { field: "createdAt", direction: "asc" }) "field" "createdAt")]'),
    SET('written', '[]'), SET('needKinds', 'true'), EMIT('PG_KINDS')]))
P(tr('PG_PLAN', 'running', AND(START, EQ('@entity.op', '"write"'), EQ('@entity.batch.onFailure', '"atomic"')), send_stmt('begin', S('BEGIN'))))
P(tr('PG_PLAN', 'running', AND(START, EQ('@entity.op', '"write"'), NE('@entity.batch.onFailure', '"atomic"')), [EMIT('PG_OP')]))
# ---- discovery
D = stg('discover')
P(tr('PG_PLAN', 'running', AND(D, NOT(IS_ERR)), [SET('schema', SCHEMA_UPDATE), SET('fresh', 'true'), EMIT('PG_BUILD')]))
P(tr('PG_PLAN', 'running', AND(stg('begin'), NOT(IS_ERR)), [EMIT('PG_OP')]))
# ---- statement replies
ST = stg('statement')
QUERY_OK = AND(ST, EQ('@entity.op', '"query"'), NOT(IS_ERR))
PAGE = SET('page', '(array/map @entity.rows (fn pr (object/omit @pr ["__total"])))')
TOTAL_MODE_NONE = EQ('(object/get @entity.query "total" "exact")', '"none"')
HAS_WINDOW_TOTAL = AND('(> ' + ROWS_N + ' 0)', '(validate/number (object/get (array/nth @entity.rows 0) "__total" null))')
NUM_OF = lambda x: '(let ((nmx ' + x + ')) (if (validate/number @nmx) @nmx 0))'
FIRST_TOTAL = NUM_OF('(object/get (array/nth @entity.rows 0) "__total" null)')
OFFSET0 = '(= (if (= (object/get @entity.query "offset" null) null) 0 (object/get @entity.query "offset" 0)) 0)'
NO_WINDOW_TOTAL = AND(QUERY_OK, NOT(TOTAL_MODE_NONE), NOT(HAS_WINDOW_TOTAL))
LIMIT_NZ = NE('(object/get @entity.query "limit" null)', '0')
P(tr('PG_PLAN', 'running', AND(ST, EQ('@entity.op', '"query"')), [PAGE] + send_stmt('count', '@entity.countSql', '@entity.countBinds')))
P(tr('PG_PLAN', 'running', AND(ST, EQ('@entity.op', '"write"')), [EMIT('PG_OUTCOME')]))
# ---- count
CN = stg('count')
# ---- commit / rollback
RB = stg('rollback')

# ---- kinds
STAMP_ANY = '(array/some @entity.written (fn sw (array/includes ["createdAt", "updatedAt"] @sw)))'
P(tr('PG_KINDS', 'running', None, [
    SET('fields', '(array/unique (array/concat (array/concat ' + FIELDS_OF_PREDS + ' @entity.extra) @entity.written))'),
    SET('covered', COVERED), EMIT('PG_KINDED')]))
WANT_DISCOVER = AND('@entity.needKinds', NOT('@entity.fresh'), NOT('@entity.covered'))
P(tr('PG_KINDED', 'running', WANT_DISCOVER, send_stmt('discover', S(DISCOVERY_SQL), '[' + TEXT_BIND('@entity.table') + ']')))
P(tr('PG_KINDED', 'running', NOT(WANT_DISCOVER), [EMIT('PG_BUILD')]))
P(tr('PG_BUILD', 'running', None, [SET('kinds', KINDS_NOW), SET('where', WHERE_OF_PREDS), EMIT('PG_COMPOSE')]))
P(tr('PG_COMPOSE', 'running', EQ('@entity.op', '"query"'), compose_effects(QUERY_COMPOSE)))
P(tr('PG_COMPOSE', 'running', AND(EQ('@entity.op', '"write"'), EQ(CUR_KIND, '"create"')), compose_effects(CREATE_COMPOSE)))
P(tr('PG_COMPOSE', 'running', AND(EQ('@entity.op', '"write"'), EQ(CUR_KIND, '"upsert"')), compose_effects(UPSERT_COMPOSE)))
P(tr('PG_COMPOSE', 'running', AND(EQ('@entity.op', '"write"'), EQ(CUR_KIND, '"update"')), compose_effects(modify_compose('update'))))
P(tr('PG_COMPOSE', 'running', AND(EQ('@entity.op', '"write"'), EQ(CUR_KIND, '"delete"')), compose_effects(modify_compose('delete'))))

# ---- write ops
OPVIEW_OF = lambda op: '(let ((co ' + op + ')) { kind: (object/get @co "kind" ""), entityType: (object/get @co "entityType" ""), id: (object/get @co "id" ""), data: (object/get @co "data" {}), guard: (object/get @co "guard" null) })'
OP = '(array/nth @entity.batch.ops @entity.opAt)'
P(tr('PG_OP', 'running', None, [SET('cur', OPVIEW_OF(OP)), EMIT('PG_OPPED')]))
ID_OK = '(validate/string (object/get (object/get @entity.cur "data" {}) "id" null))'
NEEDS_ID = AND(OR(EQ(CUR_KIND, '"create"'), EQ(CUR_KIND, '"upsert"')), NOT(ID_OK))
P(tr('PG_OPPED', 'running', NEEDS_ID, [EMIT('PG_RECORD', '{ outcome: { kind: "failed", message: (str/concat ' + CUR_KIND + ' " needs a string id") } }')]))
P(tr('PG_OPPED', 'running', NOT(NEEDS_ID), [
    SET('table', TABLE_OF('@entity.cur.entityType', 'tb')),
    SET('fresh', 'false'),
    SET('preds', '(array/filter [(object/get @entity.cur "guard" null)] (fn og (!= @og null)))'),
    SET('extra', '[]'),
    SET('written', '(if (= ' + CUR_KIND + ' "delete") [] (object/keys (object/get @entity.cur "data" {})))'),
    SET('needKinds', '(if (= ' + CUR_KIND + ' "upsert") true (if (= ' + CUR_KIND + ' "create") ' + STAMP_ANY + ' (or ' + HAS_GUARD + ' ' + STAMP_ANY + ')))'),
    EMIT('PG_KINDS')]))
OUT_OF = lambda body: '{ outcome: ' + body + ' }'
CLEAN = lambda r: '(object/omit ' + r + ' ["__part", "__inserted"])'
GUARD_ERR = AND(IS_ERR, HAS_GUARD, MISMATCH, OR(EQ(CUR_KIND, '"update"'), EQ(CUR_KIND, '"delete"')))
P(tr('PG_OUTCOME', 'running', IS_ERR, [EMIT('PG_RECORD', OUT_OF('{ kind: "failed", message: ' + ERR_MSG + ' }'))]))
P(tr('PG_OUTCOME', 'running', AND(NOT(IS_ERR), EQ(CUR_KIND, '"create"'), EQ(ROWS_N, '0')), [EMIT('PG_RECORD', OUT_OF('{ kind: "duplicate-id" }'))]))
P(tr('PG_OUTCOME', 'running', AND(NOT(IS_ERR), EQ(CUR_KIND, '"create"'), '(> ' + ROWS_N + ' 0)'), [EMIT('PG_RECORD', OUT_OF('{ kind: "created", row: (array/nth @entity.rows 0) }'))]))
CURDATA = '(object/get @entity.cur "data" {})'
P(tr('PG_OUTCOME', 'running', AND(NOT(IS_ERR), EQ(CUR_KIND, '"upsert"'), EQ(ROWS_N, '0')),
     [EMIT('PG_RECORD', OUT_OF('{ kind: "failed", message: (str/concat @entity.cur.entityType " " ' + SCALAR_TEXT('(object/get ' + CURDATA + ' "id" "")') + ' ": the upsert returned no row") }'))]))
LASTROW = '(array/last @entity.rows)'
P(tr('PG_OUTCOME', 'running', AND(NOT(IS_ERR), EQ(CUR_KIND, '"upsert"'), '(> ' + ROWS_N + ' 0)'),
     [EMIT('PG_RECORD', OUT_OF('(if (= (object/get ' + LASTROW + ' "__inserted" false) true) { kind: "created", row: ' + CLEAN(LASTROW) + ' } { kind: "updated", row: ' + CLEAN(LASTROW) + ' })'))]))
BEFORE = '(array/find @entity.rows (fn bq (= (object/get @bq "__part" "") "before")))'
AFTER = '(array/find @entity.rows (fn aq (= (object/get @aq "__part" "") "after")))'
MOD = AND(NOT(IS_ERR), OR(EQ(CUR_KIND, '"update"'), EQ(CUR_KIND, '"delete"')))
P(tr('PG_OUTCOME', 'running', AND(MOD, EQ(BEFORE, 'null')), [EMIT('PG_RECORD', OUT_OF('{ kind: "not-found" }'))]))
P(tr('PG_OUTCOME', 'running', AND(MOD, NE(BEFORE, 'null'), EQ(AFTER, 'null')), [EMIT('PG_RECORD', OUT_OF('{ kind: "refused" }'))]))
P(tr('PG_OUTCOME', 'running', AND(MOD, NE(BEFORE, 'null'), NE(AFTER, 'null')), [
    EMIT('PG_RECORD', OUT_OF(T('(let ((ob §b§) (oa §a§)) (if (= ' + CUR_KIND + ' "delete") (if ' + HAS_GUARD + ' { kind: "deleted", before: ' + CLEAN('@ob') + ' } { kind: "deleted" }) (if ' + HAS_GUARD + ' { kind: "updated", row: ' + CLEAN('@oa') + ', before: ' + CLEAN('@ob') + ' } { kind: "updated", row: ' + CLEAN('@oa') + ' })))', b=BEFORE, a=AFTER)))]))
# ---- record
APPLIED = WRITE_KINDS
MORE = '(< (+ @entity.opAt 1) (array/len @entity.batch.ops))'
ATOMIC = EQ('@entity.batch.onFailure', '"atomic"')
P(tr('PG_RECORD', 'running', AND(APPLIED, MORE), [SET('outcomes', '(array/append @entity.outcomes @payload.outcome)'), SET('opAt', '(+ @entity.opAt 1)'), EMIT('PG_OP')]))
P(tr('PG_RECORD', 'running', AND(NOT(APPLIED), ATOMIC), [SET('outcomes', '(array/append (array/map @entity.outcomes (fn ro { kind: "rolled-back" })) @payload.outcome)')] + send_stmt('rollback', S('ROLLBACK'))))
P(tr('PG_RECORD', 'ready', AND(NOT(APPLIED), NOT(ATOMIC)), [EMIT('ROWS_WRITTEN', '{ key: @entity.key, outcomes: (array/append @entity.outcomes @payload.outcome) }')]))
# ---- halt
# ---- page result

# ============================== g3a

# ---------------------------------------------------------------- parametrised kinds logic
FIELDS_OF = lambda preds: '(array/flatten (array/map ' + preds + ' (fn pp (let ((fl (tree/fold @pp ' + PRED_FIELDS + ' "RowPredicate"))) @fl.fields))))'
ALL_FIELDS = lambda preds, extra, written: '(array/unique (array/concat (array/concat ' + FIELDS_OF(preds) + ' ' + extra + ') ' + written + '))'
COVERED_OF = lambda table, fields: T('(let ((ce (object/get @entity.schema §t§ {}))) (and (> (array/len (object/keys @ce)) 0) (array/every §f§ (fn cf (or (array/includes (object/keys @ce) @cf) (array/includes ["createdAt", "updatedAt"] @cf))))))', t=table, f=fields)
STAMP_ANY_OF = lambda w: '(array/some ' + w + ' (fn sw (array/includes ["createdAt", "updatedAt"] @sw)))'
WANT_OF = lambda need, covered: '(and ' + need + ' (not ' + covered + '))'

# ---- ask-level (payload) views
Q_PREDS = '(array/filter [(object/get @payload.query "policy" null), (object/get @payload.query "filter" null)] (fn pq (!= @pq null)))'
Q_EXTRA = '["id", (object/get (object/get @payload.query "order" { field: "createdAt", direction: "asc" }) "field" "createdAt")]'
Q_TABLE_P = TABLE_OF('@payload.entityType', 'qa')
Q_WANT = WANT_OF('true', COVERED_OF(Q_TABLE_P, ALL_FIELDS(Q_PREDS, Q_EXTRA, '[]')))

OPV0 = '(array/nth @payload.batch.ops 0)'
K0 = '(object/get ' + OPV0 + ' "kind" "")'
OP0_GUARDED = NE('(object/get ' + OPV0 + ' "guard" null)', 'null')
OP0_PREDS = '(array/filter [(object/get ' + OPV0 + ' "guard" null)] (fn og (!= @og null)))'
OP0_WRITTEN = lambda kind: '[]' if kind == 'delete' else '(object/keys (object/get ' + OPV0 + ' "data" {}))'
OP0_TABLE = TABLE_OF('(object/get ' + OPV0 + ' "entityType" "")', 'o0')
OP0_ID_OK = '(validate/string (object/get (object/get ' + OPV0 + ' "data" {}) "id" null))'


def op0_need(kind):
    w = OP0_WRITTEN(kind)
    if kind == 'upsert':
        return 'true'
    if kind == 'create':
        return STAMP_ANY_OF(w)
    if kind == 'update':
        return '(or ' + OP0_GUARDED + ' ' + STAMP_ANY_OF(w) + ')'
    return OP0_GUARDED


def op0_want(kind):
    return WANT_OF(op0_need(kind), COVERED_OF(OP0_TABLE, ALL_FIELDS(OP0_PREDS, '[]', OP0_WRITTEN(kind))))


# ---------------------------------------------------------------- inline statement
FRAME_EFFECTS = [SET('sql', NUMBERED), SET('params', PARAMS_OF('@entity.binds')), SET('frame', QUERY_FRAME),
                 SET('err', '{ present: false, code: "", message: "" }'), SET('cols', '[]'), SET('raw', '[]'), SET('rows', '[]')]


def send_now(stage, sql, binds='[]', base='0'):
    return [SET('stage', S(stage)), SET('sql', sql), SET('binds', binds), SET('bindBase', base)] + FRAME_EFFECTS + SENT()


DISCOVER_NOW = send_now('discover', S(DISCOVERY_SQL), '[' + TEXT_BIND('@entity.table') + ']')

RESET_ASK = [SET('stage', '"start"'), SET('opAt', '0'), SET('outcomes', '[]'), SET('fresh', 'false'), SET('halt', '{ kind: "", message: "" }'),
             SET('rows', '[]'), SET('raw', '[]'), SET('cols', '[]'), SET('err', '{ present: false, code: "", message: "" }'),
             SET('sql', '""'), SET('params', '[]'), SET('binds', '[]'), SET('inbox', EMPTY_BYTES)]
TABLE_SET = SET('table', TABLE_OF('@entity.entityType', 'ta'))

QUERY_PREP = [SET('preds', '(array/filter [(object/get @entity.query "policy" null), (object/get @entity.query "filter" null)] (fn pq (!= @pq null)))'),
              SET('extra', '["id", (object/get (object/get @entity.query "order" { field: "createdAt", direction: "asc" }) "field" "createdAt")]'),
              SET('written', '[]'), SET('needKinds', 'true'), SET('fresh', 'false')]
KINDS_SETS = [SET('fields', ALL_FIELDS('@entity.preds', '@entity.extra', '@entity.written')), SET('covered', COVERED_OF('@entity.table', '@entity.fields'))]
BUILD_SETS = [SET('kinds', KINDS_NOW), SET('where', WHERE_OF_PREDS)]
COMPOSE_SETS = lambda built: [SET('built', built), SET('sql', '@entity.built.sql'), SET('binds', '@entity.built.binds'), SET('bindBase', '@entity.built.bindBase'),
                              SET('countSql', '@entity.built.countSql'), SET('countBinds', '@entity.built.countBinds'), SET('stage', '"statement"')]
OP_PREP = [SET('table', TABLE_OF('@entity.cur.entityType', 'tb')), SET('fresh', 'false'),
           SET('preds', '(array/filter [(object/get @entity.cur "guard" null)] (fn og (!= @og null)))'),
           SET('extra', '[]'),
           SET('written', '(if (= ' + CUR_KIND + ' "delete") [] (object/keys (object/get @entity.cur "data" {})))'),
           SET('needKinds', '(if (= ' + CUR_KIND + ' "upsert") true (if (= ' + CUR_KIND + ' "create") ' + STAMP_ANY_OF('@entity.written') + ' (or ' + HAS_GUARD + ' ' + STAMP_ANY_OF('@entity.written') + ')))')]
COMPOSERS = {'create': CREATE_COMPOSE, 'upsert': UPSERT_COMPOSE, 'update': modify_compose('update'), 'delete': modify_compose('delete')}

# ---------------------------------------------------------------- reply summaries (guards)
def srec(**o):
    d = dict(pos='@sa.pos', done='@sa.done', stop='@sa.stop', err='@sa.err', code='@sa.code', nd='@sa.nd', nb='@sa.nb', na='@sa.na')
    d.update(o)
    return '{ ' + ', '.join(k + ': ' + d[k] for k in ['pos', 'done', 'stop', 'err', 'code', 'nd', 'nb', 'na']) + ' }'


ERR_CODE_OF = '(let ((ep (str/split (bytes/to-string @sb) ' + NUL + '))) (let ((ef (array/find @ep (fn eq (str/startsWith @eq "C"))))) (if (= @ef null) "" (str/slice @ef 1))))'
CELL0_LEN = '(math/default (bytes/read-uint @sb 2 4 "be") 99)'
CELL0 = '(if (< ' + CELL0_LEN + ' 16) (bytes/to-string (bytes/slice @sb 6 (+ 6 ' + CELL0_LEN + '))) "")'
SUMMARY = lambda buf: T(
    '(let ((sbuf §buf§)) (let ((stotal (bytes/length @sbuf))) (array/reduce (array/range 0 (+ 1 (math/floor (/ @stotal 5)))) { pos: 0, done: false, stop: false, err: false, code: "", nd: 0, nb: 0, na: 0 } (fn sa si (if (or @sa.done @sa.stop) @sa (if (< (- @stotal @sa.pos) 5) §stop§ (let ((slen (math/default (bytes/read-uint @sbuf (+ @sa.pos 1) 4 "be") 0))) (if (< (- @stotal @sa.pos) (+ 1 @slen)) §stop§ (let ((sk (bytes/at @sbuf @sa.pos)) (sb (bytes/slice @sbuf (+ @sa.pos 5) (+ @sa.pos 1 @slen))) (sn (+ @sa.pos 1 @slen))) (if (= @sk 68) §d§ (if (= @sk 69) §e§ (if (= @sk 90) §z§ §o§))))))))))))',
    buf=buf, stop=srec(stop='true'),
    d=srec(pos='@sn', nd='(+ @sa.nd 1)', nb='(+ @sa.nb (if (= ' + CELL0 + ' "before") 1 0))', na='(+ @sa.na (if (= ' + CELL0 + ' "after") 1 0))'),
    e=srec(pos='@sn', err='true', code=ERR_CODE_OF), z=srec(pos='@sn', done='true'), o=srec(pos='@sn'))

AFTER_INBOX = '(bytes/concat [@entity.inbox, @payload.data])'


def lrec(**o):
    d = dict(pos='@la.pos', done='@la.done', stop='@la.stop', err='@la.err', act='@la.act', bad='@la.bad')
    d.update(o)
    return '{ ' + ', '.join(k + ': ' + d[k] for k in ['pos', 'done', 'stop', 'err', 'act', 'bad']) + ' }'


LOGIN_SUMMARY = T(
    '(let ((lbuf §buf§)) (let ((ltotal (bytes/length @lbuf))) (array/reduce (array/range 0 (+ 1 (math/floor (/ @ltotal 5)))) { pos: 0, done: false, stop: false, err: false, act: 0, bad: false } (fn la li (if (or @la.done @la.stop) @la (if (< (- @ltotal @la.pos) 5) §stop§ (let ((llen (math/default (bytes/read-uint @lbuf (+ @la.pos 1) 4 "be") 0))) (if (< (- @ltotal @la.pos) (+ 1 @llen)) §stop§ (let ((lk (bytes/at @lbuf @la.pos)) (lb (bytes/slice @lbuf (+ @la.pos 5) (+ @la.pos 1 @llen))) (ln (+ @la.pos 1 @llen))) (if (= @lk 82) §r§ (if (= @lk 69) §e§ (if (= @lk 90) §z§ §o§))))))))))))',
    buf=AFTER_INBOX, stop=lrec(stop='true'),
    r='(let ((lc (math/default (bytes/read-uint @lb 0 4 "be") 0))) ' + lrec(pos='@ln', act='(if (and (= @la.act 0) (!= @lc 0) (!= @lc 12)) @lc @la.act)', bad='(or @la.bad (and (= @lc 12) (!= (bytes/to-string (bytes/slice @lb 4)) (str/concat "v=" @entity.scram))))') + ')',
    e=lrec(pos='@ln', err='true'), z=lrec(pos='@ln', done='true'), o=lrec(pos='@ln'))

# ============================== g3d

# ---------------------------------------------------------------- url + sslmode
DEC = lambda x: '(let ((dt ' + x + ')) (if (str/uri-component-valid @dt) (str/decode-uri-component @dt) @dt))'
URL_REST = '(array/nth (str/split @config.url "://") 1)'
URL_AUTH = '(array/nth (str/split ' + URL_REST + ' "/") 0)'
AT = '(str/slice "a@b" 1 2)'
URL_CRED = '(if (str/includes ' + URL_AUTH + ' ' + AT + ') (array/nth (str/split ' + URL_AUTH + ' ' + AT + ') 0) "")'
URL_USER_RAW = '(array/nth (str/split ' + URL_CRED + ' ":") 0)'
URL_PATH = '(array/nth (str/split (str/join (array/drop (str/split ' + URL_REST + ' "/") 1) "/") "?") 0)'
SCHEME = '(array/nth (str/split @config.url "://") 0)'
URL_OK = AND('(str/includes @config.url "://")', '(array/includes ["postgres", "postgresql"] ' + SCHEME + ')')
SSL_OK = '(array/includes ' + SSLMODES + ' @config.sslmode)'
COLD_OK = AND(NOSOCK, URL_OK, SSL_OK)
COLD_BAD = AND(NOSOCK, NOT(AND(URL_OK, SSL_OK)))
BAD_MSG = '(if (not (str/includes @config.url "://")) "DATABASE_URL is not a URL: relative URL without a base" (if (not ' + URL_OK + ') (str/concat "DATABASE_URL must be postgres:// or postgresql://, not " ' + SCHEME + ' "://") (str/concat "sslmode `" @config.sslmode "` is not one of disable, allow, prefer, require, verify-ca, verify-full")))'
URL_SETS = [SET('userName', '(if (= ' + URL_USER_RAW + ' "") "postgres" ' + DEC(URL_USER_RAW) + ')'),
            SET('secret', '(if (str/includes ' + URL_CRED + ' ":") ' + DEC('(str/join (array/drop (str/split ' + URL_CRED + ' ":") 1) ":")') + ' "")'),
            SET('dbName', '(if (= ' + URL_PATH + ' "") @entity.userName ' + DEC(URL_PATH) + ')')]
CONNECT = '(os/tcp-connect @config.host @config.port { key: "connect" emit: { success: PG_CONNECTED, failure: PG_IO_FAILED } })'

# ---------------------------------------------------------------- scan sets (the V2 PG_SCAN body, no emit)
SCAN_SETS = [
    SET('inbox', AFTER_INBOX),
    SET('scan', SCAN), SET('cols', '@entity.scan.cols'), SET('raw', '@entity.scan.raw'), SET('err', '@entity.scan.err'),
    SET('inbox', '(bytes/slice @entity.inbox @entity.scan.pos)'),
    SET('act', '(let ((cands (array/filter @entity.scan.auth (fn aa (and (!= @aa.code 0) (!= @aa.code 12)))))) (if (> (array/len @cands) 0) (array/nth @cands 0) { code: 0, body: ' + EMPTY_BYTES + ' }))'),
    SET('badSig', '(array/some @entity.scan.auth (fn ab (and (= @ab.code 12) (!= (bytes/to-string (bytes/slice @ab.body 4)) (str/concat "v=" @entity.scram)))))')]
DECODE_ROWS = SET('rows', '(array/map @entity.raw (fn rawrow ' + ROW_OF + '))')

QUERY_COPY = '{ ' + ', '.join(f + ': @payload.query.' + f for f in ['policy', 'filter', 'order', 'offset', 'limit', 'total', 'nearest']) + ' }'
BATCH_COPY = '{ ops: @payload.batch.ops, onFailure: @payload.batch.onFailure }'
# ================================================================ ready
ASK = {
    'read': [SET('key', '@payload.key'), SET('entityType', '@payload.entityType'), SET('rowId', '@payload.id'), SET('op', '"read"')],
    'list': [SET('key', '@payload.key'), SET('entityType', '@payload.entityType'), SET('op', '"list"')],
    'query': [SET('key', '@payload.key'), SET('entityType', '@payload.entityType'), SET('query', QUERY_COPY), SET('project', '@payload.project'), SET('op', '"query"')],
    'write': [SET('key', '@payload.key'), SET('batch', BATCH_COPY), SET('entityType', '""'), SET('op', '"write"')],
}
VERB = {'read': 'ROW_READ', 'list': 'ROW_LIST', 'query': 'ROWS_QUERY', 'write': 'ROWS_WRITE'}


def pre(verb):
    return ASK[verb] + RESET_ASK + ([] if verb == 'write' else [TABLE_SET])


ready = ['    state ready {', '      INIT -> ready', '']
RD = ready.append
RD(tr('PG_CLOSED', 'ready', None, []))
RD(tr('ROW_COLLECTION', 'ready', None, [SET('collections', '(object/set @entity.collections @payload.entityType @payload.collection)')]))
NEARBY = NE('(object/get @payload.query "nearest" null)', 'null')
NEAR_OK = '(object/get @config.queryCapabilities "nearest" false)'
HAS_REKEY = '(array/some @payload.batch.ops (fn ro (= (object/get @ro "kind" "") "rekey")))'
ATOMIC_P = EQ('@payload.batch.onFailure', '"atomic"')
WRITE_OK = AND(NOT(HAS_REKEY), '(> (array/len @payload.batch.ops) 0)', OR(NOT(ATOMIC_P), '@config.writeCapabilities.atomicBatch'), OR(ATOMIC_P, '@config.writeCapabilities.stopRuns'))

# ---- early refusals
RD(tr('ROWS_QUERY', 'ready', AND(NEARBY, NOT(NEAR_OK)), [EMIT('STORE_UNSUPPORTED', '{ key: @payload.key, reason: "nearest is unsupported by this store" }')]))
RD(tr('ROWS_WRITE', 'ready', AND(ATOMIC_P, NOT('@config.writeCapabilities.atomicBatch')), [EMIT('STORE_UNSUPPORTED', '{ key: @payload.key, reason: "this store declares no atomic batches" }')]))
RD(tr('ROWS_WRITE', 'ready', AND(EQ('@payload.batch.onFailure', '"stop"'), NOT('@config.writeCapabilities.stopRuns')), [EMIT('STORE_UNSUPPORTED', '{ key: @payload.key, reason: "this store declares no stop runs" }')]))
RD(tr('ROWS_WRITE', 'ready', HAS_REKEY, [EMIT('STORE_FAILED', '{ key: @payload.key, message: "rekey is unsupported by this store" }')]))
RD(tr('ROWS_WRITE', 'ready', AND(NOT(HAS_REKEY), EQ('(array/len @payload.batch.ops)', '0')), [EMIT('ROWS_WRITTEN', '{ key: @payload.key, outcomes: [] }')]))
QUERY_OK_P = OR(NOT(NEARBY), NEAR_OK)
# ---- cold: refuse a bad url / sslmode, otherwise open the socket
for verb in ['read', 'list', 'query', 'write']:
    ok = {'read': 'true', 'list': 'true', 'query': QUERY_OK_P, 'write': WRITE_OK}[verb]
    RD(tr(VERB[verb], 'ready', AND(ok, COLD_BAD), [EMIT('STORE_FAILED', '{ key: @payload.key, message: ' + BAD_MSG + ' }')]))
    RD(tr(VERB[verb], 'connecting', AND(ok, COLD_OK), pre(verb) + URL_SETS + [CONNECT]))
# ---- warm
WARM = HASSOCK
RD(tr('ROW_READ', 'running', WARM, pre('read') + send_now('statement', cat(S('SELECT * FROM '), Q_TABLE, S(' WHERE "id" = '), MARK), '[' + TEXT_BIND('@entity.rowId') + ']')))
RD(tr('ROW_LIST', 'running', WARM, pre('list') + send_now('statement', cat(S('SELECT * FROM '), Q_TABLE))))
RD(tr('ROWS_QUERY', 'discovering', AND(WARM, QUERY_OK_P, Q_WANT), pre('query') + QUERY_PREP + DISCOVER_NOW))
RD(tr('ROWS_QUERY', 'running', AND(WARM, QUERY_OK_P, NOT(Q_WANT)),
      pre('query') + QUERY_PREP + KINDS_SETS + BUILD_SETS + COMPOSE_SETS(QUERY_COMPOSE) + FRAME_EFFECTS + SENT()))
RD(tr('ROWS_WRITE', 'beginning', AND(WARM, WRITE_OK, ATOMIC_P), pre('write') + send_now('begin', S('BEGIN'))))
OP0_SET = SET('cur', OPVIEW_OF('(array/nth @entity.batch.ops 0)'))
STOP_P = NOT(ATOMIC_P)
for kind in ['create', 'upsert', 'update', 'delete']:
    isk = EQ(K0, S(kind))
    base = AND(WARM, WRITE_OK, STOP_P, isk)
    if kind in ('create', 'upsert'):
        RD(tr('ROWS_WRITE', 'ready', AND(base, NOT(OP0_ID_OK)), pre('write') + [
            EMIT('ROWS_WRITTEN', '{ key: @entity.key, outcomes: [{ kind: "failed", message: ' + S(kind + ' needs a string id') + ' }] }')]))
        base = AND(base, OP0_ID_OK)
    RD(tr('ROWS_WRITE', 'discovering', AND(base, op0_want(kind)), pre('write') + [OP0_SET] + OP_PREP + DISCOVER_NOW))
    RD(tr('ROWS_WRITE', 'running', AND(base, NOT(op0_want(kind))),
          pre('write') + [OP0_SET] + OP_PREP + KINDS_SETS + BUILD_SETS + COMPOSE_SETS(COMPOSERS[kind]) + FRAME_EFFECTS + SENT()))

# ---- results that end an ask in `ready` (PG_FINISH)
ST = stg('statement')
FIN = lambda *conds: AND(*conds)
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"read"'), IS_ERR), FAIL_KEEP(ERR_MSG)))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"read"'), NOT(IS_ERR), EQ('(array/len @entity.rows)', '0')), [EMIT('ROW_FOUND', '{ key: @entity.key }')]))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"read"'), NOT(IS_ERR), '(> (array/len @entity.rows) 0)'), [EMIT('ROW_FOUND', '{ key: @entity.key, row: (array/nth @entity.rows 0) }')]))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"list"'), IS_ERR), FAIL_KEEP(ERR_MSG)))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"list"'), NOT(IS_ERR)), [EMIT('ROWS_LISTED', '{ key: @entity.key, rows: @entity.rows }')]))
RD(tr('PG_FINISH', 'ready', AND(OR(ST, stg('count')), EQ('@entity.op', '"query"'), IS_ERR, MISMATCH), DECLINE('"a compared value does not fit its column type"')))
RD(tr('PG_FINISH', 'ready', AND(OR(ST, stg('count')), EQ('@entity.op', '"query"'), IS_ERR, NOT(MISMATCH)), FAIL_KEEP(ERR_MSG)))
QPAGE_STMT = [SET('page', '(array/map @entity.rows (fn pr (object/omit @pr ["__total"])))')]
Q_TOTAL = '(if (= (object/get @entity.query "total" "exact") "none") (array/len @entity.rows) (if (and (> (array/len @entity.rows) 0) (validate/number (object/get (array/nth @entity.rows 0) "__total" null))) ' + FIRST_TOTAL + ' 0))'
PAGE_OUT = lambda total: [
    EMIT('ROWS_IDS', '{ key: @entity.key, ids: (array/map @entity.page (fn pi ' + SCALAR_TEXT('(object/get @pi "id" "")') + ')), total: ' + total + ' }'),
    ]
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"query"'), NOT(IS_ERR), EQ('@entity.project', '"ids"')),
      QPAGE_STMT + [EMIT('ROWS_IDS', '{ key: @entity.key, ids: (array/map @entity.page (fn pi ' + SCALAR_TEXT('(object/get @pi "id" "")') + ')), total: ' + Q_TOTAL + ' }')]))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"query"'), NOT(IS_ERR), NE('@entity.project', '"ids"')),
      QPAGE_STMT + [EMIT('ROWS_PAGE', '{ key: @entity.key, rows: @entity.page, total: ' + Q_TOTAL + ' }')]))
COUNT_TOTAL = '(if (> (array/len @entity.rows) 0) ' + NUM_OF('(object/get (array/nth @entity.rows 0) "total" null)') + ' 0)'
RD(tr('PG_FINISH', 'ready', AND(stg('count'), EQ('@entity.op', '"query"'), NOT(IS_ERR), EQ('@entity.project', '"ids"')),
      [EMIT('ROWS_IDS', '{ key: @entity.key, ids: (array/map @entity.page (fn pi ' + SCALAR_TEXT('(object/get @pi "id" "")') + ')), total: ' + COUNT_TOTAL + ' }')]))
RD(tr('PG_FINISH', 'ready', AND(stg('count'), EQ('@entity.op', '"query"'), NOT(IS_ERR), NE('@entity.project', '"ids"')),
      [EMIT('ROWS_PAGE', '{ key: @entity.key, rows: @entity.page, total: ' + COUNT_TOTAL + ' }')]))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"write"'), EQ('@entity.halt.kind', '"failed"')), FAIL_KEEP('@entity.halt.message')))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"write"'), EQ('@entity.halt.kind', '"unsupported"')), DECLINE('@entity.halt.message')))
RD(tr('PG_FINISH', 'ready', AND(ST, EQ('@entity.op', '"write"'), EQ('@entity.halt.kind', '""')), [EMIT('ROWS_WRITTEN', '{ key: @entity.key, outcomes: @entity.outcomes }')]))
RD(tr('PG_FINISH', 'ready', AND(stg('commit'), IS_ERR), FAIL_KEEP(ERR_MSG)))
RD(tr('PG_FINISH', 'ready', AND(stg('commit'), NOT(IS_ERR)), [EMIT('ROWS_WRITTEN', '{ key: @entity.key, outcomes: @entity.outcomes }')]))
RD(tr('PG_FINISH', 'ready', AND(stg('rollback'), EQ('@entity.halt.kind', '"failed"')), FAIL_KEEP('@entity.halt.message')))
RD(tr('PG_FINISH', 'ready', AND(stg('rollback'), EQ('@entity.halt.kind', '"unsupported"')), DECLINE('@entity.halt.message')))
RD(tr('PG_FINISH', 'ready', AND(stg('rollback'), EQ('@entity.halt.kind', '""'), IS_ERR), FAIL_KEEP(ERR_MSG)))
RD(tr('PG_FINISH', 'ready', AND(stg('rollback'), EQ('@entity.halt.kind', '""'), NOT(IS_ERR)), [EMIT('ROWS_WRITTEN', '{ key: @entity.key, outcomes: @entity.outcomes }')]))
ready.append('    }')
blocks.append('\n'.join(ready))

# ============================== g3e

# ================================================================ connecting / negotiating
connecting = ['    state connecting {', '      INIT -> ready', '']
connecting.append(tr('PG_CONNECTED', 'startup', NO_TLS, [SET('sock', '@payload.sock')] + send_inline('startup', STARTUP_FRAME)))
connecting.append(tr('PG_CONNECTED', 'negotiating', NOT(NO_TLS), [SET('sock', '@payload.sock')] + send_inline('ssl-request', SSL_FRAME)))
connecting.append(tr('PG_IO_FAILED', 'ready', None, [EMIT('STORE_FAILED', '{ key: @entity.key, message: (str/concat "cannot connect to " @config.host ":" @config.port ": " @payload.error) }')]))
connecting.append('    }')
blocks.append('\n'.join(connecting))

FIRST = '(bytes/at @payload.data 0)'
HEX = '(let ((hb ' + FIRST + ') (hd "0123456789abcdef")) (if (< @hb 16) (str/slice @hd @hb (+ @hb 1)) (str/concat (str/slice @hd (math/floor (/ @hb 16)) (+ (math/floor (/ @hb 16)) 1)) (str/slice @hd (math/mod @hb 16) (+ (math/mod @hb 16) 1)))))'
negotiating = ['    state negotiating {', '      INIT -> ready', '']
negotiating.append(tr('PG_IO_FAILED', 'ready', None, FAIL_CLOSE('@payload.error')))
negotiating.append(tr('PG_RECEIVED', 'ready', '@payload.eof', FAIL_CLOSE('"the server closed the connection answering the TLS request"')))
negotiating.append(tr('PG_RECEIVED', 'startup', AND(NOT('@payload.eof'), EQ(FIRST, '78'), EQ('@config.sslmode', '"prefer"')), send_inline('startup', STARTUP_FRAME)))
negotiating.append(tr('PG_RECEIVED', 'ready', AND(NOT('@payload.eof'), EQ(FIRST, '78'), NE('@config.sslmode', '"prefer"')), FAIL_CLOSE('"the server does not support TLS and sslmode requires it"')))
negotiating.append(tr('PG_RECEIVED', 'ready', AND(NOT('@payload.eof'), EQ(FIRST, '83')),
                      FAIL_CLOSE('"the server answered S to the TLS request and this driver speaks no TLS over os sockets: set sslmode=disable, or have the server answer N"')))
negotiating.append(tr('PG_RECEIVED', 'ready', AND(NOT('@payload.eof'), NE(FIRST, '78'), NE(FIRST, '83')),
                      FAIL_CLOSE('(str/concat "the answer to the TLS request is 0x" ' + HEX + ' ", neither S nor N")')))
negotiating.append('    }')
blocks.append('\n'.join(negotiating))

# ================================================================ startup (login)
LG = lambda cond: '(let ((lsm ' + LOGIN_SUMMARY + ')) ' + cond + ')'
L_ERR = '@lsm.err'
L_BAD = '@lsm.bad'
L_ACT = '@lsm.act'
L_OK = lambda: AND(NOT(L_ERR), NOT(L_BAD))
startup = ['    state startup {', '      INIT -> ready', '']
SU = startup.append
SU(tr('PG_IO_FAILED', 'ready', None, FAIL_CLOSE('@payload.error')))
SU(tr('PG_PROOF_FAILED', 'ready', None, FAIL_CLOSE('@entity.proof.error')))
SU(tr('PG_RECEIVED', 'ready', '@payload.eof', FAIL_CLOSE('"the server closed the connection"')))
NE_EOF = NOT('@payload.eof')
SU(tr('PG_RECEIVED', 'ready', AND(NE_EOF, LG(L_ERR)), SCAN_SETS + FAIL_CLOSE(ERR_MSG)))
SU(tr('PG_RECEIVED', 'ready', AND(NE_EOF, LG(AND(NOT(L_ERR), L_BAD))), FAIL_CLOSE('"the SCRAM server signature does not match: the server does not know the password"')))
SU(tr('PG_RECEIVED', 'ready', AND(NE_EOF, LG(AND(L_OK(), OR(EQ(L_ACT, '3'), EQ(L_ACT, '5'), EQ(L_ACT, '11')))), EQ('@entity.secret', '""')),
      FAIL_CLOSE('"the server asks for a password and DATABASE_URL has none"')))
SU(tr('PG_RECEIVED', 'startup', AND(NE_EOF, LG(AND(L_OK(), OR(EQ(L_ACT, '3'), EQ(L_ACT, '5')))), NE('@entity.secret', '""')),
      SCAN_SETS + send_inline('password', PASSWORD_FRAME)))
SU(tr('PG_RECEIVED', 'drawing', AND(NE_EOF, LG(AND(L_OK(), EQ(L_ACT, '10')))),
      SCAN_SETS + ['(random-bytes 18 { key: "nonce" emit: { success: PG_NONCE_DRAWN, failure: PG_NONCE_FAILED } })']))
SU(tr('PG_RECEIVED', 'startup', AND(NE_EOF, LG(AND(L_OK(), EQ(L_ACT, '11'))), NE('@entity.secret', '""')),
      SCAN_SETS + [SET('stage', '"scram-final"'), SET('proof', scram_proof()), SET('scram', '@entity.proof.sig'), SET('sql', '""'), SET('params', '[]'), SET('frame', '@entity.proof.frame'),
                   '(if (= @entity.proof.error "") (do ' + ' '.join(SENT()) + ') (emit PG_PROOF_FAILED))']))
SU(tr('PG_RECEIVED', 'ready', AND(NE_EOF, LG(AND(L_OK(), NE(L_ACT, '0'), NE(L_ACT, '3'), NE(L_ACT, '5'), NE(L_ACT, '10'), NE(L_ACT, '11')))),
      SCAN_SETS + FAIL_CLOSE('(str/concat "unsupported authentication method " @entity.act.code)')))
SU(tr('PG_RECEIVED', 'running', AND(NE_EOF, LG(AND(L_OK(), EQ(L_ACT, '0'), '@lsm.done'))), SCAN_SETS + [SET('stage', '"start"'), EMIT('PG_PLAN')]))
SU(tr('PG_RECEIVED', 'startup', AND(NE_EOF, LG(AND(L_OK(), EQ(L_ACT, '0'), NOT('@lsm.done')))), SCAN_SETS + [RECV]))
startup.append('    }')
blocks.append('\n'.join(startup))
blocks.append('\n'.join([
    '    state drawing {', '      INIT -> ready', '',
    tr('PG_NONCE_DRAWN', 'startup', None, [SET('nonce', '@payload.value')] + send_inline('scram-first', SCRAM_FIRST_FRAME)),
    tr('PG_NONCE_FAILED', 'ready', None, FAIL_CLOSE('@payload.error') + ['(render-ui @config.statusSlot { type: typography, variant: caption, role: status, content: (str/concat "Postgres login could not start: " @payload.error) })']),
    '    }']))

# ================================================================ discovering / beginning / committing / rolling-back
SMG = lambda cond: '(let ((sm ' + SUMMARY(AFTER_INBOX) + ')) ' + cond + ')'


def reply_state(name, to_hub=True):
    s = ['    state ' + name + ' {', '      INIT -> ready', '']
    A = s.append
    A(tr('PG_IO_FAILED', 'ready', None, FAIL_CLOSE('@payload.error')))
    A(tr('PG_RECEIVED', 'ready', '@payload.eof', FAIL_CLOSE('"the server closed the connection"')))
    A(tr('PG_RECEIVED', name, AND(NE_EOF, SMG(NOT('@sm.done'))), [SET('inbox', AFTER_INBOX), RECV]))
    if to_hub:
        WA = AND(EQ('@entity.op', '"write"'), EQ('@entity.batch.onFailure', '"atomic"'))
        if name == 'discovering':
            A(tr('PG_RECEIVED', 'rolling-back', AND(NE_EOF, SMG(AND('@sm.done', '@sm.err')), WA),
                 SCAN_SETS + [SET('halt', '{ kind: "failed", message: ' + ERR_MSG + ' }')] + send_now('rollback', S('ROLLBACK'))))
        A(tr('PG_RECEIVED', 'ready', AND(NE_EOF, SMG(AND('@sm.done', '@sm.err')), NOT(WA) if name == 'discovering' else 'true'), SCAN_SETS + FAIL_KEEP(ERR_MSG)))
        A(tr('PG_RECEIVED', 'running', AND(NE_EOF, SMG(AND('@sm.done', NOT('@sm.err')))), SCAN_SETS + [EMIT('PG_PLAN')]))
    else:
        A(tr('PG_RECEIVED', 'ready', AND(NE_EOF, SMG('@sm.done')), SCAN_SETS + [EMIT('PG_FINISH')]))
    s.append('    }')
    return '\n'.join(s)


blocks.append(reply_state('discovering'))
blocks.append(reply_state('beginning'))
blocks.append(reply_state('committing', False))
blocks.append(reply_state('rolling-back', False))

# ============================== g3f

# ---- prune the hub: login and chunk scanning now happen in the wait states' own hops
R[:] = [x for x in R if not any(x.lstrip().startswith(e + ' ->') for e in ['PG_SCAN', 'PG_SCANNED', 'PG_PROOF', 'PG_PROOFED'])]

ROWS_N_ = '(array/len @entity.rows)'
INSERTED = lambda r: '(= (object/get ' + r + ' "__inserted" false) true)'
OUTCOME_EXPR = T(
    '(if §err§ { kind: "failed", message: §msg§ } (if (= §k§ "create") (if (= §n§ 0) { kind: "duplicate-id" } { kind: "created", row: (array/nth @entity.rows 0) }) (if (= §k§ "upsert") (if (= §n§ 0) { kind: "failed", message: (str/concat @entity.cur.entityType " " §idt§ ": the upsert returned no row") } (if §ins§ { kind: "created", row: §clast§ } { kind: "updated", row: §clast§ })) (let ((ob §b§) (oa §a§)) (if (= @ob null) { kind: "not-found" } (if (= @oa null) { kind: "refused" } (if (= §k§ "delete") (if §g§ { kind: "deleted", before: §cb§ } { kind: "deleted" }) (if §g§ { kind: "updated", row: §coa§, before: §cb§ } { kind: "updated", row: §coa§ }))))))))',
    err=IS_ERR, msg=ERR_MSG, k=CUR_KIND, n=ROWS_N_, idt=SCALAR_TEXT('(object/get (object/get @entity.cur "data" {}) "id" "")'),
    ins=INSERTED('(array/last @entity.rows)'), clast=CLEAN('(array/last @entity.rows)'),
    b=BEFORE, a=AFTER, g=HAS_GUARD, cb=CLEAN('@ob'), coa=CLEAN('@oa'))
HALT_COND = AND(IS_ERR, HAS_GUARD, MISMATCH, OR(EQ(CUR_KIND, '"update"'), EQ(CUR_KIND, '"delete"')))
WRITE_RECORD = [SET('halt', '(if ' + HALT_COND + ' { kind: "unsupported", message: "a guard value does not fit its column type" } { kind: "", message: "" })'),
                SET('lastOutcome', OUTCOME_EXPR)]

# ================================================================ running: reply hops and the statement wait
OPQ = lambda o: EQ('@entity.op', S(o))
STMT = stg('statement')
SMR = lambda cond: '(let ((sm ' + SUMMARY(AFTER_INBOX) + ')) ' + cond + ')'
APPLIED_S = '(and (not @sm.err) (if (or (= ' + CUR_KIND + ' "create") (= ' + CUR_KIND + ' "upsert")) (>= @sm.nd 1) (and (>= @sm.nb 1) (>= @sm.na 1))))'
MORE_S = '(< (+ @entity.opAt 1) (array/len @entity.batch.ops))'
ATOM = EQ('@entity.batch.onFailure', '"atomic"')
TOT_NONE = EQ('(object/get @entity.query "total" "exact")', '"none"')
OFF0 = '(= (if (= (object/get @entity.query "offset" null) null) 0 (object/get @entity.query "offset" 0)) 0)'
LIM_NZ = NE('(object/get @entity.query "limit" null)', '0')
QUERY_FIN = '(or @sm.err ' + TOT_NONE + ' (> @sm.nd 0) (and ' + OFF0 + ' ' + LIM_NZ + '))'
FINISH_C = '(or ' + stg('count') + ' (and ' + STMT + ' (or ' + OPQ('read') + ' ' + OPQ('list') + ' (and ' + OPQ('query') + ' ' + QUERY_FIN + ') (and ' + OPQ('write') + ' (not ' + ATOM + ') (or (not ' + APPLIED_S + ') (not ' + MORE_S + '))))))'
COMMIT_C = AND(STMT, OPQ('write'), ATOM, APPLIED_S, NOT(MORE_S))
ROLLBACK_C = AND(STMT, OPQ('write'), ATOM, NOT(APPLIED_S))
CONT_C = AND(STMT, OR(AND(OPQ('query'), NOT(QUERY_FIN)), AND(OPQ('write'), APPLIED_S, MORE_S)))
RECORD_APPEND = SET('outcomes', '(if (= @entity.halt.kind "") (array/append @entity.outcomes @entity.lastOutcome) @entity.outcomes)')
ROLLED_PRIOR = SET('outcomes', '(array/append (array/map @entity.outcomes (fn ro { kind: "rolled-back" })) @entity.lastOutcome)')
FINISH_PLAIN = '(or ' + stg('count') + ' (and ' + STMT + ' (or ' + OPQ('read') + ' ' + OPQ('list') + ' (and ' + OPQ('query') + ' ' + QUERY_FIN + '))))'
FINISH_WRITE = AND(STMT, OPQ('write'), NOT(ATOM), '(or (not ' + APPLIED_S + ') (not ' + MORE_S + '))')
DONE = lambda c: SMR(AND('@sm.done', c))

P(tr('PG_IO_FAILED', 'ready', None, FAIL_CLOSE('@payload.error')))
P(tr('PG_RECEIVED', 'ready', '@payload.eof', FAIL_CLOSE('"the server closed the connection"')))
P(tr('PG_RECEIVED', 'running', AND(NE_EOF, SMR(NOT('@sm.done'))), [SET('inbox', AFTER_INBOX), RECV]))
P(tr('PG_RECEIVED', 'ready', AND(NE_EOF, DONE(FINISH_PLAIN)), SCAN_SETS + [DECODE_ROWS, EMIT('PG_FINISH')]))
P(tr('PG_RECEIVED', 'ready', AND(NE_EOF, DONE(FINISH_WRITE)), SCAN_SETS + [DECODE_ROWS] + WRITE_RECORD + [RECORD_APPEND, EMIT('PG_FINISH')]))
P(tr('PG_RECEIVED', 'committing', AND(NE_EOF, DONE(COMMIT_C)), SCAN_SETS + [DECODE_ROWS] + WRITE_RECORD + [RECORD_APPEND] + send_now('commit', S('COMMIT'))))
P(tr('PG_RECEIVED', 'rolling-back', AND(NE_EOF, DONE(ROLLBACK_C)), SCAN_SETS + [DECODE_ROWS] + WRITE_RECORD + [ROLLED_PRIOR] + send_now('rollback', S('ROLLBACK'))))
P(tr('PG_RECEIVED', 'running', AND(NE_EOF, DONE(CONT_C)), SCAN_SETS + [DECODE_ROWS, EMIT('PG_PLAN')]))
R.append('    }')
blocks.append('\n'.join(R))

# ============================== g3g

DESCRIPTION = (
    "std-row-store-postgres — a row-store driver over a held Postgres v3 session, in .lolo over os/tcp-connect, os/send, "
    "os/recv and os/close, bytes/*, str/*, hash/* and bit/* (no postgres effect, no new operator): the native twin of "
    "runtime/src/stores/pg_rows.rs. It answers the row-store typed verbs (ROW_READ, ROW_LIST, ROWS_QUERY, ROWS_WRITE) with "
    "the exact SQL of spec/store/row-store-postgres.lolo: one table per entity (snake_case, pluralised, or the declared "
    "collection), stamps in created_at and updated_at, parameterised two-valued-logic predicates pushed down, an exact total "
    "from a window count, atomic batches in BEGIN and COMMIT, stop batches and the atomic take in one statement, and column "
    "kinds discovered from information_schema. The wire is spoken here: an SSLRequest unless sslmode is disable or allow (an S "
    "answer is STORE_FAILED because os sockets carry no TLS), the startup message, cleartext, md5 and SCRAM-SHA-256 login (HMAC "
    "built from hash/sha256 over bytes), then every statement is one Parse, Bind, Describe, Execute and Sync send read until "
    "ReadyForQuery. One session is held; a transport failure closes it and the next ask reconnects. Every send emits "
    "PG_WIRE_SENT with the stage, the SQL, the binds and the exact frame, the diagnostic the replay goldens assert. One "
    "request is in flight per frame: the store seam asks the driver in a frame keyed by the ask (EXEC-STORE-4), and orb "
    "validate refuses a trait outside the driver that emits a row verb (ORB_STORE_VERB_OUTSIDE_SEAM)."
)

LOCAL_TYPES = '''  type PgNullParam = { kind : "null" }
  type PgTextParam = { kind : "text", text : string! }
  type PgParam = PgNullParam | PgTextParam
  type PgBind = { isNull : boolean!, text : string! }
  type ColumnKinds = Map string string
  type SchemaCache = Map string ColumnKinds
  type PgCol = { name : string!, oid : number! }
  type PgRaw = { cells : [PgBind]! }
  type PgErr = { present : boolean!, code : string!, message : string! }
  type PgAuth = { code : number!, body : bytes! }
  type PgScan = { pos : number!, cols : [PgCol]!, raw : [PgRaw]!, err : PgErr!, auth : [PgAuth]!, done : boolean!, stop : boolean! }
  type PgProof = { frame : bytes!, sig : string!, error : string! }
  type PgWrapped = { sql : string!, binds : [PgBind]! }
  type PgWhere = { sqls : [string]!, binds : [PgBind]! }
  type PgBuilt = { sql : string!, binds : [PgBind]!, bindBase : number!, countSql : string!, countBinds : [PgBind]! }
  type PgHalt = { kind : string!, message : string! }
  type OpView = { kind : string!, entityType : string!, id : string, data : Row, guard : RowPredicate? }
  type NumBox = { value : number! }
  type FieldList = { fields : [string]! }
'''

ENTITY = '''  entity RowStoreFlight [runtime] {
    id : string!
    key : string @description "The kernel's key for the ask in flight; every reply carries it" = ""
    entityType : string @description "The entity type a read, list or query asks about" = ""
    op : string @description "The ask in flight: read, list, query or write" = ""
    rowId : string @description "The id a read asks for" = ""
    table : string @description "The table the statement in flight targets" = ""
    project : string @description "What a query answers: rows or ids" = ""
    query : RowQuery @description "The query a query ask carries" = {}
    batch : RowWriteBatch @description "The batch a write ask carries" = { ops: [], onFailure: "stop" }
    opAt : number @description "The index of the batch op in flight" = 0
    outcomes : [RowWriteOutcome] @description "The outcomes of the ops that ran" = []
    sql : string @description "The SQL of the statement in flight" = ""
    params : [PgParam] @description "The binds of the statement in flight, as the diagnostic emits them" = []
    binds : [PgBind] @description "The binds of the statement in flight" = []
    userName : string @description "The login role read from the connection URL" = ""
    secret : string @description "The login password read from the connection URL; empty when it has none" = ""
    dbName : string @description "The database read from the connection URL" = ""
    sock : number @description "The held session's socket; below zero while no session is open" = -1
    inbox : bytes @description "Bytes received and not yet consumed as whole messages" = ""
    nonce : string @description "The SCRAM client nonce" = ""
    scram : string @description "The server signature the SCRAM server-final must carry" = ""
    schema : SchemaCache @description "Column kinds per table, read from information_schema" = {}
    collections : Map string string @description "Declared collection per entity type" = {}
    stage : string @description "What the statement in flight is for: ssl-request, startup, password, scram-first, scram-final, discover, begin, statement, count, commit or rollback" = ""
    bindBase : number @description "How many binds the SQL text already numbers itself" = 0
    frame : bytes @description "The exact bytes of the send in flight" = ""
    cols : [PgCol] @description "The result columns of the reply being read" = []
    raw : [PgRaw] @description "The data rows of the reply being read, cells undecoded" = []
    rows : [Row] @description "The decoded data rows of the finished reply" = []
    err : PgErr @description "The server error of the reply being read" = { present: false, code: "", message: "" }
    scan : PgScan @description "The result of reading one chunk" = { pos: 0, cols: [], raw: [], err: { present: false, code: "", message: "" }, auth: [], done: false, stop: false }
    act : PgAuth @description "The authentication request this chunk asks the driver to answer; code 0 when there is none" = { code: 0, body: "" }
    badSig : boolean @description "The server-final signature did not match" = false
    proof : PgProof @description "The SCRAM client-final frame and the signature expected back" = { frame: "", sig: "", error: "" }
    preds : [RowPredicate] @description "The predicates the statement in flight compiles" = []
    extra : [string] @description "Fields the statement reads besides its predicates" = []
    written : [string] @description "Fields the write in flight sets" = []
    needKinds : boolean @description "Whether the statement needs column kinds" = false
    fresh : boolean @description "Column kinds were read for the op in flight" = false
    covered : boolean @description "The cached column kinds know every field the statement names" = false
    fields : [string] @description "Every field the statement names" = []
    kinds : ColumnKinds @description "The column kinds the statement is built with" = {}
    where : PgWhere @description "The compiled predicates" = { sqls: [], binds: [] }
    built : PgBuilt @description "The statement composed for the op in flight" = { sql: "", binds: [], bindBase: 0, countSql: "", countBinds: [] }
    cur : OpView @description "The batch op in flight" = { kind: "", entityType: "" }
    halt : PgHalt @description "Why an atomic batch is rolling back without an outcome; empty kind when it is not" = { kind: "", message: "" }
    page : [Row] @description "The rows of a query page held while the total is counted" = []
    lastOutcome : RowWriteOutcome @description "The outcome of the batch op whose reply was just read" = { kind: "not-found" }
    countSql : string @description "The count statement of the query in flight" = ""
    countBinds : [PgBind] @description "The binds of the count statement" = []
  }
'''

CONFIG = '''    config {
      host : string = "postgres.example.test"
        @label "Host"
        @description "The server address os/tcp-connect opens; a literal knob because the net grant is checked against it."
        @tier "infra"
      port : number = 5432
        @label "Port"
        @description "The server port os/tcp-connect opens; a literal knob because the net grant is checked against it."
        @tier "infra"
      url : string = "postgres://app:secret@postgres.example.test:5432/app"
        @label "Connection URL"
        @description "postgres://user:password@host:port/database, the DATABASE_URL form: the user, the password (percent-decoded; none means a server that asks for one is STORE_FAILED) and the database come from it. host and port below open the socket and must name the same server, because the net grant is checked against literals."
        @tier "infra"
      sslmode : string!
        @label "SSL mode"
        @description "Required: disable, allow, prefer, require, verify-ca or verify-full, declared by every call site (no default, so nothing downgrades silently). disable and allow send no SSLRequest; the rest send one, and N is accepted under prefer only. An S answer is STORE_FAILED until the kernel's os/tls-upgrade lands (EXEC-HTTP-7)."
        @tier "infra"
      statusSlot : slot = system
        @label "Status slot"
        @description "Where the driver reports a login that could not start; a page running it in the background keeps it in `system`."
        @synonyms "status area, slot"
        @tier "presentation"
      recvBytes : number = 16384
        @label "Read size"
        @description "The most bytes one os/recv takes."
        @tier "infra"
      queryCapabilities : QueryCapabilities = { leaves: ["compare", "member", "hasElement", "contains", "isNull"], combinators: ["all", "any", "not"], compareOps: ["==", "!=", "<", "<=", ">", ">="], orderableFields: { kind: "every-field" }, window: true, exactTotal: true, idsOnly: true }
        @description "What query the store pushes down: every leaf and combinator, any orderable field, a window, an exact total and an ids-only projection; nearest is not pushed down."
        @tier "infra"
      writeCapabilities : WriteCapabilities = { guards: { leaves: ["compare", "member", "hasElement", "contains", "isNull"], combinators: ["all", "any", "not"], compareOps: ["==", "!=", "<", "<=", ">", ">="] }, conditional: true, returnsRow: true, stopRuns: true, atomicBatch: true }
        @description "What write the store honours: every guard form, the row before an update or delete, stop runs and atomic batches."
        @tier "infra"
    }
'''

EMITS = '''    emits {
      ROW_FOUND -> external {
        key : string!
        row : Row?
      }
        @tier "internal"
      ROWS_LISTED -> external {
        key : string!
        rows : [Row]!
      }
        @tier "internal"
      ROWS_PAGE -> external {
        key : string!
        rows : [Row]!
        total : number!
      }
        @tier "internal"
      ROWS_IDS -> external {
        key : string!
        ids : [string]!
        total : number!
      }
        @tier "internal"
      ROWS_WRITTEN -> external {
        key : string!
        outcomes : [RowWriteOutcome]!
      }
        @tier "internal"
      STORE_UNSUPPORTED -> external {
        key : string!
        reason : string!
      }
        @tier "internal"
      STORE_FAILED -> external {
        key : string!
        message : string!
      }
        @tier "internal"
      PG_WIRE_SENT -> external {
        stage : string!
        sql : string!
        params : [PgParam]!
        frame : bytes!
      }
        @tier "internal"
'''
INTERNAL = {
    'PG_CONNECTED': 'sock : number!', 'PG_IO_FAILED': 'error : string!', 'PG_NONCE_FAILED': 'error : string!',
    'PG_RECEIVED': 'data : bytes!\n        eof : boolean!', 'PG_NONCE_DRAWN': 'value : string!',
    'PG_RECORD': 'outcome : RowWriteOutcome!', 'PG_HALT': 'kind : string!\n        message : string!', 'PG_PAGED': 'total : number!',
}
import re as _re
_all = '\n'.join(blocks)
_used = set(_re.findall(r'\(emit (PG_[A-Z_]+)', _all)) | set(_re.findall(r'(?:success|failure): (PG_[A-Z_]+)', _all))
_used.discard('PG_WIRE_SENT')
for name in sorted(_used):
    fields = INTERNAL.get(name, '')
    body = ('\n        ' + fields + '\n      ') if fields else ' '
    EMITS += '      ' + name + ' -> internal {' + body + '}\n        @tier "internal"\n'
EMITS += '    }\n'

LISTENS = '''    listens {
      ROW_READ -> input {
        key : string!
        entityType : string!
        id : string!
      }
        @description "Read one row of an entity type by id."
        @tier "internal"
      ROW_LIST -> input {
        key : string!
        entityType : string!
      }
        @description "List every row of an entity type."
        @tier "internal"
      ROWS_QUERY -> input {
        key : string!
        entityType : string!
        query : RowQuery!
        project : "rows" | "ids"
      }
        @description "A query ask, pushed down as one parameterised SELECT."
        @tier "internal"
      ROWS_WRITE -> input {
        key : string!
        batch : RowWriteBatch!
      }
        @description "Apply a batch of create, upsert, update and delete ops, atomic in BEGIN and COMMIT or stop at the first op that is not applied."
        @tier "internal"
      ROW_COLLECTION -> input {
        entityType : string!
        collection : string!
      }
        @description "Declare the table an entity type's rows live in, as written; an undeclared entity type uses its snake_case plural."
        @tier "internal"
    }
'''

header = 'app std-row-store-postgres [\n  version: "1.0.0",\n  net: { "postgres.example.test:5432": [tcp] },\n  description: ' + S(DESCRIPTION) + '\n]\nuses Spec from "almadar-std/row-store-postgres"\n\n'
body = ('orbital RowStorePostgresOrbital {\n' + types_block + LOCAL_TYPES + '\n' + ENTITY + '\n'
        '  trait RowStoreDriver -> RowStoreFlight [optimistic] {\n    initial: ready\n\n' + CONFIG + '\n'
        + '\n\n'.join(blocks) + '\n\n' + EMITS + '\n' + LISTENS + '  }\n\n  page "/row-store-postgres" -> RowStoreDriver\n}\n')
text = header + body
bad = []
for i, l in enumerate(text.split('\n'), 1):
    st = l.strip()
    if st.startswith('('):
        try:
            d = paren_check(st)
        except Exception:
            d = -99
        if d != 0:
            bad.append((i, d, st[:110]))
for b in bad:
    print('UNBALANCED', b)
open(OUT, 'w').write(text)
print(len(text), 'bytes written')

FIX_OUT = os.path.join(HERE, '..', 'row-store-postgres.fixture.lolo')
fixture = ('app row-store-postgres-fixture [\n  version: "1.0.0",\n  net: { "postgres.example.test:5432": [tcp] },\n'
           '  description: "Replay fixture for std-row-store-postgres: composes the driver with sslmode prefer, the mode the twin goldens were recorded under. sslmode is a required knob, so the atom alone has no value for it."\n]\n'
           ';; Generated by spec/store/row-store-postgres.gen/gen_atom.py; regenerate, never hand-edit.\n\n'
           'orbital RowStorePostgresFixtureOrbital {\n  uses Pg from "std/behaviors/std-row-store-postgres"\n\n' + types_block + LOCAL_TYPES + '\n' + ENTITY + '\n'
           '  trait RowStoreDriver = Pg.traits.RowStoreDriver -> RowStoreFlight {\n    config {\n      sslmode: "prefer"\n    }\n  }\n\n'
           '  page "/row-store-postgres" -> RowStoreDriver\n}\n')
open(FIX_OUT, 'w').write(fixture)
print(len(fixture), 'fixture bytes written')
