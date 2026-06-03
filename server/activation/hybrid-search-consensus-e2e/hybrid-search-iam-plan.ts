import { hybridSearchConfig } from './hybrid-search-consensus-policy'
import type { HybridSearchIamPlan } from './hybrid-search-consensus-types'

const approvedSecretMembers = [
  'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
  'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
] as const

export function buildHybridSearchIamPlan(): HybridSearchIamPlan[] {
  return [
    buildCreatorPlan('phase49m-generated-assets-object-creator', hybridSearchConfig.generatedAssetsBucket),
    buildCreatorPlan('phase49m-qa-artifacts-object-creator', hybridSearchConfig.qaBucket),
    ...approvedSecretMembers.map((member) => buildSecretAccessorPlan(`phase49m-brave-secret-accessor-${member.split(':')[1]}`, member)),
  ]
}

function buildCreatorPlan(bindingId: string, bucket: string): HybridSearchIamPlan {
  const conditionTitle = `${bindingId}-prefix`
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${hybridSearchConfig.artifactPrefixBase}/")`
  return {
    bindingId,
    resource: `gs://${bucket}`,
    role: 'roles/storage.objectCreator',
    member: 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    conditionTitle,
    conditionExpression,
    description: 'Report-only Phase 49M IAM plan. Apply only if runtime lacks create permission for private hybrid consensus artifacts.',
    commandString: [
      'gcloud storage buckets add-iam-policy-binding',
      `gs://${bucket}`,
      '--member=serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
      '--role=roles/storage.objectCreator',
      `--condition=title=${conditionTitle},expression='${conditionExpression}',description='Phase 49M private hybrid search artifact object creation only'`,
    ].join(' '),
    reportOnly: true,
  }
}

function buildSecretAccessorPlan(bindingId: string, member: string): HybridSearchIamPlan {
  return {
    bindingId,
    resource: 'projects/reeditpro/secrets/BRAVE_SEARCH_API_KEY',
    role: 'roles/secretmanager.secretAccessor',
    member,
    description: 'Report-only Phase 49M Secret Manager plan. Apply only at the secret resource level for approved staging service accounts.',
    commandString: [
      'gcloud secrets add-iam-policy-binding BRAVE_SEARCH_API_KEY',
      '--project=reeditpro',
      `--member=${member}`,
      '--role=roles/secretmanager.secretAccessor',
    ].join(' '),
    reportOnly: true,
  }
}
