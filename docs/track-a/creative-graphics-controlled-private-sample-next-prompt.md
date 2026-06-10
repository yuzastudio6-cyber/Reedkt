# Creative Graphics Controlled Private Sample Next Prompt

Prompt: `TRACKA-GD-HANDOFF-5`

Decision state: `ready_with_warnings_for_tracka_gd_handoff_6`

## TRACKA-GD-HANDOFF-6 - Controlled Private Sample Execution

Use when Track A is ready to execute a local/private controlled sample using only the five accepted fixtures and the Handoff-5 evidence lockfile.

Allowed scope:

- local/private controlled sample execution for the five accepted fixtures;
- source checksum verification;
- local/private sample manifest and checksum evidence;
- QA, observability, cleanup, and failure evidence.

Blocked scope:

- AI tool execution;
- fixture regeneration;
- final render/export;
- uploads/storage transfer;
- signed URLs;
- public artifacts;
- workers/providers/models;
- Supabase mutation;
- SQL;
- GCP;
- Secret Manager;
- internal beta, external beta, production, and paid production unlock.

Required evidence:

- Handoff-5 execution gate state `ready_with_warnings_for_tracka_gd_handoff_6`;
- accepted evidence lockfile;
- warning/remediation register;
- QA/observability plan;
- cleanup/rollback plan.

## TRACKA-GD-HANDOFF-5A - Private Sample Planning Fixes

Use if Handoff-5 diagnostics, validation, or review finds missing docs, unsafe claims, inconsistent fixture status, or insufficient warning remediation.

Allowed scope:

- docs fixes;
- diagnostic fixes;
- tracker corrections.

Blocked scope:

- controlled private sample execution;
- AI tool execution;
- fixture regeneration;
- final render/export;
- uploads;
- Supabase or SQL;
- GCP or Secret Manager.

Required evidence:

- exact failing diagnostic output;
- corrected Handoff-5 plan docs.

## GD-9 - Group B Package Runtime Review And Fixture Gate

Use when Anime.js, Lottie-web, or Remotion fixture paths need package/runtime review before any Track A handoff.

Allowed scope:

- Group B package/runtime review;
- import-only package evidence if separately approved;
- fixture gate docs.

Blocked scope:

- Track A final render/export;
- worker/provider/model execution;
- public artifacts;
- Supabase mutation;
- SQL.

Required evidence:

- GD-8 package runtime matrix;
- GD-6 Group B `needs_package_review` state;
- Handoff-5 excluded fixture context.

## Boundary Status

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-HANDOFF-6 Outcome

Handoff-6 result: `controlled_private_sample_passed_with_warnings`

Next recommended prompt: `TRACKA-GD-HANDOFF-7 - Controlled Private Sample QA and Internal Beta Readiness Review`.

Use `TRACKA-GD-HANDOFF-6A - Controlled Private Sample Fixes` only if validation, diagnostics, or review finds missing sample evidence or unsafe status claims.
