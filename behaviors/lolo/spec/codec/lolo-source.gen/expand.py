import re, sys
from lolo_macros import F, FE, case, u, S, fill, strlit, numlit, entname

MACROS = ("STR", "NUM", "ENT", "FILLE", "FILLV", "FILL", "CASE", "RECL", "REC", "LOOKUP", "RESOLVE", "FILLV")

def resolve(T, BASE):
    """Fill each deferred token of T, whose relative path the fold wrote, from the trait's base path BASE: a type
    (rel) from the checker's types, and a record or enum token from the checker's expected models."""
    a = u("rs")
    MO = '"\\ue000"'
    SPLIT = '"\\ue0ff"'
    lk_types = '(default (array/nth (default (array/find (object/entries @entity.types) (fn %(a)se (= (array/nth @%(a)se 0) @%(a)sabs))) ["" ""]) 1) "")' % dict(a=a)
    lk_expected = '(default (array/nth (default (array/find (object/entries @entity.expected) (fn %(a)sx (= (array/nth @%(a)sx 0) @%(a)sabs))) ["" ""]) 1) "")' % dict(a=a)
    lk_names = '(default (array/nth (default (array/find (object/entries @config.typeNames) (fn %(a)sn (= (array/nth @%(a)sn 0) @%(a)sty))) ["" ""]) 1) "")' % dict(a=a)
    def part(template, pairs, k):
        return '(default (array/nth (str/split %s %s) %d) "")' % (F(template, pairs), SPLIT, k)
    fname = lambda key: '(default (object/get @config.fieldNames %s null) %s)' % (key, case(key, "@config.fieldCase"))
    arm = '(default (array/nth (str/split @%(a)sex ".") 1) @%(a)sex)' % dict(a=a)
    union = '(default (array/first (str/split @%(a)sex ".")) "")' % dict(a=a)
    dotted = '(str/includes @%(a)sex ".")' % dict(a=a)
    rec_open = part("@config.recordForm", [("type", arm), ("fields", SPLIT)], 0)
    rec_close = part("@config.recordForm", [("type", arm), ("fields", SPLIT)], 1)
    arm_case = case(arm, "@config.unionArmCase")
    arm_open = part("@config.unionArmForm", [("union", union), ("arm", arm_case), ("inner", SPLIT)], 0)
    arm_close = part("@config.unionArmForm", [("union", union), ("arm", arm_case), ("inner", SPLIT)], 1)
    key = '(default (array/first (str/split @%(a)safterc "\\ue004")) "")' % dict(a=a)
    key_tail = '(str/join (array/drop (str/split @%(a)safterc "\\ue004") 1) "\\ue004")' % dict(a=a)
    field_open = part("@config.recordField", [("name", fname(key)), ("value", SPLIT)], 0)
    field_close = part("@config.recordField", [("name", '""'), ("value", SPLIT)], 1)
    pair_open = part("@config.mapPair", [("key", strlit(key)), ("value", SPLIT)], 0)
    pair_close = part("@config.mapPair", [("key", '""'), ("value", SPLIT)], 1)
    raw = '(default (array/first (str/split @%(a)safterc "\\ue009")) "")' % dict(a=a)
    after_raw = '(str/join (array/drop (str/split @%(a)safterc "\\ue009") 1) "\\ue009")' % dict(a=a)
    lit = '(default (array/first (str/split %s "\\ue00a")) "")' % after_raw
    lit_tail = '(str/join (array/drop (str/split %s "\\ue00a") 1) "\\ue00a")' % after_raw
    enum_name = '(str/slice @%(a)sex 5 (str/len @%(a)sex))' % dict(a=a)
    enum_text = F("@config.enumForm", [("enum", enum_name), ("member", case(raw, "@config.enumMemberCase"))])
    whole = '(default (array/first (str/split @%(a)safterc "\\ue00c")) "")' % dict(a=a)
    whole_tail = '(str/join (array/drop (str/split @%(a)safterc "\\ue00c") 1) "\\ue00c")' % dict(a=a)
    m = u("rm")
    whole_fields = ('(str/join (array/map (default (object/get @entity.models @%(a)sex null) []) (fn %(m)s %(f)s)) @config.recordSep)'
                    % dict(a=a, m=m, f=F("@config.recordField", [("name", fname("@" + m)), ("value", '(str/concat %s %s)' % (whole, F("@config.attrAccess", [("name", fname("@" + m))])))])))
    whole_text = F("@config.recordForm", [("type", "@%sex" % a), ("fields", whole_fields)])
    is_record = '(and (!= @config.recordForm "") (!= @%(a)sex "") (not (str/startsWith @%(a)sex "enum:")))' % dict(a=a)
    is_enum = '(and (!= @config.enumForm "") (str/startsWith @%(a)sex "enum:"))' % dict(a=a)
    is_model = '(and (!= @config.recordForm "") (!= @%(a)sex "") (not (str/startsWith @%(a)sex "enum:")) (not (str/includes @%(a)sex ".")) (object/has @entity.models @%(a)sex))' % dict(a=a)
    body = (
        '(if (= @%(a)sc "\\ue001") (str/concat (if (= @%(a)sty "") @config.typeUnknown (if (!= @%(a)smapped "") @%(a)smapped @%(a)sty)) @%(a)safterc) '
        '(if (= @%(a)sc "\\ue002") (str/concat (if %(isrec)s (str/concat (if %(dotted)s %(arm_open)s "") %(rec_open)s) @config.mapOpen) @%(a)safterc) '
        '(if (= @%(a)sc "\\ue003") (str/concat (if %(isrec)s %(field_open)s %(pair_open)s) %(key_tail)s) '
        '(if (= @%(a)sc "\\ue005") (str/concat (if %(isrec)s %(field_close)s %(pair_close)s) @%(a)safterc) '
        '(if (= @%(a)sc "\\ue006") (str/concat (if %(isrec)s @config.recordSep @config.mapSep) @%(a)safterc) '
        '(if (= @%(a)sc "\\ue007") (str/concat (if %(isrec)s (str/concat %(rec_close)s (if %(dotted)s %(arm_close)s "")) @config.mapClose) @%(a)safterc) '
        '(if (= @%(a)sc "\\ue008") (str/concat (if %(isenum)s %(enum_text)s %(lit)s) %(lit_tail)s) '
        '(if (= @%(a)sc "\\ue00b") (str/concat (if %(ismodel)s %(whole_text)s %(whole)s) %(whole_tail)s) '
        '(str/concat "\\ue000" @%(a)sq)))))))))'
    ) % dict(a=a, isrec=is_record, dotted=dotted, arm_open=arm_open, rec_open=rec_open, field_open=field_open, pair_open=pair_open,
             key_tail=key_tail, field_close=field_close, pair_close=pair_close, rec_close=rec_close, arm_close=arm_close,
             isenum=is_enum, enum_text=enum_text, lit=lit, lit_tail=lit_tail, ismodel=is_model, whole_text=whole_text, whole=whole,
             whole_tail=whole_tail)
    return ('(let ((%(a)sp (str/split %(T)s %(MO)s))) (str/concat (default (array/first @%(a)sp) "") (str/join (array/map (array/drop @%(a)sp 1) (fn %(a)sq '
            '(let ((%(a)srest (str/replace-pattern @%(a)sq "^[^\\ue001-\\ue00c]*" ""))) '
            '(let ((%(a)srel (str/slice @%(a)sq 0 (- (str/len @%(a)sq) (str/len @%(a)srest)))) (%(a)sc (str/slice @%(a)srest 0 1)) (%(a)safterc (str/slice @%(a)srest 1 (str/len @%(a)srest)))) '
            '(let ((%(a)slead (default (array/first (str/split (str/slice @%(a)srel 1 (str/len @%(a)srel)) "]")) "")) (%(a)safter (str/join (array/drop (str/split @%(a)srel "]") 1) "]"))) '
            '(let ((%(a)sabs (str/concat %(BASE)s (if (= @%(a)slead "1") ".guard" (str/concat ".effects[" (- (default (str/to-int @%(a)slead) 2) 2) "]")) @%(a)safter))) '
            '(let ((%(a)sty %(lk_types)s) (%(a)sex %(lk_expected)s)) (let ((%(a)smapped %(lk_names)s)) '
            '%(body)s)))))))) "")))'
            % dict(a=a, T=T, BASE=BASE, MO=MO, lk_types=lk_types, lk_expected=lk_expected, lk_names=lk_names, body=body))

