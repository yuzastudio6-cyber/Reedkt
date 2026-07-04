import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from '../../src/backend/mock/mock-external-agent-gcp-access-repair-plan'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-execute-broll-wan.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execute-broll-wan-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-execute-broll-wan'
const CACHE_PREPARE_SCRIPT = 'external-agent-tool-prepare-broll-wan-cache'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-execute-broll-wan'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF'
const INFERENCE_CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF'
const CACHE_FILL_CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_CACHE_FILL'
const DELEGATED_CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11B_MODEL_IMPORT_PROOF'
const INFERENCE_RUNNER_CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE'
const CACHE_STAGING_CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING'
const ACCOUNT_OVERRIDE_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT'
const ACCOUNT_OVERRIDE_INDEX_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function runCli(args: string[] = []) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 4,
    env: {
      ...process.env,
      [CONFIRM_ENV]: '',
      [INFERENCE_CONFIRM_ENV]: '',
      [CACHE_FILL_CONFIRM_ENV]: '',
    },
  })

  return JSON.parse(output) as Record<string, unknown>
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentBrollExecute'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json', 'src/backend/mock/mock-external-agent-tool-next-command.ts']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-execute-broll-wan.ts',
  'package external-agent B-roll execute script mismatch',
)
assert.equal(
  packageJson.scripts?.[CACHE_PREPARE_SCRIPT],
  'tsx server/cli/external-agent-tool-execute-broll-wan.ts --prepare-cache',
  'package external-agent B-roll cache prepare script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execute-broll-wan-smoke.ts',
  'package external-agent B-roll execute smoke script mismatch',
)

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  INFERENCE_CONFIRM_ENV,
  CACHE_FILL_CONFIRM_ENV,
  DELEGATED_CONFIRM_ENV,
  INFERENCE_RUNNER_CONFIRM_ENV,
  CACHE_STAGING_CONFIRM_ENV,
  ACCOUNT_OVERRIDE_ENV,
  ACCOUNT_OVERRIDE_INDEX_ENV,
  '--account-index',
  '--gcloud-account-index',
  'CLOUDSDK_CORE_ACCOUNT: selection.account',
  'withSelectedAccountIndexCommand',
  'withSelectedAccountIndexPlaceholders',
  'brollAccessRepairHint',
  'external-agent-gcp-access:repair-plan',
  'ai-video-broll-wan-gpu-global-quota-verify.ts',
  'ai-video-broll-wan-fast-cache-readiness-check.ts',
  'ai-video-broll-gen-11b:l4-model-import-runner',
  'ai-video-broll-gen-11h:bounded-inference-proof-runner',
  'ai-video-broll-gen-11e:cloud-side-cache-staging-runner',
  'external_agent_broll_wan_execution_preflight_only_result',
  'external_agent_broll_wan_inference_proof_static_guard',
  'external_agent_broll_wan_inference_proof_preflight_only_result',
  'external_agent_broll_wan_inference_proof_confirmation_blocked',
  'external_agent_broll_wan_inference_proof_preflight_blocked',
  'external_agent_broll_wan_inference_proof_delegated_11h_result',
  'external_agent_broll_wan_inference_proof_delegated_11h_blocked_or_failed',
  'broll_live_quota_verify_before_inference',
  'broll_private_cache_readiness_before_inference',
  '--inference-proof',
  '--preflight-only',
  'external-agent-tool-prepare-broll-wan-cache',
  '.tmp/external-agent-broll-wan-11e-cloud-side-cache-staging-runner.json',
  '.tmp/external-agent-broll-wan-11b-l4-model-import-runner.json',
  'broll_gpus_all_regions_quota_not_sufficient',
  'external_agent_broll_wan_private_cache_prepare_static_guard',
  'external_agent_broll_wan_private_cache_prepare_confirmation_blocked',
  'external_agent_broll_wan_private_cache_prepare_delegated_11e_result',
  'external_agent_broll_wan_execution_delegated_11b_model_import_result',
  'ok: delegated.ok && delegated.json?.ok === true',
  'parseJsonOutput',
  'runtimeRunNow: false',
  'runtimeRunNow: true',
  'computeVmCreated: false',
  'modelInferenceRun: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(source.includes(required), true, `B-roll wrapper missing ${required}`)
}
for (const forbidden of [
  'compute instances create',
  'compute instances delete',
  'ssh ',
  'docker ',
  'psql',
  'createdb',
  'dropdb',
  'supabase ',
  'from_pretrained',
  'torch.',
]) {
  assert.equal(source.includes(forbidden), false, `B-roll wrapper must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'external_agent_broll_wan_execution_static_guard')
assertAccountOverride(staticReport)
assertBrollAccessRepair(staticReport)
assert.equal(staticReport.executeRequired, true)
assert.equal(staticReport.preflightOnlyCommand, 'npm run external-agent-tool-execute-broll-wan -- --preflight-only --json')
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.confirmationEnvRequiredValue, 'true')
assert.equal(staticReport.cacheFillConfirmationEnv, CACHE_FILL_CONFIRM_ENV)
assert.equal(staticReport.delegatedRunnerConfirmationEnv, DELEGATED_CONFIRM_ENV)
assert.equal(staticReport.delegatedRunnerScript, 'ai-video-broll-gen-11b:l4-model-import-runner')
assert.equal(staticReport.cachePreparationCommand, 'npm run external-agent-tool-prepare-broll-wan-cache -- --execute --json')
assert.deepEqual(
  staticReport.canonicalCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.brollWanExternalAgentProofCommand,
)
assert.equal(staticReport.runtimeRunNow, false)
assert.equal(staticReport.computeVmCreated, false)
assert.equal(staticReport.dockerRun, false)
assert.equal(staticReport.modelImportRun, false)
assert.equal(staticReport.modelInferenceRun, false)
assert.equal(staticReport.generatedVideoCreated, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.supabaseTouched, false)
assert.equal(staticReport.sqlExecuted, false)
assert.equal(staticReport.creditMutationCreated, false)
assert.equal(staticReport.betaUnlocked, false)
assert.equal(staticReport.productionUnlocked, false)
assert.equal(staticReport.generatedLocalFixturePassedClaimed, false)

const invalidCliIndexReport = runCli(['--account-index=0', '--json'])
assert.equal(invalidCliIndexReport.mode, 'external_agent_broll_wan_execution_static_guard')
assert.equal(invalidCliIndexReport.gcloudAccountOverrideIndexProvided, true)
assert.equal(invalidCliIndexReport.gcloudAccountOverrideIndexSource, 'cli')
assert.equal(invalidCliIndexReport.gcloudAccountOverrideResolved, false)
assert.equal(invalidCliIndexReport.gcloudAccountOverrideResolutionFailure, 'invalid_account_index')
assert.equal(invalidCliIndexReport.gcloudAccountOverrideMutatesLocalConfig, false)

const indexedStaticReport = runCli(['--account-index', '2', '--json'])
assert.equal(indexedStaticReport.mode, 'external_agent_broll_wan_execution_static_guard')
assert.equal(indexedStaticReport.gcloudAccountOverrideIndexProvided, true)
assert.equal(indexedStaticReport.gcloudAccountOverrideIndex, 2)
assert.equal(indexedStaticReport.gcloudAccountOverrideIndexSource, 'cli')
assert.equal(indexedStaticReport.gcloudAccountOverrideResolved, true)
assert.deepEqual(
  (indexedStaticReport.canonicalCommand as { args: string[] }).args,
  [
    'run',
    'external-agent-tool-execute-broll-wan',
    '--',
    '--execute',
    '--json',
    '--account-index',
    '2',
  ],
)
assert.equal(
  indexedStaticReport.inferenceProofCommand,
  'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true npm run external-agent-tool-execute-broll-wan -- --inference-proof --execute --json --account-index 2',
)
assert.equal(
  (indexedStaticReport.gcpAccessRepair as { verificationCommand: string }).verificationCommand,
  'npm run external-agent-tool-blockers:preflight -- --account-index 2',
)
assert.equal(
  ((indexedStaticReport.gcpAccessRepair as { safeRetryChecklist: string[] }).safeRetryChecklist).includes(
    'run npm run external-agent-tool-next-command -- --account-index 2',
  ),
  true,
)

const preflightOnly = runCli(['--preflight-only', '--json'])
assert.equal(preflightOnly.mode, 'external_agent_broll_wan_execution_preflight_only_result')
assertAccountOverride(preflightOnly)
assertBrollAccessRepair(preflightOnly)
assert.equal(typeof preflightOnly.ok, 'boolean')
assert.equal(typeof preflightOnly.status, 'string')
assert.equal(Array.isArray(preflightOnly.blockers), true)
assert.equal(preflightOnly.confirmationEnv, CONFIRM_ENV)
assert.equal(preflightOnly.confirmationEnvRequiredValue, 'true')
assert.equal(typeof preflightOnly.brollQuota, 'object')
assert.equal(typeof preflightOnly.cacheReadiness, 'object')
assert.equal(typeof preflightOnly.wouldDelegateIfExecuteConfirmed, 'boolean')
assert.equal(typeof preflightOnly.delegatedRunner, 'object')
assert.equal(preflightOnly.runtimeRunNow, false)
assert.equal(preflightOnly.computeVmCreated, false)
assert.equal(preflightOnly.dockerRun, false)
assert.equal(preflightOnly.modelImportRun, false)
assert.equal(preflightOnly.modelInferenceRun, false)
assert.equal(preflightOnly.generatedVideoCreated, false)
assert.equal(preflightOnly.generatedAssetsCreated, false)
assert.equal(preflightOnly.supabaseTouched, false)
assert.equal(preflightOnly.sqlExecuted, false)
assert.equal(preflightOnly.creditMutationCreated, false)
assert.equal(preflightOnly.betaUnlocked, false)
assert.equal(preflightOnly.productionUnlocked, false)
assert.equal(preflightOnly.generatedLocalFixturePassedClaimed, false)

const indexedPreflightOnly = runCli(['--preflight-only', '--json', '--account-index', '2'])
assert.equal(indexedPreflightOnly.mode, 'external_agent_broll_wan_execution_preflight_only_result')
assert.equal(indexedPreflightOnly.gcloudAccountOverrideIndexProvided, true)
assert.equal(indexedPreflightOnly.gcloudAccountOverrideIndex, 2)
assert.equal(indexedPreflightOnly.gcloudAccountOverrideResolved, true)
assert.deepEqual(
  (indexedPreflightOnly.delegatedRunner as { args: string[] }).args,
  ['--execute', '--summary-path', '.tmp/external-agent-broll-wan-11b-l4-model-import-runner.json', '--account-index', '2'],
)
assert.equal(
  (indexedPreflightOnly.gcpAccessRepair as { verificationCommand: string }).verificationCommand,
  'npm run external-agent-tool-blockers:preflight -- --account-index 2',
)
assertSelectedAccountRepairRequest(indexedPreflightOnly.selectedAccountRepairRequest)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'external_agent_broll_wan_execution_confirmation_blocked')
assertAccountOverride(confirmationBlocked)
assertBrollAccessRepair(confirmationBlocked)
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])
assert.equal(confirmationBlocked.cacheFillConfirmationEnv, CACHE_FILL_CONFIRM_ENV)
assert.equal(confirmationBlocked.runtimeRunNow, false)
assert.equal(confirmationBlocked.computeVmCreated, false)
assert.equal(confirmationBlocked.modelInferenceRun, false)
assert.equal(confirmationBlocked.generatedAssetsCreated, false)
assert.equal(confirmationBlocked.supabaseTouched, false)
assert.equal(confirmationBlocked.sqlExecuted, false)
assert.equal(confirmationBlocked.creditMutationCreated, false)
assert.equal(confirmationBlocked.betaUnlocked, false)
assert.equal(confirmationBlocked.productionUnlocked, false)
assert.equal(confirmationBlocked.generatedLocalFixturePassedClaimed, false)

const inferenceStatic = runCli(['--inference-proof', '--json'])
assert.equal(inferenceStatic.ok, false)
assert.equal(inferenceStatic.mode, 'external_agent_broll_wan_inference_proof_static_guard')
assertAccountOverride(inferenceStatic)
assertBrollAccessRepair(inferenceStatic)
assert.equal(inferenceStatic.executeRequired, true)
assert.equal(
  inferenceStatic.preflightOnlyCommand,
  'npm run external-agent-tool-execute-broll-wan -- --inference-proof --preflight-only --json',
)
assert.equal(inferenceStatic.confirmationEnv, INFERENCE_CONFIRM_ENV)
assert.equal(inferenceStatic.delegatedRunnerConfirmationEnv, INFERENCE_RUNNER_CONFIRM_ENV)
assert.equal(inferenceStatic.delegatedRunnerScript, 'ai-video-broll-gen-11h:bounded-inference-proof-runner')
assert.deepEqual(inferenceStatic.delegatedRunnerArgs, ['--execute'])
assert.equal(inferenceStatic.runtimeRunNow, false)
assert.equal(inferenceStatic.computeVmCreated, false)
assert.equal(inferenceStatic.modelImportRun, false)
assert.equal(inferenceStatic.modelLoadRun, false)
assert.equal(inferenceStatic.modelInferenceRun, false)
assert.equal(inferenceStatic.promptEncodingRun, false)
assert.equal(inferenceStatic.denoisingRun, false)
assert.equal(inferenceStatic.vaeDecodeRun, false)
assert.equal(inferenceStatic.frameCreationRun, false)
assert.equal(inferenceStatic.videoEncodingRun, false)
assert.equal(inferenceStatic.ffmpegRun, false)
assert.equal(inferenceStatic.generatedVideoCreated, false)
assert.equal(inferenceStatic.generatedAssetsCreated, false)
assert.equal(inferenceStatic.generatedLocalFixturePassedClaimed, false)

const indexedInferenceStatic = runCli(['--inference-proof', '--json', '--account-index', '2'])
assert.equal(indexedInferenceStatic.mode, 'external_agent_broll_wan_inference_proof_static_guard')
assert.deepEqual(indexedInferenceStatic.delegatedRunnerArgs, ['--execute', '--account-index', '2'])

const inferencePreflightOnly = runCli(['--inference-proof', '--preflight-only', '--json'])
assert.equal(inferencePreflightOnly.mode, 'external_agent_broll_wan_inference_proof_preflight_only_result')
assertAccountOverride(inferencePreflightOnly)
assertBrollAccessRepair(inferencePreflightOnly)
assert.equal(typeof inferencePreflightOnly.ok, 'boolean')
assert.equal(typeof inferencePreflightOnly.status, 'string')
assert.equal(Array.isArray(inferencePreflightOnly.blockers), true)
assert.equal(inferencePreflightOnly.confirmationEnv, INFERENCE_CONFIRM_ENV)
assert.equal(inferencePreflightOnly.confirmationEnvRequiredValue, 'true')
assert.equal(typeof inferencePreflightOnly.brollQuota, 'object')
assert.equal(typeof inferencePreflightOnly.cacheReadiness, 'object')
assert.equal(typeof inferencePreflightOnly.wouldDelegateIfExecuteConfirmed, 'boolean')
assert.equal(typeof inferencePreflightOnly.delegatedRunner, 'object')
assert.equal(inferencePreflightOnly.runtimeRunNow, false)
assert.equal(inferencePreflightOnly.computeVmCreated, false)
assert.equal(inferencePreflightOnly.dockerRun, false)
assert.equal(inferencePreflightOnly.modelImportRun, false)
assert.equal(inferencePreflightOnly.modelLoadRun, false)
assert.equal(inferencePreflightOnly.modelInferenceRun, false)
assert.equal(inferencePreflightOnly.promptEncodingRun, false)
assert.equal(inferencePreflightOnly.denoisingRun, false)
assert.equal(inferencePreflightOnly.vaeDecodeRun, false)
assert.equal(inferencePreflightOnly.frameCreationRun, false)
assert.equal(inferencePreflightOnly.videoEncodingRun, false)
assert.equal(inferencePreflightOnly.ffmpegRun, false)
assert.equal(inferencePreflightOnly.generatedVideoCreated, false)
assert.equal(inferencePreflightOnly.generatedAssetsCreated, false)
assert.equal(inferencePreflightOnly.generatedLocalFixturePassedClaimed, false)

const indexedInferencePreflightOnly = runCli([
  '--inference-proof',
  '--preflight-only',
  '--json',
  '--account-index',
  '2',
])
assert.equal(indexedInferencePreflightOnly.mode, 'external_agent_broll_wan_inference_proof_preflight_only_result')
assertSelectedAccountRepairRequest(indexedInferencePreflightOnly.selectedAccountRepairRequest)

const inferenceBlocked = runCli(['--inference-proof', '--execute', '--json'])
assert.equal(inferenceBlocked.ok, false)
assert.equal(inferenceBlocked.mode, 'external_agent_broll_wan_inference_proof_confirmation_blocked')
assertAccountOverride(inferenceBlocked)
assertBrollAccessRepair(inferenceBlocked)
assert.equal(inferenceBlocked.status, 'blocked')
assert.deepEqual(inferenceBlocked.blockers, [`confirmation_env_required:${INFERENCE_CONFIRM_ENV}=true`])
assert.equal(inferenceBlocked.runtimeRunNow, false)
assert.equal(inferenceBlocked.computeVmCreated, false)
assert.equal(inferenceBlocked.modelInferenceRun, false)
assert.equal(inferenceBlocked.promptEncodingRun, false)
assert.equal(inferenceBlocked.generatedVideoCreated, false)
assert.equal(inferenceBlocked.generatedAssetsCreated, false)
assert.equal(inferenceBlocked.generatedLocalFixturePassedClaimed, false)

const cachePrepareStatic = runCli(['--prepare-cache', '--json'])
assert.equal(cachePrepareStatic.ok, false)
assert.equal(cachePrepareStatic.mode, 'external_agent_broll_wan_private_cache_prepare_static_guard')
assertAccountOverride(cachePrepareStatic)
assert.equal(cachePrepareStatic.executeRequired, true)
assert.equal(cachePrepareStatic.confirmationEnv, CACHE_FILL_CONFIRM_ENV)
assert.equal(cachePrepareStatic.confirmationEnvRequiredValue, 'true')
assert.equal(cachePrepareStatic.delegatedRunnerConfirmationEnv, CACHE_STAGING_CONFIRM_ENV)
assert.equal(cachePrepareStatic.delegatedRunnerScript, 'ai-video-broll-gen-11e:cloud-side-cache-staging-runner')
assert.deepEqual(cachePrepareStatic.delegatedRunnerArgs, [
  '--execute',
  '--summary-path',
  '.tmp/external-agent-broll-wan-11e-cloud-side-cache-staging-runner.json',
])
assert.equal(cachePrepareStatic.runtimeRunNow, false)
assert.equal(cachePrepareStatic.computeVmCreated, false)
assert.equal(cachePrepareStatic.cloudRunJobCreated, false)
assert.equal(cachePrepareStatic.cloudRunJobExecuted, false)
assert.equal(cachePrepareStatic.modelImportRun, false)
assert.equal(cachePrepareStatic.modelInferenceRun, false)
assert.equal(cachePrepareStatic.privateGcsModelCacheStaged, false)
assert.equal(cachePrepareStatic.generatedAssetsCreated, false)
assert.equal(cachePrepareStatic.supabaseTouched, false)
assert.equal(cachePrepareStatic.sqlExecuted, false)
assert.equal(cachePrepareStatic.generatedLocalFixturePassedClaimed, false)

const indexedCachePrepareStatic = runCli(['--prepare-cache', '--json', '--account-index', '2'])
assert.equal(indexedCachePrepareStatic.mode, 'external_agent_broll_wan_private_cache_prepare_static_guard')
assert.deepEqual(indexedCachePrepareStatic.delegatedRunnerArgs, [
  '--execute',
  '--summary-path',
  '.tmp/external-agent-broll-wan-11e-cloud-side-cache-staging-runner.json',
  '--account-index',
  '2',
])

const cachePrepareBlocked = runCli(['--prepare-cache', '--execute', '--json'])
assert.equal(cachePrepareBlocked.ok, false)
assert.equal(cachePrepareBlocked.mode, 'external_agent_broll_wan_private_cache_prepare_confirmation_blocked')
assertAccountOverride(cachePrepareBlocked)
assert.equal(cachePrepareBlocked.status, 'blocked')
assert.deepEqual(cachePrepareBlocked.blockers, [`confirmation_env_required:${CACHE_FILL_CONFIRM_ENV}=true`])
assert.equal(cachePrepareBlocked.runtimeRunNow, false)
assert.equal(cachePrepareBlocked.computeVmCreated, false)
assert.equal(cachePrepareBlocked.cloudRunJobCreated, false)
assert.equal(cachePrepareBlocked.cloudRunJobExecuted, false)
assert.equal(cachePrepareBlocked.modelImportRun, false)
assert.equal(cachePrepareBlocked.modelInferenceRun, false)
assert.equal(cachePrepareBlocked.privateGcsModelCacheStaged, false)
assert.equal(cachePrepareBlocked.generatedAssetsCreated, false)
assert.equal(cachePrepareBlocked.supabaseTouched, false)
assert.equal(cachePrepareBlocked.sqlExecuted, false)
assert.equal(cachePrepareBlocked.generatedLocalFixturePassedClaimed, false)

const forbiddenFindings = scanForbiddenValues({
  staticReport,
  preflightOnly,
  confirmationBlocked,
  inferenceStatic,
  inferencePreflightOnly,
  indexedInferencePreflightOnly,
  inferenceBlocked,
  cachePrepareStatic,
  indexedStaticReport,
  indexedPreflightOnly,
  indexedInferenceStatic,
  indexedCachePrepareStatic,
  cachePrepareBlocked,
})
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_broll_wan_execution_wrapper_smoke',
      staticGuardMode: staticReport.mode,
      preflightOnlyMode: preflightOnly.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      inferenceStaticMode: inferenceStatic.mode,
      inferencePreflightOnlyMode: inferencePreflightOnly.mode,
      inferenceBlockedMode: inferenceBlocked.mode,
      cachePrepareStaticMode: cachePrepareStatic.mode,
      cachePrepareBlockedMode: cachePrepareBlocked.mode,
      confirmationEnv: CONFIRM_ENV,
      cacheFillConfirmationEnv: CACHE_FILL_CONFIRM_ENV,
      runtimeRunNow: false,
      computeVmCreated: false,
      generatedAssetsCreated: false,
      generatedLocalFixturePassedClaimed: false,
    },
    null,
    2,
  ),
)

function assertAccountOverride(report: Record<string, unknown>) {
  assert.equal(report.gcloudAccountOverrideEnv, ACCOUNT_OVERRIDE_ENV)
  assert.equal(typeof report.gcloudAccountOverrideProvided, 'boolean')
  assert.equal(report.gcloudAccountOverrideIndexEnv, ACCOUNT_OVERRIDE_INDEX_ENV)
  assert.equal(report.gcloudAccountOverrideIndexCliFlag, '--account-index')
  assert.equal(report.gcloudAccountOverrideIndexCliFlagAlias, '--gcloud-account-index')
  assert.equal(typeof report.gcloudAccountOverrideIndexProvided, 'boolean')
  assert.equal(typeof report.gcloudAccountOverrideResolved, 'boolean')
  assert.equal(report.gcloudAccountOverrideMutatesLocalConfig, false)
}

function assertBrollAccessRepair(report: Record<string, unknown>) {
  const repair = report.gcpAccessRepair as {
    command?: string
    blocker?: string
    requiredReadPermissions?: Array<{ permission: string }>
    likelyMinimalRole?: string
    verificationCommand?: string
    failureMeaning?: string
    safeRepairChecklist?: string[]
    unsafeBypasses?: string[]
    failureResponsePolicy?: { ifReadAccessFails?: string; ifQuotaInsufficient?: string }
    safeRetryChecklist?: string[]
    postRepairVerificationCommands?: string[]
    runtimeExecutionStillRequiresWrapperGate?: boolean
    mutatesGcp?: boolean
    authorizesRuntimeExecution?: boolean
  }
  const brollRepair = EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.tools.find(
    (tool) => tool.toolId === 'ai_video_broll_generation_wan',
  )

  assert.equal(repair.command, 'npm run external-agent-gcp-access:repair-plan')
  assert.equal(repair.blocker, brollRepair?.blocker)
  assert.deepEqual(
    repair.requiredReadPermissions?.map((permission) => permission.permission),
    ['compute.projects.get', 'compute.regions.get'],
  )
  assert.equal(repair.likelyMinimalRole, 'roles/compute.viewer')
  assert.equal(repair.verificationCommand, brollRepair?.verificationCommand)
  assert.equal(repair.failureMeaning, brollRepair?.failureMeaning)
  assert.deepEqual(repair.safeRepairChecklist, brollRepair?.safeRepairChecklist)
  assert.deepEqual(repair.unsafeBypasses, brollRepair?.unsafeBypasses)
  assert.equal(
    repair.failureResponsePolicy?.ifReadAccessFails,
    'treat it as external GCP access or resource visibility work; do not weaken wrapper gates or mark runtime executable',
  )
  assert.equal(
    repair.failureResponsePolicy?.ifQuotaInsufficient,
    'keep B-roll runtime blocked until read-only quota verification proves one L4 VM can be created and cleaned up',
  )
  assert.equal(
    repair.safeRetryChecklist?.includes(
      'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
    ),
    true,
  )
  assert.equal(
    repair.postRepairVerificationCommands?.includes(
      'npm run external-agent-gcp-access:verify -- --account-index <redacted-index>',
    ),
    true,
  )
  assert.equal(repair.runtimeExecutionStillRequiresWrapperGate, true)
  assert.equal(repair.mutatesGcp, false)
  assert.equal(repair.authorizesRuntimeExecution, false)
}

function assertSelectedAccountRepairRequest(value: unknown) {
  const request = value as {
    accountIndex?: number
    missingReadPermissions?: Array<{
      toolId: string
      permission: string
      likelyMinimalRole: string
      resourceScope: string
      reason: string
    }>
    postRepairVerificationCommands?: string[]
    mutatesGcp?: boolean
    runsRuntime?: boolean
    runtimeExecutionStillRequiresWrapperGate?: boolean
  }

  assert.equal(request.accountIndex, 2)
  assert.equal(Array.isArray(request.missingReadPermissions), true)
  for (const permission of request.missingReadPermissions ?? []) {
    assert.equal(typeof permission.toolId, 'string')
    assert.equal(typeof permission.permission, 'string')
    assert.equal(typeof permission.likelyMinimalRole, 'string')
    assert.equal(typeof permission.resourceScope, 'string')
    assert.equal(typeof permission.reason, 'string')
  }
  assert.equal(
    request.postRepairVerificationCommands?.includes(
      'npm run external-agent-tool-blockers:preflight -- --account-index 2',
    ),
    true,
  )
  assert.equal(request.mutatesGcp, false)
  assert.equal(request.runsRuntime, false)
  assert.equal(request.runtimeExecutionStillRequiresWrapperGate, true)
}
