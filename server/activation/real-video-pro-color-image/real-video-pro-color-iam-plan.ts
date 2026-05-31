import { realVideoProColorImageConfig } from './real-video-pro-color-image-policy'
import type { RealVideoProColorImageIamBindingPlan } from './real-video-pro-color-image-types'

export function buildRealVideoProColorImageIamPlan(): RealVideoProColorImageIamBindingPlan[] {
  const member = `serviceAccount:${realVideoProColorImageConfig.serviceAccountEmail}`
  return [
    binding('phase40c-source-read', realVideoProColorImageConfig.finalExportsBucket, 'roles/storage.objectViewer', 'phase40c_pro_color_source_read', 'activation-real-video/phase32/phase32-20260528T13330/', member, 'Read approved Phase 32 private export only'),
    binding('phase40c-phase40b-qa-read', realVideoProColorImageConfig.qaBucket, 'roles/storage.objectViewer', 'phase40c_pro_color_phase40b_qa_read', 'activation-pro-color-image/phase40b/phase40b-20260531T10390/', member, 'Read Phase 40B QA evidence only'),
    binding('phase40c-generated-create', realVideoProColorImageConfig.generatedAssetsBucket, 'roles/storage.objectCreator', 'phase40c_pro_color_generated_create', 'activation-pro-color-image/phase40c/', member, 'Create Phase 40C generated frame and metadata artifacts only'),
    binding('phase40c-previews-create', realVideoProColorImageConfig.previewsBucket, 'roles/storage.objectCreator', 'phase40c_pro_color_previews_create', 'activation-pro-color-image/phase40c/', member, 'Create Phase 40C private preview artifacts only'),
    binding('phase40c-qa-create', realVideoProColorImageConfig.qaBucket, 'roles/storage.objectCreator', 'phase40c_pro_color_qa_create', 'activation-pro-color-image/phase40c/', member, 'Create Phase 40C QA artifacts only'),
    binding('phase40c-worker-temp-create', realVideoProColorImageConfig.workerTempBucket, 'roles/storage.objectCreator', 'phase40c_pro_color_worker_temp_create', 'activation-pro-color-image/phase40c/', member, 'Create Phase 40C worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: RealVideoProColorImageIamBindingPlan['role'],
  conditionTitle: string,
  objectPrefix: string,
  member: string,
  description: string,
): RealVideoProColorImageIamBindingPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${objectPrefix}")`
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

