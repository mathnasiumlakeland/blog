# Mathnasium Blog

Static math blog built with Svelte 5, Tailwind v4, shadcn-svelte, mdsvex, and KaTeX.

## Quickstart

```sh
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Commands

- `npm run dev` - start dev server (auto-builds WASM first)
- `npm run check` - run Svelte + TypeScript checks
- `npm run build` - production build (auto-builds WASM first)
- `npm run preview` - preview production build
- `npm run build:wasm` - rebuild WASM assets only

## Content

- Posts live in `src/content/posts/*.md`
- Interactive math components live in `src/lib/components/math/*`
- Post metadata loading/sorting is in `src/lib/content/posts.ts`

## Iterating With A Coding Agent

When using a coding agent for a new post, start by describing the post idea at a high level (topic, tone, and key math goals); the agent should create the post scaffold in the background (including the markdown file, slug wiring, and any basic route integration), then explicitly point you to the generated `src/content/posts/<slug>.md` file so you can edit freely, and from there you should iterate by asking for targeted refinements to visuals, equations, and narrative sections until the post looks right.
