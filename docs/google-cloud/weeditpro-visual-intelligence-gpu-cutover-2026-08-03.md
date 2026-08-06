# WeEditPro Visual Intelligence and GPU cutover receipt

Date: 2026-08-03

This receipt distinguishes implemented source architecture from live cloud
qualification. It does not call an unavailable candidate “installed” and does
not authorize public or production use.

## Frozen architecture

- The top-level skill is `visual_intelligence`.
- Its four internal operations are `analyze_media`, `inspect_edit`,
  `query_range`, and `compare_media`.
- Orchestra is the only invocation, work-graph, and result-routing owner.
- Gemini 3.1 Pro Preview is the semantic provider with explicit high thinking
  and high media resolution. Direct provider calls by peer skills are blocked.
- New visual-understanding work cannot use Qwen. Qwen schemas and immutable
  image digests remain historical readback only.
- New temporal segmentation/tracking cannot use SAM2. Orchestra coordinates
  the `track_all` skill, whose qualified heavy operation will be SAM 3.1.
- Heavy processing uses one user-triggered A100 80GB Batch job. L4 is a
  separately qualified, quality-preserving heavy fallback. Normal GPU media,
  render, encode, and deterministic QA use L4.
- No approved work means zero GPU instances. Cold start and model load are
  measured in the estimate and terminal usage record.
- Account-effective cloud prices, approved estimate, funded credit
  reservation, per-attempt cost, system-failure refund/release, and
  unapproved-overage absorption all fail closed.

## Cloud cutover applied

An independent read confirmed every obsolete visual execution was terminal.
The exact retirement allowlist then removed ten SAM2/Qwen/VLM Cloud Run job
definitions and the Qwen2.5-VL Cloud Run service from project `reeditpro` in
`us-central1`. The Qwen-only caller service account was disabled. A second
read found no remaining Qwen, SAM2, or phase-39c VLM job/service definition.

Historical Artifact Registry digests were deliberately retained. They are not
fresh dispatch authority and preserve prior audit evidence.

The repository cutover now also removes the complete unreferenced reviewed-
local Qwen2.5-VL long-form stack, its MLX runtime validators/adapters, all five
local Python inference runners, the generic Qwen visual provider, the four
Edit Reference Qwen adapters, and the old local-media study executors. Edit
Reference no longer accepts a local Qwen runtime option, constructs a Qwen MLX
process path, or falls back to direct local-media analysis when the Orchestra
read port is absent. A fresh reference-video study must reread the exact
authenticated Orchestra/Visual Intelligence result or fail closed. A compact
legacy-result transformer was also removed from the evidence orchestrator, so
old local-media result objects cannot be supplied to create fresh findings.
Previously materialized immutable evidence remains readable through its stored
repository records. The remaining Qwen model-role and evidence schemas are
historical compatibility contracts only and cannot become fresh Orchestra
authority.

The GPU-first processing cutover also retired the fifteen remaining frozen
CPU-only Cloud Run Job definitions after a second live inventory proved that
every prior execution was terminal. The guarded retirement exact-matched each
job's name, image digest or historical fixed tag, service identity, CPU/memory
limits, and absence of a GPU before deletion. The deleted definitions covered
the obsolete sound analysis/metadata, staging analysis, speech, audio cleanup,
interpolation, color, caption burn-in, render, QA, and CPU tool-readiness lanes.

No Artifact Registry image, service identity, Cloud Run service, GPU job,
historical execution record, billing record, or customer-credit state was
deleted or changed. An independent reread now finds only the two pre-existing
GPU staging jobs (BiRefNet and Real-ESRGAN) and the API/staging API/private
search control-plane services. Those GPU staging definitions remain evidence
only and cannot authorize fresh work until the canonical L4 release,
account-effective price, approved estimate/reservation, dispatch admission,
terminal usage reconciliation, and scale-to-zero gates pass.

