---
name: create-component
description: Create and iterate reusable Mathnasium math-tool components in this SvelteKit repo. Use when requests involve building or refining files in `src/lib/components/math/*.svelte`, adding searchable tool metadata (inputs, outputs, use case, tags), wiring tools into `src/lib/components/math/tool-registry.ts`, or updating the `/tools` resources page previews.
---

# Create Component

Build reusable, center-friendly math visualizations that are easy to discover and reuse in posts and the tools library.

## Execution Flow

1. Confirm intent and learning target.
- Capture the concept, audience level, and whether the component is for home practice, in-center instruction, or both.
- Keep language family/student-friendly.

2. Create or update the tool component.
- Work in `src/lib/components/math/<tool-name>.svelte`.
- Keep visuals responsive (`viewBox` + fluid width).
- Prefer simple controls with meaningful ranges.
- Plot-style tools (grids/charts/data plots) should keep a white plot background.
- Non-plot visual tools should reuse `src/lib/components/math/tool-visual-theme.ts` for consistent blue/teal backgrounds (SVG tokens + canvas fill helper).

3. Add required indexable metadata inside the component.
- Export a `toolMeta` object from module scope and keep fields complete.
- Use this contract:

```ts
export const toolMeta = {
  id: 'kebab-case-id',
  title: 'Human Title',
  description: 'One-sentence summary.',
  inputs: 'What students/teachers can control.',
  outputs: 'What values/visual results update.',
  useCase: 'What the tool teaches or demonstrates.',
  tags: ['geometry', 'algebra'],
  audience: ['students', 'instructors'],
  kind: 'interactive' // or 'helper'
};
```

4. Enforce math rendering and diagram rules.
- Render equations in `.svelte` files with `MathExpression`.
- Do not leave raw TeX visible in UI text.
- Use symbols like `θ` and `°` in labels when appropriate.
- Keep plot regions white for plot tools unless the user explicitly requests a custom background.
- For non-plot visuals, default to the shared tool background theme.

5. Register tool for discovery.
- Add or update entries in `src/lib/components/math/tool-registry.ts`.
- Include component import, `toolMeta`, and optional preview settings.
- Ensure the tool appears on `src/routes/tools/+page.svelte`.

6. Coordinate with blog-post workflow when needed.
- If the request is post-driven, pair this skill with `create-blog-post`.
- Build/refine the component first, then embed it in post markdown.

7. Validate before handoff.
- Run `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5` for each touched `.svelte` file.
- Run `npm run check`.
- Run `npm run build` for substantial or cross-page changes.

## Response Contract

- State exactly which component and route files changed.
- Summarize metadata fields added/updated for each tool.
- Note validation commands run and outcomes.
