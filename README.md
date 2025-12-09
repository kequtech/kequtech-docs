# kequtech-docs

Static documentation for your favorite libraries

## Overview

This repository contains a documentation website built with [VitePress](https://vitepress.dev/) and automatically deployed to GitHub Pages.

## Features

- 📝 **VitePress**: Fast, modern documentation framework
- 🚀 **Automatic Deployment**: Deploys to GitHub Pages on every push to `main`
- 🎨 **Beautiful UI**: Clean, responsive design with dark mode support
- 🔍 **Search**: Built-in search functionality
- ⚡ **Fast**: Optimized static site generation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/kequtech/kequtech-docs.git
cd kequtech-docs
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### Building for Production

To build the static site:

```bash
npm run build
```

This generates static HTML files in the `./dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### GitHub Pages Setup

To enable GitHub Pages deployment:

1. Go to your repository Settings
2. Navigate to Pages (under Code and automation)
3. Under "Build and deployment":
   - Source: Select "GitHub Actions"
4. The workflow will automatically run on the next push to `main`

The deployment workflow is defined in `.github/workflows/deploy.yml` and will:
1. Check out the code
2. Set up Node.js
3. Install dependencies with `npm ci`
4. Run `npm run build` to generate static files
5. Deploy the `./dist` directory to GitHub Pages

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── docs/
│   ├── .vitepress/
│   │   └── config.js           # VitePress configuration
│   ├── guide/
│   │   ├── index.md            # Guide introduction
│   │   └── getting-started.md  # Getting started guide
│   └── index.md                # Home page
├── .gitignore
├── package.json
└── README.md
```

## Adding Content

### Creating New Pages

1. Add markdown files in the `docs/` directory
2. Update the sidebar configuration in `docs/.vitepress/config.js`
3. Commit and push to see your changes live

Example:
```bash
# Create a new documentation page
touch docs/my-new-page.md

# Edit the file with your content
# Update docs/.vitepress/config.js to add it to the navigation
```

### Configuration

Edit `docs/.vitepress/config.js` to customize:
- Site title and description
- Navigation menu
- Sidebar structure
- Theme settings
- Social links

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/my-feature`)
6. Open a Pull Request

## License

ISC
