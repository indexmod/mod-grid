const grid = document.getElementById("grid");

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

  const server = json.data || [];

  render(server);
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
    const title = card.querySelector(".title");
    title.textContent = sp.title || "";

    // IMAGE
    const img = card.querySelector("img");

    if (sp.image) {
      img.src = sp.image;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }

    // COMMENT (не перебиваем если пользователь печатает)
    if (!timers[sp.id]) {
      const ta = card.querySelector("textarea");
      ta.value = sp.comment || "";
      autoResize(ta);
    }
  });

  // 🔥 важный момент: DOM = server state
  render(server, true);
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  // IMAGE
  const img = document.createElement("img");

  if (post.image) {
    img.src = post.image;
  } else {
    img.style.display = "none";
  }

  // TITLE
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = post.title || "";
  title.style.fontWeight = "bold";
  title.style.minHeight = "80px";

  // COMMENT
  const ta = document.createElement("textarea");
  ta.value = post.comment || "";

  ta.style.marginTop = "8px";
  ta.style.border = "1px dashed #444";
  ta.style.borderRadius = "10px";
  ta.style.padding = "6px";

  autoResize(ta);

  ta.addEventListener("input", () => {
    post.comment = ta.value;
    autoResize(ta);

    clearTimeout(timers[post.id]);

    timers[post.id] = setTimeout(async () => {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          comment: post.comment
        })
      });

      delete timers[post.id];
    }, 300);
  });

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(ta);

  nodes[post.id] = card;

  return card;
}

// ================= RENDER =================
function render(serverPosts = [], force = false) {
  grid.innerHTML = "";
  nodes = {};

  serverPosts.forEach(post => {
    grid.appendChild(createCard(post));
  });
}

// ================= INIT =================
load();
setInterval(sync, 2000);
