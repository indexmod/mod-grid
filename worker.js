export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // KV GUARD
    // ======================
    if (!env.GRID) {
      return new Response(
        JSON.stringify({ error: "GRID KV NOT BOUND" }),
        {
          status: 500,
          headers: { "content-type": "application/json" }
        }
      );
    }

    // ======================
    // KV LAYER
    // ======================
    const getFeed = async () => {
      try {
        const raw = await env.GRID.get("feed");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.log("GET ERROR:", e);
        return [];
      }
    };

    const saveFeed = async (feed) => {
      try {
        await env.GRID.put("feed", JSON.stringify(feed.slice(0, 200)));
      } catch (e) {
        console.log("SAVE ERROR:", e);
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
    // API: CREATE POST
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

      return Response.json({
        ok: true,
        post
      });
    }

    // ======================
    // API: UPDATE POST
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json();
      let feed = await getFeed();

      feed = feed.map((p) =>
        p.id === body.id
          ? { ...p, text: body.text }
          : p
      );

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    // ======================
    // API: DELETE POST
    // ======================
    if (url.pathname === "/api/delete") {
      const body = await req.json();
      let feed = await getFeed();

      feed = feed.filter((p) => p.id !== body.id);

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    // ======================
    // ADMIN ROUTE
    // ======================
    if (url.pathname === "/admin") {
      return env.ASSETS.fetch(
        new Request(new URL("/admin.html", req.url), req)
      );
    }

    // ======================
    // STATIC FILES
    // ======================
    return env.ASSETS.fetch(req);
  }
};