The private-search service was then isolated from the retired shared CPU
worker identity. The fixed migration retained its exact immutable image,
one-CPU/one-GiB envelope, zero-idle/maximum-one scaling, private IAM policy,
and 100% ready traffic while changing only its service identity to
`reeditpro-private-search-sa`. This is a bounded search/control-plane exception;
it cannot decode media, render, encode, load a model, run inference, or satisfy
any GPU release gate. The five fixed legacy CPU processing identities were
disabled—not deleted—only after Cloud Run, active Batch, and ongoing Cloud
Build detachment checks passed. An immediate final IAM reread observed one
eventually consistent stale value and failed closed; the authoritative
idempotent rerun then observed all five disabled and emitted
`weeditpro-private-search-identity-isolation-v1`.

## Official SAM 3.1 source state

- Official code: `facebookresearch/sam3`, revision
  `96914d2425f90a64f45ca977c2b5165418099543`.
- Official checkpoint: `facebook/sam3.1`, revision
  `daa63191845a41281374e725f4c9e51c7a824460`, file
  `sam3.1_multiplex.pt`.
- The repository is manually gated and requires a person to submit contact
  details and accept Meta's license. Automated terms acceptance is forbidden.
- The cloud project currently has no usable authorized checkpoint-secret
  version, so no checkpoint bytes were downloaded to the Mac or cloud.
- Official compatibility issue `facebookresearch/sam3#526` is still open.
  Strict checkpoint/source compatibility therefore remains a blocking gate.
- The exact cloud-only Docker candidate, source patch, A100/L4 runtime
  contracts, private input staging, immutable output contract, and build/
  supply-chain authorities exist in source and remain non-admissible until
  checkpoint, dependency, scan, signature, and real-GPU evidence pass.
- The canonical official-artifact publisher now exists. It can run only as
  Cloud Run Job `weeditpro-sam31-official-artifact-ingest`, archives the exact
  pinned Git source in ephemeral job storage, reads one exact versioned
  Secret Manager token after an exact human terms-acceptance reread, and
  streams the official gated checkpoint into the private model-artifact
  bucket. The credential is removed before any approved signed-storage
  redirect and is never returned or persisted.
- Source and checkpoint objects are create-only. Every completed write is
  reread by exact GCS generation, ETag, byte length, and SHA-256. An existing
  object or uncertain transport outcome requires separate reconciliation;
  there is no automatic download or spend retry.
- `canonical-sam3_1-private-artifact-ingest-receipt-v3` now retains the exact
  official-publication receipt ref. Security/malware scan, license approval,
  strict source/checkpoint compatibility, image build, GPU runtime, credits,
  and production all remain false after publication.
- `canonical-sam3_1-source-checkpoint-compatibility-qualification-v1` is now
  the mandatory gate before private image-build eligibility. Canonical
  evidence must come from a dedicated network-none A100 80 GB qualification
  attempt and bind the exact source, patch, dependency closure, gated
  checkpoint, terms, license/privacy/trade reviews, source/checkpoint scans,
  weights-only inspection, zero-missing/zero-unexpected strict key load, real
  CUDA/bfloat16 probe output, and at least three identical deterministic probe
  runs. Contract fixtures cannot grant build authority.
- Image-build binding/capsule/authority have advanced to v2. The qualification
  record hash and serialized receipt hash are independently bound into the
  offline capsule and build arguments; the fixed runner revalidates the baked
  receipt against the exact versioned runtime-release ref. This gate still
  authorizes neither a cloud build nor a customer GPU attempt by itself.
- The qualification release owner now separately rereads the exact candidate,
  private ingest, A100 request/result, terminal Batch/log/resource/cost
  evidence, and authenticated legal/privacy/trade/security clearance into one
  create-only release. The Cloud Build execution owner must reread that exact
  release and cross-bind it to its separate build authority before any provider
  request. Missing, stale, crossed, or authority-opened release evidence fails
  before build creation and cannot be replaced by plan fields or booleans.
- The post-build supply-chain path is now executable source rather than a
  generic evidence placeholder. A separate create-only admission consumes the
  successful immutable image digest and one numeric HSM key version, then a
  dedicated signer Cloud Build pulls only that digest, archives it in the
  build workspace, runs pinned Syft v1.44.0 to emit SPDX 2.3 JSON, signs the
  digest with pinned Cosign v3.0.6 and the exact KMS key version, and verifies
  that private signature before three bounded evidence files are written.
