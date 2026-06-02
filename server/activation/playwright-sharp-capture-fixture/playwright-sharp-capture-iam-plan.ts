import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'
import type { PlaywrightSharpCaptureIamPlan } from './playwright-sharp-capture-types'

const cpuWorkerServiceAccount = 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'

export function buildPlaywrightSharpCaptureIamPlan(): PlaywrightSharpCaptureIamPlan[] {
  return [
    buildCreatorPlan('phase49c-generated-assets-object-creator', playwrightSharpCaptureConfig.generatedAssetsBucket),
    buildCreatorPlan('phase49c-qa-artifacts-object-creator', playwrightSharpCaptureConfig.qaBucket),
  ]
}

function buildCreatorPlan(bindingId: string, bucket: string): PlaywrightSharpCaptureIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${playwrightSharpCaptureConfig.reportObjectPrefix}/")`
  return {
    bindingId,
    bucket,
    role: 'roles/storage.objectCreator',
    member: cpuWorkerServiceAccount,
    conditionTitle: `phase49c_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}_object_creator`,
    conditionExpression,
    description: 'Report-only Phase 49C IAM plan. Apply only if future worker execution lacks create permission for private capture fixture artifacts.',
    commandString: [
      'gcloud storage buckets add-iam-policy-binding',
      `gs://${bucket}`,
      `--member="${cpuWorkerServiceAccount}"`,
      '--role="roles/storage.objectCreator"',
      `--condition=title=phase49c_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}_object_creator,expression='${conditionExpression}',description='Phase 49C private capture fixture object creation only'`,
    ].join(' '),
    reportOnly: true,
  }
}
