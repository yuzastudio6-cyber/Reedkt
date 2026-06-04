import { cesiumJsLocal3DConfig } from './cesiumjs-local-3d-policy'

export function buildCesiumJsLocal3DIamPlan() {
  return {
    phase: '50E',
    mode: 'report_only',
    defaultMutationRequired: false,
    preferredResult: 'IAM mutation not required if the active account already has private object creation permissions.',
    conditionalBindingsIfNeeded: [
      {
        role: 'roles/storage.objectCreator',
        bucket: cesiumJsLocal3DConfig.generatedAssetsBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${cesiumJsLocal3DConfig.generatedAssetsBucket}/objects/${cesiumJsLocal3DConfig.reportObjectPrefix}/")`,
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: cesiumJsLocal3DConfig.qaBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${cesiumJsLocal3DConfig.qaBucket}/objects/${cesiumJsLocal3DConfig.reportObjectPrefix}/")`,
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
