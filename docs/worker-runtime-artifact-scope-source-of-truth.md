# Worker Runtime Artifact Scope And Source Of Truth

Source of truth for future workers must combine Supabase row refs, private GCS path refs, artifact manifest IDs, checksums, and approved plan snapshot refs.

Signed URLs and public artifacts are never source of truth. Workers may only read or write explicit approved private artifact scopes in a later separately approved phase.
