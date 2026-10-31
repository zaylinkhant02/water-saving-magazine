import { initMagazine } from "./magazine.js";
import { initPanelMotion } from "./panel-motion.js";
import { initPageInteractions } from "./page-interactions.js";

function initReservoirMedia() {
  const media = document.querySelector(".reservoir-media");
  const video = media?.querySelector(".reservoir-video");
  const toggle = media?.querySelector(".media-toggle");
  const errorMessage = media?.querySelector(".media-error");
  if (!media || !video || !toggle || !errorMessage) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;

  const showVideoError = () => {
    video.hidden = true;
    errorMessage.hidden = false;
    toggle.hidden = true;
  };

  const playVideo = () => {
    if (video.hidden) return;
    video.play().catch(showVideoError);
  };

  video.addEventListener("play", () => {
    toggle.setAttribute("aria-label", toggle.dataset.pauseLabel);
  });
  video.addEventListener("pause", () => {
    toggle.setAttribute("aria-label", toggle.dataset.playLabel);
  });
  video.addEventListener("error", showVideoError);

  document.addEventListener("magazineviewchange", (event) => {
    visible = event.detail.open && !event.detail.turned;
    if (visible && !reducedMotion.matches) playVideo();
    else video.pause();
  });

  toggle.addEventListener("click", () => {
    if (video.hidden) return;
    if (video.paused) playVideo();
    else video.pause();
  });

  video.pause();
  toggle.setAttribute("aria-label", toggle.dataset.playLabel);

  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) video.pause();
    else if (visible) playVideo();
  });
}

function init() {
  initMagazine();
  initPanelMotion();
  initPageInteractions();
  initReservoirMedia();
}

init();
