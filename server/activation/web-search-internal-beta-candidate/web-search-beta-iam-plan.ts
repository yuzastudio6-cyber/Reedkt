import { webSearchInternalBetaConfig } from './web-search-internal-beta-policy'
import type { WebSearchInternalBetaIamPlanEntry } from './web-search-internal-beta-types'

export function buildWebSearchInternalBetaIamPlan(): WebSearchInternalBetaIamPlanEntry[] {
  return [
    objectCreator('phase49p-generated-assets-object-creator', webSearchInternalBetaConfig.generatedAssetsBucket),
    objectCreator('phase49p-qa-artifacts-object-creator', webSearchInternalBetaConfig.qaBucket),
  ]
}

export function summarizeWebSearchInternalBetaIamPlan(entries = buildWebSearchInternalBetaIamPlan()): string {
  return [
    'Phase 49P web search internal beta candidate IAM plan',
    'Report-only by default. Apply only if private Phase 49P artifact uploads fail.',
    ...entries.map((entry) => [
      `- ${entry.bindingId}`,
      `  role: ${entry.role}`,
      `  member: ${entry.member}`,
      `  bucket: ${entry.bucket}`,
      `  prefix: ${entry.prefix}`,
      `  condition: ${entry.condition}`,
      `  broad access: ${entry.broadAccess}`,
    ].join('\n')),
    'Forbidden: allUsers, allAuthenticatedUsers, storage.admin, storage.objectAdmin, owner/editor, public artifacts, signed URLs as source of truth, and Secret Manager value access.',
  ].join('\n')
}

function objectCreator(bindingId: string, bucket: string): WebSearchInternalBetaIamPlanEntry {
  const prefix = `${webSearchInternalBetaConfig.artifactPrefixBase}/`
  return {
    bindingId,
    role: 'roles/storage.objectCreator',
    member: 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    bucket,
    prefix,
    condition: `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`,
    requiredForExecution: false,
    broadAccess: false,
  }
}
