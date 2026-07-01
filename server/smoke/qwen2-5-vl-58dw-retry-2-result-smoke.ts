import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_58DW_RETRY_2_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-58dw-retry-2-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/qwen2-5-vl-7b-58dw-retry-2-result.md'
const SPEC_PATH = 'src/backend/mock/mock-qwen2-5-vl-58dw-retry-2-result.ts'
const SMOKE_PATH = 'server/smoke/qwen2-5-vl-58dw-retry-2-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:qwen2-5-vl-58dw-retry-2-result'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'qwen58dwRetry2'): string[] {
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

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/qwen2-5-vl-58dw-retry-2-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'qwen2_5_vl_58dw_retry_2_passed_result_review_required',
  'qwen58dw-20260701T195325',
  'reeditpro-qwen2-5-vl-private-caller-gdv5l',
  'Service restored fail-closed: `true`',
  '`boundedRetryPromptExecuted=true`',
  '`inferenceRun=true`',
  '`generatedAssetsCreated=false`',
  '`signedUrlsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`creditMutationCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Retry-2 result doc missing ${required}`)
}

const result = QWEN2_5_VL_58DW_RETRY_2_RESULT
assert.equal(result.decision, 'qwen2_5_vl_58dw_retry_2_passed_result_review_required')
assert.equal(result.mode, 'qwen2_5_vl_58dw_retry_2_result_only')
assert.equal(result.runId, 'qwen58dw-20260701T195325')
assert.equal(result.status, 'passed')
assert.deepEqual(result.blockers, [])
assert.equal(result.executionName, 'reeditpro-qwen2-5-vl-private-caller-gdv5l')
assert.equal(result.jobExitCode, 0)
assert.equal(result.serviceRestoredFailClosed, true)
assert.equal(result.beforeState.serviceFixtureInferenceEnabled, false)
assert.equal(result.beforeState.serviceInferenceEnabled, false)
assert.equal(result.beforeState.callerExecutionEnabled, false)
assert.equal(result.afterState.serviceFixtureInferenceEnabled, false)
assert.equal(result.afterState.serviceInferenceEnabled, false)
assert.equal(result.afterState.callerExecutionEnabled, false)
assert.equal(result.runtimeFlags.boundedRetryPromptExecuted, true)
assert.equal(result.runtimeFlags.temporaryFixtureInferenceServiceRevisionDeployed, true)
assert.equal(result.runtimeFlags.cpuCallerJobExecuted, true)
assert.equal(result.runtimeFlags.modelImportRun, true)
assert.equal(result.runtimeFlags.modelLoadRun, true)
assert.equal(result.runtimeFlags.vllmEngineInitialized, true)
assert.equal(result.runtimeFlags.inferenceRun, true)
assert.equal(result.runtimeFlags.metadataOnlyEvidenceCreated, true)
assert.equal(result.runtimeFlags.rawModelOutputStored, false)
assert.equal(result.runtimeFlags.generatedAssetsCreated, false)
assert.equal(result.runtimeFlags.publicArtifactsCreated, false)
assert.equal(result.runtimeFlags.signedUrlsCreated, false)
assert.equal(result.runtimeFlags.supabaseTouched, false)
assert.equal(result.runtimeFlags.sqlExecuted, false)
assert.equal(result.runtimeFlags.providerCallsMade, false)
assert.equal(result.runtimeFlags.mediaProcessingRun, false)
assert.equal(result.runtimeFlags.renderExportRun, false)
assert.equal(result.runtimeFlags.creditMutationCreated, false)
assert.equal(result.runtimeFlags.betaUnlocked, false)
assert.equal(result.runtimeFlags.productionUnlocked, false)
assert.equal(result.runtimeFlags.dryRunPassedClaimed, false)
assert.equal(result.runtimeFlags.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      runId: result.runId,
      executionName: result.executionName,
      serviceRestoredFailClosed: result.serviceRestoredFailClosed,
      inferenceRun: result.runtimeFlags.inferenceRun,
      generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
      signedUrlsCreated: result.runtimeFlags.signedUrlsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
