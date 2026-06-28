# Beta Readiness API Staging Owner Remediation Command Packet

Decision: `beta_readiness_api_staging_owner_remediation_command_packet_passed_ready_for_higher_privilege_owner_application`.

This packet converts read-only audit run `28312122163` into a minimal owner-side command checklist. It does not run IAM mutation, Cloud Run deploy, Docker build/push, tool execution, evidence collectors, Supabase/GCS writes, external beta, or production.

The latest audit already proved Cloud Run deploy permissions for `run.services.get`, `run.services.create`, `run.services.update`, and `run.operations.get`. Do not add a new Cloud Run project role from this packet unless a later audit contradicts that proof.

Remaining higher-privilege owner actions:

1. Grant Artifact Registry writer on the exact staging repository:

   ```bash
   gcloud artifacts repositories add-iam-policy-binding reeditpro-staging-workers \
     --project=reeditpro \
     --location=us-central1 \
     --member=serviceAccount:sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com \
     --role=roles/artifactregistry.writer
   ```

2. Create or confirm the exact staging API runtime service account:

   ```bash
   gcloud iam service-accounts create reeditpro-api-staging \
     --project=reeditpro \
     --display-name='ReEditPro API staging runtime'
   ```

   If it already exists, do not recreate it; verify it with:

   ```bash
   gcloud iam service-accounts describe reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
     --project=reeditpro
   ```

3. Grant deployer act-as-runtime on that runtime account:

   ```bash
   gcloud iam service-accounts add-iam-policy-binding reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
     --project=reeditpro \
     --member=serviceAccount:sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com \
     --role=roles/iam.serviceAccountUser
   ```

4. Grant deployer metadata-only describe access on only the fixed staging API Secret Manager entries:

   ```bash
   for secret in <fixed-staging-api-secret-name-1> <fixed-staging-api-secret-name-2> <fixed-staging-api-secret-name-3> <fixed-staging-api-secret-name-4>; do
     gcloud secrets add-iam-policy-binding "$secret" \
       --project=reeditpro \
       --member=serviceAccount:sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com \
       --role=roles/secretmanager.viewer
   done
   ```

5. Grant the runtime service account payload access on only the fixed staging API Secret Manager entries:

   ```bash
   for secret in <fixed-staging-api-secret-name-1> <fixed-staging-api-secret-name-2> <fixed-staging-api-secret-name-3> <fixed-staging-api-secret-name-4>; do
     gcloud secrets add-iam-policy-binding "$secret" \
       --project=reeditpro \
       --member=serviceAccount:reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
       --role=roles/secretmanager.secretAccessor
   done
   ```

Do not grant project-wide owner/editor, do not grant secret payload access to the deployer, do not substitute a production service account, and do not use broad wildcard secret access.

After owner-side remediation, rerun `.github/workflows/beta-readiness-api-staging-owner-prerequisite-audit.yml` with `AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES`. Only after that audit passes should exact input discovery and the guarded staging deploy workflow run.

Supabase classification remains `no write / environment none / SQL none / migration no`. Product-ready local OSS count remains `0`. This packet is not a blanket blocker; it names the exact owner-side commands needed to shrink the staging API deploy blocker.
