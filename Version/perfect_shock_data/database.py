"""Banco SQLite local: esquema completo e consultas do dashboard."""
import os, sqlite3
BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("PSD_DB", os.path.join(BASE, "data", "perfect_shock.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS sources(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT, priority INTEGER DEFAULT 5, notes TEXT);
CREATE TABLE IF NOT EXISTS import_batches(id INTEGER PRIMARY KEY, source_id INTEGER REFERENCES sources(id), filename TEXT, sheet TEXT, category TEXT,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP, rows_new INTEGER DEFAULT 0, rows_updated INTEGER DEFAULT 0, rows_conflict INTEGER DEFAULT 0, rows_error INTEGER DEFAULT 0, status TEXT DEFAULT 'ok');
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, perfect_code TEXT NOT NULL UNIQUE, description TEXT, system_type TEXT CHECK(system_type IN ('oleo','gas') OR system_type IS NULL),
  features TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT);
CREATE TABLE IF NOT EXISTS codes(id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code TEXT NOT NULL, code_type TEXT NOT NULL CHECK(code_type IN ('oem','fornecedor','concorrente')), brand TEXT, source_id INTEGER REFERENCES sources(id), batch_id INTEGER REFERENCES import_batches(id));
CREATE INDEX IF NOT EXISTS ix_codes_code ON codes(code);
CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  make TEXT, model TEXT, version TEXT, year_from INTEGER, year_to INTEGER, axle TEXT CHECK(axle IN ('dianteiro','traseiro') OR axle IS NULL),
  side TEXT CHECK(side IN ('esquerdo','direito','ambos') OR side IS NULL), source_id INTEGER REFERENCES sources(id), batch_id INTEGER REFERENCES import_batches(id));
CREATE TABLE IF NOT EXISTS dimensions(product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE, lmax_mm REAL, lmin_mm REAL, stroke_mm REAL, rod_diameter_mm REAL,
  body_length_mm REAL, tube_diameter_mm REAL, upper_mount TEXT, upper_mount_dims TEXT, lower_mount TEXT, lower_mount_dims TEXT, source_id INTEGER REFERENCES sources(id));
