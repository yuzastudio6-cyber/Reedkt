# WORKER-RUNTIME-UNLOCK-1: Worker Runtime Dry-Run Plan, No Execution

## Summary

Use the WORKER-RUNTIME-UNLOCK-0 repo audit as source-of-truth to design a metadata-only worker runtime dry-run plan. This prompt must not execute workers, dispatch jobs, claim leases, mutate Supabase, run SQL, deploy Cloud Run, run Docker, call providers, execute tools/routes, process media, create artifacts, create signed URLs, reserve/spend credits, unlock beta, or unlock production.

## Source Inputs

- `docs/worker-runtime-unlock-0-repo-audit.md`
- `docs/activation-worker-runtime-unlock-0-repo-audit-reports/*`
- PR #335 plan snapshot handoff reports
- Existing worker/runtime docs and mock-only contracts

## Required Output

- A dry-run planning packet that defines synthetic worker dry-run cases, expected worker payload shapes, blocked mutation gates, and diagnostic-only validation.
- No executable worker payloads and no job claim/lease mutation.
- Supabase persistence remains blocked pending Supabase owner approval.

## Runtime Gates

Keep blocked: worker execution, job dispatch, job claim/lease mutation, Supabase writes, SQL, migrations, Cloud Run, Docker, providers, tools/routes, media, public artifacts, signed URLs, credit mutation, Stripe, Demucs, Track A/B runtime, external beta, paid production, and production.

## Success Criteria

The dry-run plan is ready only if it can be validated by file-only diagnostics and source-of-truth smokes without importing worker execution code or touching live services.
