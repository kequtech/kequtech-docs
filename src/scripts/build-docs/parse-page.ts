import { MD_DIR } from '#constants.ts';
import type { Page, PageHeading } from '#types.ts';
import fsx from 'fs-extra';
import matter from 'gray-matter';
import path from 'node:path';

export async function parsePage(filePath: string): Promise<Page> {
    const raw = await fsx.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    if (!data.title) throw new Error(`Missing title in ${filePath}`);
    const rel = path.relative(MD_DIR, filePath).replace(/\.md$/, ''); // kequapp/getting-started
    return {
        route: trimIndex(rel),
        title: data.title,
        description: data.description,
        order: data.order,
        sidebar: data.sidebar !== false,
        exports: data.exports ?? [],
        content,
        headings: getHeadings(content),
    };
}

function trimIndex(route: string): string {
    const segments = route.split(path.sep);
    const last = segments[segments.length - 1];
    if (last === 'index') return '/' + segments.slice(0, -1).join('/');
    return '/' + segments.join('/');
}

function getHeadings(content: string): PageHeading[] {
    const matches = content.matchAll(/^(#{2,3})\s+(.*)$/gm);
    return Array.from(matches).map((match) => {
        const level = match[1].length; // number of #
        const text = match[2].trim();
        const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
        return { id, level, text };
    });
}
