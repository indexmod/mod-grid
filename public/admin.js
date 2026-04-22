const grid = document.getElementById("grid");
const addBtn = document.getElementById("addBtn");

let posts = [];
let nodes = {};

// ================= LOAD =================
async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  posts = json.data || [];
  render();
}

// ================= CREATE =================
async function createPost() {
  const res = await fetch("/api/paste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Новый заголовок",
      text: "",
      image: ""
    })
  });

  const json = await res.json();

  posts.unshift(json.post);
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

// ================= UPDATE =================
async function updatePost(post) {
  await fetch("/api/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post)
  });
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  // IMAGE (editable)
  const imgInput = document.createElement("input");
  imgInput.placeholder = "image url";
  imgInput.value = post.image || "";

  imgInput.onchange = () => {
    post.image = imgInput.value;
    updatePost(post);
  };

  // TITLE (editable)
  const titleInput = document.createElement("input");
  titleInput.value = post.title || "";

  titleInput.oninput = () => {
    post.title = titleInput.value;
    updatePost(post);
  };

  // TEXT
  const ta = document.createElement("textarea");
  ta.value = post.text || "";

  ta.oninput = () => {
    post.text = ta.value;
    updatePost(post);
  };

  // DELETE
  const del = document.createElement("button");
  del.className = "deleteBtn";
  del.textContent = "delete";
  del.onclick = () => deletePost(post.id);

  card.appendChild(imgInput);
  card.appendChild(titleInput);
  card.appendChild(ta);
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

// ================= EVENTS =================
addBtn.onclick = createPost;

// ================= INIT =================
load();
