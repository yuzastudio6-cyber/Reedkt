# Second Controlled Candidate Artifact Guardrails

Source of truth is private metadata only: approved snapshot refs, future Supabase row refs with no write in this phase, private GCS path refs with no upload, manifest ids, and checksums. Signed URLs are never source of truth. Public artifacts, arbitrary paths, unapproved GCS prefixes, private payload commits, uploads, and output delivery are blocked.
