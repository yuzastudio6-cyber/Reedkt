import {
  TOOL_ROUTE_FIXTURE_FAMILY_IDS,
  TOOL_ROUTE_FIXTURE_ROUTE_FAMILY_IDS,
  TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
  TOOL_ROUTE_FIXTURE_SOURCE_PATHS,
} from './tool-route-fixture-planning-policy'
import type {
  GeneratedLocalFixture,
  GeneratedLocalFixtureCatalog,
  ToolRoute1EvidenceContext,
  ToolRouteFixtureFamilyId,
  ToolRouteFixtureOwner,
  ToolRouteFixtureRouteFamilyId,
  ToolStudyFixtureEvidenceContext,
} from './tool-route-fixture-planning-types'
import { findOwnerStudyPath } from './tool-study-fixture-evidence-loader'

type FixtureDefinition = {
  fixtureId: ToolRouteFixtureFamilyId
  routeFamilyId: ToolRouteFixtureRouteFamilyId
  ownerWorkstream: ToolRouteFixtureOwner
  workerRefs: string[]
  fixturePurpose: string
  allowedSyntheticInput: string[]
  blockedInput: string[]
  expectedOutputManifest: string
  expectedOutputArtifactContract: string
  sourceOfTruthRule: string
  qaGates: string[]
  internalBetaBlocker: string
  externalBetaBlocker: string
  productionBlocker: string
}

const TOOL_ROUTE_1_ROUTE_PLAN_PATH = TOOL_ROUTE_FIXTURE_SOURCE_PATHS.toolRoute1RouteFamilyPlan

