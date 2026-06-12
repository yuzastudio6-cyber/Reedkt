# Worker Runtime No-Op Dry-Run Artifact Scope

The no-op dry-run accepts only private, synthetic source-of-truth references from PR #342 fixtures: Supabase row refs, private GCS path refs, manifest refs, and checksum refs.

Public artifact URLs, signed URLs as source of truth, raw provider responses, raw prompts, unapproved local media paths, private payload commits, and artifact uploads remain blocked.