- Docker, Syft, and Cosign builder images are all digest-pinned. The build has
  no caller source, substitutions, secret environment, customer media, model
  checkpoint, arbitrary command, mutable image tag, hidden retry, GPU-runtime,
  credit, or production authority. Its admission, consumption, submission, and
  terminal observation persist create-only in the private control-plane bucket
  and are exact-reread after terminal completion.
- SBOM/signature artifacts land only in the dedicated private
  `reeditpro-production-reeditpro-image-supply-chain-evidence` bucket. The
  signer can create but not read evidence there; the API can read but not
  create it; the image builder and GPU worker have no evidence-bucket access.
  A successful build still grants no image release: manifest/object generation,
  content hashes, SPDX structure, registry signature, Artifact Analysis
  occurrences, security approval, and original Cloud Build SLSA provenance
  remain mandatory exact-reread gates.
- The release-side evidence reader now implements those rereads. It accepts
  only the exact original image-build and signer-build lineage; rereads the
  immutable Artifact Registry digest; rereads the Cloud Build artifact
  manifest and all three GCS objects by generation; verifies the Cloud Build
  MD5 upload bindings and independently computes SHA-256; validates the pinned
  Syft SPDX 2.3 document and the pinned Cosign bundle/verification result; and
  rejects a changed, missing, duplicated, or cross-image artifact. Both OCI
  image manifests and Docker distribution v2 image manifests are recognized
  explicitly rather than assuming the Docker builder always emits OCI media.
- Artifact Analysis discovery, vulnerability, and SLSA-v1 build occurrences
  are fetched through a fixed read-only allowlist with complete bounded
  pagination and no partial-result acceptance. Severity is recomputed from
  occurrence/package evidence. Any critical, high, or unknown severity blocks
  release, and even a clean automated scan requires a separate exact
  scan-bound server security-review record. The SLSA envelope and decoded
  statement must both bind the same image digest, Google hosted builder, and
  original Cloud Build invocation. This evidence can qualify the immutable
  image supply chain only; A100/L4 qualification, runtime dispatch, credits,
  public delivery, and production remain false.
- The security decision and qualified image release now have a fixed
  create-only control-plane repository. A scan-bound security record is keyed
  by the exact immutable image and occurrence-snapshot digest, then reread and
  matched across timestamps and recomputed severity counts. Only a canonical
  qualified supply-chain release may be persisted; its exact canonical bytes
  and release hash are reread before it can become an input to either GPU
  route. Missing, changed, noncanonical, cross-scan, contract-fixture, or
  caller-promoted records fail closed. This repository grants no scan-review,
  runtime, GPU-job, credit, QA, delivery, or production authority by itself.
- A canonical A100 or L4 runtime release can no longer be compiled from a
  caller-supplied collection of qualification booleans. Canonical release now
  requires an exact expected qualification-evidence ref and a request-bound
  reread through the dedicated qualification repository. The stored evidence
  is create-only canonical JSON and binds the candidate, ingest receipt,
  source/checkpoint qualification, image supply-chain release, immutable image,
  service identity, scale-to-zero configuration, private transport, and exact
  route. A missing, changed, cross-route, cross-image, or noncanonical record
  fails closed.
- Each route's qualification evidence requires exactly 30 unique
  attempt/result/request/response/output/cost lineages over one deterministic
  probe fixture, identical mask-set digests, actual CUDA model inference,
  NVDEC, CUDA-resident decoded frames, bfloat16, strict checkpoint loading,
  exact dependency reread, and verified stop-to-zero behavior. It separately
  requires five to thirty complete eight-minute executions with a recomputed
  nearest-rank p95 no greater than eight minutes, exact source geometry/frame
  duration, independent temporal-mask measurements, and direct complete-
  interval private review. L4 must bind and equal or exceed the separately
  approved A100 quality baseline; it cannot reuse the A100 qualification as a
  generic fallback claim.
