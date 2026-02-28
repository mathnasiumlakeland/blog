# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

- Stack: SvelteKit (Svelte 5), Tailwind CSS v4, shadcn-svelte
- Output: fully static site via `@sveltejs/adapter-static`
- Markdown math pipeline: `mdsvex` + `remark-math` + `rehype-katex`
- Svelte math rendering helper: `$lib/components/math/math-expression.svelte`
- Interactive demos: `src/lib/components/math/*`
- WASM build script: `scripts/build-wasm.mjs`

## Important Paths

- `src/content/posts/*.md`: blog posts (frontmatter + markdown + optional embedded Svelte)
- `src/lib/content/posts.ts`: post index + frontmatter validation + sorting
- `src/routes/posts/+page.svelte`: all-post listing
- `src/routes/posts/[slug]/+page.ts`: slug resolution + prerender entries
- `src/routes/posts/[slug]/+page.svelte`: post shell renderer
- `src/lib/components/blog/*`: featured/post cards and article shell
- `src/lib/components/math/*`: reusable math visualizations
- `static/wasm/*`: wasm binaries served as static assets

## Non-Negotiable Math Rules

- Markdown equations:
  - Inline: `$...$`
  - Block: `$$...$$`
- Equations inside `.svelte` files must use `MathExpression` for TeX rendering. Do not leave TeX/plain equation strings unrendered in UI text.
- If an equation appears on the page, it should render as math (KaTeX), not raw TeX.
- For SVG/plain text labels in diagrams, use symbols when appropriate (`θ`, `°`) rather than words like `theta` / `deg`.

## Blog Post Frontmatter Contract

Every file in `src/content/posts/*.md` must include:

```yaml
---
title: "Post title"
subtitle: "Short subtitle"
excerpt: "Card summary text"
publishedOn: "March 1, 2026"
publishedAt: "2026-03-01"
readTime: "6 min"
tags:
  - algebra
  - geometry
equation: "x^2 + y^2 = r^2"
featured: false
---
```

Notes:
- `publishedAt` must remain ISO (`YYYY-MM-DD`) for sort stability.
- `equation` is required and is used in featured cards and post previews.

## Visual/Interaction Guidance

- Keep visualizations responsive (`viewBox` + fluid width).
- Prefer clean geometry, readable labels, and sliders with meaningful ranges.
- Keep style consistent with existing cards, borders, and soft blue/teal visual language.
- For geometry demos, make sure highlights represent the intended region/angle precisely.

## Local Commands

- Install deps: `npm install`
- Dev server: `npm run dev`
- Svelte/type checks: `npm run check`
- Production build: `npm run build`
- Preview static output: `npm run preview`

Notes:
- `predev` and `prebuild` run `npm run build:wasm` automatically.
- Preserve static compatibility; avoid server-only logic for post rendering.

## Agent Workflow

- Prefer small, focused edits over broad refactors.
- Do not edit generated output (`build/`, `.svelte-kit/`, `node_modules/`).
- For every `.svelte` change:
  - Run `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5`
  - Then run `npm run check`
- For substantial or cross-page changes, also run `npm run build` before finishing.

## Post Iteration Flow With User

For blog-post requests, follow this interaction flow by default:

1. Start from high-level intent.
   - Ask for or infer the post concept, audience level, and desired visuals.
   - Confirm the main mathematical objective before writing details.
2. Scaffold first, then narrate where to edit.
   - Create the post skeleton in the background: `src/content/posts/<slug>.md` with valid frontmatter, equation, tags, and initial structure.
   - Ensure route compatibility is in place through the existing post loader flow (`src/lib/content/posts.ts`, slug page, listing pages) so the new post renders without extra manual steps.
   - Explicitly tell the user which markdown file was created/updated.
3. Hand control back for content iteration.
   - Tell the user they can edit the markdown directly however they want.
   - Offer fast iteration passes on demand: section rewrites, notation cleanup, visual upgrades, slider behavior, and rendering fixes.
4. Refine visuals in tight loops.
   - When asked for better visuals, make focused updates in `src/lib/components/math/*` and embed them in the post.
   - Keep geometry faithful and labels readable; use `θ`/`°` notation in figure labels.
5. Validate every iteration.
   - Run `svelte-autofixer` for touched `.svelte` files, then `npm run check`.
   - Run `npm run build` when changes are substantial or affect multiple pages.
