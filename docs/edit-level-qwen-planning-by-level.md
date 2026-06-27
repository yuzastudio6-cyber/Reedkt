# Edit Level Qwen Planning By Level

Status: RP-EDITLEVEL-07 by-level behavior.

| Level | Future Qwen planning behavior |
| --- | --- |
| Normal | Standard reasoning, single pass, compact prompt context, optional Edit Brief, safe style hints, concise QA explanation, simple professional plan hints, deterministic fallback acceptable, low estimate. |
| Premium | Deep reasoning, two pass, enhanced prompt context, context-aware marker reasoning, Edit Brief recommended, strong Preference DNA application, detailed concise QA, layered creative plan hints, degraded fallback notice, medium estimate. |
| Ultra Premium | Multi-pass reasoning, studio multi-pass policy, studio prompt context, context/QA/plan-aware marker reasoning, Edit Brief strongly recommended, deep Preference DNA application, strict detailed QA, studio multi-layer plan hints, Premium-safe degraded fallback, high estimate. |

## Professional Baseline

Normal is not low quality. Every level remains a professional edit. Level changes control reasoning depth, context budget, QA explanation depth, future estimate policy, and fallback messaging.

## Compatibility

Current runtime values remain `basic | pro | premium`. Public canonical values remain `normal | premium | ultra_premium` in mock/local profile metadata. Legacy runtime mapping from earlier milestones is unchanged:

- `basic -> normal`
- `pro -> premium`
- runtime `premium -> ultra_premium`
- explicit canonical `premium -> premium`

## Boundary

No Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, planner, edit-plan, worker, render, progress, Supabase, upload, file-byte, external-fetch, or credit operation runs.
