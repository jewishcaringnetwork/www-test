# Semantic page schemas — design

> **Status: draft, parked (2026-11-27).** Not approved and not built. Staff
> editing through MCP is deferred past launch (ADR 7), so for now pages are
> being written as plain Astro and the page schema waits. Pick this up again
> when MCP editing comes back: by then the components will exist, so check this
> design against them before building it. Until then,
> `2026-11-21-page-schemas-design.md` still describes the live schema.
>
> Open before resuming:
>
> - **Page type on the page.** Agreed in discussion but not yet written in
>   below: drop the `header` object, make the page a discriminated union on
>   `type: 'standard' | 'landing'` with heading, lead and image as page fields,
>   and move `missingDescriptions` into a page refinement. Astro 7 only
>   `.extend()`s a collection schema that is a plain `ZodObject`
>   (`astro/dist/content/types-generator.js`); a union goes straight to
>   `z.toJSONSchema`, so each branch declares its own `$schema`.
> - **Facts as collections.** Programs, figures, services and partners as their
>   own collections that pages reference by id. Considered and deferred; decide
>   them together.
> - **Action intents** (`{ goal: 'give' }` instead of an href) were considered
>   and rejected for now: the `/donate` rule below fails safely.
> - The builder check (a fresh reviewer reading this doc) hasn't run.

When built, supersedes `2026-11-21-page-schemas-design.md` for page structure.
Stories, people and the shared field rules (`text`, `linkText`, `hrefSchema`,
image consent, icon names) are unchanged and still described there.

## Why

`content/` should say only what things are: a page's opener, a topic, a giving
ask, a place. How they look belongs to Astro and CSS. Today content also chooses
looks (`action.variant`, `cta.tone`, `mediaText.imageSide`, `hero.brand`), block
types are named after layouts (`mediaText`, `cards`, `logos`), and a block is
also a page section, so real sections hide inside Markdown as `##` headings
where the page can't see them.

This is project 1 of 3. Project 2 builds landing and standard layouts and shared
components (Card, SectionHeader); project 3 moves scoped styles into
`src/css/block/` and `utility/`. This schema should make both simple: a layout
is picked by page type, and every section is the same frame around a body
component.

## Goals

- Content carries meaning only. No field chooses a style, size, side, tone or
  logo.
- A page is a list of sections; every section has a heading and one body.
- Prominence (which button is loud, which ask is a brand band) comes from
  meaning, in code, so editors and Claude can't flatten the hierarchy.
- The site renders as it does now, apart from the changes listed under "Intended
  visual changes".

## Non-goals

- Layout components, a Card component, moving CSS (projects 2 and 3).
- Moving `site.json` `org` onto the new places (follow-up, below).
- The MCP server itself.
- Changing any copy beyond the new headings listed under "Migration".

## Anti-goals

- A semantic-sounding field that is really a style switch (e.g. `priority: main
  | secondary` on an ask). That is approach B, rejected.
- Schemas that can't convert to JSON Schema (`.transform()`, recursion).
- Hidden headings chosen by content.

## Approaches

- **A. Meaning only; code derives looks (chosen).** Remove every presentational
  field; derive button style, ask tone, image side and program logo from page
  type, link targets and position. Trade-off: an editor can't make one ask
  louder or quieter; nothing on the site needs it.
- **B. Semantic labels for prominence.** `action.role`, `cta.priority`. Keeps
  control, but it's the same choice renamed, and the hierarchy can still be
  flattened.
- **C. Rename and tidy.** Strip visual wording and rename blocks, keep `variant`
  and `tone`. Smallest diff; content still picks looks.

The user picked A, then reshaped the page into sections that each hold one body
(their sketch), with these decisions:

- Header and hero are page-level and discriminate on page type.
- Every section has a heading. Styling may hide one visually, but no rule does
  so today: every heading is visible.
- Prose always has a title: its `##` groups become sections.
- `people` sections require a heading.
- A form section's heading is the form's title, inside its card.
- Each place is its own section; on Contact its heading is the place's name.

## Design

### Page (`src/schemas/page.ts`)

```ts
type Page = {
	$schema?: string;
	title: string; // 3–60
	description?: string; // 50–160; required unless noindex (missingDescriptions)
	noindex?: boolean;
	header: StandardHeader | LandingHeader; // discriminated on required `type`
	sections: Section[]; // 0–12, default []
};

type StandardHeader = {
	type: 'standard';
	heading?: string; // 3–70, falls back to title
	lead?: string; // 10–300
};

type LandingHeader = {
	type: 'landing';
	program?: 'tikva-house'; // what the page is about; was hero.brand
	heading: string; // 3–70
	lead: string; // 10–300
	image?: Image;
	actions: Action[]; // 0–2, default []
	link?: Link; // e.g. "Need support?"
};
```

