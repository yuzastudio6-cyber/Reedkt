import { getEnhancementModelApprovalCandidate } from '../enhancement-model-approval/enhancement-model-candidate-registry'
import { buildEnhancementModelDownloadCommandPlan } from '../enhancement-model-approval/enhancement-model-download-command-plan'
import { buildEnhancementModelWeightManifest } from '../enhancement-model-approval/enhancement-model-manifest-writer'
import { buildRealEsrganEnhancementModelStoragePlan } from '../enhancement-model-approval/enhancement-model-storage-plan'
import { getApprovedEnhancementModelDownloadEvidence } from './approved-enhancement-model-download-evidence'
import { buildEnhancementModelDownloadBlockers } from './enhancement-model-download-blocker-policy'
import { buildEnhancementModelDownloadExecutionCommandPlans } from './enhancement-model-download-command-runner'
import type { EnhancementModelDownloadReport } from './enhancement-model-download-types'

export const ENHANCEMENT_MODEL_DOWNLOAD_REPORT_ID = 'activation-phase-34b-enhancement-model-download'

export function buildEnhancementModelDownloadReport(): EnhancementModelDownloadReport {
  const candidate = getEnhancementModelApprovalCandidate('xinntao_real_esrgan_x4plus')
  if (!candidate) throw new Error('RealESRGAN_x4plus candidate is missing.')
  const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
  const evidence = getApprovedEnhancementModelDownloadEvidence()
  const manifest = buildEnhancementModelWeightManifest(candidate)
  const evaluation = buildEnhancementModelDownloadBlockers()
  const modelAvailable = evidence.status === 'verified' && evaluation.blockers.length === 0

  return {
    reportId: ENHANCEMENT_MODEL_DOWNLOAD_REPORT_ID,
    createdAt: new Date().toISOString(),
    approvedModelManifest: {
      ...manifest,
      modelVersion: evidence.releaseVersion,
      resolvedRevision: evidence.releaseVersion,
      sourceUrl: evidence.sourceUrl,
      checksum: evidence.fileSha256 ?? manifest.checksum,
      stagingStoragePath: evidence.stagingStoragePath,
    },
    downloadEvidence: evidence,
    storagePlan,
    commandPlans: buildEnhancementModelDownloadCommandPlan(storagePlan),
    executionCommandPlans: buildEnhancementModelDownloadExecutionCommandPlans(),
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    phase34CReadiness: {
      readyForRuntimePlanning: modelAvailable,
      readyForRuntimeExecution: false,
      reason: modelAvailable
        ? 'RealESRGAN_x4plus weights are verified in private staging storage; Phase 34C may plan runtime verification only.'
        : 'RealESRGAN_x4plus weights are not yet verified in private staging storage.',
    },
    phase34DReadiness: {
      readyForControlledEnhancementSample: false,
      reason: 'Phase 34D remains blocked until Phase 34C verifies Real-ESRGAN runtime loading and enhancement QA.',
    },
    modelDownloadExecuted: evidence.status !== 'not_started',
    modelUploadedToGcs: evidence.status === 'uploaded' || evidence.status === 'verified',
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

export function summarizeEnhancementModelDownloadReport(report: EnhancementModelDownloadReport): string {
  return [
    `Enhancement model download report: ${report.reportId}`,
    `Model: ${report.downloadEvidence.modelName}`,
    `Status: ${report.downloadEvidence.status}`,
    `Release: ${report.downloadEvidence.releaseVersion}`,
    `Source URL: ${report.downloadEvidence.sourceUrl}`,
    `File SHA-256: ${report.downloadEvidence.fileSha256 ?? '(missing)'}`,
    `Aggregate SHA-256: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `File count: ${report.downloadEvidence.fileCount ?? 0}`,
    `Total size bytes: ${report.downloadEvidence.totalSizeBytes ?? 0}`,
    `Model weight files: ${report.downloadEvidence.modelWeightFiles.length}`,
    `GCS storage: ${report.downloadEvidence.stagingStoragePath}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 34C runtime planning ready: ${report.phase34CReadiness.readyForRuntimePlanning}`,
    `Phase 34C runtime execution ready: ${report.phase34CReadiness.readyForRuntimeExecution}`,
    `Phase 34D controlled enhancement sample ready: ${report.phase34DReadiness.readyForControlledEnhancementSample}`,
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
