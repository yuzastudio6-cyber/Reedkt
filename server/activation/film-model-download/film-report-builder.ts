import { getApprovedFilmModelDownloadEvidence } from './approved-film-model-download-evidence'
import { buildFilmModelDownloadExecutionCommandPlans } from './film-download-plan'
import { buildStaticFilmLicenseEvidence, buildStaticFilmSourceEvidence } from './film-source-evidence'
import type { FilmModelDownloadReport } from './film-model-download-types'

export const FILM_MODEL_DOWNLOAD_REPORT_ID = 'activation-phase-38b-film-model-download'

export function buildFilmModelDownloadReport(): FilmModelDownloadReport {
  const evidence = getApprovedFilmModelDownloadEvidence()
  const sourceEvidence = buildStaticFilmSourceEvidence()
  const licenseEvidence = buildStaticFilmLicenseEvidence()
  const blockers = [...evidence.blockers]
  if (evidence.status !== 'verified') blockers.push('FILM film_net/Style/saved_model artifacts are not verified in private staging GCS.')
  if (!evidence.aggregateSha256) blockers.push('FILM aggregate SHA-256 is missing.')
  if (!evidence.fileCount || evidence.fileCount < 4) blockers.push('Expected FILM SavedModel file checksums are missing.')
  if (!evidence.uploadedObjectCount || evidence.uploadedObjectCount < 9) blockers.push('Expected FILM private GCS objects are not verified.')
  if (evidence.fileChecksums.some((entry) => entry.sizeBytes <= 0)) blockers.push('One or more FILM checksum entries has invalid size.')
  if (evidence.uploadedObjects.some((object) => object.sizeBytes <= 0)) blockers.push('One or more FILM uploaded objects has invalid size.')

  const verified = evidence.status === 'verified' && blockers.length === 0

  return {
    reportId: FILM_MODEL_DOWNLOAD_REPORT_ID,
    createdAt: new Date().toISOString(),
    downloadEvidence: evidence,
    sourceEvidence,
    licenseEvidence,
    executionCommandPlans: buildFilmModelDownloadExecutionCommandPlans(),
    blockers,
    warnings: [
      ...evidence.warnings,
      'Phase 38B does not run FILM, build Docker, deploy Cloud Run, process media, or enable slow motion.',
      'Phase 38C may verify runtime only on generated frame pairs/sequences after this private model evidence is reviewed.',
    ],
    phase38CReadiness: {
      readyForGeneratedFrameRuntimeVerification: verified,
      readyForRuntimeExecution: false,
      reason: verified
        ? 'FILM film_net/Style/saved_model artifacts are verified in private staging GCS; Phase 38C may plan generated-frame runtime verification only.'
        : 'FILM film_net/Style/saved_model artifacts are not yet verified in private staging GCS.',
    },
    notReadyFor: [
      'real-video slow-motion sample',
      'full-video interpolation',
      'production',
      'external beta',
      'paid production',
      'broad real user media',
      'public output',
      'provider execution',
      'Revideo integration',
    ],
    filmDownloadCompleted: verified,
    filmRuntimeAllowed: false,
    slowMotionAllowed: false,
    realVideoSlowMotionAllowed: false,
    fullVideoInterpolationAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeFilmModelDownloadReport(report: FilmModelDownloadReport): string {
  return [
    `FILM model download report: ${report.reportId}`,
    `Status: ${report.downloadEvidence.status}`,
    `Tool family: ${report.downloadEvidence.toolFamily}`,
    `Model: ${report.downloadEvidence.modelId}`,
    `Selected artifact root: ${report.downloadEvidence.selectedArtifactRoot}`,
    `Source repo: ${report.downloadEvidence.sourceRepoUrl}`,
    `Checkpoint source: ${report.downloadEvidence.checkpointSourceUrl}`,
    `License decision: ${report.downloadEvidence.codexLicenseDecision}`,
    `Human license approval required: ${report.downloadEvidence.humanLicenseApprovalRequired}`,
    `Aggregate SHA-256: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `GCS storage: ${report.downloadEvidence.targetGcsPath}`,
    `File checksums: ${report.downloadEvidence.fileChecksums.length}`,
    `Uploaded objects: ${report.downloadEvidence.uploadedObjectCount ?? 0}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 38C generated-frame runtime verification ready: ${report.phase38CReadiness.readyForGeneratedFrameRuntimeVerification}`,
    `Phase 38C runtime execution ready: ${report.phase38CReadiness.readyForRuntimeExecution}`,
    `FILM runtime allowed: ${report.filmRuntimeAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    `Real-video slow motion allowed: ${report.realVideoSlowMotionAllowed}`,
    `Full-video interpolation allowed: ${report.fullVideoInterpolationAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Checksums:',
    ...(report.downloadEvidence.fileChecksums.length
      ? report.downloadEvidence.fileChecksums.map((entry) => `- ${entry.sha256}  ${entry.relativePath} (${entry.sizeBytes} bytes)`)
      : ['- none']),
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