- The route release now additionally requires a create-only compilation
  authority. That authority rereads the final qualification record and four
  separately digest-bound component records for driver/CUDA, the 30-run
  deterministic set, eight-minute performance, and independent temporal-mask
  quality. It exact-compares every component payload, route, qualification ID,
  and immutable image before its ref can become the substantive GPU
  qualification lineage. Persisting one caller-assembled record full of true
  flags therefore cannot self-certify A100 or L4 release.
- The four component records now have a dedicated private GCS repository.
  Every record uses a kind/ID/content-addressed object path, create-only
  generation, canonical byte comparison, and exact reread. The canonical GCP
  compilation factory joins that repository with the existing final route-
  qualification repository and the compilation-authority store, so an
  in-memory object cannot satisfy the production release path.
- Driver/CUDA component evidence now has a canonical route-specific owner.
  It rereads the immutable SAM 3.1 task, professional GPU launch, admitted
  runtime result, and create-only worker response from their durable stores;
  exact-matches the invocation, request, launch, A100/L4 route, accelerator,
  image digest, scale-to-zero terminal proof, and account-effective attempt
  cost; and derives the driver version and loaded CUDA-library digest only from
  the validated runtime response. It then persists and exactly rereads the
  content-addressed component record. Missing, crossed, caller-promoted, or
  digest-tampered evidence fails closed, and this owner cannot start a GPU job
  or mutate credits, assets, QA, delivery, or production authority.
- The deterministic-run component now also has a restart-safe canonical owner.
  It rereads the source/checkpoint qualification release and exactly thirty
  distinct task, launch, response, admitted-result, private-output, and
  account-effective attempt-cost lineages from durable storage. Every run must
  use the same approved probe fixture, route, accelerator, immutable image, and
  mask-set digest while proving actual CUDA inference, NVDEC, CUDA-resident
  frames, bfloat16, strict checkpoint loading, source geometry/range
  preservation, and terminal scale-to-zero. Missing or duplicate runs,
  cross-route evidence, output drift, caller booleans, or one run replayed
  thirty times fail closed.
- Complete-source performance evidence now has a separate restart-safe
  canonical owner. It accepts only an exact eight-minute source observation,
  rereads every ordered chunk's SAM 3.1 task, GPU launch, worker response,
  admitted result, terminal scale-to-zero state, and account-effective cost,
  and exact-matches them to one complete Track All stitch record. The owner
  rejects missing or duplicate chunks, frame gaps, crossed source or route
  lineage, changed geometry, downscaling, incomplete stitched masks, caller
  timing claims, and post-terminal GPU capacity. Its focused proof covers all
  11,520 frames of a 2160x3840, 24 fps, 480,000 ms source through 48 canonical
  chunks; it does not extrapolate an eight-minute claim from a short sample.
  This is one complete-source run only. Route qualification still requires the
  separate five-to-thirty-run p95 owner and live canonical cloud evidence.
- The five-to-thirty-run p95 gate now also has a canonical owner and separate
  create-only evidence record. It rereads every complete-source performance
  record, requires ordered distinct runs over the same eight-minute source,
  route, immutable image, geometry, frame rate, and chunk plan, and rejects
  crossed execution/result/cost/stitch lineage. The owner recomputes nearest-
  rank p95 and refuses the component when it exceeds 480,000 ms. Only after the
  p95 evidence is persisted and exactly reread does it publish the existing
  `eight_minute_performance` component with the content-addressed p95 record
  ref. A100 and L4 must produce independent evidence sets; neither route may
  reuse the other's measurements or qualification component.
- Independent temporal-mask quality now has its canonical component owner.
  The owner consumes a closed independent full-interval measurement set and a
  separate full-resolution complete-playback review over the exact eight-
  minute source, stitched masks, expected-object coverage manifest, source
  geometry, and every ordered sequence. Representative-frame or sampled-only
  review is forbidden. Coverage jumps, motion-compensated overlap, alpha
  delta, boundary disagreement, empty/full masks, dropouts, identity switches,
  and finding codes must satisfy the fixed measurement profile with zero
  findings before a component can be persisted. For A100 this creates the
  approved baseline. For L4 the owner additionally rereads the exact approved
  A100 runtime qualification and temporal-quality component, derives its
  measurement ref, and requires every L4 sequence metric to equal or improve
  on the A100 baseline. Caller comparison booleans, crossed source/object
  scope, stale reviews, digest mutation, or any L4 regression fail closed.
