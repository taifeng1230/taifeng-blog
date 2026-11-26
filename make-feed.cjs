const fs = require("fs"), path = require("path");
const win = {};
new Function("window", fs.readFileSync(path.join(__dirname, "js/posts.js"), "utf8"))(win);
const posts = win.POSTS || [];
const base = (process.argv[2] || "https://taifeng1230.cn/").replace(/\/?$/, "/");
const xe = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const items = posts.map((x) => `    <item>
      <title>${xe(x.title)}</title>
      <link>${base}#/post/${x.slug}</link>
      <guid isPermaLink="false">${x.slug}</guid>
      <pubDate>${new Date(x.date + "T08:00:00+08:00").toUTCString()}</pubDate>
      <description>${xe(x.excerpt)}</description>
    </item>`).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>台风.dev — 白空与星</title>
    <link>${base}</link>
    <description>前端 / 后端 / 网络 / 运维实战笔记 · 看板娘友利奈绪</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(__dirname, "rss.xml"), xml);
console.log("rss.xml written:", posts.length, "items, base", base);