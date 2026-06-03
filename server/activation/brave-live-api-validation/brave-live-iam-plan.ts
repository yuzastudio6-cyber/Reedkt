import { braveLiveApiConfig } from './brave-live-api-policy'
import type { BraveLiveIamPlan } from './brave-live-api-types'

const cpuWorkerServiceAccount = 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const apiServiceAccount = 'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com'

export function buildBraveLiveIamPlan(): BraveLiveIamPlan[] {
  return [
    buildCreatorPlan('phase49l-generated-assets-object-creator', braveLiveApiConfig.generatedAssetsBucket),
    buildCreatorPlan('phase49l-qa-artifacts-object-creator', braveLiveApiConfig.qaBucket),
    buildSecretAccessorPlan('phase49l-api-secret-accessor', apiServiceAccount),
    buildSecretAccessorPlan('phase49l-cpu-worker-secret-accessor', cpuWorkerServiceAccount),
  ]
}

function buildCreatorPlan(bindingId: string, bucket: string): BraveLiveIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${braveLiveApiConfig.reportObjectPrefix}/")`
  const conditionTitle = `phase49l_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}_object_creator`
  return {
    bindingId,
    resource: `gs://${bucket}`,
    role: 'roles/storage.objectCreator',
    member: cpuWorkerServiceAccount,
    conditionTitle,
    conditionExpression,
    description: 'Report-only Phase 49L IAM plan. Apply only if the runtime lacks create permission for private Brave live validation JSON artifacts.',
    commandString: [
      'gcloud storage buckets add-iam-policy-binding',
      `gs://${bucket}`,
      `--member="${cpuWorkerServiceAccount}"`,
      '--role="roles/storage.objectCreator"',
      `--condition=title=${conditionTitle},expression='${conditionExpression}',description='Phase 49L private Brave live validation JSON object creation only'`,
    ].join(' '),
    reportOnly: true,
  }
}

function buildSecretAccessorPlan(bindingId: string, member: string): BraveLiveIamPlan {
  return {
    bindingId,
    resource: `projects/${braveLiveApiConfig.projectId}/secrets/${braveLiveApiConfig.secretName}`,
    role: 'roles/secretmanager.secretAccessor',
    member,
    description: 'Report-only Phase 49L Secret Manager plan. Apply only at the secret resource level for approved staging service accounts.',
    commandString: [
      'gcloud secrets add-iam-policy-binding',
      braveLiveApiConfig.secretName,
      `--project=${braveLiveApiConfig.projectId}`,
      `--member="${member}"`,
      '--role="roles/secretmanager.secretAccessor"',
    ].join(' '),
    reportOnly: true,
  }
}
