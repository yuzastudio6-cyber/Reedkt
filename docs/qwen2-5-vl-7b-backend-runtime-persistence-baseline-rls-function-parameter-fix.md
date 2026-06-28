# Qwen2.5-VL 7B Backend Runtime Persistence Baseline RLS Function Parameter Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_rls_function_parameter_fix_recorded`.

This packet records a narrow active-baseline compatibility fix for Qwen backend runtime persistence local harness validation. Retry 11 verified the prior QA reports approved-snapshot fix, then stopped in active migration `202605180007_reeditpro_rls_policies.sql` because PostgreSQL rejected an input parameter rename on `public.is_workspace_member(uuid)`: older active baseline migrations created the function with `target_workspace_id`, while the RLS migration attempted to replace it with `workspace_uuid`.

The fix preserves the existing active-baseline function parameter name for workspace-scoped RLS helpers:

- `public.is_workspace_member(target_workspace_id uuid)`
- `public.is_workspace_owner_or_admin(target_workspace_id uuid)`

The function bodies now reference `target_workspace_id` consistently. This avoids recreating baseline tables, creating new functions, changing policy semantics, creating data, applying Qwen draft SQL, running Qwen local SQL tests, deploying migrations, touching Supabase cloud, calling Cloud Run, running Qwen inference, dispatching workers, creating generated assets, creating public artifacts, creating signed URLs, mutating credits, unlocking beta, unlocking production, claiming `dry_run_passed`, or claiming `generated_local_fixture_passed`.

## Failure Recorded By Retry 11

- Failed baseline migration: `202605180007_reeditpro_rls_policies.sql`
- Failed function: `public.is_workspace_member(uuid)`
- Existing parameter observed: `target_workspace_id`
- Attempted replacement parameter: `workspace_uuid`
- Sanitized failure: `cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`
- Qwen draft SQL reached: false
- Qwen local SQL tests reached: false

## Fix Scope

- Edited active migration: `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- Parameter compatibility preserved: true
- New migration created: false
- Supabase cloud touched: false
- SQL executed now: false
- Qwen draft SQL applied now: false
- Qwen local SQL tests executed now: false
- Runtime readiness claimed: false

## Why Both Workspace Helpers Changed

Earlier active migrations repeatedly define both `public.is_workspace_member(target_workspace_id uuid)` and `public.is_workspace_owner_or_admin(target_workspace_id uuid)`. Retry 11 stopped at the first helper. The sibling owner/admin helper used the same incompatible `workspace_uuid` parameter name in the RLS migration and would likely fail next. Preserving `target_workspace_id` for both keeps the active baseline signature compatible without changing call sites, policy meaning, or row access logic.

## Runtime Gates

- `backendRuntimePersistenceBaselineRlsFunctionParameterFixRecorded=true`
- `activeBaselineRlsPoliciesMigrationEdited=true`
- `isWorkspaceMemberParameterNamePreserved=true`
- `isWorkspaceOwnerOrAdminParameterNamePreserved=true`
- `workspaceUuidParameterRenameSkipped=true`
- `qwenDraftSqlApplied=false`
- `qwenLocalSqlTestsExecuted=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `cloudRunInvocationAttempted=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AR-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12: retry Qwen local harness validation after RLS function parameter fix, no deploy/no cloud/no assets/no beta`