The page stays a plain `strictObject`: Astro extends it to make the editor JSON
Schema, so the page type lives on `header.type`, not on the page. The route
reads `header.type` and passes it on as the page type. (Call: values `standard`
/ `landing` rather than `header` / `hero`, because the discriminator now names
the page type, and a hero is just what a landing page opens with.) `type` is
required, no default.

`program` is semantic: the page is about that program. The landing layout maps
it to a logo, as `hero.astro` maps `brand` today.

### Section (`src/schemas/sections.ts`, replacing `blocks.ts`)

```ts
type Section = {
	heading: string; // 3–70, required
	intro?: string; // 10–300
	link?: Link; // quiet link after the body, e.g. "See all services"
	body: Body; // discriminated on `type`
};
```

`link` moves up from `cards`, `impact`, `logos` and `contact`, so any section
can have one. The section's anchor id is the slug of its heading alone (no type
prefix), e.g. `#request-a-stay`.

### Bodies

| `type`     | Fields                                                            | Was                       |
| ---------- | ----------------------------------------------------------------- | ------------------------- |
| `prose`    | markdown (≤5000), images? (1–2)                                   | `prose`, `mediaText`      |
| `topics`   | items 2–6: title, text, icon?, link? `{ href, label? }`           | `cards`                   |
| `figures`  | items 2–8: value, label, source `{ document, date }`              | `impact`                  |
| `faq`      | items 1–12: question, answer (markdown, no headings)              | `faq`                     |
| `ask`      | text (10–250, required), actions 1–2                              | `cta`                     |
| `form`     | form `contact\|volunteer\|tehillim\|story\|donate`, confirmation? | `form`                    |
| `place`    | place: `reference('places')`                                      | `contact`, form.locations |
| `people`   | group `leadership\|board\|staff`                                  | `people`                  |
| `stories`  | count (1–6, default 3), pick? (`reference('stories')`)            | `stories`                 |
| `partners` | items 1–24: name, image, href?                                    | `logos`                   |

Field limits not listed carry over from today's schemas.

- **prose:** Markdown allows `###` but not `##` or `#`: the section heading is
  the h2. A refinement rejects a line starting `## ` with a message telling the
  model to start a new section instead. Images are photos of what the text
  describes; the component decides where they sit.
- **ask:** the section heading is the ask's heading. Its look comes from the
  page type (below).
- **form:** the section heading is the form's title, rendered inside the form's
  card. `duplicateForms` still runs, now over sections.
- **place:** one place per section. The section heading is written by the
  editor: "Request a Stay" on Tikva House, the place's name on Contact.

