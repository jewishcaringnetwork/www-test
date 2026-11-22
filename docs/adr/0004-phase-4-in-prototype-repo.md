# 4. Build Phase 4 in the prototype repo

- Status: accepted
- Date: 2026-11-21
- Supersedes: the Nov 19–21 planning note "new repo for Phase 4"

## Context

The plan was to keep this repo as a throwaway prototype and port selected pieces
(design tokens and the sugarcube build, the CUBE CSS foundation on
`@kochav/css`, the layout shell, photos, agent rules) into a new repo. Since
then the real content schemas and the MCP function have been built here, and the
repo already lives in the JCN org.

## Decision

Keep building in this repo. Rename it from `www-test` to its final slug instead
of starting a new one.

## Consequences

- History is kept, and nothing needs porting.
- Prototype-only code has to be removed before launch (see
  `docs/launch-checklist.md`).
- The rename touches the git remote and the `GH_REPO` environment variable.
  GitHub redirects the old URL and the App installation follows the repo; check
  that the Netlify site is still linked.
