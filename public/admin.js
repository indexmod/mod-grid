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
      image: "",
      comment: ""
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

// ================= PARSE =================
function parseInput(value) {
  const urlMatch = value.match(/https?:\/\/\S+/);

  let image = "";
  let title = value;

  if (urlMatch) {
    image = urlMatch[0];
    title = value.replace(image, "").trim();
  }

  return { image, title };
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

  // INPUT
  const ta = document.createElement("textarea");
  ta.placeholder = "вставь ссылку + заголовок";
  ta.value = post.title || "";

  ta.oninput = async () => {
    const { image, title } = parseInput(ta.value);

    post.image = image;
    post.title = title;

    if (image) {
      img.src = image;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }

    await fetch("/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
  };

  // DELETE (🔥 теперь через класс)
  const del = document.createElement("div");
  del.className = "delete";
  del.textContent = "удалить";

  del.onclick = () => deletePost(post.id);

  card.appendChild(img);
  card.appendChild(ta);
  card.appendChild(del);

  return card;
}

// ================= RENDER =================
function render() {
  grid.innerHTML = "";

  posts.forEach(p => {
    grid.appendChild(createCard(p));
  });
}

// ================= INIT =================
addBtn.onclick = createPost;
load();
