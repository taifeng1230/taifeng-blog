/* ============================================================
   taifeng1230.cn — 应用逻辑：路由 / Markdown / 高亮 / 搜索 / 互动
   ============================================================ */
(function () {
"use strict";

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const POSTS = window.POSTS;
const TAG_HUE = { "网络": 190, "运维": 160, "Java": 25, "后端": 35, "前端": 265, "工程化": 300, "CSS": 320, "Docker": 205, "小程序": 130, "JavaScript": 48, "工具": 220, "Git": 12 };
const GLYPH = { "frp-cgnat": "⇄", "springboot-session": "{ }", "vite-perf": "⌁", "css-scroll-driven": "▚", "docker-mc": "▣", "wechat-auth": "◉", "js-eventloop": "↻", "git-rebase": "⌥" };
const hueOf = (p) => TAG_HUE[p.tags[0]] ?? 190;
const readMin = (p) => Math.max(3, Math.round(p.body.replace(/\s/g, "").length / 420));
const fmtDate = (d) => d.replace(/-/g, ".");
const fmtNum = (n) => n >= 10000 ? (n / 10000).toFixed(1) + "w" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
const tagHTML = (t) => `<span class="tag" style="--th:${TAG_HUE[t] ?? 190}">${esc(t)}</span>`;

const ICONS = {
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 8.5 8.5 0 1 0 20 13.5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11a4.6 4.6 0 0 1 8-3.1 4.6 4.6 0 0 1 8 3.1c0 6.1-8 11-8 11z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  share: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.4 10.8l7.2-3.6M8.4 13.2l7.2 3.6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  server: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L20 10l-6.1 1.4L12 17l-1.9-5.6L4 10l6.1-1.4z"/></svg>',
};

/* ---------------- 星屑粒子 ---------------- */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
(function initPetals() {
  if (reduceMotion) return;
  const box = $("#petals");
  const starCols = ["#f2b632", "#f2b632", "#4dabf7", "#e8506a"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.className = "petal";
    const size = 8 + Math.random() * 8;
    const col = starCols[(Math.random() * starCols.length) | 0];
    s.style.cssText = `left:${(Math.random() * 100).toFixed(1)}vw;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;background:linear-gradient(135deg,#fff,${col});--sway:${(Math.random() * 160 - 80) | 0}px;--spin:${(Math.random() * 720 - 360) | 0}deg;animation-duration:${(9 + Math.random() * 10).toFixed(1)}s;animation-delay:${(-Math.random() * 19).toFixed(1)}s;opacity:${(.3 + Math.random() * .35).toFixed(2)}`;
    box.appendChild(s);
  }
})();

function burst(x, y, kind) {
  if (reduceMotion) return;
  for (let i = 0; i < 10; i++) {
    const el = document.createElement("span");
    el.className = kind === "heart" ? "burst burst-heart" : "burst";
    if (kind === "heart") el.textContent = "♥";
    const a = Math.random() * Math.PI * 2, d = 42 + Math.random() * 70;
    el.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(a) * d) | 0}px;--dy:${(Math.sin(a) * d - 34) | 0}px;--rot:${(Math.random() * 360 - 180) | 0}deg`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".nav-links a, .logo")) burst(e.clientX, e.clientY);
});

/* ---------------- 导航指示条 ---------------- */
function updateIndicator() {
  const act = $(".nav-links a.active");
  const ind = $("#navIndicator");
  if (!act || innerWidth <= 720) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1;
  ind.style.left = act.offsetLeft + 15 + "px";
  ind.style.width = Math.max(act.offsetWidth - 30, 12) + "px";
}
window.addEventListener("resize", updateIndicator);

/* ---------------- Toast ---------------- */
function toast(msg, type, action) {
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.className = "toast-action";
    b.textContent = action.label;
    b.addEventListener("click", () => { action.fn(); el.remove(); });
    el.appendChild(b);
  }
  $("#toastStack").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, action ? 5000 : 2400);
}

/* ---------------- Markdown 渲染 ---------------- */
function inlineMD(text) {
  const parts = String(text).split(/`([^`]+)`/g);
  return parts.map((seg, i) => {
    if (i % 2 === 1) return `<code>${esc(seg)}</code>`;
    let s = esc(seg);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
      /^(https?:|#|\/)/.test(u) ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : t);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return s;
  }).join("");
}

const KW = {
  js: "const let var function return if else for while async await new import from export default class extends try catch throw typeof of in null undefined true false this",
  java: "public private protected class interface return if else new import package void static final throws throw try catch extends implements Optional Bean Component Override true false null int long boolean",
  bash: "npx git docker systemctl curl cd echo sudo",
  css: "animation transform transition opacity display position background border content from to",
  yaml: "true false",
  toml: "true false",
};
function langFamily(lang) {
  if (/^(js|javascript|jsx|ts|typescript)$/.test(lang)) return "js";
  if (/^(java|kotlin)$/.test(lang)) return "java";
  if (/^(bash|sh|shell|console)$/.test(lang)) return "bash";
  if (/^(css|scss)$/.test(lang)) return "css";
  return lang;
}
function highlight(code, lang) {
  const fam = langFamily(lang);
  let s = esc(code);
  if (fam === "text" || fam === "") return s;
  const lineCom = /^(bash|toml|yaml|properties|ini|python)$/.test(fam) ? "#[^\\n]*" : "\\/\\/[^\\n]*";
  const kws = (KW[fam] || "").split(" ").filter(Boolean);
  const kwPat = kws.length ? "\\b(?:" + kws.join("|") + ")\\b" : "(?!x)x";
  const re = new RegExp(
    "(&quot;[\\s\\S]*?&quot;|&#39;[\\s\\S]*?&#39;)" + // 1 string
    "|(" + lineCom + "|\\/\\*[\\s\\S]*?\\*\\/)" +      // 2 comment
    "|(" + kwPat + ")" +                               // 3 keyword
    "|(\\b\\d+(?:\\.\\d+)?\\b)" +                      // 4 number
    "|(\\b[A-Za-z_]\\w*(?=\\())", "g");                // 5 fn
  return s.replace(re, (m, str, com, kw, num, fn) => {
    if (str) return `<span class="tok-str">${str}</span>`;
    if (com) return `<span class="tok-com">${com}</span>`;
    if (kw) return `<span class="tok-kw">${kw}</span>`;
    if (num) return `<span class="tok-num">${num}</span>`;
    if (fn) return `<span class="tok-fn">${fn}</span>`;
    return m;
  });
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  const toc = [];
  let i = 0, hIdx = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || "text";
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      const raw = buf.join("\n");
      out.push(`<div class="code-block"><div class="code-head"><span class="code-dots"><i></i><i></i><i></i></span><span class="code-lang">${esc(lang)}</span><button class="copy-btn" data-code="${esc(raw)}">${ICONS.copy}<span>复制</span></button></div><pre><code>${highlight(raw, lang)}</code></pre></div>`);
      continue;
    }
    const h = line.match(/^(#{2,3})\s+(.*)/);
    if (h) {
      const level = h[1].length;
      const id = "h-" + (hIdx++);
      toc.push({ id, level, text: h[2].replace(/[*`]/g, "") });
      out.push(`<h${level} id="${id}">${inlineMD(h[2])}</h${level}>`);
      i++; continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote><p>${inlineMD(buf.join(" "))}</p></blockquote>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { out.push("<hr>"); i++; continue; }
    if (/^\s*-\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*-\s+/, "")); i++; }
      out.push("<ul>" + buf.map((b) => `<li>${inlineMD(b)}</li>`).join("") + "</ul>");
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      out.push("<ol>" + buf.map((b) => `<li>${inlineMD(b)}</li>`).join("") + "</ol>");
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const cells = (l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) { rows.push(cells(lines[i])); i++; }
      out.push("<table><thead><tr>" + head.map((c) => `<th>${inlineMD(c)}</th>`).join("") + "</tr></thead><tbody>" +
        rows.map((r) => "<tr>" + r.map((c) => `<td>${inlineMD(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table>");
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{2,3}\s|```|>|\s*-\s|\s*\d+\.\s)/.test(lines[i]) && !lines[i].includes("|")) { buf.push(lines[i]); i++; }
    out.push(`<p>${inlineMD(buf.join(" "))}</p>`);
  }
  return { html: out.join("\n"), toc };
}

/* ---------------- 持久化状态 ---------------- */
const likes = new Set(store.get("tf_likes", []));
const viewExtra = store.get("tf_views", {});
const viewsOf = (p) => p.views + (viewExtra[p.slug] || 0);
const likesOf = (p) => p.likes + (likes.has(p.slug) ? 1 : 0);

function allComments() {
  const saved = store.get("tf_comments", null);
  if (saved) return saved;
  const seeded = {};
  for (const [slug, arr] of Object.entries(window.SEED_COMMENTS || {})) {
    seeded[slug] = arr.map((c, i) => ({ id: slug + "-seed-" + i, mine: false, ...c }));
  }
  store.set("tf_comments", seeded);
  return seeded;
}
const commentsOf = (slug) => allComments()[slug] || [];

/* ---------------- 路由 ---------------- */
const view = $("#view");
let cleanups = [];
let revealObserver = null;
const state = { tag: "全部", sort: "new" };

function onRouteCleanup(fn) { cleanups.push(fn); }
function runCleanups() { cleanups.forEach((f) => { try { f(); } catch {} }); cleanups = []; }

function router() {
  runCleanups();
  const hash = location.hash || "#/";
  const m = hash.match(/^#\/post\/([\w-]+)/);
  const t = hash.match(/^#\/tag\/(.+)/);
  let navKey = "home";
  if (m) { renderPost(decodeURIComponent(m[1])); navKey = "home"; }
  else if (t) { state.tag = decodeURIComponent(t[1]); renderHome(); }
  else if (hash.startsWith("#/archive")) { renderArchive(); navKey = "archive"; }
  else if (hash.startsWith("#/tags")) { renderTags(); navKey = "tags"; }
  else if (hash.startsWith("#/links")) { renderLinks(); navKey = "links"; }
  else if (hash.startsWith("#/about")) { renderAbout(); navKey = "about"; }
  else { state.tag = "全部"; renderHome(); }
  $$(".nav-links a").forEach((a) => a.classList.toggle("active", a.dataset.nav === navKey));
  updateIndicator();
  $("#navLinks").classList.remove("open");
  $("#menuBtn").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  initReveal();
  updateScrollUI();
}

function initReveal() {
  if (revealObserver) revealObserver.disconnect();
  if (!("IntersectionObserver" in window)) {
    $$(".reveal", view).forEach((el) => el.classList.add("in"));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.08 });
  $$(".reveal", view).forEach((el, i) => { el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms"; revealObserver.observe(el); });
  onRouteCleanup(() => revealObserver && revealObserver.disconnect());
}

/* ---------------- 空状态 ---------------- */
function emptyState(title, sub) {
  return `<div class="empty-state reveal">
    <div class="empty-kaomoji">(｡•́︿•̀｡)</div>
    <p class="empty-title">${title}</p>
    <p class="empty-sub">${sub}</p>
    <a class="btn btn-ghost" href="#/about">去找奈绪玩 ${ICONS.arrow}</a>
  </div>`;
}

/* ---------------- 卡片 ---------------- */
function cardHTML(p, featured) {
  return `<article class="post-card reveal${featured ? " featured" : ""}" style="--h:${hueOf(p)}">
    <div class="card-cover">${featured ? '<span class="cover-badge">置顶 · FEATURED</span>' : ""}<span class="cover-glyph">${GLYPH[p.slug] || "⌘"}</span></div>
    <div class="card-body">
      <div class="card-tags">${p.tags.map(tagHTML).join("")}</div>
      <h3 class="card-title">${esc(p.title)}</h3>
      <p class="card-excerpt">${esc(p.excerpt)}</p>
      <div class="card-meta">
        <span>${ICONS.cal}${fmtDate(p.date)}</span>
        <span>${ICONS.clock}${readMin(p)} min</span>
        <span>${ICONS.eye}${fmtNum(viewsOf(p))}</span>
        <span>${ICONS.heart}${fmtNum(likesOf(p))}</span>
      </div>
    </div>
    <a class="card-link" href="#/post/${p.slug}" aria-label="${esc(p.title)}"></a>
  </article>`;
}

function filteredPosts() {
  let list = POSTS.filter((p) => state.tag === "全部" || p.tags.includes(state.tag));
  if (state.sort === "new") list.sort((a, b) => b.date.localeCompare(a.date));
  else if (state.sort === "old") list.sort((a, b) => a.date.localeCompare(b.date));
  else if (state.sort === "hot") list.sort((a, b) => viewsOf(b) - viewsOf(a));
  return list;
}

/* ---------------- 首页 ---------------- */
function renderHome() {
  const tags = ["全部", ...new Set(POSTS.flatMap((p) => p.tags))];
  const totalWords = POSTS.reduce((s, p) => s + p.body.replace(/\s/g, "").length, 0);
  const totalViews = POSTS.reduce((s, p) => s + viewsOf(p), 0);
  const list = filteredPosts();
  const featuredSlug = state.tag === "全部" && state.sort === "new" ? (POSTS.find((p) => p.featured) || {}).slug : null;

  view.innerHTML = `
  <section class="hero">
    <img class="hero-cover" src="assets/cover.png" alt="" aria-hidden="true">
    <div class="hero-veil"></div>
    <div class="hero-inner">
      <div class="hero-copy">
        <span class="hero-eyebrow"><span class="dot"></span>星之森学园 · 学生会</span>
        <h1 class="hero-title">在彗星划过的速度里<br>写<span class="grad" id="typeTarget">代码</span><span class="type-cursor"></span></h1>
        <p class="hero-sub">你好，我是<b>台风</b>，看板娘是<b>友利奈绪</b> ✦ 这里记录我在<b>前端、后端、网络与运维</b>路上的实战笔记——每一篇都来自真实踩过的坑，连她的摄像机都存档了 (¬‿¬)</p>
        <div class="hero-stats">
          <div class="stat"><b>${POSTS.length}</b><span>篇文章</span></div>
          <div class="stat"><b>${tags.length - 1}</b><span>个标签</span></div>
          <div class="stat"><b>${(totalWords / 10000).toFixed(1)}w</b><span>字沉淀</span></div>
          <div class="stat"><b>${fmtNum(totalViews)}</b><span>次阅读</span></div>
        </div>
        <div class="hero-cta">
          ${POSTS.length ? `<a class="btn btn-primary" href="#/post/${POSTS[0].slug}">开始阅读 ${ICONS.arrow}</a>` : `<a class="btn btn-primary" href="#/about">认识奈绪 ${ICONS.arrow}</a>`}
          <a class="btn btn-ghost" href="#/archive">查看归档</a>
        </div>
      </div>
      <button class="hero-mascot" id="mascotBtn" aria-label="和看板娘友利奈绪打招呼">
        <span class="mascot-bubble" id="mascotBubble">欢迎光临。…别误会，只是在拍素材 (¬‿¬)</span>
        <img src="assets/mascot.png" alt="看板娘友利奈绪：银白双马尾、蓝眼、星之森学园制服，举着摄像机与欢迎光临牌的二次元女孩">
      </button>
    </div>
    <svg class="wave-divider" viewBox="0 0 1200 34" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 34 Q30 8 60 34 T120 34 T180 34 T240 34 T300 34 T360 34 T420 34 T480 34 T540 34 T600 34 T660 34 T720 34 T780 34 T840 34 T900 34 T960 34 T1020 34 T1080 34 T1140 34 T1200 34 Z" fill="var(--bg)"/>
    </svg>
  </section>
  <section class="section wrap" id="posts">
    <div class="section-head"><h2>最新文章</h2><span class="section-sub">${POSTS.length ? `共 ${list.length} 篇` : "奈绪取材中…"}</span><a class="more" href="#/archive">全部归档 →</a></div>
    ${POSTS.length ? `<div class="filter-bar" id="filterBar">
      ${tags.map((t) => `<button class="chip${state.tag === t ? " active" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`).join("")}
      <select class="sort-select" id="sortSelect" aria-label="排序方式">
        <option value="new"${state.sort === "new" ? " selected" : ""}>最新发布</option>
        <option value="old"${state.sort === "old" ? " selected" : ""}>最早发布</option>
        <option value="hot"${state.sort === "hot" ? " selected" : ""}>最多阅读</option>
      </select>
    </div>` : ""}
    <div class="post-grid" id="postGrid">
      ${list.length ? list.map((p) => cardHTML(p, p.slug === featuredSlug)).join("") : emptyState("还没有文章哦", "奈绪正在拍素材，更新敬请期待 ✦")}
    </div>
  </section>`;

  // 打字机
  const words = ["代码", "前端魔法", "后端架构", "网络运维", "开源折腾"];
  const target = $("#typeTarget");
  let wi = 0, ci = words[0].length, deleting = true, timer;
  function tick() {
    const w = words[wi];
    if (deleting) {
      ci--;
      if (ci <= 0) { ci = 0; deleting = false; wi = (wi + 1) % words.length; timer = setTimeout(tick, 420); target.textContent = ""; return; }
      timer = setTimeout(tick, 70);
    } else {
      ci++;
      if (ci >= words[wi].length) { ci = words[wi].length; deleting = true; target.textContent = words[wi]; timer = setTimeout(tick, 1900); return; }
      timer = setTimeout(tick, 130);
    }
    target.textContent = words[wi].slice(0, ci);
  }
  timer = setTimeout(tick, 2100);
  onRouteCleanup(() => clearTimeout(timer));

  // 看板娘友利奈绪
  const LINES = [
    "欢迎光临。…别误会，只是在拍素材 (¬‿¬)",
    "你的代码能力，我收下了。学生会需要这种人。",
    "按 Ctrl+K 可以搜文章。索引我已经做好了。",
    "点右上角的月亮，切换星空模式。星星会记得一切。",
    "MC 服务器今天也正常运行中。……只是顺便监控而已。",
    "这篇文章的调试过程，全程录像了。要看看吗？",
    "点赞的话……我就勉强收下吧 ✦",
  ];
  const bubble = $("#mascotBubble"), mBtn = $("#mascotBtn");
  let li = 0;
  const say = (t) => { bubble.classList.add("fade"); setTimeout(() => { bubble.textContent = t; bubble.classList.remove("fade"); }, 260); };
  const rot = setInterval(() => { li = (li + 1) % LINES.length; say(LINES[li]); }, 7000);
  onRouteCleanup(() => clearInterval(rot));
  mBtn.addEventListener("click", (e) => {
    li = (li + 1 + ((Math.random() * (LINES.length - 1)) | 0)) % LINES.length;
    say(LINES[li]);
    mBtn.classList.remove("bounce"); void mBtn.offsetWidth; mBtn.classList.add("bounce");
    burst(e.clientX || innerWidth / 2, e.clientY || 220);
  });

  const filterBar = $("#filterBar");
  if (filterBar) filterBar.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.tag = chip.dataset.tag;
    refreshGrid();
    $$(".chip", filterBar).forEach((c) => c.classList.toggle("active", c.dataset.tag === state.tag));
  });
  const sortSelect = $("#sortSelect");
  if (sortSelect) sortSelect.addEventListener("change", (e) => { state.sort = e.target.value; refreshGrid(); });

  function refreshGrid() {
    const l = filteredPosts();
    const fs = state.tag === "全部" && state.sort === "new" ? (POSTS.find((p) => p.featured) || {}).slug : null;
    $("#postGrid").innerHTML = l.length ? l.map((p) => cardHTML(p, p.slug === fs)).join("") : emptyState("还没有文章哦", "奈绪正在拍素材，更新敬请期待 ✦");
    $(".section-sub").textContent = POSTS.length ? `共 ${l.length} 篇` : "奈绪取材中…";
    initReveal();
  }
}

/* ---------------- 文章页 ---------------- */
function renderPost(slug) {
  const p = POSTS.find((x) => x.slug === slug);
  if (!p) {
    view.innerHTML = `<div class="page-head wrap"><h1>404</h1><p>这篇文章被台风吹走了。</p><p style="margin-top:20px"><a class="btn btn-primary" href="#/">返回首页 ${ICONS.arrow}</a></p></div>`;
    return;
  }
  // 每会话计一次阅读
  try {
    const seen = JSON.parse(sessionStorage.getItem("tf_seen") || "[]");
    if (!seen.includes(slug)) {
      seen.push(slug);
      sessionStorage.setItem("tf_seen", JSON.stringify(seen));
      viewExtra[slug] = (viewExtra[slug] || 0) + 1;
      store.set("tf_views", viewExtra);
    }
  } catch {}

  const { html, toc } = renderMarkdown(p.body);
  const idx = POSTS.indexOf(p);
  const prev = POSTS[idx + 1], next = POSTS[idx - 1];
  const related = POSTS.filter((x) => x.slug !== slug && x.tags.some((t) => p.tags.includes(t)));
  for (const x of POSTS) { if (related.length >= 3) break; if (x.slug !== slug && !related.includes(x)) related.push(x); }
  related.length = Math.min(related.length, 3);
  const liked = likes.has(slug);

  view.innerHTML = `
  <div class="post-page">
    <div class="post-layout">
      <div class="post-main">
        <div class="post-hero">
          <span class="crumb"><a href="#/">首页</a> / <a href="#/tag/${encodeURIComponent(p.tags[0])}">${esc(p.tags[0])}</a> / 正文</span>
          <div class="card-tags">${p.tags.map(tagHTML).join("")}</div>
          <h1 class="post-title">${esc(p.title)}</h1>
          <div class="post-meta">
            <span>${ICONS.cal}${fmtDate(p.date)}</span>
            <span>${ICONS.clock}约 ${readMin(p)} 分钟</span>
            <span>${ICONS.eye}<span id="viewCount">${fmtNum(viewsOf(p))}</span> 阅读</span>
            <span>${ICONS.code}${p.body.replace(/\s/g, "").length} 字</span>
          </div>
          <div class="post-banner" style="--h:${hueOf(p)}"><span class="cover-glyph">${GLYPH[p.slug] || "⌘"}</span></div>
        </div>
        <article class="md" id="mdBody">${html}</article>
        <div class="post-actions">
          <button class="like-btn${liked ? " liked" : ""}" id="likeBtn">${ICONS.heart}<span id="likeCount">${likesOf(p)}</span> 点赞</button>
          <button class="share-btn" id="shareBtn">${ICONS.share}分享文章</button>
        </div>
        <nav class="post-nav">
          ${prev ? `<a class="pn-card" href="#/post/${prev.slug}"><span class="pn-dir">← 上一篇</span><span class="pn-title">${esc(prev.title)}</span></a>` : '<span class="pn-card placeholder"></span>'}
          ${next ? `<a class="pn-card next" href="#/post/${next.slug}"><span class="pn-dir">下一篇 →</span><span class="pn-title">${esc(next.title)}</span></a>` : '<span class="pn-card placeholder"></span>'}
        </nav>
        ${related.length ? `<div class="section-head" style="margin-top:36px"><h2 style="font-size:1.25rem">相关文章</h2></div>
        <div class="related-grid">${related.map((r) => `<a class="rel-card" href="#/post/${r.slug}">${tagHTML(r.tags[0])}<div class="rel-title">${esc(r.title)}</div></a>`).join("")}</div>` : ""}
        <section class="comments" id="comments">
          <div class="section-head"><h2 style="font-size:1.25rem">评论</h2><span class="section-sub" id="commentCount"></span></div>
          <form class="comment-form" id="commentForm">
            <h3><span>&gt;_</span> 留下你的想法</h3>
            <div class="cf-row"><input type="text" id="cfName" maxlength="20" placeholder="昵称（可选，默认：匿名风暴）"></div>
            <textarea id="cfText" maxlength="500" placeholder="友善交流，代码问题欢迎带上下文…（最多 500 字）"></textarea>
            <div class="cf-foot"><span class="cf-hint">评论保存在本地浏览器，可随时删除</span><button type="submit" class="btn btn-primary">发布评论</button></div>
          </form>
          <div id="commentList"></div>
        </section>
      </div>
      <aside class="toc" id="toc">
        <span class="toc-dot" id="tocDot"></span>
        <div class="toc-title">もくじ · 目录</div>
        ${toc.map((t) => `<a href="#${t.id}" class="h${t.level}" data-h="${t.id}">${esc(t.text)}</a>`).join("")}
      </aside>
    </div>
  </div>`;

  document.title = p.title + " — taifeng1230.cn";
  onRouteCleanup(() => { document.title = "taifeng1230.cn — 白空与星的技术博客"; });

  // TOC 平滑滚动 + scrollspy
  $("#toc").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-h]");
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.h);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: "smooth" });
  });
  const spy = () => {
    const heads = toc.map((t) => document.getElementById(t.id)).filter(Boolean);
    let cur = heads[0];
    for (const h of heads) if (h.getBoundingClientRect().top < 120) cur = h;
    $$("#toc a").forEach((a) => a.classList.toggle("active", cur && a.dataset.h === cur.id));
    const md = $("#mdBody"), dot = $("#tocDot");
    if (md && dot) {
      const r = md.getBoundingClientRect();
      const prog = Math.min(Math.max((120 - r.top) / Math.max(r.height - innerHeight * .6, 1), 0), 1);
      dot.style.top = (prog * 100).toFixed(1) + "%";
    }
  };
  window.addEventListener("scroll", spy, { passive: true });
  onRouteCleanup(() => window.removeEventListener("scroll", spy));
  spy();

  // 点赞
  $("#likeBtn").addEventListener("click", (e) => {
    if (likes.has(slug)) { likes.delete(slug); toast("已取消点赞", "warn"); }
    else {
      likes.add(slug); toast("点赞收到。奈绪假装镇定 ✦");
      const r = e.currentTarget.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, "heart");
    }
    store.set("tf_likes", [...likes]);
    $("#likeBtn").classList.toggle("liked", likes.has(slug));
    $("#likeCount").textContent = likesOf(p);
  });

  // 分享
  $("#shareBtn").addEventListener("click", async () => {
    const url = location.href;
    try { await navigator.clipboard.writeText(url); toast("链接已复制到剪贴板"); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("链接已复制到剪贴板"); } catch { toast("复制失败，请手动复制地址栏", "err"); }
      ta.remove();
    }
  });

  renderComments(slug);
  $("#commentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("#cfText").value.trim();
    if (!text) { toast("评论内容不能为空", "warn"); $("#cfText").focus(); return; }
    const name = $("#cfName").value.trim() || "匿名风暴";
    const data = allComments();
    (data[slug] = data[slug] || []).unshift({
      id: slug + "-" + Date.now(), mine: true, name, text,
      date: new Date().toISOString().slice(0, 10),
    });
    store.set("tf_comments", data);
    $("#cfText").value = "";
    renderComments(slug);
    toast("评论发布成功");
  });
}

function avatarHue(name) { let h = 0; for (const c of name) h = (h * 31 + c.codePointAt(0)) % 360; return h; }

function renderComments(slug) {
  const list = commentsOf(slug);
  $("#commentCount").textContent = `${list.length} 条`;
  $("#commentList").innerHTML = list.length ? list.map((c) => `
    <div class="comment" data-id="${esc(c.id)}">
      <div class="comment-avatar" style="--ah:${avatarHue(c.name)}">${esc([...c.name][0].toUpperCase())}</div>
      <div class="comment-body">
        <div class="comment-head">
          <span class="comment-name">${esc(c.name)}</span>
          <span class="comment-date">${esc(c.date)}</span>
          ${c.mine ? '<button class="comment-del" data-del="' + esc(c.id) + '">删除</button>' : ""}
        </div>
        <p class="comment-text">${esc(c.text)}</p>
      </div>
    </div>`).join("") : '<div class="no-comment">还没有评论，来抢沙发 →</div>';

  $$("#commentList [data-del]").forEach((btn) => btn.addEventListener("click", () => {
    const data = allComments();
    data[slug] = (data[slug] || []).filter((c) => c.id !== btn.dataset.del);
    store.set("tf_comments", data);
    renderComments(slug);
    toast("评论已删除", "warn");
  }));
}

/* ---------------- 归档页 ---------------- */
function renderArchive() {
  if (!POSTS.length) {
    view.innerHTML = `<div class="page-head wrap"><h1>归档</h1><p>时间线空空如也，等第一篇文章落下 ✦</p></div>
    <div class="wrap" style="padding-bottom:40px">${emptyState("归档还没有内容", "写下的第一篇，会在这里生根发芽")}</div>`;
    return;
  }
  const byYear = {};
  [...POSTS].sort((a, b) => b.date.localeCompare(a.date)).forEach((p) => {
    const y = p.date.slice(0, 4);
    (byYear[y] = byYear[y] || []).push(p);
  });
  view.innerHTML = `
  <div class="page-head wrap"><h1>归档</h1><p>${POSTS.length} 篇文章，${Object.keys(byYear).length} 个年份，一条时间线。</p></div>
  <div class="wrap" style="padding-bottom:40px">
    ${Object.entries(byYear).map(([y, list]) => `
      <div class="archive-year reveal">${y}<span style="font-size:.85rem;color:var(--faint)"> · ${list.length} 篇</span></div>
      <div class="timeline reveal">
        ${list.map((p) => `<div class="tl-item">
          <span class="tl-date">${p.date.slice(5).replace("-", ".")}</span>
          <a class="tl-title" href="#/post/${p.slug}">${esc(p.title)}</a>
          <span class="tl-tags">${p.tags.map(tagHTML).join("")}</span>
        </div>`).join("")}
      </div>`).join("")}
  </div>`;
}

/* ---------------- 标签页 ---------------- */
function renderTags() {
  if (!POSTS.length) {
    view.innerHTML = `<div class="page-head wrap"><h1>标签</h1><p>标签云还在等第一阵风 ✦</p></div>
    <div class="wrap" style="padding-bottom:40px">${emptyState("还没有标签", "文章发布后，标签会像星星一样亮起来")}</div>`;
    return;
  }
  const count = {};
  POSTS.forEach((p) => p.tags.forEach((t) => { count[t] = (count[t] || 0) + 1; }));
  const tags = Object.entries(count).sort((a, b) => b[1] - a[1]);
  view.innerHTML = `
  <div class="page-head wrap"><h1>标签</h1><p>${tags.length} 个标签，点击任意标签查看对应文章。</p></div>
  <div class="wrap" style="padding-bottom:40px">
    <div class="tags-cloud reveal">
      ${tags.map(([t, n]) => `<a class="tag-pill" style="--th:${TAG_HUE[t] ?? 190};font-size:${0.88 + n * 0.08}rem" href="#/tag/${encodeURIComponent(t)}">${esc(t)} <b>×${n}</b></a>`).join("")}
    </div>
    ${tags.map(([t]) => {
      const list = POSTS.filter((p) => p.tags.includes(t));
      return `<div class="tag-section-title reveal" id="tag-${esc(t)}">${tagHTML(t)}<span>${esc(t)}</span><span class="section-sub">${list.length} 篇</span></div>
      <div class="post-grid">${list.map((p) => cardHTML(p, false)).join("")}</div>`;
    }).join("")}
  </div>`;
}

/* ---------------- 关于页 ---------------- */
/* ---------------- GitHub 实时数据 ---------------- */
const GH_USER = "taifeng1230";
const GH_TTL = 6 * 3600 * 1000;
// Wand-Enhancer 已被 GitHub 下架（HTTP 451），作者要求站内不再展示
const GH_HIDDEN = ["Wand-Enhancer"];
const ghVisibleRepos = (data) => (data.repos || []).filter((r) => !GH_HIDDEN.includes(r.name));
const LANG_COLOR = { JavaScript: "#f2b632", TypeScript: "#339af0", Java: "#e8590c", Python: "#37b24d", Vue: "#41b883", HTML: "#e03131", CSS: "#7048e8", Shell: "#2f9e44", "C++": "#d6336c", C: "#556070", Go: "#228be6", Rust: "#a61e2e" };
const ghSkeleton = () => `<div class="gh-skeleton"><span class="sk-avatar"></span><div class="sk-lines"><i></i><i></i><i></i></div></div><div class="gh-skeleton sk-grid"><i></i><i></i><i></i></div>`;

async function ghFetch(path) {
  const r = await fetch("https://api.github.com/" + path, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error("github " + r.status);
  return r.json();
}

async function loadGitHub() {
  const box = $("#ghPanel");
  if (!box) return;
  const cached = store.get("tf_gh", null);
  if (cached && cached.v === 2 && Date.now() - cached.ts < GH_TTL) { renderGitHub(cached, false); return; }
  try {
    const [user, repos, ev1, ev2, ev3] = await Promise.all([
      ghFetch("users/" + GH_USER),
      ghFetch("users/" + GH_USER + "/repos?sort=updated&per_page=6"),
      ghFetch("users/" + GH_USER + "/events/public?per_page=100&page=1"),
      ghFetch("users/" + GH_USER + "/events/public?per_page=100&page=2"),
      ghFetch("users/" + GH_USER + "/events/public?per_page=100&page=3"),
    ]);
    const data = {
      ts: Date.now(),
      v: 2,
      user: { login: user.login, name: user.name, bio: user.bio, avatar_url: user.avatar_url, html_url: user.html_url, public_repos: user.public_repos, followers: user.followers, following: user.following, created_at: user.created_at },
      repos: repos.filter((r) => !GH_HIDDEN.includes(r.name)).map((r) => ({ name: r.name, description: r.description, language: r.language, stargazers_count: r.stargazers_count, forks_count: r.forks_count, updated_at: r.updated_at, html_url: r.html_url, private: r.private })),
      events: [...ev1, ...ev2, ...ev3].map((e) => ({ created_at: e.created_at, type: e.type })),
    };
    store.set("tf_gh", data);
    if ($("#ghPanel")) renderGitHub(data, false);
  } catch {
    if (!$("#ghPanel")) return;
    if (cached) renderGitHub(cached, true);
    else renderGhError();
  }
}

function renderGhError() {
  $("#ghMeta").textContent = "离线";
  $("#ghPanel").innerHTML = `<div class="gh-error">
    <p class="empty-title">GitHub 连接失败</p>
    <p class="empty-sub">当前离线，或公开 API 限流（60 次/小时/IP）。</p>
    <button class="btn btn-ghost" id="ghRetry">重试连接</button>
  </div>`;
  $("#ghRetry").addEventListener("click", () => {
    $("#ghMeta").textContent = "连接中…";
    $("#ghPanel").innerHTML = ghSkeleton();
    loadGitHub();
  });
}

function renderGitHub(data, stale) {
  const u = data.user;
  const repos = ghVisibleRepos(data);
  $("#ghMeta").textContent = (stale ? "缓存 · " : "实时 · ") + new Date(data.ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) + " 更新";
  const days = {}; let total = 0;
  (data.events || []).forEach((e) => { const d = e.created_at.slice(0, 10); days[d] = (days[d] || 0) + 1; total++; });
  const cells = [];
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const dt = new Date(today); dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    const n = days[key] || 0;
    const lvl = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4;
    cells.push(`<span class="hm-cell${lvl ? " l" + lvl : ""}" title="${key} · ${n} 次公开活动"></span>`);
  }
  const repoCard = (r) => `<a class="repo-card" href="${r.html_url}" target="_blank" rel="noopener">
    <div class="repo-top"><b>${esc(r.name)}</b><span class="repo-vis">${r.private ? "私有" : "公开"}</span></div>
    <p>${esc(r.description || "暂无描述")}</p>
    <div class="repo-meta">
      <span class="repo-lang"><i style="background:${LANG_COLOR[r.language] || "var(--line-strong)"}"></i>${esc(r.language || "未标注")}</span>
      <span>★ ${r.stargazers_count}</span><span>Fork ${r.forks_count}</span><span>${r.updated_at.slice(0, 10).replace(/-/g, ".")}</span>
    </div>
  </a>`;
  $("#ghPanel").innerHTML = `
    <div class="gh-profile">
      <span class="gh-avatar"><img src="${u.avatar_url}" alt="${esc(u.login)} 的 GitHub 头像" onerror="this.remove()"></span>
      <div class="gh-id">
        <b>${esc(u.name || u.login)}</b><a href="${u.html_url}" target="_blank" rel="noopener">@${esc(u.login)}</a>
        <p>${esc(u.bio || "这个 GitHub 账号还没写简介 ✦ 先看仓库吧。")}</p>
        <div class="gh-chips">
          <span><b>${repos.length}</b>公开仓库</span>
          <span><b>${u.followers}</b>关注者</span>
          <span><b>${u.following}</b>关注中</span>
          <span><b>${u.created_at.slice(0, 7).replace("-", ".")}</b>加入</span>
        </div>
      </div>
      ${stale ? '<span class="gh-stale">缓存数据</span>' : ""}
    </div>
    <div class="gh-repos">${repos.length ? repos.map(repoCard).join("") : '<div class="no-comment">暂时没有可展示的公开仓库 ✦</div>'}</div>
    <div class="gh-heat">
      <div class="heatmap">${cells.join("")}</div>
      <div class="hm-legend">少 <span class="hm-cell"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> 多</div>
      <p class="gh-note">近 90 天 ${total} 次公开事件（Push / Star / Issue 等）· 数据来自 GitHub 公开 API</p>
    </div>`;
}

function renderAbout() {
  view.innerHTML = `
  <div class="page-head wrap"><h1>关于我</h1><p>看板娘友利奈绪，和一台永远在折腾的服务器。</p></div>
  <div class="wrap" style="padding-bottom:40px">
    <div class="about-hero reveal">
      <div class="about-mascot">
        <span class="mascot-bubble">别误会，只是在拍素材 (¬‿¬)</span>
        <img src="assets/mascot.png" alt="看板娘友利奈绪：银白双马尾、蓝眼、星之森学园制服，举着摄像机与欢迎光临牌的二次元女孩">
      </div>
      <div class="about-bio">
        <h2>台风 <i>@taifeng1230</i></h2>
        <p>计算机专业在读，全栈方向。白天学 Spring Boot 和 Vue，晚上维护一台 modded Minecraft 服务器；对网络穿透、性能优化和一切"把它跑起来"的工程问题充满热情。相信<b style="color:var(--ink)">最好的学习方式是把踩过的坑写成文章</b>——这个博客就是证据。看板娘友利奈绪负责把这一切拍下来 ✦</p>
        <div class="about-links">
          <a class="btn btn-primary" href="#/archive">浏览全部文章 ${ICONS.arrow}</a>
          <a class="btn btn-ghost" href="https://github.com/taifeng1230" target="_blank" rel="noopener">${ICONS.code}GitHub</a>
          <button class="btn btn-ghost" id="rssBtn">${ICONS.spark}订阅更新</button>
        </div>
      </div>
    </div>
    <div class="about-grid">
      <div class="panel reveal">
        <h3>技能雷达</h3>
        <div class="skill-empty">
          <svg class="radar-ghost" viewBox="0 0 220 190" aria-hidden="true">
            <g fill="none" stroke="var(--line-strong)" stroke-dasharray="4 5">
              <polygon points="110,17 177.5,56 177.5,134 110,173 42.5,134 42.5,56"/>
              <polygon points="110,39 158.5,67 158.5,123 110,151 61.5,123 61.5,67" opacity=".75"/>
              <polygon points="110,61 139.4,78 139.4,112 110,129 80.6,112 80.6,78" opacity=".5"/>
            </g>
            <g stroke="var(--line)" opacity=".9">
              <path d="M110 95L110 17M110 95L177.5 56M110 95L177.5 134M110 95L110 173M110 95L42.5 134M110 95L42.5 56"/>
            </g>
            <g fill="var(--faint)" font-size="11" font-family="var(--mono)" text-anchor="middle">
              <text x="110" y="12">?</text><text x="190" y="52">?</text><text x="190" y="142">?</text>
              <text x="110" y="187">?</text><text x="30" y="142">?</text><text x="30" y="52">?</text>
            </g>
            <path class="radar-core" d="M110 87l2.2 5.8 5.8 2.2-5.8 2.2-2.2 5.8-2.2-5.8-5.8-2.2 5.8-2.2z" fill="var(--amber)"/>
          </svg>
          <p class="empty-title">还没有点亮任何技能</p>
          <p class="empty-sub">奈绪：「先把 Hello World 拍扎实，再谈雷达。」✦</p>
          <span class="skill-zero">已点亮 0 / 6 · 学习中</span>
        </div>
      </div>
      <div class="panel reveal">
        <h3>此刻的状态</h3>
        <div class="fact-list">
          <div class="fact"><span class="fact-ico" style="--fh:190">${ICONS.pin}</span><div><b>坐标</b><span>泰州 · 校园网 CGNAT 深处</span></div></div>
          <div class="fact"><span class="fact-ico" style="--fh:25">${ICONS.code}</span><div><b>正在学</b><span>Spring Boot 3 + 微信小程序 · 课程进行中</span></div></div>
          <div class="fact"><span class="fact-ico" style="--fh:130">${ICONS.server}</span><div><b>正在维护</b><span>一台 Forge 模组 MC 服务器（frp 穿透中）</span></div></div>
          <div class="fact"><span class="fact-ico" style="--fh:300">${ICONS.spark}</span><div><b>最近在玩</b><span>CS2 / Valorant，以及给 AI IDE 找活干</span></div></div>
        </div>
      </div>
    </div>
    <div class="panel heatmap-panel reveal">
      <h3>GitHub · 开源与活动 <span class="section-sub" id="ghMeta">连接中…</span></h3>
      <div id="ghPanel">${ghSkeleton()}</div>
    </div>
  </div>`;

  loadGitHub();
  $("#rssBtn").addEventListener("click", openRss);
}

/* ---------------- RSS：真实 feed 生成与订阅面板 ---------------- */
const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function feedBase() {
  return location.protocol === "file:" ? "https://github.com/taifeng1230" : location.origin + location.pathname.replace(/index\.html$/, "");
}
function feedXML() {
  const base = feedBase();
  const items = POSTS.map((p) => `    <item>
      <title>${xmlEsc(p.title)}</title>
      <link>${base}#/post/${p.slug}</link>
      <guid isPermaLink="false">${p.slug}</guid>
      <pubDate>${new Date(p.date + "T08:00:00+08:00").toUTCString()}</pubDate>
      <description>${xmlEsc(p.excerpt)}</description>
    </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>taifeng1230.cn — 白空与星</title>
    <link>${base}</link>
    <description>前端 / 后端 / 网络 / 运维实战笔记 · 看板娘友利奈绪</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}
function openRss() {
  const served = location.protocol !== "file:";
  $("#rssUrl").textContent = served ? feedBase() + "rss.xml" : "（file:// 打开时无订阅地址）";
  $("#rssCopy").style.display = served ? "" : "none";
  $("#rssNote").textContent = served
    ? "把地址粘贴进阅读器的「添加订阅」即可。本地 node serve.cjs 时 feed 实时生成；静态托管（GitHub Pages 等）使用随包部署的 rss.xml，新增文章后运行 node make-feed.cjs 重新生成并部署。"
    : "当前以 file:// 打开：可下载 feed.xml 导入阅读器；双击 start-website.cmd 启动服务后即可获得订阅地址。";
  $("#rssOverlay").hidden = false;
}
function closeRss() { $("#rssOverlay").hidden = true; }
$("#rssClose").addEventListener("click", closeRss);
$("#rssOverlay").addEventListener("click", (e) => { if (e.target === $("#rssOverlay")) closeRss(); });
$("#rssCopy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#rssUrl").textContent); toast("订阅地址已复制 ✦"); }
  catch { toast("复制失败，请手动选择地址", "err"); }
});
$("#rssDownload").addEventListener("click", () => {
  const blob = new Blob([feedXML()], { type: "application/rss+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "feed.xml";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("feed.xml 已下载（含 " + POSTS.length + " 篇文章）");
});
$("#footerRss").addEventListener("click", (e) => { e.preventDefault(); openRss(); });

/* ---------------- 友链页 ---------------- */
const LINK_STATUS = { pending: ["待审核", "st-pending"], approved: ["已通过", "st-approved"], rejected: ["已拒绝", "st-rejected"] };
const linksAll = () => store.get("tf_links", []);
const linksSave = (list) => store.set("tf_links", list);
let linkFilter = "all";
let linkEditing = null;

function friendCard(l) {
  let host = "";
  try { host = new URL(l.url).host; } catch {}
  return `<a class="friend-card" href="${esc(l.url)}" target="_blank" rel="noopener">
    <span class="friend-avatar">${l.avatar ? `<img src="${esc(l.avatar)}" alt="" onerror="this.remove()">` : ""}</span>
    <span class="friend-body">
      <b>${esc(l.name)}</b>
      <p>${esc(l.desc)}</p>
      <span class="friend-host">${esc(host)} ↗</span>
    </span>
    <span class="friend-badge">已交换 ✦</span>
  </a>`;
}

function renderLinks() {
  const all = linksAll();
  const wall = all.filter((l) => l.status === "approved");
  view.innerHTML = `
  <div class="page-head wrap"><h1>友链</h1><p>交换星空的坐标 ✦ 申请、审核、上墙，全流程在本页完成。</p></div>
  <div class="wrap" style="padding-bottom:40px">
    <div class="section-head"><h2 style="font-size:1.3rem">友链墙</h2><span class="section-sub">${wall.length} 位邻居</span></div>
    ${wall.length ? `<div class="links-wall">${wall.map(friendCard).join("")}</div>` : `<div class="post-grid"><div class="empty-state" style="grid-column:1/-1;background:var(--surface);border:2px dashed var(--line-strong);border-radius:var(--radius)"><div class="empty-kaomoji">(・_・;)</div><p class="empty-title">友链墙还空着</p><p class="empty-sub">通过审核的申请会挂在这里 ✦</p></div></div>`}
    <div class="section-head" style="margin-top:44px"><h2 style="font-size:1.3rem">申请友链</h2><span class="section-sub">填表 → 保存申请 → 站长审核上墙</span></div>
    <div class="link-layout">
      <form class="comment-form link-form" id="linkForm" novalidate>
        <h3><span>&gt;_</span> ${linkEditing ? "编辑申请" : "新申请"}</h3>
        <div class="cf-row"><input id="lfName" maxlength="20" placeholder="站点名称 *（≤20 字）" value="${linkEditing ? esc(linkEditing.name) : ""}"></div>
        <div class="cf-row"><input id="lfUrl" maxlength="120" placeholder="站点 URL *（https://…）" value="${linkEditing ? esc(linkEditing.url) : ""}"></div>
        <div class="cf-row"><input id="lfAvatar" maxlength="200" placeholder="头像 URL（可选，留空用星星）" value="${linkEditing ? esc(linkEditing.avatar || "") : ""}"></div>
        <div class="cf-row"><input id="lfDesc" maxlength="40" placeholder="一句话介绍 *（≤40 字）" value="${linkEditing ? esc(linkEditing.desc) : ""}"></div>
        <div class="cf-row"><input id="lfEmail" maxlength="60" placeholder="联系邮箱（可选，仅站长可见）" value="${linkEditing ? esc(linkEditing.email || "") : ""}"></div>
        <div class="cf-foot">
          <span class="cf-hint">静态站无后端：申请保存在本浏览器；对外交换请复制申请信息发给站长</span>
          ${linkEditing ? '<button type="button" class="btn btn-ghost" id="lfCancel">取消编辑</button>' : ""}
          <button type="submit" class="btn btn-primary">${linkEditing ? "保存修改" : "提交申请"}</button>
        </div>
      </form>
      <div class="link-preview">
        <div class="toc-title">实时预览</div>
        <div id="lfPreview"></div>
        <p class="cf-hint" style="margin-top:12px">审核操作仅在本浏览器生效（静态演示）；真实交换请把申请信息发给 GitHub @taifeng1230。</p>
      </div>
    </div>
    <div class="section-head" style="margin-top:44px"><h2 style="font-size:1.3rem">申请管理</h2><span class="section-sub" id="appCount"></span></div>
    <div class="filter-bar" id="linkFilterBar">
      ${[["all", "全部"], ["pending", "待审核"], ["approved", "已通过"], ["rejected", "已拒绝"]].map(([k, label]) => `<button class="chip${linkFilter === k ? " active" : ""}" data-f="${k}">${label} ${k === "all" ? all.length : all.filter((l) => l.status === k).length}</button>`).join("")}
    </div>
    <div id="appList"></div>
  </div>`;

  const preview = () => {
    const l = {
      name: $("#lfName").value.trim() || "你的站点",
      url: $("#lfUrl").value.trim() || "https://example.com",
      avatar: $("#lfAvatar").value.trim(),
      desc: $("#lfDesc").value.trim() || "一句话介绍会显示在这里",
    };
    $("#lfPreview").innerHTML = friendCard(l);
  };
  ["lfName", "lfUrl", "lfAvatar", "lfDesc"].forEach((id) => $("#" + id).addEventListener("input", preview));
  preview();

  $("#linkForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#lfName").value.trim(), url = $("#lfUrl").value.trim(), desc = $("#lfDesc").value.trim();
    const avatar = $("#lfAvatar").value.trim(), email = $("#lfEmail").value.trim();
    $$(".link-form input").forEach((i) => i.classList.remove("invalid"));
    if (!name) { $("#lfName").classList.add("invalid"); toast("站点名称不能为空", "warn"); return; }
    if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(url)) { $("#lfUrl").classList.add("invalid"); toast("URL 需以 http(s):// 开头且含域名", "warn"); return; }
    if (!desc) { $("#lfDesc").classList.add("invalid"); toast("一句话介绍不能为空", "warn"); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $("#lfEmail").classList.add("invalid"); toast("邮箱格式不对", "warn"); return; }
    const list = linksAll();
    if (linkEditing) {
      const it = list.find((x) => x.id === linkEditing.id);
      if (it) Object.assign(it, { name, url, avatar, desc, email });
      toast("申请已更新 ✦");
    } else {
      list.unshift({ id: "lk-" + Date.now(), name, url, avatar, desc, email, status: "pending", ts: Date.now() });
      toast("申请已提交，等待审核 ✦");
    }
    linksSave(list);
    linkEditing = null;
    renderLinks();
  });
  const cancel = $("#lfCancel");
  if (cancel) cancel.addEventListener("click", () => { linkEditing = null; renderLinks(); });

  $("#linkFilterBar").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    linkFilter = c.dataset.f;
    renderLinks();
  });
  renderAppList();
}

function renderAppList() {
  const all = linksAll();
  const list = all.filter((l) => linkFilter === "all" || l.status === linkFilter).sort((a, b) => b.ts - a.ts);
  $("#appCount").textContent = `${list.length} 条申请`;
  $("#appList").innerHTML = list.length ? list.map((l) => {
    const [label, cls] = LINK_STATUS[l.status];
    let host = ""; try { host = new URL(l.url).host; } catch {}
    return `<div class="app-row" data-id="${l.id}">
      <span class="friend-avatar sm">${l.avatar ? `<img src="${esc(l.avatar)}" alt="" onerror="this.remove()">` : ""}</span>
      <div class="app-body">
        <div class="app-top"><b>${esc(l.name)}</b><span class="status-chip ${cls}">${label}</span><span class="comment-date">${new Date(l.ts).toLocaleDateString("zh-CN")}</span></div>
        <p>${esc(l.desc)} · <span class="friend-host">${esc(host)}</span></p>
      </div>
      <div class="app-actions">
        ${l.status === "pending" ? `<button class="btn btn-ghost sm" data-act="approve">通过</button><button class="btn btn-ghost sm" data-act="reject">拒绝</button>` : ""}
        ${l.status === "approved" ? `<button class="btn btn-ghost sm" data-act="unapprove">撤下</button>` : ""}
        ${l.status === "rejected" ? `<button class="btn btn-ghost sm" data-act="resubmit">重新提交</button>` : ""}
        <button class="btn btn-ghost sm" data-act="copy">复制申请</button>
        <button class="btn btn-ghost sm" data-act="edit">编辑</button>
        <button class="btn btn-ghost sm danger" data-act="del">删除</button>
      </div>
    </div>`;
  }).join("") : '<div class="no-comment">还没有申请 ✦ 填上面的表格做第一个吧</div>';

  $$("#appList [data-act]").forEach((btn) => btn.addEventListener("click", () => {
    const id = btn.closest(".app-row").dataset.id;
    const list = linksAll();
    const it = list.find((x) => x.id === id);
    if (!it) return;
    const act = btn.dataset.act;
    if (act === "copy") {
      const text = `【友链申请】\n站点：${it.name}\n地址：${it.url}\n头像：${it.avatar || "（无）"}\n介绍：${it.desc}\n邮箱：${it.email || "（无）"}\n—— 来自 taifeng1230.cn 友链页`;
      navigator.clipboard.writeText(text).then(() => toast("申请信息已复制，发给站长即可 ✦")).catch(() => toast("复制失败", "err"));
      return;
    }
    if (act === "edit") { linkEditing = it; renderLinks(); window.scrollTo({ top: $("#linkForm").getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" }); return; }
    if (act === "del") {
      const idx = list.indexOf(it);
      list.splice(idx, 1);
      linksSave(list);
      renderLinks();
      toast("申请已删除", "warn", { label: "撤销", fn: () => { const l2 = linksAll(); l2.splice(Math.min(idx, l2.length), 0, it); linksSave(l2); renderLinks(); toast("已恢复 ✦"); } });
      return;
    }
    it.status = act === "approve" ? "approved" : act === "reject" ? "rejected" : act === "unapprove" ? "pending" : "pending";
    linksSave(list);
    renderLinks();
    toast(act === "approve" ? "已通过，友链上墙 ✦" : act === "reject" ? "已拒绝" : act === "unapprove" ? "已从友链墙撤下" : "已重新提交审核");
  }));
}

/* ---------------- 代码复制（事件委托） ---------------- */
view.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const code = btn.dataset.code;
  let ok = false;
  try { await navigator.clipboard.writeText(code); ok = true; }
  catch {
    const ta = document.createElement("textarea");
    ta.value = code; document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
  }
  if (ok) {
    btn.classList.add("ok");
    btn.innerHTML = ICONS.check + "<span>已复制</span>";
    toast("代码已复制");
    setTimeout(() => { btn.classList.remove("ok"); btn.innerHTML = ICONS.copy + "<span>复制</span>"; }, 1800);
  } else toast("复制失败，请手动选择复制", "err");
});

/* ---------------- 搜索 ---------------- */
const overlay = $("#searchOverlay"), searchInput = $("#searchInput"), resultsEl = $("#searchResults");
let searchIdx = 0, searchHits = [];

function openSearch() {
  overlay.hidden = false;
  searchInput.value = "";
  doSearch("");
  setTimeout(() => searchInput.focus(), 30);
}
function closeSearch() { overlay.hidden = true; }

function markText(text, q) {
  if (!q) return esc(text);
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
}

function doSearch(q) {
  q = q.trim();
  if (!POSTS.length) {
    searchHits = [];
    searchIdx = 0;
    resultsEl.innerHTML = `<div class="search-empty">博客还没有文章哦 ✦<br><span style="font-size:.8rem">等奈绪更新吧～ (・_・;)</span></div>`;
    return;
  }
  if (!q) {
    searchHits = [...POSTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  } else {
    const lq = q.toLowerCase();
    searchHits = POSTS.map((p) => {
      let score = 0;
      if (p.title.toLowerCase().includes(lq)) score += 10;
      if (p.tags.some((t) => t.toLowerCase().includes(lq))) score += 6;
      if (p.excerpt.toLowerCase().includes(lq)) score += 3;
      if (p.body.toLowerCase().includes(lq)) score += 1;
      return { p, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map((x) => x.p);
  }
  searchIdx = 0;
  resultsEl.innerHTML = searchHits.length
    ? searchHits.map((p, i) => `<button class="search-item${i === 0 ? " active" : ""}" data-i="${i}">
        <span class="si-title">${markText(p.title, q)}</span>
        <span class="si-excerpt">${markText(p.excerpt, q)}</span>
        <span class="si-tags">${p.tags.map(tagHTML).join("")}</span>
      </button>`).join("")
    : `<div class="search-empty">没有找到与「${esc(q)}」相关的文章<br><span style="font-size:.8rem">试试：frp / 登录 / 性能 / git</span></div>`;
}

function gotoHit(i) {
  const p = searchHits[i];
  if (!p) return;
  closeSearch();
  location.hash = "#/post/" + p.slug;
}

searchInput.addEventListener("input", () => doSearch(searchInput.value));
resultsEl.addEventListener("click", (e) => {
  const item = e.target.closest(".search-item");
  if (item) gotoHit(+item.dataset.i);
});
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSearch(); });

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); overlay.hidden ? openSearch() : closeSearch(); return; }
  if (e.key === "Escape" && !$("#rssOverlay").hidden) { closeRss(); return; }
  if (overlay.hidden) return;
  if (e.key === "Escape") closeSearch();
  else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!searchHits.length) return;
    searchIdx = (searchIdx + (e.key === "ArrowDown" ? 1 : -1) + searchHits.length) % searchHits.length;
    $$(".search-item", resultsEl).forEach((el, i) => el.classList.toggle("active", i === searchIdx));
    const act = $(".search-item.active", resultsEl);
    if (act) act.scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") { e.preventDefault(); gotoHit(searchIdx); }
});
$("#searchTrigger").addEventListener("click", openSearch);

/* ---------------- 主题 ---------------- */
const themeBtn = $("#themeToggle");
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.innerHTML = t === "dark" ? ICONS.sun : ICONS.moon;
  themeBtn.setAttribute("aria-label", t === "dark" ? "切换到白昼模式" : "切换到星空模式");
  store.set("tf_theme", t);
}
const urlTheme = new URLSearchParams(location.search).get("theme");
applyTheme(urlTheme === "light" || urlTheme === "dark" ? urlTheme : store.get("tf_theme", "light"));
requestAnimationFrame(() => document.documentElement.classList.add("theme-anim"));
themeBtn.addEventListener("click", (e) => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const doIt = () => {
    applyTheme(next);
    toast(next === "dark" ? "星空模式：星星会记得一切 ✦" : "白昼模式：今天的天空是白色的 ✦");
  };
  if (document.startViewTransition && !reduceMotion) {
    const x = e.clientX || innerWidth - 40, y = e.clientY || 40;
    const vt = document.startViewTransition(doIt);
    vt.ready.then(() => {
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(.3,.7,.3,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  } else doIt();
});

/* ---------------- 移动端菜单 ---------------- */
$("#menuBtn").addEventListener("click", () => {
  const links = $("#navLinks");
  const open = links.classList.toggle("open");
  $("#menuBtn").setAttribute("aria-expanded", String(open));
});

/* ---------------- 滚动 UI ---------------- */
const progressBar = $("#progressBar"), backTop = $("#backTop"), nav = $("#nav");
function updateScrollUI() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  nav.classList.toggle("scrolled", y > 10);
  backTop.classList.toggle("show", y > 500);
}
window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI);
backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------------- 页脚 ---------------- */
$("#footerHot").innerHTML = POSTS.length
  ? [...POSTS].sort((a, b) => viewsOf(b) - viewsOf(a)).slice(0, 3)
    .map((p) => `<a href="#/post/${p.slug}">${esc(p.title.length > 18 ? p.title.slice(0, 18) + "…" : p.title)}</a>`).join("")
  : '<span class="footer-empty">暂无文章 ✿</span>';
function windTick() { $("#footerWind").textContent = `星空指数：晴 ✦ 风速 ${(20 + Math.random() * 70).toFixed(0)} km/h`; }
windTick();
setInterval(windTick, 5000);

/* ---------------- 启动 ---------------- */
window.addEventListener("hashchange", router);
router();
})();