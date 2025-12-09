import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'KequTech Docs',
    description: 'Static documentation for your favorite libraries',
    // Use root-relative base by default (works for custom domains and user/org pages)
    // For GitHub Pages project sites, set BASE_PATH to the repository name path (e.g. '/kequtech-docs/')
    base: process.env.BASE_PATH || '/',
    outDir: '../dist',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/' },
        ],
        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Introduction', link: '/guide/' },
                    { text: 'Getting Started', link: '/guide/getting-started' },
                ],
            },
        ],
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/kequtech/kequtech-docs',
            },
        ],
    },
});
