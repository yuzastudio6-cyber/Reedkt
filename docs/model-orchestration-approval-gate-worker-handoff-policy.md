# Approval Gate Worker Handoff Policy

Provider responses, agent findings, edit intents, and candidate snapshots are metadata only.

Only a future approved plan snapshot can be considered by separate worker phases, and those phases still require their own approvals, credit gates, source-of-truth refs, and runtime safety checks.

Source of truth requires Supabase row refs, private manifest/GCS refs, checksum refs, and approved snapshot refs. Signed URLs are never source of truth.
