export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // GUARD
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

    const sortByOrder = (feed) =>
      [...feed].sort((a, b) => {
        const ao = a.order ?? 0;
        const bo = b.order ?? 0;
        return ao - bo;
      });

    const normalizeOrder = (feed) =>
      feed.map((p, i) => ({
        ...p,
        order: p.order ?? i
      }));

    // ======================
    // FEED
    // ======================
    if (url.pathname === "/api/feed") {
      const feed = await getFeed();

      return Response.json({
        ok: true,
        data: sortByOrder(normalizeOrder(feed))
      });
    }

    // ======================
    // CREATE
    // ======================
    if (url.pathname === "/api/paste") {
      const body = await req.json();
      const feed = await getFeed();

      const post = {
        id: Date.now(),

        text: body.text || "",
        image: body.image || "",
        link: body.link || "",

        order: 0 // всегда сверху
      };

      // сдвигаем остальные вниз
      const updated = feed.map((p) => ({
        ...p,
        order: (p.order ?? 0) + 1
      }));

      updated.unshift(post);

      await saveFeed(updated);

      return Response.json({ ok: true, post });
    }

    // ======================
    // UPDATE
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json();
      const feed = await getFeed();

      const updated = feed.map((p) =>
        p.id === body.id
          ? {
              ...p,
              text: body.text ?? p.text,
              image: body.image ?? p.image,
              link: body.link ?? p.link
            }
          : p
      );

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // DELETE
    // ======================
    if (url.pathname === "/api/delete") {
      const body = await req.json();
      const feed = await getFeed();

      const updated = feed.filter((p) => p.id !== body.id);

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // REORDER (drag & drop)
    // ======================
    if (url.pathname === "/api/reorder") {
      const body = await req.json();
      let feed = await getFeed();

      const orderMap = new Map(
        body.map((p) => [p.id, p.order])
      );

      const updated = feed.map((p) => ({
        ...p,
        order: orderMap.get(p.id) ?? p.order
      }));

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // ADMIN
    // ======================
    if (url.pathname === "/admin") {
      return env.ASSETS.fetch(
        new Request(new URL("/admin.html", req.url), req)
      );
    }

    // ======================
    // STATIC
    // ======================
    return env.ASSETS.fetch(req);
  }
};
