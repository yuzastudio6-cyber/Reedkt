import { deepFilterNetFeatureE2EConfig } from './deepfilternet-feature-e2e-policy'
import type { DeepFilterNetFeatureE2EIamPlan } from './deepfilternet-feature-e2e-types'

export function buildDeepFilterNetFeatureE2EIamPlan(): DeepFilterNetFeatureE2EIamPlan[] {
  const member = `serviceAccount:${deepFilterNetFeatureE2EConfig.serviceAccountEmail}`
  return [
    binding('phase36e-source-video-read', deepFilterNetFeatureE2EConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase36e_source_video_read', 'activation-real-video/phase32/phase32-20260528T13330/', 'Read only the approved Phase 32 controlled private export'),
    binding('phase36e-reference-audio-read', deepFilterNetFeatureE2EConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase36e_reference_audio_read', 'activation-real-video/phase31/phase31-20260528T13060/', 'Read only the approved Phase 31 audio-normalized reference'),
    binding('phase36e-phase36d-qa-read', deepFilterNetFeatureE2EConfig.qaBucket, 'roles/storage.objectViewer', member, 'phase36e_phase36d_qa_read', 'activation-audio-ai/phase36d/phase36d-20260530T141724/', 'Read only the approved Phase 36D QA evidence'),
    binding('phase36e-deepfilternet-artifact-read', deepFilterNetFeatureE2EConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase36e_deepfilternet_artifact_read', 'model-weights/audio-ai/deepfilternet/v0.5.6/', 'Read approved DeepFilterNet v0.5.6 artifacts only'),
    binding('phase36e-generated-create', deepFilterNetFeatureE2EConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase36e_generated_create', 'activation-audio-ai/phase36e/', 'Create Phase 36E generated audio cleanup artifacts only'),
    binding('phase36e-final-review-create', deepFilterNetFeatureE2EConfig.finalExportsBucket, 'roles/storage.objectCreator', member, 'phase36e_private_review_create', 'activation-audio-ai/phase36e/', 'Create Phase 36E private review artifacts only'),
    binding('phase36e-analysis-create', deepFilterNetFeatureE2EConfig.analysisBucket, 'roles/storage.objectCreator', member, 'phase36e_analysis_create', 'activation-audio-ai/phase36e/', 'Create Phase 36E audio metrics only'),
    binding('phase36e-qa-create', deepFilterNetFeatureE2EConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase36e_qa_create', 'activation-audio-ai/phase36e/', 'Create Phase 36E QA artifacts only'),
    binding('phase36e-worker-temp-create', deepFilterNetFeatureE2EConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase36e_worker_temp_create', 'activation-audio-ai/phase36e/', 'Create Phase 36E worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: DeepFilterNetFeatureE2EIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): DeepFilterNetFeatureE2EIamPlan {
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
