# TOOL-STUDY-0 TRACK_B_MEDIA_PROCESSING Handoff Contract

This contract defines the safe metadata Track B may consume or emit in later planning phases. It is not a worker contract and it does not authorize tool execution.

## Consumed Inputs

| Input Class | Required Fields | Blocked If Missing |
| --- | --- | --- |
| Approved snapshot context | `approvedPlanSnapshotId`, `candidateId`, `approvalStatus`, `artifactScopeId`, `framePolicyRef`, `timingPolicyRef` | approved snapshot ref, artifact scope, frame/timing refs |
| Private media refs | `mediaRef`, `workspaceId`, `sourceClipId`, `uploadedOrder`, `checksum`, `provenance`, `privacyClass` | private ref, checksum, provenance, workspace boundary |
| Bounded frame/timecode refs | `clipId`, `timecodeStart`, `timecodeEnd`, `frameStart`, `frameEnd`, `maxFrameCount`, `samplingPolicy` | bounded time/frame range |
| Route/capability metadata | `routeId`, `capabilityId`, `ownerWorkstream`, `blockedFlags`, `qaStatus`, `sourceRefs` | owner id, false execution flags, QA status |
| Cost/capacity metadata | `costClass`, `capacityClass`, `durationClass`, `assumptions`, `riskLevel` | assumptions, bounded estimate, no billing mutation |
| Benchmark/sidecar metadata | `benchmarkId`, `sidecarPolicyRef`, `hostClass`, `redactionStatus`, `noExecutionProof` | redaction, no-execution proof |

## Track B Outputs

| Output | Required Fields | Consumer | Notes |
| --- | --- | --- | --- |
| OCR/text-region manifest | `ocrManifestId`, `frameRefs`, `textRegions`, `language`, `confidencePolicy`, `redactionStatus`, `qaStatus` | Track A, AI Tools, Compliance | Planning-only; no OCR execution here. |
| Scene/shot manifest | `sceneManifestId`, `clipRefs`, `timecodes`, `thresholdPolicy`, `boundaryCandidates`, `qaStatus` | Track A, Worker future | Candidate boundaries only. |
| Media metadata manifest | `metadataManifestId`, `streamSummary`, `duration`, `fps`, `resolution`, `codecPolicy`, `checksumRefs`, `qaStatus` | Track A, Observability, Supabase future | No probe/decode execution here. |
| Image derivative policy | `derivativePolicyId`, `sourceFrameRefs`, `targetTypes`, `dimensions`, `formatPolicy`, `checksumPlan`, `retentionPolicy` | Track A, AI Tools | No derivative generation here. |
| Data summary manifest | `summaryManifestId`, `sourceTables`, `schema`, `rowCount`, `redactionStatus`, `qaStatus` | Observability, Billing planning | DuckDB/Polars remain planning-only. |
| Route/capability handoff | `routeHandoffId`, `capabilityIds`, `ownerWorkstream`, `blockedFlags`, `nextApprovalNeeded` | TOOL-ROUTE future | Must keep execution flags false. |
| Audio owner handoff | `audioHandoffId`, `technicalObservationRefs`, `recommendedOwner`, `blockedRuntime` | Sound/Music/Audio | DeepFilterNet/Signalsmith/Demucs are not owned here. |
| Graphics owner handoff | `graphicsHandoffId`, `ocrRefs`, `safeZoneRefs`, `collisionRisks`, `privateDerivativePolicy` | AI Tools creative graphics | Generation/rendering remains outside this study. |
| Render owner handoff | `renderHandoffId`, `track_b_media_analysis_intake`, `sceneRefs`, `metadataRefs`, `checksumRefs` | Track A render/export | Final render/export remains outside this study. |

## Required QA Fields

- confidence policy
- source provenance
- redaction status
- checksum status
- privacy class
- bounded scope status
- false-positive/false-negative risk
- downstream owner
- blocked execution flags
- required future approval

## Blocked Handoffs

- Raw media to tools.
- Raw prompts to tools, workers, routes, or providers.
- Raw provider outputs to Track B runtime.
- Signed URLs as source of truth.
- Public artifacts.
- Supabase writes.
- Worker jobs without approved snapshot and artifact scope.
- Audio, creative graphics, or render/export runtime without owner approval.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, media processing, browser capture, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
