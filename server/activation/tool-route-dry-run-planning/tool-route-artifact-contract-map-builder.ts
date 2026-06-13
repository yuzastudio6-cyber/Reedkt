import type {
  ToolRouteArtifactContract,
  ToolRouteArtifactContractMap,
  ToolRouteDryRunFamilyId,
  ToolRouteDryRunOwner,
  ToolRouteFamilyDryRunPlan,
} from './tool-route-dry-run-planning-types'

const BASE_REQUIRED_FIELDS = [
  'artifactId',
  'owner',
  'sourcePlanId',
  'runId',
  'manifestVersion',
  'checksumOrPlaceholder',
  'provenance',
  'qaStatus',
  'privateRefOnly',
]

function contract(
  artifactId: string,
  familyId: ToolRouteDryRunFamilyId,
  owner: ToolRouteDryRunOwner,
  contractName: string,
  allowedSourceOfTruth: string[],
  blockedSourceOfTruth: string[],
  requiredFields: string[] = [],
): ToolRouteArtifactContract {
  return {
    artifactId,
    familyId,
    owner,
    contractName,
    allowedSourceOfTruth,
    blockedSourceOfTruth,
    requiredFields: [...BASE_REQUIRED_FIELDS, ...requiredFields],
    privateOnly: true,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    rawPromptAllowed: false,
    runtimeExecutionRequired: false,
  }
}

