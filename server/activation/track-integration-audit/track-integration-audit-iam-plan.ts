import { trackIntegrationAuditConfig } from './track-integration-audit-policy'
import type { TrackIntegrationAuditIamPlan } from './track-integration-audit-types'

const member = 'user:ACTIVE_GCLOUD_ACCOUNT'

function binding(input: Omit<TrackIntegrationAuditIamPlan, 'member' | 'commandString' | 'reportOnly'>): TrackIntegrationAuditIamPlan {
  const commandString = [
    'gcloud storage buckets add-iam-policy-binding',
    `gs://${input.bucket}`,
    `--member=${member}`,
    `--role=${input.role}`,
    `--condition=title=${input.conditionTitle},expression='${input.conditionExpression}',description='${input.description}'`,
  ].join(' ')
  return { ...input, member, commandString, reportOnly: true }
}

export function buildTrackIntegrationAuditIamPlan(): TrackIntegrationAuditIamPlan[] {
  return [
    binding({
      bindingId: 'phase47a-generated-evidence-read',
      bucket: trackIntegrationAuditConfig.generatedAssetsBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase47a_generated_evidence_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-render-hardening/phase45f/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation/")',
      description: 'Read approved Track A/Track B generated-assets evidence only',
    }),
    binding({
      bindingId: 'phase47a-qa-evidence-read',
      bucket: trackIntegrationAuditConfig.qaBucket,
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase47a_qa_evidence_read',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-render-hardening/phase45f/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-audio-ai/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation/phase37e/") || resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation/phase39c/")',
      description: 'Read approved Track A closure and Track B audio/OCR/VLM QA evidence only',
    }),
    binding({
      bindingId: 'phase47a-generated-create',
      bucket: trackIntegrationAuditConfig.generatedAssetsBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase47a_generated_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-track-integration/phase47a/")',
      description: 'Create Phase 47A generated-assets integration audit JSON only',
    }),
    binding({
      bindingId: 'phase47a-qa-create',
      bucket: trackIntegrationAuditConfig.qaBucket,
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase47a_qa_create',
      conditionExpression: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-track-integration/phase47a/")',
      description: 'Create Phase 47A QA/report JSON only',
    }),
  ]
}
