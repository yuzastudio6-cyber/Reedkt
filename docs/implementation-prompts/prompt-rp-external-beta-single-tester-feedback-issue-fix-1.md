# RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1

Use when the current single tester `aiediting@reeditpro.com` reports a concrete defect, reproduction path, screenshot summary, log summary, or expected/actual behavior.

## Goal

Turn one specific source-backed tester issue into a bounded repair.

## Required Inputs

- Source class and sanitized evidence.
- Affected feature, route, account, artifact, or workflow.
- Reproduction steps.
- Expected behavior and actual behavior.
- Safety class: docs-only, frontend-only, backend route, Supabase readback, worker, provider, media, billing, deployment, or production.
- Explicit gate before any remote/runtime action.

## Boundary

No additional tester access, IAM mutation, Supabase/SQL mutation, provider/model call, worker dispatch, media processing, public artifact, signed URL source-of-truth, paid billing, final delivery/export, broad beta, or production unlock is allowed unless the issue packet explicitly authorizes that exact action with a confirmation gate and rollback path.
