# Agent notes

Human-maintained. AI tools should never edit; propose changes in chat instead.

<!-- Every line should change agent behavior. If deleting it wouldn't, delete it. -->

## Commands

- if `pnpm` errors about the virtual store, use `aube` with the same command.
- New checks/lints: add as `lint:<what>` and append to the `lint` chain.

## Gotchas

- Type checking covers `.ts` only; `.astro` isn't checked.

## Content schemas (`src/schemas/`)

Schemas are also the MCP tool inputs, so write descriptions for a model reader.

- No `.transform()`: schemas must convert to JSON Schema.
- Never import `astro:content` at runtime in `src/schemas/`; take `SchemaFns`
  (breaks tests and MCP).
- Reuse the `hierarchy` strings in `shared.ts`; don't retype them.
- `.meta()` replaces a shared schema's description. Pass context through the
  factory instead.
- Enforce content accessibility in the schema (e.g. required alt text), not by
  editor convention. Heading levels come from components; never add a level
  field.

## CSS

CUBE CSS ([cube.fyi](https://cube.fyi)). Kochav provides the global and
composition layers and a baseline of utilities (currently just
`.visually-hidden`). Project utilities go in `src/css/utility/`; project blocks
go in `src/css/block/`.

- One-off styles stay in the component's scoped `<style>`.
- Before writing CSS for something, check `src/css/utility/` and Kochav's
  utilities for an existing class. Add a new utility only for a single-purpose
  rule used by more than one block.
- Tokens only; no raw color, spacing, radius or shadow values. Components should
  reach for semantic tokens (`--color-text-heading`) over palette primitives. If
  no semantic token fits, ask instead of using a primitive or inventing one.
- Use Kochav's compositions (`stack`, `cluster`) for layout instead of
  hand-rolled flex and margins. Their config properties (`--stack-gap`,
  `--cluster-gap`) reset on direct children to stop nested compositions
  inheriting them, so set them on the composition element itself, not an
  ancestor. Each file's `Config:` comment lists them.
- Margin and padding utilities (`m-*`, `p-*`) are generated from `space.*`
  tokens by sugarcube. Don't hand-write them.
- Variants are data attributes (`data-size`, `data-tone`), not modifier classes.
- Block CSS opens with a brief comment on what it is, its variants and its
  custom properties.
- Prefer logical properties (`padding-inline`, `max-inline-size`).

## Boundaries

- Accessibility target is WCAG 2.2 AA: visible focus styles, 24px minimum target
  size, contrast checked against token pairings.
- Only root `content/` is staff-editable.
- Locked identity (`name`, `legalName`, `ein`) stays in `src/config.ts`; never
  move it into editable content.
- Commits: `Assisted-by: AGENT:MODEL` trailer. Never `Co-Authored-By`.

## See also

- `docs/adr/`: read before changing an architectural decision.
- `docs/superpowers/specs/2026-11-21-page-schemas-design.md`: read before
  changing schema structure or block types.
- `docs/design/color-blocking.md`: read before changing section backgrounds,
  color pairings, or page-level color.
- `src/tokens/`: read before adding a color, spacing, or type value; the DTCG
  comments say what each token is for.
- `node_modules/@kochav/css/`: read the doc comments before using or overriding
  a composition or utility.
