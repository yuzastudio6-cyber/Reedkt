import type { BiRefNetRuntimeConfig } from './birefnet-runtime-types'

export const birefnetRuntimeConfig: BiRefNetRuntimeConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  imageTag: 'staging-birefnet-runtime-001',
  jobName: 'reeditpro-staging-birefnet-runtime-job',
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  modelManifestId: 'birefnet_main_staging_v1',
  modelName: 'ZhengPeng7/BiRefNet',
  modelRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4',
  modelAggregateSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/',
  modelRuntimePath: '/tmp/reeditpro-model-weights/birefnet/main',
  targetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-birefnet-runtime:staging-birefnet-runtime-001',
  reportObjectPrefix: 'activation-mask-runtime/phase33c',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  gpuType: 'nvidia-l4',
  gpuCount: 1,
  cpu: 4,
  memory: '16Gi',
}

export const birefnetRuntimeDoesNotDo = [
  'no real video or real frame processing',
  'no SAM2 download or execution',
  'no Hugging Face/runtime model downloads',
  'no provider calls',
  'no text-behind-subject execution',
  'no public URLs or public buckets',
  'no RTX PRO 6000',
  'no Revideo',
  'no production or external beta unlock',
]

export function validateBiRefNetRuntimeEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  imageTag?: string
  modelManifestId?: string
  modelGcsPath?: string
  modelRevision?: string
  modelChecksum?: string
  gpuType?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId && input.projectId !== birefnetRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== birefnetRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_BIREFNET_RUNTIME=true is required for execution.')
  if (input.imageTag && input.imageTag !== birefnetRuntimeConfig.imageTag) blockers.push('Image tag must be staging-birefnet-runtime-001.')
  if (input.modelManifestId && input.modelManifestId !== birefnetRuntimeConfig.modelManifestId) blockers.push('Only birefnet_main_staging_v1 may be used.')
  if (input.modelGcsPath && input.modelGcsPath !== birefnetRuntimeConfig.modelGcsPath) blockers.push('Only the approved private BiRefNet model GCS path may be used.')
  if (input.modelRevision && input.modelRevision !== birefnetRuntimeConfig.modelRevision) blockers.push('BiRefNet revision must match Phase 33B evidence.')
  if (input.modelChecksum && input.modelChecksum !== birefnetRuntimeConfig.modelAggregateSha256) blockers.push('BiRefNet checksum must match Phase 33B evidence.')
  if (input.gpuType && input.gpuType !== birefnetRuntimeConfig.gpuType) blockers.push('Only nvidia-l4 is allowed for Phase 33C.')
  return blockers
}
