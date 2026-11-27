# 7. v1 launches without staff editing

- Status: accepted
- Date: 2026-11-23
- Amends: [2. No CMS](0002-no-cms-content-in-repo.md)
- Amended by: [ADR 9](0009-pages-in-plain-astro-until-mcp.md) (pages in plain
  Astro until staff editing)

## Context

At the 11/23 client meeting, v1 was set for Wednesday 11/25: all pages ready,
donate working, design final. Staff editing through Claude needs setup that
isn't done (GitHub App, ruleset on `main`, Netlify env vars, the Claude Team
connector) and testing with staff.

## Decision

Staff editing through Claude is deferred to a later iteration. Content still
lives in `content/` and is validated by the schemas, as in ADR 2; until editing
ships, changes go through the developer.

## Consequences

- ADR 2's content model is unchanged. Only the editing path waits.
- The schemas' descriptions should still be written for Claude, so editing can
  be switched on without rewriting them.
- The MCP endpoint already deployed stays, but no connector is added for staff.

## Open questions

- Finishing staff editing: jewishcaringnetwork/www-test#41
- Photos and files through the MCP server: jewishcaringnetwork/www-test#9
