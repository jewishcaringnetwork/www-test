# Agent notes

## Tooling

- The package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).
  Some local checkouts install with [aube](https://aube.sh/), which reads and
  writes the same pnpm lockfile. If `pnpm` errors about an unexpected virtual
  store, that checkout uses aube: run the same command with `aube` instead (e.g.
  `aube add <pkg>`) rather than reinstalling.
- Formatting is **dprint** (`dprint.json`), not Prettier: it covers TS, JSON,
  Markdown, CSS and `.astro` files. Run `pnpm format` to fix.
- `pnpm lint` runs every read-only check; add a new one as a `lint:<what>`
  script and append it to the `lint` chain. `lint:fmt` is dprint, `lint:tokens`
  is sugarcube (DTCG tokens and token references in CSS), `lint:types` is `astro
  sync && tsc --noEmit`.
- Type checking uses TypeScript 7 and covers `.ts` files only; `.astro` files
  aren't type-checked until `@astrojs/ts-content-mapper` is stable.
- Schema tests: `node --test 'src/schemas/*.test.ts'` (Node's built-in runner;
  TypeScript runs natively, no build step).
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
- No `.transform()`, so schemas convert cleanly to JSON Schema for MCP tool
  inputs.
- Store a value once and derive the rest at render time: the phone is stored as
  `410-602-6075` and `telHref()` builds the `tel:` link.
- Content accessibility rules belong in the schema (required alt text, no "click
  here" link text). Heading levels come from components, not content.
- Zod, not Markdoc: content is mostly structured blocks, and one Zod schema
  serves both the build and the MCP tools. Revisit Markdoc only if body text
  needs components inside it.

## Editable content (`content/`)

- Only root `content/` is staff-editable. Schemas stay in `src/`, so an edit
  can't loosen its own validation.
- Nav (`mainNav`, `footerLinks`, `legalLinks`) stays in code.
- Locked identity (`name`, `legalName`, `ein`) lives in `src/config.ts`, merged
  after `site.json`. A field that isn't in an editable file can't be edited.
