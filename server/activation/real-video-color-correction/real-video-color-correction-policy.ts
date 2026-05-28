import type { RealVideoColorCorrectionConfig, RealVideoColorRuntimeReport } from './real-video-color-correction-types'

export const realVideoColorCorrectionConfig: RealVideoColorCorrectionConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  phase28RunId: 'phase28-20260528T01552',
  phase29RunId: 'phase29-20260528T02254',
  phase30RunId: 'phase30-20260528T12421',
  phase31RunId: 'phase31-20260528T13060',
  inputBucket: 'reeditpro-staging-reeditpro-final-exports',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  phase31Prefix: 'activation-real-video/phase31/phase31-20260528T13060',
  phase32Prefix: 'activation-real-video/phase32',
  inputGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4',
  expectedInputDurationSeconds: 15.467,
}

export const phase32DoesNotDo = [
  'no second source video',
  'no broad real user media testing',
  'no OpenColorIO or OpenImageIO execution',
  'no GPU execution',
  'no providers',
  'no model downloads',
  'no audio cleanup rerun',
  'no masks, enhancement, or slow motion',
  'no public signed URLs',
  'no service public access change',
  'no secret values',
  'no Revideo',
  'no production or external beta unblock',
]

export function phase32Prefix(runId: string): string {
  if (!/^phase32-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 32 run id: ${runId}`)
  return `${realVideoColorCorrectionConfig.phase32Prefix}/${runId}`
}

export function validateRealVideoColorCorrectionEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId !== undefined && input.projectId !== realVideoColorCorrectionConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region !== undefined && input.region !== realVideoColorCorrectionConfig.region) blockers.push('Region must be us-central1.')
  if (input.env !== undefined && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') {
    blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_COLOR_CORRECTION=true is required for execution.')
  }
  return blockers
}

export function validateRealVideoColorRuntimeReport(report?: RealVideoColorRuntimeReport): string[] {
  if (!report) return ['Phase 32 runtime report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 32 runtime report did not return ok=true.')
  if (report.sourcePhase28RunId !== realVideoColorCorrectionConfig.phase28RunId) blockers.push('Phase 32 used the wrong Phase 28 run.')
  if (report.sourcePhase29RunId !== realVideoColorCorrectionConfig.phase29RunId) blockers.push('Phase 32 used the wrong Phase 29 run.')
  if (report.sourcePhase30RunId !== realVideoColorCorrectionConfig.phase30RunId) blockers.push('Phase 32 used the wrong Phase 30 run.')
  if (report.sourcePhase31RunId !== realVideoColorCorrectionConfig.phase31RunId) blockers.push('Phase 32 used the wrong Phase 31 run.')
  if (report.inputColorSourceObject !== realVideoColorCorrectionConfig.inputGcsUri) blockers.push('Phase 32 used an unapproved input export.')
  if (report.colorAnalysis.sampledFrameCount <= 0) blockers.push('Color analysis did not sample any frames.')
  if (report.colorGradeRecipe.decision === 'blocked') blockers.push('Color grade recipe is blocked.')
  if (!report.colorCorrectedExport?.gcsUri) blockers.push('Private color-corrected export is missing.')
  if (report.colorCorrectedExport && !report.colorCorrectedExport.gcsUri.startsWith(`gs://${realVideoColorCorrectionConfig.finalExportsBucket}/${realVideoColorCorrectionConfig.phase32Prefix}/`)) {
    blockers.push('Color-corrected export was not stored under the private Phase 32 final exports prefix.')
  }
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.approvedPhase31InputOnly) blockers.push('Approved Phase 31 input flag was not true.')
  if (report.safety.secondSourceVideoUsed) blockers.push('A second source video was used.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.gpuUsed) blockers.push('GPU use was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (report.safety.openColorIoUsed || report.safety.openImageIoUsed) blockers.push('OpenColorIO/OpenImageIO execution was reported.')
  if (report.safety.arbitraryFfmpegArgsUsed || report.safety.unapprovedLutUsed) blockers.push('Unsafe FFmpeg args or unapproved LUT use was reported.')
  if (report.safety.audioCleanupRerun) blockers.push('Audio cleanup rerun was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was enabled.')
  if (report.safety.sourceOverwritten) blockers.push('Source overwrite was reported.')
  if (report.safety.masksOrEnhancementExecuted) blockers.push('Masks or enhancement execution was reported.')
  if (report.safety.revideoUsed) blockers.push('Revideo use was reported.')
  return Array.from(new Set(blockers))
}
