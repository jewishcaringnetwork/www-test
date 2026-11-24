# WordPress redirects

The `[[redirects]]` in `netlify.toml` send every old WordPress URL to its v1
page with a 301. Tracked in jewishcaringnetwork/www-test#34.

## Source

The slugs come from the `tfsu_posts` table in the WordPress database dump of
2026-10-15 (published pages, posts and public custom post types). The dump is
not in this repo. The old site used `/%postname%/` permalinks, so pages nest
under their parent and posts sit at the top level.

Attachment pages (one per uploaded image) and `/wp-content/uploads/` files are
not redirected: they 404.

## Rules

- A page that has a v1 counterpart goes there (History & Mission to
  `/about/history`, Board & Staff to `/about/leadership`).
- A removed page goes to the nearest parent that still exists: wish list and
  Tehillim to `/get-involved`, Planning Your Stay to `/tikva-house`. Removed
  top-level sections (the 5K, news and events with the old blog posts,
  resources, the shop, caring journals) go to Home.
- Donation pages (funds, campaign and thank-you pages) go to `/donate`.
- Netlify skips a redirect when a page exists at its `from` path, so a rule
  stops applying once v1 adds a page there (for example `/privacy-policy`).

## Pages still being built

Some targets are planned routes, taken from the nav in `src/config.ts`: `/`,
`/about`, `/contact`, `/get-involved/volunteer`, `/family-stories` and
`/family-stories/share`. Until those pages exist, their redirects land on a 404.
`/contact` and `/get-involved/volunteer` keep their old paths, so they need no
rule.
