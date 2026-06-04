import type { MapGeospatialReadinessCommandPlan } from './map-geospatial-readiness-types'

export function buildMapGeospatialReadinessCommandPlan(): MapGeospatialReadinessCommandPlan {
  return {
    planId: 'phase50g-map-geospatial-readiness-command-plan',
    defaultMode: 'static_report_only',
    commands: [
      {
        commandId: 'phase50g-static-report',
        description: 'Build the Phase 50G readiness report without GCP mutation or runtime execution.',
        command: 'npm run activation:map-geospatial-readiness:report',
        mutating: false,
        allowedInPhase50G: true,
      },
      {
        commandId: 'phase50g-iam-plan',
        description: 'Print report-only IAM plan for private Phase 50G artifact uploads.',
        command: 'npm run activation:map-geospatial-readiness:iam-plan',
        mutating: false,
        allowedInPhase50G: true,
      },
      {
        commandId: 'phase50g-execute-readiness-audit',
        description: 'Execute metadata-only evidence audit and upload private JSON artifacts.',
        command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_MAP_GEOSPATIAL_INTERNAL_READINESS=true npm run activation:map-geospatial-readiness -- --execute',
        mutating: true,
        allowedInPhase50G: true,
      },
    ],
    blockedAlways: [
      'new map rendering',
      'new Playwright capture',
      'live tile requests',
      'public OSM tiles',
      'tile downloads',
      'live geocoding',
      'live routing',
      'paid map providers',
      'Cesium ion',
      'live terrain',
      'live imagery',
      '3D Tiles',
      'D3 runtime',
      'Three.js runtime',
      'production',
      'external beta',
    ],
  }
}
