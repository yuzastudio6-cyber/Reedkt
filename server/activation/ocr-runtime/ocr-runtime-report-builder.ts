import { buildOcrGeneratedFixtureManifest, ocrGeneratedFixtureSpecs } from './ocr-generated-fixture-registry'
import { buildOcrRuntimeCommandPlans } from './ocr-runtime-command-plan'
import { buildOcrRuntimeIamPlan } from './ocr-runtime-iam-plan'
import { getApprovedOcrRuntimeEvidence } from './approved-ocr-runtime-evidence'
import { ocrRuntimeConfig, validateOcrRuntimeStaticPlan } from './ocr-runtime-policy'
import type { ApprovedOcrRuntimeEvidence, OcrRuntimeReport } from './ocr-runtime-types'

export function buildOcrRuntimeReport(input: {
  createdAt?: string
  evidence?: ApprovedOcrRuntimeEvidence
} = {}): OcrRuntimeReport {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const approvedEvidence = input.evidence ?? getApprovedOcrRuntimeEvidence()
  const staticValidation = validateOcrRuntimeStaticPlan({
    projectId: ocrRuntimeConfig.projectId,
    region: ocrRuntimeConfig.region,
    env: ocrRuntimeConfig.env,
    runtimeMode: ocrRuntimeConfig.runtimeMode,
    modelGcsPath: ocrRuntimeConfig.modelGcsPath,
  })
  const blockers = [
    ...staticValidation.blockers,
    ...approvedEvidence.blockers,
  ]
  const warnings = [
    ...staticValidation.warnings,
    ...approvedEvidence.warnings,
    'Official PaddleOCR 3.0 OCR docs are cited for local model path and orientation/unwarping disablement: http://www.paddleocr.ai/v3.0.0/en/version3.x/pipeline_usage/OCR.html',
    'PaddleOCR/PaddlePaddle package pinning follows the PaddleOCR 3.x PyPI quick start family: https://pypi.org/project/paddleocr/3.0.3/',
  ]
  const verified = approvedEvidence.status === 'verified' && approvedEvidence.blockers.length === 0
  const fixtureManifest = buildOcrGeneratedFixtureManifest(createdAt)

  return {
    reportId: 'activation-phase-37c-generated-ocr-runtime-verification',
    createdAt,
    config: ocrRuntimeConfig,
    status: verified ? 'verified' : blockers.length > 0 ? 'blocked' : 'planned',
    fixtureSpecs: fixtureManifest.specs,
    iamPlan: buildOcrRuntimeIamPlan(),
    commandPlans: buildOcrRuntimeCommandPlans({ runId: approvedEvidence.runId }),
    approvedEvidence,
    blockers,
    warnings,
    ocrRuntimeVerified: verified,
    phase37DReadiness: approvedEvidence.phase37DReadiness,
    generatedFixturesOnly: true,
    realMediaOcrAllowed: false,
    realVideoOcrAllowed: false,
    captionRenderIntegrationAllowed: false,
    providerAllowed: false,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    cloudRunDeployAllowed: false,
    gpuJobAllowed: false,
    productionReadyAllowed: false,
    internalBetaAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    trackAAllowed: false,
  }
}

export function buildOcrRuntimePlan(createdAt = new Date().toISOString()) {
  return {
    phase: '37C' as const,
    reportId: 'activation-phase-37c-generated-ocr-runtime-verification',
    createdAt,
    config: ocrRuntimeConfig,
    fixtureManifest: buildOcrGeneratedFixtureManifest(createdAt),
    fixtureIds: ocrGeneratedFixtureSpecs.map((fixture) => fixture.fixtureId),
    commands: buildOcrRuntimeCommandPlans(),
    iamPlan: buildOcrRuntimeIamPlan(),
    executionRequires: [
      'GCP_PROJECT_ID=reeditpro',
      'GCP_REGION=us-central1',
      'REEDITPRO_ENV=staging',
      'REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ=true',
      'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true',
      'REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true',
    ],
    doesNotDo: {
      realMediaOcr: false,
      realVideoOcr: false,
      providerExecution: false,
      publicOutput: false,
      cloudRunDeploy: false,
      dockerPush: false,
      gpuJob: false,
      beta: false,
      production: false,
      trackA: false,
    },
  }
}

export function summarizeOcrRuntimeReport(report: OcrRuntimeReport): string {
  return [
    'Phase 37C Generated OCR Runtime Verification',
    `status: ${report.status}`,
    `ocrRuntimeVerified: ${report.ocrRuntimeVerified}`,
    `phase37DReady: ${report.phase37DReadiness.readyForControlledRealVideoOcrSafeZone}`,
    `fixtureCount: ${report.fixtureSpecs.length}`,
    `modelGcsPath: ${report.config.modelGcsPath}`,
    `artifactPrefix: ${report.approvedEvidence.artifactPrefix ?? 'pending'}`,
    `blockers: ${report.blockers.length ? report.blockers.join('; ') : 'none'}`,
    `warnings: ${report.warnings.length ? report.warnings.join('; ') : 'none'}`,
    'blockedScopes: real_media_ocr, real_video_ocr, caption_render_integration, provider, public_output, cloud_run_deploy, gpu, beta, production, track_a',
  ].join('\n')
}
