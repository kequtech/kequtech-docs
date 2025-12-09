import type { SearchEntry } from '../types.ts';
import {
    clickOutside,
    getElement,
    getElementAll,
    getElementById,
} from './utils/elements.ts';
import { http } from './utils/http.ts';

interface SearchResult {
    title: string;
    route: string;
    content: string;
    order: number;
}

let selectedIndex = -1;
let promise: Promise<SearchEntry[]> | undefined;
async function getSearchIndex(key: string) {
    promise = promise ?? http<SearchEntry[]>('GET', `/${key}/search.json`);
    return await promise;
}

async function search(key: string, query: string) {
    const index = await getSearchIndex(key);
    const found: SearchResult[] = [];
    for (const page of index) {
        if (page.title.toLowerCase().includes(query)) {
            found.push({
                title: formatContent(page.title, query),
                route: page.route,
                content: formatContent(page.sections[0].content, query),
                order: 0,
            });
            continue;
        }
        for (const section of page.sections) {
            if (section.title.toLowerCase().includes(query)) {
                found.push({
                    title: formatContent(page.title, query),
                    route: page.route,
                    content: formatContent(section.title, query),
                    order: 1,
                });
                break;
            }
            const contentIndex = section.content.toLowerCase().indexOf(query);
            const wordIndex =
                contentIndex > 0
                    ? section.content.lastIndexOf(' ', contentIndex - 1) + 1
                    : 0;
            if (contentIndex > -1) {
                found.push({
                    title: formatContent(page.title, query),
                    route: page.route,
                    content: formatContent(section.content, query, wordIndex),
                    order: 2,
                });
                break;
            }
        }
    }
    return found.sort((a, b) => a.order - b.order).slice(0, 8);
}

function formatContent(content: string, query: string, startIndex = 0) {
    return content
        .substring(startIndex, startIndex + 100)
        .replace(
            new RegExp(query, 'gi'),
            (match) => `<span class="highlight">${match}</span>`,
        )
        .trim();
}

const searchContainerEl = getElementById('search-container', false);
if (searchContainerEl) {
    const inputEl = getElement<HTMLInputElement>(searchContainerEl, 'input');
    const searchResultsEl = getElementById('search-results');
    const key = inputEl.dataset.key || '';
    let isOpen: (() => void) | undefined = undefined;

    function onFocus() {
        getSearchIndex(key);
    }

    async function onInput() {
        const query = inputEl.value.toLowerCase();
        const results = await search(key, query);
        if (query.length < 2) {
            close();
            return;
        }
        searchResultsEl.innerHTML = results.map(renderSearchResult).join('\n');
        searchResultsEl.classList.remove('hidden');
        if (searchContainerEl)
            isOpen ??= clickOutside(searchContainerEl, clearSearch);
        selectedIndex = -1;
    }

    function close() {
        searchResultsEl.classList.add('hidden');
        isOpen?.();
        isOpen = undefined;
    }

    function clearSearch() {
        inputEl.value = '';
        close();
        inputEl.blur();
        selectedIndex = -1;
    }

    function updateSelectedResult() {
        getElementAll(searchResultsEl, 'a').forEach((result, index) => {
            if (index === selectedIndex) {
                result.classList.add('is-hovered');
            } else {
                result.classList.remove('is-hovered');
            }
        });
    }

    async function onKeydown(ev: KeyboardEvent) {
        const results = getElementAll(searchResultsEl, 'a');
        const resultsCount = results.length;

        switch (ev.key) {
            case 'ArrowDown':
                ev.preventDefault();
                selectedIndex = (selectedIndex + 1) % resultsCount;
                updateSelectedResult();
                break;
            case 'ArrowUp':
                ev.preventDefault();
                selectedIndex =
                    (selectedIndex - 1 + resultsCount) % resultsCount;
                updateSelectedResult();
                break;
            case 'Enter':
                ev.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < resultsCount) {
                    results[selectedIndex].click();
                }
                break;
            case 'Escape':
                clearSearch();
                break;
        }
    }

    inputEl.addEventListener('focus', onFocus);
    inputEl.addEventListener('input', onInput);
    inputEl.addEventListener('keydown', onKeydown);
}

function renderSearchResult(result: SearchResult) {
    return `<a href="${result.route}" class="search-result">
<div class="title">${result.title}</div>
<div class="snippet">${result.content}</div>
</a>`;
}
