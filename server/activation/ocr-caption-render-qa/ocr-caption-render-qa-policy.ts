import { getApprovedControlledRealVideoOcrExecutionEvidence } from '../controlled-real-video-ocr-safe-zone'
import { getApprovedOcrRuntimeEvidence } from '../ocr-runtime'
import type {
  OcrCaptionRenderQaCaptionZone,
  OcrCaptionRenderQaStatus,
} from './ocr-caption-render-qa-types'

export const OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS = [
  'phase_37e_ocr_caption_render_qa_plan.json',
  'phase_37e_ocr_safe_zone_input_manifest.json',
  'phase_37e_ocr_text_region_normalization_report.json',
  'phase_37e_caption_constraint_manifest.json',
  'phase_37e_caption_candidate_zone_report.json',
  'phase_37e_caption_overlap_qa_report.json',
  'phase_37e_render_qa_compatibility_manifest.json',
  'phase_37e_qa_gate_report.json',
  'phase_37e_private_artifact_manifest.json',
  'phase_37e_ocr_caption_render_qa_report.json',
] as const

export const OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES = [
  'OCR runtime execution',
  'frame extraction',
  'real media byte processing',
  'video render execution',
  'caption burn-in/render execution',
  'arbitrary media OCR',
  'broad real-video OCR',
  'full-video OCR',
  'public artifacts',
  'signed URL source-of-truth',
  'IAM mutation',
  'Docker build/push',
  'Cloud Run deploy/job execution',
  'provider execution',
  'Track A execution/runtime code',
  'Phase 37F runtime hook execution',
  'internal beta',
  'external beta',
  'paid production',
] as const

export const ocrCaptionRenderQaConfig = {
  phase: '37E',
  mode: 'ocr_caption_render_qa_metadata_integration',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  requiredBranch: 'codex/rp-activation-37e-ocr-safe-zone-caption-render-qa',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  localTempRoot: '/tmp/reeditpro-ocr-caption-render-qa/phase37e',
  padding: 0.025,
  warningOverlapRatio: 0.1,
  blockingOverlapRatio: 0.2,
  lowConfidenceWarningThreshold: 0.6,
  lowerThirdZone: {
    zoneId: 'lower_third_default',
    label: 'Default lower-third caption candidate zone',
    x: 0.05,
    y: 0.68,
    width: 0.9,
    height: 0.27,
    priority: 1,
    coordinateSpace: 'normalized',
    purpose: 'caption_candidate_zone',
  },
  upperThirdZone: {
    zoneId: 'upper_third_default',
    label: 'Default upper-third fallback caption zone',
    x: 0.05,
    y: 0.05,
    width: 0.9,
    height: 0.27,
    priority: 2,
    coordinateSpace: 'normalized',
    purpose: 'caption_candidate_zone',
  },
  centerSafeZone: {
    zoneId: 'center_safe_default',
    label: 'Default center-safe caption fallback zone',
    x: 0.1,
    y: 0.35,
    width: 0.8,
    height: 0.3,
    priority: 3,
    coordinateSpace: 'normalized',
    purpose: 'caption_candidate_zone',
  },
} as const

export interface OcrCaptionRenderQaEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  executeConfirmation?: string
  privateArtifactReadConfirmation?: string
  privateArtifactUploadConfirmation?: string
  ocrRuntimeExecuteConfirmation?: string
  controlledRealVideoOcrExecuteConfirmation?: string
  controlledRealVideoFrameExtractionConfirmation?: string
  arbitraryMediaEnabled?: string
  publicOutputEnabled?: string
  signedUrlSourceOfTruthEnabled?: string
  trackAExecutionEnabled?: string
  productionReady?: string
  internalBetaReady?: string
  externalBetaReady?: string
  inputArtifactUri?: string
  requireExecutionConfirmations?: boolean
}

export interface OcrCaptionRenderQaValidationResult {
  allowed: boolean
  status: OcrCaptionRenderQaStatus
  blockers: string[]
  warnings: string[]
}

export function buildOcrCaptionRenderQaCandidateZones(): OcrCaptionRenderQaCaptionZone[] {
  return [
    { ...ocrCaptionRenderQaConfig.lowerThirdZone },
    { ...ocrCaptionRenderQaConfig.upperThirdZone },
    { ...ocrCaptionRenderQaConfig.centerSafeZone },
  ]
}

export function phase37EOcrCaptionRenderQaArtifactPrefix(runId: string): string {
  if (!/^phase37e-[0-9A-Za-zT]+$/.test(runId)) throw new Error(`Unsafe Phase 37E run id: ${runId}`)
  return `activation/phase37e/ocr-caption-render-qa/${runId}`
}

