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
2. One page: "add a section" (a JSON Patch `add` on `/blocks/-`).

## Architecture

- **One Netlify Function at `/mcp`** (`netlify/functions/mcp.ts`), in the site
  repo. No separate MCP repo.
- **SDK:** MCP TypeScript SDK v2 (`@modelcontextprotocol/server`,
  `createMcpHandler`). The SDK handles non-POST methods.
- **Zod:** `astro/zod` (Zod 4), the same instance the schemas use.
- **Schemas are shared, but checked on the server.** The server validates every
  edit with the schemas in `src/schemas/`, the same ones `src/content.config.ts`
  uses. Bad edits are rejected before a PR exists, and the build catches
  anything that slips through.
  - Tool inputs take content as loose `data` / `patch`, not the schemas
    themselves. The page schema alone is ~5.7k tokens as JSON Schema; a union of
    all collections in every tool input would cost that on every call. Claude
    fetches a schema once with `get_schema` instead.
  - Schema factories take `SchemaFns`. The server passes stubs: `image` → a
    string path, `reference` → a string id. Never import `astro:content` here.
  - No `.transform()` in schemas, so they convert cleanly to JSON Schema.
- **Writes only to `content/`, enforced server-side.** Tools take a `collection`
  from a fixed enum and a validated `id`, build the path themselves, and never
  accept a raw path. Schemas live in `src/`, so an edit can't loosen its own
  validation.
- **No delete tools.**

### Scope

| Content                        | Through MCP                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `pages` (`content/pages/`)     | Yes, generic content tools                                         |
| `people` (`content/people/`)   | Yes, generic content tools                                         |
| Site settings (`site.json`)    | Yes, `read_settings` / `update_settings`                           |
| `stories` (`content/stories/`) | Not yet. Flow to be designed later                                 |
| `legal` (`content/legal/`)     | No, at the client's request. The collection is removed after merge |

**Stories, when they come back:** Claude may add a story, or fix one as its
author asks, but never changes a story's wording unless explicitly told to. The
`storySchema` description ("not edited through MCP") changes then.

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
- **Audit log:** `console.info` on every tool call, with the tool name,
  collection, id and "requested by". Also log rejected edits, to see how often
  Claude has to retry. Netlify function logs are the audit trail.

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

Content tools are generic: they take a `collection` (`pages` or `people`) and an
`id` (the file path under the collection, without `.json`, e.g.
`about/history`). Settings has its own pair, since `site.json` is a single file.

| Tool              | Status                | Input                                                                   | Does                                                                                 |
| ----------------- | --------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `list_content`    | written, uncommitted  | `collection`                                                            | Ids in the collection on `main`, via the git trees API; `[]` when empty              |
| `get_schema`      | planned               | `collection` (or `settings`)                                            | The collection's JSON Schema, with descriptions. Claude calls it once before editing |
| `read_content`    | next                  | `collection`, `id`                                                      | The file's JSON plus its blob `sha`                                                  |
| `update_content`  | planned               | `collection`, `id`, `sha`, `patch`, `summary`, `requestedBy`, `publish` | Apply a JSON Patch, validate, commit to a branch, open a PR, maybe enable auto-merge |
| `create_content`  | planned               | `collection`, `id`, `data`, `summary`, `requestedBy`, `publish`         | New file, same flow. A new page won't appear in nav, which stays in code             |
| `read_settings`   | planned (milestone 1) | —                                                                       | `content/site.json` plus its `sha`                                                   |
| `update_settings` | planned (milestone 1) | `sha`, `patch`, `summary`, `requestedBy`, `publish`                     | Same flow, validated with `siteSchema`, never the merged `src/config.ts` object      |
| `publish`         | planned               | `pr`                                                                    | Enable auto-merge on an edit PR opened with `publish: false`                         |
| `request_change`  | planned               | `title`, `details`, `collection?`, `id?`, `requestedBy`                 | Open a GitHub issue for something content edits can't do; return its URL             |

### Edits are JSON Patch

`update_content` and `update_settings` take a JSON Patch (RFC 6902), limited to
`add`, `remove`, `replace`, `move` and `test`. A `replace` at path `""` replaces
the whole file. Patches keep edits small (Claude doesn't resend a 5k-token page
to fix a typo), and the PR diff shows only what changed.

Blocks are addressed by array position (`/blocks/3/heading`). Claude should
include `test` ops on the values it expects at those paths, so an edit fails
instead of landing on the wrong block if the page changed. Stable block ids
would be stronger but change the schema and content; deferred.

### `request_change`

