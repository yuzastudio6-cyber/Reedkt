import { trackAVisualReadinessConfig } from './track-a-visual-readiness-closure-policy'
import type { TrackAVisualReadinessIamPlan } from './track-a-visual-readiness-closure-types'

const member = 'user:ACTIVE_GCLOUD_ACCOUNT'

function binding(input: Omit<TrackAVisualReadinessIamPlan, 'member' | 'commandString' | 'reportOnly'>): TrackAVisualReadinessIamPlan {
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString, reportOnly: true }
}

export function buildTrackAVisualReadinessClosureIamPlan(): TrackAVisualReadinessIamPlan[] {
  return [
    binding({
      bindingId: 'phase45f-final-exports-read',
      bucket: trackAVisualReadinessConfig.finalExportsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45f_final_exports_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-render-hardening/phase45d/phase45d-20260531T22235/")',
      description: 'Read approved Phase 32 source and Phase 45D private review export evidence only',
    }),
    binding({
      bindingId: 'phase45f-generated-evidence-read',
      bucket: trackAVisualReadinessConfig.generatedAssetsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45f_generated_evidence_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45c/phase45c-20260531T20404/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45e/phase45e-20260531T23580/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-real-video/")',
      description: 'Read approved Track A generated-assets evidence only',
    }),
    binding({
      bindingId: 'phase45f-preview-evidence-read',
      bucket: trackAVisualReadinessConfig.previewsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45f_preview_evidence_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-previews/objects/activation-real-video/")',
      description: 'Read approved Track A private preview evidence only',
    }),
    binding({
      bindingId: 'phase45f-masks-evidence-read',
      bucket: trackAVisualReadinessConfig.masksBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45f_masks_evidence_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-masks/objects/activation-real-video/")',
      description: 'Read approved SAM2 mask evidence prefixes only',
    }),
    binding({
      bindingId: 'phase45f-qa-evidence-read',
      bucket: trackAVisualReadinessConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase45f_qa_evidence_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45a/phase45a-20260531T19033/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45b/phase45b-20260531T19552/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45c/phase45c-20260531T20404/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45d/phase45d-20260531T22235/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45e/phase45e-20260531T23580/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-real-video/")',
      description: 'Read approved Track A QA evidence only',
    }),
    binding({
      bindingId: 'phase45f-generated-create',
      bucket: trackAVisualReadinessConfig.generatedAssetsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45f_generated_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45f/")',
      description: 'Create Phase 45F generated-assets readiness artifacts only',
    }),
    binding({
      bindingId: 'phase45f-qa-create',
      bucket: trackAVisualReadinessConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase45f_qa_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45f/")',
      description: 'Create Phase 45F QA/report artifacts only',
    }),
  ]
}
