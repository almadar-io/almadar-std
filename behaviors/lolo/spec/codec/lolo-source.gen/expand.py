import re, sys
from lolo_macros import F, FE, case, u, S, fill, strlit, numlit, entname

MACROS = ("STR", "NUM", "ENT", "FILLE", "FILLV", "FILL", "CASE", "RECL", "REC", "LOOKUP", "RESOLVE", "FILLV")

def resolve(T, BASE):
    a = u("rs")
    MO, MC = '"\\ue000"', '"\\ue001"'
    lk_types = '(default (array/nth (default (array/find (object/entries @entity.types) (fn %(a)se (= (array/nth @%(a)se 0) @%(a)sabs))) ["" ""]) 1) "")' % dict(a=a)
    lk_names = '(default (array/nth (default (array/find (object/entries @config.typeNames) (fn %(a)sn (= (array/nth @%(a)sn 0) @%(a)sty))) ["" ""]) 1) "")' % dict(a=a)
    return ('(let ((%(a)sp (str/split %(T)s %(MO)s))) (str/concat (default (array/first @%(a)sp) "") (str/join (array/map (array/drop @%(a)sp 1) (fn %(a)sq '
            '(let ((%(a)sz (str/split @%(a)sq %(MC)s))) (let ((%(a)srel (default (array/first @%(a)sz) "")) (%(a)stail (str/join (array/drop @%(a)sz 1) %(MC)s))) '
            '(let ((%(a)slead (default (array/first (str/split (str/slice @%(a)srel 1 (str/len @%(a)srel)) "]")) "")) (%(a)safter (str/join (array/drop (str/split @%(a)srel "]") 1) "]"))) '
            '(let ((%(a)sabs (str/concat %(BASE)s (if (= @%(a)slead "1") ".guard" (str/concat ".effects[" (- (default (str/to-int @%(a)slead) 2) 2) "]")) @%(a)safter))) '
            '(let ((%(a)sty %(lk_types)s)) (let ((%(a)smapped %(lk_names)s)) '
            '(str/concat (if (= @%(a)sty "") @config.typeUnknown (if (!= @%(a)smapped "") @%(a)smapped @%(a)sty)) @%(a)stail))))))))) "")))'
            % dict(a=a, T=T, BASE=BASE, MO=MO, MC=MC, lk_types=lk_types, lk_names=lk_names))

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
