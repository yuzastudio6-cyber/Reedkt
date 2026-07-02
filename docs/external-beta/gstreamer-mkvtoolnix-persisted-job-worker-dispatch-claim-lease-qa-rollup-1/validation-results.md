# Persisted Job Worker Claim Lease QA Rollup Validation Results

Validation status: `passed`

Post-merge evidence command:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true API_ALLOW_MOCK_WITHOUT_SUPABASE=true E2E_RUNTIME_MODE=local NODE_ENV=test SUPABASE_URL='' SUPABASE_SERVICE_ROLE_KEY='' npx tsx /tmp/reeditpro-persisted-claim-lease-evidence.ts`

Evidence result:

- HTTP status: `201`
- Route status: `completed_persisted_job_worker_claim_lease_boundary`
- Decision: `completed_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_boundary`

Repo validation:

- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1:diagnostics`
- `git diff --check`
- `git diff --cached --check`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
