# Launch checklist

Work that must be done before the Phase 4 site replaces the WordPress site.
Decisions behind these are in `docs/adr/`. Tracked in
jewishcaringnetwork/www-test#36.

Launch has two steps. **Ready** means v1 is built and tested on the Netlify URL
(the "v1: ready to go live" milestone, due 11/25). **Live** is the DNS cutover,
done separately afterwards.

## Ready

- [ ] Everything in the "v1: ready to go live" milestone is closed.
- [ ] Prototype-only code removed: jewishcaringnetwork/www-test#35
- [ ] Redirect map from every old WordPress URL to its new page:
      jewishcaringnetwork/www-test#34
- [ ] Titles, meta descriptions, OG image and favicon on every page.
- [ ] Accessibility pass: keyboard, focus, contrast, form labels.
- [ ] Lighthouse on Home, Tikva House and Donate.
- [ ] Client signs off on v1 at the Netlify URL.

## Repo

- [ ] Rename the repo from `www-test` to its final slug (`.env.example` assumes
      `website`), then `git remote set-url origin` on each checkout.
- [ ] Set `GH_REPO` on the Netlify site to the new slug; confirm the site is
      still linked to the repo.

## Live

- [ ] Full WordPress backup (database plus `wp-content`) kept.
- [ ] Remove `noindex`.
- [ ] DNS: record the current records first; don't touch MX/email; lower the TTL
      a day ahead.
- [ ] Add the custom domain in Netlify and confirm SSL is issued.
- [ ] Forms tested end to end in production.
- [ ] Donate embed tested in production.
- [ ] Redirects spot-checked on the live domain.
- [ ] Old hosting kept running for 2 weeks as a fallback.

## After launch

- Staff editing through Claude is deferred (ADR 7):
  jewishcaringnetwork/www-test#41
