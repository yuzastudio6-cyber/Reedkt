import { getMaskModelApprovalCandidate } from '../mask-model-approval/mask-model-candidate-registry'
import { buildBiRefNetMaskModelStoragePlan } from '../mask-model-approval/mask-model-storage-plan'
import { buildMaskModelDownloadCommandPlan } from '../mask-model-approval/mask-model-download-command-plan'
import { buildMaskModelWeightManifest } from '../mask-model-approval/mask-model-manifest-writer'
import { getApprovedMaskModelDownloadEvidence } from './approved-mask-model-download-evidence'
import { buildMaskModelDownloadBlockers } from './mask-model-download-blocker-policy'
import { buildMaskModelDownloadExecutionCommandPlans } from './mask-model-download-command-runner'
import type { MaskModelDownloadReport } from './mask-model-download-types'

export const MASK_MODEL_DOWNLOAD_REPORT_ID = 'activation-phase-33b-mask-model-download'

export function buildMaskModelDownloadReport(): MaskModelDownloadReport {
  const candidate = getMaskModelApprovalCandidate('zhengpeng7_birefnet')
  if (!candidate) throw new Error('ZhengPeng7/BiRefNet candidate is missing.')
  const storagePlan = buildBiRefNetMaskModelStoragePlan()
  const evidence = getApprovedMaskModelDownloadEvidence()
  const manifest = buildMaskModelWeightManifest(candidate)
  const evaluation = buildMaskModelDownloadBlockers()
  const modelAvailable = evidence.status === 'verified' && evaluation.blockers.length === 0

  return {
    reportId: MASK_MODEL_DOWNLOAD_REPORT_ID,
    createdAt: new Date().toISOString(),
    approvedModelManifest: {
      ...manifest,
      modelVersion: evidence.resolvedRevision ?? manifest.modelVersion,
      resolvedRevision: evidence.resolvedRevision,
      checksum: evidence.aggregateSha256 ?? manifest.checksum,
      stagingStoragePath: evidence.stagingStoragePath,
    },
    downloadEvidence: evidence,
    storagePlan,
    commandPlans: buildMaskModelDownloadCommandPlan(storagePlan),
    executionCommandPlans: buildMaskModelDownloadExecutionCommandPlans(),
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    phase33CReadiness: {
      readyForRuntimePlanning: modelAvailable,
      readyForRuntimeExecution: false,
      reason: modelAvailable
        ? 'BiRefNet weights are verified in private staging storage; Phase 33C may plan/deploy runtime verification only.'
        : 'BiRefNet weights are not yet verified in private staging storage.',
    },
    phase33DReadiness: {
      readyForControlledMaskTest: false,
      reason: 'Phase 33D remains blocked until Phase 33C verifies BiRefNet runtime loading and mask QA.',
    },
    modelDownloadExecuted: evidence.status !== 'not_started',
    modelUploadedToGcs: evidence.status === 'uploaded' || evidence.status === 'verified',
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

export function summarizeMaskModelDownloadReport(report: MaskModelDownloadReport): string {
  return [
    `Mask model download report: ${report.reportId}`,
    `Model: ${report.downloadEvidence.modelName}`,
    `Status: ${report.downloadEvidence.status}`,
    `Revision: ${report.downloadEvidence.resolvedRevision ?? '(missing)'}`,
    `Checksum: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `File count: ${report.downloadEvidence.fileCount ?? 0}`,
    `Total size bytes: ${report.downloadEvidence.totalSizeBytes ?? 0}`,
    `Custom code files: ${report.downloadEvidence.customCodeFiles.length}`,
    `Model weight files: ${report.downloadEvidence.modelWeightFiles.length}`,
    `GCS storage: ${report.downloadEvidence.stagingStoragePath}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 33C runtime planning ready: ${report.phase33CReadiness.readyForRuntimePlanning}`,
    `Phase 33C runtime execution ready: ${report.phase33CReadiness.readyForRuntimeExecution}`,
    `Phase 33D controlled mask test ready: ${report.phase33DReadiness.readyForControlledMaskTest}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
