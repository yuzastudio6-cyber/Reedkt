import { proColorImageFeatureE2EConfig } from './pro-color-image-feature-e2e-policy'
import type { ProColorImageFeatureE2EIamBindingPlan } from './pro-color-image-feature-e2e-types'

export function buildProColorImageFeatureE2EIamPlan(): ProColorImageFeatureE2EIamBindingPlan[] {
  const member = `serviceAccount:${proColorImageFeatureE2EConfig.serviceAccountEmail}`
  return [
    binding('phase40d-source-read', proColorImageFeatureE2EConfig.finalExportsBucket, 'roles/storage.objectViewer', 'phase40d_pro_color_source_read', 'activation-real-video/phase32/phase32-20260528T13330/', member, 'Read approved Phase 32 private export only'),
    binding('phase40d-phase40c-qa-read', proColorImageFeatureE2EConfig.qaBucket, 'roles/storage.objectViewer', 'phase40d_pro_color_phase40c_qa_read', 'activation-pro-color-image/phase40c/phase40c-20260531T11504/', member, 'Read Phase 40C QA evidence only'),
    binding('phase40d-generated-create', proColorImageFeatureE2EConfig.generatedAssetsBucket, 'roles/storage.objectCreator', 'phase40d_pro_color_generated_create', 'activation-pro-color-image/phase40d/', member, 'Create Phase 40D generated frame and metadata artifacts only'),
    binding('phase40d-previews-create', proColorImageFeatureE2EConfig.previewsBucket, 'roles/storage.objectCreator', 'phase40d_pro_color_previews_create', 'activation-pro-color-image/phase40d/', member, 'Create Phase 40D private preview artifacts only'),
    binding('phase40d-qa-create', proColorImageFeatureE2EConfig.qaBucket, 'roles/storage.objectCreator', 'phase40d_pro_color_qa_create', 'activation-pro-color-image/phase40d/', member, 'Create Phase 40D QA artifacts only'),
    binding('phase40d-worker-temp-create', proColorImageFeatureE2EConfig.workerTempBucket, 'roles/storage.objectCreator', 'phase40d_pro_color_worker_temp_create', 'activation-pro-color-image/phase40d/', member, 'Create Phase 40D worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: ProColorImageFeatureE2EIamBindingPlan['role'],
  conditionTitle: string,
  objectPrefix: string,
  member: string,
  description: string,
): ProColorImageFeatureE2EIamBindingPlan {
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
