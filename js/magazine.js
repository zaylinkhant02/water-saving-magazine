const PAGE_WIDTH = 460;
const PAGE_HEIGHT = 620;
const PAGE_COUNT = 8;
const VIEW_COUNT = PAGE_COUNT / 2 + 1;
const BOTTOM_CORNER_SIZE = 48;
const DRAG_THRESHOLD = 6;

function restrictFlipStarts(magazine, flipSurface) {
  let mouseInteraction = false;
  let mouseStart = null;
  let mouseDragged = false;
  let touchInteraction = false;
  let touchStart = null;
  let touchDragged = false;

  const isBottomOuterCorner = (x, y) => {
    const bounds = flipSurface.getBoundingClientRect();
    const relativeX = x - bounds.left;
    const relativeY = y - bounds.top;
    const scaleX = bounds.width / (flipSurface.offsetWidth || PAGE_WIDTH * 2);
    const scaleY = bounds.height / (flipSurface.offsetHeight || PAGE_HEIGHT);
    const cornerWidth = BOTTOM_CORNER_SIZE * scaleX;
    const cornerHeight = BOTTOM_CORNER_SIZE * scaleY;

    return relativeY >= bounds.height - cornerHeight
      && (relativeX <= cornerWidth || relativeX >= bounds.width - cornerWidth);
  };

  const getPoint = (event) => {
    if ("touches" in event) return event.touches[0] || event.changedTouches[0];
    return event;
  };

  const hasDragged = (start, point) => Math.hypot(point.clientX - start.x, point.clientY - start.y) >= DRAG_THRESHOLD;

  const mapPointToBook = (point) => {
    const bounds = flipSurface.getBoundingClientRect();
    const scaleX = bounds.width / (flipSurface.offsetWidth || PAGE_WIDTH * 2);
    const scaleY = bounds.height / (flipSurface.offsetHeight || PAGE_HEIGHT);
    return {
      x: bounds.left + (point.clientX - bounds.left) / scaleX,
      y: bounds.top + (point.clientY - bounds.top) / scaleY
    };
  };

  const remapMouseEvent = (event) => {
    const point = mapPointToBook(event);
    Object.defineProperty(event, "clientX", { configurable: true, value: point.x });
    Object.defineProperty(event, "clientY", { configurable: true, value: point.y });
  };

  const remapTouchEvent = (event) => {
    const remapTouches = (touches) => Array.from(touches, (touch) => {
      const point = mapPointToBook(touch);
      return {
        identifier: touch.identifier,
        target: touch.target,
        clientX: point.x,
        clientY: point.y,
        screenX: touch.screenX,
        screenY: touch.screenY
      };
    });
    Object.defineProperty(event, "touches", { configurable: true, value: remapTouches(event.touches) });
    Object.defineProperty(event, "changedTouches", { configurable: true, value: remapTouches(event.changedTouches) });
  };

  const allowOnlyBottomCornerStart = (event) => {
    const point = getPoint(event);
    if (!point || !isBottomOuterCorner(point.clientX, point.clientY)) {
      event.stopPropagation();
      if (event.type === "mousedown") {
        mouseInteraction = false;
        mouseStart = null;
      } else {
        touchInteraction = false;
        touchStart = null;
      }
      return;
    }

    if (event.type === "mousedown") {
      mouseInteraction = true;
      mouseStart = { x: point.clientX, y: point.clientY };
      mouseDragged = false;
      remapMouseEvent(event);
    } else {
      touchInteraction = true;
      touchStart = { x: point.clientX, y: point.clientY };
      touchDragged = false;
      remapTouchEvent(event);
    }
  };

  const handleMouseMove = (event) => {
    if (mouseInteraction) {
      if (mouseStart && hasDragged(mouseStart, event)) mouseDragged = true;
      remapMouseEvent(event);
      return;
    }
    if (event.target instanceof Node && flipSurface.contains(event.target)) {
      event.stopPropagation();
    }
  };

  const finishMouseInteraction = (event) => {
    if (!mouseInteraction) return;
    if (!mouseDragged) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else remapMouseEvent(event);
    mouseInteraction = false;
    mouseStart = null;
  };

  const handleTouchMove = (event) => {
    const point = getPoint(event);
    if (touchInteraction && touchStart && point && hasDragged(touchStart, point)) touchDragged = true;
    if (touchInteraction) remapTouchEvent(event);
  };

  const finishTouchInteraction = (event) => {
    if (!touchInteraction) return;
    if (!touchDragged) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else remapTouchEvent(event);
    touchInteraction = false;
    touchStart = null;
  };

  magazine.addEventListener("mousedown", allowOnlyBottomCornerStart, true);
  magazine.addEventListener("touchstart", allowOnlyBottomCornerStart, true);
  window.addEventListener("mousemove", handleMouseMove, true);
  window.addEventListener("mouseup", finishMouseInteraction, true);
  window.addEventListener("touchmove", handleTouchMove, true);
  window.addEventListener("touchend", finishTouchInteraction, true);
  window.addEventListener("touchcancel", finishTouchInteraction, true);
}