- Every fresh fixed SAM 3.1 task context now requires an exact, digest-bound
  `track_all` Orchestra call for one complete approved scene interval. The
  binding cross-checks the approved snapshot, output, scene, source artifact,
  selected-scene binding, frame rate/range, work item, lease, funded
  reservation, execution attempt, confirmed frame, MasterTiming, and dispatch
  admission before the task can be persisted or a cloud job can be created.
  Track All remains the tracking/mask artifact owner; Visual Intelligence may
  inspect those artifacts but cannot create, mutate, or directly dispatch SAM
  3.1. This source boundary does not self-qualify a future Track All manifest or
  any live GPU route.
- The legacy production-worker router no longer accepts direct mask,
  background-removal, refinement, preview, or mask-QA metadata on CPU, generic
  GPU, render, or QA workers. Those requests fail closed with the exact Track
  All/Orchestra/SAM 3.1 requirement. Historical M15C planners remain test-only
  compatibility evidence and cannot create fresh dispatch or artifact
  authority.
- The generic tool-capability loader now excludes every historical or non-E2E
  study identity from selectable planner cards and removes non-E2E fallbacks
  from active cards. A stale SAM2, SAM 3.1, or BiRefNet study record therefore
  cannot become planning or dispatch authority; SAM 3.1 can enter work only
  through its qualified Track All/Orchestra release chain.
- This is a source and persistence boundary, not live GPU evidence. The
  repository grants no job dispatch, customer-credit mutation, QA approval,
  delivery, or production authority. A100 and L4 remain blocked until those
  exact independent evidence sets are produced on the immutable image by the
  real cloud routes.
- The guarded operator command is
  `npm run publish:sam3_1-official-artifacts`. It refuses developer-machine
  execution and requires the exact dedicated job identity, an explicit
  one-time confirmation, a pinned terms object generation/ETag/hash/length,
  and a pinned Secret Manager version. It has not been run because the human
  terms/access record and token version do not exist.

## GPU account state

- Billing and required Compute, Batch, Cloud Run, Artifact Registry, Vertex
  AI, Cloud Build, and Secret Manager APIs are enabled.
- The A2 CPU quota request for one `a2-ultragpu-1g` job was approved at 12.
- The A100 80GB quota requests for one GPU in `us-central1`, `us-east4`, and
  `us-east5` were denied; effective A100 quota remains zero in all three
  attempted regions. The approved A2 CPU quota does not substitute for GPU
  quota.
- The project has one L4 of Compute quota. The separately scoped Track All
  task-QA image now has an independently built, scanned, signed, and privately
  qualified L4 path; this does not qualify the checkpoint-bearing SAM 3.1
  heavy image or the L4 heavy fallback route.
- Container Analysis and Container Scanning are now enabled alongside Artifact
  Registry. This closes the API foundation only; the future immutable image
  must still produce a clean digest-bound scan, SBOM, signature, and
  attestation before either GPU route may use it.
- No checkpoint-bearing SAM 3.1 image, model download, customer charge, public
  delivery, or production promotion occurred.

### 2026-08-06 L4 task-QA qualification milestone

- Two independent current-source private build capsules produced the identical
  199,218,494-byte archive SHA-256
  `2bf1d7101ce31dbe0221dc111f6d7324316a050c6a765b06ad53ad5f99fb6e02`
  from different Cloud Build IDs, object generations, and ETags.
- The governed build produced immutable image digest
  `sha256:5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71`.
  Its exact supply chain includes an SPDX 2.3 SBOM, Google Artifact Analysis,
  HSM-backed KMS signature verification, and SLSA v1 provenance. The private
  security review observed zero critical, high, or unknown-severity findings.
