# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

- Stack: SvelteKit (Svelte 5), Tailwind CSS v4, shadcn-svelte
- Output: fully static site via `@sveltejs/adapter-static`
- Markdown math pipeline: `mdsvex` + `remark-math` + `rehype-katex`
- Svelte math rendering helper: `$lib/components/math/math-expression.svelte`
- Interactive demos: `src/lib/components/math/*`
- WASM build script: `scripts/build-wasm.mjs`
- Post loading is intentionally split: metadata in `src/lib/content/posts.ts`, components in `src/lib/content/post-components.ts`

## Brand/Voice Defaults

- Keep the site title as **Mathnasium Journal**.
- Homepage language should be center/journal-focused (Mathnasium Lakeland Highlands), not “website feature demo” language.
- Prefer clear, family/student-friendly copy over product-style buzzwords.

## Important Paths

- `src/content/posts/*.md`: blog posts (frontmatter + markdown + optional embedded Svelte)
- `src/lib/content/posts.ts`: post metadata index + frontmatter validation + sorting (no markdown component imports)
- `src/lib/content/post-components.ts`: markdown component loader used by slug pages only
- `src/routes/posts/+page.svelte`: all-post listing
- `src/routes/posts/[slug]/+page.ts`: slug resolution + prerender entries
- `src/routes/posts/[slug]/+page.svelte`: post shell renderer
- `src/lib/components/blog/*`: featured/post cards and article shell
- `src/lib/components/math/*`: reusable math visualizations
- `static/wasm/*`: wasm binaries served as static assets
- `.github/workflows/deploy-pages.yml`: GitHub Pages CI/CD

## Non-Negotiable Math Rules

- Markdown equations:
  - Inline: `$...$`
  - Block: `$$...$$`
- Equations inside `.svelte` files must use `MathExpression` for TeX rendering. Do not leave TeX/plain equation strings unrendered in UI text.
- If an equation appears on the page, it should render as math (KaTeX), not raw TeX.
- For SVG/plain text labels in diagrams, use symbols when appropriate (`θ`, `°`) rather than words like `theta` / `deg`.
- For embedded iframes in markdown, include a descriptive `title` attribute (accessibility).

## Routing/Base Path Rules

- This project deploys to GitHub Pages under `/blog`.
- Do not hardcode internal route hrefs as raw `/...` in components:
  - Use `resolve('/route')` from `$app/paths` for app routes.
- For static assets that must respect base path (e.g. runtime fetches), use `$app/paths` `base` (e.g. ``${base}/wasm/...``).
- If behavior could differ in deployment, validate with `BASE_PATH=/blog npm run build`.

## Center Link Conventions

- Canonical center URL:
  - `https://www.mathnasium.com/math-centers/lakelandhighlands`
- Homepage hero badge (“Mathnasium Lakeland Highlands” with `MapPin`) should link to the center URL.
- Header should expose center access via the top-right `Center` button.
- Footer should keep a direct scheduling CTA to the same center URL.

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
- Avoid clutter text overlays directly inside plots unless they add clear value.
- Keep hover states subtle and coherent with the header style; avoid jarring hue shifts.

## Local Commands

- Install deps: `npm install`
- Dev server: `npm run dev`
- Svelte/type checks: `npm run check`
- Production build: `npm run build`
- Preview static output: `npm run preview`

Notes:
- `predev` and `prebuild` run `npm run build:wasm` automatically.
- Preserve static compatibility; avoid server-only logic for post rendering.
- GitHub Pages deploy job sets `BASE_PATH=/blog`.

## Performance Defaults

- Keep `src/lib/content/posts.ts` metadata-only:
  - Use `import.meta.glob('/src/content/posts/*.md', { eager: true, import: 'metadata' })`.
  - Do not import markdown component `default` exports here.
- Keep markdown component loading in `src/lib/content/post-components.ts` and only consume it from `src/routes/posts/[slug]/+page.svelte`.
- Homepage "Interactive Spotlight" should mount only the active tab panel's heavy visual component.
  - Current implementation uses `spotlightTab` and conditional `{#if ...}` blocks around each `TabsContent`.
- For new heavy interactive sections (canvas/animation/continuous effects), prefer conditional mount over always-mounted hidden panels.

## Optional WASM Workflow

- Keep WASM optional and additive; core post rendering should still work without WASM.
- Source files live in `src/lib/wasm/*.wat`; compiled binaries are emitted to `static/wasm/*.wasm`.
- Compile with:
  - `npm run build:wasm` (manual)
  - or rely on `predev` / `prebuild` hooks.
- In Svelte components, fetch binaries with base-path awareness:
  - `fetch(\`${base}/wasm/<module>.wasm\`)` using `$app/paths`.
- Load WASM in `onMount` and provide a JavaScript fallback path for resilience.

## Agent Workflow

- Prefer small, focused edits over broad refactors.
- Do not edit generated output (`build/`, `.svelte-kit/`, `node_modules/`).
- For every `.svelte` change:
  - Run `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5`
  - Then run `npm run check`
- For substantial or cross-page changes, also run `npm run build` before finishing.

## Homepage Defaults

- Featured post should be explicitly controlled with frontmatter (`featured: true`) and only one post should be featured at a time.
- “Interactive Spotlight” currently highlights:
  - `Patterns` (Lissajous)
  - `Hexagon Area` (three unit circles visualization)

## Post Iteration Flow With User

For blog-post requests, follow this interaction flow by default:

1. Start from high-level intent.
   - Ask for or infer the post concept, audience level, and desired visuals.
   - Confirm the main mathematical objective before writing details.
2. Scaffold first, then narrate where to edit.
   - Create the post skeleton in the background: `src/content/posts/<slug>.md` with valid frontmatter, equation, tags, and initial structure.
   - Ensure route compatibility is in place through the existing post loader flow (`src/lib/content/posts.ts`, `src/lib/content/post-components.ts`, slug page, listing pages) so the new post renders without extra manual steps.
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

## Skills

Use these repo-local skills when their triggers match user requests:

- `create-blog-post`: Scaffold and iterate new Mathnasium Journal blog posts with valid frontmatter/math conventions and the existing route flow.
  - File: `skills/create-blog-post/SKILL.md`
