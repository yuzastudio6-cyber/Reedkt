# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Handoff Contract

This contract defines safe metadata `SOUND_MUSIC_AUDIO` may consume or emit in later planning phases. It is not a worker contract and does not authorize execution.

## Consumed Inputs

| Input Class | Required Fields | Blocked If Missing |
| --- | --- | --- |
| Approved snapshot context | `approvedPlanSnapshotId`, `candidateId`, `approvalStatus`, `artifactScopeId`, `timingPolicyRef`, `creditEstimateRef` | approved snapshot ref, artifact scope, timing refs, credit estimate where generation/processing is planned |
| Private audio/media refs | `mediaRef`, `audioRef`, `workspaceId`, `sourceClipId`, `checksum`, `provenance`, `privacyClass` | private ref, checksum, provenance, workspace boundary |
| Audio analysis metadata | `durationSeconds`, `speechPresence`, `musicDetected`, `musicSpeechOverlap`, `clippingDetected`, `loudnessStatus`, `analysisSource` | bounded analysis source, no real-analysis claim |
| SoundSync/timing refs | `masterTimingPlanId`, `captionCueRefs`, `visualCueRefs`, `musicCueRefs`, `sfxCueRefs` | timing base, cue reason, speech-safe status |
| Tool route metadata | `capabilityId`, `ownerWorkstream`, `blockedFlags`, `qaStatus`, `sourceRefs` | owner id, false execution flags, QA status |
| Provider route metadata | `providerRouteId`, `mockOnly`, `secretRefName`, `costClass`, `creditGateRef` | mock/disabled status, secret ref name only, credit gate |
| Demucs review metadata | `separationReason`, `modelSourceRef`, `checksumPlan`, `licenseReviewRef`, `humanApprovalRef` | provenance/legal/human approval |

## SOUND_MUSIC_AUDIO Outputs

| Output | Required Fields | Consumer | Notes |
| --- | --- | --- | --- |
| Voice cleanup plan | `cleanupPlanId`, `toolCandidate`, `cleanupStrength`, `reason`, `risks`, `qaGateRefs` | Worker future, Product review | DeepFilterNet planning only; runtime remains blocked. |
| Loudness/normalization plan | `loudnessPlanId`, `targetLufs`, `truePeakDb`, `platformTarget`, `ffmpegPolicyRef` | Track A, Worker future | Command metadata only. |
| Music ducking/mix plan | `mixPlanId`, `duckingDb`, `attackMs`, `releaseMs`, `voiceFirst`, `reason` | Track A, Product review | No audio mix is rendered here. |
| SoundSync cue plan | `cuePlanId`, `cueType`, `cueTime`, `reason`, `confidence`, `sourceRefs` | Model orchestration, Track A | Beat detection cannot be claimed unless real analysis later runs. |
| SFX route plan | `sfxRouteId`, `targetLayer`, `providerCandidate`, `promptStyle`, `durationPlan`, `mixProfile`, `qaPolicyRef` | Provider Gateway, Worker future | Mirelo/MMAudio/internal library remain mock/future only. |
| Music generation plan | `musicPlanId`, `cueId`, `lyriaPromptPlanId`, `creditGateRef`, `qaPolicyRef` | Provider Gateway, Billing, Worker future | Lyria remains mock/disabled until separate approval. |
| Demucs blocked review | `demucsReviewId`, `blockedReason`, `missingApprovals`, `sourceRefs` | Human/legal owner, Worker future | Demucs blocked pending provenance/legal/human approval. |
| Audio owner handoff | `audioHandoffId`, `capabilityIds`, `ownerWorkstream`, `blockedFlags`, `nextApprovalNeeded` | TOOL-ROUTE future | Must keep execution flags false. |

## Blocked Fields

- raw prompt text as worker/tool input
- signed URL source-of-truth refs
- public artifact refs
- raw provider keys or DB URLs
- source overwrite instructions
- arbitrary FFmpeg args
- unbounded media/audio ranges
- Demucs model download/runtime without provenance/legal/human approval
- route/tool/worker/provider execution flags set to true

## Required QA Fields

- voice clarity and naturalness risk
- loudness/true-peak target
- clipping review
- music-over-voice status
- SFX density and reason
- cue timing reason
- artifact privacy and source immutability
- provenance/licensing status
- cost/capacity class
- downstream owner
- blocked execution flags

## Supabase And Source-Of-Truth Boundary

Supabase update required: `no write`.

Future source-of-truth rows, RLS policy, storage refs, and milestone registry writes belong to `SUPABASE_RLS_STORAGE_DATABASE`. This Sound study may name future Supabase row-ref classes only; it does not write rows, run SQL, deploy migrations, or touch environments.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, audio processing, media processing, browser capture, map rendering, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
