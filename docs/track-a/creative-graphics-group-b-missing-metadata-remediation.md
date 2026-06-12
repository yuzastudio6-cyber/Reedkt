# Creative Graphics Group B Missing Metadata Remediation

Prompt: `TRACKA-GD-GROUPB-HANDOFF-1`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_2`

## Metadata Remediation Matrix

| Metadata item | Classification | Remediation owner | Notes |
| --- | --- | --- | --- |
| Timing/duration | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Must bind to approved plan snapshot timing before Handoff-2 execution. |
| FPS | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Required for duration frames and timeline fit. |
| Dimensions/aspect ratio | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Must preserve approved frame and safe-zone constraints. |
| Alpha support | `required_before_group_b_private_preview_execution` | `AI_TOOLS_CREATIVE_GRAPHICS` with Track A review | Needed for overlay expectations. |
| Safe zones | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Must protect captions, labels, source evidence, and UI-safe areas. |
| Lottie schema validation evidence | `external_handoff_required` | `AI_TOOLS_CREATIVE_GRAPHICS` | Browser/player behavior remains blocked. |
| Remotion manifest completeness | `external_handoff_required` | `TRACK_A_RENDER_EXPORT` | Renderer/export remains blocked. |
| Approved plan snapshot binding | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Use placeholder only in this prompt. |
| Private artifact source-of-truth binding | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` with `SUPABASE_RLS_STORAGE_DATABASE` future review | Source of truth remains `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`. |
| Checksum/provenance | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Future packet must verify local/private evidence. |
| Cleanup evidence | `required_before_group_b_private_preview_execution` | `TRACK_A_RENDER_EXPORT` | Future packet must define local/private cleanup. |

## Can Warn And Continue To Plan

- Group B Handoff-0 acceptance with warnings.
- GD-10 Anime.js deterministic plain-object timing evidence.
- GD-10 Lottie manifest-only evidence.
- GD-10 Remotion manifest-only evidence.

## Blocked Until Future Prompt

- Group B private preview execution.
- Lottie browser/player behavior.
- Remotion render/export.
- Storage upload, signed URL creation, public artifact delivery, internal beta, external beta, and production.

Capability: `none; Track A Group B creative graphics private preview composition plan only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
