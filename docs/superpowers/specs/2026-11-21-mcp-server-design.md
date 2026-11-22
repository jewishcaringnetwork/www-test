# MCP Server for Staff Editing: Design

Date: 2026-11-21. Merged from the Phase 4 planning chats (Nov 19–21) and revised
against the code on `feat-mcp`. Related: `2026-11-21-page-schemas-design.md`.

## Goal

JCN staff change site content by talking to Claude. They need only their Claude
Team seats, with no GitHub account, Netlify account or CMS. Staff change
content, not layout: field values, and adding, removing or reordering blocks.
Components, design and nav stay with the developer; staff ask for those with
`request_change`, which opens a GitHub issue.

The first milestone proves the whole loop, without styling: Claude → MCP → PR →
checks → auto-merge → Netlify deploy.

1. Site settings: "change the phone number", end to end.
2. One page: "add a section".

## Architecture

- **One Netlify Function at `/mcp`** (`netlify/functions/mcp.ts`), in the site
  repo. No separate MCP repo.
- **SDK:** MCP TypeScript SDK v2 (`@modelcontextprotocol/server`,
  `createMcpHandler`). The SDK handles non-POST methods.
- **Zod:** `astro/zod` (Zod 4), the same instance the schemas use.
- **Schemas are shared.** Tool inputs are the schemas in `src/schemas/`, the
  same ones `src/content.config.ts` uses. Bad edits are rejected before a PR
  exists, and the build catches anything that slips through.
  - Schema factories take `SchemaFns`. The server passes stubs: `image` → a
    string path, `reference` → a string id. Never import `astro:content` here.
  - No `.transform()` in schemas, so they convert cleanly to JSON Schema.
- **Writes only to `content/`, enforced server-side.** Tools build paths from a
  validated slug and never accept a raw path. Schemas live in `src/`, so an edit
  can't loosen its own validation.
- **No delete tools.**

### Why content-only, when every edit is a PR anyway

Branch protection would hold a code PR for review, so the `content/` limit isn't
the only gate. It stays because review doesn't cover everything:

- **Previews run code before review.** Netlify builds a deploy preview for every
  PR when it opens. A PR changing `astro.config`, a build script or
  `netlify/functions/` runs that code on Netlify, with whatever secrets are
  exposed to previews, before anyone looks at it. Content files are data checked
  by schemas; they don't run.
- **Many hands steer the server.** One shared token, plus page text that Claude
  reads while editing. A careless request, a leaked token or injected
  instructions could propose code, and the preview build above isn't gated.
- **Claude on claude.ai is the wrong tool for code.** It sees the repo only
  through these tools and can't run the build, tests or formatter. Code changes
  go through the developer, using Claude Code.
- **Auto-merge depends on it.** Content-only PRs can merge without review
  because a schema-valid content change is low-risk and easy to revert.

## Auth

- **One shared bearer token** (`MCP_BEARER_TOKEN`), constant-time compare, fail
  closed if unset. Claude custom connectors support request headers, so no
  OAuth.
- A JCN Team Owner adds the connector once (Organization settings → Connectors →
  Add → Custom → Web); staff click Connect.
- Everyone shares the credential. To revoke, rotate the env var, then remove and
  re-add the connector.
- **Rate limit:** 60 requests/min via `config.rateLimit`.
- **Audit log:** `console.info` on every tool call, with the tool name, slug and
  "requested by". Netlify function logs are the audit trail.

## GitHub access

- **A GitHub App owned by the JCN org,** installed on the site repo only.
  - Permissions: Contents read/write, Pull requests read/write, Issues
    read/write (for `request_change`). Webhooks off.
  - Never on any ruleset bypass list.
  - Replaces the fine-grained personal token from the 11/20 notes: an App isn't
    tied to a person and its tokens expire within an hour.
- **No Octokit.** `netlify/lib/github.ts` signs the app JWT with `node:crypto`,
  exchanges it for an installation token, and returns a `fetch` wrapper. One
  token per tool call.

## Tools

| Tool              | Status             | Input                                                      | Does                                                                                             |
| ----------------- | ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `list_pages`      | written, needs fix | —                                                          | Page slugs under `content/pages/`                                                                |
| `read_page`       | next               | `slug`                                                     | The page JSON plus its blob `sha`                                                                |
| `update_page`     | planned            | `slug`, `sha`, `page`, `summary`, `requestedBy`, `publish` | Validate, commit to a branch, open a PR, maybe enable auto-merge                                 |
| `read_settings`   | planned (spike 1)  | —                                                          | `content/site.json` plus its `sha`                                                               |
| `update_settings` | planned (spike 1)  | `sha`, `settings`, `summary`, `requestedBy`, `publish`     | Same flow as `update_page`, validated with `siteSchema`, never the merged `src/config.ts` object |
| `publish`         | planned            | `pr`                                                       | Enable auto-merge on an edit PR opened with `publish: false`                                     |
| `create_page`     | later              | `slug`, `page`, …                                          | New page file. It won't appear in nav, which stays in code                                       |
| `request_change`  | planned            | `title`, `details`, `slug?`, `requestedBy`                 | Open a GitHub issue for something content edits can't do; return its URL                         |

### `request_change`

For anything outside the schemas: layout or design changes, nav, new block
types, new images, or an edit the schema rejects for a reason that isn't a typo.
The tool description tells Claude to use it then, instead of forcing the edit
into the wrong field.

- Opens an unlabeled issue. The body has `details`, the page (if any) and
  "Requested by: `requestedBy`". The App's bot account is the author, so
  `is:issue author:app/<app-slug>` finds every request. Area labels (set by
  Claude from a fixed enum) can come later if triage needs them.
