import { vlmBlockerResolutionConfig } from './vlm-blocker-resolution-policy'
import type { VlmBlockerResolutionIamPlan } from './vlm-blocker-resolution-types'

const member = 'user:ACTIVE_GCLOUD_ACCOUNT'

function binding(input: Omit<VlmBlockerResolutionIamPlan, 'member' | 'commandString' | 'reportOnly'>): VlmBlockerResolutionIamPlan {
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString, reportOnly: true }
}

export function buildVlmBlockerResolutionIamPlan(): VlmBlockerResolutionIamPlan[] {
  return [
    binding({
      bindingId: 'phase47b-generated-evidence-read',
      bucket: vlmBlockerResolutionConfig.generatedAssetsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase47b_generated_evidence_read',
      conditionExpression:
        'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-track-integration/phase47a/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/qwen3-vl/")',
      description: 'Read approved Phase 47A and Phase 39B/39C VLM generated-assets evidence only',
    }),
    binding({
      bindingId: 'phase47b-qa-evidence-read',
      bucket: vlmBlockerResolutionConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase47b_qa_evidence_read',
      conditionExpression:
        'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-track-integration/phase47a/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation/phase39c/")',
      description: 'Read approved Phase 47A and Phase 39C VLM QA/report evidence only',
    }),
    binding({
      bindingId: 'phase47b-generated-create',
      bucket: vlmBlockerResolutionConfig.generatedAssetsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase47b_generated_create',
      conditionExpression:
        'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-track-integration/phase47b/")',
      description: 'Create Phase 47B generated-assets blocker/exclusion JSON only',
    }),
    binding({
      bindingId: 'phase47b-qa-create',
      bucket: vlmBlockerResolutionConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase47b_qa_create',
      conditionExpression:
        'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-track-integration/phase47b/")',
      description: 'Create Phase 47B QA/report JSON only',
    }),
  ]
}