export function buildToolRouteArtifactContractMap(
  familyPlan: ToolRouteFamilyDryRunPlan,
): ToolRouteArtifactContractMap {
  const artifacts: ToolRouteArtifactContract[] = [
    contract(
      'provider_planning_manifest',
      'provider_model_planning',
      'PROVIDER_GATEWAY_MODELS',
      'provider planning manifest',
      ['sanitized provider planning metadata', 'provider policy refs', 'schema validation refs'],
      ['raw provider response', 'raw prompt', 'provider secret payload'],
      ['providerPolicyRef', 'schemaId', 'redactionStatus'],
    ),
    contract(
      'approved_plan_snapshot_candidate',
      'worker_runtime_job_planning',
      'WORKER_RUNTIME_JOBS',
      'approved plan snapshot',
      ['candidate-approved-plan snapshot JSON', 'selected intents', 'implementation proposal refs'],
      ['runtime-approved snapshot claim', 'raw chat prompt', 'mutable worker instruction'],
      ['candidatePlanId', 'executionStatus', 'approvedForRuntime'],
    ),
    contract(
      'worker_dry_run_job_plan',
      'worker_runtime_job_planning',
      'WORKER_RUNTIME_JOBS',
      'worker dry-run job plan',
      ['dry-run job plan', 'dependency plan', 'blocked-route validation'],
      ['real claim result', 'lease mutation', 'worker event persistence'],
      ['batchId', 'jobIds', 'dependencyIds', 'dryRunOnly'],
    ),
    contract(
      'web_source_capture_extraction_manifest',
      'web_search_capture',
      'WEB_SEARCH_CAPTURE',
      'web source/capture/extraction manifest',
      ['sanitized source manifest', 'capture manifest', 'extraction manifest', 'QA report'],
      ['raw Brave response', 'raw snippets', 'login content', 'signed URL'],
      ['sourceRefs', 'captureScope', 'extractionSummary', 'privacyReview'],
    ),
    contract(
      'map_geojson_style_camera_timing_render_manifest',
      'map_geospatial',
      'MAP_GEOSPATIAL',
      'map GeoJSON/style/camera/timing/render manifest',
      ['GeoJSON manifest', 'style manifest', 'camera manifest', 'timing manifest', 'render manifest'],
      ['live tile response', 'live geocode response', 'map screenshot without manifest'],
      ['geojsonRef', 'styleRef', 'cameraRef', 'timingRef', 'renderSettingsRef'],
    ),
    contract(
      'ai_tools_visual_asset_manifest',
      'ai_tools_creative_graphics',
      'AI_TOOLS_CREATIVE_GRAPHICS',
      'AI Tools visual asset manifest',
      ['visual spec record', 'source data refs', 'checksums', 'QA report'],
      ['rendered bitmap as source-of-truth', 'tool output without manifest', 'public URL'],
      ['visualSpecId', 'toolFamily', 'sourceDataRefs', 'qaRequirements'],
    ),
    contract(
      'track_a_render_export_manifest',
      'track_a_render_export',
      'TRACK_A_RENDER_EXPORT',
      'Track A render/export manifest',
      ['render settings', 'export settings', 'layer refs', 'timing refs', 'QA records'],
      ['temporary render', 'final export', 'signed URL delivery'],
      ['compositionRefs', 'layerRefs', 'exportSettings', 'finalQaRefs'],
    ),
    contract(
      'track_b_media_analysis_manifest',
      'track_b_media_processing',
      'TRACK_B_MEDIA_PROCESSING',
      'Track B media analysis manifest',
      ['media metadata', 'timecodes', 'OCR planning fields', 'scene/audio QA fields'],
      ['raw media', 'processed derivative without manifest', 'VLM runtime payload'],
      ['mediaRef', 'timecodeRefs', 'analysisType', 'ownerHandoffRefs'],
    ),
    contract(
      'sound_music_audio_cue_manifest',
      'sound_music_audio',
      'SOUND_MUSIC_AUDIO',
      'Sound/Music/Audio cue manifest',
      ['cue timing', 'scene/mood/category/intensity fields', 'platform-safe style plan'],
      ['generated SFX', 'generated music', 'processed audio', 'provider audio response'],
      ['cueId', 'timingRef', 'mood', 'category', 'intensity', 'trackAHandoff'],
    ),
    contract(
      'supabase_metadata_placeholder',
      'supabase_metadata_storage',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'Supabase metadata placeholder',
      ['local docs/status placeholders', 'future table names', 'private artifact ref placeholders'],
      ['SQL result', 'service-role payload', 'row mutation', 'storage transfer'],
      ['futureTableRef', 'rlsReviewStatus', 'syncLayerStatus'],
    ),
    contract(
      'observability_cost_event_placeholder',
      'observability_audit_cost',
      'OBSERVABILITY_AUDIT_COST',
      'observability/cost event placeholder',
      ['event name', 'run id', 'cost category placeholder', 'QA gate status'],
      ['telemetry sink write', 'paid usage event', 'credit mutation'],
      ['eventType', 'auditCategory', 'costPlaceholder', 'redactionStatus'],
    ),
    contract(
      'compliance_review_placeholder',
      'compliance_security',
      'COMPLIANCE_SECURITY',
      'compliance review placeholder',
      ['blocked-use register', 'privacy review placeholder', 'redaction summary'],
      ['secret payload', 'signed URL source-of-truth', 'public artifact'],
      ['privacyGate', 'sourceOfTruthGate', 'secretScanStatus'],
    ),
    contract(
      'frontend_ux_route_placeholder',
      'frontend_product_ux',
      'FRONTEND_PRODUCT_UX',
      'frontend UX route placeholder',
      ['route label', 'review-only status', 'owner approval status', 'copy requirements'],
      ['runtime-ready UI claim', 'production-ready claim', 'public delivery claim'],
      ['routeLabel', 'displayStatus', 'ownerReviewRequired', 'runtimeReady'],
    ),
    contract(
      'billing_credit_placeholder',
      'billing_stripe_credits',
      'BILLING_STRIPE_CREDITS',
      'billing/credit placeholder',
      ['credit estimate placeholder', 'cost category', 'approval gate ref'],
      ['Stripe checkout event', 'webhook payload', 'ledger mutation', 'paid production call'],
      ['costCategory', 'approvalGateRef', 'creditMutationAllowed'],
    ),
    contract(
      'public_artifact_signed_url_delivery_blocked_placeholder',
      'public_artifact_signed_url_delivery_blocked',
      'COMPLIANCE_SECURITY',
      'public artifact/signed URL delivery blocked placeholder',
      ['private manifest refs', 'blocked delivery policy records', 'source-of-truth denial records'],
      ['public artifact', 'signed URL', 'signed URL source-of-truth', 'public delivery path'],
      ['blockedDeliveryReason', 'privateManifestRef', 'sourceOfTruthDenial'],
    ),
  ]

  const activeBlockers = [
    ...familyPlan.activeBlockers,
    ...familyPlan.families
      .filter((family) => !artifacts.some((artifact) => artifact.familyId === family.familyId))
      .map((family) => `missing_artifact_contract_for_family:${family.familyId}`),
    ...(artifacts.every((artifact) =>
      artifact.privateOnly &&
      !artifact.publicArtifactAllowed &&
      !artifact.signedUrlSourceOfTruthAllowed &&
      !artifact.rawPromptAllowed &&
      !artifact.runtimeExecutionRequired,
    )
      ? []
      : ['unsafe_artifact_contract_flag_detected']),
  ]

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    artifacts,
    artifactContractCount: artifacts.length,
    allContractsPrivatePlanningOnly: activeBlockers.length === 0,
    activeBlockers,
  }
}
