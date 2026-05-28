import type { SpeechRuntimeConfig } from './speech-runtime-types'

export const speechRuntimeDoesNotDo = [
  'no GPU deploy or execution',
  'no provider calls',
  'no external model downloads at runtime',
  'no non-approved model use',
  'no real user media',
  'no arbitrary media input',
  'no secret values',
  'no public access',
  'no production or external beta unblock',
]

export const speechRuntimeConfig: SpeechRuntimeConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  imageTag: 'staging-speech-cpu-001',
  jobName: 'reeditpro-staging-speech-runtime-job',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  modelManifestId: 'faster_whisper_tiny_staging_v1',
  modelName: 'Systran/faster-whisper-tiny',
  modelRevision: 'd90ca5fe260221311c53c58e660288d3deb8d356',
  modelAggregateSha256: '331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/',
  modelRuntimePath: '/tmp/reeditpro-model-weights/faster-whisper/tiny',
  targetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-speech-runtime:staging-speech-cpu-001',
  reportObjectPrefix: 'activation-speech-runtime/phase27a',
}

export function validateSpeechRuntimeEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  imageTag?: string
  modelManifestId?: string
  modelGcsPath?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId && input.projectId !== speechRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== speechRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME=true is required for execution.')
  if (input.imageTag && input.imageTag !== speechRuntimeConfig.imageTag) blockers.push('Image tag must be staging-speech-cpu-001.')
  if (input.modelManifestId && input.modelManifestId !== speechRuntimeConfig.modelManifestId) blockers.push('Only faster_whisper_tiny_staging_v1 may be used.')
  if (input.modelGcsPath && input.modelGcsPath !== speechRuntimeConfig.modelGcsPath) blockers.push('Only the approved private tiny model GCS path may be used.')
  return blockers
}

export function validateSpeechRuntimeExecutionReport(report?: {
  ok?: boolean
  safety?: Partial<Record<'providerExecuted' | 'modelDownloadedExternally' | 'realUserMediaUsed' | 'gpuUsed' | 'secretValuesUsed', boolean>>
  model?: { manifestId?: string; gcsPath?: string; aggregateSha256?: string }
  transcription?: { status?: string }
}): string[] {
  if (!report) return ['Speech runtime job execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Speech runtime job did not report ok=true.')
  if (report.model?.manifestId !== speechRuntimeConfig.modelManifestId) blockers.push('Runtime did not use the approved tiny model manifest.')
  if (report.model?.gcsPath !== speechRuntimeConfig.modelGcsPath) blockers.push('Runtime did not use the approved private GCS model path.')
  if (report.model?.aggregateSha256 !== speechRuntimeConfig.modelAggregateSha256) blockers.push('Runtime model checksum does not match Phase 26B evidence.')
  if (report.transcription?.status !== 'completed') blockers.push('faster-whisper runtime transcription did not complete gracefully.')
  if (report.safety?.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety?.modelDownloadedExternally) blockers.push('External model download was reported.')
  if (report.safety?.realUserMediaUsed) blockers.push('Real user media use was reported.')
  if (report.safety?.gpuUsed) blockers.push('GPU use was reported.')
  if (report.safety?.secretValuesUsed) blockers.push('Secret value use was reported.')
  return blockers
}
