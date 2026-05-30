import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'
import type { RealVideoSam2IamPlan } from './real-video-sam2-temporal-mask-types'

export function buildRealVideoSam2IamPlan(): RealVideoSam2IamPlan[] {
  const member = `serviceAccount:${realVideoSam2TemporalMaskConfig.serviceAccountEmail}`
  return [
    binding('sam2-model-read', realVideoSam2TemporalMaskConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase35d_sam2_model_read', 'model-weights/sam2/sam2.1-hiera-tiny/', 'Read approved SAM2.1 tiny model objects only'),
    binding('phase32-video-read', realVideoSam2TemporalMaskConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase35d_phase32_video_read', 'activation-real-video/phase32/phase32-20260528T13330/', 'Read approved Phase 32 private export only'),
    binding('phase33d-anchor-read', realVideoSam2TemporalMaskConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase35d_phase33d_anchor_read', 'activation-real-video/phase33d/phase33d-20260528T161056/', 'Read approved Phase 33D anchor artifacts only'),
    binding('phase35d-masks-create', realVideoSam2TemporalMaskConfig.masksBucket, 'roles/storage.objectCreator', member, 'phase35d_masks_create', 'activation-real-video/phase35d/', 'Create Phase 35D mask artifacts only'),
    binding('phase35d-generated-create', realVideoSam2TemporalMaskConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase35d_generated_create', 'activation-real-video/phase35d/', 'Create Phase 35D extracted frame and metadata artifacts only'),
    binding('phase35d-qa-create', realVideoSam2TemporalMaskConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase35d_qa_create', 'activation-real-video/phase35d/', 'Create Phase 35D QA artifacts only'),
    binding('phase35d-worker-temp-create', realVideoSam2TemporalMaskConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase35d_worker_temp_create', 'activation-real-video/phase35d/', 'Create Phase 35D worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: RealVideoSam2IamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): RealVideoSam2IamPlan {
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
