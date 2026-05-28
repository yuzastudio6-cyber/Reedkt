import { realVideoEnhancementSampleConfig } from './real-video-enhancement-sample-policy'
import type { RealVideoEnhancementSampleCommandPlan } from './real-video-enhancement-sample-types'

export function buildRealVideoEnhancementIamCommandPlans(): RealVideoEnhancementSampleCommandPlan[] {
  const sourceRead = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-real-video/phase33d/phase33d-20260528T161056/")'
  const modelRead = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/real-esrgan/x4plus/")'
  const generatedCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-real-video/phase34d/")'
  const qaCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-real-video/phase34d/")'
  const tempCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-worker-temp/objects/activation-real-video/phase34d/")'
  const member = `serviceAccount:${realVideoEnhancementSampleConfig.gpuServiceAccountEmail}`
  return [
    {
      commandId: 'iam-source-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket} --member=${member} --role=roles/storage.objectViewer --condition=title=phase34d_real_video_sample_source_read,expression='${sourceRead}',description='Read approved Phase 33D representative frame only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Do not replace this with broad storage.admin/objectAdmin/objectUser grants.'],
    },
    {
      commandId: 'iam-model-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket} --member=${member} --role=roles/storage.objectViewer --condition=title=phase34d_real_esrgan_model_read,expression='${modelRead}',description='Read approved RealESRGAN_x4plus model objects only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Do not grant access to alternate model prefixes.'],
    },
    {
      commandId: 'iam-generated-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket} --member=${member} --role=roles/storage.objectCreator --condition=title=phase34d_real_video_enhancement_generated_create,expression='${generatedCreate}',description='Create Phase 34D enhancement sample generated artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['A pre-existing broader generated-assets objectCreator binding may exist; record it as warning only.'],
    },
    {
      commandId: 'iam-qa-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoEnhancementSampleConfig.qaBucket} --member=${member} --role=roles/storage.objectCreator --condition=title=phase34d_real_video_enhancement_qa_create,expression='${qaCreate}',description='Create Phase 34D enhancement sample QA artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-worker-temp-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoEnhancementSampleConfig.workerTempBucket} --member=${member} --role=roles/storage.objectCreator --condition=title=phase34d_real_video_enhancement_worker_temp_create,expression='${tempCreate}',description='Create Phase 34D enhancement sample temp artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
  ]
}
