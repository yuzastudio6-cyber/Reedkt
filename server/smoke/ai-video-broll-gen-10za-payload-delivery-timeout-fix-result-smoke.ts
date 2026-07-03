import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10ZB_FIXED_DELIVERY_RETRY_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10za-payload-delivery-timeout-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.md'
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10za-payload-delivery-timeout-fix.md'
const NEXT_PROMPT_PATH =
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10zb-no-idle-l4-payload-install-retry-with-fixed-delivery.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10za-payload-delivery-timeout-fix-result'
const DECISION = 'ai_video_broll_gen_10za_payload_delivery_timeout_fix_applied_no_vm_archive_chunk_strategy_selected'
const ACTIVE_BLOCKER = 'broll_10zb_no_idle_l4_payload_install_retry_with_fixed_delivery_required'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10zaResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['cloud storage URI', /\bgs:\/\/\S+/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['private key value', /\bprivate[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['ssh public key material', /\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/i],
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
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.ts',
  'server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts',
  'server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts',
  'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
  'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
  'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
  'docs/ai-video-broll-wan-gpu-global-quota-verify-result.md',
  'docs/external-agent-tool-execution-readiness-rollup.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const nextPrompt = read(NEXT_PROMPT_PATH)
const rollupDoc = read('docs/external-agent-tool-execution-readiness-rollup.md')

for (const required of [
  DECISION,
  'no VM/no model/no inference',
  'recursively copying the full 2.8 GB Python 3.12 wheelhouse directory over IAP',
  'Selected strategy: `pre_vm_local_tar_gzip_archive_split_chunks_iap_transfer_with_sha256_reassembly`',
  'Build a deterministic local `tar.gz` archive',
  'Split the archive into bounded chunks',
  'Verify the remote archive sha256',
  'Run offline dependency install only after payload validation',
  'Keep model import and model inference blocked',
  'Previous active blocker: `broll_10za_payload_delivery_timeout_fix_required`',
  `New active blocker: \`${ACTIVE_BLOCKER}\``,
  AI_VIDEO_BROLL_GEN_10ZB_FIXED_DELIVERY_RETRY_PROMPT,
  '`computeVmCreated=false`',
  '`localArchiveCreated=false`',
  '`modelImportRun=false`',
  '`modelInferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
]) {
  assert.equal(doc.includes(required), true, `10ZA result doc missing ${required}`)
}

for (const required of [
  'Required Pre-VM Local Packaging',
  'Stop without VM creation if any package artifact is missing or invalid.',
  'Transfer archive chunks sequentially over IAP with per-chunk checkpoints.',
  'Run dependency import readiness without model import.',
  'Do not commit them.',
  'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
  'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
  'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN',
]) {
  assert.equal(nextPrompt.includes(required), true, `10ZB prompt missing ${required}`)
}
assert.equal(
  nextPrompt.includes('docs/ai-video-broll-wan-fast-cache-readiness-result.md'),
  false,
  '10ZB prompt must not reference missing cache readiness result doc',
)

const result = AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10za_payload_delivery_timeout_fix_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.boundaryPhrase, 'no VM/no model/no inference')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.rootCauseAddressed.failureClass, 'iap_recursive_wheelhouse_transfer_timeout')
assert.equal(result.rootCauseAddressed.recursiveIapScpMustNotBeRetried, true)
assert.equal(
  result.selectedPayloadDeliveryStrategy.id,
  'pre_vm_local_tar_gzip_archive_split_chunks_iap_transfer_with_sha256_reassembly',
)
assert.equal(result.selectedPayloadDeliveryStrategy.localArchiveCreatedNow, false)
assert.equal(result.selectedPayloadDeliveryStrategy.futureLocalArchiveRequiredBeforeVmCreate, true)
assert.equal(result.selectedPayloadDeliveryStrategy.futureChunkManifestRequiredBeforeVmCreate, true)
assert.equal(result.selectedPayloadDeliveryStrategy.futureVmMayOnlyStartAfterLocalPayloadPackageReady, true)
assert.equal(result.selectedPayloadDeliveryStrategy.chunkSizeMiB, 512)
assert.equal(result.selectedPayloadDeliveryStrategy.remoteArchiveSha256Required, true)
assert.equal(result.futurePayloadPackageShape.expectedWheelCount, 66)
assert.equal(result.futurePayloadPackageShape.expectedWheelhouseBytes, 2802483442)
assert.equal(result.futurePayloadPackageShape.archivePathCommittedToRepo, false)
assert.equal(result.futurePayloadPackageShape.chunksCommittedToRepo, false)
assert.equal(result.rejectedStrategies.every((strategy) => strategy.rejected), true)
assert.equal(result.futureRunnerRequirements.runLocalPayloadPackagingBeforeVmCreate, true)
assert.equal(result.futureRunnerRequirements.verifyArchiveSha256BeforeVmCreate, true)
assert.equal(result.futureRunnerRequirements.transferChunksSequentiallyWithPerChunkCheckpoints, true)
assert.equal(result.futureRunnerRequirements.modelImportAllowed, false)
assert.equal(result.futureRunnerRequirements.modelInferenceAllowed, false)
assert.equal(result.externalAgentStateAfterFix.brollPrimaryBlocker, ACTIVE_BLOCKER)
assert.equal(result.externalAgentStateAfterFix.brollReadyForExternalAgentExecutionNow, false)
assert.equal(result.externalAgentStateAfterFix.nextAction, AI_VIDEO_BROLL_GEN_10ZB_FIXED_DELIVERY_RETRY_PROMPT)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must remain false: ${flag}`)
}

assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10ZB_FIXED_DELIVERY_RETRY_PROMPT)
assert.equal(rollupDoc.includes(ACTIVE_BLOCKER), true)
assert.equal(rollupDoc.includes(AI_VIDEO_BROLL_GEN_10ZB_FIXED_DELIVERY_RETRY_PROMPT), true)

const forbiddenFindings = scanForbiddenValues({ doc, nextPrompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      selectedPayloadDeliveryStrategy: result.selectedPayloadDeliveryStrategy.id,
      activeBlocker: result.externalAgentStateAfterFix.brollPrimaryBlocker,
      futureVmMayOnlyStartAfterLocalPayloadPackageReady:
        result.selectedPayloadDeliveryStrategy.futureVmMayOnlyStartAfterLocalPayloadPackageReady,
      localArchiveCreated: result.runtimeSideEffects.localArchiveCreated,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      modelImportRun: result.runtimeSideEffects.modelImportRun,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
