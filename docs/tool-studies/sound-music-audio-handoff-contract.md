# SOUND_MUSIC_AUDIO Handoff Contract

This contract defines Sound/Music/Audio handoffs for future TOOL-ROUTE-1 route dry-run planning. It is not a runtime contract.

## Consumed Evidence

| Evidence | Required Fields | Notes |
| --- | --- | --- |
| Approved plan snapshot candidate | `planId`, `executionStatus`, `approvedForRuntime`, selected intent refs | Must remain candidate/review-only until a future runtime approval path exists. |
| Master timing evidence | `timingPlanRef`, `frameRate`, `segmentRefs`, `speechProtectionRules` | Timing remains source-of-truth for cue placement. |
| Track B media handoff | `audioIssueClass`, `metadataNeed`, `cleanupNeed`, `privateMediaRefPlaceholder`, `checksumPlaceholder` | Track B owns future processing. |
| Track A composition handoff | `compositionLayerRef`, `mixIntent`, `duckingNeed`, `renderExportBlocked` | Track A owns future final composition/export. |
| AI Tools motion context | `motionCueRef`, `visualCueRef`, `intensityBound` | Context only, not audio truth. |
| Provider Gateway review | `providerCandidate`, `schemaNeed`, `costCapQuestion`, `redactionStatus` | For future Mirelo, MMAudio, or Lyria questions only. |
| Billing review | `creditClass`, `durationClass`, `cueCount`, `approvalGate` | No billing mutation here. |
| QA and cleanup | `speechClarityRisk`, `cueDensityRisk`, `rightsProvenanceRisk`, `humanReviewNeeded` | QA is required before future execution. |

## Cue Manifest Fields

Every future cue manifest should include `cueId`, `sourcePlanId`, `owner`, `capabilityId`, `routeId`, `segmentId`, `timingRef`, `frameStart`, `frameEnd`, `sceneContext`, `mood`, `category`, `intensity`, `platform`, `speechOverlapRisk`, `musicDuckingRequired`, `visualCueRef`, `reason`, `privateArtifactRefPlaceholder`, `checksumPlaceholder`, `provenanceStatus`, `qaRequired`, and `blockedRuntimeStatus`.

## Handoff Fields

| Handoff | Fields |
| --- | --- |
| Track A | `track_a_final_composition_handoff`, cue manifest refs, ducking notes, level bounds, timing refs, final render/export blocked flag |
| Track B | `track_b_audio_processing_handoff`, cleanup/analysis need, private media placeholder, checksum placeholder, media processing blocked flag |
| Provider Gateway | `provider_gateway_future_audio_generation_handoff`, candidate provider, sanitized schema question, raw prompt blocked flag, provider call blocked flag |
| Billing | `billing_future_audio_credit_handoff`, cue count, duration class, cost class, credit mutation blocked flag |
| QA | speech clarity, cue density, timing collision, provenance, platform style, rights, privacy, redaction |
| Cleanup | user-review needed, sensitive content flag, documentary restraint flag, fallback-to-silence recommendation |
| Supabase placeholder | table/registry refs are placeholders only; `blocked_current_branch_missing_sync_layer` remains the milestone sync status |
| GCS placeholder | private artifact refs are placeholders only; no storage transfer or upload is performed |

## Blocked Handoffs

Direct provider/model calls, real audio/SFX/music generation, real audio/media processing, FFmpeg/FFprobe execution, DeepFilterNet runtime, Demucs/stem separation, worker/route/tool execution, Supabase mutation, SQL/migration/schema/RLS changes, GCS upload/storage transfer, public artifacts, signed URLs as source-of-truth, credit mutation, Stripe actions, beta, paid production, production, and final render/export are blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
