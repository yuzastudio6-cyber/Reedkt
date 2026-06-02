import { searxngSearchFixtureConfig } from './searxng-search-fixture-policy'
import type { SearxngSearchFixtureIamPlan } from './searxng-search-fixture-types'

const cpuWorkerServiceAccount = 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'

export function buildSearxngSearchFixtureIamPlan(): SearxngSearchFixtureIamPlan[] {
  return [
    buildCreatorPlan('phase49b-generated-assets-object-creator', searxngSearchFixtureConfig.generatedAssetsBucket),
    buildCreatorPlan('phase49b-qa-artifacts-object-creator', searxngSearchFixtureConfig.qaBucket),
  ]
}

function buildCreatorPlan(bindingId: string, bucket: string): SearxngSearchFixtureIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${searxngSearchFixtureConfig.reportObjectPrefix}/")`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectCreator',
    member: cpuWorkerServiceAccount,
    conditionTitle: `phase49b_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}_object_creator`,
    conditionExpression,
    description: 'Report-only Phase 49B IAM plan. Apply only if a future worker execution lacks create permission for private fixture JSON artifacts.',
    commandString: [
      'gcloud storage buckets add-iam-policy-binding',
      `gs://${bucket}`,
      `--member="${cpuWorkerServiceAccount}"`,
      '--role="roles/storage.objectCreator"',
      `--condition=title=phase49b_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}_object_creator,expression='${conditionExpression}',description='Phase 49B private fixture JSON object creation only'`,
    ].join(' '),
    reportOnly: true,
  }
}
