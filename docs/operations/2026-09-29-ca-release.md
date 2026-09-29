# jaredgoldberg.ca release record — 2026-09-29

## Initial application release verification

- Released content/navigation commit: `91fbd8bf7425d536c0ccb94bd923beed36b6e6ca`.
- Previous production baseline: `c87b9b4a72055f467c5e742d1f3cec141a135069`.
- Production already matched the release, so the closeout performed no file upload and created no new backup.
- Verified production SHA-256 values:
  - `index.html`: `39ad21ed8cd38d333f3e47be41a2e860f104cf39f8a7c86e821ad54dcac4084d`
  - `about/index.html`: `71dbdfb318b9c4175eace7bc18e1ea3102e8be38d94c7ce42449c4a71b1a0fa6`
  - `assets/css/components.css`: `fda13b6e600b23714ee1b37356808119b1f4dd06f8a398ea1ee3eeb6503b3a51`

## Follow-up origin deployment

At 2026-09-29 21:02 UTC, the About portrait restoration from commit
`f504416b4378773a98b98785607edf7b74683ed3` was deployed to the origin.
Only `about/index.html` changed; the deployment used its exact destination
filename and no delete operation.

- Before SHA-256: `71dbdfb318b9c4175eace7bc18e1ea3102e8be38d94c7ce42449c4a71b1a0fa6`.
- After SHA-256: `8bfd8b5118e2b1a374a0ae25edacebe6acba3eca82a7efc8da6634a97c3ec209`.
- Backup: `/var/backups/jaredgoldberg.ca/20260929T210228Z-17fefbb/about/index.html`.
- Post-deployment checksum dry run: all 59 tracked deployable files matched the origin.

## Cloudflare WWW redirect

- Rule name: `Redirect from WWW to root [Template]`.
- Request pattern: `https://www.jaredgoldberg.ca/*` (unchanged).
- Status: `301` (unchanged).
- Query preservation: enabled (unchanged).
- Rule position: unchanged.
- Target URL before: `https://www.jaredgoldberg.ca/${1}`.
- Target URL after: `https://jaredgoldberg.ca/${1}`.
- Rollback Target URL: `https://www.jaredgoldberg.ca/${1}`.
- Trace `step_name`: not recorded as a rule ID. Any `step_name` from Cloudflare Trace is a trace identifier unless independently confirmed as the dashboard rule ID.

Independent public verification on 2026-09-29:

- HTTPS `www` requests for `/`, `/about/` with a query string, `/writing/`, and `/sitemap.xml` reached the matching HTTPS apex URL in one redirect and returned `200`.
- HTTP `www` requests for the same paths reached the matching HTTPS apex URL in two redirects and returned `200`.
- The About query string `?utm_source=redirect-test&x=1` was preserved.
- The HTTPS apex home returned `200` with no redirect.
- No redirect loop was observed.

This file records an externally managed Cloudflare setting. Committing it does not deploy, update, or roll back the Cloudflare rule.
