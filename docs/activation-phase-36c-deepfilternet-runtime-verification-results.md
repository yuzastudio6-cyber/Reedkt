# Phase 36C DeepFilterNet Runtime Verification Results

- phase: 36C
- status: blocked
- runId: `phase36c-20260530T131522`
- tool: DeepFilterNet
- selectedVersion: v0.5.6
- runtimeMode: generated_audio
- generatedAudioOnly: true
- runtimeImage: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:883df7f72317fec06b8e908ff836ff9844803c02366f0067b2f8fcda8d95cb1a`
- runtimeImageTag: `staging-deepfilternet-runtime-001`
- runtimeImageDigest: `sha256:883df7f72317fec06b8e908ff836ff9844803c02366f0067b2f8fcda8d95cb1a`
- cloudRunJob: `reeditpro-staging-deepfilternet-runtime-job`
- cloudRunExecutionId: `reeditpro-staging-deepfilternet-runtime-job-7jm4n`
- serviceAccount: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- artifactGcsPath: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- deepFilterNetRuntimeVerified: false
- realVideoInputAllowed: false
- realMediaAudioAiAllowed: false
- rnnoiseAllowed: false
- demucsAllowed: false
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false

## Checksums

- CLI SHA-256:
  `70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da`
- DeepFilterNet3 ONNX archive SHA-256:
  `c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616`
- Aggregate SHA-256:
  `eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b`

## Current Evidence

Phase 36B private artifact upload/checksum evidence is complete. Phase 36C
built and pushed the dedicated CPU-only runtime image, deployed the Cloud Run
Job, and executed it in generated-audio mode. The Phase 36C access diagnostic
confirmed that the worker downloads explicit object names and does not list the
artifact prefix. The approved artifact objects exist with exact matching names,
the Cloud Run job uses the expected CPU worker service account and Cloud Run ADC,
and the blocked permission remains `storage.objects.get`.

The diagnostic added a managed folder on the exact approved artifact prefix,
granted only `roles/storage.objectViewer` to the CPU worker on that managed
folder, added a bucket-level exact-seven-object conditional objectViewer
binding, and added a project-level exact-seven-object conditional objectViewer
binding. A rebuilt diagnostic image was redeployed with fresh run IDs and still
stopped before copying the DeepFilterNet CLI because the CPU worker service
account could not read the approved Phase 36B artifact objects.

## Execution Attempts

- `reeditpro-staging-deepfilternet-runtime-job-n97tq`: blocked before artifact
  copy while IAM propagation was still settling.
- `reeditpro-staging-deepfilternet-runtime-job-wn6kp`: blocked when retrying the
  same run ID would have overwritten the prior blocked report path.
- `reeditpro-staging-deepfilternet-runtime-job-x5p6w`: blocked on the CPU worker
  service account missing `storage.objects.get` for the approved artifact prefix.
- `reeditpro-staging-deepfilternet-runtime-job-9rcfc`: blocked on the same
  `storage.objects.get` access after adding an additional explicit object
  resource-context prefix binding.
- `reeditpro-staging-deepfilternet-runtime-job-sp2fc`: Phase 36C IAM retry with
  fresh run ID `phase36c-20260530T123258`; blocked on the same
  `storage.objects.get` access after confirming the exact conditional
  objectViewer bindings are present.
- `reeditpro-staging-deepfilternet-runtime-job-d7pq2`: diagnostic retry with
  managed-folder objectViewer on the approved artifact prefix and run ID
  `phase36c-20260530T124907`; still blocked on `storage.objects.get`.
- `reeditpro-staging-deepfilternet-runtime-job-b6mmw`: final diagnostic retry
  with rebuilt diagnostic image `sha256:2c709d298628a5189ec0f4ddc0f11ac78554af328a81f647414837c9388402bc`
  and run ID `phase36c-20260530T125233`; still blocked on
  `storage.objects.get`.
- `reeditpro-staging-deepfilternet-runtime-job-g4vwv`: retry with bucket-level
  exact-seven-object conditional objectViewer and rebuilt diagnostic image
  `sha256:883df7f72317fec06b8e908ff836ff9844803c02366f0067b2f8fcda8d95cb1a`;
  run ID `phase36c-20260530T130843`; still blocked on `storage.objects.get`.
- `reeditpro-staging-deepfilternet-runtime-job-fdpgb`: retry with additional
  project-level exact-seven-object conditional objectViewer; run ID
  `phase36c-20260530T131144`; still blocked on `storage.objects.get`.
- `reeditpro-staging-deepfilternet-runtime-job-7jm4n`: propagation retry with
  run ID `phase36c-20260530T131522`; still blocked on `storage.objects.get`.

## IAM

Added only prefix-scoped conditional bindings for
`reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`:

- `roles/storage.objectViewer` on
  `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- an additional object-context `roles/storage.objectViewer` binding for the same
  artifact prefix