const FIXTURE_DEFINITIONS: FixtureDefinition[] = [
  {
    fixtureId: 'provider_model_planning_fixture',
    routeFamilyId: 'provider_model_planning',
    ownerWorkstream: 'PROVIDER_GATEWAY_MODELS',
    workerRefs: ['implementationProposalReview', 'timelineMetadata'],
    fixturePurpose: 'Synthetic provider-output manifest for planning and schema contract tests only.',
    allowedSyntheticInput: ['sanitized provider-output metadata', 'policy refs', 'schema ids'],
    blockedInput: ['Qwen calls', 'DeepSeek calls', 'provider secrets', 'raw prompts', 'raw provider responses'],
    expectedOutputManifest: 'synthetic_provider_output_fixture_manifest',
    expectedOutputArtifactContract: 'provider planning fixture contract',
    sourceOfTruthRule: 'Only committed synthetic provider-output manifests can be source-of-truth here.',
    qaGates: ['schema_contract_present', 'provider_call_blocked', 'redaction_contract_present'],
    internalBetaBlocker: 'provider runtime remains blocked until a future provider execution approval.',
    externalBetaBlocker: 'external beta remains blocked until provider routes are approved and audited.',
    productionBlocker: 'production remains blocked until provider execution, cost, and secret gates pass.',
  },
  {
    fixtureId: 'worker_runtime_job_planning_fixture',
    routeFamilyId: 'worker_runtime_job_planning',
    ownerWorkstream: 'WORKER_RUNTIME_JOBS',
    workerRefs: ['snapshotIntake', 'selectedIntentReviews', 'implementationProposalReview', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic dry-run job plan for future worker fixture contract tests.',
    allowedSyntheticInput: ['dry-run batch id', 'candidate plan id', 'blocked-route refs'],
    blockedInput: ['claim/lease database writes', 'real worker events', 'service-role mutation'],
    expectedOutputManifest: 'synthetic_worker_job_fixture_manifest',
    expectedOutputArtifactContract: 'worker runtime job fixture contract',
    sourceOfTruthRule: 'Committed dry-run fixture manifests are source-of-truth; runtime rows are not touched.',
    qaGates: ['worker1_batch_present', 'claim_attempt_false', 'lease_write_blocked'],
    internalBetaBlocker: 'worker runtime must gain transactional claim/lease approval in a future phase.',
    externalBetaBlocker: 'external beta remains blocked until worker runtime execution gates pass.',
    productionBlocker: 'production remains blocked until backend worker execution and audit controls exist.',
  },
  {
    fixtureId: 'web_search_capture_fixture',
    routeFamilyId: 'web_search_capture',
    ownerWorkstream: 'WEB_SEARCH_CAPTURE',
    workerRefs: ['mapCard', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic query, source, capture, and extraction manifests for web evidence planning.',
    allowedSyntheticInput: ['synthetic query manifest', 'source manifest', 'capture manifest', 'extraction manifest'],
    blockedInput: ['SearXNG calls', 'Brave calls', 'Playwright capture', 'Readability extraction', 'browser execution'],
    expectedOutputManifest: 'synthetic_web_search_capture_fixture_manifest',
    expectedOutputArtifactContract: 'web source/capture/extraction fixture contract',
    sourceOfTruthRule: 'Sanitized synthetic manifests and QA reports are source-of-truth; raw snippets are not.',
    qaGates: ['owner_study_exists', 'capture_manifest_contract_present', 'browser_capture_blocked'],
    internalBetaBlocker: 'private search/capture service approval remains future work.',
    externalBetaBlocker: 'external beta remains blocked until privacy and source capture policy are approved.',
    productionBlocker: 'production remains blocked until capture runtime, retention, and compliance gates pass.',
  },
  {
    fixtureId: 'map_geospatial_fixture',
    routeFamilyId: 'map_geospatial',
    ownerWorkstream: 'MAP_GEOSPATIAL',
    workerRefs: ['mapCard'],
    fixturePurpose: 'Synthetic GeoJSON, style, camera, timing, and render manifests for map planning.',
    allowedSyntheticInput: ['synthetic GeoJSON', 'style manifest', 'camera manifest', 'timing manifest', 'render manifest'],
    blockedInput: ['map rendering', 'live tiles', 'geocoding', 'routing', 'Cesium ion', 'live terrain'],
    expectedOutputManifest: 'synthetic_map_geospatial_fixture_manifest',
    expectedOutputArtifactContract: 'map GeoJSON/style/camera/timing/render fixture contract',
    sourceOfTruthRule: 'Structured synthetic map manifests are source-of-truth; map screenshots are not.',
    qaGates: ['owner_study_exists', 'geojson_contract_present', 'live_map_execution_blocked'],
    internalBetaBlocker: 'map render and tile/geocoder providers need future approval.',
    externalBetaBlocker: 'external beta remains blocked until map source, license, and QA gates pass.',
    productionBlocker: 'production remains blocked until map rendering and storage delivery policies pass.',
  },
  {
    fixtureId: 'ai_tools_creative_graphics_fixture',
    routeFamilyId: 'ai_tools_creative_graphics',
    ownerWorkstream: 'AI_TOOLS_CREATIVE_GRAPHICS',
    workerRefs: ['chartCard'],
    fixturePurpose: 'Synthetic visual asset manifest for creative graphics planning.',
    allowedSyntheticInput: ['synthetic visual spec', 'source data refs', 'layout refs', 'QA requirements'],
    blockedInput: ['Remotion execution', 'D3 execution', 'Three.js execution', 'PixiJS execution', 'Satori/resvg rendering'],
    expectedOutputManifest: 'synthetic_ai_tools_creative_graphics_fixture_manifest',
    expectedOutputArtifactContract: 'AI Tools visual asset fixture contract',
    sourceOfTruthRule: 'Structured visual specs, source refs, checksums, and QA records are source-of-truth.',
    qaGates: ['owner_study_exists', 'visual_manifest_contract_present', 'graphics_execution_blocked'],
    internalBetaBlocker: 'graphics runtime and Track A handoff approvals remain future work.',
    externalBetaBlocker: 'external beta remains blocked until visual tool runtime and QA pass.',
    productionBlocker: 'production remains blocked until rendering/tool execution and artifact policies pass.',
  },
  {
    fixtureId: 'track_a_render_export_fixture',
    routeFamilyId: 'track_a_render_export',
    ownerWorkstream: 'TRACK_A_RENDER_EXPORT',
    workerRefs: ['chartCard', 'captionRecommendation', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic render/export manifest for final composition planning without rendering.',
    allowedSyntheticInput: ['composition refs', 'layer refs', 'timing refs', 'overlay refs', 'export settings'],
    blockedInput: ['preview render', 'final render', 'FFmpeg execution', 'Remotion execution', 'public delivery'],
    expectedOutputManifest: 'synthetic_track_a_render_export_fixture_manifest',
    expectedOutputArtifactContract: 'Track A render/export fixture contract',
    sourceOfTruthRule: 'Private render/export manifests and QA records are source-of-truth; temporary renders are not.',
    qaGates: ['owner_study_exists', 'render_manifest_contract_present', 'final_render_export_blocked'],
    internalBetaBlocker: 'Track A render/export worker approval remains future work.',
    externalBetaBlocker: 'external beta remains blocked until final artifact QA and delivery policies pass.',
    productionBlocker: 'production remains blocked until render/export runtime and billing gates pass.',
  },
  {
    fixtureId: 'track_b_media_processing_fixture',
    routeFamilyId: 'track_b_media_processing',
    ownerWorkstream: 'TRACK_B_MEDIA_PROCESSING',
    workerRefs: ['timelineMetadata', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic media analysis manifest for Track B planning without media execution.',
    allowedSyntheticInput: ['media metadata placeholder', 'timecodes', 'OCR planning fields', 'scene/audio QA fields'],
    blockedInput: ['OCR', 'OpenCV', 'PyAV', 'PySceneDetect', 'Sharp', 'DuckDB', 'Polars', 'DeepFilterNet', 'Signalsmith', 'Demucs', 'Qwen-VL', 'vLLM'],
    expectedOutputManifest: 'synthetic_track_b_media_processing_fixture_manifest',
    expectedOutputArtifactContract: 'Track B media analysis fixture contract',
    sourceOfTruthRule: 'Private media manifests, timecodes, provenance, checksums, and QA fields are source-of-truth.',
    qaGates: ['owner_study_exists', 'media_analysis_contract_present', 'media_processing_blocked'],
    internalBetaBlocker: 'Track B media runtime and license/security review remain future work.',
    externalBetaBlocker: 'external beta remains blocked until media processing and privacy gates pass.',
    productionBlocker: 'production remains blocked until media workers and storage policies pass.',
  },
  {
    fixtureId: 'sound_music_audio_fixture',
    routeFamilyId: 'sound_music_audio',
    ownerWorkstream: 'SOUND_MUSIC_AUDIO',
    workerRefs: ['timelineMetadata', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic cue manifest for sound, SFX, music, and audio planning without generation.',
    allowedSyntheticInput: ['cue timing refs', 'scene mood refs', 'category/intensity refs', 'platform-safe style refs'],
    blockedInput: ['audio generation', 'SFX generation', 'music generation', 'audio processing', 'DeepFilterNet', 'Demucs'],
    expectedOutputManifest: 'synthetic_sound_music_audio_fixture_manifest',
    expectedOutputArtifactContract: 'Sound/Music/Audio cue fixture contract',
    sourceOfTruthRule: 'Cue manifests, timing refs, provenance, and QA fields are source-of-truth.',
    qaGates: ['owner_study_exists', 'cue_manifest_contract_present', 'audio_generation_blocked'],
    internalBetaBlocker: 'audio provider and worker approvals remain future work.',
    externalBetaBlocker: 'external beta remains blocked until audio generation/processing policies pass.',
    productionBlocker: 'production remains blocked until audio runtime, billing, and QA gates pass.',
  },
  {
    fixtureId: 'supabase_metadata_storage_fixture',
    routeFamilyId: 'supabase_metadata_storage',
    ownerWorkstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    workerRefs: ['artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic metadata/storage placeholder without Supabase writes or storage transfer.',
    allowedSyntheticInput: ['metadata field placeholders', 'private artifact ref placeholders', 'future table refs'],
    blockedInput: ['Supabase mutation', 'SQL', 'migrations', 'schema/RLS changes', 'service-role payloads', 'GCS upload'],
    expectedOutputManifest: 'synthetic_supabase_metadata_storage_fixture_manifest',
    expectedOutputArtifactContract: 'Supabase metadata/storage fixture contract',
    sourceOfTruthRule: 'Local docs/status evidence only; no Supabase row or storage object is source-of-truth here.',
    qaGates: ['supabase_mutation_blocked', 'sql_migration_blocked', 'sync_layer_absence_recorded'],
    internalBetaBlocker: 'Supabase sync layer and service-role runtime approval remain future work.',
    externalBetaBlocker: 'external beta remains blocked until RLS/storage and private artifact policy pass.',
    productionBlocker: 'production remains blocked until database/storage writes are explicitly approved.',
  },
  {
    fixtureId: 'observability_audit_cost_fixture',
    routeFamilyId: 'observability_audit_cost',
    ownerWorkstream: 'OBSERVABILITY_AUDIT_COST',
    workerRefs: ['snapshotIntake', 'captionRecommendation', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic cost and audit placeholder for route fixture planning.',
    allowedSyntheticInput: ['event names', 'run ids', 'cost placeholders', 'QA gate statuses'],
    blockedInput: ['telemetry sink mutation', 'paid production calls', 'credit mutation', 'provider usage expansion'],
    expectedOutputManifest: 'synthetic_observability_audit_cost_fixture_manifest',
    expectedOutputArtifactContract: 'observability/audit/cost fixture contract',
    sourceOfTruthRule: 'Committed audit and cost placeholders are planning evidence only.',
    qaGates: ['cost_placeholder_contract_present', 'credit_mutation_blocked', 'paid_production_blocked'],
    internalBetaBlocker: 'observability sink and audit policy approval remain future work.',
    externalBetaBlocker: 'external beta remains blocked until cost/audit reporting is approved.',
    productionBlocker: 'production remains blocked until billing ledger and observability controls pass.',
  },
  {
    fixtureId: 'compliance_security_fixture',
    routeFamilyId: 'compliance_security',
    ownerWorkstream: 'COMPLIANCE_SECURITY',
    workerRefs: ['snapshotIntake', 'implementationProposalReview', 'artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic compliance/security checklist placeholder for fixture review.',
    allowedSyntheticInput: ['blocked-use registers', 'privacy review placeholders', 'redaction summaries'],
    blockedInput: ['secret payloads', 'signed URL source-of-truth', 'public artifacts', 'raw prompts'],
    expectedOutputManifest: 'synthetic_compliance_security_fixture_manifest',
    expectedOutputArtifactContract: 'compliance/security fixture contract',
    sourceOfTruthRule: 'Compliance placeholders and blocked-use registers are review evidence only.',
    qaGates: ['blocked_use_register_present', 'secret_scan_required', 'public_artifact_blocked'],
    internalBetaBlocker: 'privacy/security approval remains future work.',
    externalBetaBlocker: 'external beta remains blocked until compliance and retention policies pass.',
    productionBlocker: 'production remains blocked until security review and incident controls pass.',
  },
  {
    fixtureId: 'frontend_product_ux_fixture',
    routeFamilyId: 'frontend_product_ux',
    ownerWorkstream: 'FRONTEND_PRODUCT_UX',
    workerRefs: ['captionRecommendation', 'chartCard', 'mapCard'],
    fixturePurpose: 'Synthetic UX route placeholder without frontend runtime changes.',
    allowedSyntheticInput: ['candidate route labels', 'review-only manifests', 'owner approval states'],
    blockedInput: ['runtime-ready UI claims', 'production unlock claims', 'public delivery claims'],
    expectedOutputManifest: 'synthetic_frontend_product_ux_fixture_manifest',
    expectedOutputArtifactContract: 'frontend product UX fixture contract',
    sourceOfTruthRule: 'UX route placeholders explain planning status only; they do not become runtime state.',
    qaGates: ['candidate_only_label_present', 'runtime_claim_blocked', 'owner_review_required'],
    internalBetaBlocker: 'Frontend/product review remains future work.',
    externalBetaBlocker: 'external beta remains blocked until approved runtime state and QA copy exist.',
    productionBlocker: 'production remains blocked until product UX and accessibility review pass.',
  },
  {
    fixtureId: 'billing_stripe_credits_fixture',
    routeFamilyId: 'billing_stripe_credits',
    ownerWorkstream: 'BILLING_STRIPE_CREDITS',
    workerRefs: ['artifactRouteEventValidation'],
    fixturePurpose: 'Synthetic credit/cost placeholder without Stripe or credit ledger mutation.',
    allowedSyntheticInput: ['credit estimate placeholder', 'cost category refs', 'approval gate refs'],
    blockedInput: ['Stripe checkout', 'webhooks', 'credit ledger writes', 'paid production unlock'],
    expectedOutputManifest: 'synthetic_billing_stripe_credits_fixture_manifest',
    expectedOutputArtifactContract: 'billing/Stripe/credits fixture contract',
    sourceOfTruthRule: 'Billing placeholders are planning evidence only; no ledger or Stripe event is source here.',
    qaGates: ['credit_mutation_blocked', 'approval_gate_preserved', 'stripe_processing_blocked'],
    internalBetaBlocker: 'billing ledger and Stripe approval remain future work.',
    externalBetaBlocker: 'external beta remains blocked until checkout/webhook policy passes.',
    productionBlocker: 'production remains blocked until billing, refund, and audit controls pass.',
  },
  {
    fixtureId: 'public_artifact_signed_url_delivery_blocked_fixture',
    routeFamilyId: 'public_artifact_signed_url_delivery_blocked',
    ownerWorkstream: 'COMPLIANCE_SECURITY',
    workerRefs: ['artifactRouteEventValidation'],
    fixturePurpose: 'Blocked fixture proving public artifact and signed URL delivery are not fixture outputs.',
    allowedSyntheticInput: ['private manifest refs', 'blocked delivery policy records', 'source-of-truth denial records'],
    blockedInput: ['public artifacts', 'signed URL creation', 'signed URLs as source-of-truth', 'public delivery'],
    expectedOutputManifest: 'synthetic_public_artifact_signed_url_blocked_fixture_manifest',
    expectedOutputArtifactContract: 'public artifact/signed URL delivery blocked fixture contract',
    sourceOfTruthRule: 'Private manifests are source-of-truth; public artifacts and signed URLs are never source here.',
    qaGates: ['public_artifact_blocked', 'signed_url_blocked', 'private_manifest_required'],
    internalBetaBlocker: 'delivery policy and retention review remain future work.',
    externalBetaBlocker: 'external beta remains blocked until public access review passes.',
    productionBlocker: 'production remains blocked until delivery and signed URL policy are approved.',
  },
]

function sourceStudyContract(owner: ToolRouteFixtureOwner): string {
  return findOwnerStudyPath(owner)
}

function buildFixture(definition: FixtureDefinition): GeneratedLocalFixture {
  return {
    fixtureId: definition.fixtureId,
    routeFamilyId: definition.routeFamilyId,
    ownerWorkstream: definition.ownerWorkstream,
    sourceToolStudyContract: sourceStudyContract(definition.ownerWorkstream),
    sourceToolRoute1RoutePlan: TOOL_ROUTE_1_ROUTE_PLAN_PATH,
    sourceWorker1JobReference: definition.workerRefs,
    fixturePurpose: definition.fixturePurpose,
    syntheticInputOnly: true,
    allowedSyntheticInput: definition.allowedSyntheticInput,
    blockedInput: definition.blockedInput,
    expectedOutputManifest: definition.expectedOutputManifest,
    expectedOutputArtifactContract: definition.expectedOutputArtifactContract,
    sourceOfTruthRule: definition.sourceOfTruthRule,
    privateArtifactRule: 'Private/local sanitized JSON manifests only; no public artifact or signed URL is produced.',
    checksumProvenanceRequirement:
      'Every future fixture output must carry a checksum placeholder, provenance refs, owner, run id, and source contract refs before TOOL-ROUTE-3 tests.',
    qaGates: definition.qaGates,
    requiredOwnerApproval: 'owner_review_required_before_tool_route_3',
    nextPhase: 'TOOL_ROUTE_3_generated_local_fixture_contract_tests',
    internalBetaBlocker: definition.internalBetaBlocker,
    externalBetaBlocker: definition.externalBetaBlocker,
    productionBlocker: definition.productionBlocker,
    executionFlags: TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
  }
}

export function buildGeneratedLocalFixtureCatalog(input: {
  toolRoute1Evidence: ToolRoute1EvidenceContext
  toolStudyEvidence: ToolStudyFixtureEvidenceContext
}): GeneratedLocalFixtureCatalog {
  const fixtures = FIXTURE_DEFINITIONS.map(buildFixture)
  const activeBlockers = [
    ...input.toolRoute1Evidence.activeBlockers,
    ...input.toolStudyEvidence.activeBlockers,
    ...TOOL_ROUTE_FIXTURE_FAMILY_IDS
      .filter((fixtureId) => !fixtures.some((fixture) => fixture.fixtureId === fixtureId))
      .map((fixtureId) => `missing_fixture_family:${fixtureId}`),
    ...TOOL_ROUTE_FIXTURE_ROUTE_FAMILY_IDS
      .filter((familyId) => !fixtures.some((fixture) => fixture.routeFamilyId === familyId))
      .map((familyId) => `missing_route_family_fixture:${familyId}`),
    ...(fixtures.every((fixture) => fixture.syntheticInputOnly) ? [] : ['non_synthetic_fixture_detected']),
    ...(fixtures.every((fixture) => Object.values(fixture.executionFlags).every((value) => value === false))
      ? []
      : ['unsafe_fixture_execution_flag_detected']),
  ]

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    fixtures,
    fixtureCount: fixtures.length,
    allFixturesMapped: activeBlockers.length === 0,
    allInputsSyntheticOnly: fixtures.every((fixture) => fixture.syntheticInputOnly),
    activeBlockers,
  }
}
