import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_WAN_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT } from '../../src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-blocked-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-blocked-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-wan-external-agent-wrapper-blocked-result-smoke.ts'
const WRAPPER_PATH = 'server/cli/external-agent-tool-execute-broll-wan.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-wan-external-agent-wrapper-blocked-result'
const DECISION = 'ai_video_broll_wan_external_agent_wrapper_blocked_quota_result_recorded'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'brollWanWrapperBlockedResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
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

function assertFalseFlags(flags: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  WRAPPER_PATH,
  'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
  'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
  'server/cli/external-agent-tool-blocker-preflight.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-wan-external-agent-wrapper-blocked-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'external-agent B-roll wrapper -> live quota preflight -> stat-only private cache readiness -> quota blocker',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF=true npm run external-agent-tool-execute-broll-wan -- --execute --json`',
  'wrapper status: `blocked`',
  'quota sufficient for one L4 VM: `false`',
  'blocker: `gpus_all_regions_quota_zero_or_unverified`',
  '`broll_gpus_all_regions_quota_not_sufficient`',
  '`broll_vm_execution_requires_future_no_idle_proof_prompt`',
  'cache readiness ok: `true`',
  'runtime essential file count: `19`',
  'aggregate bytes match: `true`',
  '`computeVmCreated=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `B-roll blocked result doc missing ${required}`)
}

const result = AI_VIDEO_BROLL_WAN_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_wan_external_agent_wrapper_blocked_result')
assert.equal(result.wrapperCommand.confirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF')
assert.equal(result.wrapperCommand.verifiesLiveQuotaBeforeAnyVmAction, true)
assert.equal(result.wrapperCommand.verifiesPrivateCacheBeforeAnyVmAction, true)
assert.equal(result.wrapperCommand.blocksBeforeVmOrModelWork, true)
assert.equal(result.reviewedResult.wrapperStatus, 'blocked')
assert.equal(result.reviewedResult.selectedModelOrTool, 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers')
assert.equal(result.reviewedResult.selectedGpu, 'nvidia_l4')
assert.equal(result.reviewedResult.projectQuotaReadPassed, true)
assert.equal(result.reviewedResult.regionQuotaReadPassed, true)
assert.equal(result.reviewedResult.quotaSufficientForOneL4Vm, false)
assert.equal(result.reviewedResult.blocker, 'gpus_all_regions_quota_zero_or_unverified')
assert.deepEqual(result.blockers, [
  'broll_gpus_all_regions_quota_not_sufficient',
  'broll_vm_execution_requires_future_no_idle_proof_prompt',
])
assert.equal(result.cacheReadiness.ok, true)
assert.equal(result.cacheReadiness.statOnly, true)
assert.equal(result.cacheReadiness.cachePathExists, true)
assert.equal(result.cacheReadiness.runtimeEssentialFileCount, 19)
assert.equal(result.cacheReadiness.expectedFileCount, 19)
assert.equal(result.cacheReadiness.aggregateBytesMatches, true)
assert.deepEqual(result.cacheReadiness.missingFiles, [])
assert.deepEqual(result.cacheReadiness.byteMismatches, [])
assert.equal(result.cacheReadiness.modelIndexClassNameMatches, true)
assert.equal(result.cacheReadiness.indexRefsLocal, true)
assert.equal(result.noIdleLifecycleGate.idleGpuAllowed, false)
assert.equal(result.noIdleLifecycleGate.vmCreateAllowedNow, false)
assert.equal(result.noIdleLifecycleGate.modelInferenceAllowedNow, false)
assertFalseFlags(result.runtimeResult, [
  'runtimeRunNow',
  'computeVmCreated',
  'dockerRun',
  'modelImportRun',
  'modelInferenceRun',
  'generatedVideoCreated',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'supabaseTouched',
  'sqlExecuted',
  'providerCallsMade',
  'workersDispatched',
  'storageObjectsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'paidProductionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      wrapperStatus: result.reviewedResult.wrapperStatus,
      quotaSufficientForOneL4Vm: result.reviewedResult.quotaSufficientForOneL4Vm,
      cacheReady: result.cacheReadiness.ok,
      computeVmCreated: result.runtimeResult.computeVmCreated,
      modelInferenceRun: result.runtimeResult.modelInferenceRun,
      generatedAssetsCreated: result.runtimeResult.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeResult.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
