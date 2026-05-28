import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getApprovedModelDownloadEvidence } from '../activation/model-download/approved-model-download-evidence'
import {
  buildFasterWhisperTinyStoragePlan,
  buildModelApprovalReport,
  buildModelDownloadCommandPlan,
  buildModelWeightManifest,
  evaluateModelApprovalPolicy,
  evidenceForCandidate,
  getModelApprovalCandidate,
  listModelApprovalCandidates,
  listModelLicenseEvidence,
} from '../activation/model-approval'

const tiny = getModelApprovalCandidate('systran_faster_whisper_tiny')
assert.ok(tiny, 'Systran/faster-whisper-tiny candidate must exist.')
assert.equal(tiny.modelName, 'Systran/faster-whisper-tiny')
assert.equal(tiny.canApproveForStagingSpeechCaption, true)

const tinyEvidence = evidenceForCandidate('systran_faster_whisper_tiny')
assert.ok(tinyEvidence.some((evidence) => evidence.sourceUrl === 'https://huggingface.co/Systran/faster-whisper-tiny'), 'tiny evidence must include source URL.')
assert.ok(tinyEvidence.some((evidence) => evidence.licenseClaim === 'mit'), 'tiny evidence must include MIT license claim.')

const allEvidence = listModelLicenseEvidence()
assert.ok(allEvidence.some((evidence) => evidence.modelCandidateId === 'openai_whisper_tiny_upstream'), 'OpenAI upstream evidence must exist.')
assert.ok(allEvidence.some((evidence) => evidence.evidenceId === 'openai_whisper_github_mit' && evidence.licenseClaim === 'mit'), 'OpenAI GitHub MIT evidence must be recorded.')
assert.ok(allEvidence.some((evidence) => evidence.evidenceId === 'openai_whisper_tiny_hf_apache_discrepancy' && evidence.licenseClaim === 'apache-2.0'), 'OpenAI HF Apache discrepancy must be recorded.')
assert.ok(allEvidence.some((evidence) => evidence.evidenceId === 'faster_whisper_pypi_runtime'), 'faster-whisper runtime evidence must exist.')
assert.ok(allEvidence.some((evidence) => evidence.evidenceId === 'ctranslate2_pypi_runtime'), 'CTranslate2 runtime evidence must exist.')

const storagePlan = buildFasterWhisperTinyStoragePlan()
const tinyDecision = evaluateModelApprovalPolicy({
  candidate: tiny,
  evidence: tinyEvidence,
  storagePlan,
})
assert.equal(tinyDecision.stagingSpeechCaptionAllowed, true, 'tiny must be allowed for staging speech/caption.')
assert.equal(tinyDecision.productionAllowed, false, 'production must be blocked by default.')
assert.equal(tinyDecision.externalBetaAllowed, false, 'external beta must be blocked by default.')
assert.equal(tinyDecision.paidProductionAllowed, false, 'paid production must be blocked by default.')

for (const blockedId of ['birefnet_model', 'sam2_checkpoint', 'deepfilternet_model', 'demucs_model', 'real_esrgan_model', 'film_model']) {
  const blocked = getModelApprovalCandidate(blockedId)
  assert.ok(blocked, `${blockedId} candidate must exist.`)
  const decision = evaluateModelApprovalPolicy({ candidate: blocked, evidence: [], storagePlan })
  assert.equal(decision.stagingSpeechCaptionAllowed, false, `${blockedId} must remain blocked.`)
}

assert.equal(storagePlan.privateStorageRequired, true, 'storage plan must use private staging storage.')
assert.ok(!storagePlan.stagingStoragePath.includes('source-media'), 'storage plan must not use source-media bucket.')
assert.equal(storagePlan.publicAccessAllowed, false, 'storage plan must not allow public access.')
assert.equal(storagePlan.signedUrlSourceOfTruthAllowed, false, 'signed URL must not be source of truth.')

