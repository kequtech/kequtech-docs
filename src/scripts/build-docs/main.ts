// scripts/build.ts
import { DIST_DIR, MD_DIR, PROJECTS } from '#constants.ts';
import type { Nav, Page } from '#types.ts';
import fsx from 'fs-extra';
import path from 'node:path';
import { buildNav } from './build-nav.ts';
import { parsePage } from './parse-page.ts';
import { renderHomeHtml, renderPagesHtml } from './render-html.ts';
import { renderSearch } from './render-search.ts';

export async function buildDocs() {
    await fsx.remove(DIST_DIR);
    await fsx.mkdirp(DIST_DIR);
    for (const key of Object.keys(PROJECTS)) {
        const filePaths = await walk(path.join(MD_DIR, key));
        const pages = await Promise.all(filePaths.map(parsePage));
        const nav = buildNav(pages);
        await writePages(key, pages, nav);
        await writeSearch(key, pages);
    }
    await writeHomePage();
}

async function writeSearch(key: string, pages: Page[]) {
    const outDir = path.join(DIST_DIR, key);
    const outFile = path.join(outDir, `search.json`);
    await fsx.mkdirp(outDir);
    const search = renderSearch(pages);
    await fsx.writeFile(outFile, search, 'utf8');
}

async function writeHomePage() {
    const outFile = path.join(DIST_DIR, 'index.html');
    const html = await renderHomeHtml();
    await fsx.writeFile(outFile, html, 'utf8');
}

async function writePages(key: string, pages: Page[], nav: Nav[]) {
    const result = await renderPagesHtml(key, pages, nav);
    for (const [outDir, html] of result) {
        const outFile = path.join(outDir, 'index.html');
        await fsx.mkdirp(outDir);
        await fsx.writeFile(outFile, html, 'utf8');
    }
}

async function walk(location: string): Promise<string[]> {
    const stat = await fsx.stat(location);
    if (!stat.isDirectory()) return [location];
    const entries = await fsx.readdir(location);
    return (await Promise.all(entries.map((name) => walk(path.join(location, name))))).flat();
}
