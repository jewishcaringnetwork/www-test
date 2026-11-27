# 9. Pages in plain Astro until staff editing

- Status: accepted
- Date: 2026-11-27
- Amends: [2. No CMS](0002-no-cms-content-in-repo.md),
  [7. v1 without staff editing](0007-v1-without-staff-editing.md)

## Context

Pages are JSON in `content/pages/`, validated by a block schema and rendered by
`src/pages/[...slug].astro`. The schema mixes meaning with looks (button
`variant`, CTA `tone`, layout-named blocks), and a block is also a page section,
so the components built around it blur too: each block writes its own card and
section markup, and standard pages have no shared layout.

Fixing the schema first would mean designing it before the components it feeds.
Its main reader is Claude editing through MCP, and staff editing is deferred
past launch (ADR 7).

## Decision

- Pages are written as plain `.astro` files using components directly, until
  staff editing through MCP comes back.
- Data stays in content collections: people, stories and `site.json`.
- The page schema is designed again once the components exist, read off them
  rather than guessed ahead. A parked draft:
  `docs/superpowers/specs/2026-11-27-semantic-page-schemas-design.md`.

## Alternatives rejected

- **Make the schema semantic now:** sections with one body each, looks derived
  in code. Sound, but it fixes the content shape before the components are
  settled. Kept as the draft above.
- **Freeze the schema as is:** no migration, but the new layouts and components
  would still be fed `variant`, `tone` and blocks-as-sections.

## Consequences

- Page copy is edited by the developer in `.astro` files, as ADR 7 already has
  it.
- The build no longer validates page content. The rules the schema enforced
  (required alt text, meaningful link text, known fund names, at most two CTAs)
  need to move into component prop types, with `astro check` in the `lint`
  chain, since `.astro` files aren't type-checked today.
- Turning staff editing on needs pages back in `content/` under a new schema: a
  migration from `.astro` to data files.
- `docs/design/color-blocking.md` rule 4 ("content never picks a background")
  still holds: pages pick no backgrounds either.
