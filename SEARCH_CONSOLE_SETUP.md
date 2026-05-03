# Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://jaredgoldberg.ca`
3. Prefer Domain property if DNS access is available.
4. Verify ownership using the DNS TXT record Google provides.
5. After verification, submit sitemap:

```
https://jaredgoldberg.ca/sitemap.xml
```

6. Use URL Inspection to test:
- `https://jaredgoldberg.ca/`
- `https://jaredgoldberg.ca/about/`
- `https://jaredgoldberg.ca/work/`
- `https://jaredgoldberg.ca/writing/`
- `https://jaredgoldberg.ca/projects/`
- `https://jaredgoldberg.ca/contact/`

7. After indexing begins, monitor:
- Performance → Queries
- Performance → Pages
- Indexing → Pages
- Sitemap status
- URL Inspection

---

**Note:** This file cannot complete Search Console ownership verification unless the Google verification token or DNS access is provided. The steps above explain the manual process clearly.