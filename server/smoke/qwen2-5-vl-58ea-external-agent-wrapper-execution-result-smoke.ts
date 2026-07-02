import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_58EA_EXTERNAL_AGENT_WRAPPER_EXECUTION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-58ea-external-agent-wrapper-execution-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/qwen2-5-vl-7b-58ea-external-agent-wrapper-execution-result.md'
const SPEC_PATH = 'src/backend/mock/mock-qwen2-5-vl-58ea-external-agent-wrapper-execution-result.ts'
const SMOKE_PATH = 'server/smoke/qwen2-5-vl-58ea-external-agent-wrapper-execution-result-smoke.ts'
const WRAPPER_PATH = 'server/cli/external-agent-tool-execute-qwen.ts'
const PACKAGE_SCRIPT = 'smoke:qwen2-5-vl-58ea-external-agent-wrapper-execution-result'
const DECISION = 'qwen2_5_vl_58ea_external_agent_wrapper_execution_passed_result_review_required'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-NO-IDLE-L4-PROOF-EXECUTE: run bounded no-idle L4 VM lifecycle proof with mandatory cleanup, no model inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'qwen58eaWrapperResult'): string[] {
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
  'docs/qwen2-5-vl-7b-58dz-external-agent-wrapper-rerun-result.md',
  'src/backend/mock/mock-qwen2-5-vl-58dz-external-agent-wrapper-rerun-result.ts',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/qwen2-5-vl-58ea-external-agent-wrapper-execution-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'external-agent next-command -> guarded Qwen wrapper -> bounded approved-fixture runner',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION=true npm run external-agent-tool-execute-qwen -- --execute --json`',
  '`REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY=true npm run qwen2-5-vl-58dw-bounded-private-inference-retry -- --execute --json`',
  'wrapper status: `passed`',
  'run id: `qwen58dw-20260702T004024`',
  'caller execution: `reeditpro-qwen2-5-vl-private-caller-vrhl8`',
  'service restored fail-closed: `true`',
  '`modelImportRun=true`',
  '`modelLoadRun=true`',
  '`vllmEngineInitialized=true`',
  '`inferenceRun=true`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`creditMutationCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'temporary VLLM/fixture runtime keys were removed',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Wrapper result doc missing ${required}`)
}

const wrapperSource = read(WRAPPER_PATH)
for (const required of ['parseJsonOutput', "trimmed.indexOf('{')", "trimmed.lastIndexOf('}')"]) {
  assert.equal(wrapperSource.includes(required), true, `Wrapper source missing parser guard: ${required}`)
}

const result = QWEN2_5_VL_58EA_EXTERNAL_AGENT_WRAPPER_EXECUTION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'qwen2_5_vl_58ea_external_agent_wrapper_execution_result')
assert.equal(result.wrapperCommand.confirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION')
assert.equal(result.wrapperCommand.rechecksLiveNextCommandBeforeDelegating, true)
assert.equal(result.wrapperCommand.delegatesToBoundedApprovedFixtureRunnerOnly, true)
assert.equal(result.delegatedCommand.confirmationEnv, 'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY')
assert.equal(result.delegatedCommand.boundedApprovedFixtureOnly, true)
assert.equal(result.reviewedRun.wrapperStatus, 'passed')
assert.equal(result.reviewedRun.delegatedStatus, 'passed')
assert.equal(result.reviewedRun.runId, 'qwen58dw-20260702T004024')
assert.equal(result.reviewedRun.executionName, 'reeditpro-qwen2-5-vl-private-caller-vrhl8')
assert.equal(result.reviewedRun.jobExitCode, 0)
assert.equal(result.reviewedRun.selectedGpu, 'nvidia_l4')
assert.equal(result.reviewedRun.serviceGenerationBeforeRun, 50)
assert.equal(result.reviewedRun.serviceGenerationAfterRestore, 52)
assert.equal(result.reviewedRun.serviceRestoredFailClosed, true)
assert.equal(result.wrapperEvidence.liveNextCommandRechecked, true)
assert.equal(result.wrapperEvidence.executionAllowedNow, true)
assert.equal(result.wrapperEvidence.qwenLivePreflightPassed, true)
assert.equal(result.wrapperEvidence.parsesNpmPreambleDelegatedJson, true)
assert.equal(result.runtimeResult.boundedRetryPromptExecuted, true)
assert.equal(result.runtimeResult.temporaryFixtureInferenceServiceRevisionDeployed, true)
assert.equal(result.runtimeResult.cpuCallerJobExecuted, true)
assert.equal(result.runtimeResult.serviceRestoredFailClosed, true)
assert.equal(result.runtimeResult.modelImportRun, true)
assert.equal(result.runtimeResult.modelLoadRun, true)
assert.equal(result.runtimeResult.vllmEngineInitialized, true)
assert.equal(result.runtimeResult.inferenceRun, true)
assert.equal(result.runtimeResult.metadataOnlyEvidenceCreated, true)
assertFalseFlags(result.runtimeResult, [
  'serviceTargetValueStoredInRepo',
  'audienceValueStoredInRepo',
  'identityTokenPrinted',
  'identityTokenValueStored',
  'rawModelOutputStored',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'supabaseTouched',
  'sqlExecuted',
  'providerCallsMade',
  'mediaProcessingRun',
  'renderExportRun',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'paidProductionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assert.equal(result.failClosedAfterRun.qwenApprovedFixtureInferenceEnabled, false)
assert.equal(result.failClosedAfterRun.qwenInferenceEnabled, false)
assert.equal(result.failClosedAfterRun.temporaryVllmKeysPresent, false)
assert.equal(result.failClosedAfterRun.serviceMinScalePresent, false)
assert.equal(result.failClosedAfterRun.serviceTemplateMaxScale, '1')
assert.equal(result.failClosedAfterRun.cpuCallerExecutionEnabled, false)
assert.equal(result.failClosedAfterRun.cpuCallerTargetUrlPersisted, false)
assert.equal(result.blockedEvidence.brollQuotaCleared, true)
assert.equal(result.blockedEvidence.brollNoIdleLifecyclePromptStillRequired, true)
assert.equal(result.blockedEvidence.soundRuntimeStillBlocked, true)
assert.equal(result.blockedEvidence.supabaseHarnessMutationStillBlocked, true)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      wrapperStatus: result.reviewedRun.wrapperStatus,
      runId: result.reviewedRun.runId,
      executionName: result.reviewedRun.executionName,
      inferenceRun: result.runtimeResult.inferenceRun,
      serviceRestoredFailClosed: result.runtimeResult.serviceRestoredFailClosed,
      generatedAssetsCreated: result.runtimeResult.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeResult.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
