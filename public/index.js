const grid = document.getElementById("grid");
const addBtn = document.getElementById("addBtn");

let posts = [];
let nodes = {};
let timers = {};

// ================= AUTO HEIGHT =================
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ================= LOAD =================
async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  posts = json.data || [];
  render();
}

// ================= SYNC =================
async function sync() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  const server = json.data || [];

  server.forEach(sp => {
    const local = posts.find(p => p.id === sp.id);
    if (!local) return;

    const card = nodes[sp.id];
    if (!card) return;

    // TEXT sync
    if (!timers[sp.id] && local.text !== sp.text) {
      local.text = sp.text;

      const ta = card.querySelector("textarea");
      if (ta) {
        ta.value = sp.text || "";
        autoResize(ta);
      }
    }

    // IMAGE sync (важно: всегда перезапись state)
    if (sp.image !== undefined && local.image !== sp.image) {
      local.image = sp.image;

      const img = card.querySelector("img");

      if (img) {
        if (sp.image) {
          img.src = sp.image;
          img.style.display = "block";
        } else {
          img.removeAttribute("src");
          img.style.display = "none";
        }
      }
    }
  });
}

// ================= CREATE =================
async function createPost() {
  const res = await fetch("/api/paste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "",
      image: "",
      link: ""
    })
  });

  const json = await res.json();

  posts.unshift(json.post);
  render();
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  // ===== IMAGE =====
  const img = document.createElement("img");

  if (post.image && post.image.trim()) {
    img.src = post.image;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none"; // 🔥 убираем белый плейсхолдер
  }

  img.onerror = () => {
    img.style.display = "none";
  };

  // ===== TEXT =====
  const ta = document.createElement("textarea");
  ta.value = post.text || "";

  autoResize(ta);

  ta.addEventListener("input", () => {
    post.text = ta.value;
    autoResize(ta);

    clearTimeout(timers[post.id]);

    timers[post.id] = setTimeout(async () => {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          text: post.text
        })
      });

      delete timers[post.id];
    }, 300);
  });

  // ===== IMAGE PASTE =====
  ta.addEventListener("paste", async (e) => {
    const text = (e.clipboardData || window.clipboardData)
      .getData("text");

    if (
      text.startsWith("http") &&
      text.match(/\.(jpg|jpeg|png|webp)/i)
    ) {
      e.preventDefault();

      post.image = text;
      img.src = text;
      img.style.display = "block";

      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          image: text
        })
      });
    }
  });

  card.appendChild(img);
  card.appendChild(ta);

  nodes[post.id] = card;

  return card;
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";
  nodes = {};

  posts.forEach(post => {
    const card = createCard(post);
    grid.appendChild(card);
  });
}

// ================= EVENTS =================
addBtn.onclick = createPost;

// ================= INIT =================
load();
setInterval(sync, 2000);
