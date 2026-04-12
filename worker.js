export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // KV GUARD
    // ======================
    if (!env.GRID) {
      return Response.json(
        { error: "GRID KV NOT BOUND" },
        { status: 500 }
      );
    }

    // ======================
    // HELPERS
    // ======================
    const getFeed = async () => {
      try {
        const raw = await env.GRID.get("feed");
        const data = raw ? JSON.parse(raw) : [];

        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.log("GET ERROR:", e);
        return [];
      }
    };

    const saveFeed = async (feed) => {
      try {
        await env.GRID.put(
          "feed",
          JSON.stringify(feed.slice(0, 200))
        );
      } catch (e) {
        console.log("SAVE ERROR:", e);
      }
    };

    const sortFeed = (feed) => {
      return feed.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
    };

    // ======================
    // API: FEED
    // ======================
    if (url.pathname === "/api/feed") {
      const feed = await getFeed();

      return Response.json({
        ok: true,
        data: sortFeed(feed)
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

        text: body.text || "",
        image: body.image || "",
        link: body.link || "",

        order: feed.length
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

      feed = feed.map((p) => {
        if (p.id !== body.id) return p;

        return {
          ...p,
          text: body.text ?? p.text,
          image: body.image ?? p.image,
          link: body.link ?? p.link,
          order: body.order ?? p.order
        };
      });

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
    // BULK REORDER (drag & drop)
    // ======================
    if (url.pathname === "/api/reorder") {
      const body = await req.json();
      // body = [{id, order}]

      let feed = await getFeed();

      const map = new Map(
        body.map((p) => [p.id, p.order])
      );

      feed = feed.map((p) => ({
        ...p,
        order: map.get(p.id) ?? p.order
      }));

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    // ======================
    // ADMIN ROUTE
    // ======================
    if (url.pathname === "/admin") {
      return env.ASSETS.fetch(
        new Request(
          new URL("/admin.html", req.url),
          req
        )
      );
    }

    // ======================
    // STATIC
    // ======================
    return env.ASSETS.fetch(req);
  }
};
