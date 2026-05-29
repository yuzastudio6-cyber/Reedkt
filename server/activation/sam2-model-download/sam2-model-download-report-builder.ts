import { getApprovedSam2ModelDownloadEvidence } from './approved-sam2-model-download-evidence'
import { buildSam2ModelDownloadExecutionCommandPlans } from './sam2-model-download-plan'
import { buildStaticSam2SourceEvidence } from './sam2-model-source-evidence'
import type { Sam2ModelDownloadReport } from './sam2-model-download-types'

export const SAM2_MODEL_DOWNLOAD_REPORT_ID = 'activation-phase-35b-sam2-model-download'

export function buildSam2ModelDownloadReport(): Sam2ModelDownloadReport {
  const evidence = getApprovedSam2ModelDownloadEvidence()
  const sourceEvidence = buildStaticSam2SourceEvidence()
  const blockers = [...evidence.blockers]
  if (evidence.status !== 'verified') blockers.push('SAM2.1 tiny checkpoint/config are not verified in private staging GCS.')
  if (!evidence.checkpointSha256) blockers.push('SAM2 checkpoint SHA-256 is missing.')
  if (!evidence.configSha256) blockers.push('SAM2 config SHA-256 is missing.')
  if (!evidence.aggregateSha256) blockers.push('SAM2 aggregate SHA-256 is missing.')
  if (!evidence.uploadedObjectCount || evidence.uploadedObjectCount < 5) blockers.push('Expected five SAM2 private GCS objects are not verified.')
  if (evidence.uploadedObjects.some((object) => object.sizeBytes <= 0)) blockers.push('One or more SAM2 uploaded objects has invalid size.')

  const verified = evidence.status === 'verified' && blockers.length === 0

  return {
    reportId: SAM2_MODEL_DOWNLOAD_REPORT_ID,
    createdAt: new Date().toISOString(),
    downloadEvidence: evidence,
    sourceEvidence,
    executionCommandPlans: buildSam2ModelDownloadExecutionCommandPlans(),
    blockers,
    warnings: [
      ...evidence.warnings,
      'Phase 35B does not run SAM2, deploy GPU, process media, or enable temporal masks.',
      'Phase 35C may verify runtime only on generated/synthetic fixtures after this private model evidence is reviewed.',
    ],
    phase35CReadiness: {
      readyForGeneratedSyntheticRuntimeVerification: verified,
      readyForRuntimeExecution: false,
      reason: verified
        ? 'SAM2.1 tiny checkpoint/config are verified in private staging GCS; Phase 35C may plan generated/synthetic runtime verification only.'
        : 'SAM2.1 tiny checkpoint/config are not yet verified in private staging GCS.',
    },
    notReadyFor: [
      'real video temporal tracking',
      'full-video masks',
      'full-video text-behind-subject',
      'production',
      'external beta',
      'paid production',
      'broad real user media',
    ],
    sam2DownloadCompleted: verified,
    sam2RuntimeAllowed: false,
    sam2TemporalTrackingAllowed: false,
    sam2FullVideoMaskAllowed: false,
    fullVideoTextBehindSubjectAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeSam2ModelDownloadReport(report: Sam2ModelDownloadReport): string {
  return [
    `SAM2 model download report: ${report.reportId}`,
    `Status: ${report.downloadEvidence.status}`,
    `Model: ${report.downloadEvidence.modelId}`,
    `Checkpoint: ${report.downloadEvidence.checkpointFileName}`,
    `Config: ${report.downloadEvidence.configFileName}`,
    `License decision: ${report.downloadEvidence.codexLicenseDecision}`,
    `Human license approval required: ${report.downloadEvidence.humanLicenseApprovalRequired}`,
    `Checkpoint SHA-256: ${report.downloadEvidence.checkpointSha256 ?? '(missing)'}`,
    `Config SHA-256: ${report.downloadEvidence.configSha256 ?? '(missing)'}`,
    `Aggregate SHA-256: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `GCS storage: ${report.downloadEvidence.targetGcsPath}`,
    `Uploaded objects: ${report.downloadEvidence.uploadedObjectCount ?? 0}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 35C generated/synthetic runtime verification ready: ${report.phase35CReadiness.readyForGeneratedSyntheticRuntimeVerification}`,
    `Phase 35C runtime execution ready: ${report.phase35CReadiness.readyForRuntimeExecution}`,
    `SAM2 runtime allowed: ${report.sam2RuntimeAllowed}`,
    `SAM2 temporal tracking allowed: ${report.sam2TemporalTrackingAllowed}`,
    `Full-video mask allowed: ${report.sam2FullVideoMaskAllowed}`,
    `Full-video text-behind-subject allowed: ${report.fullVideoTextBehindSubjectAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Uploaded private objects:',
    ...(report.downloadEvidence.uploadedObjects.length
      ? report.downloadEvidence.uploadedObjects.map((object) => `- ${object.gcsUri} (${object.sizeBytes} bytes)`)
      : ['- none']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
