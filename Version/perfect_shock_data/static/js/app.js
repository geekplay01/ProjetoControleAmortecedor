// Dashboard, busca rápida e filtro do menu.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const fetchJSON = (u) => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  if ($(".cards") && $("#empty")) {
    fetchJSON("/api/stats").then(s => {
      document.querySelectorAll("[data-stat]").forEach(el => el.textContent = s[el.dataset.stat] ?? 0);
      $("#empty").hidden = s.products > 0;
    }).catch(() => { const e = $("#empty"); e.hidden = false; e.textContent = "Não foi possível consultar o banco local. Verifique se o app.py está em execução."; });
  }
  const nav = $("#navsearch");
  if (nav) nav.addEventListener("input", () => {
    const t = nav.value.toLowerCase();
    document.querySelectorAll("#nav a").forEach(a => a.style.display = a.textContent.toLowerCase().includes(t) ? "" : "none");
  });
  const q = $("#quick"), list = $("#quick-results");
  if (q) { let timer;
    q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(async () => {
      if (q.value.trim().length < 2) { list.innerHTML = ""; return; }
      const r = await fetchJSON("/api/quick-search?q=" + encodeURIComponent(q.value));
      list.innerHTML = r.length ? r.map(p => `<li><a href="${esc(p.url)}"><span class="tag ${p.kind === "Catálogo" ? "cat" : p.kind.replace("-", "")}">${esc(p.kind)}</span> <b>${esc(p.code)}</b> ${esc(p.text || "")}</a></li>`).join("")
                                : "<li>Nenhum resultado no catálogo nem em DES / R-D.</li>";
    }, 250); });
  }
})();

// Vídeo do amortecedor: respeita redução de movimento e cai para a imagem estática se não carregar.
(function () {
  const v = document.getElementById("hero-video"); if (!v) return;
  const still = () => { const i = new Image(); i.src = v.dataset.fallback; i.alt = "Amortecedor PERFECT"; v.replaceWith(i); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return still();
  v.addEventListener("error", still, true); v.querySelector("source").addEventListener("error", still);
  v.play().catch(() => {});
})();


// ---- tema claro/escuro (gravado neste navegador) ----
window.psdTheme = {
  get: () => document.documentElement.getAttribute("data-theme") || "dark",
  set(t) { document.documentElement.setAttribute("data-theme", t); try { localStorage.setItem("psd-theme", t); } catch (e) { } document.dispatchEvent(new CustomEvent("psd-theme", { detail: t })); },
  toggle() { this.set(this.get() === "dark" ? "light" : "dark"); }
};
document.addEventListener("click", e => { if (e.target.closest("#themebtn")) psdTheme.toggle(); });
