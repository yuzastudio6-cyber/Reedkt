import { webSearchUiApiGatingConfig } from './web-search-ui-api-gating-policy'
import type { WebSearchUiApiIamPlanEntry } from './web-search-ui-api-gating-types'

export function buildWebSearchUiApiIamPlan(): WebSearchUiApiIamPlanEntry[] {
  return [
    objectCreator('phase49i-generated-assets-object-creator', webSearchUiApiGatingConfig.generatedAssetsBucket),
    objectCreator('phase49i-qa-artifacts-object-creator', webSearchUiApiGatingConfig.qaBucket),
  ]
}

export function summarizeWebSearchUiApiIamPlan(entries = buildWebSearchUiApiIamPlan()): string {
  return [
    'Phase 49I web search/capture UI API gating IAM plan',
    'Report-only by default. Apply only if private Phase 49I artifact uploads fail.',
    ...entries.map((entry) => [
      `- ${entry.bindingId}`,
      `  role: ${entry.role}`,
      `  member: ${entry.member}`,
      `  bucket: ${entry.bucket}`,
      `  prefix: ${entry.prefix}`,
      `  condition: ${entry.condition}`,
      `  broad access: ${entry.broadAccess}`,
    ].join('\n')),
    'Forbidden: allUsers, allAuthenticatedUsers, storage.admin, storage.objectAdmin, owner/editor, public artifacts, signed URLs as source of truth.',
  ].join('\n')
}

function objectCreator(bindingId: string, bucket: string): WebSearchUiApiIamPlanEntry {
  const prefix = `${webSearchUiApiGatingConfig.artifactPrefixBase}/`
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
