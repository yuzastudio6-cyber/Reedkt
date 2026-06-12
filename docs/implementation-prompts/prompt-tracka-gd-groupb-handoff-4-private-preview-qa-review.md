# Implementation Prompt - TRACKA-GD-GROUPB-HANDOFF-4 Private Preview QA Review

Prompt: `TRACKA-GD-GROUPB-HANDOFF-4`

Branch: `codex/rp-tracka-gd-groupb-handoff-4-private-preview-qa-review`

PR: [#321](https://github.com/yuzastudio6-cyber/Reedkt/pull/321)

Base: `origin/codex/rp-tracka-gd-groupb-handoff-3-private-preview-execution`

Capability enabled: `none; Track A Group B creative graphics private preview QA review only`

## Requested Work

Create a docs/static-diagnostics-only Track A review packet for the Handoff-3 Group B private preview evidence. Set the expected QA result to `group_b_private_preview_qa_passed_with_warnings` and readiness to `ready_with_warnings_for_group_b_controlled_private_sample_plan`.

## Files Inspected

- `docs/track-a/creative-graphics-group-b-private-preview-source-verification.md`
- `docs/track-a/creative-graphics-group-b-private-preview-execution-evidence.md`
- `docs/track-a/creative-graphics-group-b-private-preview-qa-evidence.md`
- `docs/track-a/creative-graphics-group-b-private-preview-observability-evidence.md`
- `docs/track-a/creative-graphics-group-b-private-preview-cleanup-evidence.md`
- `docs/track-a/creative-graphics-group-b-private-preview-go-no-go-record.md`
- `scripts/validation/tracka-creative-graphics-group-b-private-preview-execution-diagnostics.mjs`
- `scripts/validation/run-foundation-validation.mjs`
- `.github/workflows/foundation-validation.yml`

## Implementation Summary

- Added Group B private preview QA review docs.
- Added `tracka:creative-graphics:group-b-private-preview-qa:diagnostics`.
- Wired the diagnostic after the Handoff-3 private preview execution diagnostic.
- Added workflow trigger coverage for PRs targeting `codex/rp-tracka-gd-groupb-handoff-3-private-preview-execution`.
- Updated production, source-map, beta, blocker, internal-beta, GD, and Track A trackers.

## Review Result

| Tool ID | Result |
| --- | --- |
| `anime_js_motion` | `accepted_with_warnings` |
| `lottie_web_overlays` | `accepted_with_warnings` |
| `remotion_graphics` | `accepted_with_warnings` |

Runtime unlock status: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_local_passed_with_warnings / group_b_private_preview_qa_passed_with_warnings`

Full internal beta remains `blocked_pending_workstream_gates`.

## Validation

Local validation status: `passed_static_diagnostics_with_local_dependency_install_blocker`.

GitHub Foundation Validation status: pending.

Recorded local validation:

- `git diff --check`: passed.
- `git diff --check origin/codex/rp-tracka-gd-groupb-handoff-3-private-preview-execution...HEAD`: passed.
- `npm ci`: local environment-blocked; it stalled silently on `/Volumes/backup`, did not respond to Ctrl-C, was killed, and left no usable `eslint`, `tsc`, or `vite` binaries.
- `tracka:creative-graphics:group-b-private-preview-qa:diagnostics`: passed.
- Existing Node-only Group B, GD package/runtime, Track A, and internal-beta diagnostics: passed.
- `npm run foundation:validate`: diagnostics passed but local wrapper failed on missing `eslint` and `tsc`.
- Build commands: blocked locally by missing `tsc` after the stalled install.

## Boundary Status

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth.

Next recommended prompt: `TRACKA-GD-GROUPB-HANDOFF-5 - Group B Controlled Private Sample Planning`.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, AI tool execution, Group B tool execution, worker execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, production/beta unlock, dependency mutation, human approval grant, staging execution approval, raw prompt execution, preview generation, final render/export, Remotion render/export, Lottie browser/player rendering, or broad service-role handler was enabled.
