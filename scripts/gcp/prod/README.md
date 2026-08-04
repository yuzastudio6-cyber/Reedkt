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
  placeholders only. `15-retire-legacy-visual-runtimes.sh` is the sole narrow
  deletion exception: it uses a fixed legacy SAM2/Qwen allowlist, rejects any
  unfinished execution, preserves immutable image digests, and requires a
  second exact retirement confirmation.
- Secret scripts create Secret Manager names only. They do not add secret versions or payloads.

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
10. `.example.sh` Cloud Run service/job templates in later deployment milestones
11. `15-retire-legacy-visual-runtimes.sh` only for the explicitly authorized
    Visual Intelligence cutover
12. `16-audit-visual-intelligence-live-prerequisites.sh` at any later safe
    boundary; it is read-only and never accesses secret payloads or starts a
    workload

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
