# Deployed Evidence Input Manifest - d997 Owner Approval Gap

Decision: `beta_deployed_evidence_input_manifest_blocked_only_by_owner_approvals_and_attestations`

The deployed evidence input manifest was run with the current `d997d567d40853f59741763c8e9ca8b2c361148a` staging API/source metadata and local accepted tool bundle inputs present, while owner approvals and evidence notes were intentionally omitted. The manifest stayed fail-closed, as intended.

Result:

- `readyToRunExternalBetaEvidenceCollector`: `false`
- Pending required inputs: `29`
- Value gaps: `0`
- Secret-like input paths: `0`
- Locally accepted tool count: `14`
- Product-ready local OSS count required by the manifest: `14`

## Technical Inputs Present

- API base URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`
- Deployed evidence source SHA: `d997d567d40853f59741763c8e9ca8b2c361148a`
- External source SHA: `d997d567d40853f59741763c8e9ca8b2c361148a`
- Core tool IDs: `ffmpeg`, `ffprobe`, `pyav`, `opentimelineio`, `hyperframe`, `remotion`, `sharp`, `duckdb`, `polars`, `pyscenedetect`, `opencv`, `opencolorio`, `openimageio`
- Libass image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001`
- Idempotency keys: present as non-secret test values
- Bearer token: presence-only dummy value; no token value was recorded

## Pending Owner Inputs

Platform evidence packet:

- `REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY`
- `REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT`
- `REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY`
- `REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE`
- `REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL`
- `REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING`
- `REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT`
- `REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED`
- `REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE`
- `REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED`
- `REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE`
- `REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED`
- `REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE`
- `REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED`
- `REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE`

Launch approval packet:

- `REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT`
- `REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY`
- `REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE`
- `REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES`
- `REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL`
- `REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING`
- `REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT`
- `REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE`
- `REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE`
- `REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE`
- `REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE`
- `REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE`
- `REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE`
- `REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE`

## Boundary

This classification did not call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.

Next safe action: collect the non-secret owner approval notes named by `docs/beta-readiness/owner-approval-packet-current-gates/2026-06-28-owner-approval-packet-current-gates.md`, validate them with `npm run beta:readiness:owner-approval-intake-preflight`, then rerun `npm run beta:readiness:deployed-evidence-input-manifest`.
