"""Compra de amostras x Desenvolvimento: tudo que está 'Pendente compras' (planilha ou marcação manual) aparece aqui, com a referência cruzada do item
(o que cotar/comprar) e a situação dos pedidos de amostra já abertos para o mesmo código."""
import re
import database as db
from queries import q, q1, cross_for
import rd

DONE = {"chegou", "finalizado", "aprovado"}
BRAND_ORDER = ["MONROE", "KAYABA", "COFAP", "NAKATA", "SACHS", "CORVEN", "TRW", "TRW AMD", "ISAPA", "ALBARUS", "DEVIGILI", "RECORD", "CILBRAKE", "GLOBO", "FRIC ROT", "JINBO AUTOPART", "PERFECT", "OEM"]
STAGE = {"cotacao": "Cotação", "sc_aberta": "SC aberta", "chegou": "Chegou", "finalizado": "Finalizado", "aprovado": "Aprovado"}
def _k(c): return re.sub(r"[^A-Z0-9]", "", (c or "").upper())

def _orders():
    out = {}
    for o in q("SELECT id,perfect_code,sample_code,sc_number,supplier,stage FROM sample_orders"):
        for c in (o["perfect_code"], o["sample_code"]):
            if c: out.setdefault(_k(c), []).append(o)
    return out

def state_of(orders):
    if not orders: return "sem"
    return "comprada" if any(o["stage"] in DONE for o in orders) else "andamento"

def _sort_cross(cs):
    rank = {b: i for i, b in enumerate(BRAND_ORDER)}
    return sorted(cs, key=lambda c: (rank.get(c["brand"], 50), c["brand"] or "", c["code"]))

def pending(f):
    kind = {"des": "DES", "rd": "R-D"}.get(f.get("kind") or "")
    w, p = ["v.pend_compras=1"], {}
    if kind: w.append("v.suggestion=:k"); p["k"] = kind
    for i, t in enumerate((f.get("q") or "").split()):
        w.append(f"(r.code LIKE :t{i} OR r.description LIKE :t{i} OR r.make LIKE :t{i} OR r.vehicle LIKE :t{i})"); p[f"t{i}"] = f"%{t}%"
    rows = q(f"""SELECT v.code,v.suggestion,MAX(r.description) description,MAX(r.product_id) product_id,group_concat(DISTINCT r.make) makes,group_concat(DISTINCT r.vehicle) vehicles,
        group_concat(DISTINCT r.status) statuses,group_concat(DISTINCT r.supplier) suppliers
        FROM v_rd_flags v JOIN rd_projects r ON r.code=v.code AND r.suggestion=v.suggestion WHERE {" AND ".join(w)} GROUP BY v.code,v.suggestion ORDER BY v.code""", p)
    od = _orders(); out = []
    has_cross = {r["product_id"] for r in q("SELECT DISTINCT k.product_id FROM codes k JOIN sources s ON s.id=k.source_id WHERE s.name LIKE 'CrossCatalogo%'")}
    for r in rows:
        ors = od.get(_k(r["code"]), []); st = state_of(ors)
        if f.get("state") and f["state"] != st: continue
        r.update(state=st, orders=[{"id": o["id"], "sc": o["sc_number"], "sample_code": o["sample_code"], "supplier": o["supplier"], "stage": STAGE.get(o["stage"], o["stage"])} for o in ors],
                 makes=(r["makes"] or "").replace(",", " · "), vehicles=(r["vehicles"] or "").replace(",", " · "), statuses=(r["statuses"] or "").replace(",", " · "), suppliers=(r["suppliers"] or "").replace(",", " · "))
        out.append(r)
    rank = {"sem": 0, "andamento": 1, "comprada": 2}   # o que dá para cotar já (tem referência cruzada) vem primeiro
    out.sort(key=lambda r: (rank[r["state"]], 0 if r["product_id"] in has_cross else 1, r["code"]))
    summ = {s: sum(1 for r in out if r["state"] == s) for s in ("sem", "andamento", "comprada")}
    size = 40; page = max(1, int(f.get("page") or 1)); chunk = out[(page - 1) * size: page * size]
    for r in chunk:   # referência cruzada só do que vai aparecer na página
        r["cross"] = _sort_cross([{"brand": c["brand"], "code": c["code"]} for c in cross_for(r["product_id"])]) if r["product_id"] else []
    return {"total": len(out), "page": page, "size": size, "rows": chunk, "summary": summ}

def for_code(code):
    """Usado no formulário do pedido: o código está pendente de compra? quais referências cotar?"""
    k = _k(code); fl = []
    for r in q("SELECT suggestion,pend_compras FROM v_rd_flags WHERE pend_compras=1 AND replace(replace(upper(code),'/',''),' ','')=?", (k,)): fl.append(r["suggestion"])
    p = q1("SELECT id FROM products WHERE upper(perfect_code)=?", (k,)) or (q1("SELECT product_id id FROM rd_projects WHERE replace(replace(upper(code),'/',''),' ','')=? AND product_id IS NOT NULL LIMIT 1", (k,)))
    cross = _sort_cross([{"brand": c["brand"], "code": c["code"]} for c in cross_for(p["id"])]) if p and p.get("id") else []
    ors = _orders().get(k, [])
    return {"pending": fl, "cross": cross, "state": state_of(ors), "orders": len(ors)}
