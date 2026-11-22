# Launch checklist

Work that must be done before the Phase 4 site replaces the WordPress site.
Decisions behind these are in `docs/adr/`.

## Repo

- [ ] Rename the repo from `www-test` to its final slug (`.env.example` assumes
      `website`), then `git remote set-url origin` on each checkout.
- [ ] Set `GH_REPO` on the Netlify site to the new slug; confirm the site is
      still linked to the repo.
- [ ] Remove prototype-only code (for example `src/pages/test/`).

## Content

- [ ] Load launch content from the Phase 2 content draft. Use the WordPress dump
      only for old URLs, media and family stories.
- [ ] Redirect map from every old WordPress URL to its new page.

## Staff editing

- [ ] Finish the setup and open items in
      `docs/superpowers/specs/2026-11-21-mcp-server-design.md` (GitHub App,
      ruleset on `main`, Netlify env vars, testing).
- [ ] JCN's Claude Team Owner adds the MCP connector.
