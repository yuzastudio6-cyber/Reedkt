# Project Edit Brief Owner Evidence Schema Validation

## Decision

`project_edit_brief_owner_evidence_schema_validation_passed_ready_for_strict_owner_evidence_updates`

## Scope

RP-EDITBRIEF-15F adds strict schema validation for owner evidence intake files before readiness, safety, or PR-diff validation runs. It does not approve owner evidence, does not edit the checked-in template, does not start RP-EDITBRIEF-16, and does not enable external beta, real-user-media beta, paid production, Supabase persistence, uploads, providers/models, workers, render/export, or credits.

## Validated Shape

The intake file must include:

- top-level `id`, `milestone`, `status`, `decision`, `allowedStatuses`, `requiredOwnerInputs`, `gateState`, and `nextMilestoneWhenComplete`,
- strict owner input objects with `id`, `label`, `status`, `owner`, `evidenceRef`, `reviewedAt`, and `notes`,
- boolean gate-state fields,
- no unknown top-level or owner-input keys.

Status values are still evaluated semantically by the readiness evaluator. Schema validation proves the file is structurally safe to evaluate; it does not prove owner approval.

## Failure Behavior

Malformed evidence fails closed with explicit schema paths. The readiness CLI and PR-diff validator both call `parseProjectEditBriefOwnerEvidenceIntake` before evaluating readiness or safety.

## Current State

The checked-in intake template passes schema validation but remains blocked because every owner input is still `missing`. A future owner-evidence PR must pass schema validation, readiness validation, safety scanning, and strict PR-diff validation before RP-EDITBRIEF-16 can begin.
