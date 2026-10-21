# Generates dev/atoms/std-mock-seed.lolo (the std mock-seed atom, field-tree sampler and dataset program).
# Usage: python3 gen_atom.py            (rewrites ../../../dev/atoms/std-mock-seed.lolo)
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sampler as S
OUT = os.path.join(HERE, '..', '..', '..', 'dev', 'atoms', 'std-mock-seed.lolo')
ROW='Map string MockValue?'
P=dict(RT='?runtime',SD='?seeded',NOW='?nowMs',EN='?entityName',WORDS='@entity.words')
def keptf(fields_expr, seeded, ident, idx):
    return (f'(array/filter {fields_expr} (fn f (and (!= (object/get @f "name" "") "") (not (array/includes ["id", "createdAt", "updatedAt"] (object/get @f "name" ""))) '
            f'(not (and {seeded} (not {ident}) (not (object/get @f "required" false)) (not (object/has @f "default")) (!= (object/get @f "type" "") "relation") '
            f'(not (or (object/has @f "projectedFrom") (and (= (object/get @f "type" "") "array") (object/has (object/get @f "items" {{}}) "projectedFrom")))) (= (math/mod {idx} 2) 0))))))')
def row_cell(kf): return f'[{{ path: "", kind: "row", text: "", num: 0, keys: (array/map {kf} (fn f (object/get @f "name"))), kids: (array/map {kf} (fn f (object/get @f "name"))) }}]'
def frames(kf,idx): return f'(array/map {kf} (fn f {{ spec: @f, name: (object/get @f "name"), index: {idx}, depth: 0, path: (object/get @f "name") }}))'
run_start=S.run(P,'[{ spec: ?spec, name: ?name, index: ?index, depth: 0, path: ?name }]','[]','@entity.rng',root='?name')
kf1=keptf('?fields','?seeded','?identity','?index')
run_row=S.run(P,frames(kf1,'?index'),row_cell(kf1),'@entity.rng')
iso=lambda f:f'(str/concat (time/format {f} "YYYY-MM-DD") "T" (time/format {f} "HH:mm:ss") "." (str/padStart (str/concat "" (math/mod (math/floor {f}) 1000)) 3 "0") "Z")'
nx=S.nxt
NEW=f'''      CORPUS_IS -> ready
        (set @entity.words ?words)
      WALK_START -> ready
        (set @entity.out {run_start})
        (set @entity.rng (object/get @entity.out "s"))
        (emit WALKED {{ cells: (object/get @entity.out "cells"), value: (object/get @entity.out "value") }})
      WALK_ROW -> ready
        (set @entity.out {run_row})
        (set @entity.rng (object/get @entity.out "s"))
        (emit WALKED {{ cells: (object/get @entity.out "cells"), value: (object/get @entity.out "value") }})
      SEED_STREAM -> ready
        (set @entity.rng (math/mod ?seed 4294967296))
        (set @entity.nowMs ?nowMs)
        (emit STREAM_SEEDED {{ seed: ?seed, nowMs: ?nowMs }})
      SEED_ROW -> ready
        (set @entity.createdMs (- ?nowMs (math/floor (* {S.uu(nx("@entity.rng"))} 31536000000))))
        (set @entity.updatedMs (math/min (+ @entity.createdMs (* {S.rint(nx(nx("@entity.rng")),0,30)} 86400000)) ?nowMs))
        (set @entity.out {S.run(dict(P,SD='true',NOW='?nowMs',EN='?label'),frames(keptf('?fields','true','?identity','?index'),'?index'),row_cell(keptf('?fields','true','?identity','?index')),nx(nx('@entity.rng')))})
        (set @entity.rng (object/get @entity.out "s"))
        (emit SEED_ROW_DONE {{ row: (object/set (object/set (object/set (object/get @entity.out "value") "id" (str/concat (str/upper (str/slice ?label 0 1)) (str/slice ?label 1 (str/len ?label)) " Id " ?n)) "createdAt" {iso("@entity.createdMs")}) "updatedAt" {iso("@entity.updatedMs")}) }})
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
      WALKED -> ready when @entity.inRows
        (set @entity.rows (array/append @entity.rows (object/set @payload.value "id" (str/concat @entity.rowName "-" @entity.rowIdx))))
        (set @entity.rowIdx (+ @entity.rowIdx 1))
        (emit ROWS_NEXT {{ at: @entity.rowIdx }})
@@DATASET@@'''
# ---- dataset block
RES_='@payload.result'
def lower(x): return f'(str/lower {x})'
# defs list from the lowered program
orbs=f'(object/get {RES_} "orbitals" [])'
prim=f'(array/filter (array/map {orbs} (fn o (object/get @o "entity" {{}}))) (fn e (validate/object @e)))'
aux=f'(array/filter (array/flatten (array/map {orbs} (fn o (object/get @o "auxiliaryEntities" [])))) (fn e (validate/object @e)))'
# order: per orbital: entity then its auxiliaries
defs=f'(array/flatten (array/map {orbs} (fn o (array/concat (array/filter [(object/get @o "entity" {{}})] (fn e (validate/object @e))) (array/filter (object/get @o "auxiliaryEntities" []) (fn e (validate/object @e)))))))'
idprim=f'(array/filter {prim} (fn e (object/get @e "identity" false)))'
idaux=f'(array/filter {aux} (fn e (object/get @e "identity" false)))'
iddef=f'(if (> (array/len {idprim}) 0) (array/first {idprim}) (if (> (array/len {idaux}) 0) (array/first {idaux}) {{}}))'
def has_inst(d): return f'(> (array/len (object/get {d} "instances" [])) 0)'
def storekey(d): return lower(f'(if (!= (object/get {d} "collection" "") (object/get {d} "collection" "")) "" (if (object/has {d} "collection") (object/get {d} "collection") (object/get {d} "name")))')
def mock_seeds(d): return f'(or (not (object/get {d} "local" false)) (object/get {d} "seedMock" false))'
idname='(object/get @idd "name" "")'
def own_rel_cols(d): 
    return f'(array/map (array/filter (object/get {d} "fields" []) (fn f (and (not (object/get @f "intrinsic" false)) (= (object/get (object/get @f "relation" {{}}) "entity" "") {idname}) (!= (object/get (object/get @f "relation" {{}}) "entity" "") "")))) (fn f (object/get @f "name")))'
