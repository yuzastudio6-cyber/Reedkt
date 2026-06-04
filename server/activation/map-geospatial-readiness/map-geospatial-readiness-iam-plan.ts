import { mapGeospatialReadinessConfig } from './map-geospatial-readiness-policy'
import type { MapGeospatialReadinessIamPlan } from './map-geospatial-readiness-types'

export function buildMapGeospatialReadinessIamPlan(): MapGeospatialReadinessIamPlan {
  return {
    phase: '50G',
    mode: 'report_only',
    defaultMutationAllowed: false,
    generatedAssetsPrefix: `gs://${mapGeospatialReadinessConfig.generatedAssetsBucket}/${mapGeospatialReadinessConfig.artifactPrefixBase}/`,
    qaPrefix: `gs://${mapGeospatialReadinessConfig.qaBucket}/${mapGeospatialReadinessConfig.artifactPrefixBase}/`,
    conditionalBindingsIfUploadBlocked: [
      {
        role: 'roles/storage.objectCreator',
        bucket: mapGeospatialReadinessConfig.generatedAssetsBucket,
        conditionPrefix: `${mapGeospatialReadinessConfig.artifactPrefixBase}/`,
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: mapGeospatialReadinessConfig.qaBucket,
        conditionPrefix: `${mapGeospatialReadinessConfig.artifactPrefixBase}/`,
      },
    ],
    forbiddenBindings: ['allUsers', 'allAuthenticatedUsers', 'roles/storage.admin', 'roles/storage.objectAdmin', 'roles/owner', 'roles/editor'],
    notes: [
      'IAM plan is report-only by default.',
      'If upload is blocked, use only conditional prefix-scoped objectCreator for Phase 50G generated-assets and QA prefixes.',
      'Do not grant public principals, broad bucket permissions, owner/editor, storage admin, or object admin.',
    ],
  }
}
