# jaredgoldberg.ca

Personal website project for jaredgoldberg.ca.

## Secrets

This project is prepared for a contact form or other server-side integration that needs secrets.

Use `.env.example` as the committed template. Put real values in `.env.local` locally, and configure production values in the hosting provider's secret/environment variable settings.

Do not commit `.env`, `.env.local`, API keys, form secrets, email provider tokens, or anti-spam secret keys.

The repository uses `.githooks/pre-commit` to block common accidental secret commits. Enable it with:

```sh
git config core.hooksPath .githooks
```

