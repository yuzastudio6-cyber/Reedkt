import type {
  ToolRouteBlockedUse,
  ToolRouteBlockedUseRegister,
  ToolStudyPrerequisiteMap,
} from './tool-route-audit-types'

const BLOCKED_USES: ToolRouteBlockedUse[] = [
  { blockedUseId: 'real_worker_execution', owner: 'WORKER_RUNTIME_JOBS', blocked: true, executionAllowed: false, reason: 'WORKER-1 simulated claims only; real workers require future transactional backend runtime approval.' },
  { blockedUseId: 'tool_execution', owner: 'tool-owning workstreams', blocked: true, executionAllowed: false, reason: 'TOOL-STUDY-0 capability routing contracts must precede tool execution.' },
  { blockedUseId: 'provider_model_calls', owner: 'PROVIDER_GATEWAY_MODELS', blocked: true, executionAllowed: false, reason: 'Provider/model calls are out of TOOL-ROUTE-0 scope.' },
  { blockedUseId: 'track_a_runtime', owner: 'TRACK_A_RENDER_EXPORT', blocked: true, executionAllowed: false, reason: 'Track A render/export runtime requires a separate owner phase.' },
  { blockedUseId: 'track_b_runtime', owner: 'TRACK_B_MEDIA_PROCESSING', blocked: true, executionAllowed: false, reason: 'Track B media/audio/model runtime remains owner-gated.' },
  { blockedUseId: 'ai_tools_runtime', owner: 'AI_TOOLS_CREATIVE_GRAPHICS', blocked: true, executionAllowed: false, reason: 'Graphics tool runtime requires TOOL-STUDY-0 and owner acceptance.' },
  { blockedUseId: 'map_rendering', owner: 'MAP_GEOSPATIAL', blocked: true, executionAllowed: false, reason: 'Map rendering is not executed by this audit.' },
  { blockedUseId: 'web_search_execution', owner: 'WEB_SEARCH_CAPTURE', blocked: true, executionAllowed: false, reason: 'Web search execution remains blocked pending owner study.' },
  { blockedUseId: 'browser_capture', owner: 'WEB_SEARCH_CAPTURE', blocked: true, executionAllowed: false, reason: 'Browser capture remains blocked pending owner study.' },
  { blockedUseId: 'media_processing', owner: 'TRACK_B_MEDIA_PROCESSING', blocked: true, executionAllowed: false, reason: 'Media processing is not run in TOOL-ROUTE-0.' },
  { blockedUseId: 'public_artifacts', owner: 'COMPLIANCE_SECURITY', blocked: true, executionAllowed: false, reason: 'Public artifact creation remains blocked.' },
  { blockedUseId: 'signed_urls_source_of_truth', owner: 'COMPLIANCE_SECURITY', blocked: true, executionAllowed: false, reason: 'Signed URLs cannot become source of truth.' },
  { blockedUseId: 'raw_prompt_execution', owner: 'COMPLIANCE_SECURITY', blocked: true, executionAllowed: false, reason: 'Workers must execute approved snapshots, not raw prompts.' },
  { blockedUseId: 'supabase_mutation', owner: 'SUPABASE_RLS_STORAGE_DATABASE', blocked: true, executionAllowed: false, reason: 'No Supabase rows, schema, storage, or migration mutations are authorized.' },
  { blockedUseId: 'sql_migrations', owner: 'SUPABASE_RLS_STORAGE_DATABASE', blocked: true, executionAllowed: false, reason: 'SQL and migrations are out of scope.' },
  { blockedUseId: 'google_cloud_api_calls', owner: 'COMPLIANCE_SECURITY', blocked: true, executionAllowed: false, reason: 'TOOL-ROUTE-0 is local docs/diagnostics only.' },
  { blockedUseId: 'secret_manager_api_calls', owner: 'COMPLIANCE_SECURITY', blocked: true, executionAllowed: false, reason: 'No secret payload or metadata access is required.' },
  { blockedUseId: 'gcs_storage_transfer', owner: 'OBSERVABILITY_AUDIT_COST', blocked: true, executionAllowed: false, reason: 'No GCS upload or storage transfer is authorized.' },
  { blockedUseId: 'production_external_beta_paid_production_broad_media', owner: 'COMPLIANCE_SECURITY', blocked: true, executionAllowed: false, reason: 'Production, beta, paid production, and broad media remain blocked.' },
]

export function buildToolRouteBlockedUseRegister(
  prerequisiteMap: ToolStudyPrerequisiteMap,
): ToolRouteBlockedUseRegister {
  const activeBlockers = [...prerequisiteMap.activeBlockers]
  const allExecutionBlocked = BLOCKED_USES.every((item) => item.blocked && item.executionAllowed === false)
  if (!allExecutionBlocked) activeBlockers.push('blocked_use_register_all_execution_not_blocked')

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    blockedUses: BLOCKED_USES,
    allExecutionBlocked,
    activeBlockers,
  }
}
