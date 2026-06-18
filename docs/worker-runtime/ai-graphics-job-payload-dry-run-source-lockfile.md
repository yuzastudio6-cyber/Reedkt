# AI Graphics Job Payload Dry-Run Source Lockfile

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

## Live Source Evidence

- PR #496: open draft, mergeable clean at `ce204a63fc08412af212609eecf0c8201ae88794`; `worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings`; next lane was `WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_DRY_RUN_APPROVAL`.
- PR #493: open draft, mergeable clean at `58f4e7839057d8c9e54d52c81f0e791e40e2574c`; `worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings`; reviewed run id `ai-graphics-job-payload-schema-validation-local-static`.
- PR #491: open draft, mergeable clean at `1bd6ed2a4d276066d0ca134ce674358e18f64b7a`; `worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings`; run id `ai-graphics-job-payload-schema-validation-local-static`.
- PR #487: open draft, mergeable clean at `0dbb1b3617af9d33bd066cdef2ad385376c383a6`; `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`.
- PR #485: open draft, mergeable clean at `34c57b9a4ea68f7dbd26fd9671a8d183c6fc8da0`; `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`.
- PR #482: open draft, mergeable clean at `15615ae99f0968b84cb63b615ce4243771fda45d`; `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`.
- PR #480: open draft, mergeable clean at `034ad49c1f7504dacfa6864aa21bb8cf09e90c0d`; `worker_ai_graphics_metadata_handoff_qa_passed_with_warnings`.
- PR #478: open draft, mergeable clean at `33c3b945f0d40e9c4531783a9a5f07adee174108`; metadata/static-only Worker handoff approval.
- PR #476: open draft, mergeable clean at `51207f974ea35f6ab4f46b2465110d743ecc36fa`; `tool_route_ai_graphics_metadata_local_fixture_gate_status_owner_approved_with_warnings`.
- PR #473: open draft, mergeable clean at `aa34de316565a5f5a3579576d16a064b8467f142`; Tool Route gate-status QA accepted with warnings.
- PR #471: open draft, mergeable clean at `d1484a4860b96fc349b6613dc77753b8dcad3dbb`; gate status recorded `dryRunPassedClaimed=false` and `generatedLocalFixturePassedClaimed=false`.
- PR #468, PR #467, PR #462, PR #458, PR #457, PR #456, and PR #454 remain source-chain context for Tool Route AI graphics metadata handoff.
- PR #464: open draft, mergeable clean at `8b6274f6a17027b5e52eeaf44e0af287d1986a55`; `tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings`; run id `ai-graphics-local-fixture-validation-local-static`.
- PR #414, PR #409, PR #404, and PR #398: merged Tool Route context.
- PR #164: open non-draft Track B policy context only.

## Recheck Notes

- Duplicate PR search for `codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-approval`: none.
- Target worktree path `/private/tmp/reeditpro-worker-ai-graphics-metadata-job-payload-dry-run-approval`: absent before creation.
- Target remote branch: absent before creation.
- Git/Xcode shim workaround: use `DEVELOPER_DIR=/Library/Developer/CommandLineTools` for git commands if the Apple shim appears.

Supabase classification: `no write` / `docs_only`; environment touched: `none`; SQL executed: `none`; migration deployed: `no`; milestone sync: `not_performed`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