export function phase37EOcrCaptionRenderQaArtifactPrefixUri(runId: string): string {
  return `gs://${ocrCaptionRenderQaConfig.qaBucket}/${phase37EOcrCaptionRenderQaArtifactPrefix(runId)}/`
}

export function validateOcrCaptionRenderQaEnv(
  input: OcrCaptionRenderQaEnvValidationInput = {},
): OcrCaptionRenderQaValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const requireExecution = input.requireExecutionConfirmations === true
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const inputArtifactUri = input.inputArtifactUri ?? process.env.REEDITPRO_OCR_CAPTION_RENDER_QA_INPUT_ARTIFACT_URI

  if (projectId !== ocrCaptionRenderQaConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== ocrCaptionRenderQaConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== ocrCaptionRenderQaConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== ocrCaptionRenderQaConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')

  if (requireExecution) {
    if ((input.executeConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_CAPTION_RENDER_QA_EXECUTE) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_CAPTION_RENDER_QA_EXECUTE=true is required.')
    if ((input.privateArtifactReadConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_READ=true is required.')
    if ((input.privateArtifactUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD) !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_QA_PRIVATE_ARTIFACT_UPLOAD=true is required.')
  }

  if ((input.ocrRuntimeExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE ?? 'false') !== 'false') blockers.push('OCR runtime execution must remain disabled for Phase 37E.')
  if ((input.controlledRealVideoOcrExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE ?? 'false') !== 'false') blockers.push('Controlled real-video OCR execution must not be re-run in Phase 37E.')
  if ((input.controlledRealVideoFrameExtractionConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION ?? 'false') !== 'false') blockers.push('Frame extraction must remain disabled for Phase 37E.')
  if ((input.arbitraryMediaEnabled ?? process.env.ARBITRARY_MEDIA_ENABLED ?? 'false') !== 'false') blockers.push('Arbitrary media execution must remain disabled.')
  if ((input.publicOutputEnabled ?? process.env.PUBLIC_OUTPUT_ENABLED ?? 'false') !== 'false') blockers.push('Public output must remain disabled.')
  if ((input.signedUrlSourceOfTruthEnabled ?? process.env.SIGNED_URL_SOURCE_OF_TRUTH_ENABLED ?? 'false') !== 'false') blockers.push('Signed URLs must not be used as source of truth.')
  if ((input.trackAExecutionEnabled ?? process.env.TRACK_A_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Track A execution must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.internalBetaReady ?? process.env.REEDITPRO_INTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('Internal beta flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 37E local metadata QA.')

  if (inputArtifactUri) {
    if (!inputArtifactUri.startsWith('gs://')) blockers.push('Phase 37E input artifacts must be private gs:// JSON artifacts only.')
    if (inputArtifactUri.includes('?')) blockers.push('Signed URL query strings are blocked for Phase 37E input artifacts.')
    if (!isAllowedPhase37InputArtifactUri(inputArtifactUri)) blockers.push('Phase 37E input artifact URI is not one of the approved Phase 37C/37D private artifact prefixes.')
  }

  const phase37C = getApprovedOcrRuntimeEvidence()
  if (phase37C.status !== 'verified') blockers.push('Phase 37C generated OCR runtime evidence must be verified.')
  if (!phase37C.phase37DReadiness.readyForControlledRealVideoOcrSafeZone) blockers.push('Phase 37C evidence is not ready for controlled OCR safe-zone use.')

  const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
  if (phase37D.status !== 'passed') blockers.push('Phase 37D controlled real-video OCR safe-zone execution evidence must be passed.')
  if (!phase37D.phase37EReadiness.readyForControlledCaptionRenderQaPlanning) blockers.push('Phase 37D evidence is not ready for Phase 37E caption/render QA planning.')

  warnings.push('Phase 37E is metadata-only and does not run OCR, frame extraction, media processing, or rendering.')
  warnings.push('Controlled real-media OCR text remains redacted; generated fixture text is synthetic only.')
  warnings.push('PP-LCNet_x1_0_textline_ori remains deferred and blocked from auto-download.')
  warnings.push('PaddleOCR dictionary-path limitation remains recorded from Phase 37C/37D.')

  return {
    allowed: blockers.length === 0,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    blockers,
    warnings,
  }
}

function isAllowedPhase37InputArtifactUri(gcsUri: string): boolean {
  const phase37C = getApprovedOcrRuntimeEvidence()
  const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
  return Boolean(
    phase37C.artifactPrefix && gcsUri.startsWith(phase37C.artifactPrefix)
      || phase37D.artifactPrefix && gcsUri.startsWith(phase37D.artifactPrefix),
  )
}