def find_close(text, i):
    """text[i] is '{'; return index of matching '}' skipping strings"""
    depth = 0
    j = i
    n = len(text)
    while j < n:
        c = text[j]
        if c == '"':
            j += 1
            while text[j] != '"':
                if text[j] == '\\': j += 1
                j += 1
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return j
        j += 1
    raise ValueError("unbalanced")

def split_top(body):
    parts, cur, depth, i, n = [], [], 0, 0, len(body)
    while i < n:
        c = body[i]
        if c == '"':
            k = i + 1
            while body[k] != '"':
                if body[k] == '\\': k += 1
                k += 1
            cur.append(body[i:k+1]); i = k + 1; continue
        if c in '({[': depth += 1
        elif c in ')}]': depth -= 1
        if depth == 0 and body.startswith('##', i):
            parts.append(''.join(cur)); cur = []; i += 2; continue
        cur.append(c); i += 1
    parts.append(''.join(cur))
    return [p.strip() for p in parts]

REC_FIELDS = ["expr", "stmt", "params", "body", "items", "keys", "stmts", "pairVals", "warns", "uses"]
REC_DEF = {"expr": '""', "stmt": "@none", "params": "@none", "body": '""', "items": "@none", "keys": "@none", "stmts": "@noneL", "pairVals": "@none", "warns": "@none", "uses": "@none"}

