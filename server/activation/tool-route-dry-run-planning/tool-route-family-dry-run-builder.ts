import {
  TOOL_ROUTE_DRY_RUN_FAMILY_IDS,
  TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
} from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteDryRunFamily,
  ToolRouteDryRunFamilyId,
  ToolRouteDryRunOwner,
  ToolRouteFamilyDryRunPlan,
  ToolRouteOwnerStudyContext,
  ToolRouteWorkerDryRunContext,
} from './tool-route-dry-run-planning-types'

type FamilyDefinition = {
  familyId: ToolRouteDryRunFamilyId
  owner: ToolRouteDryRunOwner
  sourceContracts: string[]
  workerRefKeys: string[]
  routePurpose: string
  allowedInput: string[]
  blockedInput: string[]
  outputArtifactContract: string
  sourceOfTruthRule: string
  qaGates: string[]
  betaProductionBlockers: string[]
}

const OWNER_STUDY_PATHS: Partial<Record<ToolRouteDryRunOwner, string[]>> = {
  WEB_SEARCH_CAPTURE: [
    'docs/tool-studies/web-search-capture-capability-map.md',
    'docs/tool-studies/web-search-capture-routing-policy.md',
    'docs/tool-studies/web-search-capture-handoff-contract.md',
    'docs/tool-studies/web-search-capture-blocked-use-register.md',
  ],
  MAP_GEOSPATIAL: [
    'docs/tool-studies/map-geospatial-capability-map.md',
    'docs/tool-studies/map-geospatial-routing-policy.md',
    'docs/tool-studies/map-geospatial-handoff-contract.md',
    'docs/tool-studies/map-geospatial-blocked-use-register.md',
  ],
  AI_TOOLS_CREATIVE_GRAPHICS: [
    'docs/tool-studies/ai-tools-creative-graphics-capability-map.md',
    'docs/tool-studies/ai-tools-creative-graphics-routing-policy.md',
    'docs/tool-studies/ai-tools-creative-graphics-handoff-contract.md',
    'docs/tool-studies/ai-tools-creative-graphics-blocked-use-register.md',
  ],
  TRACK_A_RENDER_EXPORT: [
    'docs/tool-studies/track-a-render-export-capability-map.md',
    'docs/tool-studies/track-a-render-export-routing-policy.md',
    'docs/tool-studies/track-a-render-export-handoff-contract.md',
    'docs/tool-studies/track-a-render-export-blocked-use-register.md',
  ],
  TRACK_B_MEDIA_PROCESSING: [
    'docs/tool-studies/track-b-media-processing-capability-map.md',
    'docs/tool-studies/track-b-media-processing-routing-policy.md',
    'docs/tool-studies/track-b-media-processing-handoff-contract.md',
    'docs/tool-studies/track-b-media-processing-blocked-use-register.md',
  ],
  SOUND_MUSIC_AUDIO: [
    'docs/tool-studies/sound-music-audio-capability-map.md',
    'docs/tool-studies/sound-music-audio-routing-policy.md',
    'docs/tool-studies/sound-music-audio-handoff-contract.md',
    'docs/tool-studies/sound-music-audio-blocked-use-register.md',
  ],
}

