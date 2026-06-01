import { getApprovedDeepFilterNetDownloadEvidence } from './approved-deepfilternet-download-evidence'
import { buildDeepFilterNetDownloadExecutionCommandPlans } from './deepfilternet-download-plan'
import {
  buildStaticDeepFilterNetLicenseEvidence,
  buildStaticDeepFilterNetSourceEvidence,
} from './deepfilternet-source-evidence'
import type { DeepFilterNetDownloadReport } from './audio-ai-download-types'

export const DEEPFILTERNET_DOWNLOAD_REPORT_ID = 'activation-phase-36b-deepfilternet-download'

export function buildDeepFilterNetDownloadReport(): DeepFilterNetDownloadReport {
  const evidence = getApprovedDeepFilterNetDownloadEvidence()
  const sourceEvidence = buildStaticDeepFilterNetSourceEvidence()
  const licenseEvidence = buildStaticDeepFilterNetLicenseEvidence()
  const blockers = [...evidence.blockers]
  if (evidence.status !== 'verified') blockers.push('DeepFilterNet v0.5.6 artifacts are not verified in private staging GCS.')
  if (!evidence.cliSha256) blockers.push('DeepFilterNet CLI SHA-256 is missing.')
  if (!evidence.modelArchiveSha256) blockers.push('DeepFilterNet3 ONNX archive SHA-256 is missing.')
  if (!evidence.aggregateSha256) blockers.push('DeepFilterNet aggregate SHA-256 is missing.')
  if (!evidence.uploadedObjectCount || evidence.uploadedObjectCount < 7) blockers.push('Expected seven DeepFilterNet private GCS objects are not verified.')
  if (evidence.uploadedObjects.some((object) => object.sizeBytes <= 0)) blockers.push('One or more DeepFilterNet uploaded objects has invalid size.')

  const verified = evidence.status === 'verified' && blockers.length === 0

  return {
    reportId: DEEPFILTERNET_DOWNLOAD_REPORT_ID,
    createdAt: new Date().toISOString(),
    downloadEvidence: evidence,
    sourceEvidence,
    licenseEvidence,
    executionCommandPlans: buildDeepFilterNetDownloadExecutionCommandPlans(),
    blockers,
    warnings: [
      ...evidence.warnings,
      'Phase 36B does not run DeepFilterNet, RNNoise, Demucs, Docker, Cloud Run, providers, Revideo, FILM, slow motion, or media processing.',
      'Phase 36C may verify DeepFilterNet runtime only on generated-audio fixtures after this private artifact evidence is reviewed.',
    ],
    phase36CReadiness: {
      readyForGeneratedAudioRuntimeVerification: verified,
      readyForRuntimeExecution: false,
      reason: verified
        ? 'Selected DeepFilterNet v0.5.6 artifacts are verified in private staging GCS; Phase 36C may plan generated-audio runtime verification only.'
        : 'Selected DeepFilterNet v0.5.6 artifacts are not yet verified in private staging GCS.',
    },
    notReadyFor: [
      'real-video audio AI cleanup',
      'arbitrary audio or user media',
      'production',
      'external beta',
      'paid production',
      'broad real user media',
      'RNNoise runtime',
      'Demucs runtime',
    ],
    deepFilterNetDownloadCompleted: verified,
    deepFilterNetRuntimeAllowed: false,
    audioProcessingAllowed: false,
    realVideoAudioAiCleanupAllowed: false,
    rnnoiseDownloadAllowed: false,
    rnnoiseRuntimeAllowed: false,
    demucsDownloadAllowed: false,
    demucsRuntimeAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
  }
}

export function summarizeDeepFilterNetDownloadReport(report: DeepFilterNetDownloadReport): string {
  return [
    `DeepFilterNet artifact download report: ${report.reportId}`,
    `Status: ${report.downloadEvidence.status}`,
    `Tool: ${report.downloadEvidence.toolId}`,
    `Version: ${report.downloadEvidence.selectedVersion}`,
    `License decision: ${report.downloadEvidence.codexLicenseDecision}`,
    `Human license approval required: ${report.downloadEvidence.humanLicenseApprovalRequired}`,
    `CLI SHA-256: ${report.downloadEvidence.cliSha256 ?? '(missing)'}`,
    `Model archive SHA-256: ${report.downloadEvidence.modelArchiveSha256 ?? '(missing)'}`,
    `Aggregate SHA-256: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `GCS storage: ${report.downloadEvidence.targetGcsPath}`,
    `Uploaded objects: ${report.downloadEvidence.uploadedObjectCount ?? 0}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 36C generated-audio runtime verification ready: ${report.phase36CReadiness.readyForGeneratedAudioRuntimeVerification}`,
    `Phase 36C runtime execution ready: ${report.phase36CReadiness.readyForRuntimeExecution}`,
    `DeepFilterNet runtime allowed: ${report.deepFilterNetRuntimeAllowed}`,
    `Audio processing allowed: ${report.audioProcessingAllowed}`,
    `Real-video audio AI cleanup allowed: ${report.realVideoAudioAiCleanupAllowed}`,
    `RNNoise download allowed: ${report.rnnoiseDownloadAllowed}`,
    `Demucs download allowed: ${report.demucsDownloadAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Selected artifacts:',
    ...report.downloadEvidence.selectedArtifacts.map((artifact) => `- ${artifact.fileName} (${artifact.kind}) from ${artifact.sourceUrl}`),
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