def expand(text):
    out = []
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c == '"':
            k = i + 1
            while text[k] != '"':
                if text[k] == '\\': k += 1
                k += 1
            out.append(text[i:k+1]); i = k + 1; continue
        hit = None
        for m in MACROS:
            if text.startswith(m + "{", i) and (i == 0 or not (text[i-1].isalnum() or text[i-1] in "_-/")):
                hit = m; break
        if hit:
            b = i + len(hit)
            e = find_close(text, b)
            parts = [expand(p) for p in split_top(text[b+1:e])]
            if hit == "FILL":
                pairs = []
                for p in parts[1:]:
                    k_, v_ = p.split("=>", 1)
                    pairs.append((k_.strip().strip('"'), v_.strip()))
                out.append(F(parts[0], pairs))
            elif hit == "FILLE":
                out.append(FE(parts[0], parts[1]))
            elif hit == "STR":
                out.append(strlit(parts[0]))
            elif hit == "NUM":
                out.append(numlit(parts[0]))
            elif hit == "ENT":
                out.append(entname(parts[0]))
            elif hit == "CASE":
                out.append(case(parts[0], parts[1]))
            elif hit == "FILLV":
                out.append(fill(parts[0], parts[1]))
            elif hit == "LOOKUP":
                e_ = u("lk")
                out.append('(default (array/nth (default (array/find (object/entries %s) (fn %s (= (array/nth @%s 0) %s))) ["" ""]) 1) "")' % (parts[0], e_, e_, parts[1]))
            elif hit == "RESOLVE":
                out.append(resolve(parts[0], parts[1]))
            elif hit == "RECL":
                d = {"expr": '""', "stmt": "[]", "params": "[]", "body": '""', "items": "[]", "keys": "[]", "stmts": "[]", "pairVals": "[]", "warns": "[]", "uses": "[]"}
                for p in parts:
                    k_, v_ = p.split("=>", 1)
                    d[k_.strip()] = v_.strip()
                out.append("{ " + ", ".join("%s: %s" % (f, d[f]) for f in REC_FIELDS) + " }")
            elif hit == "REC":
                d = dict(REC_DEF)
                for p in parts:
                    k_, v_ = p.split("=>", 1)
                    d[k_.strip()] = v_.strip()
                out.append("{ " + ", ".join("%s: %s" % (f, d[f]) for f in REC_FIELDS) + " }")
            i = e + 1
            continue
        out.append(c); i += 1
    return ''.join(out)

if __name__ == "__main__":
    print(expand(open(sys.argv[1]).read()))
