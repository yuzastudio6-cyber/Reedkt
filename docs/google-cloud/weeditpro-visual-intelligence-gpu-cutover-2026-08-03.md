# WeEditPro Visual Intelligence and GPU cutover receipt

Date: 2026-08-03

This receipt distinguishes implemented source architecture from live cloud
qualification. It does not call an unavailable candidate “installed” and does
not authorize public or production use.

## 2026-08-14 private/internal finish line versus public capacity

- The current finish line is private/internal WeEditPro end-to-end use, not
  public SaaS concurrency. Private qualification and internal execution require
  one current A100 80 GB route plus at least one independently qualified L4
  route, with at most one attempt on each accelerator at a time. The currently
  observed one A100 and three L4 quota can therefore support sequential
  private qualification without waiting for a 16-GPU fleet.
- Sixteen A100 and sixteen L4 capacity remain explicit future public-release
  targets. Their shortfall must not block private/internal qualification, but
  it continues to block the existing customer/public dispatch authority. No
  private receipt may be cast or relabeled as customer capacity.
- This separation does not weaken quality. Both private routes still require
  their own driver/CUDA evidence, deterministic run set, complete eight-minute
  performance evidence, independent full-interval temporal-quality evidence,
  exact immutable release, current billing-account-effective rate, and
  scale-to-zero lifecycle. CPU-only substantive execution, automatic quality
  reduction, and an unqualified L4 fallback remain forbidden.
- The source boundary now publishes separate private-internal release and
  dispatch-readiness records. The latter wraps the exact funded plan admission
  under a private-only identity and keeps customer/public dispatch, credit
  mutation, QA approval, delivery, and production authority false. The
  original customer admission still rereads the 16-capacity customer-dispatch
  authority unchanged.

## 2026-08-10 Vertex transport and same-region fallback source milestone

This section supersedes the older Batch-primary and cross-region L4 source
statements retained below for audit history. It does not claim that the
successor image or either production route has completed runtime qualification.

- The SAM 3.1 production runner now selects its private mounts from the exact
  server-owned accelerator class. Vertex A100 80 GB uses the platform Cloud
  Storage FUSE roots under `/gcs` for the generation-bound v12 checkpoint and
  create-only invocation objects. The separately qualified Cloud Run L4 route
  retains its controlled `/mnt/reeditpro` mount. A caller cannot provide a
  checkpoint, bucket, object, task root, or output path.
- The account-effective GPU rate-reader configuration advances to v3 and the
  all-route publisher advances to v2. Both the A100 heavy primary and L4 heavy
  fallback are now bound to `us-central1`; the fallback no longer silently
  crosses into `europe-west4`. Historical v2/v1 rate records remain immutable
  readback evidence and cannot authorize the successor runtime.
- The current immutable image digest predates this transport correction. A new
  twice-built, malware-scanned, SBOM-attested, KMS-signed immutable image must
  be published before live A100 or L4 qualification starts. Runtime readiness,
  eight-minute performance, temporal quality, terminal cost settlement, and
  Track All/Visual Intelligence admission therefore remain false.

## 2026-08-10 immutable production-image supply-chain milestone

This section supersedes the older production-image status statements retained
below for audit history. It does not supersede the still-open A100/L4 runtime
qualification and end-to-end admission gates.

- Two independent checkpoint-free production-capsule builds produced the exact
  same SHA-256,
  `83160c1ee505844e04dd72e7859055c52df9b0f2fdb4da5a0fc6c9ab827886c6`,
  and both bounded malware scans reported zero infected files.
