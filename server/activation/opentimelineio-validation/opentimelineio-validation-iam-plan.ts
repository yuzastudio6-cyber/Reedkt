import { openTimelineIoValidationConfig } from './opentimelineio-validation-policy'
import type { OpenTimelineIoIamBindingPlan } from './opentimelineio-validation-types'

function binding(input: Omit<OpenTimelineIoIamBindingPlan, 'member' | 'commandString'>): OpenTimelineIoIamBindingPlan {
  const member = 'user:<ACTIVE_GCLOUD_ACCOUNT>'
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString }
}

export function buildOpenTimelineIoIamPlan(): OpenTimelineIoIamBindingPlan[] {
  return [
    binding({
      bindingId: 'phase45c-source-read',
      bucket: openTimelineIoValidationConfig.finalExportsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45c_otio_source_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/")',
      description: 'Read approved Phase 32 private export metadata only',
    }),
    binding({
      bindingId: 'phase45c-phase45a-preview-read',
      bucket: openTimelineIoValidationConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45c_otio_phase45a_preview_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/")',
      description: 'Read approved Phase 45A private preview metadata only',
    }),
    binding({
      bindingId: 'phase45c-phase45b-preview-read',
      bucket: openTimelineIoValidationConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45c_otio_phase45b_preview_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/")',
      description: 'Read approved Phase 45B private preview metadata only',
    }),
    binding({
      bindingId: 'phase45c-phase45a-qa-read',
      bucket: openTimelineIoValidationConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45c_otio_phase45a_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/")',
      description: 'Read approved Phase 45A QA evidence only',
    }),
    binding({
      bindingId: 'phase45c-phase45b-qa-read',
      bucket: openTimelineIoValidationConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45c_otio_phase45b_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/")',
      description: 'Read approved Phase 45B QA evidence only',
    }),
    binding({
      bindingId: 'phase45c-generated-create',
      bucket: openTimelineIoValidationConfig.generatedAssetsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45c_otio_generated_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45c/")',
      description: 'Create Phase 45C private timeline artifacts only',
    }),
    binding({
      bindingId: 'phase45c-qa-create',
      bucket: openTimelineIoValidationConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45c_otio_qa_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45c/")',
      description: 'Create Phase 45C QA artifacts only',
    }),
  ]
}
