# Project Edit Brief Internal Testing Owner Acceptance

## Decision

`project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan`

## Scope

RP-EDITBRIEF-15H records that Codex is acting as the implementation owner for the internal testing lane. This is not a shortcut and not throwaway test wiring. Internal testing work must be production-shaped: contract-first, backend-safe, idempotent where work can repeat, and aligned with the same approval, estimate, repository, and route seams that a later public release will use.

This acceptance lets the next Edit Brief milestone plan internal persistence work without pretending that external beta, real-user-media beta, paid production, live Supabase writes, provider calls, workers, render/export, or credit spend are approved.

## Allowed Internal Testing Work

- Internal dry-run and local-dev validation.
- Production-shaped persistence planning and backend skeleton design.
- Mock/local route and repository validation.
- Contract-first API, schema, and smoke coverage that can graduate later.
- Release-delta tracking for everything still needed before public launch.

## Still Blocked

- External beta and real-user-media beta.
- Paid production, Stripe, wallet mutation, ledger mutation, or silent billing.
- Live Supabase reads/writes, migrations, Storage writes, signed URL generation, or service-role actions.
- Provider/model calls, media processing, worker dispatch, render/export, upload/file-byte reads, or real-user-media handling.

## Hard Invariants

- Approved plan snapshot required before expensive work.
- Credit estimate and reservation required before expensive work.
- No raw prompts as source truth.
- No secrets or service-role credentials in frontend/browser code.
- No signed URLs as source truth.
- Heavy execution stays backend/worker-only.
- License and model-weight review is required before external beta.
- No silent billing or wallet mutation.

## Release Delta

The remaining public-release delta must stay visible while internal testing proceeds: real Supabase migrations and RLS review, durable media upload lifecycle, planner integration to approved snapshots, credit reservation and ledger persistence, provider/worker/render runtime activation, monitoring/runbook/incident response, and external beta or paid-production owner evidence.

## Next Milestone

`RP-EDITBRIEF-16 - Production-Shaped Internal Persistence Implementation Plan`