const FAMILY_DEFINITIONS: FamilyDefinition[] = [
  {
    familyId: 'provider_model_planning',
    owner: 'PROVIDER_GATEWAY_MODELS',
    sourceContracts: [
      'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_readiness_report.json',
      'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json',
    ],
    workerRefKeys: ['timelineMetadata', 'implementationProposalReview'],
    routePurpose: 'Review provider-derived planning metadata and DeepSeek proposal refs without provider calls.',
    allowedInput: ['sanitized plan intent labels', 'agent findings refs', 'provider policy records'],
    blockedInput: ['provider API keys', 'raw prompts', 'raw provider responses', 'provider chaining requests'],
    outputArtifactContract: 'provider planning manifest',
    sourceOfTruthRule: 'Only sanitized provider planning manifests and approved policy records can be source-of-truth.',
    qaGates: ['schema_validation', 'redaction_validation', 'provider_execution_block'],
    betaProductionBlockers: ['provider runtime approval', 'cost cap approval', 'secret handling approval'],
  },
  {
    familyId: 'worker_runtime_job_planning',
    owner: 'WORKER_RUNTIME_JOBS',
    sourceContracts: [
      'docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json',
      'docs/activation-worker-approved-plan-dry-run-reports/validation/blocked-route-validation.json',
    ],
    workerRefKeys: ['snapshotIntake', 'selectedIntentReviews', 'implementationProposalReview', 'artifactRouteEventValidation'],
    routePurpose: 'Plan future route job envelopes from the WORKER-1 dry-run batch without claiming a lease.',
    allowedInput: ['candidate snapshot id', 'dry-run batch id', 'blocked-route validation refs'],
    blockedInput: ['service-role mutation', 'worker claim attempts', 'runtime job execution'],
    outputArtifactContract: 'worker dry-run job plan',
    sourceOfTruthRule: 'Committed dry-run job and dependency plans are review evidence only.',
    qaGates: ['worker1_batch_loaded', 'claim_attempt_blocked', 'all_worker_execution_flags_false'],
    betaProductionBlockers: ['transactional backend runtime', 'service-role worker approval', 'lease enforcement'],
  },
  {
    familyId: 'web_search_capture',
    owner: 'WEB_SEARCH_CAPTURE',
    sourceContracts: OWNER_STUDY_PATHS.WEB_SEARCH_CAPTURE ?? [],
    workerRefKeys: ['mapCard', 'artifactRouteEventValidation'],
    routePurpose: 'Plan when future search/capture manifests can support route evidence.',
    allowedInput: ['sanitized source manifests', 'capture manifests', 'extraction manifests', 'QA reports'],
    blockedInput: ['raw Brave responses', 'arbitrary URL capture', 'login or CAPTCHA bypass', 'public artifacts'],
    outputArtifactContract: 'web source/capture/extraction manifest',
    sourceOfTruthRule: 'Only sanitized source, capture, extraction, and QA manifests are source-of-truth.',
    qaGates: ['owner_study_exists', 'capture_scope_review', 'signed_url_block'],
    betaProductionBlockers: ['private SearXNG deployment approval', 'capture target allowlist', 'privacy review'],
  },
  {
    familyId: 'map_geospatial',
    owner: 'MAP_GEOSPATIAL',
    sourceContracts: OWNER_STUDY_PATHS.MAP_GEOSPATIAL ?? [],
    workerRefKeys: ['mapCard'],
    routePurpose: 'Plan map/geospatial route contracts from GeoJSON, style, camera, timing, and render manifests.',
    allowedInput: ['GeoJSON manifests', 'style manifests', 'camera manifests', 'timing manifests'],
    blockedInput: ['live tiles', 'live geocoding', 'live routing', 'Cesium ion', 'public OSM hotlinking'],
    outputArtifactContract: 'map GeoJSON/style/camera/timing/render manifest',
    sourceOfTruthRule: 'Structured private map manifests are source-of-truth; screenshots and signed URLs are not.',
    qaGates: ['owner_study_exists', 'location_confidence_review', 'live_map_execution_block'],
    betaProductionBlockers: ['tile/geocoder provider review', 'license review', 'map render worker approval'],
  },
  {
    familyId: 'ai_tools_creative_graphics',
    owner: 'AI_TOOLS_CREATIVE_GRAPHICS',
    sourceContracts: OWNER_STUDY_PATHS.AI_TOOLS_CREATIVE_GRAPHICS ?? [],
    workerRefKeys: ['chartCard'],
    routePurpose: 'Plan chart/card/graphics capability routing as manifests, not generated graphics.',
    allowedInput: ['visual asset specs', 'chart/card data refs', 'checksums', 'private QA records'],
    blockedInput: ['final renders', 'rasterized outputs as source-of-truth', 'tool execution requests'],
    outputArtifactContract: 'AI Tools visual asset manifest',
    sourceOfTruthRule: 'Private structured visual manifests, specs, checksums, and QA reports are source-of-truth.',
    qaGates: ['owner_study_exists', 'manifest_schema_review', 'graphics_execution_block'],
    betaProductionBlockers: ['tool runtime approval', 'asset QA worker approval', 'Track A handoff approval'],
  },
  {
    familyId: 'track_a_render_export',
    owner: 'TRACK_A_RENDER_EXPORT',
    sourceContracts: OWNER_STUDY_PATHS.TRACK_A_RENDER_EXPORT ?? [],
    workerRefKeys: ['chartCard', 'captionRecommendation', 'artifactRouteEventValidation'],
    routePurpose: 'Plan Track A render/export manifests and final composition handoff without rendering.',
    allowedInput: ['approved manifests', 'overlay refs', 'timing refs', 'private QA records'],
    blockedInput: ['temporary renders as source-of-truth', 'signed URL delivery', 'final export execution'],
    outputArtifactContract: 'Track A render/export manifest',
    sourceOfTruthRule: 'Render/export settings, provenance, checksums, timing, and QA records are source-of-truth.',
    qaGates: ['owner_study_exists', 'worker_runtime_block', 'final_render_export_block'],
    betaProductionBlockers: ['approved worker runtime', 'render QA', 'delivery policy approval'],
  },
  {
    familyId: 'track_b_media_processing',
    owner: 'TRACK_B_MEDIA_PROCESSING',
    sourceContracts: OWNER_STUDY_PATHS.TRACK_B_MEDIA_PROCESSING ?? [],
    workerRefKeys: ['timelineMetadata', 'artifactRouteEventValidation'],
    routePurpose: 'Plan media-analysis and derivative manifests without FFmpeg, OCR, VLM, or media execution.',
    allowedInput: ['media metadata manifests', 'timecode refs', 'OCR planning fields', 'scene/audio QA fields'],
    blockedInput: ['raw media processing', 'FFmpeg execution', 'OCR execution', 'Demucs runtime', 'VLM runtime'],
    outputArtifactContract: 'Track B media analysis manifest',
    sourceOfTruthRule: 'Private structured media manifests, timecodes, checksums, and QA records are source-of-truth.',
    qaGates: ['owner_study_exists', 'media_processing_block', 'raw_media_source_block'],
    betaProductionBlockers: ['media worker approval', 'license/security review', 'GPU/runtime review'],
  },
  {
    familyId: 'sound_music_audio',
    owner: 'SOUND_MUSIC_AUDIO',
    sourceContracts: OWNER_STUDY_PATHS.SOUND_MUSIC_AUDIO ?? [],
    workerRefKeys: ['timelineMetadata', 'artifactRouteEventValidation'],
    routePurpose: 'Plan sound, music, and audio cue manifests without generating or processing audio.',
    allowedInput: ['timing-aware cue manifests', 'scene mood refs', 'platform-safe audio style planning'],
    blockedInput: ['audio generation', 'SFX generation', 'music generation', 'DeepFilterNet', 'Demucs'],
    outputArtifactContract: 'Sound/Music/Audio cue manifest',
    sourceOfTruthRule: 'Cue manifests, timing refs, provenance, and QA fields are source-of-truth.',
    qaGates: ['owner_study_exists', 'audio_generation_block', 'billing_credit_block'],
    betaProductionBlockers: ['provider audio generation review', 'audio worker approval', 'credit policy approval'],
  },
  {
    familyId: 'supabase_metadata_storage',
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    sourceContracts: ['docs/activation-phase-tool-route-0-execution-unlock-audit-results.md'],
    workerRefKeys: ['artifactRouteEventValidation'],
    routePurpose: 'Plan metadata/storage placeholders without Supabase writes, SQL, migrations, or GCS upload.',
    allowedInput: ['private gs:// refs as placeholders', 'metadata field names', 'future registry contract refs'],
    blockedInput: ['SQL', 'schema/RLS changes', 'product-row writes', 'service-role payloads', 'storage transfer'],
    outputArtifactContract: 'Supabase metadata placeholder',
    sourceOfTruthRule: 'Local docs/status records only; no Supabase row or storage object becomes source-of-truth here.',
    qaGates: ['supabase_mutation_block', 'sql_migration_block', 'sync_layer_missing_recorded'],
    betaProductionBlockers: ['approved sync layer', 'RLS review', 'service-role runtime boundary'],
  },
  {
    familyId: 'observability_audit_cost',
    owner: 'OBSERVABILITY_AUDIT_COST',
    sourceContracts: ['docs/activation-worker-approved-plan-dry-run-reports/event-log/worker-event-log-plan.json'],
    workerRefKeys: ['snapshotIntake', 'captionRecommendation', 'artifactRouteEventValidation'],
    routePurpose: 'Plan observability, audit, and bounded cost events as placeholders.',
    allowedInput: ['event names', 'run ids', 'cost placeholders', 'QA gate statuses'],
    blockedInput: ['paid production calls', 'credit mutation', 'provider usage expansion'],
    outputArtifactContract: 'observability/cost event placeholder',
    sourceOfTruthRule: 'Committed audit and cost placeholder records are review evidence only.',
    qaGates: ['event_log_plan_present', 'cost_mutation_block', 'paid_production_block'],
    betaProductionBlockers: ['cost ledger approval', 'observability sink approval', 'billing review'],
  },
  {
    familyId: 'compliance_security',
    owner: 'COMPLIANCE_SECURITY',
    sourceContracts: [
      'docs/activation-worker-approved-plan-dry-run-reports/validation/blocked-route-validation.json',
      'docs/activation-tool-route-execution-unlock-audit-reports/blocked/tool-route-blocked-use-register.json',
    ],
    workerRefKeys: ['snapshotIntake', 'implementationProposalReview', 'artifactRouteEventValidation'],
    routePurpose: 'Plan compliance/security review gates for privacy, source-of-truth, and blocked execution.',
    allowedInput: ['redaction validation refs', 'blocked-use registers', 'private artifact policy refs'],
    blockedInput: ['secret payloads', 'signed URL source-of-truth', 'public artifacts', 'raw prompts'],
    outputArtifactContract: 'compliance review placeholder',
    sourceOfTruthRule: 'Compliance review placeholders and blocked-use registers are review evidence only.',
    qaGates: ['blocked_use_register_present', 'secret_scan_required', 'public_artifact_block'],
    betaProductionBlockers: ['security approval', 'privacy review', 'retention/source-of-truth review'],
  },
  {
    familyId: 'frontend_product_ux',
    owner: 'FRONTEND_PRODUCT_UX',
    sourceContracts: ['docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json'],
    workerRefKeys: ['captionRecommendation', 'chartCard', 'mapCard'],
    routePurpose: 'Plan future UX route placeholders without user-facing runtime claims.',
    allowedInput: ['candidate route labels', 'review-only manifests', 'owner approval state'],
    blockedInput: ['runtime-ready claims', 'production unlock claims', 'public delivery claims'],
    outputArtifactContract: 'frontend UX route placeholder',
    sourceOfTruthRule: 'Frontend route placeholders explain planning status only; they do not become runtime state.',
    qaGates: ['candidate_only_label_visible', 'runtime_claim_block', 'owner_review_required'],
    betaProductionBlockers: ['product UX review', 'approved runtime state API', 'QA copy review'],
  },
  {
    familyId: 'billing_stripe_credits',
    owner: 'BILLING_STRIPE_CREDITS',
    sourceContracts: ['pricing-and-credits.md'],
    workerRefKeys: ['artifactRouteEventValidation'],
    routePurpose: 'Plan future credit and Stripe review placeholders without mutation.',
    allowedInput: ['credit estimate placeholders', 'cost category refs', 'approval gate refs'],
    blockedInput: ['Stripe checkout', 'webhook handling', 'credit ledger writes', 'paid production unlock'],
    outputArtifactContract: 'billing/credit placeholder',
    sourceOfTruthRule: 'Billing placeholders are planning evidence only; no credit ledger or Stripe event is source here.',
    qaGates: ['credit_mutation_block', 'approval_gate_preserved', 'paid_production_block'],
    betaProductionBlockers: ['billing ledger approval', 'Stripe integration approval', 'refund policy implementation'],
  },
  {
    familyId: 'public_artifact_signed_url_delivery_blocked',
    owner: 'COMPLIANCE_SECURITY',
    sourceContracts: ['docs/activation-worker-approved-plan-dry-run-reports/validation/artifact-scope-validation.json'],
    workerRefKeys: ['artifactRouteEventValidation'],
    routePurpose: 'Record that public artifact and signed URL delivery stays blocked.',
    allowedInput: ['private artifact refs', 'manifest-only placeholders', 'blocked delivery policy records'],
    blockedInput: ['public artifacts', 'signed URL creation', 'signed URL as source-of-truth', 'public delivery'],
    outputArtifactContract: 'public artifact/signed URL delivery blocked placeholder',
    sourceOfTruthRule: 'Private manifests are source-of-truth; public artifacts and signed URLs are never source here.',
    qaGates: ['public_artifact_block', 'signed_url_block', 'private_manifest_required'],
    betaProductionBlockers: ['delivery policy approval', 'retention review', 'public access review'],
  },
]

