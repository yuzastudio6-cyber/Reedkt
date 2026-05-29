import { sam2RuntimeConfig } from './sam2-runtime-policy'
import type { Sam2RuntimeIamPlan } from './sam2-runtime-types'

export function buildSam2RuntimeIamPlan(): Sam2RuntimeIamPlan[] {
  const member = `serviceAccount:${sam2RuntimeConfig.serviceAccountEmail}`
  const generatedPrefix = 'activation-sam2-runtime/phase35c/'
  return [
    binding('sam2-model-read', sam2RuntimeConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase35c_sam2_model_read', 'model-weights/sam2/sam2.1-hiera-tiny/', 'Read approved SAM2.1 tiny model objects only'),
    binding('sam2-generated-create', sam2RuntimeConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase35c_sam2_generated_create', generatedPrefix, 'Create Phase 35C generated fixture and mask artifacts only'),
    binding('sam2-qa-create', sam2RuntimeConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase35c_sam2_qa_create', generatedPrefix, 'Create Phase 35C QA artifacts only'),
    binding('sam2-worker-temp-create', sam2RuntimeConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase35c_sam2_worker_temp_create', generatedPrefix, 'Create Phase 35C worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: Sam2RuntimeIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): Sam2RuntimeIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionTitle,
    conditionExpression,
    description,
    required: true,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
