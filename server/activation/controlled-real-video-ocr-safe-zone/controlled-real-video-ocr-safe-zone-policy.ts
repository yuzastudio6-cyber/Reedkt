import type {
  ControlledRealVideoOcrSafeZoneConfig,
  ControlledRealVideoOcrSafeZoneEnvValidationInput,
  ControlledRealVideoOcrSafeZoneValidationResult,
  ControlledRealVideoSampleCandidate,
} from './controlled-real-video-ocr-safe-zone-types'

export const controlledRealVideoOcrSafeZoneConfig: ControlledRealVideoOcrSafeZoneConfig = {
  phase: '37D',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'metadata_only_planning_gate',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaArtifactPrefix: 'activation/phase37d/controlled-real-video-ocr-safe-zone',
  localTempRoot: '/tmp/reeditpro-ocr-runtime/phase37d',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  selectedChainId: 'controlled-real-video-chain-phase28-through-phase32-v1',
  selectedSampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
  selectedSourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  selectedSourceSha256: '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa',
  selectedWindowStartSeconds: 6.9,
  selectedWindowEndSeconds: 8.9,
  selectedFrameOffsetsSeconds: [6.9, 7.3, 7.7, 8.1, 8.5, 8.9],
  maxWindows: 3,
  maxSampledFrames: 12,
  selectedMaxSampledFrames: 6,
  expectedSourceDurationSeconds: 15.467,
}

export const controlledRealVideoOcrSafeZoneDoesNotDo = [
  'no real-video OCR execution',
  'no frame extraction',
  'no media byte download or read',
  'no arbitrary uploaded media',
  'no public URLs or signed URLs as source of truth',
  'no model downloads',
  'no textline orientation classifier download',
  'no artifact upload',
  'no IAM mutation',
  'no Docker build or push',
  'no Cloud Run deploy or job execution',
  'no provider calls',
  'no caption/render QA integration',
  'no beta or production unlock',
  'no Track A execution code',
]

export const CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_EXPECTED_ARTIFACTS = [
  'phase_37d_controlled_real_video_ocr_safe_zone_plan.json',
  'phase_37d_controlled_chain_manifest.json',
  'phase_37d_selected_sample_manifest.json',
  'phase_37d_future_frame_sampling_manifest.json',
  'phase_37d_future_ocr_text_regions_schema.json',
  'phase_37d_future_caption_safe_zone_schema.json',
  'phase_37d_future_collision_report_schema.json',
  'phase_37d_future_private_artifact_manifest_schema.json',
  'phase_37d_controlled_real_video_ocr_safe_zone_report.json',
]

export const CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_BLOCKED_SCOPES = [
  'real-video OCR execution',
  'frame extraction',
  'media byte reads/downloads',
  'arbitrary media',
  'artifact upload',
  'IAM/GCP mutation',
  'Docker build/push',
  'Cloud Run deploy/job execution',
  'provider execution',
  'caption/render QA integration',
  'public output',
  'signed URL source-of-truth',
  'textline orientation classifier auto-download',
  'Track A execution code',
  'internal beta',
  'external beta',
  'paid production',
  'broad real-user media',
]

