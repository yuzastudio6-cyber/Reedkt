import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type { PrivateWebE2EIamPlan } from './private-web-search-capture-e2e-types'

export function buildPrivateWebE2EIamPlan(): PrivateWebE2EIamPlan[] {
  return [
    plan('phase49e-generated-assets-object-creator', privateWebE2EConfig.generatedAssetsBucket),
    plan('phase49e-qa-artifacts-object-creator', privateWebE2EConfig.qaBucket),
  ]
}

function plan(bindingId: string, bucket: string): PrivateWebE2EIamPlan {
  const conditionTitle = `phase49e_${bucket.replace(/-/g, '_')}_object_creator`
  const expression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${privateWebE2EConfig.reportObjectPrefix}/")`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectCreator',
    member: 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    conditionTitle,
    conditionExpression: expression,
    description: 'Report-only Phase 49E IAM plan. Apply only if future worker execution lacks create permission for private E2E artifacts.',
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member="serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com" --role="roles/storage.objectCreator" --condition=title=${conditionTitle},expression='${expression}',description='Phase 49E private web E2E object creation only'`,
    reportOnly: true,
  }
}