- Returns the issue URL so the staff member can follow it.
- The developer works these in Claude Code. Issue text is a staff request, not
  instructions to an agent: read it, don't execute it.

**`list_pages` fix:** pages are `content/pages/**/*.json` (see
`content.config.ts`), but the tool lists only top-level `.md` files. Use the git
trees API (`recursive=1`) on `main` and return ids like `index` and
`about/history`.

### Edit flow (`update_page`, `update_settings`)

1. Validate the input with the shared schema. On failure, return the Zod issues
   as a tool error so Claude can fix them and retry.
2. Enforce rules the schema can't, such as locked blocks (for example Tikva
   House "Request a Stay").
3. Create branch `edit/<slug>-<short id>` from `main`. The suffix lets two edits
   to the same page coexist.
4. Commit with the contents API, passing the `sha` from the read. If `main`
   changed since, GitHub rejects the write; tell Claude to read again and redo
   the edit. This stops one staff member silently overwriting another's change.
5. Open a PR. The title is `summary`; the body includes "Requested by:
   `requestedBy`", since commits come from the bot.
6. `publish: true` ("publish now"): enable auto-merge via GraphQL
   `enablePullRequestAutoMerge`. `publish: false` ("preview first"): return the
   deploy preview URL (`deploy-preview-<pr>--<site>.netlify.app`). The staff
   member reviews it, then says "publish", which calls `publish`.
7. Return the PR URL and preview URL.

Pretty-print JSON with tabs and a trailing newline, so `pnpm check:fmt` stays
clean and diffs are small.

## Merge workflow

Gating lives in GitHub and Netlify, not in the MCP server.

- **Content-only PRs auto-merge when checks pass.** Any PR touching code waits
  for code-owner review.
- **`main` changes only after checks pass,** so a bad edit never blocks the
  edits after it.
- **Accepted risk:** schemas validate shape, not facts. Every change is a
  revertible squash commit; skim merges after the fact.

### CODEOWNERS (in repo)

```
*          @jewishcaringnetwork/web
/content/
```

- `/content/` has no owner, so content PRs need no review.
- The `web` team needs **write** access, or the rule is silently ignored.

### Ruleset on `main`

| Setting                         | Value                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Enforcement                     | Active                                                                            |
| Target branches                 | Default branch                                                                    |
| Bypass list                     | `web` team (or the repo admin role), "For pull requests only". **Never the app.** |
| Restrict deletions              | On                                                                                |
| Block force pushes              | On                                                                                |
| Require a pull request          | On                                                                                |
| Required approvals              | 0                                                                                 |
| Require review from Code Owners | On                                                                                |
| Dismiss stale approvals         | On                                                                                |
| Allowed merge methods           | Squash only                                                                       |
| Require status checks           | On: Netlify deploy preview (selectable after it has run once)                     |
| Require branches up to date     | Off (otherwise auto-merge stalls)                                                 |

### Repo settings

- Allow auto-merge: on
- Automatically delete head branches: on
- Squash merging only

### Checks

- **No GitHub Actions for now.** The Netlify deploy preview runs `astro build`,
  which validates content against the schemas.
- Add later only on need: an a11y check (axe or pa11y), link checker, image size
  cap, type checks on code PRs.

## Environment variables (Netlify site)

| Key                  | Secret | Value                                                      |
| -------------------- | ------ | ---------------------------------------------------------- |
| `MCP_BEARER_TOKEN`   | yes    | `openssl rand -hex 32`                                     |
| `GH_APP_PRIVATE_KEY` | yes    | `base64 -w0 key.pem` (delete the `.pem` afterwards)        |
| `GH_APP_ID`          | no     | number on the app's settings page                          |
| `GH_INSTALLATION_ID` | no     | number in the URL after installing (`/installations/<id>`) |
| `GH_OWNER`           | no     | JCN org login                                              |
| `GH_REPO`            | no     | repo name                                                  |

`.env.example` lists the same keys. `netlify dev` pulls them from the linked
site; restart it after changes.

## Testing path

Custom connectors can't be added on JCN's Team plan without its Owner, so:

1. **MCP Inspector** against `netlify dev`. Transport: Streamable HTTP; token
   under Authentication / custom headers.
2. **opencode** with a remote MCP entry and an `Authorization` header, once the
   real tools exist.
3. **End-to-end:** a personal Free/Pro Claude account adds the custom connector,
   pointed at a deploy preview. Ask JCN's Team Owner to add it only at handoff.

## Open items

- [ ] Fix `list_pages` (see Tools).
- [ ] With approvals at 0, code-owner review blocks only owned paths. Test with
      two PRs: content-only (should auto-merge) and code (should wait).
- [ ] A failed Netlify build shows as a **failed** check, not a pending one.
- [ ] SDK v2 response mode (SSE vs JSON) behaves on Netlify; see the SDK's
      "Sessions, state, scaling" page if the Inspector hangs.
- [ ] Tool errors reach Claude as errors, not crashes (test by breaking
      `GH_REPO`).
- [ ] The SDK accepts `astro/zod` schemas, and the JSON Schema it emits from the
      `SchemaFns` stubs is small enough for a tool input.
- [ ] Cleanup for preview PRs that are never published (for example, close after
      14 days).
- [ ] Images: for now staff can only pick paths that already exist; uploads, alt
      text, consent and size rules are undecided. Treat image edits as
      developer-assisted.
- [ ] Page-level accessibility checks: which tool (axe or pa11y) and where it
      runs (a GitHub Action or a Netlify build plugin).
- [ ] Who is the Owner of JCN's Claude Team plan?