- The scale-from-zero Cloud Run job executed one deterministic private
  qualification exactly once, ran 10 Torch CUDA kernels and 32 OpenCV CUDA
  kernels on an NVIDIA L4, reread the complete fixture result, stopped, and
  returned to zero active executions. The canonical receipt is
  `weeditpro-sam31-l4-private-20260806110601287-c9a54c63ec8a42418728`
  with content hash
  `sha256:7a2380e0c68cbd3e26540863abf71da4818f26969947fe174efcc9bcac6306ae`.
- The receipt disposition is intentionally
  `l4_task_qa_qualified_rate_blocked`. It qualifies only deterministic L4
  task QA; it contains no checkpoint or model weights, does not execute SAM
  3.1, and grants no runtime release, customer-credit mutation, QA approval,
  public delivery, or production authority.

### 2026-08-06 A100 source/checkpoint qualification foundation milestone

- The guarded A100 foundation operator completed and exact-reread the live
  `reeditpro` control plane. It created the dedicated
  `weeditpro-sam31-qual-sa` identity, the regional private qualification
  bucket, an HSM-backed 90-day-rotation encryption key, and the pinned
  `weeditpro-sam31-qualification-a100-v1` instance template.
- The template is fixed to `a2-ultragpu-1g` (one NVIDIA A100 80 GB), the
  version-pinned Google Batch Debian image, a 200 GB balanced boot disk,
  Shielded VM controls, OS Login, and the private `us-central1` GPU subnet.
  It has no external-IP access configuration. Batch remains responsible for
  host GPU-driver installation; the worker must still independently qualify
  the observed driver, CUDA libraries, accelerator identity, and exact model
  behavior.
- The qualification identity has only Batch agent reporting, log writing,
  metric writing, qualification-bucket object read/create, and immutable-image
  read access. The canonical API identity alone may attach it and create/read
  qualification evidence. The bucket enforces uniform access, public-access
  prevention, 14-day soft delete, and the exact HSM CMEK.
- A post-provision audit found zero SAM 3.1/A100 Batch jobs and zero matching
  Compute instances. This milestone therefore prepares user-triggered
  scale-from-zero execution but starts no GPU, downloads no source/checkpoint,
  mutates no customer credits, and grants no production authority.
- The live receipt identity is
  `weeditpro-sam31-a100-qualification-foundation-receipt-v1`. Actual A100
  source/checkpoint qualification remains blocked by the official gated
  checkpoint/token and effective A100 80 GB quota.
- The server-side staging and Batch admission bridge is now bound to a fresh
  `canonical-sam3_1-a100-qualification-foundation-observation-v1`. Staging no
  longer accepts service-identity, network, instance-template, or staging
  authority references from its constructor. It derives them only from the
  canonical foundation reread, and Batch admission additionally requires a
  current capacity observation. A denied or zero A100 quota fails before the
  Google Batch transport is called; the present live quota therefore remains
  an honest hard block with zero GPU jobs and zero customer-credit mutation.

The read-only operator command
`npm run audit:visual-intelligence-live-prerequisites` reports A100/L4 quota,
enabled checkpoint-secret version counts (never payloads), the full required
API set including Cloud KMS and Binary Authorization, dedicated builder/signer/
GPU identities, Cloud Build identity-use bindings, exact protected private
buckets including the isolated supply-chain evidence bucket, Artifact Registry
scanning and repository-scoped IAM, the enabled HSM
P-256 signing-key version, legacy visual-runtime absence, and immutable SAM 3.1
image presence. The dedicated signer needs repository-scoped writer—not
reader—because cosign persists digest-bound signatures and attestations as OCI
referrers; it retains no admin/delete or model/runtime authority. A blocked
audit is expected until every external checkpoint, identity, KMS, storage,
image, and A100 gate closes; it does not weaken or self-authorize a build or
runtime. Audit version v12 additionally requires all fifteen frozen CPU-only
processing job definitions to be absent, the bounded private-search service to
retain its exact immutable zero-idle control-plane shape under its dedicated
identity, and all five fixed legacy CPU processing identities to be disabled or
absent. It also exact-rereads the complete A100 qualification foundation:
dedicated identity and least-privilege roles, HSM-CMEK bucket, pinned Batch OS,
private subnet, A100 80 GB instance template, and zero active qualification jobs
or instances. GPU qualification still remains a separate evidence gate.
Version v12 also timestamps each exact live reread so the canonical A100
foundation owner can reject stale observations before staging or dispatch.
The corresponding server repository now publishes that sealed observation in
one immutable five-minute control-plane slot and exact-rereads it before use.
It refuses a changed replay in the same slot, never skips a newer denial to use
an older grant, and exposes no caller-selected cloud resource reference. The
bounded fixed-audit publisher was exercised on 2026-08-06 at 14:30:30Z and
created observation
`sha256:3ab9ee70929586cd4dc1fcf5c874a711f747b035f1f2c94cc50cb69cb8f14b6e`.
That live record reports the resource foundation ready and scale-from-zero
clean while A100 dispatch remains blocked; it started no GPU job, downloaded
no model/checkpoint, changed no customer credits, and granted no production
authority.

