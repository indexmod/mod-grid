const grid = document.getElementById("grid");
const addBtn = document.getElementById("addBtn");

let posts = [];

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
      title: "",
      image: ""
      // ❌ comment не создаём через админку
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

// ================= UPDATE META (🔥 только title + image) =================
async function pushUpdate(post) {
  await fetch("/api/update-meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: post.id,
      title: post.title,
      image: post.image
      // ❌ comment НЕ отправляем
    })
  });
}

// ================= CARD =================
function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";

  // IMAGE PREVIEW
  const img = document.createElement("img");
  if (post.image) {
    img.src = post.image;
  } else {
    img.style.display = "none";
  }

  // ================= LINK =================
  const link = document.createElement("textarea");
  link.placeholder = "ссылка";
  link.value = post.image || "";

  // ================= TITLE =================
  const title = document.createElement("textarea");
  title.placeholder = "заголовок";
  title.value = post.title || "";

  // ================= COMMENT (READ-ONLY) =================
  const comment = document.createElement("textarea");
  comment.placeholder = "комментарий (редактируется в индексе)";
  comment.value = post.comment || "";
  comment.disabled = true; // 🔒 блокируем

  // ================= LOCAL STATE =================
  link.oninput = () => {
    post.image = link.value.trim();

    if (post.image) {
      img.src = post.image;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
  };

  title.oninput = () => {
    post.title = title.value;
  };

  // ================= SEND =================
  const send = document.createElement("div");
  send.className = "action-text";
  send.textContent = "Отправить";

  send.onclick = () => pushUpdate(post);

  // ================= DELETE =================
  const del = document.createElement("div");
  del.className = "action-text delete-text";
  del.textContent = "Удалить";

  del.onclick = () => deletePost(post.id);

  // ================= ACTIONS =================
  const actions = document.createElement("div");
  actions.className = "actions";
  actions.appendChild(send);
  actions.appendChild(del);

  // ================= BUILD =================
  card.appendChild(img);
  card.appendChild(link);
  card.appendChild(title);
  card.appendChild(comment);
  card.appendChild(actions);

  return card;
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";
  posts.forEach(p => grid.appendChild(createCard(p)));
}

// ================= INIT =================
addBtn.onclick = createPost;
load();
