# Project Edit Brief Owner Evidence Readiness Evaluator

## Decision

`project_edit_brief_owner_evidence_readiness_evaluator_passed_ready_for_owner_input_collection`

## Scope

RP-EDITBRIEF-15B adds an executable evaluator for the RP-EDITBRIEF-15A intake template. It validates required owner input IDs, allowed statuses, duplicate/missing entries, and approval evidence fields. It does not approve any owner input and does not enable production, external beta, Supabase persistence, uploads, providers/models, workers, render/export, or credits.

## Readiness Rule

`readyForRpEditBrief16` becomes true only when all ten owner inputs are present and each one is `approved` or `waived` with:

- named owner,
- durable evidence reference,
- reviewed timestamp,
- notes.

Missing, rejected, duplicate, unsupported, or incomplete entries block RP-EDITBRIEF-16.

## Launch Boundary

Even when owner evidence is complete, this evaluator only allows the next planning gate: `RP-EDITBRIEF-16 - Production Persistence Implementation Plan`. It does not allow external beta, real-user-media beta, paid production, live Supabase writes, or media/runtime execution by itself.

## Validation

`smoke:project-edit-brief-owner-evidence-readiness` verifies both states:

- The checked-in template remains blocked because every owner input is missing.
- A synthetic complete intake becomes ready for RP-EDITBRIEF-16 while external beta, real-user-media beta, and paid production remain false.
