import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const reportPath = 'docs/beta-readiness/local-accepted-evidence-bundle/2026-06-29-current-source-16-tool-local-accepted-evidence-bundle.json'
const markdownPath = 'docs/beta-readiness/local-accepted-evidence-bundle/2026-06-29-current-source-16-tool-local-accepted-evidence-bundle.md'

const report = JSON.parse(readFileSync(reportPath, 'utf8')) as {
  decision?: string
  sourceSha?: string
  previewOnly?: boolean
  noBackendEvidenceRecorded?: boolean
  readyToRecordDeployedEvidence?: boolean
  locallyAcceptedToolCount?: number
  locallyAcceptedToolIds?: string[]
  coreAcceptedToolIds?: string[]
  libassAcceptedToolIds?: string[]
  coreEvidence?: {
    readinessBinIncludedInPath?: boolean
    guardrailObserved?: { missingSignalsmithBinaryFailedClosed?: boolean; summary?: string }
  }
  libassEvidence?: {
    containerImage?: string
    network?: string
    syntheticBurninQa?: {
      syntheticOnly?: boolean
      fontDiscoveryOk?: boolean
      burninCommandOk?: boolean
      decodeProbeOk?: boolean
      safeStylePresetAccepted?: boolean
      tempRootRemoved?: boolean
      noPrivateOrUserMedia?: boolean
      noNetwork?: boolean
      outputVideo?: { checksumSha256?: string; durationSeconds?: number; sizeBytes?: number }
    }
  }
  remainingGateBlockers?: string[]
  nextSafeActions?: string[]
  blockedActionScope?: string[]
  allowedForwardProgressScopes?: string[]
  blockedScopeConfirmations?: Record<string, boolean>
  supabaseClassification?: { write?: string; environment?: string; sql?: string; migration?: string }
}
const markdown = readFileSync(markdownPath, 'utf8')

const expectedTools = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'sharp',
  'duckdb',
  'polars',
  'pyscenedetect',
  'opencv',
  'opencolorio',
  'openimageio',
  'audioflux',
  'signalsmith_stretch',
  'libass',
]

assert.equal(report.decision, 'beta_tools_current_source_local_accepted_evidence_bundle_passed_ready_for_deployed_staging_evidence_recording')
assert.equal(report.sourceSha, 'd47015e88943dd4760dd9eb6ee45ad0f8ead15ca')
assert.equal(report.previewOnly, true)
assert.equal(report.noBackendEvidenceRecorded, true)
assert.equal(report.readyToRecordDeployedEvidence, true)
assert.equal(report.locallyAcceptedToolCount, expectedTools.length)
assert.deepEqual([...(report.locallyAcceptedToolIds ?? [])].sort(), [...expectedTools].sort())
assert.deepEqual(report.libassAcceptedToolIds, ['libass'])
assert.equal(report.coreAcceptedToolIds?.includes('pyav'), true)
assert.equal(report.coreAcceptedToolIds?.includes('pyscenedetect'), true)
assert.equal(report.coreAcceptedToolIds?.includes('audioflux'), true)
assert.equal(report.coreAcceptedToolIds?.includes('signalsmith_stretch'), true)
assert.equal(report.coreEvidence?.readinessBinIncludedInPath, true)
assert.equal(report.coreEvidence?.guardrailObserved?.missingSignalsmithBinaryFailedClosed, true)
assert.equal(report.coreEvidence?.guardrailObserved?.summary?.includes('14 accepted tools'), true)
assert.equal(report.coreEvidence?.guardrailObserved?.summary?.includes('automatically prepended .reeditpro-tool-readiness-bin'), true)
assert.equal(report.libassEvidence?.network, 'none')
assert.equal(report.libassEvidence?.syntheticBurninQa?.syntheticOnly, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.fontDiscoveryOk, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.burninCommandOk, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.decodeProbeOk, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.safeStylePresetAccepted, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.tempRootRemoved, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.noPrivateOrUserMedia, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.noNetwork, true)
assert.equal(report.libassEvidence?.syntheticBurninQa?.outputVideo?.durationSeconds, 1)
assert.equal(report.libassEvidence?.syntheticBurninQa?.outputVideo?.checksumSha256, '301ee872212d00c243c8d220a0552157bdebc7766238cc178353089de6b912a8')
assert.ok((report.libassEvidence?.syntheticBurninQa?.outputVideo?.sizeBytes ?? 0) > 0)

for (const blocker of [
  'deployed_core_real_check_evidence_recording_pending',
  'deployed_libass_qa_evidence_recording_pending',
  'platform_billing_deployment_evidence_pending',
  'launch_owner_approval_evidence_pending',
  'final_operator_status_readback_pending',
]) {
  assert.equal(report.remainingGateBlockers?.includes(blocker), true, `missing remaining blocker ${blocker}`)
}

assert.equal(report.nextSafeActions?.some((action) => action.includes('beta:tools:core-real-check-evidence-preflight')), true)
assert.equal(report.nextSafeActions?.some((action) => action.includes('beta:tools:libass-synthetic-burnin-qa-evidence-preflight')), true)
assert.equal(report.nextSafeActions?.some((action) => action.includes('beta:platform:staging-evidence-preflight')), true)
assert.equal(report.nextSafeActions?.some((action) => action.includes('beta:readiness:launch-approval-evidence-preflight')), true)
assert.equal(report.nextSafeActions?.some((action) => action.includes('beta:readiness:operator-status-api')), true)
assert.equal(report.blockedActionScope?.includes('external_beta_user_exposure'), true)
assert.equal(report.blockedActionScope?.includes('paid_production'), true)
assert.equal(report.allowedForwardProgressScopes?.includes('deployed_evidence_preflight'), true)
assert.equal(report.allowedForwardProgressScopes?.includes('owner_approval_collection'), true)

for (const [key, value] of Object.entries(report.blockedScopeConfirmations ?? {})) {
  assert.equal(value, false, `${key} must remain false`)
}

assert.deepEqual(report.supabaseClassification, {
  write: 'no',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})

assert.equal(markdown.includes('external beta or production'), true)
assert.equal(markdown.includes('no write / environment none / SQL none / migration no'), true)
assert.equal(markdown.includes('beta:tools:core-real-check-evidence-preflight'), true)
assert.equal(markdown.includes('beta:tools:libass-synthetic-burnin-qa-evidence-preflight'), true)

const serialized = JSON.stringify(report).toLowerCase()
assert.equal(/(gho_|service_role|bearer\s+[a-z0-9_\-.]+)/i.test(serialized), false, 'snapshot must not contain token-like material')
assert.equal(markdown.toLowerCase().includes('40+ tools proven end-to-end'), false, 'snapshot must not claim 40+ tools end-to-end')

console.log(JSON.stringify({
  ok: true,
  reportPath,
  locallyAcceptedToolCount: report.locallyAcceptedToolCount,
  remainingGateBlockers: report.remainingGateBlockers,
}, null, 2))
