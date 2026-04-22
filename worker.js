export default {
  async fetch(req, env) {
    const url = new URL(req.url);

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
      const raw = await env.GRID.get("feed");
      const feed = safeParse(raw);

      // 🔥 MIGRATION LAYER
      return feed.map((p, i) => ({
        id: p.id ?? Date.now() + i,

        title: p.title ?? p.text ?? "",
        image: p.image ?? "",
        comment: p.comment ?? p.link ?? "",

        order: Number.isFinite(p.order) ? p.order : i
      }));
    };

    const saveFeed = async (feed) => {
      const clean = feed
        .filter(Boolean)
        .slice(0, 200);

      await env.GRID.put("feed", JSON.stringify(clean));
    };

    const sortFeed = (feed) =>
      [...feed].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // ======================
    // FEED
    // ======================
    if (url.pathname === "/api/feed") {
      const feed = await getFeed();

      return Response.json({
        ok: true,
        data: sortFeed(feed)
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

        title: body.title || "",
        image: body.image || "",
        comment: body.comment || "",

        order: 0
      };

      const updated = feed.map(p => ({
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
    // UPDATE (SAFE LEGACY)
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json().catch(() => ({}));
      const feed = await getFeed();

      const updated = feed.map(p => {
        if (p.id !== body.id) return p;

        return {
          ...p,

          // admin fields
          title: body.title ?? p.title,
          image: body.image ?? p.image,

          // 🔒 comment только если явно передан
          ...(Object.prototype.hasOwnProperty.call(body, "comment")
            ? { comment: body.comment }
            : {}),

          order: body.order ?? p.order
        };
      });

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // UPDATE META (ADMIN ONLY)
    // ======================
    if (url.pathname === "/api/update-meta") {
      const body = await req.json().catch(() => ({}));
      const feed = await getFeed();

      const updated = feed.map(p => {
        if (p.id !== body.id) return p;

        return {
          ...p,
          title: body.title ?? p.title,
          image: body.image ?? p.image
          // ❌ comment НЕ ТРОГАЕМ
        };
      });

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // UPDATE COMMENT (INDEX ONLY)
    // ======================
    if (url.pathname === "/api/update-comment") {
      const body = await req.json().catch(() => ({}));
      const feed = await getFeed();

      const updated = feed.map(p => {
        if (p.id !== body.id) return p;

        return {
          ...p,
          comment: body.comment ?? p.comment
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

      const updated = feed.filter(p => p.id !== body.id);

      await saveFeed(updated);

      return Response.json({ ok: true });
    }

    // ======================
    // REORDER
    // ======================
    if (url.pathname === "/api/reorder") {
      const body = await req.json().catch(() => []);
      const feed = await getFeed();

      if (!Array.isArray(body)) {
        return Response.json(
          { ok: false, error: "bad payload" },
          { status: 400 }
        );
      }

      const map = new Map(body.map(p => [p.id, p.order]));

      const updated = feed.map(p => ({
        ...p,
        order: map.has(p.id) ? map.get(p.id) : p.order
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
