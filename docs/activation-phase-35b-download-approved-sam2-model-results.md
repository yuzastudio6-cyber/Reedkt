# Phase 35B Download Approved SAM2 Model Results

- phase: 35B
- status: completed
- modelFamily: SAM2 / Segment Anything Model 2
- modelId: sam2.1_hiera_tiny
- checkpointFileName: sam2.1_hiera_tiny.pt
- configFileName: sam2.1_hiera_t.yaml
- licenseName: Apache-2.0
- codexLicenseDecision: staging_download_approved_by_codex
- humanLicenseApprovalRequired: false
- targetGcsPath: gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/
- checkpointSha256: 7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69
- configSha256: f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d
- aggregateSha256: 45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2
- checkpointSizeBytes: 156008466
- configSizeBytes: 3855
- uploadedObjectCount: 5
- downloadedAt: 2026-05-29T13:25:08.934Z
- uploadedAt: 2026-05-29T13:27:03.520Z
- verifiedAt: 2026-05-29T13:27:07.165Z
- sam2DownloadCompleted: true
- sam2RuntimeAllowed: false
- sam2TemporalTrackingAllowed: false
- sam2FullVideoMaskAllowed: false
- fullVideoTextBehindSubjectAllowed: false
- providerAllowed: false
- revideoAllowed: false
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false

## Source Evidence

Codex verified the official `facebookresearch/sam2` source evidence before
download. The official README lists the SAM2.1 tiny checkpoint/config, the
checkpoint download script includes the SAM2.1 `092824` base URL and tiny file
name, and the official license evidence is Apache-2.0. The staging download
decision is:

- licenseDecision: staging_download_approved_by_codex
- humanLicenseApprovalRequired: false

## Private GCS Artifacts

- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/sam2.1_hiera_tiny.pt`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/sam2.1_hiera_t.yaml`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/file_checksums_sha256.txt`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/model_tree_manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/source_evidence.json`

All uploaded object descriptions returned non-zero sizes. No public URL or
signed URL was created.

## IAM

No IAM change was made in Phase 35B. Runtime service-account read access is
deferred to Phase 35C if runtime verification is explicitly approved.

## Phase35C Readiness

Ready for generated/synthetic SAM2 runtime verification only.

Not ready for:

- real video temporal tracking
- full-video masks
- full-video text-behind-subject
- production
- external beta
- paid production
- broad real user media

## Still Blocked

- SAM2 runtime
- SAM2 temporal tracking
- full-video masks
- full-video text-behind-subject
- providers
- Revideo
- FILM and slow motion
- production, external beta, paid production, and broad real media
