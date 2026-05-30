# Phase 38C FILM Runtime Verification Results

Status: completed

Run ID: `phase38c-20260530T23315`

Execution:

- Cloud Run job: `reeditpro-staging-film-runtime-job`
- Cloud Run execution: `reeditpro-staging-film-runtime-job-gbwhl`
- Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:5be105e4fe49b21bb2e4085eca8c7fc4f01de74234de742816267b04e6ca6c2a`
- Image tag: `staging-film-runtime-001`
- Compute: CPU-only, 4 CPU, 8Gi memory, parallelism 1, max retries 0
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Mode: `generated_frame_interpolation`

Model:

- Artifact: `film_net/Style/saved_model`
- Private GCS path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`
- `keras_metadata.pb`: `0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853`
- `saved_model.pb`: `4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985`
- `variables.data-00000-of-00001`: `8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9`
- `variables.index`: `d19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5`
- Aggregate SHA-256: `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`

Generated fixture:

- Two generated synthetic RGB frames
- Dimensions: 256x256
- Interpolation time: 0.5
- Interpolated frames: 1
- Mean absolute difference from frame A: `0.043518852442502975`
- Mean absolute difference from frame B: `0.042967576533555984`
- Output stddev: `0.14680400490760803`

Private artifacts:

- Generated assets prefix: `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/phase38c-20260530T23315/`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38c/phase38c-20260530T23315/reports/phase38c-report.json`
- QA JSON: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38c/phase38c-20260530T23315/qa/film-runtime-qa.json`

QA summary:

- `model_artifacts`: passed
- `runtime_integrity`: passed; TensorFlow 2.15.0 loaded the FILM SavedModel and returned an image tensor
- `fixture_integrity`: passed
- `interpolated_frame_artifacts`: passed
- `motion_sanity`: passed
- `artifact_privacy`: passed
- `blocked_features`: passed
- Blockers: none
- Warnings: generated synthetic frames only; no real-video slow-motion QA yet

IAM:

- Prefix-scoped conditional bindings were already present for FILM model read, generated artifact create, QA create, and worker-temp create.
- No broad bucket-wide grants, public principals, `storage.admin`, `storage.objectAdmin`, owner/editor, signed URLs, or public buckets were used.

Dependency note:

- The first planned Docker base `tensorflow/tensorflow:2.15.1` was unavailable on Docker Hub. Phase 38C used the pinned compatible TensorFlow CPU base `tensorflow/tensorflow:2.15.0`, which successfully loaded the SavedModel.

Phase 38D readiness:

- Ready for one controlled selected real-video slow-motion sample only.
- Not ready for full-video interpolation, production, external beta, paid production, broad real media, providers, Revideo, public output, or final delivery export.

Blocked:

- Real-video slow motion beyond the future selected Phase 38D sample gate
- Full-video interpolation
- Production, external beta, paid production, and broad real media
- Providers and Revideo
- Public URLs/public buckets

Package-lock: unchanged
