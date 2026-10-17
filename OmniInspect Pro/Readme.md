# OmniInspect Pro — Client-Side Website & HTML Analyzer

**OmniInspect Pro** is a 100% free, zero-backend web application built with vanilla HTML, CSS, and JavaScript. Give it any website URL (or raw `.html` source file), and it automatically inspects and visualizes the site's HTML DOM architecture, detected tech stack, typography/fonts, images/SVGs, and SEO metadata directly in the browser.

## Key Features

- **Multi-Engine Free CORS Fetch Waterfall**: Automatically cycles through four free CORS proxy engines (`AllOrigins`, `CodeTabs`, `CorsProxy.io`, and direct `fetch`) with smart fallback snapshots and raw HTML paste/file upload support.
- **Tech Stack & Framework Fingerprinting**: Detects 30+ frameworks, UI libraries, CMS platforms, analytics tools, and CDNs (Next.js, React, Vue, Astro, Tailwind CSS, Bootstrap, Three.js, GSAP, Shopify, WordPress, Stripe, and more) via script URLs, DOM attributes, and meta generators.
- **HTML Tag Breakdown & Interactive DOM Explorer**: Counts and categorizes every HTML element, audits HTML5 semantic landmarks (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`), outlines the `<h1>`–`<h6>` hierarchy, and renders a collapsible DOM tree.
- **Typography, Fonts & Color Tokens**: Extracts Google/Webfont CDN links, `@font-face` declarations, CSS `font-family` stacks, `--css-variables`, and hex color swatches with live interactive font preview cards.
- **Images, Inline SVGs & Media Audit**: Previews inline `<svg>` vectors, resolves relative `<img>` URLs, checks `loading="lazy"` attributes, and flags missing `alt` text for accessibility compliance.
- **SEO, OpenGraph & Link Inspector**: Simulates Google SERP snippets and OpenGraph social cards while auditing internal vs. external anchor links (`<a>`).
- **1-Click Export**: Export the full inspection data as a `.json` report or copy a formatted Markdown audit summary to your clipboard.

## Tech Stack

| Layer | Technology Used |
| :--- | :--- |
| **Core Markup & Logic** | HTML5, CSS3, Vanilla JavaScript (ES2022+) |
| **HTML Parsing Engine** | Browser Native `DOMParser` API (`text/html` inert AST) |
| **Styling & UI** | Tailwind CSS (CDN) + Custom Glassmorphism CSS |
| **Charts & Visualization** | Chart.js v4.4 |
| **Icons** | Lucide Icons |

## Quick Start

Because OmniInspect Pro is a self-contained single-file web application, no build step or `npm install` is required:

1. Clone or download this repository.
2. Open `website_analyzer.html` (or `index.html`) directly in any modern web browser, or serve it locally:
   ```bash
   npx serve .
   ```
3. Enter any website URL and click **Analyze Website**, choose one of the built-in architecture presets, or switch to **Paste Raw HTML / Upload File** to inspect local markup.

## Project Structure

```text
├── website_analyzer.html   # Complete self-contained application (HTML + CSS + JS)
└── README.md               # Project documentation
```

## License

Released under the **MIT License**. Free for personal, educational, and commercial use.
