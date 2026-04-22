const grid = document.getElementById("grid");

let nodes = {};
let timers = {};
let buffer = {}; // 🔥 локальные изменения

// ================= AUTO HEIGHT =================
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ================= LOAD =================
async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  render(json.data || []);
}

// ================= SYNC =================
async function sync() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  const server = json.data || [];

  server.forEach(sp => {
    const card = nodes[sp.id];
    if (!card) return;

    // TITLE
    card.querySelector(".title").textContent = sp.title || "";

    // IMAGE
    const img = card.querySelector("img");
    if (sp.image) {
      img.src = sp.image;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }

    const ta = card.querySelector("textarea");

    // 🔥 НЕ ТРОГАЕМ если есть локальный буфер или фокус
    if (buffer[sp.id]) return;
    if (document.activeElement === ta) return;

    if (ta.value !== sp.comment) {
      ta.value = sp.comment || "";
      autoResize(ta);
    }
  });
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  // IMAGE
  const img = document.createElement("img");
  if (post.image) img.src = post.image;
  else img.style.display = "none";

  // TITLE
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = post.title || "";
  title.style.fontWeight = "bold";
  title.style.minHeight = "80px";

  // COMMENT
  const ta = document.createElement("textarea");

  // 🔥 восстановление draft
  const saved = localStorage.getItem("draft_" + post.id);
  ta.value = saved !== null ? saved : (post.comment || "");

  ta.style.marginTop = "8px";
  ta.style.border = "1px dashed #444";
  ta.style.borderRadius = "10px";
  ta.style.padding = "6px";

  autoResize(ta);

  ta.addEventListener("input", () => {
    const value = ta.value;

    // ⚡ мгновенно
    buffer[post.id] = value;

    // 💾 backup
    localStorage.setItem("draft_" + post.id, value);

    requestAnimationFrame(() => autoResize(ta));

    clearTimeout(timers[post.id]);

    // 🌐 отложенная отправка
    timers[post.id] = setTimeout(async () => {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          comment: value
        })
      });

      delete buffer[post.id];
      localStorage.removeItem("draft_" + post.id);

    }, 1200);
  });

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(ta);

  nodes[post.id] = card;

  return card;
}

// ================= RENDER =================
function render(serverPosts = []) {
  grid.innerHTML = "";
  nodes = {};

  serverPosts.forEach(post => {
    grid.appendChild(createCard(post));
  });
}

// ================= INIT =================
load();
setInterval(sync, 2000);
