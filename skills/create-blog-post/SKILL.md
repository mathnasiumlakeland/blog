---
name: create-blog-post
description: Create and iterate Mathnasium Journal posts in this SvelteKit repo. Use when the user asks to scaffold a new blog post, revise an existing post in `src/content/posts/*.md`, fix or add required frontmatter fields, add math explanations, or refine interactive math embeds while preserving compatibility with the post listing and slug routes.
---

# Create Blog Post

Create or refine markdown posts that publish cleanly through the existing post pipeline and match Mathnasium Journal voice.

## Execution Flow

1. Confirm objective and audience.
- Capture topic, audience level, and the main mathematical learning outcome.
- Keep writing center-friendly and family/student-focused.

2. Choose the path.
- If creating a new post, add `src/content/posts/<slug>.md` using lowercase kebab-case.
- If revising a post, edit the existing markdown file first; change Svelte components only when needed for visuals or interactivity.

3. Enforce required frontmatter.
- Keep all required keys present and valid:

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

- Keep `publishedAt` as `YYYY-MM-DD`.
- Keep `equation` present because cards and previews consume it.
- Keep only one post with `featured: true` across all posts.

4. Draft or revise body content.
- Use short sections with clear headings.
- Explain ideas in approachable language first, then notation.
- Render math in markdown as `$...$` for inline and `$$...$$` for block equations.
- Include a descriptive `title` attribute on embedded iframes.

5. Apply math rendering and visualization rules.
- If `svelte-code-writer` is installed, use that skill for any `.svelte`, `.svelte.ts`, or `.svelte.js` creation, editing, or analysis.
- If `create-component` is installed and the post needs a new or updated visualization, use it to build/refine the tool in `src/lib/components/math/*`, add `toolMeta` metadata, and register it in `src/lib/components/math/tool-registry.ts` before embedding it in the post.
- Do not leave raw TeX strings visible in `.svelte` UI text; render equations with `MathExpression`.
- Reuse or update components in `src/lib/components/math/*`.
- Keep geometry precise, responsive, and readable.
- Use symbols such as `θ` and `°` in diagram labels when appropriate.

6. Validate before handoff.
- Confirm the post resolves through `src/lib/content/posts.ts` and `src/routes/posts/[slug]/*`.
- Run `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5` for every touched `.svelte` file.
- Run `npm run check` after Svelte edits.
- Run `npm run build` for substantial or cross-page changes.

## Response Contract

- State exactly which markdown file was created or updated.
- If no routes/components changed, say so explicitly.
- After scaffolding, hand control back for iteration and offer focused follow-up passes:
  section rewrites, notation cleanup, visual upgrades, and rendering fixes.
