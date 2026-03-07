# Mathnasium Blog

Static math blog built with Svelte 5, Tailwind v4, shadcn-svelte, mdsvex, and KaTeX.

## Quickstart

```sh
bun install
bun run dev
```

Open the local URL shown in the terminal.

## Commands

- `bun run dev` - start dev server (auto-builds WASM first)
- `bun run check` - run Svelte + TypeScript checks
- `bun run build` - production build (auto-builds WASM first)
- `bun run preview` - preview production build
- `bun run build:wasm` - rebuild WASM assets only

## Content

- Posts live in `src/content/posts/*.md`
- Set `devOnly: true` in post frontmatter for draft articles you want visible only in `bun run dev`
- Interactive math components live in `src/lib/components/math/*`
- Post metadata loading/sorting is in `src/lib/content/posts.ts`

## Iterating With A Coding Agent

When using a coding agent for a new post, start by describing the post idea at a high level (topic, tone, and key math goals); the agent should create the post scaffold in the background (including the markdown file, slug wiring, and any basic route integration), then explicitly point you to the generated `src/content/posts/<slug>.md` file so you can edit freely, and from there you should iterate by asking for targeted refinements to visuals, equations, and narrative sections until the post looks right.


## Future work:
We need to fix the ugly slop UI 🤮. Ideas:
- https://www.pi.website/
- https://harmonic.fun/about
- https://embedding-inversion-demo.jina.ai/
- https://dribbble.com/shots/20860486-Minimal-blog-post-Untitled-UI
- https://dribbble.com/shots/24074591-Minimal-blog-Untitled-UI
- https://dribbble.com/shots/26108908-Halftone-blog-Untitled-UI
- https://dribbble.com/shots/24565936-Minimal-blog-Untitled-UI
- https://dribbble.com/shots/24365811-Design-journal-Untitled-UI