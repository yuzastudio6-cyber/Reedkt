# AI_TOOLS_CREATIVE_GRAPHICS Batch 4 Warning / Blocker Register

Decision: `ai_graphics_batch_4_policy_qa_passed_with_warnings`

## Warnings

| Warning | Source | Disposition |
| --- | --- | --- |
| `@resvg/resvg-js` is host/runtime-sensitive. | PR #446 resvg policy | Carry forward; Linux-only import proof requires separate approval. |
| SVG raster fallback is policy-only. | PR #446 SVG raster fallback policy | Carry forward; no raster output or public artifact exists. |
| Remotion / Track A handoff is not render/export approval. | PR #446 Remotion / Track A handoff policy | Carry forward; Track A review remains separate. |
| Route-manifest readiness is not route execution. | PR #446 route-manifest readiness plan | Carry forward; recommend approval packet only. |
| Batch stack remains draft/open. | PR #417 through PR #446 live state | Carry forward; keep this PR draft. |

## Blockers

No blocker prevents Batch 4 policy QA acceptance. Runtime, rasterization, render/export, route execution, worker execution, provider runtime, Supabase mutation, GCS/storage transfer, signed URLs, public artifacts, beta, and production remain blocked by design.

No dependency install, package-lock mutation, import smoke execution, synthetic fixture execution, resvg rasterization, Remotion render/export, route execution, worker execution, actual tool execution, provider/model call, Supabase mutation, SQL, GCS/storage transfer, signed URL creation, public artifact creation, beta unlock, or production unlock was enabled.
