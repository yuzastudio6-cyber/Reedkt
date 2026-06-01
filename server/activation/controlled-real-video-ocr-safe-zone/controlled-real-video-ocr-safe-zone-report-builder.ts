import {
  buildControlledRealVideoOcrSafeZoneFrameSamplingManifest,
  buildControlledRealVideoOcrSafeZoneSampleManifest,
  getApprovedControlledRealVideoChainEvidence,
  getControlledRealVideoOcrSafeZoneSampleCandidates,
  getSelectedControlledRealVideoOcrSafeZoneSample,
} from './controlled-real-video-chain-registry'
import { buildControlledRealVideoOcrSafeZoneCommandPlans } from './controlled-real-video-ocr-safe-zone-command-plan'
import { buildControlledRealVideoOcrSafeZoneIamPlan } from './controlled-real-video-ocr-safe-zone-iam-plan'
import {
  CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES,
  CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS,
  controlledRealVideoOcrSafeZoneConfig,
  validateControlledRealVideoOcrSafeZonePlanningEnv,
  validateControlledRealVideoOcrSafeZoneStaticPlan,
} from './controlled-real-video-ocr-safe-zone-policy'
import { buildControlledRealVideoOcrSafeZoneFutureArtifactSchemas } from './controlled-real-video-ocr-safe-zone-schemas'
import type {
  ControlledRealVideoOcrSafeZoneQaStatus,
  ControlledRealVideoOcrSafeZoneReport,
} from './controlled-real-video-ocr-safe-zone-types'

export function buildControlledRealVideoOcrSafeZoneReport(input: {
  createdAt?: string
} = {}): ControlledRealVideoOcrSafeZoneReport {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const controlledChain = getApprovedControlledRealVideoChainEvidence()
  const sampleCandidates = getControlledRealVideoOcrSafeZoneSampleCandidates()
  const selectedSample = getSelectedControlledRealVideoOcrSafeZoneSample()
  const staticValidation = validateControlledRealVideoOcrSafeZoneStaticPlan({
    projectId: controlledRealVideoOcrSafeZoneConfig.projectId,
    region: controlledRealVideoOcrSafeZoneConfig.region,
    env: controlledRealVideoOcrSafeZoneConfig.env,
    mode: controlledRealVideoOcrSafeZoneConfig.mode,
    sourceGcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
    selectedSamples: sampleCandidates,
  })
  const planningEnvValidation = validateControlledRealVideoOcrSafeZonePlanningEnv({
    projectId: controlledRealVideoOcrSafeZoneConfig.projectId,
    region: controlledRealVideoOcrSafeZoneConfig.region,
    env: controlledRealVideoOcrSafeZoneConfig.env,
    mode: controlledRealVideoOcrSafeZoneConfig.mode,
    sourceGcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
  })
  const blockers = [
    ...staticValidation.blockers,
    ...planningEnvValidation.blockers,
    ...controlledChain.blockers,
    ...selectedSample.blockers,
  ]
  const warnings = [
    ...staticValidation.warnings,
    ...planningEnvValidation.warnings,
    ...controlledChain.warnings,
    ...selectedSample.warnings,
  ]
  const metadataPlanningPassed = blockers.length === 0 && controlledChain.status === 'approved_for_phase37d_metadata_gate'
  const qaStatus: ControlledRealVideoOcrSafeZoneQaStatus = metadataPlanningPassed ? 'passed' : 'blocked'

  return {
    reportId: 'activation-phase-37d-controlled-real-video-ocr-safe-zone-gate',
    createdAt,
    config: controlledRealVideoOcrSafeZoneConfig,
    status: metadataPlanningPassed ? 'passed' : blockers.length > 0 ? 'blocked' : 'planned',
    controlledChain,
    selectedSample,
    futureArtifactSchemas: buildControlledRealVideoOcrSafeZoneFutureArtifactSchemas(),
    commandPlans: buildControlledRealVideoOcrSafeZoneCommandPlans(),
    iamPlan: buildControlledRealVideoOcrSafeZoneIamPlan(),
    blockers,
    warnings,
    qa: {
      status: qaStatus,
      gates: [
        gate('phase37b_private_ocr_assets', controlledChain.phase37BAssets.aggregateSha256.length === 64, 'Phase 37B private PP-OCRv5 det/rec/dictionary evidence is present.'),
        gate('phase37c_generated_runtime', controlledChain.phase37CRuntime.readyForControlledRealVideoOcrSafeZone, 'Phase 37C generated OCR runtime passed and is ready only for controlled Phase 37D planning.'),
        gate('approved_private_controlled_chain', controlledChain.status === 'approved_for_phase37d_metadata_gate', 'Phase 28-32 controlled private real-video chain metadata is approved for this planning gate.'),
        gate('selected_sample_bounds', selectedSample.blockers.length === 0, 'Exactly one selected private sample has bounded future frame offsets within 6.9s-8.9s.'),
        gate('metadata_only_safety', selectedSample.mediaBytesRead === false && selectedSample.frameExtractionPerformed === false && selectedSample.realVideoOcrPerformed === false, 'Phase 37D performed no media reads, frame extraction, or OCR execution.'),
        gate('future_artifact_policy', CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS.length === 9, 'Future private artifact/report schemas are defined without creating public artifacts.'),
        gate('blocked_scopes', true, 'Real-video OCR execution, upload, Phase 37E integration, beta, production, broad media, and Track A remain blocked.'),
      ],
    },
    phase37DMetadataPlanningPassed: metadataPlanningPassed,
    phase37EReadiness: {
      readyForCaptionRenderQaIntegration: false,
      reason: metadataPlanningPassed
        ? 'Phase 37D metadata planning passed, but no real-video OCR or collision QA has executed; Phase 37E caption/render integration remains blocked.'
        : 'Phase 37E remains blocked until Phase 37D metadata planning blockers are resolved and a later controlled OCR execution phase passes.',
    },
    futureExecutionReadiness: {
      readyForControlledRealVideoOcrExecutionPlanning: metadataPlanningPassed,
      reason: metadataPlanningPassed
        ? 'A single approved private source, bounded window, frame-offset plan, and future schemas are ready for a separately approved execution phase.'
        : 'Controlled real-video OCR execution planning remains blocked by missing Phase 37D metadata prerequisites.',
    },
    safety: {
      metadataOnlyPlanningGate: true,
      mediaBytesRead: false,
      frameExtractionPerformed: false,
      realVideoOcrPerformed: false,
      artifactUploadPerformed: false,
      iamMutated: false,
      dockerBuilt: false,
      cloudRunDeployed: false,
      providerExecuted: false,
      modelDownloaded: false,
      publicAccessEnabled: false,
      signedUrlSourceOfTruthUsed: false,
      productionReadyAllowed: false,
      internalBetaAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      trackATouched: false,
    },
  }
}

