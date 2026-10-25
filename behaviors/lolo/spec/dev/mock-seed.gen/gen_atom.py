# Generates dev/atoms/std-mock-seed.lolo (the std mock-seed atom, field-tree sampler and dataset program).
# Usage: python3 gen_atom.py            (rewrites ../../../dev/atoms/std-mock-seed.lolo)
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True
import sampler as S
OUT = os.path.join(HERE, '..', '..', '..', 'dev', 'atoms', 'std-mock-seed.lolo')
ROW='Map string MockValue?'
P=dict(RT='?runtime',SD='?seeded',NOW='?nowMs',EN='?entityName',WORDS='@entity.words')
def keptf(fields_expr, seeded, ident, idx):
    return (f'(array/filter {fields_expr} (fn f (and (!= (object/get @f "name" "") "") (not (array/includes ["id", "createdAt", "updatedAt"] (object/get @f "name" ""))) '
            f'(not (and {seeded} (not {ident}) (not (object/get @f "required" false)) (not (object/has @f "default")) (!= (object/get @f "type" "") "relation") '
            f'(= {S.field_projection("@f")} null) (= (math/mod {idx} 2) 0))))))')
def row_cell(kf): return f'[{{ path: "", kind: "row", text: "", num: 0, keys: (array/map {kf} (fn f (object/get @f "name"))), kids: (array/map {kf} (fn f (object/get @f "name"))) }}]'
def frames(kf,idx): return f'(array/map {kf} (fn f {{ spec: @f, name: (object/get @f "name"), index: {idx}, depth: 0, path: (object/get @f "name") }}))'
run_start=S.run(P,'[{ spec: ?spec, name: ?name, index: ?index, depth: 0, path: ?name }]','[]','@entity.rng',root='?name')
kf1=keptf('?fields','?seeded','?identity','?index')
run_row=S.run(P,frames(kf1,'?index'),row_cell(kf1),'@entity.rng',row_root=True)
iso=S.iso_of
def stamped(base,members): return f'(let ((rs {{ {members} }})) (or (object/merge {base} @rs) @rs))'
nx=S.nxt
NEW=f'''      CORPUS_IS -> ready
        (set @entity.words ?words)
        (when @entity.dsBoot (do (set @entity.dsBoot false) (fetch MockSeedMark {{ id: "seeded", emit: {{ success: DS_MARK_FOUND, failure: DS_MARK_ABSENT }} }})))
      WALK_START -> ready
        (let ((sampled {run_start}))
          (if {S.cells_bad('(object/get @sampled "cells")')}
            (emit DATASET_FAILED {{ error: "{S.CLOCK_FAILED}" }})
            (do
            (set @entity.out @sampled)
            (set @entity.rng (object/get @sampled "s"))
            (emit WALKED {{ cells: (object/get @sampled "cells"), value: (object/get @sampled "value") }}))))
      WALK_ROW -> ready
        (let ((sampled {run_row}))
          (if {S.cells_bad('(object/get @sampled "cells")')}
            (emit DATASET_FAILED {{ error: "{S.CLOCK_FAILED}" }})
            (do
            (set @entity.out @sampled)
            (set @entity.rng (object/get @sampled "s"))
            (emit WALKED {{ cells: (object/get @sampled "cells"), value: (object/get @sampled "value") }})
            (emit ROW_WALKED {{ row: (object/get @sampled "value") }}))))
      SEED_STREAM -> ready
        (set @entity.rng (math/mod ?seed 4294967296))
        (set @entity.nowMs ?nowMs)
        (emit STREAM_SEEDED {{ seed: ?seed, nowMs: ?nowMs }})
      SEED_ROW -> ready
        (set @entity.createdMs (- ?nowMs (math/floor (* {S.uu(nx("@entity.rng"))} 31536000000))))
        (set @entity.updatedMs (math/min (+ @entity.createdMs (* {S.rint(nx(nx("@entity.rng")),0,30)} 86400000)) ?nowMs))
        (let ((sampled {S.run(dict(P,SD='true',NOW='?nowMs',EN='?label'),frames(keptf('?fields','true','?identity','?index'),'?index'),row_cell(keptf('?fields','true','?identity','?index')),nx(nx('@entity.rng')),row_root=True)}))
          (let ((ci {iso("@entity.createdMs")}) (ui {iso("@entity.updatedMs")}))
          (if (or {S.cells_bad('(object/get @sampled "cells")')} (= @ci null) (= @ui null))
            (emit DATASET_FAILED {{ error: "{S.CLOCK_FAILED}" }})
          (do
          (set @entity.out @sampled)
          (set @entity.rng (object/get @sampled "s"))
          (emit SEED_ROW_DONE {{ row: {stamped('(object/get @sampled "value")', 'id: (str/concat (str/upper (str/slice ?label 0 1)) (str/slice ?label 1 (str/len ?label)) " Id " ?n), createdAt: @ci, updatedAt: @ui')} }})))))
      SAMPLE_ROWS -> ready
        (set @entity.rowFields ?fields)
        (set @entity.rowName ?name)
        (set @entity.entityName ?name)
        (set @entity.runtime ?runtime)
        (set @entity.identity ?identity)
        (set @entity.seeded false)
        (set @entity.rowCount (if ?runtime 1 ?count))
        (set @entity.rowIdx 1)
        (set @entity.rows [])
        (set @entity.inRows true)
        (emit ROWS_NEXT {{ at: 1 }})
      ROWS_NEXT -> ready when (<= @entity.rowIdx @entity.rowCount)
        (emit WALK_ROW {{ fields: @entity.rowFields, entityName: @entity.rowName, index: @entity.rowIdx, seeded: false, identity: @entity.identity, runtime: @entity.runtime, nowMs: 0 }})
      ROWS_NEXT -> ready when (> @entity.rowIdx @entity.rowCount)
        (set @entity.inRows false)
        (emit ROWS_DONE {{ rows: @entity.rows }})
      ROW_WALKED -> ready when @entity.inRows
        (set @entity.rows (array/append @entity.rows {stamped('@payload.row','id: (str/concat @entity.rowName "-" @entity.rowIdx)')}))
        (set @entity.rowIdx (+ @entity.rowIdx 1))
        (emit ROWS_NEXT {{ at: @entity.rowIdx }})
@@DATASET@@'''
# ---- dataset block
RES_='@payload.result'
def lower(x): return f'(str/lower {x})'
# defs list from the lowered program
orbs=f'(object/get {RES_} "orbitals" [])'
prim=f'(array/filter (array/map {orbs} (fn o (object/get @o "entity"))) (fn e (validate/object @e)))'
aux=f'(array/filter (array/flatten (array/map {orbs} (fn o (object/get @o "auxiliaryEntities" [])))) (fn e (validate/object @e)))'
# order: per orbital: entity then its auxiliaries
defs=f'(array/flatten (array/map {orbs} (fn o (array/concat (array/filter [(object/get @o "entity")] (fn e (validate/object @e))) (array/filter (object/get @o "auxiliaryEntities" []) (fn e (validate/object @e)))))))'
idprim=f'(array/filter {prim} (fn e (object/get @e "identity" false)))'
idaux=f'(array/filter {aux} (fn e (object/get @e "identity" false)))'
iddef=f'(if (> (array/len {idprim}) 0) (array/first {idprim}) (if (> (array/len {idaux}) 0) (array/first {idaux}) null))'
def selected_instances(d):
    return f'(object/get (object/get {d} "localeInstances" {{}}) @entity.dsLocale (object/get {d} "instances" []))'
def has_inst(d): return f'(> (array/len {selected_instances(d)}) 0)'
def storekey(d): return lower(f'(if (!= (object/get {d} "collection" "") (object/get {d} "collection" "")) "" (if (object/has {d} "collection") (object/get {d} "collection") (object/get {d} "name")))')
def mock_seeds(d): return f'(or (not (object/get {d} "browser" false)) (object/get {d} "seedMock" false))'
idname='(if (= @idd null) "" (object/get @idd "name"))'
def own_rel_cols(d): 
    return f'(array/map (array/filter (object/get {d} "fields" []) (fn f (and (not (object/get @f "intrinsic" false)) (= (object/get (object/get @f "relation" {{}}) "entity" "") {idname}) (!= (object/get (object/get @f "relation" {{}}) "entity" "") "")))) (fn f (object/get @f "name")))'
def decl_cols(coll): 
    return f'(object/get @collOwners {coll} [])'
def owner_cols(d):
    own=own_rel_cols(d)
    mirror=f'(array/filter {decl_cols(f"(object/get {d} {chr(34)}collection{chr(34)} {chr(34)}{chr(34)})")} (fn c (array/includes (array/map (object/get {d} "fields" []) (fn f (object/get @f "name" ""))) @c)))'
    return f'(if (= {idname} "") [] (array/unique (array/concat {own} (if (!= (object/get {d} "collection" "") "") {mirror} []))))'
