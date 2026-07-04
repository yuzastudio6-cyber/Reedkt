# Project Edit Brief Owner Review And Production Gate Evidence

## Decision

`project_edit_brief_owner_review_production_gate_evidence_collection_blocked_pending_owner_inputs`

## Scope

RP-EDITBRIEF-15 collects the exact owner/operator evidence needed after RP-EDITBRIEF-13 and RP-EDITBRIEF-14. It does not approve production, external beta, real-user-media beta, live Supabase persistence, Qwen/runtime behavior, uploads, workers, render/export, or credits.

The milestone is intentionally blocked until named owner inputs are supplied outside source control and then recorded in a later approved implementation phase.

## Required Owner Inputs

1. Canonical workflow approval: whether Project Edit Brief becomes the default first-pass workflow, remains optional, or is gated to internal users.
2. Durable root schema approval: `edit_briefs`, `edit_cues`, cue child tables, `edit_brief_application_logs`, and `edit_session_export_settings`.
3. Auth/access policy approval: workspace membership, project ownership, session access, read/write role matrix, and admin/archive boundaries.
4. Supabase security approval: RLS predicates, explicit Data API grants, exposed schemas, service-role boundary, Storage policy, migration ordering, generated type refresh, local validation, remote staging validation, and rollback.
5. Media lifecycle approval: source upload, private artifact inputs/outputs, metadata-only attachment upgrade path, retention/deletion, and signed URL delivery policy.
6. Planner integration approval: how Brief Plan Hints enter approved plan snapshots, conflict handling, priority rules, immutable versioning, and revision reset behavior.
7. Credit/cost approval: estimate display, reservation requirement, spend/release/refund behavior, cost metering event ownership, and no silent overage behavior.
8. Provider/model approval: Qwen Marker Chat mode, Qwen2.5-VL visual context mode, model/license review, prompt redaction, and provider fallback rules.
9. Worker/render approval: which backend workers may consume Brief outputs, idempotency keys, artifact manifests, QA gates, render readiness, progress events, and rollback.
10. Operations approval: monitoring, incident runbook, privacy/legal review, security review, deployment owner, rollback owner, beta cohort owner, and support escalation owner.

## Current Evidence State

- RP-EDITBRIEF-13 confirms durable Supabase roots and policy gates, but no migration or read/write enablement.
- RP-EDITBRIEF-14 confirms readiness is conditional and not permanently hardcoded false, but default external beta, real-user-media beta, and paid production remain blocked.
- Project Edit Brief mock routes remain non-production and do not require Supabase or service-role access.
- Internal dry-run can remain testable; external beta and production require the missing owner inputs above.

## Blocked Scope

- External beta: blocked.
- Real-user-media beta: blocked.
- Paid production: blocked.
- Supabase read/write: blocked.
- Storage write/signed URL source truth: blocked.
- Provider/model calls: blocked unless separately approved.
- Upload, media processing, worker dispatch, render/export, and credit reservation/spend: blocked.

## Next Milestone

`RP-EDITBRIEF-16 - Production Persistence Implementation Plan`
