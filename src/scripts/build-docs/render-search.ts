import type { Page, SearchEntry, SearchEntrySection } from '#types.ts';
import removeMarkdown from 'remove-markdown';

export function renderSearch(pages: Page[]) {
    const output: SearchEntry[] = pages.map((page) => ({
        title: page.title,
        route: page.route,
        sections: extractSections(page.title, page.content),
    }));
    return JSON.stringify(output);
}

// strip markdown from the page content
// collate text into sections based on headings
function extractSections(title: string, content: string): SearchEntrySection[] {
    const sections: SearchEntrySection[] = [];
    const lines = content.split('\n');
    let current = { title, lines: [] as string[] };
    function pushCurrentSection() {
        if (!current.lines.length) return;
        const text = removeMarkdown(current.lines.join('\n'));
        sections.push({
            title: current.title,
            content: text.replace(/\s+/g, ' ').trim(),
        });
    }
    for (const line of lines) {
        // only match letters and numbers after hashes for headings
        const match = line.match(/^(#{2,6})\s+(\w.+)$/);
        if (match) {
            pushCurrentSection();
            current = { title: match[2], lines: [] };
        } else if (current) {
            current.lines.push(line.trim());
        }
    }
    pushCurrentSection();
    return sections;
}
