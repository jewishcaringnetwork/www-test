# Agent notes

## Tooling

- The package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).
  Some local checkouts install with [aube](https://aube.sh/), which reads and
  writes the same pnpm lockfile. If `pnpm` errors about an unexpected virtual
  store, that checkout uses aube: run the same command with `aube` instead (e.g.
  `aube add <pkg>`) rather than reinstalling.
- Formatting is **dprint** (`dprint.json`), not Prettier: it covers TS, JSON,
  Markdown, CSS and `.astro` files. Run `pnpm format`; CI-style check is `pnpm
  check:fmt`.
- Schema tests: `node --test 'src/schemas/*.test.ts'` (Node's built-in runner;
  TypeScript runs natively, no build step).
- No type checker is installed yet. Until `@astrojs/check` is added, a cached
  TypeScript can be run with `node <path-to-typescript>/bin/tsc --noEmit -p .`.
- AI-assisted commits end with an `Assisted-by: AGENT:MODEL` trailer (Linux
  kernel convention), e.g. `Assisted-by: Claude:claude-opus-5-5`. Never use
  `Co-Authored-By` for an AI tool.
- Run `astro sync` after changing `src/content.config.ts`; it validates every
  content file against its schema.

## Content schemas (`src/schemas/`)

These schemas guard the build and are also the input schemas an MCP server
exposes so Claude can edit site content for staff. Write them for that reader.

- Use `z.strictObject` everywhere, so invented keys fail.
- Give every field a `.meta({ description })` that tells a model what goes there
  and when to leave it out.
- Prominence and hierarchy wording comes from the `hierarchy` strings in
  `shared.ts`. Reuse them; don't retype or paraphrase them.
- Schemas that need Astro's `image()` or `reference()` are functions taking
  `SchemaFns`. Never import `astro:content` at runtime in `src/schemas/`, so the
  schemas still build in tests and in the MCP server.
- `.meta()` on a shared schema replaces its description. To add context, pass it
  in (as `imageSchema(fns, use)` does) instead of calling `.meta()` on the
  result.
- Blocks are flat semantic sections, never layout primitives. A new block type
  needs its own visual design; layout variations are fields. See
  `docs/superpowers/specs/2026-11-21-page-schemas-design.md`.
