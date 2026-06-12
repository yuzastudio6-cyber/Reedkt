# Creative Graphics Group B Private Preview Fixture Layout Plan

Prompt: `TRACKA-GD-GROUPB-HANDOFF-1`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_2`

Runtime chain: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_not_executed`

## Fixture Layout Matrix

| Tool ID | Artifact/evidence type | Proposed preview role | Timing/duration | FPS | Dimensions/aspect ratio | Alpha/transparency | Safe-zone expectation | Missing metadata | Track A readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `anime_js_motion` | Deterministic plain-object timing evidence | Motion timing overlay reference and supporting timing asset | Seven synthetic timing samples; future duration must bind to an approved plan snapshot | Placeholder: `<GROUP_B_ANIME_FPS_PLACEHOLDER>` | Placeholder: `<GROUP_B_ANIME_FRAME_PLACEHOLDER>` | Not applicable unless a future visual overlay uses timing curves | Must avoid title/action-safe collisions in future preview | Approved plan snapshot, final fps, duration frames, safe-zone mapping | `ready_with_warnings` |
| `lottie_web_overlays` | Manifest-only evidence | Overlay manifest placeholder; no player/browser behavior | Placeholder: `<GROUP_B_LOTTIE_DURATION_FRAMES_PLACEHOLDER>` | Placeholder: `<GROUP_B_LOTTIE_FPS_PLACEHOLDER>` | Placeholder: `<GROUP_B_LOTTIE_DIMENSIONS_PLACEHOLDER>` | Expected to need alpha review before execution | Overlay bounds and text-safe area must be reviewed | Lottie schema validation, alpha behavior, player adapter review | `ready_with_warnings` |
| `remotion_graphics` | Manifest-only evidence | Preview manifest placeholder and composition boundary reference | Placeholder: `<GROUP_B_REMOTION_DURATION_FRAMES_PLACEHOLDER>` | Placeholder: `<GROUP_B_REMOTION_FPS_PLACEHOLDER>` | Placeholder: `<GROUP_B_REMOTION_DIMENSIONS_PLACEHOLDER>` | Placeholder: `<GROUP_B_REMOTION_ALPHA_POLICY_PLACEHOLDER>` | Must preserve captions, source labels, and approved safe zones | Manifest completeness, renderer/export exclusion evidence, approved plan binding | `ready_with_warnings` |

Fully accepted fixtures: none.

Rejected or blocked fixtures: none.

## Layout Notes

- `anime_js_motion` can inform timing, easing, and hold cadence only after a future execution packet verifies the approved plan snapshot.
- `lottie_web_overlays` remains manifest-only until browser/player behavior and schema evidence are reviewed by the appropriate owner.
- `remotion_graphics` remains manifest-only until Track A separately approves any renderer/export path.
- Future private preview source-of-truth fields must use placeholders for `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.

Capability: `none; Track A Group B creative graphics private preview composition plan only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
