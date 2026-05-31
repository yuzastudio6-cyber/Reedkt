import { proColorImageRuntimeConfig } from './pro-color-image-runtime-policy'
import type { ProColorImageRuntimeIamBindingPlan } from './pro-color-image-runtime-types'

export function buildProColorImageRuntimeIamPlan(): ProColorImageRuntimeIamBindingPlan[] {
  const member = `serviceAccount:${proColorImageRuntimeConfig.serviceAccountEmail}`
  return [
    creatorBinding(
      'phase40b-generated-create',
      proColorImageRuntimeConfig.generatedAssetsBucket,
      'phase40b_pro_color_generated_create',
      'activation-pro-color-image/phase40b/',
      member,
      'Create Phase 40B generated fixture artifacts only',
    ),
    creatorBinding(
      'phase40b-qa-create',
      proColorImageRuntimeConfig.qaBucket,
      'phase40b_pro_color_qa_create',
      'activation-pro-color-image/phase40b/',
      member,
      'Create Phase 40B QA artifacts only',
    ),
    creatorBinding(
      'phase40b-worker-temp-create',
      proColorImageRuntimeConfig.workerTempBucket,
      'phase40b_pro_color_worker_temp_create',
      'activation-pro-color-image/phase40b/',
      member,
      'Create Phase 40B worker temp artifacts only',
    ),
  ]
}

function creatorBinding(
  bindingId: string,
  bucket: string,
  conditionTitle: string,
  objectPrefix: string,
  member: string,
  description: string,
): ProColorImageRuntimeIamBindingPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${objectPrefix}")`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectCreator',
    member,
    conditionTitle,
    conditionExpression,
    description,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=roles/storage.objectCreator --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
