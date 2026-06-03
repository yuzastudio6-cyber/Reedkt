import { searchProviderReadinessConfig } from './search-provider-readiness-policy'
import type { SearchProviderReadinessIamPlanEntry } from './search-provider-readiness-types'

export function buildSearchProviderReadinessIamPlan(): SearchProviderReadinessIamPlanEntry[] {
  return [
    objectCreator('phase49n-generated-assets-object-creator', searchProviderReadinessConfig.generatedAssetsBucket),
    objectCreator('phase49n-qa-artifacts-object-creator', searchProviderReadinessConfig.qaBucket),
  ]
}

export function summarizeSearchProviderReadinessIamPlan(entries = buildSearchProviderReadinessIamPlan()): string {
  return [
    'Phase 49N search provider readiness IAM plan',
    'Report-only by default. Apply only if private Phase 49N artifact uploads fail.',
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

function objectCreator(bindingId: string, bucket: string): SearchProviderReadinessIamPlanEntry {
  const prefix = `${searchProviderReadinessConfig.artifactPrefixBase}/`
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
