export default {
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname !== "/og") {
      return new Response("Not found", { status: 404 });
    }

    try {
      const feed = await fetch(url.origin + "/api/feed").then(r => r.json());
      const last = feed.data?.[0];

      const title = "IndexMod";
      const text = escapeHtml((last?.text || "").split("\n")[0].slice(0, 160));
      const image = last?.image || "";

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>

<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${text}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url.origin}/og">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${text}">
<meta name="twitter:image" content="${image}">
</head>
<body></body>
</html>`;

      return new Response(html, {
        headers: { "content-type": "text/html;charset=UTF-8" }
      });

    } catch (e) {
      return new Response("OG error", { status: 500 });
    }
  }
};

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]));
}
