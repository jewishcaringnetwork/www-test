# Color blocking

How page sections are set apart by background. It follows the reference site's
color blocking (#21). Paper is the page's background and stays the base; white
and blue are bands on it.

## Rules

1. **The header or hero is always paper.**
2. **Plain sections alternate automatically:** paper, white, paper, … by
   position, starting with paper so the page background carries on into the
   content. Content never picks paper or white, so neighbours can't match.
3. **One emphasis band: blue** (`band: "blue"` on the block), for the page's one
   key moment, e.g. impact numbers. At most one per page (enforced).
4. **Blue is never the last section** (enforced): the footer is dark blue, and
   the two would run together.
5. **No brand CTA in a blue band** (enforced): its blue panel would vanish. A
   subtle CTA is fine.
6. **No gold band.** Gold is a secondary accent (and the Donate button's fill),
   not a section background.
7. **Cards and panels stay white on every band.** On a blue band their text
   switches back to the light-surface colors.

## Colors and contrast

The backgrounds are the `color.section.*` tokens in `src/tokens/color.json`.

- **paper:** `surface.page`, the page itself.
- **white:** `neutral.0`, edged top and bottom with `border.subtle`, since white
  is only 1.06:1 against paper.
- **blue:** brand blue. The band swaps the text tokens for on-brand ones:

| On the blue band | Token                     | Contrast |
| ---------------- | ------------------------- | -------- |
| Body and heading | `text.on-brand` (white)   | 7.5:1    |
| Supporting text  | `text.on-brand-secondary` | 5.9:1    |
| Links            | `text.link-on-brand`      | 7.5:1    |
| Focus ring       | `brand.gold`              | 4.3:1    |

Links on blue are white like the body text, so they are always underlined.

## Where it lives

- **Schema:** the `band` field (`sectionBand` in `src/schemas/shared.ts`); rules
  3 and 4 in `src/schemas/page.ts`; rule 5 in the `cta` block in
  `src/schemas/blocks.ts`. Their wording for editors is `hierarchy.band`.
- **Rendering:** `sectionBackground()` in `src/lib/section-background.ts` picks
  each section's background; `src/components/blocks/section.astro` paints it and
  swaps the text tokens on blue; `src/css/block/card.css` swaps them back.

Changing a rule means changing the schema and its tests too, so the build and
the MCP tools keep enforcing what this page says.
