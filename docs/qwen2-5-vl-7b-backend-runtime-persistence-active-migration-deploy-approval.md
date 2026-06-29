# Qwen2.5-VL 7B Backend Runtime Persistence Active Migration Deploy Approval

Decision: `qwen2_5_vl_backend_runtime_persistence_active_migration_deploy_approval_recorded_deploy_execution_required`.

This packet records deployment-target approval for the locally validated Qwen2.5-VL backend runtime persistence active migration. It does not deploy the migration, touch Supabase cloud, staging, production, or live data, run SQL, run Supabase deployment commands, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Inputs

- Active migration deploy plan: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-plan.md`
- Active migration validation result: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md`
- Active migration: `supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql`
- Local SQL tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`
- Private invoke readiness rollup: `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`
- Supabase deployment documentation and changelog were inspected before this approval. The deployment flow still requires current CLI command discovery and an explicit future execution prompt before any cloud command is allowed.

## Approved Deployment Target Class

- Approved target class: ReEditPro owner-approved Supabase cloud project for backend runtime persistence.
- Approved environment class: controlled backend-runtime migration target only.
- Approved migration version: `20260629011700`.
- Approved migration file: `supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql`.
- Approved deployment command family: Supabase migration deployment workflow after CLI help and target status checks.
- Project reference resolution required at execution time: true.
- Project reference stored in repo evidence: false.
- Connection string, database password, access token, service-role key, and local development keys stored in repo evidence: false.

This approval is intentionally target-class approval rather than a credential or connection record. The future deploy-execution prompt must re-confirm the exact target through approved Supabase tooling without printing secrets or committing generated metadata.

## Approved Deployment Scope

The future deploy execution may apply only the locally validated active Qwen migration. The scope remains:

- Qwen-specific job payload source-of-truth checks;
- sanitized job-event payload checks;
- worker runtime config checks for Qwen;
- worker lease, runtime message, and job claim attempt Qwen guards;
- `tool_runtime_checks` support for `qwen_vl`;
- Qwen indexes;
- `nvidia_l4` scale-to-zero metadata;
- `bounded_preview_scale_to_zero` serving profile metadata;
- private storage, approved snapshot, checksum, structured findings, and edit-intent requirements.

The approval does not allow seed rows, worker runtime config rows, tool capability rows, jobs, job events, storage objects, signed URL events, generated assets, QA rows, credit rows, provider calls, Cloud Run invocation, worker dispatch, beta, or production.

## Execution Preconditions For Future Prompt

The future deploy-execution prompt must stop before deployment unless all of these are true:

- Supabase CLI help is rechecked in the current environment;
- active branch and migration file are verified;
- target project/environment is resolved and confirmed as the approved ReEditPro backend-runtime migration target;
- migration status is inspected before deploy;
- version `20260629011700` is confirmed absent before deploy or already present with no action needed;
- migration text matches the validated candidate;
- advisor collection strategy is defined for the target;
- rollback or forward-fix authority is explicit;
- Data API exposure is checked to remain unchanged because this migration adds no new tables;
- no generated Supabase metadata directories are staged;
- no credentials, tokens, passwords, connection strings, or local default development keys are written to repo evidence.

## Future Deploy Command Boundary

The following command families are future-only and were not run by this prompt:

- inspect Supabase CLI help;
- inspect target migration status;
- link/select the approved target when required by CLI workflow;
- deploy the validated migration;
- verify migration history version `20260629011700`;
- collect post-deploy advisor/status evidence if approved.

This approval packet did not run `supabase login`, `supabase link`, `supabase db push`, `supabase migration up`, SQL, psql, Docker, local harness startup, Cloud Run, or provider/runtime commands.

## Runtime Gates

- `backendRuntimePersistenceActiveMigrationDeployApprovalRecorded=true`
- `backendRuntimePersistenceActiveMigrationDeployApprovalRequired=false`
- `backendRuntimePersistenceActiveMigrationDeploymentTargetApproved=true`
- `backendRuntimePersistenceActiveMigrationDeployExecutionRequired=true`
- `backendRuntimePersistenceActiveMigrationDeployed=false`
- `migrationDeployed=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `cloudRunInvocationAttempted=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Approval Proves

- The locally validated active migration has a target-class approval for future deployment.
- The deploy-execution prompt may proceed to safe preflight and migration status inspection for the approved target.
- The next blocker is deploy execution, not deploy planning or target approval.

## What This Approval Does Not Prove

- No migration has been deployed to Supabase cloud, staging, production, or live data.
- No exact project reference or credential is stored in repo evidence.
- No real worker dispatch is enabled.
- No Cloud Run private invoke request is sent.
- No Qwen inference has run.
- No generated asset, public artifact, signed URL, QA row, audit row, or credit mutation is created.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.
- Beta and production remain blocked.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BE-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-DEPLOY-EXECUTE: deploy validated Qwen persistence migration to approved Supabase target, no assets/no beta`
