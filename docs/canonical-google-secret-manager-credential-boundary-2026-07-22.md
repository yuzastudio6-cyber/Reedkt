# Canonical Google Secret Manager credential boundary

Date: 2026-07-22
Status: source-verified policy and Qwen resolver hardening only
Production status: `productionReady=false`

## Accepted authority

ReEditPro production server and worker credentials have one canonical source:
Google Secret Manager. Configuration must provide the full resource name with
an explicit positive numeric version:

`projects/<project>/secrets/<secret>/versions/<positive-number>`

`latest`, a short secret name, a name-only Secret Manager resource, version
zero, browser input, request headers, request bodies, query parameters, job
payloads, database rows, direct environment values, and GitHub Secrets cannot
qualify production credential authority.

This boundary applies to Supabase service-role keys, provider/model keys,
internal service tokens, webhook/signing credentials, private signing keys,
and equivalent server secrets. It parses configuration metadata only. No secret
value was read by this change.

## Google identity

Google Cloud services and workers must authenticate with Application Default
Credentials backed by a least-privilege service identity and Workload
Identity. Stored service-account JSON keys are rejected. A browser or queued
job cannot select a credential reference, Google principal, provider route, or
secret version.

The SQL role named `service_role` is a database authorization concept. Grants
or revokes involving that role do not store, deliver, or qualify the Supabase
service-role key. The key remains a server-only Secret Manager credential.

## Safe diagnostics

Public, CLI, log, and evidence projections may expose only a bounded status,
authority classification, a constant `[REDACTED_SECRET_ID]` label, and the
configured numeric version when useful. They do not expose:

- the secret value;
- whether or how many characters the value contains;
- a hash or fingerprint of the value;
- the full Secret Manager resource, project, or secret ID;
- raw provider, SDK, or authorization errors.

The Qwen resolver no longer expands any reference to `versions/latest` and no
longer calculates a value fingerprint. Direct-env Qwen credentials require an
explicit local/internal compatibility flag, are rejected by production-like
or Cloud Run modes, and always remain non-promotable.

## Legacy GitHub and operator paths

The following existing workflows still inject credential payloads from
GitHub Secrets and are explicitly classified
`legacy_github_secret_payload_noncanonical`. They cannot satisfy production
qualification and require later migration or retirement:

- `.github/workflows/internal-tester-browser-password-bootstrap.yml`
- `.github/workflows/internal-tester-profile-workspace-provisioning.yml`
- `.github/workflows/internal-tester-sign-in-auth-readback.yml`
- `.github/workflows/qwen-beta-config-probe.yml`
- `.github/workflows/qwen-live-beta-verification.yml`
- `.github/workflows/staging-media-analysis-canary.yml`
- `.github/workflows/staging-persisted-render-job-validation.yml`
- `.github/workflows/staging-real-video-upload-preview-canary.yml`
- `.github/workflows/staging-render-infrastructure-canary.yml`
- `.github/workflows/staging-sandbox-render-execution-canary.yml`
- `.github/workflows/staging-supabase-readonly-validation.yml`
- `.github/workflows/staging-supabase-write-smoke-validation.yml`
- `.github/workflows/staging-timeline-composition-canary.yml`

The Workload Identity provider and service-account email are identity metadata,
not credential payloads. Existing workflows that store those identifiers in
GitHub Secrets or mixed Secrets/vars are transitional and must be reconciled
to reviewed non-secret configuration; they do not replace Workload Identity.

The operator scripts below discover a latest enabled version and access a
payload. They are classified `legacy_latest_payload_probe_noncanonical`, were
not run, and cannot qualify production evidence:

- `scripts/gcp/verify-provider-secrets.safe.sh`
- `scripts/gcp/verify-openai-key.safe.sh`

The existing staging API deployment contract pins Secret Manager versions
when binding Cloud Run environment variables. It remains useful transitional
deployment evidence, but an injected plaintext environment value is not the
future canonical runtime resolver authority defined here.

`server/config/env.ts` still reads the injected Supabase service-role key and
internal service token as raw environment values, and
`.github/workflows/beta-readiness-api-staging-deploy.yml` currently creates
those deploy-time bindings. Both paths are explicitly classified
`legacy_deploy_time_secret_env_binding_noncanonical`; neither can satisfy the
new production credential gate until the reviewed runtime resolver replaces
that authority.

## Remaining external gates

Source hardening does not prove a live credential boundary. Production remains
blocked until all of the following are independently reviewed on the exact
release SHA:

1. Every required secret exists with an explicitly approved enabled version.
2. Runtime and worker service identities have least-privilege access only to
   the required pinned versions; humans and unrelated services do not.
3. Workload Identity/IAM bindings and Cloud Run service/job identities are
   verified without service-account JSON keys.
4. A reviewed server/worker resolver consumes only the pinned reference
   contract and preserves in-memory, unlogged value handling.
5. Supabase, Kimi, Qwen, DeepSeek, Qwen2.5-VL, media, webhook, and signing
   adapters are individually qualified through that one resolver boundary.
6. Legacy GitHub credential-payload workflows and latest-version operator
   probes are migrated, disabled, or explicitly retired.
7. Staging proves same-SHA startup, rotation, rollback, access denial,
   redaction, and replica/worker behavior without exposing a value, length,
   fingerprint, full resource path, or provider response.

No Secret Manager payload access, `gcloud` command, provider call, remote
Supabase mutation, cloud mutation, deployment, billing action, or push was
authorized or performed by this slice.
