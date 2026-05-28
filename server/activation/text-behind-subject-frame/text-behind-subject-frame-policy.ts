import type { TextBehindSubjectFrameConfig, TextBehindSubjectFrameExecutionReport } from './text-behind-subject-frame-types'

export const textBehindSubjectFrameConfig: TextBehindSubjectFrameConfig = {
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  phase32RunId: 'phase32-20260528T13330',
  phase33dRunId: 'phase33d-20260528T161056',
  approvedText: 'REEDITPRO',
  representativeFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
  maskGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png',
  cutoutGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png',
  sourceBucket: 'reeditpro-staging-reeditpro-generated-assets',
  phase33dPrefix: 'activation-real-video/phase33d/phase33d-20260528T161056',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  phase33ePrefix: 'activation-real-video/phase33e',
  renderJobName: 'reeditpro-staging-render-job',
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  renderImageTag: 'staging-phase33e-text-frame-001',
  renderTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-phase33e-text-frame-001',
}

export const phase33eDoesNotDo = [
  'no video processing',
  'no second frame',
  'no full-video text-behind-subject',
  'no BiRefNet rerun',
  'no SAM2',
  'no GPU',
  'no providers',
  'no model downloads',
  'no public URL',
  'no Revideo',
  'no production or beta unlock',
]

export function phase33ePrefix(runId: string): string {
  if (!/^phase33e-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 33E run id: ${runId}`)
  return `${textBehindSubjectFrameConfig.phase33ePrefix}/${runId}`
}

export function validateTextBehindSubjectFrameEnv(input: {
  projectId?: string
  region?: string
  env?: string
  confirmation?: string
  text?: string
  frameGcsUri?: string
  maskGcsUri?: string
  cutoutGcsUri?: string
}): string[] {
  const blockers: string[] = []
  if (input.projectId !== undefined && input.projectId !== textBehindSubjectFrameConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region !== undefined && input.region !== textBehindSubjectFrameConfig.region) blockers.push('Region must be us-central1.')
  if (input.env !== undefined && input.env !== textBehindSubjectFrameConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== undefined && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_TEXT_BEHIND_SUBJECT_FRAME_PREVIEW=true is required for execution.')
  if (input.text !== undefined && input.text !== textBehindSubjectFrameConfig.approvedText) blockers.push('Phase 33E text must be exactly REEDITPRO.')
  if (input.frameGcsUri !== undefined && input.frameGcsUri !== textBehindSubjectFrameConfig.representativeFrameGcsUri) blockers.push('Representative frame must be the approved Phase 33D frame.')
  if (input.maskGcsUri !== undefined && input.maskGcsUri !== textBehindSubjectFrameConfig.maskGcsUri) blockers.push('Mask must be the approved Phase 33D mask.')
  if (input.cutoutGcsUri !== undefined && input.cutoutGcsUri !== textBehindSubjectFrameConfig.cutoutGcsUri) blockers.push('Cutout must be the approved Phase 33D RGBA cutout.')
  return blockers
}

export function validateTextBehindSubjectFrameReport(report?: TextBehindSubjectFrameExecutionReport): string[] {
  if (!report) return ['Phase 33E execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 33E execution report did not return ok=true.')
  if (report.sourcePhase33DRunId !== textBehindSubjectFrameConfig.phase33dRunId) blockers.push('Phase 33E used the wrong Phase 33D run.')
  if (report.representativeFrameGcsUri !== textBehindSubjectFrameConfig.representativeFrameGcsUri) blockers.push('Phase 33E used an unapproved representative frame.')
  if (report.maskGcsUri !== textBehindSubjectFrameConfig.maskGcsUri) blockers.push('Phase 33E used an unapproved mask.')
  if (report.cutoutGcsUri !== textBehindSubjectFrameConfig.cutoutGcsUri) blockers.push('Phase 33E used an unapproved cutout.')
  if (report.textLayerPlan.textContent !== textBehindSubjectFrameConfig.approvedText) blockers.push('Unexpected text content was rendered.')
  if (report.preview.status !== 'created' || !report.preview.gcsUri) blockers.push('Preview PNG artifact is missing.')
  if (!report.depthCompositionManifest.outputPreviewRef.startsWith(`gs://${textBehindSubjectFrameConfig.previewsBucket}/${textBehindSubjectFrameConfig.phase33ePrefix}/${report.runId}/`)) blockers.push('Preview output is not under the private Phase 33E preview prefix.')
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (!report.safety.approvedPhase33DInputsOnly || !report.safety.singleFramePreviewOnly) blockers.push('Approved single-frame safety flags were not true.')
  if (report.safety.videoProcessed || report.safety.finalVideoExported) blockers.push('Video processing/export was reported.')
  if (report.safety.biRefNetRerun || report.safety.sam2Used || report.safety.gpuUsed) blockers.push('Forbidden model/GPU execution was reported.')
  if (report.safety.providerExecuted || report.safety.modelDownloadedExternally) blockers.push('Provider or runtime model download was reported.')
  if (report.safety.publicAccessEnabled || report.safety.secretValuesUsed || report.safety.revideoUsed) blockers.push('Forbidden public/secret/Revideo use was reported.')
  return Array.from(new Set([...blockers, ...(report.blockers ?? [])]))
}
