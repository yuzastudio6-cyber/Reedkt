import type { MapGeospatialApprovalConfig, MapGeospatialQaGateId } from './map-geospatial-approval-types'

export const mapGeospatialApprovalConfig: MapGeospatialApprovalConfig = {
  phase: '50A',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'map_geospatial_approval_static',
  reportObjectPrefix: 'activation-map-geospatial/phase50a',
}

export const mapGeospatialQaGateIds: MapGeospatialQaGateId[] = [
  'tool_evidence',
  'license_review',
  'free_open_source_default',
  'ownership_boundaries',
  'data_provider_policy',
  'risk_register_complete',
  'future_scope_defined',
  'command_plan_blocked',
  'package_scripts_present',
  'blocked_features',
]

export const mapGeospatialRequiredScripts = [
  'activation:map-geospatial-approval:plan',
  'activation:map-geospatial-approval:report',
  'activation:map-geospatial-tool:summary',
  'smoke:activation-map-geospatial-approval-workflow',
] as const

export const mapGeospatialRequiredDocs = [
  'docs/activation-map-geospatial-approval-runbook.md',
  'docs/activation-map-geospatial-approval-policy.md',
  'docs/activation-map-geospatial-approval-artifact-policy.md',
  'docs/activation-map-geospatial-approval-qa-policy.md',
  'docs/activation-phase-50a-map-geospatial-approval-results.md',
  'docs/activation-phase-roadmap.md',
  'docs/activation-next-phase-runbook.md',
  'docs/activation-readiness-state.md',
] as const

export const mapGeospatialBlockedScopes = [
  'package installation',
  'map runtime rendering',
  'tile download',
  'live geocoding',
  'live routing',
  'external map API calls',
  'public OSM tile hotlinking for beta or production',
  'Mapbox paid tiles or APIs',
  'Google Maps APIs',
  'Cesium ion paid assets or services',
  'arbitrary tile endpoints',
  'Playwright browser capture',
  'map screenshots',
  'Docker build or push',
  'GCP mutation',
  'public artifacts',
  'signed URLs as source of truth',
  'API keys or provider secrets',
  'production',
  'external beta',
  'paid production',
  'broad real media',
  'providers',
  'Revideo',
]

export function validateMapGeospatialApprovalStaticEnv(input: {
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  revideoEnabled?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  warnings.push('Phase 50A is static/report-only and does not require GCP env or execution confirmation.')
  warnings.push('Future map/geospatial execution phases must start with generated/local fixtures and approved plan snapshots.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