export function initMagazine() {
  const magazine = document.querySelector("#magazine");
  const previousButton = document.querySelector("#previous-page");
  const nextButton = document.querySelector("#next-page");
  const pageNumber = document.querySelector("#magazine-page-number");
  const progressTrack = document.querySelector(".magazine-progress-track");
  const progressFill = document.querySelector(".magazine-progress-fill");
  const stage = document.querySelector("#magazine-stage");
  const viewport = magazine?.closest(".magazine-viewport");
  const pages = magazine ? [...magazine.children] : [];
  const PageFlip = window.St?.PageFlip;

  if (!magazine || !viewport || !previousButton || !nextButton || !pageNumber || !progressTrack || !progressFill || !stage || pages.length !== PAGE_COUNT) {
    throw new Error("The magazine must contain eight pages and all navigation controls.");
  }
  if (typeof PageFlip !== "function") {
    throw new Error("The PageFlip browser bundle failed to load.");
  }
  if (pages[0].dataset.density !== "hard" || pages[PAGE_COUNT - 1].dataset.density !== "hard") {
    throw new Error("The first and last magazine pages must be hard covers.");
  }

  let displayedPage = 1;
  const pageFlip = new PageFlip(magazine, {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    size: "fixed",
    minWidth: PAGE_WIDTH,
    maxWidth: PAGE_WIDTH,
    minHeight: PAGE_HEIGHT,
    maxHeight: PAGE_HEIGHT,
    autoSize: false,
    showCover: true,
    drawShadow: true,
    maxShadowOpacity: 0.15,
    flippingTime: 600,
    usePortrait: false,
    useMouseEvents: true,
    showPageCorners: false,
    mobileScrollSupport: false,
    clickEventForward: true,
    disableFlipByClick: true
  });

  pageFlip.loadFromHTML(pages);
  const flipSurface = magazine.querySelector(".stf__block");
  if (!flipSurface) {
    throw new Error("The PageFlip interaction surface failed to initialize.");
  }
  restrictFlipStarts(magazine, flipSurface);
  const updateMagazineScale = () => {
    const stageStyle = getComputedStyle(stage);
    const sideGutter = parseFloat(stageStyle.getPropertyValue("--stage-side-gutter")) || 0;
    const topGutter = parseFloat(stageStyle.getPropertyValue("--stage-top-gutter")) || 0;
    const bottomGutter = parseFloat(stageStyle.getPropertyValue("--stage-bottom-gutter")) || 0;
    const availableWidth = Math.max(0, stage.clientWidth - sideGutter * 2);
    const availableHeight = Math.max(0, stage.clientHeight - topGutter - bottomGutter);
    const scale = Math.min(1, availableWidth / (PAGE_WIDTH * 2), availableHeight / PAGE_HEIGHT);
    viewport.style.setProperty("--magazine-scale", String(scale));
  };
  const updateBookPosition = (pageIndex) => {
    magazine.style.setProperty("--page-half-width", `${PAGE_WIDTH / 2}px`);
    magazine.dataset.bookPosition = pageIndex === 0
      ? "front"
      : pageIndex === PAGE_COUNT - 1
        ? "back"
        : "spread";
    if (!magazine.dataset.positionReady) {
      magazine.getBoundingClientRect();
      magazine.dataset.positionReady = "true";
    }
  };
  if ("ResizeObserver" in window) {
    const scaleObserver = new ResizeObserver(updateMagazineScale);
    scaleObserver.observe(stage);
  } else {
    window.addEventListener("resize", updateMagazineScale);
  }
  updateMagazineScale();
  const turnToDisplayedPage = (page) => {
    const targetPage = Math.max(1, Math.min(VIEW_COUNT, page));
    pageFlip.turnToPage(targetPage === 1 ? 0 : targetPage * 2 - 3);
  };
  progressTrack.addEventListener("click", (event) => {
    const bounds = progressTrack.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;
    const targetPage = Math.round(position * (VIEW_COUNT - 1)) + 1;
    turnToDisplayedPage(targetPage);
  });
  previousButton.addEventListener("click", () => pageFlip.flipPrev("bottom"));
  nextButton.addEventListener("click", () => pageFlip.flipNext("bottom"));
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']")) return;

    if ((event.key === "<" || event.key === "ArrowLeft" || event.key === "ArrowDown") && displayedPage > 1) {
      event.preventDefault();
      pageFlip.flipPrev("bottom");
    } else if ((event.key === ">" || event.key === "ArrowRight" || event.key === "ArrowUp") && displayedPage < VIEW_COUNT) {
      event.preventDefault();
      pageFlip.flipNext("bottom");
    } else if (event.target === progressTrack && event.key === "Home") {
      event.preventDefault();
      turnToDisplayedPage(1);
    } else if (event.target === progressTrack && event.key === "End") {
      event.preventDefault();
      turnToDisplayedPage(VIEW_COUNT);
    }
  });
  const announceView = (value) => {
    const pageIndex = Number(value);
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= PAGE_COUNT) {
      throw new RangeError(`PageFlip reported an invalid page index: ${value}`);
    }
    const atCover = pageIndex === 0;
    const atBackCover = pageIndex === PAGE_COUNT - 1;
    displayedPage = atBackCover
      ? VIEW_COUNT
      : atCover
        ? 1
        : Math.floor((pageIndex + 1) / 2) + 1;
    pageNumber.textContent = `${displayedPage} / ${VIEW_COUNT}`;
    progressTrack.setAttribute("aria-valuenow", String(displayedPage));
    progressTrack.setAttribute("aria-valuemax", String(VIEW_COUNT));
    progressTrack.setAttribute("aria-valuetext", `Page ${displayedPage} of ${VIEW_COUNT}`);
    progressFill.style.width = `${(displayedPage / VIEW_COUNT) * 100}%`;
    previousButton.disabled = atCover;
    nextButton.disabled = atBackCover;
    updateBookPosition(pageIndex);
    const open = pageIndex > 0 && pageIndex < PAGE_COUNT - 1;
    document.dispatchEvent(new CustomEvent("magazineviewchange", {
      detail: {
        open,
        page: open ? pageIndex + 1 : null,
        turned: pageIndex !== 1
      }
    }));
  };

  pageFlip.on("flip", (event) => announceView(event.data));
  announceView(pageFlip.getCurrentPageIndex());
}
