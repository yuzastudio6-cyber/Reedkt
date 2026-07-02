import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_9L_STOCKOUT_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_9M_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_A_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-9l-stockout-fix-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9m-no-idle-l4-proof-execute-us-central1-a.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-9l-stockout-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-9l-stockout-fix-result'
const DECISION = 'ai_video_broll_gen_9l_stockout_fix_ready_for_us_central1_a_no_idle_retry_no_vm_no_inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll9lStockoutFix'): string[] {
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

for (const file of [
  DOC_PATH,
  PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-9l-stockout-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-central1-b`',
  '`ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS`',
  '| `us-central1-a` | `us-central1` | `UP` | true | true | limit `1`, usage `0` |',
  '| `us-central1-c` | `us-central1` | `UP` | true | true | limit `1`, usage `0` |',
  'Select `us-central1-a` as the next bounded no-idle lifecycle proof target.',
  '`us-central1-c` remains the second same-region candidate',
  '`gcpReadOnlyCommandsExecuted=true`',
  '`alternateZoneSelected=true`',
  '`selectedRetryZone=us-central1-a`',
  '`vmCreated=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_9M_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_A_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `9L stockout fix doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_9M_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_A_PROMPT,
  'create at most one prompt-scoped no-public-IP `g2-standard-4` VM',
  'Stop before VM create if any preflight check fails',
  'model inference',
  '`generated_local_fixture_passed` claim',
]) {
  assert.equal(prompt.includes(required), true, `9M prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_9L_STOCKOUT_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_9l_stockout_fix_result')
assert.equal(result.priorBlockedZone, 'us-central1-b')
assert.equal(result.priorBlocker, 'ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS')
assert.equal(result.selectedRetryZone, 'us-central1-a')
assert.equal(result.secondSameRegionCandidate, 'us-central1-c')
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.readOnlyChecks.gcpReadOnlyCommandsExecuted, true)
assert.equal(result.readOnlyChecks.projectMatches, true)
assert.equal(result.readOnlyChecks.accessTokenRefreshPassed, true)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.readOnlyChecks.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.instances, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.disks, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.addresses, 0)
assert.equal(result.readOnlyChecks.resourcesMatchingProofName.reservations, 0)
assert.equal(
  result.readOnlyChecks.candidates.some(
    (candidate) =>
      candidate.zone === 'us-central1-a' &&
      candidate.zoneStatus === 'UP' &&
      candidate.machineTypeVisible &&
      candidate.acceleratorVisible &&
      candidate.l4QuotaLimit === 1 &&
      candidate.l4QuotaUsage === 0,
  ),
  true,
)
assert.equal(
  result.selectionRationale.includes('same_region_as_original_target'),
  true,
)
assert.equal(
  result.futureRetryPreflightRequired.includes('proof_vm_disk_address_reservation_absent'),
  true,
)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  assert.equal(value, false, `${key} must remain false`)
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_9M_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_A_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      selectedRetryZone: result.selectedRetryZone,
      secondSameRegionCandidate: result.secondSameRegionCandidate,
      gcpReadOnlyCommandsExecuted: result.readOnlyChecks.gcpReadOnlyCommandsExecuted,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
