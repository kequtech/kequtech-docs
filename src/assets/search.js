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
function getElementAll(el, selectors) {
  return Array.from(el?.querySelectorAll(selectors) ?? []);
}
function clickOutside(root, onOutside) {
  function handler(ev) {
    if (!(ev.target instanceof HTMLElement) || !root.contains(ev.target)) {
      onOutside();
      document.removeEventListener("pointerdown", handler, true);
    }
  }
  document.addEventListener("pointerdown", handler, true);
  return () => document.removeEventListener("pointerdown", handler, true);
}

// src/client/utils/http.ts
async function http(method, location, data) {
  if (method === "POST" || method === "PUT") {
    return await fetchJson(method, location, buildBody(data));
  } else {
    return await fetchJson(method, buildUrl(location, data));
  }
}
function buildBody(data) {
  return data ? JSON.stringify(data) : void 0;
}
function buildUrl(location, data) {
  if (!data) return location;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === void 0) continue;
    params.set(key, value instanceof Date ? value.toISOString() : String(value));
  }
  return location + (params.size > 0 ? `?${params}` : "");
}
async function fetchJson(method, location, body) {
  const options = method === "GET" ? void 0 : {
    method,
    headers: { "Content-Type": "application/json" },
    body
  };
  const response = await fetch(location, options);
  if (!response.ok)
    throw new Error(`Failed to ${method} data at ${location}: ${response.statusText}`);
  return await response.json();
}

// src/client/search.ts
var selectedIndex = -1;
var promise;
async function getSearchIndex(key) {
  promise = promise ?? http("GET", `/${key}/search.json`);
  return await promise;
}
async function search(key, query) {
  const index = await getSearchIndex(key);
  const found = [];
  for (const page of index) {
    if (page.title.toLowerCase().includes(query)) {
      found.push({
        title: formatContent(page.title, query),
        route: page.route,
        content: formatContent(page.sections[0].content, query),
        order: 0
      });
      continue;
    }
    for (const section of page.sections) {
      if (section.title.toLowerCase().includes(query)) {
        found.push({
          title: formatContent(page.title, query),
          route: page.route,
          content: formatContent(section.title, query),
          order: 1
        });
        break;
      }
      const contentIndex = section.content.toLowerCase().indexOf(query);
      const wordIndex = contentIndex > 0 ? section.content.lastIndexOf(" ", contentIndex - 1) + 1 : 0;
      if (contentIndex > -1) {
        found.push({
          title: formatContent(page.title, query),
          route: page.route,
          content: formatContent(section.content, query, wordIndex),
          order: 2
        });
        break;
      }
    }
  }
  return found.sort((a, b) => a.order - b.order).slice(0, 8);
}
function formatContent(content, query, startIndex = 0) {
  return content.substring(startIndex, startIndex + 100).replace(
    new RegExp(query, "gi"),
    (match) => `<span class="highlight">${match}</span>`
  ).trim();
}
var searchContainerEl = getElementById("search-container", false);
if (searchContainerEl) {
  let onFocus = function() {
    getSearchIndex(key);
  }, close = function() {
    searchResultsEl.classList.add("hidden");
    isOpen?.();
    isOpen = void 0;
  }, clearSearch = function() {
    inputEl.value = "";
    close();
    inputEl.blur();
    selectedIndex = -1;
  }, updateSelectedResult = function() {
    getElementAll(searchResultsEl, "a").forEach((result, index) => {
      if (index === selectedIndex) {
        result.classList.add("is-hovered");
      } else {
        result.classList.remove("is-hovered");
      }
    });
  };
  onFocus2 = onFocus, close2 = close, clearSearch2 = clearSearch, updateSelectedResult2 = updateSelectedResult;
  const inputEl = getElement(searchContainerEl, "input");
  const searchResultsEl = getElementById("search-results");
  const key = inputEl.dataset.key || "";
  let isOpen = void 0;
  async function onInput() {
    const query = inputEl.value.toLowerCase();
    const results = await search(key, query);
    if (query.length < 2) {
      close();
      return;
    }
    searchResultsEl.innerHTML = results.map(renderSearchResult).join("\n");
    searchResultsEl.classList.remove("hidden");
    if (searchContainerEl)
      isOpen ?? (isOpen = clickOutside(searchContainerEl, clearSearch));
    selectedIndex = -1;
  }
  async function onKeydown(ev) {
    if (!isOpen) return;
    const results = getElementAll(searchResultsEl, "a");
    const resultsCount = results.length;
    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();
        selectedIndex = (selectedIndex + 1) % resultsCount;
        updateSelectedResult();
        break;
      case "ArrowUp":
        ev.preventDefault();
        selectedIndex = (selectedIndex - 1 + resultsCount) % resultsCount;
        updateSelectedResult();
        break;
      case "Enter":
        ev.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < resultsCount) {
          results[selectedIndex].click();
        }
        break;
      case "Escape":
        clearSearch();
        break;
    }
  }
  inputEl.addEventListener("focus", onFocus);
  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("keydown", onKeydown);
}
var onFocus2;
var close2;
var clearSearch2;
var updateSelectedResult2;
function renderSearchResult(result) {
  return `<a href="${result.route}" class="search-result">
<div class="title">${result.title}</div>
<div class="snippet">${result.content}</div>
</a>`;
}
