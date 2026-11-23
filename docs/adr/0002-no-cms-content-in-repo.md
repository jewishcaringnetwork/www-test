# 2. No CMS: content lives in the repo, edited through Claude

- Status: accepted
- Date: 2026-11-21
- Amended by: [ADR 7](0007-v1-without-staff-editing.md) (staff editing deferred
  past v1)

## Context

JCN staff need to update site content without learning a developer workflow.
They already have Claude Team seats; they have no GitHub or Netlify accounts and
shouldn't need them.

## Decision

- No CMS at launch. Content is files in a root `content/` folder (JSON for pages
  and people, Markdown for stories), loaded by Astro content collections and
  validated by Zod schemas in `src/schemas/`.
- Staff edit by talking to Claude through a custom MCP server that opens PRs on
  their behalf. Design:
  `docs/superpowers/specs/2026-11-21-mcp-server-design.md`.
- Launch content comes from the Phase 2 content draft, not WordPress. The
  WordPress dump is too messy to migrate and is used only as reference (old
  URLs, media, family stories).

## Alternatives rejected

- **Sanity:** content hosted in their cloud; vendor lock-in.
- **EmDash:** effectively tied to Cloudflare, young (0.x beta), and stores
  content in a database rather than the repo.

## Consequences

- Every content change is a reviewable, revertible commit, and the build rejects
  content that doesn't match the schemas.
- Staff get no form UI. If they want one later, a git-based CMS (Sveltia or
  Keystatic) can sit on the same files without a migration.
- Schema descriptions carry the editorial rules, since Claude reads them as tool
  input docs.
