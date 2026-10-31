function initFlap(panel) {
  const flap = panel.querySelector(".reveal-flap");
  const counter = panel.querySelector(".water-counter-number");
  const river = panel.querySelector(".river-object");
  const revealCopy = panel.querySelector(".reveal-copy");
  const invitation = flap.querySelector(".flap-invitation");
  const announcement = document.querySelector("#count-announcement");
  if (!flap || !counter || !river || !revealCopy || !invitation || !announcement) return;

  const fullCount = 324000000000;
  let progress = 0;
  let animationFrame = 0;
  let animationTimer = 0;
  let announced = false;
  let closing = false;
  let startY = null;

  const bezierCoordinate = (time, first, second) => {
    const inverse = 1 - time;
    return 3 * inverse * inverse * time * first + 3 * inverse * time * time * second + time * time * time;
  };

  const easeOut = (time) => {
    let low = 0;
    let high = 1;
    let parameter = time;
    for (let iteration = 0; iteration < 12; iteration += 1) {
      const estimate = bezierCoordinate(parameter, 0.16, 0.3);
      if (Math.abs(estimate - time) < 0.001) break;
      if (estimate < time) low = parameter;
      else high = parameter;
      parameter = (low + high) / 2;
    }
    return bezierCoordinate(parameter, 1, 1);
  };

  const riverPaths = () => {
    const root = river.contentDocument?.documentElement;
    if (!root) return [];
    return [...root.querySelectorAll(".river-draw")].map((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length * (1 - progress));
      return path;
    });
  };

  let paths = [];
  river.addEventListener("load", () => {
    paths = riverPaths();
    render(progress);
  });

  function render(value) {
    const wasComplete = panel.dataset.complete === "true";
    progress = Math.max(0, Math.min(1, value));
    const isRevealed = progress >= 0.5;
    const label = isRevealed ? "Hide the figure" : "Reveal the figure";
    flap.setAttribute("aria-label", label);
    invitation.textContent = label;
    counter.textContent = progress === 0
      ? "0"
      : Math.floor(fullCount * progress).toLocaleString("en-US");
    revealCopy.style.opacity = String(progress);
    if (paths.length === 0) paths = riverPaths();
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDashoffset = String(length * (1 - progress));
    });
    if (progress === 1) {
      closing = false;
      panel.dataset.complete = "true";
      flap.setAttribute("aria-expanded", "true");
      if (!announced) {
        announcement.textContent = `${fullCount.toLocaleString("en-US")} cubic meters`;
        announced = true;
      }
      if (!wasComplete) {
        const shimmer = river.contentDocument?.querySelector("#river-shimmer");
        shimmer?.beginElement();
        document.dispatchEvent(new Event("flapcomplete"));
      }
    } else {
      panel.dataset.complete = "false";
      flap.setAttribute("aria-expanded", "false");
      if (progress === 0) closing = false;
    }
  }

  const animateTo = (target) => {
    cancelAnimationFrame(animationFrame);
    window.clearTimeout(animationTimer);
    const initial = progress;
    const duration = 700 * Math.abs(target - initial);
    const startedAt = performance.now();
    const frame = (timestamp) => {
      const elapsed = Math.min((timestamp - startedAt) / duration, 1);
      const eased = easeOut(elapsed);
      render(initial + (target - initial) * eased);
      if (elapsed < 1) animationFrame = requestAnimationFrame(frame);
      else {
        window.clearTimeout(animationTimer);
        render(target);
      }
    };
    animationFrame = requestAnimationFrame(frame);
    animationTimer = window.setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      render(target);
    }, duration + 120);
  };

  const open = () => {
    if (progress >= 1) return;
    closing = false;
    animateTo(1);
  };
  const close = () => {
    if (progress <= 0) return;
    closing = true;
    panel.dataset.complete = "false";
    flap.setAttribute("aria-expanded", "false");
    river.contentDocument?.querySelector("#river-shimmer")?.endElement();
    animateTo(0);
  };

  let dragged = false;
  flap.addEventListener("click", () => {
    if (dragged) {
      dragged = false;
      return;
    }
    if (progress >= 0.5) close();
    else open();
  });
  flap.addEventListener("pointerdown", (event) => {
    startY = event.clientY;
    dragged = false;
    flap.setPointerCapture(event.pointerId);
  });
  flap.addEventListener("pointerup", (event) => {
    if (startY !== null) {
      const verticalDistance = startY - event.clientY;
      if (Math.abs(verticalDistance) > 16) {
        dragged = true;
        if (verticalDistance > 0) open();
        else close();
      }
    }
    startY = null;
  });
  flap.addEventListener("pointercancel", () => {
    startY = null;
  });
  flap.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && progress > 0 && !closing) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  });

  render(0);
}

export function initPanelMotion() {
  const panel = document.querySelector(".panel-reservoir");
  if (panel) initFlap(panel);
}