def reg(d,seeds):
    return (f'{{ label: (object/get {d} "name"), store: {storekey(d)}, fields: (object/get {d} "fields" []), identity: (object/get {d} "identity" false), runtime: (= (object/get {d} "persistence" "") "runtime"), seeds: {seeds}, ownerCols: {owner_cols(d)}, instances: {selected_instances(d)} }}')
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) (array/concat (if (and (!= @idd null) (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")}))))')
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) (array/concat (if (and (!= @idd null) (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")}))))')
ALLR='@entity.dsRegsAll'
seedregs=f'(array/filter {ALLR} (fn r (object/get @r "seeds")))'
def store_of_entity(ename): 
    return f'(let ((hit (array/find @entity.dsRegsAll (fn r (= (str/lower (object/get @r "label")) (str/lower {ename})))))) (if (= @hit null) "" (object/get @hit "store")))'
card='(object/get (object/get @fd "relation" {}) "cardinality" "")'
links_expr=(f'(array/flatten (array/map (array/unique (array/map {seedregs} (fn r (object/get @r "store")))) (fn st '
   f'(let ((flds (array/filter (array/flatten (array/map (array/filter {seedregs} (fn r (= (object/get @r "store") @st))) (fn r (object/get @r "fields")))) (fn f (and (= (object/get @f "type" "") "relation") (object/has @f "relation"))))) '
   f'(owners (array/flatten (array/map (array/filter {seedregs} (fn r (= (object/get @r "store") @st))) (fn r (object/get @r "ownerCols")))))) '
   f'(array/map (array/unique (array/map @flds (fn f (object/get @f "name")))) (fn nm (let ((fd (array/find @flds (fn f (= (object/get @f "name") @nm))))) '
   f'{{ store: @st, field: @nm, target: {store_of_entity("(object/get (object/get @fd "+chr(34)+"relation"+chr(34)+") "+chr(34)+"entity"+chr(34)+")")}, scalar: (array/includes ["one", "many-to-one"] {card}), isOwner: (array/includes @owners @nm) }})))))))')
iddef_store=f'(let ((idd {iddef})) (if (= @idd null) "" {storekey("@idd")}))'

RG='(array/first @entity.dsRegs)'
def PS(): return dict(RT='(object/get @reg "runtime")',SD='true',NOW='@entity.nowMs',EN='(object/get @reg "label")',WORDS='@entity.words')
RES_FIELDS='(object/get @reg "fields")'
def kept2(fields,idx,ident='(object/get @reg "identity")'): return keptf(fields,'true',ident,idx)
isoX=iso
SEEDSTAMP=stamped('(object/get @smp "value")','id: (str/concat (str/upper (str/slice (object/get @reg "label") 0 1)) (str/slice (object/get @reg "label") 1 (str/len (object/get @reg "label"))) " Id " (+ (array/len (object/get @ra "rows")) 1)), createdAt: @ci, updatedAt: @ui')
blank=lambda x:f'(or (not (object/has {x} "id")) (and (validate/string (object/get {x} "id")) (= (object/get {x} "id") "")))'
inst_rows=(f'(array/map (array/range (array/len (object/get @reg "instances"))) (fn i (let ((r (array/nth (object/get @reg "instances") @i))) (object/merge @r {{ id: (if {blank("@r")} '
  f'(str/concat (str/upper (str/slice (object/get @reg "label") 0 1)) (str/slice (object/get @reg "label") 1 (str/len (object/get @reg "label"))) " Id " (+ @entity.dsMinted (+ 1 (array/len (array/filter (array/take (object/get @reg "instances") @i) (fn x {blank("@x")})))))) (object/get @r "id")), '
  f'createdAt: (if (or (not (object/has @r "createdAt")) (= (object/get @r "createdAt" "") "")) @entity.dsNowIso (object/get @r "createdAt")), updatedAt: (if (or (not (object/has @r "updatedAt")) (= (object/get @r "updatedAt" "") "")) @entity.dsNowIso (object/get @r "updatedAt")) }}))))')
STORES='@entity.dsStores'
rows0='(object/get @entity.dsStores (object/get @reg "store") [])'
# --- seed arm
seed_sample=S.run(PS(),frames(kept2(RES_FIELDS,'(+ @ri 1)'),'(+ @ri 1)'),row_cell(kept2(RES_FIELDS,'(+ @ri 1)')),S.nxt(S.nxt('(object/get @ra "s")')),row_root=True)
idrows='(object/get @entity.dsStores @entity.dsIdStore [])'
owner_val=(f'(if @entity.dsViewerMay @entity.dsViewer (let ((k (array/findIndex @entity.dsAllows (fn a @a)))) (if (>= @k 0) (str/concat "" (object/get (array/nth {idrows} @k) "id")) "")))')
owner_hit='(or @entity.dsViewerMay (> (array/len (array/filter @entity.dsAllows (fn a @a))) 0))'
seed_row=(f'(let ((smp {seed_sample}) (cm (- @entity.nowMs (math/floor (* {S.uu(S.nxt("(object/get @ra "+chr(34)+"s"+chr(34)+")"))} 31536000000))))) '
  f'(let ((um (math/min (+ @cm (* {S.rint(S.nxt(S.nxt("(object/get @ra "+chr(34)+"s"+chr(34)+")")),0,30)} 86400000)) @entity.nowMs))) '
  f'(let ((r0 {SEEDSTAMP})) '
  f'{{ rows: (array/append (object/get @ra "rows") (array/reduce (object/get @reg "ownerCols") @r0 (fn rr col (if (and (!= @entity.dsViewer "") (if (= @col "id") (= @ri 0) (= (math/mod @ri 2) 0)) {owner_hit}) (object/set @rr @col {owner_val}) @rr)))), s: (object/get @smp "s") }})))')
seed_arm=f'(array/reduce (array/range (if (object/get @reg "runtime") 1 @entity.dsCount)) {{ rows: {rows0}, s: @entity.rng }} (fn ra ri {seed_row}))'
# --- backfill arm
absent='(array/filter (object/get @reg "fields") (fn f (and (not (array/includes ["id", "createdAt", "updatedAt"] (object/get @f "name" ""))) (not (object/has @row (object/get @f "name" ""))))))'
bf_sample=S.run(PS(),frames(kept2('@absent','(+ @ri 1)'),'(+ @ri 1)'),row_cell(kept2('@absent','(+ @ri 1)')),'(object/get @ra "s")',row_root=True)
bf_row=(f'(let ((row (array/nth {rows0} @ri))) (let ((absent {absent})) (if (= (array/len @absent) 0) {{ rows: (array/append (object/get @ra "rows") @row), s: (object/get @ra "s"), bad: (object/get @ra "bad") }} '
        f'(let ((smp {bf_sample})) {{ rows: (array/append (object/get @ra "rows") (or (object/merge @row (object/get @smp "value")) @row)), s: (object/get @smp "s"), bad: (or (object/get @ra "bad") {S.cells_bad(chr(40)+"object/get @smp "+chr(34)+"cells"+chr(34)+")")}) }}))))')
bf_arm=f'(array/reduce (array/range (array/len {rows0})) {{ rows: [], s: @entity.rng, bad: false }} (fn ra ri {bf_row}))'
store_step=(f'(let ((reg {RG})) (if (> (array/len (object/get @reg "instances")) 0) '
   f'{{ stores: (object/set @entity.dsStores (object/get @reg "store") (array/concat {rows0} {inst_rows})), s: @entity.rng, minted: (+ @entity.dsMinted (array/len (array/filter (object/get @reg "instances") (fn x {blank("@x")})))) }} '
   f'(if (not (object/get @reg "seeds")) {{ stores: @entity.dsStores, s: @entity.rng, minted: @entity.dsMinted }} '
   f'(let ((res2 (if (= (array/len {rows0}) 0) {seed_arm} {bf_arm}))) {{ stores: (object/set @entity.dsStores (object/get @reg "store") (object/get @res2 "rows")), s: (object/get @res2 "s"), minted: @entity.dsMinted }}))))')
# --- links
def relation_write(row, field, scalar, one, many):
    return f'(if {scalar} (object/set {row} {field} {one}) (object/set {row} {field} {many}))'

def link_fill():
    parent = '(if (= @i 0) "" (object/get (array/nth @rows (math/floor (/ (- @i 1) 2))) "id"))'
    children = '(array/map (array/filter [(+ (* 2 @i) 1), (+ (* 2 @i) 2)] (fn c (< @c (array/len @rows)))) (fn c (object/get (array/nth @rows @c) "id")))'
    local = f'(if (object/get @lk "isOwner") (object/set @row @f (object/get @row "id")) {relation_write("@row", "@f", '(object/get @lk "scalar")', parent, children)})'
    eligible = '(if (object/get @lk "isOwner") (array/map (array/filter (array/range (array/len @trows)) (fn j (array/nth @entity.dsAllows @j))) (fn j (object/get (array/nth @trows @j) "id"))) (array/map @trows (fn t (object/get @t "id"))))'
    one = f'(array/nth @elig {S.modlen("@i","@elig")})'
    many = f'(array/unique (array/map (array/range (math/min (array/len @elig) (+ 2 (math/mod @i 2)))) (fn o (array/nth @elig {S.modlen("(+ @i @o)","@elig")}))))'
    remote = f'(let ((elig {eligible})) (if (= (array/len @elig) 0) @row {relation_write("@row", "@f", '(object/get @lk "scalar")', one, many)}))'
    filled = '(not (or (not (object/has @row @f)) (= (object/get @row @f "") "") (and (validate/array (object/get @row @f "")) (= (array/len (object/get @row @f "")) 0))))'
    return (f'(let ((rows (object/get @sm (object/get @lk "store") [])) (trows (object/get @sm (object/get @lk "target") []))) '
            f'(if (= (array/len @trows) 0) @sm (object/set @sm (object/get @lk "store") '
            f'(array/map (array/range (array/len @rows)) (fn i (let ((row (array/nth @rows @i)) (f (object/get @lk "field"))) '
            f'(if {filled} @row (if (= (object/get @lk "target") (object/get @lk "store")) {local} {remote}))))))))')

links_fold=f'(array/reduce @entity.dsLinks @entity.dsStores (fn sm lk {link_fill()}))'
DATASET=f'''      DATASET_START -> ready
        (set @entity.dsViewer ?viewerId)
        (set @entity.dsViewerMay ?viewerMayCreate)
        (set @entity.dsAllows ?createAllows)
        (set @entity.dsCount ?count)
        (set @entity.nowMs ?nowMs)
        (set @entity.dsNowIso {isoX("?nowMs")})
        (set @entity.rng (math/mod ?seed 4294967296))
        (set @entity.dsMinted 0)
        (set @entity.dsStores {{}})
        (program/read ?source {{ emit: {{ success: DS_PROGRAM_READ, failure: DS_PROGRAM_FAILED }} }})
      DS_PROGRAM_FAILED -> ready
        (emit DATASET_FAILED {{ error: ?error }})
      DS_PROGRAM_READ -> ready
        (set @entity.dsRegsAll {regs_expr})
        (set @entity.dsRegs @entity.dsRegsAll)
        (set @entity.dsLinks {links_expr})
        (set @entity.dsIdStore {iddef_store})
        (emit DS_STORE {{ at: (array/len @entity.dsRegs) }})
      DS_STORE -> ready when (= (array/len @entity.dsRegs) 0)
        (emit DS_LINKS {{ at: 0 }})
      DS_STORE -> ready when (> (array/len @entity.dsRegs) 0)
        (set @entity.dsOut {store_step})
        (set @entity.dsStores (object/get @entity.dsOut "stores"))
        (set @entity.rng (object/get @entity.dsOut "s"))
        (set @entity.dsMinted (object/get @entity.dsOut "minted"))
        (set @entity.dsRegs (array/drop @entity.dsRegs 1))
        (emit DS_STORE {{ at: (array/len @entity.dsRegs) }})
      DS_LINKS -> ready
        (set @entity.dsStores {links_fold})
        (emit DATASET_DONE {{ stores: @entity.dsStores }})
'''
ROW='Map string MockValue?'
# ---- owner columns: identity-typed relations + collection mirror + env pairs, id first
owner_pieces='(array/filter (array/map (str/split @entity.dsOwns ",") (fn q (str/trim @q))) (fn q (and (str/includes @q ".") (!= (array/nth (str/split @q ".") 0) "") (!= (str/join (array/drop (str/split @q ".") 1) ".") ""))))'
parsed_owner_pairs=f'(array/map {owner_pieces} (fn q {{ entity: (array/nth (str/split @q ".") 0), column: (str/join (array/drop (str/split @q ".") 1) ".") }}))'
def env_cols(label):
    return f'(array/map (array/filter @entity.dsOwnerPairs (fn q (= (str/lower (object/get @q "entity")) (str/lower {label})))) (fn q (object/get @q "column")))'
def seq(a,lit): return f'(and (validate/string {a}) (= {a} {lit}))'
def vid(x): return f'(or {seq(x,"(quote "+chr(34)+"@user.id"+chr(34)+")")} (and (validate/array {x}) (= (array/len {x}) 3) {seq("(array/nth "+x+" 0)",chr(34)+"object/get"+chr(34))} {seq("(array/nth "+x+" 1)","(quote "+chr(34)+"@user"+chr(34)+")")} {seq("(array/nth "+x+" 2)",chr(34)+"id"+chr(34))}))'
def fref(x): return f'(if (validate/string {x}) (if (str/startsWith {x} (quote "@entity.")) (str/slice {x} 8 (str/len {x})) "") (if (and (validate/array {x}) (= (array/len {x}) 3) {seq("(array/nth "+x+" 0)",chr(34)+"object/get"+chr(34))} {seq("(array/nth "+x+" 1)","(quote "+chr(34)+"@entity"+chr(34)+")")} (validate/string (array/nth {x} 2))) (array/nth {x} 2) ""))'
fold_step=(f'(fn (n k) (array/concat (if (and (validate/array @n) (= (array/len @n) 3) (validate/string (array/nth @n 0)) (array/includes ["=", "=="] (array/nth @n 0))) '
           f'(let ((fa (array/nth @n 1)) (fb (array/nth @n 2))) (let ((fc (if {vid("@fb")} {fref("@fa")} (if {vid("@fa")} {fref("@fb")} "")))) (if (!= @fc "") (array/append [] @fc) []))) []) '
           f'(if (validate/array @n) (array/flatten @k) [])))')
def pcols(d,key): return f'(if (object/has {d} "{key}") (array/unique (or (tree/fold (object/get {d} "{key}") {fold_step} "Expr") [])) [])'
def owner_cols(d):
    own=own_rel_cols(d)
    mirror=f'(array/filter {decl_cols(f"(object/get {d} {chr(34)}collection{chr(34)} {chr(34)}{chr(34)})")} (fn c (array/includes (array/map (object/get {d} "fields" []) (fn f (object/get @f "name" ""))) @c)))'
    selfid=f'(if (and (object/get {d} "identity" false) (array/includes (array/flatten [{pcols(d,"read_policy")} {pcols(d,"create_policy")} {pcols(d,"update_policy")} {pcols(d,"delete_policy")}]) "id")) (array/append [] "id") [])'
    polcols=f'(array/concat {pcols(d,"update_policy")} {pcols(d,"delete_policy")} {pcols(d,"read_policy")})'
    schema_cols=f'(if (= {idname} "") [] (array/concat {own} {selfid} {polcols} (if (!= (object/get {d} "collection" "") "") {mirror} [])))'
    allc=f'(array/unique (array/concat {schema_cols} {env_cols("(object/get "+d+" "+chr(34)+"name"+chr(34)+")")}))'
    return f'(let ((oc {allc})) (array/concat (array/filter @oc (fn c (= @c "id"))) (array/filter @oc (fn c (!= @c "id")))))'
def reg(d,seeds):
    return (f'{{ label: (object/get {d} "name"), store: {storekey(d)}, fields: (object/get {d} "fields" []), identity: (object/get {d} "identity" false), runtime: (= (object/get {d} "persistence" "") "runtime"), seeds: {seeds}, ownerCols: {owner_cols(d)}, instances: {selected_instances(d)} }}')
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) (array/concat (if (and (!= @idd null) (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")}))))')
# ---- projections
def proj_of(f): return S.field_projection(f)
projs_expr=(f'(array/flatten (array/map (array/unique (array/map {seedregs} (fn r (object/get @r "store")))) (fn st '
   f'(let ((flds (array/filter (array/flatten (array/map (array/filter {seedregs} (fn r (= (object/get @r "store") @st))) (fn r (object/get @r "fields")))) (fn f (!= {proj_of("@f")} null))))) '
   f'(array/map (array/unique (array/map @flds (fn f (object/get @f "name")))) (fn nm (let ((fd (array/find @flds (fn f (= (object/get @f "name") @nm))))) (let ((pr {proj_of("@fd")})) '
   f'{{ store: @st, field: @nm, target: {store_of_entity("(object/get @pr "+chr(34)+"type"+chr(34)+")")}, targetField: (object/get @pr "field"), isArray: (= (object/get @fd "type") "array") }}))))))))')
GROUPED=('(let ((noRegs : Map string [DatasetReg] {}) (noStores : Map string string {})) (let ((sr '+seedregs+')) '
         '(let ((byStore (array/reduce @sr @noRegs (fn acc r (object/set @acc (object/get @r "store") (array/append (object/get @acc (object/get @r "store") []) @r))))) '
         '(labelStore (array/reduce @entity.dsRegsAll @noStores (fn acc r (if (object/has @acc (str/lower (object/get @r "label"))) @acc (object/set @acc (str/lower (object/get @r "label")) (object/get @r "store")))))) '
         '(stores (array/unique (array/map @sr (fn r (object/get @r "store")))))) @@BODY@@)))')
def grouped(expr):
    head='(array/flatten (array/map (array/unique (array/map '+seedregs+' (fn r (object/get @r "store")))) (fn st '
    assert expr.startswith(head)
    expr='(array/flatten (array/map @stores (fn st '+expr[len(head):]
    expr=expr.replace('(array/filter '+seedregs+' (fn r (= (object/get @r "store") @st)))','(object/get @byStore @st [])')
    assert seedregs not in expr
    for ename in ['(object/get (object/get @fd "relation") "entity")','(object/get @pr "type")']:
        expr=expr.replace(store_of_entity(ename),'(object/get @labelStore (str/lower '+ename+') "")')
    assert '@entity.dsRegsAll' not in expr, expr[:300]
    return GROUPED.replace('@@BODY@@',expr)
links_expr=grouped(links_expr)
projs_expr=grouped(projs_expr)
def proj_fill():
    return (f'(let ((rows (object/get @sm (object/get @pj "store") [])) (trows (object/get @sm (object/get @pj "target") []))) (if (= (array/len @trows) 0) @sm (object/set @sm (object/get @pj "store") (array/map (array/range (array/len @rows)) (fn i (let ((row (array/nth @rows @i)) (f (object/get @pj "field"))) '
            f'(if (not (or (not (object/has @row @f)) (= (object/get @row @f "") "") (and (validate/array (object/get @row @f "")) (= (array/len (object/get @row @f "")) 0)))) @row '
            f'(let ((picked (object/get (array/nth @trows {S.modlen("@i","@trows")}) (object/get @pj "targetField") null))) (object/set @row @f (if (object/get @pj "isArray") [@picked] @picked))))))))))')
links_fold=f'(array/reduce @entity.dsProjs (array/reduce @entity.dsLinks @entity.dsStores (fn sm lk {link_fill()})) (fn sm pj {proj_fill()}))'
DERIVE='''      DERIVE_OWNERS -> ready
        (set @entity.dsOwns "")
        (set @entity.dsOwnerPairs [])
        (set @entity.dsLocale "")
        (set @entity.dsRegsAll @@REGS@@)
        (let ((owners (object/fromEntries (array/map (array/filter @entity.dsRegsAll (fn r (> (array/len (object/get @r "ownerCols")) 0))) (fn r [(str/lower (object/get @r "label")), (object/get @r "ownerCols")])))))
          (if (= @owners null) (emit OWNERS_FAILED { error: "mock-seed: an entity name cannot be a record key" }) (emit OWNERS_DERIVED { owners: @owners })))
'''
RO='''      READ_OWNERS -> ready
        (set @entity.roHit (and (!= ?column "id") ?hasReadPolicy ?targetKnown (> (array/len (array/filter (array/range (array/len ?ids)) (fn i (and (array/nth ?admitsOwn @i) (not (array/nth ?admitsBlank @i)))))) 0)))
        (set @entity.roIds (if @entity.roHit (array/map (array/filter (array/range (array/len ?ids)) (fn i (array/nth ?admitsOwn @i))) (fn i (array/nth ?ids @i))) []))
        (emit READ_OWNERS_FOUND { ids: @entity.roIds, hit: @entity.roHit })
'''
# ======================= access-check wiring (G-STD-114) =======================
POLKEYS=['read_policy','create_policy','update_policy','delete_policy']
def has_dir(e): return '(or '+' '.join(f'(object/has {e} "{k}")' for k in POLKEYS)+')'
def policy_owner(d):
    return f'(object/get @storePolicy {storekey(d)} null)'
def reg(d,seeds):
    po=policy_owner(d)
    return (f'{{ label: (object/get {d} "name"), store: {storekey(d)}, fields: (object/get {d} "fields" []), identity: (object/get {d} "identity" false), runtime: (= (object/get {d} "persistence" "") "runtime"), seeds: {seeds}, ownerCols: {owner_cols(d)}, '
            f'policyEntity: (let ((po {po})) (if (= @po null) (object/get {d} "name") (object/get @po "name"))), hasRead: (let ((po {po})) (if (= @po null) false (object/get @po "hasRead"))), hasCreate: (let ((po {po})) (if (= @po null) (object/has {d} "create_policy") (object/get @po "hasCreate"))), policyRefs: (let ((po {po})) (if (= @po null) [] (object/get @po "refs"))), instances: {selected_instances(d)} }}')
REF_FOLD=('(fn (n k) (array/concat (if (validate/string @n) (if (str/startsWith @n (quote "@entity.")) [(str/slice @n 8 (str/len @n))] '
          '(if (and (str/startsWith @n (quote "@")) (not (str/startsWith @n (quote "@user"))) (!= @n (quote "@entity"))) ["*"] [])) '
          '(if (and (validate/array @n) (= (array/len @n) 3) (validate/string (array/nth @n 0)) (= (array/nth @n 0) "object/get") (validate/string (array/nth @n 1)) (= (array/nth @n 1) (quote "@entity")) (validate/string (array/nth @n 2))) [(array/nth @n 2)] [])) '
          '(if (validate/array @n) (array/flatten @k) [])))')
def prefs(d,key): return f'(if (object/has {d} "{key}") (tree/fold (object/get {d} "{key}") {REF_FOLD} "Expr") [])'
LOOKUPS=('(let ((noPolicy : Map string StorePolicy {}) (noCols : Map string [string] {})) '
         '(let ((storePolicy (array/reduce @alld @noPolicy (fn acc e (if (and '+has_dir('@e')+' (not (object/has @acc '+storekey('@e')+'))) '
         '(object/set @acc '+storekey('@e')+' { name: (object/get @e "name"), hasRead: (object/has @e "read_policy"), hasCreate: (object/has @e "create_policy"), refs: (array/unique (array/concat '+prefs('@e','read_policy')+' '+prefs('@e','create_policy')+')) }) @acc)))) '
         '(collOwners (array/reduce @alld @noCols (fn acc e (if (!= (object/get @e "collection" "") "") '
         '(object/set @acc (object/get @e "collection" "") (array/concat (object/get @acc (object/get @e "collection" "") []) '+own_rel_cols('@e')+')) @acc))))) @@BODY@@))')
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) '+LOOKUPS.replace('@@BODY@@',f'(array/concat (if (and (!= @idd null) (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")})))')+')')

def storekey(d): return f'(str/lower (if (!= (object/get {d} "collection" "") "") (object/get {d} "collection") (object/get {d} "name")))'
seed_row=(f'(let ((smp {seed_sample}) (cm (- @entity.nowMs (math/floor (* {S.uu(S.nxt("(object/get @ra "+chr(34)+"s"+chr(34)+")"))} 31536000000))))) '
  f'(let ((um (math/min (+ @cm (* {S.rint(S.nxt(S.nxt("(object/get @ra "+chr(34)+"s"+chr(34)+")")),0,30)} 86400000)) @entity.nowMs))) '
  f'(let ((ci {isoX("@cm")}) (ui {isoX("@um")})) '
  f'{{ rows: (array/append (object/get @ra "rows") {SEEDSTAMP}), s: (object/get @smp "s"), bad: (or (object/get @ra "bad") {S.cells_bad(chr(40)+"object/get @smp "+chr(34)+"cells"+chr(34)+")")} (= @ci null) (= @ui null)) }})))')
seed_arm=f'(array/reduce (array/range (if (object/get @reg "runtime") 1 @entity.dsCount)) {{ rows: {rows0}, s: @entity.rng, bad: false }} (fn ra ri {seed_row}))'
stamp_list=('(if (= @entity.dsViewer "") [] (array/flatten (array/map (array/range (array/len (object/get @res2 "rows"))) (fn si (array/map (array/filter (object/get @reg "ownerCols") (fn col (if (= @col "id") (= @si 0) (= (math/mod @si 2) 0)))) (fn col { store: (object/get @reg "store"), i: @si, col: @col }))))))')
store_step=(f'(let ((reg {RG})) (if (> (array/len (object/get @reg "instances")) 0) '
   f'{{ stores: (object/set @entity.dsStores (object/get @reg "store") (array/concat {rows0} {inst_rows})), s: @entity.rng, minted: (+ @entity.dsMinted (array/len (array/filter (object/get @reg "instances") (fn x {blank("@x")})))), stamps: [], bad: false }} '
   f'(if (not (object/get @reg "seeds")) {{ stores: @entity.dsStores, s: @entity.rng, minted: @entity.dsMinted, stamps: [], bad: false }} '
   f'(if (> (array/len {rows0}) 0) (let ((res2 {bf_arm})) {{ stores: (object/set @entity.dsStores (object/get @reg "store") (object/get @res2 "rows")), s: (object/get @res2 "s"), minted: @entity.dsMinted, stamps: [], bad: (object/get @res2 "bad") }}) '
   f'(let ((res2 {seed_arm})) {{ stores: (object/set @entity.dsStores (object/get @reg "store") (object/get @res2 "rows")), s: (object/get @res2 "s"), minted: @entity.dsMinted, stamps: {stamp_list}, bad: (object/get @res2 "bad") }}))))) ')
_lf=link_fill()
_old='(let ((elig (if (object/get @lk "isOwner") (array/map (array/filter (array/range (array/len @trows)) (fn j (array/nth @entity.dsAllows @j))) (fn j (object/get (array/nth @trows @j) "id"))) (array/map @trows (fn t (object/get @t "id")))))) '
assert _old in _lf
_lf=_lf.replace(_old,'(if (object/get @lk "isOwner") @row (let ((elig (array/map @trows (fn t (object/get @t "id"))))) ')
_lf=_lf+')'
links_fold=f'(array/reduce @entity.dsLinks @entity.dsStores (fn sm lk {_lf}))'
projs_only=f'(array/reduce @entity.dsProjs @entity.dsStores (fn sm pj {proj_fill()}))'
VIEWER_ROW='(if @entity.dsHasViewerRecord @entity.dsViewerRecord (let ((vr (array/find (object/get @entity.dsStores @entity.dsIdStore []) (fn t (= (object/get @t "id" "") @entity.dsViewer))))) (if (= @vr null) { id: @entity.dsViewer } @vr)))'
def mk(action,colval,viewer,col):
    return f'(let ((asked (object/set @row {col} {colval}))) (if (= @asked null) [] [{{ entity: (object/get @reg "policyEntity"), action: "{action}", row: @asked, viewer: {viewer} }}]))'
Q='"'
def reqs(read,rel,viewer_req,col):
    idj='(object/get (array/nth @idrows @j) "id")'
    parts=[]
    parts.append(f'(if {read} (array/flatten (array/map (array/range (array/len @idrows)) (fn j {mk("read",idj,"(array/nth @idrows @j)",col)}))) [])')
    parts.append(f'(if {read} (array/flatten (array/map (array/range (array/len @idrows)) (fn j {mk("read",Q+Q,"(array/nth @idrows @j)",col)}))) [])')
    parts.append(f'(if {rel} (array/flatten (array/map (array/range (array/len @idrows)) (fn j {mk("create",idj,"(array/nth @idrows @j)",col)}))) [])')
    if viewer_req: parts.append(mk("create","@entity.dsViewer",VIEWER_ROW,col))
    return '(array/concat '+' '.join(parts)+')'
SEEDREGS='(array/filter @entity.dsRegsAll (fn r (object/get @r "seeds")))'
def reg_of(storex): return f'(array/find (if (= @entity.dsMode "restamp") @entity.dsRegsAll {SEEDREGS}) (fn r (= (object/get @r "store") {storex})))'
G_=lambda o,k: f'(object/get {o} "{k}")'
OLINK_KEY='(let ((lk (array/first @entity.dsOlinks))) (str/concat (object/get @lk "store") "." (object/get @lk "field")))'
OLINK_SHARED=('(let ((lk (array/first @entity.dsOlinks))) (let ((reg '+reg_of('(object/get @lk "store")')+')) '
              '(and (!= @reg null) (= (array/len (array/filter (object/get @reg "policyRefs") (fn c (!= @c (object/get @lk "field"))))) 0))))')
stamp_context=(f'(let ((st (array/first @entity.dsStamps))) (let ((reg {reg_of(G_("@st","store"))}) (col {G_("@st","col")})) '
  f'(let ((fld (array/find (object/get @reg "fields") (fn f (= (object/get @f "name") @col))))) '
  f'(let ((rel (and (!= @fld null) (= (object/get @fld "type" "") "relation") (not (and (= @entity.dsMode "restamp") (= @col "id"))))) (row (array/nth (object/get @entity.dsStores {G_("@st","store")} []) {G_("@st","i")}))) '
  f'(let ((tst (if @rel {store_of_entity(G_(G_("@fld","relation"),"entity"))} ""))) '
  f'(let ((idrows (object/get @entity.dsStores @tst []))) (let ((rd (and (object/get @reg "hasRead") @rel (!= @col "id")))) '
  f'@@BODY@@)))))))')
olink_context=(f'(let ((lk (array/first @entity.dsOlinks))) (let ((reg {reg_of(G_("@lk","store"))}) (col {G_("@lk","field")})) '
  f'(let ((row (array/nth (object/get @entity.dsStores {G_("@lk","store")} []) {G_("@lk","i")})) (idrows (object/get @entity.dsStores {G_("@lk","target")} []))) '
  f'(let ((rd (object/get @reg "hasRead"))) '
  f'@@BODY@@))))')
scalar_ids='(array/map @idrows (fn t (str/template "{{id}}" { id: (object/get @t "id") })))'
stamp_plan=stamp_context.replace('@@BODY@@',f'{{ queue: {reqs("@rd","@rel",True,"@col")}, planned: (+ (if @rd (* 2 (array/len @idrows)) 0) (if @rel (array/len @idrows) 0) 1), n: (array/len @idrows), read: @rd, rel: @rel, ids: {scalar_ids}, viewer: true }}')
olink_plan=olink_context.replace('@@BODY@@',f'{{ queue: {reqs("@rd","true",False,"@col")}, planned: (+ (if @rd (* 2 (array/len @idrows)) 0) (array/len @idrows)), n: (array/len @idrows), read: @rd, rel: true, ids: {scalar_ids}, viewer: false }}')
bad_id='(not (or (= (object/get @t "id") null) (validate/string (object/get @t "id")) (validate/number (object/get @t "id")) (validate/boolean (object/get @t "id"))))'
bad_ids=f'(array/filter @idrows (fn t {bad_id}))'
stamp_bad=stamp_context.replace('@@BODY@@',bad_ids)
olink_bad=olink_context.replace('@@BODY@@',bad_ids)
def reject_ids(candidates):
    return f'''        (emit DATASET_FAILED {{ error: (str/concat "Type mismatch: expected string | number | boolean | date | datetime, got " (if (validate/array (object/get (array/first {candidates}) "id")) "array" "object")) }})
        (set @entity.dsMode "failed")
        (set @entity.dsStamps [])
        (set @entity.dsOlinks [])
        (set @entity.acQueue [])
        (set @entity.acPurpose "")'''
A='@entity.acAnswers'; N='@entity.acN'
ro=f'(array/slice {A} 0 {N})'; rb=f'(array/slice {A} {N} (* 2 {N}))'
croff=f'(if @entity.acRead (* 2 {N}) 0)'
cr=f'(array/slice {A} {croff} (+ {croff} {N}))'
cv=f'(if @entity.acViewer (array/last {A}) false)'
decode=(f'(let ((ro {ro}) (rb {rb}) (cr {cr}) (cv {cv})) '
  f'(let ((scoped (and @entity.acRead (> (array/len (array/filter (array/range {N}) (fn j (and (array/nth @ro @j) (not (array/nth @rb @j)))))) 0)))) '
  f'(let ((readers (if @scoped (array/map (array/filter (array/range {N}) (fn j (array/nth @ro @j))) (fn j (array/nth @entity.acIds @j))) [])) '
  f'(creators (array/map (array/filter (array/range {N}) (fn j (array/nth @cr @j))) (fn j (array/nth @entity.acIds @j))))) '
  f'(let ((elig (if @scoped @readers @creators))) (let ((vmay (if @scoped (array/includes @readers @entity.dsViewer) @cv))) '
  f'{{ hit: (or @vmay (> (array/len @elig) 0)), owner: (if @vmay @entity.dsViewer (if (> (array/len @elig) 0) (array/first @elig) "")), elig: @elig, viewer: @vmay }})))))')
olinks_expr=('(array/flatten (array/map (array/filter @entity.dsLinks (fn lk (and (object/get @lk "isOwner") (!= (object/get @lk "target") (object/get @lk "store"))))) (fn lk '
  '(array/map (array/filter (array/range (array/len (object/get @entity.dsStores (object/get @lk "store") []))) (fn i (let ((v (object/get (array/nth (object/get @entity.dsStores (object/get @lk "store") []) @i) (object/get @lk "field") ""))) (or (= @v "") (and (validate/array @v) (= (array/len @v) 0)))))) '
  '(fn i { store: (object/get @lk "store"), field: (object/get @lk "field"), i: @i, target: (object/get @lk "target"), scalar: (object/get @lk "scalar") })))))')
def journal_cells(descriptors):
    return f'(array/map {descriptors} (fn st {{ store: (object/get @st "store"), id: (str/template "{{{{id}}}}" {{ id: (object/get (array/nth (object/get @entity.dsStores (object/get @st "store") []) (object/get @st "i")) "id") }}), column: (object/get @st "col") }}))'
journal=f'{{ viewerId: @entity.dsViewer, stamped: {journal_cells("@entity.dsStamped")}, deferred: {journal_cells("@entity.dsDeferred")} }}'
def same_cell(candidate, stamp):
    return f'(and (= (object/get {candidate} "store") (object/get {stamp} "store")) (= (object/get {candidate} "id") (object/get {stamp} "id")) (= (object/get {candidate} "column") (object/get {stamp} "col")))'
def queue_cell(c, deferred):
    return f'{{ store: (object/get {c} "store"), id: (object/get {c} "id"), col: (object/get {c} "column"), wasDeferred: {deferred}, i: (array/findIndex (object/get @entity.dsStores (object/get {c} "store") []) (fn r (= (object/get @r "id") (object/get {c} "id")))) }}'
restamp_queue=f'(array/concat (array/map @entity.rsJournal.stamped (fn c {queue_cell("@c", "false")})) (array/map @entity.rsJournal.deferred (fn c {queue_cell("@c", "true")})))'
first='(array/first @entity.dsStamps)'
remaining_deferred=f'(array/filter @entity.rsJournal.deferred (fn c (not {same_cell("@c", first)})))'
current_cell=f'{{ store: (object/get {first} "store"), id: (object/get {first} "id"), column: (object/get {first} "col") }}'
restamp_journal=f'(if (and @entity.rsApplied (object/get {first} "wasDeferred" false)) (object/set (object/set @entity.rsJournal "stamped" (array/append @entity.rsJournal.stamped {current_cell})) "deferred" {remaining_deferred}) @entity.rsJournal)'
def rekey_cells(cells):
    return f'(array/map {cells} (fn c (if (and (= (object/get @c "store") (object/get {first} "store")) (= (object/get @c "id") (object/get {first} "id"))) (object/set @c "id" (object/get @entity.acOut "owner")) @c)))'
rekey_journal=f'(object/set (object/set @entity.rsJournal "stamped" {rekey_cells("@entity.rsJournal.stamped")}) "deferred" {rekey_cells("@entity.rsJournal.deferred")})'
rekey_candidate=f'(if (= (object/get @r "id") (object/get {first} "id")) (object/set @r "id" (object/get @entity.acOut "owner")) @r)'
rekey_hit='(array/findIndex @rows (fn q (= (object/get @q "id") (object/get @next "id"))))'
rekey_merge='(if (< @hit 0) (array/append @rows @next) (array/map (array/range (array/len @rows)) (fn i (if (= @i @hit) @next (array/nth @rows @i)))))'
rekey_rows=f'(array/reduce (object/get @entity.dsStores (object/get {first} "store") []) [] (fn rows r (let ((next {rekey_candidate})) (let ((hit {rekey_hit})) {rekey_merge}))))'

set_rows=f'(array/map (object/get @entity.dsStores (object/get {first} "store") []) (fn r (if (= (object/get @r "id") (object/get {first} "id")) (object/set @r (object/get {first} "col") (object/get @entity.acOut "owner")) @r)))'
restamp_stores=f'(if @entity.rsWrite (object/set @entity.dsStores (object/get {first} "store") (if (= (object/get {first} "col") "id") {rekey_rows} {set_rows})) @entity.dsStores)'
restamp_target=f'(if (object/get (array/find @entity.dsRegsAll (fn r (= (object/get @r "store") (object/get {first} "store")))) "runtime" false) {{ kind: "singleton" }} {{ kind: "key", key: (object/get {first} "id") }})'
restamp_change=f'{{ kind: (if (= (object/get {first} "col") "id") "rekey" "set"), store: (object/get {first} "store"), id: (object/get {first} "id"), column: (object/get {first} "col"), ownerId: (object/get @entity.acOut "owner"), target: {restamp_target} }}'
refreshed_id=f'(if (and @entity.rsWrite (= (object/get {first} "col") "id") (= (object/get @c "store") (object/get {first} "store")) (= (object/get @c "id") (object/get {first} "id"))) (object/get @entity.acOut "owner") (object/get @c "id"))'
restamp_remaining=f'(array/map (array/drop @entity.dsStamps 1) (fn c (let ((id {refreshed_id})) (object/set (object/set @c "id" @id) "i" (array/findIndex (object/get @entity.dsStores (object/get @c "store") []) (fn r (= (object/get @r "id") @id)))))))'
owner_link_write = relation_write('@rw', '(object/get @lk "field")', '(object/get @lk "scalar")',
    f'(array/nth @el {S.modlen("@j","@el")})',
    f'(array/unique (array/map (array/range (math/min (array/len @el) (+ 2 (math/mod @j 2)))) (fn o (array/nth @el {S.modlen("(+ @j @o)","@el")}))))')
def entity_of(store):
    return f'(array/reduce @entity.dsRegsAll "" (fn acc r (if (= (object/get @r "store") {store}) (object/get @r "label") @acc)))'
SEED_OPS=('(array/flatten (array/map (object/keys @entity.dsStores) (fn sc (let ((se '+entity_of('@sc')+')) '
          '(array/map (object/get @entity.dsStores @sc []) (fn sr ["create" @se @sr]))))))')
def owner_cols_of(store):
    return f'(array/reduce @entity.dsRegsAll [] (fn acc r (if (= (object/get @r "store") {store}) (array/concat @acc (object/get @r "ownerCols")) @acc)))'
def creates_checked(store):
    return f'(array/some @entity.dsRegsAll (fn r (and (= (object/get @r "store") {store}) (object/get @r "hasCreate"))))'
def policy_entity_of(store):
    return f'(array/reduce @entity.dsRegsAll "" (fn acc r (if (and (= @acc "") (= (object/get @r "store") {store})) (object/get @r "policyEntity") @acc)))'
ID_ROWS='(object/get @entity.dsStores @entity.dsIdStore [])'
SID=lambda x: '(str/template "{{id}}" { id: '+x+' })'
ID_IDS='(array/map '+ID_ROWS+' (fn r '+SID('(object/get @r "id")')+'))'
row_owner=('(if (= @sc @entity.dsIdStore) '+SID('(object/get @sr "id")')+' '
           '(array/reduce @cols "" (fn acc c (if (and (= @acc "") (validate/string (object/get @sr @c "")) (array/includes @ids (object/get @sr @c ""))) (object/get @sr @c "") @acc))))')
WRITE_ROWS=('(let ((ids '+ID_IDS+')) (array/flatten (array/map (object/keys @entity.dsStores) (fn sc (let ((se '+entity_of('@sc')+') (pe '+policy_entity_of('@sc')+') (cols '+owner_cols_of('@sc')+') (checked '+creates_checked('@sc')+')) '
           '(array/map (array/range (array/len (object/get @entity.dsStores @sc []))) (fn si (let ((sr (array/nth (object/get @entity.dsStores @sc []) @si))) { store: @sc, i: @si, label: @se, entity: @pe, owner: '+row_owner+', checked: @checked }))))))))')
WR='(array/nth @entity.dsWriteAll @entity.dsWriteAt)'
WRITER_PLAN=('(let ((wr '+WR+')) (let ((row (array/nth (object/get @entity.dsStores (object/get @wr "store") []) (object/get @wr "i"))) (idrows '+ID_ROWS+') (own (object/get @wr "owner"))) '
             '(let ((cands (array/concat (if (= @own "") [""] [@own, ""]) (array/filter (array/map @idrows (fn t '+SID('(object/get @t "id")')+')) (fn x (!= @x @own)))))) '
             '{ queue: (array/map @cands (fn c { entity: (object/get @wr "entity"), action: "create", row: @row, viewer: (if (= @c "") @user (array/find @idrows (fn t (= '+SID('(object/get @t "id")')+' @c)))) })), n: (array/len @cands), read: false, rel: false, ids: @cands, viewer: false })))')
WRITER_OF='(let ((k (array/findIndex @entity.acAnswers (fn a @a)))) (if (>= @k 0) (array/nth @entity.acIds @k) ""))'
OWNED_OPS=('(array/map (array/range (array/len @entity.dsWriteAll)) (fn k (let ((wr (array/nth @entity.dsWriteAll @k))) '
           '{ owner: (array/nth @entity.dsWriters @k), op: ["create" (object/get @wr "label") (array/nth (object/get @entity.dsStores (object/get @wr "store") []) (object/get @wr "i"))] })))')
WRITE_GROUPS=('(let ((noGroups : [SeedGroup] [])) (array/reduce '+OWNED_OPS+' @noGroups (fn gs p (let ((n (array/len @gs))) '
              '(if (and (> @n 0) (= (object/get (array/nth @gs (- @n 1)) "owner") (object/get @p "owner")) (< (array/len (object/get (array/nth @gs (- @n 1)) "ops")) @config.writeChunk)) '
              '(array/append (array/take @gs (- @n 1)) (object/set (array/nth @gs (- @n 1)) "ops" (array/append (object/get (array/nth @gs (- @n 1)) "ops") (object/get @p "op")))) '
              '(array/append @gs { owner: (object/get @p "owner"), ops: [(object/get @p "op")] }))))))')
WRITES=('(let ((idrows '+ID_ROWS+')) (array/map '+WRITE_GROUPS+' (fn g { viewer: (if (= (object/get @g "owner") "") null (array/find @idrows (fn r (= '+SID('(object/get @r "id")')+' (object/get @g "owner"))))), ops: (object/get @g "ops") })))')
BATCH_STEP=(store_step.replace('(let ((reg (array/first @entity.dsRegs)))','(let ((reg @brg))')
    .replace('@entity.dsStores','@bst').replace('@entity.rng','@bs').replace('@entity.dsMinted','@bmi'))
assert '@entity.dsStores' not in BATCH_STEP and '(let ((reg @brg))' in BATCH_STEP
STORE_BATCH=('(let ((start : DsBatch { stores: @entity.dsStores, s: @entity.rng, minted: @entity.dsMinted, stamps: [], used: 0, halt: false, bad: false })) '
             '(array/reduce @entity.dsRegs @start (fn bacc brg (if (object/get @bacc "halt") @bacc '
             '(let ((bst (object/get @bacc "stores")) (bs (object/get @bacc "s")) (bmi (object/get @bacc "minted"))) '
             '(let ((bo '+BATCH_STEP+')) '
             '{ stores: (object/get @bo "stores"), s: (object/get @bo "s"), minted: (object/get @bo "minted"), stamps: (object/get @bo "stamps"), used: (+ (object/get @bacc "used") 1), halt: (or (object/get @bo "bad") (> (array/len (object/get @bo "stamps")) 0)), bad: (object/get @bo "bad") }))))))')
RESTAMP_GROUPS=('(array/flatten (array/map @entity.rsChanges (fn ch (let ((ce '+entity_of('(object/get @ch "store")')+')) '
             '(let ((one : [[[MockValue?]]] (if (= (object/get @ch "kind") "set") '
             '(let ((cell (object/set @blank (object/get @ch "column") (object/get @ch "ownerId")))) (if (= @cell null) [] [[["update" @ce (object/get @ch "id") @cell]]])) '
             '[(array/concat [["delete" @ce (object/get @ch "id")]] (if (array/some (object/get @entity.rsStores (object/get @ch "store") []) (fn rw (= (object/get @rw "id") (object/get @ch "ownerId")))) [["delete" @ce (object/get @ch "ownerId")]] []) [["create" @ce (array/reduce (object/get @entity.dsStores (object/get @ch "store") []) @blank (fn acc rw (if (= (object/get @rw "id") (object/get @ch "ownerId")) @rw @acc)))]])]))) @one)))))')
STORE_AFTER=f'''      DS_STAMP -> ready when (= (array/len @entity.dsStamps) 0)
        (if (= @entity.dsMode "restamp") (let ((blank : SampleValueMap {{}})) (let ((groups : [[[MockValue?]]] {RESTAMP_GROUPS})) (if (!= (array/len @groups) (array/len @entity.rsChanges)) (emit DS_WRITE_FAILED {{ error: "mock-seed: a restamp owner change could not be built as a row write" }}) (if (= (array/len @groups) 0) (emit DS_RESTAMPED {{ }}) (persist batch (array/flatten @groups) {{ emit: {{ success: DS_RESTAMPED, failure: DS_WRITE_FAILED }} }}))))) (emit DS_STORE {{ at: (array/len @entity.dsRegs) }}))
      DS_RESTAMPED -> ready
        (emit RESTAMP_DONE {{ journal: @entity.rsJournal, changes: @entity.rsChanges }})
      DS_STAMP -> ready when (and (> (array/len @entity.dsStamps) 0) (< (object/get (array/first @entity.dsStamps) "i") 0))
        (set @entity.rsJournal (if (object/get (array/first @entity.dsStamps) "wasDeferred" false) (object/set @entity.rsJournal "deferred" {remaining_deferred}) @entity.rsJournal))
        (set @entity.dsStamps (array/drop @entity.dsStamps 1))
        (emit DS_STAMP {{ at: (array/len @entity.dsStamps) }})
      DS_STAMP -> ready when (and (> (array/len @entity.dsStamps) 0) (>= (object/get (array/first @entity.dsStamps) "i") 0) (> (array/len {stamp_bad}) 0))
{reject_ids(stamp_bad)}
      DS_STAMP -> ready when (and (> (array/len @entity.dsStamps) 0) (>= (object/get (array/first @entity.dsStamps) "i") 0) (= (array/len {stamp_bad}) 0))
        (let ((plan {stamp_plan}))
          (if (!= (array/len (object/get @plan "queue")) (object/get @plan "planned"))
            (emit DS_WRITE_FAILED {{ error: "mock-seed: an owner column name cannot be a record key" }})
            (do
              (set @entity.acPlan @plan)
              (set @entity.acQueue (object/get @plan "queue"))
              (set @entity.acN (object/get @plan "n"))
              (set @entity.acRead (object/get @plan "read"))
              (set @entity.acRel (object/get @plan "rel"))
              (set @entity.acIds (object/get @plan "ids"))
              (set @entity.acViewer (object/get @plan "viewer"))
              (set @entity.acAnswers [])
              (set @entity.acPurpose "stamp")
              (emit AC_ASK {{ at: (array/len @entity.acQueue) }}))))
      DS_OLINK -> ready when (= (array/len @entity.dsOlinks) 0)
        (emit DS_PROJS {{ at: 0 }})
      DS_OLINK -> ready when (and (> (array/len @entity.dsOlinks) 0) (> (array/len {olink_bad}) 0))
{reject_ids(olink_bad)}
      DS_OLINK -> ready when (and (> (array/len @entity.dsOlinks) 0) (= (array/len {olink_bad}) 0) (object/has @entity.dsOlinkCache {OLINK_KEY}))
        (set @entity.acOut (object/get @entity.dsOlinkCache {OLINK_KEY}))
        (set @entity.dsStores (let ((lk (array/first @entity.dsOlinks))) (if (> (array/len (object/get @entity.acOut "elig")) 0) (object/set @entity.dsStores (object/get @lk "store") (array/map (array/range (array/len (object/get @entity.dsStores (object/get @lk "store") []))) (fn j (let ((rw (array/nth (object/get @entity.dsStores (object/get @lk "store") []) @j)) (el (object/get @entity.acOut "elig"))) (if (= @j (object/get @lk "i")) {owner_link_write} @rw))))) @entity.dsStores)))
        (set @entity.dsOlinks (array/drop @entity.dsOlinks 1))
        (set @entity.dsWork (+ @entity.dsWork 3))
        (if (>= @entity.dsWork @config.stepsPerDispatch) (do (set @entity.dsNext "olink") (program/dispatch "DS_RESUME" {{ }} {{ viewer: null }} {{ key: "mock-seed-resume", emit: {{ success: DS_RESUMED, failure: DS_WRITE_FAILED }} }})) (emit DS_OLINK {{ at: (array/len @entity.dsOlinks) }}))
      DS_OLINK -> ready when (and (> (array/len @entity.dsOlinks) 0) (= (array/len {olink_bad}) 0) (not (object/has @entity.dsOlinkCache {OLINK_KEY})))
        (let ((plan {olink_plan}))
          (if (!= (array/len (object/get @plan "queue")) (object/get @plan "planned"))
            (emit DS_WRITE_FAILED {{ error: "mock-seed: an owner column name cannot be a record key" }})
            (do
              (set @entity.acPlan @plan)
              (set @entity.acQueue (object/get @plan "queue"))
              (set @entity.acN (object/get @plan "n"))
              (set @entity.acRead (object/get @plan "read"))
              (set @entity.acRel (object/get @plan "rel"))
              (set @entity.acIds (object/get @plan "ids"))
              (set @entity.acViewer (object/get @plan "viewer"))
              (set @entity.acAnswers [])
              (set @entity.acPurpose "link")
              (emit AC_ASK {{ at: (array/len @entity.acQueue) }}))))
      AC_ASK -> ready when (> (array/len @entity.acQueue) 0)
        (access-check {{ entity: (object/get (array/first @entity.acQueue) "entity"), action: (object/get (array/first @entity.acQueue) "action"), row: (object/get (array/first @entity.acQueue) "row"), viewer: (object/get (array/first @entity.acQueue) "viewer") }} {{ emit: {{ success: AC_ANSWER, failure: AC_FAILED }} }})
      AC_ASK -> ready when (= (array/len @entity.acQueue) 0)
        (emit AC_DONE {{ at: 0 }})
      AC_ANSWER -> ready
        (set @entity.dsWork (+ @entity.dsWork 2))
        (set @entity.acAnswers (array/append @entity.acAnswers ?allowed))
        (set @entity.acQueue (if (and (= @entity.acPurpose "writer") ?allowed) [] (array/drop @entity.acQueue 1)))
        (emit AC_ASK {{ at: (array/len @entity.acQueue) }})
      AC_FAILED -> ready
        (set @entity.dsWork (+ @entity.dsWork 2))
        (set @entity.acAnswers (array/append @entity.acAnswers false))
        (set @entity.acQueue (array/drop @entity.acQueue 1))
        (emit ACCESS_CHECK_FAILED {{ error: ?error }})
        (emit AC_ASK {{ at: (array/len @entity.acQueue) }})
      AC_DONE -> ready when (and (= @entity.acPurpose "stamp") (= @entity.dsMode "seed"))
        (set @entity.acOut {decode})
        (set @entity.dsStamped (if (object/get @entity.acOut "hit") (array/append @entity.dsStamped (array/first @entity.dsStamps)) @entity.dsStamped))
        (set @entity.dsDeferred (if (object/get @entity.acOut "hit") @entity.dsDeferred (array/append @entity.dsDeferred (array/first @entity.dsStamps))))
        (set @entity.dsStores (let ((st (array/first @entity.dsStamps))) (if (object/get @entity.acOut "hit") (object/set @entity.dsStores (object/get @st "store") (array/map (array/range (array/len (object/get @entity.dsStores (object/get @st "store") []))) (fn j (let ((rw (array/nth (object/get @entity.dsStores (object/get @st "store") []) @j))) (if (= @j (object/get @st "i")) (object/set @rw (object/get @st "col") (object/get @entity.acOut "owner")) @rw))))) @entity.dsStores)))
        (set @entity.dsStamps (array/drop @entity.dsStamps 1))
        (set @entity.dsWork (+ @entity.dsWork 3))
        (if (>= @entity.dsWork @config.stepsPerDispatch) (do (set @entity.dsNext "stamp") (program/dispatch "DS_RESUME" {{ }} {{ viewer: null }} {{ key: "mock-seed-resume", emit: {{ success: DS_RESUMED, failure: DS_WRITE_FAILED }} }})) (emit DS_STAMP {{ at: (array/len @entity.dsStamps) }}))
      AC_DONE -> ready when (and (= @entity.acPurpose "stamp") (= @entity.dsMode "restamp"))
        (set @entity.acOut {decode})
        (set @entity.rsApplied (if (object/get (array/first @entity.dsStamps) "wasDeferred" false) (object/get @entity.acOut "viewer") (object/get @entity.acOut "hit")))
        (set @entity.rsWrite (and @entity.rsApplied (or (!= (object/get (array/first @entity.dsStamps) "col") "id") (!= (object/get (array/first @entity.dsStamps) "id") (object/get @entity.acOut "owner")))))
        (set @entity.dsStores {restamp_stores})
        (set @entity.rsJournal {restamp_journal})
        (set @entity.rsJournal (if (and @entity.rsWrite (= (object/get (array/first @entity.dsStamps) "col") "id")) {rekey_journal} @entity.rsJournal))
        (set @entity.rsChanges (if @entity.rsWrite (array/append @entity.rsChanges {restamp_change}) @entity.rsChanges))
        (set @entity.dsStamps {restamp_remaining})
        (emit DS_STAMP {{ at: (array/len @entity.dsStamps) }})
      AC_DONE -> ready when (= @entity.acPurpose "link")
        (set @entity.acOut {decode})
        (set @entity.dsOlinkCache (if {OLINK_SHARED} (object/set @entity.dsOlinkCache {OLINK_KEY} @entity.acOut) @entity.dsOlinkCache))
        (set @entity.dsStores (let ((lk (array/first @entity.dsOlinks))) (if (> (array/len (object/get @entity.acOut "elig")) 0) (object/set @entity.dsStores (object/get @lk "store") (array/map (array/range (array/len (object/get @entity.dsStores (object/get @lk "store") []))) (fn j (let ((rw (array/nth (object/get @entity.dsStores (object/get @lk "store") []) @j)) (el (object/get @entity.acOut "elig"))) (if (= @j (object/get @lk "i")) {owner_link_write} @rw))))) @entity.dsStores)))
        (set @entity.dsOlinks (array/drop @entity.dsOlinks 1))
        (set @entity.dsWork (+ @entity.dsWork 3))
        (if (>= @entity.dsWork @config.stepsPerDispatch) (do (set @entity.dsNext "olink") (program/dispatch "DS_RESUME" {{ }} {{ viewer: null }} {{ key: "mock-seed-resume", emit: {{ success: DS_RESUMED, failure: DS_WRITE_FAILED }} }})) (emit DS_OLINK {{ at: (array/len @entity.dsOlinks) }}))
      AC_DONE -> ready when (= @entity.acPurpose "writer")
        (set @entity.dsWriters (array/append @entity.dsWriters {WRITER_OF}))
        (set @entity.dsWriteAt (+ @entity.dsWriteAt 1))
        (set @entity.dsWork (+ @entity.dsWork 3))
        (if (>= @entity.dsWork @config.stepsPerDispatch) (do (set @entity.dsNext "writer") (program/dispatch "DS_RESUME" {{ }} {{ viewer: null }} {{ key: "mock-seed-resume", emit: {{ success: DS_RESUMED, failure: DS_WRITE_FAILED }} }})) (emit DS_WRITER {{ at: @entity.dsWriteAt }}))
      DS_PROJS -> ready
        (set @entity.dsStores {projs_only})
        (set @entity.dsWriteAll {WRITE_ROWS})
        (set @entity.dsRegsAll [])
        (set @entity.dsLinks [])
        (set @entity.dsProjs [])
        (set @entity.dsWriteAt 0)
        (set @entity.dsWriters [])
        (emit DS_WRITER {{ at: 0 }})
      DS_WRITER -> ready when (>= @entity.dsWriteAt (array/len @entity.dsWriteAll))
        (set @entity.dsWrites {WRITES})
        (emit DS_WRITE_NEXT {{ at: (array/len @entity.dsWrites) }})
      DS_WRITER -> ready when (and (< @entity.dsWriteAt (array/len @entity.dsWriteAll)) (not (object/get (array/nth @entity.dsWriteAll @entity.dsWriteAt) "checked")))
        (let ((open (array/findIndex (array/drop @entity.dsWriteAll @entity.dsWriteAt) (fn w (object/get @w "checked")))))
          (let ((n (if (< @open 0) (- (array/len @entity.dsWriteAll) @entity.dsWriteAt) @open)))
            (do
            (set @entity.dsWriters (array/concat @entity.dsWriters (array/map (array/range @n) (fn k ""))))
            (set @entity.dsWriteAt (+ @entity.dsWriteAt @n))
            (emit DS_WRITER {{ at: @entity.dsWriteAt }}))))
      DS_WRITER -> ready when (and (< @entity.dsWriteAt (array/len @entity.dsWriteAll)) (object/get (array/nth @entity.dsWriteAll @entity.dsWriteAt) "checked"))
        (set @entity.acPlan {WRITER_PLAN})
        (set @entity.acQueue (object/get @entity.acPlan "queue"))
        (set @entity.acN (object/get @entity.acPlan "n"))
        (set @entity.acRead false)
        (set @entity.acRel false)
        (set @entity.acIds (object/get @entity.acPlan "ids"))
        (set @entity.acViewer false)
        (set @entity.acAnswers [])
        (set @entity.acPurpose "writer")
        (emit AC_ASK {{ at: (array/len @entity.acQueue) }})
      DS_WRITE_NEXT -> ready when (= (array/len @entity.dsWrites) 0)
        (emit DS_WRITTEN {{ }})
      DS_WRITE_NEXT -> ready when (> (array/len @entity.dsWrites) 0)
        (program/dispatch "DS_WRITE_CHUNK" {{ ops: (object/get (array/first @entity.dsWrites) "ops") }} {{ viewer: (object/get (array/first @entity.dsWrites) "viewer") }} {{ key: "mock-seed-write", emit: {{ success: DS_CHUNK_DONE, failure: DS_WRITE_FAILED }} }})
      DS_CHUNK_DONE -> ready when (and (= ?result.ok true) (array/some (or ?result.emitted []) (fn e (= (object/get @e "event") "DS_CHUNK_WRITTEN"))))
        (set @entity.dsWrites (array/drop @entity.dsWrites 1))
        (emit DS_WRITE_NEXT {{ at: (array/len @entity.dsWrites) }})
      DS_CHUNK_DONE -> ready when (and (= ?result.ok true) (not (array/some (or ?result.emitted []) (fn e (= (object/get @e "event") "DS_CHUNK_WRITTEN")))))
        (emit DATASET_FAILED {{ error: (str/template "{{{{error}}}}" {{ error: (object/get (object/get (array/find (or ?result.emitted []) (fn e (= (object/get @e "event") "DS_CHUNK_REFUSED"))) "payload" {{ }}) "error" "") }}) }})
      DS_CHUNK_DONE -> ready when (!= ?result.ok true)
        (emit DS_WRITE_FAILED {{ error: (or ?result.error "the seed write was not taken") }})
      DATASET_DONE -> ready
        (set @entity.dsActive false)
      DATASET_FAILED -> ready
        (set @entity.dsActive false)
      DS_WRITE_CHUNK -> ready
        (persist batch ?ops {{ emit: {{ success: DS_CHUNK_WRITTEN, failure: DS_CHUNK_REFUSED }} }})
      DS_CHUNK_WRITTEN -> ready
      DS_CHUNK_REFUSED -> ready
      DS_RESUME -> ready
        (set @entity.dsResumes (+ @entity.dsResumes 1))
      DS_RESUMED -> ready when (and (= ?result.ok true) (= @entity.dsNext "stamp"))
        (set @entity.dsWork 0)
        (emit DS_STAMP {{ at: (array/len @entity.dsStamps) }})
      DS_RESUMED -> ready when (and (= ?result.ok true) (= @entity.dsNext "olink"))
        (set @entity.dsWork 0)
        (emit DS_OLINK {{ at: (array/len @entity.dsOlinks) }})
      DS_RESUMED -> ready when (and (= ?result.ok true) (= @entity.dsNext "writer"))
        (set @entity.dsWork 0)
        (emit DS_WRITER {{ at: @entity.dsWriteAt }})
      DS_RESUMED -> ready when (!= ?result.ok true)
        (emit DS_WRITE_FAILED {{ error: (str/concat "The seed could not continue in a dispatch of its own: " (or ?result.error "the resume was not taken")) }})
      DS_WRITE_FAILED -> ready
        (emit DATASET_FAILED {{ error: (str/concat "Seeding the mock store failed: " ?error) }})
      DS_WRITTEN -> ready
        (when @entity.dsSelf (persist upsert MockSeedMark {{ id: "seeded", seededAt: @entity.nowMs }}))
        (emit DATASET_DONE {{ stores: @entity.dsStores, journal: {journal}, defaultPersona: @config.defaultPersona }})
'''

DATASET=f'''      RESTAMP_INPUT -> ready when (not (or (= ?firstOwner true) @config.restampOnPersona))
        (emit RESTAMP_DONE {{ journal: ?journal, changes: [] }})
      RESTAMP_INPUT -> ready when (or (= ?firstOwner true) @config.restampOnPersona)
        (set @entity.dsMode "restamp")
        (set @entity.dsOwnerPairs [])
        (set @entity.dsLocale "")
        (set @entity.dsViewerRecord {{ id: "", claims: [] }})
        (set @entity.dsViewerRecord (or ?viewer @entity.dsViewerRecord))
        (set @entity.dsHasViewerRecord true)
        (set @entity.dsViewer (object/get @entity.dsViewerRecord "id"))
        (set @entity.dsStores ?stores)
        (set @entity.rsStores ?stores)
        (set @entity.rsJournal (object/set ?journal "viewerId" @entity.dsViewer))
        (set @entity.rsChanges [])
        (set @entity.dsStamps (if (or (= @entity.dsViewer "") (= @entity.dsViewer (object/get ?journal "viewerId"))) [] {restamp_queue}))
        (emit DS_PROGRAM_READ {{ result: ?program }})
      DS_MARK_FOUND -> ready
      DS_MARK_ABSENT -> ready when (and (= ?code "not-found") @entity.dsActive)
      DS_MARK_ABSENT -> ready when (and (= ?code "not-found") (not @entity.dsActive))
        (program/self {{ emit: {{ success: DS_SELF_READ, failure: DS_PROGRAM_FAILED }} }})
      DS_MARK_ABSENT -> ready when (!= ?code "not-found")
        (emit DATASET_FAILED {{ error: (str/concat "Reading the seed marker failed: " ?error) }})
      DS_SELF_READ -> ready when @entity.dsActive
      DS_SELF_READ -> ready when (not @entity.dsActive)
        (set @entity.dsActive true)
        (set @entity.dsSelf true)
        (set @entity.dsMode "seed")
        (set @entity.dsHasViewerRecord false)
        (set @entity.dsViewer "")
        (set @entity.dsCount @config.count)
        (set @entity.dsSource "")
        (set @entity.dsOwns "")
        (set @entity.dsOwnerPairs [])
        (set @entity.dsLocale "")
        (set @entity.nowMs @now)
        (set @entity.dsNowIso {iso("@now")})
        (set @entity.rng (math/mod @config.seed 4294967296))
        (set @entity.dsMinted 0)
        (set @entity.dsStores {{}})
        (set @entity.dsStamped [])
        (set @entity.dsWork 0)
        (set @entity.dsDeferred [])
        (emit DS_PROGRAM_READ {{ result: ?result }})
      DATASET_INPUT -> ready
        (set @entity.dsSelf false)
        (set @entity.dsMode "seed")
        (set @entity.dsHasViewerRecord false)
        (set @entity.dsViewer ?viewerId)
        (set @entity.dsCount (if (= ?count null) @config.count ?count))
        (set @entity.dsSource "")
        (set @entity.dsOwns "")
        (set @entity.dsOwnerPairs ?ownerPairs)
        (set @entity.dsLocale (or ?locale ""))
        (set @entity.nowMs ?nowMs)
        (set @entity.dsNowIso {iso("?nowMs")})
        (set @entity.rng (math/mod (if (= ?seed null) @config.seed ?seed) 4294967296))
        (set @entity.dsMinted 0)
        (set @entity.dsStores {{}})
        (set @entity.dsStamped [])
        (set @entity.dsWork 0)
        (set @entity.dsDeferred [])
        (emit DS_PROGRAM_READ {{ result: ?program }})
      DATASET_START -> ready
        (set @entity.dsSelf false)
        (set @entity.dsMode "seed")
        (set @entity.dsHasViewerRecord false)
        (set @entity.dsOwnerPairs [])
        (set @entity.dsLocale "")
        (set @entity.dsViewer ?viewerId)
        (set @entity.dsCount ?count)
        (set @entity.dsSource ?source)
        (set @entity.nowMs ?nowMs)
        (set @entity.dsNowIso {iso("?nowMs")})
        (set @entity.rng (math/mod ?seed 4294967296))
        (set @entity.dsMinted 0)
        (set @entity.dsStores {{}})
        (set @entity.dsStamped [])
        (set @entity.dsWork 0)
        (set @entity.dsDeferred [])
        (os/getenv "ALMADAR_PERSONA_OWNS" {{ emit: {{ success: DS_OWNS_ENV, failure: DS_OWNS_ENV_FAILED }} }})
      DS_OWNS_ENV -> ready
        (set @entity.dsOwns (object/get @payload "value" ""))
        (set @entity.dsOwnerPairs {parsed_owner_pairs})
        (program/read @entity.dsSource {{ emit: {{ success: DS_PROGRAM_READ, failure: DS_PROGRAM_FAILED }} }})
      DS_OWNS_ENV_FAILED -> ready
        (set @entity.dsOwns "")
        (set @entity.dsOwnerPairs [])
        (program/read @entity.dsSource {{ emit: {{ success: DS_PROGRAM_READ, failure: DS_PROGRAM_FAILED }} }})
      DS_PROGRAM_FAILED -> ready
        (emit DATASET_FAILED {{ error: ?error }})
      DS_PROGRAM_READ -> ready
        (set @entity.dsRegsAll {regs_expr})
        (set @entity.dsRegs @entity.dsRegsAll)
        (set @entity.dsLinks {links_expr})
        (set @entity.dsProjs {projs_expr})
        (set @entity.dsIdStore {iddef_store})
        (if (= @entity.dsMode "restamp") (emit DS_STAMP {{ at: (array/len @entity.dsStamps) }}) (emit DS_STORE {{ at: (array/len @entity.dsRegs) }}))
      DS_STORE -> ready when (= (array/len @entity.dsRegs) 0)
        (emit DS_LINKS {{ at: 0 }})
      DS_STORE -> ready when (> (array/len @entity.dsRegs) 0)
        (set @entity.dsOut {STORE_BATCH})
        (if (object/get @entity.dsOut "bad")
          (do
            (set @entity.dsOut {{ stores: {{ }}, s: 0, minted: 0, stamps: [], used: 0, halt: false, bad: false }})
            (emit DATASET_FAILED {{ error: "{S.CLOCK_FAILED}" }}))
          (do
            (set @entity.dsStores (object/get @entity.dsOut "stores"))
            (set @entity.rng (object/get @entity.dsOut "s"))
            (set @entity.dsMinted (object/get @entity.dsOut "minted"))
            (set @entity.dsStamps (object/get @entity.dsOut "stamps"))
            (set @entity.dsRegs (array/drop @entity.dsRegs (object/get @entity.dsOut "used")))
            (set @entity.dsOut {{ stores: {{ }}, s: 0, minted: 0, stamps: [], used: 0, halt: false, bad: false }})
            (emit DS_STAMP {{ at: (array/len @entity.dsStamps) }})))
      DS_LINKS -> ready
        (set @entity.dsStores {links_fold})
        (set @entity.dsOlinks {olinks_expr})
        (set @entity.dsOlinkCache {{ }})
        (set @entity.dsRegsAll (array/map @entity.dsRegsAll (fn r (object/set (object/set @r "fields" []) "instances" []))))
        (emit DS_OLINK {{ at: (array/len @entity.dsOlinks) }})
{STORE_AFTER}'''
continuations={'DS_OWNS_ENV', 'DS_OWNS_ENV_FAILED', 'DS_PROGRAM_FAILED', 'DS_PROGRAM_READ',
               'DS_STORE', 'DS_LINKS', 'DS_STAMP', 'DS_OLINK', 'DS_PROJS', 'DS_WRITTEN', 'DS_RESTAMPED', 'DS_WRITE_NEXT', 'DS_CHUNK_DONE', 'DS_RESUMED', 'DS_WRITER',
               'AC_ASK', 'AC_ANSWER', 'AC_FAILED', 'AC_DONE'}
dataset_lines=[]
for line in DATASET.splitlines():
    if line.strip().split(' ', 1)[0] in continuations and ' -> ready' in line:
        if ' when ' in line:
            head, condition=line.split(' when ', 1)
            line=head+' when (and (!= @entity.dsMode "failed") '+condition+')'
        else:
            line+=' when (!= @entity.dsMode "failed")'
    dataset_lines.append(line)
DATASET='\n'.join(dataset_lines)+'\n'
body=NEW.replace('@@DATASET@@',DATASET+DERIVE.replace('@@REGS@@',regs_expr))
def clock_gate(text):
    out=[];blk=[]
    def flush():
        if not blk: return
        idx=next((i for i,l in enumerate(blk) if l.startswith('        (set @entity.dsNowIso ')),None)
        if idx is None: out.extend(blk)
        else:
            out.extend(blk[:idx])
            m=re.match(r'        \(set @entity\.dsNowIso (.*)\)$',blk[idx]); assert m
            out.append(f'        (let ((nowIso {m.group(1)}))')
            out.append(f'          (if (= @nowIso null)')
            out.append(f'            (emit DATASET_FAILED {{ error: "{S.CLOCK_FAILED}" }})')
            out.append('            (do')
            out.append('              (set @entity.dsNowIso @nowIso)')
            out.extend('              '+l.strip() for l in blk[idx+1:])
            out.append('            )))')
        blk.clear()
    for l in text.split('\n'):
        if re.match(r'^      [A-Za-z_.]+ -> ',l): flush(); out.append(l)
        elif l.startswith('        ') : blk.append(l)
        else: flush(); out.append(l)
    flush()
    return '\n'.join(out)
body=clock_gate(body)
body=body.replace('      CORPUS_IS -> ready','      INIT -> ready\n        (set @entity.dsBoot @config.seedOnInit)\n        (emit CORPUS_ASK { })\n      CORPUS_IS -> ready',1)
# ---- assemble the file
w=lambda n,f,d,syn: f'      {n} {{ {f} }}\n        @description "{d}"\n        @synonyms "{syn}"\n'
L=''
L+=w('WALK_START','spec : MockFieldSpec!  name : string!  entityName : string!  index : number!  seeded : boolean!  runtime : boolean!  nowMs : number!','Sample one field by walking its declared field tree with the seeded stream or the row ordinal.','sample field, field tree')
L+=w('WALK_ROW','fields : [MockFieldSpec]!  entityName : string  index : number  seeded : boolean  identity : boolean  runtime : boolean  nowMs : number','Sample one row of an entity fields: reserved keys skipped, optional undefaulted fields left unset on even seeded rows.','sample row')
L+=w('SAMPLE_ROWS','fields : [MockFieldSpec]!  name : string!  count : number!  runtime : boolean!  identity : boolean!','Sample an entity rows by the index strategy: one row for a runtime singleton, else count rows, each with its Name-n id.','sample rows, mock rows')
L+=w('ROWS_NEXT','at : number','Sample the next row.','next row')
L+=w('ROW_WALKED','row : Map string MockValue?','Internal: a declared row root completed the shared assembler.','row sampled')
L+=w('SEED_STREAM','seed : number!  nowMs : number!','Start a store stream: reset it to a seed and the clock the stamps and relative dates draw against.','start stream')
L+=w('SEED_ROW','fields : [MockFieldSpec]!  label : string!  n : number!  index : number!  identity : boolean!  runtime : boolean!  nowMs : number!','Seed one row of a mock store the way the kernel does: the Label Id n id, createdAt and updatedAt drawn first from the stream, then the seeded fields.','seed row, mock store row')
L+=w('RESTAMP_INPUT','program : SeedProgram!  stores : Map string [Map string MockValue?]!  journal : SeedOwnerJournal!  viewer : Viewer  firstOwner : boolean','Restamp only retained seed-owner cells against current rows and the full current viewer, retaining legacy fallback and rekey behavior.','restamp seed owners, switch seed persona')
L+=w('DATASET_INPUT','program : SeedProgram!  count : number  seed : number  nowMs : number!  viewerId : string!  ownerPairs : [SeedOwnerPair]!  locale : string','Seed an already-resolved program with explicit owner pairs and optional locale, without reading program text or environment variables.','seed resolved dataset, embedded mock dataset')
L+=w('DATASET_START','source : string!  count : number!  seed : number!  nowMs : number!  viewerId : string!','Seed a whole mock dataset from a program the way the kernel does: read the program, derive the store order, owner columns and relation links from it, seed the identity store first, then each store with stamps drawn from one stream, owner columns stamped for the viewer, later registrants backfilled, and relations and projected fields linked.','seed dataset, mock dataset')
L+=w('DS_OWNS_ENV','value : string','The ALMADAR_PERSONA_OWNS value.','owner env')
L+=w('DS_OWNS_ENV_FAILED','error : string','The owner environment variable could not be read.','owner env failed')
L+=w('DS_PROGRAM_READ','result : SeedProgram','The program lowered by program/read.','program read')
L+=w('DS_PROGRAM_FAILED','error : string','The program could not be read.','program failed')
L+=w('DS_STORE','at : number','Run the next store registration.','next store')
L+=w('DS_LINKS','at : number','Fill the relation links and projected fields.','links')
L+=w('DERIVE_OWNERS','result : SeedProgram!','Derive the owner columns of a lowered program: identity-typed relations, a self-identity id, columns an update, delete or read policy compares to the viewer id, and same-collection siblings by name.','owner columns, owner fields')
L+=w('DS_STAMP','at : number','Stamp the next owner column the access checks decide.','owner stamp')
L+=w('DS_OLINK','at : number','Fill the next owner relation the access checks decide.','owner link')
L+=w('DS_PROJS','at : number','Fill the projected fields.','projections')
L+=w('DS_WRITTEN','','The seeded rows were written through the kernel.','dataset written')
L+=w('DS_WRITER','at : number','Find the writer of the next seeded row: rows whose entity declares no create policy are written as the asking viewer; otherwise the owner when the create policy admits it, else the asking viewer, else the first admitted identity.','seed writer')
L+=w('DS_WRITE_NEXT','at : number','Write the next owner chunk of the seeded rows.','next seed write')
L+=w('DS_CHUNK_DONE','result : SeedDispatchOutcome!  text : string  key : string','An owner chunk dispatch answered: taken, or refused with its error.','seed chunk written')
L+=w('DS_RESUME','','Internal: a no-op dispatch of its own, so a long seed continues under a fresh step budget.','seed resume')
L+=w('DS_RESUMED','result : SeedDispatchOutcome!  text : string  key : string','The seed resume dispatch answered; the seed continues where it stopped.','seed resumed')
L+=w('DS_CHUNK_WRITTEN','','Internal: the owner chunk was written; the asking dispatch reads it from the dispatch answer.','seed chunk taken')
L+=w('DS_CHUNK_REFUSED','error : string','Internal: the owner chunk was refused; the asking dispatch reads the error from the dispatch answer.','seed chunk refused')
L+=w('DS_WRITE_CHUNK','ops : [[MockValue?]]!','Write one owner chunk of seeded rows, dispatched as that owner.','seed chunk')
L+=w('DS_RESTAMPED','','The owner changes were written through the kernel.','restamp written')
L+=w('DS_MARK_FOUND','data : MockSeedMark!','The seed marker exists: the app was seeded before.','seed marker found')
L+=w('DS_MARK_ABSENT','error : string  code : string','No seed marker (not-found), or the store failed.','seed marker absent')
L+=w('DS_SELF_READ','result : SeedProgram','The running app program, read by program/self.','self program read')
L+=w('DS_WRITE_FAILED','error : string','Writing the seeded rows or owner changes failed.','seed write failed')
L+=w('AC_ASK','at : number','Ask the next access check.','access ask')
L+=w('AC_FAILED','error : string','An access check could not be evaluated, which counts as denied and is reported.','access failed')
L+=w('AC_ANSWER','allowed : boolean','An access check was answered: allowed or denied.','access verdict')
L+=w('AC_DONE','at : number','Every queued access check was answered.','access done')
L+=w('CORPUS_IS','words : [string]','The stream word corpus.','corpus')
E=''
def ext(n,fields,desc,tier='domain'):
    return f'      {n} -> external {{\n'+''.join(f'        {f}\n' for f in fields)+f'      }}\n        @description "{desc}"\n        @tier "{tier}"\n'
E+=ext('WALKED',['cells : [MockWalkCell]','value : MockValue?'],'A field or row walk finished: the sampled cells in pre-order and the assembled value.')
E+=ext('ROWS_DONE',['rows : [Map string MockValue?]'],'The sampled rows of an entity, each with its Name-n id.')
E+='      ROW_WALKED -> internal { row : Map string MockValue? }\n        @description "A declared row root assembled once for the row collection callback."\n        @tier "internal"\n'
E+=ext('SEED_ROW_DONE',['row : Map string MockValue?'],'A seeded store row: its Name Id n id, created and updated stamps drawn from the stream, then its fields.')
E+=ext('STREAM_SEEDED',['seed : number','nowMs : number'],'The stream was reset to a seed and clock.')
E+=ext('RESTAMP_DONE',['journal : SeedOwnerJournal!', 'changes : [SeedOwnerChange]!'],'The updated owner journal and ordered owner-cell writes or row-key moves, each with an explicit row target (singleton for a runtime entity, else the changed row key), with no reseeding.')
E+=ext('DATASET_DONE',['stores : Map string [Map string MockValue?]', 'journal : SeedOwnerJournal!', 'defaultPersona : string'],'The whole seeded dataset: every store rows, identity first, owner columns stamped and relations linked.')
E+=ext('OWNERS_DERIVED',['owners : Map string [string]'],'The owner columns of each entity, by lower-case entity name.')
E+=ext('OWNERS_FAILED',['error : string'],'The owner columns could not be keyed by entity name.')
E+=''.join(f"      {n} {{ {f} }}\n        @description \"Internal: {d}\"\n        @tier \"internal\"\n" for n,f,d in [('DS_STAMP','at : number','the next owner stamp'),('DS_OLINK','at : number','the next owner link'),('DS_PROJS','at : number','the projected fields'),('DS_WRITTEN','','the seeded rows were written'),('DS_RESTAMPED','','the owner changes were written'),('DS_WRITE_FAILED','error : string','a seed write failed'),('DS_WRITE_NEXT','at : number','the next owner chunk'),('DS_CHUNK_WRITTEN','','an owner chunk was written'),('DS_CHUNK_REFUSED','error : string','an owner chunk was refused'),('DS_WRITER','at : number','the next row writer'),('DS_SELF_READ','result : SeedProgram','the running app program was read'),('DS_MARK_FOUND','data : MockSeedMark!','the seed marker exists'),('DS_MARK_ABSENT','error : string  code : string','no seed marker, or the store failed'),('AC_ASK','at : number','ask the next access check'),('AC_ANSWER','allowed : boolean','an access check verdict'),('AC_FAILED','error : string','an access check could not be evaluated'),('AC_DONE','at : number','all checks answered')])
E+=ext('ACCESS_CHECK_FAILED',['error : string'],'An owner access check failed; it was counted as a denial and the seed carried on.')
E+=ext('DATASET_FAILED',['error : string'],'The program could not be read or a consumed identity ID was not a primitive; the request stops without a success journal.')
E+='      CORPUS_ASK { }\n        @description "Internal: ask the stream for its word corpus."\n        @tier "internal"\n'
E+='      ROWS_NEXT { at : number }\n        @description "Internal: sample the next row."\n        @tier "internal"\n'
E+='      DS_STORE { at : number }\n        @description "Internal: run the next store registration."\n        @tier "internal"\n'
E+='      WALK_ROW { fields : [MockFieldSpec]!  entityName : string  index : number  seeded : boolean  identity : boolean  runtime : boolean  nowMs : number }\n        @description "Internal: sample one row of fields."\n        @tier "internal"\n'
E+='      DS_OWNS_ENV { value : string }\n        @description "Internal: the owner environment variable answered."\n        @tier "internal"\n      DS_OWNS_ENV_FAILED { error : string }\n        @description "Internal: the owner environment variable could not be read."\n        @tier "internal"\n      DS_PROGRAM_READ { result : SeedProgram }\n        @description "Internal: the program was lowered."\n        @tier "internal"\n      DS_PROGRAM_FAILED { error : string }\n        @description "Internal: the program could not be lowered."\n        @tier "internal"\n'
E+='      DS_LINKS { at : number }\n        @description "Internal: fill the relation links."\n        @tier "internal"\n'
fields='''    id : string!
    entityName : string @description "The owning entity's name." = ""
    seeded : boolean @description "Whether the seeded strategy draws values from the stream." = false
    runtime : boolean @description "Whether the sampled entity is a runtime singleton." = false
    identity : boolean @description "Whether the sampled entity is the identity roster." = false
    nowMs : number @description "Epoch milliseconds the stream relative dates and stamps are drawn against." = 0
    rng : number @description "The seeded stream generator state." = 42
    words : [string] @description "The word corpus the stream draws text from." = []
    out : WalkOut @description "The last sampler result." = { cells: [], s: 42 }
    createdMs : number @description "The seeded row creation time, epoch milliseconds." = 0
    updatedMs : number @description "The seeded row update time, epoch milliseconds." = 0
    rows : [Map string MockValue?] @description "The sampled rows so far." = []
    rowIdx : number @description "The row ordinal being sampled, from 1." = 1
    rowCount : number @description "How many rows to sample." = 0
    rowFields : [MockFieldSpec] @description "The entity declared fields." = []
    rowName : string @description "The entity name, which prefixes the row ids." = ""
    inRows : boolean @description "Whether a multi-row sample is in progress." = false
    dsSelf : boolean @description "The running seed was started by seedOnInit, so its write leaves the seed marker." = false
    dsBoot : boolean @description "seedOnInit asked for the word corpus at INIT; its answer starts the seed, so the boot seed draws text from the corpus." = false
    dsMode : string @description "The shared request lifecycle: seed, restamp or terminal failed." = "seed"
    dsHasViewerRecord : boolean = false
    dsViewerRecord : Viewer = { id: "", claims: [] }
    rsJournal : SeedOwnerJournal = { viewerId: "", stamped: [], deferred: [] }
    rsChanges : [SeedOwnerChange] = []
    rsStores : Map string [Map string MockValue?] @description "The rows each store held when the restamp began, so a rekey onto a held key replaces that row." = {}
    rsApplied : boolean = false
    rsWrite : boolean = false
    dsStamped : [DsStamp] @description "Seed-owned cells successfully stamped, indexed until final row ids are known." = []
    dsDeferred : [DsStamp] @description "Seed-owned cells denied without an eligible owner, indexed until final row ids are known." = []
    dsStamps : [DsStamp] @description "The owner columns still to stamp." = []
    dsOlinks : [DsOlink] @description "The owner relations still to fill." = []
    acQueue : [AccessReq] @description "The access checks still to ask, next first." = []
    acAnswers : [boolean] @description "The verdicts of the asked checks, in order." = []
    acPurpose : string @description "Whether the checks decide an owner stamp or an owner link." = ""
    acN : number @description "How many identity rows the checks cover." = 0
    acRead : boolean @description "Whether read-admission checks are queued." = false
    acRel : boolean @description "Whether the owner column is a relation to the identity store." = false
    acViewer : boolean @description "Whether a viewer create check is queued last." = false
    acIds : [string] @description "The identity row ids the checks cover." = []
    acPlan : AcPlan @description "The queued checks and their shape." = { queue: [], planned: 0, n: 0, read: false, rel: false, ids: [], viewer: false }
    acOut : AcOut @description "The decoded verdicts." = { hit: false, owner: "", elig: [], viewer: false }
    dsSource : string @description "The program text the dataset is derived from." = ""
    dsOwnerPairs : [SeedOwnerPair] @description "Explicit entity and owner-column pairs, or parsed environment pairs." = []
    dsLocale : string @description "The locale selecting authored instances, or empty for defaults." = ""
    dsOwns : string @description "The ALMADAR_PERSONA_OWNS pairs." = ""
    dsRegsAll : [DatasetReg] @description "Every store registration derived from the program, in seed order." = []
    dsRegs : [DatasetReg] @description "The store registrations still to run, next first." = []
    dsLinks : [DatasetLink] @description "The relation links to fill." = []
    dsProjs : [DatasetProj] @description "The projected fields to fill." = []
    dsStores : Map string [Map string MockValue?] @description "The rows of each store key." = {}
    dsOut : DsBatch @description "The last store batch: the registrations run in one step until one produced owner stamps; emptied once read." = { stores: {}, s: 0, minted: 0, stamps: [], used: 0, halt: false, bad: false }
    dsOlinkCache : Map string AcOut @description "Owner-link verdicts by store and field, kept only where the read and create policies read no row field but that one and no binding but @user." = {}
    dsActive : boolean @description "A boot seed is running: every page mount runs INIT, and a second run started before the first writes its marker would race it." = false
    dsWork : number @description "Cascade steps the seed has spent since it last continued in a dispatch of its own." = 0
    dsNext : string @description "Where the seed continues after its resume dispatch answers: stamp or olink." = ""
    dsResumes : number @description "How many resume dispatches the seed has made." = 0
    dsWriteAll : [SeedWriteRow] @description "Every seeded row in write order, with the policy entity and owner its writer is chosen by." = []
    dsWriteAt : number @description "The seeded row whose writer is being chosen." = 0
    dsWriters : [string] @description "The chosen writer of each seeded row so far, an identity row id, or empty for the asking viewer." = []
    dsWrites : [SeedWrite] @description "The owner chunks of the seeded rows still to write, next first; each runs as its owner's identity row, or as the asking viewer when no identity row owns it." = []
    dsViewer : string @description "The viewer id owner columns are stamped for, or empty." = ""
    dsIdStore : string @description "The store key of the identity entity." = ""
    dsCount : number @description "The seed count the host named." = 0
    dsMinted : number @description "Ids minted so far for id-less authored instances." = 0
    dsNowIso : string @description "The clock as an ISO timestamp, for authored instances." = ""
'''
head='''app std-mock-seed [
  version: "1.0.0",
  env: ["ALMADAR_PERSONA_OWNS"],
  description: "std-mock-seed — mock rows from declared fields, as pure expressions over a stack machine. WALK_START samples one field by walking its declared field tree (arrays, objects, tuples, unions), WALK_ROW and SAMPLE_ROWS sample rows, SEED_ROW seeds a store row with its Name Id n id and created and updated stamps drawn from the stream, and DATASET_INPUT seeds an already-resolved program with explicit owner pairs and optional locale while DATASET_START reads a source program: it reads the program, derives the store order, owner columns, relation links and projected fields, seeds the identity store first, owner-stamps the viewer, backfills later registrants of a store and links relations, then writes the rows in writer chunks: each chunk is a program/dispatch to its own DS_WRITE_CHUNK as its writer, so the app's own policies admit or refuse every row and a refusal fails the seed. A row whose entity declares no create policy is written as the asking viewer; otherwise its writer is the first of its owner (an identity row owns itself), the asking viewer and each identity row that the create policy admits. The index strategy derives a value from the row ordinal alone; the seeded strategy threads one linear congruential generator state (the std-mock-random stream) through the walk, so the draw order is the walk order. Gates in order: an intrinsic field takes its default or is omitted, a default is honored where it is a claim about every row, a declared mock is rotated by row or typed, a projected field is a placeholder, a vocabulary rotates one-based, then the type."
]
;; Generated by spec/dev/mock-seed.gen/gen_atom.py; regenerate, never hand-edit.
uses Spec from "almadar-std/mock-seed"
uses Rand from "std/behaviors/std-mock-random"

'''
types='''type Expr = string | number | boolean | [Expr] | Map string Expr
type SeedOwnerPair = { entity : string!, column : string! }
type SeedOwnerCell = { store : string!, id : string!, column : string! }
type SeedOwnerJournal = { viewerId : string!, stamped : [SeedOwnerCell]!, deferred : [SeedOwnerCell]! }
type SingletonTarget = { kind : "singleton" }
type KeyTarget = { kind : "key", key : string! }
type RowTarget = SingletonTarget | KeyTarget
type SeedOwnerChange = { kind : "set" | "rekey", store : string!, id : string!, column : string!, ownerId : string!, target : RowTarget! }
type SeedEntity = { name : string!, persistence : string, collection : string, identity : boolean, browser : boolean, seedMock : boolean, fields : [SeedField], instances : [Map string MockValue?], localeInstances : Map string [Map string MockValue?], read_policy : Expr, create_policy : Expr, update_policy : Expr, delete_policy : Expr }
type SeedOrbital = { entity : SeedEntity!, auxiliaryEntities : [SeedEntity] }
type SeedProgram = { orbitals : [SeedOrbital] }
type MockValue = string | number | boolean | [MockValue?] | Map string MockValue?
type SampleValueMap = Map string MockValue?
type MockRelation = { entity : string, cardinality : string }
type MockProjection = { type : string!, field : string }
type SeedProjection = { type : string!, field : string! }
type MockFieldSpec = { name : string, type : string!, values : [string], mock : string, default : MockValue?, intrinsic : boolean, required : boolean, relation : MockRelation, projectedFrom : MockProjection, items : MockFieldSpec, properties : Map string MockFieldSpec, slots : [MockFieldSpec] }
type SeedField = { name : string!, type : string!, values : [string], mock : string, default : MockValue?, intrinsic : boolean, required : boolean, relation : MockRelation, projectedFrom : MockProjection, items : MockFieldSpec, properties : Map string MockFieldSpec, slots : [MockFieldSpec] }
type MockWalkCell = { path : string!, kind : string!, text : string?, num : number, url : string, mime : string, kids : [string], keys : [string], val : MockValue? }
type WalkOut = { cells : [MockWalkCell], s : number, value : MockValue? }
type SeedEmitted = { event : string!, payload : Map string MockValue? }
type SeedDispatchOutcome = { ok : boolean!, error : string, emitted : [SeedEmitted] }
type SeedWriteRow = { store : string!, i : number!, label : string!, entity : string!, owner : string!, checked : boolean! }
type SeedGroup = { owner : string!, ops : [[MockValue?]]! }
type SeedWrite = { viewer : (Map string MockValue?)?, ops : [[MockValue?]]! }
type DsStamp = { store : string!, i : number!, col : string!, id : string, wasDeferred : boolean }
type DsOlink = { store : string!, field : string!, i : number!, target : string!, scalar : boolean! }
type AccessReq = { entity : string!, action : string!, row : Map string MockValue?, viewer : Map string MockValue? }
type AcPlan = { queue : [AccessReq], planned : number, n : number, read : boolean, rel : boolean, ids : [string], viewer : boolean }
type AcOut = { hit : boolean!, owner : string!, elig : [string]!, viewer : boolean! }
type DsBatch = { stores : Map string [Map string MockValue?]!, s : number!, minted : number!, stamps : [DsStamp]!, used : number!, halt : boolean!, bad : boolean! }
type DatasetReg = { label : string!, store : string!, fields : [SeedField]!, identity : boolean!, runtime : boolean!, seeds : boolean!, ownerCols : [string]!, policyEntity : string!, hasRead : boolean!, hasCreate : boolean!, policyRefs : [string]!, instances : [Map string MockValue?]! }
type StorePolicy = { name : string!, hasRead : boolean!, hasCreate : boolean!, refs : [string]! }
type DatasetLink = { store : string!, field : string!, target : string!, scalar : boolean!, isOwner : boolean! }
type DatasetProj = { store : string!, field : string!, target : string!, targetField : string!, isArray : boolean! }

'''
atom=(head+types+'orbital MockSeedOrbital {\n  entity MockCell [runtime] {\n'+fields+'  }\n\n'
 '  entity MockSeedMark [persistent: mock_seed_marks] {\n    id : string!\n    seededAt : number @description "When the composed seed wrote its dataset, in epoch milliseconds." = 0\n  }\n\n'
 '  trait MockStream = Rand.traits.MockRandom -> MockCell {\n    listens {\n      MockSeed.CORPUS_ASK -> CORPUS_ASK\n    }\n  }\n\n'
 '  trait MockSeed -> @rebindable MockCell [optimistic] {\n    initial: ready\n\n    config {\n      count : number = 6\n        @label "Rows per entity"\n        @description \"Rows the dataset samples for each generated entity; a DATASET_INPUT that names no count uses it.\"\n        @tier \"policy\"\n      seed : number = 1\n        @label \"Sampler seed\"\n        @description \"The sampler stream seed; a DATASET_INPUT that names no seed uses it.\"\n        @tier \"policy\"\n      defaultPersona : string = \"\"\n        @label \"Default persona\"\n        @description \"The identity row id the viewer is when the host names none, answered with DATASET_DONE; empty means anonymous until a persona is picked.\"\n        @tier \"policy\"\n      seedOnInit : boolean = false\n        @label "Seed on start"\n        @description "When true, the composed atom reads the app it runs in (program/self) at INIT and seeds its stores; false leaves seeding to an explicit DATASET_INPUT or DATASET_START."\n        @tier "policy"\n      stepsPerDispatch : number = 1000\n        @label \"Steps per dispatch\"\n        @description \"The cascade steps a seed spends before it continues in a dispatch of its own (a self program/dispatch), so a large dataset stays under the per-dispatch step cap of the kernel.\"\n        @tier \"policy\"\n      writeChunk : number = 100\n        @label \"Rows per write\"\n        @description \"The most rows one owner write carries; each write is a dispatch of its own, run as the owner of its rows.\"\n        @tier \"policy\"\n      restampOnPersona : boolean = false\n        @label "Restamp on persona switch"\n        @description "When true, a persona switch re-points the seeded owner cells at the new viewer; when false only the first owner stamp after seeding runs and a switch leaves rows as they are."\n        @synonyms "follow persona, my rows follow me"\n        @tier "policy"\n    }\n\n    state ready {\n'+body+'    }\n\n    emits {\n'+E+'    }\n\n    listens {\n'+L+'      MockStream.CORPUS_IS -> CORPUS_IS\n    }\n  }\n\n  page boot as MockSeedBoot -> MockSeed, MockStream\n}\n')
open(OUT, 'w').write(atom)
print('wrote dev/atoms/std-mock-seed.lolo', len(atom))

# ---- the access-check replay fixture: access-check answers only for entities of the running program
FIX_OUT = os.path.join(HERE, '..', 'mock-seed-access.fixture.lolo')
def host_entity(name, coll, policies='', extra=''):
    tag = f'persistent: {coll}, identity' if name == 'FixtureViewer' else f'persistent: {coll}'
    return f'  entity {name} [{tag}] {{\n{policies}    id : string!\n{extra}  }}\n'
CREATE_HR='    @create (= @user.role "hr")\n'
ents=[
 ('FixtureViewer','fixtureviewers','','    role : string\n'),
 ('Ticket','tickets','    @create (= @user.role "agent")\n'),
 ('Task','tasks',''),
 ('Doc','docs','    @read (= @user.id (object/get @entity authorId))\n','    authorId : FixtureViewer\n'),
 ('DocControl','doccontrols','    @read none "the control only gates creation"\n    @create (= @user.id (object/get @entity authorId))\n','    authorId : FixtureViewer\n'),
 ('EmployeeSelf','employeeselves','    @read (= @entity.id @user.id)\n'),
 ('HrOwn','hrown',CREATE_HR+'    @read (or (= @user.role "hr") (= @user.role "manager") (= (object/get @entity staffAccount) @user.id))\n','    staffAccount : FixtureViewer\n'),
 ('HrPlain','hrplain','    @read none "no read policy: the create authority decides"\n'+CREATE_HR,'    staffAccount : FixtureViewer\n'),
 ('HrRoleOnly','hrroleonly',CREATE_HR+'    @read (= @user.role "hr")\n','    staffAccount : FixtureViewer\n'),
 ('HrShared','hrshared',CREATE_HR+'    @read (or (= (object/get @entity staffAccount) @user.id) (= (object/get @entity visibility) "public"))\n','    staffAccount : FixtureViewer\n    visibility : string\n'),
]
fixture=('app mock-seed-access-fixture [\n  version: "1.0.0",\n  env: ["ALMADAR_PERSONA_OWNS"],\n  description: "Replay fixture for std-mock-seed access-check wiring: composes the seeding traits over a host cell and declares the entities, with their access policies, whose rows the dataset goldens stamp, because access-check answers only for entities of the running program."\n]\n'
 ';; Generated by spec/dev/mock-seed.gen/gen_atom.py; regenerate, never hand-edit.\n\n'+types+'\norbital MockSeedHostOrbital {\n  uses Seed from "std/behaviors/std-mock-seed"\n\n  entity MockCell [runtime] {\n'+fields+'  }\n\n'
 '  trait MockStream = Seed.traits.MockStream -> MockCell { }\n\n  trait MockSeed = Seed.traits.MockSeed -> MockCell { }\n\n  page boot as MockSeedHostBoot -> MockSeed, MockStream\n\n'
 +'\n'.join(host_entity(*e) for e in ents)+'}\n')
open(FIX_OUT,'w').write(fixture)
print('wrote spec/dev/mock-seed-access.fixture.lolo', len(fixture))
