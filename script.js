(() => {
  "use strict";

  /* ---------- State ---------- */
  const KEY = "cellark.catalogue.lang";
  // The price tier (retail vs wholesale) is fixed by the URL — NOT a button —
  // so each audience gets its own link / QR code and a retail visitor can never
  // switch to the trade prices. Wholesale URL: add ?trade (also ?wholesale,
  // ?xondriki, ?b2b). Retail is the plain URL.
  const TRADE_PARAMS = ["trade", "wholesale", "xondriki", "b2b"];
  const urlWantsTrade = () => {
    const p = new URLSearchParams(location.search);
    return TRADE_PARAMS.some((k) => p.has(k));
  };
  // "Buy online" sends retail shoppers to the website shop (→ Shopify checkout). Absolute
  // URL so it works from every deployment of this catalogue; update at the cellark.gr launch.
  const SHOP_URL = "https://romanos2408.github.io/cellark/catalog.html";
  const STATE = {
    lang: (() => { try { return localStorage.getItem(KEY) || "en"; } catch { return "en"; } })(),
    mode: "retail", // resolved in init() from the URL (and the show_wholesale switch)
    data: null,
    cat: "all",
    query: "",
  };

  const LABELS = {
    gr: {
      searchPlaceholder: "Αναζήτηση κρασιού, ποικιλίας, περιοχής…",
      all: "Όλα",
      empty: "Δεν βρέθηκαν κρασιά.",
      labels: (n) => `${n} ${n === 1 ? "ετικέτα" : "ετικέτες"}`,
      legal: "Απολαύστε υπεύθυνα · 18+",
      followLabel: "Instagram",
      retail: "Λιανική",
      wholesale: "Χονδρική",
      priceTBD: "—",
      askPrice: "Κατόπιν συνεννόησης",
      buy: "Αγορά online",
    },
    en: {
      searchPlaceholder: "Search wine, grape, region…",
      all: "All",
      empty: "No wines found.",
      labels: (n) => `${n} ${n === 1 ? "label" : "labels"}`,
      legal: "Please enjoy responsibly · 18+",
      followLabel: "Instagram",
      retail: "Retail",
      wholesale: "Wholesale",
      priceTBD: "—",
      askPrice: "On request",
      buy: "Buy online",
    },
  };

  const lkey = () => (STATE.lang === "en" ? "en" : "gr");
  const t = () => LABELS[lkey()];
  const pick = (obj, base) => obj[`${base}_${lkey()}`] ?? obj[`${base}_gr`] ?? "";

  // Always format with a DOT decimal and 2 places, in both languages, for
  // consistency: €16.50, €11.95, €25.00.
  const fmtPrice = (n) => (n == null ? null : "€" + Number(n).toFixed(2));
  const pickPrice = (w) =>
    (STATE.mode === "wholesale" ? w.price_wholesale : w.price_retail) ?? null;
  // Wholesale prices are by arrangement and intentionally NOT published in this public file;
  // in trade mode show "on request" rather than a bare dash.
  const emptyPriceText = () => (STATE.mode === "wholesale" ? t().askPrice : t().priceTBD);
  const wholesaleOn = () => !!(STATE.data && STATE.data.pricing && STATE.data.pricing.show_wholesale);

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Static (data-gr / data-en) text ---------- */
  function applyStatic() {
    const lang = lkey();
    document.documentElement.lang = lang === "en" ? "en" : "el";
    document.querySelectorAll("[data-gr]").forEach((node) => {
      const txt = node.getAttribute("data-" + lang);
      if (txt != null) node.textContent = txt;
    });
    document.querySelectorAll(".lang [data-lang]").forEach((s) => {
      s.classList.toggle("on", s.getAttribute("data-lang") === lang);
    });
    if (STATE.data) {
      $("#tagline").textContent = pick(STATE.data.shop, "tagline");
    }
    const search = $("#search");
    if (search) search.placeholder = t().searchPlaceholder;
  }

  /* ---------- Tabs ---------- */
  function buildTabs() {
    const host = $("#tabs");
    host.innerHTML = "";
    const cats = [{ id: "all" }, ...STATE.data.categories];
    cats.forEach((c) => {
      const b = el("button", "tab");
      b.type = "button";
      b.dataset.cat = c.id;
      b.textContent = c.id === "all" ? t().all : pick(c, "name");
      b.classList.toggle("on", STATE.cat === c.id);
      b.addEventListener("click", () => {
        STATE.cat = c.id;
        host.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x.dataset.cat === c.id));
        renderGrid();
      });
      host.appendChild(b);
    });
  }

  /* ---------- Cards ---------- */
  function matchesQuery(w, q) {
    if (!q) return true;
    const fields = [w.name, w.grape, w.note_gr, w.note_en, w.type_gr, w.type_en];
    return fields.some((f) => f && f.toLowerCase().includes(q));
  }

  function buildCard(w) {
    const card = el("article", "card");

    const photo = el("div", "card-photo");
    const badge = el("span", "card-badge");
    badge.textContent = pick(w, "sweet");
    const pic = document.createElement("picture");
    pic.innerHTML =
      `<source srcset="assets/wines/${esc(w.slug)}.avif?v=2" type="image/avif">` +
      `<img src="assets/wines/${esc(w.slug)}.png?v=2" alt="${esc(w.name)}" loading="lazy" decoding="async">`;
    photo.append(badge, pic);

    // Tap/click the bottle → full-scale zoom
    photo.setAttribute("role", "button");
    photo.setAttribute("tabindex", "0");
    photo.setAttribute("aria-label", w.name);
    photo.addEventListener("click", () => openLightbox(w));
    photo.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(w); }
    });

    const body = el("div", "card-body");

    const type = el("div", "card-type");
    type.textContent = pick(w, "type");

    const name = el("div", "card-name");
    name.textContent = w.name;

    const grape = el("div", "card-grape");
    grape.textContent = w.grape;

    const note = el("p", "card-note");
    note.textContent = pick(w, "note");

    const specs = el("div", "card-specs");
    [w.abv, pick(w, "serve")].filter(Boolean).forEach((s) => {
      const sp = el("span", "spec");
      sp.textContent = s;
      specs.appendChild(sp);
    });

    const price = el("div", "card-price");
    const tier = el("span", "card-price-tier");
    tier.textContent = STATE.mode === "wholesale" ? t().wholesale : t().retail;
    const amount = el("span", "card-price-amount");
    const formatted = fmtPrice(pickPrice(w));
    if (formatted) {
      amount.textContent = formatted;
    } else {
      amount.textContent = emptyPriceText();
      amount.classList.add("is-empty");
      amount.title = t().askPrice;
    }
    price.append(tier, amount);

    body.append(type, name, grape, note, specs, price);
    card.append(photo, body);
    return card;
  }

  /* ---------- Grid ---------- */
  function renderGrid() {
    const root = $("#app");
    root.innerHTML = "";
    const q = STATE.query.trim().toLowerCase();

    const cats = STATE.data.categories.filter((c) => STATE.cat === "all" || c.id === STATE.cat);

    let total = 0;
    cats.forEach((c) => {
      const wines = STATE.data.wines.filter((w) => w.cat === c.id && matchesQuery(w, q));
      if (!wines.length) return;
      total += wines.length;

      const group = el("section", "cat-group");

      const title = el("h2", "cat-group-title");
      title.textContent = pick(c, "name");
      const count = el("span", "cat-group-count");
      count.textContent = t().labels(wines.length);
      title.appendChild(count);

      const rule = el("div", "cat-rule");
      const grid = el("div", "grid");
      wines.forEach((w) => grid.appendChild(buildCard(w)));

      group.append(title, rule, grid);
      root.appendChild(group);
    });

    if (!total) {
      const empty = el("p", "empty");
      empty.textContent = t().empty;
      root.appendChild(empty);
    }
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const foot = $("#foot");
    foot.innerHTML = "";
    const shop = STATE.data.shop;

    const socials = el("div", "foot-socials");
    if (shop.instagram_url) {
      const a = el("a", "foot-social");
      a.href = shop.instagram_url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML =
        `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>` +
        `<span>${esc(shop.instagram_handle || t().followLabel)}</span>`;
      socials.appendChild(a);
    }

    const legal = el("span", "foot-legal");
    const pricing = STATE.data.pricing;
    const note = pricing && (lkey() === "en" ? pricing.note_en : pricing.note_gr);
    legal.textContent = note ? `${note}  ·  ${t().legal}` : t().legal;

    foot.append(socials, legal);
  }

  /* ---------- Mode badge (which price list this URL is) ---------- */
  function renderModeBadge() {
    const host = $("#hero-mode");
    if (!host) return;
    const isTrade = STATE.mode === "wholesale";
    host.textContent = isTrade
      ? (lkey() === "en" ? "Wholesale price list" : "Τιμοκατάλογος χονδρικής")
      : (lkey() === "en" ? "Retail price list" : "Τιμοκατάλογος λιανικής");
    host.classList.toggle("is-trade", isTrade);
    host.hidden = false;
  }

  /* ---------- Buy-now CTA (header) — retail only ---------- */
  function renderBuyNow() {
    const b = $("#buyNow");
    if (!b) return;
    // Wholesale orders are by arrangement, not via the retail shop — hide it there.
    const show = STATE.mode !== "wholesale";
    b.hidden = !show;
    if (show) b.href = SHOP_URL;
  }

  /* ---------- Language toggle ---------- */
  function setLang(lang) {
    STATE.lang = lang;
    try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
    applyStatic();
    renderModeBadge();
    buildTabs();
    renderGrid();
    renderFooter();
  }

  function bindLang() {
    const btn = $("#lang");
    btn.addEventListener("click", () => setLang(STATE.lang === "gr" ? "en" : "gr"));
  }

  function bindSearch() {
    $("#search").addEventListener("input", (e) => {
      STATE.query = e.target.value;
      renderGrid();
    });
  }

  /* ---------- Detail card (zoom + full info) ---------- */
  function openLightbox(w) {
    const lb = $("#lightbox");
    const card = $("#detail-card");
    const price = fmtPrice(pickPrice(w));
    const tier = STATE.mode === "wholesale" ? t().wholesale : t().retail;
    const badge = pick(w, "sweet");
    const specs = [w.abv, pick(w, "serve")]
      .filter(Boolean)
      .map((s) => `<span class="spec">${esc(s)}</span>`)
      .join("");

    card.innerHTML =
      `<div class="detail-media">` +
        (badge ? `<span class="card-badge">${esc(badge)}</span>` : "") +
        `<picture>` +
          `<source srcset="assets/wines/${esc(w.slug)}.avif?v=2" type="image/avif">` +
          `<img class="detail-img" src="assets/wines/${esc(w.slug)}.png?v=2" alt="${esc(w.name)}">` +
        `</picture>` +
      `</div>` +
      `<div class="detail-info">` +
        `<span class="detail-type">${esc(pick(w, "type"))}</span>` +
        `<h2 class="detail-name">${esc(w.name)}</h2>` +
        `<p class="detail-grape">${esc(w.grape)}</p>` +
        `<p class="detail-note">${esc(pick(w, "note"))}</p>` +
        `<div class="detail-specs">${specs}</div>` +
        `<div class="detail-price">` +
          `<span class="detail-price-tier">${esc(tier)}</span>` +
          `<span class="detail-price-amount${price ? "" : " is-empty"}">${esc(price || emptyPriceText())}</span>` +
        `</div>` +
      `</div>`;

    lb.setAttribute("aria-label", w.name);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lightbox-close").focus();
  }

  function closeLightbox() {
    const lb = $("#lightbox");
    if (lb.hidden) return;
    lb.hidden = true;
    $("#detail-card").innerHTML = "";
    document.body.style.overflow = "";
  }

  function bindLightbox() {
    const lb = $("#lightbox");
    $("#lightbox-close").addEventListener("click", closeLightbox);
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
  }

  /* ---------- Boot ---------- */
  async function init() {
    bindLang();
    bindSearch();
    bindLightbox();
    try {
      const res = await fetch("wines.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      STATE.data = await res.json();
    } catch (err) {
      console.error("Failed to load wines.json", err);
      $("#app").innerHTML = `<p class="empty">⚠️ Could not load the catalogue. Please refresh.</p>`;
      return;
    }
    STATE.mode = (wholesaleOn() && urlWantsTrade()) ? "wholesale" : "retail";
    applyStatic();
    renderModeBadge();
    renderBuyNow();
    buildTabs();
    renderGrid();
    renderFooter();
  }

  init();
})();