function refsFor(definition: FamilyDefinition, worker: ToolRouteWorkerDryRunContext): string[] {
  return definition.workerRefKeys.flatMap((key) => worker.workerJobRefs[key] ?? [])
}

export function buildToolRouteFamilyDryRunPlan(
  worker: ToolRouteWorkerDryRunContext,
  ownerStudies: ToolRouteOwnerStudyContext,
): ToolRouteFamilyDryRunPlan {
  const families: ToolRouteDryRunFamily[] = FAMILY_DEFINITIONS.map((definition) => ({
    familyId: definition.familyId,
    owner: definition.owner,
    sourceContracts: definition.sourceContracts,
    worker1Refs: refsFor(definition, worker),
    routePurpose: definition.routePurpose,
    allowedInput: definition.allowedInput,
    blockedInput: definition.blockedInput,
    outputArtifactContract: definition.outputArtifactContract,
    sourceOfTruthRule: definition.sourceOfTruthRule,
    qaGates: definition.qaGates,
    ownerApproval: 'owner_review_required_before_tool_route_2',
    nextPhase: 'TOOL_ROUTE_2_generated_local_fixture_planning',
    betaProductionBlockers: definition.betaProductionBlockers,
    executionFlags: TOOL_ROUTE_DRY_RUN_SAFETY_FLAGS,
  }))

  const mappedIds = families.map((family) => family.familyId)
  const activeBlockers = [
    ...worker.activeBlockers,
    ...ownerStudies.activeBlockers,
    ...TOOL_ROUTE_DRY_RUN_FAMILY_IDS
      .filter((familyId) => !mappedIds.includes(familyId))
      .map((familyId) => `missing_route_family:${familyId}`),
    ...(families.length === TOOL_ROUTE_DRY_RUN_FAMILY_IDS.length
      ? []
      : [`unexpected_route_family_count:${families.length}`]),
    ...families
      .filter((family) => family.worker1Refs.length === 0)
      .map((family) => `missing_worker1_ref:${family.familyId}`),
  ]

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    families,
    routeFamilyCount: families.length,
    allFamiliesMapped: activeBlockers.length === 0,
    activeBlockers,
  }
}
