# API Staging Owner Remediation Partial Results Blocker - 2026-06-28

Decision: `beta_readiness_api_staging_owner_remediation_blocked_by_owner_privilege_required`

PR #1386 updated the guarded owner-remediation workflow so the workflow attempts each independent IAM/service-account prerequisite and still fails closed unless all prerequisites and exact verification pass. PR #1388 sanitized the exact verification failure output.

The updated workflow was dispatched once after those changes:

- Run: `28310853041`
- URL: `https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28310853041`
- Workflow head: `8a6c5764dabb8a048483895bd29eba265a53b3b7`
- Result: failed closed in `Verify exact staging API owner remediation inputs`

## Full Prerequisite Results

| prerequisite | result | required owner-side action |
| --- | --- | --- |
| Artifact Registry writer binding | blocked by missing `artifactregistry.repositories.getIamPolicy` on `projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers` | Repository IAM admin or higher-privilege owner grants the deployer `roles/artifactregistry.writer` on the exact staging repository. |
| Runtime service account creation | blocked by missing `iam.serviceAccounts.create` on `projects/reeditpro` | Project IAM admin or higher-privilege owner creates `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com` or selects an approved existing runtime account. |
| Deployer act-as runtime binding | blocked because the runtime service account is `NOT_FOUND` | After the runtime account exists, grant the deployer `roles/iam.serviceAccountUser` on that account. |
| Cloud Run deploy authority | blocked by missing project IAM policy access | Project IAM admin or higher-privilege owner grants the approved Cloud Run deploy role. |
| Runtime secret access bindings | blocked by missing `secretmanager.secrets.getIamPolicy` on fixed staging API secret entries | Secret admin or higher-privilege owner grants the staging runtime service account secret accessor on only the fixed staging API secret entries. |

Exact verification also remains blocked:

- Artifact Registry repository describe fails on `artifactregistry.repositories.get`.
- Runtime service account describe fails because `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com` is not found.

## Boundary

This is not a blanket blocker. It blocks only staging API deploy and deployed evidence collection until a higher-privilege owner applies the exact staging IAM/runtime prerequisites and the read-only exact input validation workflow passes.

No Cloud Run deploy, Docker build, Artifact Registry push, tool execution, media processing, Supabase/GCS write, external beta, or paid production action completed.

Supabase classification remains `no write / environment none / SQL none / migration no`.

Product-ready local OSS count remains `0`.