export function buildControlledRealVideoOcrSafeZonePlan(createdAt = new Date().toISOString()) {
  return {
    phase: '37D' as const,
    reportId: 'activation-phase-37d-controlled-real-video-ocr-safe-zone-gate',
    createdAt,
    config: controlledRealVideoOcrSafeZoneConfig,
    controlledChain: getApprovedControlledRealVideoChainEvidence(),
    selectedSampleManifest: buildControlledRealVideoOcrSafeZoneSampleManifest(createdAt),
    futureFrameSamplingManifest: buildControlledRealVideoOcrSafeZoneFrameSamplingManifest(createdAt),
    futureArtifactSchemas: buildControlledRealVideoOcrSafeZoneFutureArtifactSchemas(),
    expectedFutureArtifacts: CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS,
    commands: buildControlledRealVideoOcrSafeZoneCommandPlans(),
    iamPlan: buildControlledRealVideoOcrSafeZoneIamPlan(),
    futureOnlyConfirmationsDoNotSetInPhase37D: [
      'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE=true',
      'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION=true',
      'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true',
    ],
    blockedScopes: CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES,
    doesNotDo: {
      mediaBytesRead: false,
      frameExtraction: false,
      realVideoOcr: false,
      artifactUpload: false,
      iamMutation: false,
      dockerBuild: false,
      cloudRunDeploy: false,
      providerExecution: false,
      captionRenderIntegration: false,
      publicOutput: false,
      production: false,
      beta: false,
      broadRealMedia: false,
      trackA: false,
    },
  }
}

export function summarizeControlledRealVideoOcrSafeZoneReport(report: ControlledRealVideoOcrSafeZoneReport): string {
  return [
    'Phase 37D Controlled Real-Video OCR Safe-Zone Gate',
    `status: ${report.status}`,
    `metadataPlanningPassed: ${report.phase37DMetadataPlanningPassed}`,
    `phase37EReady: ${report.phase37EReadiness.readyForCaptionRenderQaIntegration}`,
    `futureExecutionPlanningReady: ${report.futureExecutionReadiness.readyForControlledRealVideoOcrExecutionPlanning}`,
    `chainId: ${report.controlledChain.chainId}`,
    `sampleId: ${report.selectedSample.sampleId}`,
    `source: ${report.selectedSample.sourceGcsUri}`,
    `plannedWindow: ${report.selectedSample.plannedWindow.startSeconds}-${report.selectedSample.plannedWindow.endSeconds}s`,
    `plannedFrameOffsets: ${report.selectedSample.plannedFrameOffsetsSeconds.join(',')}`,
    `futureArtifactSchemas: ${report.futureArtifactSchemas.length}`,
    `blockers: ${report.blockers.length ? report.blockers.join('; ') : 'none'}`,
    `warnings: ${report.warnings.length ? report.warnings.join('; ') : 'none'}`,
    `blockedScopes: ${CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES.join(', ')}`,
  ].join('\n')
}

function gate(
  gateId: ControlledRealVideoOcrSafeZoneReport['qa']['gates'][number]['gateId'],
  passed: boolean,
  summary: string,
): ControlledRealVideoOcrSafeZoneReport['qa']['gates'][number] {
  return {
    gateId,
    status: passed ? 'passed' : 'blocked',
    summary,
  }
}
