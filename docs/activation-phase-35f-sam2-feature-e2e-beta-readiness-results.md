# Activation Phase 35F SAM2 Feature E2E Beta-Readiness Results

Status: completed / ready_for_internal_sam2_feature_testing

Phase 35F executed one private, bounded SAM2 text-behind-subject feature E2E flow on the approved controlled Phase 32 video chain. This is internal feature-readiness evidence only; it does not unlock external beta, paid production, broad real media, public access, final delivery export, providers, Revideo, FILM, slow motion, Real-ESRGAN, or arbitrary user media.

Run:

- run ID: `phase35f-20260530T02293`
- Cloud Run job: `reeditpro-staging-sam2-runtime-job`
- Cloud Run execution: `reeditpro-staging-sam2-runtime-job-fprzj`
- runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:b2129d7a724a72729e7396f074a94c2b323bad8dc962fdc63e7751385f305d04`
- GPU: `nvidia-l4`, one GPU, CUDA available, device `NVIDIA L4`

Source:

- `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- controlled Phase 32 private export only
- duration: `15.467s`
- audio preserved in source evidence
- no arbitrary media and no new video source

Approved plan snapshot:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/phase35f-20260530T02293/plan/approved-plan-snapshot.json`
- workers executed the approved Phase 35F snapshot, not raw chat
- text layer: `REEDITPRO`
- compositor: native Node PNG alpha composite using SAM2 mask foreground

Preview scope:

- mode: `full_controlled_clip_preview`
- start/end: `0s` to `15.467s`
- output sampling: `5 fps`
- frames: `77`
- dimensions: `768x432`
- max frame cap: `125`
- private preview frames only; no final delivery export

Model:

- `sam2.1_hiera_tiny`
- private Phase 35B GCS prefix: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/`
- checkpoint SHA-256: `7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69`
- config SHA-256: `f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d`
- aggregate SHA-256: `45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2`
- no external model download and no additional checkpoint download

Prompt:

- source: Phase 33D mask bounding box
- prompt type: box
- prompt frame index: `39`
- source mask dimensions: `2160x3840`
- preview frame dimensions: `768x432`
- source bounding box: `[119, 973, 2159, 3839]`
- scaled bounding box: `[42, 109, 767, 431]`
- prompt metadata: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/phase35f-20260530T02293/prompt/prompt-metadata.json`

Artifacts:

- generated assets prefix: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/phase35f-20260530T02293/`
- masks prefix: `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35f/phase35f-20260530T02293/`
- previews prefix: `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35f/phase35f-20260530T02293/`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35f/phase35f-20260530T02293/reports/phase35f-report.json`
- composition manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/phase35f-20260530T02293/composition/composition-manifest.json`
- private review manifest: `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35f/phase35f-20260530T02293/review/private-review-manifest.json`
- preview clip generated: `false`

QA summary:

- source_integrity: passed
- plan_snapshot_integrity: passed
- preview_scope: passed
- model_integrity: passed
- sam2_mask_tracking: passed
- composition_integrity: passed
- artifact_privacy: passed
- beta_readiness_evidence: passed
- blocked_features: passed
- blockers: none
- warnings: human visual review is recommended before broader use; private preview frames are the source of truth because no MP4 preview was generated

Readiness:

- SAM2 feature readiness: `ready_for_internal_sam2_feature_testing`
- Phase 35F is not external beta approval.
- Phase 35F is not paid production approval.
- Phase 35F is not broad real-media approval.
- Human visual review remains recommended before any broader SAM2 feature expansion.

Blocked:

- productionReadyAllowed: `false`
- externalBetaAllowed: `false`
- paidProductionAllowed: `false`
- broadRealUserMediaAllowed: `false`
- arbitraryRealUserMediaAllowed: `false`
- publicAccessAllowed: `false`
- providerAllowed: `false`
- revideoAllowed: `false`
- filmAllowed: `false`
- slowMotionAllowed: `false`
- realEsrganAllowed: `false`
- modelDownloadAllowed: `false`
- finalDeliveryExportAllowed: `false`
- full4KProcessingAllowed: `false`
