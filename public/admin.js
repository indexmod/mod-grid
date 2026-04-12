const grid = document.getElementById("grid");

let posts = [];
let nodes = {};

// ================= LOAD =================
async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  posts = json.data || [];
  render();
}

// ================= DELETE =================
async function deletePost(id) {
  await fetch("/api/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  posts = posts.filter(p => p.id !== id);
  render();
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");

  if (post.image) {
    img.src = post.image;
  } else {
    img.style.display = "none";
  }

  const text = document.createElement("div");
  text.textContent = post.text || "";
  text.style.whiteSpace = "pre-wrap";
  text.style.marginTop = "8px";
  text.style.color = "#cfcfcf";

  const del = document.createElement("button");
  del.className = "deleteBtn";
  del.textContent = "delete";

  del.onclick = () => deletePost(post.id);

  card.appendChild(img);
  card.appendChild(text);
  card.appendChild(del);

  return card;
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";
  nodes = {};

  posts.forEach(p => {
    const card = createCard(p);
    nodes[p.id] = card;
    grid.appendChild(card);
  });
}

// ================= INIT =================
load();
