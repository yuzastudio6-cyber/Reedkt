import { remotionRenderValidationConfig } from './remotion-render-validation-policy'
import type { RemotionRenderIamBindingPlan } from './remotion-render-validation-types'

function binding(input: Omit<RemotionRenderIamBindingPlan, 'member' | 'commandString'>): RemotionRenderIamBindingPlan {
  const member = `serviceAccount:${remotionRenderValidationConfig.serviceAccountEmail}`
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString }
}

export function buildRemotionRenderIamPlan(): RemotionRenderIamBindingPlan[] {
  return [
    binding({
      bindingId: 'phase45b-source-read',
      bucket: remotionRenderValidationConfig.finalExportsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45b_remotion_source_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/")',
      description: 'Read approved Phase 32 private export only',
    }),
    binding({
      bindingId: 'phase45b-phase45a-preview-read',
      bucket: remotionRenderValidationConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45b_remotion_phase45a_preview_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/")',
      description: 'Read approved Phase 45A private preview only',
    }),
    binding({
      bindingId: 'phase45b-phase45a-qa-read',
      bucket: remotionRenderValidationConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45b_remotion_phase45a_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/")',
      description: 'Read approved Phase 45A QA evidence only',
    }),
    binding({
      bindingId: 'phase45b-previews-create',
      bucket: remotionRenderValidationConfig.previewsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45b_remotion_previews_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45b/")',
      description: 'Create Phase 45B private preview artifacts only',
    }),
    binding({
      bindingId: 'phase45b-qa-create',
      bucket: remotionRenderValidationConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45b_remotion_qa_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45b/")',
      description: 'Create Phase 45B QA artifacts only',
    }),
  ]
}
