document.addEventListener("DOMContentLoaded", () => {
  const imgInput = document.getElementById("img");
  const textInput = document.getElementById("text");
  const counter = document.getElementById("counter");
  const sendBtn = document.getElementById("sendBtn");
  const lastPost = document.getElementById("lastPost");

  if (!imgInput || !textInput || !counter || !sendBtn || !lastPost) {
    console.error("ADMIN INIT FAILED");
    return;
  }

  // ================= COUNTER =================
  textInput.addEventListener("input", () => {
    counter.textContent = `${textInput.value.length} / 500`;
  });

  // ================= SEND =================
  sendBtn.addEventListener("click", async () => {
    const payload = {
      image: imgInput.value.trim(),
      text: textInput.value.trim()
    };

    if (!payload.image) return;

    try {
      const res = await fetch("/api/paste", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("POST FAILED");

      const json = await res.json();

      // очистка
      imgInput.value = "";
      textInput.value = "";
      counter.textContent = "0 / 500";

      // показать только что созданный пост
      renderLast(json.post);

    } catch (e) {
      console.error("SEND ERROR:", e);
    }
  });

  // ================= RENDER LAST =================
  function renderLast(post){
    lastPost.innerHTML = "";

    const card = document.createElement("div");
    card.className = "adminItem";

    const img = document.createElement("img");
    img.src = post.image;

    const text = document.createElement("div");
    text.textContent = post.text;

    card.appendChild(img);
    card.appendChild(text);

    lastPost.appendChild(card);
  }

  // ================= INIT (показываем последний из облака) =================
  async function initLast(){
    try {
      const res = await fetch("/api/feed");
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        renderLast(json.data[0]); // только первый (самый свежий)
      }

    } catch (e) {
      console.error("INIT LOAD ERROR", e);
    }
  }

  initLast();
});
