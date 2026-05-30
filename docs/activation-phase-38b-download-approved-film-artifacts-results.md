# Phase 38B FILM Artifact Download Results

Status: `completed`

Track: `A visual/video`

Phase 38B downloaded only the official FILM `film_net/Style/saved_model` TF2 Saved Model tree from the README-linked Google Drive folder, computed checksums, uploaded the artifact tree and evidence manifests to private staging GCS, and verified all expected objects.

No FILM runtime, slow-motion execution, media processing, Docker build, Cloud Run deploy/job, provider call, Revideo path, public URL, public bucket access, production unlock, external beta unlock, or broad-media unlock occurred.

## Source And License

- Official repository: `https://github.com/google-research/frame-interpolation`
- Official project page: `https://film-net.github.io/`
- License: Apache-2.0 from `https://raw.githubusercontent.com/google-research/frame-interpolation/main/LICENSE`
- Checkpoint source: `https://drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy?usp=sharing`
- Selected artifact: `film_net/Style/saved_model`

Codex license decision: `staging_download_approved_by_codex`

Human license approval required: `false`

## Private GCS Target

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`

## Checksums

- `0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853  film_net/Style/saved_model/keras_metadata.pb`
- `4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985  film_net/Style/saved_model/saved_model.pb`
- `8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9  film_net/Style/saved_model/variables/variables.data-00000-of-00001`
- `d19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5  film_net/Style/saved_model/variables/variables.index`

Aggregate SHA-256: `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`

## Upload Verification

Uploaded object count: `9`

Verified private objects:

- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/film_net/Style/saved_model/keras_metadata.pb`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/film_net/Style/saved_model/saved_model.pb`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/film_net/Style/saved_model/variables/variables.data-00000-of-00001`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/film_net/Style/saved_model/variables/variables.index`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/file_checksums_sha256.txt`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/model_tree_manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/source_evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/license_evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/download_report.json`

Downloaded at: `2026-05-30T22:53:33.983Z`

Uploaded at: `2026-05-30T22:53:57.515Z`

Verified at: `2026-05-30T22:54:02.195Z`

## IAM

IAM mutation: `none`

Phase 38C runtime service-account read access is deferred until the generated-frame runtime verification phase explicitly approves it.

## Phase38C Readiness

Phase38C readiness: `ready`

Ready only for generated-frame FILM runtime verification planning/execution using the private Phase 38B artifact tree and checksum evidence.

Not ready for:

- real-video slow-motion sample
- full-video interpolation
- production
- external beta
- paid production
- broad real user media
- public output
- provider execution
- Revideo integration

## Blocked

- `filmRuntimeAllowed=false`
- `slowMotionAllowed=false`
- `realVideoSlowMotionAllowed=false`
- `fullVideoInterpolationAllowed=false`
- `providerAllowed=false`
- `revideoAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `paidProductionAllowed=false`
- `broadRealUserMediaAllowed=false`

## Warnings

- Official repository is archived/read-only.
- Phase 38C must separately validate runtime dependencies before generated-frame verification.
- Human visual review is still required before any controlled selected real-video slow-motion sample.
