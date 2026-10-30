// Telas: produtos, pesquisa, aplicações, comparação, equivalências, amostras, pendências, fontes, configurações.
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const J = async (u, o) => { const r = await fetch(u, o), d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || ("Erro " + r.status)); return d; };
  const post = (u, b) => J(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b || {}) });
  const qs = o => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null)).toString();
  const num = (v, d = 0) => v == null ? "–" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: d });
  const brl = v => "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const SYS = { gas: "Gás", oleo: "Óleo" }, yr = a => a.year_from ? a.year_from + (a.year_to && a.year_to !== a.year_from ? "–" + a.year_to : "") : "–";
  const T = (h, rows) => `<div class="tbl"><table><tr>${h.map(x => `<th>${x}</th>`).join("")}</tr>${rows.join("")}</table></div>`;
  const lnk = (id, t) => `<a href="#" data-ficha="${id}">${esc(t)}</a>`;
  const empty = m => `<div class="notice soon"><img src="/static/img/amortecedor-desenho.png" alt="" width="72"><div>${m}</div></div>`;
  const root = $("#panel"), page = root.dataset.page, url = new URLSearchParams(location.search);
  const fail = e => { root.insertAdjacentHTML("afterbegin", `<div class="notice err">${esc(e.message)}</div>`); };

  // ---------- ficha técnica (janela) ----------
  const dlg = document.createElement("dialog"); dlg.className = "dlg"; document.body.appendChild(dlg);
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
  document.addEventListener("click", e => { const a = e.target.closest("[data-ficha]"); if (a) { e.preventDefault(); openFicha(a.dataset.ficha); } });
  const kv = (k, v) => `<div><small>${k}</small><b>${v == null || v === "" ? "—" : esc(v)}</b></div>`;
  const sec = (t, n, h) => `<details class="sec" ${n ? "open" : ""}><summary>${t} <span class="badge">${n}</span></summary>${n ? h : '<p class="muted">Nenhum dado nas bases importadas.</p>'}</details>`;
  async function openFicha(id) {
    try {
      const p = await J("/api/products/" + id), d = p.dimensions || {}, b = p.box;
      dlg.innerHTML = `<div class="dh"><div><h2>${esc(p.perfect_code)}</h2><p>${esc(p.description || "")}</p></div><div><a class="btn ghost" href="/comparacao?ids=${p.id}">Comparar</a> <button class="btn ghost" data-close>Fechar</button></div></div>
      <div class="kvs">${kv("Posição no catálogo", p.catalog_position)}${kv("Grupo", p.catalog_group)}${kv("Família", p.family)}${kv("Sistema", SYS[p.system_type])}${kv("EAN", p.ean)}${kv("NCM", p.ncm)}${kv("Peso (kg)", p.weight_kg)}${kv("Descrição (ES)", p.description_es)}
      ${kv("Lmin (mm)", d.lmin_mm)}${kv("Lmax (mm)", d.lmax_mm)}${kv("Curso (mm)", d.stroke_mm)}${kv("Ø haste (mm)", d.rod_diameter_mm)}${kv("Corpo (mm)", d.body_length_mm)}${kv("Ø tubo (mm)", d.tube_diameter_mm)}${kv("Fixação sup.", d.upper_mount)}${kv("Fixação inf.", d.lower_mount)}
      ${kv("Caixa", p.package_code)}${kv("Dim. caixa (mm)", b && b.raw_dims)}${kv("Embalagem (catálogo)", p.package_note)}${kv("Características", p.features)}</div><p class="muted">“—” = não consta nas bases importadas (nada foi inventado).</p>
      <div data-dwblock="${esc(p.perfect_code)}"></div>
      ${sec("Par direito/esquerdo", p.pair.length, p.pair.map(x => `${lnk(x.id, x.perfect_code)} (${x.lado})`).join(" · "))}
      ${sec("Referência cruzada (concorrentes e OEM)", (p.cross || []).length, `<div class="xref">${xchips(p.cross || [])}</div>`)}
      ${sec("Códigos (OEM, fornecedor, concorrente)", p.codes.filter(c => !c.is_cross).length, T(["Tipo", "Código", "Marca/fornecedor", "Fonte"], p.codes.filter(c => !c.is_cross).map(c => `<tr><td>${esc(c.code_type)}</td><td>${esc(c.code)}</td><td>${esc(c.brand || "")}</td><td>${esc(c.source || "")}</td></tr>`)))}
      ${sec("Aplicações veiculares", p.applications.length, T(["Montadora", "Modelo", "Aplicação", "Anos", "Eixo", "Lado", "Fonte"], p.applications.map(a => `<tr><td>${esc(a.make || "")}</td><td>${esc(a.model || "")}</td><td>${esc(a.application_text || "")}</td><td>${yr(a)}</td><td>${esc(a.axle || "")}</td><td>${esc(a.side || "")}</td><td>${esc(a.source || "")}</td></tr>`)))}
      ${sec("Estrutura (componentes)", p.components.length, T(["Seq.", "Componente", "Descrição", "Qtd"], p.components.map(c => `<tr><td>${c.seq ?? ""}</td><td>${esc(c.component_code)}</td><td>${esc(c.component_desc || "")}</td><td>${c.qty ?? ""}</td></tr>`)))}
      ${sec("Certificados Inmetro", p.certificates.length, T(["Nº Inmetro", "Família", "Descrição", "Fonte"], p.certificates.map(c => `<tr><td>${esc(c.inmetro_number || "")}</td><td>${esc(c.family || "")}</td><td>${esc(c.cert_description || "")}</td><td>${esc(c.source || "")}</td></tr>`)))}
      ${sec("Fornecedores (ERP)", p.supplier_items.length, T(["Fornecedor", "Item ERP", "Tipo", "Cód. fornecedor 2"], p.supplier_items.map(c => `<tr><td>${esc(c.supplier_name || "")}</td><td>${esc(c.erp_code || "")}</td><td>${esc(c.item_type || "")}</td><td>${esc(c.supplier_code2 || "")}</td></tr>`)))}
      ${sec("Desenvolvimento (R&D)", p.rd.length, T(["Tipo", "Status", "Fornecedor", "Veículo", "Aplicação", "Anos"], p.rd.map(r => `<tr><td>${r.suggestion === "DES" ? "Desenvolvimento (novo)" : r.suggestion === "R-D" ? "Redesenvolvimento" : esc(r.suggestion || "")}</td><td>${esc(r.status || "")}</td><td>${esc(r.supplier || "")}</td><td>${esc(r.vehicle || "")}</td><td>${esc(r.application_text || "")}</td><td>${yr({ year_from: r.year_from, year_to: r.year_to })}</td></tr>`)))}
      ${sec("Compra de amostras", p.samples.length, p.samples.map(s => `SC ${esc(s.sc_number || "–")} · ${esc(s.sample_code || "")} · ${esc(s.supplier || "")} · ${esc(s.stage)}`).join("<br>"))}
      ${sec("Pendências", p.pendencies.length, T(["Tipo", "Campo", "Descrição", "Status"], p.pendencies.map(x => `<tr><td>${esc(x.kind)}</td><td>${esc(x.field || "")}</td><td>${esc(x.description || "")}</td><td>${esc(x.status)}</td></tr>`)))}
      ${sec("Sugestões de equivalência", p.equivalences.length, p.equivalences.map(e => `${esc(e.a_code)} × ${esc(e.b_code)} — ${e.score}% (${e.confidence}) · ${e.status}`).join("<br>"))}`;
      dlg.showModal(); dwBlocks(dlg);
    } catch (e) { alert(e.message); }
  }

  // ---------- lista genérica com filtros e paginação ----------
  function listView({ form, endpoint, head, row, note = "", xlsx = "", init = null, after = null }) {
    root.innerHTML = `${note}<form class="toolbar">${form}<button type="reset" class="btn ghost sm">Limpar filtros</button></form><div class="toolbar"><span class="summary" id="sum"></span><span style="flex:1"></span>${xlsx ? '<a class="btn" id="dl" href="#">⬇ Baixar Excel</a>' : ""}</div><div id="out"></div><div class="pager" id="pg"></div><div id="xtra"></div>`;
    const f = $("form", root); let pg = 1, t;
    const load = async () => {
      try {
        if (xlsx) $("#dl").href = "/api/export/" + xlsx + ".xlsx?" + qs(Object.fromEntries(new FormData(f)));
        const d = await J(endpoint + "?" + qs({ ...Object.fromEntries(new FormData(f)), page: pg }));
        const pages = Math.max(1, Math.ceil(d.total / d.size));
        $("#sum").textContent = d.total.toLocaleString("pt-BR") + " resultado(s)";
        $("#out").innerHTML = d.rows.length ? T(head, d.rows.map(row)) : empty("Nenhum resultado para esses filtros."); dwFill($("#out"));
        $("#pg").innerHTML = pages > 1 ? `<button class="btn ghost" data-p="${pg - 1}" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" data-p="${pg + 1}" ${pg >= pages ? "disabled" : ""}>›</button>` : "";
        if (after) await after(Object.fromEntries(new FormData(f)), d);
        return d;
      } catch (e) { fail(e); }
    };
    f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { pg = 1; load(); }, 300); });
    f.addEventListener("submit", e => { e.preventDefault(); pg = 1; load(); });
    $("#pg").addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b && !b.disabled) { pg = +b.dataset.p; load(); scrollTo(0, 0); } });
    return (async () => { if (init) await init(f); url.forEach((v, k) => { const i = f.elements[k]; if (i) i.value = v; }); f.addEventListener("reset", () => setTimeout(() => { pg = 1; load(); }, 0)); return load(); })();
  }
  const inp = (n, ph, w = "") => `<input name="${n}" placeholder="${ph}" ${w}>`;
  const sel = (n, lab, opts) => `<select name="${n}"><option value="">${lab}</option>${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
  const prodRow = p => `<tr><td>${p.catalog_position ?? "–"}</td><td>${lnk(p.id, p.perfect_code)}</td><td>${esc(p.description || "")}</td><td>${SYS[p.system_type] || "–"}</td><td>${num(p.lmin_mm)}</td><td>${num(p.lmax_mm)}</td><td>${p.apps}</td><td>${p.ncodes}</td><td>${p.pend ? `<span class="badge warn">${p.pend}</span>` : ""}</td>${dwCol(p.perfect_code)}</tr>`;
  const prodHead = ["Pos. catálogo", "Código PERFECT", "Descrição", "Sistema", "Lmin", "Lmax", "Aplic.", "Códigos", "Pend.", "Desenho"];
  const fillSel = (el, items) => { if (!el) return; const keep = el.options[0]; el.innerHTML = ""; el.appendChild(keep); items.forEach(([v, l]) => el.add(new Option(l ?? v, v))); };
  const initLists = async f => { const L = await J("/api/filters"); fillSel(f.elements.make, L.makes.map(x => [x])); fillSel(f.elements.model, L.models.map(x => [x])); fillSel(f.elements.year, L.years.map(y => [String(y)]));
    f.elements.make.addEventListener("change", async () => { const m = f.elements.make.value, cur = f.elements.model.value; const L2 = await J("/api/filters" + (m ? "?make=" + encodeURIComponent(m) : "")); fillSel(f.elements.model, L2.models.map(x => [x])); if (L2.models.includes(cur)) f.elements.model.value = cur; }); };
  const tag = k => `<span class="tag ${k === "Catálogo" ? "cat" : k.replace("-", "")}">${k}</span>`, clip = t => `<span class="clip" title="${esc(t || "")}">${esc(t || "")}</span>`;
  const AX = [["dianteiro", "Dianteiro"], ["traseiro", "Traseiro"]], SD = [["direito", "Direito"], ["esquerdo", "Esquerdo"]];

  // ---------- Em desenvolvimento (DES) e Em redesenvolvimento (R-D) ----------
  const FLG = { pend_validacao: ["Pendente validação", "pv"], val_reprovada: ["Validação reprovada", "vr"], pend_desenho_forn: ["Pendente desenho do fornecedor", "pd"], pend_compras: ["Pendente compras", "pc"] };
  const flagChips = fs => (fs || []).length ? fs.map(k => `<span class="fchip ${FLG[k][1]}">${FLG[k][0]}</span>`).join("") : '<span class="muted">–</span>';
  const xchips = (cs, max = 99) => cs.slice(0, max).map(c => `<span class="xchip"><b>${esc(c.brand || "")}</b> ${esc(c.code)}</span>`).join("") + (cs.length > max ? `<span class="xchip more">+${cs.length - max}</span>` : "");
  const flagPanel = (k, code, fl) => `<div class="fpanel" data-fk="${k}" data-fc="${esc(code)}"><h4>Controle de status</h4><div class="fgrid2">${Object.entries(FLG).map(([key, [lab, cls]]) => { const s = fl[key];
    return `<label class="swl ${cls}"><span class="sw"><input type="checkbox" data-fl="${key}" ${s.value ? "checked" : ""}><i></i></span><span><b>${lab}</b><small>${s.manual ? "marcação manual" + (s.by ? " · " + esc(s.by) : "") + ` · <a href="#" data-flauto="${key}">voltar ao automático</a>` : s.auto ? "indicado pela planilha" : "automático (sem indicação na planilha)"}</small></span></label>`; }).join("")}</div></div>`;
  const rdOpen = async (k, code) => { try { const d = await J(`/api/rd/${k}/item/` + encodeURIComponent(code)); const lab = k === "des" ? "DES" : "R-D", other = d.other.map(o => o.suggestion);
    dlg.innerHTML = `<div class="dh"><div><h2>${esc(d.code)} ${tag(lab)} ${other.map(tag).join(" ")}</h2><p>${esc(d.description || "")}</p></div><div>${d.product ? `<a class="btn ghost" href="#" data-ficha="${d.product.id}">Ficha do catálogo (${esc(d.product.perfect_code)})</a> ` : ""}<button class="btn ghost" data-close>Fechar</button></div></div>
      ${other.length ? `<div class="notice">Este código também consta em <b>${other.join(", ")}</b> na planilha.</div>` : ""}
      ${d.product ? "" : '<p class="muted">Ainda não está no catálogo.</p>'}
      ${flagPanel(k, d.code, d.flags)}
      ${d.cross && d.cross.length ? `<div class="xref"><b>Referência cruzada:</b> ${xchips(d.cross)}</div>` : ""}
      <div data-dwblock="${esc(d.code)}"></div>
      <h4>Linhas da planilha (${d.rows.length})</h4>` + T(["Montadora", "Veículo", "Aplicação", "Anos", "Status", "Pend. desenho", "Pend. validação", "Fornecedor", "Amostra comprada", "Amostra enviada"], d.rows.map(r => `<tr><td>${esc(r.make || "")}</td><td>${esc(r.vehicle || "")}</td><td>${esc(r.application_text || "")}</td><td>${yr(r)}</td><td>${esc(r.status || "")}</td><td>${esc(r.drawing_substatus || "")}</td><td>${esc(r.validation_substatus || "")}</td><td>${esc(r.supplier || "")}</td><td>${r.bought || ""}</td><td>${r.sent || ""}</td></tr>`)) +
      `<h4>Compras de amostra ligadas (${d.samples.length})</h4>` + (d.samples.length ? d.samples.map(x => `SC ${esc(x.sc_number || "–")} · ${esc(x.sample_code || "")} · ${esc(x.supplier || "")} · ${esc(x.stage)}`).join("<br>") + ` <a href="/amostras?q=${encodeURIComponent(d.code)}">abrir em Compra de amostras</a>` : '<p class="muted">Nenhuma.</p>') +
      `<h4>Ensaios de damping force (${d.damping.length})</h4>` + (d.damping.length ? `<a href="/damping">ver em Damping force</a>` : '<p class="muted">Nenhum.</p>'); dlg.showModal(); dwBlocks(dlg); } catch (e) { alert(e.message); } };
  const flagRefresh = () => { const f = $("form.toolbar", root); if (f) f.dispatchEvent(new Event("input", { bubbles: true })); };
  dlg.addEventListener("change", async e => { const t = e.target.closest("[data-fl]"), pn = e.target.closest(".fpanel"); if (!t || !pn) return;
    try { const r = await post(`/api/rd/${pn.dataset.fk}/item/${encodeURIComponent(pn.dataset.fc)}/flags`, { flag: t.dataset.fl, value: t.checked }); pn.outerHTML = flagPanel(pn.dataset.fk, pn.dataset.fc, r.flags); flagRefresh(); } catch (er) { alert(er.message); t.checked = !t.checked; } });
  dlg.addEventListener("click", async e => { const a = e.target.closest("[data-flauto]"), pn = e.target.closest(".fpanel"); if (!a || !pn) return; e.preventDefault();
    try { const r = await post(`/api/rd/${pn.dataset.fk}/item/${encodeURIComponent(pn.dataset.fc)}/flags`, { flag: a.dataset.flauto, value: null }); pn.outerHTML = flagPanel(pn.dataset.fk, pn.dataset.fc, r.flags); flagRefresh(); } catch (er) { alert(er.message); } });
  document.addEventListener("click", e => { const a = e.target.closest("[data-rd]"); if (a) { e.preventDefault(); rdOpen(a.dataset.rd, a.dataset.code); } });
  function rdPage(k) {
    const lab = k === "des" ? "DES" : "R-D", name = k === "des" ? "desenvolvimento" : "redesenvolvimento";
    return listView({ endpoint: `/api/rd/${k}`, xlsx: name, init: async f => { const fc = await J(`/api/rd/${k}/facets`), o = x => [x.v, `${x.v} (${x.n})`];
        fillSel(f.elements.status, fc.status.map(o)); fillSel(f.elements.drawing, fc.drawing.map(o)); fillSel(f.elements.validation, fc.validation.map(o)); fillSel(f.elements.supplier, fc.supplier.map(o)); fillSel(f.elements.make, fc.make.map(x => [x.v, `${x.v} (${x.n})`]));
        $("#rdc").innerHTML = `<div class="card"><span class="num sm">${fc.total}</span><small>${k === "des" ? "itens em desenvolvimento" : "itens em redesenvolvimento"} (${fc.lines} linhas)</small></div>` + fc.status.map(x => `<button type="button" class="card stat" data-st="${esc(x.v)}"><span class="num sm">${x.n}</span><small>${esc(x.v)}</small></button>`).join("");
        $("#rdc").insertAdjacentHTML("afterend", `<h4 class="fh">Controle de status <small class="muted">— clique para filtrar</small></h4><div class="cards mini-cards flrow" id="rdf">` + Object.entries(FLG).map(([key, [lab, cls]]) => `<button type="button" class="card stat fl ${cls}" data-flt="${key}"><span class="num sm">${fc.flags[key]}</span><small>${lab}</small></button>`).join("") + `</div>`);
        $("#rdf").addEventListener("click", e => { const g = e.target.closest("[data-flt]"); if (g) { f.elements.flag.value = f.elements.flag.value === g.dataset.flt ? "" : g.dataset.flt; f.dispatchEvent(new Event("input", { bubbles: true })); $$("#rdf .fl").forEach(x => x.classList.toggle("on", x.dataset.flt === f.elements.flag.value)); } });
        $("#rdc").addEventListener("click", e => { const b = e.target.closest("[data-st]"), g = e.target.closest("[data-flt]"); if (b) { f.elements.status.value = b.dataset.st; f.dispatchEvent(new Event("input", { bubbles: true })); } if (g) { f.elements.flag.value = f.elements.flag.value === g.dataset.flt ? "" : g.dataset.flt; f.dispatchEvent(new Event("input", { bubbles: true })); } });
        const pf = new URLSearchParams(location.search).get("flag"); if (pf) f.elements.flag.value = pf;
        // marcação em lote: seleciona linhas e aplica um controle de status
        const bar = document.createElement("div"); bar.className = "bulkbar"; bar.hidden = true;
        bar.innerHTML = `<b id="bn">0</b> selecionado(s) <select id="bf">${Object.entries(FLG).map(([key, v]) => `<option value="${key}">${v[0]}</option>`).join("")}</select><button type="button" class="btn sm" data-bv="1">Marcar</button><button type="button" class="btn ghost sm" data-bv="0">Desmarcar</button><button type="button" class="btn ghost sm" data-bv="auto">Voltar ao automático</button><button type="button" class="btn ghost sm" data-bv="x">Limpar seleção</button>`;
        $("#out").before(bar);
        const sel = () => $$(".rdsel:checked", root).map(c => c.value), upd = () => { const n = sel().length; bar.hidden = !n; $("#bn", bar).textContent = n; };
        root.addEventListener("change", e => { if (e.target.classList.contains("rdall")) $$(".rdsel", root).forEach(c => c.checked = e.target.checked); if (e.target.matches(".rdall,.rdsel")) upd(); });
        bar.addEventListener("click", async e => { const b = e.target.closest("[data-bv]"); if (!b) return; if (b.dataset.bv === "x") { $$(".rdsel,.rdall", root).forEach(c => c.checked = false); return upd(); }
          const codes = sel(); if (!codes.length) return; const val = b.dataset.bv === "auto" ? null : b.dataset.bv === "1";
          if (!confirm(`${val === null ? "Voltar ao automático" : val ? "Marcar" : "Desmarcar"} “${FLG[$("#bf", bar).value][0]}” em ${codes.length} item(ns)?`)) return;
          try { await post(`/api/rd/${k}/flags/bulk`, { codes, flag: $("#bf", bar).value, value: val }); bar.hidden = true; f.dispatchEvent(new Event("input", { bubbles: true })); } catch (er) { alert(er.message); } }); },
      note: `<p class="muted">${k === "des" ? "DES = item novo em desenvolvimento." : "R-D = item em redesenvolvimento."} Cada linha é um código distinto; um código pode ter várias aplicações. Fonte: planilha DadosR-D e DES. Clique no código para ver o detalhe.</p><div class="cards mini-cards" id="rdc"></div>`,
      form: inp("q", "Buscar código, descrição, veículo, aplicação, fornecedor…", 'style="flex:1;min-width:240px"') + sel("status", "Status", []) + sel("drawing", "Pendência de desenho", []) + sel("validation", "Pendência de validação", []) + sel("supplier", "Fornecedor", []) + sel("make", "Montadora", []) +
        sel("flag", "Controle de status", [...Object.entries(FLG).map(([k, v]) => [k, v[0]]), ["nenhum", "Sem pendência"]]) + sel("catalog", "No catálogo?", [["sim", "Sim, já no catálogo"], ["nao", "Não está no catálogo"]]) + sel("sample", "Amostra", [["comprada", "Comprada"], ["enviada", "Enviada"], ["nenhuma", "Sem amostra"]]),
      head: ["<input type=\"checkbox\" class=\"rdall\" title=\"Selecionar a página\">", "Código", "Controle de status", "Descrição", "Montadora(s)", "Veículo(s)", "Linhas", "Status", "Pend. desenho", "Pend. validação", "Fornecedor", "Amostra comprada", "Amostra enviada", "Catálogo", "Desenho"],
      row: r => `<tr><td><input type="checkbox" class="rdsel" value="${esc(r.code)}"></td><td><a href="#" data-rd="${k}" data-code="${esc(r.code)}">${esc(r.code)}</a>${r.also_other ? ` ${tag(k === "des" ? "R-D" : "DES")}` : ""}</td><td class="fcell">${flagChips(r.flags)}</td><td>${clip(r.description)}</td><td>${clip(r.makes)}</td><td>${clip(r.vehicles)}</td><td>${r.n_rows}</td><td>${clip(r.statuses)}</td><td>${clip(r.drawing)}</td><td>${clip(r.validation)}</td><td>${clip(r.suppliers)}</td><td>${r.bought || "–"}</td><td>${r.sent || "–"}</td><td>${r.product_id ? lnk(r.product_id, "ficha") : "–"}</td>${dwCol(r.code)}</tr>` });
  }
  // ---------- desenhos: miniaturas, bloco nos cadastros e a página do módulo ----------
  const FMT = { pdf: "PDF", dwg: "DWG", dxf: "DXF", step: "STEP", stp: "STEP", igs: "IGES", iges: "IGES", png: "PNG", jpg: "JPG", jpeg: "JPG", gif: "GIF", webp: "WEBP", svg: "SVG", zip: "ZIP" };
  const fext = e => String(e || "").replace(/^\./, "").toLowerCase();
  const dwTile = (id, ext, big = false) => ["pdf", "png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(fext(ext))
    ? `<img class="dwimg" loading="lazy" alt="" src="/api/drawings/thumb/${id}" data-ext="${esc(fext(ext))}">` : `<span class="ftile ${big ? "big" : ""}"><b>${esc(FMT[fext(ext)] || fext(ext).toUpperCase() || "ARQ")}</b></span>`;
  document.addEventListener("error", e => { const i = e.target; if (i.classList && i.classList.contains("dwimg")) i.replaceWith(Object.assign(document.createElement("span"), { className: "ftile", innerHTML: `<b>${esc(FMT[i.dataset.ext] || i.dataset.ext.toUpperCase())}</b>` })); }, true);
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const dmy = s => s ? String(s).slice(0, 10).split("-").reverse().join("/") : "";
  async function dwBlocks(scope) {   // "Desenho vigente" dentro da ficha do catálogo / detalhe de desenvolvimento
    for (const el of $$("[data-dwblock]", scope)) {
      const code = el.dataset.dwblock;
      try {
        const d = await J("/api/drawings/code/" + encodeURIComponent(code));
        el.innerHTML = `<div class="dwb"><div class="dwb-h"><b>Desenho</b> <span class="rev">${esc(d.label)}</span> <span class="muted">vigente${d.n_revisions > 1 ? ` · ${d.n_revisions - 1} revisão(ões) anterior(es) guardada(s)` : ""}</span> <a href="/desenhos?open=${encodeURIComponent(code)}" class="dwb-l">Ver histórico e arquivos</a></div>
          <div class="dwb-r">${d.current.map(f => `<a class="dwt" href="/api/drawings/file/${f.id}" target="_blank" rel="noopener" title="${esc(f.filename)}"><span class="dwt-i">${dwTile(f.id, f.ext)}</span><small>${esc(f.filename)}</small></a>`).join("")}</div></div>`;
      } catch (e) { el.innerHTML = `<div class="dwb none"><b>Desenho</b> <span class="muted">Nenhum desenho cadastrado para este código.</span> <a href="/desenhos" class="dwb-l">Enviar em Desenhos</a></div>`; }
    }
  }
  async function dwFill(scope) {      // coluna "Desenho" das listas: Rev. vigente
    const els = $$("[data-dw]", scope); if (!els.length) return;
    try {
      const m = await J("/api/drawings/lookup?codes=" + encodeURIComponent([...new Set(els.map(e => e.dataset.dw))].join(",")));
      els.forEach(e => { const x = m[e.dataset.dw]; e.innerHTML = x ? `<a href="/desenhos?open=${encodeURIComponent(e.dataset.dw)}" class="rev" title="${x.revs} revisão(ões) guardada(s)">${esc(x.label)}</a>` : '<span class="muted">–</span>'; });
    } catch (e) { /* coluna é só informativa */ }
  }
  const dwCol = c => `<td><span data-dw="${esc(c)}"></span></td>`;

  async function dwCollect(dt) {   // arquivos e pastas soltos na área de envio
    const out = [], walk = async en => {
      if (en.isFile) out.push(await new Promise(r => en.file(r)));
      else if (en.isDirectory) { const rd = en.createReader(); let b; do { b = await new Promise(r => rd.readEntries(r)); for (const x of b) await walk(x); } while (b.length); }
    };
    for (const it of dt.items || []) { const en = it.webkitGetAsEntry && it.webkitGetAsEntry(); if (en) await walk(en); }
    return out.length ? out : [...dt.files];
  }

  const dwPrevOk = e => ["pdf", "png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(fext(e));
  const dwNav = { list: [], onDone: null };   // códigos da galeria atual (setas ← → no visualizador)

  function desenhos() {
    root.innerHTML = `<section class="dw-hero" id="hero"><div class="dw-hero-t"><h2>Desenhos técnicos</h2>
        <p>Solte os arquivos de desenho em <b>qualquer formato</b>. O sistema lê o <b>código</b> e a <b>revisão</b> pelo nome (ex.: <code>AMD0170_REV02.pdf</code>), vincula a todos os cadastros — catálogo, desenvolvimento e redesenvolvimento — e guarda as revisões anteriores. Nos cadastros aparece sempre a <b>vigente</b>.</p></div>
      <label class="dw-drop" id="dz"><svg width="34" height="34" viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>
        <span class="dw-dt"><b>Arraste arquivos ou uma pasta para cá</b><span class="muted">PDF · DWG · DXF · STEP · imagens · ZIP · qualquer formato</span></span>
        <span class="dw-btns"><span class="btn">Escolher arquivos</span><button type="button" class="btn ghost" id="dw-folder">Escolher pasta</button></span>
        <input type="file" id="dw-f" multiple hidden><input type="file" id="dw-d" webkitdirectory hidden></label></section>
      <p id="dw-msg" class="imp-msg" role="status"></p><div class="dw-stats" id="dw-stats"></div>
      <form class="toolbar dw-tb" id="dw-form"><input name="q" placeholder="Buscar código, descrição ou nome do arquivo…" style="flex:1;min-width:240px">
        <select name="where"><option value="">Todos os cadastros</option><option value="cat">No catálogo</option><option value="des">Em desenvolvimento</option><option value="rd">Em redesenvolvimento</option><option value="sem">Sem vínculo</option></select>
        <select name="ext"><option value="">Todos os formatos</option>${[".pdf", ".dwg", ".dxf", ".step", ".png", ".jpg"].map(x => `<option value="${x}">${x.slice(1).toUpperCase()}</option>`).join("")}</select>
        <select name="sort"><option value="recent">Mais recentes</option><option value="code">Código (A–Z)</option><option value="rev">Mais revisões</option></select>
        <span class="seg sm" id="dw-size" title="Tamanho dos cartões"><button type="button" data-s="170">P</button><button type="button" data-s="215" class="on">M</button><button type="button" data-s="290">G</button></span>
        <a class="btn" id="dw-xl" href="/api/export/desenhos.xlsx">⬇ Excel</a></form>
      <div class="summary" id="dw-sum"></div><div class="dw-grid" id="dw-grid"></div><div class="pager" id="dw-pg"></div>`;
    const msg = (t, err) => { const m = $("#dw-msg"); m.textContent = t; m.className = "imp-msg" + (err ? " err" : ""); };
    const f = $("#dw-form"); let pg = 1, t;
    const ICO = { codes: "M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2zM8 8h8M8 12h8M8 16h5", files: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5", old: "M12 8v5l3 2M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5", orph: "M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1", miss: "M12 3l10 18H2zM12 10v5M12 18v.5" };
    const stats = async () => { try { const s = await J("/api/drawings/stats");
      $("#hero").classList.toggle("compact", s.files > 0);
      $("#dw-stats").innerHTML = [["codes", "Códigos com desenho", s.codes, ""], ["files", "Arquivos guardados", s.files, ""], ["old", "Revisões anteriores", s.old, "guardadas no histórico"], ["orph", "Sem vínculo", s.orphans, s.orphans ? "clique para ver" : "", "sem"], ["miss", "Catálogo sem desenho", s.missing, ""]]
        .map(([k, l, v, h, w]) => `<div class="dws ${w ? "link" : ""}" ${w ? `data-w="${w}"` : ""}><svg viewBox="0 0 24 24"><path d="${ICO[k]}"/></svg><div><span class="num sm">${num(v)}</span><small>${l}${h ? ` · ${h}` : ""}</small></div></div>`).join(""); } catch (e) { } };
    const load = async () => { try {
      const d = await J("/api/drawings?" + qs({ ...Object.fromEntries(new FormData(f)), page: pg })), pages = Math.max(1, Math.ceil(d.total / d.size));
      $("#dw-sum").textContent = num(d.total) + " desenho(s)"; dwNav.list = d.rows.filter(c => c.code).map(c => c.code);
      $("#dw-grid").innerHTML = d.rows.length ? d.rows.map(c => c.code
        ? `<article class="dw-card" data-open="${esc(c.code)}" tabindex="0"><div class="dw-th"><div class="sk"></div>${dwTile(c.thumb_id, c.thumb_ext, true)}<span class="rev">${esc(c.label)}</span><span class="dw-ex">${c.exts.map(x => `<i>${esc(x)}</i>`).join("")}</span>
            <div class="dw-ov"><span class="btn sm">Visualizar</span><a class="btn ghost sm" href="/api/drawings/file/${c.thumb_id}?download=1" title="Baixar o arquivo vigente">⬇</a></div></div>
            <div class="dw-bd"><b>${esc(c.code)}</b><span class="clip" title="${esc(c.description || "")}">${esc(c.description || (c.registered ? "" : "Código ainda não cadastrado"))}</span>
            <div class="dw-tags">${c.registries.map(tag).join(" ")}</div><small class="muted">${dmy(c.updated)} · ${c.n_revisions} revisão(ões)</small></div></article>`
        : `<article class="dw-card orph" data-orph="${c.file_id}" data-name="${esc(c.filename)}" tabindex="0"><div class="dw-th"><div class="sk"></div>${dwTile(c.thumb_id, c.thumb_ext, true)}<span class="rev warn">Sem código</span></div><div class="dw-bd"><b class="clip" title="${esc(c.filename)}">${esc(c.filename)}</b><small class="muted">Clique para informar o código</small></div></article>`).join("")
        : empty("Nenhum desenho com esses filtros. Arraste os arquivos para a área acima.");
      $("#dw-pg").innerHTML = pages > 1 ? `<button class="btn ghost" data-p="${pg - 1}" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" data-p="${pg + 1}" ${pg >= pages ? "disabled" : ""}>›</button>` : "";
    } catch (e) { fail(e); } };
    const refresh = () => { stats(); load(); }; dwNav.onDone = refresh;
    f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { pg = 1; load(); }, 300); }); f.addEventListener("submit", e => e.preventDefault());
    $("#dw-pg").addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b && !b.disabled) { pg = +b.dataset.p; load(); scrollTo(0, 0); } });
    $("#dw-size").onclick = e => { const b = e.target.closest("[data-s]"); if (!b) return; $$("#dw-size button").forEach(x => x.classList.toggle("on", x === b)); $("#dw-grid").style.setProperty("--cw", b.dataset.s + "px"); };
    $("#dw-stats").onclick = e => { const s = e.target.closest("[data-w]"); if (s) { f.elements.where.value = s.dataset.w; pg = 1; load(); } };
    const openCard = e => { if (e.target.closest("a")) return; const c = e.target.closest("[data-open],[data-orph]"); if (!c || (e.type === "keydown" && e.key !== "Enter")) return; c.dataset.open ? dwOpen(c.dataset.open, refresh) : dwOrphan(+c.dataset.orph, c.dataset.name, refresh); };
    $("#dw-grid").addEventListener("click", openCard); $("#dw-grid").addEventListener("keydown", openCard);
    const send = async files => {
      if (!files.length) return; const fd = new FormData(); files.forEach(x => fd.append("files", x, x.name));
      msg(`Enviando ${files.length} arquivo(s) para análise…`);
      try { const r = await J("/api/drawings/check", { method: "POST", body: fd }); msg(""); dwReview(r, refresh); } catch (e) { msg(e.message, true); }
    };
    $("#dw-f").onchange = e => { send([...e.target.files]); e.target.value = ""; };
    $("#dw-d").onchange = e => { send([...e.target.files]); e.target.value = ""; };
    $("#dw-folder").onclick = e => { e.preventDefault(); e.stopPropagation(); $("#dw-d").click(); };
    const dz = $("#dz"); ["dragenter", "dragover"].forEach(n => dz.addEventListener(n, e => { e.preventDefault(); dz.classList.add("over"); }));
    ["dragleave", "drop"].forEach(n => dz.addEventListener(n, e => { e.preventDefault(); dz.classList.remove("over"); }));
    dz.addEventListener("drop", async e => { msg("Lendo os arquivos soltos…"); send(await dwCollect(e.dataTransfer)); });
    const p0 = new URLSearchParams(location.search); if (p0.get("q")) f.elements.q.value = p0.get("q");
    stats(); load().then(() => { if (p0.get("open")) dwOpen(p0.get("open"), refresh); });
  }

  function dwReview(res, done) {
    const items = res.items, c = a => items.filter(i => i.action === a).length;
    const ACT = { nova: ["Novo desenho", "ok"], nova_revisao: ["Nova revisão", "new"], atualiza_revisao: ["Atualiza a revisão", "new"], revisao_antiga: ["Revisão antiga → histórico", "warn"], duplicado: ["Já existe: ignorado", "mut"], sem_vinculo: ["Sem código", "bad"] };
    const todo = items.filter(i => i.action !== "duplicado").length;
    dlg.classList.add("wide");
    dlg.innerHTML = `<div class="dh"><div><h2>Revisar envio de desenhos</h2><p>${items.length} arquivo(s) analisado(s). Confira o código e a revisão reconhecidos; nada foi gravado ainda.</p></div><div><button class="btn ghost" data-close>Cancelar</button></div></div>
      <div class="dw-sumline">${[["Novos", c("nova")], ["Novas revisões", c("nova_revisao") + c("atualiza_revisao")], ["Histórico", c("revisao_antiga")], ["Ignorados", c("duplicado")], ["Sem código", c("sem_vinculo")]].map(([l, v]) => `<span><b>${v}</b> ${l}</span>`).join("")}</div>
      <div class="tbl dw-rev"><table><tr><th>Arquivo</th><th>Código(s) reconhecido(s)</th><th>Revisão</th><th>O que vai acontecer</th></tr>${items.map((i, n) => `<tr data-n="${n}" data-name="${esc(i.name)}"><td><span class="clip" title="${esc(i.name)}">${esc(i.name)}</span><small class="muted">${esc(i.ext.slice(1).toUpperCase())} · ${kb(i.size)}</small></td>
        <td><input class="dw-code" value="${esc(i.codes.join(", "))}" placeholder="informe o código" ${i.action === "duplicado" ? "disabled" : ""}>${i.unregistered ? '<small class="muted">ainda não cadastrado</small>' : ""}</td>
        <td><input class="dw-rev-i" size="4" value="${esc(i.rev_auto ? "" : i.rev_label)}" placeholder="${esc(i.rev_label)}" title="Vazio = automática" ${i.action === "duplicado" ? "disabled" : ""}></td>
        <td><span class="badge ${ACT[i.action][1]}">${ACT[i.action][0]}</span><small class="muted">${esc(i.note)}</small></td></tr>`).join("")}</table></div>
      <p id="dw-rmsg" class="imp-msg" role="status"></p>
      <div class="acts"><button class="btn" id="dw-go" ${todo ? "" : "disabled"}>Gravar ${todo} arquivo(s)</button><button class="btn ghost" data-close>Cancelar</button></div>`;
    dlg.addEventListener("close", () => dlg.classList.remove("wide"), { once: true });
    $("#dw-go").onclick = async () => {
      const ov = {}; $$("tr[data-n]", dlg).forEach(tr => { const code = $(".dw-code", tr).value.trim(), rev = $(".dw-rev-i", tr).value.trim(); if (code || rev) ov[tr.dataset.name] = { codes: code, rev }; });
      const b = $("#dw-go"); b.disabled = true; $("#dw-rmsg").textContent = "Gravando…";
      try { const r = await post("/api/drawings/apply", { token: res.token, overrides: ov }), s = r.summary; dlg.close();
        root.insertAdjacentHTML("afterbegin", `<div class="notice">✔ ${s.novos} novo(s), ${s.revisoes} revisão(ões), ${s.ignorados} ignorado(s)${s.sem_vinculo ? `, ${s.sem_vinculo} sem código (vincule clicando no card)` : ""}. Os cadastros já mostram a revisão vigente.</div>`); done && done(); }
      catch (e) { b.disabled = false; $("#dw-rmsg").textContent = e.message; $("#dw-rmsg").className = "imp-msg err"; }
    };
    dlg.showModal();
  }

  async function dwOpen(code, done) {
    try {
      const d = await J("/api/drawings/code/" + encodeURIComponent(code)); let cur = d.current.find(x => dwPrevOk(x.ext)) || d.current[0], zoom = 1;
      const idx = dwNav.list.indexOf(d.code), prevC = idx > 0 ? dwNav.list[idx - 1] : null, nextC = idx >= 0 && idx < dwNav.list.length - 1 ? dwNav.list[idx + 1] : null;
      const src = f => fext(f.ext) === "pdf" ? `/api/drawings/thumb/${f.id}?big=1` : `/api/drawings/file/${f.id}`;
      const prev = f => { const e = fext(f.ext), url = "/api/drawings/file/" + f.id;
        if (dwPrevOk(e)) return `<div class="dw-stage" id="dws"><img id="dwimg" src="${src(f)}" alt="${esc(f.filename)}" ${e === "pdf" ? `data-pdf="${url}"` : ""}></div>`;
        if (e === "svg") return `<div class="dw-stage" id="dws"><img id="dwimg" src="${url}" alt="${esc(f.filename)}"></div>`;
        return `<div class="dw-nop">${dwTile(f.id, f.ext, true)}<p>Este formato não tem pré-visualização no navegador.</p><a class="btn" href="${url}?download=1">⬇ Baixar ${esc(f.filename)}</a></div>`; };
      const revFiles = d.history.map(h => ({ h, f: h.files.find(x => dwPrevOk(x.ext)) })).filter(x => x.f);
      dlg.classList.add("wide");
      dlg.innerHTML = `<div class="dh"><div><h2>${esc(d.code)} <span class="rev">${esc(d.label)}</span> ${d.registries.map(tag).join(" ")}</h2><p>${esc(d.description || "")}</p></div>
        <div class="dw-hact"><button class="btn ghost" id="dw-prv" ${prevC ? "" : "disabled"} title="Desenho anterior (←)">‹</button><button class="btn ghost" id="dw-nxt" ${nextC ? "" : "disabled"} title="Próximo desenho (→)">›</button>
        ${d.product_id ? `<a class="btn ghost" href="#" data-ficha="${d.product_id}">Ficha</a>` : ""}${d.registries.includes("DES") ? `<a class="btn ghost" href="#" data-rd="des" data-code="${esc(d.code)}">DES</a>` : ""}${d.registries.includes("R-D") ? `<a class="btn ghost" href="#" data-rd="rd" data-code="${esc(d.code)}">R-D</a>` : ""}<button class="btn ghost" data-close>Fechar</button></div></div>
        <div class="dw-view"><div class="dw-main"><div class="dw-tools"><button type="button" data-z="-">−</button><span id="dwz">100%</span><button type="button" data-z="+">+</button><button type="button" data-z="0">Ajustar</button><button type="button" data-z="full">Tela cheia</button>
          ${revFiles.length > 1 ? '<button type="button" data-z="cmp" class="cmp">Comparar revisões</button>' : ""}<a class="dw-tl2" id="dwopen" href="/api/drawings/file/${cur.id}" target="_blank" rel="noopener">Abrir original ↗</a></div>
          <div class="dw-prev" id="dwp">${prev(cur)}</div></div>
        <aside><h4>Arquivos vigentes (${esc(d.label)})</h4><div class="dw-files">${d.current.map(f => `<button class="dw-f ${f.id === cur.id ? "on" : ""}" data-pv="${f.id}"><span class="dwt-i">${dwTile(f.id, f.ext)}</span><span><b class="clip" title="${esc(f.filename)}">${esc(f.filename)}</b><small>${kb(f.size)} · ${dmy(f.uploaded_at)}</small></span><a class="dw-dlb" href="/api/drawings/file/${f.id}?download=1" title="Baixar">⬇</a></button>`).join("")}</div>
        <h4>Histórico de revisões</h4><ol class="dw-tl">${d.history.map(h => `<li class="${h.current ? "cur" : ""}"><div><b>${esc(h.label)}</b> ${h.current ? '<span class="badge ok">vigente</span>' : '<span class="badge mut">anterior</span>'}</div>
          ${h.files.map(f => `<div class="dw-hf">${dwPrevOk(f.ext) ? `<span class="dw-mini"><img loading="lazy" src="/api/drawings/thumb/${f.id}" alt=""></span>` : `<span class="dw-mini"><i>${esc((f.ext || "").slice(1).toUpperCase())}</i></span>`}<div><span class="clip" title="${esc(f.filename)}">${esc(f.filename)}</span><small class="muted">${dmy(f.uploaded_at)} · ${kb(f.size)}${f.rev_auto ? " · rev. automática" : ""}</small>
            <span class="dw-la"><a href="/api/drawings/file/${f.id}" target="_blank" rel="noopener">abrir</a> · <a href="/api/drawings/file/${f.id}?download=1">baixar</a> · <a href="#" data-del="${f.id}" data-n="${esc(f.filename)}">excluir</a></span></div></div>`).join("")}</li>`).join("")}</ol></aside></div>`;
      const applyZoom = () => { const im = $("#dwimg"); if (im) { im.style.width = zoom === 1 ? "" : zoom * 100 + "%"; im.style.maxWidth = zoom === 1 ? "100%" : "none"; im.style.maxHeight = zoom === 1 ? "100%" : "none"; } const z = $("#dwz"); if (z) z.textContent = Math.round(zoom * 100) + "%"; };
      const bindImg = () => { const im = $("#dwimg"); if (im && im.dataset.pdf) im.onerror = () => { $("#dws").innerHTML = `<iframe src="${im.dataset.pdf}#view=FitH" title="PDF"></iframe>`; }; };
      const showCmp = () => {
        const opt = x => `<option value="${x.f.id}">${esc(x.h.label)}${x.h.current ? " (vigente)" : ""}</option>`;
        $("#dwp").innerHTML = `<div class="dw-cmp"><div class="dw-cbar"><label>Base <select id="ca">${revFiles.map(opt).join("")}</select></label><label>Sobre <select id="cb">${revFiles.map(opt).join("")}</select></label><label>Mistura <input type="range" id="cs" min="0" max="100" value="50"></label><label class="chk"><input type="checkbox" id="cd"> Só diferenças</label></div>
          <div class="dw-cstage" id="cst"><img id="ci1"><img id="ci2"></div></div>`;
        $("#ca").selectedIndex = Math.min(1, revFiles.length - 1); $("#cb").selectedIndex = 0;
        const up = () => { const a = revFiles.find(x => x.f.id == $("#ca").value).f, b = revFiles.find(x => x.f.id == $("#cb").value).f; $("#ci1").src = src(a); $("#ci2").src = src(b); $("#ci2").style.opacity = $("#cd").checked ? 1 : $("#cs").value / 100; $("#ci2").style.mixBlendMode = $("#cd").checked ? "difference" : "normal"; $("#cst").classList.toggle("diff", $("#cd").checked); };
        ["ca", "cb", "cs", "cd"].forEach(i => $("#" + i).oninput = up); up();
      };
      applyZoom(); bindImg();
      const go = c => { dlg.close(); dwOpen(c, done); };
      $("#dw-prv").onclick = () => prevC && go(prevC); $("#dw-nxt").onclick = () => nextC && go(nextC);
      dlg.onkeydown = e => { if (e.key === "ArrowLeft" && prevC && !/INPUT|SELECT/.test(e.target.tagName)) go(prevC); if (e.key === "ArrowRight" && nextC && !/INPUT|SELECT/.test(e.target.tagName)) go(nextC); };
      dlg.addEventListener("close", () => { dlg.classList.remove("wide"); dlg.onkeydown = null; }, { once: true });
      dlg.onclick = async e => {
        if (e.target === dlg || e.target.closest("[data-close]")) return dlg.close();
        const z = e.target.closest("[data-z]");
        if (z) { const k = z.dataset.z; if (k === "+") zoom = Math.min(5, zoom + .25); else if (k === "-") zoom = Math.max(.25, zoom - .25); else if (k === "0") zoom = 1; else if (k === "full") { (document.fullscreenElement ? document.exitFullscreen() : $("#dwp").requestFullscreen()); return; } else if (k === "cmp") { return showCmp(); } applyZoom(); return; }
        const pv = e.target.closest("[data-pv]"); if (pv && !e.target.closest(".dw-dlb")) { cur = d.current.find(x => x.id == pv.dataset.pv); zoom = 1; $("#dwp").innerHTML = prev(cur); $("#dwopen").href = "/api/drawings/file/" + cur.id; $$(".dw-f", dlg).forEach(b => b.classList.toggle("on", b === pv)); applyZoom(); bindImg(); }
        const del = e.target.closest("[data-del]"); if (del) { e.preventDefault(); if (!confirm("Excluir definitivamente " + del.dataset.n + "?\nSe for a revisão vigente, a anterior volta a ser a vigente.")) return; await J("/api/drawings/file/" + del.dataset.del, { method: "DELETE" }); dlg.close(); done && done(); }
      };
      dlg.showModal();
    } catch (e) { alert(e.message); }
  }

  function dwOrphan(id, name, done) {
    dlg.innerHTML = `<div class="dh"><div><h2>Vincular desenho</h2><p>${esc(name)}</p></div><div><button class="btn ghost" data-close>Fechar</button></div></div>
      <p class="muted">O código não foi reconhecido pelo nome. Informe o(s) código(s) (separe por vírgula, se o desenho servir a mais de um) e a revisão.</p>
      <div class="fgrid"><label>Código(s)<input id="o-code" placeholder="ex.: AMD0170"></label><label>Revisão (opcional)<input id="o-rev" placeholder="ex.: 02 ou B"></label></div>
      <p id="o-msg" class="imp-msg"></p><div class="acts"><button class="btn" id="o-go">Vincular</button> <a class="btn ghost" href="/api/drawings/file/${id}" target="_blank" rel="noopener">Abrir arquivo</a> <button class="btn ghost" id="o-del">Excluir</button></div>`;
    $("#o-go").onclick = async () => { try { await post(`/api/drawings/file/${id}/assign`, { codes: $("#o-code").value, rev: $("#o-rev").value }); dlg.close(); done && done(); } catch (e) { $("#o-msg").textContent = e.message; $("#o-msg").className = "imp-msg err"; } };
    $("#o-del").onclick = async () => { if (!confirm("Excluir este arquivo?")) return; await J("/api/drawings/file/" + id, { method: "DELETE" }); dlg.close(); done && done(); };
    dlg.showModal();
  }

  async function genericView(id, pg) {   // dados de planilhas novas guardados como estão
    try {
      const d = await J(`/api/sources/${id}/rows?page=${pg}`), pages = Math.max(1, Math.ceil(d.total / d.size)); dlg.classList.add("wide");
      dlg.innerHTML = `<div class="dh"><div><h2>${esc(d.name)}</h2><p>${num(d.total)} linha(s) guardada(s) como vieram da planilha.</p></div><div><a class="btn ghost" href="/api/sources/${id}/export.xlsx">⬇ Excel</a> <button class="btn ghost" data-close>Fechar</button></div></div>`
        + T(d.columns.map(esc), d.rows.map(r => `<tr>${d.columns.map(c => `<td>${esc(r[c] ?? "")}</td>`).join("")}</tr>`))
        + (pages > 1 ? `<div class="pager"><button class="btn ghost" id="gv-p" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" id="gv-n" ${pg >= pages ? "disabled" : ""}>›</button></div>` : "");
      dlg.addEventListener("close", () => dlg.classList.remove("wide"), { once: true });
      const a = $("#gv-p"), b = $("#gv-n"); if (a) a.onclick = () => genericView(id, pg - 1); if (b) b.onclick = () => genericView(id, pg + 1);
      if (!dlg.open) dlg.showModal();
    } catch (e) { alert(e.message); }
  }

  // ---------- Brands: PERFECT · BPROAUTO · MOTRIO · MOTORCRAFT ----------
  async function brandsPage() {
    const BC = { PERFECT: "#d4372c", BPROAUTO: "#2f7de1", MOTRIO: "#f2c12e", MOTORCRAFT: "#7c8cff", OUTROS: "#7b8794" }, NAME = { PERFECT: "PERFECT", BPROAUTO: "BPROAUTO", MOTRIO: "MOTRIO", MOTORCRAFT: "MOTORCRAFT", OUTROS: "Sem marca" };
    try {
      const s = await J("/api/brands"); let cur = new URLSearchParams(location.search).get("b") || "PERFECT";
      const cards = [...s.brands]; if (s.unclassified) cards.push({ brand: "OUTROS", rule: "Não se encaixa em nenhuma regra", total: s.unclassified, catalog: 0, des: 0, rd: 0, base: 0, pend_compras: 0 });
      root.innerHTML = `<div class="notice">Itens agrupados pelo código: <b>AMD…</b> = PERFECT · <b>1BP…</b> = BPROAUTO · <b>somente números</b> = MOTRIO · itens da base <b>ItensMotorcraft</b> (PN Ford, e mesma família de código) = MOTORCRAFT. Reúne catálogo, desenvolvimento, redesenvolvimento e pedidos de amostra.</div>
        <div class="brand-grid" id="bg">${cards.map(b => `<button type="button" class="bcard ${b.brand === cur ? "on" : ""}" data-b="${b.brand}" style="--bc:${BC[b.brand]}"><h3>${NAME[b.brand]}</h3><div class="bn">${num(b.total)}</div><small>${esc(b.rule)}</small>
          <div class="bch">${b.catalog ? `<span>Catálogo ${num(b.catalog)}</span>` : ""}${b.des ? `<span>DES ${num(b.des)}</span>` : ""}${b.rd ? `<span>R-D ${num(b.rd)}</span>` : ""}${b.base ? `<span>Base ${num(b.base)}</span>` : ""}${b.pend_compras ? `<span>Pend. compras ${num(b.pend_compras)}</span>` : ""}</div></button>`).join("")}</div>
        <form class="toolbar" id="bf"><input name="q" placeholder="Buscar código, descrição ou veículo…" style="flex:1;min-width:240px">
        <select name="scope"><option value="">Onde está: todos</option><option value="catalog">No catálogo</option><option value="des">Em desenvolvimento (DES)</option><option value="rd">Em redesenvolvimento (R-D)</option><option value="base">Na base Motorcraft</option></select>
        <select name="flag"><option value="">Controle de status</option>${Object.entries(FLG).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("")}</select><a class="btn" id="bdl" href="#">⬇ Baixar Excel</a></form>
        <div class="summary" id="bsum"></div><div id="bt"></div><div class="pager" id="bpg"></div>`;
      const f = $("#bf"); let pg = 1, tm;
      const load = async () => { try {
        const fv = Object.fromEntries(new FormData(f)); $("#bdl").href = "/api/export/brands.xlsx?" + qs({ ...fv, brand: cur === "OUTROS" ? "" : cur });
        const d = await J(`/api/brands/${cur}/items?` + qs({ ...fv, page: pg })), pages = Math.max(1, Math.ceil(d.total / d.size));
        $("#bsum").textContent = `${NAME[cur]} · ${num(d.total)} item(ns)`;
        $("#bt").innerHTML = d.rows.length ? T(["Código", "Descrição", "Veículo / aplicação", "Onde está", "Controle de status", "Desenho", "Amostras"], d.rows.map(i => {
          const code = i.catalog && i.product_id ? lnk(i.product_id, i.code) : i.des ? `<a href="#" data-rd="des" data-code="${esc(i.code)}">${esc(i.code)}</a>` : i.rd ? `<a href="#" data-rd="rd" data-code="${esc(i.code)}">${esc(i.code)}</a>` : esc(i.code);
          return `<tr><td>${code}</td><td>${clip(i.description)}</td><td>${clip(i.vehicle)}</td><td>${[i.catalog && tag("Catálogo"), i.des && tag("DES"), i.rd && tag("R-D"), i.base && '<span class="tag">Base Motorcraft</span>'].filter(Boolean).join(" ")}</td><td class="fcell">${flagChips(i.flags)}</td>${dwCol(i.code)}<td>${i.samples ? `<a href="/amostras?q=${encodeURIComponent(i.code)}">${i.samples}</a>` : "–"}</td></tr>`; })) : empty("Nenhum item com esses filtros.");
        $("#bpg").innerHTML = pages > 1 ? `<button class="btn ghost" data-p="${pg - 1}" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" data-p="${pg + 1}" ${pg >= pages ? "disabled" : ""}>›</button>` : "";
        dwFill($("#bt"));
      } catch (e) { fail(e); } };
      f.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { pg = 1; load(); }, 300); }); f.addEventListener("submit", e => e.preventDefault());
      $("#bpg").addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b && !b.disabled) { pg = +b.dataset.p; load(); scrollTo(0, 0); } });
      $("#bg").addEventListener("click", e => { const b = e.target.closest("[data-b]"); if (!b) return; cur = b.dataset.b; pg = 1; $$(".bcard", root).forEach(x => x.classList.toggle("on", x === b)); load(); });
      load();
    } catch (e) { fail(e); }
  }

  const PAGES = {
    produtos: () => listView({ endpoint: "/api/products", xlsx: "produtos", head: prodHead, row: prodRow,
      note: '<p class="muted">Ordenado pela posição do item no catálogo (ordem das linhas da planilha do catálogo importada). Clique no código para abrir a ficha completa.</p>',
      form: inp("q", "Buscar: código, OEM, fornecedor, descrição, veículo, ano…", 'autofocus style="flex:1;min-width:260px"') }),
    pesquisa: () => listView({ endpoint: "/api/products", xlsx: "pesquisa", head: prodHead, row: prodRow, init: initLists,
      note: '<p class="muted">Pesquisa no catálogo e nos itens em desenvolvimento (DES) e redesenvolvimento (R-D). Use “Origem” para escolher onde procurar.</p>',
      form: inp("q", "Busca livre (ex.: strada 2012 dianteiro)", 'style="flex:1;min-width:220px"') + sel("origem", "Origem: todas", [["catalogo", "Somente catálogo"], ["des", "Somente em desenvolvimento (DES)"], ["rd", "Somente redesenvolvimento (R-D)"]]) + inp("code", "Código") + sel("code_type", "Tipo de código", [["oem", "OEM"], ["fornecedor", "Fornecedor"], ["concorrente", "Concorrente (referência cruzada)"]]) +
        sel("make", "Montadora", []) + sel("model", "Modelo", []) + sel("year", "Ano", []) + sel("axle", "Eixo", AX) + sel("side", "Lado", SD) + sel("system", "Sistema", [["gas", "Gás"], ["oleo", "Óleo"]]),
      after: async p => { const o = p.origem || "", box = $("#xtra"); $("#out").hidden = $("#pg").hidden = (o === "des" || o === "rd");
        const want = o === "" ? ["des", "rd"] : o === "catalogo" ? [] : [o]; if (!want.length || (o === "" && !p.q && !p.make && !p.model && !p.year)) { box.innerHTML = ""; return; }
        const parts = await Promise.all(want.map(k => J(`/api/rd/${k}?` + qs({ q: p.q, make: p.make, model: p.model, year: p.year })).then(d => [k, d])));
        box.innerHTML = parts.map(([k, d]) => { const slug = k === "des" ? "desenvolvimento" : "redesenvolvimento", lab = k === "des" ? "DES" : "R-D";
          return `<h3>${tag(lab)} ${k === "des" ? "Em desenvolvimento" : "Em redesenvolvimento"} — ${d.total} item(ns) <a class="btn ghost sm" href="/${slug}?${qs({ q: p.q, make: p.make, model: p.model, year: p.year })}">Ver todos</a></h3>` +
            (d.rows.length ? T(["Código", "Descrição", "Veículo(s)", "Status", "Catálogo"], d.rows.slice(0, 12).map(r => `<tr><td><a href="#" data-rd="${k}" data-code="${esc(r.code)}">${esc(r.code)}</a></td><td>${clip(r.description)}</td><td>${clip(r.vehicles)}</td><td>${clip(r.statuses)}</td><td>${r.product_id ? lnk(r.product_id, "abrir ficha") : "–"}</td></tr>`)) : '<p class="muted">Nenhum item.</p>'); }).join(""); } }),
    aplicacoes: () => listView({ endpoint: "/api/applications", xlsx: "aplicacoes", init: initLists, head: ["Montadora", "Modelo", "Aplicação", "Anos", "Eixo", "Lado", "Produto", "Pos."],
      row: a => `<tr><td>${esc(a.make || "")}</td><td>${esc(a.model || "")}</td><td>${esc(a.application_text || "")}</td><td>${yr(a)}</td><td>${esc(a.axle || "")}</td><td>${esc(a.side || "")}</td><td>${lnk(a.product_id, a.perfect_code)}</td><td>${a.catalog_position ?? "–"}</td></tr>`,
      form: inp("q", "Buscar veículo, aplicação ou código", 'style="flex:1;min-width:220px"') + sel("make", "Montadora", []) + sel("model", "Modelo", []) + sel("year", "Ano", []) + sel("axle", "Eixo", AX) + sel("side", "Lado", SD) }),

    desenvolvimento: () => rdPage("des"),
    redesenvolvimento: () => rdPage("rd"),
    comparacao: async () => {
      let ids = (url.get("ids") || "").match(/\d+/g) || [];
      root.innerHTML = `<div class="toolbar"><input id="add" list="addl" placeholder="Adicionar produto: digite o código e escolha" style="flex:1;min-width:260px"><datalist id="addl"></datalist><a class="btn" id="dl" href="#">⬇ Baixar Excel</a></div><div id="out"></div>`;
      const add = $("#add"), dl = $("#addl"); let found = {};
      add.addEventListener("input", async () => { if (add.value.length < 2) return; const d = await J("/api/products?size=8&q=" + encodeURIComponent(add.value)); found = {}; d.rows.forEach(r => found[r.perfect_code] = r.id); dl.innerHTML = d.rows.map(r => `<option value="${esc(r.perfect_code)}">${esc(r.description || "")}</option>`).join(""); if (found[add.value.trim()]) { ids = [...new Set([...ids, String(found[add.value.trim()])])].slice(0, 4); add.value = ""; draw(); } });
      root.addEventListener("click", e => { const r = e.target.closest("[data-rm]"); if (r) { ids = ids.filter(i => i !== r.dataset.rm); draw(); } });
      const ROWS = [["Posição no catálogo", p => p.catalog_position], ["Descrição", p => p.description], ["Grupo", p => p.catalog_group], ["Família", p => p.family], ["Sistema", p => SYS[p.system_type]],
        ["Lmin (mm)", p => p.dimensions?.lmin_mm], ["Lmax (mm)", p => p.dimensions?.lmax_mm], ["Curso (mm)", p => p.dimensions?.stroke_mm], ["Ø haste (mm)", p => p.dimensions?.rod_diameter_mm], ["Corpo (mm)", p => p.dimensions?.body_length_mm], ["Ø tubo (mm)", p => p.dimensions?.tube_diameter_mm],
        ["Fixação superior", p => p.dimensions?.upper_mount], ["Fixação inferior", p => p.dimensions?.lower_mount], ["Peso (kg)", p => p.weight_kg], ["EAN", p => p.ean], ["Caixa", p => [p.package_code, p.box?.raw_dims].filter(Boolean).join(" · ")],
        ["Códigos OEM", p => p.codes.filter(c => c.code_type === "oem").map(c => c.code).join(", ")], ["Códigos de fornecedor", p => [...new Set(p.codes.filter(c => c.code_type === "fornecedor").map(c => c.code))].join(", ")],
        ["Aplicações", p => p.applications.length ? p.applications.length + ": " + p.applications.slice(0, 4).map(a => [a.make, a.model, yr(a)].filter(Boolean).join(" ")).join("; ") : ""],
        ["Nº Inmetro", p => [...new Set(p.certificates.map(c => c.inmetro_number).filter(Boolean))].join(", ")],
        ["Fontes", p => [...new Set([...p.codes, ...p.applications].map(x => x.source).filter(Boolean))].join("; ")]];
      async function draw() {
        history.replaceState(null, "", "?ids=" + ids.join(",")); $("#dl").href = "/api/export/comparacao.xlsx?ids=" + ids.join(",");
        if (!ids.length) return $("#out").innerHTML = empty("Escolha de 2 a 4 produtos para comparar lado a lado.");
        const ps = await J("/api/compare?ids=" + ids.join(","));
        const diffs = [], trs = ROWS.map(([l, fn]) => { const v = ps.map(p => String(fn(p) ?? "")); const dif = ps.length > 1 && new Set(v).size > 1; if (dif) diffs.push(l); return `<tr class="${dif ? "diff" : ""}"><th>${l}</th>${v.map(x => `<td>${esc(x) || "—"}</td>`).join("")}</tr>`; });
        $("#out").innerHTML = (ps.length > 1 ? `<div class="notice">${diffs.length ? "<b>Diferenças identificadas:</b> " + diffs.join(", ") : "Nenhuma diferença nos campos comparados."} Linhas destacadas diferem; “—” = sem dado. Dimensões parecidas não bastam para afirmar intercambialidade.</div>` : "") +
          `<div class="tbl"><table><tr><th></th>${ps.map(p => `<th>${lnk(p.id, p.perfect_code)} <button class="btn ghost" data-rm="${p.id}">×</button></th>`).join("")}</tr>${trs.join("")}</table></div>`;
      }
      draw();
    },

    equivalencias: () => {
      const DF = ["Nenhuma aplicação em comum", "Eixo diferente", "Lados diferentes", "São lados opostos", "Lmax difere", "Lmin difere", "Sistema diferente", "Família diferente"];
      const MS = ["Eixo", "Lado", "Lmax", "Lmin", "Sistema óleo/gás", "Aplicações", "Diâmetro da haste"];
      const grp = (n, t, h, L) => `<div class="ms" data-ms><button type="button" class="btn ghost msb">${t} <b class="msn"></b> ▾</button><div class="msp" hidden><small class="muted">${h}</small>${L.map(c => `<label><input type="checkbox" name="${n}" value="${c}"> ${c} <small data-fc="${n}:${c}"></small></label>`).join("")}</div></div>`;
      const CR = ["Código em comum", "Aplicação em comum", "Mesmo eixo", "Mesmo lado", "Lmax igual", "Lmin igual", "Mesmo sistema", "Mesma família"];
      root.innerHTML = `<div class="notice">A pontuação (0–100%) mede a <b>similaridade dos dados</b> (códigos, aplicação, medidas, sistema). <b>Não comprova intercambialidade</b> e nenhuma sugestão é aprovada automaticamente.</div>
      <form class="eqform"><div class="toolbar">${inp("q", "Código PERFECT")}${sel("status", "Todos os status", [["pendente", "Pendente"], ["aprovada", "Aprovada"], ["rejeitada", "Rejeitada"]])}${sel("confidence", "Confiança", [["Alta", "Alta"], ["Média", "Média"], ["Baixa", "Baixa"]])}${sel("diff", "Diferenças", [["sem", "Sem diferenças"], ["com", "Com diferenças"]])}
        <input name="minscore" type="number" min="0" max="100" placeholder="Pontuação mín. (%)" style="width:150px"><button type="button" class="btn ghost" id="clr">Limpar filtros</button></div>
        <div class="toolbar">${grp("crit", "Critérios atendidos", "todos os marcados precisam ser atendidos", CR)}${grp("dif", "Diferenças", "exigir que apareça", DF)}${grp("miss", "Dados ausentes", "exigir que apareça", MS)}</div></form>
      <div class="toolbar"><span class="summary" id="sum"></span><span style="flex:1"></span><button type="button" class="btn ghost" id="gen">Gerar / atualizar sugestões</button><a class="btn" id="dl" href="#">⬇ Baixar planilha (XLSX)</a></div><div id="out"></div><div class="pager" id="pg"></div>`;
      const f = $("form", root); let pg = 1, t;
      url.forEach((v, k) => { const i = f.elements[k]; if (i && i.type !== "checkbox") i.value = v; });
      const updMs = () => $$("[data-ms]", root).forEach(m => { const n = $$("input:checked", m).length; $(".msn", m).textContent = n ? "(" + n + ")" : ""; });
      root.addEventListener("click", e => { const b = e.target.closest(".msb"); $$(".msp", root).forEach(p => { if (!b || p !== b.nextElementSibling) p.hidden = true; }); if (b) b.nextElementSibling.hidden = !b.nextElementSibling.hidden; });
      document.addEventListener("click", e => { if (!e.target.closest("[data-ms]")) $$(".msp", root).forEach(p => p.hidden = true); });
      f.addEventListener("change", updMs);
      const params = () => new URLSearchParams([...new FormData(f)].filter(([, v]) => v !== "")).toString();
      const chips = (a, c) => a.map(x => `<span class="chip ${c}">${esc(x)}</span>`).join("");
      const load = async () => { try {
        $("#dl").href = "/api/equivalences/export.xlsx?" + params();
        const d = await J("/api/equivalences?" + params() + "&page=" + pg);
        const sc = d.status_counts || {}; $("#sum").textContent = `${d.total} sugestão(ões) · Pendente ${sc.pendente || 0} · Aprovada ${sc.aprovada || 0} · Rejeitada ${sc.rejeitada || 0}`;
        $$("[data-fc]").forEach(s => s.textContent = "(" + (d.facets?.[s.dataset.fc] ?? 0) + ")");
        $("#out").innerHTML = d.rows.length ? d.rows.map(e => `<div class="eq"><div class="eqh"><b>${lnk(e.product_a, e.a_code)} × ${lnk(e.product_b, e.b_code)}</b><span class="badge ${e.confidence === "Alta" ? "ok" : e.confidence === "Média" ? "warn" : "bad"}">${e.confidence}</span><span class="status ${e.status}">${e.status}</span><a href="/comparacao?ids=${e.product_a},${e.product_b}">Comparar</a></div>
          <div class="bar"><i style="width:${e.score}%"></i><span>${e.score}% de similaridade</span></div><p class="muted">${esc(e.a_desc || "")} · ${esc(e.b_desc || "")}</p>
          <div>${chips(e.criteria, "ok")}${chips(e.differences, "bad")}${chips(e.missing, "warn")}</div><p class="muted">Fontes: ${esc(e.sources || "")}</p>
          <div class="acts">${["pendente", "aprovada", "rejeitada"].map(s => `<button class="btn ghost ${e.status === s ? "on" : ""}" data-eq="${e.id}" data-s="${s}">${{ pendente: "Pendente", aprovada: "Aprovar", rejeitada: "Rejeitar" }[s]}</button>`).join("")}</div></div>`).join("") : empty("Nenhuma sugestão com esses filtros. Ajuste os filtros ou clique em “Gerar / atualizar sugestões”.");
        const pages = Math.ceil(d.total / d.size); $("#pg").innerHTML = pages > 1 ? `<button class="btn ghost" data-p="${pg - 1}" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" data-p="${pg + 1}" ${pg >= pages ? "disabled" : ""}>›</button>` : "";
      } catch (e) { fail(e); } };
      f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { pg = 1; load(); }, 250); });
      $("#clr").onclick = () => { f.reset(); updMs(); pg = 1; load(); };
      $("#gen").onclick = async () => { $("#gen").textContent = "Calculando…"; try { const r = await post("/api/equivalences/generate"); alert(`${r.candidates} pares analisados; ${r.saved} sugestões (≥50%). Os status já definidos foram preservados.`); } catch (e) { fail(e); } $("#gen").textContent = "Gerar / atualizar sugestões"; pg = 1; load(); };
      root.addEventListener("click", async e => { const b = e.target.closest("[data-eq]"), p = e.target.closest("[data-p]"); if (b) { await post("/api/equivalences/" + b.dataset.eq, { status: b.dataset.s }); load(); } else if (p && !p.disabled) { pg = +p.dataset.p; load(); scrollTo(0, 0); } });
      load();
    },

    pendencias: () => {
      const tab = url.get("tab") === "dup" ? "dup" : "pend";
      root.innerHTML = `<div class="toolbar"><span style="flex:1"></span><a class="btn" id="dl" href="/api/export/pendencias.xlsx">⬇ Baixar Excel</a></div><div class="tabs"><a href="/pendencias" class="${tab === "pend" ? "on" : ""}">Pendências e conflitos</a><a href="/pendencias?tab=dup" class="${tab === "dup" ? "on" : ""}">Possíveis duplicidades</a></div><div id="tb"></div>`;
      const host = $("#tb");
      if (tab === "dup") return J("/api/duplicates").then(r => host.innerHTML = '<p class="muted">Mesmo código associado a mais de um produto. Nada é unido ou excluído automaticamente.</p>' + (r.length ? T(["Tipo", "Código", "Produtos", "Qtd"], r.map(x => `<tr><td>${esc(x.code_type)}</td><td><a href="/pesquisa?code=${encodeURIComponent(x.code)}">${esc(x.code)}</a></td><td>${esc(x.products)}</td><td>${x.n}</td></tr>`)) : empty("Nenhuma duplicidade."))).catch(fail);
      listInto(host);
      function listInto(h) {
        h.innerHTML = `<form class="toolbar">${inp("q", "Código ou texto")}<select name="status"><option value="aberta" selected>Abertas</option><option value="resolvida">Resolvidas</option><option value="ignorada">Ignoradas</option><option value="">Todas</option></select><select name="kind"><option value="">Todos os tipos</option></select></form><div class="summary" id="sum"></div><div id="out"></div><div class="pager" id="pg"></div>`;
        const f = $("form", h); let pg = 1, t, kinds = false;
        const load = async () => { try {
          $("#dl").href = "/api/export/pendencias.xlsx?" + qs(Object.fromEntries(new FormData(f)));
          const d = await J("/api/pendencies?" + qs({ ...Object.fromEntries(new FormData(f)), page: pg }));
          if (!kinds) { kinds = true; $("[name=kind]", f).innerHTML += d.kinds.map(k => `<option>${esc(k)}</option>`).join(""); }
          const L = { campo_ausente: "Campo ausente", conflito: "Conflito entre fontes" };
          $("#sum").textContent = d.total + " registro(s)";
          $("#out").innerHTML = d.rows.length ? T(["Produto", "Tipo", "Campo", "Descrição", "Status", ""], d.rows.map(x => `<tr><td>${x.product_id ? lnk(x.product_id, x.perfect_code) : "–"}</td><td>${esc(L[x.kind] || x.kind)}</td><td>${esc(x.field || "")}</td><td>${esc(x.description || "")}</td><td>${x.status}</td><td>${x.status === "aberta" ? `<button class="btn ghost" data-pd="${x.id}" data-s="resolvida">Resolver</button> <button class="btn ghost" data-pd="${x.id}" data-s="ignorada">Ignorar</button>` : `<button class="btn ghost" data-pd="${x.id}" data-s="aberta">Reabrir</button>`}</td></tr>`)) : empty("Nenhuma pendência com esses filtros.");
          const pages = Math.ceil(d.total / d.size); $("#pg").innerHTML = pages > 1 ? `<button class="btn ghost" data-p="${pg - 1}" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" data-p="${pg + 1}" ${pg >= pages ? "disabled" : ""}>›</button>` : "";
        } catch (e) { fail(e); } };
        f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { pg = 1; load(); }, 300); });
        h.addEventListener("click", async e => { const b = e.target.closest("[data-pd]"), p = e.target.closest("[data-p]"); if (b) { await post("/api/pendencies/" + b.dataset.pd, { status: b.dataset.s }); load(); } else if (p && !p.disabled) { pg = +p.dataset.p; load(); } });
        load();
      }
    },

    fontes: async () => {
      try {
        const d = await J("/api/history");
        root.innerHTML = `<div class="toolbar"><span style="flex:1"></span><a class="btn" href="/api/export/fontes.xlsx">⬇ Baixar Excel</a></div><h3>Histórico de importações</h3>` + (d.batches.length ? T(["#", "Data", "Arquivo", "Planilha", "Categoria", "Linhas lidas", "Novos", "Prod. complementados", "Conflitos", "Erros", "Status"], d.batches.map(b => `<tr><td>${b.id}</td><td>${esc(b.imported_at)}</td><td>${esc(b.filename || "")}</td><td>${esc(b.sheet || "")}</td><td>${esc(b.category || "")}</td><td>${b.rows_read ?? "–"}</td><td>${b.rows_new}</td><td>${b.rows_updated}</td><td>${b.rows_conflict}</td><td>${b.rows_error}</td><td>${esc(b.status)}</td></tr>`)) : empty("Nenhuma importação ainda. Use “Importação de Excel”."))
          + `<h3>Fontes e prioridade</h3><p class="muted">Prioridade de 1 (maior) a 9. Usada para sinalizar qual fonte prevalece na análise manual de conflitos.</p>` + T(["Fonte", "Categoria", "Importações", "Dados", "Prioridade"], d.sources.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.category || "")}</td><td>${s.imports}</td><td>${s.generic_rows ? `<button class="btn ghost sm" data-gv="${s.id}">Ver ${num(s.generic_rows)} linhas</button> <a class="btn ghost sm" href="/api/sources/${s.id}/export.xlsx">⬇ Excel</a>` : "–"}</td><td><select data-src="${s.id}">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option ${n === s.priority ? "selected" : ""}>${n}</option>`).join("")}</select></td></tr>`));
        root.addEventListener("click", async e => { const g = e.target.closest("[data-gv]"); if (g) genericView(+g.dataset.gv, 1); });
        root.addEventListener("change", e => { const s = e.target.closest("[data-src]"); if (s) post("/api/sources/" + s.dataset.src, { priority: +s.value }).catch(fail); });
      } catch (e) { fail(e); }
    },

    configuracoes: async () => {
      const draw = async () => { try {
        const d = await J("/api/backups");
        root.innerHTML = `<div class="appearance"><div><h3>Aparência</h3><p>Escolha o modo de cor do sistema. Fica gravado neste navegador.</p></div>
          <button type="button" class="tswitch" id="tsw" role="switch" aria-label="Modo escuro" aria-checked="${psdTheme.get() === "dark"}"><span class="l c">CLARO</span><span class="l d">ESCURO</span><span class="k"><svg class="s" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="m" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg></span></button></div>
        <div class="notice">Banco local: <code>${esc(d.db)}</code> · ${(d.size / 1048576).toFixed(2)} MB. Antes de cada importação confirmada e de cada restauração o sistema cria um backup automático.</div>
          <button class="btn" id="bk">Criar backup agora</button> <a class="btn ghost" href="/api/export/configuracoes.xlsx">⬇ Baixar Excel (lista)</a><h3>Backups disponíveis</h3>` + (d.backups.length ? T(["Arquivo", "Data", "Tamanho", ""], d.backups.map(b => `<tr><td>${esc(b.name)}</td><td>${b.date}</td><td>${(b.size / 1048576).toFixed(2)} MB</td><td><a class="btn ghost" href="/api/backups/${encodeURIComponent(b.name)}">Baixar</a> <button class="btn ghost" data-rs="${esc(b.name)}">Restaurar</button></td></tr>`)) : empty("Nenhum backup ainda."));
        $("#tsw").onclick = () => { psdTheme.toggle(); $("#tsw").setAttribute("aria-checked", psdTheme.get() === "dark"); };
        $("#bk").onclick = async () => { await post("/api/backups"); draw(); };
        $$("[data-rs]").forEach(b => b.onclick = async () => { if (!confirm("Restaurar " + b.dataset.rs + "?\nO banco atual será substituído (um backup do estado atual é criado antes).")) return; try { const r = await post("/api/backups/restore", { name: b.dataset.rs }); alert("Restaurado. Backup do estado anterior: " + r.safety); draw(); } catch (e) { alert(e.message); } });
      } catch (e) { fail(e); } };
      draw();
    },

    damping: async () => {
      let R; try { R = await J("/api/damping/rules"); } catch (e) { return fail(e); }
      const names = Object.keys(R.tables); let cur = null;
      const num = v => { v = String(v ?? "").trim().replace(",", "."); return v === "" || isNaN(v) ? null : +v; };
      const calc = (d, tol, f) => { if (d == null) return [null, null, ""]; let lo = d * (1 - tol), hi = d * (1 + tol); if (d < R.threshold) { lo += R.offset; hi -= R.offset; } if (lo > hi) return [lo, hi, "FAIXA INVÁLIDA"]; if (f == null) return [lo, hi, "INCOMPLETO"]; return [lo, hi, lo <= f && f <= hi ? "APPROVED" : "DISAPPROVED"]; };
      const cls = r => r === "APPROVED" ? "ok" : r === "DISAPPROVED" ? "bad" : "warn", fx = v => v == null ? "–" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
      root.innerHTML = R.tables && names.length ? `<div class="notice"><b>Regra:</b> ${esc(R.source || "")} — se DRAWING &lt; ${R.threshold} N: mín = D×(1−tol)+${R.offset} e máx = D×(1+tol)−${R.offset}; senão sem ajuste. Aprovado se mín ≤ FOUND ≤ máx.<br><small>${esc(R.note)}</small></div>
        <div class="toolbar"><label class="muted">Atualizar regra a partir de planilha: <input type="file" id="rf" accept=".xlsx"></label></div>
        <h3>Ensaio <span id="ov"></span></h3>
        <form id="df" class="fgrid"><label>Código PERFECT<input name="perfect_code" list="dpl" autocomplete="off"></label><datalist id="dpl"></datalist><label>Identificação / lote<input name="label"></label><label>Data<input type="date" name="test_date"></label><label>Observações<input name="notes"></label></form>
        ${names.map(n => `<h4>Tabela ${n}</h4>` + T(["PERFECT STANDARD", "VM/S", "DRAWING (N)", n + " (N) mín", n + " (N) máx", "FOUND (N)", "RESULT"], R.tables[n].map(r => `<tr data-t="${n}" data-v="${r.velocity}" data-tol="${r.tolerance}"><td>${Math.round(r.tolerance * 100)}%</td><td>${r.velocity}</td><td><input class="dd" inputmode="decimal" size="8"></td><td class="mn">–</td><td class="mx">–</td><td><input class="df" inputmode="decimal" size="8"></td><td class="rs"></td></tr>`))).join("")}
        <div class="acts"><button class="btn" id="sv">Salvar ensaio</button><button class="btn ghost" id="nw">Novo ensaio</button><a class="btn ghost" id="dx" href="#" hidden>⬇ Baixar este ensaio (Excel)</a></div>
        <h3>Ensaios salvos</h3><div class="toolbar"><input id="dq" placeholder="Buscar código ou identificação"><span style="flex:1"></span><a class="btn" id="dall" href="/api/export/damping.xlsx">⬇ Baixar todos (Excel)</a></div><div id="dl2"></div>` : empty("Regra não carregada. Selecione a planilha DAMPING FORCE - REGRA.xlsx em “Atualizar regra”.") + `<input type="file" id="rf" accept=".xlsx">`;
      $("#rf").onchange = async e => { const fd = new FormData(); fd.append("file", e.target.files[0]); const r = await fetch("/api/damping/rules", { method: "POST", body: fd }), d = await r.json(); if (!r.ok) return alert(d.error); alert("Regra atualizada: " + d.points + " pontos."); PAGES.damping(); };
      if (!names.length) return;
      const rows = () => $$("tr[data-t]", root), F = $("#df");
      const recalc = () => { const res = []; rows().forEach(tr => { const d = num($(".dd", tr).value), f = num($(".df", tr).value), [lo, hi, r] = calc(d, +tr.dataset.tol, f); $(".mn", tr).textContent = fx(lo); $(".mx", tr).textContent = fx(hi); $(".rs", tr).innerHTML = r ? `<span class="badge ${cls(r)}">${r}</span>` : ""; if (d != null) res.push(r); });
        const o = !res.length ? "" : res.includes("DISAPPROVED") ? "DISAPPROVED" : res.some(r => r !== "APPROVED") || res.length < rows().length ? "INCOMPLETO" : "APPROVED"; $("#ov").innerHTML = o ? `<span class="badge ${cls(o)}">${o}</span>` : ""; };
      root.addEventListener("input", e => { if (e.target.closest("tr[data-t]")) recalc(); });
      const fill = t => { F.perfect_code.value = t.perfect_code || ""; F.label.value = t.label || ""; F.test_date.value = t.test_date || ""; F.notes.value = t.notes || "";
        rows().forEach(tr => { const p = (t.points || []).find(x => x.table_name === tr.dataset.t && Math.abs(x.velocity - tr.dataset.v) < 1e-6); $(".dd", tr).value = p?.drawing ?? ""; $(".df", tr).value = p?.found ?? ""; });
        cur = t.id || null; $("#dx").hidden = !cur; if (cur) $("#dx").href = `/api/damping/tests/${cur}/export.xlsx`; recalc(); };
      const list = async () => { const ts = await J("/api/damping/tests?q=" + encodeURIComponent($("#dq").value));
        $("#dl2").innerHTML = ts.length ? T(["#", "Código", "Identificação", "Data", "Resultado", ""], ts.map(t => `<tr><td>${t.id}</td><td>${t.product_id ? lnk(t.product_id, t.perfect_code) : esc(t.perfect_code || "–")}</td><td>${esc(t.label || "")}</td><td>${esc(t.test_date || "")}</td><td><span class="badge ${cls(t.overall)}">${t.overall}</span></td><td><button class="btn ghost" data-op="${t.id}">Abrir</button> <a class="btn ghost" href="/api/damping/tests/${t.id}/export.xlsx">Excel</a> <button class="btn ghost" data-rm2="${t.id}">Excluir</button></td></tr>`)) : empty("Nenhum ensaio salvo ainda."); };
      $("#dq").oninput = list;
      $("#sv").onclick = async e => { e.preventDefault(); const points = rows().map(tr => ({ table: tr.dataset.t, velocity: +tr.dataset.v, drawing: $(".dd", tr).value, found: $(".df", tr).value }));
        try { const r = await post("/api/damping/tests", { id: cur, ...Object.fromEntries(new FormData(F)), points }); cur = r.id; $("#dx").hidden = false; $("#dx").href = `/api/damping/tests/${cur}/export.xlsx`; list(); alert("Ensaio salvo."); } catch (er) { alert(er.message); } };
      $("#nw").onclick = e => { e.preventDefault(); fill({}); };
      root.addEventListener("click", async e => { const o = e.target.closest("[data-op]"), d = e.target.closest("[data-rm2]");
        if (o) { fill(await J("/api/damping/tests/" + o.dataset.op)); scrollTo(0, 0); } if (d && confirm("Excluir este ensaio?")) { await J("/api/damping/tests/" + d.dataset.rm2, { method: "DELETE" }); list(); } });
      const pc = F.perfect_code; pc.addEventListener("input", async () => { if (pc.value.length < 3) return; const d = await J("/api/products?size=8&q=" + encodeURIComponent(pc.value)); $("#dpl").innerHTML = d.rows.map(r => `<option value="${esc(r.perfect_code)}">${esc(r.description || "")}</option>`).join("");
        if (d.rows.some(r => r.perfect_code === pc.value.trim()) && rows().every(tr => !$(".dd", tr).value)) { const pts = await J("/api/damping/prefill?code=" + encodeURIComponent(pc.value.trim()));
          rows().forEach(tr => { const p = pts.find(x => x.table_name === tr.dataset.t && Math.abs(x.velocity - tr.dataset.v) < 1e-6); if (p?.drawing != null) $(".dd", tr).value = p.drawing; }); recalc(); } });
      F.test_date.value = new Date().toISOString().slice(0, 10); recalc(); list();
    },

    amostras: () => amostras(),
    desenhos: () => desenhos(),
    brands: () => brandsPage(),
    atualizacao: () => atualizacao(),
  };

  // ---------- compra de amostras (kanban dinâmico) ----------
  async function amostras() {
    root.innerHTML = `<div class="seg" id="stabs"><button type="button" class="on" data-t="kb">Pedidos de amostra</button><button type="button" data-t="pend">Pendente de compra <span class="badge" id="pc-n"></span></button></div><div id="pendview" hidden></div>
      <form class="toolbar" id="sf">${inp("q", "Buscar código, SC, aplicação, fornecedor", 'style="flex:1;min-width:220px"')}<select name="supplier"><option value="">Fornecedor</option></select><select name="month"><option value="">Mês</option></select><select name="side"><option value="">Lado</option><option value="direito">Direito (LD)</option><option value="esquerdo">Esquerdo (LE)</option><option value="ambos">Ambos (LD/LE)</option></select><button type="button" class="btn" id="new">+ Nova amostra</button><a class="btn" id="dl" href="#">⬇ Baixar Excel</a></form>
      <div class="cards mini-cards" id="tot"></div><div class="kanban" id="kb"></div>`;
    const f = $("#sf"); let t, data, first = true;
    const ST = {}; 
    const load = async () => { try {
      $("#dl").href = "/api/export/amostras.xlsx?" + qs(Object.fromEntries(new FormData(f)));
      data = await J("/api/samples?" + qs(Object.fromEntries(new FormData(f)))); data.stages.forEach(([k, l]) => ST[k] = l);
      if (first) { first = false; $("[name=supplier]", f).innerHTML += data.suppliers.map(s => `<option>${esc(s)}</option>`).join(""); $("[name=month]", f).innerHTML += data.months.map(s => `<option>${esc(s)}</option>`).join(""); }
      const tt = data.totals; $("#tot").innerHTML = [["Amostras", tt.n], ["Total (preço escolhido)", brl(tt.chosen)], ["Total (menor cotação)", brl(tt.best)], ["Pendente fornecedor", tt.pending_supplier], ["Para enviar", tt.to_send]].map(([l, v]) => `<div class="card"><span class="num sm">${v}</span><small>${l}</small></div>`).join("");
      $("#kb").innerHTML = data.stages.map(([k, l], i) => { const rs = data.rows.filter(r => r.stage === k); return `<div class="kcol"><h4>${l} <span class="badge">${rs.length}</span></h4>${rs.map(r => { const ch = r.quotes.find(q => q.chosen && q.price != null); return `<div class="kcard"><div class="kt"><b>${r.product_id ? lnk(r.product_id, r.perfect_code) : esc(r.perfect_code || "(sem código)")}</b><span>${esc(r.sc_number ? "SC " + r.sc_number : "")}</span></div>
        <div>${esc(r.application || "")}</div><div class="muted">${esc(r.sample_code || "")}${r.supplier ? " · " + esc(r.supplier) : ""}${r.month ? " · " + esc(r.month) : ""}</div>
        <div>${ch ? brl(ch.price) : ""}${r.quotes.length > 1 ? ` <small class="muted">(${r.quotes.length} cotações)</small>` : ""}</div>
        <div>${r.side ? `<span class="chip">${{ direito: "LD", esquerdo: "LE", ambos: "LD/LE" }[r.side]}</span>` : ""}${r.to_send ? '<span class="chip warn">Enviar</span>' : ""}${r.pending_supplier ? '<span class="chip bad">Pendente fornecedor</span>' : ""}${r.tracking && r.tracking !== "-" ? `<span class="chip">${esc(r.tracking)}</span>` : ""}</div>
        <div class="acts"><button class="btn ghost" data-mv="${r.id}" data-d="-1" ${i === 0 ? "disabled" : ""}>◀</button><button class="btn ghost" data-ed="${r.id}">Editar</button><button class="btn ghost" data-mv="${r.id}" data-d="1" ${i === data.stages.length - 1 ? "disabled" : ""}>▶</button></div></div>`; }).join("")}</div>`; }).join("");
    } catch (e) { fail(e); } };
    f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(load, 300); });
    root.addEventListener("click", async e => {
      const mv = e.target.closest("[data-mv]"), ed = e.target.closest("[data-ed]");
      if (mv) { const r = data.rows.find(x => x.id == mv.dataset.mv), ks = data.stages.map(s => s[0]); r.stage = ks[ks.indexOf(r.stage) + +mv.dataset.d]; await post("/api/samples", r); load(); }
      if (ed) form(data.rows.find(x => x.id == ed.dataset.ed));
    });
    $("#new").onclick = () => form({ stage: "cotacao", quotes: [{ price: "", link: "", chosen: 1 }] });

    // ---- Pendente de compra: itens de DES/R-D marcados "Pendente compras", com a referência cruzada de cada item ----
    const SIT = { sem: ["Sem pedido", "bad"], andamento: ["Pedido em andamento", "warn"], comprada: ["Já comprada", "ok"] };
    let pendLoaded = false;
    async function pend() {
      const host = $("#pendview");
      host.innerHTML = `<div class="notice">Itens de DES e R-D com <b>Pendente compras</b> (pela planilha ou pelo controle de status). Para cada um, o sistema indica a <b>referência cruzada</b> — marcas e códigos que podem ser cotados — e se já existe pedido de amostra para o código.</div>
        <form class="toolbar" id="pf"><input name="q" placeholder="Buscar código, descrição, veículo…" style="flex:1;min-width:220px"><select name="kind"><option value="">DES e R-D</option><option value="des">Somente DES</option><option value="rd">Somente R-D</option></select>
        <select name="state"><option value="">Qualquer situação</option><option value="sem" selected>Sem pedido</option><option value="andamento">Pedido em andamento</option><option value="comprada">Já comprada</option></select><a class="btn" id="pdl" href="#">⬇ Baixar Excel</a></form>
        <div class="cards mini-cards" id="ps"></div><div id="pt"></div><div class="pager" id="pp"></div>`;
      const pf = $("#pf"); let pg = 1, tm, rows = [];
      const ld = async () => { try {
        const fv = Object.fromEntries(new FormData(pf)); $("#pdl").href = "/api/export/pendente_compras.xlsx?" + qs(fv);
        const d = await J("/api/purchases/pending?" + qs({ ...fv, page: pg })), pages = Math.max(1, Math.ceil(d.total / d.size)); rows = d.rows;
        const all = await J("/api/purchases/pending?" + qs({ kind: fv.kind, q: fv.q })), s = all.summary;
        $("#pc-n").textContent = s.sem + s.andamento; $("#ps").innerHTML = [["Sem pedido de amostra", s.sem], ["Pedido em andamento", s.andamento], ["Já comprada", s.comprada]].map(([l, v]) => `<div class="card"><span class="num sm">${num(v)}</span><small>${l}</small></div>`).join("");
        $("#pt").innerHTML = d.rows.length ? T(["Código", "Tipo", "Descrição", "Veículo(s)", "Referência cruzada (o que cotar)", "Situação", ""], d.rows.map((r, i) => {
          const k = r.suggestion === "DES" ? "des" : "rd", cr = r.cross.slice(0, 6).map(c => `<span class="xchip"><b>${esc(c.brand || "")}</b> ${esc(c.code)}</span>`).join("") + (r.cross.length > 6 ? `<span class="xchip more" title="${esc(r.cross.slice(6).map(c => (c.brand || "") + " " + c.code).join(" · "))}">+${r.cross.length - 6}</span>` : "");
          return `<tr><td><a href="#" data-rd="${k}" data-code="${esc(r.code)}">${esc(r.code)}</a></td><td>${tag(r.suggestion)}</td><td>${clip(r.description)}</td><td>${clip(r.vehicles)}</td><td>${cr || '<span class="muted">sem referência cruzada cadastrada</span>'}</td>
            <td><span class="badge ${SIT[r.state][1]}">${SIT[r.state][0]}</span>${r.orders.map(o => `<small class="muted" style="display:block">SC ${esc(o.sc || "–")} · ${esc(o.stage)}</small>`).join("")}</td>
            <td style="white-space:nowrap"><button class="btn sm" data-np="${i}">Criar pedido</button></td></tr>`; })) : empty("Nenhum item com esses filtros.");
        $("#pp").innerHTML = pages > 1 ? `<button class="btn ghost" data-p="${pg - 1}" ${pg < 2 ? "disabled" : ""}>‹</button> Página ${pg} de ${pages} <button class="btn ghost" data-p="${pg + 1}" ${pg >= pages ? "disabled" : ""}>›</button>` : "";
      } catch (e) { fail(e); } };
      pf.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { pg = 1; ld(); }, 300); }); pf.addEventListener("submit", e => e.preventDefault());
      $("#pp").addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b && !b.disabled) { pg = +b.dataset.p; ld(); scrollTo(0, 0); } });
      $("#pt").addEventListener("click", e => { const b = e.target.closest("[data-np]"); if (!b) return; const r = rows[+b.dataset.np];
        form({ stage: "cotacao", perfect_code: r.code, quotes: [{ price: "", link: "", chosen: 1 }], notes: r.cross.length ? "Referência cruzada: " + r.cross.slice(0, 8).map(c => (c.brand || "") + " " + c.code).join(" · ") : "" }); });
      ld();
    }
    const showTab = t => { $$("#stabs button").forEach(b => b.classList.toggle("on", b.dataset.t === t)); const k = t === "kb";
      ["#sf", "#tot", "#kb"].forEach(s => $(s).hidden = !k); $("#pendview").hidden = k; if (!k && !pendLoaded) { pendLoaded = true; pend(); } };
    $("#stabs").onclick = e => { const b = e.target.closest("[data-t]"); if (b) showTab(b.dataset.t); };
    J("/api/purchases/pending?state=sem").then(d => J("/api/purchases/pending?state=andamento").then(d2 => { $("#pc-n").textContent = d.total + d2.total; })).catch(() => { });
    if (new URLSearchParams(location.search).get("tab") === "pendentes") showTab("pend");

    function form(o) {
      const q = (o.quotes && o.quotes.length) ? o.quotes : [{ price: "", link: "", chosen: 1 }];
      const fld = (n, l, ex = "") => `<label>${l}<input name="${n}" value="${esc(o[n] ?? "")}" ${ex}></label>`;
      dlg.innerHTML = `<form id="sform"><div class="dh"><h2>${o.id ? "Editar amostra" : "Nova amostra"}</h2><button type="button" class="btn ghost" data-close>Fechar</button></div>
        <div class="fgrid">${fld("perfect_code", "Código PERFECT", 'list="pl" autocomplete="off"')}<datalist id="pl"></datalist>${fld("sample_code", "Código da amostra")}${fld("sc_number", "Nº SC")}${fld("ship_code", "Código de envio")}
        <label>Aplicação<input name="application" value="${esc(o.application ?? "")}" list="al" autocomplete="off"></label><datalist id="al"></datalist>
        <label>Lado<select name="side">${[["", "—"], ["direito", "Direito (LD)"], ["esquerdo", "Esquerdo (LE)"], ["ambos", "Ambos (LD/LE)"]].map(([k, l]) => `<option value="${k}" ${(o.side || "") === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>${fld("supplier", "Fornecedor", 'list="sl"')}<datalist id="sl">${data.suppliers.map(s => `<option value="${esc(s)}">`).join("")}</datalist>${fld("month", "Mês")}${fld("tracking", "Cód. rastreio")}
        ${fld("net_weight", "Peso líq. (kg)")}${fld("gross_weight", "Peso bruto (kg)")}${fld("credit_note", "Credit note")}
        <label>Etapa<select name="stage">${data.stages.map(([k, l]) => `<option value="${k}" ${o.stage === k ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
        <div class="checks"><label><input type="checkbox" name="to_send" ${o.to_send ? "checked" : ""}> Enviar</label><label><input type="checkbox" name="pending_supplier" ${o.pending_supplier ? "checked" : ""}> Pendente fornecedor</label></div>
        <h4>Cotações <button type="button" class="btn ghost" id="aq">+ cotação</button></h4><div id="qs"></div>
        <label>Observações<textarea name="notes" rows="2">${esc(o.notes || "")}</textarea></label>
        <div class="acts"><button class="btn" type="submit">Salvar</button>${o.id ? '<button type="button" class="btn ghost" id="del">Excluir</button>' : ""}</div></form>`;
      $(".fgrid", dlg).insertAdjacentHTML("afterend", '<div id="xref"></div>');
      const qrow = x => `<div class="qrow"><input class="qp" placeholder="Preço" value="${x.price ?? ""}"><input class="ql" placeholder="Link / contato" value="${esc(x.link || "")}"><label><input type="radio" name="ch" ${x.chosen ? "checked" : ""}> escolhida</label><button type="button" class="btn ghost" data-rq>×</button></div>`;
      $("#qs").innerHTML = q.map(qrow).join("");
      $("#aq").onclick = () => $("#qs").insertAdjacentHTML("beforeend", qrow({ price: "", link: "", chosen: 0 }));
      $("#qs").onclick = e => { if (e.target.closest("[data-rq]")) e.target.closest(".qrow").remove(); };
      // Ao preencher o código PERFECT: "D-" + código no código de envio, e aplicação/lado importados de Desenvolvimento (ou do catálogo).
      const pc = $("[name=perfect_code]", dlg), ship = $("[name=ship_code]", dlg), ap = $("[name=application]", dlg), sd = $("[name=side]", dlg);
      const hint = document.createElement("small"); hint.className = "muted"; ap.parentElement.appendChild(hint);
      let auto = { ship: o.ship_code || "", app: o.application || "", side: o.side || "" }, seq = 0;   // só sobrescreve o que ainda é automático (ou vazio)
      const setIf = (el, key, val) => { if (val != null && (!el.value || el.value === auto[key])) { el.value = val; auto[key] = val; } };
      const fill = async () => {
        const code = pc.value.trim().toUpperCase().replace(/^D-/, ""), my = ++seq;
        if (!code) return;
        setIf(ship, "ship", "D-" + code);                     // imediato, sem esperar o servidor
        if (code.length < 4) return;
        try {
          const d = await J("/api/samples/prefill?code=" + encodeURIComponent(code)); if (my !== seq) return;
          $("#al").innerHTML = d.options.map(x => `<option value="${esc(x.text)}">${esc(x.source)}</option>`).join("");
          setIf(ap, "app", d.application); setIf(sd, "side", d.side);
          $("#xref").innerHTML = (d.pending && d.pending.length ? `<div class="notice">Este código está <b>pendente de compra</b> em ${d.pending.map(x => x === "DES" ? "Desenvolvimento" : "Redesenvolvimento").join(" e ")}${d.state === "sem" ? " e ainda <b>não tem pedido de amostra</b>" : d.state === "andamento" ? " (já há pedido em andamento)" : " (já foi comprado)"}.</div>` : "")
            + (d.cross && d.cross.length ? `<div class="xref"><b>Referência cruzada — o que cotar:</b> ${d.cross.map(c => `<span class="xchip"><b>${esc(c.brand || "")}</b> ${esc(c.code)}</span>`).join("")}</div>` : "");
          hint.textContent = d.application ? `Aplicação importada de ${d.source === "Catálogo" ? "Catálogo" : "Desenvolvimento"}${d.options.length > 1 ? ` (${d.options.length} opções na lista)` : ""}.` : (d.in_catalog ? "Sem aplicação cadastrada para este código." : "Código não encontrado em Desenvolvimento nem no catálogo.");
        } catch (e) { hint.textContent = ""; }
      };
      let tt; pc.addEventListener("input", async () => {
        clearTimeout(tt); tt = setTimeout(fill, 200);
        if (pc.value.length < 3) return; const d = await J("/api/products?size=8&q=" + encodeURIComponent(pc.value)); $("#pl").innerHTML = d.rows.map(r => `<option value="${esc(r.perfect_code)}">${esc(r.description || "")}</option>`).join(""); });
      pc.addEventListener("change", fill); if (o.perfect_code) fill();
      $("#sform").onsubmit = async e => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target));
        const body = { ...v, id: o.id, to_send: !!v.to_send, pending_supplier: !!v.pending_supplier, quotes: $$(".qrow", dlg).map(r => ({ price: $(".qp", r).value, link: $(".ql", r).value, chosen: $("input[type=radio]", r).checked })) };
        try { await post("/api/samples", body); dlg.close(); load(); } catch (er) { alert(er.message); } };
      const del = $("#del"); if (del) del.onclick = async () => { if (confirm("Excluir esta amostra?")) { await J("/api/samples/" + o.id, { method: "DELETE" }); dlg.close(); load(); } };
      dlg.showModal();
    }
    load();
  }


  // ---------- atualização de dados (insere só o que falta) ----------
  function atualizacao() {
    root.innerHTML = `<div class="notice">Envie as planilhas <b>com o mesmo nome de sempre</b> (ex.: <code>DadosR-D e DES.xlsx</code>, <code>Compra_de_amostra.xlsx</code>). O sistema lê todas as linhas, confere com o banco e <b>insere apenas o que ainda não está</b>. <b>Planilhas novas</b> (nome desconhecido) também entram: se as colunas forem de um cadastro conhecido, são carregadas como tal; senão, os dados ficam guardados como estão. Em ambos os casos aparecem em <a href="/fontes">Fontes e histórico</a>.
      Nada é apagado. Primeiro mostra o que seria alterado (<b>verificação</b>); só grava quando você clicar em <b>Aplicar</b> — e faz backup antes.</div>
      <div class="toolbar"><label class="btn ghost" style="cursor:pointer">Escolher planilhas…<input id="uf" type="file" multiple accept=".xlsx,.xls,.csv" hidden></label>
      <button class="btn ghost" id="uf-folder">Verificar a pasta bases_exemplo</button><span class="muted" id="uf-names"></span></div>
      <p id="uf-msg" class="imp-msg" role="status"></p><div id="uf-out"></div>`;
    const msg = (t, err) => { const m = $("#uf-msg"); m.textContent = t; m.className = "imp-msg" + (err ? " err" : ""); };
    const fmt = c => k => c[k] ? num(c[k]) : "–";
    const show = (res, applied) => {
      const rows = res.results.map(r => { const c = r.counts || {}, f = fmt(c), bad = r.status !== "ok";
        return `<tr><td>${esc(r.file)}</td><td>${esc(r.label || "")}</td><td>${bad ? `<span class="badge ${r.status === "erro" ? "bad" : "warn"}">${r.status}</span>` : num(r.rows)}</td><td><b>${f("new")}</b></td><td>${f("updated")}</td><td>${f("present")}</td><td>${f("unmatched")}</td><td class="muted" style="white-space:normal;min-width:260px">${(r.messages || []).slice(0, 3).map(esc).join("<br>")}</td></tr>`; });
      const t = res.totals, todo = t.new + t.updated;
      $("#uf-out").innerHTML = `<div class="cards mini-cards">${[["Novos", t.new], ["Atualizados", t.updated], ["Já existiam", t.present], ["Sem vínculo (guardados)", t.unmatched]].map(([l, v]) => `<div class="card"><span class="num sm">${num(v)}</span><small>${l}</small></div>`).join("")}</div>
        ${T(["Planilha", "Tipo de dado", "Linhas lidas", "Novos", "Atualizados", "Já existiam", "Sem vínculo", "Avisos"], rows)}
        ${applied ? `<div class="notice">✔ Atualização aplicada. Backup criado: <code>${esc(res.backup || "—")}</code>${res.equivalences ? " · equivalências recalculadas" : ""}. <a href="/dashboard">Ver dashboard</a></div>`
          : todo ? `<div class="acts"><button class="btn" id="uf-apply">Aplicar atualização (${num(t.new)} novos, ${num(t.updated)} atualizados)</button></div>`
                 : '<div class="notice">Banco já está em dia com estas planilhas: nada a inserir.</div>'}`;
      const ap = $("#uf-apply"); if (ap) ap.onclick = async () => { ap.disabled = true; msg("Aplicando… (backup + gravação)");
        try { const r = await post("/api/update/apply", { token: res.token }); msg(""); show(r, true); } catch (e) { ap.disabled = false; msg(e.message, true); } };
    };
    const check = async fd => { msg("Lendo as planilhas e comparando com o banco… pode levar alguns segundos."); $("#uf-out").innerHTML = "";
      try { const r = await J("/api/update/check", { method: "POST", body: fd }); msg(""); show(r, false); } catch (e) { msg(e.message, true); } };
    $("#uf").onchange = e => { const fs = [...e.target.files]; if (!fs.length) return; $("#uf-names").textContent = fs.length + " arquivo(s)"; const fd = new FormData(); fs.forEach(f => fd.append("files", f)); check(fd); };
    $("#uf-folder").onclick = () => { const fd = new FormData(); fd.append("folder", "1"); check(fd); };
  }

  (PAGES[page] || (() => root.innerHTML = empty("Página sem conteúdo.")))();
})();
