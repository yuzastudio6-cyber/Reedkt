import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngIamPlanEntry } from './private-searxng-service-types'

export function buildPrivateSearxngIamPlan(activeAccount = 'aiediting@reeditpro.com'): PrivateSearxngIamPlanEntry[] {
  const member = activeAccount.endsWith('.gserviceaccount.com') ? `serviceAccount:${activeAccount}` : `user:${activeAccount}`
  return [
    {
      bindingId: 'phase49f-cloud-run-invoker-active-principal',
      target: 'cloud_run_service',
      resource: privateSearxngServiceConfig.serviceName,
      role: 'roles/run.invoker',
      member,
      description: 'Minimal authenticated Cloud Run invoker grant for the active approved Phase 49F principal.',
      commandString: `gcloud run services add-iam-policy-binding ${privateSearxngServiceConfig.serviceName} --project ${privateSearxngServiceConfig.projectId} --region ${privateSearxngServiceConfig.region} --member="${member}" --role="roles/run.invoker"`,
      reportOnly: true,
    },
    gcsPlan('phase49f-generated-assets-object-creator', privateSearxngServiceConfig.generatedAssetsBucket),
    gcsPlan('phase49f-qa-artifacts-object-creator', privateSearxngServiceConfig.qaBucket),
  ]
}

function gcsPlan(bindingId: string, bucket: string): PrivateSearxngIamPlanEntry {
  const conditionTitle = `${bindingId.replace(/-/g, '_')}_${bucket.replace(/-/g, '_')}`
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/activation-web-search/phase49f/")`
  return {
    bindingId,
    target: 'gcs_bucket',
    resource: bucket,
    role: 'roles/storage.objectCreator',
    member: `serviceAccount:${privateSearxngServiceConfig.serviceAccountEmail}`,
    conditionTitle,
    conditionExpression,
    description: 'Report-only conditional objectCreator binding for Phase 49F private JSON artifacts.',
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member="serviceAccount:${privateSearxngServiceConfig.serviceAccountEmail}" --role="roles/storage.objectCreator" --condition=title=${conditionTitle},expression='${conditionExpression}',description='Phase 49F private SearXNG artifacts only'`,
    reportOnly: true,
  }
}
