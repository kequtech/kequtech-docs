export interface Project {
    name: string;
    npm?: string;
    github?: string;
    background?: string;
    primary?: string;
}

export interface PageHeading {
    id: string;
    level: number;
    text: string;
}

export interface Page {
    route: string; // "/kequapp/getting-started"
    title: string;
    description?: string;
    order?: number;
    sidebar?: boolean;
    exports?: string[];
    content: string;
    headings: PageHeading[];
}

export interface Nav {
    title: string;
    route: string;
    children: { title: string; route: string }[];
}

export interface SearchEntrySection {
    title: string;
    content: string;
}

export interface SearchEntry {
    title: string;
    route: string;
    sections: SearchEntrySection[];
}
