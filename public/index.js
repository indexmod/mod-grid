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

    // TITLE
    if (local.title !== sp.title) {
      local.title = sp.title;
      card.querySelector(".title").textContent = sp.title || "";
    }

    // IMAGE
    if (local.image !== sp.image) {
      local.image = sp.image;

      const img = card.querySelector("img");

      if (sp.image) {
        img.src = sp.image;
        img.style.display = "block";
      } else {
        img.style.display = "none";
      }
    }

    // COMMENT
    if (!timers[sp.id] && local.comment !== sp.comment) {
      local.comment = sp.comment;

      const ta = card.querySelector("textarea");
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

  // RIGHT BLOCK
  const right = document.createElement("div");
  right.style.flex = "1";
  right.style.display = "flex";
  right.style.flexDirection = "column";

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
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          id: post.id,
          comment: post.comment
        })
      });

      delete timers[post.id];
    }, 300);
  });

  right.appendChild(title);
  right.appendChild(ta);

  card.appendChild(img);
  card.appendChild(right);

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