The A100 80 GB quota preference was resubmitted on 2026-08-06 with the active
authenticated project account as the contact, one user-triggered scale-from-zero
GPU as the requested limit, and the exact private WeEditPro SAM 3.1
segmentation/tracking qualification use case. Google returned a second denied
decision: preferred value 1, granted value 0, effective regional A100 80 GB
quota 0. The denial is not treated as pending capacity and cannot select L4 as
an unqualified substitute. A fresh canonical foundation observation was
published at 16:24:54Z with content hash
`sha256:2ed5327913bf459e505be6eec84bb633333dbc173299cab613c68ba2fc8058ac`.
It exact-rereads the ready resource foundation and zero active jobs/instances,
but reports `dispatchCapacityReady: false`, `scaleFromZeroClean: true`, no GPU
start, no model/checkpoint download, no customer-credit mutation, and no
production authority.

The gated-access boundary is now source-closed without automating a human
decision. An authenticated human terms intent is joined only by the canonical
server owner with an independently verified official Hugging Face access
observation. The verifier resolves one pinned Secret Manager version, reads the
exact official model metadata revision, performs an authenticated `HEAD` of the
exact checkpoint with redirects blocked, validates only an allowlisted official
artifact redirect plus exact linked size/ETag, and downloads zero checkpoint
bytes. It persists no token, response body, URL, path, or credential in the
result. The finalization bundle and canonical terms record are create-only and
exact-reread; callers cannot provide an `accessGranted` boolean or credential.
The focused owner/verifier evidence passes 38 and 34 checks respectively. No
live terms/access result exists yet because this task browser remains logged
out of the gated repository and both checkpoint secret placeholders still have
zero enabled versions.

The same gated-access boundary now has a source-bound scale-from-zero Cloud Run
Job image. Cloud Build `cd5a38d0-e483-4ddc-911f-c0bafaf39131` built exact
source commit `95a8aebb1f3606b788798900be2bd154ae4496f5` and tree
`ad61842dec884241b2e1b2f67fea9bae7506c17c` into immutable image digest
`sha256:80cc3eda3a2c9517f0cde58bc1e8cb184b95e8a0dd2dc53688f4c4a2d7184a3f`.
Google reports SLSA build level 3, completed NPM/OS/secret analysis, and zero
reported package vulnerabilities. The reviewed deployment operator requires
that exact provenance and scan, one immutable authenticated human-intent
object, and one enabled pinned Secret Manager version. It grants only log
write, control-plane object read/create, and selected-secret access to a
dedicated service account. The job has one task, zero retries, a fifteen-minute
timeout, no GPU, no model-artifact-bucket access, no private GPU-network mount,
and no public IAM. Deployment never executes it. No job is deployed yet because
the canonical human-intent object and enabled checkpoint-token version do not
exist; browser sign-in alone is not treated as either artifact.

