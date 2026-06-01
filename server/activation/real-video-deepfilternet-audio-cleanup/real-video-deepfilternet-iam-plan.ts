import { realVideoDeepFilterNetConfig } from './real-video-deepfilternet-audio-cleanup-policy'
import type { RealVideoDeepFilterNetIamPlan } from './real-video-deepfilternet-audio-cleanup-types'

export function buildRealVideoDeepFilterNetIamPlan(): RealVideoDeepFilterNetIamPlan[] {
  const member = `serviceAccount:${realVideoDeepFilterNetConfig.serviceAccountEmail}`
  return [
    binding('phase36d-source-video-read', realVideoDeepFilterNetConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase36d_source_video_read', 'activation-real-video/phase32/phase32-20260528T13330/', 'Read only the approved Phase 32 controlled private export'),
    binding('phase36d-reference-audio-read', realVideoDeepFilterNetConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase36d_reference_audio_read', 'activation-real-video/phase31/phase31-20260528T13060/', 'Read only the approved Phase 31 audio-normalized reference'),
    binding('phase36d-deepfilternet-artifact-read', realVideoDeepFilterNetConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase36d_deepfilternet_artifact_read', 'model-weights/audio-ai/deepfilternet/v0.5.6/', 'Read approved DeepFilterNet v0.5.6 artifacts only'),
    binding('phase36d-generated-create', realVideoDeepFilterNetConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase36d_generated_create', 'activation-audio-ai/phase36d/', 'Create Phase 36D generated audio cleanup artifacts only'),
    binding('phase36d-final-review-create', realVideoDeepFilterNetConfig.finalExportsBucket, 'roles/storage.objectCreator', member, 'phase36d_private_review_create', 'activation-audio-ai/phase36d/', 'Create Phase 36D private review artifacts only'),
    binding('phase36d-analysis-create', realVideoDeepFilterNetConfig.analysisBucket, 'roles/storage.objectCreator', member, 'phase36d_analysis_create', 'activation-audio-ai/phase36d/', 'Create Phase 36D audio metrics only'),
    binding('phase36d-qa-create', realVideoDeepFilterNetConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase36d_qa_create', 'activation-audio-ai/phase36d/', 'Create Phase 36D QA artifacts only'),
    binding('phase36d-worker-temp-create', realVideoDeepFilterNetConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase36d_worker_temp_create', 'activation-audio-ai/phase36d/', 'Create Phase 36D worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: RealVideoDeepFilterNetIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): RealVideoDeepFilterNetIamPlan {
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
