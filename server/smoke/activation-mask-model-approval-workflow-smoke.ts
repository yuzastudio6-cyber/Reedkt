import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBiRefNetMaskModelStoragePlan,
  buildMaskModelApprovalReport,
  buildMaskModelDownloadCommandPlan,
  buildMaskModelWeightManifest,
  evaluateMaskModelApprovalPolicy,
  getMaskModelApprovalCandidate,
  listMaskModelLicenseEvidence,
  maskEvidenceForCandidate,
} from '../activation/mask-model-approval'

const birefnet = getMaskModelApprovalCandidate('zhengpeng7_birefnet')
assert.ok(birefnet, 'BiRefNet candidate must exist.')
assert.equal(birefnet.modelName, 'ZhengPeng7/BiRefNet')
assert.equal(birefnet.canApproveForStagingSingleFrameBackgroundRemoval, true)

const birefnetEvidence = maskEvidenceForCandidate('zhengpeng7_birefnet')
assert.ok(birefnetEvidence.some((evidence) => evidence.sourceUrl === 'https://huggingface.co/ZhengPeng7/BiRefNet'), 'BiRefNet HF evidence must include source URL.')
assert.ok(birefnetEvidence.some((evidence) => evidence.licenseClaim.toLowerCase() === 'mit'), 'BiRefNet evidence must include MIT license claim.')
assert.ok(birefnetEvidence.some((evidence) => evidence.sourceUrl === 'https://github.com/ZhengPeng7/BiRefNet'), 'BiRefNet GitHub evidence must exist.')

const storagePlan = buildBiRefNetMaskModelStoragePlan()
const birefnetDecision = evaluateMaskModelApprovalPolicy({
  candidate: birefnet,
  evidence: birefnetEvidence,
  storagePlan,
})
assert.equal(birefnetDecision.stagingSingleFrameBackgroundRemovalAllowed, true, 'BiRefNet must be allowed only for staging single-frame background removal.')
assert.equal(birefnetDecision.productionAllowed, false, 'BiRefNet production must remain blocked.')
assert.equal(birefnetDecision.externalBetaAllowed, false, 'BiRefNet external beta must remain blocked.')
assert.equal(birefnetDecision.broadRealUserMediaAllowed, false, 'BiRefNet broad real user media must remain blocked.')

const birefnetManifest = buildMaskModelWeightManifest(birefnet)
assert.equal(birefnetManifest.modelWeightManifestId, 'birefnet_main_staging_v1', 'BiRefNet manifest ID must exist.')
assert.equal(birefnetManifest.checksum, 'missing_until_download', 'BiRefNet checksum must remain missing until download.')
assert.equal(storagePlan.privateStorageRequired, true, 'BiRefNet storage must be private.')
assert.ok(storagePlan.stagingStoragePath.includes('reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/'), 'BiRefNet storage path must use private generated-assets model weights.')
assert.ok(!storagePlan.stagingStoragePath.includes('source-media'), 'BiRefNet storage plan must not use source-media bucket.')
assert.equal(storagePlan.publicAccessAllowed, false, 'BiRefNet storage plan must not allow public access.')

const downloadPlan = buildMaskModelDownloadCommandPlan(storagePlan)
assert.ok(downloadPlan.length > 0, 'BiRefNet download command plan must exist.')
assert.ok(downloadPlan.every((plan) => plan.executionMode === 'text_only'), 'download command plan must be text-only.')
assert.ok(downloadPlan.every((plan) => plan.safeToRunNow === false), 'download command plan must not execute now.')
assert.ok(downloadPlan.every((plan) => !/HUGGINGFACE_TOKEN=|gcloud\s+run|docker\s+run|provider/i.test(plan.commandString)), 'download command plan must not print tokens or execute providers/cloud jobs.')

const sam2 = getMaskModelApprovalCandidate('facebook_sam2_hiera_tiny')
assert.ok(sam2, 'SAM2 HF candidate must exist.')
const allEvidence = listMaskModelLicenseEvidence()
assert.ok(allEvidence.some((evidence) => evidence.modelCandidateId === 'facebook_sam2_hiera_tiny' && evidence.licenseClaim.toLowerCase() === 'apache-2.0'), 'SAM2 HF evidence must include Apache-2.0 claim.')
assert.ok(allEvidence.some((evidence) => evidence.modelCandidateId === 'meta_sam2_official_checkpoints' && evidence.sourceUrl === 'https://github.com/facebookresearch/sam2'), 'SAM2 official GitHub evidence must exist.')
assert.ok(allEvidence.some((evidence) => evidence.evidenceId === 'sam2_official_github_apache_checkpoints' && evidence.licenseClaim.toLowerCase() === 'apache-2.0'), 'SAM2 official evidence must record Apache 2.0 checkpoints/code claim.')

