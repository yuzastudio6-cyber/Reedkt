import { buildModelApprovalReport } from '../model-approval'
import {
  isSpeechRuntimeExecutionVerified,
  readSpeechRuntimeExecutionReport,
  SPEECH_RUNTIME_LOCAL_REPORT_PATH,
} from '../speech-runtime/speech-runtime-report-builder'
import { evidenceHasChecksum } from './model-checksum-builder'
import { getApprovedModelDownloadEvidence } from './approved-model-download-evidence'
import { validateModelGcsStoragePath } from './model-gcs-uploader'

export function buildModelDownloadBlockers(): { blockers: string[]; warnings: string[] } {
  const approvalReport = buildModelApprovalReport()
  const evidence = getApprovedModelDownloadEvidence()
  const speechRuntimeVerified = isSpeechRuntimeExecutionVerified(readSpeechRuntimeExecutionReport(SPEECH_RUNTIME_LOCAL_REPORT_PATH))
  const blockers: string[] = []
  const warnings: string[] = []

  if (!approvalReport.approvedModels.some((model) => model.modelWeightManifestId === 'faster_whisper_tiny_staging_v1')) {
    blockers.push('Phase 26 approval for faster_whisper_tiny_staging_v1 is missing.')
  }
  if (evidence.status !== 'verified') blockers.push('Approved faster-whisper tiny model download/upload evidence is not verified.')
  if (!evidenceHasChecksum(evidence)) blockers.push('Aggregate checksum evidence is missing or invalid.')
  if (!evidence.resolvedRevision) blockers.push('Resolved model revision evidence is missing.')
  if (!evidence.fileCount || evidence.fileCount <= 0) blockers.push('Downloaded model file count is missing.')
  if (!evidence.totalSizeBytes || evidence.totalSizeBytes <= 0) blockers.push('Downloaded model total size is missing.')
  blockers.push(...validateModelGcsStoragePath(evidence.stagingStoragePath))
  if (!evidence.gcsManifestPath || !evidence.gcsChecksumPath) blockers.push('GCS checksum/manifest evidence paths are missing.')

  if (speechRuntimeVerified) {
    warnings.push('Phase 27A CPU speech runtime verification passed using the approved tiny model and generated audio only.')
  } else {
    warnings.push('Phase 26B does not verify faster-whisper runtime execution.')
    warnings.push('Phase 28 execution remains blocked until a speech runtime image/job is deployed and verified.')
  }
  warnings.push(...evidence.warnings.filter((warning) => !speechRuntimeVerified || !/speech runtime image\/job|Phase 28 execution remains blocked/i.test(warning)))

  return {
    blockers: Array.from(new Set([...blockers, ...evidence.blockers])),
    warnings: Array.from(new Set(warnings)),
  }
}
