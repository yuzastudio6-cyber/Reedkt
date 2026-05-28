import type { RealEsrganRuntimeConfig } from './real-esrgan-runtime-types'

export const realEsrganRuntimeConfig: RealEsrganRuntimeConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  imageTag: 'staging-real-esrgan-runtime-001',
  jobName: 'reeditpro-staging-real-esrgan-runtime-job',
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  modelManifestId: 'real_esrgan_x4plus_staging_v1',
  modelName: 'RealESRGAN_x4plus',
  sourceUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
  releaseVersion: 'v0.1.0',
  modelFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
  modelAggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/',
  modelRuntimePath: '/tmp/reeditpro-model-weights/real-esrgan/x4plus',
  modelFileName: 'RealESRGAN_x4plus.pth',
  targetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-real-esrgan-runtime:staging-real-esrgan-runtime-001',
  reportObjectPrefix: 'activation-enhancement-runtime/phase34c',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  gpuType: 'nvidia-l4',
  gpuCount: 1,
  cpu: 4,
  memory: '16Gi',
}

export const realEsrganRuntimeDoesNotDo = [
  'no real video or real frame processing',
  'no full-video enhancement',
  'no FILM download or execution',
  'no slow motion',
  'no alternate Real-ESRGAN model weights',
  'no GFPGAN/facexlib weights or face enhancement',
  'no runtime model downloads',
  'no provider calls',
  'no public URLs or public buckets',
  'no RTX PRO 6000',
  'no Revideo',
  'no production or external beta unlock',
]

export function validateRealEsrganRuntimeEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  imageTag?: string
  modelManifestId?: string
  modelGcsPath?: string
  fileSha256?: string
  aggregateSha256?: string
  gpuType?: string
  faceEnhance?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId && input.projectId !== realEsrganRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== realEsrganRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_REAL_ESRGAN_RUNTIME=true is required for execution.')
  if (input.imageTag && input.imageTag !== realEsrganRuntimeConfig.imageTag) blockers.push('Image tag must be staging-real-esrgan-runtime-001.')
  if (input.modelManifestId && input.modelManifestId !== realEsrganRuntimeConfig.modelManifestId) blockers.push('Only real_esrgan_x4plus_staging_v1 may be used.')
  if (input.modelGcsPath && input.modelGcsPath !== realEsrganRuntimeConfig.modelGcsPath) blockers.push('Only the approved private Real-ESRGAN x4plus model GCS path may be used.')
  if (input.fileSha256 && input.fileSha256 !== realEsrganRuntimeConfig.modelFileSha256) blockers.push('RealESRGAN_x4plus file checksum must match Phase 34B evidence.')
  if (input.aggregateSha256 && input.aggregateSha256 !== realEsrganRuntimeConfig.modelAggregateSha256) blockers.push('RealESRGAN_x4plus aggregate checksum must match Phase 34B evidence.')
  if (input.gpuType && input.gpuType !== realEsrganRuntimeConfig.gpuType) blockers.push('Only nvidia-l4 is allowed for Phase 34C.')
  if (input.faceEnhance && input.faceEnhance !== 'false') blockers.push('REAL_ESRGAN_FACE_ENHANCE=false is required.')
  return blockers
}