const sam2Decision = evaluateMaskModelApprovalPolicy({ candidate: sam2, evidence: maskEvidenceForCandidate('facebook_sam2_hiera_tiny'), storagePlan })
assert.equal(sam2Decision.sam2ExecutionAllowed, false, 'SAM2 execution must remain blocked.')
assert.equal(sam2Decision.stagingSingleFrameBackgroundRemovalAllowed, false, 'SAM2 must not be staging-approved in Phase 33A.')
assert.equal(sam2Decision.textBehindSubjectExecutionAllowed, false, 'text-behind-subject execution must remain blocked.')

for (const blockedId of ['deepfilternet_model', 'demucs_model', 'real_esrgan_model', 'film_model', 'paddleocr_gpu_model', 'provider_models', 'revideo_runtime']) {
  const blocked = getMaskModelApprovalCandidate(blockedId)
  assert.ok(blocked, `${blockedId} candidate must exist.`)
  const decision = evaluateMaskModelApprovalPolicy({ candidate: blocked, evidence: [], storagePlan })
  assert.equal(decision.stagingSingleFrameBackgroundRemovalAllowed, false, `${blockedId} must remain blocked.`)
  assert.equal(decision.productionAllowed, false, `${blockedId} production must remain blocked.`)
}

const report = buildMaskModelApprovalReport()
assert.equal(report.approvedModels.length, 1, 'only BiRefNet may be approved.')
assert.equal(report.approvedModels[0].modelName, 'ZhengPeng7/BiRefNet')
assert.ok(report.evaluatedOnlyModels.some((candidate) => candidate.candidateId === 'facebook_sam2_hiera_tiny'), 'SAM2 must be evaluated-only.')
assert.equal(report.productionReadyAllowed, false, 'report must keep productionReadyAllowed=false.')
assert.equal(report.externalBetaAllowed, false, 'report must keep externalBetaAllowed=false.')
assert.equal(report.broadRealUserMediaAllowed, false, 'report must keep broadRealUserMediaAllowed=false.')
assert.equal(report.modelDownloadExecuted, false, 'Phase 33A must not download models.')
assert.equal(report.gpuDeployed, false, 'Phase 33A must not deploy GPU.')
assert.equal(report.maskExecutionRan, false, 'Phase 33A must not run masks.')
assert.equal(report.textBehindSubjectExecutionRan, false, 'Phase 33A must not run text-behind-subject.')
assert.equal(report.phase33BReadiness.ready, true, 'Phase 33B should be ready only for BiRefNet download planning.')
assert.equal(report.phase33CReadiness.ready, false, 'Phase 33C remains blocked until weights/checksum exist.')
assert.equal(report.phase33DReadiness.ready, false, 'Phase 33D remains blocked until runtime verification passes.')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:mask-model-approval:plan'], 'package.json must include activation:mask-model-approval:plan.')
assert.ok(packageJson.scripts['activation:mask-model-approval:report'], 'package.json must include activation:mask-model-approval:report.')
assert.ok(packageJson.scripts['activation:mask-model-weight:summary'], 'package.json must include activation:mask-model-weight:summary.')
assert.ok(packageJson.scripts['smoke:activation-mask-model-approval-workflow'], 'package.json must include mask model approval smoke.')
const scriptText = [
  packageJson.scripts['activation:mask-model-approval:plan'],
  packageJson.scripts['activation:mask-model-approval:report'],
  packageJson.scripts['activation:mask-model-weight:summary'],
  packageJson.scripts['smoke:activation-mask-model-approval-workflow'],
].join('\n')
assert.ok(!/huggingface-cli|snapshot_download|docker\s+run|gcloud|provider/i.test(scriptText), 'npm scripts must remain static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: 27,
  approvedModel: report.approvedModels[0].modelName,
  phase33BReady: report.phase33BReadiness.ready,
  phase33CReady: report.phase33CReadiness.ready,
  phase33DReady: report.phase33DReadiness.ready,
}))
