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
- The A100 80GB quota request for one GPU was resubmitted with the exact
  scale-from-zero workload justification and denied again; effective quota is
  zero.
- The project has L4 Compute quota, but neither SAM 3.1 route is admitted until
  the same immutable image independently passes A100 and L4 qualification.
- Container Analysis and Container Scanning are now enabled alongside Artifact
  Registry. This closes the API foundation only; the future immutable image
  must still produce a clean digest-bound scan, SBOM, signature, and
  attestation before either GPU route may use it.
- No SAM 3.1 image, GPU job, provider call, model download, customer charge, or
  production promotion occurred.

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
runtime.

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
  access as not ready for the active credential. No rate object exists and no
  live model/SKU compatibility qualification has been observed. The runtime
  therefore remains fail-closed even though source simulations cover both
  context bands and immutable publication/replay behavior.

## Current disposition

The source cutover is deterministic and fail-closed. Live SAM 3.1 installation
remains blocked by Meta checkpoint access, the still-open official
source/checkpoint compatibility issue, A100 80GB quota, and the required
image/security/runtime qualification. Live Gemini pricing additionally remains
blocked by billing-account price-read IAM and isolated model/SKU reconciliation.
The implementation must not weaken or silently bypass those gates.
