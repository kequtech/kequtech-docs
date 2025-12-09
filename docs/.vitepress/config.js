import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'KequTech Docs',
  description: 'Static documentation for your favorite libraries',
  base: '/kequtech-docs/',
  outDir: '../dist',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Getting Started', link: '/guide/getting-started' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kequtech/kequtech-docs' }
    ]
  }
})