- `roles/storage.objectCreator` on Phase 36C generated, analysis, QA, and
  worker-temp prefixes

The Phase 36C IAM retry did not add a broad grant. The artifact-read binding was
already present with the exact approved prefix expression:
`resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/audio-ai/deepfilternet/v0.5.6/")`.

The Phase 36C diagnostic also created this managed folder and applied only
managed-folder-scoped read access:

- managed folder:
  `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- role: `roles/storage.objectViewer`
- member:
  `serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

The follow-up diagnostic added only exact-object viewer bindings for these seven
approved Phase 36B artifacts, first on the generated-assets bucket and then on
the project:

- `deep-filter-0.5.6-x86_64-unknown-linux-musl`
- `DeepFilterNet3_onnx.tar.gz`
- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `source_evidence.json`
- `license_evidence.json`
- `download_report.json`

No `storage.admin`, `storage.objectAdmin`, owner/editor, public principal, or
broad write role was granted.

## Access Diagnostics

- all seven Phase 36B objects exist under the approved prefix
- object names match the runtime policy exactly
- worker code downloads explicit object names and does not list the prefix
- Cloud Run job and executions use
  `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- no `GOOGLE_APPLICATION_CREDENTIALS` override is present in the job env
- active account cannot impersonate the CPU worker because
  `iam.serviceAccounts.getAccessToken` is denied
- `policytroubleshooter.googleapis.com` and `cloudasset.googleapis.com` were
  enabled for the diagnostic so the requested access checks could run
- Policy Troubleshooter on the generated-assets bucket returned `NOT_GRANTED`
  for `storage.objects.get`; it saw the relevant conditional objectViewer
  bindings but also returned `ERROR_IAM_DENY` while trying to generate the deny
  explanation
- Cloud Asset IAM analysis fully explored the project/bucket scope and found
  the conditional objectViewer bindings for the CPU worker, including the
  Phase 36C prefix binding, bucket-level exact-seven-object binding, and
  project-level exact-seven-object binding
- project-level deny policy list returned no deny policies
- org-level deny policy list for organization `622755361329` requires
  `iam.googleapis.com/denypolicies.list`, which the active account does not have
- Principal Access Boundary inspection for organization `622755361329` requires
  `iam.principalaccessboundarypolicies.list`, which the active account does not
  have
- Access Context Manager inspection could not run because
  `accesscontextmanager.googleapis.com` is disabled

## QA Summary

- `model_artifacts`: blocked before artifact copy
- `runtime_integrity`: blocked before DeepFilterNet CLI execution
- `fixture_integrity`: not reached
- `enhanced_audio_artifacts`: not reached
- `audio_safety_metrics`: not reached
- `artifact_privacy`: no public access enabled
- `blocked_features`: real media, RNNoise, Demucs, providers, Revideo, FILM,
  slow motion, production, beta, and broad media remained blocked

## Phase36D Readiness

Blocked. Phase 36D must not proceed until a future Phase 36C retry can copy the
approved DeepFilterNet artifacts from private GCS and complete generated-audio
runtime QA.

## Blocker

`reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` does not have
`storage.objects.get` access to the approved Phase 36B DeepFilterNet artifact
objects, despite the Phase 36C prefix-scoped conditional objectViewer bindings
being present on the bucket IAM policy, despite managed-folder-scoped
objectViewer being present on the approved artifact prefix, and despite exact
seven-object conditional objectViewer bindings being present on both the bucket
and project.

Required human/GCP admin action: review why Policy Troubleshooter returns
`NOT_GRANTED` / `ERROR_IAM_DENY` and why the existing conditional
`roles/storage.objectViewer` bindings do not authorize `storage.objects.get` for
`reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` on
`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`.
Specifically review organization-level deny policies, Principal Access Boundary,
VPC-SC/service perimeter behavior, and any org-level policy control not visible
to the active project owner.
Do not unblock Phase 36D until this access issue is resolved and Phase 36C
generated-audio runtime QA passes.

## Blocked Scope

Real video/audio input, arbitrary user media, RNNoise, Demucs, providers,
Revideo, FILM, slow motion, production, external beta, paid production, and
broad real media remain blocked.
