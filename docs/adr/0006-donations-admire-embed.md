# 6. v1 donations use Admire's embedded form

- Status: accepted
- Date: 2026-11-23
- Updated: 2026-11-23, after building the embed
  (jewishcaringnetwork/www-test#31)

## Context

Donate has to work at v1, due Wednesday 11/25. JCN manages donors in Admire, its
donor management system, and gave us an embeddable donation form from it. The
client's reference site has a custom donation integration (`donate.mts`).

## Decision

The Donate page (`/donate`) embeds Admire's donation form in an iframe. The
custom integration is deferred.

- **Fund preselect:** site links use a slug, e.g. `/donate?fund=tikva-house`.
  The page maps it to the exact option in Admire's Funds dropdown and loads the
  form with `?Funds=Tikva%20House`. Only funds listed in `src/schemas/funds.ts`
  get through, and links to unknown funds fail the build.
- **Size:** Admire has no resize script and the frame is cross-origin, so the
  frame's width and height are fixed per Admire layout, measured, and grow the
  first time focus moves into the frame. The measurements are in
  `src/components/blocks/donate-form.astro`.
- **CSP:** `netlify.toml` sets a `frame-src`-only policy that allows Admire and
  the Netlify Drawer. It governs iframes and nothing else; a full CSP is a
  separate job.

## Alternatives rejected

- **The reference site's custom integration (`donate.mts`):** more control over
  styling and flow, but it's code we'd own, test and keep secure for payments,
  and it doesn't fit in the time before v1. Reviewed 11/23, it also charges
  cards through Sola (Cardknox) directly rather than through Admire. Gifts
  wouldn't arrive as Admire donor records, its funds list doesn't match
  Admire's, monthly gifts become Cardknox schedules Admire may not know about,
  and nothing stops a resubmitted form from charging twice. It needs a Sola API
  key from JCN and a front-end form of its own.

## Consequences

- Gifts land in Admire directly; JCN's existing donor records and receipts keep
  working.
- The form's look is Admire's, not the site's design system. Its layout quirks
  are worked around in the frame: in the wide layout the form sits 45px right of
  centre, so the frame is cropped to centre it, and between about 540 and 690px
  of frame width the form overflows, so the frame snaps to 520px or 704px.
- The narrow layout overflows sideways by 2-4px, even on Admire's own page.
  Phones overlay scrollbars, so it's a 2px pan there; desktop browsers with
  classic scrollbars show scrollbars in the frame in a narrow window.
- The frame's sizes depend on Admire's current form. If Admire changes it,
  re-measure.
- Testing: we don't make a real donation, because JCN won't refund it and the
  payment processing is Admire's own. Instead, on the deploy preview, submit
  with a card that will be declined, on an iPhone or in Safari (the strictest
  about third-party frames). A decline shows the card fields, the Cloudflare
  check and the submission all work inside the embed.

## Open questions

- Custom integration later: jewishcaringnetwork/www-test#40
- Admire doesn't document which sites may embed the form; confirmed only by the
  deploy preview working.
