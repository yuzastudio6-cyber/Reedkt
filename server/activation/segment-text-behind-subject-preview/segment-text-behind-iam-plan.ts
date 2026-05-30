import { segmentTextBehindSubjectPreviewConfig } from './segment-text-behind-subject-preview-policy'
import type { SegmentTextBehindSubjectPreviewIamPlan } from './segment-text-behind-subject-preview-types'

export function buildSegmentTextBehindSubjectPreviewIamPlan(): SegmentTextBehindSubjectPreviewIamPlan[] {
  const member = `serviceAccount:${segmentTextBehindSubjectPreviewConfig.renderServiceAccountEmail}`
  return [
    binding('phase35d-generated-read', segmentTextBehindSubjectPreviewConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase35e_phase35d_generated_read', 'activation-real-video/phase35d/phase35d-20260530T004442/', 'Read approved Phase 35D segment frames and metadata only'),
    binding('phase35d-masks-read', segmentTextBehindSubjectPreviewConfig.masksBucket, 'roles/storage.objectViewer', member, 'phase35e_phase35d_masks_read', 'activation-real-video/phase35d/phase35d-20260530T004442/', 'Read approved Phase 35D SAM2 masks only'),
    binding('phase35d-qa-read', segmentTextBehindSubjectPreviewConfig.qaBucket, 'roles/storage.objectViewer', member, 'phase35e_phase35d_qa_read', 'activation-real-video/phase35d/phase35d-20260530T004442/', 'Read approved Phase 35D QA report only'),
    binding('phase35e-previews-create', segmentTextBehindSubjectPreviewConfig.previewsBucket, 'roles/storage.objectCreator', member, 'phase35e_previews_create', 'activation-real-video/phase35e/', 'Create Phase 35E private preview artifacts only'),
    binding('phase35e-generated-create', segmentTextBehindSubjectPreviewConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase35e_generated_create', 'activation-real-video/phase35e/', 'Create Phase 35E composition metadata only'),
    binding('phase35e-qa-create', segmentTextBehindSubjectPreviewConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase35e_qa_create', 'activation-real-video/phase35e/', 'Create Phase 35E QA artifacts only'),
    binding('phase35e-worker-temp-create', segmentTextBehindSubjectPreviewConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase35e_worker_temp_create', 'activation-real-video/phase35e/', 'Create Phase 35E worker temp artifacts only if a future worker-hosted compositor is used'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: SegmentTextBehindSubjectPreviewIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): SegmentTextBehindSubjectPreviewIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionTitle,
    conditionExpression,
    description,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
