import type {
  ToolRouteFamily,
  ToolRouteFamilyId,
  ToolRouteFamilyMap,
  WorkerDryRunRouteResolution,
} from './tool-route-audit-types'

const FAMILY_ORDER: ToolRouteFamilyId[] = [
  'provider_model_planning',
  'track_a_render_export',
  'track_b_media_audio_model',
  'ai_tools_creative_graphics',
  'map_geospatial',
  'web_search_capture',
  'sound_music_audio',
  'supabase_metadata_storage',
  'public_artifact_signed_url_delivery',
  'billing_credits',
  'observability_audit_cost',
  'compliance_security',
  'worker_runtime_jobs',
  'frontend_product_ux',
]

const FAMILY_META: Record<ToolRouteFamilyId, {
  label: string
  owner: string
  toolStudy0Required: boolean
}> = {
  provider_model_planning: { label: 'Provider/model planning route', owner: 'PROVIDER_GATEWAY_MODELS', toolStudy0Required: true },
  track_a_render_export: { label: 'Track A render/export route', owner: 'TRACK_A_RENDER_EXPORT', toolStudy0Required: true },
  track_b_media_audio_model: { label: 'Track B media/audio/model route', owner: 'TRACK_B_MEDIA_PROCESSING', toolStudy0Required: true },
  ai_tools_creative_graphics: { label: 'AI Tools creative graphics route', owner: 'AI_TOOLS_CREATIVE_GRAPHICS', toolStudy0Required: true },
  map_geospatial: { label: 'Map/geospatial route', owner: 'MAP_GEOSPATIAL', toolStudy0Required: true },
  web_search_capture: { label: 'Web search/capture route', owner: 'WEB_SEARCH_CAPTURE', toolStudy0Required: true },
  sound_music_audio: { label: 'Sound/music/audio route', owner: 'SOUND_MUSIC_AUDIO', toolStudy0Required: true },
  supabase_metadata_storage: { label: 'Supabase metadata/storage route', owner: 'SUPABASE_RLS_STORAGE_DATABASE', toolStudy0Required: true },
  public_artifact_signed_url_delivery: { label: 'Public artifact/signed URL delivery route', owner: 'COMPLIANCE_SECURITY', toolStudy0Required: false },
  billing_credits: { label: 'Billing/credits route', owner: 'BILLING_STRIPE_CREDITS', toolStudy0Required: false },
  observability_audit_cost: { label: 'Observability/audit/cost route', owner: 'OBSERVABILITY_AUDIT_COST', toolStudy0Required: false },
  compliance_security: { label: 'Compliance/security route', owner: 'COMPLIANCE_SECURITY', toolStudy0Required: false },
  worker_runtime_jobs: { label: 'Worker runtime jobs route', owner: 'WORKER_RUNTIME_JOBS', toolStudy0Required: true },
  frontend_product_ux: { label: 'Frontend/product UX route', owner: 'FRONTEND_PRODUCT_UX', toolStudy0Required: false },
}

export function buildToolRouteFamilyMap(routeResolution: WorkerDryRunRouteResolution): ToolRouteFamilyMap {
  const referencedFamilies = new Map<ToolRouteFamilyId, string[]>()
  for (const review of routeResolution.routeReviews) {
    for (const familyId of review.relatedRouteFamilyIds) {
      const refs = referencedFamilies.get(familyId) ?? []
      refs.push(review.jobId)
      referencedFamilies.set(familyId, refs)
    }
  }
  const families: ToolRouteFamily[] = FAMILY_ORDER.map((familyId) => {
    const meta = FAMILY_META[familyId]
    return {
      familyId,
      label: meta.label,
      owner: meta.owner,
      sourceEvidence: referencedFamilies.get(familyId) ?? [],
      toolStudy0Required: meta.toolStudy0Required,
      capabilityRoutingRequiredBeforeExecution: true,
      ownerAcceptanceRequired: true,
      routeExecutionAllowed: false,
      runtimeReady: false,
      currentStatus: referencedFamilies.has(familyId) ? 'mapped_review_only' : 'mapped_blocked',
    }
  })
  const activeBlockers = [...routeResolution.activeBlockers]
  if (families.length !== FAMILY_ORDER.length) activeBlockers.push(`unexpected_route_family_count:${families.length}`)
  for (const familyId of FAMILY_ORDER) {
    if (!families.some((family) => family.familyId === familyId)) activeBlockers.push(`missing_route_family:${familyId}`)
  }

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    families,
    routeFamilyCount: families.length,
    allFamiliesMapped: activeBlockers.length === 0,
    activeBlockers,
  }
}