export function phase37DControlledRealVideoOcrSafeZoneArtifactPrefix(runId: string): string {
  if (!/^phase37d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 37D run id: ${runId}`)
  return `${controlledRealVideoOcrSafeZoneConfig.qaArtifactPrefix}/${runId}`
}

export function isPrivateGcsUri(uri: string): boolean {
  return uri.startsWith('gs://') && !uri.includes('?') && !uri.startsWith('http://') && !uri.startsWith('https://')
}

export function validateControlledRealVideoOcrSafeZoneStaticPlan(input: {
  projectId?: string
  region?: string
  env?: string
  mode?: string
  sourceGcsUri?: string
  selectedSamples?: ControlledRealVideoSampleCandidate[]
} = {}): ControlledRealVideoOcrSafeZoneValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const selectedSamples = input.selectedSamples

  if (input.projectId && input.projectId !== controlledRealVideoOcrSafeZoneConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== controlledRealVideoOcrSafeZoneConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== controlledRealVideoOcrSafeZoneConfig.env) blockers.push('Environment must be staging.')
  if (input.mode && input.mode !== controlledRealVideoOcrSafeZoneConfig.mode) blockers.push('Phase 37D mode must be metadata_only_planning_gate.')
  if (input.sourceGcsUri && input.sourceGcsUri !== controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri) blockers.push('Only the approved Phase 32 private color-corrected export may be selected for Phase 37D.')
  if (!isPrivateGcsUri(input.sourceGcsUri ?? controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri)) blockers.push('Phase 37D source must be a private gs:// URI with no query string.')
  if (selectedSamples && selectedSamples.length !== 1) blockers.push('Phase 37D must select exactly one controlled real-video sample candidate.')
  if (selectedSamples) {
    for (const sample of selectedSamples) {
      blockers.push(...validateControlledRealVideoSampleCandidate(sample).blockers)
    }
  }

  warnings.push('Phase 37D is a metadata-only planning gate; it does not read media bytes, extract frames, run OCR, upload artifacts, or mutate GCP/IAM.')
  warnings.push('The PaddleOCR dictionary-path limitation from Phase 37C is carried forward as a controlled-real-video OCR risk.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateControlledRealVideoOcrSafeZonePlanningEnv(
  input: ControlledRealVideoOcrSafeZoneEnvValidationInput = {},
): ControlledRealVideoOcrSafeZoneValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV

  if (projectId && projectId !== controlledRealVideoOcrSafeZoneConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro when set.')
  if (input.activeProject && input.activeProject !== controlledRealVideoOcrSafeZoneConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro when checked.')
  if (region && region !== controlledRealVideoOcrSafeZoneConfig.region) blockers.push('GCP_REGION must be exactly us-central1 when set.')
  if (env && env !== controlledRealVideoOcrSafeZoneConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging when set.')
  if ((input.mode ?? process.env.REEDITPRO_CONTROLLED_REAL_VIDEO_OCR_SAFE_ZONE_MODE ?? controlledRealVideoOcrSafeZoneConfig.mode) !== controlledRealVideoOcrSafeZoneConfig.mode) blockers.push('Phase 37D mode must remain metadata_only_planning_gate.')
  if ((input.sourceGcsUri ?? process.env.REEDITPRO_CONTROLLED_REAL_VIDEO_OCR_SOURCE_GCS_URI ?? controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri) !== controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri) blockers.push('Only the approved Phase 32 private color-corrected export may be used.')
  if ((input.controlledRealVideoOcrExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE ?? 'false') === 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE must not be true in the Phase 37D metadata-only gate.')
  if ((input.frameExtractionConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION ?? 'false') === 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION must not be true in the Phase 37D metadata-only gate.')
  if ((input.artifactUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD ?? 'false') === 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD must not be true in the Phase 37D metadata-only gate.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input execution must remain disabled.')
  if ((input.arbitraryMediaEnabled ?? process.env.ARBITRARY_MEDIA_ENABLED ?? 'false') !== 'false') blockers.push('Arbitrary media must remain disabled.')
  if ((input.modelDownloadEnabled ?? process.env.MODEL_DOWNLOAD_ENABLED ?? 'false') !== 'false') blockers.push('Model downloads must remain disabled.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.trackAExecutionEnabled ?? process.env.TRACK_A_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Track A execution must remain disabled.')
  if ((input.publicOutputEnabled ?? process.env.PUBLIC_OUTPUT_ENABLED ?? 'false') !== 'false') blockers.push('Public output must remain disabled.')
  if ((input.signedUrlSourceOfTruthEnabled ?? process.env.SIGNED_URL_SOURCE_OF_TRUTH_ENABLED ?? 'false') !== 'false') blockers.push('Signed URLs must not be used as source of truth.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Future real-video OCR execution requires a later explicit phase with separate confirmations; this gate intentionally rejects those confirmations when set.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateControlledRealVideoSampleCandidate(
  sample: ControlledRealVideoSampleCandidate,
): ControlledRealVideoOcrSafeZoneValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const config = controlledRealVideoOcrSafeZoneConfig

  if (sample.sampleId !== config.selectedSampleId) blockers.push('Selected sample id does not match Phase 37D approved sample id.')
  if (sample.chainId !== config.selectedChainId) blockers.push('Selected chain id does not match Phase 37D approved chain id.')
  if (sample.sourceGcsUri !== config.selectedSourceGcsUri) blockers.push('Selected sample source must be the Phase 32 color-corrected export.')
  if (!isPrivateGcsUri(sample.sourceGcsUri)) blockers.push('Selected sample source must be a private gs:// URI.')
  if (sample.sourceSha256 !== config.selectedSourceSha256) blockers.push('Selected sample SHA-256 must match Phase 32 export evidence.')
  if (sample.plannedWindow.startSeconds !== config.selectedWindowStartSeconds) blockers.push('Selected window start must be 6.9s.')
  if (sample.plannedWindow.endSeconds !== config.selectedWindowEndSeconds) blockers.push('Selected window end must be 8.9s.')
  if (sample.plannedWindow.durationSeconds !== 2) blockers.push('Selected window duration must be exactly 2 seconds.')
  if (sample.plannedFrameOffsetsSeconds.length !== config.selectedMaxSampledFrames) blockers.push('Selected frame offsets must contain exactly 6 planned future frames.')
  if (sample.plannedFrameOffsetsSeconds.length > config.maxSampledFrames) blockers.push('Selected frame offsets exceed the Phase 37D maximum of 12 frames.')
  if (sample.maxSampledFrames !== config.selectedMaxSampledFrames) blockers.push('Selected sample maxSampledFrames must be 6.')
  if (sample.plannedFrameOffsetsSeconds.some((offset) => offset < sample.plannedWindow.startSeconds || offset > sample.plannedWindow.endSeconds)) blockers.push('Every planned frame offset must be inside the selected window.')
  if (sample.plannedWindow.endSeconds > sample.sourceDurationSeconds) blockers.push('Selected window exceeds the approved source duration evidence.')
  if (!sample.privateGcsSourceOnly) blockers.push('Selected sample must be private GCS source only.')
  if (sample.mediaBytesRead) blockers.push('Phase 37D must not read media bytes.')
  if (sample.frameExtractionPerformed) blockers.push('Phase 37D must not extract frames.')
  if (sample.realVideoOcrPerformed) blockers.push('Phase 37D must not run real-video OCR.')
  if (sample.artifactUploadPerformed) blockers.push('Phase 37D must not upload artifacts.')
  if (sample.captionRenderIntegrationPerformed) blockers.push('Phase 37D must not perform caption/render integration.')

  warnings.push('Selected sample bounds are planned for future execution only and are not frame-extracted in Phase 37D.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
