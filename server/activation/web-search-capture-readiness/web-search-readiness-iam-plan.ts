import { webSearchCaptureReadinessConfig } from './web-search-capture-readiness-policy'
import type { WebSearchReadinessIamPlanEntry } from './web-search-capture-readiness-types'

export function buildWebSearchReadinessIamPlan(): WebSearchReadinessIamPlanEntry[] {
  return [
    objectCreator('phase49h-generated-assets-object-creator', webSearchCaptureReadinessConfig.generatedAssetsBucket),
    objectCreator('phase49h-qa-artifacts-object-creator', webSearchCaptureReadinessConfig.qaBucket),
  ]
}

export function summarizeWebSearchReadinessIamPlan(entries = buildWebSearchReadinessIamPlan()): string {
  return [
    'Phase 49H web search/capture readiness IAM plan',
    'Report-only by default. Apply only if private Phase 49H artifact uploads fail.',
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

function objectCreator(bindingId: string, bucket: string): WebSearchReadinessIamPlanEntry {
  const prefix = `${webSearchCaptureReadinessConfig.artifactPrefixBase}/`
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
