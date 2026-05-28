import type { RealVideoBiRefNetFrameMaskReport, RealVideoFrameExtractionReport, RealVideoMaskConfig } from './real-video-mask-types'

export const realVideoMaskConfig: RealVideoMaskConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  phase32RunId: 'phase32-20260528T13330',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceBucket: 'reeditpro-staging-reeditpro-final-exports',
  sourceObject: 'activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  modelManifestId: 'birefnet_main_staging_v1',
  modelName: 'ZhengPeng7/BiRefNet',
  modelRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4',
  modelAggregateSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/',
  modelRuntimePath: '/tmp/reeditpro-model-weights/birefnet/main',
  renderJobName: 'reeditpro-staging-render-job',
  birefnetJobName: 'reeditpro-staging-birefnet-runtime-job',
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  gpuServiceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  renderImageTag: 'staging-phase33d-frame-001',
  birefnetImageTag: 'staging-birefnet-realframe-001',
  renderTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-phase33d-frame-001',
  birefnetTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-birefnet-runtime:staging-birefnet-realframe-001',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  phase33dPrefix: 'activation-real-video/phase33d',
}

export const phase33dDoesNotDo = [
  'no second video',
  'no multiple frame sampling',
  'no full video masking',
  'no SAM2',
  'no text-behind-subject execution',
  'no final render/export',
  'no providers',
  'no runtime model downloads',
  'no public URLs',
  'no public buckets',
  'no Revideo',
  'no production or external beta unblock',
]

export function phase33dPrefix(runId: string): string {
  if (!/^phase33d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 33D run id: ${runId}`)
  return `${realVideoMaskConfig.phase33dPrefix}/${runId}`
}

export function validateRealVideoMaskEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  sourceGcsUri?: string
  modelManifestId?: string
  modelGcsPath?: string
  modelRevision?: string
  modelChecksum?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId !== undefined && input.projectId !== realVideoMaskConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region !== undefined && input.region !== realVideoMaskConfig.region) blockers.push('Region must be us-central1.')
  if (input.env !== undefined && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK=true is required for execution.')
  if (input.sourceGcsUri !== undefined && input.sourceGcsUri !== realVideoMaskConfig.sourceGcsUri) blockers.push('Phase 33D source must be the approved Phase 32 private export.')
  if (input.modelManifestId !== undefined && input.modelManifestId !== realVideoMaskConfig.modelManifestId) blockers.push('Only birefnet_main_staging_v1 is allowed.')
  if (input.modelGcsPath !== undefined && input.modelGcsPath !== realVideoMaskConfig.modelGcsPath) blockers.push('Only the approved private BiRefNet model path is allowed.')
  if (input.modelRevision !== undefined && input.modelRevision !== realVideoMaskConfig.modelRevision) blockers.push('Unexpected BiRefNet revision.')
  if (input.modelChecksum !== undefined && input.modelChecksum !== realVideoMaskConfig.modelAggregateSha256) blockers.push('Unexpected BiRefNet checksum.')
  return blockers
}

export function validateFrameExtractionReport(report?: RealVideoFrameExtractionReport): string[] {
  if (!report) return ['Representative frame extraction report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Representative frame extraction did not return ok=true.')
  if (report.sourcePhase32RunId !== realVideoMaskConfig.phase32RunId) blockers.push('Frame extraction used the wrong Phase 32 run.')
  if (report.sourceGcsUri !== realVideoMaskConfig.sourceGcsUri) blockers.push('Frame extraction used an unapproved source object.')
  if (!report.representativeFrame.gcsUri.startsWith(`gs://${realVideoMaskConfig.generatedAssetsBucket}/${realVideoMaskConfig.phase33dPrefix}/`)) blockers.push('Representative frame is not under the private Phase 33D generated-assets prefix.')
  if (!report.safety.exactlyOneFrameExtracted) blockers.push('Frame extraction did not confirm exactly one frame.')
  if (report.safety.secondSourceVideoUsed) blockers.push('A second source video was used.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was enabled.')
  if (report.safety.sourceOverwritten) blockers.push('Source overwrite was reported.')
  if (report.safety.providerExecuted || report.safety.modelDownloadedExternally || report.safety.revideoUsed) blockers.push('Forbidden frame-extraction execution was reported.')
  return Array.from(new Set([...blockers, ...(report.blockers ?? [])]))
}

export function validateBiRefNetFrameMaskReport(report?: RealVideoBiRefNetFrameMaskReport): string[] {
  if (!report) return ['BiRefNet frame-mask report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('BiRefNet frame-mask report did not return ok=true.')
  if (report.sourcePhase32RunId !== realVideoMaskConfig.phase32RunId) blockers.push('BiRefNet frame-mask report used the wrong Phase 32 run.')
  if (report.model.manifestId !== realVideoMaskConfig.modelManifestId) blockers.push('Unexpected mask model manifest.')
  if (report.model.revision !== realVideoMaskConfig.modelRevision) blockers.push('Unexpected BiRefNet model revision.')
  if (report.model.aggregateSha256 !== realVideoMaskConfig.modelAggregateSha256) blockers.push('Unexpected BiRefNet model checksum.')
  if (!report.representativeFrame.gcsUri.startsWith(`gs://${realVideoMaskConfig.generatedAssetsBucket}/${realVideoMaskConfig.phase33dPrefix}/${report.runId}/representative-frame/`)) blockers.push('BiRefNet did not use the approved Phase 33D representative frame prefix.')
  if (report.mask.status !== 'completed' || !report.mask.maskUri) blockers.push('BiRefNet mask artifact is missing.')
  if (!report.mask.cutoutUri) blockers.push('RGBA cutout artifact is missing.')
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.approvedPhase32InputOnly || !report.safety.representativeFrameOnly) blockers.push('Approved single-frame safety flags were not true.')
  if (report.safety.fullVideoMaskExecuted || report.safety.secondSourceVideoUsed) blockers.push('Full-video mask or second-source use was reported.')
  if (report.safety.providerExecuted || report.safety.modelDownloadedExternally || report.safety.sam2Used) blockers.push('Provider/model-download/SAM2 execution was reported.')
  if (report.safety.textBehindSubjectExecuted) blockers.push('Text-behind-subject execution was reported.')
  if (report.safety.secretValuesUsed || report.safety.publicAccessEnabled || report.safety.rtxPro6000Used || report.safety.revideoUsed) blockers.push('Forbidden secret/public/RTX/Revideo use was reported.')
  return Array.from(new Set([...blockers, ...(report.blockers ?? [])]))
}
