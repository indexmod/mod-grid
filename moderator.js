async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  const list = document.getElementById("adminList");
  list.innerHTML = "";

  json.data.forEach(post => {
    const item = document.createElement("div");
    item.className = "adminItem";

    item.innerHTML = `
      <div style="flex:1; color:#b8b8b8;">
        ${post.text?.slice(0, 100) || ""}
      </div>

      <button>delete</button>
    `;

    item.querySelector("button").onclick = async () => {
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
