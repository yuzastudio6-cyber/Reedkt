# TRACK_B_MEDIA_PROCESSING Handoff Contract

This contract defines what Track B consumes and outputs as planning evidence. It does not authorize media/runtime execution.

## Consumed Inputs

| Input Class | Required Fields | Blocked If Missing |
| --- | --- | --- |
| Approved snapshot context | `planSnapshotId`, `executionStatus`, `approvedForRuntime`, `sourcePlanId`, `frame`, `timingPlanId`, `artifactScopeId` | snapshot id, frame/timing refs, artifact scope |
| Media source metadata | `mediaRef`, `workspaceId`, `sourceClipId`, `uploadedOrder`, `durationMs`, `fps`, `resolution`, `streamSummary`, `checksum`, `provenance` | private ref, checksum, provenance, user/workspace boundary |
| Frame/clip/timecode refs | `clipId`, `timecodeStart`, `timecodeEnd`, `frameStart`, `frameEnd`, `samplingPolicy`, `maxFrameCount` | bounded time/frame range |
| Audio segment refs | `audioSegmentId`, `timeRange`, `voicePresence`, `noiseRisk`, `loudnessPolicyRef`, `checksum` | segment range, checksum, voice/noise context |
| Existing owner manifests | `manifestId`, `ownerWorkstream`, `sourceRefs`, `qaStatus`, `privateRefs`, `checksums` | owner id, QA status, private refs |

## Track B Outputs

| Output | Required Fields | Consumer | Notes |
| --- | --- | --- | --- |
| OCR result manifest | `ocrManifestId`, `frameRefs`, `textRegions`, `language`, `confidence`, `redactionStatus`, `qaStatus` | Track A, AI Tools, Compliance | Planning-only text-region record. |
| Scene/shot detection manifest | `sceneManifestId`, `clipRefs`, `timecodes`, `thresholdPolicy`, `boundaryCandidates`, `confidence`, `qaStatus` | Track A, Worker future | Candidate boundaries only. |
| Media metadata manifest | `metadataManifestId`, `streamSummary`, `duration`, `fps`, `resolution`, `codecPolicy`, `checksumRefs`, `qaStatus` | Track A, Supabase future, Observability | No FFprobe execution in this phase. |
| Image derivative manifest | `derivativePolicyId`, `sourceFrameRefs`, `targetTypes`, `dimensions`, `formatPolicy`, `checksumPlan`, `qaStatus` | Track A, AI Tools | No derivative generation here. |
| Audio cleanup planning manifest | `cleanupPlanId`, `audioSegmentRefs`, `noiseRisk`, `voiceClarityRisk`, `recommendedOwner`, `qaStatus` | SOUND_MUSIC_AUDIO, Track A | Sound owns creative audio decisions. |
| Time-stretch planning manifest | `stretchPlanId`, `sourceTimingRefs`, `targetDuration`, `ratio`, `speechSafety`, `qaStatus` | Track A, SOUND_MUSIC_AUDIO | Signalsmith runtime blocked. |
| Media table/query manifest | `queryManifestId`, `sourceTables`, `schema`, `rowCount`, `redactionStatus`, `qaStatus` | Observability, Billing, Supabase future | No DuckDB/Polars runtime here. |
| Private artifact manifest policy | `artifactScopeId`, `privateRefPolicy`, `checksumPolicy`, `retentionPolicy`, `cleanupPolicy`, `rollbackPolicy` | Worker Runtime, Supabase future | Private refs only. |
| VLM/Demucs blocker manifest | `blockerId`, `blockedToolId`, `evidenceRefs`, `requiredApproval`, `blockedScope`, `nextAction` | Provider Gateway, Compliance, Sound, Worker | Blocker record only. |

## Required QA Fields

- confidence score and threshold policy
- source provenance
- redaction status
- checksum status
- privacy classification
- bounded scope status
- false-positive/false-negative risk
- user review need
- downstream owner
- blocked execution flags

## Cleanup And Rollback Fields

Future execution phases must define temporary file cleanup, derivative cleanup, failed analysis cleanup, partial output cleanup, checksum mismatch handling, artifact revocation, retention period, and rollback/audit event ids before Track B runtime is approved.

## Supabase / GCS Placeholder Fields

Track B may define future placeholder fields such as `privateGcsPrefix`, `supabaseMetadataTable`, `artifactScopeId`, and `registryMilestoneRef` only as docs/status metadata. This phase writes no Supabase rows, creates no buckets, uploads no artifacts, and creates no signed URLs.

## Blocked Handoffs

- Raw media to tools.
- Raw prompts to tools, workers, or providers.
- Raw provider outputs to Track B runtime.
- Signed URLs as source-of-truth.
- Public artifacts.
- Supabase writes.
- Worker jobs without approved snapshot id and artifact scope.
- VLM/Demucs runtime without separate approval.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
