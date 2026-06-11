# CROSS-BETA-0 Accepted Lane Evidence Register

Prompt: `CROSS-BETA-0`

This register accepts only committed docs and summaries that already exist on the Handoff-7 base. It does not accept ignored local artifacts, private storage objects, dashboard state, runtime claims, or untracked evidence.

| Evidence | Status | Accepted for CROSS-BETA-0 | Notes |
| --- | --- | --- | --- |
| `docs/track-a/creative-graphics-controlled-private-sample-qa-review.md` | `controlled_private_sample_qa_passed_with_warnings` | yes | Track A creative graphics lane is ready with warnings for cross-workstream gate review. |
| `docs/track-a/creative-graphics-controlled-private-sample-go-no-go-record.md` | `controlled_private_sample_passed_with_warnings` | yes | Local/private sample evidence only; not final render/export. |
| `docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md` | `private_preview_local_passed` | yes | Local/private preview evidence only. |
| `docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json` | `source_artifacts_preserved` | yes | Committed source artifacts exist for the accepted creative graphics fixtures. |
| `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` | `generated_local_fixture_partially_passed` | yes | Five Group A tools produced local/private SVG evidence; skipped/blocker tools remain unresolved. |
| `docs/activation-phase-53a-runtime-unlock-roadmap-results.md` | `ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits` | yes, as historical activation evidence | Phase 53A defines owner acceptance and runtime unlock ladder; it does not approve internal beta. |
| `docs/activation-phase-52g-controlled-internal-test-go-no-go-results.md` | `go_for_owner_handoff` and `no_go_for_runtime_execution` | yes, as historical gate evidence | Represents all 12 workstreams and records no-go for runtime execution. |
| `docs/activation-phase-50g-map-geospatial-readiness-results.md` | map/geospatial internal readiness evidence | yes, with warnings | Owner confirmation is still required for cross-beta. |
| Later Supabase 20-26 prompt evidence | absent on this base | no | Recorded as missing Supabase/current foundation evidence gap. |

## Source-Of-Truth Policy

Future product source of truth remains `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`. Signed URLs are not source of truth.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## GD-9 Group B Evidence Register Addendum

Decision state: `group_b_partially_ready_for_gd10`

Evidence accepted for GD-9 scope only:

- Import-only probe evidence for `anime_js_motion`, `lottie_web_overlays`, and `remotion_graphics`.
- GD-9 docs defining `group_b_runtime_import_review_passed` and `group_b_fixture_gate_created`.

Evidence not accepted:

- Group B fixture execution evidence.

## GD-10 Group B Evidence Register Addendum

Decision state: `group_b_partially_passed`

Evidence accepted for GD-10 scope only:

- `anime_js_motion`: executed; `anime_js_motion.motion-timing.json`
- `lottie_web_overlays`: `manifest_only`; `lottie_web_overlays.manifest-only.json`
- `remotion_graphics`: `manifest_only`; `remotion_graphics.manifest-only.json`
- QA evidence, observability evidence, cleanup evidence, artifact manifest evidence, and go/no-go record.

Evidence not accepted for internal beta unlock:

- Group B Track A handoff approved now: false
- Internal beta approved: false
- Remotion final render/export.
- Lottie browser/player behavior.

Capability: `none; Group B controlled local fixture execution only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
- Remotion render/export evidence.
- Internal beta approval evidence.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
