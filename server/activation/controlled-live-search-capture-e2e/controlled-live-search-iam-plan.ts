import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'

export interface ControlledLiveSearchIamPlanEntry {
  id: string
  role: string
  member: string
  resource: string
  condition?: {
    title: string
    expression: string
  }
  reportOnly: true
  reason: string
}

export function buildControlledLiveSearchIamPlan(): ControlledLiveSearchIamPlanEntry[] {
  return [
    {
      id: 'phase49g-cloud-run-invoker-active-principal',
      role: 'roles/run.invoker',
      member: 'active-authenticated-principal-only',
      resource: `projects/${controlledLiveSearchConfig.projectId}/locations/${controlledLiveSearchConfig.region}/services/${controlledLiveSearchConfig.serviceName}`,
      reportOnly: true,
      reason: 'Invoke the existing private authenticated SearXNG Cloud Run service without granting allUsers or allAuthenticatedUsers.',
    },
    {
      id: 'phase49g-generated-assets-object-creator',
      role: 'roles/storage.objectCreator',
      member: 'active-authenticated-principal-only',
      resource: `gs://${controlledLiveSearchConfig.generatedAssetsBucket}`,
      condition: {
        title: 'phase49g-generated-assets-prefix-only',
        expression: `resource.name.startsWith("projects/_/buckets/${controlledLiveSearchConfig.generatedAssetsBucket}/objects/${controlledLiveSearchConfig.artifactPrefixBase}/")`,
      },
      reportOnly: true,
      reason: 'Create only Phase 49G private generated-assets JSON, PNG, and text artifacts if a missing prefix-scoped binding is detected.',
    },
    {
      id: 'phase49g-qa-artifacts-object-creator',
      role: 'roles/storage.objectCreator',
      member: 'active-authenticated-principal-only',
      resource: `gs://${controlledLiveSearchConfig.qaBucket}`,
      condition: {
        title: 'phase49g-qa-artifacts-prefix-only',
        expression: `resource.name.startsWith("projects/_/buckets/${controlledLiveSearchConfig.qaBucket}/objects/${controlledLiveSearchConfig.artifactPrefixBase}/")`,
      },
      reportOnly: true,
      reason: 'Create only Phase 49G private QA/report JSON artifacts if a missing prefix-scoped binding is detected.',
    },
  ]
}
