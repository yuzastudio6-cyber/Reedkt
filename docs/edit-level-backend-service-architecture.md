# Edit Level Backend Service Architecture

This document names future services only. RP-EDITLEVEL-01 does not create repositories, API routes, service implementations, database migrations, workers, or backend jobs.

## Future Services

| Service | Responsibility |
| --- | --- |
| `EditLevelProfileRegistry` | Own future Normal/Premium/Ultra Premium profile definitions. |
| `EditLevelResolver` | Resolve requested level into a profile. |
| `EditLevelAliasNormalizer` | Normalize legacy basic/pro/premium compatibility aliases. |
| `EditLevelRecommendationService` | Recommend a level from source video, prompt, platform, length, assets, Edit Preference, and polish goal. |
| `EditLevelToolBudgetService` | Convert profile into tool budget metadata. |
| `EditLevelQwenRoutingService` | Convert profile into Qwen 3.7 and Qwen2.5-VL pass/depth policy. |
| `EditLevelSourceUnderstandingPolicyService` | Select source video understanding depth by level. |
| `EditLevelQAProfileService` | Select QA profile and strictness. |
| `EditLevelEstimateService` | Produce time/credit estimate only metadata. |
| `EditLevelFallbackPolicyService` | Select fallback policy and degraded capability notices. |
| `EditLevelSummaryService` | Produce user-facing summary copy for plan cards and approval snapshots. |

## Future Persistence

Future Supabase persistence should store the legacy runtime value, resolved public level, profile version, estimate metadata, QA profile, fallback policy, and approval snapshot references. This is future architecture only.

## Boundary

No runtime implementation, route, repository, migration, Supabase command, worker, provider call, render/export, or credit spend is authorized by this document.
