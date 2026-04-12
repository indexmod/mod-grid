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

// ================= CREATE NODE =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;

  // IMAGE
  const img = document.createElement("img");
  if (post.image) img.src = post.image;

  // TEXT
  const ta = document.createElement("textarea");
  ta.value = post.text || "";

  autoResize(ta);

  ta.addEventListener("input", () => {
    post.text = ta.value;
    autoResize(ta);

    clearTimeout(timers[post.id]);
    timers[post.id] = setTimeout(() => {
      fetch("/api/update", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id: post.id, text: post.text })
      });
    }, 300);
  });

  // PASTE IMAGE URL
  ta.addEventListener("paste", (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");

    if (text.startsWith("http") && text.match(/\.(jpg|png|webp|jpeg)/)) {
      e.preventDefault();
      post.image = text;
      img.src = text;
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

// ================= RENDER (SAFE) =================
function render() {
  grid.innerHTML = "";
  nodes = {};

  posts.forEach(post => {
    const card = createCard(post);
    nodes[post.id] = card;
    grid.appendChild(card);
  });
}

// ================= DRAG REORDER =================
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
  const newOrder = [...grid.children].map((el, index) => {
    const post = posts.find(p => nodes[p.id] === el);
    if (post) post.order = index;
    return post;
  });

  posts = newOrder;

  fetch("/api/reorder", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(
      posts.map(p => ({ id: p.id, order: p.order }))
    )
  });
}

// ================= ADD =================
addBtn.onclick = async () => {
  const res = await fetch("/api/paste", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text: "", image: "" })
  });

  const json = await res.json();

  posts.unshift(json.post);
  render();
};

// ================= INIT =================
load();
setInterval(load, 5000);
