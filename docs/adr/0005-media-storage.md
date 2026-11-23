# 5. Media storage: a shared images folder, no video files

- Status: accepted
- Date: 2026-11-22

## Context

Pages need photos (Tikva House, the home hero, people). `image()` paths in
content JSON are relative to the JSON file, so the repo needs a convention for
where images live. Astro resizes images referenced through `image()` at build
time and publishes only the processed copies.

The repo is public, though. Every file committed to it can be downloaded from
GitHub at full size, metadata included, whatever the site publishes.

## Decision

- **Images** live in one shared folder, `content/images/`, referenced from
  content with `image()` (e.g. `"src": "../images/tikva-house-exterior.jpg"`
  from `content/pages/tikva-house.json`). Name files for what they show, in
  kebab-case: `tikva-house-exterior.jpg`, not `IMG_4031.jpg`.
- **Commit only what you'd publish.** Crop and resize an image before committing
  it, and strip location and camera metadata. The committed file is public, not
  just the resized copies.
- **Video** is never stored in the repo. It's a link or an embed (YouTube,
  Vimeo); a video block, if one is ever needed, takes a URL.

## Alternatives rejected

- **Images next to each page's JSON:** simplest paths, but turns pages into
  folders and makes reusing a photo across pages awkward.
- **Images in `src/assets/`:** code-owned, mixed in with the site's own assets
  (logos).
- **Images in `public/`:** skips resizing and publishes the full-size files on
  the site itself.
- **Video files in git:** large, and every version stays in history and is
  downloaded on every clone and deploy.

## Consequences

- Photos can be reused across pages, at the cost of `../` paths whose depth
  depends on the page's folder.
- A deleted image stays in git history, so the "commit only what you'd publish"
  rule can't be fixed after the fact by deleting the file.
- `image()` fails the build when a referenced file is missing.

## Open questions

- Enforcing the image rule automatically (metadata, size):
  jewishcaringnetwork/www-test#7
- Where downloads such as PDFs live, and whether they need review:
  jewishcaringnetwork/www-test#8
- How staff add photos and files through the MCP server:
  jewishcaringnetwork/www-test#9
