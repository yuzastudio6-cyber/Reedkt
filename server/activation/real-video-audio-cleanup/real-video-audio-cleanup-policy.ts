import type { RealVideoAudioCleanupConfig, RealVideoAudioCleanupRuntimeReport } from './real-video-audio-cleanup-types'

export const realVideoAudioCleanupConfig: RealVideoAudioCleanupConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  phase28RunId: 'phase28-20260528T01552',
  phase29RunId: 'phase29-20260528T02254',
  phase30RunId: 'phase30-20260528T12421',
  inputBucket: 'reeditpro-staging-reeditpro-final-exports',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  phase30Prefix: 'activation-real-video/phase30/phase30-20260528T12421',
  phase31Prefix: 'activation-real-video/phase31',
  inputGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/phase30-20260528T12421/final-export.mp4',
  expectedInputDurationSeconds: 15.47,
  targetIntegratedLufs: -16,
  targetTruePeakDbtp: -1.5,
  targetLra: 11,
}

export const phase31DoesNotDo = [
  'no second source video',
  'no broad real user media testing',
  'no DeepFilterNet, RNNoise, Demucs, or model audio tools',
  'no GPU execution',
  'no providers',
  'no model downloads',
  'no color correction, masks, enhancement, or slow motion',
  'no public signed URLs',
  'no service public access change',
  'no secret values',
  'no Revideo',
  'no production or external beta unblock',
]

export function phase31Prefix(runId: string): string {
  if (!/^phase31-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 31 run id: ${runId}`)
  return `${realVideoAudioCleanupConfig.phase31Prefix}/${runId}`
}

export function validateRealVideoAudioCleanupEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId !== undefined && input.projectId !== realVideoAudioCleanupConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region !== undefined && input.region !== realVideoAudioCleanupConfig.region) blockers.push('Region must be us-central1.')
  if (input.env !== undefined && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') {
    blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_AUDIO_CLEANUP=true is required for execution.')
  }
  return blockers
}

export function validateRealVideoAudioCleanupRuntimeReport(report?: RealVideoAudioCleanupRuntimeReport): string[] {
  if (!report) return ['Phase 31 runtime report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 31 runtime report did not return ok=true.')
  if (report.sourcePhase28RunId !== realVideoAudioCleanupConfig.phase28RunId) blockers.push('Phase 31 used the wrong Phase 28 run.')
  if (report.sourcePhase29RunId !== realVideoAudioCleanupConfig.phase29RunId) blockers.push('Phase 31 used the wrong Phase 29 run.')
  if (report.sourcePhase30RunId !== realVideoAudioCleanupConfig.phase30RunId) blockers.push('Phase 31 used the wrong Phase 30 run.')
  if (report.inputFinalExportObject !== realVideoAudioCleanupConfig.inputGcsUri) blockers.push('Phase 31 used an unapproved input final export.')
  if (!report.loudnessBefore) blockers.push('Loudness-before measurement is missing.')
  if (!report.loudnessAfter) blockers.push('Loudness-after measurement is missing.')
  if (!report.normalizedExport?.gcsUri) blockers.push('Private audio-normalized export is missing.')
  if (report.normalizedExport && !report.normalizedExport.gcsUri.startsWith(`gs://${realVideoAudioCleanupConfig.finalExportsBucket}/${realVideoAudioCleanupConfig.phase31Prefix}/`)) {
    blockers.push('Audio-normalized export was not stored under the private Phase 31 final exports prefix.')
  }
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.approvedPhase30InputOnly) blockers.push('Approved Phase 30 input flag was not true.')
  if (report.safety.secondSourceVideoUsed) blockers.push('A second source video was used.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.gpuUsed) blockers.push('GPU use was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (report.safety.deepFilterNetUsed || report.safety.rnnoiseUsed || report.safety.demucsUsed) blockers.push('Out-of-scope model audio cleanup was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was enabled.')
  if (report.safety.sourceOverwritten) blockers.push('Source overwrite was reported.')
  if (report.safety.colorExecuted || report.safety.masksOrEnhancementExecuted) blockers.push('Out-of-scope visual processing was reported.')
  if (report.safety.revideoUsed) blockers.push('Revideo use was reported.')
  return Array.from(new Set(blockers))
}
