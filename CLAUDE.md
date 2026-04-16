# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — local dev server (also `make dev`; `dev:network` to bind to LAN)
- `npm run build` — runs `astro check` (type-check) then `astro build`
- `npm run preview` — serve the built site
- `npm run lint` / `npm run lint:fix` — ESLint over the repo

There is no test suite.

## Writing conventions

Default to American English for all prose, titles, slugs, and filenames (e.g. "behavior", not "behaviour").

## Architecture

Astro 5 static site published to GitHub Pages at `https://douglasswng.github.io` (see `astro.config.mjs`). Uses the `@astrojs/mdx`, `sitemap`, and `tailwind` integrations. Tailwind + `@tailwindcss/typography` handle styling; `src/styles/` and `tailwind.config.mjs` hold config.

### Content collection

Blog posts live in [src/content/blog/](src/content/blog/) as folders containing an `index.md`/`.mdx`. Schema in [src/content/config.ts](src/content/config.ts): `title`, `date`, optional `topics[]`, optional `status`. Each post's folder name becomes its slug.

### Routing

- [src/pages/[...slug].astro](src/pages/[...slug].astro) renders every blog entry at the site root (so `content/blog/push-T` → `/push-T`). There is no `/blog` prefix.
- [src/pages/index.astro](src/pages/index.astro) is the home page.
- [src/pages/rss.xml.ts](src/pages/rss.xml.ts) and `robots.txt.ts` generate feed/robots.
- `src/pages/projects/` and `src/pages/work/` exist but are currently empty.

### Markdown pipeline

Configured in [astro.config.mjs](astro.config.mjs):
- `remark-math` + `rehype-mathjax` for LaTeX (note: `rehype-katex` is installed but **mathjax** is the one wired up).
- [src/lib/remark-wiki-link.mjs](src/lib/remark-wiki-link.mjs) — custom remark plugin that rewrites Obsidian-style `[[Page Name]]` into `/page-name` links (lowercased, spaces → hyphens). When adding wiki links, the target slug must match an existing post folder name under that transform.

### Layout / components

Single layout [src/layouts/PageLayout.astro](src/layouts/PageLayout.astro) wraps pages; shared UI in [src/components/](src/components/) (`Head`, `Header`, `Footer`, `Container`, `ArrowCard`, `FormattedDate`, `Link`, `BackToPrev`). Path aliases `@components`, `@layouts`, `@lib` are used in imports (configured via Astro defaults / tsconfig).

Helpers in [src/lib/utils.ts](src/lib/utils.ts): `readingTime` and `extractOverview` (used for post metadata/description).

Site-wide constants (name, nav links, etc.) live in [src/consts.ts](src/consts.ts).
