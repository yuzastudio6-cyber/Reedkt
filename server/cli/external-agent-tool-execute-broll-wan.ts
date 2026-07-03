import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type JsonRecord = Record<string, unknown>

const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF'
const DELEGATED_RUNNER_CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_10ZB_L4_PAYLOAD_INSTALL_RETRY'
const QUOTA_VERIFY_SCRIPT = 'server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts'
const CACHE_READINESS_SCRIPT = 'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts'
const DELEGATED_RUNNER_SCRIPT = 'ai-video-broll-gen-10zb:l4-payload-install-runner'
const DELEGATED_SUMMARY_PATH = '.tmp/external-agent-broll-wan-10zb-l4-payload-install-runner.json'
const NEXT_AFTER_DEPENDENCY_INSTALL =
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference'

function main() {
  const execute = process.argv.includes('--execute')
  const brollTool = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.find(
    (tool) => tool.toolId === 'ai_video_broll_generation_wan',
  )

  if (!execute) {
    print({
      ok: false,
      mode: 'external_agent_broll_wan_execution_static_guard',
      executeRequired: true,
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      delegatedRunnerConfirmationEnv: DELEGATED_RUNNER_CONFIRM_ENV,
      delegatedRunnerScript: DELEGATED_RUNNER_SCRIPT,
      canonicalCommand: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.brollWanExternalAgentProofCommand,
      noIdleLifecycleGate: brollTool?.noIdleLifecycleGate,
      runtimeRunNow: false,
      computeVmCreated: false,
      dockerRun: false,
      modelImportRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    print({
      ok: false,
      mode: 'external_agent_broll_wan_execution_confirmation_blocked',
      status: 'blocked',
      blockers: [`confirmation_env_required:${CONFIRM_ENV}=true`],
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeRunNow: false,
      computeVmCreated: false,
      dockerRun: false,
      modelImportRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  const quota = runJson('broll_live_quota_verify', 'npx', ['tsx', QUOTA_VERIFY_SCRIPT])
  const cache = runJson('broll_private_cache_readiness', 'npx', ['tsx', CACHE_READINESS_SCRIPT])
  const blockers = validateReadiness(quota.json, cache.json)

  if (blockers.length > 0) {
    print({
      ok: false,
      mode: 'external_agent_broll_wan_execution_preflight_result',
      status: 'blocked',
      blockers,
      brollQuota: summarizeBrollQuota(quota.json),
      cacheReadiness: summarizeCacheReadiness(cache.json),
      nextPrompt:
        blockers.includes('broll_gpus_all_regions_quota_not_sufficient') ||
        blockers.includes('broll_live_quota_verify_missing')
          ? 'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes'
          : 'AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference',
      runtimeRunNow: false,
      computeVmCreated: false,
      dockerRun: false,
      modelImportRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  const delegated = runJson(
    'broll_10zb_l4_payload_install_runner',
    'npm',
    [
      'run',
      DELEGATED_RUNNER_SCRIPT,
      '--',
      '--execute',
      '--summary-path',
      DELEGATED_SUMMARY_PATH,
    ],
    {
      [DELEGATED_RUNNER_CONFIRM_ENV]: 'true',
    },
    1024 * 1024 * 24,
  )

  print({
    ok: delegated.ok && delegated.json?.ok === true,
    mode: 'external_agent_broll_wan_execution_delegated_result',
    status: delegated.ok && delegated.json?.ok === true ? 'passed' : 'blocked_or_failed',
    blockers,
    brollQuota: summarizeBrollQuota(quota.json),
    cacheReadiness: summarizeCacheReadiness(cache.json),
    delegatedRunner: {
      script: DELEGATED_RUNNER_SCRIPT,
      confirmationEnv: DELEGATED_RUNNER_CONFIRM_ENV,
      summaryPath: DELEGATED_SUMMARY_PATH,
      exitCode: delegated.exitCode,
    },
    delegatedResult: delegated.json,
    stderrSummary: delegated.stderrSummary,
    nextPrompt: delegated.ok && delegated.json?.ok === true
      ? NEXT_AFTER_DEPENDENCY_INSTALL
      : 'AI-VIDEO-BROLL-GEN-10ZC-FIX-FIXED-DELIVERY-RETRY-FAILURE: fix the failing phase from the fixed-delivery payload/install retry, no model import/no inference',
    runtimeRunNow: true,
    computeVmCreated: delegated.json?.computeVmCreated === true,
    dockerRun: false,
    modelImportRun: delegated.json?.runtimeSideEffects &&
      asRecord(delegated.json.runtimeSideEffects).modelImportRun === true,
    modelInferenceRun: delegated.json?.runtimeSideEffects &&
      asRecord(delegated.json.runtimeSideEffects).modelInferenceRun === true,
    generatedVideoCreated: delegated.json?.runtimeSideEffects &&
      asRecord(delegated.json.runtimeSideEffects).generatedVideoCreated === true,
    generatedAssetsCreated: delegated.json?.runtimeSideEffects &&
      asRecord(delegated.json.runtimeSideEffects).generatedAssetsCreated === true,
    supabaseTouched: false,
    sqlExecuted: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    generatedLocalFixturePassedClaimed: false,
  })
}

function validateReadiness(quota: JsonRecord | undefined, cache: JsonRecord | undefined): string[] {
  const blockers: string[] = []

  if (!quota || quota.ok !== true) blockers.push('broll_live_quota_verify_missing')
  if (!cache || cache.ok !== true) blockers.push('broll_private_cache_readiness_missing')
  if (quota?.quotaSufficientForOneL4Vm !== true) blockers.push('broll_gpus_all_regions_quota_not_sufficient')
  if (quota?.projectQuotaReadPassed !== true) blockers.push('broll_project_quota_read_not_passed')
  if (quota?.regionQuotaReadPassed !== true) blockers.push('broll_region_quota_read_not_passed')
  if (cache?.cachePathExists !== true) blockers.push('broll_private_cache_path_missing')
  if (cache?.aggregateBytesMatches !== true) blockers.push('broll_private_cache_bytes_mismatch')
  if (cache?.modelIndexClassNameMatches !== true) blockers.push('broll_private_cache_model_index_mismatch')
  if (cache?.indexRefsLocal !== true) blockers.push('broll_private_cache_refs_not_local')

  return Array.from(new Set(blockers))
}

function summarizeBrollQuota(document: JsonRecord | undefined) {
  const quota = asRecord(document)
  return {
    projectQuotaReadPassed: quota.projectQuotaReadPassed,
    regionQuotaReadPassed: quota.regionQuotaReadPassed,
    quotaSufficientForOneL4Vm: quota.quotaSufficientForOneL4Vm,
    blocker: quota.blocker,
    selectedGpu: quota.selectedGpu,
    targetRegion: quota.targetRegion,
    targetZone: quota.targetZone,
    readyForBrollNoIdleProofPrompt: quota.readyForBrollNoIdleProofPrompt,
  }
}

function summarizeCacheReadiness(document: JsonRecord | undefined) {
  if (!document) return undefined
  return {
    ok: document.ok,
    decision: document.decision,
    mode: document.mode,
    statOnly: document.statOnly,
    cachePathExists: document.cachePathExists,
    runtimeEssentialFileCount: document.runtimeEssentialFileCount,
    expectedFileCount: document.expectedFileCount,
    aggregateBytesMatches: document.aggregateBytesMatches,
    missingFiles: document.missingFiles,
    byteMismatches: document.byteMismatches,
    modelIndexClassNameMatches: document.modelIndexClassNameMatches,
    indexRefsLocal: document.indexRefsLocal,
  }
}

function runJson(
  id: string,
  command: string,
  args: string[],
  env: Record<string, string> = {},
  maxBuffer = 1024 * 1024 * 12,
): {
  id: string
  ok: boolean
  exitCode: number | null
  json?: JsonRecord
  stderrSummary?: string
} {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
    maxBuffer,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const json = parseJsonOutput(String(result.stdout ?? ''))

  return {
    id,
    ok: result.status === 0 && Boolean(json),
    exitCode: result.status,
    json,
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function parseJsonOutput(output: string): JsonRecord | undefined {
  const trimmed = output.trim()
  if (!trimmed) return undefined

  try {
    return JSON.parse(trimmed) as JsonRecord
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end <= start) return undefined

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as JsonRecord
    } catch {
      return undefined
    }
  }
}

function sanitize(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .trim()

  return sanitized ? sanitized.slice(0, 1000) : undefined
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
