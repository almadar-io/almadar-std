import json

_c = [0]
def u(p):
    _c[0] += 1
    return f"{p}{_c[0]}"

def S(s):
    assert not s.startswith("@"), s
    return json.dumps(s, ensure_ascii=True)

def fill(t, vs):
    """single pass {{key}} substitution; t: lolo expr yielding the template, vs: lolo expr yielding Map string string"""
    n = u("f")
    return ('(let ((%(n)sp (str/split %(t)s "{{"))) (str/concat (default (array/first @%(n)sp) "") (str/join (array/map (array/drop @%(n)sp 1) (fn %(n)sq '
            '(let ((%(n)sr (str/split @%(n)sq "}}"))) (if (< (array/len @%(n)sr) 2) (str/concat "{{" @%(n)sq) '
            '(str/concat (object/get %(vs)s (default (array/first @%(n)sr) "") (str/concat "{{" (default (array/first @%(n)sr) "") "}}")) (str/join (array/drop @%(n)sr 1) "}}")))))) "")))'
            % dict(n=n, t=t, vs=vs))

def F(t, pairs):
    """pairs: list of (key, lolo string expr)"""
    n = u("v")
    ent = " ".join('[%s %s]' % (S(k), v) for k, v in pairs)
    return '(let ((%s : SrcVars (object/fromEntries [%s]))) %s)' % (n, ent, fill(t, "@" + n))

def FE(t, entries):
    """entries: lolo expr yielding list of [key value] pairs"""
    n = u("v")
    return '(let ((%s : SrcVars (object/fromEntries %s))) %s)' % (n, entries, fill(t, "@" + n))

def case(T, style):
    b, w, x, y, k = u("cb"), u("cw"), u("cx"), u("cy"), u("ck")
    return ('(let ((%(b)s (str/replace-pattern (str/replaceAll %(T)s "-" "_") "[.]" "_"))) '
            '(let ((%(w)s (array/filter (str/split (str/lower @%(b)s) "_") (fn %(x)s (!= @%(x)s ""))))) '
            '(if (= %(st)s "lower") (str/lower @%(b)s) (if (= %(st)s "upper") (str/upper @%(b)s) '
            '(if (= %(st)s "camel") (str/concat (default (array/first @%(w)s) "") (str/join (array/map (array/drop @%(w)s 1) (fn %(y)s (str/capitalize @%(y)s))) "")) '
            '(if (= %(st)s "pascal") (str/join (array/map @%(w)s (fn %(y)s (str/capitalize @%(y)s))) "") '
            '(let ((%(k)s (str/split @%(b)s "_"))) '
            '(if (= %(st)s "split-camel") (str/concat (default (array/first @%(k)s) "") (str/join (array/map (array/drop @%(k)s 1) (fn %(y)s %(up)s)) "")) '
            '(if (= %(st)s "split-pascal") (str/join (array/map @%(k)s (fn %(y)s %(up)s)) "") @%(b)s)))))))))'
            % dict(b=b, w=w, x=x, y=y, k=k, T=T, st=style,
                   up='(str/concat (str/upper (str/slice @%s 0 1)) (str/slice @%s 1 (str/len @%s)))' % (y, y, y)))

def lines_indent(lines, unit="@config.indent"):
    x = u("li")
    return '(array/map %s (fn %s (str/concat %s @%s)))' % (lines, x, unit, x)

def strlit(x):
    """a string literal: the quoted JSON text of x, with config.stringEscapes applied to the inner text in sorted key order"""
    j, a, k = u("sj"), u("sa"), u("sk")
    esc = ('(if (= (array/len (object/keys @config.stringEscapes)) 0) @%(j)s '
           '(str/concat "\\"" (array/reduce (array/sort (object/keys @config.stringEscapes)) (str/slice @%(j)s 1 (- (str/len @%(j)s) 1)) '
           '(fn %(a)s %(k)s (str/replaceAll @%(a)s @%(k)s (object/get @config.stringEscapes @%(k)s "")))) "\\""))') % dict(j=j, a=a, k=k)
    return '(let ((%s (json/stringify %s))) %s)' % (j, x, F("@config.stringForm", [("json", esc)]))

def numlit(x):
    """a number literal: numberIntForm when the JSON text is an integer, else numberForm"""
    j = u("nj")
    return ('(let ((%(j)s (json/stringify %(x)s))) (if (= (str/replace-pattern @%(j)s "^-?[0-9]+$" "") "") %(i)s %(f)s))'
            % dict(j=j, x=x, i=F("@config.numberIntForm", [("json", "@" + j)]), f=F("@config.numberForm", [("json", "@" + j)])))

def entname(x):
    """the generated name of an entity: config.entityNames, else the .lolo name"""
    e = u("en")
    return '(let ((%(e)s %(x)s)) (object/get @config.entityNames @%(e)s @%(e)s))' % dict(e=e, x=x)
