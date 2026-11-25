# Page content schemas — design

Revised 2026-11-21 after reading `docs/claude/2-content.md` and
`docs/claude/3-hierarchy.md`.

## Why

Staff will edit site content through Claude via an MCP server. The Zod schemas
are both the build-time guard (bad data fails the build, like `site.json` today)
and the MCP tool input schemas, so every field carries a `.meta({ description
})` written for the model, and constraints carry messages the model can act on.

## Approaches

- **Open blocks** — one `pages` collection, free list of blocks. Flexible, but
  nothing protects the design.
- **Fixed per-page schemas** — tightest design control, but ~13 schemas and
  every new page needs a developer. Defeats the point of editing through MCP.
- **Blocks with guardrails (chosen)** — open blocks plus rules enforced by the
  schema: structurally where possible (the page header as a field, capped
  lists), and in the field descriptions where structure can't (hierarchy and
  prominence, below).

## Hierarchy and prominence

The site's design depends on a clear hierarchy (`docs/claude/3-hierarchy.md`):
few things are loud, so the loud things work. Audience order is donors,
volunteers, families, and families must never be more than one click from help.
The schemas can't enforce most of this, so the descriptions must say it plainly
and repeatedly — at the page, header, block and action level:

- **Hero** is the most prominent element on the site. It is for landing pages
  only (today: home, Tikva House). Every other page, including section overviews
  like About, uses the plain header. Adding a hero to an ordinary page weakens
  the ones that need it.
- **Buttons** are for the one or two actions a section exists for. `donate`
  (gold) is the loudest; `secondary` is for the second action; a quiet need is a
  plain `link`, not a button.
- **CTA blocks** are for the page's main asks, not every paragraph. Prefer prose
  with a link when the action is incidental.
- Descriptions say "prefer the quieter option when unsure".

These are written once as shared description strings in `shared.ts` so wording
stays consistent.

## Design

### Collections (`src/content.config.ts`)

| Collection | Loader             | Files              | Notes                          |
| ---------- | ------------------ | ------------------ | ------------------------------ |
| `pages`    | `glob` `**/*.json` | `content/pages/`   | id = path; `index.json` = home |
| `stories`  | `glob` `*.md`      | `content/stories/` | Family stories; Markdown body  |
| `people`   | `glob` `*.json`    | `content/people/`  | Leadership, board, staff       |

No `legal` collection: the client asked to leave privacy and terms pages off the
site.

`site.json` stays as is (out of scope). Home is an ordinary page; the layout
renders only the site name in `<title>` for `index`.

### Page

- `title` — 3–60 chars, used in `<title>` and as the header heading fallback.
- `description` — optional, 50–160 chars, for search results; when omitted, the
  page has no description meta tag.
- `header` — required, discriminated on `type`, default `header`:
  - `header`: heading? (falls back to `title`), lead? (10–300).
  - `hero` (landing pages): heading, lead, image? (absent → text only), actions
    0–2, link? (the quiet text link, e.g. "Need support?").
- `blocks` — 0–12 blocks after the header, discriminated on `type`.
- `noindex` — optional boolean.

### Granularity

Blocks are **semantic sections**, not layout primitives (no `row`, `column` or
`heading` blocks, no nesting). Rules:

- A block earns its own `type` only if it has its own visual design. Layout
  differences within one design are a field (`imageSide`, `tone`), not a new
  block.
- Every block that can have a title uses the same optional section header —
  `heading` + `intro` — defined once in `shared.ts`.
- Section backgrounds aren't content (#21): the page picks them from the header
  type and each block's type at render time, so there is no field. Rules:
  `docs/design/color-blocking.md`.
- The schema stays flat (no recursive blocks), so the JSON Schema the MCP server
  exposes stays simple.

### Shared pieces

- `link` — `{ label (2–40), href }`; `href` is a site path (`/…`, query
  allowed), `https://`, `tel:` or `mailto:`.
- `action` — `link` + `variant: primary | secondary | donate` (matches
  `Button`).
- `image` — `{ src: image(), alt (required, 5–150) }`.
- `markdown` — limited Markdown (paragraphs, `##`/`###`, lists, bold, italic,
  links). Max length per block.
- `icon` — a Phosphor icon name (kebab-case), checked against
  `@phosphor-icons/core`'s catalog. A string with a refinement, not an enum, to
  keep the MCP JSON Schema small.

### Blocks

| `type`      | Fields                                                                    | Used for                              |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `prose`     | markdown                                                                  | General text, Services lists, History |
| `mediaText` | heading, markdown, images (1–2), imageSide `start\|end`                   | Tikva "What's included"               |
| `cards`     | header, items (2–6: title, text, icon?, link?), link?                     | Services teaser                       |
| `impact`    | header, items (2–8: value, label, source), link?                          | Impact (Home, About)                  |
| `faq`       | header, items (1–12: question, answer markdown)                           | Plan Your Stay                        |
| `cta`       | heading, text?, actions (1–2), tone `brand\|subtle`                       | Donate / volunteer / support teasers  |
| `contact`   | header, name, address, phone, email?, image?, link?                       | Tikva "Request a Stay", Contact page  |
| `form`      | header, form `contact\|volunteer\|tehillim\|story\|donate`, confirmation? | Forms (fields live in code)           |
| `logos`     | header, items (1–24: name, image, href?), link?                           | Corporate sponsors                    |
| `stories`   | header, count (1–6, default 3), pick? (`reference('stories')`)            | Story teasers                         |
| `people`    | header, group `leadership\|board\|staff`                                  | Leadership page                       |

`contact` reuses `addressSchema` and `phoneSchema` from `src/schemas/site.ts`.

No count/adjacency guardrail on `cta`: the approved home order puts three
teasers back to back. Prominence is handled by descriptions (above).

### Stories / people

- **stories**: `title`, `summary` (≤200), `date`, `author?` (omit for
  anonymous), `featured` (default false), `approved` (default false; only
  approved stories are built); body is Markdown. No photo (2026-11-24): a story
  is its words. Written by families, not edited through MCP — minimal
  descriptions.
- **people**: `name`, `role?`, `group`, `photo?`, `order` (int ≥ 0). No bios
  (2026-11-22). A missing photo shows a placeholder.

### Files

- `src/schemas/shared.ts` — link, action, image, markdown, icon, header,
  hierarchy description strings.
- `src/schemas/blocks.ts` — header + block schemas.
- `src/schemas/page.ts` — page, story, person schemas.
- `src/content.config.ts` — collections.

Schemas needing Astro's `image()` / `reference()` are factories taking those
helpers, so the MCP server can build them with string stubs and emit JSON
Schema.

## Out of scope / left to the builder

- Block components and the `[...slug].astro` route; `dir="auto"` for Hebrew
  text.
- How `markdown` strings are rendered.
- Moving `mainNav` / footer links, or Tikva House contact details, into
  `site.json`.
- The MCP server itself.
