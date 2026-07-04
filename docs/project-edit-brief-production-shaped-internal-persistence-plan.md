# Project Edit Brief Production-Shaped Internal Persistence Plan

## Decision

`project_edit_brief_internal_persistence_plan_passed_ready_for_internal_backend_skeleton`

## Scope

RP-EDITBRIEF-16 is an internal testing persistence plan. It is production-shaped, not production-enabled: the next work should use the same route, repository, schema, idempotency, audit, approved-plan, and credit-estimate seams expected for release, but it must not turn on live Supabase reads/writes or public launch scope.

This milestone adds no migration, no SQL execution, no Supabase CLI command, no Storage operation, no signed URL creation, no provider/model call, no media processing, no worker dispatch, no render/export job, and no credit reservation or spend.

## Durable Roots

The internal persistence path keeps the existing Project Edit Brief durable root mapping:

- `edit_briefs`
- `edit_cues`
- `edit_cue_assets`
- `edit_cue_messages`
- `edit_cue_intents`
- `edit_cue_confirmations`
- `edit_cue_conflicts`
- `edit_cue_revisions`
- `edit_brief_application_logs`
- `edit_session_export_settings`

The historical `project_edit_*` table family remains unapproved. Do not create parallel Project Edit Brief tables unless a later owner-reviewed migration explicitly approves the rename.

## Route And Repository Policy

- Browser code continues through the Project Edit Brief API client.
- Service-role access remains backend-only.
- Direct frontend Supabase access remains forbidden.
- Future write routes must be idempotent.
- Future durable writes must have audit event planning.
- Current internal testing may use mock repository behavior and disabled Supabase repository validation only.

## Release Delta

Before public release, the following remain required:

- Real Supabase migration and generated type review.
- Workspace/project/session RLS policy tests.
- Explicit Data API grant and schema exposure review.
- Storage policy for future media attachments.
- Backend service-role repository factory.
- Route idempotency and audit event records.
- Approved snapshot plan handoff.
- Credit estimate, reservation, and ledger persistence.
- Worker/provider/render activation gates.

## Boundary Confirmations

- External beta remains false.
- Real-user-media beta remains false.
- Paid production remains false.
- Live Supabase reads/writes remain false.
- Providers, workers, media processing, render/export, uploads, and credit spend remain false.

## Next Milestone

`RP-EDITBRIEF-17 - Internal Persistence Backend Skeleton`
