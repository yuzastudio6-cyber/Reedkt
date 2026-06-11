# Creative Graphics Group B Missing Metadata Checklist

Prompt: `TRACKA-GD-GROUPB-HANDOFF-0`

Handoff result: `tracka_groupb_handoff_ready_with_warnings`

Use this checklist before `TRACKA-GD-GROUPB-HANDOFF-1` creates a private preview composition plan.

Required metadata terms include timing/duration, fps, dimensions, aspect ratio, alpha support, safe zones, approved plan snapshot, private GCS, Supabase artifact row, and checksum.

| Metadata item | `anime_js_motion` | `lottie_web_overlays` | `remotion_graphics` | Required next action |
| --- | --- | --- | --- | --- |
| Timing/duration | present | placeholder only | placeholder only | Confirm against approved plan snapshot. |
| fps | present, 30 fps | placeholder 30 fps | placeholder 30 fps | Confirm target frame rate. |
| Dimensions | not applicable | missing concrete dimensions | missing concrete dimensions | Add dimensions before execution planning. |
| Aspect ratio | not applicable | missing concrete aspect ratio | missing concrete aspect ratio | Add aspect ratio before execution planning. |
| Alpha support | not applicable | placeholder only | placeholder only | Validate alpha/transparency requirements. |
| Safe zones | missing | missing | missing | Define safe-zone fit before private preview execution. |
| Motion easing/timeline evidence | present as synthetic timing | manifest-only placeholder | manifest-only placeholder | Verify timeline fit in future plan. |
| Lottie JSON/schema evidence | not applicable | missing concrete schema evidence | not applicable | Add Lottie schema evidence before browser/player review. |
| Remotion preview manifest completeness | not applicable | not applicable | partial placeholder only | Add completeness checklist before render/export review. |
| Text readability | not applicable | unknown | unknown | Review if text appears in future preview. |
| Approved plan snapshot placeholder | present as placeholder | present as placeholder | present as placeholder | Bind future work to an approved plan snapshot. |
| Private artifact source-of-truth binding | placeholder only | placeholder only | placeholder only | Bind to `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`. |
| Checksum/provenance | present in summary | present in summary | present in summary | Preserve checksums in future evidence. |
| QA evidence | present | present | present | Carry warnings forward. |
| Blocked-use compliance | present | present | present | Keep blocked uses false in future prompts. |

Accepted with warnings: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`.

Rejected/blocked fixtures: none.

Capability: `none; Track A Group B creative graphics handoff review only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
