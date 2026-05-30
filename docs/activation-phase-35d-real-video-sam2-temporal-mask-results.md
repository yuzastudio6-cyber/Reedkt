# Phase 35D Real-Video SAM2 Temporal Mask Results

- phase: 35D
- status: completed / broader scope blocked
- runId: phase35d-20260530T004442
- sourceVideo: gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4
- anchorTimestampSeconds: 7.7335
- selectedSegment: 6.9s-8.9s
- selectedSegmentDurationSeconds: 2.0
- extractedFrameCount: 10
- extractedFrameDimensions: 768x432
- promptSource: Phase 33D mask bounding box
- promptType: box
- promptFrameIndex: 4
- scaledPromptBoundingBox: [42, 109, 767, 431]
- modelId: sam2.1_hiera_tiny
- checkpointSha256: 7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69
- configSha256: f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d
- aggregateSha256: 45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2
- runtimeImage: us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:b67dbc6d7f4c0f3641363678a750caa7cad8b610dbef2f3e4cbc87375e45c591
- runtimeImageTag: staging-sam2-real-video-temporal-001
- cloudRunJobName: reeditpro-staging-sam2-runtime-job
- cloudRunExecutionId: reeditpro-staging-sam2-runtime-job-grfx2
- gpuType: nvidia-l4
- sam2RuntimeVerified: true
- realVideoTemporalTrackingCompleted: true
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- sam2FullVideoMaskAllowed: false
- fullVideoTextBehindSubjectAllowed: false
- textBehindSubjectVideoAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false

## Execution Summary

Phase 35D executed exactly one controlled SAM2 temporal mask test on the
approved Phase 32 private export. The runtime extracted the bounded 6.9s-8.9s
segment into 10 private 768x432 frames, derived a box prompt from the Phase 33D
mask, verified the approved SAM2.1 tiny checkpoint/config checksums, and ran on
an L4 Cloud Run job.

The first manual deploy attempt used an incorrect local model runtime path and
the worker rejected it before processing media. The corrected deploy used the
approved runtime path and completed as
`reeditpro-staging-sam2-runtime-job-grfx2`.

## Private Artifacts

- generatedAssetsPrefix: gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-20260530T004442/
- masksPrefix: gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-20260530T004442/
- qaReport: gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/phase35d-20260530T004442/reports/phase35d-report.json
- segmentManifest: gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-20260530T004442/segment/segment-manifest.json
- promptMetadata: gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-20260530T004442/prompt/prompt-metadata.json
- maskSequenceMetadata: gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-20260530T004442/metadata/mask-sequence-metadata.json

## QA Summary

- source_integrity: passed
- segment_bounds: passed
- model_artifacts: passed
- prompt_integrity: passed
- runtime_integrity: passed, CUDA device NVIDIA L4
- mask_artifacts: passed, 10 masks and 10 overlays
- temporal_consistency: warning, basic area/centroid continuity passed but visual temporal quality still requires human review
- artifact_privacy: passed
- blocked_features: passed
- blockers: none

## IAM

No additional IAM mutation was required during the successful execution. The
existing prefix-scoped conditional bindings cover the approved SAM2 model read,
Phase 32/33D source reads, and Phase 35D generated/mask/QA/temp object creation.

## Phase 35E Readiness

Ready only for controlled segment text-behind-subject preview planning/execution.
Phase 35E is not full-video text-behind-subject approval and is not production,
external beta, broad real media, provider, Revideo, FILM, or slow-motion
approval.

## Blocked Scope

Phase 35D does not approve arbitrary real user media, full-video mask tracking,
text-behind-subject video, public delivery, production, external beta, broad
real media, providers, Revideo, FILM, or slow motion.
