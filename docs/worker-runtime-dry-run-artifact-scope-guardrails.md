# Worker Runtime Dry-Run Artifact Scope Guardrails

Future worker source of truth must combine Supabase row refs, private GCS path refs, artifact manifest refs, checksums, and approved plan snapshot refs.

Signed URLs, public artifact URLs, arbitrary local paths, unapproved prefixes, raw provider responses, raw prompts, and committed private payloads are blocked.
