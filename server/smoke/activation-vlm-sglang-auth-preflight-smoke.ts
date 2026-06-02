import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  getVlmSgAuthPreflightPlan,
  buildVlmSgAuthPreflightStaticReport,
} from '../activation/vlm-sglang-runtime'

const plan = getVlmSgAuthPreflightPlan()
assert.equal(plan.phase, '39C-SG-AUTH-RERUN')
assert.equal(plan.defaultMode, 'non_mutating')
assert.equal(plan.requiredConfirmationForAuthPreflightExecute, 'REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT')
assert.equal(plan.requiredConfirmationForRerun, 'REEDITPRO_CONFIRM_VLM_SG_NONINTERACTIVE_AUTH_RERUN')
assert.equal(plan.preferredImpersonationServiceAccount, 'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(plan.tokenOutput, 'not_printed')
assert.equal(plan.serviceAccountKeys, 'blocked_not_created_not_committed')
assert.equal(plan.browserLoginInsideCodex, 'blocked')
assert.equal(plan.fixedKernelDelegation.sourcePr, 'https://github.com/yuzastudio6-cyber/Reedkt/pull/110')
assert.equal(plan.fixedKernelDelegation.cloudBuildImportSmokeRuntime, 'delegated_to_existing_fixed_kernel_runner_after_auth_and_permission_preflight_pass')
assert.equal(plan.fixedKernelDelegation.privateQaPrefix.includes('generated-vlm-sglang-fixed-kernel'), true)
assert.equal(plan.authResolutionOrder.includes('REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT_explicit_flag'), true)
assert.equal(plan.authResolutionOrder.includes('CLOUDSDK_AUTH_ACCESS_TOKEN'), true)
assert.equal(plan.authResolutionOrder.includes('REEDITPRO_GCP_WIF_CREDENTIAL_FILE_or_GOOGLE_APPLICATION_CREDENTIALS'), true)
assert.equal(plan.permissionChecks.includes('cloud_builds_list'), true)
assert.equal(plan.permissionChecks.includes('artifact_registry_describe'), true)
assert.equal(plan.permissionChecks.includes('cloud_run_jobs_list'), true)
assert.equal(plan.permissionChecks.includes('qa_artifacts_iam_policy_read'), true)

for (const key of [
  'phase39cOriginalOom',
  'phase39bq39cqCandidates',
  'phase39cqStructuredOutput',
  'phase39cqSo3Perception',
  'phase39cSglangBuildx',
  'phase39cSgBuildCloudBuild',
  'phase39cSgKernelCompat',
  'phase39cSgFixedKernel',
]) {
  assert.equal(Boolean(plan.sourceEvidence[key as keyof typeof plan.sourceEvidence]), true, `${key} evidence must be present`)
}

for (const blocked of [
  'Phase 39D controlled real-frame VLM',
  'Phase 39E planning integration',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'public output',
  'broad user media',
  'arbitrary media paths',
  'unapproved GPU types',
  'non-Qwen candidates',
  'new Qwen model downloads',
  'service-account keys',
  'Track A runtime/visual/render stack',
]) {
  assert.equal(plan.blockedScopes.includes(blocked), true, `${blocked} must remain blocked`)
}

const staticReport = buildVlmSgAuthPreflightStaticReport()
assert.equal(staticReport.status, 'blocked')
assert.equal(staticReport.vlmToolFamilyBetaStatus, 'blocked')
assert.equal(staticReport.blockers.includes('auth_preflight_not_run'), true)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:auth-preflight:plan'], 'tsx server/cli/activation-vlm-sglang-runtime-auth-preflight-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:auth-preflight'], 'tsx server/cli/activation-vlm-sglang-runtime-auth-preflight.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:auth-preflight:report'], 'tsx server/cli/activation-vlm-sglang-runtime-auth-preflight-report.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:auth-rerun'], 'tsx server/cli/activation-vlm-sglang-runtime-auth-rerun.ts')
assert.equal(packageJson.scripts['activation:vlm-sglang-runtime:auth-rerun:report'], 'tsx server/cli/activation-vlm-sglang-runtime-auth-rerun-report.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-sglang-auth-preflight'], 'tsx server/smoke/activation-vlm-sglang-auth-preflight-smoke.ts')

for (const filePath of [
  '../activation/vlm-sglang-runtime/auth-preflight.ts',
  '../cli/activation-vlm-sglang-runtime-auth-preflight.ts',
  '../cli/activation-vlm-sglang-runtime-auth-rerun.ts',
]) {
  assert.equal(existsSync(new URL(filePath, import.meta.url)), true, `${filePath} must exist`)
}

const authPreflightSource = readFileSync(new URL('../activation/vlm-sglang-runtime/auth-preflight.ts', import.meta.url), 'utf8')
assert.equal(authPreflightSource.includes('REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT'), true)
assert.equal(authPreflightSource.includes('REEDITPRO_CONFIRM_VLM_SG_NONINTERACTIVE_AUTH_RERUN'), true)
assert.equal(authPreflightSource.includes('REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT'), true)
assert.equal(authPreflightSource.includes('REEDITPRO_GCP_ACCESS_TOKEN_FILE'), true)
assert.equal(authPreflightSource.includes('CLOUDSDK_AUTH_ACCESS_TOKEN'), true)
assert.equal(authPreflightSource.includes('REEDITPRO_GCP_WIF_CREDENTIAL_FILE'), true)
assert.equal(authPreflightSource.includes('GOOGLE_APPLICATION_CREDENTIALS'), true)
assert.equal(authPreflightSource.includes('auth print-access-token') || authPreflightSource.includes('print-access-token'), true)
assert.equal(authPreflightSource.includes('not_printed'), true)
assert.equal(authPreflightSource.includes("serviceAccountKey: 'not_used_not_created'"), true)
assert.equal(/iam service-accounts keys create|auth login --no-launch-browser.*execFile|browser login|allUsers|allAuthenticatedUsers/.test(authPreflightSource), false)

const gcloudHelperSource = readFileSync(new URL('../activation/vlm-runtime/vlm-runtime-gcs-model-resolver.ts', import.meta.url), 'utf8')
assert.equal(gcloudHelperSource.includes('--impersonate-service-account'), true)
assert.equal(gcloudHelperSource.includes('--access-token-file'), true)
assert.equal(gcloudHelperSource.includes('CLOUDSDK_CORE_DISABLE_PROMPTS'), true)
assert.equal(gcloudHelperSource.includes('invalid_REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT_email'), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'auth_preflight_plan_present',
    'auth_preflight_redacts_tokens',
    'impersonation_access_token_wif_paths_supported',
    'service_account_keys_blocked',
    'browser_login_inside_codex_blocked',
    'fixed_kernel_delegation_preserved',
    'cloud_build_import_smoke_runtime_confirmations_required',
    'phase39d_phase39e_beta_production_track_a_blocked',
  ],
}))
