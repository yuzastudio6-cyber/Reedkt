import { readabilityExtractionConfig } from './readability-extraction-policy'
import type { ReadabilityExtractionIamPlan } from './readability-extraction-types'

const member = 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'

export function buildReadabilityExtractionIamPlan(): ReadabilityExtractionIamPlan[] {
  return [
    plan('phase49d-generated-assets-object-creator', readabilityExtractionConfig.generatedAssetsBucket),
    plan('phase49d-qa-artifacts-object-creator', readabilityExtractionConfig.qaBucket),
  ]
}

function plan(bindingId: string, bucket: string): ReadabilityExtractionIamPlan {
  const conditionTitle = `phase49d_${bucket.replace(/-/g, '_')}_object_creator`
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${readabilityExtractionConfig.reportObjectPrefix}/")`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectCreator',
    member,
    conditionTitle,
    conditionExpression,
    description: 'Report-only Phase 49D IAM plan. Apply only if future worker execution lacks create permission for private Readability fixture artifacts.',
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member="${member}" --role="roles/storage.objectCreator" --condition=title=${conditionTitle},expression='${conditionExpression}',description='Phase 49D private Readability fixture object creation only'`,
    reportOnly: true,
  }
}
