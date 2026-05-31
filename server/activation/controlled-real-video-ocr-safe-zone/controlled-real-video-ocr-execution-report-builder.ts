import { getApprovedControlledRealVideoOcrExecutionEvidence } from './approved-controlled-real-video-ocr-execution-evidence'
import { getSelectedControlledRealVideoOcrSafeZoneSample } from './controlled-real-video-chain-registry'
import {
  CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES,
  CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS,
  validateControlledRealVideoOcrExecutionEnv,
} from './controlled-real-video-ocr-execution-policy'
import { buildControlledRealVideoOcrExecutionPlan } from './controlled-real-video-safe-zone-builder'

export function buildControlledRealVideoOcrExecutionEvidenceReport(createdAt = new Date().toISOString()) {
  const evidence = getApprovedControlledRealVideoOcrExecutionEvidence()
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  const staticValidation = validateControlledRealVideoOcrExecutionEnv({
    projectId: 'reeditpro',
    activeProject: 'reeditpro',
    region: 'us-central1',
    env: 'staging',
    sourceGcsUri: sample.sourceGcsUri,
    ocrExecuteConfirmation: evidence.status === 'passed' ? 'true' : 'missing_for_static_report',
    frameExtractionConfirmation: evidence.status === 'passed' ? 'true' : 'missing_for_static_report',
    artifactUploadConfirmation: evidence.status === 'passed' ? 'true' : 'missing_for_static_report',
    privateGcsReadConfirmation: evidence.status === 'passed' ? 'true' : 'missing_for_static_report',
    runtimeExecuteConfirmation: evidence.status === 'passed' ? 'true' : 'missing_for_static_report',
    arbitraryMediaEnabled: 'false',
    broadRealMediaReady: 'false',
    providerExecutionEnabled: 'false',
    publicOutputEnabled: 'false',
    signedUrlSourceOfTruthEnabled: 'false',
    trackAExecutionEnabled: 'false',
    productionReady: 'false',
    externalBetaReady: 'false',
  })
  return {
    reportId: 'activation-phase-37d-controlled-real-video-ocr-safe-zone-execution',
    createdAt,
    status: evidence.status,
    executionEvidence: evidence,
    executionPlan: buildControlledRealVideoOcrExecutionPlan(createdAt),
    expectedPrivateJsonArtifacts: CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS,
    blockedScopes: CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES,
    phase37EReadiness: evidence.phase37EReadiness,
    staticValidation: {
      allowedAfterEvidence: evidence.status === 'passed',
      blockers: evidence.status === 'passed' ? [] : staticValidation.blockers,
      warnings: staticValidation.warnings,
    },
    safety: {
      rawFramesCommitted: false,
      rawFramesUploaded: false,
      overlaysUploaded: false,
      modelFilesCommitted: false,
      videoCommitted: false,
      credentialsCommitted: false,
      publicOutputEnabled: false,
      trackATouched: false,
      betaAllowed: false,
      productionAllowed: false,
    },
  }
}

export function summarizeControlledRealVideoOcrExecutionEvidenceReport(
  report: ReturnType<typeof buildControlledRealVideoOcrExecutionEvidenceReport>,
): string {
  const evidence = report.executionEvidence
  return [
    'Phase 37D Controlled Real-Video OCR Safe-Zone Execution',
    `status: ${report.status}`,
    `runId: ${evidence.runId ?? 'none'}`,
    `sampleId: ${evidence.sampleId}`,
    `controlledChainId: ${evidence.controlledChainId}`,
    `window: ${evidence.window.startSeconds}-${evidence.window.endSeconds}s`,
    `offsets: ${evidence.frameOffsetsSeconds.join(',')}`,
    `frameCount: ${evidence.frameCount}`,
    `privateArtifactObjectCount: ${evidence.privateArtifactObjectCount}`,
    `totalTextRegionCount: ${evidence.ocrSummary.totalTextRegionCount}`,
    `framesWithLowerThirdCollision: ${evidence.ocrSummary.framesWithLowerThirdCollision}`,
    `phase37EPlanningReady: ${evidence.phase37EReadiness.readyForControlledCaptionRenderQaPlanning}`,
    `artifactPrefix: ${evidence.artifactPrefix ?? 'none'}`,
    `blockers: ${evidence.blockers.length ? evidence.blockers.join('; ') : 'none'}`,
    `warnings: ${evidence.warnings.length ? evidence.warnings.join('; ') : 'none'}`,
    `blockedScopes: ${CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES.join(', ')}`,
  ].join('\n')
}
