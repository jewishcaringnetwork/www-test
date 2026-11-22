# 1. Host on Netlify

- Status: accepted
- Date: 2026-11-21

## Context

The site is static Astro plus one server-side piece: the MCP endpoint staff use
to edit content through Claude. It needs per-PR deploy previews, because a
preview's build is the check that gates content merges. Cloudflare Pages and
Netlify both offer this.

## Decision

Host on Netlify. Cloudflare was rejected to avoid platform coupling.

## Consequences

- Netlify coupling is real but small. The MCP endpoint is a Netlify Function
  (`netlify/functions/mcp.ts`) using `Netlify.env` and `config.rateLimit`, and
  the merge ruleset requires Netlify's deploy-preview check. Moving hosts means
  porting that function and re-pointing the required check; the Astro site and
  content move as-is.
- Secrets (`MCP_BEARER_TOKEN`, the GitHub App key) live in Netlify environment
  variables.
