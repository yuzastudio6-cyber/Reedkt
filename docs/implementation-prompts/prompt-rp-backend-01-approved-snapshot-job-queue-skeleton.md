# RP-BACKEND-01-APPROVED-SNAPSHOT-JOB-QUEUE-SKELETON

Use this prompt after `RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS` records reviewed schema/RLS readiness.

Implement backend-only approved snapshot persistence and job queue skeletons for the internal beta lane. Jobs must reference immutable approved plan versions, idempotency keys, leases, status events, artifact manifest placeholders, cleanup hooks, and structured error categories.

Do not execute workers, providers, tools, media processing, Remotion renders, FFmpeg/FFprobe, Supabase production writes, SQL deployment, public artifacts, signed URL source-of-truth flows, billing, external beta, production, or final delivery.
