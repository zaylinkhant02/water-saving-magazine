import { initMagazine } from "./magazine.js";
import { initPanelMotion } from "./panel-motion.js";
import { initPageInteractions } from "./page-interactions.js";
import { initGreywaterGame } from "./greywater-game.js";

const PAGE_FLIP_SOURCE = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js";

function loadPageFlip() {
  if (typeof window.St?.PageFlip === "function") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAGE_FLIP_SOURCE;
    script.onload = () => typeof window.St?.PageFlip === "function"
      ? resolve()
      : reject(new Error("The page-turning library did not initialize."));
    script.onerror = () => reject(new Error("The page-turning library failed to load."));
    document.head.append(script);
  });
}

function initMagazineVideos() {
  document.querySelectorAll(".reservoir-media, .readiness-media").forEach((media) => {
    const video = media.querySelector(".reservoir-video");
    const toggle = media.querySelector(".media-toggle");
    const errorMessage = media.querySelector(".media-error");
    if (!video || !toggle || !errorMessage) return;

    const showVideoError = () => {
      video.hidden = true;
      errorMessage.hidden = false;
      toggle.hidden = true;
    };

    const playVideo = () => {
      if (video.hidden) return;
      video.play().catch(showVideoError);
    };

    document.addEventListener("magazineviewchange", (event) => {
      const visible = event.detail.open && event.detail.page === Number(media.dataset.visiblePage);
      if (visible) playVideo();
      else video.pause();
    });

    toggle.addEventListener("click", () => {
      if (video.hidden) return;
      if (video.paused) playVideo();
      else video.pause();
    });

    video.addEventListener("play", () => {
      toggle.setAttribute("aria-label", toggle.dataset.pauseLabel);
    });
    video.addEventListener("pause", () => {
      toggle.setAttribute("aria-label", toggle.dataset.playLabel);
    });
    video.addEventListener("error", showVideoError);

    video.pause();
    toggle.setAttribute("aria-label", toggle.dataset.playLabel);
  });
}

function initCoverVideo() {
  const video = document.querySelector(".cover-video");
  if (!video) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let coverVisible = true;

  const updatePlayback = () => {
    const shouldPlay = coverVisible && !reducedMotion.matches;
    video.autoplay = shouldPlay;

    if (shouldPlay) {
      video.play().catch(() => {
        video.hidden = true;
      });
    } else {
      video.pause();
    }
  };

  reducedMotion.addEventListener("change", updatePlayback);
  document.addEventListener("magazineviewchange", (event) => {
    coverVisible = event.detail.cover;
    updatePlayback();
  });

  const startWhenIdle = () => {
    if (coverVisible && !reducedMotion.matches) updatePlayback();
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(startWhenIdle, { timeout: 1500 });
  } else {
    window.setTimeout(startWhenIdle, 250);
  }
}

async function init() {
  const stage = document.querySelector("#magazine-stage");
  const loadingScreen = document.querySelector("#magazine-loading");
  const loadingMessage = document.querySelector("#magazine-loading-message");

  try {
    await loadPageFlip();
    initCoverVideo();
    initMagazine();
    initPanelMotion();
    initPageInteractions();
    initGreywaterGame();
    initMagazineVideos();
    stage?.setAttribute("aria-busy", "false");
    loadingScreen?.classList.add("is-ready");
    window.setTimeout(() => {
      if (loadingScreen) loadingScreen.hidden = true;
    }, 240);
  } catch (error) {
    console.error("Unable to prepare the magazine.", error);
    if (loadingMessage) {
      loadingMessage.textContent = "The magazine couldn’t load. Check your connection and refresh to try again.";
    }
    loadingScreen?.classList.add("has-error");
    loadingScreen?.setAttribute("role", "alert");
    stage?.setAttribute("aria-busy", "false");
  }
}

init();
