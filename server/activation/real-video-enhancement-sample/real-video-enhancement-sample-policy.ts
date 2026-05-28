import type { RealVideoEnhancementSampleConfig, RealVideoEnhancementSampleExecutionReport } from './real-video-enhancement-sample-types'

export const realVideoEnhancementSampleConfig: RealVideoEnhancementSampleConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  phase33dRunId: 'phase33d-20260528T161056',
  sourceFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
  sourceBucket: 'reeditpro-staging-reeditpro-generated-assets',
  sourcePrefix: 'activation-real-video/phase33d/phase33d-20260528T161056/',
  modelManifestId: 'real_esrgan_x4plus_staging_v1',
  modelName: 'RealESRGAN_x4plus',
  modelReleaseVersion: 'v0.1.0',
  modelFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
  modelAggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/',
  modelRuntimePath: '/tmp/reeditpro-model-weights/real-esrgan/x4plus',
  modelFileName: 'RealESRGAN_x4plus.pth',
  runtimeJobName: 'reeditpro-staging-real-esrgan-runtime-job',
  gpuServiceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  runtimeImageTag: 'staging-real-esrgan-sample-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-real-esrgan-runtime:staging-real-esrgan-sample-001',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  phase34dPrefix: 'activation-real-video/phase34d',
  gpuType: 'nvidia-l4',
  gpuCount: 1,
  cpu: 4,
  memory: '16Gi',
}

export function validateRealVideoEnhancementSampleEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  sourceFrameGcsUri?: string
  modelManifestId?: string
  modelGcsPath?: string
  fileSha256?: string
  aggregateSha256?: string
  gpuType?: string
  faceEnhance?: string
  providerExecution?: string
  modelDownloads?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId && input.projectId !== realVideoEnhancementSampleConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== realVideoEnhancementSampleConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_ENHANCEMENT_SAMPLE=true is required for execution.')
  if (input.sourceFrameGcsUri && input.sourceFrameGcsUri !== realVideoEnhancementSampleConfig.sourceFrameGcsUri) blockers.push('Only the approved Phase 33D representative frame is allowed.')
  if (input.modelManifestId && input.modelManifestId !== realVideoEnhancementSampleConfig.modelManifestId) blockers.push('Only real_esrgan_x4plus_staging_v1 may be used.')
  if (input.modelGcsPath && input.modelGcsPath !== realVideoEnhancementSampleConfig.modelGcsPath) blockers.push('Only the approved private Real-ESRGAN model path may be used.')
  if (input.fileSha256 && input.fileSha256 !== realVideoEnhancementSampleConfig.modelFileSha256) blockers.push('RealESRGAN_x4plus file checksum must match Phase 34B evidence.')
  if (input.aggregateSha256 && input.aggregateSha256 !== realVideoEnhancementSampleConfig.modelAggregateSha256) blockers.push('RealESRGAN_x4plus aggregate checksum must match Phase 34B evidence.')
  if (input.gpuType && input.gpuType !== realVideoEnhancementSampleConfig.gpuType) blockers.push('Only nvidia-l4 is allowed for Phase 34D.')
  if (input.faceEnhance && input.faceEnhance !== 'false') blockers.push('REAL_ESRGAN_FACE_ENHANCE=false is required.')
  if (input.providerExecution && input.providerExecution !== 'false') blockers.push('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (input.modelDownloads && input.modelDownloads !== 'false') blockers.push('MODEL_DOWNLOADS_ENABLED=false is required.')
  return blockers
}

