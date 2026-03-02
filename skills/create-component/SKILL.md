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
- Choose background treatment by component type, not personal preference.
- Plot-style tools (grids/charts/data plots) should keep a white plot region for readability.
- Non-plot explanatory visuals should reuse `src/lib/components/math/tool-visual-theme.ts` for consistent blue/teal backgrounds (SVG tokens and related helpers).
- Before finalizing, inspect at least one similar existing tool and mirror its background pattern (wrapper class + drawing surface behavior), not only its color family.

3. Add required indexable metadata inside the component.
- Keep interactive tool metadata canonical in `src/lib/components/math/tool-registry.ts`.
- Export `toolMeta` from module scope via `requireInteractiveToolMetaById('<tool-id>')`.
- Set `toolMeta.id` to a kebab-case slug derived from `toolMeta.title` because `/tools/[id]` routes by this value.
- Do not append generic suffixes not present in the title (for example, avoid forced `-visual` or `-canvas`).
- Keep `toolMeta.tags` concise and capped at 5 items.
- Use this contract:

```ts
export const toolMeta = {
  id: 'kebab-case-title-slug',
  title: 'Human Title',
  description: 'One-sentence summary.',
  inputs: 'What students/teachers can control.',
  outputs: 'What values/visual results update.',
  useCase: 'What the tool teaches or demonstrates.',
  tags: ['geometry', 'algebra']
};
```

4. Enforce math rendering and diagram rules.
- Render equations in `.svelte` files with `MathExpression`.
- Do not leave raw TeX visible in UI text.
- Use symbols like `θ` and `°` in labels when appropriate.
- Keep plot regions white for plot tools unless the user explicitly requests a custom background.
- For non-plot visuals, default to the shared blue/teal tool background theme.

5. Register tool for discovery.
- Add or update entries in `src/lib/components/math/tool-registry.ts`.
- Keep ID parity across `toolMeta.id`, registry entry `id`, registry `meta.id`, `tool-component-map.ts` key, and `tool-practice.ts` key.
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
