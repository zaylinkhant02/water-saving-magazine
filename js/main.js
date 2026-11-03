import { initMagazine } from "./magazine.js";
import { initPanelMotion } from "./panel-motion.js";
import { initPageInteractions, preloadPageServices } from "./page-interactions.js";
import { initGreywaterGame, preloadGreywaterImages } from "./greywater-game.js";

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
      video.play().catch((error) => {
        if (error.name === "AbortError" || error.name === "NotAllowedError") return;
        console.error("Unable to play magazine video.", error);
        showVideoError();
      });
    };

    let mediaVisible = false;
    const updatePlayback = () => {
      if (mediaVisible && document.visibilityState === "visible") playVideo();
      else video.pause();
    };

    document.addEventListener("magazineviewchange", (event) => {
      mediaVisible = event.detail.open && event.detail.page === Number(media.dataset.visiblePage);
      updatePlayback();
    });
    document.addEventListener("visibilitychange", updatePlayback);

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
    video.addEventListener("error", () => {
      console.error("Unable to load magazine video.", video.error);
      showVideoError();
    });

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
    const shouldPlay = coverVisible && document.visibilityState === "visible" && !reducedMotion.matches;
    video.autoplay = shouldPlay;

    if (shouldPlay) {
      video.play().catch((error) => {
        if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
          console.error("Unable to play the cover video.", error);
        }
      });
    } else {
      video.pause();
    }
  };

  reducedMotion.addEventListener("change", updatePlayback);
  document.addEventListener("visibilitychange", updatePlayback);
  document.addEventListener("magazineviewchange", (event) => {
    coverVisible = event.detail.cover;
    updatePlayback();
  });
  updatePlayback();
}

function waitForImage(image) {
  const imageSource = image.currentSrc || image.src;
  const waitUntilLoaded = image.complete
    ? image.naturalWidth
      ? Promise.resolve()
      : Promise.reject(new Error(`Unable to load image: ${imageSource}`))
    : new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", () => reject(new Error(`Unable to load image: ${imageSource}`)), { once: true });
    });

  return waitUntilLoaded.then(() => image.decode());
}

function waitForCoverVideoFrame(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();

  return new Promise((resolve, reject) => {
    video.addEventListener("loadeddata", resolve, { once: true });
    video.addEventListener("error", () => reject(new Error("Unable to load the cover video.")), { once: true });
    video.load();
  });
}

async function init() {
  const stage = document.querySelector("#magazine-stage");
  const loadingScreen = document.querySelector("#magazine-loading");
  const loadingMessage = document.querySelector("#magazine-loading-message");

  try {
    await loadPageFlip();
    initMagazine();
    initPanelMotion();
    initPageInteractions();
    initGreywaterGame();
    initMagazineVideos();
    const coverVideo = document.querySelector(".cover-video");
    if (!coverVideo) throw new Error("The cover video is missing.");

    await Promise.all([
      preloadPageServices(),
      Promise.all([...document.images].map(waitForImage)),
      preloadGreywaterImages(),
      waitForCoverVideoFrame(coverVideo),
    ]);

    stage?.setAttribute("aria-busy", "false");
    loadingScreen?.classList.add("is-ready");
    window.setTimeout(() => {
      if (loadingScreen) loadingScreen.hidden = true;
      initCoverVideo();
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