export function validateRealVideoEnhancementSampleExecutionEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  sourceFrameGcsUri?: string
  modelManifestId?: string
  modelGcsPath?: string
  fileSha256?: string
  aggregateSha256?: string
  gpuType?: string
  faceEnhance?: string
  providerExecution?: string
  modelDownloads?: string
}): string[] {
  const blockers: string[] = []
  const required: Array<[keyof typeof input, string]> = [
    ['projectId', 'GCP_PROJECT_ID is required for Phase 34D execute mode.'],
    ['region', 'GCP_REGION is required for Phase 34D execute mode.'],
    ['env', 'REEDITPRO_ENV is required for Phase 34D execute mode.'],
    ['confirmation', 'REEDITPRO_CONFIRM_REAL_VIDEO_ENHANCEMENT_SAMPLE is required for Phase 34D execute mode.'],
    ['sourceFrameGcsUri', 'REEDITPRO_PHASE34D_INPUT_FRAME_GCS_URI is required for Phase 34D execute mode.'],
    ['modelManifestId', 'REEDITPRO_APPROVED_ENHANCEMENT_MODEL_ID is required for Phase 34D execute mode.'],
    ['modelGcsPath', 'REEDITPRO_MODEL_GCS_PATH is required for Phase 34D execute mode.'],
    ['fileSha256', 'REEDITPRO_MODEL_EXPECTED_FILE_SHA256 is required for Phase 34D execute mode.'],
    ['aggregateSha256', 'REEDITPRO_MODEL_EXPECTED_AGGREGATE_SHA256 is required for Phase 34D execute mode.'],
    ['gpuType', 'REEDITPRO_GPU_TYPE is required for Phase 34D execute mode.'],
    ['faceEnhance', 'REAL_ESRGAN_FACE_ENHANCE is required for Phase 34D execute mode.'],
    ['providerExecution', 'PROVIDER_EXECUTION_ENABLED is required for Phase 34D execute mode.'],
    ['modelDownloads', 'MODEL_DOWNLOADS_ENABLED is required for Phase 34D execute mode.'],
  ]
  for (const [key, message] of required) {
    if (input[key] === undefined || input[key] === '') blockers.push(message)
  }
  return blockers.concat(validateRealVideoEnhancementSampleEnv(input))
}

export function validateRealVideoEnhancementSampleReport(report?: RealVideoEnhancementSampleExecutionReport): string[] {
  if (!report) return ['Phase 34D Real-ESRGAN enhancement sample execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 34D Real-ESRGAN sample job did not report ok=true.')
  if (report.sourcePhase33DRunId !== realVideoEnhancementSampleConfig.phase33dRunId) blockers.push('Execution used an unapproved Phase 33D run.')
  if (report.sourceFrameGcsUri !== realVideoEnhancementSampleConfig.sourceFrameGcsUri) blockers.push('Execution used an unapproved source frame.')
  if (report.model.manifestId !== realVideoEnhancementSampleConfig.modelManifestId) blockers.push('Execution did not use the approved Real-ESRGAN manifest.')
  if (report.model.name !== realVideoEnhancementSampleConfig.modelName) blockers.push('Execution did not use RealESRGAN_x4plus.')
  if (report.model.fileSha256 !== realVideoEnhancementSampleConfig.modelFileSha256) blockers.push('Execution file checksum does not match Phase 34B evidence.')
  if (report.model.aggregateSha256 !== realVideoEnhancementSampleConfig.modelAggregateSha256) blockers.push('Execution aggregate checksum does not match Phase 34B evidence.')
  if (!report.gpu.cudaAvailable || report.gpu.type !== 'nvidia-l4') blockers.push('Execution did not confirm nvidia-l4 CUDA availability.')
  if (report.sampleCrop.width < 256 || report.sampleCrop.height < 256) blockers.push('Sample crop is below the minimum 256x256 guard.')
  if (report.sampleCrop.width >= report.sourceFrame.width && report.sampleCrop.height >= report.sourceFrame.height) blockers.push('Execution appears to have enhanced the full source frame.')
  if (report.enhancedSample.status !== 'completed') blockers.push('Real-ESRGAN enhanced sample was not completed.')
  if (report.enhancedSample.width !== report.sampleCrop.width * 4 || report.enhancedSample.height !== report.sampleCrop.height * 4) blockers.push('Enhanced sample output is not x4 sample size.')
  if (report.qa.status === 'blocked' || report.qa.blockers.length > 0) blockers.push('Enhancement sample QA has blocking failures.')
  if (!report.safety.exactlyOneBoundedSample) blockers.push('Execution did not confirm exactly one bounded sample.')
  if (report.safety.fullFrameEnhanced) blockers.push('Full-frame enhancement was reported.')
  if (report.safety.fullVideoEnhancementExecuted) blockers.push('Full-video enhancement was reported.')
  if (report.safety.secondFrameOrVideoUsed) blockers.push('A second frame/video source was reported.')
  if (report.safety.filmUsed) blockers.push('FILM use was reported.')
  if (report.safety.slowMotionExecuted) blockers.push('Slow-motion execution was reported.')
  if (report.safety.faceEnhanceRan) blockers.push('GFPGAN/face enhancement was reported.')
  if (report.safety.gfpganWeightsPresent) blockers.push('GFPGAN weights were present.')
  if (report.safety.facexlibWeightsPresent) blockers.push('facexlib weights were present.')
  if (report.safety.alternateRealEsrganWeightsPresent) blockers.push('Alternate Real-ESRGAN weights were present.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.rtxPro6000Used) blockers.push('RTX PRO 6000 use was reported.')
  if (report.safety.revideoUsed) blockers.push('Revideo use was reported.')
  return blockers
}
