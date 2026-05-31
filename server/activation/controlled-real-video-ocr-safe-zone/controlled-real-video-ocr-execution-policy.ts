import { getApprovedOcrRuntimeEvidence, ocrRuntimeConfig } from '../ocr-runtime'
import {
  controlledRealVideoOcrSafeZoneConfig,
  isPrivateGcsUri,
  phase37DControlledRealVideoOcrSafeZoneArtifactPrefix,
} from './controlled-real-video-ocr-safe-zone-policy'
import type {
  ControlledRealVideoOcrExecutionEnvValidationInput,
  ControlledRealVideoOcrExecutionValidationResult,
} from './controlled-real-video-ocr-execution-types'

export const CONTROLLED_REAL_VIDEO_OCR_EXECUTION_EXPECTED_ARTIFACTS = [
  'phase_37d_controlled_real_video_ocr_execution_plan.json',
  'phase_37d_controlled_real_video_sample_manifest.json',
  'phase_37d_frame_extraction_manifest.json',
  'phase_37d_ocr_model_asset_verification.json',
  'phase_37d_ocr_results.json',
  'phase_37d_ocr_safe_zone_manifest.json',
  'phase_37d_caption_collision_report.json',
  'phase_37d_safe_zone_recommendation_report.json',
  'phase_37d_private_artifact_manifest.json',
  'phase_37d_controlled_real_video_ocr_execution_report.json',
] as const

export const CONTROLLED_REAL_VIDEO_OCR_EXECUTION_BLOCKED_SCOPES = [
  'Phase 37E caption/render QA integration',
  'arbitrary media OCR',
  'broad real-video OCR',
  'full-video OCR',
  'unapproved sample windows',
  'raw frame upload',
  'overlay upload',
  'IAM mutation',
  'Docker build/push',
  'Cloud Run deploy/job execution',
  'GPU jobs',
  'provider execution',
  'public output',
  'signed URL source-of-truth',
  'textline orientation classifier auto-download',
  'Track A execution code',
  'internal beta',
  'external beta',
  'paid production',
  'broad real-user media',
] as const

export const controlledRealVideoOcrExecutionConfig = {
  ...controlledRealVideoOcrSafeZoneConfig,
  mode: 'controlled_real_video_safe_zone_execution',
  sourceObjectSizeBytes: 94522751,
  sourceContentType: 'video/mp4',
  sourceLocalFileName: 'color-corrected-export.mp4',
  frameImageExtension: 'png',
  expectedFrameCount: 6,
  lowerThirdZoneId: 'vertical_lower_caption_safe_zone',
  captionZonePadding: 0.025,
} as const

export function phase37DControlledRealVideoOcrExecutionArtifactPrefix(runId: string): string {
  return phase37DControlledRealVideoOcrSafeZoneArtifactPrefix(runId)
}

export function validateControlledRealVideoOcrExecutionEnv(
  input: ControlledRealVideoOcrExecutionEnvValidationInput = {},
): ControlledRealVideoOcrExecutionValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const sourceGcsUri = input.sourceGcsUri ?? process.env.REEDITPRO_CONTROLLED_REAL_VIDEO_OCR_SOURCE_GCS_URI ?? controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri

  if (projectId !== controlledRealVideoOcrSafeZoneConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== controlledRealVideoOcrSafeZoneConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== controlledRealVideoOcrSafeZoneConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== controlledRealVideoOcrSafeZoneConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (sourceGcsUri !== controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri) blockers.push('Only the Phase 37D gate-approved Phase 32 private source may be used.')
  if (!isPrivateGcsUri(sourceGcsUri)) blockers.push('Controlled real-video OCR source must be a private gs:// URI with no query string.')
  if ((input.ocrExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE) !== 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE=true is required.')
  if ((input.frameExtractionConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION) !== 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION=true is required.')
  if ((input.artifactUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD) !== 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true is required.')
  if ((input.privateGcsReadConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ=true is required.')
  if ((input.runtimeExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true is required.')
  if ((input.arbitraryMediaEnabled ?? process.env.ARBITRARY_MEDIA_ENABLED ?? 'false') !== 'false') blockers.push('Arbitrary media execution must remain disabled.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media readiness must remain false.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicOutputEnabled ?? process.env.PUBLIC_OUTPUT_ENABLED ?? 'false') !== 'false') blockers.push('Public output must remain disabled.')
  if ((input.signedUrlSourceOfTruthEnabled ?? process.env.SIGNED_URL_SOURCE_OF_TRUTH_ENABLED ?? 'false') !== 'false') blockers.push('Signed URLs must not be used as source of truth.')
  if ((input.trackAExecutionEnabled ?? process.env.TRACK_A_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Track A execution must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 37D local execution orchestration.')

  const phase37C = getApprovedOcrRuntimeEvidence()
  if (phase37C.status !== 'verified') blockers.push('Phase 37C generated OCR runtime evidence must be verified before Phase 37D execution.')
  if (!phase37C.phase37DReadiness.readyForControlledRealVideoOcrSafeZone) blockers.push('Phase 37C evidence is not ready for controlled real-video OCR safe-zone planning/execution.')
  if (phase37C.modelGcsPath !== ocrRuntimeConfig.modelGcsPath) blockers.push('Phase 37C model GCS path does not match the verified Phase 37B OCR asset path.')

  warnings.push('Phase 37D execution is restricted to one approved Phase 32 sample and six offsets only.')
  warnings.push('Passing Phase 37D execution only enables Phase 37E planning; it does not integrate OCR with caption/render QA.')
  warnings.push('PP-LCNet_x1_0_textline_ori remains deferred and blocked from auto-download.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function assertControlledRealVideoOcrExecutionRunId(runId: string): void {
  phase37DControlledRealVideoOcrExecutionArtifactPrefix(runId)
}
