# kequtech-docs

Static documentation for your favorite libraries

## Overview

This repository contains the documentation website presented at https://docs.kequtech.com/ automatically deployed by GitHub Pages.

## Getting Started

### Prerequisites

- Node.js 23.6+ installed
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

The site will be available at `http://localhost:4173`

### Building for Production

To build the static site:

```bash
npm run build
```

This generates static HTML files in the `./dist` directory.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

## Adding Content

### Creating New Pages

1. Add markdown files in the `src/md/` directory
2. Include headers at the top of each markdown file for title description and order

Example:
```md
---
title: "Conclusion"
description: "Where to go next, and how to extend Arbor."
order: 99
---

Markdown content goes here.
```

### Configuration

You can specify port with the `PORT` environment variable when running the development server.

Example:
```bash
PORT=8080 npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/my-feature`)
6. Open a Pull Request

Or, ya knows, just open an issue.

## License

ISC
