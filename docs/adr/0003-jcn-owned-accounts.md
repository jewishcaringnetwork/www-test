# 3. JCN owns the repo and hosting accounts

- Status: accepted
- Date: 2026-11-21

## Context

The site is built by an outside developer but must outlive that engagement.
Projects started on a developer's personal accounts tend to need a risky
transfer later, or get stranded.

## Decision

From day one, including the spike, the repo lives in the JCN GitHub org
(`jewishcaringnetwork`) and the site in a JCN-owned Netlify team. The developer
is a member of each. The GitHub App that the MCP server uses is also owned by
the JCN org.

## Consequences

- No transfer at handoff; JCN can remove the developer's access at any time.
- Someone at JCN must hold owner access to the GitHub org, the Netlify team and
  the Claude Team plan (which adds the MCP connector).
