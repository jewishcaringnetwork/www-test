# Color blocking

How page sections are set apart by background (#21). Section headings already do
most of that work; backgrounds only help them. Paper is the page's background
and stays the base.

## Rules

1. **Bands only on landing pages.** A page with a hero header (Home, Tikva
   House) is a stack of blocks, and bands help tell them apart. A page with a
   plain header (History, Leadership, Services) is simpler or text-heavy, so it
   stays on paper throughout.
2. **The first open section after the hero is white,** and open sections
   alternate paper and white from there.
3. **Self-contained blocks stay on paper:** cards, story teasers, the contact
   panel and CTAs. Their cards and panels already set them apart, and a white
   card on a white band loses its edge.
4. **Content never picks a background.** The page works it out from the header
   type and each block's type, so editors and Claude can't break these rules.
5. **Blue is for emphasis, not a default.** Only the impact-numbers block uses
   it, and only the first one on a landing page; a second is an open section.
   The open section after the blue band is white.
6. **No gold band.** Gold is a secondary accent and the Donate button's fill,
   not a section background.

## Colors and contrast

The backgrounds are the `color.section.*` tokens in `src/tokens/color.json`.

- **paper:** `surface.page`, the page itself.
- **white:** `neutral.0`, edged top and bottom with `border.subtle`, since white
  is only 1.06:1 against paper.
- **blue:** brand blue, for the impact block. The band swaps the text tokens for
  on-brand ones, and a `.card` inside swaps them back:

| On the blue band | Token                     | Contrast |
| ---------------- | ------------------------- | -------- |
| Body and heading | `text.on-brand` (white)   | 7.5:1    |
| Supporting text  | `text.on-brand-secondary` | 5.9:1    |
| Links            | `text.link-on-brand`      | 7.5:1    |
| Focus ring       | `brand.gold`              | 4.3:1    |

Links on blue are white like the body text, so they are always underlined.

## Where it lives

- `sectionBackgrounds()` in `src/lib/section-background.ts` applies rules 1–3
  and lists the self-contained block types. Add a new block type there when its
  component puts its content in cards or panels.
- `src/pages/[...slug].astro` calls it and passes each block its background;
  `src/css/block/section.css` paints it; `src/css/block/card.css` resets the
  text tokens inside cards.
- `sectionBackgrounds()` names the one block type that gets blue (`impact`). To
  give it to another type instead, change it there and keep rule 5's
  once-per-page limit.