def decl_cols(coll): 
    return f'(array/flatten (array/map (array/filter @alld (fn e (= (object/get @e "collection" "") {coll}))) (fn e {own_rel_cols("@e")})))'
def owner_cols(d):
    own=own_rel_cols(d)
    mirror=f'(array/filter {decl_cols(f"(object/get {d} {chr(34)}collection{chr(34)} {chr(34)}{chr(34)})")} (fn c (array/includes (array/map (object/get {d} "fields" []) (fn f (object/get @f "name" ""))) @c)))'
    return f'(if (= {idname} "") [] (array/unique (array/concat {own} (if (!= (object/get {d} "collection" "") "") {mirror} []))))'
def reg(d,seeds):
    return (f'{{ label: (object/get {d} "name"), store: {storekey(d)}, fields: (object/get {d} "fields" []), identity: (object/get {d} "identity" false), runtime: (= (object/get {d} "persistence" "") "runtime"), seeds: {seeds}, ownerCols: {owner_cols(d)}, instances: (object/get {d} "instances" []) }}')
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) (array/concat (if (and (!= {idname} "") (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")}))))')

def storekey(d): return f'(str/lower (if (!= (object/get {d} "collection" "") "") (object/get {d} "collection") (object/get {d} "name")))'
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) (array/concat (if (and (!= {idname} "") (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")}))))')
ALLR='@entity.dsRegsAll'
seedregs=f'(array/filter {ALLR} (fn r (object/get @r "seeds")))'
def store_of_entity(ename): 
    return f'(let ((hit (array/find {seedregs} (fn r (= (str/lower (object/get @r "label")) (str/lower {ename})))))) (if (= @hit null) (str/lower {ename}) (object/get @hit "store")))'
card='(object/get (object/get @fd "relation" {}) "cardinality" "")'
links_expr=(f'(array/flatten (array/map (array/unique (array/map {seedregs} (fn r (object/get @r "store")))) (fn st '
   f'(let ((flds (array/filter (array/flatten (array/map (array/filter {seedregs} (fn r (= (object/get @r "store") @st))) (fn r (object/get @r "fields")))) (fn f (and (= (object/get @f "type" "") "relation") (object/has @f "relation"))))) '
   f'(owners (array/flatten (array/map (array/filter {seedregs} (fn r (= (object/get @r "store") @st))) (fn r (object/get @r "ownerCols")))))) '
   f'(array/map (array/unique (array/map @flds (fn f (object/get @f "name")))) (fn nm (let ((fd (array/find @flds (fn f (= (object/get @f "name") @nm))))) '
   f'{{ store: @st, field: @nm, target: {store_of_entity("(object/get (object/get @fd "+chr(34)+"relation"+chr(34)+") "+chr(34)+"entity"+chr(34)+")")}, scalar: (array/includes ["one", "many-to-one"] {card}), isOwner: (array/includes @owners @nm) }})))))))')
iddef_store=f'(let ((idd {iddef})) (if (= (object/get @idd "name" "") "") "" {storekey("@idd")}))'

RG='(array/first @entity.dsRegs)'
def PS(): return dict(RT='(object/get @reg "runtime")',SD='true',NOW='@entity.nowMs',EN='(object/get @reg "label")',WORDS='@entity.words')
RES_FIELDS='(object/get @reg "fields")'
def kept2(fields,idx,ident='(object/get @reg "identity")'): return keptf(fields,'true',ident,idx)
isoX=iso
blank=lambda x:f'(or (not (object/has {x} "id")) (= (object/get {x} "id" "") ""))'
inst_rows=(f'(array/map (array/range (array/len (object/get @reg "instances"))) (fn i (let ((r (array/nth (object/get @reg "instances") @i))) (object/set (object/set (object/set @r "id" (if {blank("@r")} '
  f'(str/concat (str/upper (str/slice (object/get @reg "label") 0 1)) (str/slice (object/get @reg "label") 1 (str/len (object/get @reg "label"))) " Id " (+ @entity.dsMinted (+ 1 (array/len (array/filter (array/take (object/get @reg "instances") @i) (fn x {blank("@x")})))))) (object/get @r "id"))) '
  f'"createdAt" (if (or (not (object/has @r "createdAt")) (= (object/get @r "createdAt" "") "")) @entity.dsNowIso (object/get @r "createdAt"))) "updatedAt" (if (or (not (object/has @r "updatedAt")) (= (object/get @r "updatedAt" "") "")) @entity.dsNowIso (object/get @r "updatedAt"))))))')
STORES='@entity.dsStores'
rows0='(object/get @entity.dsStores (object/get @reg "store") [])'
# --- seed arm
seed_sample=S.run(PS(),frames(kept2(RES_FIELDS,'(+ @ri 1)'),'(+ @ri 1)'),row_cell(kept2(RES_FIELDS,'(+ @ri 1)')),S.nxt(S.nxt('(object/get @ra "s")')))
idrows='(object/get @entity.dsStores @entity.dsIdStore [])'
owner_val=(f'(if @entity.dsViewerMay @entity.dsViewer (let ((k (array/findIndex @entity.dsAllows (fn a @a)))) (if (>= @k 0) (str/concat "" (object/get (array/nth {idrows} @k) "id")) "")))')
owner_hit='(or @entity.dsViewerMay (> (array/len (array/filter @entity.dsAllows (fn a @a))) 0))'
seed_row=(f'(let ((smp {seed_sample}) (cm (- @entity.nowMs (math/floor (* {S.uu(S.nxt("(object/get @ra "+chr(34)+"s"+chr(34)+")"))} 31536000000))))) '
  f'(let ((um (math/min (+ @cm (* {S.rint(S.nxt(S.nxt("(object/get @ra "+chr(34)+"s"+chr(34)+")")),0,30)} 86400000)) @entity.nowMs))) '
  f'(let ((r0 (object/set (object/set (object/set (object/get @smp "value") "id" (str/concat (str/upper (str/slice (object/get @reg "label") 0 1)) (str/slice (object/get @reg "label") 1 (str/len (object/get @reg "label"))) " Id " (+ (array/len (object/get @ra "rows")) 1))) "createdAt" {isoX("@cm")}) "updatedAt" {isoX("@um")}))) '
  f'{{ rows: (array/append (object/get @ra "rows") (array/reduce (object/get @reg "ownerCols") @r0 (fn rr col (if (and (!= @entity.dsViewer "") (if (= @col "id") (= @ri 0) (= (math/mod @ri 2) 0)) {owner_hit}) (object/set @rr @col {owner_val}) @rr)))), s: (object/get @smp "s") }})))')
seed_arm=f'(array/reduce (array/range (if (object/get @reg "runtime") 1 @entity.dsCount)) {{ rows: {rows0}, s: @entity.rng }} (fn ra ri {seed_row}))'
# --- backfill arm
absent='(array/filter (object/get @reg "fields") (fn f (and (not (array/includes ["id", "createdAt", "updatedAt"] (object/get @f "name" ""))) (not (object/has @row (object/get @f "name" ""))))))'
bf_sample=S.run(PS(),frames(kept2('@absent','(+ @ri 1)'),'(+ @ri 1)'),row_cell(kept2('@absent','(+ @ri 1)')),'(object/get @ra "s")')
bf_row=(f'(let ((row (array/nth {rows0} @ri))) (let ((absent {absent})) (if (= (array/len @absent) 0) {{ rows: (array/append (object/get @ra "rows") @row), s: (object/get @ra "s") }} '
        f'(let ((smp {bf_sample})) {{ rows: (array/append (object/get @ra "rows") (object/merge @row (object/get @smp "value"))), s: (object/get @smp "s") }}))))')
bf_arm=f'(array/reduce (array/range (array/len {rows0})) {{ rows: [], s: @entity.rng }} (fn ra ri {bf_row}))'
store_step=(f'(let ((reg {RG})) (if (> (array/len (object/get @reg "instances")) 0) '
   f'{{ stores: (object/set @entity.dsStores (object/get @reg "store") (array/concat {rows0} {inst_rows})), s: @entity.rng, minted: (+ @entity.dsMinted (array/len (array/filter (object/get @reg "instances") (fn x {blank("@x")})))) }} '
   f'(if (not (object/get @reg "seeds")) {{ stores: @entity.dsStores, s: @entity.rng, minted: @entity.dsMinted }} '
   f'(let ((res2 (if (= (array/len {rows0}) 0) {seed_arm} {bf_arm}))) {{ stores: (object/set @entity.dsStores (object/get @reg "store") (object/get @res2 "rows")), s: (object/get @res2 "s"), minted: @entity.dsMinted }}))))')
# --- links
def link_fill():
    lk='@lk'
    return (f'(let ((rows (object/get @sm (object/get {lk} "store") [])) (trows (object/get @sm (object/get {lk} "target") []))) (if (= (array/len @trows) 0) @sm (object/set @sm (object/get {lk} "store") (array/map (array/range (array/len @rows)) (fn i (let ((row (array/nth @rows @i)) (f (object/get {lk} "field"))) '
      f'(if (not (or (not (object/has @row @f)) (= (object/get @row @f "") "") (and (validate/array (object/get @row @f "")) (= (array/len (object/get @row @f "")) 0)))) @row '
      f'(if (= (object/get {lk} "target") (object/get {lk} "store")) (object/set @row @f (if (object/get {lk} "isOwner") (object/get @row "id") (if (object/get {lk} "scalar") (if (= @i 0) "" (object/get (array/nth @rows (math/floor (/ (- @i 1) 2))) "id")) (array/map (array/filter [(+ (* 2 @i) 1), (+ (* 2 @i) 2)] (fn c (< @c (array/len @rows)))) (fn c (object/get (array/nth @rows @c) "id")))))) '
      f'(let ((elig (if (object/get {lk} "isOwner") (array/map (array/filter (array/range (array/len @trows)) (fn j (array/nth @entity.dsAllows @j))) (fn j (object/get (array/nth @trows @j) "id"))) (array/map @trows (fn t (object/get @t "id")))))) '
      f'(if (= (array/len @elig) 0) @row (object/set @row @f (if (object/get {lk} "scalar") (array/nth @elig (math/mod @i (array/len @elig))) (array/unique (array/map (array/range (math/min (array/len @elig) (+ 2 (math/mod @i 2)))) (fn o (array/nth @elig (math/mod (+ @i @o) (array/len @elig))))))))))))))))))')
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
def env_cols(label):
    pieces='(array/filter (array/map (str/split @entity.dsOwns ",") (fn q (str/trim @q))) (fn q (and (str/includes @q ".") (!= (array/nth (str/split @q ".") 0) "") (!= (str/join (array/drop (str/split @q ".") 1) ".") ""))))'
    return f'(array/map (array/filter {pieces} (fn q (= (str/lower (array/nth (str/split @q ".") 0)) (str/lower {label})))) (fn q (str/join (array/drop (str/split @q ".") 1) ".")))'
def vid(x): return f'(or (= {x} (quote "@user.id")) (and (validate/array {x}) (= (array/len {x}) 3) (= (array/nth {x} 0) "object/get") (= (array/nth {x} 1) (quote "@user")) (= (array/nth {x} 2) "id")))'
def fref(x): return f'(if (validate/string {x}) (if (str/startsWith {x} (quote "@entity.")) (str/slice {x} 8 (str/len {x})) "") (if (and (validate/array {x}) (= (array/len {x}) 3) (= (array/nth {x} 0) "object/get") (= (array/nth {x} 1) (quote "@entity")) (validate/string (array/nth {x} 2))) (array/nth {x} 2) ""))'
fold_step=(f'(fn (n k) (array/concat (if (and (validate/array @n) (= (array/len @n) 3) (array/includes ["=", "=="] (array/nth @n 0))) '
           f'(let ((fa (array/nth @n 1)) (fb (array/nth @n 2))) (let ((fc (if {vid("@fb")} {fref("@fa")} (if {vid("@fa")} {fref("@fb")} "")))) (if (!= @fc "") (array/append [] @fc) []))) []) '
           f'(if (validate/array @n) (array/flatten @k) [])))')
def pcols(d,key): return f'(if (object/has {d} "{key}") (array/unique (array/flatten (tree/fold (object/get {d} "{key}") {fold_step} "Expr"))) [])'
def owner_cols(d):
    own=own_rel_cols(d)
    mirror=f'(array/filter {decl_cols(f"(object/get {d} {chr(34)}collection{chr(34)} {chr(34)}{chr(34)})")} (fn c (array/includes (array/map (object/get {d} "fields" []) (fn f (object/get @f "name" ""))) @c)))'
    selfid=f'(if (and (object/get {d} "identity" false) (array/includes (array/flatten [{pcols(d,"read_policy")} {pcols(d,"create_policy")} {pcols(d,"update_policy")} {pcols(d,"delete_policy")}]) "id")) (array/append [] "id") [])'
    polcols=f'(array/concat {pcols(d,"update_policy")} {pcols(d,"delete_policy")} {pcols(d,"read_policy")})'
    schema_cols=f'(if (= {idname} "") [] (array/concat {own} {selfid} {polcols} (if (!= (object/get {d} "collection" "") "") {mirror} [])))'
    allc=f'(array/unique (array/concat {schema_cols} {env_cols("(object/get "+d+" "+chr(34)+"name"+chr(34)+")")}))'
    return f'(let ((oc {allc})) (array/concat (array/filter @oc (fn c (= @c "id"))) (array/filter @oc (fn c (!= @c "id")))))'
def reg(d,seeds):
    return (f'{{ label: (object/get {d} "name"), store: {storekey(d)}, fields: (object/get {d} "fields" []), identity: (object/get {d} "identity" false), runtime: (= (object/get {d} "persistence" "") "runtime"), seeds: {seeds}, ownerCols: {owner_cols(d)}, instances: (object/get {d} "instances" []) }}')
regs_expr=(f'(let ((alld {defs}) (idd {iddef})) (array/concat (if (and (!= {idname} "") (not {has_inst("@idd")})) [{reg("@idd","true")}] []) '
           f'(array/map @alld (fn d {reg("@d",f"(and (not {has_inst(chr(64)+chr(100))}) {mock_seeds(chr(64)+chr(100))})")}))))')
# ---- projections
def proj_of(f): return f'(if (object/has {f} "projectedFrom") (object/get {f} "projectedFrom") (if (and (= (object/get {f} "type" "") "array") (object/has (object/get {f} "items" {{}}) "projectedFrom")) (object/get (object/get {f} "items") "projectedFrom") null))'
projs_expr=(f'(array/flatten (array/map (array/unique (array/map {seedregs} (fn r (object/get @r "store")))) (fn st '
   f'(let ((flds (array/filter (array/flatten (array/map (array/filter {seedregs} (fn r (= (object/get @r "store") @st))) (fn r (object/get @r "fields")))) (fn f (!= {proj_of("@f")} null))))) '
   f'(array/map (array/unique (array/map @flds (fn f (object/get @f "name")))) (fn nm (let ((fd (array/find @flds (fn f (= (object/get @f "name") @nm))))) (let ((pr {proj_of("@fd")})) '
   f'{{ store: @st, field: @nm, target: {store_of_entity("(object/get @pr "+chr(34)+"type"+chr(34)+")")}, targetField: (object/get @pr "field"), isArray: (= (object/get @fd "type") "array") }}))))))))')
def proj_fill():
    return (f'(let ((rows (object/get @sm (object/get @pj "store") [])) (trows (object/get @sm (object/get @pj "target") []))) (if (= (array/len @trows) 0) @sm (object/set @sm (object/get @pj "store") (array/map (array/range (array/len @rows)) (fn i (let ((row (array/nth @rows @i)) (f (object/get @pj "field"))) '
            f'(if (not (or (not (object/has @row @f)) (= (object/get @row @f "") "") (and (validate/array (object/get @row @f "")) (= (array/len (object/get @row @f "")) 0)))) @row '
            f'(let ((picked (object/get (array/nth @trows (math/mod @i (array/len @trows))) (object/get @pj "targetField") null))) (object/set @row @f (if (object/get @pj "isArray") [@picked] @picked))))))))))')
links_fold=f'(array/reduce @entity.dsProjs (array/reduce @entity.dsLinks @entity.dsStores (fn sm lk {link_fill()})) (fn sm pj {proj_fill()}))'
DERIVE='''      DERIVE_OWNERS -> ready
        (set @entity.dsOwns "")
        (set @entity.dsRegsAll @@REGS@@)
        (emit OWNERS_DERIVED { owners: (object/fromEntries (array/map (array/filter @entity.dsRegsAll (fn r (> (array/len (object/get @r "ownerCols")) 0))) (fn r [(str/lower (object/get @r "label")), (object/get @r "ownerCols")]))) })
'''
RO='''      READ_OWNERS -> ready
        (set @entity.roHit (and (!= ?column "id") ?hasReadPolicy ?targetKnown (> (array/len (array/filter (array/range (array/len ?ids)) (fn i (and (array/nth ?admitsOwn @i) (not (array/nth ?admitsBlank @i)))))) 0)))
        (set @entity.roIds (if @entity.roHit (array/map (array/filter (array/range (array/len ?ids)) (fn i (array/nth ?admitsOwn @i))) (fn i (array/nth ?ids @i))) []))
        (emit READ_OWNERS_FOUND { ids: @entity.roIds, hit: @entity.roHit })
'''
DATASET=f'''      DATASET_START -> ready
        (set @entity.dsViewer ?viewerId)
        (set @entity.dsViewerMay ?viewerMayCreate)
        (set @entity.dsAllows ?createAllows)
        (set @entity.dsCount ?count)
        (set @entity.dsSource ?source)
        (set @entity.nowMs ?nowMs)
        (set @entity.dsNowIso {iso("?nowMs")})
        (set @entity.rng (math/mod ?seed 4294967296))
        (set @entity.dsMinted 0)
        (set @entity.dsStores {{}})
        (os/getenv "ALMADAR_PERSONA_OWNS" {{ emit: {{ success: DS_OWNS_ENV, failure: DS_OWNS_ENV_FAILED }} }})
      DS_OWNS_ENV -> ready
        (set @entity.dsOwns (object/get @payload "value" ""))
        (program/read @entity.dsSource {{ emit: {{ success: DS_PROGRAM_READ, failure: DS_PROGRAM_FAILED }} }})
      DS_OWNS_ENV_FAILED -> ready
        (set @entity.dsOwns "")
        (program/read @entity.dsSource {{ emit: {{ success: DS_PROGRAM_READ, failure: DS_PROGRAM_FAILED }} }})
      DS_PROGRAM_FAILED -> ready
        (emit DATASET_FAILED {{ error: ?error }})
      DS_PROGRAM_READ -> ready
        (set @entity.dsRegsAll {regs_expr})
        (set @entity.dsRegs @entity.dsRegsAll)
        (set @entity.dsLinks {links_expr})
        (set @entity.dsProjs {projs_expr})
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
body=NEW.replace('@@DATASET@@',DATASET+RO+DERIVE.replace('@@REGS@@',regs_expr))
body=body.replace('      CORPUS_IS -> ready','      INIT -> ready\n        (emit CORPUS_ASK { })\n      CORPUS_IS -> ready',1)
# ---- assemble the file
w=lambda n,f,d,syn: f'      {n} {{ {f} }}\n        @description "{d}"\n        @synonyms "{syn}"\n'
L=''
L+=w('WALK_START','spec : MockFieldSpec!  name : string!  entityName : string!  index : number!  seeded : boolean!  runtime : boolean!  nowMs : number!','Sample one field by walking its declared field tree with the seeded stream or the row ordinal.','sample field, field tree')
L+=w('WALK_ROW','fields : [MockFieldSpec]  entityName : string  index : number  seeded : boolean  identity : boolean  runtime : boolean  nowMs : number','Sample one row of an entity fields: reserved keys skipped, optional undefaulted fields left unset on even seeded rows.','sample row')
L+=w('SAMPLE_ROWS','fields : [MockFieldSpec]!  name : string!  count : number!  runtime : boolean!  identity : boolean!','Sample an entity rows by the index strategy: one row for a runtime singleton, else count rows, each with its Name-n id.','sample rows, mock rows')
L+=w('ROWS_NEXT','at : number','Sample the next row.','next row')
L+=w('WALKED','cells : [MockWalkCell]  value : MockValue?','A walk finished.','walked')
L+=w('SEED_STREAM','seed : number!  nowMs : number!','Start a store stream: reset it to a seed and the clock the stamps and relative dates draw against.','start stream')
L+=w('SEED_ROW','fields : [MockFieldSpec]!  label : string!  n : number!  index : number!  identity : boolean!  runtime : boolean!  nowMs : number!','Seed one row of a mock store the way the kernel does: the Label Id n id, createdAt and updatedAt drawn first from the stream, then the seeded fields.','seed row, mock store row')
L+=w('DATASET_START','source : string!  count : number!  seed : number!  nowMs : number!  viewerId : string!  viewerMayCreate : boolean!  createAllows : [boolean]!','Seed a whole mock dataset from a program the way the kernel does: read the program, derive the store order, owner columns and relation links from it, seed the identity store first, then each store with stamps drawn from one stream, owner columns stamped for the viewer, later registrants backfilled, and relations and projected fields linked.','seed dataset, mock dataset')
L+=w('DS_OWNS_ENV','value : string','The ALMADAR_PERSONA_OWNS value.','owner env')
L+=w('DS_OWNS_ENV_FAILED','error : string','The owner environment variable could not be read.','owner env failed')
L+=w('DS_PROGRAM_READ','result : string','The program lowered by program/read.','program read')
L+=w('DS_PROGRAM_FAILED','error : string','The program could not be read.','program failed')
L+=w('DS_STORE','at : number','Run the next store registration.','next store')
L+=w('DS_LINKS','at : number','Fill the relation links and projected fields.','links')
L+=w('DERIVE_OWNERS','result : string!','Derive the owner columns of a lowered program: identity-typed relations, a self-identity id, columns an update, delete or read policy compares to the viewer id, and same-collection siblings by name.','owner columns, owner fields')
L+=w('READ_OWNERS','column : string!  hasReadPolicy : boolean!  targetKnown : boolean!  ids : [string]!  admitsOwn : [boolean]!  admitsBlank : [boolean]!','The identities a read policy lets own a column, or hit false when the read policy does not scope it by ownership (the admission verdicts are inputs until the access check is exposed).','read owners')
L+=w('CORPUS_IS','words : [string]','The stream word corpus.','corpus')
E=''
def ext(n,fields,desc,tier='domain'):
    return f'      {n} -> external {{\n'+''.join(f'        {f}\n' for f in fields)+f'      }}\n        @description "{desc}"\n        @tier "{tier}"\n'
E+=ext('WALKED',['cells : [MockWalkCell]','value : MockValue?'],'A field or row walk finished: the sampled cells in pre-order and the assembled value.')
E+=ext('ROWS_DONE',['rows : [Map string MockValue?]'],'The sampled rows of an entity, each with its Name-n id.')
E+=ext('SEED_ROW_DONE',['row : Map string MockValue?'],'A seeded store row: its Name Id n id, created and updated stamps drawn from the stream, then its fields.')
E+=ext('STREAM_SEEDED',['seed : number','nowMs : number'],'The stream was reset to a seed and clock.')
E+=ext('DATASET_DONE',['stores : Map string [Map string MockValue?]'],'The whole seeded dataset: every store rows, identity first, owner columns stamped and relations linked.')
E+=ext('OWNERS_DERIVED',['owners : Map string [string]'],'The owner columns of each entity, by lower-case entity name.')
E+=ext('READ_OWNERS_FOUND',['ids : [string]','hit : boolean'],'The identities a read policy lets own a column.')
E+=ext('DATASET_FAILED',['error : string'],'The program could not be read.')
E+='      CORPUS_ASK { }\n        @description "Internal: ask the stream for its word corpus."\n        @tier "internal"\n'
E+='      ROWS_NEXT { at : number }\n        @description "Internal: sample the next row."\n        @tier "internal"\n'
E+='      DS_STORE { at : number }\n        @description "Internal: run the next store registration."\n        @tier "internal"\n'
E+='      WALK_ROW { fields : [MockFieldSpec]  entityName : string  index : number  seeded : boolean  identity : boolean  runtime : boolean  nowMs : number }\n        @description "Internal: sample one row of fields."\n        @tier "internal"\n'
E+='      DS_OWNS_ENV { value : string }\n        @description "Internal: the owner environment variable answered."\n        @tier "internal"\n      DS_OWNS_ENV_FAILED { error : string }\n        @description "Internal: the owner environment variable could not be read."\n        @tier "internal"\n      DS_PROGRAM_READ { result : string }\n        @description "Internal: the program was lowered."\n        @tier "internal"\n      DS_PROGRAM_FAILED { error : string }\n        @description "Internal: the program could not be lowered."\n        @tier "internal"\n'
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
    roHit : boolean @description "Whether the read policy scopes the column by ownership." = false
    roIds : [string] @description "The identities the read policy lets own the column." = []
    dsSource : string @description "The program text the dataset is derived from." = ""
    dsOwns : string @description "The ALMADAR_PERSONA_OWNS pairs." = ""
    dsRegsAll : [DatasetReg] @description "Every store registration derived from the program, in seed order." = []
    dsRegs : [DatasetReg] @description "The store registrations still to run, next first." = []
    dsLinks : [DatasetLink] @description "The relation links to fill." = []
    dsProjs : [DatasetProj] @description "The projected fields to fill." = []
    dsStores : Map string [Map string MockValue?] @description "The rows of each store key." = {}
    dsOut : DsOut @description "The last store step result." = { stores: {}, s: 42, minted: 0 }
    dsViewer : string @description "The viewer id owner columns are stamped for, or empty." = ""
    dsViewerMay : boolean @description "Whether the viewer passes the create gate of the store." = false
    dsAllows : [boolean] @description "Whether each identity row passes the create gate, in roster order." = []
    dsIdStore : string @description "The store key of the identity entity." = ""
    dsCount : number @description "The seed count the host named." = 0
    dsMinted : number @description "Ids minted so far for id-less authored instances." = 0
    dsNowIso : string @description "The clock as an ISO timestamp, for authored instances." = ""
'''
head='''app std-mock-seed [
  version: "1.0.0",
  env: ["ALMADAR_PERSONA_OWNS"],
  description: "std-mock-seed — mock rows from declared fields, as pure expressions over a stack machine. WALK_START samples one field by walking its declared field tree (arrays, objects, tuples, unions), WALK_ROW and SAMPLE_ROWS sample rows, SEED_ROW seeds a store row with its Name Id n id and created and updated stamps drawn from the stream, and DATASET_START seeds a whole dataset from a program: it reads the program, derives the store order, owner columns, relation links and projected fields, seeds the identity store first, owner-stamps the viewer, backfills later registrants of a store and links relations. The index strategy derives a value from the row ordinal alone; the seeded strategy threads one linear congruential generator state (the std-mock-random stream) through the walk, so the draw order is the walk order. Gates in order: an intrinsic field takes its default or is omitted, a default is honored where it is a claim about every row, a declared mock is rotated by row or typed, a projected field is a placeholder, a vocabulary rotates one-based, then the type."
]
;; Generated by spec/dev/mock-seed.gen/gen_atom.py; regenerate, never hand-edit.
uses Spec from "almadar-std/mock-seed"
uses Rand from "std/behaviors/std-mock-random"

'''
types='''type Expr = string | number | boolean | [Expr]
type MockValue = string | number | boolean | [MockValue?] | Map string MockValue?
type MockRelation = { entity : string, cardinality : string }
type MockProjection = { type : string, field : string }
type MockFieldSpec = { name : string, type : string!, values : [string], mock : string, default : MockValue?, intrinsic : boolean, required : boolean, relation : MockRelation, projectedFrom : MockProjection, items : MockFieldSpec, properties : Map string MockFieldSpec, slots : [MockFieldSpec] }
type MockWalkCell = { path : string!, kind : string!, text : string, num : number, url : string, mime : string, kids : [string], keys : [string], val : MockValue? }
type WalkOut = { cells : [MockWalkCell], s : number, value : MockValue? }
type DsOut = { stores : Map string [Map string MockValue?], s : number, minted : number }
type DatasetReg = { label : string!, store : string!, fields : [MockFieldSpec]!, identity : boolean!, runtime : boolean!, seeds : boolean!, ownerCols : [string]!, instances : [Map string MockValue?]! }
type DatasetLink = { store : string!, field : string!, target : string!, scalar : boolean!, isOwner : boolean! }
type DatasetProj = { store : string!, field : string!, target : string!, targetField : string!, isArray : boolean! }

'''
atom=(head+types+'orbital MockSeedOrbital {\n  entity MockCell [runtime] {\n'+fields+'  }\n\n'
 '  trait MockStream = Rand.traits.MockRandom -> MockCell {\n    listens {\n      MockSeed.CORPUS_ASK -> CORPUS_ASK\n    }\n  }\n\n'
 '  trait MockSeed -> @rebindable MockCell [lifecycle, instance] {\n    initial: ready\n\n    state ready {\n'+body+'    }\n\n    emits {\n'+E+'    }\n\n    listens {\n'+L+'      MockStream.CORPUS_IS -> CORPUS_IS\n    }\n  }\n\n  page "/mock-seed" as MockSeedPage -> MockSeed, MockStream\n}\n')
open(OUT, 'w').write(atom)
print('wrote dev/atoms/std-mock-seed.lolo', len(atom))
