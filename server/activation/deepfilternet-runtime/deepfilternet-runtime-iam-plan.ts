import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'
import type { DeepFilterNetRuntimeIamPlan } from './deepfilternet-runtime-types'

export function buildDeepFilterNetRuntimeIamPlan(): DeepFilterNetRuntimeIamPlan[] {
  const member = `serviceAccount:${deepFilterNetRuntimeConfig.serviceAccountEmail}`
  const generatedPrefix = 'activation-audio-ai/phase36c/'
  const artifactPrefix = 'model-weights/audio-ai/deepfilternet/v0.5.6/'
  return [
    binding('deepfilternet-artifact-read', deepFilterNetRuntimeConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase36c_deepfilternet_artifact_read', artifactPrefix, 'Read approved DeepFilterNet v0.5.6 artifacts only'),
    explicitObjectReadBinding('deepfilternet-artifact-read-object-context', deepFilterNetRuntimeConfig.generatedAssetsBucket, member, 'phase36c_deepfilternet_artifact_read_object_context', artifactPrefix, 'Read approved DeepFilterNet v0.5.6 artifacts only with explicit object resource context'),
    binding('deepfilternet-generated-create', deepFilterNetRuntimeConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase36c_deepfilternet_generated_create', generatedPrefix, 'Create Phase 36C generated fixture and enhanced artifacts only'),
    binding('deepfilternet-analysis-create', deepFilterNetRuntimeConfig.analysisBucket, 'roles/storage.objectCreator', member, 'phase36c_deepfilternet_analysis_create', generatedPrefix, 'Create Phase 36C generated-audio metrics only'),
    binding('deepfilternet-qa-create', deepFilterNetRuntimeConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase36c_deepfilternet_qa_create', generatedPrefix, 'Create Phase 36C QA artifacts only'),
    binding('deepfilternet-worker-temp-create', deepFilterNetRuntimeConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase36c_deepfilternet_worker_temp_create', generatedPrefix, 'Create Phase 36C worker temp artifacts only'),
  ]
}

function explicitObjectReadBinding(
  bindingId: string,
  bucket: string,
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): DeepFilterNetRuntimeIamPlan {
  const relativePrefix = `projects/_/buckets/${bucket}/objects/${prefix}`
  const fullPrefix = `//storage.googleapis.com/${relativePrefix}`
  const conditionExpression = `resource.type == "storage.googleapis.com/Object" && (resource.name.startsWith("${relativePrefix}") || resource.name.startsWith("${fullPrefix}"))`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectViewer',
    member,
    conditionTitle,
    conditionExpression,
    description,
    required: true,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=roles/storage.objectViewer --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}

function binding(
  bindingId: string,
  bucket: string,
  role: DeepFilterNetRuntimeIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): DeepFilterNetRuntimeIamPlan {
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