- The successor immutable production image is
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:282eb98d9eafebfdd4fbdd72bdce5e8aff11528fb9b56e3f6e9c7ef939954281`.
  The checkpoint remains outside the image and outside developer machines.
- The post-build supply-chain job created and exact-reread an SPDX 2.3 SBOM,
  verified a Cosign KMS signature for the immutable digest, and matched the
  original Cloud Build SLSA-v1 provenance. The independent Artifact Analysis
  snapshot reported zero critical, zero high, 114 medium, seven low, and zero
  unknown-severity findings. The private-GPU security owner approved this
  image for bounded A100/L4 qualification only.
- The create-only supply-chain release is
  `sam31-production-image-supply-chain-release-c583dfbc52140fc57e6f38d5`
  with release SHA-256
  `29070af8d441602a9ca81ee7931206fa5d0506066b6a8dca6b4123df301e4e00`.
  Its SBOM SHA-256 is
  `dce3ada7fe6ebd4a87883528fc5889c0fc67d633d8ef05ebbd1ce72bbd8d90c1`;
  its verified signature receipt SHA-256 is
  `bbc9f317e7a0928a06a8e20be022a6c44e28559ed4f7a2ccc28d1c2ec9d0fbed`;
  and its SLSA-v1 attestation SHA-256 is
  `37451796d48549c6064ca2c67edbd7145ebd8c93fa012f8182fb245d69331ddd`.
- Live quota truth now selects Vertex AI Custom Jobs in `us-central1` as the
  A100 80 GB heavy-primary execution target. The exact Vertex training quota
  is one and is dispatch-ready; direct Compute/Batch A100 quota is zero and
  denied. Historical Batch contracts and records remain readable, but they
  must not authorize new A100 work.
- The fresh billing-account-effective Vertex A100 rate authority is
  `vertex-a100-rate:vertex-a100-us-central1-weeditpro-vertex-a100-rate-publisher-wv2f8`
  with SHA-256
  `49e18950c3dd1b719edaa531ff636f05cdb381eeb5d0ba72ba9c4e6879eba82e`.
  It binds the exact Vertex A100, A2 vCPU/RAM, disk, storage, and operations
  SKU set. Plan fields still cannot self-attest actual usage or charged cost.
- Image publication remains deliberately separate from runtime readiness.
  A100 Vertex task/checkpoint transport, real production segmentation and
  temporal quality, the eight-minute target, independent L4 fallback quality,
  terminal usage/cost settlement, and combined Track All/Visual Intelligence
  end-to-end proof are still required before a runtime release may be called
  ready.

## 2026-08-09 live-state correction

This section supersedes the older source/checkpoint and provider-migration
status statements retained below for audit history.

- The official SAM 3.1 source/checkpoint compatibility probe has now executed
  successfully on a real Vertex AI A100 80 GB worker. The create-only release
  is stored at
  `private/sam3_1/source-checkpoint-qualification/v2/releases/5e96b235feaa2ea29c4d8d0b0c9051a2b456b13ead19b8dc698da280d08bcc10.json`.
  Its release SHA-256 is
  `c1bcdbca2ddc4058d8f29960a9381fb47bd763db1346bba4ff6a443fbb005b36`
  and its qualification SHA-256 is
  `ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9`.
  The probe proved strict checkpoint loading, actual CUDA model execution,
  complete forward propagation, repeatability, no CPU model/decode fallback,
  no quantization or resolution reduction, terminal scale-to-zero, and an
  account-effective attempt-cost reread. It did not process customer media or
  mutate customer credits.
- This compatibility release authorizes only the next private production-image
  build review. It is not a Track All runtime release and does not prove actual
  full-video segmentation/tracking, eight-minute throughput, temporal mask
  quality, an L4 fallback, final task QA, or private end-to-end admission.
- The production capsule, Vertex-qualified image-build binding, v3 cloud image
  authority, and post-build supply-chain owner now consume the exact Vertex
  qualification lineage without casting it to the historical Batch v1 wire.
  The live immutable production image build and its independent supply-chain
  release are still pending.
- The provider-neutral `visual_intelligence` source runtime, Orchestra
  capability manifest, Gemini Pro High adapter, authenticated result stores,
  cost owner, and active Qwen retirement gates are implemented and source-
  green. Remaining Gemini work is live `professional_high` qualification,
  account-effective model-rate publication, usage/billing reconciliation, and
  runtime-release publication—not another source-level Qwen replacement.
- The read-only cloud prerequisites audit is now v20. It rereads the exact
  Vertex compatibility release separately from production-image and full GPU
  runtime releases, so the successful probe can no longer be hidden or
  overstated as end-to-end readiness.
- The current terminal disposition remains fail-closed: production SAM 3.1
  image, A100 Track All runtime, independently qualified L4 fallback, live
  Gemini Pro High runtime, customer credit settlement/refund proof, and the
  combined private WeEditPro end-to-end test are still required.

## 2026-08-07 live-state correction

This section supersedes older point-in-time blocker statements retained later
in this receipt for audit history.

- The human-gated `facebook/sam3.1` access request is approved. The exact
  official source revision and gated `sam3.1_multiplex.pt` checkpoint revision
  were ingested directly into the private WeEditPro model-artifact boundary.
  The canonical ingest receipt is
  `sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12` with digest
  `sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8`.
  No checkpoint or model dependency was installed on, downloaded to, or
  executed on a developer Mac.
- The private checkpoint object is generation-bound, exact-hash reread, and
  non-redistributable. The ingest receipt is image-build-review evidence only;
  it grants no GPU launch, runtime, customer-credit, QA, public-delivery, or
  production authority.
- The offline CUDA 12.8 / PyTorch 2.10 / TorchCodec CUDA / pinned LGPL FFmpeg
  capsule is reproducible and scanned. The current Docker correction removes
  unsupported BuildKit-only inline `RUN --network=none` syntax while retaining
  the canonical whole-build `docker build --network=none` boundary. The prior
  legacy-builder parse failure is durably terminal and cannot be retried as if
  its outcome were unknown; only a distinct successor authority may start the
  corrected build.
- Vertex AI has approved exactly one
  `CustomModelTrainingA10080GBGPUsPerProjectPerRegion` unit in `us-central1`
  under preference `weeditpro-vertex-a100-80gb-us-central1-1`. This supersedes
  the denied raw Compute A100 quota as the heavy-primary route. Capacity alone
  is not a SAM 3.1 runtime release.
- The account-effective Vertex A100 training rate authority exists and binds
  the A100, A2 vCPU, A2 RAM, disk, storage, and operations SKU set. Actual
  attempt settlement still requires terminal usage and billing reread; plan or
  caller-supplied duration cannot become charged usage.
- Gemini 3.1 Pro Preview model discovery is confirmed for the provider-neutral
  Visual Intelligence route. Live `professional_high` request/response,
  privacy, structured-result, quality, usage, billing-export, and runtime-
  release evidence remains required before it may replace the blocked provider
  gate. Preview discovery is not described as GA or production qualification.
- The current disposition remains fail-closed: there is no checkpoint-bearing
  released SAM 3.1 image, no A100 model inference, no independently qualified
  L4 heavy fallback, no qualified Gemini runtime release, no customer-credit
  settlement, and no production readiness claim yet.

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
- The route-specific release publication gap is now closed in source. The
  canonical publication coordinator accepts only exact upstream and component
  refs, rereads the source/checkpoint release, private ingest, immutable image
  supply-chain release, final qualification record, and compilation authority,
  and then persists the specialized/generic release pair create-only. It
  derives the release ID, fixed A100/L4 route shape, qualification time, and
  30-day expiry on the server; callers cannot submit those fields or any
  qualification boolean. The bounded
  `publish:sam3_1-gpu-runtime-release` command exposes only opaque refs and an
  explicit operator confirmation. Publication starts no GPU job, mutates no
  customer credit, and grants no public-delivery or production authority.
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
  record, requires 5–30 ordered distinct runs over the same eight-minute source,
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
- The runtime-qualification evidence chain now has bounded one-writer operator
  entrypoints for every server-owned compilation step. They reread canonical
  GCS evidence and persist content-addressed records; none launches a GPU job,
  mutates customer credits, grants QA approval, or publishes a runtime release:
  `npm run compile:sam3_1-gpu-complete-source-performance`,
  `npm run compile:sam3_1-gpu-performance-p95-qualification`,
  `npm run assemble:sam3_1-gpu-temporal-evidence`,
  `npm run compile:sam3_1-gpu-temporal-measurement`, and
  `npm run compile:sam3_1-gpu-temporal-quality-qualification`. Each command
  accepts only its named `WEEDITPRO_*_REQUEST_JSON` environment variable and
  fails closed on missing, crossed, stale, or non-canonical evidence. The
  temporal-quality command requires the independently persisted full-resolution
  complete-interval private-review ref; it does not create or self-attest that
  review. The final runtime-release publisher remains a separate gate.
- Before publication, `npm run observe:sam3_1-gpu-runtime-release-readiness`
  performs a read-only bounded index of the canonical component-evidence
  prefix. It validates every JSON body, digest, content-addressed object path,
  route, qualification, and immutable-image binding; then reports each of the
  four component kinds as ready, missing, or ambiguous. The release publisher
  is admissible only when exactly one matching component of every kind exists.
  The observer does not launch work, settle credits, or publish a release.
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
  `us-east5` were initially denied; effective A100 quota remains zero in all
  three attempted regions. On 2026-08-06 the same bounded requests were
  resubmitted with the current quota-authorized operator contact and an exact
  one-GPU, zero-idle, private Batch qualification justification. Google denied
  all three again immediately, so effective A100 80GB quota remains zero. The
  approved A2 CPU quota does not substitute for GPU quota, and an alternate-
  region grant would not become dispatch authority until that region had its
  own exact private resource foundation.
- Vertex AI approved exactly one general custom-model-training A100 80GB GPU
  in `us-central1` under quota preference
  `weeditpro-vertex-a100-80gb-us-central1-1`. This is the viable heavy-primary
  capacity path after the bounded Compute A100 requests were denied. It does
  not authorize Vertex's restricted image-training quota and does not by
  itself authorize a live job.
- The additive `canonical-a100-vertex-custom-job-launch-port-v1` boundary now
  compiles an exact one-worker/one-replica `NVIDIA_A100_80GB` Custom Job only
  after create-only durable authority consumption and reread. It pins the
  immutable container, service identity, private VPC peering, CMEK, timeout,
  zero restart, zero automatic retry, and zero persistent endpoint; it rejects
  caller image/command/arguments/model selection. An uncertain create outcome
  blocks retry until reconciliation. The provider-returned Custom Job resource
  name and create-response digest are now create-only persisted and exact-
  reread before a launch may return accepted; persistence uncertainty also
  blocks retry rather than fabricating an execution reference. The companion
  terminal port rereads that canonical execution record, performs an exact
  pinned Vertex GET, distinguishes pending from terminal and unknown outcomes,
  verifies zero active A100 instances after a terminal state, and admits a
  terminal result only after platform usage, billing-account-effective price,
  and attempt-cost evidence are reread and persisted before settlement.
  Every accepted attempt therefore requires terminal usage plus account-
  effective cost evidence while customer-wallet, QA, public-delivery, and
  production authority remain closed. This is a
  source-qualified launch boundary, not an active production mount or live
  SAM 3.1 inference claim. Private-network provisioning, canonical lifecycle
  bridging, account-effective rate authority, checkpoint-bearing image, and
  independent A100/L4 execution evidence remain required.
- The guarded Vertex private-foundation operator completed and exact-reread
  private services access on 2026-08-06. Service Networking is enabled; the
  fixed `weeditpro-gpu-private` VPC has an active
  `servicenetworking-googleapis-com` peering backed only by the reserved
  `10.43.0.0/16` range; the VPC still has no router or Cloud NAT. The existing
  API identity has Vertex Custom Job creation authority and impersonation only
  for the existing SAM 3.1 worker identity, while the Google-managed Vertex
  service agent has encrypt/decrypt access to the existing HSM-backed
  qualification key. The exact receipt is
  `weeditpro-sam31-vertex-a100-private-foundation-receipt-v1`. This
  control-plane step created no Custom Job, checkpoint/image, charge, QA
  approval, delivery, or production authority.
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
- The v22 read-only cloud audit now proves the canonical API identity can read
  all six billing-account-effective Gemini price SKUs through short-lived
  service-account impersonation. Public list price is still not settlement
  authority. Four bounded live execution receipts are observed; the latest
  exact receipt binds successful Standard and greater-than-200k-token Gemini
  3.1 Pro High calls, returned model identity, provider usage metadata, and
  automatic retry disabled.
- The full model/SKU compatibility and rate-publication gate remains
  fail-closed because the `weeditpro_billing_export` dataset does not yet have
  either the detailed usage-cost table or pricing table. The signed-in project
  operator can read payer-account prices but cannot open or configure the
  Cloud Billing export page; an account-level Billing Account Costs Manager or
  Administrator must enable Detailed Usage Cost and Pricing export to the
  existing US dataset. Google documents that initial export propagation can
  take hours. No rate authority may be published until the isolated live usage
  window is reconciled from that exact export.
- The source-bound reconciler is now complete. The guarded operator command
  `npm run reconcile:visual-intelligence-model-billing-sku` rereads the exact
  immutable live Gemini receipt, discovers exactly one Detailed Usage Cost
  export table plus `cloud_pricing_export`, disables query caching, caps each
  BigQuery query at 100 MB billed, and matches the isolated Standard and long
  qualification labels to the exact input/output SKU pairs. It also rereads
  all six SKU metadata rows in canonical order and persists the detailed
  observation, SKU metadata set, reconciliation report, and final model/SKU
  qualification create-only. Missing tables, missing labels, unrelated traffic,
  wrong SKUs, stale export data, or any account/public-price substitution fail
  closed before rate publication.
- The canonical API service identity now has only `roles/bigquery.jobUser` on
  the fixed project and dataset-level `READER` access to the fixed private
  export dataset. The idempotent guarded grant is
  `scripts/gcp/prod/54-grant-visual-intelligence-billing-export-reader.sh`.
  It grants no dataset writes and no authority to enable or configure Cloud
  Billing exports. A live reconciler invocation now reaches the dataset and
  fails at the intended missing-table gate rather than at IAM.
- The guarded operator command
  `npm run provision:visual-intelligence-account-price-reader` adds only that
  read-only predefined role to the canonical API identity after exact project,
  project-number, linked-billing-account, service-identity, and confirmation
  checks. It never prints or persists the billing-account coordinate and grants
  no billing mutation, payment, wallet, credit, provider, or production
  authority. The current operator cannot execute it because their billing-
  account IAM policy access is absent.
- The account-price runtime no longer depends on developer-machine Application
  Default Credentials. A dedicated source-bound Cloud Run Job remains
  permanently unarmed and runs under the canonical backend service identity.
  `npm run run:vertex-a100-rate-publisher-job` resolves the exact project-linked
  billing account at invocation, supplies it only as an execution override,
  performs one account-effective eight-SKU reread, persists the immutable rate
  authority create-only, and returns to zero. Its image contains no billing
  coordinate, model, checkpoint, media tool, GPU runtime, customer ledger, or
  credit mutation path. Build and deployment remain separately gated by
  `build:vertex-a100-rate-publisher-image` and
  `deploy:vertex-a100-rate-publisher-job`.
- This service-identity operator does not bypass billing IAM. Until a billing
  administrator grants the canonical backend identity read-only Billing
  Account Viewer access, execution fails before publication and no A100 job may
  start. Public list price, a stale authority, and another payer account remain
  inadmissible substitutes.
- The distinct all-route GPU publisher uses the same private execution pattern
  for `a100_80gb_heavy_primary`, `l4_heavy_fallback`, and
  `l4_standard_primary`. It must observe the complete payer-account SKU set for
  all three routes before it persists any authority. Build, deploy, and bounded
  execution are exposed only as `build:gpu-rate-publisher-image`,
  `deploy:gpu-rate-publisher-job`, and `run:gpu-rate-publisher-job`. This closes
  the L4 pricing execution path without conflating Vertex training rates with
  Cloud Run/Compute Engine rates or granting either route runtime readiness.
- The source/checkpoint-qualified production image build now has a separate
  scale-from-zero control-plane operator boundary. The permanently unarmed
  `weeditpro-sam31-runtime-image-operator` accepts only one exact persisted
  build-authority ref and, for observation, its exact submission ref. It
  reuses the canonical image-build owner, which rereads the qualification
  release and fixed capsule, Dockerfile, image destination, and build arguments
  before Cloud Build. The operator cannot accept model/checkpoint bytes, media,
  storage coordinates, Dockerfiles, tags, commands, retries, or runtime-release
  claims. Its build, deploy, and execution controls are
  `build:sam3_1-runtime-image-operator-image`,
  `deploy:sam3_1-runtime-image-operator-job`, and
  `run:sam3_1-runtime-image-operator-once`.

## Current disposition

### 2026-08-08 all-route GPU price publisher deployment

- Commit `691061d55` publishes the scale-from-zero account-effective rate
  operator for `a100_80gb_heavy_primary`, `l4_heavy_fallback`, and
  `l4_standard_primary`. Cloud Build
  `adc8c662-19a5-4dc5-ab65-85c7a7930cff` produced immutable image digest
  `sha256:7778e5dee8532b74e328f7abf5092a43ddbf4c0dcb2bb8284a606d8c134261ee`
  from exact tree `1e4c80c0800a30c5dfb34811b5d706f47cc69cce`.
  Artifact Analysis reports SLSA level 3, completed NPM/OS/secret analysis,
  and zero discovered vulnerabilities.
- Cloud Run Job `weeditpro-gpu-rate-publisher` is deployed privately in
  `us-central1` under the canonical API service identity. Its permanent
  configuration contains only `WEEDITPRO_GPU_RATE_OPERATOR_ACTION=disabled`,
  with one task, zero retries, no GPU, no public principal, and zero idle
  instances.
- One bounded execution, `weeditpro-gpu-rate-publisher-mwbl7`, exercised the
  canonical service identity and failed before any route publication with
  `Google Cloud account-effective price reread failed.` No all-route rate
  record exists, no partial A100 or L4 authority was persisted, the job reread
  unarmed after execution, and the running execution count returned to zero.
- This execution started no SAM/Gemini model, GPU, provider, or media runtime
  and mutated no customer credit, wallet, billing account, payment method,
  public-delivery, or production authority. The active operator identity
  cannot read or modify the billing-account IAM policy, so the remaining live
  gate is still the billing administrator's narrow read-only
  `billing.billingAccountPrice.get` grant for the canonical backend identity.

### 2026-08-08 account-effective A100 price publisher deployment

- Commit `e772222cd` publishes the dedicated scale-from-zero Vertex A100
  account-effective rate operator. Cloud Build
  `0af2c057-2774-4b99-9048-4da408a3b71b` produced immutable image digest
  `sha256:eef5362894af6918f17e5f5acb0302bf83c76bcc0b91b054edc2d7e900891a07`
  from exact tree `65b192b540dcaf7ef16e727367816e25423706a9`.
  Artifact Analysis reports SLSA level 3, completed NPM/OS/secret analysis,
  and zero discovered vulnerabilities.
- Cloud Run Job `weeditpro-vertex-a100-rate-publisher` is deployed in
  `us-central1` under the canonical API service identity. Its permanent
  configuration contains only `WEEDITPRO_VERTEX_A100_RATE_OPERATOR_ACTION`
  set to `disabled`, with one task, zero retries, no GPU, no public principal,
  and zero idle instances.
- One bounded execution,
  `weeditpro-vertex-a100-rate-publisher-t6vp4`, exercised the canonical service
  identity and failed before publication with
  `Vertex A100 account-effective price reread failed.` The repository still
  contains only the previously published expired authority; no partial or
  replacement authority was created. The job reread unarmed afterward with
  zero running executions.
- This execution started no SAM/Gemini model, GPU, provider, or media runtime
  and mutated no customer credit, wallet, billing account, payment method,
  public-delivery, or production authority. The remaining live gate is the
  billing administrator's read-only `billing.billingAccountPrice.get` grant
  for the canonical backend identity. The A100 qualification remains
  correctly unlaunched until a fresh authority is published.

### 2026-08-08 restart-safe Vertex A100 qualification runtime milestone

- Commit `552062710` adds the canonical one-writer Vertex Custom Job
  qualification composition for the official SAM 3.1 source/checkpoint
  package. It rereads the immutable request, signed qualification-image
  release, live Vertex A100 80 GB quota preference and regional quota, and the
  current billing-account-effective rate authority before provider creation.
- Worker requests, admissions, single-use consumptions, executions,
  provider-allocation usage, and internal qualification-cost receipts are
  create-only and exact-reread. An identical replay returns the prior
  execution instead of creating a second paid job. A consumed admission with
  an uncertain create outcome blocks automatic retry until canonical
  reconciliation.
- Terminal reconciliation bills from provider create/start/end allocation
  times without inventing worker-phase timing. A failed job that started but
  produced no qualified result retains an `unknown` substantive-work outcome
  while its WeEditPro-absorbed infrastructure cost remains reconcilable.
- The complete provider-neutral Visual Intelligence/GPU source release suite
  now runs 125 green smokes, including the new Vertex request, staging,
  launch, terminal, restart-safe runtime, and cost boundaries. This is source
  qualification only: no live A100 job or Gemini provider call was started,
  no customer credits were mutated, and production remains false.
- The live read-only audit confirms one granted Vertex Custom Training A100
  80 GB quota and one L4 quota with zero active qualification jobs. It also
  confirms the separately qualified L4 normal task-QA job has three completed
  scale-from-zero executions and is idle. That lane does not qualify the SAM
  3.1 heavy L4 fallback.
- Live-prerequisite audit v18 no longer hard-codes the Vertex route as
  unavailable. It fail-closes over ten exact source hashes covering the
  restart-safe runtime, create-only repository, launch port, terminal
  reconciliation, A100 cost authority, focused runtime proof, and bounded
  start/reconcile operator pair. The
  2026-08-08 read reports `routeArchitectureQualified: true`,
  `routeArchitectureSourceBindingCount: 10`, and
  `dispatchCapacityReady: true`; any source drift makes those route claims
  false. This is dispatch-capacity evidence, not authorization to launch a
  paid job.
- The source-bound route now includes a bounded operator pair. The start
  command prepares and starts exactly one qualification attempt only from the
  immutable historical request, signed-image release, and current account-rate
  authority references. The reconcile command accepts only the persisted
  execution reference. Neither command accepts a checkpoint path, image URI,
  GPU class, price, arbitrary command, automatic retry, or customer-credit
  mutation. Both remain fail-closed until the account-effective A100 rate
  authority exists:
  `npm run start:sam3_1-source-checkpoint-qualification-vertex` and
  `npm run reconcile:sam3_1-source-checkpoint-qualification-vertex`.
- The internal qualification cost receipt is now explicitly provisional.
  Vertex create/start/end allocation time, request/result artifact bytes,
  retention, and zero egress remain exact-reread inputs. The runtime no longer
  invents fixed Class A/Class B object-storage operation counts: both counts
  stay zero in the provisional calculation, their cost is deferred to Cloud
  Billing invoice reconciliation, and the receipt cannot claim a final
  invoice-reconciled cost or charge customer credits. This keeps A100
  qualification cost observable without overstating provider usage truth.
- Live A100 admission remains fail-closed because neither available operator
  identity can read billing-account-specific SKU prices. Public list prices
  are not substituted. The L4 heavy fallback also remains unreleased until it
  is compared against an approved live A100 quality baseline.

The Orchestra can now discover Track All through the same provider-neutral
`skill-capability-manifest-v1` boundary used by Visual Intelligence. The Track
All manifest exposes only `track_subject_geometry` at complete-scene scope. It
declares SAM 3.1 on A100 80 GB as the heavy primary, SAM 3.1 on L4 as a
separately qualified quality-preserving fallback, and the L4 Kornia task-QA
route as a required independent route. It also binds account-effective A100/L4
pricing, user-triggered scale-from-zero, exact snapshot/frame/MasterTiming/work/
lease/reservation lineage, and Track All ownership of mask/track artifacts.
SAM2 is an explicit fresh-work conflict and remains historical-read-only. The
source-candidate qualification snapshot is intentionally blocked until exact
A100, L4 fallback, L4 task-QA, artifact-repository, and account-effective rate
releases are reread by the canonical skill qualification registry. A plan or
peer support request cannot self-qualify the skill, directly dispatch a GPU, or
grant billing, QA, public-delivery, or production authority.

The same generic Orchestra boundary now has a private, create-only canonical
skill qualification registry mounted by both the Visual Intelligence and Track
All production composition roots. A record contains the complete validated
manifest and qualification snapshot, exact manifest/snapshot/release refs, a
recomputed record digest, and closed dispatch/provider/billing/public/
production authorities. Records use locale-independent UTF-16 recursive key
ordering, exact persisted-byte hashing, create-only collision refusal, and an
exact reread before publication is acknowledged. The source-video Orchestra
work owner no longer trusts the plan's
`exactQualificationRegistryRereadVerified` boolean: it rereads the exact
manifest/snapshot pair from this server-owned registry and returns no work when
that pair is absent. This registry is a qualification truth boundary, not a
publisher of fabricated readiness; the current Track All and Visual
Intelligence source snapshots remain blocked.

The production composition roots expose only the registry read port; the
create-only publication method is not reachable from ordinary Visual
Intelligence or Track All runtime consumers. The approved Track All task-source
repository now rereads that port both before it creates a source record and
again immediately before materializing the SAM 3.1 launch input. It requires a
qualified `track_subject_geometry` job with the exact A100-primary,
quality-preserving L4-fallback, and independent L4 task-QA routes plus canonical
qualification evidence. A missing, blocked, partial, wrong-definition, or
caller-invented manifest/snapshot pair cannot reach GPU launch preparation.

The canonical Track All qualification publisher now closes the publication
side of that boundary. It cannot accept a manifest, qualification disposition,
route list, rate, repository version, or readiness boolean from a caller. It
must exact-reread the current A100 SAM 3.1 release, the independently qualified
L4 SAM 3.1 fallback release, the L4 Kornia task-QA image and deployment, all
three billing-account-effective A100/L4 rate authorities, and a bounded
create-only Track All result/artifact repository release. Only that complete
set may produce a qualified snapshot and persist it through the canonical skill
qualification registry. The repository release separately binds the exact task
context, task, runtime result, task-QA, Caption scene-evidence, and Caption
Track-All evidence repository versions plus isolated control-plane and mask
artifact storage qualification. Missing, crossed, stale, unknown-field, or
post-digest-tampered evidence fails closed. Publication starts no GPU job,
executes no model/provider, mutates no customer credits, grants no QA approval,
and grants no public-delivery or production authority.

The bounded publication operator is
`npm run publish:track-all-sam3_1-orchestra-qualification`. It accepts only
server-owned evidence coordinates in the closed
`id|version|sha256:<64-lowercase-hex>` form through the
`WEEDITPRO_TRACK_ALL_*_REF` environment variables. The operator rereads those
coordinates from the canonical private GCS repositories, recomputes the
qualified Track All manifest/snapshot pair, persists it create-only, and
returns the exact persisted receipt. It does not accept route definitions,
qualification booleans, rates, repository versions, or readiness claims from
the invoking shell. The operator must therefore remain unavailable until the
A100 primary release, independent L4 fallback release, L4 task-QA release, all
three account-effective rate authorities, and the Track All artifact-repository
release have each been published by their own qualified owner.

On 2026-08-06 the bounded private-storage qualifier ran against the existing
control-plane and mask-artifact buckets. Both live probes observed uniform
bucket-level access, enforced public-access prevention, zero public IAM
principals, create-only first write, identical replay, conflicting replay
refusal, exact read-after-write, detached second reread, and unrelated-prefix
isolation. The persisted control-plane qualification ref is
`track-all-sam3_1-control_plane_state-06c127f0-e221-49df-8c16-a2003a7f8fa9`
version 1 with content hash
`sha256:8f2533da6e3adaa3402169595b37dbe79a935afdd36449ccd2df262a4876842d`.
The persisted private-mask qualification ref is
`track-all-sam3_1-private_mask_artifacts-06c127f0-e221-49df-8c16-a2003a7f8fa9`
version 1 with content hash
`sha256:25b208541d2b72171d3829f06cd67ce7345f1ff78eeaadcd119e311440abcd97`.
Both expire on 2026-08-13 and grant no GPU, provider, model, customer-credit,
QA-approval, public-delivery, or production authority. They qualify the storage
semantics only; they do not substitute for the six repository-specific
canonical-chain qualifications still required by the artifact-repository
release owner.

The six-repository release owner is now mounted behind
`npm run publish:track-all-sam3_1-artifact-repository-release`. It accepts only
an exact Caption/Track-All support-request ref and the two current storage-
qualification refs. It then rereads and identical-replays one complete
canonical task-context → task → runtime-result → L4 task-QA/private-review →
Caption scene-evidence → authenticated Caption Track-All evidence chain through
the same repositories used by the production composition root. It derives the
six component qualification refs from those exact persisted records, rejects
crossed/stale/partial/tampered lineage, and publishes the bounded release
create-only. The operator cannot self-assert repository versions, readiness,
storage security, or completion. It remains intentionally unexecutable until a
real qualified SAM 3.1 Track All result completes that full canonical chain.

The source cutover and the current L4 task-QA image path are deterministic and
fail-closed. The official private SAM 3.1 source and checkpoint have been
ingested, the production image has passed its signed supply-chain release, and
the A100 80 GB primary has passed its thirty-run qualification. The successor
L4 cross-accelerator set has also completed all 30 deterministic executions
from one immutable image, and all 30 account-effective terminal-cost receipts
exist. Its immutable driver/CUDA and deterministic-run components have now
been compiled and exact-reread. Independent complete-source temporal quality
and complete eight-minute performance remain open; the L4 route is therefore
not yet called a qualified fallback. Gemini 3.1 Pro High Standard and
greater-than-200k-token live requests have executed successfully and all six
account-effective price API reads pass. The remaining model/SKU qualification
gate is the missing Detailed Usage Cost and Pricing export tables needed for
the now-implemented exact reconciliation; public list prices are not accepted
as settlement authority.

The account-effective GPU rate reader is versioned and currently binds A100
heavy primary, L4 normal primary, and independently qualified SAM 3.1 L4 heavy
fallback to the existing `us-central1` runtime foundation. Cloud Run L4 GPU,
Jobs CPU, Jobs memory, and regional storage SKU identities remain distinct;
the publisher observes all three routes under one exact billing-account scope
before any create-only rate authority is persisted. The L4 deployment and
qualification owners use that same fixed `us-central1` coordinate. A future
regional move requires new versioned route/rate/qualification evidence; it
cannot relabel this release. This source alignment does not substitute public
list prices for account-effective prices and starts no paid GPU job; live
publication still requires the authenticated billing-account price reread.

Legacy visual and CPU processing runtimes are now absent and their five live
identities are retired; the private-search control plane is independently
isolated. The implementation must not weaken or silently bypass the remaining
gates.

## 2026-08-12 L4 qualification-set restart correction

- The first L4 cross-accelerator qualification set stopped at execution 16.
  Executions 1 through 15 completed, but execution resource
  `reeditpro-sam31-l4-fallback-xbj7s` failed closed during session start with
  `nvdec_utilization_not_observed`. TorchCodec had loaded all 200 source frames
  on CUDA, but the asynchronously started NVML decoder sampler observed only
  zero-percent samples during the sub-second decode window.
- That partial set is diagnostic only. None of its 15 successful executions
  may be combined with a successor set or counted toward a release. The next
  L4 qualification must use a distinct qualification ID, a newly qualified
  immutable image, and executions 1 through 30 from that one image.
- The source correction now blocks decode until the NVML sampler has
  initialized against the exact accelerator handle and retains a bounded
  two-second post-decode observation window for the provider-controlled NVML
  sampling period. It still requires positive NVDEC utilization, CUDA-resident
  decoded frames, the pinned TorchCodec GPU backend, and the existing no-CPU-
  fallback guard. It does not replay decode, reduce input quality, or accept a
  caller assertion.
- The terminal-cost owner derives each qualification attempt from the exact
  Cloud Run operation/execution terminal reread, the exact worker run receipt,
  and the current billing-account-effective L4 rate. It records the full
  create-to-completion billable window, fixed allocation, bounded private
  storage operations, account-effective infrastructure cost, required invoice
  reconciliation, and zero customer credits for platform-funded
  qualification. It grants no runtime, QA, billing-ledger, public-delivery, or
  production authority.

## 2026-08-14 private complete-source execution boundary

The current private/internal milestone does not require the future public
16-A100 plus 16-L4 concurrency target. It admits at most one A100 attempt and
one independently qualified L4 attempt, requires all chunks and both route
runs to execute sequentially, and requires capacity to return to zero before
the other route may begin. The 16/16 target remains an explicit later public
release gate and grants no current customer dispatch authority.

The private complete-source execution-plan owner now rereads the exact
eight-minute 3840x2160, 11,520-frame source plan, all 49 GPU-prepared chunks,
the terminal source-preparation/cost/scale-zero record, and the current private
SAM 3.1 dispatch readiness. It binds one exact runtime release, immutable
image, and billing-account-effective rate for the selected A100 or L4 route,
then creates a durable byte-free task-materialization plan with one unique
private invocation and transport lineage per chunk. It accepts neither public
capacity claims nor caller-selected prices, images, chunk geometry, or storage
coordinates. At this stage it starts no GPU work and claims neither complete
source performance nor independent temporal quality; those remain the next
two mandatory private qualification artifacts before Track All/SAM 3.1 can be
called internally ready end to end.

The private complete-source task-materialization owner now consumes that plan
one chunk at a time through server-owned read ports. It rereads the exact
private funded admission, current dispatch readiness, route release, current
account-effective rate, Track All Orchestra binding, approved frame/timing,
specialized runtime release, prepared input, and create-only fixed task. Chunk
one may materialize directly; every later chunk is refused until the previous
chunk's exact task/result/output/cost terminal and scale-back-to-zero evidence
has been reread. An identical restart is accepted only when the persisted task
and materialization bytes are unchanged. Materialization starts no cloud job,
does not spend customer credits, and cannot create customer/public prelaunch
records. The public 16/16 concurrency target remains recorded only as a future
release gate.

### 2026-08-14 live deterministic route evidence

- The A100 80 GB primary qualification
  `sam31-a100-serving-memory-safe-thirty-run-release-candidate-20260812-v1`
  contains 30 deterministic and 30 measured runs. Its nearest-rank p95 is
  93,546 ms against the fixed 480,000 ms ceiling, with exact task, response,
  output, manifest, and mask reread. It remains a private qualification input,
  not a runtime or customer-dispatch release.
- The L4 successor qualification
  `sam31-l4-runtime-cross-accelerator-thirty-run-set-20260812-v5-nvdec-grace`
  contains 30 exact runs from the single successor image. Its nearest-rank p95
  is 157,351 ms against the same 480,000 ms ceiling. All 30 terminal
  account-effective attempt-cost receipts exist and every run returned to
  scale zero.
- The canonical L4 driver/CUDA component is
  `sam31-l4-driver-cuda-20260812-v5-nvdec-grace` with SHA-256
  `62615b14e51197d223c96c091a977ae8dd51283984dffdebb185aef148ac61ec`.
  The canonical deterministic-run component is
  `sam31-l4-deterministic-thirty-run-20260812-v5-nvdec-grace` with SHA-256
  `e942c66cacde9c724640b00c86ee0ce479ac701a10d396ff5e3abd414d556259`.
  Both were derived by exact reread of the existing private cloud records; no
  new GPU job ran and no customer credit was mutated during compilation.
- These short deterministic route tests do not substitute for the required
  full eight-minute source execution or independent full-interval temporal
  quality. Those two route-specific artifacts remain the private finish line.
