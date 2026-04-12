async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  const list = document.getElementById("adminList");
  list.innerHTML = "";

  json.data.forEach(post => {

    const item = document.createElement("div");
    item.className = "adminItem";

    item.innerHTML = `
      <img src="${post.image}" class="adminPreview" />

      <div class="adminText">
        ${post.text?.slice(0, 120) || ""}
      </div>

      <div class="adminActions">
        <button class="deleteBtn">delete</button>
      </div>
    `;

    item.querySelector(".deleteBtn").onclick = async () => {
      await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id })
      });

      load();
    };

    list.appendChild(item);
  });
}

load();
