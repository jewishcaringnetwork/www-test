# 6. v1 donations use Admire's embedded form

- Status: accepted
- Date: 2026-11-23

## Context

Donate has to work at v1, due Wednesday 11/25. JCN manages donors in Admire, its
donor management system, and gave us an embeddable donation form from it. The
client's reference site has a custom donation integration (`donate.mts`).

## Decision

The Ways to Give page embeds Admire's donation form in an iframe. The custom
integration is deferred.

## Alternatives rejected

- **The reference site's custom integration:** more control over styling and
  flow, but it's code we'd own, test and keep secure for payments, and it
  doesn't fit in the time before v1.

## Consequences

- Gifts land in Admire directly; JCN's existing donor records and receipts keep
  working.
- The form's look is Admire's, not the site's design system.
- The CSP / `netlify.toml` headers must allow the embed's origin.
- Preselecting a fund ("Support Tikva House") depends on Admire supporting a
  parameter for it. If it doesn't, that's a known gap.
- Mobile height needs a fixed value or a resize script from Admire.

## Open questions

- Embed setup and testing: jewishcaringnetwork/www-test#31
- Custom integration later: jewishcaringnetwork/www-test#40
