// sound.js

(function () {
  const STREAM_URL = "https://stream-mixtape-geo.ntslive.net/mixtape";

  let audio = null;
  let started = false;

  function createAudio() {
    audio = new Audio();
    audio.src = STREAM_URL;
    audio.loop = true;

    // 🔥 начинаем почти с нуля
    audio.volume = 0.001;

    audio.preload = "none";
  }

  function fadeIn(duration = 60000) {
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);

      // 🔥 очень мягкая кривая (не линейная)
      const eased = Math.pow(progress, 2.2);

      if (audio) {
        audio.volume = Math.min(eased * 0.25, 0.25);
        // максимум 25% громкости → фон
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  async function startAudio() {
    if (started) return;
    started = true;

    if (!audio) createAudio();

    try {
      await audio.play();
      fadeIn(60000); // 🔥 1 минута на разгон
    } catch (e) {
      console.log("audio blocked", e);
      started = false;
    }
  }

  // 🔥 ЛЮБОЕ ВЗАИМОДЕЙСТВИЕ
  const events = ["click", "touchstart", "keydown", "scroll"];

  function bind() {
    events.forEach(event => {
      window.addEventListener(event, startAudio, { once: true, passive: true });
    });
  }

  bind();
})();
