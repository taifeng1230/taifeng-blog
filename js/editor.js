/* 写作台：表单 → 实时预览 → 生成 posts.js 片段 / 整份文件 */
(function () {
"use strict";
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const POSTS = window.POSTS || [];

function toast(msg, type) {
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  $("#toastStack").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 2400);
}

/* ---- 主题 ---- */
const SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8"/></svg>';
const MOON = '<svg viewBox="0 0 24 24"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 8.5 8.5 0 1 0 20 13.5z"/></svg>';
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $("#themeToggleStudio").innerHTML = t === "dark" ? SUN : MOON;
  try { localStorage.setItem("tf_theme", JSON.stringify(t)); } catch (e) {}
}
applyTheme(document.documentElement.dataset.theme || "light");
$("#themeToggleStudio").addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

/* ---- 预览用轻量 Markdown 渲染 ---- */
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || "text";
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<div class="code-block"><div class="code-head"><span class="code-dots"><i></i><i></i><i></i></span><span class="code-lang">${esc(lang)}</span></div><pre><code>${esc(buf.join("\n"))}</code></pre></div>`);
      continue;
    }
    const h = line.match(/^(#{2,3})\s+(.*)/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote><p>${inline(buf.join(" "))}</p></blockquote>`);
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*-\s+/, "")); i++; }
      out.push("<ul>" + buf.map((b) => `<li>${inline(b)}</li>`).join("") + "</ul>");
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      out.push("<ol>" + buf.map((b) => `<li>${inline(b)}</li>`).join("") + "</ol>");
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{2,3}\s|```|>|\s*-\s|\s*\d+\.\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

/* ---- 初始值 ---- */
$("#existingCount").textContent = POSTS.length;
$("#eDate").value = new Date().toISOString().slice(0, 10);

const allTags = [...new Set(POSTS.flatMap((p) => p.tags || []))];
const quick = $("#quickTags");
quick.innerHTML = allTags.length
  ? allTags.map((t) => `<button type="button" class="chip" data-tag="${esc(t)}">${esc(t)}</button>`).join("")
  : '<span class="cf-hint">站内还没有标签，直接在上方输入，用逗号分隔</span>';
quick.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tag]");
  if (!b) return;
  const input = $("#eTags");
  const list = input.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  if (list.includes(b.dataset.tag)) input.value = list.filter((x) => x !== b.dataset.tag).join(", ");
  else input.value = [...list, b.dataset.tag].join(", ");
});

/* ---- slug 自动建议 ---- */
let slugTouched = false;
$("#eSlug").addEventListener("input", () => { slugTouched = true; });
function suggestSlug() {
  const t = $("#eTitle").value.trim();
  let s = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!s) s = "post-" + $("#eDate").value.replace(/-/g, "");
  const taken = new Set(POSTS.map((p) => p.slug));
  let base = s, n = 2;
  while (taken.has(s)) s = base + "-" + n++;
  if (!slugTouched) $("#eSlug").value = s;
}
$("#eTitle").addEventListener("input", suggestSlug);

/* ---- 实时预览与字数 ---- */
let previewTimer;
function updatePreview() {
  const body = $("#eBody").value;
  $("#preview").innerHTML = body.trim() ? mdToHtml(body) : '<p class="no-comment">开始输入标题和正文…</p>';
  const chars = body.replace(/\s/g, "").length;
  $("#charCount").textContent = chars + " 字";
  $("#readTime").textContent = "约 " + Math.max(1, Math.round(chars / 420)) + " 分钟";
}
$("#eBody").addEventListener("input", () => { clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 180); });
updatePreview();

/* ---- 生成 ---- */
function parseTags() {
  return $("#eTags").value.split(/[,，]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
}
function buildPost() {
  return {
    slug: $("#eSlug").value.trim(),
    title: $("#eTitle").value.trim(),
    date: $("#eDate").value,
    tags: parseTags(),
    views: 0,
    likes: 0,
    excerpt: $("#eExcerpt").value.trim() || $("#eBody").value.replace(/[#>*`\-\s]/g, "").slice(0, 60) + "…",
    body: $("#eBody").value.replace(/\r\n/g, "\n"),
  };
}
function validate(p) {
  $$(".studio-form input, .studio-form textarea").forEach((el) => el.classList.remove("invalid"));
  const fail = (sel, msg) => { $(sel).classList.add("invalid"); toast(msg, "warn"); $(sel).focus(); return false; };
  if (!p.title) return fail("#eTitle", "标题不能为空");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) return fail("#eSlug", "slug 只能用小写英文/数字/短横线");
  if (POSTS.some((x) => x.slug === p.slug)) return fail("#eSlug", "slug 与现有文章重复：" + p.slug);
  if (!p.date) return fail("#eDate", "日期不能为空");
  if (!p.body.trim()) return fail("#eBody", "正文不能为空");
  return true;
}
function bodyToTemplate(body) {
  return body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}
function snippetOf(p) {
  const q = (s) => JSON.stringify(s);
  return `{
  slug: ${q(p.slug)},
  title: ${q(p.title)},
  date: ${q(p.date)},
  tags: [${p.tags.map(q).join(", ")}],
  views: ${p.views},
  likes: ${p.likes},
  excerpt: ${q(p.excerpt)},
  body: \`${bodyToTemplate(p.body)}\`
}`;
}

let lastPost = null;
$("#genBtn").addEventListener("click", () => {
  const p = buildPost();
  if (!validate(p)) return;
  lastPost = p;
  $("#snippet").textContent = snippetOf(p);
  $("#outputPanel").hidden = false;
  $("#downloadBtn").disabled = false;
  toast("已生成代码片段 ✦");
});
$("#copySnippet").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#snippet").textContent); toast("片段已复制，粘到 posts.js 即可 ✦"); }
  catch { toast("复制失败，请手动选择复制", "err"); }
});
$("#downloadBtn").addEventListener("click", () => {
  if (!lastPost) return;
  const full = "window.POSTS = " + JSON.stringify([...POSTS, lastPost], null, 2) + ";\nwindow.SEED_COMMENTS = window.SEED_COMMENTS || {};\n";
  const blob = new Blob([full], { type: "text/javascript" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "posts.js";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("posts.js 已下载（替换 js/posts.js 后重新部署）");
});

/* ---- 示例填充 ---- */
function fillDemo() {
  const bt = String.fromCharCode(96);
  const set = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event("input")); };
  set("#eTitle", "Hello World 与我的第一篇博客");
  slugTouched = false;
  $("#eDate").value = new Date().toISOString().slice(0, 10);
  suggestSlug();
  set("#eSlug", "hello-world");
  set("#eTags", "前端, 随笔");
  set("#eBody",
    "## 为什么开始写\n\n这是我写下的**第一篇**，从 " + bt + "console.log" + bt + " 开始。\n\n" +
    bt + bt + bt + "js\nconsole.log(\"hello, world\")\n" + bt + bt + bt + "\n\n" +
    "- 记录踩过的坑\n- 保持持续输出\n\n> 写下来的东西，才是真正学会的。");
  set("#eExcerpt", "第一篇博客：记录开始写作的理由，以及这个博客用的技术栈。");
  updatePreview();
  const el = $("#eBody"); el.focus(); el.setSelectionRange(0, 0);
}
$("#demoBtn").addEventListener("click", () => { fillDemo(); toast("已填充示例，改完点「生成代码」✦"); });

if (new URLSearchParams(location.search).get("demo")) {
  fillDemo();
  setTimeout(() => $("#genBtn").click(), 120);
}
})();