export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // DB GUARD
    // ======================
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: "DB NOT BOUND" }),
        {
          status: 500,
          headers: { "content-type": "application/json" }
        }
      );
    }

    // ======================
    // DB LAYER
    // ======================
    const getFeed = async () => {
      try {
        const raw = await env.DB.get("feed");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    };

    const saveFeed = async (feed) => {
      try {
        await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));
      } catch (e) {
        console.log("DB ERROR:", e);
      }
    };

    // ======================
    // API: FEED
    // ======================
    if (url.pathname === "/api/feed") {
      return Response.json({
        ok: true,
        data: await getFeed()
      });
    }

    // ======================
    // API: ADD
    // ======================
    if (url.pathname === "/api/paste") {
      const body = await req.json();
      const feed = await getFeed();

      const post = {
        id: Date.now(),
        image: body.image || "",
        text: body.text || ""
      };

      feed.unshift(post);
      await saveFeed(feed);

      return Response.json({ ok: true, post });
    }

    // ======================
    // API: UPDATE
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json();
      let feed = await getFeed();

      feed = feed.map(p =>
        p.id === body.id ? { ...p, text: body.text } : p
      );

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    // ======================
    // API: DELETE
    // ======================
    if (url.pathname === "/api/delete") {
      const body = await req.json();
      let feed = await getFeed();

      feed = feed.filter(p => p.id !== body.id);

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    if (url.pathname === "/admin") {
      return env.ASSETS.fetch(
        new Request(new URL("/admin.html", req.url), req)
      );
    }

    // ======================
    // fallback static files
    // ======================
    return env.ASSETS.fetch(req);
  }
};
