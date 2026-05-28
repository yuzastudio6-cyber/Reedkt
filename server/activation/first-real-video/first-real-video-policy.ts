import type { FirstRealVideoConfig, FirstRealVideoRuntimeReport } from './first-real-video-types'

export const firstRealVideoConfig: FirstRealVideoConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  sourceBucket: 'reeditpro-staging-reeditpro-source-media',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  jobName: 'reeditpro-staging-speech-runtime-job',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  imageTag: 'staging-phase28-speech-001',
  sourceVideoPath: '/Users/macuser/Downloads/IMG_6005.MOV',
  modelManifestId: 'faster_whisper_tiny_staging_v1',
  modelName: 'Systran/faster-whisper-tiny',
  modelRevision: 'd90ca5fe260221311c53c58e660288d3deb8d356',
  modelAggregateSha256: '331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/',
  modelRuntimePath: '/tmp/reeditpro-model-weights/faster-whisper/tiny',
}

export const phase28DoesNotDo = [
  'no GPU deploy or execution',
  'no provider calls',
  'no runtime Hugging Face/model download',
  'no model except Systran/faster-whisper-tiny',
  'no arbitrary or multiple media inputs',
  'no public signed URLs',
  'no final render/export',
  'no smart cut, audio cleanup, color, masks, enhancement, or slow motion',
  'no secret values',
  'no production or external beta unblock',
]

export function validateFirstRealVideoEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  sourceVideoPath?: string
  sourceGcsUri?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId && input.projectId !== firstRealVideoConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== firstRealVideoConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_FIRST_REAL_VIDEO_SPEECH_CAPTION=true is required.')
  if (!input.sourceVideoPath && !input.sourceGcsUri) blockers.push('Exactly one approved Phase 28 source video path or GCS URI is required.')
  if (input.sourceVideoPath && input.sourceGcsUri) blockers.push('Only one Phase 28 source input may be provided.')
  if (input.sourceVideoPath && input.sourceVideoPath !== firstRealVideoConfig.sourceVideoPath) {
    blockers.push(`Local source path must be exactly ${firstRealVideoConfig.sourceVideoPath}.`)
  }
  return blockers
}

export function validateFirstRealVideoRuntimeReport(report?: FirstRealVideoRuntimeReport): string[] {
  if (!report) return ['Phase 28 runtime report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 28 runtime report did not return ok=true.')
  if (!report.source.sourceGcsUri.startsWith(`gs://${firstRealVideoConfig.sourceBucket}/activation-real-video/phase28/`)) {
    blockers.push('Source object is not under the approved private Phase 28 source prefix.')
  }
  if (!report.source.hasAudio) blockers.push('Source video did not include an audio stream for speech/caption testing.')
  if (report.model.manifestId !== firstRealVideoConfig.modelManifestId) blockers.push('Runtime did not use the approved tiny model manifest.')
  if (report.model.gcsPath !== firstRealVideoConfig.modelGcsPath) blockers.push('Runtime did not use the approved private model GCS path.')
  if (report.model.aggregateSha256 !== firstRealVideoConfig.modelAggregateSha256) blockers.push('Runtime model checksum did not match Phase 26B evidence.')
  if (report.speechRuntime.status !== 'completed') blockers.push('faster-whisper transcription did not complete.')
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (report.safety.arbitraryRealMediaUsed) blockers.push('Arbitrary real media use was reported.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.gpuUsed) blockers.push('GPU use was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('Runtime external model download was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was enabled.')
  if (report.safety.finalExportCreated) blockers.push('Final export was created, which is outside Phase 28.')
  if (report.safety.smartCutExecuted) blockers.push('Smart cut execution was reported, which is outside Phase 28.')
  if (report.safety.audioCleanupExecuted || report.safety.colorExecuted || report.safety.masksOrEnhancementExecuted) {
    blockers.push('A non-speech/caption execution path was reported.')
  }
  return Array.from(new Set(blockers))
}

export function phase28Prefix(runId: string): string {
  if (!/^phase28-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 28 run id: ${runId}`)
  return `activation-real-video/phase28/${runId}`
}
