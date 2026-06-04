import { mapLibreTurfFixtureConfig } from './maplibre-turf-fixture-policy'

export function buildMapLibreTurfFixtureIamPlan() {
  return {
    phase: '50B',
    mode: 'report_only',
    defaultMutationRequired: false,
    preferredResult: 'IAM mutation not required if the active account already has private object creation permissions.',
    conditionalBindingsIfNeeded: [
      {
        role: 'roles/storage.objectCreator',
        bucket: mapLibreTurfFixtureConfig.generatedAssetsBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${mapLibreTurfFixtureConfig.generatedAssetsBucket}/objects/${mapLibreTurfFixtureConfig.reportObjectPrefix}/")`,
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: mapLibreTurfFixtureConfig.qaBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${mapLibreTurfFixtureConfig.qaBucket}/objects/${mapLibreTurfFixtureConfig.reportObjectPrefix}/")`,
      },
    ],
    forbidden: ['roles/storage.admin', 'roles/storage.objectAdmin', 'owner', 'editor', 'allUsers', 'allAuthenticatedUsers', 'broad bucket permissions'],
  }
}
