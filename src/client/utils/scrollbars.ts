import { createElement, getElement, getElementAll, type ParentElement } from '../utils/elements.ts';

interface UpdateScrollbarsDetail {
    el: Element;
}

const MIN_DELTA = 2;
const MIN_THUMB = 24;

interface Parts {
    trackX: HTMLDivElement;
    thumbX: HTMLDivElement;
    trackY: HTMLDivElement;
    thumbY: HTMLDivElement;
}

function buildParts(): Parts {
    const parts: Parts = {
        trackX: createElement('div', 'scrollbar-track-x'),
        thumbX: createElement('div', 'scrollbar-thumb-x'),
        trackY: createElement('div', 'scrollbar-track-y'),
        thumbY: createElement('div', 'scrollbar-thumb-y'),
    };
    parts.trackX.replaceChildren(parts.thumbX);
    parts.trackY.replaceChildren(parts.thumbY);
    return parts;
}

function updateX(vp: HTMLElement, parts: Parts) {
    const canScrollX = vp.scrollWidth - vp.clientWidth > MIN_DELTA;
    parts.trackX.classList.toggle('scrollbar-visible', canScrollX);
    if (!canScrollX) return;

    const trackLen = parts.trackX.getBoundingClientRect().width;
    const total = vp.scrollWidth,
        view = vp.clientWidth;
    const max = Math.max(1, total - view);

    const thumbLen = Math.max(MIN_THUMB, trackLen * (view / total));
    const end = trackLen - thumbLen;
    const raw = (vp.scrollLeft / max) * end;
    const pos = Math.min(Math.max(raw, 0), end);

    parts.thumbX.style.width = `${thumbLen}px`;
    parts.thumbX.style.transform = `translateX(${pos}px)`;
}

function updateY(vp: HTMLElement, parts: Parts) {
    const canScrollY = vp.scrollHeight - vp.clientHeight > MIN_DELTA;
    parts.trackY.classList.toggle('scrollbar-visible', canScrollY);
    if (!canScrollY) return;

    const trackLen = parts.trackY.getBoundingClientRect().height;
    const total = vp.scrollHeight,
        view = vp.clientHeight;
    const max = Math.max(1, total - view);

    const thumbLen = Math.max(MIN_THUMB, trackLen * (view / total));
    const end = trackLen - thumbLen;
    const raw = (vp.scrollTop / max) * end;
    const pos = Math.min(Math.max(raw, 0), end);

    parts.thumbY.style.height = `${thumbLen}px`;
    parts.thumbY.style.transform = `translateY(${pos}px)`;
}

function calcScrollX(vp: HTMLElement, parts: Parts, ev: PointerEvent, offset: number) {
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

function calcScrollY(vp: HTMLElement, parts: Parts, ev: PointerEvent, offset: number) {
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

interface DragInfo {
    isHorizontal: boolean;
    pointerId: number;
    offset: number;
}

function calcDragInfo(ev: PointerEvent, parts: Parts): DragInfo {
    const part = ev.currentTarget as HTMLDivElement;
    const isHorizontal = part === parts.thumbX;
    const pointerId = ev.pointerId;
    const rect = part.getBoundingClientRect();
    const offset = isHorizontal ? ev.clientX - rect.left : ev.clientY - rect.top;
    return { isHorizontal, pointerId, offset };
}

function setupScrollbars(el: HTMLElement) {
    if (el.dataset.enhanced === 'true') return;
    el.dataset.enhanced = 'true';

    const vp = getElement<HTMLElement>(el, '.scrollbar-vp');
    const parts = buildParts();
    el.append(parts.trackX, parts.trackY);
    let dragInfo: DragInfo | undefined;
    let timeout: NodeJS.Timeout | undefined;
    let raf = 0;

    function makeActive(force: boolean) {
        clearTimeout(timeout);
        if (!dragInfo && !force) {
            timeout = setTimeout(() => {
                el.classList.remove('scrollbars-active');
            }, 1000);
        }
        el.classList.add('scrollbars-active');
    }

    function onPointerDown(ev: PointerEvent) {
        ev.preventDefault();
        dragInfo = calcDragInfo(ev, parts);
        makeActive(true);
        const { isHorizontal, pointerId } = dragInfo;
        if (isHorizontal) {
            parts.thumbX.setPointerCapture(pointerId);
            parts.thumbX.classList.add('scrollbar-dragging');
        } else {
            parts.thumbY.setPointerCapture(pointerId);
            parts.thumbY.classList.add('scrollbar-dragging');
        }
        el.classList.add('select-none');
    }

    function onPointerMove(ev: PointerEvent) {
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
            parts.thumbX.classList.remove('scrollbar-dragging');
        } else {
            parts.thumbY.releasePointerCapture(pointerId);
            parts.thumbY.classList.remove('scrollbar-dragging');
        }
        el.classList.remove('select-none');
        dragInfo = undefined;
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

    vp.addEventListener('scroll', onChange, { passive: true });
    parts.trackX.addEventListener('pointerenter', onPointerEnter);
    parts.trackY.addEventListener('pointerenter', onPointerEnter);
    parts.trackX.addEventListener('pointerleave', onPointerLeave);
    parts.trackY.addEventListener('pointerleave', onPointerLeave);
    parts.thumbX.addEventListener('pointerdown', onPointerDown);
    parts.thumbY.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(vp);

    return () => {
        vp.removeEventListener('scroll', onChange);
        parts.trackX.removeEventListener('pointerenter', onPointerEnter);
        parts.trackY.removeEventListener('pointerenter', onPointerEnter);
        parts.trackX.removeEventListener('pointerleave', onPointerLeave);
        parts.trackY.removeEventListener('pointerleave', onPointerLeave);
        parts.thumbX.removeEventListener('pointerdown', onPointerDown);
        parts.thumbY.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        ro.disconnect();
    };
}

function updateScrollbars(parentEl: ParentElement) {
    getElementAll(parentEl, '.scrollbar-sim').forEach(setupScrollbars);
}

function onScrollbarsUpdate(ev: Event) {
    const { el }: UpdateScrollbarsDetail = (ev as CustomEvent).detail ?? {};
    updateScrollbars(el);
}

document.addEventListener('scrollbars:update', onScrollbarsUpdate);
updateScrollbars(document);
