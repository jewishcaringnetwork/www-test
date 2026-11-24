# WordPress redirects

`public/_redirects` sends old WordPress URLs to their v1 pages with a 301. Astro
copies it to the build output, where Netlify reads it. Tracked in
jewishcaringnetwork/www-test#34.

## Source

The slugs come from the `tfsu_posts` table in the WordPress database dump of
2026-10-15 (published pages, posts and public custom post types). The dump is
not in this repo. The old site used `/%postname%/` permalinks, so pages nest
under their parent and posts sit at the top level.

## Rules

- A 301 means the page moved, so an old URL gets one only when v1 has a real
  counterpart: History & Mission to `/about/history`, a fund or campaign page to
  `/donate`, the wish list to `/get-involved`.
- An old URL with no counterpart has no rule and 404s: the 5K, news and events,
  the old blog posts, resources and videos, the shop, caring journals, the HTML
  sitemap and the legal pages. If one of these comes back, it needs no redirect.
- The Tehillim List is deferred, not removed (www-test#37). Its new page can
  keep `/get-involved/tehillim-list`. When it lands, point
  `/get-involved/tehillim-list/submit-an-entry` and `/tehillim/*` (one page per
  name) at it.
- Yoast's `/sitemap_index.xml` and WordPress's `/wp-sitemap.xml` go to
  `/sitemap-index.xml`, the index that `@astrojs/sitemap` writes. The sitemap
  itself is a launch-checklist item.
- Attachment pages (one per uploaded image) and `/wp-content/uploads/`
  files 404.
- Netlify skips a redirect when a page exists at its `from` path.

## Pages still being built

Some targets are planned routes, taken from the nav in `src/config.ts`:
`/about`, `/contact`, `/get-involved/volunteer`, `/family-stories` and
`/family-stories/share`. Until those pages exist, their redirects land on a 404.
`/contact` and `/get-involved/volunteer` keep their old paths, so they need no
rule.
