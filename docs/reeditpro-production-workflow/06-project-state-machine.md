# Project State Machine

This document defines early production workflow statuses for ReeditPro's AI-native editing flow. These statuses are documentation and shared type foundations only; this milestone does not implement runtime transitions, database records, routes, workers, or UI.

## ProjectWorkflowStatus

- `draft`
- `uploading`
- `uploaded`
- `prepping_footage`
- `footage_prep_ready`
- `clean_assembly_ready`
- `briefing`
- `planning`
- `plan_ready`
- `awaiting_approval`
- `approved`
- `generating`
- `qa_reviewing`
- `preview_ready`
- `revision_requested`
- `exporting`
- `export_ready`
- `failed`

## FootagePrepStatus

- `pending`
- `ingesting`
- `analyzing_media`
- `transcribing`
- `detecting_silence`
- `detecting_retakes`
- `building_cleanup_plan`
- `building_clean_assembly`
- `ready_for_brief`
- `failed`

## EditCueStatus

- `draft`
- `pending_cleanup_remap`
- `ready`
- `conflict`
- `included_in_plan`
- `adjusted_in_plan`
- `ignored`
- `used_in_render`
- `superseded`

## RenderQaStatus

- `queued`
- `running`
- `needs_attention`
- `passed`
- `failed`
- `preview_ready`

## State Rules

- A project should never silently get stuck.
- Failed async work must expose retry/recovery paths.
- Expensive generation cannot start until approval.
- Approved plans cannot be silently mutated.
- If an approved plan needs changes, create a revision or new plan version.
- Preview cannot become ready until QA passes.
- Export cannot start from a failed/invalid preview.
- Edit Map operations after preview should create edit operations and, when necessary, revision requests.

## User-Visible Activity Events

Examples:

- Upload received.
- Creating editing proxy.
- Transcribing speech.
- Finding silence and retakes.
- Grouping repeated takes.
- Building clean assembly.
- Checking whether notes still match after cleanup.
- Preparing edit brief workspace.
- Creating edit plan.
- Estimating credits.
- Waiting for approval.
- Professionally integrating user cues.
- Checking overlays against captions and face position.
- Running QA.
- Preview ready.
- Revision requested.
- Export ready.
