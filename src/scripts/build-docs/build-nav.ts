import type { Nav, Page } from '#types.ts';

export function buildNav(pages: Page[]): Nav[] {
    const nested = new Map<Page, Page[]>();
    for (const page of pages) {
        if (page.sidebar === false) continue;
        const segments = getSegments(page.route);
        if (segments.length > 2) continue;
        nested.set(page, []);
    }
    for (const page of pages) {
        if (page.sidebar === false) continue;
        const segments = getSegments(page.route);
        if (segments.length < 3) continue;
        const parentRoute = '/' + segments.slice(0, 2).join('/');
        const parentPage = pages.find((p) => p.route === parentRoute);
        if (parentPage && nested.has(parentPage)) {
            nested.get(parentPage)?.push(page);
        } else {
            nested.set(page, []); // hmm, no parent found
        }
    }
    return Array.from(nested.keys())
        .sort(sortPages)
        .map((parent) => ({
            title: parent.title,
            route: parent.route,
            children: (nested.get(parent) ?? []).sort(sortPages).map((child) => ({
                title: child.title,
                route: child.route,
            })),
        }));
}

function sortPages(a: Page, b: Page) {
    const ao = a.order ?? 9999;
    const bo = b.order ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.route.localeCompare(b.route);
}

function getSegments(route: string): string[] {
    return route.split('/').filter((s) => s.length > 0);
}