CREATE TABLE IF NOT EXISTS commercial(product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE, cost REAL, price REAL, weight_kg REAL, package TEXT, source_id INTEGER REFERENCES sources(id));
CREATE TABLE IF NOT EXISTS pendencies(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, kind TEXT NOT NULL, field TEXT, description TEXT,
  status TEXT DEFAULT 'aberta' CHECK(status IN ('aberta','resolvida','ignorada')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS equivalence_suggestions(id INTEGER PRIMARY KEY, product_a INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, product_b INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score REAL, confidence TEXT, criteria TEXT, differences TEXT, missing TEXT, sources TEXT, status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','aprovada','rejeitada')), updated_at TEXT);
"""

def conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    c = sqlite3.connect(DB_PATH); c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON"); return c

def init_db():
    with conn() as c: c.executescript(SCHEMA)
    migrate()

def stats():
    q = {
     "products": "SELECT COUNT(*) FROM products",
     "oem_codes": "SELECT COUNT(DISTINCT code) FROM codes WHERE code_type='oem'",
     "applications": "SELECT COUNT(*) FROM applications",
     "drawings": "SELECT COUNT(DISTINCT code) FROM drawing_links",
     "pend_compras": "SELECT COUNT(DISTINCT code||suggestion) FROM v_rd_flags WHERE pend_compras=1",
     "val_reprovada": "SELECT COUNT(DISTINCT code||suggestion) FROM v_rd_flags WHERE val_reprovada=1",
     "imports": "SELECT COUNT(*) FROM import_batches",
     "pendencies": "SELECT COUNT(*) FROM pendencies WHERE status='aberta'",
     "duplicates": "SELECT COUNT(*) FROM (SELECT 1 FROM codes WHERE coalesce(source_id,0) NOT IN (SELECT id FROM sources WHERE name LIKE 'CrossCatalogo%') GROUP BY coalesce(normalized_code,code), code_type HAVING COUNT(DISTINCT product_id)>1)",
     "des_items": "SELECT COUNT(DISTINCT code) FROM rd_projects WHERE suggestion='DES'",
     "rd_items": "SELECT COUNT(DISTINCT code) FROM rd_projects WHERE suggestion='R-D'",
     "equivalences_pending": "SELECT COUNT(*) FROM equivalence_suggestions WHERE status='pendente'",
    }
    with conn() as c: return {k: c.execute(v).fetchone()[0] for k, v in q.items()}

def quick_search(term, limit=5):
    import rd
    return rd.quick(term, limit)

# ---- Migrações aditivas (v2, v3, v4): campos e tabelas vindos da análise das bases reais ----
SCHEMA_V2 = """
CREATE TABLE IF NOT EXISTS side_pairs(right_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, left_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, source_id INTEGER REFERENCES sources(id), PRIMARY KEY(right_product_id,left_product_id));
CREATE TABLE IF NOT EXISTS packaging_boxes(code TEXT PRIMARY KEY, length_mm REAL, width_mm REAL, height_mm REAL, raw_dims TEXT, source_id INTEGER REFERENCES sources(id));
CREATE TABLE IF NOT EXISTS product_components(id INTEGER PRIMARY KEY, parent_code TEXT NOT NULL, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, component_code TEXT NOT NULL, component_desc TEXT, seq INTEGER, qty REAL, loss_index REAL, date_from TEXT, date_to TEXT, source_id INTEGER REFERENCES sources(id), batch_id INTEGER REFERENCES import_batches(id));
CREATE INDEX IF NOT EXISTS ix_comp_parent ON product_components(parent_code);
CREATE TABLE IF NOT EXISTS supplier_items(id INTEGER PRIMARY KEY, supplier_name TEXT, erp_code TEXT, item_type TEXT, supplier_code TEXT, supplier_code2 TEXT, description TEXT, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, source_id INTEGER REFERENCES sources(id), batch_id INTEGER REFERENCES import_batches(id));
CREATE TABLE IF NOT EXISTS certificates(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, perfect_code_raw TEXT, inmetro_number TEXT, family TEXT, supplier TEXT, cert_description TEXT, brand TEXT, source_id INTEGER REFERENCES sources(id), batch_id INTEGER REFERENCES import_batches(id));
CREATE TABLE IF NOT EXISTS rd_projects(id INTEGER PRIMARY KEY, code TEXT NOT NULL, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, suggestion TEXT, status TEXT, drawing_substatus TEXT, validation_substatus TEXT, supplier TEXT, sample_bought TEXT, sample_sent TEXT, source_id INTEGER REFERENCES sources(id), batch_id INTEGER REFERENCES import_batches(id));
"""
NEW_COLUMNS = {
 "products": [("description_es","TEXT"),("description_en","TEXT"),("ean","TEXT"),("ncm","TEXT"),("family","TEXT"),("inmetro_number","TEXT"),("weight_kg","REAL"),("package_code","TEXT"),("package_note","TEXT"),("is_launch","TEXT")],
 "codes": [("normalized_code","TEXT")],
 "applications": [("application_text","TEXT"),("year_note","TEXT")],
}
SCHEMA_V3 = """
CREATE TABLE IF NOT EXISTS sample_orders(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, perfect_code TEXT, ship_code TEXT, sc_number TEXT, application TEXT, sample_code TEXT, supplier TEXT, month TEXT, tracking TEXT, net_weight REAL, gross_weight REAL, credit_note TEXT, stage TEXT NOT NULL DEFAULT 'cotacao', to_send INTEGER DEFAULT 0, pending_supplier INTEGER DEFAULT 0, notes TEXT, source_id INTEGER REFERENCES sources(id), created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT);
CREATE TABLE IF NOT EXISTS sample_quotes(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES sample_orders(id) ON DELETE CASCADE, price REAL, link TEXT, chosen INTEGER DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS ux_eq ON equivalence_suggestions(product_a, product_b);
"""
SCHEMA_V4 = """
CREATE TABLE IF NOT EXISTS damping_rules(id INTEGER PRIMARY KEY, table_name TEXT NOT NULL, seq INTEGER, velocity REAL NOT NULL, tolerance REAL NOT NULL, source_id INTEGER REFERENCES sources(id));
CREATE TABLE IF NOT EXISTS damping_params(key TEXT PRIMARY KEY, value REAL, note TEXT);
CREATE TABLE IF NOT EXISTS damping_tests(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, perfect_code TEXT, label TEXT, test_date TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS damping_points(id INTEGER PRIMARY KEY, test_id INTEGER NOT NULL REFERENCES damping_tests(id) ON DELETE CASCADE, table_name TEXT, velocity REAL, tolerance REAL, drawing REAL, found REAL);
CREATE TABLE IF NOT EXISTS unlinked_rows(id INTEGER PRIMARY KEY, kind TEXT, source_id INTEGER REFERENCES sources(id), code TEXT, payload TEXT, reason TEXT);
"""
SCHEMA_V5 = """
CREATE TABLE IF NOT EXISTS drawing_files(id INTEGER PRIMARY KEY, filename TEXT NOT NULL, stored_name TEXT NOT NULL, ext TEXT, size INTEGER, sha256 TEXT, rev_num INTEGER NOT NULL DEFAULT 0, rev_label TEXT,
  rev_auto INTEGER DEFAULT 0, note TEXT, uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP, batch_id INTEGER REFERENCES import_batches(id));
CREATE TABLE IF NOT EXISTS drawing_links(file_id INTEGER NOT NULL REFERENCES drawing_files(id) ON DELETE CASCADE, code TEXT NOT NULL, PRIMARY KEY(file_id, code));
CREATE INDEX IF NOT EXISTS ix_dl_code ON drawing_links(code);
CREATE INDEX IF NOT EXISTS ix_df_sha ON drawing_files(sha256);
CREATE TABLE IF NOT EXISTS generic_rows(id INTEGER PRIMARY KEY, source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE, batch_id INTEGER REFERENCES import_batches(id), sheet TEXT, row_no INTEGER, row_hash TEXT NOT NULL, payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_gr_src ON generic_rows(source_id, row_hash);
"""
SCHEMA_V6 = """
CREATE TABLE IF NOT EXISTS rd_flags(code TEXT NOT NULL, suggestion TEXT NOT NULL, flag TEXT NOT NULL, value INTEGER NOT NULL, by_user TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(code, suggestion, flag));
CREATE TABLE IF NOT EXISTS brand_items(id INTEGER PRIMARY KEY, brand TEXT NOT NULL, code TEXT NOT NULL, norm_code TEXT NOT NULL, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, perfect_code TEXT, description TEXT,
  item_type TEXT, vehicle TEXT, application TEXT, years TEXT, box_code TEXT, suppliers TEXT, source_id INTEGER REFERENCES sources(id));
CREATE INDEX IF NOT EXISTS ix_bi_norm ON brand_items(brand, norm_code);
"""
# Controle de status dos itens em DES / R-D. Valor efetivo = marcação manual (rd_flags) ou, se não houver, o que a planilha indica.
FLAGS_VIEW = """CREATE VIEW v_rd_flags AS
WITH a AS (SELECT code, suggestion, upper(coalesce(status,'')||' '||coalesce(drawing_substatus,'')||' '||coalesce(validation_substatus,'')) t FROM rd_projects),
g AS (SELECT code, suggestion, MAX(t LIKE '%PENDENTE VALIDA%') pv, MAX(t LIKE '%REPROV%') vr, MAX(t LIKE '%DESENHO FORNECEDOR%') pd, MAX(t LIKE '%PENDENTE COMPRAS%') pc FROM a GROUP BY code, suggestion)
SELECT g.code, g.suggestion,
 COALESCE((SELECT value FROM rd_flags f WHERE f.code=g.code AND f.suggestion=g.suggestion AND f.flag='pend_validacao'), g.pv) pend_validacao,
 COALESCE((SELECT value FROM rd_flags f WHERE f.code=g.code AND f.suggestion=g.suggestion AND f.flag='val_reprovada'), g.vr) val_reprovada,
 COALESCE((SELECT value FROM rd_flags f WHERE f.code=g.code AND f.suggestion=g.suggestion AND f.flag='pend_desenho_forn'), g.pd) pend_desenho_forn,
 COALESCE((SELECT value FROM rd_flags f WHERE f.code=g.code AND f.suggestion=g.suggestion AND f.flag='pend_compras'), g.pc) pend_compras,
 g.pv a_pv, g.vr a_vr, g.pd a_pd, g.pc a_pc FROM g"""
NEW_COLUMNS["import_batches"] = [("rows_read","INTEGER")]
NEW_COLUMNS["products"] += [("catalog_position","INTEGER"),("catalog_group","TEXT")]
NEW_COLUMNS["sample_orders"] = [("side","TEXT")]
NEW_COLUMNS["rd_projects"] = [("make","TEXT"),("vehicle","TEXT"),("application_text","TEXT"),("year_from","INTEGER"),("year_to","INTEGER"),("description","TEXT")]

def migrate():
    with conn() as c:
        c.executescript(SCHEMA_V2 + SCHEMA_V3 + SCHEMA_V4 + SCHEMA_V5 + SCHEMA_V6)
        c.execute("DROP VIEW IF EXISTS v_rd_flags"); c.execute(FLAGS_VIEW)
        for t, cols in NEW_COLUMNS.items():
            have = {r["name"] for r in c.execute(f"PRAGMA table_info({t})")}
            for n, ty in cols:
                if n not in have: c.execute(f"ALTER TABLE {t} ADD COLUMN {n} {ty}")
        c.execute("CREATE INDEX IF NOT EXISTS ix_codes_norm ON codes(normalized_code)")
        c.execute("CREATE INDEX IF NOT EXISTS ix_rd_code ON rd_projects(code)")
        # amostras antigas: deduz o lado a partir do texto da aplicação (LD / LE / LD/LE)
        import re
        for oid, app in c.execute("SELECT id,application FROM sample_orders WHERE side IS NULL AND application IS NOT NULL").fetchall():
            sd = side_from_text(app)
            if sd: c.execute("UPDATE sample_orders SET side=? WHERE id=?", (sd, oid))

def side_from_text(t):
    """'... DIANT. LD/LE ...' -> 'ambos'; 'LD' -> 'direito'; 'LE' -> 'esquerdo'; senão None."""
    import re
    d = (t or "").upper()
    if re.search(r"\bL\s*D\s*/\s*L\s*E\b|\bL\s*E\s*/\s*L\s*D\b|\bAMBOS\b", d): return "ambos"
    if re.search(r"\bLD\b|DIREIT", d): return "direito"
    if re.search(r"\bLE\b|ESQUERD", d): return "esquerdo"
    return None
