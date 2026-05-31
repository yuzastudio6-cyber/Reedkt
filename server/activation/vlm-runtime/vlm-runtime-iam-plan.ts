import { vlmRuntimeConfig } from './vlm-runtime-policy'
import type { VlmRuntimeIamPlan } from './vlm-runtime-types'

export function buildVlmRuntimeIamPlan(createdAt = new Date().toISOString()) {
  const member = `serviceAccount:${vlmRuntimeConfig.serviceAccountEmail}`
  const plans: VlmRuntimeIamPlan[] = [
    {
      bindingId: 'phase39c-vlm-model-read',
      resource: `gs://${vlmRuntimeConfig.generatedAssetsBucket}`,
      role: 'roles/storage.objectViewer',
      member,
      conditionTitle: 'phase39c-qwen3-vl-model-read-only',
      conditionExpression: `resource.name.startsWith("projects/_/buckets/${vlmRuntimeConfig.generatedAssetsBucket}/objects/model-weights/qwen3-vl/qwen3-vl-8b-instruct/${vlmRuntimeConfig.modelRevision}/")`,
      description: 'Future staging GPU worker read access to verified Phase 39B private model assets only.',
      commandString: 'Text-only IAM plan; Phase 39C does not mutate IAM.',
      required: false,
    },
    {
      bindingId: 'phase39c-vlm-qa-artifact-write',
      resource: `gs://${vlmRuntimeConfig.qaBucket}`,
      role: 'roles/storage.objectCreator',
      member,
      conditionTitle: 'phase39c-vlm-runtime-qa-artifacts-only',
      conditionExpression: `resource.name.startsWith("projects/_/buckets/${vlmRuntimeConfig.qaBucket}/objects/${vlmRuntimeConfig.qaArtifactPrefix}/")`,
      description: 'Future staging GPU worker write access to Phase 39C private JSON QA artifact prefix only.',
      commandString: 'Text-only IAM plan; Phase 39C does not mutate IAM.',
      required: false,
    },
  ]
  return {
    phase: '39C' as const,
    reportId: 'phase_39c_vlm_runtime_iam_plan',
    createdAt,
    iamMutationAllowed: false,
    plans,
    blockers: [],
    warnings: ['This is a text-only plan. Do not apply IAM changes in Phase 39C unless a later explicit ops step approves them.'],
  }
}
