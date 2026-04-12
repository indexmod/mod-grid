const grid = document.getElementById("grid");
const addBtn = document.getElementById("addBtn");

let posts = [];
let textareas = {};
let timers = {};
let isSyncing = false;

// ================= AUTO HEIGHT =================
function autoResize(el) {
  if (!el) return;
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

// ================= SYNC (diff-safe) =================
async function sync() {
  if (isSyncing) return;

  try {
    isSyncing = true;

    const res = await fetch("/api/feed");
    const json = await res.json();

    const server = json.data || [];

    server.forEach(sp => {
      const local = posts.find(p => p.id === sp.id);
      if (!local) return;

      if (!timers[sp.id] && local.text !== sp.text) {
        local.text = sp.text;

        const ta = textareas[sp.id];
        if (ta && document.activeElement !== ta) {
          ta.value = sp.text;
          autoResize(ta);
        }
      }
    });

  } catch (e) {
    console.error("sync error", e);
  } finally {
    isSyncing = false;
  }
}

// ================= CREATE =================
async function createPost() {
  const res = await fetch("/api/paste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: "",
      text: ""
    })
  });

  const json = await res.json();

  posts.unshift(json.post);
  render();
}

// ================= UPDATE =================
async function updatePost(id, patch) {
  await fetch("/api/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      ...patch
    })
  });
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";
  textareas = {};

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    // IMAGE
    if (post.image) {
      const img = document.createElement("img");
      img.src = post.image;
      img.className = "thumb";
      card.appendChild(img);
    }

    // TEXT
    const text = document.createElement("textarea");
    text.className = "text";
    text.value = post.text || "";

    autoResize(text);
    textareas[post.id] = text;

    text.addEventListener("input", (e) => {
      const value = e.target.value;

      autoResize(text);

      const target = posts.find(p => p.id === post.id);
      if (target) target.text = value;

      clearTimeout(timers[post.id]);

      timers[post.id] = setTimeout(() => {
        updatePost(post.id, { text: value });
        delete timers[post.id];
      }, 300);
    });

    card.appendChild(text);
    grid.appendChild(card);
  });
}

// ================= EVENTS =================
addBtn.onclick = createPost;

// ================= INIT =================
load();
setInterval(sync, 2000);