const downloadPlan = buildModelDownloadCommandPlan(storagePlan)
assert.ok(downloadPlan.length > 0, 'download plan must exist.')
assert.ok(downloadPlan.every((plan) => plan.executionMode === 'text_only'), 'download plan must be text-only.')
assert.ok(downloadPlan.every((plan) => plan.safeToRunNow === false), 'download plan must not be safe to run now.')
assert.ok(downloadPlan.every((plan) => !/docker\s+run|gcloud\s+run|provider|SECRET_VALUE|HUGGINGFACE_TOKEN=/i.test(plan.commandString)), 'download plan must not execute providers/gcloud run or print tokens.')

const manifest = buildModelWeightManifest(tiny)
const downloadEvidence = getApprovedModelDownloadEvidence()
assert.equal(manifest.modelWeightManifestId, 'faster_whisper_tiny_staging_v1', 'manifest id must match Phase 26 required id.')
if (downloadEvidence.status === 'verified') {
  assert.equal(manifest.checksum, downloadEvidence.aggregateSha256, 'manifest checksum must match verified download evidence.')
  assert.equal(manifest.resolvedRevision, downloadEvidence.resolvedRevision, 'manifest revision must match verified download evidence.')
} else {
  assert.equal(manifest.checksum, 'missing_until_download', 'manifest checksum must be pending until actual download.')
}
assert.equal(manifest.reviewStatus, 'staging_approved', 'manifest must be staging approved.')
assert.equal(manifest.productionStatus, 'production_blocked')
assert.equal(manifest.externalBetaStatus, 'blocked')
assert.equal(manifest.paidProductionStatus, 'blocked')

const report = buildModelApprovalReport()
assert.equal(report.approvedModels.length, 1, 'only one model may be approved.')
assert.equal(report.approvedModels[0].modelName, 'Systran/faster-whisper-tiny')
assert.ok(report.blockedModels.length >= 6, 'non-speech models must remain blocked.')
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.realUserMediaTestingAllowed, false)
assert.equal(report.modelDownloadExecuted, downloadEvidence.status !== 'not_started')
assert.equal(report.providerExecuted, false)
assert.equal(report.gpuDeployed, false)
assert.equal(report.realUserMediaProcessed, false)
assert.equal(report.phase28Readiness.readyForPlanning, true, 'Phase 28 should be planning-ready after tiny staging approval.')
assert.equal(report.phase28Readiness.readyForExecution, false, 'Phase 28 execution remains blocked until weights are available.')

const base = getModelApprovalCandidate('systran_faster_whisper_base')
assert.equal(base?.status, 'evaluated_only', 'base model must be evaluated only.')
assert.equal(listModelApprovalCandidates().filter((candidate) => candidate.approvedFor.length > 0).length, 1, 'only tiny may have approval scopes.')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:model-weight:summary'], 'package.json must include model weight summary script.')
assert.ok(packageJson.scripts['activation:model-approval:plan'], 'package.json must include model approval plan script.')
assert.ok(packageJson.scripts['activation:model-approval:report'], 'package.json must include model approval report script.')
assert.ok(packageJson.scripts['smoke:activation-model-approval-workflow'], 'package.json must include model approval smoke script.')
const scriptText = [
  packageJson.scripts['activation:model-weight:summary'],
  packageJson.scripts['activation:model-approval:plan'],
  packageJson.scripts['activation:model-approval:report'],
  packageJson.scripts['smoke:activation-model-approval-workflow'],
].join('\n')
assert.ok(!/huggingface-cli|snapshot_download|docker\s+run|gcloud|provider/i.test(scriptText), 'npm scripts must remain static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'tiny_candidate_exists',
    'tiny_license_evidence',
    'openai_upstream_discrepancy_recorded',
    'runtime_evidence',
    'tiny_staging_approved',
    'production_beta_paid_blocked',
    'non_speech_models_blocked',
    'private_storage',
    'download_plan_text_only',
    'manifest_created',
    'phase28_planning_only',
    'package_scripts_static',
  ],
}))
