# Page Content Schemas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zod schemas and Astro content collections for pages (simple/split
hero + blocks), stories, people and legal pages.

**Architecture:** Pure schema modules in `src/schemas/` that never import
`astro:content` at runtime. Schemas needing Astro's `image()` / `reference()`
are factories taking a `SchemaFns` object: `content.config.ts` passes the real
helpers, tests pass stubs, and the future MCP server can pass string stubs to
emit JSON Schema.

**Tech Stack:** Astro 7.4, `astro/zod` (Zod 4), `@phosphor-icons/core`
(installed), Node 26 built-in test runner with native TS type stripping.

**Spec:** `docs/superpowers/specs/2026-11-21-page-schemas-design.md`

## Global Constraints

- Every object is `z.strictObject`; every field has `.meta({ description })`
  written for a model editing content (follow `src/schemas/site.ts`).
- Prominence wording comes from the shared `hierarchy` strings (Task 1), never
  retyped. The split hero, `actions`, `variant`, and `cta` descriptions must
  each include the relevant string.
- Import `z` from `astro/zod`; Astro types via `import type` only. Relative
  imports use the `.ts` extension.
- Block discriminator key is `type`; hero discriminator key is `layout`. Blocks
  never contain blocks.
- Tests run with: `node --test 'src/schemas/*.test.ts'`
- Package manager is **aube**, not pnpm (`node_modules` uses aube's virtual
  store).
- **No commits.** Leave all changes uncommitted.

## Review Focus

1. Whitespace-only strings must fail `min` checks → `text()` trims before
   `.min()`. Test in Task 1.
2. `javascript:`, `http:` and bare-domain hrefs are rejected;
   `/donate?fund=tikva-house` is accepted. Test in Task 1.
3. Unknown keys (a model inventing `subtitle`) fail, including inside blocks and
   list items. Test in Task 2.
4. `hero: {}` parses as a simple hero (the default layout) rather than failing.
   Test in Task 2.
5. `z.toJSONSchema` succeeds on `pageSchema` built with string stubs. Test in
   Task 3.

---

### Task 1: Shared pieces

**Files:**

- Create: `src/schemas/shared.ts`
- Test: `src/schemas/shared.test.ts`

**Interfaces:**

- Produces:
  - `type SchemaFns = { image: ImageFunction; reference: (collection: string) =>
    z.ZodType }`
  - `hierarchy` — `const` object of description strings: `splitHero`, `actions`,
    `quietLink`, `cta`, plus `whenUnsure: 'When unsure, prefer the quieter
    option.'`. Content per the spec's "Hierarchy and prominence" section,
    including audience order (donors, volunteers, families) and "families never
    more than one click from help".
  - `text(min: number, max: number): z.ZodString` — trimmed, bounded
  - `markdown(max: number): z.ZodString` — trimmed, min 1; description lists
    allowed syntax
  - `hrefSchema`, `linkSchema` (`label: text(2,40)`, `href`), `actionSchema` (+
    `variant: 'primary'|'secondary'|'donate'`)
  - `imageSchema(fns)` — `{ src: fns.image(), alt: text(5,150) }`
  - `iconSchema` — string refined against `new Set(icons.map(i => i.name))` from
    `@phosphor-icons/core`; message `"Unknown icon. Use a Phosphor icon name in
    kebab-case, e.g. heartbeat."`
  - `sectionHeader` — shape object `{ heading?: text(3,70), intro?: text(10,300)
    }`

- [ ] **Step 1: Write failing tests** (`node:test`, `node:assert/strict`; stubs
      `fns = { image: () => z.string(), reference: () => z.string() }`):
  - `text(3,10)` rejects `"   "`, `"ab"`; `"  abc  "` → `"abc"`.
  - `hrefSchema` accepts `/about`, `/donate?fund=tikva-house`,
    `https://example.org`, `tel:+14105341033`, `mailto:info@tikvahouse.org`;
    rejects `javascript:alert(1)`, `http://example.org`, `example.org`, `/has
    space`.
  - `actionSchema` rejects `variant: 'tertiary'` and an extra key `icon`.
  - `imageSchema(fns)` rejects `alt: ""`.
  - `iconSchema` accepts `heartbeat`, `house`; rejects `Heartbeat`,
    `not-an-icon`.
- [ ] **Step 2: Run** tests — expect FAIL (module not found).
- [ ] **Step 3: Implement** `src/schemas/shared.ts`.
- [ ] **Step 4: Run** tests — expect PASS.

---

### Task 2: Hero and blocks

**Files:**

- Create: `src/schemas/blocks.ts`
- Test: `src/schemas/blocks.test.ts`

**Interfaces:**

