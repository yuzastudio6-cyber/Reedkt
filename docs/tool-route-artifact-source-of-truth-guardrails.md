# Tool-Route Artifact Source-Of-Truth Guardrails

Source of truth requires approved snapshot refs, future Supabase row refs, private GCS path refs, manifest ids, and checksums. Signed URLs are never source of truth. Public artifacts, arbitrary paths, unapproved GCS prefixes, private payload commits, uploads, and output delivery are blocked in this phase.
