import { finalRenderHardeningConfig } from './final-render-hardening-policy'
import type { FinalRenderHardeningIamBindingPlan } from './final-render-hardening-types'

function binding(input: Omit<FinalRenderHardeningIamBindingPlan, 'member' | 'commandString'>): FinalRenderHardeningIamBindingPlan {
  const member = `serviceAccount:${finalRenderHardeningConfig.serviceAccountEmail}`
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString }
}

export function buildFinalRenderHardeningIamPlan(): FinalRenderHardeningIamBindingPlan[] {
  return [
    binding({
      bindingId: 'phase45d-source-read',
      bucket: finalRenderHardeningConfig.finalExportsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_final_render_source_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/")',
      description: 'Read approved Phase 32 private export only',
    }),
    binding({
      bindingId: 'phase45d-phase45a-preview-read',
      bucket: finalRenderHardeningConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_phase45a_preview_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/")',
      description: 'Read approved Phase 45A preview only',
    }),
    binding({
      bindingId: 'phase45d-phase45b-preview-read',
      bucket: finalRenderHardeningConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_phase45b_preview_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/")',
      description: 'Read approved Phase 45B preview only',
    }),
    binding({
      bindingId: 'phase45d-phase45c-otio-read',
      bucket: finalRenderHardeningConfig.generatedAssetsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_phase45c_otio_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45c/phase45c-20260531T20404/")',
      description: 'Read approved Phase 45C OTIO artifact only',
    }),
    binding({
      bindingId: 'phase45d-phase45a-qa-read',
      bucket: finalRenderHardeningConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_phase45a_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/")',
      description: 'Read approved Phase 45A QA evidence only',
    }),
    binding({
      bindingId: 'phase45d-phase45b-qa-read',
      bucket: finalRenderHardeningConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_phase45b_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/")',
      description: 'Read approved Phase 45B QA evidence only',
    }),
    binding({
      bindingId: 'phase45d-phase45c-qa-read',
      bucket: finalRenderHardeningConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45d_phase45c_qa_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45c/phase45c-20260531T20404/")',
      description: 'Read approved Phase 45C QA evidence only',
    }),
    binding({
      bindingId: 'phase45d-review-export-create',
      bucket: finalRenderHardeningConfig.finalExportsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45d_review_export_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-render-hardening/phase45d/")',
      description: 'Create Phase 45D private review export artifacts only',
    }),
    binding({
      bindingId: 'phase45d-qa-create',
      bucket: finalRenderHardeningConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45d_qa_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45d/")',
      description: 'Create Phase 45D QA artifacts only',
    }),
  ]
}