The narrow foundation provisioner has now completed in project `reeditpro`.
Cloud KMS and Binary Authorization are enabled; the image-builder, image-signer,
and GPU-worker identities are enabled; all four fixed private buckets enforce
uniform bucket access and public-access prevention; the repository-scoped
build/sign/read bindings are present; and the asymmetric HSM P-256 signing key
has an enabled version with signer-only signing authority. Only empty secret
placeholders exist. No secret version, Meta terms acceptance, checkpoint,
image, GPU job, provider call, customer-credit mutation, or production authority
was created. The exact external gates remain A100 80 GB quota, authorized human
checkpoint access and token insertion, source/checkpoint compatibility, image
build/scan/sign/release, independent A100/L4 qualification, live Gemini
qualification, and account-effective pricing permission.

The narrow idempotent operator source
`scripts/gcp/prod/17-provision-visual-intelligence-sam31-foundation.sh`
closes only that reviewed cloud foundation after an exact explicit confirmation.
It enables Cloud KMS and Binary Authorization; creates only the dedicated image
builder, image signer, and GPU-worker identities; creates only the four protected
SAM 3.1 buckets; creates empty checkpoint-token secret placeholders; creates the
HSM P-256 image-signing key; and applies the reviewed scoped IAM bindings. It
deliberately does not create the legacy CPU/render/QA identities or unrelated
media buckets. It cannot add a secret version, accept Meta terms, download a
checkpoint, submit a build, start a GPU job, mutate customer credits, or grant
production authority. Source qualification and publication precede any live
invocation of this operator boundary.

## Gemini account-effective price authority

- Visual Intelligence price authority is now v2 and distinguishes the exact
  Standard request band at or below 200,000 input tokens from the whole-request
  long-context band above 200,000 input tokens.
- The server-owned reader binds six exact global Standard-throughput Cloud
  Billing SKUs: uncached input, cached input, and output/reasoning for each
  context band. It calls the billing-account-specific Pricing API; public list
  price is never settlement authority.
- A price reader cannot be configured from a caller-supplied evidence ref. It
  requires the complete digest-valid live model/SKU compatibility
  qualification, including isolated standard- and long-context Gemini 3.1 Pro
  requests plus exact provider-usage and detailed-billing-export rereads.
- The publisher writes one canonical JSON authority with a create-only GCS
  precondition, then rereads and binds the exact generation, ETag, byte digest,
  authority digest, model/SKU qualification, and reader configuration. It
  grants no runtime release, provider dispatch, customer pricing, service-fee,
  wallet, credit, public-delivery, or production authority.
- The operator command is
  `npm run publish:visual-intelligence-account-effective-rate`. It requires an
  exact immutable private qualification coordinate and server-only billing
  account resource. Those values never enter a browser or worker payload.
- The current read-only cloud audit reports account-effective Gemini price
  access as not ready. Application Default Credentials are now authenticated
  as the verified WeEditPro operator, but an independent read confirms the
  active operator still lacks `billing.billingAccountPrice.get`. The canonical API
  identity therefore still needs `roles/billing.viewer` from an authorized
  billing-account administrator. No rate object exists and no live model/SKU
  compatibility qualification has been observed. The runtime remains
  fail-closed even though source simulations cover both context bands and
  immutable publication/replay behavior.
- The guarded operator command
  `npm run provision:visual-intelligence-account-price-reader` adds only that
  read-only predefined role to the canonical API identity after exact project,
  project-number, linked-billing-account, service-identity, and confirmation
  checks. It never prints or persists the billing-account coordinate and grants
  no billing mutation, payment, wallet, credit, provider, or production
  authority. The current operator cannot execute it because their billing-
  account IAM policy access is absent.

## Current disposition

The source cutover and the current L4 task-QA image path are deterministic and
fail-closed. The L4 task-QA path has passed immutable image supply-chain review
and live CUDA qualification, but remains rate-blocked. Live checkpoint-bearing
SAM 3.1 installation remains blocked by Meta checkpoint access, the still-open
official source/checkpoint compatibility issue, A100 80GB quota, and independent
heavy-image A100/L4 qualification. Live Gemini and GPU pricing additionally
remain blocked by billing-account price-read IAM and isolated model/SKU
reconciliation.
Legacy visual and CPU processing runtimes are now absent and their five live
identities are retired; the private-search control plane is independently
isolated. The implementation must not weaken or silently bypass the remaining
gates.
