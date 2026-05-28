import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildEnhancementModelApprovalReport,
  buildEnhancementModelDownloadCommandPlan,
  buildEnhancementModelWeightManifest,
  buildRealEsrganEnhancementModelStoragePlan,
  enhancementEvidenceForCandidate,
  evaluateEnhancementModelApprovalPolicy,
  getEnhancementModelApprovalCandidate,
  listEnhancementModelLicenseEvidence,
} from '../activation/enhancement-model-approval'

const realEsrgan = getEnhancementModelApprovalCandidate('xinntao_real_esrgan_x4plus')
assert.ok(realEsrgan, 'Real-ESRGAN candidate must exist.')
assert.equal(realEsrgan.modelName, 'RealESRGAN_x4plus')
assert.equal(realEsrgan.canApproveForStagingSampleFirstEnhancement, true)

const realEsrganEvidence = enhancementEvidenceForCandidate('xinntao_real_esrgan_x4plus')
assert.ok(realEsrganEvidence.some((evidence) => evidence.sourceUrl === 'https://github.com/xinntao/Real-ESRGAN'), 'Real-ESRGAN GitHub evidence must include source URL.')
assert.ok(realEsrganEvidence.some((evidence) => evidence.licenseClaim.toLowerCase().includes('bsd-3-clause')), 'Real-ESRGAN evidence must include BSD-3-Clause license claim.')
assert.ok(realEsrganEvidence.some((evidence) => /restoration|upscaling|enhancement/i.test(evidence.notes.join(' '))), 'Real-ESRGAN task evidence must include restoration/upscaling/enhancement.')

const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
const realEsrganDecision = evaluateEnhancementModelApprovalPolicy({
  candidate: realEsrgan,
  evidence: realEsrganEvidence,
  storagePlan,
})
assert.equal(realEsrganDecision.stagingSampleFirstEnhancementAllowed, true, 'Real-ESRGAN must be allowed only for staging sample-first enhancement.')
assert.equal(realEsrganDecision.productionAllowed, false, 'Real-ESRGAN production must remain blocked.')
assert.equal(realEsrganDecision.externalBetaAllowed, false, 'Real-ESRGAN external beta must remain blocked.')
assert.equal(realEsrganDecision.broadRealUserMediaAllowed, false, 'Real-ESRGAN broad real user media must remain blocked.')
assert.equal(realEsrganDecision.fullVideoEnhancementAllowed, false, 'Real-ESRGAN full-video blind enhancement must remain blocked.')

const realEsrganManifest = buildEnhancementModelWeightManifest(realEsrgan)
assert.equal(realEsrganManifest.modelWeightManifestId, 'real_esrgan_x4plus_staging_v1', 'Real-ESRGAN manifest ID must exist.')
assert.equal(realEsrganManifest.checksum, 'missing_until_download', 'Real-ESRGAN checksum must remain missing until download.')
assert.equal(storagePlan.privateStorageRequired, true, 'Real-ESRGAN storage must be private.')
assert.ok(storagePlan.stagingStoragePath.includes('reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/'), 'Real-ESRGAN storage path must use private generated-assets model weights.')
assert.ok(!storagePlan.stagingStoragePath.includes('source-media'), 'Real-ESRGAN storage plan must not use source-media bucket.')
assert.equal(storagePlan.publicAccessAllowed, false, 'Real-ESRGAN storage plan must not allow public access.')

const downloadPlan = buildEnhancementModelDownloadCommandPlan(storagePlan)
assert.ok(downloadPlan.length > 0, 'Real-ESRGAN download command plan must exist.')
assert.ok(downloadPlan.every((plan) => plan.executionMode === 'text_only'), 'download command plan must be text-only.')
assert.ok(downloadPlan.every((plan) => plan.safeToRunNow === false), 'download command plan must not execute now.')
assert.ok(downloadPlan.every((plan) => !/HUGGINGFACE_TOKEN=|docker\s+run|provider/i.test(plan.commandString)), 'download command plan must not print tokens or execute providers/cloud containers.')

