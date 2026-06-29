# Current API Staging Owner Command Handoff - 2026-06-29

Decision: `beta_readiness_api_staging_owner_command_handoff_passed_ready_for_higher_privilege_owner_application`.

This packet refreshes the owner command handoff after the current 16-tool deployed-evidence manifest refresh. The handoff command now resolves the current checkout `HEAD` by default so it does not keep pointing owners at stale source truth after metadata-only beta readiness merges.

```bash
npm run beta:readiness:owner-command-handoff
```

The command prints a deterministic JSON report containing the exact higher-privilege owner command plan and a shell-script template. It is for owner-side application only. Codex and the current deployer identity must not run the generated `gcloud` commands because workflow run `28321557589` proved the deployer cannot self-remediate the remaining IAM/runtime/secret-policy prerequisites.

## Current Source Truth

- Tools branch source SHA at this packet: `9b04cfc513125c50baae859a6154746cf0461cf3`
- CLI source SHA policy: resolve current checkout `HEAD` by default
- Current command packet: `docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-command-packet.md`
- Workflow scope fix PR: `#1441`
- Current guarded owner-remediation run: `28321557589`
- Current blocker decision: `beta_readiness_api_staging_owner_remediation_after_workflow_scope_fix_blocked_by_higher_privilege_owner_permissions`

## Owner Handoff Scope

The handoff keeps these inputs locked:

- Project: `reeditpro`
- Artifact Registry repository: `projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers`
- Deployer service account: `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com`
- Runtime service account: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`
- Service name: `reeditpro-api-staging`

The generated script requires the owner to set `REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV` in their own shell. The repo does not commit fixed secret names or secret values.

## Command Categories

- Grant deployer `roles/artifactregistry.writer` on the exact staging Artifact Registry repository.
- Create or confirm only `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`.
- Grant deployer `roles/iam.serviceAccountUser` on only that runtime service account.
- Grant deployer `roles/secretmanager.viewer` on only owner-supplied fixed staging API secret entries.
- Grant runtime `roles/secretmanager.secretAccessor` on only owner-supplied fixed staging API secret entries.

Blocked alternatives remain: project-wide owner/editor grants, `roles/run.admin` mutation, deployer secret payload access, wildcard secret access, production service-account substitution, Cloud Run deploy before audit passes, Docker build before audit passes, and Artifact Registry push before audit passes.

After owner-side application, rerun the read-only owner prerequisite audit, then rerun exact input discovery, and only then run the guarded staging API deploy workflow.

No Cloud Run deploy, Cloud Run role mutation, Docker build/push, Artifact Registry push, secret value read, tool execution, media processing, Supabase/GCS write, external beta, real-user-media beta, paid production, or production action is enabled by this handoff. Supabase classification remains `no write / environment none / SQL none / migration no`. Product-ready local OSS count remains `0`.
