# WeEditPro Production GCP Foundation Scripts

These scripts are operator-run templates for Milestone 3. An agent may run a
cloud-mutating script only when the owner explicitly authorizes that exact
operation and the script's independent confirmations pass. Npm scripts must
not call cloud-mutating scripts.

## Safety

- Copy `.env.gcp.production.example` to a local, ignored env file and fill project values.
- Mutating scripts require `REEDITPRO_CONFIRM_PROD_SETUP=true`.
- Scripts print the project, region, Artifact Registry region, bucket location, environment, repository, and image tag before doing cloud-mutating work.
- Foundation scripts avoid deletes, avoid owner/editor roles, and create
  placeholders only. The two narrow deletion exceptions are
  `15-retire-legacy-visual-runtimes.sh` for SAM2/Qwen and
  `19-retire-legacy-cpu-media-runtimes.sh` for the frozen CPU-only processing
  job definitions. Both use fixed allowlists, reject unfinished executions,
  preserve immutable image digests, and require a second exact retirement
  confirmation. Script 19 additionally exact-matches each job image, service
  identity, CPU/memory envelope, and absence of a GPU before deletion; a
  changed or GPU-enabled job fails closed.
- Foundation secret scripts create Secret Manager names only. The sole payload
  exception is the separately confirmed
  `28-add-sam31-hugging-face-token-version.sh` operator: after an authorized
  human has accepted the official gated repository terms and created a
  read-only Hugging Face token, it reads that token without echo and streams it
  directly to the existing `HUGGINGFACE_TOKEN` Secret Manager container. It
  never writes the token to a local file, prints it, downloads model bytes, or
  starts a cloud workload.

## Human Execution Order

1. `00-print-config.sh`
2. `01-enable-apis.sh`
3. `02-create-artifact-registry.sh`
4. `02-create-image-signing-key.sh`
5. `03-create-gcs-buckets.sh`
6. `04-create-service-accounts.sh`
7. `05-create-secret-placeholders.sh`
8. `06-configure-iam.sh`
9. `07-build-image-commands.sh` in a later image milestone
10. `10-deploy-gpu-worker-job.example.sh` may define the three zero-idle L4
    jobs only from exact immutable image digests and a second exact
    confirmation: standard visual/media work, separately qualified SAM 3.1
    fallback, and deterministic Track All mask QA. Definition creation grants
    no execution authority.
11. `15-retire-legacy-visual-runtimes.sh` only for the explicitly authorized
    Visual Intelligence cutover
12. `16-audit-visual-intelligence-live-prerequisites.sh` at any later safe
    boundary; it is read-only and never accesses secret payloads or starts a
    workload
13. `19-retire-legacy-cpu-media-runtimes.sh` only after the GPU-first source
    authority is frozen and the exact CPU-only job allowlist is independently
    observed with no unfinished execution
14. `20-isolate-private-search-and-disable-legacy-cpu-identities.sh` only after
    the CPU job retirement. It moves the bounded private-search control plane
    onto its dedicated zero-idle identity, verifies Cloud Run, Batch, and active
    build detachment, then disables—not deletes—the five fixed historical CPU
    processing identities.
15. `22-provision-sam31-a100-qualification-foundation.sh` only for the exact
    private SAM 3.1 qualification foundation. It creates no VM or Batch job;
    the canonical staging and launch owners must still reread the exact
    foundation and current A100 capacity before any private qualification.
16. `28-add-sam31-hugging-face-token-version.sh` only after the authorized
    organization representative has personally signed in to the official
    `facebook/sam3.1` gated repository, reviewed and accepted its terms, and
    created a minimum-scope read token. The operator must run in a trusted
    interactive terminal. It creates one numeric Secret Manager version and
    no local checkpoint, model installation, image, GPU job, or production
    authority.
17. `53-build-sam31-production-capsule-twice.sh` submits the two independent,
    deterministic, checkpoint-free production capsule builds only after the
    final source/checkpoint qualification release. After both build records
    exist, `npm run publish:sam3_1-production-image-from-builds` sequences the
    existing capsule and image-authority one-writer publishers and returns only
    an opaque authority for `52-run-sam31-runtime-image-operator-once.sh`.
    Publication cannot start the image build, a GPU/model job, a credit
    mutation, or a runtime/production release.

The historical CPU/render/QA/tool-readiness deployment scripts and the manual
GPU-smoke execution script fail closed. Fresh execution must enter through the
canonical qualification or funded GPU attempt owner so immutable release,
approved user trigger, account-effective price, reservation, idempotency,
terminal usage, refund/release, and scale-down evidence cannot be bypassed.
The active foundation creates and grants only API, image-builder,
image-signer, and shared A100/L4 GPU-worker identities. Retired identity names
remain type-level readback coordinates and are not foundation inputs.

The private SearXNG service is a lightweight search/control-plane exception,
not a media or model worker. It may use one CPU with zero idle instances only
under `reeditpro-private-search-sa`; all substantive decode, analysis,
segmentation, rendering, encoding, and model inference routes remain A100/L4
GPU-only.

The image signer is intentionally separate from the image builder. It receives
only repository-scoped Artifact Registry writer access because cosign stores a
signature and attestation as OCI referrers in that repository, plus
`cloudkms.signerVerifier` on the single signing key and create-only access to
the private image-supply-chain evidence bucket. It receives no evidence read,
repository admin, delete, checkpoint-bucket, control-plane, provider, GPU,
billing, or customer authority. Cloud Build may impersonate both dedicated
build identities only through their own service-account bindings. The API may
create and exact-reread checkpoint-free build capsules and exact-reread the
private SBOM/signature evidence, while the GPU worker may read the private
checkpoint bucket and pull the released image; neither receives the other's
build, signing, evidence-write, or control-plane authority.

The read-only prerequisite audit is fail-closed across the complete image
foundation: required APIs (including Cloud KMS and Binary Authorization), A100
80 GB and L4 quotas, checkpoint-secret version presence, dedicated build/signer/
GPU identities, Cloud Build identity use, the four exact private buckets and
their access protections, Docker repository scanning and scoped IAM, the HSM
P-256 signing-key primary version, legacy-runtime absence, immutable image
presence, and billing-account price-read readiness. It never converts resource
existence into a source, image, GPU-runtime, credit, or production release.

Milestone 3 does not deploy Cloud Run, build images, run media tools, call providers, create real secret values, or process customer media.

## API canary boundary

The API deployment template is a private canary, not a browser-ready public
release. It keeps Cloud Run IAM enabled, restricts ingress, pins all Secret
Manager environment references to reviewed numeric versions, disables worker
execution, and keeps GCS disabled until bucket IAM and signed-storage evidence
exist. A direct browser cannot use a Supabase bearer token as Cloud Run IAM
credentials; public frontend ingress requires a separately reviewed gateway or
load-balancer design.

Only the API image has a verified Cloud Build command. Worker image commands
remain omitted until each worker has a dedicated entrypoint and container
smoke; the API artifact must never be relabeled as a worker image.
