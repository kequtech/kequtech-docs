import { getElementById, getRoleElement } from './utils/elements.ts';
import './utils/scrollbars.ts';

const scrollAreaEl = getElementById('scroll-area', false);
const bottomLinksEl = getElementById('bottom-links');
const scrollToTopEl = getRoleElement(bottomLinksEl, 'top');
const nextEl = getRoleElement(bottomLinksEl, 'next', false);
const homeEl = getElementById('home');
const docsEl = getElementById('docs', false);

function onClickHome() {
    docsEl?.classList.toggle('is-open');
}

homeEl.addEventListener('click', onClickHome);

function onKeyDown(ev: KeyboardEvent) {
    if (ev.altKey || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    if (ev.key === 'ArrowLeft' && scrollToTopEl.dataset.previous) {
        window.location.href = scrollToTopEl.dataset.previous;
    }
    if (ev.key === 'ArrowRight' && nextEl) nextEl.click();
}

function scrollToTop() {
    scrollAreaEl?.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('keydown', onKeyDown);
scrollToTopEl.addEventListener('click', scrollToTop);