For anything outside the schemas: layout or design changes, nav, new block
types, new images, or an edit the schema rejects for a reason that isn't a typo.
The tool description tells Claude to use it then, instead of forcing the edit
into the wrong field.

- Opens an unlabeled issue. The body has `details`, the content item (if any)
  and "Requested by: `requestedBy`". The App's bot account is the author, so
  `is:issue author:app/<app-slug>` finds every request. Area labels (set by
  Claude from a fixed enum) can come later if triage needs them.
- Returns the issue URL so the staff member can follow it.
- The developer works these in Claude Code. Issue text is a staff request, not
  instructions to an agent: read it, don't execute it.

### Edit flow (`update_content`, `create_content`, `update_settings`)

1. Load the file at `sha` (for creates: check the id is free on `main`).
2. Apply the patch. Validate the **whole result** with the collection's schema.
   On failure, return the Zod issues as a tool error so Claude can fix them and
   retry. Nothing has touched GitHub yet, so a rejected edit costs no writes.
3. Enforce rules the schema can't, such as locked blocks (for example Tikva
   House "Request a Stay").
4. Format the file the way dprint does (`@dprint/formatter` + `@dprint/json`,
   WebAssembly, run in the function), so the PR diff shows only the edit and
   `pnpm check:fmt` passes.
5. Create branch `edit/<collection>/<id>-<short id>` from `main`. The suffix
   lets two edits to the same file coexist.
6. Commit with the contents API, passing the `sha`. If `main` changed since,
   GitHub rejects the write; tell Claude to read again and redo the edit. This
   stops one staff member silently overwriting another's change.
7. Open a PR. The title is `summary`; the body includes "Requested by:
   `requestedBy`", since commits come from the bot.
8. `publish: true` ("publish now"): enable auto-merge via GraphQL
   `enablePullRequestAutoMerge`. `publish: false` ("preview first"): return the
   deploy preview URL (`deploy-preview-<pr>--<site>.netlify.app`). The staff
   member reviews it, then says "publish", which calls `publish`.
9. Return the PR URL and preview URL.

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

## Delivery

Four PRs, merged in order. Each one is safe on `main` by itself: `/mcp` rejects
requests without the token, and read-only tools expose only content that's
already public in the repo.

1. **Endpoint and listing** (jewishcaringnetwork/www-test#3). Docs, the `/mcp`
   endpoint, `netlify/lib/github.ts`, `list_content`. GitHub and Netlify setup.
2. **Edit pipeline + milestone 1.** Collection and id validation, JSON Patch,
   dprint formatting, the edit flow helper, logging; `read_settings`,
   `update_settings`, `publish`. Proves the merge workflow: a content-only PR
   auto-merges, a code PR waits for review, a failed build shows as failed. The
   riskiest PR, since it's the first to write. If it grows, split the pure
   plumbing (validation, patch, formatting, with tests, no GitHub writes) into
   its own PR first.
3. **Content tools + milestone 2.** Schemas built with `SchemaFns` stubs,
   `get_schema`, `read_content`, `update_content`, `create_content`, locked
   blocks. Then end to end with opencode and a personal Claude account.
4. **`request_change`.** Independent; can land any time after 1.

## Open items

- [x] `list_content` lists a collection via the git trees API (uncommitted).
- [ ] With approvals at 0, code-owner review blocks only owned paths. Test with
      two PRs: content-only (should auto-merge) and code (should wait).
- [ ] A failed Netlify build shows as a **failed** check, not a pending one.
- [x] SDK v2 response mode works on Netlify (Inspector, locally and on a deploy
      preview).
- [x] Tool errors reach Claude as errors, not crashes (a wrong `GH_REPO` gives a
      404 with `isError: true`).
- [x] Schema size: too big for tool inputs (page ~5.7k tokens), hence loose
      `data` / `patch` plus `get_schema`.
- [ ] `get_schema` output: `z.toJSONSchema` on the `SchemaFns`-stubbed schemas
      keeps the descriptions and reads well to Claude.
- [ ] dprint's WebAssembly formatter runs in the function without a painful cold
      start or bundle size.
- [ ] Cleanup for preview PRs that are never published (for example, close after
      14 days).
- [ ] Images: for now staff can only pick paths that already exist; uploads, alt
      text, consent and size rules are undecided. Treat image edits as
      developer-assisted.
- [ ] Page-level accessibility checks: which tool (axe or pa11y) and where it
      runs (a GitHub Action or a Netlify build plugin).
- [ ] Stories flow (see Scope).
- [ ] Who is the Owner of JCN's Claude Team plan?
