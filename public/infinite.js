// infinite.js

export function initInfiniteScroll({ feed, posts, renderPost }) {

  let isAppending = false;

  function appendMore() {
    if (isAppending) return;
    isAppending = true;

    posts.forEach((item, index) => {
      const post = renderPost(item, index);
      feed.appendChild(post);
    });

    isAppending = false;
  }

  function onScroll() {
    const scrollRight = window.scrollX + window.innerWidth;
    const fullWidth = document.body.scrollWidth;

    if (scrollRight > fullWidth - 300) {
      appendMore();
    }
  }

  window.addEventListener("scroll", onScroll);
}
