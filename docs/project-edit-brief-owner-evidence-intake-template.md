# Project Edit Brief Owner Evidence Intake Template

## Purpose

This RP-EDITBRIEF-15A template turns the RP-EDITBRIEF-15 owner-input list into a concrete intake record. It is not an approval. Every item defaults to `missing`, and production persistence remains blocked until owners replace the placeholder values with approved evidence in a later reviewed phase.

## Intake Rule

Each owner input must provide:

- `status`: `missing`, `approved`, `rejected`, or `waived`.
- `owner`: a named human/team owner, not a generic role.
- `evidenceRef`: a durable reference such as a PR, runbook, ticket, signed approval record, deployment readback, or reviewed document.
- `reviewedAt`: an ISO timestamp when approval or waiver was reviewed.
- `notes`: concise scope and caveat notes.

`approved` and `waived` entries must explain exactly what is approved and what remains out of scope. Missing or rejected entries block RP-EDITBRIEF-16.

## Required Inputs

- Canonical workflow approval.
- Durable root schema approval.
- Auth/access policy approval.
- Supabase security approval.
- Media lifecycle approval.
- Planner integration approval.
- Credit/cost approval.
- Provider/model approval.
- Worker/render approval.
- Operations approval.

## Default State

The checked-in template is intentionally incomplete:

- All owner inputs are `missing`.
- External beta remains blocked.
- Real-user-media beta remains blocked.
- Paid production remains blocked.
- Supabase persistence implementation remains blocked.

## Next Use

After owners supply the required evidence outside source control, a later reviewed PR may update this intake record and start `RP-EDITBRIEF-16 - Production Persistence Implementation Plan`.
