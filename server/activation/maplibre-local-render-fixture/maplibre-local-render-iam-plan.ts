import { mapLibreLocalRenderConfig } from './maplibre-local-render-policy'

export function buildMapLibreLocalRenderIamPlan() {
  return {
    phase: '50C',
    mode: 'report_only',
    defaultMutationRequired: false,
    preferredResult: 'IAM mutation not required if the active account already has private object creation permissions.',
    conditionalBindingsIfNeeded: [
      {
        role: 'roles/storage.objectCreator',
        bucket: mapLibreLocalRenderConfig.generatedAssetsBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${mapLibreLocalRenderConfig.generatedAssetsBucket}/objects/${mapLibreLocalRenderConfig.reportObjectPrefix}/")`,
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: mapLibreLocalRenderConfig.qaBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${mapLibreLocalRenderConfig.qaBucket}/objects/${mapLibreLocalRenderConfig.reportObjectPrefix}/")`,
      },
    ],
    forbidden: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'owner',
      'editor',
      'allUsers',
      'allAuthenticatedUsers',
      'broad bucket permissions',
      'public artifacts',
      'signed URLs as source of truth',
    ],
  }
}
