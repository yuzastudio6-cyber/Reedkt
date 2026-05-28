import { listEnhancementModelApprovalCandidates } from './enhancement-model-candidate-registry'
import {
  enhancementProductionApprovalBlockers,
  evaluateEnhancementModelApprovalPolicy,
} from './enhancement-model-approval-policy'
import { listEnhancementModelLicenseEvidence } from './enhancement-model-license-evidence'
import { buildRealEsrganEnhancementModelStoragePlan } from './enhancement-model-storage-plan'
import { buildEnhancementModelDownloadCommandPlan } from './enhancement-model-download-command-plan'
import { buildEnhancementModelApprovalBlockers } from './enhancement-model-approval-blocker-policy'
import {
  buildBlockedEnhancementModelWeightManifests,
  buildEnhancementModelWeightManifest,
  buildEvaluatedEnhancementModelWeightManifests,
} from './enhancement-model-manifest-writer'
import type { EnhancementModelApprovalReport } from './enhancement-model-approval-types'

export const ENHANCEMENT_MODEL_APPROVAL_REPORT_ID = 'activation-phase-34a-enhancement-model-approval'

export function buildEnhancementModelApprovalReport(): EnhancementModelApprovalReport {
  const candidates = listEnhancementModelApprovalCandidates()
  const evidenceSummary = listEnhancementModelLicenseEvidence()
  const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
  const downloadCommandPlan = buildEnhancementModelDownloadCommandPlan(storagePlan)
  const decisions = candidates.map((candidate) => evaluateEnhancementModelApprovalPolicy({
    candidate,
    evidence: evidenceSummary.filter((evidence) => evidence.modelCandidateId === candidate.candidateId),
    storagePlan,
  }))
  const realEsrganCandidate = candidates.find((candidate) => candidate.candidateId === 'xinntao_real_esrgan_x4plus')
  const realEsrganManifest = realEsrganCandidate ? buildEnhancementModelWeightManifest(realEsrganCandidate) : undefined
  const approvedModels = realEsrganManifest?.reviewStatus === 'staging_approved_for_sample_first_enhancement' ? [realEsrganManifest] : []
  const blockedModels = [
    ...buildBlockedEnhancementModelWeightManifests(candidates),
    ...buildEvaluatedEnhancementModelWeightManifests(candidates),
  ]
  const evaluatedOnlyModels = candidates.filter((candidate) => candidate.statuses.includes('evaluated_only'))
  const blockerEvaluation = buildEnhancementModelApprovalBlockers({
    decisions,
    approvedManifest: approvedModels[0],
    storagePlan,
    downloadCommandPlan,
  })

  return {
    reportId: ENHANCEMENT_MODEL_APPROVAL_REPORT_ID,
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
      ...enhancementProductionApprovalBlockers(),
      'Phase 34A does not download Real-ESRGAN or FILM weights.',
      'Phase 34A does not deploy GPU, process frames/video, run enhancement, or run slow motion.',
    ])),
    phase34BReadiness: {
      ready: approvedModels.length === 1 && blockerEvaluation.blockers.length === 0,
      blockers: approvedModels.length === 1 && blockerEvaluation.blockers.length === 0 ? [] : ['Real-ESRGAN staging approval workflow is not complete.'],
      warnings: ['Phase 34B may download only RealESRGAN_x4plus to private staging storage; no FILM download.'],
    },
    phase34CReadiness: {
      ready: false,
      blockers: ['RealESRGAN_x4plus weights are not downloaded and checksummed yet.', 'Real-ESRGAN runtime verification plan is not prepared in Phase 34A.'],
      warnings: ['Phase 34C remains blocked until Phase 34B records private storage and checksum evidence.'],
    },
    phase34DReadiness: {
      ready: false,
      blockers: ['Real-ESRGAN runtime verification has not passed.', 'Controlled real-video enhancement sample remains blocked until runtime QA passes.'],
      warnings: ['Phase 34D remains blocked until runtime verification creates safe private enhancement QA evidence.'],
    },
    modelDownloadExecuted: false,
    providerExecuted: false,
    gpuDeployed: false,
    frameOrVideoProcessed: false,
    enhancementExecutionRan: false,
    slowMotionExecutionRan: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeEnhancementModelApprovalReport(report: EnhancementModelApprovalReport): string {
  return [
    `Enhancement model approval report: ${report.reportId}`,
    `Approved models: ${report.approvedModels.length}`,
    `Blocked/evaluated manifests: ${report.blockedModels.length}`,
    `Evaluated-only candidates: ${report.evaluatedOnlyModels.length}`,
    `Evidence records: ${report.evidenceSummary.length}`,
    `Download commands: ${report.downloadCommandPlan.length} (text-only)`,
    `Blockers: ${report.blockers.length}`,
    `Phase 34B ready: ${report.phase34BReadiness.ready}`,
    `Phase 34C ready: ${report.phase34CReadiness.ready}`,
    `Phase 34D ready: ${report.phase34DReadiness.ready}`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Enhancement execution ran: ${report.enhancementExecutionRan}`,
    `Slow motion execution ran: ${report.slowMotionExecutionRan}`,
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
