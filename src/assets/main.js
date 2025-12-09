// src/client/utils/elements.ts
function getElementById(elementId, force = true) {
  const result = document.getElementById(elementId) ?? void 0;
  if (!result && force) throw new Error(`Element #${elementId} missing`);
  return result;
}
function getElement(el, selectors, force = true) {
  const result = el?.querySelector(selectors) ?? void 0;
  if (!result && force) throw new Error(`Element ${selectors} missing`);
  return result;
}
function getRoleElement(el, role, force = true) {
  const selectors = `[data-role="${role}"]`;
  const result = el?.querySelector(selectors) ?? void 0;
  if (!result && force) throw new Error(`Element ${selectors} missing`);
  return result;
}
function getElementAll(el, selectors) {
  return Array.from(el?.querySelectorAll(selectors) ?? []);
}
function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.classList.add(...className.split(" "));
  if (textContent) element.textContent = textContent;
  return element;
}

// src/client/utils/scrollbars.ts
var MIN_DELTA = 2;
var MIN_THUMB = 24;
function buildParts() {
  const parts = {
    trackX: createElement("div", "scrollbar-track-x"),
    thumbX: createElement("div", "scrollbar-thumb-x"),
    trackY: createElement("div", "scrollbar-track-y"),
    thumbY: createElement("div", "scrollbar-thumb-y")
  };
  parts.trackX.replaceChildren(parts.thumbX);
  parts.trackY.replaceChildren(parts.thumbY);
  return parts;
}
function updateX(vp, parts) {
  const canScrollX = vp.scrollWidth - vp.clientWidth > MIN_DELTA;
  parts.trackX.classList.toggle("scrollbar-visible", canScrollX);
  if (!canScrollX) return;
  const trackLen = parts.trackX.getBoundingClientRect().width;
  const total = vp.scrollWidth, view = vp.clientWidth;
  const max = Math.max(1, total - view);
  const thumbLen = Math.max(MIN_THUMB, trackLen * (view / total));
  const end = trackLen - thumbLen;
  const raw = vp.scrollLeft / max * end;
  const pos = Math.min(Math.max(raw, 0), end);
  parts.thumbX.style.width = `${thumbLen}px`;
  parts.thumbX.style.transform = `translateX(${pos}px)`;
}
function updateY(vp, parts) {
  const canScrollY = vp.scrollHeight - vp.clientHeight > MIN_DELTA;
  parts.trackY.classList.toggle("scrollbar-visible", canScrollY);
  if (!canScrollY) return;
  const trackLen = parts.trackY.getBoundingClientRect().height;
  const total = vp.scrollHeight, view = vp.clientHeight;
  const max = Math.max(1, total - view);
  const thumbLen = Math.max(MIN_THUMB, trackLen * (view / total));
  const end = trackLen - thumbLen;
  const raw = vp.scrollTop / max * end;
  const pos = Math.min(Math.max(raw, 0), end);
  parts.thumbY.style.height = `${thumbLen}px`;
  parts.thumbY.style.transform = `translateY(${pos}px)`;
}
function calcScrollX(vp, parts, ev, offset) {
  const rect = parts.trackX.getBoundingClientRect();
  const trackLen = rect.width;
  const total = vp.scrollWidth;
  const view = vp.clientWidth;
  const maxScroll = Math.max(1, total - view);
  const thumbLen = Math.max(MIN_THUMB, Math.round(trackLen * (view / total)));
  const raw = ev.clientX - rect.left - offset;
  const end = trackLen - thumbLen;
  const pos = Math.min(Math.max(raw, 0), end);
  const ratio = end ? pos / end : 0;
  return Math.round(ratio * maxScroll);
}
function calcScrollY(vp, parts, ev, offset) {
  const rect = parts.trackY.getBoundingClientRect();
  const trackLen = rect.height;
  const total = vp.scrollHeight;
  const view = vp.clientHeight;
  const maxScroll = Math.max(1, total - view);
  const thumbLen = Math.max(MIN_THUMB, Math.round(trackLen * (view / total)));
  const raw = ev.clientY - rect.top - offset;
  const end = trackLen - thumbLen;
  const pos = Math.min(Math.max(raw, 0), end);
  const ratio = end ? pos / end : 0;
  return Math.round(ratio * maxScroll);
}
function calcDragInfo(ev, parts) {
  const part = ev.currentTarget;
  const isHorizontal = part === parts.thumbX;
  const pointerId = ev.pointerId;
  const rect = part.getBoundingClientRect();
  const offset = isHorizontal ? ev.clientX - rect.left : ev.clientY - rect.top;
  return { isHorizontal, pointerId, offset };
}
function setupScrollbars(el) {
  if (el.dataset.enhanced === "true") return;
  el.dataset.enhanced = "true";
  const vp = getElement(el, ".scrollbar-vp");
  const parts = buildParts();
  el.append(parts.trackX, parts.trackY);
  let dragInfo;
  let timeout;
  let raf = 0;
  function makeActive(force) {
    clearTimeout(timeout);
    if (!dragInfo && !force) {
      timeout = setTimeout(() => {
        el.classList.remove("scrollbars-active");
      }, 1e3);
    }
    el.classList.add("scrollbars-active");
  }
  function onPointerDown(ev) {
    ev.preventDefault();
    dragInfo = calcDragInfo(ev, parts);
    makeActive(true);
    const { isHorizontal, pointerId } = dragInfo;
    if (isHorizontal) {
      parts.thumbX.setPointerCapture(pointerId);
      parts.thumbX.classList.add("scrollbar-dragging");
    } else {
      parts.thumbY.setPointerCapture(pointerId);
      parts.thumbY.classList.add("scrollbar-dragging");
    }
    el.classList.add("select-none");
  }
  function onPointerMove(ev) {
    if (!dragInfo) return false;
    const { isHorizontal, offset } = dragInfo;
    if (isHorizontal) vp.scrollLeft = calcScrollX(vp, parts, ev, offset);
    else vp.scrollTop = calcScrollY(vp, parts, ev, offset);
  }
  function onPointerUp() {
    if (!dragInfo) return;
    const { isHorizontal, pointerId } = dragInfo;
    if (isHorizontal) {
      parts.thumbX.releasePointerCapture(pointerId);
      parts.thumbX.classList.remove("scrollbar-dragging");
    } else {
      parts.thumbY.releasePointerCapture(pointerId);
      parts.thumbY.classList.remove("scrollbar-dragging");
    }
    el.classList.remove("select-none");
    dragInfo = void 0;
    makeActive(false);
  }
  function onPointerEnter() {
    makeActive(true);
  }
  function onPointerLeave() {
    makeActive(false);
  }
  function update() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateX(vp, parts);
      updateY(vp, parts);
    });
  }
  update();
  function onChange() {
    update();
    makeActive(false);
  }
  vp.addEventListener("scroll", onChange, { passive: true });
  parts.trackX.addEventListener("pointerenter", onPointerEnter);
  parts.trackY.addEventListener("pointerenter", onPointerEnter);
  parts.trackX.addEventListener("pointerleave", onPointerLeave);
  parts.trackY.addEventListener("pointerleave", onPointerLeave);
  parts.thumbX.addEventListener("pointerdown", onPointerDown);
  parts.thumbY.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  const ro = new ResizeObserver(update);
  ro.observe(vp);
  return () => {
    vp.removeEventListener("scroll", onChange);
    parts.trackX.removeEventListener("pointerenter", onPointerEnter);
    parts.trackY.removeEventListener("pointerenter", onPointerEnter);
    parts.trackX.removeEventListener("pointerleave", onPointerLeave);
    parts.trackY.removeEventListener("pointerleave", onPointerLeave);
    parts.thumbX.removeEventListener("pointerdown", onPointerDown);
    parts.thumbY.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    ro.disconnect();
  };
}
function updateScrollbars(parentEl) {
  getElementAll(parentEl, ".scrollbar-sim").forEach(setupScrollbars);
}
function onScrollbarsUpdate(ev) {
  const { el } = ev.detail ?? {};
  updateScrollbars(el);
}
document.addEventListener("scrollbars:update", onScrollbarsUpdate);
updateScrollbars(document);

// src/client/main.ts
var scrollAreaEl = getElementById("scroll-area", false);
var bottomLinksEl = getElementById("bottom-links");
var scrollToTopEl = getRoleElement(bottomLinksEl, "top");
var nextEl = getRoleElement(bottomLinksEl, "next", false);
var homeEl = getElementById("home");
var docsEl = getElementById("docs", false);
function onClickHome() {
  docsEl?.classList.toggle("is-open");
}
homeEl.addEventListener("click", onClickHome);
function onKeyDown(ev) {
  if (ev.altKey || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
  if (ev.key === "ArrowLeft" && scrollToTopEl.dataset.previous) {
    window.location.href = scrollToTopEl.dataset.previous;
  }
  if (ev.key === "ArrowRight" && nextEl) nextEl.click();
}
function scrollToTop() {
  scrollAreaEl?.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("keydown", onKeyDown);
scrollToTopEl.addEventListener("click", scrollToTop);