const film = getEnhancementModelApprovalCandidate('google_research_film')
assert.ok(film, 'FILM candidate must exist.')
const allEvidence = listEnhancementModelLicenseEvidence()
assert.ok(allEvidence.some((evidence) => evidence.modelCandidateId === 'google_research_film' && evidence.sourceUrl === 'https://github.com/google-research/frame-interpolation'), 'FILM GitHub evidence must include source URL.')
assert.ok(allEvidence.some((evidence) => evidence.modelCandidateId === 'google_research_film' && evidence.licenseClaim.toLowerCase() === 'apache-2.0'), 'FILM evidence must include Apache-2.0 claim.')
const filmDecision = evaluateEnhancementModelApprovalPolicy({ candidate: film, evidence: enhancementEvidenceForCandidate('google_research_film'), storagePlan })
assert.equal(filmDecision.filmExecutionAllowed, false, 'FILM execution must remain blocked.')
assert.equal(filmDecision.filmDownloadAllowed, false, 'FILM download must remain blocked.')
assert.equal(filmDecision.slowMotionExecutionAllowed, false, 'Slow-motion execution must remain blocked.')

for (const blockedId of ['deepfilternet_model', 'demucs_model', 'paddleocr_gpu_model', 'provider_models', 'revideo_runtime']) {
  const blocked = getEnhancementModelApprovalCandidate(blockedId)
  assert.ok(blocked, `${blockedId} candidate must exist.`)
  const decision = evaluateEnhancementModelApprovalPolicy({ candidate: blocked, evidence: [], storagePlan })
  assert.equal(decision.stagingSampleFirstEnhancementAllowed, false, `${blockedId} must remain blocked.`)
  assert.equal(decision.productionAllowed, false, `${blockedId} production must remain blocked.`)
}

const report = buildEnhancementModelApprovalReport()
assert.equal(report.approvedModels.length, 1, 'only RealESRGAN_x4plus may be approved.')
assert.equal(report.approvedModels[0].modelName, 'RealESRGAN_x4plus')
assert.ok(report.evaluatedOnlyModels.some((candidate) => candidate.candidateId === 'google_research_film'), 'FILM must be evaluated-only.')
assert.equal(report.productionReadyAllowed, false, 'report must keep productionReadyAllowed=false.')
assert.equal(report.externalBetaAllowed, false, 'report must keep externalBetaAllowed=false.')
assert.equal(report.broadRealUserMediaAllowed, false, 'report must keep broadRealUserMediaAllowed=false.')
assert.equal(report.modelDownloadExecuted, false, 'Phase 34A must not download models.')
assert.equal(report.gpuDeployed, false, 'Phase 34A must not deploy GPU.')
assert.equal(report.enhancementExecutionRan, false, 'Phase 34A must not run enhancement.')
assert.equal(report.slowMotionExecutionRan, false, 'Phase 34A must not run slow motion.')
assert.equal(report.phase34BReadiness.ready, true, 'Phase 34B should be ready only for Real-ESRGAN download planning.')
assert.equal(report.phase34CReadiness.ready, false, 'Phase 34C remains blocked until weights/checksum exist.')
assert.equal(report.phase34DReadiness.ready, false, 'Phase 34D remains blocked until runtime verification passes.')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:enhancement-model-approval:plan'], 'package.json must include activation:enhancement-model-approval:plan.')
assert.ok(packageJson.scripts['activation:enhancement-model-approval:report'], 'package.json must include activation:enhancement-model-approval:report.')
assert.ok(packageJson.scripts['activation:enhancement-model-weight:summary'], 'package.json must include activation:enhancement-model-weight:summary.')
assert.ok(packageJson.scripts['smoke:activation-enhancement-model-approval-workflow'], 'package.json must include enhancement model approval smoke.')
const scriptText = [
  packageJson.scripts['activation:enhancement-model-approval:plan'],
  packageJson.scripts['activation:enhancement-model-approval:report'],
  packageJson.scripts['activation:enhancement-model-weight:summary'],
  packageJson.scripts['smoke:activation-enhancement-model-approval-workflow'],
].join('\n')
assert.ok(!/wget|curl|snapshot_download|docker\s+run|gcloud|provider/i.test(scriptText), 'npm scripts must remain static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: 28,
  approvedModel: report.approvedModels[0].modelName,
  phase34BReady: report.phase34BReadiness.ready,
  phase34CReady: report.phase34CReadiness.ready,
  phase34DReady: report.phase34DReadiness.ready,
}))
