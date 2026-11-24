# 8. A Donate page instead of Ways to Give for v1

- Status: accepted
- Date: 2026-11-23

## Context

The content plan has a Ways to Give page: an intro, a "Where your gift goes"
list, the donation form and a Corporate Sponsors section. Corporate Sponsors is
built only if JCN provides logos, and they haven't; planned giving was left out.
That leaves the donation form as the only way to give, and the intro and list
above it pushed the form below the fold.

## Decision

For v1 the page is "Donate", at `/donate`: the header (intro and blurb) and the
donation form. The "Where your gift goes" list moves to Get Involved, under the
cards, with a link to `/donate`. The nav, footer and 404 links say "Donate".

## Alternatives rejected

- **Keep Ways to Give with the list above the form:** the form, the page's
  reason to exist, starts below the fold on desktop and phones.

## Consequences

- Ways to Give can come back when there's more than one way to give. The URL
  stays `/donate` either way.
- Corporate Sponsors gets its own page when JCN provides logos, rather than a
  section here.
