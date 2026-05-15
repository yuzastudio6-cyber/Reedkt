# Edit Plan State Machines

## Purpose

This document defines the state machines that future ReeditPro backend work should use. It is documentation only and does not create migrations or backend code.

## Project Lifecycle

States:

- `draft`
- `active`
- `planning`
- `awaiting_approval`
- `generating`
- `preview_ready`
- `revision_requested`
- `export_ready`
- `completed`
- `cancelled`
- `failed`

Rules:

- A project can contain many chat sessions, edit plans, previews, and revisions.
- A project must not enter `generating` unless an edit plan and credit estimate are approved.

## Chat Session Lifecycle

States:

- `draft`
- `active`
- `waiting_user_input`
- `planning`
- `awaiting_approval`
- `generating`
- `preview_ready`
- `revision_requested`
- `completed`
- `archived`

Rules:

- User questions, workflow choices, credit estimates, approvals, preview, and revision requests happen in chat.
- Chat messages should link to structured records.

## Media Analysis Lifecycle

States:

- `pending`
- `queued`
- `analyzing`
- `completed`
- `needs_user_input`
- `failed`

Records covered:

- `transcripts`
- `transcript_segments`
- `scene_boundaries`
- `visual_observations`
- `audio_observations`
- `reference_dna`

## Edit Plan Lifecycle

States:

- `draft`
- `planning`
- `awaiting_user_input`
- `awaiting_approval`
- `approved`
- `generating`
- `preview_ready`
- `revision_requested`
- `completed`
- `cancelled`
- `failed`

Allowed transitions:

- `draft` -> `planning`
- `planning` -> `awaiting_user_input`
- `planning` -> `awaiting_approval`
- `awaiting_user_input` -> `planning`
- `awaiting_approval` -> `approved`
- `awaiting_approval` -> `planning`
- `approved` -> `generating`
- `generating` -> `preview_ready`
- `preview_ready` -> `revision_requested`
- `revision_requested` -> `planning`
- `preview_ready` -> `completed`
- Any non-terminal state -> `cancelled`
- Any active execution state -> `failed`

Gate:

- `approved` requires an approved `credit_estimate`.
- `generating` requires reserved credits.

## Credit Estimate / Approval Lifecycle

Credit estimate states:

- `draft`
- `estimating`
- `ready_for_review`
- `approved`
- `expired`
- `revised`
- `cancelled`

Credit reservation states:

- `available`
- `reserved`
- `spent`
- `refunded`
- `expired_bonus`
- `admin_adjusted`

Flow:

1. Estimate credits.
2. User approves.
3. Reserve credits.
4. Generation starts.
5. On success, reserved credits become spent.
6. On ReeditPro-caused failure, reserved or spent credits are refunded.

## Job Lifecycle

States:

- `queued`
- `running`
- `waiting_dependency`
- `waiting_user_approval`
- `completed`
- `failed`
- `cancelled`
- `retrying`

Rules:

- Jobs must respect dependency graph.
- Jobs must include idempotency key.
- Generation jobs must not run before approval and credit reservation.
- Google Cloud workers should update job status through safe server-side paths.

Example dependency graph:

```text
transcription_job
-> media_analysis_job
-> source_sequence_job
-> intent_analysis_job
-> edit_quality_job
-> signature_investigation_job
-> stroke_motion_plan_job
-> credit_estimate_job
-> waiting_user_approval
-> generation_job
-> render_preview_job
-> quality_check_job
-> preview_ready
```

## Generation Request Lifecycle

States:

- `draft`
- `blocked_waiting_approval`
- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`
- `needs_revision`

Rules:

- `blocked_waiting_approval` is the default when a request exists before approval.
- Provider calls are allowed only from server/worker environments.
- Provider keys must come from future secret management, not the database.

## Render Lifecycle

States:

- `planned`
- `blocked_waiting_approval`
- `queued`
- `rendering`
- `qa_checking`
- `preview_ready`
- `export_ready`
- `failed`
- `cancelled`

Rules:

- Preview render is not final export.
- Final export requires explicit export intent and any required approval.
- Render jobs must not bypass credit and edit plan approval.

## Revision Lifecycle

States:

- `requested`
- `triaging`
- `estimate_required`
- `awaiting_approval`
- `approved`
- `queued`
- `completed`
- `rejected`
- `cancelled`
- `failed`

Rules:

- Revisions that require new generation require a new estimate and approval.
- Revisions that are local metadata changes may be previewed without new credits if safe.

## Stroke Motion Plan Lifecycle

States:

- `draft`
- `understanding_source`
- `meaning_expansion`
- `planning_beats`
- `awaiting_approval`
- `approved`
- `generating_specs`
- `ready_for_generation`
- `generated`
- `qa_checking`
- `preview_ready`
- `revision_requested`
- `cancelled`
- `failed`

Rules:

- `source_reading_mode` must pass through `meaning_expansion`.
- Stroke Motion generation cannot start until plan and credit estimate are approved.

