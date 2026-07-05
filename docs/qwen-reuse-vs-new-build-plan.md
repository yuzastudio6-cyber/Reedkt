# Qwen Reuse vs New Build Plan

RP-QWEN-00 identifies what should be reused for Qwen 3.7 Max runtime readiness and what must be built later.

Common audit boundary: Qwen 3.7 Max, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

| Surface | Reuse | Wrap | Build New | Reason | Risk |
| --- | --- | --- | --- | --- | --- |
| Model routing registry | Yes | No | No | Qwen role metadata and gates already exist. | Runtime could bypass routing if not enforced. |
| Provider config boundary | Yes | Yes | No | Secret names and readiness states already exist. | Secret values must stay server-only. |
| Reasoning-agent prompt packages | Yes | Yes | No | Structured prompt packages already exist. | Need Qwen-specific schemas before real calls. |
| Qwen adapter skeleton | Yes | Yes | Yes | Skeleton proves blocked behavior. | Real transport must not inherit mock shortcuts. |
| Marker Chat deterministic fallback | Yes | Yes | No | Current fallback is safe and tested. | Future Qwen failures must fall back cleanly. |
| Project Edit Brief route/client layer | Yes | Yes | No | Browser-safe seam already exists. | Browser must not gain provider access. |
| Qwen runtime adapter | No | No | Yes | No real adapter exists. | Needs gates, redaction, timeout, and fake-adapter tests. |
| Secret Manager runtime resolver | No | No | Yes | No runtime value resolution exists. | Secret exposure risk. |
| Qwen structured response contracts | Partial | Yes | Yes | Generic reasoning contracts exist. | Marker Chat schemas need exact validation. |
| Qwen Marker Chat bridge | No | Yes | Yes | Current Marker Chat is deterministic. | Must remain backend-only and marker-scoped. |

## Recommendation

RP-QWEN-01 should build only a gated fake-adapter/runtime design after owner review. Real provider execution should remain blocked until later explicit approval.

## RP-QWEN-01 Reuse Update

Reuse now includes the new server-only Qwen runtime-boundary services, symbolic secret-reference registry, redaction helper, disabled resolver, provider-readiness blocker, validation/summary helpers, and static frontend import guard. New build remains required for fake transport, structured Qwen response schemas, timeout/retry/cost policy, monitoring, and any future real provider transport. Verification passed with no `gcloud`, no secret value/metadata access, no provider client, no Qwen call, no Supabase command, and migration count 26.
