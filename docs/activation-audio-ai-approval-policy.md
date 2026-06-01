# Phase 36A Audio AI Approval Policy

Phase 36A is a non-mutating model/tool approval workflow for future audio AI.

## Approval State

- `audioAiPlanningRecommendation=deepfilternet_first`
- `deepFilterNetPlanningAllowed=true`
- `rnnoiseFallbackPlanningAllowed=true`
- `demucsRestrictedPlanningAllowed=true`
- `audioAiDownloadAllowed=false`
- `audioAiRuntimeAllowed=false`
- `realVideoAudioAiCleanupAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealUserMediaAllowed=false`
- `providerAllowed=false`
- `revideoAllowed=false`

## Tool Decisions

DeepFilterNet is the first planning recommendation for future speech
enhancement/noise suppression. Phase 36A does not select, download, or checksum
an exact DeepFilterNet artifact.

RNNoise is fallback planning only because its build path can download model
files. Any future RNNoise phase must pin the exact model artifact and prove the
runtime will not fetch models implicitly.

Demucs is restricted/deferred because it is a source-separation tool, not the
default ReeditPro voice-cleanup path, and pretrained model artifact provenance
requires additional review.

## Execution Boundary

Frontend code and approval reports must not run audio AI, providers, worker
jobs, rendering, storage mutation, or media processing. Future workers must
execute approved plan snapshots, never raw chat.
