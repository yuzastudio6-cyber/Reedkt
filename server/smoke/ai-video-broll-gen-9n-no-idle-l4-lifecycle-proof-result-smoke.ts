import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_9N_NO_IDLE_L4_LIFECYCLE_PROOF_RESULT,
  AI_VIDEO_BROLL_GEN_9O_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md'
const PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result'
const DECISION = 'ai_video_broll_gen_9n_no_idle_l4_lifecycle_proof_passed_cleanup_verified'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll9nResult'): string[] {
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
  'docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9n-no-idle-l4-proof-execute-us-central1-c.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(PROMPT_PATH)
for (const required of [
  DECISION,
  '`us-central1-c`',
  '`g2-standard-4`',
  '`nvidia_l4`',
  '`computeVmCreateAttempted=true`',
  '`computeVmCreated=true`',
  '`computeVmDeleted=true`',
  '`externalIpCreated=false`',
  '`cleanupVerified=true`',
  '`iapTransferExecuted=false`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedVideoCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  AI_VIDEO_BROLL_GEN_9O_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `9N result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_9O_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT,
  'create at most one no-public-IP `g2-standard-4` VM',
  'verify the created VM has no external NAT IP',
  'transfer or validate transfer of the approved private Python 3.12 wheelhouse over IAP only',
  'Stop before VM create if any preflight check fails',
  'model inference',
  '`generated_local_fixture_passed` claim',
]) {
  assert.equal(prompt.includes(required), true, `9O prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_9N_NO_IDLE_L4_LIFECYCLE_PROOF_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_9n_no_idle_l4_lifecycle_proof_result')
assert.equal(result.lifecycleStatus, 'passed')
assert.equal(result.lifecycleBlocker, 'none')
assert.equal(result.targetZone, 'us-central1-c')
assert.equal(result.selectedGpu, 'nvidia_l4')
assert.equal(result.machineType, 'g2-standard-4')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.freshPreflight.projectMatches, true)
assert.equal(result.freshPreflight.accessTokenRefreshPassed, true)
assert.equal(result.freshPreflight.imageFamilyReady, true)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(result.freshPreflight.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(result.freshPreflight.regionalL4QuotaLimit, 1)
assert.equal(result.freshPreflight.regionalL4QuotaUsage, 0)
assert.equal(result.freshPreflight.existingProofInstancePresent, false)
assert.equal(result.freshPreflight.existingProofDiskPresent, false)
assert.equal(result.freshPreflight.proofServiceAccountValueStored, false)
assert.equal(result.lifecycleAttempt.computeVmCreateAttempted, true)
assert.equal(result.lifecycleAttempt.createSucceeded, true)
assert.equal(result.lifecycleAttempt.externalNatIpPresent, false)
assert.equal(result.lifecycleAttempt.deleteAttempted, true)
assert.equal(result.lifecycleAttempt.deleteSucceeded, true)
assert.equal(result.lifecycleAttempt.cleanupVerified, true)
assert.equal(result.cleanupState.instanceAbsentAfterCleanup, true)
assert.equal(result.cleanupState.diskAbsentAfterCleanup, true)
assert.equal(result.cleanupState.addressAbsentAfterCleanup, true)
assert.equal(result.cleanupState.reservationAbsentAfterCleanup, true)
assert.equal(result.runtimeSideEffects.computeVmCreateAttempted, true)
assert.equal(result.runtimeSideEffects.computeVmCreated, true)
assert.equal(result.runtimeSideEffects.computeVmDeleted, true)
assert.equal(result.runtimeSideEffects.externalIpCreated, false)
assert.equal(result.runtimeSideEffects.cleanupVerified, true)
for (const [key, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    key === 'computeVmCreateAttempted' ||
    key === 'computeVmCreated' ||
    key === 'computeVmDeleted' ||
    key === 'cleanupVerified'
  ) {
    continue
  }
  assert.equal(value, false, `${key} must remain false`)
}
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_9O_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      lifecycleStatus: result.lifecycleStatus,
      createSucceeded: result.lifecycleAttempt.createSucceeded,
      externalNatIpPresent: result.lifecycleAttempt.externalNatIpPresent,
      deleteSucceeded: result.lifecycleAttempt.deleteSucceeded,
      cleanupVerified: result.lifecycleAttempt.cleanupVerified,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
