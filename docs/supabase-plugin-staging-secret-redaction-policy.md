# Supabase Plugin Staging Secret Redaction Policy

This phase may record booleans and redacted status fields only.

## Allowed

- Project ref and project name as safe target metadata.
- Credential presence booleans.
- Supabase CLI version status.
- Migration IDs and safe schema/RLS report status.
- Blocker names and operator action summaries.

## Forbidden

- DB URLs.
- Service-role keys, anon keys, JWT secrets, access tokens, refresh tokens, provider keys, or Secret Manager payloads.
- Full environment dumps.
- Signed URLs.
- Raw Supabase command output if it contains credentials.
- Private artifact contents, media/audio/model payloads, user PII, or raw prompts.

If a secret pattern appears in generated reports, the smoke test must fail and the phase must be treated as blocked.
