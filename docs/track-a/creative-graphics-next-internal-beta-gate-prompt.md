# Creative Graphics Next Internal Beta Gate Prompt

Prompt: `TRACKA-GD-HANDOFF-7`

Recommended next prompt: `CROSS-BETA-0 - Cross-Workstream Internal Beta Gate Review`

## CROSS-BETA-0 - Cross-Workstream Internal Beta Gate Review

Use when all relevant workstreams are ready to evaluate whether ReEditPro may move toward a scoped internal beta gate review.

Allowed scope:

- cross-workstream readiness review;
- warning and blocker disposition;
- owner acceptance review;
- internal beta gate packet creation.

Blocked scope:

- full internal beta approval without all required owners;
- external beta approval;
- production approval;
- final render/export;
- public artifacts;
- signed URLs;
- uploads/storage transfer;
- worker/provider/model execution;
- Supabase mutation or SQL.

Required evidence:

- Handoff-7 QA result `controlled_private_sample_qa_passed_with_warnings`;
- lane decision `ready_with_warnings_for_cross_workstream_internal_beta_gate_review`;
- cross-workstream dependency matrix;
- warning disposition matrix;
- cleanup review;
- source-of-truth policy confirmation.

## GD-9 - Group B Package Runtime Review and Fixture Gate

Use when Anime.js, Lottie-web, or Remotion creative graphics runtime lanes need package/runtime review before broader internal beta planning.

Allowed scope:

- Group B package/runtime review;
- fixture gate docs;
- import-only diagnostics if separately approved.

Blocked scope:

- final render/export;
- worker/provider/model execution;
- public artifacts;
- Supabase mutation;
- SQL.

Required evidence:

- GD-8 package runtime matrix;
- GD-6 Group B `needs_package_review` state;
- Handoff-7 cross-workstream dependency status.

## TRACKA-GD-HANDOFF-7A - Private Sample QA Fixes

Use if Handoff-7 diagnostics, review, or CI finds unsafe claims, missing docs, inconsistent fixture status, or insufficient warning disposition.

Allowed scope:

- docs corrections;
- diagnostic corrections;
- tracker corrections.

Blocked scope:

- controlled private sample execution;
- fixture regeneration;
- AI tool execution;
- final render/export;
- public artifacts;
- signed URLs;
- Supabase mutation;
- SQL;
- beta/production unlock.

Required evidence:

- failing diagnostic or review note;
- corrected Handoff-7 docs and tracker references.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

