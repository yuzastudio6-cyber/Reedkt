import { braveSearchFixtureConfig } from './brave-search-fixture-policy'
import type { BraveFixtureIamPlan } from './brave-search-fixture-types'

const cpuWorkerServiceAccount = 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'

export function buildBraveFixtureIamPlan(): BraveFixtureIamPlan[] {
  return [
    buildCreatorPlan('phase49k-generated-assets-object-creator', braveSearchFixtureConfig.generatedAssetsBucket),
    buildCreatorPlan('phase49k-qa-artifacts-object-creator', braveSearchFixtureConfig.qaBucket),
  ]
}

function buildCreatorPlan(bindingId: string, bucket: string): BraveFixtureIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${braveSearchFixtureConfig.reportObjectPrefix}/")`
  const conditionTitle = `phase49k_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}_object_creator`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectCreator',
    member: cpuWorkerServiceAccount,
    conditionTitle,
    conditionExpression,
    description: 'Report-only Phase 49K IAM plan. Apply only if a future worker lacks create permission for private Brave fixture JSON artifacts.',
    commandString: [
      'gcloud storage buckets add-iam-policy-binding',
      `gs://${bucket}`,
      `--member="${cpuWorkerServiceAccount}"`,
      '--role="roles/storage.objectCreator"',
      `--condition=title=${conditionTitle},expression='${conditionExpression}',description='Phase 49K private Brave fixture JSON object creation only'`,
    ].join(' '),
    reportOnly: true,
  }
}
