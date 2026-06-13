import {
  TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
  TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
} from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteArtifactContractMap,
  ToolRouteBlockedExecutionValidation,
  ToolRouteFamilyDryRunPlan,
  ToolRouteOwnerRoutePlanMap,
} from './tool-route-dry-run-planning-types'

const BLOCKED_CATEGORIES = [
  'tool_execution',
  'worker_execution',
  'route_execution',
  'provider_or_model_calls',
  'media_processing',
  'browser_capture',
  'map_rendering',
  'web_search_execution',
  'Supabase_mutation',
  'SQL_migrations_schema_RLS',
  'Google_Cloud_API_call',
  'Secret_Manager_API_call',
  'GCS_storage_transfer',
  'public_artifact_creation',
  'signed_URL_creation_or_source_of_truth',
  'raw_prompt_execution',
  'raw_provider_or_search_response_storage',
  'credit_or_Stripe_mutation',
  'production_unlock',
  'internal_beta_unlock',
  'external_beta_unlock',
  'dependency_mutation',
  'final_render_or_export',
  'audio_SFX_music_generation',
  'FFmpeg_FFprobe_execution',
  'DeepFilterNet_execution',
  'Demucs_runtime',
  'Qwen_VLM_vLLM_runtime',
]

function allFalse(value: Record<string, boolean>): boolean {
  return Object.values(value).every((item) => item === false)
}

export function validateToolRouteBlockedExecution(input: {
  routeFamilyPlan: ToolRouteFamilyDryRunPlan
  ownerRoutePlan: ToolRouteOwnerRoutePlanMap
  artifactContractMap: ToolRouteArtifactContractMap
}): ToolRouteBlockedExecutionValidation {
  const activeBlockers = [
    ...input.routeFamilyPlan.activeBlockers,
    ...input.ownerRoutePlan.activeBlockers,
    ...input.artifactContractMap.activeBlockers,
    ...(allFalse(TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS)
      ? []
      : ['unsafe_global_safety_flag_detected']),
    ...input.routeFamilyPlan.families
      .filter((family) => !allFalse(family.executionFlags))
      .map((family) => `unsafe_family_execution_flag:${family.familyId}`),
    ...input.ownerRoutePlan.ownerRoutes
      .filter((route) => route.executionAuthorized || route.runtimeReady)
      .map((route) => `unsafe_owner_route_execution_claim:${route.owner}`),
    ...input.artifactContractMap.artifacts
      .filter((artifact) =>
        !artifact.privateOnly ||
        artifact.publicArtifactAllowed ||
        artifact.signedUrlSourceOfTruthAllowed ||
        artifact.rawPromptAllowed ||
        artifact.runtimeExecutionRequired,
      )
      .map((artifact) => `unsafe_artifact_contract:${artifact.artifactId}`),
  ]

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    blockedCategories: BLOCKED_CATEGORIES,
    safetyFlags: TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
    allExecutionBlocked: true,
    noScopeStatement: TOOL_ROUTE_DRY_RUN_NO_SCOPE_STATEMENT,
    activeBlockers,
  }
}
