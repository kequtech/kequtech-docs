import { DIST_DIR, MUSTACHE_DIR, PROJECTS } from '#constants.ts';
import type { Nav, Page, PageHeading, Project } from '#types.ts';
import fsx from 'fs-extra';
import { marked } from 'marked';
import Mustache from 'mustache';
import path from 'node:path';

const BUILD_TIME = Date.now();

export async function renderPagesHtml(
    key: string,
    pages: Page[],
    nav: Nav[],
): Promise<[string, string][]> {
    const [baseTemplate, layoutTemplate] = await Promise.all([
        getMustache('base.mustache'),
        getMustache('page.mustache'),
    ]);
    const project = PROJECTS[key];
    const routes = nav.reduce<string[]>((acc, cur) => {
        acc.push(cur.route, ...cur.children.map((child) => child.route));
        return acc;
    }, []);
    return await Promise.all(
        pages.map(async (page, i) => {
            const content = await marked.parse(page.content);
            const html = Mustache.render(baseTemplate, {
                title: `${project.name} - ${page.title}`,
                description: page.description,
                buildTime: BUILD_TIME,
                colors: renderColors(project),
                layout: Mustache.render(layoutTemplate, {
                    key,
                    page,
                    project,
                    sidebar: renderSidebar(nav, page.route),
                    toc: renderToc(page.headings),
                    content: content.trim(),
                    previous: getRouteAt(routes, page, -1),
                    next: getRouteAt(routes, page, 1),
                }).trim(),
            });
            const outDir = path.join(DIST_DIR, page.route);
            return [outDir, html];
        }),
    );
}

export async function renderHomeHtml(): Promise<string> {
    const [baseTemplate, layoutTemplate] = await Promise.all([
        getMustache('base.mustache'),
        getMustache('home.mustache'),
    ]);
    const html = Mustache.render(baseTemplate, {
        title: `Kequtech Documentation`,
        description: `Static documentation for your favorite libraries.`,
        buildTime: BUILD_TIME,
        layout: Mustache.render(layoutTemplate, {
            projects: Object.keys(PROJECTS).map(renderProject),
        }).trim(),
    });
    return html;
}

function renderProject(key: string) {
    const { name, background, primary } = PROJECTS[key];
    return {
        key,
        name,
        background: `background-color:${background ?? 'var(--color-background)'};`,
        primary: `color:${primary ?? 'var(--color-primary)'};`,
    };
}

async function getMustache(template: string): Promise<string> {
    return fsx.readFile(path.join(MUSTACHE_DIR, template), 'utf8');
}

function getRouteAt(
    routes: string[],
    page: Page,
    offset: number,
): string | undefined {
    // circular navigation last to first and first to last
    const found = routes.indexOf(page.route);
    if (found === -1) return;
    const targetIndex = (found + offset + routes.length) % routes.length;
    return routes[targetIndex];
}

function renderSidebar(nav: Nav[], route: string): string {
    const lines = ['<ul class="sidebar">'];
    for (const node of nav) {
        const liParentClass = renderLiClass(
            node.route === route,
            node.children.some((child) => child.route === route),
        );
        lines.push(
            `<li${liParentClass}>`,
            `<a href="${node.route}/">${node.title}</a>`,
        );
        if (node.children.length > 0) {
            lines.push('<ul>');
            for (const child of node.children) {
                const liClass = renderLiClass(child.route === route);
                lines.push(
                    `<li${liClass}>`,
                    `<a href="${child.route}/">${child.title}</a></li>`,
                );
            }
            lines.push('</ul>');
        }
        lines.push('</li>');
    }
    lines.push('</ul>');
    return lines.join('\n');
}

function renderLiClass(isCurrent: boolean, isParentCurrent = false) {
    if (isCurrent) return ' class="is-current"';
    if (isParentCurrent) return ' class="is-parent-current"';
    return '';
}

function renderColors({ primary, background }: Project) {
    if (!primary && !background) return;
    return [
        ':root {',
        primary ? `--color-primary: ${primary};` : undefined,
        background ? `--color-background: ${background};` : undefined,
        '}',
    ]
        .filter(Boolean)
        .join('\n');
}

function renderToc(headings: PageHeading[]): string {
    if (headings.length === 0) return '';
    const lines = ['<ul class="toc">'];
    const stack: number[] = [];
    for (const heading of headings) {
        while (stack.length > 0 && stack[stack.length - 1] >= heading.level) {
            lines.push('</li>', '</ul>');
            stack.pop();
        }
        lines.push('<li>', `<a href="#${heading.id}">${heading.text}</a>`);
        lines.push('<ul>');
        stack.push(heading.level);
    }
    while (stack.length > 0) {
        lines.push('</li>', '</ul>');
        stack.pop();
    }
    lines.push('</ul>');
    return lines.join('\n');
}
