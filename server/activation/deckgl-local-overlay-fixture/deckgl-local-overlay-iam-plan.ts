import { deckGlLocalOverlayConfig } from './deckgl-local-overlay-policy'

export function buildDeckGlLocalOverlayIamPlan() {
  return {
    phase: '50D',
    mode: 'report_only',
    defaultMutationRequired: false,
    preferredResult: 'IAM mutation not required if the active account already has private object creation permissions.',
    conditionalBindingsIfNeeded: [
      {
        role: 'roles/storage.objectCreator',
        bucket: deckGlLocalOverlayConfig.generatedAssetsBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${deckGlLocalOverlayConfig.generatedAssetsBucket}/objects/${deckGlLocalOverlayConfig.reportObjectPrefix}/")`,
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: deckGlLocalOverlayConfig.qaBucket,
        condition: `resource.name.startsWith("projects/_/buckets/${deckGlLocalOverlayConfig.qaBucket}/objects/${deckGlLocalOverlayConfig.reportObjectPrefix}/")`,
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
