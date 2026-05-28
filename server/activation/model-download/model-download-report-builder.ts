import {
  getModelApprovalCandidate,
} from '../model-approval/model-candidate-registry'
import { buildFasterWhisperTinyStoragePlan } from '../model-approval/model-storage-plan'
import { buildModelDownloadCommandPlan } from '../model-approval/model-download-command-plan'
import { buildModelWeightManifest } from '../model-approval/model-manifest-writer'
import {
  isSpeechRuntimeExecutionVerified,
  readSpeechRuntimeExecutionReport,
  SPEECH_RUNTIME_LOCAL_REPORT_PATH,
} from '../speech-runtime/speech-runtime-report-builder'
import { getApprovedModelDownloadEvidence } from './approved-model-download-evidence'
import { buildModelDownloadBlockers } from './model-download-blocker-policy'
import { buildModelDownloadExecutionCommandPlans } from './model-download-command-runner'
import type { ModelDownloadReport } from './model-download-types'

export const MODEL_DOWNLOAD_REPORT_ID = 'activation-phase-26b-model-download'

export function buildModelDownloadReport(): ModelDownloadReport {
  const tinyCandidate = getModelApprovalCandidate('systran_faster_whisper_tiny')
  if (!tinyCandidate) throw new Error('Systran/faster-whisper-tiny candidate is missing.')
  const storagePlan = buildFasterWhisperTinyStoragePlan()
  const evidence = getApprovedModelDownloadEvidence()
  const manifest = buildModelWeightManifest(tinyCandidate)
  const evaluation = buildModelDownloadBlockers()
  const modelAvailable = evidence.status === 'verified' && evaluation.blockers.length === 0
  const speechRuntimeVerified = isSpeechRuntimeExecutionVerified(readSpeechRuntimeExecutionReport(SPEECH_RUNTIME_LOCAL_REPORT_PATH))

  return {
    reportId: MODEL_DOWNLOAD_REPORT_ID,
    createdAt: new Date().toISOString(),
    approvedModelManifest: {
      ...manifest,
      modelVersion: evidence.resolvedRevision ?? manifest.modelVersion,
      checksum: evidence.aggregateSha256 ?? manifest.checksum,
      resolvedRevision: evidence.resolvedRevision,
      fileCount: evidence.fileCount,
      totalSizeBytes: evidence.totalSizeBytes,
      downloadedAt: evidence.downloadedAt,
      uploadedAt: evidence.uploadedAt,
      gcsManifestPath: evidence.gcsManifestPath,
    },
    downloadEvidence: evidence,
    storagePlan,
    commandPlans: buildModelDownloadCommandPlan(storagePlan),
    executionCommandPlans: buildModelDownloadExecutionCommandPlans(),
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    phase27Readiness: {
      readyForGpuDeploy: false,
      reason: 'GPU deploy remains deferred; Phase 26B only downloads approved tiny speech model weights.',
    },
    phase28Readiness: {
      readyForPlanning: modelAvailable,
      readyForExecution: modelAvailable && speechRuntimeVerified,
      reason: modelAvailable && speechRuntimeVerified
        ? 'Phase 27A verified the approved tiny model in a dedicated CPU speech runtime using private GCS and generated audio only; Phase 28 can proceed only as an explicit controlled speech/caption test.'
        : modelAvailable
        ? 'Model weights are available in private staging storage, but runtime execution remains blocked until a speech runtime image/job is deployed and verified.'
        : 'Model weights are not yet verified in private staging storage.',
    },
    modelDownloadExecuted: evidence.status !== 'not_started',
    modelUploadedToGcs: evidence.status === 'uploaded' || evidence.status === 'verified',
    providerExecuted: false,
    gpuDeployed: false,
    realUserMediaProcessed: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeModelDownloadReport(report: ModelDownloadReport): string {
  return [
    `Model download report: ${report.reportId}`,
    `Model: ${report.downloadEvidence.modelName}`,
    `Status: ${report.downloadEvidence.status}`,
    `Revision: ${report.downloadEvidence.resolvedRevision ?? '(missing)'}`,
    `Checksum: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `File count: ${report.downloadEvidence.fileCount ?? 0}`,
    `Total size bytes: ${report.downloadEvidence.totalSizeBytes ?? 0}`,
    `GCS storage: ${report.downloadEvidence.stagingStoragePath}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 27 GPU deploy ready: ${report.phase27Readiness.readyForGpuDeploy}`,
    `Phase 28 planning ready: ${report.phase28Readiness.readyForPlanning}`,
    `Phase 28 execution ready: ${report.phase28Readiness.readyForExecution}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
