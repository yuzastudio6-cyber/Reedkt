import { webSearchRegressionConfig } from './web-search-regression-policy'
import type { WebSearchRegressionIamPlanEntry } from './web-search-regression-types'

export function buildWebSearchRegressionIamPlan(): WebSearchRegressionIamPlanEntry[] {
  return [
    {
      bindingId: 'phase49o-generated-assets-object-creator',
      role: 'roles/storage.objectCreator',
      member: 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
      bucket: webSearchRegressionConfig.generatedAssetsBucket,
      prefix: `${webSearchRegressionConfig.artifactPrefixBase}/`,
      condition: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-web-search/phase49o/")',
      requiredForExecution: false,
      broadAccess: false,
    },
    {
      bindingId: 'phase49o-qa-artifacts-object-creator',
      role: 'roles/storage.objectCreator',
      member: 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
      bucket: webSearchRegressionConfig.qaBucket,
      prefix: `${webSearchRegressionConfig.artifactPrefixBase}/`,
      condition: 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-web-search/phase49o/")',
      requiredForExecution: false,
      broadAccess: false,
    },
  ]
}
