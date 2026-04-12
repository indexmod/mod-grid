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

// ================= SYNC (без перерендера DOM) =================
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
        ta.value = sp.text;
        autoResize(ta);
      }
    }

    // IMAGE sync (ВАЖНО: не затираем пустым значением)
    if (sp.image && local.image !== sp.image) {
      local.image = sp.image;
      const img = card.querySelector("img");
      if (img) {
        img.src = sp.image;
        img.style.display = "block";
      }
    }
  });
}

// ================= CREATE POST =================
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
  card.draggable = true;

  // IMAGE
  const img = document.createElement("img");

  if (post.image?.trim()) {
    img.src = post.image;
  } else {
    img.removeAttribute("src");
  }

  img.onerror = () => {
    img.style.display = "none";
  };

  // TEXT
  const ta = document.createElement("textarea");
  ta.value = post.text || "";

  autoResize(ta);

  // TEXT UPDATE
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

  // IMAGE PASTE (фикс: СРАЗУ сохраняем в KV)
  ta.addEventListener("paste", async (e) => {
    const text = (e.clipboardData || window.clipboardData)
      .getData("text");

    if (
      text.startsWith("http") &&
      text.match(/\.(jpg|jpeg|png|webp)/)
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

  // DRAG
  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    saveOrder();
  });

  card.appendChild(img);
  card.appendChild(ta);

  return card;
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";
  nodes = {};

  posts.forEach(post => {
    const card = createCard(post);
    nodes[post.id] = card;
    grid.appendChild(card);
  });
}

// ================= DRAG SORT =================
grid.addEventListener("dragover", (e) => {
  e.preventDefault();

  const after = getAfterElement(grid, e.clientY);
  const dragging = document.querySelector(".dragging");

  if (!dragging) return;

  if (!after) {
    grid.appendChild(dragging);
  } else {
    grid.insertBefore(dragging, after);
  }
});

function getAfterElement(container, y) {
  const els = [...container.querySelectorAll(".card:not(.dragging)")];

  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ================= SAVE ORDER =================
function saveOrder() {
  const ordered = [...grid.children].map((el, index) => {
    const post = posts.find(p => nodes[p.id] === el);
    if (post) post.order = index;
    return post;
  });

  posts = ordered;

  fetch("/api/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      posts.map(p => ({
        id: p.id,
        order: p.order
      }))
    )
  });
}

// ================= EVENTS =================
addBtn.onclick = createPost;

// ================= INIT =================
load();
setInterval(sync, 2000);
