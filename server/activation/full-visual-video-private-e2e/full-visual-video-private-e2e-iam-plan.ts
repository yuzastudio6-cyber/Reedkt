import { fullVisualVideoPrivateE2eConfig } from './full-visual-video-private-e2e-policy'
import type { FullVisualVideoPrivateE2eIamPlan } from './full-visual-video-private-e2e-types'

const member = 'user:ACTIVE_GCLOUD_ACCOUNT'

function binding(input: Omit<FullVisualVideoPrivateE2eIamPlan, 'member' | 'commandString' | 'reportOnly'>): FullVisualVideoPrivateE2eIamPlan {
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString, reportOnly: true }
}

export function buildFullVisualVideoPrivateE2eIamPlan(): FullVisualVideoPrivateE2eIamPlan[] {
  return [
    binding({
      bindingId: 'phase45e-source-and-review-read',
      bucket: fullVisualVideoPrivateE2eConfig.finalExportsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45e_source_review_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-render-hardening/phase45d/phase45d-20260531T22235/")',
      description: 'Read approved Phase 32 source and Phase 45D private review export only',
    }),
    binding({
      bindingId: 'phase45e-render-preview-read',
      bucket: fullVisualVideoPrivateE2eConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45e_render_preview_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/")',
      description: 'Read approved Phase 45A and Phase 45B preview evidence only',
    }),
    binding({
      bindingId: 'phase45e-otio-and-output-create',
      bucket: fullVisualVideoPrivateE2eConfig.generatedAssetsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45e_generated_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45e/")',
      description: 'Create Phase 45E generated-assets evidence package artifacts only',
    }),
    binding({
      bindingId: 'phase45e-otio-read',
      bucket: fullVisualVideoPrivateE2eConfig.generatedAssetsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45e_otio_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45c/phase45c-20260531T20404/")',
      description: 'Read approved Phase 45C OTIO evidence only',
    }),
    binding({
      bindingId: 'phase45e-qa-read',
      bucket: fullVisualVideoPrivateE2eConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45e_prior_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45c/phase45c-20260531T20404/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45d/phase45d-20260531T22235/")',
      description: 'Read approved Phase 45A/45B/45C/45D QA evidence only',
    }),
    binding({
      bindingId: 'phase45e-qa-create',
      bucket: fullVisualVideoPrivateE2eConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45e_qa_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45e/")',
      description: 'Create Phase 45E QA artifacts only',
    }),
  ]
}
