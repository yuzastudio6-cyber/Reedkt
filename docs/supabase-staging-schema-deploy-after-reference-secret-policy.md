# Supabase Staging Schema Deploy After Reference Secret Policy

This phase may detect credential presence only. It must never print or commit:

- DB URLs.
- Access tokens.
- Service-role keys.
- Anon keys.
- JWT secrets.
- Passwords.
- Signed URLs.
- Secret Manager payloads.
- Provider keys.
- Private media URLs or payloads.

Reports may include only redacted status such as `provided`, `missing`, `blocked`, or `not_required`.

Forbidden confirmations remain blocked:

- Production SQL/write confirmations.
- Track B backfill/write confirmations.
- Secret payload print/access confirmations.
- Provider, tool, worker, route, media, public-output, beta, production, and Track A confirmations.

The staging schema deploy wrapper must stop before mutation if any forbidden confirmation is present.