Page-level refinements on `sections`: at most two `ask` sections (message: "At
most two ask sections per page."). The old "one brand, one subtle" rule goes,
since tone is derived.

### Places collection (new)

`content/places/<id>.json`, loaded by `glob('*.json')` in
`src/content.config.ts`, schema `placeSchema(fns)` in `src/schemas/page.ts`:

```ts
type Place = {
	$schema?: string;
	name: string; // 2–80
	address: Address; // addressSchema from site.ts
	phone: string; // phoneSchema
	email?: string;
	photo?: Image; // e.g. the Tikva House library
};
```

Two files: `jewish-caring-network.json` and `tikva-house.json`, with the details
now repeated in Contact and Tikva House. Tikva's library photo moves onto
`tikva-house.json`. A collection, not `site.json`, because `site.json` is
imported directly and can't use `image()`.

### Derived in code

All derivation lives in small tested functions in `src/lib/`, not in components,
so project 2 can reuse them.

- **Button style** (`actionStyle(action, index)`): an href that is `/donate` or
  starts with `/donate?` or `/donate#` → `donate`; otherwise index 0 →
  `primary`, index 1 → `secondary`. Applies to hero and ask actions.
- **Ask tone:** `brand` on a landing page, `subtle` on a standard page.
- **Section backgrounds** (`sectionBackgrounds(pageType, bodyTypes)`): the rules
  in `docs/design/color-blocking.md`, unchanged, with types renamed:
  self-contained = `topics`, `place`, `ask`, `form`; emphasis = `figures`; bands
  only when the page type is `landing`.
- **Heading placement:** `ask` and `form` bodies render the section heading
  inside their card; every other body gets it above, in the section header.
- **Image side:** prose images sit at the end, as today.
- **Program logo:** from `header.program`.
- **Form with places:** a `form` section followed directly by `place` sections
  renders as Contact does today: the form leads and the places sit in a column
  beside it (below on phones). Code groups them; content just lists sections in
  order. A `place` section anywhere else renders as today's contact panel.

### Hierarchy descriptions (`shared.ts`)

The `hierarchy` strings stay and are still reused, but describe meaning, not
loudness:

- `landing` (was `hero`): landing pages exist to move a visitor to act (home,
  Tikva House); every other page is standard.
- `actions`: the one or two actions this section exists for; the first is the
  main one; a link to /donate is always shown as giving. Don't add actions to
  fill space.
- `quietLink`: unchanged in meaning (a secondary need that stays findable).
- `ask` (was `cta`): one of the page's main asks (give, volunteer, get support);
  at most two per page; for incidental actions, use a link in prose.
- `audience` and `whenUnsure` unchanged. "Quieter" now means fewer actions, a
  link instead of an ask, a standard page instead of a landing page.

### Descriptions

Remove visual wording everywhere a model reads it, e.g. "4:3 frame", "hidden on
phones", "shown large", "a grid of", "a row of", "quieter column", "colored
band", "beside the text". Say what the thing is and when to use it. Image
descriptions keep only what matters for choosing an image (e.g. "an illustration
with no words in it"); aspect ratios and cropping are the component's business.

## Migration

Every file in `content/pages/` moves `blocks` → `sections`, renames header types
(`header` → `standard`, `hero` → `landing`, `brand` → `program`) and drops
`variant`, `tone` and `imageSide`. Per page:

| Page                   | Sections after                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| index                  | Support that reaches… (figures), How we help (topics), Your kindness… (ask)                                                           |
| about                  | one prose section per `##`, Our impact (figures), More about us (topics)                                                              |
| about/history          | one prose section per `##`                                                                                                            |
| about/leadership       | **TODO heading** (people: leadership), Board of Directors, Staff                                                                      |
| contact                | Send us a message (form), Jewish Caring Network (place), The Tikva House (place)                                                      |
| donate                 | **TODO heading** (form: donate)                                                                                                       |
| family-stories         | Has JCN touched your family? (ask)                                                                                                    |
| family-stories/share   | Share your story (form)                                                                                                               |
| get-involved           | **TODO heading** (topics), Where your gift goes (prose)                                                                               |
| get-involved/volunteer | Tell us how you'd like to help (form), Not ready to volunteer? (ask)                                                                  |
| services               | Care & Counseling, Meals & Household Help, For Children, Respite & Retreats, Outings & Events (prose each), Facing a diagnosis? (ask) |
| tikva-house            | What's included (prose + 2 images), Request a Stay (place), Keep the lights on… (ask)                                                 |
| preview/blocks         | one of each body type; trim to ≤12 sections                                                                                           |

Headings come from the existing `##` text and block headings. The three **TODO**
headings are new copy: the builder proposes wording (e.g. "Our officers", "Make
a gift", "Ways to get involved") marked as a TODO in the PR, for the user to
confirm. Never invent facts.

Tikva's hero action `/tikva-house#contact-request-a-stay` becomes
`/tikva-house#request-a-stay`.

## Intended visual changes

"Rendering unchanged" holds for every page except:

- Leadership: the first people group gains a visible heading.
- Donate: the form gains a title.
- Get Involved: the topics gain a heading.
- Pages whose prose had `##` groups (About, History, Services, Get Involved):
  each group is now a section, so the gap between groups is the section gap.
  Heading text and size stay the same.
- Preview: its brand ask turns subtle (standard page).

Check before/after screenshots of every page at desktop and phone widths;
anything else that moved is a bug.

## Files

- `src/schemas/shared.ts`: hierarchy strings, `markdown()` gains the `##`
  refinement option, descriptions.
- `src/schemas/sections.ts` (new, replaces `blocks.ts`): header, section, body
  schemas.
- `src/schemas/page.ts`: page with `sections`, `placeSchema`.
- `src/content.config.ts`: `places` collection.
- `src/lib/section-background.ts`, new `src/lib/prominence.ts` (`actionStyle`,
  ask tone), with tests.
- `src/pages/[...slug].astro`, `src/pages/family-stories/index.astro`: render
  sections; group form + places.
- `src/components/blocks/*`: take `{ section, ... }` or `{ body, heading }` as
  fits; rename files to match body types (`topics.astro`, `figures.astro`,
  `ask.astro`, `place.astro`); fold `media-text.astro` into `prose.astro`.
  Minimal changes otherwise; restructuring is project 2.
- Docs: this spec; a "superseded" note at the top of the 2026-11-21 spec;
  `docs/design/color-blocking.md` renamed terms (landing page, section,
  `figures`). `AGENTS.md` points at the old spec; it is human-maintained, so
  propose the pointer change to the user rather than editing it.

## Left to the builder

- Component prop shapes and whether `Section` takes the whole section.
- Exact refinement messages, written for a model reader.
- Test structure, as long as schema, derivation and migration are covered.

## Follow-ups (not this PR)

- `site.json` `org` duplicates the JCN place: point the banner and footer at
  `content/places/jewish-caring-network.json` and drop `org`'s address, phone
  and email.
