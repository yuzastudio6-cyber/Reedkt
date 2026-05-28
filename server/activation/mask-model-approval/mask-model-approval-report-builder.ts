import { listMaskModelApprovalCandidates } from './mask-model-candidate-registry'
import { evaluateMaskModelApprovalPolicy, maskProductionApprovalBlockers } from './mask-model-approval-policy'
import { listMaskModelLicenseEvidence } from './mask-model-license-evidence'
import { buildBiRefNetMaskModelStoragePlan } from './mask-model-storage-plan'
import { buildMaskModelDownloadCommandPlan } from './mask-model-download-command-plan'
import { buildMaskModelApprovalBlockers } from './mask-model-approval-blocker-policy'
import {
  buildBlockedMaskModelWeightManifests,
  buildEvaluatedMaskModelWeightManifests,
  buildMaskModelWeightManifest,
} from './mask-model-manifest-writer'
import type { MaskModelApprovalReport } from './mask-model-approval-types'

export const MASK_MODEL_APPROVAL_REPORT_ID = 'activation-phase-33a-mask-model-approval'

export function buildMaskModelApprovalReport(): MaskModelApprovalReport {
  const candidates = listMaskModelApprovalCandidates()
  const evidenceSummary = listMaskModelLicenseEvidence()
  const storagePlan = buildBiRefNetMaskModelStoragePlan()
  const downloadCommandPlan = buildMaskModelDownloadCommandPlan(storagePlan)
  const decisions = candidates.map((candidate) => evaluateMaskModelApprovalPolicy({
    candidate,
    evidence: evidenceSummary.filter((evidence) => evidence.modelCandidateId === candidate.candidateId),
    storagePlan,
  }))
  const biRefNetCandidate = candidates.find((candidate) => candidate.candidateId === 'zhengpeng7_birefnet')
  const biRefNetManifest = biRefNetCandidate ? buildMaskModelWeightManifest(biRefNetCandidate) : undefined
  const approvedModels = biRefNetManifest?.reviewStatus === 'staging_approved_for_single_frame_mask_test' ? [biRefNetManifest] : []
  const blockedModels = [
    ...buildBlockedMaskModelWeightManifests(candidates),
    ...buildEvaluatedMaskModelWeightManifests(candidates),
  ]
  const evaluatedOnlyModels = candidates.filter((candidate) => candidate.statuses.includes('evaluated_only') || candidate.statuses.includes('upstream_evidence'))
  const blockerEvaluation = buildMaskModelApprovalBlockers({
    decisions,
    approvedManifest: approvedModels[0],
    storagePlan,
    downloadCommandPlan,
  })

  return {
    reportId: MASK_MODEL_APPROVAL_REPORT_ID,
    createdAt: new Date().toISOString(),
    approvedModels,
    blockedModels,
    evaluatedOnlyModels,
    evidenceSummary,
    storagePlan,
    downloadCommandPlan,
    blockers: blockerEvaluation.blockers,
    warnings: Array.from(new Set([
      ...blockerEvaluation.warnings,
      ...maskProductionApprovalBlockers(),
      'Phase 33A does not download BiRefNet or SAM2 weights.',
      'Phase 33A does not deploy GPU, process frames/video, run masks, or run text-behind-subject.',
    ])),
    phase33BReadiness: {
      ready: approvedModels.length === 1 && blockerEvaluation.blockers.length === 0,
      blockers: approvedModels.length === 1 && blockerEvaluation.blockers.length === 0 ? [] : ['BiRefNet staging approval workflow is not complete.'],
      warnings: ['Phase 33B may download only ZhengPeng7/BiRefNet to private staging storage; no SAM2 download.'],
    },
    phase33CReadiness: {
      ready: false,
      blockers: ['BiRefNet weights are not downloaded and checksummed yet.', 'GPU/runtime verification plan is not prepared in Phase 33A.'],
      warnings: ['Phase 33C remains blocked until Phase 33B records private storage and checksum evidence.'],
    },
    phase33DReadiness: {
      ready: false,
      blockers: ['Mask runtime verification has not passed.', 'Text-behind-subject execution remains blocked until mask QA passes.'],
      warnings: ['Phase 33D remains blocked until runtime verification creates safe private mask QA evidence.'],
    },
    modelDownloadExecuted: false,
    providerExecuted: false,
    gpuDeployed: false,
    frameOrVideoProcessed: false,
    maskExecutionRan: false,
    textBehindSubjectExecutionRan: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeMaskModelApprovalReport(report: MaskModelApprovalReport): string {
  return [
    `Mask model approval report: ${report.reportId}`,
    `Approved models: ${report.approvedModels.length}`,
    `Blocked/evaluated manifests: ${report.blockedModels.length}`,
    `Evaluated-only candidates: ${report.evaluatedOnlyModels.length}`,
    `Evidence records: ${report.evidenceSummary.length}`,
    `Download commands: ${report.downloadCommandPlan.length} (text-only)`,
    `Blockers: ${report.blockers.length}`,
    `Phase 33B ready: ${report.phase33BReadiness.ready}`,
    `Phase 33C ready: ${report.phase33CReadiness.ready}`,
    `Phase 33D ready: ${report.phase33DReadiness.ready}`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Approved:',
    ...(report.approvedModels.length
      ? report.approvedModels.map((model) => `- ${model.modelWeightManifestId}: ${model.modelName} (${model.reviewStatus})`)
      : ['- none']),
    '',
    'Evaluated/Blocked:',
    ...(report.blockedModels.length
      ? report.blockedModels.map((model) => `- ${model.modelWeightManifestId}: ${model.modelName} (${model.reviewStatus})`)
      : ['- none']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
