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
    const safeParse = (raw) => {
      try {
        const data = raw ? JSON.parse(raw) : [];
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    const getFeed = async () => {
      try {
        const raw = await env.GRID.get("feed");
        return safeParse(raw);
      } catch (e) {
        console.log("GET ERROR:", e);
        return [];
      }
    };

    const saveFeed = async (feed) => {
      try {
        const clean = feed
          .filter(Boolean)
          .slice(0, 200);

        await env.GRID.put("feed", JSON.stringify(clean));
      } catch (e) {
        console.log("SAVE ERROR:", e);
      }
    };

    const normalize = (feed) =>
      feed.map((p, i) => ({
        id: p.id ?? Date.now() + i,
        text: p.text ?? "",
        image: p.image ?? "",
        link: p.link ?? "",
        order: Number.isFinite(p.order) ? p.order : i
      }));

    const sortByOrder = (feed) =>
      [...feed].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // ======================
    // FEED
    // ======================
    if (url.pathname === "/api/feed") {
      const feed = await getFeed();

      const prepared = sortByOrder(normalize(feed));

      return Response.json({
        ok: true,
        data: prepared
      });
    }

    // ======================
    // CREATE
    // ======================
    if (url.pathname === "/api/paste") {
      const body = await req.json().catch(() => ({}));
      const feed = await getFeed();

      const post = {
        id: Date.now(),

        text: body.text || "",
        image: body.image || "",
        link: body.link || "",

        order: 0
      };

      // shift existing
      const updated = feed.map((p) => ({
        ...p,
        order: (p.order ?? 0) + 1
      }));

      updated.unshift(post);

      await saveFeed(updated);

      return Response.json({
        ok: true,
        post
      });
    }

    // ======================
    // UPDATE
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json().catch(() => ({}));
      const feed = await getFeed();

      const updated = feed.map((p) => {
        if (p.id !== body.id) return p;

        return {
          ...p,
          text: body.text ?? p.text,
          image: body.image ?? p.image,
          link: body.link ?? p.link,
          order: body.order ?? p.order
        };
      });

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // DELETE
    // ======================
    if (url.pathname === "/api/delete") {
      const body = await req.json().catch(() => ({}));
      const feed = await getFeed();

      const updated = feed.filter((p) => p.id !== body.id);

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // REORDER
    // ======================
    if (url.pathname === "/api/reorder") {
      const body = await req.json().catch(() => []);
      let feed = await getFeed();

      if (!Array.isArray(body)) {
        return Response.json({ ok: false, error: "bad payload" }, { status: 400 });
      }

      const orderMap = new Map(
        body.map((p) => [p.id, p.order])
      );

      const updated = feed.map((p) => ({
        ...p,
        order: orderMap.has(p.id)
          ? orderMap.get(p.id)
          : p.order
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
