const grid = document.getElementById("grid");

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

    // TEXT
    if (!timers[sp.id] && local.text !== sp.text) {
      local.text = sp.text;

      const ta = card.querySelector("textarea");
      ta.value = sp.text || "";
      autoResize(ta);
    }

    // IMAGE
    if (local.image !== sp.image) {
      local.image = sp.image;

      const img = card.querySelector("img");

      if (sp.image) {
        img.src = sp.image;
        img.style.display = "block";
      } else {
        img.removeAttribute("src");
        img.style.display = "none";
      }
    }

    // TITLE
    if (local.title !== sp.title) {
      local.title = sp.title;

      const title = card.querySelector("h3");
      title.textContent = sp.title || "";
    }
  });
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  // IMAGE (readonly)
  const img = document.createElement("img");

  if (post.image) {
    img.src = post.image;
  } else {
    img.style.display = "none";
  }

  img.onerror = () => img.style.display = "none";

  // TITLE (readonly)
  const title = document.createElement("h3");
  title.textContent = post.title || "";

  // TEXT (editable)
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

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(ta);

  nodes[post.id] = card;

  return card;
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";
  nodes = {};

  posts.forEach(post => {
    grid.appendChild(createCard(post));
  });
}

// ================= INIT =================
load();
setInterval(sync, 2000);
