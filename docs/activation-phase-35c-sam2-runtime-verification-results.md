# Phase 35C SAM2 Runtime Verification Results

- phase: 35C
- status: completed / generated_fixture_runtime_verified
- runId: phase35c-20260529T16082
- modelId: sam2.1_hiera_tiny
- checkpointGcsPath: gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/sam2.1_hiera_tiny.pt
- configGcsPath: gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/sam2.1_hiera_t.yaml
- checkpointSha256: 7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69
- configSha256: f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d
- aggregateSha256: 45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2
- runtimeImage: us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:d40444269ba867dfae4ef09da803a67870bc03b381e41359e482eeed3ab381c9
- runtimeImageTag: staging-sam2-runtime-001
- runtimeImageDigest: sha256:d40444269ba867dfae4ef09da803a67870bc03b381e41359e482eeed3ab381c9
- cloudRunJob: reeditpro-staging-sam2-runtime-job
- cloudRunExecution: reeditpro-staging-sam2-runtime-job-5smkz
- gpuType: nvidia-l4
- gpuDevice: NVIDIA L4
- generatedFixtureOnly: true
- generatedFixtureDimensions: 512x512
- generatedFixtureFrameCount: 5
- promptType: box
- sam2RuntimeVerified: true
- phase35DReadiness: ready for controlled short real-video temporal mask tracking only
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- sam2TemporalTrackingAllowed: false
- sam2FullVideoMaskAllowed: false
- fullVideoTextBehindSubjectAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false

## Execution Summary

Phase 35C built and pushed the dedicated SAM2 runtime image, deployed
`reeditpro-staging-sam2-runtime-job`, and executed exactly one generated-fixture
runtime verification on Cloud Run GPU. The job copied only the Phase 35B private
SAM2.1 tiny checkpoint/config/manifest/checksum files from staging GCS, verified
the expected SHA-256 checksums, generated five synthetic 512x512 frames inside
the job, and ran SAM2 mask propagation with a frame-0 box prompt.

No real video, extracted real-video frame, user media, provider, Revideo, FILM,
slow motion, full-video mask, or text-behind-subject path executed.

## Runtime QA

- model_artifacts: passed
- runtime_integrity: passed; CUDA available on NVIDIA L4
- fixture_integrity: passed; generated-only five-frame fixture
- mask_artifacts: passed; 5 masks and 5 overlays emitted
- temporal_fixture_consistency: passed for generated-fixture area/centroid sanity
- artifact_privacy: passed; outputs stayed under private staging GCS prefixes
- blocked_features: passed; all production/beta/provider/real-media paths stayed blocked
- qaStatus: warning
- qaBlockers: none

Warnings:

- Generated fixture only; this is not real-video temporal QA.
- Human visual review is still required before broader mask/compositing claims.

## Private Artifacts

Generated assets:

- gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-20260529T16082/fixture/
- gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-20260529T16082/prompt/
- gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-20260529T16082/masks/
- gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-20260529T16082/overlays/
- gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-20260529T16082/metadata/

QA artifacts:

- gs://reeditpro-staging-reeditpro-qa-artifacts/activation-sam2-runtime/phase35c/phase35c-20260529T16082/qa/sam2-runtime-qa.json
- gs://reeditpro-staging-reeditpro-qa-artifacts/activation-sam2-runtime/phase35c/phase35c-20260529T16082/reports/phase35c-report.json

## IAM

No broad IAM grants were added. The execution found the required conditional
prefix-scoped bindings already present for
`reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`:

- objectViewer on the private SAM2 model prefix
- objectCreator on the Phase 35C generated-assets prefix
- objectCreator on the Phase 35C QA prefix
- objectCreator on the Phase 35C worker-temp prefix

No storage admin/object admin, owner/editor, public principal, provider secret,
or broad bucket write permission was granted.

## Phase 35D Readiness

Ready only for Phase 35D controlled short real-video temporal mask tracking
planning/execution. Phase 35D must remain bounded to a very short selected
segment, private artifacts, no public access, no providers, and human/QA review.

Not ready for:

- full-video mask tracking
- full-video text-behind-subject
- production
- external beta
- broad real user media
- FILM / slow motion
