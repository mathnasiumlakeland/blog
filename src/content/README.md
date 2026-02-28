# Writing Blog Posts

Create a new file in `src/content/posts/<slug>.md`.

## Frontmatter

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
equation: 'x^2 + y^2 = r^2'
featured: false
---
```

Use single quotes for equation strings in frontmatter. LaTeX commands such as `\sum` or `\sin`
can break YAML parsing when double-quoted.

## Math

- Inline: `$E = mc^2$`
- Block:

```latex
$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
```

Both are rendered by KaTeX, so writing is similar to LaTeX and Typst-style inline math flow.

## Svelte Components Inside Markdown

You can import and use Svelte components directly:

```svelte
<script>
	import MyViz from '$lib/components/math/my-viz.svelte';
</script>

<MyViz />
```
