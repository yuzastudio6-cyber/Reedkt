import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

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
  'CLOUDSDK_CORE_ACCOUNT: accountOverride',
  'ai-video-broll-wan-gpu-global-quota-verify.ts',
  'ai-video-broll-wan-fast-cache-readiness-check.ts',
  'ai-video-broll-gen-11b:l4-model-import-runner',
  'ai-video-broll-gen-11h:bounded-inference-proof-runner',
  'ai-video-broll-gen-11e:cloud-side-cache-staging-runner',
  'external_agent_broll_wan_inference_proof_static_guard',
  'external_agent_broll_wan_inference_proof_confirmation_blocked',
  'external_agent_broll_wan_inference_proof_delegated_11h_result',
  'external_agent_broll_wan_inference_proof_delegated_11h_blocked_or_failed',
  '--inference-proof',
  'external-agent-tool-prepare-broll-wan-cache',
  '.tmp/external-agent-broll-wan-11e-cloud-side-cache-staging-runner.json',
  '.tmp/external-agent-broll-wan-11b-l4-model-import-runner.json',
  'broll_gpus_all_regions_quota_not_sufficient',
  'external_agent_broll_wan_private_cache_prepare_static_guard',
  'external_agent_broll_wan_private_cache_prepare_confirmation_blocked',
  'external_agent_broll_wan_private_cache_prepare_delegated_11e_result',
  'external_agent_broll_wan_execution_delegated_11b_model_import_result',
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
assert.equal(staticReport.executeRequired, true)
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

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'external_agent_broll_wan_execution_confirmation_blocked')
assertAccountOverride(confirmationBlocked)
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
assert.equal(inferenceStatic.executeRequired, true)
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

const inferenceBlocked = runCli(['--inference-proof', '--execute', '--json'])
assert.equal(inferenceBlocked.ok, false)
assert.equal(inferenceBlocked.mode, 'external_agent_broll_wan_inference_proof_confirmation_blocked')
assertAccountOverride(inferenceBlocked)
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
  confirmationBlocked,
  inferenceStatic,
  inferenceBlocked,
  cachePrepareStatic,
  cachePrepareBlocked,
})
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_broll_wan_execution_wrapper_smoke',
      staticGuardMode: staticReport.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      inferenceStaticMode: inferenceStatic.mode,
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
  assert.equal(typeof report.gcloudAccountOverrideIndexProvided, 'boolean')
  assert.equal(typeof report.gcloudAccountOverrideResolved, 'boolean')
  assert.equal(report.gcloudAccountOverrideMutatesLocalConfig, false)
}
