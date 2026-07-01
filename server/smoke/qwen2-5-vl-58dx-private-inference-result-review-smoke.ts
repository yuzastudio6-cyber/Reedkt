import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_58DX_PRIVATE_INFERENCE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-58dx-private-inference-result-review'

const ROOT = process.cwd()
const DOC_PATH = 'docs/qwen2-5-vl-7b-58dx-private-inference-result-review.md'
const SPEC_PATH = 'src/backend/mock/mock-qwen2-5-vl-58dx-private-inference-result-review.ts'
const SMOKE_PATH = 'server/smoke/qwen2-5-vl-58dx-private-inference-result-review-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:qwen2-5-vl-58dx-private-inference-result-review'
const DECISION =
  'qwen2_5_vl_58dx_private_inference_result_review_accepted_for_explicit_external_agent_gate'
const NEXT_PROMPT =
  'EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'qwen58dxReview'): string[] {
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
  'docs/qwen2-5-vl-7b-58dw-retry-2-result.md',
  'src/backend/mock/mock-qwen2-5-vl-58dw-retry-2-result.ts',
  'model-routing-policy.md',
  'video-understanding-report.md',
  'approved-plan-snapshot-policy.md',
  'intent-led-edit-planning.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/qwen2-5-vl-58dx-private-inference-result-review-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'accepted for explicit external-agent gate: true',
  '`readyForExternalAgentExecutionNow=true`',
  '`requiresLivePreflightBeforeRuntime=true`',
  '`boundedApprovedFixtureOnly=true`',
  '`privateInvokeReady=true`',
  '`rawChatExecutionAllowed=false`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`creditMutationCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  '`GPUS_ALL_REGIONS` quota',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Review doc missing ${required}`)
}

const review = QWEN2_5_VL_58DX_PRIVATE_INFERENCE_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(review.mode, 'qwen2_5_vl_58dx_private_inference_result_review')
assert.equal(review.reviewedRun.runId, 'qwen58dw-20260701T195325')
assert.equal(review.reviewedRun.status, 'passed')
assert.equal(review.reviewedRun.jobExitCode, 0)
assert.equal(review.reviewedRun.selectedGpu, 'nvidia_l4')
assert.equal(review.reviewedRun.serviceMinimumInstances, 0)
assert.equal(review.reviewedRun.serviceRestoredFailClosed, true)
assert.equal(review.acceptedEvidence.retry2PassedAccepted, true)
assert.equal(review.acceptedEvidence.strictStructuredOutputFixAccepted, true)
assert.equal(review.acceptedEvidence.acceptedForExplicitExternalAgentGate, true)
assert.equal(review.externalAgentGate.readyForExplicitToolGate, true)
assert.equal(review.externalAgentGate.requiresLivePreflightBeforeRuntime, true)
assert.equal(review.externalAgentGate.requiresApprovedSnapshotBeforeExecution, true)
assert.equal(review.externalAgentGate.requiresStructuredToolEnvelopeBeforeExecution, true)
assert.equal(review.externalAgentGate.rawChatExecutionAllowed, false)
assert.equal(review.externalAgentGate.boundedApprovedFixtureOnly, true)
assert.equal(review.externalAgentGate.idleGpuAllowed, false)
assert.equal(review.externalAgentGate.serviceMinimumInstances, 0)
assert.equal(review.blockedEvidence.betaReady, false)
assert.equal(review.blockedEvidence.productionReady, false)
assert.equal(review.blockedEvidence.generatedAssetCreationReady, false)
assert.equal(review.runtimeFlags.resultReviewRecorded, true)
assert.equal(review.runtimeFlags.retry2PassedAccepted, true)
assert.equal(review.runtimeFlags.acceptedForExplicitExternalAgentGate, true)
assert.equal(review.runtimeFlags.readyForExternalAgentExecutionNow, true)
assert.equal(review.runtimeFlags.requiresLivePreflightBeforeRuntime, true)
assert.equal(review.runtimeFlags.boundedApprovedFixtureOnly, true)
assert.equal(review.runtimeFlags.privateInvokeReady, true)
assertFalseFlags(review.runtimeFlags, [
  'betaReady',
  'productionReady',
  'paidProductionReady',
  'broadRuntimeReady',
  'rawChatExecutionAllowed',
  'providerCallsMade',
  'workersDispatchedNow',
  'supabaseTouched',
  'sqlExecuted',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'mediaProcessingRun',
  'renderExportRun',
  'creditMutationCreated',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assert.equal(review.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, review })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: review.decision,
      acceptedForExplicitExternalAgentGate:
        review.runtimeFlags.acceptedForExplicitExternalAgentGate,
      readyForExternalAgentExecutionNow: review.runtimeFlags.readyForExternalAgentExecutionNow,
      privateInvokeReady: review.runtimeFlags.privateInvokeReady,
      betaReady: review.runtimeFlags.betaReady,
      productionReady: review.runtimeFlags.productionReady,
      generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
      signedUrlsCreated: review.runtimeFlags.signedUrlsCreated,
      generatedLocalFixturePassedClaimed: review.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: review.nextPrompt,
    },
    null,
    2,
  ),
)