- Consumes: Task 1; `addressSchema`, `phoneSchema` from `src/schemas/site.ts`.
- Produces:
  - `heroSchema(fns)` — `z.discriminatedUnion('layout', [simple, split])`,
    wrapped so a missing `layout` defaults to `'simple'` (e.g. `z.preprocess`
    setting `layout: 'simple'` when absent):
    - `simple`: `heading?: text(3,70)` (falls back to page title), `lead?:
      text(10,300)`
    - `split`: `heading: text(3,70)`, `lead: text(10,300)`, `image?:
      imageSchema` (absent → brand-color panel), `actions: actionSchema[]` max 2
      default `[]`, `link?: linkSchema`. Description includes
      `hierarchy.splitHero`.
  - `blockSchema(fns)` — `z.discriminatedUnion('type', [...])`:

    | `type`      | fields                                                                                                                                                  |
    | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `prose`     | `markdown: markdown(5000)`                                                                                                                              |
    | `mediaText` | `heading: text(3,70)`, `markdown: markdown(2000)`, `images: imageSchema[]` 1–2, `imageSide: 'start'\|'end'` default `'end'`                             |
    | `cards`     | `...sectionHeader`, `items` 2–6 of `{ title: text(2,60), text: text(10,300), icon?: iconSchema, link?: linkSchema }`, `link?: linkSchema`               |
    | `stats`     | `...sectionHeader`, `items` 2–4 of `{ value: text(1,12), label: text(2,60) }`                                                                           |
    | `faq`       | `...sectionHeader`, `items` 1–12 of `{ question: text(5,150), answer: markdown(1500) }`                                                                 |
    | `cta`       | `heading: text(3,70)`, `text?: text(10,250)`, `actions` 1–2, `link?: linkSchema`, `tone: 'brand'\|'subtle'` default `'brand'`                           |
    | `contact`   | `...sectionHeader`, `name: text(2,80)`, `address: addressSchema`, `phone: phoneSchema`, `email?: z.email()`, `image?: imageSchema`, `link?: linkSchema` |
    | `form`      | `...sectionHeader`, `form: 'contact'\|'volunteer'\|'tehillim'\|'story'\|'donate'`, `confirmation?: text(10,250)`                                        |
    | `logos`     | `...sectionHeader`, `items` 1–24 of `{ name: text(2,80), image: imageSchema, href?: hrefSchema }`, `link?: linkSchema`                                  |
    | `stories`   | `...sectionHeader`, `count: int 1–6` default 3, `pick?: fns.reference('stories')[]` 1–6                                                                 |
    | `people`    | `...sectionHeader`, `group: 'leadership'\|'board'\|'staff'`                                                                                             |

  - `type Block = z.infer<ReturnType<typeof blockSchema>>`

- [ ] **Step 1: Write failing tests:**
  - `heroSchema`: `{}` → `{ layout: 'simple' }`; split without `heading` fails;
    split with 3 actions fails; split `{ layout:'split', heading, lead }` →
    `actions: []`.
  - Each block type parses a minimal valid example; `mediaText` default
    `imageSide: 'end'`; `stories` default `count: 3`; `cta` default `tone:
    'brand'`.
  - `{ type: 'hero' }` rejected by `blockSchema`.
  - `cards` with 1 and 7 items rejected; `stats` with extra key `icon` rejected;
    a `faq` item with extra key `id` rejected; `mediaText` with 3 images
    rejected; `contact` with phone `410.534.1033` rejected.
- [ ] **Step 2: Run** tests — expect FAIL.
- [ ] **Step 3: Implement** `src/schemas/blocks.ts`.
- [ ] **Step 4: Run** tests — expect PASS.

---

### Task 3: Entry schemas

**Files:**

- Create: `src/schemas/page.ts`
- Test: `src/schemas/page.test.ts`

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces:
  - `pageSchema(fns)` — `{ title: text(3,60), description?: text(50,160),
    noindex?: boolean, hero: heroSchema, blocks: blockSchema[] max 12 default []
    }`. Page description summarises the hierarchy rules and
    `hierarchy.whenUnsure`.
  - `storySchema(fns)` — `{ title: text(3,100), summary: text(10,200), image?:
    imageSchema, date: z.coerce.date(), author?: text(2,80), featured: boolean
    default false }`
  - `personSchema(fns)` — `{ name: text(2,80), role?: text(2,80), group:
    'leadership'|'board'|'staff', photo?: imageSchema, order: int ≥ 0, bio?:
    text(10,500) }`
  - `legalSchema` — `{ title: text(3,60), updated: z.coerce.date() }`

- [ ] **Step 1: Write failing tests:**
  - Page with `title` and `hero: {}` → `blocks: []`, `hero.layout: 'simple'`;
    missing `hero` fails; 13 prose blocks fail; `description` of 20 chars fails.
  - Home-shaped page (split hero + stats + cards + three adjacent `cta` blocks)
    passes.
  - With string stubs, `z.toJSONSchema(pageSchema(fns), { io: 'input',
    unrepresentable: 'any' })` doesn't throw, and `properties.blocks.items` has
    11 `oneOf`/`anyOf` entries.
  - `personSchema` rejects `order: 1.5`, accepts a person with no `role`;
    `legalSchema` parses `'2026-11-21'` to a `Date`.
- [ ] **Step 2: Run** tests — expect FAIL.
- [ ] **Step 3: Implement** `src/schemas/page.ts`.
- [ ] **Step 4: Run** tests — expect PASS.

---

### Task 4: Content collections

**Files:**

- Create: `src/content.config.ts`

| Collection | Loader                                                    |
| ---------- | --------------------------------------------------------- |
| `pages`    | `glob({ pattern: '**/*.json', base: './content/pages' })` |
| `stories`  | `glob({ pattern: '*.md', base: './content/stories' })`    |
| `people`   | `glob({ pattern: '*.json', base: './content/people' })`   |
| `legal`    | `glob({ pattern: '*.md', base: './content/legal' })`      |

Each schema is `({ image }) => factory({ image, reference })`, `reference` from
`astro:content`.

- [ ] **Step 1: Implement** `src/content.config.ts`.
- [ ] **Step 2: Add temporary fixtures** in `content/`: `pages/index.json`
      (split hero + `cards` with icon + `stories` pick `["sample"]`),
      `stories/sample.md`, with images pointing at
      `src/assets/logos/JCN-logo-color.svg` via a correct relative path.
- [ ] **Step 3: Run** `aube exec astro sync` (or `node_modules/.bin/astro sync`)
      — expect success. Change one icon to `not-an-icon`, rerun — expect failure
      naming the field and the icon message. Restore.
- [ ] **Step 4: Delete the fixtures**, rerun `astro sync` — expect success.
